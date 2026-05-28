import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Bot,
  Bug,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Code2,
  Eye,
  Flame,
  Heart,
  Lock,
  Maximize2,
  Medal,
  Minimize2,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

const TOTAL_ONLINE_SECONDS = 120;
const TOTAL_ONLINE_PROBLEMS = 3;
const MAX_ROOM_PLAYERS = 2;
const ROOM_PLAYER_STALE_MS = 10000;
const OFFLINE_GHOST_SECONDS = 760;
const LOCAL_REALTIME_SERVER_PORT = 8787;
const FIREBASE_SYNC_PATH = "everymcuWeeklyStatus";
const PROBLEM_LANGUAGE = "Python";
const CODE_INDENT = "    ";

const PANEL_ITEMS = [
  {
    id: "battle",
    label: "배틀",
    icon: Swords,
    accentClass: "bg-indigo-500",
    connectorClass: "bg-indigo-100",
    iconClass: "bg-indigo-50 text-indigo-600",
    panelClass: "border-indigo-100 bg-indigo-50/50",
    tabActiveClass: "bg-indigo-600 text-white shadow-md",
  },
  {
    id: "debug",
    label: "버그 찾기",
    icon: Bug,
    accentClass: "bg-rose-500",
    connectorClass: "bg-rose-100",
    iconClass: "bg-rose-50 text-rose-500",
    panelClass: "border-rose-100 bg-rose-50/50",
    tabActiveClass: "bg-rose-600 text-white shadow-md",
  },
  {
    id: "weekly",
    label: "이주의 코딩",
    icon: ShieldCheck,
    accentClass: "bg-emerald-500",
    connectorClass: "bg-emerald-100",
    iconClass: "bg-emerald-50 text-emerald-600",
    panelClass: "border-emerald-100 bg-emerald-50/50",
    tabActiveClass: "bg-emerald-600 text-white shadow-md",
  },
  {
    id: "ranking",
    label: "랭킹",
    icon: Trophy,
    accentClass: "bg-amber-500",
    connectorClass: "bg-amber-100",
    iconClass: "bg-amber-50 text-amber-600",
    panelClass: "border-amber-100 bg-amber-50/60",
    tabActiveClass: "bg-amber-500 text-white shadow-md",
  },
];

const battleModes = [
  {
    id: "online",
    label: "실시간 도전",
    icon: Zap,
    title: "온라인 실시간 배틀",
    description: "같은 방 코드에 접속한 상대와 제한 시간 안에 문제 풀이 수를 겨룹니다.",
  },
  {
    id: "offline",
    label: "기록 대전",
    icon: Clock3,
    title: "오프라인 기록 대전",
    description: "한 문제를 푼 시간을 저장하고 가상 상대 기록과 비교합니다.",
  },
];

const weeklyProblem = {
  title: "두 수의 합",
  level: "Easy",
  prompt: "정수 a와 b가 주어질 때 두 수의 합을 반환하는 solution 함수를 작성하세요.",
  example: "solution(3, 5) → 8",
  hint: "Python에서 return a + b 형태로 제출하면 테스트를 통과합니다.",
};

const DEFAULT_WEEKLY_CODE = `def solution(a, b):
    # 두 수의 합을 반환하세요.
    pass`;

const DEFAULT_OFFLINE_CODE = `def solution(a, b):
    # 여기에 풀이를 작성하세요.
    pass`;

const OFFLINE_PROBLEMS = [
  {
    id: "offline-sum",
    title: "두 수의 합",
    prompt: "정수 a와 b가 주어질 때 두 수의 합을 반환하세요.",
    example: "solution(3, 5) → 8",
    starter: DEFAULT_OFFLINE_CODE,
    check: (code) => isSumSolution(code),
  },
  {
    id: "offline-even",
    title: "짝수 개수 세기",
    prompt: "정수 배열 nums에서 짝수의 개수를 반환하세요.",
    example: "solution([1, 2, 4, 7]) → 2",
    starter: `def solution(nums):
    count = 0

    # 여기에 풀이를 작성하세요.

    return count`,
    check: (code) => isEvenCountSolution(code),
  },
  {
    id: "offline-max",
    title: "최댓값 찾기",
    prompt: "정수 배열 nums에서 가장 큰 값을 반환하세요.",
    example: "solution([3, 9, 2]) → 9",
    starter: `def solution(nums):
    # 여기에 풀이를 작성하세요.
    pass`,
    check: (code) => isMaxSolution(code),
  },
];

const ONLINE_PROBLEMS = [
  {
    id: "online-sum",
    title: "두 수의 합",
    prompt: "정수 a와 b가 주어질 때 두 수의 합을 반환하세요.",
    example: "solution(3, 5) → 8",
    starter: DEFAULT_OFFLINE_CODE,
    check: (code) => isSumSolution(code),
  },
  {
    id: "online-even",
    title: "짝수 개수 세기",
    prompt: "정수 배열 nums에서 짝수의 개수를 반환하세요.",
    example: "solution([1, 2, 4, 7]) → 2",
    starter: `def solution(nums):
    count = 0

    # 여기에 풀이를 작성하세요.

    return count`,
    check: (code) => isEvenCountSolution(code),
  },
  {
    id: "online-max",
    title: "최댓값 찾기",
    prompt: "정수 배열 nums에서 가장 큰 값을 반환하세요.",
    example: "solution([3, 9, 2]) → 9",
    starter: `def solution(nums):
    # 여기에 풀이를 작성하세요.
    pass`,
    check: (code) => isMaxSolution(code),
  },
];

const INITIAL_SOLUTIONS = [];

const debugMissions = [
  {
    id: "debug-even",
    title: "짝수 개수 세기",
    prompt: "배열에서 짝수의 개수를 반환해야 하는 코드입니다.",
    brokenCode: `def solution(nums):
    count = 0

    for n in nums:
        if n % 2 = 0:
            count += 1

    return count`,
    choices: [
      "비교 연산자 대신 대입 연산자를 사용했다.",
      "반복문이 마지막 원소를 건너뛴다.",
      "count 초기값이 1이어야 한다.",
    ],
    answer: 0,
    explanation: "조건식에는 대입 연산자 = 가 아니라 비교 연산자 == 를 써야 합니다.",
  },
  {
    id: "debug-max",
    title: "최댓값 찾기",
    prompt: "숫자 배열의 최댓값을 반환해야 하는 코드입니다.",
    brokenCode: `def solution(nums):
    max_value = 0

    for n in nums:
        if n > max_value:
            max_value = n

    return max_value`,
    choices: [
      "음수만 있는 배열에서 오답이 나온다.",
      "for 문은 리스트에 사용할 수 없다.",
      "return 위치가 반복문 안에 있어야 한다.",
    ],
    answer: 0,
    explanation: "초기값을 0으로 두면 모든 값이 음수일 때 0을 반환합니다. 첫 원소나 float('-inf')로 시작해야 합니다.",
  },
  {
    id: "debug-sum",
    title: "누적합 계산",
    prompt: "배열의 모든 수를 더해야 하는 코드입니다.",
    brokenCode: `def solution(nums):
    total = 0

    for n in nums:
        total + n

    return total`,
    choices: [
      "total에 더한 값을 다시 저장하지 않았다.",
      "for 문은 첫 원소를 무시한다.",
      "total은 문자열로 선언해야 한다.",
    ],
    answer: 0,
    explanation: "total + n은 계산만 하고 저장하지 않습니다. total += n 또는 total = total + n이 필요합니다.",
  },
];

const badges = [
  {
    id: "first-clear",
    title: "첫 클리어",
    note: "활동 1개 완료",
    goal: 1,
    getProgress: (stats) => Math.min(stats.totalCompleted, 1),
    isUnlocked: (stats) => stats.totalCompleted >= 1,
  },
  {
    id: "battle-win",
    title: "배틀 1승",
    note: "기록전/온라인 1승",
    goal: 1,
    getProgress: (stats) => Math.min(stats.battleWins, 1),
    isUnlocked: (stats) => stats.battleWins >= 1,
  },
  {
    id: "weekly-clear",
    title: "이주의 정답",
    note: "이주의 코딩 제출",
    goal: 1,
    getProgress: (stats) => Math.min(stats.weeklySolved, 1),
    isUnlocked: (stats) => stats.weeklySolved >= 1,
  },
  {
    id: "debug-hunter",
    title: "버그 헌터",
    note: "버그 문제 1개 해결",
    goal: 1,
    getProgress: (stats) => Math.min(stats.debugSolved, 1),
    isUnlocked: (stats) => stats.debugSolved >= 1,
  },
  {
    id: "streak-3",
    title: "3연승",
    note: "성공 3회 연속",
    goal: 3,
    getProgress: (stats) => Math.min(stats.streakCount, 3),
    isUnlocked: (stats) => stats.streakCount >= 3,
  },
];

