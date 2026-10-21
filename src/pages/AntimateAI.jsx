// ============================================================
// ANTIMATE AI — FRONTEND
// SOCKET.IO VOICE STREAMING
// ============================================================
//
// FEATURES
//
// 1. Voice streaming through Socket.IO
// 2. Kinyarwanda transcript
// 3. Kinyarwanda answer streaming on screen
// 4. Audio response playback
// 5. Hold-to-record
// 6. Short click = ~1.8 second recording
// 7. Socket reconnect
// 8. Screen Wake Lock while voice session is active
// 9. Prevent duplicate assistant messages
//
// BACKEND SOCKET EVENTS:
//
// CLIENT -> SERVER
//   antimate:voice:start
//   antimate:voice:chunk
//   antimate:voice:end
//   antimate:voice:cancel
//
// SERVER -> CLIENT
//   antimate:status
//   antimate:transcript
//   antimate:thinking
//   antimate:answer
//   antimate:answer:chunk
//   antimate:audio
//   antimate:complete
//   antimate:error
//
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

// ============================================================
// CONFIG
// ============================================================

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_URL ||
  window.location.origin;

const CHAT_URL =
  `${API_URL}/api/antimate/chat`;

const HOLD_TO_RECORD_MS = 450;

const MAX_RECORDING_MS =
  Number(
    import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

const CHUNK_INTERVAL_MS = 250;

// ============================================================
// MIME TYPE
// ============================================================

function getSupportedMimeType() {
  if (
    typeof MediaRecorder === "undefined"
  ) {
    return "";
  }

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const type of types) {
    try {
      if (
        MediaRecorder.isTypeSupported(type)
      ) {
        return type;
      }
    } catch {
      // Ignore unsupported type
    }
  }

  return "";
}

// ============================================================
// MIME EXTENSION
// ============================================================

function extensionFromMimeType(
  mimeType
) {
  const mime =
    String(
      mimeType || ""
    ).toLowerCase();

  if (mime.includes("ogg")) {
    return ".ogg";
  }

  if (mime.includes("mp4")) {
    return ".mp4";
  }

  if (mime.includes("mpeg")) {
    return ".mp3";
  }

  return ".webm";
}

// ============================================================
// AUDIO URL
// ============================================================

function getAudioUrl(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      value.url ||
      value.audio_url ||
      value.audioUrl ||
      value.path ||
      null
    );
  }

  return null;
}

// ============================================================
// ABSOLUTE URL
// ============================================================

function makeAbsoluteUrl(url) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("file://")) {
    return null;
  }

  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return url;
}

// ============================================================
// CONVERSATION STORAGE
// Guest and signed-in chats are separated in this browser.
// Cross-device history requires matching backend endpoints.
// ============================================================

