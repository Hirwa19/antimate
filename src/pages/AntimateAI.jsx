
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const MAX_MESSAGE_LENGTH = 12000;
const REVEAL_SPEED = 12;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default function AntimateAI() {
  // =====================================================
  // STATE
  // =====================================================

  const [conversationId, setConversationId] =
    useState(createId);

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [language, setLanguage] = useState("rw");

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const signedIn = Boolean(getToken());

  // =====================================================
  // SCROLL
  // =====================================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, busy]);

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // =====================================================
  // NEW CHAT
  // =====================================================

  const newChat = useCallback(() => {
    if (busy) return;

    abortRef.current?.abort();

    setConversationId(createId());
    setMessages([]);
    setInput("");
    setError("");
    setSidebarOpen(false);

    inputRef.current?.focus();
  }, [busy]);

  // =====================================================
  // INCREMENTAL TEXT REVEAL
  // =====================================================

  const revealAnswer = useCallback(
    async (messageId, fullText, signal) => {
      let position = 0;

      while (
        position < fullText.length &&
        !signal.aborted
      ) {
        const remaining = fullText.length - position;

        const chunkSize =
          remaining > 500 ? 12 :
          remaining > 200 ? 8 :
          remaining > 80 ? 5 : 3;

        position = Math.min(
          position + chunkSize,
          fullText.length
        );

        const visibleText = fullText.slice(
          0,
          position
        );

        setMessages((previous) =>
          previous.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  text: visibleText,
                  streaming:
                    position < fullText.length,
                }
              : message
          )
        );

        await wait(REVEAL_SPEED);
      }

      if (!signal.aborted) {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  text: fullText,
                  streaming: false,
                }
              : message
          )
        );
      }
    },
    []
  );

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = useCallback(async () => {
    const cleanText = input.trim();

    if (!cleanText || busy) return;

    if (cleanText.length > MAX_MESSAGE_LENGTH) {
      setError(
        `Ubutumwa ntibugomba kurenza inyuguti ${MAX_MESSAGE_LENGTH}.`
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Ugomba kubanza kwinjira muri konti kugira ngo ukoreshe ANTIMATE AI."
      );
      return;
    }

    const history = messages.map((message) => ({
      role: message.role,
      content: message.text,
    }));

    const userMessage = {
      id: createMessageId(),
      role: "user",
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput("");
    setError("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        signal: controller.signal,

        body: JSON.stringify({
          message: cleanText,
          history,
          language,
          conversation_id: conversationId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        const requestError = new Error(
          data.message ||
          data.error ||
          "ANTIMATE ntiyashoboye gusubiza."
        );

        requestError.status = response.status;

        throw requestError;
      }

      const answer = String(
        data.answer ||
        data.answer_rw ||
        data.answer_kinyarwanda ||
        data.answer_english ||
        ""
      ).trim();

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const assistantMessageId = createMessageId();

      const assistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        text: "",
        streaming: true,
        status: data.status || "completed",
        language: data.language || language,
        createdAt: new Date().toISOString(),
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      await revealAnswer(
        assistantMessageId,
        answer,
        controller.signal
      );

    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(
          requestError.status === 401
            ? "Ugomba kwinjira muri konti kugira ngo ukoreshe ANTIMATE AI."
            : requestError.message ||
              "Habaye ikibazo mu kohereza ubutumwa."
        );
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
        inputRef.current?.focus();
      }
    }
  }, [
    input,
    busy,
    messages,
    language,
    conversationId,
    revealAnswer,
  ]);

  // =====================================================
  // STOP GENERATION
  // =====================================================

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  // =====================================================
  // COPY MESSAGE
  // =====================================================

  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Ntibyashobotse gukoporora ubutumwa.");
    }
  };

  // =====================================================
  // KEYBOARD
  // =====================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className={`antimate-app ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap'
        );

        * {
          box-sizing: border-box;
        }

        .antimate-app {
          --background: #ffffff;
          --sidebar: #f8f8f7;
          --surface: #ffffff;
          --surface-hover: #eeeeec;
          --text: #292a27;
          --secondary: #777873;
          --border: #e8e8e5;
          --accent: #176b4d;
          --user-message: #f2f2ef;
          --input-background: #ffffff;
          --error-background: #fff1ef;
          --error-color: #a13c30;

          width: 100%;
          height: 100dvh;
          min-height: 0;

          display: flex;
          overflow: hidden;

          background: var(--background);
          color: var(--text);

          font-family:
            "DM Sans",
            system-ui,
            sans-serif;
        }

        /* =========================================
           SIDEBAR
        ========================================= */

        .am-sidebar {
          width: 250px;
          min-width: 250px;
          height: 100%;

          display: flex;
          flex-direction: column;

          background: var(--sidebar);
          border-right: 1px solid var(--border);

          padding: 15px 12px;

          transition:
            width .2s ease,
            min-width .2s ease,
            transform .2s ease;
        }

        .sidebar-collapsed .am-sidebar {
          width: 68px;
          min-width: 68px;
          padding: 15px 10px;
        }

        .am-sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          min-height: 42px;
          margin-bottom: 25px;
        }

        .am-brand {
          display: flex;
          align-items: center;
          gap: 10px;

          overflow: hidden;
          white-space: nowrap;

          font: 800 16px Manrope, sans-serif;
          letter-spacing: -.5px;
        }

        .am-logo {
          width: 35px;
          height: 35px;
          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 11px;
          background: var(--accent);
          color: #ffffff;

          font: 800 17px Manrope, sans-serif;
        }

        .am-sidebar-actions {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .am-icon-button {
          width: 40px;
          height: 40px;
          flex-shrink: 0;

          display: grid;
          place-items: center;

          border: 0;
          border-radius: 10px;

          background: transparent;
          color: var(--secondary);

          cursor: pointer;

          transition:
            background .15s ease,
            color .15s ease;
        }

        .am-icon-button:hover {
          background: var(--surface-hover);
          color: var(--text);
        }

        .am-icon-button svg {
          width: 19px;
          height: 19px;

          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .am-new-chat {
          width: 100%;
          height: 43px;

          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 11px;

          padding: 0 11px;

          border: 1px solid var(--border);
          border-radius: 11px;

          background: var(--surface);
          color: var(--text);

          cursor: pointer;
        }

        .am-new-chat:hover {
          background: var(--surface-hover);
        }

        .am-new-chat svg {
          width: 19px;
          height: 19px;
          flex-shrink: 0;

          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .am-new-chat span {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        .sidebar-collapsed .am-new-chat {
          justify-content: center;
          padding: 0;
        }

        .sidebar-collapsed .am-new-chat span,
        .sidebar-collapsed .am-brand span,
        .sidebar-collapsed .am-sidebar-bottom {
          display: none;
        }

        .am-sidebar-bottom {
          margin-top: auto;
          padding: 13px 7px 3px;

          border-top: 1px solid var(--border);

          color: var(--secondary);
          font-size: 11px;
          line-height: 1.6;
        }

        /* =========================================
           MAIN AREA
        ========================================= */

        .am-main {
          min-width: 0;
          min-height: 0;
          flex: 1;

          display: flex;
          flex-direction: column;

          background: var(--background);
        }

        .am-header {
          height: 59px;
          min-height: 59px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 24px;

          border-bottom: 1px solid var(--border);
          background: var(--background);
        }

        .am-header-left,
        .am-header-right {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .am-header-title {
          font: 700 14px Manrope, sans-serif;
          letter-spacing: -.2px;
        }

        .am-language {
          height: 34px;

          padding: 0 10px;

          border: 1px solid var(--border);
          border-radius: 9px;

          background: var(--surface);
          color: var(--text);

          font: 500 12px "DM Sans", sans-serif;
          outline: none;
          cursor: pointer;
        }

        .am-language:focus-visible,
        .am-icon-button:focus-visible,
        .am-send:focus-visible,
        .am-compose textarea:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
        }

        .am-mobile-menu {
          display: none;
        }

        /* =========================================
           CHAT AREA
        ========================================= */

        .am-chat-area {
          width: 100%;
          min-height: 0;
          flex: 1;

          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        .am-feed {
          width: 100%;
          max-width: 900px;

          min-height: 0;
          flex: 1;

          margin: 0 auto;
          padding: 35px 30px 20px;

          overflow-y: auto;
          overscroll-behavior: contain;

          scrollbar-width: thin;
          scrollbar-color: #d5d5d0 transparent;
        }

        /* =========================================
           WELCOME SCREEN
        ========================================= */

        .am-welcome {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          text-align: center;
          padding: 20px;
        }

        .am-welcome-logo {
          width: 54px;
          height: 54px;

          display: grid;
          place-items: center;

          margin-bottom: 22px;

          border-radius: 17px;

          background: var(--accent);
          color: white;

          font: 800 24px Manrope, sans-serif;
        }

        .am-welcome h1 {
          margin: 0 0 10px;

          font: 700 clamp(25px, 4vw, 34px)
            Manrope, sans-serif;

          letter-spacing: -1.3px;
        }

        .am-welcome p {
          margin: 0;

          color: var(--secondary);
          font-size: 14px;
          line-height: 1.7;
        }

        /* =========================================
           MESSAGES
        ========================================= */

        .am-message {
          display: flex;
          flex-direction: column;

          margin-bottom: 31px;
          animation: am-message-in .18s ease-out;
        }

        @keyframes am-message-in {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .am-user-row {
          display: flex;
          justify-content: flex-end;
        }

        .am-user-bubble {
          max-width: min(80%, 690px);

          padding: 12px 16px;

          border-radius: 18px 18px 5px 18px;

          background: var(--user-message);
          color: var(--text);

          font-size: 14px;
          line-height: 1.8;

          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .am-assistant-message {
          width: 100%;
          max-width: 100%;
        }

        .am-assistant-label {
          display: flex;
          align-items: center;
          gap: 9px;

          margin-bottom: 10px;

          color: var(--text);
          font: 700 12px Manrope, sans-serif;
        }

        .am-assistant-mark {
          width: 25px;
          height: 25px;

          display: grid;
          place-items: center;

          border-radius: 8px;

          background: var(--accent);
          color: white;

          font: 800 12px Manrope, sans-serif;
        }

        .am-assistant-text {
          color: var(--text);

          font-size: 14px;
          line-height: 1.9;

          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .am-cursor {
          display: inline-block;

          width: 2px;
          height: 15px;

          margin-left: 3px;

          vertical-align: -2px;

          background: var(--accent);

          animation: am-blink .8s infinite;
        }

        @keyframes am-blink {
          50% {
            opacity: 0;
          }
        }

        .am-message-actions {
          display: flex;
          align-items: center;
          gap: 5px;

          margin-top: 11px;
        }

        .am-message-actions button {
          width: 32px;
          height: 32px;

          display: grid;
          place-items: center;

          border: 0;
          border-radius: 8px;

          background: transparent;
          color: var(--secondary);

          cursor: pointer;
        }

        .am-message-actions button:hover {
          background: var(--surface-hover);
          color: var(--text);
        }

        .am-message-actions svg {
          width: 16px;
          height: 16px;

          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* =========================================
           THINKING INDICATOR
        ========================================= */

        .am-loading {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 7px 0 19px;

          color: var(--secondary);
          font-size: 13px;
        }

        .am-loading-dots {
          display: flex;
          gap: 4px;
        }

        .am-loading-dots i {
          width: 5px;
          height: 5px;

          border-radius: 50%;
          background: var(--accent);

          animation: am-pulse 1s infinite;
        }

        .am-loading-dots i:nth-child(2) {
          animation-delay: .15s;
        }

        .am-loading-dots i:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes am-pulse {
          50% {
            opacity: .3;
            transform: translateY(-3px);
          }
        }

        /* =========================================
           ERROR
        ========================================= */

        .am-error {
          width: min(100%, 850px);

          margin: 0 auto 10px;
          padding: 10px 13px;

          border: 1px solid #efc4bd;
          border-radius: 10px;

          background: var(--error-background);
          color: var(--error-color);

          font-size: 12px;
          line-height: 1.6;
        }

        /* =========================================
           COMPOSER
        ========================================= */

        .am-composer-area {
          width: 100%;
          flex-shrink: 0;

          padding: 12px 25px 16px;

          background: var(--background);
        }

        .am-composer {
          width: 100%;
          max-width: 850px;

          margin: 0 auto;

          border: 1px solid #dcded9;
          border-radius: 17px;

          background: var(--input-background);

          box-shadow:
            0 3px 14px rgba(0, 0, 0, .045);

          transition:
            border-color .15s ease,
            box-shadow .15s ease;
        }

        .am-composer:focus-within {
          border-color: #a5b9ac;

          box-shadow:
            0 3px 17px rgba(23, 107, 77, .08);
        }

        .am-compose textarea {
          display: block;

          width: 100%;
          min-height: 56px;
          max-height: 180px;

          resize: vertical;

          padding: 15px 16px 7px;

          border: 0;
          outline: none;

          border-radius: 17px;

          background: transparent;
          color: var(--text);

          font: 14px/1.7 "DM Sans", sans-serif;
        }

        .am-compose textarea::placeholder {
          color: #92958e;
          opacity: 1;
        }

        .am-compose-bottom {
          min-height: 47px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 10px 8px 15px;
        }

        .am-compose-hint {
          color: var(--secondary);
          font-size: 10px;
        }

        .am-compose-controls {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .am-send {
          width: 35px;
          height: 35px;

          display: grid;
          place-items: center;

          border: 0;
          border-radius: 11px;

          background: var(--accent);
          color: white;

          cursor: pointer;

          transition:
            background .15s ease,
            opacity .15s ease;
        }

        .am-send:hover:not(:disabled) {
          background: #10563d;
        }

        .am-send:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        .am-send svg {
          width: 18px;
          height: 18px;

          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .am-stop {
          background: #343a35;
        }

        .am-stop:hover {
          background: #1f2420;
        }

        .am-footer {
          padding-top: 10px;

          color: var(--secondary);
          text-align: center;

          font-size: 10px;
        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 760px) {
          .am-sidebar {
            position: fixed;
            z-index: 50;

            top: 0;
            bottom: 0;
            left: 0;

            width: 250px;
            min-width: 250px;

            transform: translateX(-105%);

            box-shadow:
              10px 0 35px rgba(0, 0, 0, .12);
          }

          .am-sidebar.mobile-open {
            transform: translateX(0);
          }

          .sidebar-collapsed .am-sidebar {
            width: 250px;
            min-width: 250px;
          }

          .sidebar-collapsed .am-new-chat {
            justify-content: flex-start;
            padding: 0 11px;
          }

          .sidebar-collapsed .am-new-chat span,
          .sidebar-collapsed .am-brand span,
          .sidebar-collapsed .am-sidebar-bottom {
            display: initial;
          }

          .am-mobile-menu {
            display: grid;
          }

          .am-header {
            height: 55px;
            min-height: 55px;
            padding: 0 12px;
          }

          .am-header-title {
            font-size: 13px;
          }

          .am-feed {
            padding: 24px 17px 16px;
          }

          .am-user-bubble {
            max-width: 94%;
          }

          .am-composer-area {
            padding: 10px 12px 12px;
          }

          .am-compose-hint {
            font-size: 9px;
          }
        }

        @media (max-width: 380px) {
          .am-header {
            padding: 0 8px;
          }

          .am-feed {
            padding-left: 12px;
            padding-right: 12px;
          }

          .am-language {
            padding: 0 6px;
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
        }

      `}</style>

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside
        className={`am-sidebar ${
          sidebarOpen ? "mobile-open" : ""
        }`}
      >
        <div className="am-sidebar-top">
          <div className="am-brand">
            <div className="am-logo">A</div>
            <span>ANTIMATE</span>
          </div>

          <button
            className="am-icon-button"
            type="button"
            onClick={() => {
              setSidebarCollapsed((value) => !value);
              setSidebarOpen(false);
            }}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
            </svg>
          </button>
        </div>

        <div className="am-sidebar-actions">
          <button
            className="am-new-chat"
            type="button"
            onClick={newChat}
            disabled={busy}
            aria-label="New chat"
            title="New chat"
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>

            <span>New chat</span>
          </button>
        </div>

        <div className="am-sidebar-bottom">
          {signedIn
            ? "Signed in to ANTIMATE"
            : "Guest session"}
        </div>
      </aside>

      {/* =========================================
          MAIN
      ========================================= */}

      <main className="am-main">

        {/* HEADER */}

        <header className="am-header">
          <div className="am-header-left">
            <button
              className="am-icon-button am-mobile-menu"
              type="button"
              onClick={() =>
                setSidebarOpen((value) => !value)
              }
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className="am-header-title">
              ANTIMATE AI
            </span>
          </div>

          <div className="am-header-right">
            <select
              className="am-language"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
              disabled={busy}
              aria-label="Response language"
            >
              <option value="rw">Kinyarwanda</option>
              <option value="en">English</option>
            </select>
          </div>
        </header>

        {/* CHAT */}

        <section className="am-chat-area">

          <div
            className="am-feed"
            aria-live="polite"
            aria-relevant="additions text"
          >

            {/* WELCOME */}

            {messages.length === 0 && (
              <div className="am-welcome">
                <div className="am-welcome-logo">
                  A
                </div>

                <h1>Muraho, ndi ANTIMATE.</h1>

                <p>
                  Ni iki twaganiraho uyu munsi?
                </p>
              </div>
            )}

            {/* MESSAGES */}

            {messages.map((message) => (
              <article
                className="am-message"
                key={message.id}
              >
                {message.role === "user" ? (
                  <div className="am-user-row">
                    <div className="am-user-bubble">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div className="am-assistant-message">
                    <div className="am-assistant-label">
                      <span className="am-assistant-mark">
                        A
                      </span>

                      <span>ANTIMATE</span>
                    </div>

                    <div className="am-assistant-text">
                      {message.text}

                      {message.streaming && (
                        <span className="am-cursor" />
                      )}
                    </div>

                    {!message.streaming &&
                      message.text && (
                        <div className="am-message-actions">
                          <button
                            type="button"
                            onClick={() =>
                              copyMessage(message.text)
                            }
                            aria-label="Copy response"
                            title="Copy response"
                          >
                            <svg viewBox="0 0 24 24">
                              <rect
                                x="8"
                                y="8"
                                width="12"
                                height="12"
                                rx="2"
                              />
                              <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                            </svg>
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </article>
            ))}

            {/* WAITING FOR BACKEND */}

            {busy &&
              !messages.some(
                (message) =>
                  message.role === "assistant" &&
                  message.streaming
              ) && (
                <div className="am-loading">
                  <span className="am-loading-dots">
                    <i />
                    <i />
                    <i />
                  </span>

                  <span>ANTIMATE is thinking...</span>
                </div>
              )}

            <div ref={bottomRef} />
          </div>

          {/* ERROR */}

          {error && (
            <div className="am-error" role="alert">
              {error}
            </div>
          )}

          {/* COMPOSER */}

          <div className="am-composer-area">
            <form
              className="am-composer am-compose"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Message ANTIMATE..."
                rows={2}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={busy}
                aria-label="Message ANTIMATE"
              />

              <div className="am-compose-bottom">
                <span className="am-compose-hint">
                  Enter to send · Shift + Enter for new line
                </span>

                <div className="am-compose-controls">
                  {busy ? (
                    <button
                      className="am-send am-stop"
                      type="button"
                      onClick={stopGeneration}
                      aria-label="Stop response"
                      title="Stop response"
                    >
                      <svg viewBox="0 0 24 24">
                        <rect
                          x="6"
                          y="6"
                          width="12"
                          height="12"
                          rx="2"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      className="am-send"
                      type="submit"
                      disabled={!input.trim()}
                      aria-label="Send message"
                      title="Send message"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 19V5" />
                        <path d="m5 12 7-7 7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="am-footer">
              ANTIMATE may make mistakes. Verify important information.
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