const WeeklyStatusFeature = ({ nickname, onHome }) => {
  const [activePanel, setActivePanel] = useState("battle");
  const [panelRevealed, setPanelRevealed] = useState(false);
  const [battleMode, setBattleMode] = useState("online");

  const [onlineState, setOnlineState] = useState("idle");
  const [onlineRemaining, setOnlineRemaining] = useState(TOTAL_ONLINE_SECONDS);
  const [mySolved, setMySolved] = useState(0);
  const [opponentSolved, setOpponentSolved] = useState(0);
  const [roomCode, setRoomCode] = useState("EVERYMCU");
  const [roomConnected, setRoomConnected] = useState(false);
  const [opponentName, setOpponentName] = useState("");
  const [opponentLastSeen, setOpponentLastSeen] = useState(null);
  const [opponentOnlineState, setOpponentOnlineState] = useState("idle");
  const [presenceNow, setPresenceNow] = useState(() => Date.now());
  const [playerId] = useState(() => `player-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const battleChannelRef = useRef(null);
  const [onlineProblemIndex, setOnlineProblemIndex] = useState(0);
  const [onlineCode, setOnlineCode] = useState(ONLINE_PROBLEMS[0].starter);
  const [onlineMessage, setOnlineMessage] = useState("방에 입장한 뒤 대전 신청을 눌러주세요.");

  const [offlineState, setOfflineState] = useState("idle");
  const [offlineElapsed, setOfflineElapsed] = useState(0);
  const [offlineCode, setOfflineCode] = useState(DEFAULT_OFFLINE_CODE);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [offlineOpponentInput, setOfflineOpponentInput] = useState("");
  const [offlineChallenges, setOfflineChallenges] = useState([]);
  const [selectedOfflineChallengeId, setSelectedOfflineChallengeId] = useState(null);
  const [offlineRunChallengeId, setOfflineRunChallengeId] = useState(null);
  const [offlineResultRecordedIds, setOfflineResultRecordedIds] = useState([]);

  const [weeklyCode, setWeeklyCode] = useState(DEFAULT_WEEKLY_CODE);
  const [weeklyStatus, setWeeklyStatus] = useState("solving");
  const [weeklyMessage, setWeeklyMessage] = useState("아직 제출 전입니다.");
  const [streakCount, setStreakCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completionStats, setCompletionStats] = useState({
    weeklySolved: 0,
    offlineWins: 0,
    onlineWins: 0,
    debugSolved: 0,
  });
  const [completedDebugMissionIds, setCompletedDebugMissionIds] = useState([]);
  const [onlineResultRecorded, setOnlineResultRecorded] = useState(false);
  const [progressHydrated, setProgressHydrated] = useState(false);

  const [solutions, setSolutions] = useState(INITIAL_SOLUTIONS);
  const [rankingTab, setRankingTab] = useState("popular");
  const [sharedConnected, setSharedConnected] = useState(false);
  const [sharedState, setSharedState] = useState(null);
  const [sharedMode] = useState(getSharedMode);
  const [solutionVotes, setSolutionVotes] = useState(() => createEmptySolutionVotes());

  const [debugIndex, setDebugIndex] = useState(0);
  const [selectedBug, setSelectedBug] = useState(null);
  const [debugSolved, setDebugSolved] = useState(false);
  const [debugGenerating, setDebugGenerating] = useState(false);

  const activeBattleMode = battleModes.find((mode) => mode.id === battleMode) ?? battleModes[0];
  const activeDebugMission = debugMissions[debugIndex];
  const activeOnlineProblem = ONLINE_PROBLEMS[onlineProblemIndex];
  const onlineFinished = onlineState === "finished";
  const onlineResult = getOnlineResult(mySolved, opponentSolved);
  const onlineProgress = Math.min((mySolved / TOTAL_ONLINE_PROBLEMS) * 100, 100);
  const opponentProgress = Math.min((opponentSolved / TOTAL_ONLINE_PROBLEMS) * 100, 100);
  const opponentConnected = Boolean(opponentLastSeen && presenceNow - opponentLastSeen < ROOM_PLAYER_STALE_MS);
  const hasWeeklyLocked = weeklyStatus === "submitted" || weeklyStatus === "abandoned";
  const nicknameKey = normalizeNicknameKey(nickname);
  const activePanelItem = PANEL_ITEMS.find((item) => item.id === activePanel) ?? PANEL_ITEMS[0];
  const activePanelIndex = Math.max(
    PANEL_ITEMS.findIndex((item) => item.id === activePanel),
    0,
  );
  const activePanelSlideStyle = {
    width: "calc((100% - 0.75rem) / 4)",
    transform: `translateX(calc(${activePanelIndex} * (100% + 0.25rem)))`,
  };

  const sortedSolutions = useMemo(() => {
    const sortable = [...solutions];

    if (rankingTab === "likes") {
      return sortable.sort((a, b) => getSolutionMetricValue(b, "likes") - getSolutionMetricValue(a, "likes"));
    }

    if (rankingTab === "creative") {
      return sortable.sort((a, b) => getSolutionMetricValue(b, "originality") - getSolutionMetricValue(a, "originality"));
    }

    if (rankingTab === "efficiency") {
      return sortable.sort((a, b) => getSolutionMetricValue(b, "efficiency") - getSolutionMetricValue(a, "efficiency"));
    }

    return sortable.sort((a, b) => getSolutionTotalVotes(b) - getSolutionTotalVotes(a));
  }, [rankingTab, solutions]);

  const progressStats = useMemo(() => {
    const battleWins = completionStats.offlineWins + completionStats.onlineWins;
    const totalCompleted = completionStats.weeklySolved + completionStats.offlineWins + completionStats.onlineWins + completionStats.debugSolved;

    return {
      ...completionStats,
      battleWins,
      bestStreak,
      streakCount,
      totalCompleted,
    };
  }, [bestStreak, completionStats, streakCount]);
  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const visibleOfflineChallenges = useMemo(
    () =>
      offlineChallenges.filter(
        (challenge) => challenge.fromKey === nicknameKey || challenge.toKey === nicknameKey,
      ),
    [nicknameKey, offlineChallenges],
  );
  const selectableOfflineChallenges = useMemo(
    () => visibleOfflineChallenges.filter((challenge) => challenge.status !== "declined" && challenge.status !== "pending"),
    [visibleOfflineChallenges],
  );
  const selectedOfflineChallenge =
    selectableOfflineChallenges.find((challenge) => challenge.id === selectedOfflineChallengeId) ?? null;
  const selectedOfflineProblem = getOfflineProblemById(selectedOfflineChallenge?.problemId);
  const selectedOfflineOpponentKey = selectedOfflineChallenge ? getChallengeOpponentKey(selectedOfflineChallenge, nicknameKey) : "";
  const selectedOfflineOpponentName = selectedOfflineChallenge ? getChallengeOpponentName(selectedOfflineChallenge, nicknameKey) : "";
  const myOfflineRecord = selectedOfflineChallenge?.records?.[nicknameKey] ?? null;
  const opponentOfflineRecord = selectedOfflineChallenge?.records?.[selectedOfflineOpponentKey] ?? null;

  const recordSuccess = (statKey) => {
    setStreakCount((count) => count + 1);

    if (statKey) {
      setCompletionStats((current) => ({
        ...current,
        [statKey]: current[statKey] + 1,
      }));
    }
  };

  const resetStreak = () => {
    setStreakCount(0);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      setPanelRevealed(true);
      return undefined;
    }

    setPanelRevealed(false);
    const frame = window.requestAnimationFrame(() => setPanelRevealed(true));

    return () => window.cancelAnimationFrame(frame);
  }, [activePanel]);

  useEffect(() => {
    const savedProgress = readSavedProgress(nickname);

    if (savedProgress) {
      setStreakCount(savedProgress.streakCount);
      setBestStreak(savedProgress.bestStreak);
      setCompletionStats(savedProgress.completionStats);
      setCompletedDebugMissionIds(savedProgress.completedDebugMissionIds);
    }

    setProgressHydrated(true);
  }, [nickname]);

  useEffect(() => {
    if (!progressHydrated) return;

    saveProgress(nickname, {
      bestStreak,
      completedDebugMissionIds,
      completionStats,
      streakCount,
    });
  }, [bestStreak, completedDebugMissionIds, completionStats, nickname, progressHydrated, streakCount]);

  useEffect(() => {
    const savedVotes = readSavedSolutionVotes(nickname);
    setSolutionVotes(savedVotes);
  }, [nickname]);

  useEffect(() => {
    saveSolutionVotes(nickname, solutionVotes);
  }, [nickname, solutionVotes]);

  useEffect(() => {
    if (!sharedMode || typeof window === "undefined") return undefined;

    let active = true;
    let eventSource;
    let refreshTimer;

    const syncSharedState = () =>
      fetchSharedState()
        .then((state) => {
          if (!active) return;
          setSharedConnected(true);
          setSharedState(state);
        })
        .catch(() => {
          if (active) setSharedConnected(false);
        });

    syncSharedState();
    refreshTimer = window.setInterval(syncSharedState, 5000);

    const eventsUrl = getSharedEventsUrl();

    if (!eventsUrl || typeof window.EventSource === "undefined") {
      return () => {
        active = false;
        window.clearInterval(refreshTimer);
      };
    }

    const handleSharedEvent = (event) => {
      if (!active) return;

      if (sharedMode === "firebase") {
        syncSharedState();
        return;
      }

      try {
        setSharedState(normalizeSharedState(JSON.parse(event.data)));
        setSharedConnected(true);
      } catch {
        syncSharedState();
      }
    };

    try {
      eventSource = new window.EventSource(eventsUrl);

      eventSource.onopen = () => {
        if (active) setSharedConnected(true);
      };

      eventSource.onmessage = handleSharedEvent;
      eventSource.addEventListener("put", handleSharedEvent);
      eventSource.addEventListener("patch", handleSharedEvent);

      eventSource.onerror = () => {
        if (active) setSharedConnected(false);
      };
    } catch {
      setSharedConnected(false);
    }

    return () => {
      active = false;
      eventSource?.close();
      window.clearInterval(refreshTimer);
    };
  }, [sharedMode]);

  useEffect(() => {
    if (!sharedState?.solutions) return;

    setSolutions(
      sharedState.solutions.map((solution) => withSolutionVoteState(solution, solutionVotes)),
    );
  }, [sharedState, solutionVotes]);

  useEffect(() => {
    if (!sharedState?.offlineChallenges) return;
    setOfflineChallenges(sharedState.offlineChallenges);
  }, [sharedState]);

  useEffect(() => {
    if (selectedOfflineChallengeId && selectableOfflineChallenges.some((challenge) => challenge.id === selectedOfflineChallengeId)) return;

    const nextChallenge =
      selectableOfflineChallenges.find(
        (challenge) =>
          challenge.status === "accepted" &&
          challenge.fromKey !== nicknameKey &&
          !challenge.records?.[nicknameKey],
      ) ??
      selectableOfflineChallenges.find((challenge) => challenge.status === "accepted" && !challenge.records?.[nicknameKey]) ??
      selectableOfflineChallenges[0] ??
      null;

    setSelectedOfflineChallengeId(nextChallenge?.id ?? null);
  }, [nicknameKey, selectableOfflineChallenges, selectedOfflineChallengeId]);

  useEffect(() => {
    if (offlineState === "running") return;

    setOfflineCode(selectedOfflineProblem.starter);
    setOfflineElapsed(0);
    setOfflineRunChallengeId(null);
  }, [offlineState, selectedOfflineChallengeId, selectedOfflineProblem.starter]);

  useEffect(() => {
    visibleOfflineChallenges.forEach((challenge) => {
      if (offlineResultRecordedIds.includes(challenge.id)) return;

      const myRecord = challenge.records?.[nicknameKey];
      const opponentRecord = challenge.records?.[getChallengeOpponentKey(challenge, nicknameKey)];
      if (!myRecord || !opponentRecord) return;

      if (Number(myRecord.seconds) < Number(opponentRecord.seconds)) {
        recordSuccess("offlineWins");
      } else if (Number(myRecord.seconds) > Number(opponentRecord.seconds)) {
        resetStreak();
      }

      setOfflineResultRecordedIds((ids) => [...ids, challenge.id]);
    });
  }, [nicknameKey, offlineResultRecordedIds, visibleOfflineChallenges]);

  useEffect(() => {
    if (!roomConnected) return undefined;

    const timer = window.setInterval(() => {
      setPresenceNow(Date.now());
    }, 2000);

    return () => window.clearInterval(timer);
  }, [roomConnected]);

  useEffect(() => {
    if (!roomConnected) {
      setOpponentName("");
      setOpponentSolved(0);
      setOpponentOnlineState("idle");
      setOpponentLastSeen(null);
      return;
    }

    if (!sharedState?.rooms) return;

    const room = sharedState.rooms[normalizedRoomCode];
    const activePlayers = getActiveRoomPlayerEntries(room);
    const selfIndex = activePlayers.findIndex(([id]) => id === playerId);

    if ((selfIndex === -1 && activePlayers.length >= MAX_ROOM_PLAYERS) || selfIndex >= MAX_ROOM_PLAYERS) {
      leaveSharedRoom({ playerId, roomCode: normalizedRoomCode });
      setRoomConnected(false);
      setOpponentName("");
      setOpponentSolved(0);
      setOpponentOnlineState("idle");
      setOpponentLastSeen(null);
      setOnlineState("idle");
      setOnlineMessage("이미 2명이 입장한 방입니다. 다른 방 코드로 입장하세요.");
      return;
    }

    const opponent = activePlayers.find(([id]) => id !== playerId)?.[1];

    if (!opponent) {
      setOpponentName("");
      setOpponentSolved(0);
      setOpponentOnlineState("idle");
      setOpponentLastSeen(null);
      return;
    }

    const opponentLastSeenValue = Number(opponent.lastSeen ?? 0);

    if (!opponentLastSeenValue || Date.now() - opponentLastSeenValue >= ROOM_PLAYER_STALE_MS) {
      setOpponentName("");
      setOpponentSolved(0);
      setOpponentOnlineState("idle");
      setOpponentLastSeen(null);
      return;
    }

    setOpponentName(opponent.nickname || "상대");
    setOpponentSolved(Math.min(Number(opponent.solved ?? 0), TOTAL_ONLINE_PROBLEMS));
    setOpponentOnlineState(opponent.state || "idle");
    setOpponentLastSeen(opponentLastSeenValue);
  }, [normalizedRoomCode, playerId, roomConnected, sharedState]);

  const broadcastBattleState = (override = {}) => {
    const channel = battleChannelRef.current;

    if (!channel) return;

    channel.postMessage({
      type: "battle-state",
      senderId: playerId,
      nickname,
      solved: mySolved,
      state: onlineState,
      remaining: onlineRemaining,
      roomCode: normalizedRoomCode,
      timestamp: Date.now(),
      ...override,
    });
  };

  useEffect(() => {
    if (!roomConnected) return undefined;

    if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
      setOnlineMessage("이 브라우저는 실시간 방 연결을 지원하지 않습니다.");
      return undefined;
    }

    const channel = new window.BroadcastChannel(`everymcu-battle-${normalizedRoomCode}`);
    battleChannelRef.current = channel;

    channel.onmessage = (event) => {
      const message = event.data;

      if (!message || message.senderId === playerId) return;

      if (message.type === "battle-leave") {
        setOpponentName("");
        setOpponentSolved(0);
        setOpponentOnlineState("idle");
        setOpponentLastSeen(null);
        return;
      }

      if (message.type !== "battle-state") return;

      setOpponentName(message.nickname || "상대");
      setOpponentSolved(Math.min(Number(message.solved ?? 0), TOTAL_ONLINE_PROBLEMS));
      setOpponentOnlineState(message.state || "idle");
      setOpponentLastSeen(Date.now());
    };

    channel.postMessage({
      type: "battle-state",
      senderId: playerId,
      nickname,
      solved: mySolved,
      state: onlineState,
      remaining: onlineRemaining,
      roomCode: normalizedRoomCode,
      timestamp: Date.now(),
    });

    return () => {
      channel.close();

      if (battleChannelRef.current === channel) {
        battleChannelRef.current = null;
      }
    };
  }, [nickname, normalizedRoomCode, playerId, roomConnected]);

  useEffect(() => {
    if (!roomConnected) return undefined;

    const heartbeat = window.setInterval(() => {
      broadcastBattleState();
    }, 2000);

    return () => window.clearInterval(heartbeat);
  }, [roomConnected, mySolved, onlineRemaining, onlineState, normalizedRoomCode]);

  useEffect(() => {
    if (!roomConnected) return;
    broadcastBattleState();
  }, [roomConnected, mySolved, onlineRemaining, onlineState, normalizedRoomCode]);

  useEffect(() => {
    if (!roomConnected) return;

    sendSharedPlayerState({
      nickname,
      playerId,
      remaining: onlineRemaining,
      roomCode: normalizedRoomCode,
      solved: mySolved,
      state: onlineState,
    }).then((ok) => {
      if (ok) setSharedConnected(true);
    });
  }, [mySolved, nickname, normalizedRoomCode, onlineRemaining, onlineState, playerId, roomConnected]);

  useEffect(() => {
    if (onlineState !== "matching") return;
    if (opponentOnlineState !== "matching" && opponentOnlineState !== "playing") return;

    setOnlineMessage("상대도 대전 신청을 눌러 배틀이 시작되었습니다.");
    setOnlineRemaining(TOTAL_ONLINE_SECONDS);
    setMySolved(0);
    setOnlineState("playing");
  }, [onlineState, opponentOnlineState]);

  useEffect(() => {
    if (onlineState !== "playing") return undefined;

    const timer = window.setInterval(() => {
      setOnlineRemaining((seconds) => {
        if (seconds <= 1) {
          setOnlineState("finished");
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [onlineState]);

  useEffect(() => {
    if (onlineState === "playing" && (mySolved >= TOTAL_ONLINE_PROBLEMS || opponentSolved >= TOTAL_ONLINE_PROBLEMS)) {
      setOnlineState("finished");
    }
  }, [mySolved, onlineState, opponentSolved]);

  useEffect(() => {
    if (offlineState !== "running") return undefined;

    const timer = window.setInterval(() => {
      setOfflineElapsed((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [offlineState]);

  useEffect(() => {
    setBestStreak((current) => Math.max(current, streakCount));
  }, [streakCount]);

  useEffect(() => {
    if (onlineState !== "finished" || onlineResultRecorded) return;

    if (mySolved > opponentSolved) {
      recordSuccess("onlineWins");
    } else if (mySolved < opponentSolved) {
      resetStreak();
    }

    setOnlineResultRecorded(true);
  }, [mySolved, onlineResultRecorded, onlineState, opponentSolved]);

  const handleStartOnline = () => {
    if (!roomConnected) {
      setRoomConnected(true);
    }

    setOnlineState("matching");
    setOnlineRemaining(TOTAL_ONLINE_SECONDS);
    setMySolved(0);
    setOnlineResultRecorded(false);
    setOnlineProblemIndex(0);
    setOnlineCode(ONLINE_PROBLEMS[0].starter);
    setOnlineMessage("대전 신청 완료. 상대도 같은 방에서 대전 신청을 눌러야 시작됩니다.");
  };

  const handleJoinRoom = async () => {
    let latestSharedState = sharedState;

    try {
      latestSharedState = await fetchSharedState();
      setSharedState(latestSharedState);
      setSharedConnected(true);
    } catch {
      setSharedConnected(false);
    }

    const room = latestSharedState?.rooms?.[normalizedRoomCode];
    const activePlayers = getActiveRoomPlayerEntries(room);
    const alreadyInRoom = activePlayers.some(([id]) => id === playerId);

    if (!alreadyInRoom && activePlayers.length >= MAX_ROOM_PLAYERS) {
      setOnlineMessage("이미 2명이 입장한 방입니다. 다른 방 코드로 입장하세요.");
      return;
    }

    setRoomConnected(true);
    setOpponentSolved(0);
    setOpponentName("");
    setOpponentOnlineState("idle");
    setOpponentLastSeen(null);
    setOnlineMessage(`방 ${normalizedRoomCode}에 입장했습니다. 같은 방 코드의 상대와 실시간으로 연결됩니다.`);
  };

  const handleLeaveRoom = () => {
    broadcastBattleState({ type: "battle-leave", state: "idle", solved: 0 });
    leaveSharedRoom({ playerId, roomCode: normalizedRoomCode });
    setRoomConnected(false);
    setOpponentSolved(0);
    setOpponentName("");
    setOpponentOnlineState("idle");
    setOpponentLastSeen(null);
    setOnlineState("idle");
    setOnlineRemaining(TOTAL_ONLINE_SECONDS);
    setMySolved(0);
    setOnlineResultRecorded(false);
    setOnlineProblemIndex(0);
    setOnlineCode(ONLINE_PROBLEMS[0].starter);
    setOnlineMessage("방에서 퇴장했습니다. 방 코드를 수정한 뒤 다시 입장할 수 있습니다.");
  };

  const handleSubmitOnlineAnswer = () => {
    if (onlineState !== "playing") return;

    if (!activeOnlineProblem.check(onlineCode)) {
      setOnlineMessage("오답입니다. 예시와 조건을 다시 확인해보세요.");
      return;
    }

    const nextSolved = Math.min(mySolved + 1, TOTAL_ONLINE_PROBLEMS);
    setMySolved(nextSolved);

    if (nextSolved >= TOTAL_ONLINE_PROBLEMS) {
      setOnlineState("finished");
      setOnlineMessage("모든 실시간 문제를 해결했습니다.");
      return;
    }

    const nextProblemIndex = Math.min(onlineProblemIndex + 1, ONLINE_PROBLEMS.length - 1);
    setOnlineProblemIndex(nextProblemIndex);
    setOnlineCode(ONLINE_PROBLEMS[nextProblemIndex].starter);
    setOnlineMessage("정답입니다. 다음 문제가 열렸습니다.");
  };

  const handleResetOnline = () => {
    setOnlineState("idle");
    setOnlineRemaining(TOTAL_ONLINE_SECONDS);
    setMySolved(0);
    setOpponentSolved(0);
    setOnlineResultRecorded(false);
    setOpponentName("");
    setOpponentOnlineState("idle");
    setOpponentLastSeen(null);
    setOnlineProblemIndex(0);
    setOnlineCode(ONLINE_PROBLEMS[0].starter);
    setOnlineMessage("방에 입장한 뒤 대전 신청을 눌러주세요.");
  };

  const handleSendOfflineChallenge = () => {
    const targetNickname = offlineOpponentInput.trim();
    const targetKey = normalizeNicknameKey(targetNickname);

    if (!sharedConnected) {
      setOfflineMessage("공유 서버에 연결되어야 친구에게 대전장을 보낼 수 있습니다.");
      return;
    }

    if (!targetNickname) {
      setOfflineMessage("대전장을 받을 친구 닉네임을 입력하세요.");
      return;
    }

    if (targetKey === nicknameKey) {
      setOfflineMessage("내 닉네임으로는 대전장을 보낼 수 없습니다.");
      return;
    }

    if (hasSentOfflineChallengeTo(visibleOfflineChallenges, nicknameKey, targetKey)) {
      setOfflineMessage(`${targetNickname}님에게 이미 보낸 대전장이 있습니다.`);
      return;
    }

    const challenge = createOfflineChallenge({ fromNickname: nickname, toNickname: targetNickname });

    setOfflineChallenges((current) => [challenge, ...current]);
    setSelectedOfflineChallengeId(challenge.id);
    setOfflineOpponentInput("");
    setOfflineMessage(`${targetNickname}님에게 기록 대전장을 보냈습니다.`);

    createSharedOfflineChallenge(challenge).then((ok) => {
      if (!ok) {
        setOfflineMessage("대전장 저장에 실패했습니다. 공유 서버 연결을 확인하세요.");
      }
    });
  };

  const handleSelectOfflineChallenge = (challengeId) => {
    if (offlineState === "running") {
      setOfflineMessage("진행 중인 기록 측정을 먼저 제출하거나 초기화하세요.");
      return;
    }

    const challenge = visibleOfflineChallenges.find((item) => item.id === challengeId);
    if (challenge?.status === "declined" || challenge?.status === "pending") {
      setOfflineMessage(challenge.status === "pending" ? "대기 중인 대전장은 수락된 뒤 진행할 수 있습니다." : "거절된 대전장은 기록전을 진행할 수 없습니다.");
      return;
    }

    setSelectedOfflineChallengeId(challengeId);
    setOfflineMessage("");
  };

  const handleDeleteDeclinedOfflineChallenge = (challengeId) => {
    const challenge = visibleOfflineChallenges.find((item) => item.id === challengeId);
    if (!challenge || challenge.status !== "declined") return;

    setOfflineChallenges((current) => current.filter((item) => item.id !== challengeId));
    setOfflineMessage("");

    deleteSharedOfflineChallenge(challengeId).then((ok) => {
      if (!ok) {
        setOfflineMessage("대전장 확인 처리에 실패했습니다. 공유 서버 연결을 확인하세요.");
      }
    });
  };

  const handleRespondOfflineChallenge = (challengeId, status) => {
    const challenge = visibleOfflineChallenges.find((item) => item.id === challengeId);
    if (!challenge || challenge.toKey !== nicknameKey || challenge.status !== "pending") return;

    const nextStatus = status === "accepted" ? "accepted" : "declined";
    const now = new Date().toISOString();
    const patch = {
      status: nextStatus,
      updatedAt: now,
      ...(nextStatus === "accepted" ? { acceptedAt: now } : { declinedAt: now }),
    };

    setOfflineChallenges((current) => applyOfflineChallengePatch(current, challengeId, patch));
    setSelectedOfflineChallengeId(challengeId);
    setOfflineMessage(
      nextStatus === "accepted"
        ? `${challenge.from}님의 대전장을 수락했습니다. 이제 기록 측정을 시작할 수 있습니다.`
        : `${challenge.from}님의 대전장을 거절했습니다.`,
    );

    updateSharedOfflineChallenge(challengeId, patch);
  };

  const handleStartOffline = () => {
    if (!selectedOfflineChallenge) {
      setOfflineMessage("친구에게 대전장을 보내거나 받은 대전장을 수락하면 기록을 측정할 수 있습니다.");
      return;
    }

    if (selectedOfflineChallenge.status !== "accepted") {
      setOfflineMessage("수락된 대전장에서만 기록 측정을 시작할 수 있습니다.");
      return;
    }

    if (myOfflineRecord) {
      setOfflineMessage("이미 이 대전장의 내 기록을 제출했습니다.");
      return;
    }

    setOfflineState("running");
    setOfflineElapsed(0);
    setOfflineRunChallengeId(selectedOfflineChallenge.id);
    setOfflineCode(selectedOfflineProblem.starter);
    setOfflineMessage(`${selectedOfflineOpponentName}님과의 기록 측정 중입니다. 정답 코드를 제출하세요.`);
  };

  const handleSubmitOffline = () => {
    if (offlineState !== "running") return;
    if (!selectedOfflineChallenge || offlineRunChallengeId !== selectedOfflineChallenge.id) {
      setOfflineMessage("선택된 대전장이 바뀌었습니다. 다시 시작하세요.");
      return;
    }

    if (!selectedOfflineProblem.check(offlineCode)) {
      setOfflineMessage("테스트 실패: 예시와 조건을 다시 확인해보세요.");
      return;
    }

    const record = {
      code: offlineCode,
      completedAt: new Date().toISOString(),
      nickname,
      seconds: offlineElapsed,
    };
    const nextStatus = opponentOfflineRecord ? "finished" : "accepted";
    const patch = {
      records: {
        [nicknameKey]: record,
      },
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    setOfflineState("finished");
    setOfflineRunChallengeId(null);
    setOfflineChallenges((current) => applyOfflineChallengePatch(current, selectedOfflineChallenge.id, patch));
    saveSharedOfflineRecord(selectedOfflineChallenge.id, nicknameKey, record, nextStatus);
    setOfflineMessage(
      opponentOfflineRecord
        ? getOfflineResultMessage(offlineElapsed, opponentOfflineRecord.seconds, selectedOfflineOpponentName)
        : "내 기록을 저장했습니다. 친구가 기록을 제출하면 결과가 표시됩니다.",
    );
  };

  const handleSubmitWeekly = () => {
    if (hasWeeklyLocked) return;

    if (!isSumSolution(weeklyCode)) {
      setWeeklyMessage("오답입니다. Python에서 return a + b 형태로 다시 확인해보세요.");
      return;
    }

    setWeeklyStatus("submitted");
    setWeeklyMessage("정답 처리 완료. 이제 코드는 수정할 수 없습니다.");
    recordSuccess("weeklySolved");

    const solution = {
      alias: "익명 제출자",
      code: weeklyCode,
      efficiency: 0,
      likes: 0,
      note: "정답 처리된 익명 코드",
      originality: 0,
      title: "방금 제출한 풀이",
      voteVersion: 2,
      views: 0,
    };

    if (sharedConnected) {
      createSharedSolution(solution).then((created) => {
        if (created) return;
        addLocalSolution(solution, setSolutions);
      });
      return;
    }

    addLocalSolution(solution, setSolutions);
  };

  const handleAbandonWeekly = () => {
    if (weeklyStatus === "submitted") {
      setActivePanel("ranking");
      return;
    }

    setWeeklyStatus("abandoned");
    setWeeklyMessage("포기 처리되었습니다. 익명 풀이를 보고 투표할 수 있습니다.");
    resetStreak();
    setActivePanel("ranking");
  };

  const handleRetryWeekly = () => {
    setWeeklyStatus("solving");
    setWeeklyMessage("다시 풀이를 작성할 수 있습니다.");
    setWeeklyCode(DEFAULT_WEEKLY_CODE);
  };

  const handleVoteSolution = (solutionId, metric) => {
    const currentVotes = solutionVotes[metric] ?? [];
    const alreadyVoted = currentVotes.includes(solutionId);
    const delta = alreadyVoted ? -1 : 1;

    setSolutionVotes((current) => ({
      ...current,
      [metric]: alreadyVoted ? (current[metric] ?? []).filter((id) => id !== solutionId) : [...(current[metric] ?? []), solutionId],
    }));
    setSolutions((current) =>
      current.map((solution) => {
        if (solution.id !== solutionId) return solution;

        const nextSolution = {
          ...solution,
          [metric]: Math.max(0, getSolutionMetricValue(solution, metric) + delta),
        };

        return withSolutionVoteState(nextSolution, {
          ...solutionVotes,
          [metric]: alreadyVoted ? currentVotes.filter((id) => id !== solutionId) : [...currentVotes, solutionId],
        });
      }),
    );

    if (sharedConnected) {
      voteSharedSolution(solutionId, metric, delta);
    }
  };

  const handleGenerateDebugMission = () => {
    setDebugGenerating(true);
    setSelectedBug(null);
    setDebugSolved(false);

    window.setTimeout(() => {
      setDebugIndex((index) => (index + 1) % debugMissions.length);
      setDebugGenerating(false);
    }, 500);
  };

  const handleSelectBug = (choiceIndex) => {
    const correct = choiceIndex === activeDebugMission.answer;

    setSelectedBug(choiceIndex);
    setDebugSolved(correct);

    if (!correct) {
      resetStreak();
      return;
    }

    if (completedDebugMissionIds.includes(activeDebugMission.id)) return;

    setCompletedDebugMissionIds((missionIds) => [...missionIds, activeDebugMission.id]);
    recordSuccess("debugSolved");
  };

  return (
    <section className="min-h-full w-full bg-[#f4f6fb] text-gray-900">
      <div className="flex min-h-full flex-col gap-5 p-5 pb-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onHome}
            className="flex h-10 items-center gap-1 rounded-xl bg-white px-3 text-sm font-bold text-indigo-700 shadow-sm transition active:scale-95"
          >
            <ChevronLeft size={18} />
            홈으로 돌아가기
          </button>
          <div className="flex h-10 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 text-[13px] font-bold text-indigo-700">
            <Flame size={15} />
            현재 {streakCount}연승
          </div>
        </div>

        <div className="flex flex-col">
          <div className="relative z-10 rounded-[26px] bg-white p-1.5 shadow-sm">
            <div className="relative grid grid-cols-4 gap-1 overflow-visible">
              <span
                aria-hidden="true"
                className={`weekly-tab-slider pointer-events-none absolute bottom-0 left-0 top-0 rounded-[20px] ${activePanelItem.tabActiveClass}`}
                style={activePanelSlideStyle}
              />
              <span
                aria-hidden="true"
                className="weekly-tab-connector-slider pointer-events-none absolute -bottom-3 left-0 flex h-3 items-start justify-center"
                style={activePanelSlideStyle}
              >
                <span className={`h-3 w-11 rounded-b-full ${activePanelItem.connectorClass}`} />
              </span>

              {PANEL_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activePanel === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePanel(item.id)}
                    className={`relative z-10 flex h-[68px] flex-col items-center justify-center gap-1 overflow-visible rounded-[20px] px-1.5 text-center text-[12px] font-extrabold leading-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 ${
                      active ? "text-white" : "text-gray-500 hover:-translate-y-0.5 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        active ? "bg-white/20 text-white" : item.iconClass
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="break-keep">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            key={activePanel}
            className={`weekly-panel-motion -mt-1 rounded-[26px] border p-3 pt-5 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity,filter] ${
              activePanelItem.panelClass
            } ${panelRevealed ? "translate-y-0 opacity-100 blur-0" : "-translate-y-3 opacity-0 blur-[2px]"}`}
          >
            <div className={`mx-auto mb-3 h-1 w-12 rounded-full ${activePanelItem.accentClass}`} />

            {activePanel === "battle" && (
              <BattlePanel
                activeBattleMode={activeBattleMode}
                battleMode={battleMode}
                mySolved={mySolved}
                offlineCode={offlineCode}
                offlineChallenges={visibleOfflineChallenges}
                offlineElapsed={offlineElapsed}
                offlineMessage={offlineMessage}
                offlineOpponentInput={offlineOpponentInput}
                offlineOpponentName={selectedOfflineOpponentName}
                offlineOpponentRecord={opponentOfflineRecord}
                offlineProblem={selectedOfflineProblem}
                offlineMyRecord={myOfflineRecord}
                offlineState={offlineState}
                selectedOfflineChallenge={selectedOfflineChallenge}
                onlineFinished={onlineFinished}
                onlineProgress={onlineProgress}
                onlineCode={onlineCode}
                onlineMessage={onlineMessage}
                onlineProblem={activeOnlineProblem}
                onlineProblemIndex={onlineProblemIndex}
                onlineRemaining={onlineRemaining}
                onlineResult={onlineResult}
                onlineState={onlineState}
                opponentConnected={opponentConnected}
                opponentName={opponentName}
                opponentOnlineState={opponentOnlineState}
                opponentProgress={opponentProgress}
                opponentSolved={opponentSolved}
                roomCode={roomCode}
                roomConnected={roomConnected}
                setBattleMode={setBattleMode}
                setOnlineCode={setOnlineCode}
                setRoomCode={setRoomCode}
                setOfflineCode={setOfflineCode}
                setOfflineOpponentInput={setOfflineOpponentInput}
                sharedConnected={sharedConnected}
                sharedMode={sharedMode}
                nicknameKey={nicknameKey}
                onAcceptOfflineChallenge={(challengeId) => handleRespondOfflineChallenge(challengeId, "accepted")}
                onDeleteDeclinedOfflineChallenge={handleDeleteDeclinedOfflineChallenge}
                onDeclineOfflineChallenge={(challengeId) => handleRespondOfflineChallenge(challengeId, "declined")}
                onJoinRoom={handleJoinRoom}
                onLeaveRoom={handleLeaveRoom}
                onSelectOfflineChallenge={handleSelectOfflineChallenge}
                onSendOfflineChallenge={handleSendOfflineChallenge}
                onResetOnline={handleResetOnline}
                onStartOffline={handleStartOffline}
                onStartOnline={handleStartOnline}
                onSubmitOnlineAnswer={handleSubmitOnlineAnswer}
                onSubmitOffline={handleSubmitOffline}
              />
            )}

            {activePanel === "weekly" && (
              <WeeklyCodingPanel
                hasWeeklyLocked={hasWeeklyLocked}
                problem={weeklyProblem}
                weeklyCode={weeklyCode}
                weeklyMessage={weeklyMessage}
                weeklyStatus={weeklyStatus}
                onAbandon={handleAbandonWeekly}
                onRetry={handleRetryWeekly}
                onSubmit={handleSubmitWeekly}
                setWeeklyCode={setWeeklyCode}
              />
            )}

            {activePanel === "debug" && (
              <DebugPanel
                debugGenerating={debugGenerating}
                debugSolved={debugSolved}
                mission={activeDebugMission}
                selectedBug={selectedBug}
                onGenerate={handleGenerateDebugMission}
                onSelectBug={handleSelectBug}
              />
            )}

            {activePanel === "ranking" && (
              <RankingPanel
                rankingTab={rankingTab}
                setRankingTab={setRankingTab}
                sharedConnected={sharedConnected}
                sharedMode={sharedMode}
                solutions={sortedSolutions}
                onVote={handleVoteSolution}
              />
            )}
          </div>
        </div>

        <StreakPanel badges={badges} stats={progressStats} />
      </div>
    </section>
  );
};

const BattlePanel = ({
  activeBattleMode,
  battleMode,
  mySolved,
  offlineCode,
  offlineChallenges,
  offlineElapsed,
  offlineMessage,
  offlineOpponentInput,
  offlineOpponentName,
  offlineOpponentRecord,
  offlineProblem,
  offlineMyRecord,
  offlineState,
  selectedOfflineChallenge,
  onlineFinished,
  onlineProgress,
  onlineCode,
  onlineMessage,
  onlineProblem,
  onlineProblemIndex,
  onlineRemaining,
  onlineResult,
  onlineState,
  opponentConnected,
  opponentName,
  opponentOnlineState,
  opponentProgress,
  opponentSolved,
  roomCode,
  roomConnected,
  setBattleMode,
  setOnlineCode,
  setRoomCode,
  setOfflineCode,
  setOfflineOpponentInput,
  sharedConnected,
  sharedMode,
  nicknameKey,
  onAcceptOfflineChallenge,
  onDeleteDeclinedOfflineChallenge,
  onDeclineOfflineChallenge,
  onJoinRoom,
  onLeaveRoom,
  onSelectOfflineChallenge,
  onSendOfflineChallenge,
  onResetOnline,
  onStartOffline,
  onStartOnline,
  onSubmitOnlineAnswer,
  onSubmitOffline,
}) => (
  <div className="flex flex-col gap-4">
    <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900">배틀 모드</h2>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{activeBattleMode.title}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {battleModes.map((mode) => {
          const Icon = mode.icon;
          const selected = battleMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setBattleMode(mode.id)}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-[13px] font-extrabold transition active:scale-95 ${
                selected ? "border-indigo-600 bg-indigo-600 text-white shadow-md" : "border-gray-100 bg-white text-gray-600"
              }`}
            >
              <Icon size={16} />
              {mode.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm font-medium leading-6 text-gray-600">{activeBattleMode.description}</p>
    </div>

    {battleMode === "online" ? (
      <OnlineBattleCard
        mySolved={mySolved}
        onlineFinished={onlineFinished}
        onlineProgress={onlineProgress}
        onlineCode={onlineCode}
        onlineMessage={onlineMessage}
        onlineProblem={onlineProblem}
        onlineProblemIndex={onlineProblemIndex}
        onlineRemaining={onlineRemaining}
        onlineResult={onlineResult}
        onlineState={onlineState}
        opponentConnected={opponentConnected}
        opponentName={opponentName}
        opponentOnlineState={opponentOnlineState}
        opponentProgress={opponentProgress}
        opponentSolved={opponentSolved}
        roomCode={roomCode}
        roomConnected={roomConnected}
        setOnlineCode={setOnlineCode}
        setRoomCode={setRoomCode}
        sharedConnected={sharedConnected}
        sharedMode={sharedMode}
        onJoinRoom={onJoinRoom}
        onLeaveRoom={onLeaveRoom}
        onResetOnline={onResetOnline}
        onStartOnline={onStartOnline}
        onSubmitOnlineAnswer={onSubmitOnlineAnswer}
      />
    ) : (
      <OfflineBattleCard
        offlineCode={offlineCode}
        offlineChallenges={offlineChallenges}
        offlineElapsed={offlineElapsed}
        offlineMessage={offlineMessage}
        offlineOpponentInput={offlineOpponentInput}
        offlineOpponentName={offlineOpponentName}
        offlineOpponentRecord={offlineOpponentRecord}
        offlineProblem={offlineProblem}
        offlineMyRecord={offlineMyRecord}
        offlineState={offlineState}
        selectedOfflineChallenge={selectedOfflineChallenge}
        setOfflineCode={setOfflineCode}
        setOfflineOpponentInput={setOfflineOpponentInput}
        sharedConnected={sharedConnected}
        sharedMode={sharedMode}
        nicknameKey={nicknameKey}
        onAcceptOfflineChallenge={onAcceptOfflineChallenge}
        onDeleteDeclinedOfflineChallenge={onDeleteDeclinedOfflineChallenge}
        onDeclineOfflineChallenge={onDeclineOfflineChallenge}
        onSelectOfflineChallenge={onSelectOfflineChallenge}
        onSendOfflineChallenge={onSendOfflineChallenge}
        onStartOffline={onStartOffline}
        onSubmitOffline={onSubmitOffline}
      />
    )}
  </div>
);

const OnlineBattleCard = ({
  mySolved,
  onlineFinished,
  onlineProgress,
  onlineCode,
  onlineMessage,
  onlineProblem,
  onlineProblemIndex,
  onlineRemaining,
  onlineResult,
  onlineState,
  opponentConnected,
  opponentName,
  opponentOnlineState,
  opponentProgress,
  opponentSolved,
  roomCode,
  roomConnected,
  setOnlineCode,
  setRoomCode,
  sharedConnected,
  sharedMode,
  onJoinRoom,
  onLeaveRoom,
  onResetOnline,
  onStartOnline,
  onSubmitOnlineAnswer,
}) => {
  const hasBattleStarted = onlineState === "playing" || onlineState === "finished";
  const helperText = roomConnected ? getOnlineStateText(onlineState) : "방 코드를 입력하고 입장하면 대전 신청을 할 수 있습니다.";

  return (
  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <IconBox icon={Zap} tone="indigo" />
        <div>
          <h2 className="text-lg font-black text-gray-900">실시간 대전</h2>
          <p className="text-[13px] font-semibold leading-5 text-gray-600">{helperText}</p>
        </div>
      </div>
      {hasBattleStarted && (
        <span className="rounded-2xl bg-rose-50 px-3 py-2 font-mono text-lg font-black text-rose-500">
          {formatTime(onlineRemaining)}
        </span>
      )}
    </div>

    <div className="mt-4 rounded-2xl border border-gray-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-extrabold text-gray-700" htmlFor="battle-room-code">
          방 코드
        </label>
        <span className={`text-xs font-extrabold ${roomConnected || sharedConnected ? "text-emerald-600" : "text-gray-500"}`}>
          {roomConnected
            ? sharedConnected
              ? `입장됨 · ${getSharedModeLabel(sharedMode)}`
              : "입장됨 · 로컬"
            : sharedConnected
              ? `${getSharedModeLabel(sharedMode)} 가능`
              : "로컬 모드"}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          id="battle-room-code"
          value={roomCode}
          onChange={(event) => setRoomCode(event.target.value)}
          disabled={roomConnected}
          className="min-w-0 flex-1 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-indigo-400 disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={roomConnected ? onLeaveRoom : onJoinRoom}
          className={`shrink-0 rounded-xl px-3 text-xs font-black text-white transition active:scale-95 ${
            roomConnected ? "bg-rose-500" : "bg-indigo-600"
          }`}
        >
          {roomConnected ? "퇴장" : "입장"}
        </button>
      </div>
      <p className="mt-2 text-xs font-medium leading-5 text-gray-600">
        같은 사이트 주소와 방 코드로 입장한 뒤, 두 사람이 모두 대전 신청을 누르면 문제가 열립니다.
      </p>
      {!hasBattleStarted && onlineMessage.includes("이미 2명") && (
        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black leading-5 text-rose-600">{onlineMessage}</p>
      )}
    </div>

    {roomConnected && !hasBattleStarted && (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-3 py-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-gray-900">{onlineState === "matching" ? "대전 신청 완료" : "방 입장 완료"}</p>
          <p className="mt-0.5 break-keep text-[13px] font-medium leading-5 text-gray-600">
            {getOnlineBattleDetail(onlineState, opponentConnected, opponentName, opponentOnlineState)}
          </p>
        </div>

        {onlineState === "idle" && <ActionButton icon={Play} label="대전 신청" onClick={onStartOnline} />}
        {onlineState === "matching" && (
          <button type="button" className="h-9 shrink-0 rounded-xl bg-indigo-100 px-3 text-sm font-black text-indigo-600">
            매칭 중
          </button>
        )}
      </div>
    )}

    {hasBattleStarted && (
      <>
        <div className="mt-4 space-y-3">
          <ProgressRow label="나" value={`${mySolved}/${TOTAL_ONLINE_PROBLEMS}`} progress={onlineProgress} color="bg-indigo-500" />
          <ProgressRow
            label={opponentConnected ? (opponentName ? `상대 (${opponentName})` : "상대") : "상대 대기"}
            value={`${opponentSolved}/${TOTAL_ONLINE_PROBLEMS}`}
            progress={opponentProgress}
            color="bg-rose-400"
          />
          {opponentConnected && (
            <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-600">
              <span>{opponentName ? `${opponentName}님 상태` : "상대 상태"}</span>
              <span>{getOpponentStateText(opponentOnlineState)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-indigo-100 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-indigo-700">
                  문제 {onlineProblemIndex + 1}/{TOTAL_ONLINE_PROBLEMS}
                </p>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-black text-indigo-700">{PROBLEM_LANGUAGE}</span>
              </div>
              <p className="mt-1 text-sm font-medium leading-6 text-gray-600">{onlineProblem.prompt}</p>
              <p className="mt-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700">{onlineProblem.example}</p>
            </div>
            <IconBox icon={Code2} tone="indigo" />
          </div>

          <CodeTextarea
            value={onlineCode}
            setCode={setOnlineCode}
            disabled={onlineState !== "playing"}
            minHeightClass="min-h-[154px]"
            tone="indigo"
          />
          <p className={`mt-2 text-[13px] font-bold leading-5 ${onlineMessage.includes("오답") ? "text-rose-600" : "text-indigo-700"}`}>
            {onlineMessage}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-3 py-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900">{onlineFinished ? onlineResult.title : onlineResult.live}</p>
            <p className="mt-0.5 break-keep text-[13px] font-medium leading-5 text-gray-600">
              {onlineFinished ? onlineResult.detail : getOnlineBattleDetail(onlineState, opponentConnected, opponentName, opponentOnlineState)}
            </p>
          </div>

          {onlineState === "playing" && <ActionButton icon={CheckCircle2} label="정답 제출" onClick={onSubmitOnlineAnswer} />}
          {onlineState === "finished" && <ActionButton icon={RotateCcw} label="다시" onClick={onResetOnline} />}
        </div>
      </>
    )}
  </div>
  );
};

const OfflineBattleCard = ({
  offlineCode,
  offlineChallenges,
  offlineElapsed,
  offlineMessage,
  offlineOpponentInput,
  offlineOpponentName,
  offlineOpponentRecord,
  offlineProblem,
  offlineMyRecord,
  offlineState,
  selectedOfflineChallenge,
  setOfflineCode,
  setOfflineOpponentInput,
  sharedConnected,
  sharedMode,
  nicknameKey,
  onAcceptOfflineChallenge,
  onDeleteDeclinedOfflineChallenge,
  onDeclineOfflineChallenge,
  onSelectOfflineChallenge,
  onSendOfflineChallenge,
  onStartOffline,
  onSubmitOffline,
}) => {
  const receivedChallenges = offlineChallenges.filter((challenge) => challenge.toKey === nicknameKey);
  const sentChallenges = offlineChallenges.filter((challenge) => challenge.fromKey === nicknameKey);
  const trimmedOpponentInput = offlineOpponentInput.trim();
  const opponentInputKey = normalizeNicknameKey(trimmedOpponentInput);
  const alreadySentToOpponent =
    Boolean(trimmedOpponentInput) &&
    opponentInputKey !== nicknameKey &&
    hasSentOfflineChallengeTo(offlineChallenges, nicknameKey, opponentInputKey);
  const displayElapsed = offlineState === "running" ? offlineElapsed : Number(offlineMyRecord?.seconds ?? 0);
  const displayCode = offlineMyRecord && offlineState !== "running" ? offlineMyRecord.code : offlineCode;
  const canStart = selectedOfflineChallenge?.status === "accepted" && !offlineMyRecord && offlineState === "idle";
  const canSubmit = selectedOfflineChallenge?.status === "accepted" && offlineState === "running";
  const problemVisible = Boolean(selectedOfflineChallenge && (offlineState !== "idle" || offlineMyRecord));
  const hasCompletedOfflineProblem = Boolean(offlineMyRecord);

  return (
    <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconBox icon={Clock3} tone="violet" />
          <div>
            <h2 className="text-lg font-black text-gray-900">오프라인 기록 대전</h2>
            <p className="text-[13px] font-semibold text-gray-600">
              {sharedConnected ? `${getSharedModeLabel(sharedMode)} 연결됨` : "공유 서버 연결 필요"}
            </p>
          </div>
        </div>
        <span className="rounded-2xl bg-indigo-50 px-3 py-2 font-mono text-lg font-black text-indigo-600">
          {formatLongTime(displayElapsed)}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3">
        <label className="text-sm font-extrabold text-violet-900" htmlFor="offline-opponent">
          친구에게 대전장 보내기
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="offline-opponent"
            value={offlineOpponentInput}
            onChange={(event) => setOfflineOpponentInput(event.target.value)}
            placeholder="친구 닉네임"
            disabled={!sharedConnected}
            className="min-w-0 flex-1 rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-violet-400 disabled:bg-gray-100"
          />
          <button
            type="button"
            onClick={onSendOfflineChallenge}
            disabled={!sharedConnected || alreadySentToOpponent}
            className="shrink-0 rounded-xl bg-violet-600 px-3 text-xs font-black text-white transition active:scale-95 disabled:bg-gray-300"
          >
            보내기
          </button>
        </div>
        <p className={`mt-2 text-xs font-semibold leading-5 ${alreadySentToOpponent ? "text-rose-600" : "text-violet-700"}`}>
          {alreadySentToOpponent
            ? `${trimmedOpponentInput}님에게 이미 보낸 대전장이 있습니다.`
            : "상대는 같은 앱에서 받은 대전장을 확인하고 수락 또는 거절할 수 있습니다."}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <ChallengeList
          emptyText="받은 대전장이 없습니다."
          items={receivedChallenges}
          nicknameKey={nicknameKey}
          selectedId={selectedOfflineChallenge?.id}
          title="받은 대전장"
          onAccept={onAcceptOfflineChallenge}
          onDeleteDeclined={onDeleteDeclinedOfflineChallenge}
          onDecline={onDeclineOfflineChallenge}
          onSelect={onSelectOfflineChallenge}
        />
        <ChallengeList
          emptyText="보낸 대전장이 없습니다."
          items={sentChallenges}
          nicknameKey={nicknameKey}
          selectedId={selectedOfflineChallenge?.id}
          title="보낸 대전장"
          onDeleteDeclined={onDeleteDeclinedOfflineChallenge}
          onSelect={onSelectOfflineChallenge}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 shadow-sm ring-1 ring-violet-100">
        {selectedOfflineChallenge ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-violet-700">선택된 기록전 · {getOfflineChallengeStatusText(selectedOfflineChallenge.status)}</p>
                <h3 className="mt-1 text-lg font-black text-gray-900">{offlineOpponentName}님과의 1:1 기록전</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-violet-700">
                  아래 문제와 기록은 이 대전장 안에서만 따로 저장됩니다.
                </p>
              </div>
              <IconBox icon={Users} tone="violet" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <RecordPill label="내 기록" record={offlineMyRecord} />
              <RecordPill label={`${offlineOpponentName} 기록`} record={offlineOpponentRecord} hideTime />
            </div>

            {offlineMyRecord && offlineOpponentRecord && (
              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-black text-gray-800">
                {getOfflineResultMessage(offlineMyRecord.seconds, offlineOpponentRecord.seconds, offlineOpponentName)}
              </p>
            )}

            <div className="mt-4 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-indigo-700">이 기록전 문제</p>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-black text-indigo-700">{PROBLEM_LANGUAGE}</span>
                  </div>
                  <h4 className="mt-1 text-base font-black text-gray-900">
                    {hasCompletedOfflineProblem ? "문제 풀이 완료" : problemVisible ? "문제가 열렸습니다" : "문제는 문제 풀기 후 공개됩니다"}
                  </h4>
                </div>
                <IconBox icon={Code2} tone="indigo" />
              </div>

              {problemVisible ? (
                <>
                  <p className="text-sm font-medium leading-6 text-gray-600">{offlineProblem.prompt}</p>
                  <p className="mt-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700">{offlineProblem.example}</p>

                  <CodeTextarea
                    value={displayCode}
                    setCode={setOfflineCode}
                    disabled={offlineState !== "running"}
                    minHeightClass="min-h-[144px]"
                    tone="indigo"
                  />
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-4">
                  <div className="flex items-start gap-3">
                    <IconBox icon={Lock} tone="violet" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-gray-900">이 기록전 안에서 문제 풀이가 시작됩니다</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-gray-600">
                        수락된 대전장에서 문제 풀기를 누르면 문제와 타이머가 함께 열립니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 grid">
              {canSubmit ? (
                <ActionButton icon={Send} label="정답 제출" onClick={onSubmitOffline} />
              ) : hasCompletedOfflineProblem ? (
                <ActionButton icon={CheckCircle2} label="문제 풀이 완료" onClick={onStartOffline} disabled />
              ) : (
                <ActionButton icon={Play} label="문제 풀기" onClick={onStartOffline} disabled={!canStart} />
              )}
            </div>
          </>
        ) : (
          <div className="flex items-start gap-3">
            <IconBox icon={Lock} tone="violet" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-gray-900">선택된 대전장이 없습니다</p>
              <p className="mt-1 text-sm font-medium leading-6 text-gray-600">
                친구에게 대전장을 보내거나 받은 대전장을 수락하면 기록 측정을 시작할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {offlineMessage && (
        <p className={`mt-2 text-[13px] font-bold leading-5 ${offlineMessage.includes("실패") || offlineMessage.includes("거절") ? "text-rose-600" : "text-indigo-700"}`}>
          {offlineMessage}
        </p>
      )}
    </div>
  );
};

const ChallengeList = ({ emptyText, items, nicknameKey, selectedId, title, onAccept, onDecline, onDeleteDeclined, onSelect }) => (
  <div className="rounded-2xl border border-gray-100 bg-slate-50 p-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-black text-gray-900">{title}</h3>
      <span className="text-xs font-black text-violet-600">{items.length}개</span>
    </div>

    <div className="mt-2 space-y-2">
      {items.length === 0 && <p className="rounded-xl bg-white px-3 py-3 text-xs font-bold text-gray-500">{emptyText}</p>}
      {items.map((challenge) => {
        const isDeclined = challenge.status === "declined";
        const isPending = challenge.status === "pending";
        const isLocked = isDeclined || isPending;
        const isSelected = selectedId === challenge.id && !isLocked;
        const isIncomingPending = challenge.toKey === nicknameKey && challenge.status === "pending";
        const opponentName = getChallengeOpponentName(challenge, nicknameKey);
        const opponentKey = getChallengeOpponentKey(challenge, nicknameKey);
        const myRecord = challenge.records?.[nicknameKey];
        const opponentRecord = challenge.records?.[opponentKey];
        const statusVisual = getOfflineStatusVisual(challenge.status);
        const StatusIcon = statusVisual.icon;
        const challengeCaption = myRecord ? "문제 풀이 완료" : isSelected ? "현재 선택된 기록전" : statusVisual.caption;
        const challengeCaptionClass = myRecord ? "text-indigo-700" : isSelected ? "text-gray-900" : statusVisual.captionClass;

        return (
          <article
            key={challenge.id}
            className={`rounded-xl border border-l-4 p-3 shadow-sm transition ${
              isSelected
                ? statusVisual.selectedCardClass
                : statusVisual.cardClass
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelect(challenge.id)}
                disabled={isLocked}
                className={`min-w-0 flex-1 text-left ${isLocked ? "cursor-not-allowed" : ""}`}
              >
                <p className="truncate text-sm font-black text-gray-900">{opponentName}</p>
                {challengeCaption && (
                  <p className={`mt-0.5 truncate text-[11px] font-extrabold ${challengeCaptionClass}`}>
                    {challengeCaption}
                  </p>
                )}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                {isSelected && (
                  <span className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 text-[11px] font-black text-white">
                    <CheckCircle2 size={12} />
                    선택됨
                  </span>
                )}
                <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black ${statusVisual.badgeClass}`}>
                  <StatusIcon size={12} />
                  {getOfflineChallengeStatusText(challenge.status)}
                </span>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(challenge.id)}
                disabled={isLocked}
                className={`min-w-0 flex-1 text-left ${isLocked ? "cursor-not-allowed" : ""}`}
              >
                <p className="truncate text-[11px] font-bold text-gray-500">{getOfflineChallengeTimeSummary(challenge)}</p>
              </button>
              {isDeclined && (
                <button
                  type="button"
                  onClick={() => onDeleteDeclined?.(challenge.id)}
                  className="h-6 shrink-0 rounded-full bg-gray-100 px-2.5 text-[11px] font-black text-gray-600 transition active:scale-95"
                >
                  확인
                </button>
              )}
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={() => onSelect(challenge.id)}
                className="w-full text-left"
              >
                <p className="mt-2 text-xs font-bold text-gray-600">
                  내 기록 {myRecord ? formatLongTime(myRecord.seconds) : "-"} · 상대 {opponentRecord ? "완료" : "-"}
                </p>
              </button>
            )}

            {isIncomingPending && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onAccept(challenge.id)}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl bg-emerald-500 text-xs font-black text-white active:scale-95"
                >
                  <CheckCircle2 size={14} />
                  수락
                </button>
                <button
                  type="button"
                  onClick={() => onDecline(challenge.id)}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl bg-rose-500 text-xs font-black text-white active:scale-95"
                >
                  <XCircle size={14} />
                  거절
                </button>
              </div>
            )}

          </article>
        );
      })}
    </div>
  </div>
);

const RecordPill = ({ hideTime = false, label, record }) => (
  <div className="rounded-xl bg-white px-3 py-3">
    <p className="text-[11px] font-black text-gray-500">{label}</p>
    <p className={`mt-1 font-mono text-sm font-black ${record ? "text-indigo-700" : "text-gray-400"}`}>
      {record ? (hideTime ? "완료" : formatLongTime(record.seconds)) : "대기"}
    </p>
  </div>
);

const WeeklyCodingPanel = ({
  hasWeeklyLocked,
  problem,
  weeklyCode,
  weeklyMessage,
  weeklyStatus,
  onAbandon,
  onRetry,
  onSubmit,
  setWeeklyCode,
}) => (
  <div className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-sm">
    <div className="border-b border-emerald-100 bg-emerald-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black leading-tight text-gray-900">이주의 문제</h2>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-emerald-700">{problem.level}</span>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-gray-700">{PROBLEM_LANGUAGE}</span>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">{problem.prompt}</p>
          <p className="mt-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-bold text-emerald-700">{problem.example}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
          <ShieldCheck size={20} />
        </div>
      </div>
    </div>

    <div className="relative p-4">
      <div className="absolute left-5 top-0 h-4 w-px bg-emerald-200" />
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase text-emerald-600">이 문제에 대한 풀이</p>
          <h3 className="text-lg font-black text-gray-900">내 풀이</h3>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${getWeeklyBadgeClass(weeklyStatus)}`}>
          {hasWeeklyLocked ? <Lock size={13} /> : <Code2 size={13} />}
          {getWeeklyStatusText(weeklyStatus)}
        </div>
      </div>

      <CodeTextarea
        value={weeklyCode}
        setCode={setWeeklyCode}
        disabled={hasWeeklyLocked}
        minHeightClass="min-h-[178px]"
        tone="emerald"
        wrapperClassName=""
      />

      {weeklyMessage && weeklyMessage !== "아직 제출 전입니다." && (
        <p className={`mt-2 text-[13px] font-bold leading-5 ${weeklyMessage.includes("오답") ? "text-rose-600" : "text-emerald-700"}`}>
          {weeklyMessage}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ActionButton icon={Send} label={weeklyStatus === "submitted" ? "제출 완료" : "정답 제출"} onClick={onSubmit} disabled={hasWeeklyLocked} />
        <SecondaryButton
          icon={weeklyStatus === "submitted" ? Trophy : Eye}
          label={weeklyStatus === "submitted" ? "투표 보기" : "포기하고 투표"}
          onClick={onAbandon}
        />
      </div>

      {weeklyStatus === "abandoned" && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-emerald-50 text-sm font-black text-emerald-700"
        >
          <RotateCcw size={15} />
          다시 풀기
        </button>
      )}
    </div>
  </div>
);

