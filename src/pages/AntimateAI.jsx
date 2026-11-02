
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

const createId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `chat-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `msg-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

export default function AntimateAI() {
  // =====================================================
  // STATE
  // =====================================================

  const [conversationId, setConversationId] =
    useState(createId);

  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [language, setLanguage] =
    useState("rw");

  const [theme, setTheme] =
    useState("light");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [details, setDetails] =
    useState({});

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const signedIn = Boolean(getToken());

  // =====================================================
  // SCROLL TO BOTTOM
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
  // THEME
  // =====================================================

  const toggleTheme = useCallback(() => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  }, []);

  // =====================================================
  // NEW CONVERSATION
  // =====================================================

  const newChat = useCallback(() => {
    if (busy) return;

    setConversationId(createId());
    setMessages([]);
    setInput("");
    setError("");
    setDetails({});
    setSidebarOpen(false);

    inputRef.current?.focus();
  }, [busy]);

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

    const userMessage = {
      id: createMessageId(),
      role: "user",
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    // Show user message immediately.
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
      const token = getToken();

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",

        headers,

        signal: controller.signal,

        body: JSON.stringify({
          message: cleanText,
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

      // Use server-generated conversation ID if returned.
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage = {
        id: createMessageId(),
        role: "assistant",
        text: answer,
        status: data.status || "completed",
        language: data.language || language,
        reasoningSummary:
          data.reasoning_summary || null,
        toolView:
          data.tool_view || null,
        createdAt: new Date().toISOString(),
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(
          requestError.status === 401
            ? "Ugomba kwinjira muri konti. Backend igomba kwemerera guest access kugira ngo abatari logged in bakoreshe AI."
            : requestError.message ||
              "Habaye ikibazo mu kohereza ubutumwa."
        );
      }
    } finally {
      setBusy(false);
      abortRef.current = null;

      inputRef.current?.focus();
    }
  }, [
    input,
    busy,
    language,
    conversationId,
  ]);

  // =====================================================
  // ENTER KEY
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
  // MESSAGE DETAILS
  // =====================================================

  const toggleDetail = (id, key) => {
    const detailKey = `${id}:${key}`;

    setDetails((previous) => ({
      ...previous,
      [detailKey]: !previous[detailKey],
    }));
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className={`antimate-root theme-${theme}`}
    >
      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap'
        );

        /* ==========================================
           THEME VARIABLES
        ========================================== */

        .antimate-root {
          --bg: #ffffff;
          --sidebar: #f7f8f7;
          --surface: #ffffff;
          --surface-secondary: #f1f3f2;

          --text: #202522;
          --text-secondary: #555e59;
          --text-muted: #737b76;

          --border: #e1e6e2;
          --accent: #176b4d;
          --accent-hover: #10563d;
          --accent-text: #ffffff;

          --user-bubble: #eef1ef;
          --assistant-text: #252b27;

          --input-bg: #ffffff;
          --placeholder: #707872;

          --error-bg: #fff0ed;
          --error-border: #e8b8af;
          --error-text: #8f3025;

          --detail-bg: #f2f7f4;
          --detail-border: #9bbda9;

          --shadow:
            0 5px 22px rgba(0, 0, 0, 0.055);

          min-height: 100vh;
          display: flex;
          background: var(--bg);
          color: var(--text);

          font-family:
            "DM Sans",
            system-ui,
            sans-serif;

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .antimate-root.theme-dark {
          --bg: #000000;
          --sidebar: #000000;
          --surface: #000000;
          --surface-secondary: #000000;

          --text: #f1f5f2;
          --text-secondary: #d0d8d2;
          --text-muted: #a5afa8;

          --border: #39433d;
          --accent: #26865e;
          --accent-hover: #31996d;
          --accent-text: #ffffff;

          --user-bubble: #303a34;
          --assistant-text: #e8eee9;

          --input-bg: #202623;
          --placeholder: #a7b1aa;

          --error-bg: #382320;
          --error-border: #77453d;
          --error-text: #ffb7aa;

          --detail-bg: #242f29;
          --detail-border: #638a72;

          --shadow:
            0 5px 22px rgba(0, 0, 0, 0.24);
        }

        .antimate-root *,
        .antimate-root *::before,
        .antimate-root *::after {
          box-sizing: border-box;
        }

        /* ==========================================
           SIDEBAR
        ========================================== */

        .am-sidebar {
          width: 260px;
          flex: 0 0 260px;

          background: var(--sidebar);
          border-right: 1px solid var(--border);

          padding: 20px 14px;

          display: flex;
          flex-direction: column;

          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .am-brand {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 4px 8px 25px;

          color: var(--text);

          font: 800 16px Manrope, sans-serif;
        }

        .am-logo {
          width: 35px;
          height: 35px;

          border-radius: 10px;

          background: var(--accent);
          color: white;

          display: grid;
          place-items: center;

          font: 800 17px Manrope, sans-serif;
        }

        .am-new {
          width: 100%;

          border: 1px solid var(--border);
          background: var(--surface);

          color: var(--text);

          border-radius: 10px;
          padding: 11px;

          text-align: left;
          font: 600 13px "DM Sans", sans-serif;

          cursor: pointer;
        }

        .am-new:hover {
          background: var(--surface-secondary);
        }

        .am-new:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .am-note {
          margin-top: auto;

          border-top: 1px solid var(--border);

          padding: 14px 7px 0;

          color: var(--text-muted);

          font-size: 11px;
          line-height: 1.7;
        }

        /* ==========================================
           MAIN
        ========================================== */

        .am-main {
          min-width: 0;
          flex: 1;

          display: flex;
          flex-direction: column;

          min-height: 100vh;

          background: var(--bg);
        }

        .am-header {
          height: 65px;
          flex: 0 0 65px;

          border-bottom: 1px solid var(--border);

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 27px;
          gap: 12px;

          background: var(--bg);
        }

        .am-header-left,
        .am-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .am-title {
          color: var(--text);

          font: 700 15px Manrope, sans-serif;
        }

        .am-muted {
          color: var(--text-muted);
          font-size: 12px;
        }

        .am-menu {
          display: none;

          border: 0;
          background: transparent;

          color: var(--text);

          font-size: 20px;
          cursor: pointer;
        }

        .am-lang {
          border: 1px solid var(--border);

          border-radius: 9px;

          background: var(--surface);
          color: var(--text);

          padding: 8px 10px;

          font: 500 12px "DM Sans", sans-serif;

          outline: none;
        }

        .am-lang:focus-visible,
        .am-theme:focus-visible,
        .am-send:focus-visible,
        .am-new:focus-visible,
        .am-compose textarea:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
        }

        .am-theme {
          border: 1px solid var(--border);

          border-radius: 9px;

          background: var(--surface);
          color: var(--text);

          padding: 8px 11px;

          font: 600 12px "DM Sans", sans-serif;

          cursor: pointer;
        }

        .am-theme:hover {
          background: var(--surface-secondary);
        }

        /* ==========================================
           CONTENT
        ========================================== */

        .am-content {
          width: min(100%, 850px);

          margin: 0 auto;

          flex: 1;

          display: flex;
          flex-direction: column;

          padding: 28px 26px 18px;
        }

        .am-feed {
          flex: 1;
          padding-bottom: 25px;
        }

        .am-welcome {
          min-height: 55vh;

          display: flex;
          flex-direction: column;

          justify-content: center;
          align-items: center;

          text-align: center;

          padding: 20px;
        }

        .am-welcome-mark {
          width: 56px;
          height: 56px;

          border-radius: 17px;

          background: var(--accent);
          color: white;

          display: grid;
          place-items: center;

          font: 800 24px Manrope, sans-serif;

          margin-bottom: 23px;
        }

        .am-welcome h1 {
          color: var(--text);

          font: 700 clamp(25px, 4vw, 34px)
            Manrope, sans-serif;

          margin: 0 0 10px;

          letter-spacing: -0.04em;
        }

        .am-welcome p {
          color: var(--text-secondary);

          font-size: 14px;
          line-height: 1.7;

          margin: 0;
        }

        /* ==========================================
           MESSAGES
        ========================================== */

        .am-message {
          display: flex;
          flex-direction: column;

          margin: 0 0 27px;
        }

        .am-message.user {
          align-items: flex-end;
        }

        .am-message.assistant {
          align-items: stretch;
        }

        .am-role {
          color: var(--text-muted);

          font-size: 11px;
          font-weight: 700;

          margin: 0 2px 7px;
        }

        .am-bubble {
          max-width: min(86%, 720px);

          color: var(--text);

          font-size: 14px;
          line-height: 1.8;

          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .am-message.user .am-bubble {
          background: var(--user-bubble);

          color: var(--text);

          border-radius: 18px 18px 5px 18px;

          padding: 12px 16px;
        }

        .am-message.assistant .am-bubble {
          max-width: 100%;

          color: var(--assistant-text);

          padding: 0 2px;
        }

        /* ==========================================
           DETAILS
        ========================================== */

        .am-actions {
          display: flex;
          gap: 8px;

          margin-top: 11px;
          flex-wrap: wrap;
        }

        .am-actions button {
          border: 1px solid var(--border);

          background: var(--surface);
          color: var(--text-secondary);

          border-radius: 8px;

          padding: 7px 10px;

          font-size: 11px;

          cursor: pointer;
        }

        .am-actions button:hover {
          background: var(--surface-secondary);
          color: var(--text);
        }

        .am-detail {
          margin-top: 9px;

          padding: 12px 14px;

          border-left: 3px solid var(--detail-border);

          background: var(--detail-bg);

          border-radius: 0 8px 8px 0;

          color: var(--text-secondary);

          font-size: 12px;
          line-height: 1.7;

          overflow-wrap: anywhere;
        }

        .am-detail pre {
          white-space: pre-wrap;
          overflow-wrap: anywhere;

          font: inherit;
          margin: 0;

          color: var(--text-secondary);
        }

        /* ==========================================
           THINKING
        ========================================== */

        .am-thinking {
          display: flex;
          align-items: center;
          gap: 9px;

          color: var(--text-muted);

          font-size: 13px;

          margin: 12px 0 22px;
        }

        .am-dots {
          display: flex;
          gap: 4px;
        }

        .am-dots i {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: var(--accent);

          animation: am-pulse 1s infinite;
        }

        .am-dots i:nth-child(2) {
          animation-delay: 0.15s;
        }

        .am-dots i:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes am-pulse {
          50% {
            opacity: 0.3;
            transform: translateY(-3px);
          }
        }

        /* ==========================================
           ERROR
        ========================================== */

        .am-error {
          background: var(--error-bg);

          border: 1px solid var(--error-border);

          color: var(--error-text);

          border-radius: 10px;

          padding: 11px 13px;

          font-size: 12px;
          line-height: 1.6;

          margin-bottom: 12px;
        }

        /* ==========================================
           COMPOSER
        ========================================== */

        .am-compose-wrap {
          position: sticky;
          bottom: 0;

          background: var(--bg);

          padding-top: 18px;
        }

        .am-compose {
          border: 1px solid var(--border);

          border-radius: 17px;

          background: var(--input-bg);

          box-shadow: var(--shadow);

          padding: 12px 13px 10px;
        }

        .am-compose textarea {
          display: block;

          width: 100%;

          border: 0;
          outline: none;

          resize: vertical;

          min-height: 52px;
          max-height: 180px;

          padding: 5px 3px;

          color: var(--text);

          background: transparent;

          font: 14px/1.7 "DM Sans", sans-serif;
        }

        .am-compose textarea::placeholder {
          color: var(--placeholder);
          opacity: 1;
        }

        .am-compose textarea:disabled {
          opacity: 0.6;
        }

        .am-compose-bottom {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 10px;
        }

        .am-hint {
          color: var(--text-muted);
          font-size: 10px;
        }

        .am-send {
          width: 36px;
          height: 36px;

          border: 0;
          border-radius: 10px;

          background: var(--accent);
          color: var(--accent-text);

          font-size: 19px;
          font-weight: 700;

          cursor: pointer;

          transition: background 0.15s ease;
        }

        .am-send:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .am-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .am-footer {
          text-align: center;

          color: var(--text-muted);

          font-size: 10px;

          padding: 10px 0 0;
        }

        /* ==========================================
           RESPONSIVE
        ========================================== */

        @media (max-width: 760px) {
          .am-sidebar {
            position: fixed;

            z-index: 20;

            inset: 0 auto 0 0;

            transform: translateX(-105%);

            box-shadow: 12px 0 35px
              rgba(0, 0, 0, 0.15);
          }

          .am-sidebar.open {
            transform: translateX(0);
          }

          .am-menu {
            display: block;
          }

          .am-header {
            padding: 0 14px;
          }

          .am-content {
            padding: 18px 15px;
          }

          .am-account {
            display: none;
          }

          .am-bubble {
            max-width: 94%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .am-dots i {
            animation: none;
          }

          .antimate-root {
            transition: none;
          }
        }

      `}</style>

      {/* ============================================
          SIDEBAR
      ============================================ */}

      <aside
        className={`am-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="am-brand">
          <div className="am-logo">A</div>
          ANTIMATE AI
        </div>

        <button
          className="am-new"
          type="button"
          onClick={newChat}
          disabled={busy}
        >
          ＋ New chat
        </button>

        <div className="am-note">
          {signedIn
            ? "Konti yinjiwemo. Amateka y'ibiganiro agomba kubikwa no kugarurwa na backend/database."
            : "Guest session: ibiganiro biri muri iyi session gusa. Iyo wongereye gufungura page, birasibwa."}
        </div>
      </aside>

      {/* ============================================
          MAIN
      ============================================ */}

      <main className="am-main">

        {/* HEADER */}

        <header className="am-header">

          <div className="am-header-left">

            <button
              className="am-menu"
              type="button"
              onClick={() =>
                setSidebarOpen((value) => !value)
              }
              aria-label="Open menu"
            >
              ☰
            </button>

            <span className="am-title">
              New conversation
            </span>

            <span className="am-muted">
              · Ready
            </span>

          </div>

          <div className="am-header-right">

            <select
              className="am-lang"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
              disabled={busy}
              aria-label="Response language"
            >
              <option value="rw">
                Kinyarwanda
              </option>

              <option value="en">
                English
              </option>
            </select>

            <button
              type="button"
              className="am-theme"
              onClick={toggleTheme}
              aria-label="Change theme"
              title="Change appearance"
            >
              {theme === "light"
                ? "☾ Dark"
                : "☀ Light"}
            </button>

            <span className="am-muted am-account">
              {signedIn ? "Account" : "Guest"}
            </span>

          </div>

        </header>

        {/* CHAT CONTENT */}

        <div className="am-content">

          <section
            className="am-feed"
            aria-live="polite"
          >

            {/* WELCOME */}

            {messages.length === 0 && (
              <div className="am-welcome">

                <div className="am-welcome-mark">
                  A
                </div>

                <h1>
                  Muraho, ndi ANTIMATE.
                </h1>

                <p>
                  Ni iki twaganiraho uyu munsi?
                </p>

              </div>
            )}

            {/* MESSAGES */}

            {messages.map((message) => (

              <article
                className={`am-message ${message.role}`}
                key={message.id}
              >

                <div className="am-role">
                  {message.role === "user"
                    ? "You"
                    : "ANTIMATE"}
                </div>

                <div className="am-bubble">
                  {message.text}
                </div>

                {/* AI DETAILS */}

                {message.role === "assistant" &&
                  (message.reasoningSummary ||
                    message.toolView) && (

                    <div className="am-actions">

                      {message.reasoningSummary && (
                        <button
                          type="button"
                          onClick={() =>
                            toggleDetail(
                              message.id,
                              "reason"
                            )
                          }
                        >
                          {details[
                            `${message.id}:reason`
                          ]
                            ? "Hide explanation"
                            : "How this answer was formed"}
                        </button>
                      )}

                      {message.toolView && (
                        <button
                          type="button"
                          onClick={() =>
                            toggleDetail(
                              message.id,
                              "tools"
                            )
                          }
                        >
                          {details[
                            `${message.id}:tools`
                          ]
                            ? "Hide activity"
                            : "Tool activity"}
                        </button>
                      )}

                    </div>
                  )}

                {message.reasoningSummary &&
                  details[
                    `${message.id}:reason`
                  ] && (

                    <div className="am-detail">
                      {message.reasoningSummary}
                    </div>
                  )}

                {message.toolView &&
                  details[
                    `${message.id}:tools`
                  ] && (

                    <div className="am-detail">
                      <pre>
                        {JSON.stringify(
                          message.toolView,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}

              </article>

            ))}

            {/* THINKING */}

            {busy && (

              <div className="am-thinking">

                <span className="am-dots">
                  <i />
                  <i />
                  <i />
                </span>

                <span>
                  ANTIMATE irimo gutegura igisubizo...
                </span>

              </div>

            )}

            <div ref={bottomRef} />

          </section>

          {/* ERROR */}

          {error && (

            <div
              className="am-error"
              role="alert"
            >
              {error}
            </div>

          )}

          {/* INPUT */}

          <div className="am-compose-wrap">

            <form
              className="am-compose"
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
                placeholder="Andika ubutumwa kuri ANTIMATE..."
                rows={2}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={busy}
              />

              <div className="am-compose-bottom">

                <span className="am-hint">
                  Enter to send · Shift + Enter for new line
                </span>

                <button
                  className="am-send"
                  type="submit"
                  disabled={!input.trim() || busy}
                  aria-label="Send message"
                >
                  ↑
                </button>

              </div>

            </form>

            <div className="am-footer">
              ANTIMATE may make mistakes. Verify important information.
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
