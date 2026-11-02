import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const MAX_MESSAGE_LENGTH = 12000;

// ============================================================
// HELPERS
// ============================================================

const createId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const createMessageId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const getAuthToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AntimateAI() {
  // ----------------------------------------------------------
  // CONVERSATION STATE
  // ----------------------------------------------------------

  const [conversationId, setConversationId] = useState(
    createId
  );

  const [messages, setMessages] = useState([]);

  // ----------------------------------------------------------
  // INPUT STATE
  // ----------------------------------------------------------

  const [input, setInput] = useState("");

  const [language, setLanguage] = useState("rw");

  // ----------------------------------------------------------
  // UI STATE
  // ----------------------------------------------------------

  const [isProcessing, setIsProcessing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [details, setDetails] = useState({});

  const [connectionStatus, setConnectionStatus] = useState(
    "ready"
  );

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const bottomRef = useRef(null);

  const inputRef = useRef(null);

  const abortControllerRef = useRef(null);

  // ----------------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------------

  const token = getAuthToken();

  const isLoggedIn = Boolean(token);

  // ==========================================================
  // SCROLL TO LATEST MESSAGE
  // ==========================================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isProcessing]);

  // ==========================================================
  // COMPONENT CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // ==========================================================
  // NEW CONVERSATION
  // ==========================================================

  const createNewConversation = useCallback(() => {
    if (isProcessing) return;

    setConversationId(createId());

    setMessages([]);

    setInput("");

    setErrorMessage("");

    setDetails({});

    setSidebarOpen(false);

    inputRef.current?.focus();
  }, [isProcessing]);

  // ==========================================================
  // TOGGLE MESSAGE DETAILS
  // ==========================================================

  const toggleDetail = useCallback(
    (messageId, type) => {
      const key = `${messageId}:${type}`;

      setDetails((previous) => ({
        ...previous,
        [key]: !previous[key],
      }));
    },
    []
  );

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage = useCallback(async () => {
    const cleanMessage = input.trim();

    if (!cleanMessage) return;

    if (isProcessing) return;

    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(
        `Ubutumwa ntibugomba kurenza inyuguti ${MAX_MESSAGE_LENGTH}.`
      );

      return;
    }

    // --------------------------------------------------------
    // USER MESSAGE
    // --------------------------------------------------------

    const userMessage = {
      id: createMessageId(),

      role: "user",

      text: cleanMessage,

      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput("");

    setErrorMessage("");

    setIsProcessing(true);

    // --------------------------------------------------------
    // REQUEST CONTROLLER
    // --------------------------------------------------------

    const controller = new AbortController();

    abortControllerRef.current = controller;

    try {
      // ------------------------------------------------------
      // REQUEST HEADERS
      // ------------------------------------------------------

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response = await fetch(CHAT_URL, {
        method: "POST",

        headers,

        signal: controller.signal,

        body: JSON.stringify({
          message: cleanMessage,

          language,

          conversation_id: conversationId,
        }),
      });

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || data.success === false) {
        const error = new Error(
          data.message ||
            data.error ||
            "ANTIMATE ntiyashoboye gusubiza."
        );

        error.status = response.status;

        throw error;
      }

      // ------------------------------------------------------
      // EXTRACT ANSWER
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // UPDATE CONVERSATION ID
      // ------------------------------------------------------

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // ------------------------------------------------------
      // ASSISTANT MESSAGE
      // ------------------------------------------------------

      const assistantMessage = {
        id: createMessageId(),

        role: "assistant",

        text: answer,

        language: data.language || language,

        status: data.status || "completed",

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

    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(
          "ANTIMATE CHAT ERROR:",
          error
        );

        if (error.status === 401) {
          setErrorMessage(
            "Backend yanze request. Ugomba kwinjira muri konti. Guest access igomba kwemerwa na backend."
          );
        } else {
          setErrorMessage(
            error.message ||
              "Habaye ikibazo mu kohereza ubutumwa."
          );
        }
      }
    } finally {
      setIsProcessing(false);

      abortControllerRef.current = null;

      inputRef.current?.focus();
    }
  }, [
    input,
    isProcessing,
    token,
    language,
    conversationId,
  ]);

  // ==========================================================
  // KEYBOARD HANDLING
  // ==========================================================

  const handleInputKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="am-root">

      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap'
        );

        * {
          box-sizing: border-box;
        }

        .am-root {
          --ink: #252525;
          --muted: #777;
          --line: #e7e7e7;

          min-height: 100vh;

          display: flex;

          background: #ffffff;

          color: var(--ink);

          font-family: "DM Sans", sans-serif;
        }

        /* SIDEBAR */

        .am-side {
          width: 260px;

          flex: 0 0 260px;

          background: #f7f7f7;

          border-right: 1px solid var(--line);

          padding: 20px 14px;

          display: flex;

          flex-direction: column;
        }

        .am-brand {
          display: flex;

          align-items: center;

          gap: 10px;

          padding: 4px 8px 25px;

          font: 800 16px Manrope, sans-serif;
        }

        .am-logo {
          width: 34px;

          height: 34px;

          border-radius: 10px;

          background: #173d32;

          color: white;

          display: grid;

          place-items: center;
        }

        .am-new {
          border: 1px solid #d8dedb;

          background: white;

          border-radius: 10px;

          padding: 11px;

          text-align: left;

          font-weight: 600;

          cursor: pointer;
        }

        .am-new:hover {
          background: #f0f4f1;
        }

        .am-new:disabled {
          opacity: .5;

          cursor: not-allowed;
        }

        .am-note {
          margin-top: auto;

          border-top: 1px solid var(--line);

          padding: 14px 7px 0;

          color: var(--muted);

          font-size: 11px;

          line-height: 1.6;
        }

        /* MAIN */

        .am-main {
          min-width: 0;

          flex: 1;

          display: flex;

          flex-direction: column;

          min-height: 100vh;
        }

        /* HEADER */

        .am-head {
          height: 64px;

          flex: 0 0 64px;

          border-bottom: 1px solid var(--line);

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 0 28px;

          gap: 12px;
        }

        .am-head-left,
        .am-head-right {
          display: flex;

          align-items: center;

          gap: 12px;
        }

        .am-title {
          font: 700 15px Manrope, sans-serif;
        }

        .am-muted {
          color: var(--muted);

          font-size: 12px;
        }

        .am-menu {
          display: none;

          border: 0;

          background: transparent;

          font-size: 20px;

          cursor: pointer;
        }

        .am-lang {
          border: 1px solid var(--line);

          border-radius: 9px;

          background: white;

          padding: 8px 10px;
        }

        /* CHAT CONTENT */

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

        /* WELCOME */

        .am-welcome {
          min-height: 55vh;

          display: flex;

          flex-direction: column;

          justify-content: center;

          align-items: center;

          text-align: center;
        }

        .am-welcome-mark {
          width: 55px;

          height: 55px;

          border-radius: 17px;

          background: #173d32;

          color: white;

          display: grid;

          place-items: center;

          font: 800 24px Manrope;

          margin-bottom: 23px;
        }

        .am-welcome h1 {
          font: 700 clamp(25px, 4vw, 34px) Manrope;

          margin: 0 0 10px;

          letter-spacing: -.04em;
        }

        .am-welcome p {
          color: var(--muted);

          font-size: 14px;

          margin: 0;
        }

        /* MESSAGES */

        .am-msg {
          display: flex;

          flex-direction: column;

          margin: 0 0 26px;
        }

        .am-msg.user {
          align-items: flex-end;
        }

        .am-msg.assistant {
          align-items: stretch;
        }

        .am-role {
          font-size: 11px;

          color: #777;

          font-weight: 700;

          margin: 0 2px 7px;
        }

        .am-bubble {
          max-width: min(86%, 720px);

          font-size: 14px;

          line-height: 1.75;

          white-space: pre-wrap;

          overflow-wrap: anywhere;
        }

        .am-msg.user .am-bubble {
          background: #f1f2f2;

          border-radius: 18px 18px 5px 18px;

          padding: 12px 16px;
        }

        .am-msg.assistant .am-bubble {
          max-width: 100%;

          padding: 0 2px;
        }

        /* MESSAGE DETAILS */

        .am-actions {
          display: flex;

          gap: 8px;

          margin-top: 10px;

          flex-wrap: wrap;
        }

        .am-actions button {
          border: 1px solid var(--line);

          background: white;

          border-radius: 8px;

          padding: 6px 9px;

          font-size: 11px;

          color: #666;

          cursor: pointer;
        }

        .am-detail {
          margin-top: 8px;

          padding: 11px 13px;

          border-left: 2px solid #b9d6c7;

          background: #f7faf8;

          border-radius: 0 8px 8px 0;

          color: #555;

          font-size: 12px;

          line-height: 1.6;
        }

        .am-detail pre {
          white-space: pre-wrap;

          overflow-wrap: anywhere;

          font: inherit;

          margin: 0;
        }

        /* THINKING INDICATOR */

        .am-thinking {
          display: flex;

          align-items: center;

          gap: 9px;

          color: #777;

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

          background: #777;

          animation: am-pulse 1s infinite;
        }

        .am-dots i:nth-child(2) {
          animation-delay: .15s;
        }

        .am-dots i:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes am-pulse {
          50% {
            opacity: .25;

            transform: translateY(-3px);
          }
        }

        /* ERROR */

        .am-error {
          background: #fff3f1;

          border: 1px solid #f0d0ca;

          color: #963d31;

          border-radius: 10px;

          padding: 10px 12px;

          font-size: 12px;

          margin-bottom: 12px;
        }

        /* COMPOSER */

        .am-compose-wrap {
          position: sticky;

          bottom: 0;

          background: linear-gradient(
            180deg,
            rgba(255,255,255,0),
            #fff 20%
          );

          padding-top: 18px;
        }

        .am-compose {
          border: 1px solid #dcdedf;

          border-radius: 17px;

          background: white;

          box-shadow: 0 5px 22px #0000000d;

          padding: 12px 13px 10px;
        }

        .am-compose textarea {
          display: block;

          width: 100%;

          border: 0;

          outline: 0;

          resize: vertical;

          min-height: 52px;

          max-height: 180px;

          padding: 5px 3px;

          font: 14px/1.6 "DM Sans";

          color: #222;

          background: transparent;
        }

        .am-compose textarea::placeholder {
          color: #999;
        }

        .am-compose textarea:disabled {
          opacity: .6;
        }

        .am-compose-bottom {
          display: flex;

          align-items: center;

          justify-content: space-between;
        }

        .am-hint {
          color: #999;

          font-size: 10px;
        }

        .am-send {
          width: 35px;

          height: 35px;

          border: 0;

          border-radius: 10px;

          background: #173d32;

          color: white;

          font-size: 18px;

          cursor: pointer;
        }

        .am-send:disabled {
          opacity: .35;

          cursor: not-allowed;
        }

        .am-footer {
          text-align: center;

          color: #aaa;

          font-size: 10px;

          padding: 10px 0 0;
        }

        /* RESPONSIVE */

        @media (max-width: 760px) {

          .am-side {
            position: fixed;

            z-index: 5;

            inset: 0 auto 0 0;

            transform: translateX(-105%);

            box-shadow: 12px 0 35px #00000014;

            transition: transform .2s ease;
          }

          .am-side.open {
            transform: translateX(0);
          }

          .am-menu {
            display: block;
          }

          .am-head {
            padding: 0 14px;
          }

          .am-content {
            padding: 18px 15px;
          }

          .am-bubble {
            max-width: 94%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .am-dots i {
            animation: none;
          }
        }

      `}</style>

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <aside
        className={`am-side ${
          sidebarOpen ? "open" : ""
        }`}
      >

        <div className="am-brand">

          <div className="am-logo">
            A
          </div>

          ANTIMATE AI

        </div>

        <button
          className="am-new"
          type="button"
          onClick={createNewConversation}
          disabled={isProcessing}
        >
          ＋ New chat
        </button>

        <div className="am-note">

          {isLoggedIn
            ? "Konti yinjiwemo. Amateka y'ibiganiro agomba kubikwa no kugarurwa na backend/database."
            : "Guest session: ibiganiro biri muri iyi session gusa. Iyo page yongeye gufungurwa, birasibangana."}

        </div>

      </aside>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="am-main">

        {/* HEADER */}

        <header className="am-head">

          <div className="am-head-left">

            <button
              className="am-menu"
              type="button"
              onClick={() =>
                setSidebarOpen((value) => !value)
              }
              aria-label="Menu"
            >
              ☰
            </button>

            <span className="am-title">
              New conversation
            </span>

            <span className="am-muted">
              · {connectionStatus}
            </span>

          </div>

          <div className="am-head-right">

            <select
              className="am-lang"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
              disabled={isProcessing}
              aria-label="Response language"
            >

              <option value="rw">
                Kinyarwanda
              </option>

              <option value="en">
                English
              </option>

            </select>

            <span className="am-muted">
              {isLoggedIn ? "Account" : "Guest"}
            </span>

          </div>

        </header>

        {/* CHAT CONTENT */}

        <div className="am-content">

          <section
            className="am-feed"
            aria-live="polite"
          >

            {/* EMPTY STATE */}

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
                className={`am-msg ${message.role}`}
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

                {/* ASSISTANT DETAILS */}

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

                {/* REASONING SUMMARY */}

                {message.reasoningSummary &&
                  details[
                    `${message.id}:reason`
                  ] && (

                    <div className="am-detail">
                      {message.reasoningSummary}
                    </div>

                  )}

                {/* TOOL VIEW */}

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

            {isProcessing && (

              <div className="am-thinking">

                <span className="am-dots">
                  <i />
                  <i />
                  <i />
                </span>

                ANTIMATE irimo gutegura igisubizo...

              </div>

            )}

            <div ref={bottomRef} />

          </section>

          {/* ERROR */}

          {errorMessage && (

            <div
              className="am-error"
              role="alert"
            >
              {errorMessage}
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
                onKeyDown={handleInputKeyDown}
                placeholder="Andika ubutumwa kuri ANTIMATE..."
                rows={2}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={isProcessing}
              />

              <div className="am-compose-bottom">

                <span className="am-hint">
                  Enter to send · Shift + Enter for new line
                </span>

                <button
                  className="am-send"
                  type="submit"
                  disabled={
                    !input.trim() ||
                    isProcessing
                  }
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