const DebugPanel = ({ debugGenerating, debugSolved, mission, selectedBug, onGenerate, onSelectBug }) => (
  <div className="flex flex-col gap-4">
    <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconBox icon={Bot} tone="amber" />
          <div>
            <h2 className="text-lg font-black text-gray-900">AI 틀린 코드 생성</h2>
            <p className="text-[13px] font-semibold leading-5 text-gray-600">문제 패턴을 바탕으로 디버깅 미션을 만듭니다.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          className="h-9 shrink-0 rounded-xl bg-amber-500 px-3 text-xs font-black text-white transition active:scale-95"
        >
          {debugGenerating ? "생성 중" : "새 문제"}
        </button>
      </div>
    </div>

    <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black leading-tight text-gray-900">버그가 있는 코드</h3>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-gray-700">{PROBLEM_LANGUAGE}</span>
          </div>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-600">{mission.prompt}</p>
        </div>
        <IconBox icon={Bug} tone="rose" />
      </div>

      <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-3 text-[13px] leading-6 text-indigo-50">
        <code>{mission.brokenCode}</code>
      </pre>

      <div className="mt-3 space-y-2">
        {mission.choices.map((choice, index) => {
          const selected = selectedBug === index;
          const correct = selected && index === mission.answer;
          const wrong = selected && index !== mission.answer;

          return (
            <button
              key={choice}
              type="button"
              onClick={() => onSelectBug(index)}
              className={`flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-bold leading-5 transition active:scale-95 ${
                correct
                  ? "bg-emerald-50 text-emerald-600"
                  : wrong
                    ? "bg-rose-50 text-rose-500"
                    : "bg-slate-50 text-gray-700"
              }`}
            >
              {correct ? <CheckCircle2 size={16} /> : wrong ? <XCircle size={16} /> : <Target size={16} />}
              {choice}
            </button>
          );
        })}
      </div>

      {selectedBug !== null && (
        <p className={`mt-3 rounded-2xl px-3 py-3 text-sm font-bold leading-6 ${debugSolved ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
          {debugSolved ? "정답입니다. " : "아직 아니에요. "}
          {mission.explanation}
        </p>
      )}
    </div>
  </div>
);

const RankingPanel = ({ rankingTab, setRankingTab, sharedConnected, sharedMode, solutions, onVote }) => (
  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black leading-tight text-gray-900">익명 코드 랭킹</h2>
        <p className="mt-1 text-[13px] font-semibold leading-5 text-gray-600">
          {sharedConnected
            ? `${getSharedModeLabel(sharedMode)}에 연결되어 제출 코드와 투표가 함께 반영됩니다.`
            : "공유 설정이 없거나 연결되지 않아 내 브라우저에서만 반영됩니다."}
        </p>
      </div>
      <IconBox icon={Users} tone="amber" />
    </div>

    <div className="mt-4 grid grid-cols-4 gap-2">
      {[
        { id: "popular", label: "인기", icon: Trophy },
        { id: "likes", label: "좋아요", icon: Heart },
        { id: "creative", label: "독창성", icon: Award },
        { id: "efficiency", label: "효율성", icon: Zap },
      ].map((tab) => {
        const Icon = tab.icon;
        const selected = rankingTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRankingTab(tab.id)}
            className={`flex h-10 items-center justify-center gap-1 rounded-xl text-xs font-black transition active:scale-95 ${
              selected ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"
            }`}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>

    <div className="mt-3 space-y-3">
      {solutions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4 text-center">
          <Trophy size={22} className="mx-auto text-amber-600" />
          <p className="mt-2 text-sm font-black text-gray-900">아직 공개된 풀이가 없습니다</p>
          <p className="mt-1 text-[13px] font-medium leading-5 text-gray-600">
            이주의 코딩을 정답 제출하면 내 풀이가 익명으로 랭킹에 올라갑니다.
          </p>
        </div>
      )}

      {solutions.map((solution, index) => (
        <article key={solution.id} className="rounded-2xl border border-gray-100 bg-slate-50 p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-amber-600 shadow-sm">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-black text-gray-900">{solution.alias}</p>
                <div className="flex items-center gap-1 text-xs font-black text-amber-600">
                  <Medal size={14} />
                  {getSolutionTotalVotes(solution)}
                </div>
              </div>
              <p className="mt-0.5 truncate text-[13px] font-bold text-gray-700">{solution.title}</p>
              <p className="mt-1 text-[13px] font-medium text-gray-600">{solution.note}</p>
            </div>
          </div>

          <pre className="mt-3 max-h-28 overflow-auto rounded-xl bg-white p-3 text-[12px] leading-5 text-gray-700">
            <code>{solution.code}</code>
          </pre>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric icon={Heart} value={getSolutionMetricValue(solution, "likes")} label="좋아요" active={solution.liked} onClick={() => onVote(solution.id, "likes")} />
            <Metric
              icon={Award}
              value={getSolutionMetricValue(solution, "originality")}
              label="독창성"
              active={solution.originalityVoted}
              onClick={() => onVote(solution.id, "originality")}
            />
            <Metric
              icon={Zap}
              value={getSolutionMetricValue(solution, "efficiency")}
              label="효율성"
              active={solution.efficiencyVoted}
              onClick={() => onVote(solution.id, "efficiency")}
            />
          </div>
        </article>
      ))}
    </div>
  </div>
);

const StreakPanel = ({ badges: badgeList, stats }) => (
  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-black text-gray-900">연승·뱃지</h2>
        <p className="mt-1 text-[13px] font-semibold leading-5 text-gray-600">
          현재 {stats.streakCount}연승 · 최고 {stats.bestStreak}연승 · 완료 {stats.totalCompleted}개
        </p>
      </div>
      <IconBox icon={Flame} tone="emerald" />
    </div>

    <div className="mt-3 grid grid-cols-2 gap-2">
      {badgeList.map((badge) => {
        const unlocked = badge.isUnlocked(stats);
        const progress = badge.getProgress(stats);

        return (
          <div
            key={badge.id}
            className={`rounded-2xl px-3 py-3 ${
              unlocked ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md" : "bg-slate-50 text-gray-500"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <Medal size={18} />
              <span className={`text-[11px] font-black ${unlocked ? "text-white/90" : "text-gray-500"}`}>
                {unlocked ? "획득" : `${progress}/${badge.goal}`}
              </span>
            </div>
            <p className="mt-2 text-sm font-black">{badge.title}</p>
            <p className={`mt-0.5 text-[11px] font-bold leading-4 ${unlocked ? "text-white/80" : "text-gray-500"}`}>
              {badge.note}
            </p>
          </div>
        );
      })}
    </div>
  </div>
);