function createConversationId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getChatStorageScope() {
  if (typeof window === "undefined") return "guest-server";
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      let guestId = localStorage.getItem("antimate_guest_id");
      if (!guestId) {
        guestId = createConversationId();
        localStorage.setItem("antimate_guest_id", guestId);
      }
      return `guest-${guestId}`;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    let tokenId = "account";
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      tokenId = payload.id || payload.userId || payload.sub || "account";
    } catch {}
    const identity = user._id || user.id || user.userId || user.email || tokenId;
    return `user-${String(identity).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  } catch {
    return "guest-local";
  }
}

function getConversationStorageKey(scope) {
  return `antimate_conversations_v1:${scope}`;
}

function getActiveConversationKey(scope) {
  return `antimate_active_conversation_v1:${scope}`;
}

function loadStoredConversations(scope) {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(getConversationStorageKey(scope)) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && item.id && Array.isArray(item.messages))
      : [];
  } catch {
    return [];
  }
}

function getInitialConversationId(scope) {
  const chats = loadStoredConversations(scope);
  try {
    const selected = localStorage.getItem(getActiveConversationKey(scope));
    if (selected && chats.some((chat) => chat.id === selected)) return selected;
  } catch {}
  return chats[0]?.id || createConversationId();
}

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {

  // ==========================================================
  // INLINE STYLES — no external AntimateAI.css required
  // ==========================================================
  const styles = `
    * { box-sizing: border-box; }

    .antimate-ai {
      --bg: #06111f;
      --surface: rgba(10, 25, 43, 0.82);
      --surface-2: rgba(18, 39, 63, 0.78);
      --border: rgba(148, 163, 184, 0.16);
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #22c55e;
      --accent-2: #06b6d4;
      --danger: #ef4444;
      --shadow: 0 24px 70px rgba(0,0,0,.35);
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      color: var(--text);
      background:
        radial-gradient(circle at 15% 10%, rgba(6,182,212,.12), transparent 28%),
        radial-gradient(circle at 85% 15%, rgba(34,197,94,.10), transparent 25%),
        linear-gradient(145deg, #030712 0%, #071827 48%, #06111f 100%);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }

    .antimate-ai button, .antimate-ai textarea { font: inherit; }

    .antimate-header {
      position: sticky; top: 0; z-index: 20;
      min-height: 76px; display: flex; align-items: center;
      justify-content: space-between; gap: 16px;
      padding: 14px clamp(16px, 4vw, 42px);
      background: rgba(3,7,18,.78);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(18px);
    }

    .antimate-brand { display:flex; align-items:center; gap:12px; min-width:0; }
    .antimate-brand h1 {
      margin:0; font-size:clamp(17px,2.2vw,23px);
      line-height:1.1; letter-spacing:.04em; font-weight:800;
    }
    .antimate-subtitle {
      display:block; margin-top:4px; color:var(--muted);
      font-size:11px; letter-spacing:.05em;
    }

    .antimate-logo, .antimate-empty-logo {
      position:relative; flex:0 0 auto; display:grid; place-items:center;
      border-radius:50%;
      background:conic-gradient(from 0deg,#22c55e,#06b6d4,#8b5cf6,#22c55e);
      box-shadow:0 0 28px rgba(34,197,94,.24);
      animation:antimate-spin 7s linear infinite;
    }
    .antimate-logo { width:43px; height:43px; }
    .antimate-logo::before, .antimate-empty-logo::before {
      content:""; position:absolute; inset:3px; border-radius:inherit; background:#06111f;
    }
    .antimate-logo span, .antimate-empty-logo span {
      position:relative; z-index:1; width:38%; height:38%;
      border:2px solid #fff; border-radius:50%;
      box-shadow:0 0 14px rgba(255,255,255,.7);
    }

    .antimate-connection {
      display:flex; align-items:center; gap:8px; padding:8px 12px;
      border:1px solid var(--border); border-radius:999px;
      background:rgba(15,23,42,.65); color:var(--muted);
      font-size:12px; white-space:nowrap;
    }
    .connection-dot, .status-indicator {
      width:8px; height:8px; border-radius:50%;
      background:#64748b; box-shadow:0 0 10px currentColor;
    }
    .antimate-connection.online { color:#86efac; }
    .antimate-connection.online .connection-dot {
      background:#22c55e; color:#22c55e; animation:antimate-pulse 1.8s infinite;
    }

    .antimate-workspace {
      display:flex; align-items:stretch; gap:16px; width:100%; flex:1; min-height:0;
      padding:16px clamp(10px,2vw,22px) 24px;
    }
    .antimate-sidebar {
      width:260px; flex:0 0 260px; min-height:0; display:flex; flex-direction:column;
      border:1px solid var(--border); border-radius:18px; overflow:hidden;
      background:rgba(8,20,34,.72); backdrop-filter:blur(14px);
    }
    .antimate-sidebar-top { padding:14px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:10px; }
    .antimate-sidebar-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:12px; font-weight:800; letter-spacing:.08em; color:var(--muted); text-transform:uppercase; }
    .antimate-new-chat { width:100%; border:1px solid rgba(34,197,94,.35); border-radius:12px; padding:11px 12px; cursor:pointer; color:#d1fae5; background:linear-gradient(135deg,rgba(22,163,74,.22),rgba(6,182,212,.12)); text-align:left; font-weight:750; }
    .antimate-conversation-list { overflow:auto; padding:8px; display:flex; flex-direction:column; gap:5px; }
    .antimate-conversation-item { display:flex; align-items:center; gap:4px; padding:4px; border-radius:11px; border:1px solid transparent; }
    .antimate-conversation-item.active { background:rgba(34,197,94,.11); border-color:rgba(34,197,94,.28); }
    .antimate-conversation-open { min-width:0; flex:1; border:0; background:transparent; color:var(--text); cursor:pointer; text-align:left; padding:8px; }
    .antimate-conversation-title { display:block; font-size:12px; font-weight:700; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
    .antimate-conversation-date { display:block; margin-top:4px; color:var(--muted); font-size:10px; }
    .antimate-conversation-delete { border:0; border-radius:8px; padding:6px 8px; color:var(--muted); background:transparent; cursor:pointer; }
    .antimate-conversation-delete:hover { color:#fca5a5; background:rgba(239,68,68,.12); }
    .antimate-sidebar-note { margin-top:auto; padding:12px 14px; border-top:1px solid var(--border); color:var(--muted); font-size:10px; line-height:1.5; }
    .antimate-header-actions { display:flex; align-items:center; gap:8px; }
    .antimate-header-button { border:1px solid var(--border); border-radius:10px; padding:8px 10px; color:var(--text); background:rgba(15,23,42,.55); cursor:pointer; font-size:12px; }
    .antimate-account-state { font-size:10px; color:var(--muted); }
    .antimate-main {
      width:min(100%,980px); margin:0 auto; padding:0;
      display:flex; flex-direction:column; flex:1; min-width:0; min-height:0;
    }

    .antimate-chat {
      position:relative; flex:1; min-height:430px;
      max-height:calc(100vh - 245px); overflow-y:auto;
      padding:12px 3px 18px;
      scrollbar-width:thin; scrollbar-color:rgba(148,163,184,.25) transparent;
    }
    .antimate-chat::-webkit-scrollbar { width:6px; }
    .antimate-chat::-webkit-scrollbar-thumb { background:rgba(148,163,184,.25); border-radius:99px; }

    .antimate-empty {
      min-height:410px; display:flex; flex-direction:column;
      align-items:center; justify-content:center; text-align:center; padding:30px 18px;
    }
    .antimate-empty-logo {
      width:92px; height:92px; margin-bottom:24px;
      box-shadow:0 0 55px rgba(6,182,212,.18);
    }
    .antimate-empty-logo::before { inset:5px; background:#071827; }
    .antimate-empty-logo span { width:32%; height:32%; border-width:3px; }
    .antimate-empty h2 {
      margin:0 0 9px; font-size:clamp(24px,5vw,34px); font-weight:800;
      background:linear-gradient(90deg,#fff,#a7f3d0,#67e8f9);
      -webkit-background-clip:text; background-clip:text; color:transparent;
    }
    .antimate-empty p { max-width:420px; margin:0; color:var(--muted); font-size:14px; }

    .antimate-messages { display:flex; flex-direction:column; gap:14px; }
    .antimate-message {
      display:flex; flex-direction:column; max-width:min(82%,720px);
      animation:antimate-message-in .25s ease-out;
    }
    .antimate-message.user { align-self:flex-end; align-items:flex-end; }
    .antimate-message.assistant { align-self:flex-start; align-items:flex-start; }

    .message-bubble {
      padding:12px 15px; border-radius:18px; line-height:1.6;
      font-size:14px; white-space:pre-wrap; word-break:break-word;
      box-shadow:0 10px 28px rgba(0,0,0,.16);
    }
    .antimate-message.user .message-bubble {
      color:#ecfdf5; background:linear-gradient(135deg,rgba(22,163,74,.95),rgba(5,150,105,.88));
      border-bottom-right-radius:5px;
    }
    .antimate-message.assistant .message-bubble {
      color:#e2e8f0; background:linear-gradient(145deg,rgba(15,32,52,.95),rgba(20,42,67,.84));
      border:1px solid rgba(148,163,184,.14); border-bottom-left-radius:5px;
    }
    .message-mode {
      margin:5px 4px 0; color:#64748b; font-size:9px;
      font-weight:800; letter-spacing:.12em; text-transform:uppercase;
    }

    .antimate-live-transcript, .antimate-current-answer, .antimate-thinking {
      margin-top:12px; border:1px solid var(--border);
      background:rgba(15,23,42,.62); border-radius:16px; padding:11px 14px;
      backdrop-filter:blur(12px); animation:antimate-fade .2s ease-out;
    }
    .antimate-live-transcript span {
      color:#67e8f9; font-size:10px; font-weight:800;
      text-transform:uppercase; letter-spacing:.08em;
    }
    .antimate-live-transcript p { margin:5px 0 0; color:#cbd5e1; font-size:13px; line-height:1.5; }

    .antimate-thinking { display:flex; align-items:center; gap:10px; color:#cbd5e1; font-size:13px; }
    .thinking-dots { display:flex; gap:4px; }
    .thinking-dots span {
      width:6px; height:6px; border-radius:50%; background:#22c55e;
      animation:antimate-bounce 1s infinite ease-in-out;
    }
    .thinking-dots span:nth-child(2) { animation-delay:.15s; }
    .thinking-dots span:nth-child(3) { animation-delay:.3s; }
    .antimate-thinking small { margin-left:auto; color:#64748b; font-weight:700; }

    .antimate-current-answer {
      color:#d1fae5; border-color:rgba(34,197,94,.18);
      background:linear-gradient(145deg,rgba(6,78,59,.22),rgba(15,23,42,.68));
      line-height:1.65; font-size:14px; white-space:pre-wrap; word-break:break-word;
    }

    .antimate-status {
      min-height:38px; display:flex; align-items:center; gap:9px; margin:8px 0;
      padding:8px 12px; color:var(--muted); font-size:11px; border-radius:12px;
      background:rgba(15,23,42,.52); border:1px solid var(--border);
    }
    .antimate-status.ready .status-indicator { background:#22c55e; color:#22c55e; }
    .antimate-status.recording .status-indicator {
      background:#ef4444; color:#ef4444; animation:antimate-pulse .9s infinite;
    }
    .antimate-status.processing .status-indicator,
    .antimate-status.uploaded .status-indicator,
    .antimate-status.receiving .status-indicator {
      background:#06b6d4; color:#06b6d4; animation:antimate-pulse 1s infinite;
    }
    .antimate-status.speaking .status-indicator { background:#a78bfa; color:#a78bfa; }
    .antimate-status.error .status-indicator { background:#ef4444; color:#ef4444; }
    .status-mode {
      margin-left:auto; padding:3px 7px; border-radius:999px;
      background:rgba(148,163,184,.1); color:#94a3b8; font-size:9px; font-weight:800;
    }

    .antimate-error {
      display:flex; align-items:center; gap:10px; margin:7px 0; padding:10px 12px;
      color:#fecaca; background:rgba(127,29,29,.25);
      border:1px solid rgba(239,68,68,.28); border-radius:12px; font-size:12px;
    }
    .antimate-error span { flex:1; }
    .antimate-error button {
      border:0; background:transparent; color:#fca5a5; font-size:22px;
      line-height:1; cursor:pointer; padding:0 3px;
    }

    .antimate-voice-control {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      padding:9px 0 13px;
    }
    .antimate-record-button {
      position:relative; width:82px; height:82px; display:grid; place-items:center;
      border:0; border-radius:50%; color:white;
      background:linear-gradient(145deg,#16a34a,#059669);
      box-shadow:0 12px 34px rgba(16,185,129,.24),inset 0 1px 0 rgba(255,255,255,.25);
      cursor:pointer; touch-action:none; user-select:none; -webkit-user-select:none;
      transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;
    }
    .antimate-record-button:hover:not(:disabled) {
      transform:translateY(-2px) scale(1.03); box-shadow:0 16px 42px rgba(16,185,129,.32);
    }
    .antimate-record-button:active:not(:disabled) { transform:scale(.96); }
    .antimate-record-button:disabled { cursor:not-allowed; opacity:.52; filter:grayscale(.25); }
    .record-button-ring {
      position:absolute; inset:-8px; border:1px solid rgba(34,197,94,.25);
      border-radius:50%; pointer-events:none;
    }
    .antimate-record-button.recording {
      background:linear-gradient(145deg,#dc2626,#b91c1c);
      box-shadow:0 0 0 9px rgba(239,68,68,.09),0 0 44px rgba(239,68,68,.38);
      animation:antimate-recording 1.15s infinite ease-in-out;
    }
    .antimate-record-button.recording .record-button-ring {
      border-color:rgba(239,68,68,.38); animation:antimate-ring 1.15s infinite;
    }
    .antimate-record-button.processing {
      background:linear-gradient(145deg,#0891b2,#2563eb);
      box-shadow:0 0 35px rgba(6,182,212,.28);
    }
    .antimate-record-button.speaking {
      background:linear-gradient(145deg,#7c3aed,#4f46e5);
      box-shadow:0 0 35px rgba(124,58,237,.28);
    }
    .record-icon { position:relative; z-index:2; font-size:28px; line-height:1; }
    .voice-help { margin-top:14px; color:#64748b; font-size:11px; text-align:center; }

    .antimate-input {
      display:flex; align-items:flex-end; gap:9px; padding:9px;
      border:1px solid var(--border); border-radius:18px;
      background:rgba(15,23,42,.76); box-shadow:var(--shadow); backdrop-filter:blur(16px);
    }
    .antimate-input textarea {
      flex:1; min-width:0; max-height:120px; resize:none; border:0; outline:0;
      padding:10px 8px; color:#f8fafc; background:transparent; line-height:1.45; font-size:13px;
    }
    .antimate-input textarea::placeholder { color:#64748b; }
    .antimate-input textarea:disabled { opacity:.5; }
    .antimate-send-button {
      width:42px; height:42px; flex:0 0 42px; display:grid; place-items:center;
      border:0; border-radius:13px; color:white;
      background:linear-gradient(135deg,#059669,#06b6d4);
      font-size:19px; cursor:pointer; transition:transform .18s ease,opacity .18s ease;
    }
    .antimate-send-button:hover:not(:disabled) { transform:scale(1.05); }
    .antimate-send-button:disabled { opacity:.35; cursor:not-allowed; }

    @keyframes antimate-spin { to { transform:rotate(360deg); } }
    @keyframes antimate-pulse {
      0%,100% { transform:scale(1); opacity:1; }
      50% { transform:scale(1.35); opacity:.55; }
    }
    @keyframes antimate-bounce {
      0%,80%,100% { transform:translateY(0); opacity:.45; }
      40% { transform:translateY(-5px); opacity:1; }
    }
    @keyframes antimate-recording {
      0%,100% { transform:scale(1); } 50% { transform:scale(1.045); }
    }
    @keyframes antimate-ring {
      0% { transform:scale(.95); opacity:1; } 100% { transform:scale(1.18); opacity:0; }
    }
    @keyframes antimate-message-in {
      from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); }
    }
    @keyframes antimate-fade { from { opacity:0; } to { opacity:1; } }

    @media (max-width:640px) {
      .antimate-header { min-height:66px; padding:10px 13px; }
      .antimate-logo { width:38px; height:38px; }
      .antimate-subtitle { font-size:9px; }
      .antimate-connection { padding:7px 9px; font-size:10px; }
      .antimate-workspace { padding:8px; gap:0; position:relative; }
      .antimate-sidebar { display:none; }
      .antimate-sidebar.open { display:flex; position:absolute; z-index:30; top:8px; bottom:8px; left:8px; width:min(82vw,300px); box-shadow:0 24px 70px rgba(0,0,0,.45); }
      .antimate-main { padding:8px 5px 12px; }
      .antimate-chat { min-height:350px; max-height:calc(100vh - 230px); }
      .antimate-header-actions { gap:5px; }
      .antimate-header-button { padding:7px 8px; font-size:11px; }
      .antimate-connection { display:none; }
      .antimate-message { max-width:91%; }
      .message-bubble { padding:10px 12px; font-size:13px; }
      .antimate-record-button { width:74px; height:74px; }
      .voice-help { font-size:10px; }
    }

    @media (prefers-reduced-motion:reduce) {
      .antimate-ai *, .antimate-ai *::before, .antimate-ai *::after {
        animation-duration:.001ms !important;
        animation-iteration-count:1 !important;
        scroll-behavior:auto !important;
      }
    }
  `;

  // ==========================================================
  // SOCKET
  // ==========================================================

  const socketRef =
    useRef(null);

  // ==========================================================
  // MEDIA
  // ==========================================================

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const recordingStartedAtRef =
    useRef(0);

  const holdTimerRef =
    useRef(null);

  const autoStopTimerRef =
    useRef(null);

  const shortClickTimerRef =
    useRef(null);

  const isHoldingRef =
    useRef(false);

  const isRecordingRef =
    useRef(false);

  // ==========================================================
  // AUDIO
  // ==========================================================

  const audioRef =
    useRef(null);

  // ==========================================================
  // WAKE LOCK
  // ==========================================================

  const wakeLockRef =
    useRef(null);

  const voiceSessionActiveRef =
    useRef(false);

  // ==========================================================
  // LIVE ASSISTANT MESSAGE
  // ==========================================================

  const liveAssistantMessageIdRef =
    useRef(null);

  // ==========================================================
  // STATE
  // ==========================================================

  const [storageScope] = useState(() => getChatStorageScope());

  const [conversations, setConversations] = useState(() =>
    loadStoredConversations(getChatStorageScope())
  );

  const [activeConversationId, setActiveConversationId] = useState(() =>
    getInitialConversationId(getChatStorageScope())
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [messages, setMessages] = useState(() => {
    const scope = getChatStorageScope();
    const chats = loadStoredConversations(scope);
    const activeId = getInitialConversationId(scope);
    return chats.find((chat) => chat.id === activeId)?.messages || [];
  });

  const [text, setText] =
    useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [status, setStatus] =
    useState("ready");

  const [statusMessage, setStatusMessage] =
    useState(
      "Kanda microphone utangire kuvuga."
    );

  const [processingMode, setProcessingMode] =
    useState(null);

  const [transcript, setTranscript] =
    useState("");

  const [thinkingText, setThinkingText] =
    useState("");

  const [currentAnswer, setCurrentAnswer] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================================
  // SAVE / RESTORE CONVERSATION HISTORY
  // ==========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        getActiveConversationKey(storageScope),
        activeConversationId
      );
    } catch (error) {
      console.warn("Could not save active ANTIMATE conversation", error);
    }
  }, [activeConversationId, storageScope]);

  useEffect(() => {
    if (!activeConversationId || messages.length === 0) return;

    setConversations((previous) => {
      const existing = previous.find((chat) => chat.id === activeConversationId);
      const firstUserMessage = messages.find((message) => message.role === "user")?.text || "";
      const conversation = {
        id: activeConversationId,
        title: existing?.title || firstUserMessage.slice(0, 48) || "Ikiganiro gishya",
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
        messages: messages.map((message) => ({
          id: message.id || `${message.role}-${message.createdAt || Date.now()}`,
          role: message.role === "user" ? "user" : "assistant",
          text: String(message.text || ""),
          mode: message.mode || null,
          createdAt: message.createdAt || Date.now(),
        })),
      };

      const next = [conversation, ...previous.filter((chat) => chat.id !== activeConversationId)]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 100);

      try {
        localStorage.setItem(getConversationStorageKey(storageScope), JSON.stringify(next));
      } catch (error) {
        console.warn("Could not persist ANTIMATE conversations", error);
      }
      return next;
    });
  }, [messages, activeConversationId, storageScope]);

  const createNewConversation = useCallback(() => {
    if (isProcessing || isRecording) return;
    const id = createConversationId();
    setActiveConversationId(id);
    setMessages([]);
    setText("");
    setTranscript("");
    setCurrentAnswer("");
    setThinkingText("");
    setErrorMessage("");
    setStatus("ready");
    setStatusMessage("Kanda microphone utangire kuvuga.");
    setSidebarOpen(false);
  }, [isProcessing, isRecording]);

  const openConversation = useCallback((conversation) => {
    if (!conversation || isProcessing || isRecording) return;
    setActiveConversationId(conversation.id);
    setMessages(Array.isArray(conversation.messages) ? conversation.messages : []);
    setText("");
    setTranscript("");
    setCurrentAnswer("");
    setThinkingText("");
    setErrorMessage("");
    setStatus("ready");
    setStatusMessage("Ikiganiro cyafunguwe.");
    setSidebarOpen(false);
  }, [isProcessing, isRecording]);

  const deleteConversation = useCallback((conversationId) => {
    const confirmed = window.confirm("Urifuza gusiba iki kiganiro? Ibi ntibishobora gusubizwa.");
    if (!confirmed) return;
    const next = conversations.filter((chat) => chat.id !== conversationId);
    setConversations(next);
    try {
      localStorage.setItem(getConversationStorageKey(storageScope), JSON.stringify(next));
    } catch {}
    if (activeConversationId === conversationId) {
      const nextActive = next[0];
      setActiveConversationId(nextActive?.id || createConversationId());
      setMessages(nextActive?.messages || []);
      setCurrentAnswer("");
      setTranscript("");
      setErrorMessage("");
    }
  }, [conversations, storageScope, activeConversationId]);

  // ==========================================================
  // WAKE LOCK — REQUEST
  // ==========================================================

  const requestWakeLock =
    useCallback(
      async () => {
        if (
          !("wakeLock" in navigator)
        ) {
          console.warn(
            "⚠️ Wake Lock ntabwo ishyigikiwe."
          );
          return;
        }

        if (
          !voiceSessionActiveRef.current
        ) {
          return;
        }

        try {
          if (
            wakeLockRef.current &&
            !wakeLockRef.current.released
          ) {
            return;
          }

          const wakeLock =
            await navigator.wakeLock.request(
              "screen"
            );

          wakeLockRef.current =
            wakeLock;

          console.log(
            "🔒 ANTIMATE Wake Lock enabled."
          );

          wakeLock.addEventListener(
            "release",
            () => {
              console.log(
                "🔓 ANTIMATE Wake Lock released."
              );

              wakeLockRef.current =
                null;
            }
          );
        } catch (error) {
          console.warn(
            "⚠️ Wake Lock request failed:",
            error
          );
        }
      },
      []
    );

  // ==========================================================
  // WAKE LOCK — RELEASE
  // ==========================================================

  const releaseWakeLock =
    useCallback(
      async () => {
        if (
          wakeLockRef.current
        ) {
          try {
            await wakeLockRef.current.release();
          } catch {}

          wakeLockRef.current =
            null;
        }
      },
      []
    );

  // ==========================================================
  // REACQUIRE WAKE LOCK WHEN PAGE RETURNS
  // ==========================================================

  useEffect(() => {
    const handleVisibilityChange =
      async () => {
        if (
          document.visibilityState ===
            "visible" &&
          voiceSessionActiveRef.current
        ) {
          console.log(
            "👁️ Page visible again — restoring Wake Lock."
          );

          await requestWakeLock();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [requestWakeLock]);

  // ==========================================================
  // STOP MEDIA TRACKS
  // ==========================================================

  const stopMediaTracks =
    useCallback(() => {
      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {}
          });

        mediaStreamRef.current =
          null;
      }
    }, []);

  // ==========================================================
  // UPDATE LIVE ASSISTANT MESSAGE
  // ==========================================================

  const updateLiveAssistantMessage =
    useCallback(
      (
        answer,
        mode = "gpu"
      ) => {
        if (
          !answer ||
          !answer.trim()
        ) {
          return;
        }

        const cleanAnswer =
          answer.trim();

        setMessages(
          (previous) => {
            const liveId =
              liveAssistantMessageIdRef.current;

            // --------------------------------------------------
            // CREATE LIVE MESSAGE
            // --------------------------------------------------

            if (!liveId) {
              const id =
                `assistant-live-${Date.now()}-${Math.random()}`;

              liveAssistantMessageIdRef.current =
                id;

              return [
                ...previous,
                {
                  id,
                  role: "assistant",
                  text: cleanAnswer,
                  mode,
                  live: true,
                  createdAt: Date.now(),
                },
              ];
            }

            // --------------------------------------------------
            // UPDATE EXISTING LIVE MESSAGE
            // --------------------------------------------------

            return previous.map(
              (message) =>
                message.id === liveId
                  ? {
                      ...message,
                      text: cleanAnswer,
                      mode,
                      live: true,
                    }
                  : message
            );
          }
        );
      },
      []
    );

  // ==========================================================
  // FINALIZE LIVE ASSISTANT MESSAGE
  // ==========================================================

  const finalizeLiveAssistantMessage =
    useCallback(
      (
        answer,
        mode = "gpu"
      ) => {
        if (
          !answer ||
          !answer.trim()
        ) {
          return;
        }

        const cleanAnswer =
          answer.trim();

        setMessages(
          (previous) => {
            const liveId =
              liveAssistantMessageIdRef.current;

            // ------------------------------------------------
            // Existing streaming message
            // ------------------------------------------------

            if (liveId) {
              return previous.map(
                (message) =>
                  message.id === liveId
                    ? {
                        ...message,
                        text: cleanAnswer,
                        mode,
                        live: false,
                      }
                    : message
              );
            }

            // ------------------------------------------------
            // No live message yet
            // ------------------------------------------------

            return [
              ...previous,
              {
                id:
                  `assistant-${Date.now()}-${Math.random()}`,
                role: "assistant",
                text: cleanAnswer,
                mode,
                live: false,
                createdAt: Date.now(),
              },
            ];
          }
        );

        liveAssistantMessageIdRef.current =
          null;
      },
      []
    );

  // ==========================================================
  // ADD USER MESSAGE
  // ==========================================================

  const addUserMessage =
    useCallback(
      (message) => {
        if (
          !message ||
          !message.trim()
        ) {
          return;
        }

        setMessages(
          (previous) => [
            ...previous,
            {
              id:
                `user-${Date.now()}-${Math.random()}`,
              role: "user",
              text: message.trim(),
              createdAt: Date.now(),
            },
          ]
        );
      },
      []
    );

  // ==========================================================
  // ADD ASSISTANT MESSAGE
  // ==========================================================

  const addAssistantMessage =
    useCallback(
      (
        message,
        mode = "gpu"
      ) => {
        if (
          !message ||
          !message.trim()
        ) {
          return;
        }

        const cleanMessage =
          message.trim();

        setMessages(
          (previous) => {
            const last =
              previous[
                previous.length - 1
              ];

            if (
              last?.role ===
                "assistant" &&
              last?.text ===
                cleanMessage
            ) {
              return previous;
            }

            return [
              ...previous,
              {
                id:
                  `assistant-${Date.now()}-${Math.random()}`,
                role: "assistant",
                text: cleanMessage,
                mode,
                createdAt: Date.now(),
              },
            ];
          }
        );
      },
      []
    );

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const playAudio =
    useCallback(
      async (audioUrl) => {
        if (!audioUrl) {
          return;
        }

        try {
          // --------------------------------------------------
          // Stop previous audio
          // --------------------------------------------------

          if (
            audioRef.current
          ) {
            try {
              audioRef.current.pause();
            } catch {}

            try {
              audioRef.current.currentTime =
                0;
            } catch {}

            audioRef.current =
              null;
          }

          const audio =
            new Audio(audioUrl);

          audioRef.current =
            audio;

          audio.preload =
            "auto";

          audio.onplay =
            () => {
              setIsPlaying(true);

              setStatus(
                "speaking"
              );

              setStatusMessage(
                "ANTIMATE iri kuvuga..."
              );
            };

          audio.onended =
            () => {
              setIsPlaying(false);

              setStatus(
                "ready"
              );

              setStatusMessage(
                "ANTIMATE yiteguye kongera kumva."
              );

              audioRef.current =
                null;

              // ----------------------------------------------
              // Current implementation releases microphone
              // after response audio.
              // ----------------------------------------------

              stopMediaTracks();
            };

          audio.onerror =
            () => {
              console.error(
                "❌ Audio playback failed."
              );

              setIsPlaying(false);

              setStatus(
                "ready"
              );

              setStatusMessage(
                "Igisubizo cyabonetse ariko audio ntiyakinze."
              );

              audioRef.current =
                null;
            };

          await audio.play();
        } catch (error) {
          console.error(
            "❌ Could not play ANTIMATE audio:",
            error
          );

          setIsPlaying(false);
        }
      },
      [stopMediaTracks]
    );

  // ==========================================================
  // CONNECT SOCKET.IO
  // ==========================================================

  useEffect(() => {
    const socket =
      io(
        SOCKET_URL,
        {
          transports: [
            "websocket",
            "polling",
          ],

          reconnection: true,

          reconnectionAttempts:
            Infinity,

          reconnectionDelay:
            1000,

          reconnectionDelayMax:
            5000,

          timeout: 20000,

          auth: {
            token: localStorage.getItem("token") || "",
          },

          autoConnect: true,
        }
      );

    socketRef.current =
      socket;

    // ========================================================
    // CONNECT
    // ========================================================

    socket.on(
      "connect",
      () => {
        console.log(
          "🔌 ANTIMATE Socket connected:",
          socket.id
        );

        setSocketConnected(
          true
        );

        setErrorMessage("");

        if (
          !isRecordingRef.current &&
          !isPlaying
        ) {
          setStatus(
            "ready"
          );

          setStatusMessage(
            "ANTIMATE yiteguye kumva."
          );
        }

        // Restore Wake Lock if voice session is active
        if (
          voiceSessionActiveRef.current
        ) {
          requestWakeLock();
        }
      }
    );

    // ========================================================
    // DISCONNECT
    // ========================================================

    socket.on(
      "disconnect",
      (reason) => {
        console.warn(
          "🔌 ANTIMATE Socket disconnected:",
          reason
        );

        setSocketConnected(
          false
        );

        if (
          !isRecordingRef.current
        ) {
          setStatus(
            "disconnected"
          );

          setStatusMessage(
            "Connection yacitse. Ngerageza kongera kuyihuza..."
          );
        }
      }
    );

    // ========================================================
    // CONNECT ERROR
    // ========================================================

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "❌ ANTIMATE Socket connection error:",
          error
        );

        setSocketConnected(
          false
        );

        setErrorMessage(
          "ANTIMATE server ntabwo iri kuboneka."
        );
      }
    );

    // ========================================================
    // STATUS
    // ========================================================

    socket.on(
      "antimate:status",
      (data = {}) => {
        console.log(
          "📡 antimate:status",
          data
        );

        const nextStatus =
          data.status ||
          "ready";

        setStatus(
          nextStatus
        );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        if (
          data.message
        ) {
          setStatusMessage(
            data.message
          );
        }

        if (
          nextStatus ===
          "recording"
        ) {
          setIsRecording(
            true
          );

          isRecordingRef.current =
            true;

          voiceSessionActiveRef.current =
            true;

          requestWakeLock();
        }

        if (
          [
            "converting",
            "processing",
            "gpu_fallback",
            "uploaded",
            "receiving",
          ].includes(
            nextStatus
          )
        ) {
          setIsProcessing(
            true
          );
        }

        if (
          nextStatus ===
          "cancelled"
        ) {
          setIsRecording(
            false
          );

          setIsProcessing(
            false
          );

          isRecordingRef.current =
            false;

          voiceSessionActiveRef.current =
            false;

          releaseWakeLock();
        }
      }
    );

    // ========================================================
    // TRANSCRIPT
    // ========================================================

    socket.on(
      "antimate:transcript",
      (data = {}) => {
        console.log(
          "📝 antimate:transcript",
          data
        );

        const value =
          data.transcript ||
          data.text ||
          data.message ||
          "";

        if (value) {
          setTranscript(
            value
          );
        }
      }
    );

    // ========================================================
    // THINKING
    // ========================================================

    socket.on(
      "antimate:thinking",
      (data = {}) => {
        console.log(
          "🧠 antimate:thinking",
          data
        );

        setIsProcessing(
          true
        );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        setThinkingText(
          data.text ||
            "ANTIMATE iri gutekereza..."
        );
      }
    );

    // ========================================================
    // COMPLETE ANSWER
    // ========================================================

    socket.on(
      "antimate:answer",
      (data = {}) => {
        console.log(
          "💬 antimate:answer",
          data
        );

        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          data.message ||
          "";

        const mode =
          data.mode ||
          data.processing_mode ||
          "gpu";

        if (mode) {
          setProcessingMode(
            mode
          );
        }

        if (answer) {
          setCurrentAnswer(
            answer
          );

          updateLiveAssistantMessage(
            answer,
            mode
          );
        }
      }
    );

    // ========================================================
    // ANSWER CHUNK
    // ========================================================

    socket.on(
      "antimate:answer:chunk",
      (data = {}) => {
        console.log(
          "🧩 antimate:answer:chunk",
          data
        );

        const chunk =
          data.chunk ||
          data.text ||
          data.answer ||
          "";

        if (!chunk) {
          return;
        }

        const mode =
          data.mode ||
          data.processing_mode ||
          "gpu";

        if (mode) {
          setProcessingMode(
            mode
          );
        }

        setIsProcessing(
          true
        );

        // Remove "thinking" state once actual answer starts
        setThinkingText("");

        setCurrentAnswer(
          (previous) => {
            const nextAnswer =
              data.done
                ? chunk
                : previous + chunk;

            updateLiveAssistantMessage(
              nextAnswer,
              mode
            );

            return nextAnswer;
          }
        );
      }
    );

    // ========================================================
    // AUDIO
    // ========================================================

    socket.on(
      "antimate:audio",
      (data = {}) => {
        console.log(
          "🔊 antimate:audio",
          data
        );

        const rawUrl =
          getAudioUrl(
            data.audio_url ||
              data.audioUrl ||
              data.audio
          );

        const audioUrl =
          makeAbsoluteUrl(
            rawUrl
          );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        if (audioUrl) {
          playAudio(
            audioUrl
          );
        }
      }
    );

    // ========================================================
    // COMPLETE
    // ========================================================

    socket.on(
      "antimate:complete",
      (data = {}) => {
        console.log(
          "✅ antimate:complete",
          data
        );

        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          "";

        const mode =
          data.processing_mode ||
          data.mode ||
          "gpu";

        if (mode) {
          setProcessingMode(
            mode
          );
        }

        if (answer) {
          setCurrentAnswer(
            answer
          );

          finalizeLiveAssistantMessage(
            answer,
            mode
          );
        } else if (
          currentAnswer
        ) {
          finalizeLiveAssistantMessage(
            currentAnswer,
            mode
          );
        }

        setIsProcessing(
          false
        );

        setIsRecording(
          false
        );

        isRecordingRef.current =
          false;

        setStatus(
          "complete"
        );

        setStatusMessage(
          "ANTIMATE yarangije gusubiza."
        );

        // Keep Wake Lock until the audio response finishes.
        // This allows the screen to remain awake while speaking.
      }
    );

    // ========================================================
    // ERROR
    // ========================================================

    socket.on(
      "antimate:error",
      (data = {}) => {
        console.error(
          "🔥 antimate:error",
          data
        );

        const message =
          data.message ||
          data.error ||
          "ANTIMATE AI habayemo ikibazo.";

        setErrorMessage(
          message
        );

        setIsRecording(
          false
        );

        setIsProcessing(
          false
        );

        isRecordingRef.current =
          false;

        voiceSessionActiveRef.current =
          false;

        setStatus(
          "error"
        );

        setStatusMessage(
          message
        );

        stopMediaTracks();

        releaseWakeLock();
      }
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      socket.off(
        "connect"
      );

      socket.off(
        "disconnect"
      );

      socket.off(
        "connect_error"
      );

      socket.off(
        "antimate:status"
      );

      socket.off(
        "antimate:transcript"
      );

      socket.off(
        "antimate:thinking"
      );

      socket.off(
        "antimate:answer"
      );

      socket.off(
        "antimate:answer:chunk"
      );

      socket.off(
        "antimate:audio"
      );

      socket.off(
        "antimate:complete"
      );

      socket.off(
        "antimate:error"
      );

      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [
    playAudio,
    updateLiveAssistantMessage,
    finalizeLiveAssistantMessage,
    requestWakeLock,
    releaseWakeLock,
    stopMediaTracks,
    currentAnswer,
    isPlaying,
  ]);

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording =
    useCallback(
      async () => {
        if (
          isRecordingRef.current
        ) {
          return;
        }

        if (
          isProcessing ||
          isPlaying
        ) {
          return;
        }

        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          setErrorMessage(
            "ANTIMATE server ntabwo ihujwe na Socket.IO."
          );

          setStatus(
            "error"
          );

          return;
        }

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          setErrorMessage(
            "Browser yawe ntabwo yemera microphone."
          );

          setStatus(
            "error"
          );

          return;
        }

        try {
          setErrorMessage("");

          setTranscript("");

          setThinkingText("");

          setCurrentAnswer("");

          liveAssistantMessageIdRef.current =
            null;

          audioChunksRef.current =
            [];

          // --------------------------------------------------
          // Activate voice session
          // --------------------------------------------------

          voiceSessionActiveRef.current =
            true;

          await requestWakeLock();

          // --------------------------------------------------
          // MICROPHONE
          // --------------------------------------------------

          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                audio: {
                  channelCount: 1,
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },

                video: false,
              }
            );

          mediaStreamRef.current =
            stream;

          // --------------------------------------------------
          // MIME
          // --------------------------------------------------

          const mimeType =
            getSupportedMimeType();

          let recorder;

          try {
            recorder =
              mimeType
                ? new MediaRecorder(
                    stream,
                    {
                      mimeType,
                    }
                  )
                : new MediaRecorder(
                    stream
                  );
          } catch {
            recorder =
              new MediaRecorder(
                stream
              );
          }

          mediaRecorderRef.current =
            recorder;

          const actualMimeType =
            recorder.mimeType ||
            mimeType ||
            "audio/webm";

          const extension =
            extensionFromMimeType(
              actualMimeType
            );

          // --------------------------------------------------
          // BACKEND SESSION
          // --------------------------------------------------

          socket.emit(
            "antimate:voice:start",
            {
              mimeType:
                actualMimeType,

              extension,

              language: "rw",
              conversationId: activeConversationId,
              history: messages.slice(-24).map((item) => ({
                role: item.role === "user" ? "user" : "assistant",
                content: String(item.text || ""),
              })),
              token: localStorage.getItem("token") || "",
            }
          );

          // --------------------------------------------------
          // DATA
          // --------------------------------------------------

          recorder.ondataavailable =
            (event) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              audioChunksRef.current.push(
                event.data
              );

              if (
                socket.connected &&
                isRecordingRef.current
              ) {
                event.data
                  .arrayBuffer()
                  .then(
                    (arrayBuffer) => {
                      if (
                        socket.connected &&
                        isRecordingRef.current
                      ) {
                        socket.emit(
                          "antimate:voice:chunk",
                          arrayBuffer
                        );
                      }
                    }
                  )
                  .catch(
                    (error) => {
                      console.error(
                        "❌ Audio chunk conversion error:",
                        error
                      );
                    }
                  );
              }
            };

          // --------------------------------------------------
          // RECORDER ERROR
          // --------------------------------------------------

          recorder.onerror =
            (event) => {
              console.error(
                "❌ MediaRecorder error:",
                event
              );

              setErrorMessage(
                "Microphone recording habayemo ikibazo."
              );

              setStatus(
                "error"
              );

              isRecordingRef.current =
                false;

              setIsRecording(
                false
              );

              voiceSessionActiveRef.current =
                false;

              try {
                socket.emit(
                  "antimate:voice:cancel"
                );
              } catch {}

              stopMediaTracks();

              releaseWakeLock();
            };

          // --------------------------------------------------
          // START
          // --------------------------------------------------

          isRecordingRef.current =
            true;

          setIsRecording(
            true
          );

          setIsProcessing(
            false
          );

          setStatus(
            "recording"
          );

          setStatusMessage(
            "ANTIMATE iri kumva..."
          );

          recordingStartedAtRef.current =
            Date.now();

          recorder.start(
            CHUNK_INTERVAL_MS
          );

          // --------------------------------------------------
          // MAX TIME
          // --------------------------------------------------

          clearTimeout(
            autoStopTimerRef.current
          );

          autoStopTimerRef.current =
            setTimeout(
              () => {
                if (
                  isRecordingRef.current
                ) {
                  stopRecording();
                }
              },
              MAX_RECORDING_MS
            );
        } catch (error) {
          console.error(
            "🔥 Microphone error:",
            error
          );

          setErrorMessage(
            error?.message ||
              "Microphone ntiyashoboye gufunguka."
          );

          setStatus(
            "error"
          );

          isRecordingRef.current =
            false;

          setIsRecording(
            false
          );

          voiceSessionActiveRef.current =
            false;

          stopMediaTracks();

          releaseWakeLock();
        }
      },
      [
        isProcessing,
        isPlaying,
        requestWakeLock,
        releaseWakeLock,
        stopMediaTracks,
        activeConversationId,
        messages,
      ]
    );

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording =
    useCallback(
      () => {
        clearTimeout(
          autoStopTimerRef.current
        );

        autoStopTimerRef.current =
          null;

        const socket =
          socketRef.current;

        const recorder =
          mediaRecorderRef.current;

        if (
          !isRecordingRef.current
        ) {
          return;
        }

        isRecordingRef.current =
          false;

        setIsRecording(
          false
        );

        setIsProcessing(
          true
        );

        setStatus(
          "uploaded"
        );

        setStatusMessage(
          "Audio yakiriwe. ANTIMATE iri gutekereza..."
        );

        // ------------------------------------------------------
        // IMPORTANT:
        // Do NOT set voiceSessionActive false yet.
        //
        // It remains active while AI is processing/speaking.
        // ------------------------------------------------------

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          recorder.onstop =
            () => {
              console.log(
                "🎙️ Final recording chunk ready."
              );

              stopMediaTracks();

              if (
                socket &&
                socket.connected
              ) {
                socket.emit(
                  "antimate:voice:end"
                );
              }
            };

          try {
            recorder.stop();
          } catch {
            stopMediaTracks();

            if (
              socket &&
              socket.connected
            ) {
              socket.emit(
                "antimate:voice:end"
              );
            }
          }
        } else {
          stopMediaTracks();

          if (
            socket &&
            socket.connected
          ) {
            socket.emit(
              "antimate:voice:end"
            );
          }
        }

        mediaRecorderRef.current =
          null;
      },
      [stopMediaTracks]
    );

  // ==========================================================
  // CANCEL RECORDING
  // ==========================================================

  const cancelRecording =
    useCallback(
      () => {
        clearTimeout(
          autoStopTimerRef.current
        );

        autoStopTimerRef.current =
          null;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        clearTimeout(
          shortClickTimerRef.current
        );

        shortClickTimerRef.current =
          null;

        isHoldingRef.current =
          false;

        isRecordingRef.current =
          false;

        setIsRecording(
          false
        );

        setIsProcessing(
          false
        );

        setStatus(
          "cancelled"
        );

        setStatusMessage(
          "Recording yahagaritswe."
        );

        const socket =
          socketRef.current;

        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "antimate:voice:cancel"
          );
        }

        const recorder =
          mediaRecorderRef.current;

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          try {
            recorder.stop();
          } catch {}
        }

        mediaRecorderRef.current =
          null;

        stopMediaTracks();

        voiceSessionActiveRef.current =
          false;

        releaseWakeLock();
      },
      [
        stopMediaTracks,
        releaseWakeLock,
      ]
    );

  // ==========================================================
  // POINTER DOWN
  // ==========================================================

  const handleRecordPointerDown =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          isRecordingRef.current ||
          isProcessing ||
          isPlaying
        ) {
          return;
        }

        isHoldingRef.current =
          true;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          setTimeout(
            () => {
              if (
                isHoldingRef.current
              ) {
                startRecording();
              }
            },
            HOLD_TO_RECORD_MS
          );
      },
      [
        isProcessing,
        isPlaying,
        startRecording,
      ]
    );

  // ==========================================================
  // POINTER UP
  // ==========================================================

  const handleRecordPointerUp =
    useCallback(
      (event) => {
        event.preventDefault();

        const wasHolding =
          isHoldingRef.current;

        isHoldingRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        // ------------------------------------------------------
        // HOLD RECORDING
        // ------------------------------------------------------

        if (
          isRecordingRef.current
        ) {
          stopRecording();
          return;
        }

        // ------------------------------------------------------
        // SHORT CLICK
        // ------------------------------------------------------

        if (wasHolding) {
          startRecording();

          clearTimeout(
            shortClickTimerRef.current
          );

          shortClickTimerRef.current =
            setTimeout(
              () => {
                if (
                  isRecordingRef.current
                ) {
                  stopRecording();
                }
              },
              1800
            );
        }
      },
      [
        startRecording,
        stopRecording,
      ]
    );

  // ==========================================================
  // POINTER CANCEL
  // ==========================================================

  const handleRecordPointerCancel =
    useCallback(
      (event) => {
        event.preventDefault();

        isHoldingRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        clearTimeout(
          shortClickTimerRef.current
        );

        shortClickTimerRef.current =
          null;

        if (
          isRecordingRef.current
        ) {
          stopRecording();
        }
      },
      [stopRecording]
    );

  // ==========================================================
  // SEND TEXT
  // ==========================================================

  const sendTextMessage =
    useCallback(
      async () => {
        const cleanText =
          text.trim();

        if (!cleanText) {
          return;
        }

        if (
          isProcessing ||
          isRecording
        ) {
          return;
        }

        setText("");

        setErrorMessage("");

        setStatus(
          "processing"
        );

        setIsProcessing(
          true
        );

        setStatusMessage(
          "ANTIMATE iri gutekereza..."
        );

        addUserMessage(
          cleanText
        );

        try {
          const response =
            await fetch(
              CHAT_URL,
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                  ...(localStorage.getItem("token")
                    ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
                    : {}),
                },

                body: JSON.stringify({
                  message: cleanText,
                  language: "rw",
                  conversationId: activeConversationId,
                  history: [...messages, { role: "user", text: cleanText }]
                    .slice(-24)
                    .map((item) => ({
                      role: item.role === "user" ? "user" : "assistant",
                      content: String(item.text || ""),
                    })),
                }),
              }
            );

          let data = {};

          try {
            data =
              await response.json();
          } catch {
            data = {};
          }

          if (
            !response.ok
          ) {
            throw new Error(
              data.message ||
                data.error ||
                "ANTIMATE ntiyashoboye gusubiza."
            );
          }

          const answer =
            data.answer ||
            data.answer_rw ||
            data.answer_kinyarwanda ||
            data.message ||
            data.text ||
            "";

          if (!answer) {
            throw new Error(
              "ANTIMATE ntiyagaruye igisubizo."
            );
          }

          const mode =
            data.processing_mode ||
            data.mode ||
            "gpu";

          setProcessingMode(
            mode
          );

          setCurrentAnswer(
            answer
          );

          addAssistantMessage(
            answer,
            mode
          );

          const rawAudio =
            getAudioUrl(
              data.audio_url ||
                data.audioUrl ||
                data.audio
            );

          const audioUrl =
            makeAbsoluteUrl(
              rawAudio
            );

          if (audioUrl) {
            await playAudio(
              audioUrl
            );
          } else {
            setStatus(
              "complete"
            );

            setStatusMessage(
              "ANTIMATE yarangije gusubiza."
            );
          }
        } catch (error) {
          console.error(
            "🔥 Text chat error:",
            error
          );

          setErrorMessage(
            error?.message ||
              "ANTIMATE ntiyashoboye gusubiza."
          );

          setStatus(
            "error"
          );

          setStatusMessage(
            error?.message ||
              "Habaye ikibazo."
          );
        } finally {
          setIsProcessing(
            false
          );
        }
      },
      [
        text,
        isProcessing,
        isRecording,
        addUserMessage,
        addAssistantMessage,
        playAudio,
        activeConversationId,
        messages,
      ]
    );

  // ==========================================================
  // ENTER
  // ==========================================================

  const handleTextKeyDown =
    useCallback(
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          sendTextMessage();
        }
      },
      [sendTextMessage]
    );

  // ==========================================================
  // CLEAR ERROR
  // ==========================================================

  const clearError =
    useCallback(
      () => {
        setErrorMessage("");

        if (
          !isRecording &&
          !isProcessing &&
          !isPlaying
        ) {
          setStatus(
            "ready"
          );

          setStatusMessage(
            "ANTIMATE yiteguye kumva."
          );
        }
      },
      [
        isRecording,
        isProcessing,
        isPlaying,
      ]
    );

  // ==========================================================
  // FINAL CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      clearTimeout(
        holdTimerRef.current
      );

      clearTimeout(
        autoStopTimerRef.current
      );

      clearTimeout(
        shortClickTimerRef.current
      );

      const socket =
        socketRef.current;

      if (
        socket &&
        socket.connected &&
        isRecordingRef.current
      ) {
        socket.emit(
          "antimate:voice:cancel"
        );
      }

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        try {
          recorder.stop();
        } catch {}
      }

      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) => {
              try {
                track.stop();
              } catch {}
            }
          );
      }

      if (
        audioRef.current
      ) {
        try {
          audioRef.current.pause();
        } catch {}
      }

      voiceSessionActiveRef.current =
        false;

      if (
        wakeLockRef.current
      ) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, []);

  // ==========================================================
  // DERIVED BUTTON CLASS
  // ==========================================================

  const recordButtonClass =
    [
      "antimate-record-button",

      isRecording
        ? "recording"
        : "",

      isProcessing
        ? "processing"
        : "",

      isPlaying
        ? "speaking"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      <style>{styles}</style>
      <div className="antimate-ai">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="antimate-header">

        <div className="antimate-brand">

          <div className="antimate-logo">
            <span />
          </div>

          <div>
            <h1>
              ANTIMATE AI
            </h1>

            <span className="antimate-subtitle">
              Kinyarwanda Voice AI
            </span>
          </div>

        </div>

        <div className="antimate-header-actions">
          <button
            type="button"
            className="antimate-header-button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Fungura cyangwa ufunge ibiganiro"
            title="Ibiganiro"
          >
            ☰
          </button>
          <button
            type="button"
            className="antimate-header-button"
            onClick={createNewConversation}
            disabled={isProcessing || isRecording}
          >
            + Ikiganiro gishya
          </button>
          <div
            className={[
              "antimate-connection",
              socketConnected ? "online" : "offline",
            ].join(" ")}
          >
            <span className="connection-dot" />
            {socketConnected ? "Online" : "Connecting..."}
          </div>
        </div>

      </header>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <div className="antimate-workspace">

        <aside className={`antimate-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="antimate-sidebar-top">
            <div className="antimate-sidebar-heading">
              <span>Ibiganiro</span>
              <span>{conversations.length}</span>
            </div>
            <button
              type="button"
              className="antimate-new-chat"
              onClick={createNewConversation}
              disabled={isProcessing || isRecording}
            >
              ＋ Ikiganiro gishya
            </button>
            <div className="antimate-account-state">
              {localStorage.getItem("token")
                ? "Amateka abitswe kuri iyi browser y’konti yawe"
                : "Guest mode · ibiganiro bibikwa muri iyi browser"}
            </div>
          </div>

          <div className="antimate-conversation-list">
            {conversations.length === 0 && (
              <div className="antimate-sidebar-note" style={{ borderTop: 0 }}>
                Nta biganiro byabitswe. Tangira ikiganiro gishya.
              </div>
            )}
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`antimate-conversation-item ${conversation.id === activeConversationId ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="antimate-conversation-open"
                  onClick={() => openConversation(conversation)}
                  disabled={isProcessing || isRecording}
                  title={conversation.title}
                >
                  <span className="antimate-conversation-title">{conversation.title || "Ikiganiro gishya"}</span>
                  <span className="antimate-conversation-date">
                    {new Date(conversation.updatedAt || conversation.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </button>
                <button
                  type="button"
                  className="antimate-conversation-delete"
                  onClick={() => deleteConversation(conversation.id)}
                  title="Siba ikiganiro"
                  aria-label={`Siba ${conversation.title || "ikiganiro"}`}
                  disabled={isProcessing || isRecording}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="antimate-sidebar-note">
            Ibiganiro bitasibwe biguma muri history ya browser. Iyo winjiye kuri konti, history yo kuri server no kuyihuza hagati ya devices bisaba backend conversation API.
          </div>
        </aside>

      <main className="antimate-main">

        {/* ==================================================
            CHAT
        ================================================== */}

        <section className="antimate-chat">

          {messages.length === 0 && (
            <div className="antimate-empty">

              <div className="antimate-empty-logo">
                <span />
              </div>

              <h2>
                Muraho, ndi ANTIMATE
              </h2>

              <p>
                Vuga cyangwa wandike ubutumwa
                mu Kinyarwanda.
              </p>

            </div>
          )}

          <div className="antimate-messages">

            {messages.map(
              (message) => (
                <div
                  key={
                    message.id
                  }
                  className={[
                    "antimate-message",

                    message.role ===
                    "user"
                      ? "user"
                      : "assistant",
                  ].join(" ")}
                >

                  <div className="message-bubble">
                    {message.text}
                  </div>

                  {message.role ===
                    "assistant" &&
                    message.mode && (
                      <div className="message-mode">
                        {message.mode ===
                        "cpu"
                          ? "CPU"
                          : "GPU"}
                      </div>
                    )}

                </div>
              )
            )}

          </div>

          {/* ================================================
              LIVE TRANSCRIPT
          ================================================ */}

          {transcript && (
            <div className="antimate-live-transcript">

              <span>
                Wavuze:
              </span>

              <p>
                {transcript}
              </p>

            </div>
          )}

          {/* ================================================
              THINKING
          ================================================ */}

          {isProcessing &&
            thinkingText && (
              <div className="antimate-thinking">

                <div className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span>
                  {thinkingText}
                </span>

                {processingMode && (
                  <small>
                    {processingMode ===
                    "cpu"
                      ? "CPU"
                      : "GPU"}
                  </small>
                )}

              </div>
            )}

          {/* ================================================
              CURRENT LIVE ANSWER

              IMPORTANT:
              NO "isProcessing" CONDITION HERE.

              Therefore the Kinyarwanda answer remains visible
              even after processing becomes false.
          ================================================ */}

          {currentAnswer && (
            <div className="antimate-current-answer">
              {currentAnswer}
            </div>
          )}

        </section>

        {/* ==================================================
            STATUS
        ================================================== */}

        <div
          className={[
            "antimate-status",
            status,
          ].join(" ")}
        >

          <span className="status-indicator" />

          <span>
            {statusMessage}
          </span>

          {processingMode && (
            <span className="status-mode">
              {processingMode ===
              "cpu"
                ? "CPU"
                : "GPU"}
            </span>
          )}

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {errorMessage && (
          <div className="antimate-error">

            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={
                clearError
              }
              aria-label="Close error"
            >
              ×
            </button>

          </div>
        )}

        {/* ==================================================
            VOICE CONTROL
        ================================================== */}

        <section className="antimate-voice-control">

          <button
            type="button"

            className={
              recordButtonClass
            }

            onPointerDown={
              handleRecordPointerDown
            }

            onPointerUp={
              handleRecordPointerUp
            }

            onPointerCancel={
              handleRecordPointerCancel
            }

            onPointerLeave={
              isRecording
                ? undefined
                : handleRecordPointerCancel
            }

            disabled={
              isProcessing ||
              isPlaying ||
              !socketConnected
            }

            aria-label={
              isRecording
                ? "Reka gufata amajwi"
                : "Fata amajwi"
            }

          >

            <span className="record-button-ring" />

            <span className="record-icon">

              {isRecording
                ? "■"
                : isPlaying
                ? "🔊"
                : "🎙️"}

            </span>

          </button>

          <div className="voice-help">

            {isRecording
              ? "Reka button uhagarike recording"
              : "Kanda gato cyangwa uyifateho uvuge"}

          </div>

        </section>

        {/* ==================================================
            TEXT INPUT
        ================================================== */}

        <section className="antimate-input">

          <textarea
            value={text}

            onChange={(event) =>
              setText(
                event.target.value
              )
            }

            onKeyDown={
              handleTextKeyDown
            }

            placeholder="Andika ubutumwa mu Kinyarwanda..."

            rows={1}

            disabled={
              isProcessing ||
              isRecording
            }
          />

          <button
            type="button"

            onClick={
              sendTextMessage
            }

            disabled={
              !text.trim() ||
              isProcessing ||
              isRecording
            }

            className="antimate-send-button"

            aria-label="Send message"
          >
            ➤
          </button>

        </section>

      </main>
      </div>

      </div>
    </>
  );
}