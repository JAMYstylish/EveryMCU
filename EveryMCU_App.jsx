import React, { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Home,
  Newspaper,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import WeeklyStatusFeature from "./WeeklyStatusFeature.jsx";

const AlarmFeature = ({ nickname, onHome }) => (
  <DummyScreen
    icon={<Bell size={40} />}
    title="알람"
    description="수업, 과제, 코딩 배틀 알림을 관리하는 기능이 들어올 자리입니다."
    color="from-rose-500 to-pink-600"
    nickname={nickname}
    onHome={onHome}
  />
);

const CommunityFeature = ({ nickname, onHome }) => (
  <DummyScreen
    icon={<Users size={40} />}
    title="커뮤니티"
    description="풀이 공유, 질문, 스터디 모집 기능이 들어올 자리입니다."
    color="from-emerald-500 to-teal-600"
    nickname={nickname}
    onHome={onHome}
  />
);

const NewsFeature = ({ nickname, onHome }) => (
  <DummyScreen
    icon={<Newspaper size={40} />}
    title="최신기사"
    description="IT, 개발, 임베디드 최신 뉴스를 모아보는 기능이 들어올 자리입니다."
    color="from-amber-500 to-orange-600"
    nickname={nickname}
    onHome={onHome}
  />
);

const LearningTrackerFeature = ({ nickname, onHome }) => (
  <DummyScreen
    icon={<BookOpen size={40} />}
    title="학습추적"
    description="학습 시간, 진도, 연속 학습 기록을 추적하는 기능이 들어올 자리입니다."
    color="from-sky-500 to-blue-600"
    nickname={nickname}
    onHome={onHome}
  />
);

const DummyScreen = ({ icon, title, description, color, nickname, onHome }) => (
  <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
    <div
      className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${color} text-white shadow-2xl`}
    >
      {icon}
    </div>
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-sm leading-relaxed text-gray-400">{description}</p>
      <p className="mt-3 text-xs font-medium text-indigo-400">{nickname}님, 기능 개발 중이에요.</p>
    </div>
    <button
      type="button"
      onClick={onHome}
      className="flex items-center gap-2 rounded-2xl bg-gray-100 px-6 py-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600"
    >
      <Home size={16} />
      홈으로 돌아가기
    </button>
  </div>
);

const TABS = [
  { id: "alarm", label: "알람", icon: Bell, Component: AlarmFeature },
  { id: "weekly", label: "주간코황", icon: Calendar, Component: WeeklyStatusFeature },
  { id: "community", label: "커뮤니티", icon: Users, Component: CommunityFeature },
  { id: "news", label: "최신기사", icon: Newspaper, Component: NewsFeature },
  { id: "learning", label: "학습추적", icon: BookOpen, Component: LearningTrackerFeature },
];

const gradients = {
  alarm: "from-rose-400 to-pink-500",
  weekly: "from-violet-400 to-purple-500",
  community: "from-emerald-400 to-teal-500",
  news: "from-amber-400 to-orange-500",
  learning: "from-sky-400 to-blue-500",
};

const SplashScreen = ({ onNext }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 100);
    const nextTimer = window.setTimeout(() => onNext(), 1600);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(nextTimer);
    };
  }, [onNext]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)" }}
    >
      <div
        className="absolute left-10 top-20 h-32 w-32 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }}
      />
      <div
        className="absolute bottom-32 right-8 h-48 w-48 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #818cf8, transparent)" }}
      />

      <div
        className="flex flex-col items-center gap-5 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}
      >
        <div
          className="flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl"
          style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8)" }}
        >
          <Sparkles size={44} color="white" />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-black tracking-normal text-white">에브리엠씨유</h1>
          <p className="mt-2 text-sm font-medium tracking-widest text-indigo-300">EVERY MCU</p>
        </div>

        <p className="mt-4 text-sm text-indigo-200 opacity-70">개발자를 위한 모든 것</p>
      </div>

      <div className="absolute bottom-16 h-1 w-40 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full transition-all"
          style={{
            background: "linear-gradient(90deg, #a78bfa, #818cf8)",
            width: visible ? "100%" : "0%",
            transition: "width 1.5s ease-in-out",
          }}
        />
      </div>
    </div>
  );
};

const NicknameScreen = ({ onConfirm }) => {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    const trimmed = input.trim();

    if (!trimmed) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }

    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-8"
      style={{ background: "linear-gradient(160deg, #f8faff 0%, #eef2ff 100%)" }}
    >
      <div
        className="absolute right-0 top-0 h-64 w-64 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #c7d2fe, transparent)", transform: "translate(30%, -30%)" }}
      />

      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <User size={30} color="white" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">닉네임을 설정하세요</h2>
            <p className="mt-1 text-sm text-gray-400">에브리엠씨유에서 사용할 이름이에요</p>
          </div>
        </div>

        <div className={`transition-transform duration-150 ${shake ? "animate-bounce" : ""}`}>
          <div
            className="relative overflow-hidden rounded-2xl border-2 bg-white transition-all duration-200"
            style={{
              borderColor: focused ? "#6366f1" : "#e5e7eb",
              boxShadow: focused ? "0 0 0 4px rgba(99,102,241,0.12)" : "none",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
              placeholder="닉네임 입력 (최대 10자)"
              maxLength={10}
              className="w-full bg-transparent px-5 py-4 text-base text-gray-800 outline-none placeholder-gray-300"
            />
            {input && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                {input.length}/10
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all duration-200 active:scale-95"
          style={{
            background: input.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#e5e7eb",
            color: input.trim() ? "white" : "#9ca3af",
            cursor: input.trim() ? "pointer" : "default",
            boxShadow: input.trim() ? "0 8px 24px rgba(99,102,241,0.35)" : "none",
          }}
        >
          시작하기
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

const DEFAULT_PROFILE_AVATAR = "🧑‍💻";
const cleanProfileAvatar = (avatar) => String(avatar || DEFAULT_PROFILE_AVATAR).trim().slice(0, 8) || DEFAULT_PROFILE_AVATAR;

const HomeScreen = ({ nickname, avatar = DEFAULT_PROFILE_AVATAR }) => {
  const [activeTab, setActiveTab] = useState(null);
  const activeTabData = TABS.find((tab) => tab.id === activeTab);
  const profileAvatar = cleanProfileAvatar(avatar);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f5f7ff]">
      <header
        className="flex shrink-0 items-center justify-between px-5 py-3"
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          minHeight: "56px",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} color="#a78bfa" />
          <span className="text-lg font-black tracking-normal text-white">에브리엠씨유</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-white text-xs shadow-sm">{profileAvatar}</span>
          <span className="text-xs font-medium text-indigo-200">{nickname}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {activeTabData ? (
          <activeTabData.Component nickname={nickname} avatar={profileAvatar} onHome={() => setActiveTab(null)} />
        ) : (
          <div className="p-5">
            <p className="mb-4 text-sm text-gray-400">
              <span className="font-semibold text-indigo-600">{nickname}</span>님, 안녕하세요.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TABS.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-br ${gradients[tab.id]} p-4 text-white shadow-lg transition-transform duration-150 active:scale-95`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Icon size={20} />
                    </div>
                    <span className="text-sm font-bold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <nav
        className="flex shrink-0 items-center justify-around border-t px-2 py-2"
        style={{
          background: "white",
          borderColor: "#e8eaf6",
          boxShadow: "0 -4px 20px rgba(99,102,241,0.08)",
          paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
        }}
      >
        <TabButton active={activeTab === null} icon={Home} label="홈" onClick={() => setActiveTab(null)} />
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            icon={tab.icon}
            label={tab.label}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </nav>
    </div>
  );
};

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 transition-all duration-150"
    style={{ color: active ? "#6366f1" : "#9ca3af" }}
  >
    <div
      className="flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-150"
      style={{ background: active ? "#eef2ff" : "transparent" }}
    >
      <Icon size={16} />
    </div>
    <span className="max-w-[54px] truncate text-[10px] font-semibold">{label}</span>
  </button>
);