const ProgressRow = ({ label, value, progress, color }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between text-[13px] font-bold text-gray-700">
      <span className="max-w-[170px] truncate">{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${progress}%` }} />
    </div>
  </div>
);

const Metric = ({ active = false, icon: Icon, label, onClick, value }) => {
  const content = (
    <>
      <Icon size={14} />
      <span>{value}</span>
      <span className="text-[11px] font-bold text-gray-500">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex h-10 items-center justify-center gap-1 rounded-xl text-xs font-black transition active:scale-95 ${
          active ? "bg-rose-50 text-rose-600" : "bg-white text-gray-700"
        }`}
      >
        {content}
      </button>
    );
  }

  return <div className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white text-xs font-black text-gray-700">{content}</div>;
};

const IconBox = ({ icon: Icon, tone }) => {
  const colorClasses = {
    amber: "bg-amber-50 text-amber-500",
    emerald: "bg-emerald-50 text-emerald-500",
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-500",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClasses[tone] ?? colorClasses.indigo}`}>
      <Icon size={19} />
    </div>
  );
};

const ActionButton = ({ disabled = false, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex h-10 items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3 text-sm font-black text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
  >
    <Icon size={15} />
    {label}
  </button>
);

const SecondaryButton = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-10 items-center justify-center gap-1 rounded-xl bg-indigo-50 px-3 text-sm font-black text-indigo-700 transition active:scale-95"
  >
    <Icon size={15} />
    {label}
  </button>
);

