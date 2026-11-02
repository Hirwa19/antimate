
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

  const [details, setDetails] = useState({});

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
  // NEW CONVERSATION
  // =====================================================

  const newChat = useCallback(() => {
    if (busy) return;

    setConversationId(createId());
    setMessages([]);
    setInput("");
    setError("");
    setDetails({});

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

    // History excludes the new message because
    // Gradio receives the current message separately.
    const chatHistory = messages.map((message) => ({
      role: message.role,
      content: message.text,
    }));

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
          history: chatHistory,
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
            ? "Ugomba kwinjira muri konti kugira ngo ukoreshe ANTIMATE AI."
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
    messages,
  ]);

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
    <div className="antimate-root">

      <style>{`

        /* ==========================================
           GLOBAL
        ========================================== */

        .antimate-root {
          --bg: #ffffff;
          --surface: #ffffff;
          --surface-soft: #f4f6f4;

          --text: #202722;
          --text-secondary: #68736c;
          --text-muted: #89928c;

          --border: #e5e9e6;

          --accent: #176b4d;
          --accent-hover: #10563d;

          --user-bubble: #eef2ef;

          --error-bg: #fff1ee;
          --error-border: #edc4bb;
          --error-text: #943c30;

          width: 100%;
          height: 100dvh;
          min-height: 0;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background: var(--bg);
          color: var(--text);

          font-family:
            "DM Sans",
            system-ui,
            sans-serif;
        }

        .antimate-root *,
        .antimate-root *::before,
        .antimate-root *::after {
          box-sizing: border-box;
        }

        .antimate-root button,
        .antimate-root textarea,
        .antimate-root select {
          font: inherit;
        }

        /* ==========================================
           HEADER
        ========================================== */

        .am-header {
          height: 62px;
          min-height: 62px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 24px;

          border-bottom: 1px solid var(--border);

          background: var(--surface);
        }

        .am-brand {
          display: flex;
          align-items: center;
          gap: 11px;

          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .am-logo {
          width: 34px;
          height: 34px;

          display: grid;
          place-items: center;

          border-radius: 10px;

          background: var(--accent);
          color: #ffffff;

          font-size: 17px;
          font-weight: 800;
        }

        .am-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .am-status {
          display: flex;
          align-items: center;
          gap: 7px;

          color: var(--text-muted);
          font-size: 11px;
        }

        .am-status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #269c67;
        }

        .am-lang {
          border: 1px solid var(--border);
          border-radius: 8px;

          background: var(--surface);
          color: var(--text);

          padding: 7px 10px;

          font-size: 12px;
          outline: none;

          cursor: pointer;
        }

        .am-lang:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        /* ==========================================
           CHAT LAYOUT
        ========================================== */

        .am-main {
          width: 100%;
          max-width: 1000px;

          margin: 0 auto;

          flex: 1;
          min-height: 0;

          display: flex;
          flex-direction: column;

          padding: 0 24px;
        }

        .am-feed {
          flex: 1;
          min-height: 0;

          overflow-y: auto;
          overscroll-behavior: contain;

          padding: 28px 5px 18px;

          scrollbar-width: thin;
          scrollbar-color: #cbd4cd transparent;
        }

        .am-feed::-webkit-scrollbar {
          width: 6px;
        }

        .am-feed::-webkit-scrollbar-thumb {
          background: #cbd4cd;
          border-radius: 10px;
        }

        /* ==========================================
           WELCOME
        ========================================== */

        .am-welcome {
          min-height: 100%;
          display: flex;
          flex-direction: column;

          justify-content: center;
          align-items: center;

          text-align: center;

          padding: 24px 12px;
        }

        .am-welcome-mark {
          width: 62px;
          height: 62px;

          display: grid;
          place-items: center;

          margin-bottom: 22px;

          border-radius: 19px;

          background: var(--accent);
          color: #ffffff;

          font-size: 26px;
          font-weight: 800;
        }

        .am-welcome h1 {
          margin: 0 0 10px;

          font-size: clamp(25px, 4vw, 35px);
          font-weight: 800;

          letter-spacing: -1.2px;
        }

        .am-welcome p {
          max-width: 420px;

          margin: 0;

          color: var(--text-secondary);

          font-size: 14px;
          line-height: 1.7;
        }

        .am-welcome-caption {
          margin-top: 26px;

          color: var(--text-muted);
          font-size: 11px;
        }

        /* ==========================================
           MESSAGES
        ========================================== */

        .am-message {
          display: flex;
          flex-direction: column;

          margin-bottom: 28px;
        }

        .am-message.user {
          align-items: flex-end;
        }

        .am-message.assistant {
          align-items: stretch;
        }

        .am-role {
          margin: 0 3px 7px;

          color: var(--text-muted);

          font-size: 11px;
          font-weight: 700;
        }

        .am-bubble {
          max-width: min(88%, 760px);

          font-size: 14px;
          line-height: 1.85;

          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .am-message.user .am-bubble {
          padding: 11px 15px;

          border-radius: 17px 17px 5px 17px;

          background: var(--user-bubble);
          color: var(--text);
        }

        .am-message.assistant .am-bubble {
          max-width: 100%;

          padding: 0 3px;

          color: var(--text);
        }

        /* ==========================================
           MESSAGE DETAILS
        ========================================== */

        .am-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;

          margin-top: 11px;
        }

        .am-action {
          border: 1px solid var(--border);
          border-radius: 7px;

          background: var(--surface);
          color: var(--text-secondary);

          padding: 6px 9px;

          font-size: 11px;

          cursor: pointer;
        }

        .am-action:hover {
          background: var(--surface-soft);
          color: var(--text);
        }

        .am-detail {
          margin-top: 9px;

          padding: 11px 13px;

          border-left: 3px solid #9bbda9;
          border-radius: 0 8px 8px 0;

          background: #f2f7f4;

          color: #45534a;

          font-size: 12px;
          line-height: 1.7;

          overflow-wrap: anywhere;
        }

        .am-detail pre {
          margin: 0;

          white-space: pre-wrap;
          overflow-wrap: anywhere;

          font: inherit;
        }

        /* ==========================================
           THINKING INDICATOR
        ========================================== */

        .am-thinking {
          display: flex;
          align-items: center;
          gap: 9px;

          margin: 12px 0 22px;

          color: var(--text-muted);
          font-size: 12px;
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
          flex: 0 0 auto;

          margin: 0 0 10px;

          padding: 10px 13px;

          border: 1px solid var(--error-border);
          border-radius: 9px;

          background: var(--error-bg);
          color: var(--error-text);

          font-size: 12px;
          line-height: 1.5;
        }

        /* ==========================================
           COMPOSER
        ========================================== */

        .am-compose-area {
          flex: 0 0 auto;

          padding: 12px 0 14px;

          background: var(--bg);
        }

        .am-compose {
          display: flex;
          align-items: flex-end;
          gap: 10px;

          padding: 11px 12px;

          border: 1px solid var(--border);
          border-radius: 15px;

          background: var(--surface);

          box-shadow:
            0 3px 16px rgba(0, 0, 0, 0.045);
        }

        .am-compose textarea {
          flex: 1;
          min-width: 0;

          min-height: 42px;
          max-height: 140px;

          resize: none;

          border: 0;
          outline: none;

          padding: 9px 3px;

          background: transparent;
          color: var(--text);

          font-size: 14px;
          line-height: 1.6;
        }

        .am-compose textarea::placeholder {
          color: var(--text-muted);
          opacity: 1;
        }

        .am-compose textarea:disabled {
          opacity: 0.6;
        }

        .am-send {
          flex: 0 0 38px;

          width: 38px;
          height: 38px;

          display: grid;
          place-items: center;

          border: 0;
          border-radius: 10px;

          background: var(--accent);
          color: #ffffff;

          font-size: 20px;
          font-weight: 700;

          cursor: pointer;
        }

        .am-send:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .am-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .am-compose:focus-within {
          border-color: #8eb4a0;

          box-shadow:
            0 0 0 2px rgba(23, 107, 77, 0.08);
        }

        .am-footer {
          padding-top: 9px;

          text-align: center;

          color: var(--text-muted);
          font-size: 10px;
        }

        /* ==========================================
           RESPONSIVE
        ========================================== */

        @media (max-width: 700px) {
          .am-header {
            height: 56px;
            min-height: 56px;

            padding: 0 13px;
          }

          .am-brand {
            gap: 8px;
            font-size: 13px;
          }

          .am-logo {
            width: 31px;
            height: 31px;
            font-size: 15px;
          }

          .am-status {
            display: none;
          }

          .am-main {
            padding: 0 12px;
          }

          .am-feed {
            padding: 19px 2px 12px;
          }

          .am-welcome {
            padding: 15px 8px;
          }

          .am-welcome-mark {
            width: 52px;
            height: 52px;

            border-radius: 16px;

            font-size: 22px;
          }

          .am-welcome p {
            font-size: 13px;
          }

          .am-bubble {
            max-width: 95%;
            font-size: 13px;
          }

          .am-compose-area {
            padding: 8px 0 10px;
          }

          .am-compose {
            padding: 8px 9px;
            border-radius: 13px;
          }

          .am-compose textarea {
            font-size: 13px;
          }

          .am-footer {
            font-size: 9px;
          }
        }

        @media (max-height: 600px) {
          .am-header {
            height: 50px;
            min-height: 50px;
          }

          .am-feed {
            padding-top: 12px;
          }

          .am-compose-area {
            padding-top: 5px;
            padding-bottom: 6px;
          }

          .am-welcome-mark {
            width: 45px;
            height: 45px;
            margin-bottom: 12px;
          }

          .am-welcome h1 {
            font-size: 23px;
          }

          .am-welcome-caption {
            margin-top: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .am-dots i {
            animation: none;
          }
        }

      `}</style>

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="am-header">

        <div className="am-brand">
          <div className="am-logo">A</div>
          <span>ANTIMATE AI</span>
        </div>

        <div className="am-header-right">

          <div className="am-status">
            <span className="am-status-dot" />
            <span>
              {busy ? "Processing" : "Ready"}
            </span>
          </div>

          <select
            className="am-lang"
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

          <button
            type="button"
            onClick={newChat}
            disabled={busy}
            title="New conversation"
            aria-label="New conversation"
            style={{
              width: 34,
              height: 34,
              border: "1px solid var(--border)",
              borderRadius: 9,
              background: "var(--surface)",
              color: "var(--text)",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.4 : 1,
              fontSize: 18,
            }}
          >
            +
          </button>

        </div>

      </header>

      {/* ==========================================
          MAIN CHAT
      ========================================== */}

      <main className="am-main">

        <section
          className="am-feed"
          aria-live="polite"
          aria-label="Conversation"
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
                <br />
                How can I help you today?
              </p>

              <div className="am-welcome-caption">
                {signedIn
                  ? "Your authenticated session is active."
                  : "Guest session"}
              </div>

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

              {/* DETAILS */}

              {message.role === "assistant" &&
                (message.reasoningSummary ||
                  message.toolView) && (

                  <div className="am-actions">

                    {message.reasoningSummary && (

                      <button
                        className="am-action"
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
                          : "Explanation"}
                      </button>

                    )}

                    {message.toolView && (

                      <button
                        className="am-action"
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
                          : "Activity"}
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

          {/* PROCESSING INDICATOR */}

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

        {/* COMPOSER */}

        <div className="am-compose-area">

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
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={busy}
              aria-label="Message"
            />

            <button
              className="am-send"
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send message"
              title="Send message"
            >
              ↑
            </button>

          </form>

          <div className="am-footer">
            ANTIMATE may make mistakes. Verify important information.
          </div>

        </div>

      </main>

    </div>
  );
}
