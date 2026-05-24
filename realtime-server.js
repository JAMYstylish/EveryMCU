import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";

const HOST = "0.0.0.0";
const PORT = Number(process.env.EVERYMCU_REALTIME_PORT || 8787);
const DATA_FILE = new URL("./shared-data.json", import.meta.url);
const STALE_PLAYER_MS = 15000;

const clients = new Set();
const state = {
  offlineChallenges: [],
  rooms: {},
  solutions: [],
};

const loadState = async () => {
  try {
    const saved = JSON.parse(await readFile(DATA_FILE, "utf8"));
    state.offlineChallenges = Array.isArray(saved.offlineChallenges) ? saved.offlineChallenges : [];
    state.rooms = saved.rooms ?? {};
    state.solutions = Array.isArray(saved.solutions) ? saved.solutions : [];
  } catch {
    // Start with an empty shared state when there is no saved file yet.
  }
};

const saveState = async () => {
  await writeFile(DATA_FILE, JSON.stringify(state, null, 2));
};

const getPublicState = () => {
  cleanupStalePlayers();

  return {
    offlineChallenges: state.offlineChallenges,
    rooms: state.rooms,
    solutions: state.solutions,
  };
};

const cleanupStalePlayers = () => {
  const now = Date.now();

  Object.entries(state.rooms).forEach(([roomCode, room]) => {
    Object.entries(room.players ?? {}).forEach(([playerId, player]) => {
      if (now - Number(player.lastSeen ?? 0) > STALE_PLAYER_MS) {
        delete room.players[playerId];
      }
    });

    if (Object.keys(room.players ?? {}).length === 0) {
      delete state.rooms[roomCode];
    }
  });
};

const broadcast = async () => {
  const payload = `data: ${JSON.stringify(getPublicState())}\n\n`;

  clients.forEach((response) => {
    response.write(payload);
  });

  await saveState();
};

const sendJson = (response, status, data) => {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(data));
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });

const normalizeRoomCode = (roomCode) => roomCode.trim().replace(/\s/g, "-").toUpperCase() || "EVERYMCU";

const handleRequest = async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (url.pathname === "/api/state" && request.method === "GET") {
    sendJson(response, 200, getPublicState());
    return;
  }

  if (url.pathname === "/api/events" && request.method === "GET") {
    response.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    });

    response.write(`data: ${JSON.stringify(getPublicState())}\n\n`);
    clients.add(response);

    request.on("close", () => {
      clients.delete(response);
    });

    return;
  }

  if (url.pathname === "/api/solutions" && request.method === "POST") {
    const body = await readBody(request);
    const solution = {
      alias: body.alias || "익명 제출자",
      code: String(body.code || ""),
      createdAt: new Date().toISOString(),
      id: `solution-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      likes: 0,
      note: body.note || "정답 처리된 익명 코드",
      originality: Number(body.originality ?? 0),
      title: body.title || "방금 제출한 풀이",
      views: 0,
    };

    state.solutions.unshift(solution);
    await broadcast();
    sendJson(response, 201, solution);
    return;
  }

  if (url.pathname === "/api/offline-challenges" && request.method === "POST") {
    const body = await readBody(request);
    const now = new Date().toISOString();
    const challenge = {
      acceptedAt: body.acceptedAt ?? null,
      createdAt: body.createdAt || now,
      declinedAt: body.declinedAt ?? null,
      from: body.from || "익명",
      fromKey: body.fromKey || "anonymous",
      id: body.id || `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      problemId: body.problemId || "offline-sum",
      records: body.records ?? {},
      status: body.status || "pending",
      to: body.to || "친구",
      toKey: body.toKey || "friend",
      updatedAt: body.updatedAt || now,
    };

    state.offlineChallenges.unshift(challenge);
    await broadcast();
    sendJson(response, 201, challenge);
    return;
  }

  const offlineChallengeMatch = url.pathname.match(/^\/api\/offline-challenges\/([^/]+)$/);
  if (offlineChallengeMatch && request.method === "PATCH") {
    const body = await readBody(request);
    const challenge = state.offlineChallenges.find((item) => item.id === decodeURIComponent(offlineChallengeMatch[1]));

    if (!challenge) {
      sendJson(response, 404, { error: "offline_challenge_not_found" });
      return;
    }

    Object.assign(challenge, {
      ...body,
      records: {
        ...(challenge.records ?? {}),
        ...(body.records ?? {}),
      },
      updatedAt: body.updatedAt || new Date().toISOString(),
    });

    await broadcast();
    sendJson(response, 200, challenge);
    return;
  }

  if (offlineChallengeMatch && request.method === "DELETE") {
    const challengeId = decodeURIComponent(offlineChallengeMatch[1]);
    const beforeCount = state.offlineChallenges.length;
    state.offlineChallenges = state.offlineChallenges.filter((item) => item.id !== challengeId);

    if (state.offlineChallenges.length === beforeCount) {
      sendJson(response, 404, { error: "offline_challenge_not_found" });
      return;
    }

    await broadcast();
    sendJson(response, 200, { ok: true });
    return;
  }

  const voteMatch = url.pathname.match(/^\/api\/solutions\/([^/]+)\/vote$/);
  const legacyLikeMatch = url.pathname.match(/^\/api\/solutions\/([^/]+)\/like$/);
  if ((voteMatch || legacyLikeMatch) && request.method === "POST") {
    const body = await readBody(request);
    const delta = Number(body.delta ?? 1);
    const metric = ["likes", "originality", "efficiency"].includes(body.metric) ? body.metric : "likes";
    const solutionId = voteMatch?.[1] ?? legacyLikeMatch?.[1];
    const solution = state.solutions.find((item) => item.id === solutionId);

    if (!solution) {
      sendJson(response, 404, { error: "solution_not_found" });
      return;
    }

    const legacyMetric = metric !== "likes" && Number(solution.voteVersion ?? 0) < 2 && solution.efficiency === undefined;
    const currentValue = legacyMetric ? 0 : Number(solution[metric] ?? 0);
    solution[metric] = Math.max(0, currentValue + delta);
    solution.voteVersion = 2;
    await broadcast();
    sendJson(response, 200, solution);
    return;
  }

  const playerMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/players\/([^/]+)$/);
  if (playerMatch && request.method === "POST") {
    const body = await readBody(request);
    const roomCode = normalizeRoomCode(decodeURIComponent(playerMatch[1]));
    const playerId = decodeURIComponent(playerMatch[2]);

    state.rooms[roomCode] ??= { code: roomCode, players: {} };
    state.rooms[roomCode].players[playerId] = {
      lastSeen: Date.now(),
      nickname: body.nickname || "상대",
      remaining: Number(body.remaining ?? 0),
      solved: Number(body.solved ?? 0),
      state: body.state || "idle",
    };

    await broadcast();
    sendJson(response, 200, state.rooms[roomCode]);
    return;
  }

  if (playerMatch && request.method === "DELETE") {
    const roomCode = normalizeRoomCode(decodeURIComponent(playerMatch[1]));
    const playerId = decodeURIComponent(playerMatch[2]);

    if (state.rooms[roomCode]?.players) {
      delete state.rooms[roomCode].players[playerId];
    }

    await broadcast();
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: "not_found" });
};

await loadState();

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    sendJson(response, 500, { error: "server_error" });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`EveryMCU realtime server: http://localhost:${PORT}`);
});
