import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

/* ============================================================
   ANTIMATE AI
   Single-file UI
   - Native CSS inside JSX
   - Socket.IO voice streaming
   - Text chat
   - 30s recording
   - Live voice
   - 1.8s silence auto-send
   - Replay AI audio
   - Dark / Light theme
   ============================================================ */

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/$/, "");

// ------------------------------------------------------------
// IMPORTANT:
// Replace this path with the exact ANTIMATE AI logo you already use
// if your project stores it somewhere else.
// ------------------------------------------------------------

const ANTIMATE_LOGO = "/antimate-ai-logo.png";

// Socket events used by antimateRoutes.js
const SOCKET_EVENTS = {
  START: "antimate:voice:start",
  CHUNK: "antimate:voice:chunk",
  END: "antimate:voice:end",
  CANCEL: "antimate:voice:cancel",

  STATUS: "antimate:status",
  TRANSCRIPT: "antimate:transcript",
  THINKING: "antimate:thinking",
  ANSWER: "antimate:answer",
  ANSWER_CHUNK: "antimate:answer:chunk",
  AUDIO: "antimate:audio",
  COMPLETE: "antimate:complete",
  ERROR: "antimate:error",
};

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const uid = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function makeAbsoluteUrl(value) {
  if (!value) return null;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function getAnswerFromPayload(payload) {
  if (!payload) return "";

  if (typeof payload === "string") {
    return payload;
  }

  return (
    payload.answer ||
    payload.text ||
    payload.response ||
    payload.message ||
    ""
  );
}

function getTranscriptFromPayload(payload) {
  if (!payload) return "";

  if (typeof payload === "string") {
    return payload;
  }

  return (
    payload.transcript ||
    payload.text ||
    payload.message ||
    ""
  );
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

export default function AntimateAI() {
  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("antimate-ai-theme") || "dark";
  });

  const [socketConnected, setSocketConnected] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [isLiveVoice, setIsLiveVoice] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const [recordSeconds, setRecordSeconds] = useState(30);

  const [backendStatus, setBackendStatus] = useState("");

  const [error, setError] = useState("");

  const [liveTranscript, setLiveTranscript] = useState("");

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const audioChunksRef = useRef([]);

  const recordingTimerRef = useRef(null);

  const silenceTimerRef = useRef(null);

  const recordingStartRef = useRef(null);

  const isLiveVoiceRef = useRef(false);

  const isRecordingRef = useRef(false);

  const isProcessingRef = useRef(false);

  const isPlayingRef = useRef(false);

  const currentAnswerRef = useRef("");

  const currentAssistantIdRef = useRef(null);

  const inputRef = useRef(null);

  const audioRef = useRef(null);

  const intentionalStopRef = useRef(false);

  // ----------------------------------------------------------
  // THEME
  // ----------------------------------------------------------

  useEffect(() => {
    localStorage.setItem("antimate-ai-theme", theme);
  }, [theme]);

  // ----------------------------------------------------------
  // CSS
  // ----------------------------------------------------------

  const styles = useMemo(
    () => `
      * {
        box-sizing: border-box;
      }

      html,
      body,
      #root {
        margin: 0;
        width: 100%;
        min-height: 100%;
      }

      body {
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      button,
      textarea {
        font: inherit;
      }

      .antimate-page {
        --bg: #070a10;
        --bg-soft: #0d1119;
        --surface: rgba(255, 255, 255, 0.055);
        --surface-strong: rgba(255, 255, 255, 0.085);
        --surface-hover: rgba(255, 255, 255, 0.105);
        --border: rgba(255, 255, 255, 0.105);
        --border-strong: rgba(255, 255, 255, 0.17);

        --text: #f5f7fb;
        --text-soft: #aeb7c7;
        --text-muted: #7d8798;

        --user-bubble: rgba(255, 255, 255, 0.075);
        --ai-bubble: rgba(255, 255, 255, 0.045);

        --shadow:
          0 25px 80px rgba(0, 0, 0, 0.42);

        --input-bg: rgba(255, 255, 255, 0.065);

        position: relative;
        min-height: 100vh;
        overflow: hidden;
        color: var(--text);
        background:
          radial-gradient(
            circle at 10% 10%,
            rgba(105, 70, 255, 0.13),
            transparent 30%
          ),
          radial-gradient(
            circle at 90% 20%,
            rgba(0, 205, 255, 0.08),
            transparent 28%
          ),
          radial-gradient(
            circle at 50% 100%,
            rgba(255, 0, 140, 0.06),
            transparent 35%
          ),
          var(--bg);
        transition:
          background 0.35s ease,
          color 0.35s ease;
      }

      .antimate-page.light {
        --bg: #f4f7fb;
        --bg-soft: #ffffff;
        --surface: rgba(255, 255, 255, 0.72);
        --surface-strong: rgba(255, 255, 255, 0.9);
        --surface-hover: rgba(255, 255, 255, 0.98);
        --border: rgba(20, 28, 45, 0.09);
        --border-strong: rgba(20, 28, 45, 0.16);

        --text: #101827;
        --text-soft: #526075;
        --text-muted: #7b8799;

        --user-bubble: rgba(255, 255, 255, 0.92);
        --ai-bubble: rgba(255, 255, 255, 0.72);

        --shadow:
          0 25px 70px rgba(44, 58, 88, 0.12);

        --input-bg: rgba(255, 255, 255, 0.82);

        background:
          radial-gradient(
            circle at 8% 10%,
            rgba(105, 70, 255, 0.09),
            transparent 30%
          ),
          radial-gradient(
            circle at 90% 20%,
            rgba(0, 180, 255, 0.075),
            transparent 28%
          ),
          radial-gradient(
            circle at 50% 100%,
            rgba(255, 0, 140, 0.045),
            transparent 35%
          ),
          var(--bg);
      }

      .antimate-page::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.018) 45%,
            transparent 70%
          );
        opacity: 0.8;
      }

      /* ------------------------------------------------------
         HEADER
         ------------------------------------------------------ */

      .antimate-header {
        position: sticky;
        top: 0;
        z-index: 50;

        height: 72px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        padding: 0 28px;

        border-bottom: 1px solid var(--border);

        background:
          linear-gradient(
            to bottom,
            var(--surface-strong),
            rgba(255,255,255,0.015)
          );

        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .brand-logo {
        position: relative;

        width: 40px;
        height: 40px;

        flex: 0 0 40px;

        border-radius: 13px;

        display: grid;
        place-items: center;

        overflow: hidden;

        background:
          linear-gradient(
            135deg,
            rgba(255,255,255,0.11),
            rgba(255,255,255,0.025)
          );

        border: 1px solid var(--border-strong);

        box-shadow:
          0 8px 30px rgba(0,0,0,0.22);
      }

      .brand-logo img {
        width: 29px;
        height: 29px;
        object-fit: contain;
      }

      .brand-fallback {
        position: relative;

        width: 23px;
        height: 23px;

        border-radius: 50%;

        border: 3px solid transparent;

        background:
          linear-gradient(var(--bg-soft), var(--bg-soft)) padding-box,
          conic-gradient(
            #ff2b8a,
            #8a5cff,
            #00d5ff,
            #00efad,
            #ffcf4a,
            #ff2b8a
          ) border-box;

        animation: logoSpin 4s linear infinite;
      }

      .brand-fallback::after {
        content: "";

        position: absolute;
        inset: 4px;

        border-radius: 50%;

        background:
          radial-gradient(
            circle,
            rgba(255,255,255,0.8),
            transparent 65%
          );
      }

      @keyframes logoSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .brand-copy {
        min-width: 0;
      }

      .brand-name {
        font-size: 15px;
        font-weight: 750;
        letter-spacing: -0.02em;
        white-space: nowrap;
      }

      .brand-subtitle {
        margin-top: 2px;

        color: var(--text-muted);

        font-size: 11px;
        white-space: nowrap;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .connection {
        display: flex;
        align-items: center;
        gap: 7px;

        color: var(--text-muted);

        font-size: 11px;
        white-space: nowrap;
      }

      .connection-dot {
        width: 7px;
        height: 7px;

        border-radius: 50%;

        background: #777;

        box-shadow: 0 0 0 4px rgba(120,120,120,0.08);
      }

      .connection-dot.online {
        background: #31e58c;
        box-shadow:
          0 0 0 4px rgba(49,229,140,0.10),
          0 0 18px rgba(49,229,140,0.5);
      }

      .theme-button {
        width: 37px;
        height: 37px;

        display: grid;
        place-items: center;

        border-radius: 12px;

        border: 1px solid var(--border);

        color: var(--text-soft);

        background: var(--surface);

        cursor: pointer;

        transition:
          transform 0.2s ease,
          background 0.2s ease,
          border 0.2s ease;
      }

      .theme-button:hover {
        transform: translateY(-1px);
        background: var(--surface-hover);
        border-color: var(--border-strong);
      }

      /* ------------------------------------------------------
         MAIN
         ------------------------------------------------------ */

      .chat-shell {
        position: relative;
        z-index: 2;

        width: min(900px, calc(100% - 32px));

        min-height: calc(100vh - 72px);

        margin: 0 auto;

        display: flex;
        flex-direction: column;
      }

      .messages-area {
        flex: 1;

        padding: 42px 0 170px;

        display: flex;
        flex-direction: column;
      }

      /* ------------------------------------------------------
         EMPTY STATE
         ------------------------------------------------------ */

      .empty-state {
        flex: 1;

        min-height: 56vh;

        display: flex;
        align-items: center;
        justify-content: center;

        text-align: center;
      }

      .empty-inner {
        width: min(570px, 100%);
      }

      .hero-logo {
        position: relative;

        width: 92px;
        height: 92px;

        margin: 0 auto 26px;

        display: grid;
        place-items: center;

        border-radius: 29px;

        background:
          linear-gradient(
            135deg,
            rgba(255,255,255,0.10),
            rgba(255,255,255,0.025)
          );

        border: 1px solid var(--border-strong);

        box-shadow:
          0 30px 70px rgba(0,0,0,0.25),
          inset 0 0 30px rgba(255,255,255,0.025);

        overflow: hidden;
      }

      .hero-logo::before {
        content: "";

        position: absolute;

        width: 140%;
        height: 140%;

        background:
          conic-gradient(
            from 0deg,
            #ff2b8a,
            #805cff,
            #00d8ff,
            #00e9a1,
            #ffd34e,
            #ff2b8a
          );

        filter: blur(20px);

        opacity: 0.24;

        animation: logoAura 5s linear infinite;
      }

      @keyframes logoAura {
        to {
          transform: rotate(360deg);
        }
      }

      .hero-logo img {
        position: relative;
        z-index: 2;

        width: 63px;
        height: 63px;

        object-fit: contain;
      }

      .hero-fallback {
        position: relative;
        z-index: 2;

        width: 54px;
        height: 54px;

        border-radius: 50%;

        border: 6px solid transparent;

        background:
          linear-gradient(var(--bg-soft), var(--bg-soft)) padding-box,
          conic-gradient(
            #ff2b8a,
            #805cff,
            #00d8ff,
            #00e9a1,
            #ffd34e,
            #ff2b8a
          ) border-box;

        animation: logoSpin 5s linear infinite;
      }

      .hero-fallback::after {
        content: "";

        position: absolute;

        inset: 9px;

        border-radius: 50%;

        background:
          radial-gradient(
            circle,
            rgba(255,255,255,0.85),
            transparent 65%
          );
      }

      .hero-title {
        margin: 0;

        font-size: clamp(28px, 5vw, 43px);

        line-height: 1.05;

        letter-spacing: -0.045em;

        font-weight: 800;
      }

      .hero-title span {
        background:
          linear-gradient(
            100deg,
            #ff4b9a,
            #8b6cff,
            #00cfff,
            #00dda0
          );

        background-size: 250% auto;

        -webkit-background-clip: text;
        background-clip: text;

        color: transparent;

        animation: gradientMove 5s linear infinite;
      }

      @keyframes gradientMove {
        to {
          background-position: 250% center;
        }
      }

      .hero-description {
        margin: 15px auto 0;

        max-width: 500px;

        color: var(--text-soft);

        font-size: 14px;

        line-height: 1.7;
      }

      /* ------------------------------------------------------
         MESSAGES
         ------------------------------------------------------ */

      .message-list {
        display: flex;
        flex-direction: column;
        gap: 25px;
      }

      .message-row {
        display: flex;
        width: 100%;
      }

      .message-row.user {
        justify-content: flex-end;
      }

      .message-row.ai {
        justify-content: flex-start;
      }

      .message-wrap {
        max-width: min(76%, 670px);
      }

      .message-row.user .message-wrap {
        align-items: flex-end;
      }

      .message-bubble {
        position: relative;

        padding: 13px 16px;

        border-radius: 19px;

        border: 1px solid var(--border);

        box-shadow: 0 12px 35px rgba(0,0,0,0.08);

        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);

        font-size: 14px;

        line-height: 1.65;

        white-space: pre-wrap;

        overflow-wrap: anywhere;
      }

      .message-row.user .message-bubble {
        background: var(--user-bubble);

        border-bottom-right-radius: 6px;
      }

      .message-row.ai .message-bubble {
        background: var(--ai-bubble);

        border-bottom-left-radius: 6px;
      }

      .message-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        margin-bottom: 7px;

        color: var(--text-muted);

        font-size: 10px;

        letter-spacing: 0.02em;
      }

      .ai-avatar {
        width: 24px;
        height: 24px;

        flex: 0 0 24px;

        display: grid;
        place-items: center;

        border-radius: 8px;

        border: 1px solid var(--border);

        background: var(--surface);

        overflow: hidden;
      }

      .ai-avatar img {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }

      .user-label {
        text-align: right;
      }

      .voice-transcript {
        margin-top: 9px;

        color: var(--text-soft);

        font-size: 11px;

        opacity: 0.9;
      }

      /* ------------------------------------------------------
         AUDIO REPLAY
         ------------------------------------------------------ */

      .audio-card {
        margin-top: 12px;

        display: flex;
        align-items: center;
        gap: 10px;

        width: fit-content;

        padding: 8px 10px;

        border-radius: 13px;

        background: var(--surface);

        border: 1px solid var(--border);
      }

      .replay-button {
        width: 34px;
        height: 34px;

        display: grid;
        place-items: center;

        border-radius: 10px;

        border: 1px solid var(--border);

        background: var(--surface-strong);

        color: var(--text);

        cursor: pointer;

        transition:
          transform 0.2s ease,
          background 0.2s ease;
      }

      .replay-button:hover {
        transform: scale(1.04);
        background: var(--surface-hover);
      }

      .audio-label {
        color: var(--text-soft);
        font-size: 11px;
      }

      /* ------------------------------------------------------
         AI REASONING
         ------------------------------------------------------ */

      .reasoning {
        display: inline-flex;
        align-items: center;
        gap: 9px;

        padding: 10px 13px;

        border-radius: 14px;

        border: 1px solid var(--border);

        background: var(--surface);

        color: var(--text-soft);

        font-size: 12px;

        backdrop-filter: blur(18px);
      }

      .reasoning-dots {
        display: flex;
        gap: 4px;
      }

      .reasoning-dots span {
        width: 5px;
        height: 5px;

        border-radius: 50%;

        background: currentColor;

        animation: thinking 1.2s infinite ease-in-out;
      }

      .reasoning-dots span:nth-child(2) {
        animation-delay: 0.15s;
      }

      .reasoning-dots span:nth-child(3) {
        animation-delay: 0.3s;
      }

      @keyframes thinking {
        0%,
        60%,
        100% {
          transform: translateY(0);
          opacity: 0.35;
        }

        30% {
          transform: translateY(-4px);
          opacity: 1;
        }
      }

      /* ------------------------------------------------------
         ERROR
         ------------------------------------------------------ */

      .error-line {
        margin-top: 12px;

        color: #ff718f;

        font-size: 11px;

        text-align: center;
      }

      /* ------------------------------------------------------
         COMPOSER
         ------------------------------------------------------ */

      .composer-fixed {
        position: fixed;

        z-index: 40;

        left: 50%;
        bottom: 18px;

        transform: translateX(-50%);

        width: min(900px, calc(100% - 32px));
      }

      .composer-status {
        min-height: 25px;

        display: flex;
        align-items: center;
        justify-content: center;

        margin-bottom: 7px;

        color: var(--text-muted);

        font-size: 11px;
      }

      .composer {
        position: relative;

        display: flex;
        align-items: flex-end;

        gap: 9px;

        padding: 9px;

        border-radius: 22px;

        border: 1px solid var(--border-strong);

        background:
          linear-gradient(
            135deg,
            var(--surface-strong),
            var(--surface)
          );

        box-shadow: var(--shadow);

        backdrop-filter: blur(28px);
        -webkit-backdrop-filter: blur(28px);
      }

      .composer.recording {
        border-color: rgba(255, 72, 125, 0.35);

        box-shadow:
          0 25px 70px rgba(0,0,0,0.35),
          0 0 0 1px rgba(255,72,125,0.06),
          0 0 45px rgba(255,72,125,0.08);
      }

      .composer.live {
        border-color: rgba(0, 216, 255, 0.34);

        box-shadow:
          0 25px 70px rgba(0,0,0,0.35),
          0 0 45px rgba(0,216,255,0.08);
      }

      .composer textarea {
        flex: 1;

        min-height: 44px;
        max-height: 130px;

        resize: none;

        padding: 12px 10px 10px 13px;

        border: 0;
        outline: 0;

        color: var(--text);

        background: transparent;

        font-size: 14px;

        line-height: 1.45;
      }

      .composer textarea::placeholder {
        color: var(--text-muted);
      }

      .composer textarea:disabled {
        opacity: 0.6;
      }

      /* ------------------------------------------------------
         SINGLE ACTION BUTTON
         ------------------------------------------------------ */

      .action-button {
        position: relative;

        width: 48px;
        height: 48px;

        flex: 0 0 48px;

        display: grid;
        place-items: center;

        border: 0;

        border-radius: 16px;

        color: white;

        background:
          linear-gradient(
            135deg,
            #7d5cff,
            #b34fff 48%,
            #ff4e91
          );

        box-shadow:
          0 10px 30px rgba(116, 75, 255, 0.25);

        cursor: pointer;

        transition:
          transform 0.2s ease,
          opacity 0.2s ease,
          box-shadow 0.2s ease;
      }

      .action-button:hover:not(:disabled) {
        transform: translateY(-2px);

        box-shadow:
          0 15px 38px rgba(116, 75, 255, 0.35);
      }

      .action-button:active:not(:disabled) {
        transform: scale(0.96);
      }

      .action-button:disabled {
        cursor: not-allowed;
        opacity: 0.48;
      }

      .action-button.recording {
        background:
          linear-gradient(
            135deg,
            #ff386d,
            #ff526f
          );

        animation: recordPulse 1.5s infinite;
      }

      .action-button.live {
        background:
          linear-gradient(
            135deg,
            #00aeea,
            #695cff
          );

        animation: livePulse 1.8s infinite;
      }

      @keyframes recordPulse {
        0%,
        100% {
          box-shadow:
            0 0 0 0 rgba(255, 56, 109, 0.25),
            0 10px 30px rgba(255, 56, 109, 0.18);
        }

        50% {
          box-shadow:
            0 0 0 9px rgba(255, 56, 109, 0.04),
            0 15px 40px rgba(255, 56, 109, 0.28);
        }
      }

      @keyframes livePulse {
        0%,
        100% {
          box-shadow:
            0 0 0 0 rgba(0, 190, 255, 0.22),
            0 10px 30px rgba(0, 190, 255, 0.16);
        }

        50% {
          box-shadow:
            0 0 0 9px rgba(0, 190, 255, 0.035),
            0 15px 40px rgba(0, 190, 255, 0.25);
        }
      }

      .action-icon {
        font-size: 20px;
        line-height: 1;
      }

      .record-count {
        position: absolute;

        right: -4px;
        top: -7px;

        min-width: 24px;
        height: 24px;

        padding: 0 6px;

        display: grid;
        place-items: center;

        border-radius: 999px;

        background: #10141d;

        color: white;

        border: 1px solid rgba(255,255,255,0.16);

        font-size: 9px;
        font-weight: 750;

        box-shadow: 0 5px 20px rgba(0,0,0,0.35);
      }

      /* ------------------------------------------------------
         LIVE INDICATOR
         ------------------------------------------------------ */

      .live-indicator {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .live-indicator-dot {
        width: 7px;
        height: 7px;

        border-radius: 50%;

        background: #00d9ff;

        box-shadow:
          0 0 14px rgba(0,217,255,0.8);

        animation: liveDot 1s infinite;
      }

      @keyframes liveDot {
        50% {
          opacity: 0.35;
          transform: scale(0.75);
        }
      }

      /* ------------------------------------------------------
         RESPONSIVE
         ------------------------------------------------------ */

      @media (max-width: 700px) {
        .antimate-header {
          height: 64px;
          padding: 0 15px;
        }

        .brand-logo {
          width: 36px;
          height: 36px;
          flex-basis: 36px;
        }

        .brand-logo img {
          width: 26px;
          height: 26px;
        }

        .brand-subtitle {
          display: none;
        }

        .connection {
          display: none;
        }

        .chat-shell {
          width: min(100% - 20px, 900px);
          min-height: calc(100vh - 64px);
        }

        .messages-area {
          padding-top: 28px;
          padding-bottom: 155px;
        }

        .message-wrap {
          max-width: 88%;
        }

        .composer-fixed {
          width: calc(100% - 20px);
          bottom: 10px;
        }

        .composer {
          border-radius: 20px;
        }

        .hero-logo {
          width: 78px;
          height: 78px;
        }

        .hero-logo img {
          width: 54px;
          height: 54px;
        }

        .hero-description {
          font-size: 13px;
          padding: 0 10px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      }
    `,
    []
  );

  // ----------------------------------------------------------
  // UPDATE ASSISTANT MESSAGE
  // ----------------------------------------------------------

  const updateAssistantMessage = useCallback(
    (answer, audioUrl = null) => {
      const assistantId = currentAssistantIdRef.current;

      if (!assistantId) return;

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: answer,
                audioUrl: audioUrl || message.audioUrl || null,
              }
            : message
        )
      );
    },
    []
  );

  // ----------------------------------------------------------
  // ADD USER MESSAGE
  // ----------------------------------------------------------

  const addUserMessage = useCallback((text, voice = false) => {
    const clean = String(text || "").trim();

    if (!clean) return;

    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "user",
        text: clean,
        voice,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  // ----------------------------------------------------------
  // CREATE AI MESSAGE
  // ----------------------------------------------------------

  const createAssistantMessage = useCallback(() => {
    const id = uid();

    currentAssistantIdRef.current = id;
    currentAnswerRef.current = "";

    setMessages((prev) => [
      ...prev,
      {
        id,
        role: "ai",
        text: "",
        audioUrl: null,
        createdAt: Date.now(),
      },
    ]);

    return id;
  }, []);

  // ----------------------------------------------------------
  // AUDIO PLAYBACK
  // ----------------------------------------------------------

  const playAudio = useCallback((url) => {
    if (!url) return;

    const absoluteUrl = makeAbsoluteUrl(url);

    if (!absoluteUrl) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(absoluteUrl);

      audioRef.current = audio;

      isPlayingRef.current = true;
      setIsPlaying(true);

      audio.onended = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);

        // IMPORTANT:
        // Live voice automatically re-opens after AI finishes speaking.
        if (isLiveVoiceRef.current) {
          setIsProcessing(false);
          isProcessingRef.current = false;
          setBackendStatus("Live voice ready");
        }
      };

      audio.onerror = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);

        if (isLiveVoiceRef.current) {
          setIsProcessing(false);
          isProcessingRef.current = false;
          setBackendStatus("Live voice ready");
        }
      };

      audio.play().catch(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
      });
    } catch {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, []);

  // ----------------------------------------------------------
  // STOP MEDIA
  // ----------------------------------------------------------

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });

      mediaStreamRef.current = null;
    }
  }, []);

  // ----------------------------------------------------------
  // CLEAR RECORDING TIMER
  // ----------------------------------------------------------

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  // ----------------------------------------------------------
  // CLEAR SILENCE TIMER
  // ----------------------------------------------------------

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // ----------------------------------------------------------
  // FINALIZE VOICE
  // ----------------------------------------------------------

  const finalizeVoice = useCallback(() => {
    clearRecordingTimer();
    clearSilenceTimer();

    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      stopMediaTracks();
      return;
    }

    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch {
      stopMediaTracks();
    }
  }, [
    clearRecordingTimer,
    clearSilenceTimer,
    stopMediaTracks,
  ]);

  // ----------------------------------------------------------
  // STOP RECORDING
  // ----------------------------------------------------------

  const stopRecording = useCallback(
    (cancel = false) => {
      clearRecordingTimer();
      clearSilenceTimer();

      intentionalStopRef.current = true;

      const recorder = mediaRecorderRef.current;

      if (!recorder) {
        isRecordingRef.current = false;
        setIsRecording(false);
        stopMediaTracks();
        return;
      }

      if (cancel) {
        try {
          if (socketRef.current?.connected) {
            socketRef.current.emit(SOCKET_EVENTS.CANCEL, {
              reason: "user_cancelled",
            });
          }
        } catch {
          // ignore
        }

        try {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        } catch {
          // ignore
        }

        isRecordingRef.current = false;
        setIsRecording(false);

        stopMediaTracks();

        setBackendStatus("");
        setLiveTranscript("");

        return;
      }

      finalizeVoice();
    },
    [
      clearRecordingTimer,
      clearSilenceTimer,
      finalizeVoice,
      stopMediaTracks,
    ]
  );

  // ----------------------------------------------------------
  // START RECORDING
  // ----------------------------------------------------------

  const startRecording = useCallback(
    async (live = false) => {
      if (isProcessingRef.current || isPlayingRef.current) return;

      if (isRecordingRef.current) return;

      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Microphone is not supported by this browser.");
        return;
      }

      if (!socketRef.current?.connected) {
        setError("Voice connection is not available.");
        return;
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

        mediaStreamRef.current = stream;

        const mimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
        ];

        let selectedMime = "";

        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedMime = type;
            break;
          }
        }

        const recorder = selectedMime
          ? new MediaRecorder(stream, {
              mimeType: selectedMime,
            })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;

        audioChunksRef.current = [];

        isLiveVoiceRef.current = live;
        isRecordingRef.current = true;

        setIsLiveVoice(live);
        setIsRecording(true);
        setRecordSeconds(30);

        setBackendStatus(
          live
            ? "Live voice is listening…"
            : "Recording…"
        );

        setLiveTranscript("");

        recordingStartRef.current = Date.now();

        // ----------------------------------------------
        // BACKEND START
        // ----------------------------------------------

        socketRef.current.emit(SOCKET_EVENTS.START, {
          mode: live ? "live" : "record",
          maxDuration: 30,
        });

        // ----------------------------------------------
        // DATA
        // ----------------------------------------------

        recorder.ondataavailable = (event) => {
          if (!event.data || event.data.size === 0) {
            return;
          }

          audioChunksRef.current.push(event.data);

          try {
            socketRef.current?.emit(
              SOCKET_EVENTS.CHUNK,
              event.data
            );
          } catch {
            // ignore socket errors
          }
        };

        // ----------------------------------------------
        // STOP
        // ----------------------------------------------

        recorder.onstop = async () => {
          isRecordingRef.current = false;
          setIsRecording(false);

          clearRecordingTimer();
          clearSilenceTimer();

          stopMediaTracks();

          if (intentionalStopRef.current) {
            intentionalStopRef.current = false;
          }

          // Backend receives end event.
          try {
            socketRef.current?.emit(
              SOCKET_EVENTS.END,
              {
                mode: isLiveVoiceRef.current
                  ? "live"
                  : "record",
              }
            );
          } catch {
            // ignore
          }

          mediaRecorderRef.current = null;
        };

        // ----------------------------------------------
        // RECORD
        // ----------------------------------------------

        recorder.start(250);

        // ----------------------------------------------
        // 30 SECOND COUNTDOWN
        // ----------------------------------------------

        recordingTimerRef.current = setInterval(() => {
          const elapsed = Math.floor(
            (Date.now() - recordingStartRef.current) / 1000
          );

          const remaining = Math.max(
            0,
            30 - elapsed
          );

          setRecordSeconds(remaining);

          if (remaining <= 0) {
            clearRecordingTimer();

            if (mediaRecorderRef.current) {
              finalizeVoice();
            }
          }
        }, 250);

        // ----------------------------------------------
        // LIVE VOICE SILENCE DETECTION
        // ----------------------------------------------
        //
        // The actual silence decision is done locally.
        // 1.8 seconds of silence => send current chunk.
        //
        // A MediaRecorder itself doesn't provide reliable
        // speech-level silence detection, so AudioContext
        // is used for RMS monitoring.
        //

        if (live) {
          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (AudioContextClass) {
            const audioContext =
              new AudioContextClass();

            const source =
              audioContext.createMediaStreamSource(
                stream
              );

            const analyser =
              audioContext.createAnalyser();

            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.82;

            source.connect(analyser);

            const data =
              new Uint8Array(
                analyser.fftSize
              );

            let lastVoiceTime = Date.now();
            let hadVoice = false;
            let rafId = null;

            const detectSilence = () => {
              if (
                !isRecordingRef.current ||
                !isLiveVoiceRef.current
              ) {
                try {
                  cancelAnimationFrame(rafId);
                } catch {
                  // ignore
                }

                try {
                  audioContext.close();
                } catch {
                  // ignore
                }

                return;
              }

              analyser.getByteTimeDomainData(data);

              let sum = 0;

              for (let i = 0; i < data.length; i++) {
                const normalized =
                  (data[i] - 128) / 128;

                sum += normalized * normalized;
              }

              const rms = Math.sqrt(
                sum / data.length
              );

              // Conservative threshold.
              const speaking =
                rms > 0.025;

              if (speaking) {
                hadVoice = true;
                lastVoiceTime = Date.now();

                clearSilenceTimer();

                setBackendStatus(
                  "Live voice • listening…"
                );
              }

              if (
                hadVoice &&
                Date.now() - lastVoiceTime >= 1800
              ) {
                clearSilenceTimer();

                try {
                  audioContext.close();
                } catch {
                  // ignore
                }

                finalizeVoice();

                return;
              }

              rafId =
                requestAnimationFrame(
                  detectSilence
                );
            };

            detectSilence();
          }
        }
      } catch (err) {
        isRecordingRef.current = false;

        setIsRecording(false);

        stopMediaTracks();

        setError(
          err?.message ||
            "Could not access the microphone."
        );
      }
    },
    [
      clearRecordingTimer,
      clearSilenceTimer,
      finalizeVoice,
      stopMediaTracks,
    ]
  );

  // ----------------------------------------------------------
  // SEND TEXT
  // ----------------------------------------------------------

  const sendText = useCallback(async () => {
    const text = input.trim();

    if (!text) return;

    if (isProcessingRef.current || isPlayingRef.current) {
      return;
    }

    setError("");
    setInput("");

    addUserMessage(text, false);

    const assistantId = createAssistantMessage();

    setIsProcessing(true);
    isProcessingRef.current = true;

    setBackendStatus("AI is reasoning…");

    try {
      const response = await fetch(
        `${API_URL}/api/antimate/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            message: text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Request failed (${response.status})`
        );
      }

      const data = await response.json();

      const answer =
        getAnswerFromPayload(data) ||
        "Nta gisubizo cyagarutse.";

      currentAssistantIdRef.current =
        assistantId;

      currentAnswerRef.current = answer;

      updateAssistantMessage(answer);

      setBackendStatus("");

      setIsProcessing(false);
      isProcessingRef.current = false;
    } catch (err) {
      setIsProcessing(false);
      isProcessingRef.current = false;

      setBackendStatus("");

      setError(
        err?.message ||
          "Unable to connect to ANTIMATE AI."
      );

      setMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== assistantId
        )
      );
    }
  }, [
    input,
    addUserMessage,
    createAssistantMessage,
    updateAssistantMessage,
  ]);

  // ----------------------------------------------------------
  // SOCKET.IO
  // ----------------------------------------------------------

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socketRef.current = socket;

    // ----------------------------------------------
    // CONNECT
    // ----------------------------------------------

    socket.on("connect", () => {
      setSocketConnected(true);

      setError("");

      console.log(
        "🔌 ANTIMATE Socket connected:",
        socket.id
      );
    });

    // ----------------------------------------------
    // DISCONNECT
    // ----------------------------------------------

    socket.on("disconnect", (reason) => {
      setSocketConnected(false);

      console.log(
        "🔌 ANTIMATE Socket disconnected:",
        reason
      );
    });

    // ----------------------------------------------
    // STATUS
    // ----------------------------------------------

    socket.on(
      SOCKET_EVENTS.STATUS,
      (payload) => {
        if (
          typeof payload === "string"
        ) {
          setBackendStatus(payload);
          return;
        }

        const status =
          payload?.status ||
          payload?.message ||
          "";

        if (status) {
          setBackendStatus(status);
        }
      }
    );

    // ----------------------------------------------
    // THINKING
    // ----------------------------------------------

    socket.on(
      SOCKET_EVENTS.THINKING,
      (payload) => {
        const text =
          typeof payload === "string"
            ? payload
            : payload?.message ||
              payload?.status ||
              "AI is reasoning…";

        setBackendStatus(text);
        setIsProcessing(true);
        isProcessingRef.current = true;
      }
    );

    // ----------------------------------------------
    // TRANSCRIPT
    // ----------------------------------------------

    socket.on(
      SOCKET_EVENTS.TRANSCRIPT,
      (payload) => {
        const transcript =
          getTranscriptFromPayload(payload);

        if (!transcript) return;

        setLiveTranscript(transcript);

        // If this is a final transcript,
        // put it on user's side.
        if (
          payload?.final === true ||
          payload?.isFinal === true ||
          payload?.complete === true
        ) {
          addUserMessage(
            transcript,
            true
          );

          setLiveTranscript("");
        }
      }
    );

    // ----------------------------------------------
    // ANSWER
    // ----------------------------------------------

    socket.on(
      SOCKET_EVENTS.ANSWER,
      (payload) => {
        const answer =
          getAnswerFromPayload(payload);

        if (!answer) return;

        currentAnswerRef.current = answer;

        if (!currentAssistantIdRef.current) {
          createAssistantMessage();
        }

        updateAssistantMessage(answer);

        setBackendStatus("");

        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    );

    // ----------------------------------------------
    // ANSWER CHUNK
    // ----------------------------------------------

    socket.on(
      SOCKET_EVENTS.ANSWER_CHUNK,
      (payload) => {
        const chunk =
          getAnswerFromPayload(payload);

        if (!chunk) return;

        const nextAnswer =
          currentAnswerRef.current + chunk;

        currentAnswerRef.current =
          nextAnswer;

        if (!currentAssistantIdRef.current) {
          createAssistantMessage();
        }

        updateAssistantMessage(
          nextAnswer
        );

        // As soon as answer text starts
        // arriving, reasoning is no longer shown.
        setBackendStatus("");

        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    );

    // ----------------------------------------------
    // AUDIO
    // ----------------------------------------------

    socket.on(
      SOCKET_EVENTS.AUDIO,
      (payload) => {
        const audioUrl =
          typeof payload === "string"
            ? payload
            : payload?.audioUrl ||
              payload?.url ||
              payload?.audio ||
              null;

        if (!audioUrl) return;

        if (!currentAssistantIdRef.current) {
          createAssistantMessage();
        }

        updateAssistantMessage(
          currentAnswerRef.current,
          audioUrl
        );

        setBackendStatus("");

        setIsProcessing(false);
        isProcessingRef.current = false;

        // Automatically play AI voice.
        playAudio(audioUrl);
      }
    );

    // ----------------------------------------------
    // COMPLETE
    // ----------------------------------------------

    socket.on(
      SOCKET_EVENTS.COMPLETE,
      (payload) => {
        const answer =
          getAnswerFromPayload(payload);

        if (answer) {
          currentAnswerRef.current =
            answer;

          if (
            !currentAssistantIdRef.current
          ) {
            createAssistantMessage();
          }

          updateAssistantMessage(
            answer,
            payload?.audioUrl ||
              payload?.url ||
              null
          );
        }

        setBackendStatus("");

        if (!isPlayingRef.current) {
          setIsProcessing(false);
          isProcessingRef.current = false;
        }

        // Live mode becomes ready after completion
        // if there is no audio or audio already ended.
        if (
          isLiveVoiceRef.current &&
          !isPlayingRef.current
        ) {
          setIsProcessing(false);
          isProcessingRef.current = false;
          setBackendStatus(
            "Live voice ready"
          );
        }
      }
    );

    // ----------------------------------------------
    // ERROR
    // ----------------------------------------------

    socket.on(
      SOCKET_EVENTS.ERROR,
      (payload) => {
        const message =
          typeof payload === "string"
            ? payload
            : payload?.message ||
              payload?.error ||
              "Voice processing failed.";

        setError(message);

        setBackendStatus("");

        setIsProcessing(false);
        isProcessingRef.current = false;

        isRecordingRef.current = false;
        setIsRecording(false);

        stopMediaTracks();
      }
    );

    // ----------------------------------------------
    // CLEANUP
    // ----------------------------------------------

    return () => {
      clearRecordingTimer();
      clearSilenceTimer();

      try {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !==
            "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }

      stopMediaTracks();

      try {
        socket.removeAllListeners();
        socket.disconnect();
      } catch {
        // ignore
      }

      socketRef.current = null;
    };
  }, [
    addUserMessage,
    clearRecordingTimer,
    clearSilenceTimer,
    createAssistantMessage,
    playAudio,
    stopMediaTracks,
    updateAssistantMessage,
  ]);

  // ----------------------------------------------------------
  // ACTION BUTTON
  // ----------------------------------------------------------

  const handleAction = useCallback(() => {
    const hasText = input.trim().length > 0;

    if (isProcessing || isPlaying) {
      return;
    }

    if (hasText) {
      sendText();
      return;
    }

    // Empty input:
    // Start normal 30s recording.
    startRecording(false);
  }, [
    input,
    isProcessing,
    isPlaying,
    sendText,
    startRecording,
  ]);

  // ----------------------------------------------------------
  // KEYBOARD
  // ----------------------------------------------------------

  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        if (input.trim()) {
          sendText();
        }
      }
    },
    [input, sendText]
  );

  // ----------------------------------------------------------
  // AUTO RESIZE
  // ----------------------------------------------------------

  useEffect(() => {
    const element = inputRef.current;

    if (!element) return;

    element.style.height = "auto";

    element.style.height = `${Math.min(
      element.scrollHeight,
      130
    )}px`;
  }, [input]);

  // ----------------------------------------------------------
  // POINTER HOLD / RECORDING
  // ----------------------------------------------------------
  //
  // Important:
  // We don't use a second voice button.
  //
  // The same button:
  //
  // Empty:
  //   normal click -> 30s record
  //
  // Live voice:
  //   controlled through long press.
  //
  // To keep the UI simple, the user can start
  // Live Voice from the small mode area that appears
  // above the composer while empty.
  //
  // ----------------------------------------------------------

  const [voiceMode, setVoiceMode] = useState("record");

  const toggleVoiceMode = useCallback(() => {
    if (
      isRecording ||
      isProcessing ||
      isPlaying
    ) {
      return;
    }

    setVoiceMode((current) =>
      current === "record"
        ? "live"
        : "record"
    );
  }, [
    isRecording,
    isProcessing,
    isPlaying,
  ]);

  // ----------------------------------------------------------
  // VOICE MODE START
  // ----------------------------------------------------------

  const startSelectedVoiceMode = useCallback(() => {
    if (
      isRecording ||
      isProcessing ||
      isPlaying
    ) {
      return;
    }

    startRecording(
      voiceMode === "live"
    );
  }, [
    isRecording,
    isProcessing,
    isPlaying,
    startRecording,
    voiceMode,
  ]);

  // ----------------------------------------------------------
  // ACTION BUTTON VISUAL STATE
  // ----------------------------------------------------------

  const actionState = useMemo(() => {
    if (isProcessing) {
      return {
        icon: "⋯",
        className: "",
        label: "AI is reasoning",
      };
    }

    if (isPlaying) {
      return {
        icon: "◖",
        className: "live",
        label: "AI is speaking",
      };
    }

    if (isRecording) {
      return {
        icon: "■",
        className:
          voiceMode === "live"
            ? "live"
            : "recording",
        label:
          voiceMode === "live"
            ? "Stop live voice"
            : "Stop recording",
      };
    }

    if (input.trim()) {
      return {
        icon: "➤",
        className: "",
        label: "Send message",
      };
    }

    return {
      icon: "◉",
      className:
        voiceMode === "live"
          ? "live"
          : "",
      label:
        voiceMode === "live"
          ? "Start live voice"
          : "Start recording",
    };
  }, [
    input,
    isProcessing,
    isPlaying,
    isRecording,
    voiceMode,
  ]);

  // ----------------------------------------------------------
  // ACTION BUTTON CLICK
  // ----------------------------------------------------------

  const onActionButtonClick = useCallback(() => {
    if (isProcessing || isPlaying) return;

    if (isRecording) {
      stopRecording(false);
      return;
    }

    if (input.trim()) {
      sendText();
      return;
    }

    startSelectedVoiceMode();
  }, [
    input,
    isPlaying,
    isProcessing,
    isRecording,
    sendText,
    startSelectedVoiceMode,
    stopRecording,
  ]);

  // ----------------------------------------------------------
  // REPLAY
  // ----------------------------------------------------------

  const replay = useCallback(
    (audioUrl) => {
      if (!audioUrl) return;

      playAudio(audioUrl);
    },
    [playAudio]
  );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div
      className={`antimate-page ${
        theme === "light" ? "light" : "dark"
      }`}
    >
      <style>{styles}</style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="antimate-header">
        <div className="brand">
          <div className="brand-logo">
            <img
              src={ANTIMATE_LOGO}
              alt="ANTIMATE AI"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";

                const parent =
                  event.currentTarget.parentElement;

                if (
                  parent &&
                  !parent.querySelector(
                    ".brand-fallback"
                  )
                ) {
                  const fallback =
                    document.createElement("div");

                  fallback.className =
                    "brand-fallback";

                  parent.appendChild(
                    fallback
                  );
                }
              }}
            />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              ANTIMATE AI
            </div>

            <div className="brand-subtitle">
              Smart Brooder Intelligence
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="connection">
            <span
              className={`connection-dot ${
                socketConnected
                  ? "online"
                  : ""
              }`}
            />

            {socketConnected
              ? "Connected"
              : "Connecting…"}
          </div>

          <button
            type="button"
            className="theme-button"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme((current) =>
                current === "dark"
                  ? "light"
                  : "dark"
              )
            }
          >
            {theme === "dark"
              ? "☀"
              : "☾"}
          </button>
        </div>
      </header>

      {/* =====================================================
          CHAT
          ===================================================== */}

      <main className="chat-shell">
        <section className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-inner">
                <div className="hero-logo">
                  <img
                    src={ANTIMATE_LOGO}
                    alt="ANTIMATE AI"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";

                      const parent =
                        event.currentTarget
                          .parentElement;

                      if (
                        parent &&
                        !parent.querySelector(
                          ".hero-fallback"
                        )
                      ) {
                        const fallback =
                          document.createElement(
                            "div"
                          );

                        fallback.className =
                          "hero-fallback";

                        parent.appendChild(
                          fallback
                        );
                      }
                    }}
                  />
                </div>

                <h1 className="hero-title">
                  Muraho, ndi{" "}
                  <span>ANTIMATE AI</span>
                </h1>

                <p className="hero-description">
                  Umufasha wawe w'ubworozi.
                  Andika ikibazo cyangwa ukoreshe
                  ijwi kugira ngo tubashe kugufasha
                  mu buryo bwihuse kandi bworoshye.
                </p>
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-row ${
                    message.role === "user"
                      ? "user"
                      : "ai"
                  }`}
                >
                  <div className="message-wrap">
                    <div className="message-meta">
                      {message.role === "ai" ? (
                        <>
                          <div className="ai-avatar">
                            <img
                              src={ANTIMATE_LOGO}
                              alt=""
                            />
                          </div>

                          <span>
                            ANTIMATE AI
                          </span>
                        </>
                      ) : (
                        <span className="user-label">
                          Wowe
                        </span>
                      )}
                    </div>

                    <div className="message-bubble">
                      {message.text}

                      {message.voice && (
                        <div className="voice-transcript">
                          🎙️ Voice message
                        </div>
                      )}

                      {message.role === "ai" &&
                        message.audioUrl && (
                          <div className="audio-card">
                            <button
                              type="button"
                              className="replay-button"
                              onClick={() =>
                                replay(
                                  message.audioUrl
                                )
                              }
                              aria-label="Replay AI voice"
                            >
                              ▶
                            </button>

                            <span className="audio-label">
                              Replay AI voice
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}

              {/* -----------------------------------------
                  USER LIVE TRANSCRIPT
                  ----------------------------------------- */}

              {liveTranscript && (
                <div className="message-row user">
                  <div className="message-wrap">
                    <div className="message-meta">
                      <span className="user-label">
                        Wowe • listening…
                      </span>
                    </div>

                    <div className="message-bubble">
                      {liveTranscript}
                    </div>
                  </div>
                </div>
              )}

              {/* -----------------------------------------
                  AI REASONING
                  ----------------------------------------- */}

              {isProcessing &&
                !currentAnswerRef.current && (
                  <div className="message-row ai">
                    <div className="message-wrap">
                      <div className="message-meta">
                        <div className="ai-avatar">
                          <img
                            src={ANTIMATE_LOGO}
                            alt=""
                          />
                        </div>

                        <span>
                          ANTIMATE AI
                        </span>
                      </div>

                      <div className="reasoning">
                        <span>
                          {backendStatus ||
                            "AI is reasoning…"}
                        </span>

                        <span className="reasoning-dots">
                          <span />
                          <span />
                          <span />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {error && (
                <div className="error-line">
                  {error}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* =====================================================
          COMPOSER
          ===================================================== */}

      <div className="composer-fixed">
        <div className="composer-status">
          {isRecording ? (
            <div className="live-indicator">
              <span className="live-indicator-dot" />

              {voiceMode === "live"
                ? "Live Voice • ceceka 1.8s kugira ngo wohereze"
                : `Recording • ${recordSeconds}s`}
            </div>
          ) : isPlaying ? (
            "ANTIMATE AI is speaking…"
          ) : isProcessing ? (
            backendStatus ||
            "AI is reasoning…"
          ) : !input.trim() ? (
            <>
              <button
                type="button"
                onClick={toggleVoiceMode}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--text-soft)",
                  cursor: "pointer",
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "8px",
                }}
              >
                {voiceMode === "record"
                  ? "🎙 Record • 30s"
                  : "◉ Live Voice"}
              </button>
            </>
          ) : null}
        </div>

        <div
          className={`composer ${
            isRecording
              ? voiceMode === "live"
                ? "live"
                : "recording"
              : ""
          }`}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            disabled={
              isRecording ||
              isProcessing ||
              isPlaying
            }
            placeholder={
              isRecording
                ? voiceMode === "live"
                  ? "ANTIMATE AI iri kumva…"
                  : "Vuga ikibazo cyawe…"
                : "Andika ikibazo cyawe…"
            }
            rows={1}
            aria-label="Message"
          />

          <button
            type="button"
            className={`action-button ${actionState.className}`}
            onClick={onActionButtonClick}
            disabled={
              isProcessing ||
              isPlaying ||
              (
                !input.trim() &&
                !socketConnected
              )
            }
            aria-label={actionState.label}
            title={actionState.label}
          >
            <span className="action-icon">
              {actionState.icon}
            </span>

            {isRecording &&
              voiceMode === "record" && (
                <span className="record-count">
                  {recordSeconds}
                </span>
              )}
          </button>
        </div>
      </div>

      {/* =====================================================
          AUDIO ELEMENT
          ===================================================== */}

      <audio
        ref={audioRef}
        style={{ display: "none" }}
      />
    </div>
  );
}