const CodeTextarea = ({
  disabled = false,
  expandedHeightClass = "min-h-[320px]",
  minHeightClass = "min-h-[154px]",
  setCode,
  tone = "indigo",
  value,
  wrapperClassName = "mt-3",
}) => {
  const [expanded, setExpanded] = useState(false);
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100 text-emerald-50 focus:border-emerald-400"
      : "border-indigo-100 text-indigo-50 focus:border-indigo-400";
  const ExpandIcon = expanded ? Minimize2 : Maximize2;

  return (
    <div className={wrapperClassName}>
      <textarea
        value={value}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={(event) => handleCodeTextareaKeyDown(event, setCode)}
        disabled={disabled}
        className={`code-editor-expand-motion w-full resize-none overflow-hidden rounded-2xl border bg-slate-950 p-3 font-mono text-[13px] leading-6 outline-none will-change-[min-height,box-shadow] disabled:opacity-70 ${
          expanded ? expandedHeightClass : minHeightClass
        } ${toneClass}`}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="code-editor-toggle-motion group flex h-8 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-100 px-2.5 text-xs font-black text-gray-700 shadow-sm hover:-translate-y-0.5 hover:bg-gray-200 active:translate-y-0 active:scale-95"
        >
          <ExpandIcon size={14} className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-aria-expanded:rotate-180" />
          {expanded ? "줄이기" : "확장"}
        </button>
      </div>
    </div>
  );
};