const readNicknameFromUrl = () => {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("nick")?.trim() || "";
};

const readAvatarFromUrl = () => {
  if (typeof window === "undefined") return DEFAULT_PROFILE_AVATAR;
  return cleanProfileAvatar(new URLSearchParams(window.location.search).get("avatar") || DEFAULT_PROFILE_AVATAR);
};

export default function App() {
  const urlNickname = readNicknameFromUrl();
  const urlAvatar = readAvatarFromUrl();
  const [screen, setScreen] = useState(urlNickname ? "weekly" : "splash");
  const [nickname, setNickname] = useState(urlNickname);
  const [avatar] = useState(urlAvatar);

  const handleNicknameConfirm = (name) => {
    setNickname(name);
    setScreen("home");
  };

  const handleWeeklyHome = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "EVERYMCU_GO_HOME" }, "*");
      return;
    }
    setScreen("home");
  };

  if (screen === "splash") {
    return <SplashScreen onNext={() => setScreen("nickname")} />;
  }

  if (screen === "nickname") {
    return <NicknameScreen onConfirm={handleNicknameConfirm} />;
  }

  if (screen === "weekly") {
    return <WeeklyStatusFeature nickname={nickname || "guest"} avatar={avatar} onHome={handleWeeklyHome} />;
  }

  return <HomeScreen nickname={nickname} avatar={avatar} />;
}