const handleCodeTextareaKeyDown = (event, setCode) => {
  if (event.key === "Enter") {
    insertCodeNewLine(event, setCode);
    return;
  }

  if (event.key === "Backspace" && deleteCodeIndentBeforeCursor(event, setCode)) {
    return;
  }

  if (event.key !== "Tab") return;

  event.preventDefault();

  const textarea = event.currentTarget;
  const { selectionStart, selectionEnd, value } = textarea;

  if (event.shiftKey) {
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const selectedText = value.slice(lineStart, selectionEnd);
    let removedBeforeCursor = 0;
    let removedTotal = 0;
    const nextSelectedText = selectedText
      .split("\n")
      .map((line, index) => {
        const removable = line.startsWith(CODE_INDENT) ? CODE_INDENT.length : line.startsWith("\t") ? 1 : 0;
        if (!removable) return line;

        removedTotal += removable;
        if (index === 0) removedBeforeCursor = Math.min(removable, selectionStart - lineStart);

        return line.slice(removable);
      })
      .join("\n");
    const nextValue = value.slice(0, lineStart) + nextSelectedText + value.slice(selectionEnd);
    const nextSelectionStart = Math.max(lineStart, selectionStart - removedBeforeCursor);
    const nextSelectionEnd = Math.max(nextSelectionStart, selectionEnd - removedTotal);

    setCode(nextValue);
    restoreTextareaSelection(textarea, nextSelectionStart, nextSelectionEnd);
    return;
  }

  if (selectionStart !== selectionEnd && value.slice(selectionStart, selectionEnd).includes("\n")) {
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const selectedText = value.slice(lineStart, selectionEnd);
    const lineCount = selectedText.split("\n").length;
    const nextSelectedText = selectedText
      .split("\n")
      .map((line) => `${CODE_INDENT}${line}`)
      .join("\n");
    const nextValue = value.slice(0, lineStart) + nextSelectedText + value.slice(selectionEnd);

    setCode(nextValue);
    restoreTextareaSelection(textarea, selectionStart + CODE_INDENT.length, selectionEnd + CODE_INDENT.length * lineCount);
    return;
  }

  const nextValue = `${value.slice(0, selectionStart)}${CODE_INDENT}${value.slice(selectionEnd)}`;
  const nextCursor = selectionStart + CODE_INDENT.length;

  setCode(nextValue);
  restoreTextareaSelection(textarea, nextCursor, nextCursor);
};

const insertCodeNewLine = (event, setCode) => {
  event.preventDefault();

  const textarea = event.currentTarget;
  const { selectionStart, selectionEnd, value } = textarea;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const currentLineBeforeCursor = value.slice(lineStart, selectionStart);
  const trimmedLineBeforeCursor = currentLineBeforeCursor.replace(/[ \t]+$/, "");
  const insertPosition = selectionStart - (currentLineBeforeCursor.length - trimmedLineBeforeCursor.length);
  const baseIndent = currentLineBeforeCursor.match(/^\s*/)?.[0] ?? "";
  const shouldIndentNextLine = trimmedLineBeforeCursor.endsWith(":");
  const nextIndent = shouldIndentNextLine ? `${baseIndent}${CODE_INDENT}` : baseIndent;
  const nextValue = `${value.slice(0, insertPosition)}\n${nextIndent}${value.slice(selectionEnd)}`;
  const nextCursor = insertPosition + 1 + nextIndent.length;

  setCode(nextValue);
  restoreTextareaSelection(textarea, nextCursor, nextCursor);
};

const deleteCodeIndentBeforeCursor = (event, setCode) => {
  const textarea = event.currentTarget;
  const { selectionStart, selectionEnd, value } = textarea;

  if (selectionStart !== selectionEnd || selectionStart === 0) return false;

  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const currentLineBeforeCursor = value.slice(lineStart, selectionStart);

  if (!currentLineBeforeCursor || /[^\t ]/.test(currentLineBeforeCursor)) return false;

  event.preventDefault();

  const deleteLength = currentLineBeforeCursor.endsWith("\t")
    ? 1
    : currentLineBeforeCursor.length % CODE_INDENT.length || CODE_INDENT.length;
  const deleteStart = Math.max(lineStart, selectionStart - deleteLength);
  const nextValue = `${value.slice(0, deleteStart)}${value.slice(selectionEnd)}`;

  setCode(nextValue);
  restoreTextareaSelection(textarea, deleteStart, deleteStart);

  return true;
};

const restoreTextareaSelection = (textarea, selectionStart, selectionEnd) => {
  window.requestAnimationFrame(() => {
    textarea.selectionStart = selectionStart;
    textarea.selectionEnd = selectionEnd;
  });
};

const isSumSolution = (code) => {
  const compact = normalizeCode(code);

  return (
    compact.includes("returna+b") ||
    compact.includes("returnb+a") ||
    compact.includes("return(a+b)") ||
    compact.includes("return(b+a)")
  );
};

const isEvenCountSolution = (code) => {
  const compact = normalizeCode(code);

  return compact.includes("%2==0") || compact.includes("%2!=1") || compact.includes("notn%2") || compact.includes("filter(");
};

const isMaxSolution = (code) => {
  const compact = normalizeCode(code);

  return compact.includes("returnmax(") || compact.includes("max(nums)") || (compact.includes(">") && !compact.includes("pass"));
};

const normalizeCode = (code) => code.replace(/\s/g, "").toLowerCase();

const normalizeRoomCode = (code) => {
  const normalized = code.trim().replace(/\s/g, "-").toUpperCase();

  return normalized || "EVERYMCU";
};

const getProgressStorageKey = (nickname) => `everymcu-weekly-progress-${nickname || "guest"}`;

const readSavedProgress = (nickname) => {
  if (typeof window === "undefined") return null;

  try {
    const rawProgress = window.localStorage.getItem(getProgressStorageKey(nickname));
    if (!rawProgress) return null;

    const parsed = JSON.parse(rawProgress);

    return {
      completedDebugMissionIds: Array.isArray(parsed.completedDebugMissionIds) ? parsed.completedDebugMissionIds : [],
      completionStats: {
        debugSolved: Number(parsed.completionStats?.debugSolved ?? 0),
        offlineWins: Number(parsed.completionStats?.offlineWins ?? 0),
        onlineWins: Number(parsed.completionStats?.onlineWins ?? 0),
        weeklySolved: Number(parsed.completionStats?.weeklySolved ?? 0),
      },
      bestStreak: Number(parsed.bestStreak ?? 0),
      streakCount: Number(parsed.streakCount ?? 0),
    };
  } catch {
    return null;
  }
};

const saveProgress = (nickname, progress) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getProgressStorageKey(nickname), JSON.stringify(progress));
  } catch {
    // Ignore storage failures so the feature still works in private or restricted browsers.
  }
};

const getLikesStorageKey = (nickname) => `everymcu-liked-solutions-${nickname || "guest"}`;
const getSolutionVotesStorageKey = (nickname) => `everymcu-solution-votes-${nickname || "guest"}`;

const createEmptySolutionVotes = () => ({
  efficiency: [],
  likes: [],
  originality: [],
});

const readSavedLikes = (nickname) => {
  if (typeof window === "undefined") return [];

  try {
    const savedLikes = JSON.parse(window.localStorage.getItem(getLikesStorageKey(nickname)) || "[]");
    return Array.isArray(savedLikes) ? savedLikes : [];
  } catch {
    return [];
  }
};

const readSavedSolutionVotes = (nickname) => {
  if (typeof window === "undefined") return createEmptySolutionVotes();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(getSolutionVotesStorageKey(nickname)) || "null");

    if (parsed && typeof parsed === "object") {
      return {
        efficiency: Array.isArray(parsed.efficiency) ? parsed.efficiency : [],
        likes: Array.isArray(parsed.likes) ? parsed.likes : [],
        originality: Array.isArray(parsed.originality) ? parsed.originality : [],
      };
    }
  } catch {
    // Fall through to legacy likes migration.
  }

  return {
    ...createEmptySolutionVotes(),
    likes: readSavedLikes(nickname),
  };
};

const saveSolutionVotes = (nickname, votes) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getSolutionVotesStorageKey(nickname), JSON.stringify(votes));
  } catch {
    // Ignore storage failures.
  }
};

const getFirebaseDatabaseUrl = () => {
  const envUrl = import.meta.env?.VITE_FIREBASE_DATABASE_URL;
  const windowUrl = typeof window !== "undefined" ? window.EVERYMCU_FIREBASE_DATABASE_URL : "";
  const url = String(envUrl || windowUrl || "").trim();

  return url.replace(/\/$/, "");
};

const getFirebaseAuthApiKey = () => {
  const envKey = import.meta.env?.VITE_FIREBASE_API_KEY;
  const windowKey = typeof window !== "undefined" ? window.EVERYMCU_FIREBASE_API_KEY : "";

  return String(envKey || windowKey || "AIzaSyA-6zuZp-AFrk4DD29D0nO5hAzqaphiBd8").trim();
};

const AUTH_SESSION_KEY = "everymcu-auth-session-v1";
let cloudAuthSession = (() => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();
let cloudAuthPromise = null;

const saveCloudAuthSession = (session) => {
  cloudAuthSession = session;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage failures.
  }
};

const isFreshAuthSession = (session) => session?.idToken && Number(session.expiresAt || 0) > Date.now() + 60000;

const createAnonymousAuthSession = async () => {
  const apiKey = getFirebaseAuthApiKey();
  if (!apiKey) return null;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!response.ok) throw new Error("Anonymous auth failed.");
  const data = await response.json();
  const session = {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    uid: data.localId,
    expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
  };
  saveCloudAuthSession(session);
  return session;
};

const refreshCloudAuthSession = async (refreshToken) => {
  const apiKey = getFirebaseAuthApiKey();
  if (!apiKey || !refreshToken) return null;
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!response.ok) throw new Error("Auth refresh failed.");
  const data = await response.json();
  const session = {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    uid: data.user_id,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  saveCloudAuthSession(session);
  return session;
};

const ensureCloudAuth = async () => {
  if (isFreshAuthSession(cloudAuthSession)) return cloudAuthSession;
  if (!cloudAuthPromise) {
    cloudAuthPromise = (async () => {
      try {
        if (cloudAuthSession?.refreshToken) return await refreshCloudAuthSession(cloudAuthSession.refreshToken);
      } catch {
        cloudAuthSession = null;
      }
      return null;
    })().finally(() => {
      cloudAuthPromise = null;
    });
  }
  return cloudAuthPromise;
};

const fetchFirebase = async (url, options = {}) => {
  const session = await ensureCloudAuth();
  const authedUrl = session?.idToken ? `${url}${url.includes("?") ? "&" : "?"}auth=${encodeURIComponent(session.idToken)}` : url;

  return fetch(authedUrl, options);
};

const getSharedMode = () => (getFirebaseDatabaseUrl() ? "firebase" : "local");

const getSharedModeLabel = (mode) => (mode === "firebase" ? "클라우드 공유" : "로컬 공유");

const getLocalRealtimeApiBase = () => {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname || "127.0.0.1";
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";

  return `${protocol}//${host}:${LOCAL_REALTIME_SERVER_PORT}`;
};

const getFirebasePath = (...segments) => {
  const databaseUrl = getFirebaseDatabaseUrl();
  if (!databaseUrl) return "";

  const path = [FIREBASE_SYNC_PATH, ...segments].map((segment) => toFirebaseKey(segment)).join("/");
  return `${databaseUrl}/${path}.json`;
};

const toFirebaseKey = (value) => String(value || "default").trim().replace(/[.#$/[\]]/g, "-") || "default";

const getSharedEventsUrl = () => {
  if (getSharedMode() === "firebase") return getFirebasePath();
  const localApiBase = getLocalRealtimeApiBase();

  return localApiBase ? `${localApiBase}/api/events` : "";
};

const normalizeSharedSolutions = (solutions) => {
  if (Array.isArray(solutions)) {
    return solutions
      .filter(Boolean)
      .map(normalizeSolutionMetrics)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  if (!solutions || typeof solutions !== "object") return [];

  return Object.entries(solutions)
    .map(([id, solution]) => normalizeSolutionMetrics({ id, ...solution }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

const normalizeSolutionMetrics = (solution) => {
  const isVoteBased = Number(solution?.voteVersion ?? 0) >= 2 || solution?.efficiency !== undefined;

  return {
    ...solution,
    efficiency: isVoteBased ? Number(solution?.efficiency ?? 0) : 0,
    likes: Number(solution?.likes ?? 0),
    originality: isVoteBased ? Number(solution?.originality ?? 0) : 0,
    views: Number(solution?.views ?? 0),
    voteVersion: isVoteBased ? 2 : Number(solution?.voteVersion ?? 1),
  };
};

const withSolutionVoteState = (solution, votes) => ({
  ...normalizeSolutionMetrics(solution),
  efficiencyVoted: (votes.efficiency ?? []).includes(solution.id),
  liked: (votes.likes ?? []).includes(solution.id),
  originalityVoted: (votes.originality ?? []).includes(solution.id),
});

const getSolutionMetricValue = (solution, metric) => Math.max(0, Number(solution?.[metric] ?? 0));

const getSolutionTotalVotes = (solution) =>
  getSolutionMetricValue(solution, "likes") +
  getSolutionMetricValue(solution, "originality") +
  getSolutionMetricValue(solution, "efficiency");

const normalizeSharedOfflineChallenges = (challenges) => {
  if (Array.isArray(challenges)) {
    return challenges.filter(Boolean).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }

  if (!challenges || typeof challenges !== "object") return [];

  return Object.entries(challenges)
    .map(([id, challenge]) => ({
      id,
      records: challenge.records ?? {},
      ...challenge,
    }))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
};

const normalizeSharedState = (state) => ({
  offlineChallenges: normalizeSharedOfflineChallenges(state?.offlineChallenges),
  rooms: state?.rooms ?? {},
  solutions: normalizeSharedSolutions(state?.solutions),
});

const getActiveRoomPlayerEntries = (room) =>
  Object.entries(room?.players ?? {})
    .filter(([, player]) => Date.now() - Number(player?.lastSeen ?? 0) < ROOM_PLAYER_STALE_MS)
    .sort(([, a], [, b]) => Number(a?.lastSeen ?? 0) - Number(b?.lastSeen ?? 0));

const fetchSharedState = async () => {
  const firebaseUrl = getFirebaseDatabaseUrl();

  if (firebaseUrl) {
    const response = await fetchFirebase(`${getFirebasePath()}?ts=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to load cloud state.");

    return normalizeSharedState(await response.json());
  }

  const localApiBase = getLocalRealtimeApiBase();
  const response = await fetch(`${localApiBase}/api/state`);
  if (!response.ok) throw new Error("Failed to load shared state.");

  return normalizeSharedState(await response.json());
};

const sendSharedPlayerState = async ({ nickname, playerId, remaining, roomCode, solved, state }) => {
  try {
    const playerState = {
      lastSeen: Date.now(),
      nickname,
      remaining,
      solved,
      state,
    };
    const firebaseUrl = getFirebaseDatabaseUrl();
    const url = firebaseUrl
      ? getFirebasePath("rooms", roomCode, "players", playerId)
      : `${getLocalRealtimeApiBase()}/api/rooms/${encodeURIComponent(roomCode)}/players/${encodeURIComponent(playerId)}`;

    const response = await (firebaseUrl ? fetchFirebase : fetch)(url, {
      body: JSON.stringify(playerState),
      headers: { "Content-Type": "application/json" },
      method: firebaseUrl ? "PUT" : "POST",
    });

    return response.ok;
  } catch {
    return false;
  }
};

const leaveSharedRoom = async ({ playerId, roomCode }) => {
  try {
    const firebaseUrl = getFirebaseDatabaseUrl();
    const url = firebaseUrl
      ? getFirebasePath("rooms", roomCode, "players", playerId)
      : `${getLocalRealtimeApiBase()}/api/rooms/${encodeURIComponent(roomCode)}/players/${encodeURIComponent(playerId)}`;

    await (firebaseUrl ? fetchFirebase : fetch)(url, {
      method: "DELETE",
    });
  } catch {
    // Local fallback still works when the shared server is unavailable.
  }
};

const createSharedSolution = async (solution) => {
  try {
    const firebaseUrl = getFirebaseDatabaseUrl();
    const id = `solution-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const payload = {
      ...solution,
      createdAt: new Date().toISOString(),
      id,
    };
    const url = firebaseUrl ? getFirebasePath("solutions", id) : `${getLocalRealtimeApiBase()}/api/solutions`;

    const response = await (firebaseUrl ? fetchFirebase : fetch)(url, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: firebaseUrl ? "PUT" : "POST",
    });

    return response.ok;
  } catch {
    return false;
  }
};

const voteSharedSolution = async (solutionId, metric, delta) => {
  try {
    const firebaseUrl = getFirebaseDatabaseUrl();
    const safeMetric = ["likes", "originality", "efficiency"].includes(metric) ? metric : "likes";

    if (firebaseUrl) {
      const solutionUrl = getFirebasePath("solutions", solutionId);
      const response = await fetchFirebase(`${solutionUrl}?ts=${Date.now()}`);
      const solution = response.ok ? await response.json() : null;
      const legacyMetric = safeMetric !== "likes" && Number(solution?.voteVersion ?? 0) < 2 && solution?.efficiency === undefined;
      const currentValue = legacyMetric ? 0 : Number(solution?.[safeMetric] ?? 0);
      const nextValue = Math.max(0, currentValue + delta);

      await fetchFirebase(solutionUrl, {
        body: JSON.stringify({ [safeMetric]: nextValue, voteVersion: 2 }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      return;
    }

    await fetch(`${getLocalRealtimeApiBase()}/api/solutions/${encodeURIComponent(solutionId)}/vote`, {
      body: JSON.stringify({ delta, metric: safeMetric }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch {
    // Optimistic local UI remains in place if the server is unavailable.
  }
};

const addLocalSolution = (solution, setSolutions) => {
  setSolutions((current) => [
    withSolutionVoteState({
      ...solution,
      id: `local-solution-${Date.now()}`,
    }, createEmptySolutionVotes()),
    ...current,
  ]);
};

const createOfflineChallenge = ({ fromNickname, toNickname }) => {
  const createdAt = new Date().toISOString();
  const problem = pickOfflineProblem(fromNickname, toNickname, createdAt);

  return {
    acceptedAt: null,
    createdAt,
    declinedAt: null,
    from: fromNickname,
    fromKey: normalizeNicknameKey(fromNickname),
    id: `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    problemId: problem.id,
    records: {},
    status: "pending",
    to: toNickname,
    toKey: normalizeNicknameKey(toNickname),
    updatedAt: createdAt,
  };
};

const pickOfflineProblem = (...seedParts) => {
  const seed = seedParts.join("|");
  const index = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % OFFLINE_PROBLEMS.length;

  return OFFLINE_PROBLEMS[index];
};

const getOfflineProblemById = (problemId) => OFFLINE_PROBLEMS.find((problem) => problem.id === problemId) ?? OFFLINE_PROBLEMS[0];

const normalizeNicknameKey = (value) => String(value || "guest").trim().toLowerCase().replace(/\s+/g, "-") || "guest";

const getChallengeOpponentKey = (challenge, nicknameKey) => (challenge.fromKey === nicknameKey ? challenge.toKey : challenge.fromKey);

const getChallengeOpponentName = (challenge, nicknameKey) => (challenge.fromKey === nicknameKey ? challenge.to : challenge.from);

const hasSentOfflineChallengeTo = (challenges, fromKey, toKey) =>
  challenges.some((challenge) => challenge.fromKey === fromKey && challenge.toKey === toKey);

const applyOfflineChallengePatch = (challenges, challengeId, patch) =>
  challenges.map((challenge) => {
    if (challenge.id !== challengeId) return challenge;

    return {
      ...challenge,
      ...patch,
      records: {
        ...(challenge.records ?? {}),
        ...(patch.records ?? {}),
      },
    };
  });

const createSharedOfflineChallenge = async (challenge) => {
  try {
    const firebaseUrl = getFirebaseDatabaseUrl();
    const url = firebaseUrl ? getFirebasePath("offlineChallenges", challenge.id) : `${getLocalRealtimeApiBase()}/api/offline-challenges`;

    const response = await (firebaseUrl ? fetchFirebase : fetch)(url, {
      body: JSON.stringify(challenge),
      headers: { "Content-Type": "application/json" },
      method: firebaseUrl ? "PUT" : "POST",
    });

    return response.ok;
  } catch {
    return false;
  }
};

const updateSharedOfflineChallenge = async (challengeId, patch) => {
  try {
    const firebaseUrl = getFirebaseDatabaseUrl();
    const url = firebaseUrl ? getFirebasePath("offlineChallenges", challengeId) : `${getLocalRealtimeApiBase()}/api/offline-challenges/${encodeURIComponent(challengeId)}`;

    const response = await (firebaseUrl ? fetchFirebase : fetch)(url, {
      body: JSON.stringify(patch),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    return response.ok;
  } catch {
    return false;
  }
};

const deleteSharedOfflineChallenge = async (challengeId) => {
  try {
    const firebaseUrl = getFirebaseDatabaseUrl();
    const url = firebaseUrl ? getFirebasePath("offlineChallenges", challengeId) : `${getLocalRealtimeApiBase()}/api/offline-challenges/${encodeURIComponent(challengeId)}`;
    const response = await (firebaseUrl ? fetchFirebase : fetch)(url, {
      method: "DELETE",
    });

    return response.ok;
  } catch {
    return false;
  }
};

const saveSharedOfflineRecord = async (challengeId, nicknameKey, record, status) => {
  try {
    const updatedAt = new Date().toISOString();
    const firebaseUrl = getFirebaseDatabaseUrl();

    if (firebaseUrl) {
      const recordResponse = await fetchFirebase(getFirebasePath("offlineChallenges", challengeId, "records", nicknameKey), {
        body: JSON.stringify(record),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });

      const statusResponse = await fetchFirebase(getFirebasePath("offlineChallenges", challengeId), {
        body: JSON.stringify({ status, updatedAt }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      return recordResponse.ok && statusResponse.ok;
    }

    const response = await fetch(`${getLocalRealtimeApiBase()}/api/offline-challenges/${encodeURIComponent(challengeId)}`, {
      body: JSON.stringify({
        records: {
          [nicknameKey]: record,
        },
        status,
        updatedAt,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    return response.ok;
  } catch {
    return false;
  }
};

const getOfflineChallengeStatusText = (status) => {
  if (status === "accepted") return "수락됨";
  if (status === "declined") return "거절됨";
  if (status === "finished") return "완료";
  return "대기 중";
};

const getOfflineDecisionLabel = (status) => {
  if (status === "declined") return "거절";
  if (status === "accepted" || status === "finished") return "수락";
  return "응답";
};

const getOfflineDecisionAt = (challenge) => {
  if (challenge.status === "declined") return challenge.declinedAt ?? null;
  if (challenge.status === "accepted" || challenge.status === "finished") return challenge.acceptedAt ?? null;
  return null;
};

const getOfflinePendingTimeText = (status) => (status === "pending" ? "응답 대기 중" : "시간 정보 없음");

const getOfflineChallengeTimeSummary = (challenge) => {
  const requestedAt = formatCompactChallengeDateTime(challenge.createdAt);
  const decisionAt = getOfflineDecisionAt(challenge);

  if (!decisionAt) return `요청 ${requestedAt} · ${getOfflinePendingTimeText(challenge.status)}`;

  return `요청 ${requestedAt} · ${getOfflineDecisionLabel(challenge.status)} ${formatCompactChallengeDateTime(decisionAt, { timeOnly: isSameDate(challenge.createdAt, decisionAt) })}`;
};

const formatCompactChallengeDateTime = (value, options = {}) => {
  if (!value) return "시간 정보 없음";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "시간 정보 없음";

  const parts = new Intl.DateTimeFormat("ko-KR", {
    day: options.timeOnly ? undefined : "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: options.timeOnly ? undefined : "2-digit",
  }).formatToParts(date);

  const part = (type) => parts.find((item) => item.type === type)?.value ?? "";
  if (options.timeOnly) return `${part("hour")}:${part("minute")}`;

  return `${part("month")}.${part("day")} ${part("hour")}:${part("minute")}`;
};

const isSameDate = (left, right) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) return false;

  return leftDate.getFullYear() === rightDate.getFullYear() && leftDate.getMonth() === rightDate.getMonth() && leftDate.getDate() === rightDate.getDate();
};

const getOfflineStatusVisual = (status) => {
  if (status === "accepted") {
    return {
      badgeClass: "bg-emerald-100 text-emerald-700",
      caption: "문제 풀이 가능",
      captionClass: "text-emerald-700",
      cardClass: "border-emerald-300 bg-emerald-50/80",
      icon: CheckCircle2,
      selectedCardClass: "border-emerald-500 bg-white shadow-lg ring-4 ring-emerald-200",
    };
  }

  if (status === "declined") {
    return {
      badgeClass: "bg-rose-100 text-rose-700",
      caption: "",
      captionClass: "",
      cardClass: "border-rose-300 bg-rose-50/80 opacity-90",
      icon: XCircle,
      selectedCardClass: "border-rose-300 bg-rose-50/80 opacity-90",
    };
  }

  if (status === "finished") {
    return {
      badgeClass: "bg-indigo-100 text-indigo-700",
      caption: "기록전 완료",
      captionClass: "text-indigo-700",
      cardClass: "border-indigo-300 bg-indigo-50/80",
      icon: Trophy,
      selectedCardClass: "border-indigo-500 bg-white shadow-lg ring-4 ring-indigo-200",
    };
  }

  return {
    badgeClass: "bg-amber-100 text-amber-700",
    caption: "",
    captionClass: "",
    cardClass: "border-amber-300 bg-amber-50/80 opacity-95",
    icon: Clock3,
    selectedCardClass: "border-amber-300 bg-amber-50/80 opacity-95",
  };
};

const getOfflineResultMessage = (mySeconds, opponentSeconds, opponentName) => {
  const mine = Number(mySeconds);
  const opponent = Number(opponentSeconds);

  if (mine < opponent) return `승리! ${opponentName}님보다 더 빠른 기록입니다.`;
  if (mine > opponent) return `패배. ${opponentName}님의 기록이 더 빠릅니다.`;
  return `${opponentName}님과 같은 기록입니다.`;
};

const getOnlineResult = (mySolved, opponentSolved) => {
  if (mySolved > opponentSolved) {
    return { live: "리드 중", title: "승리", detail: "상대보다 더 많은 문제를 풀었습니다." };
  }

  if (mySolved === opponentSolved) {
    return { live: "동점", title: "무승부", detail: "같은 개수의 문제를 해결했습니다." };
  }

  return { live: "추격 중", title: "패배", detail: "상대가 더 많은 문제를 해결했습니다." };
};

const getOnlineStateText = (state) => {
  if (state === "matching") return "상대의 대전 신청을 기다리는 중입니다.";
  if (state === "playing") return "상대 진행률과 남은 시간이 실시간으로 변합니다.";
  if (state === "finished") return "배틀이 종료되었습니다.";
  return "대전 신청을 누르면 상대와 준비 상태가 맞춰집니다.";
};

const getOpponentStateText = (state) => {
  if (state === "matching") return "대전 신청 완료";
  if (state === "playing") return "풀이 중";
  if (state === "finished") return "종료";
  return "대기 중";
};

const getOnlineBattleDetail = (state, opponentConnected, opponentName, opponentState) => {
  const name = opponentName ? `${opponentName}님` : "상대";

  if (state === "matching") {
    if (!opponentConnected) return "같은 방 상대가 입장하고 대전 신청을 눌러야 시작됩니다.";
    if (opponentState === "matching" || opponentState === "playing") return `${name}도 대전 신청을 눌러 배틀이 시작됩니다.`;
    return `${name}의 대전 신청을 기다리는 중입니다.`;
  }

  if (state === "playing") {
    return opponentConnected ? `${name}도 같은 방에서 풀이 중입니다.` : "상대 연결이 끊겨도 내 풀이는 계속 진행됩니다.";
  }

  return opponentConnected ? `${name} 입장됨 · ${getOpponentStateText(opponentState)}` : "대전이 시작되면 이름과 진행률이 표시됩니다.";
};

const getWeeklyStatusText = (status) => {
  if (status === "submitted") return "수정 불가";
  if (status === "abandoned") return "포기 처리";
  return "작성 중";
};

const getWeeklyBadgeClass = (status) => {
  if (status === "submitted") return "bg-emerald-50 text-emerald-600";
  if (status === "abandoned") return "bg-rose-50 text-rose-500";
  return "bg-indigo-50 text-indigo-600";
};

const formatTime = (totalSeconds) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const formatLongTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}분 ${seconds}초`;
};

export default WeeklyStatusFeature;
