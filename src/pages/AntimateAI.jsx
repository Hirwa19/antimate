
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./AntimateAI.css";

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

const CHAT_STREAM_URL =
  `${API_URL}/api/antimate/chat/stream`;

const CHAT_STOP_URL =
  `${API_URL}/api/antimate/chat/stop`;

const MAX_MESSAGE_LENGTH = 12000;

/* =========================================================
   1. HELPERS
========================================================= */

const createId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const getAuthHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
};

function getErrorMessage(data, fallback) {
  return (
    data?.message ||
    data?.error ||
    fallback
  );
}

function formatStatus(status) {
  if (!status) return "";

  if (typeof status === "string") {
    return status.replace(/[_-]/g, " ");
  }

  if (typeof status === "object") {
    return (
      status.status ||
      status.message ||
      status.label ||
      "Processing"
    );
  }

  return String(status);
}

/* =========================================================
   2. ICONS
========================================================= */

function Icon({ name, size = 20 }) {
  const paths = {
    menu: (
      <path d="M4 6h16M4 12h16M4 18h16" />
    ),

    plus: (
      <path d="M12 5v14M5 12h14" />
    ),

    send: (
      <path d="M12 19V5M5 12l7-7 7 7" />
    ),

    close: (
      <path d="m18 6-12 12M6 6l12 12" />
    ),

    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),

    moon: (
      <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
    ),

    brain: (
      <>
        <path d="M12 18V5" />
        <path d="M12 8a4 4 0 0 0-7.5-1.8A4 4 0 0 0 5 14a4 4 0 0 0 7 2.6" />
        <path d="M12 8a4 4 0 0 1 7.5-1.8A4 4 0 0 1 19 14a4 4 0 0 1-7 2.6" />
        <path d="M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </>
    ),

    stop: (
      <rect x="6" y="6" width="12" height="12" rx="2" />
    ),

    chevron: (
      <path d="m9 18 6-6-6-6" />
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || null}
    </svg>
  );
}

/* =========================================================
   3. SSE PARSER

   Backend events:
   meta
   status
   update
   complete
   error
   stopped
========================================================= */

function parseSSEBlock(block) {
  if (!block || !block.trim()) {
    return null;
  }

  let event = "message";
  const dataLines = [];

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  const rawData = dataLines.join("\n");

  if (!rawData || rawData === "[DONE]") {
    return null;
  }

  let data;

  try {
    data = JSON.parse(rawData);
  } catch {
    data = rawData;
  }

  return { event, data };
}

async function readSSEStream(response, onEvent) {
  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      let match;

      while (
        (match = /\r?\n\r?\n/.exec(buffer))
      ) {
        const block = buffer.slice(0, match.index);

        buffer = buffer.slice(
          match.index + match[0].length
        );

        const parsed = parseSSEBlock(block);

        if (parsed) {
          onEvent(parsed);
        }
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      const parsed = parseSSEBlock(buffer);

      if (parsed) {
        onEvent(parsed);
      }
    }

  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader may already be released.
    }
  }
}

/* =========================================================
   4. MAIN COMPONENT
========================================================= */

export default function AntimateAI() {
  const [conversationId, setConversationId] =
    useState(createId);

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [language, setLanguage] = useState("rw");

  const [theme, setTheme] = useState("light");

  const [thinkingEnabled, setThinkingEnabled] =
    useState(true);

  const [busy, setBusy] = useState(false);

  const [stopRequested, setStopRequested] =
    useState(false);

  const [agentStatus, setAgentStatus] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [error, setError] = useState("");

  const [copiedId, setCopiedId] = useState(null);

  const inputRef = useRef(null);

  const bottomRef = useRef(null);

  const abortRef = useRef(null);

  const stopRequestedRef = useRef(false);

  const signedIn = Boolean(getToken());

  /* =======================================================
     5. SCROLL MANAGEMENT
  ======================================================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, busy]);

  /* =======================================================
     6. CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  /* =======================================================
     7. MESSAGE UPDATE HELPER
  ======================================================= */

  const updateAssistantMessage = useCallback(
    (messageId, updates) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId
            ? { ...message, ...updates }
            : message
        )
      );
    },
    []
  );

  /* =======================================================
     8. NEW CONVERSATION
  ======================================================= */

  const newChat = useCallback(() => {
    if (busy) return;

    setConversationId(createId());

    setMessages([]);

    setInput("");

    setError("");

    setAgentStatus("");

    setStopRequested(false);

    stopRequestedRef.current = false;

    inputRef.current?.focus();
  }, [busy]);

  /* =======================================================
     9. THEME
  ======================================================= */

  const toggleTheme = useCallback(() => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  }, []);

  /* =======================================================
     10. THINKING MODE
  ======================================================= */

  const toggleThinking = useCallback(() => {
    if (busy) return;

    setThinkingEnabled((current) => !current);
  }, [busy]);

  /* =======================================================
     11. STREAMING MESSAGE HANDLER
  ======================================================= */

  const sendMessage = useCallback(async () => {
    const cleanText = input.trim();

    if (!cleanText || busy) return;

    if (!getToken()) {
      setError(
        language === "rw"
          ? "Ugomba kubanza kwinjira muri konti."
          : "Please sign in before sending a message."
      );

      return;
    }

    if (cleanText.length > MAX_MESSAGE_LENGTH) {
      setError(
        "Ubutumwa burenze umubare w'inyuguti wemerewe."
      );

      return;
    }

    const history = messages
      .filter((item) => item.text)
      .map((item) => ({
        role: item.role,
        content: item.text,
      }));

    const userMessage = {
      id: createId(),
      role: "user",
      text: cleanText,
    };

    const assistantMessageId = createId();

    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      reasoningSummary: null,
      toolView: null,
      status: "thinking",
      streaming: true,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      assistantMessage,
    ]);

    setInput("");

    setError("");

    setBusy(true);

    setStopRequested(false);

    stopRequestedRef.current = false;

    setAgentStatus("thinking");

    const controller = new AbortController();

    abortRef.current = controller;

    let streamCompleted = false;

    let streamStopped = false;

    let streamError = null;

    try {
      const response = await fetch(CHAT_STREAM_URL, {
        method: "POST",

        headers: getAuthHeaders(),

        signal: controller.signal,

        body: JSON.stringify({
          message: cleanText,

          history,

          language,

          conversation_id: conversationId,

          thinking_enabled: thinkingEnabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(
          () => ({})
        );

        const requestError = new Error(
          getErrorMessage(
            data,
            `ANTIMATE request failed (${response.status}).`
          )
        );

        requestError.status = response.status;

        throw requestError;
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("text/event-stream")) {
        const data = await response.json().catch(
          () => ({})
        );

        throw new Error(
          getErrorMessage(
            data,
            "Backend did not return an SSE stream."
          )
        );
      }

      await readSSEStream(response, ({ event, data }) => {
        if (!data || typeof data !== "object") {
          return;
        }

        switch (event) {
          /* -----------------------------------------------
             META
          ----------------------------------------------- */

          case "meta": {
            if (data.conversation_id) {
              setConversationId(data.conversation_id);
            }

            setAgentStatus("thinking");

            break;
          }

          /* -----------------------------------------------
             STATUS
          ----------------------------------------------- */

          case "status": {
            const status = formatStatus(
              data.status || data.message
            );

            setAgentStatus(status);

            updateAssistantMessage(
              assistantMessageId,
              { status }
            );

            break;
          }

          /* -----------------------------------------------
             STREAM UPDATE
             Backend sends the FULL answer snapshot.
          ----------------------------------------------- */

          case "update": {
            const updates = {
              status: formatStatus(
                data.agent_status || "generating"
              ),
            };

            if (typeof data.answer === "string") {
              updates.text = data.answer;
            }

            if (data.tool_view !== undefined) {
              updates.toolView = data.tool_view;
            }

            updateAssistantMessage(
              assistantMessageId,
              updates
            );

            setAgentStatus(
              updates.status || "generating"
            );

            if (data.conversation_id) {
              setConversationId(data.conversation_id);
            }

            break;
          }

          /* -----------------------------------------------
             COMPLETE
          ----------------------------------------------- */

          case "complete": {
            streamCompleted = true;

            const answer = String(
              data.answer ||
              data.answer_rw ||
              data.answer_kinyarwanda ||
              data.answer_english ||
              ""
            ).trim();

            updateAssistantMessage(
              assistantMessageId,
              {
                text: answer,
                reasoningSummary:
                  data.reasoning_summary || null,
                toolView:
                  data.tool_view || null,
                status: "completed",
                streaming: false,
                processingMode:
                  data.processing_mode || null,
              }
            );

            if (data.conversation_id) {
              setConversationId(data.conversation_id);
            }

            setAgentStatus("completed");

            break;
          }

          /* -----------------------------------------------
             ERROR
          ----------------------------------------------- */

          case "error": {
            streamError = new Error(
              getErrorMessage(
                data,
                "ANTIMATE AI encountered an error."
              )
            );

            break;
          }

          /* -----------------------------------------------
             STOPPED
          ----------------------------------------------- */

          case "stopped": {
            streamStopped = true;

            updateAssistantMessage(
              assistantMessageId,
              {
                status: "stopped",
                streaming: false,
              }
            );

            setAgentStatus("stopped");

            break;
          }

          default:
            break;
        }
      });

      if (streamError) {
        throw streamError;
      }

      if (streamStopped || stopRequestedRef.current) {
        updateAssistantMessage(
          assistantMessageId,
          {
            status: "stopped",
            streaming: false,
          }
        );

        setAgentStatus("stopped");

      } else if (!streamCompleted) {
        throw new Error(
          "ANTIMATE stream ended without a complete event."
        );
      }

      if (streamCompleted) {
        updateAssistantMessage(
          assistantMessageId,
          {
            streaming: false,
            status: "completed",
          }
        );
      }

    } catch (requestError) {
      if (requestError.name === "AbortError") {
        if (stopRequestedRef.current) {
          updateAssistantMessage(
            assistantMessageId,
            {
              status: "stopped",
              streaming: false,
            }
          );

          setAgentStatus("stopped");
        }
      } else {
        console.error(
          "[ANTIMATE AI] Frontend stream error:",
          requestError
        );

        setError(
          requestError.status === 401
            ? "Ugomba kubanza kwinjira muri konti."
            : requestError.message ||
              "Habaye ikibazo mu guhuza na ANTIMATE AI."
        );

        updateAssistantMessage(
          assistantMessageId,
          {
            status: "failed",
            streaming: false,
          }
        );

        setAgentStatus("failed");
      }

    } finally {
      setBusy(false);

      setStopRequested(false);

      stopRequestedRef.current = false;

      abortRef.current = null;

      inputRef.current?.focus();
    }
  }, [
    input,
    busy,
    messages,
    language,
    conversationId,
    thinkingEnabled,
    updateAssistantMessage,
  ]);

  /* =======================================================
     12. STOP GENERATION

     Important:
     Call /chat/stop first.
     Do not abort the SSE connection immediately.
     Let the backend send its stopped event.
  ======================================================= */

  const stopGeneration = useCallback(async () => {
    if (!busy || stopRequestedRef.current) {
      return;
    }

    stopRequestedRef.current = true;

    setStopRequested(true);

    setAgentStatus("stopping");

    try {
      const response = await fetch(CHAT_STOP_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          ...(getToken()
            ? {
                Authorization: `Bearer ${getToken()}`,
              }
            : {}),
        },

        body: JSON.stringify({
          conversation_id: conversationId,
        }),
      });

      const data = await response.json().catch(
        () => ({})
      );

      if (!response.ok || data.success === false) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to stop generation."
          )
        );
      }

      setAgentStatus(
        data.status === "no_active_request"
          ? "completed"
          : "stopping"
      );

    } catch (stopError) {
      console.error(
        "[ANTIMATE AI] Stop request failed:",
        stopError
      );

      stopRequestedRef.current = false;

      setStopRequested(false);

      setError(
        stopError.message ||
          "Ntibyashobotse guhagarika generation."
      );
    }
  }, [busy, conversationId]);

  /* =======================================================
     13. FORM HANDLERS
  ======================================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  /* =======================================================
     14. COPY MESSAGE
  ======================================================= */

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(
        message.text || ""
      );

      setCopiedId(message.id);

      setTimeout(() => {
        setCopiedId((current) =>
          current === message.id ? null : current
        );
      }, 1500);

    } catch {
      setError(
        "Ntibyashobotse gukoporora ubutumwa."
      );
    }
  };

  /* =======================================================
     15. RENDER
  ======================================================= */

  return (
    <div className={`antimate-app ${theme}`}>

      {/* SIDEBAR */}

      <aside
        className={`antimate-sidebar ${
          sidebarOpen ? "expanded" : "collapsed"
        }`}
      >

        <div className="antimate-sidebar-top">

          <div className="antimate-brand">
            <div className="antimate-brand-mark">
              A
            </div>

            {sidebarOpen && (
              <span>ANTIMATE</span>
            )}
          </div>

          <button
            type="button"
            className="antimate-icon-button sidebar-toggle"
            onClick={() =>
              setSidebarOpen((value) => !value)
            }
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Icon name="menu" />
          </button>

        </div>

        <button
          type="button"
          className="antimate-new-chat"
          onClick={newChat}
          disabled={busy}
          title="New conversation"
        >
          <Icon name="plus" />

          {sidebarOpen && (
            <span>New chat</span>
          )}
        </button>

        {sidebarOpen && (
          <div className="antimate-sidebar-section">

            <div className="antimate-sidebar-label">
              YOUR SPACE
            </div>

            <div className="antimate-sidebar-empty">
              <span className="antimate-sidebar-empty-dot" />
              Conversations
            </div>

          </div>
        )}

        <div className="antimate-sidebar-bottom">

          <button
            type="button"
            className="antimate-icon-button"
            onClick={toggleTheme}
            title="Appearance"
            aria-label="Toggle appearance"
          >
            <Icon
              name={theme === "light" ? "moon" : "sun"}
            />
          </button>

          {sidebarOpen && (
            <div className="antimate-account">

              <div className="antimate-avatar">
                {signedIn ? "U" : "G"}
              </div>

              <div className="antimate-account-info">
                <strong>
                  {signedIn ? "Account" : "Guest"}
                </strong>

                <span>
                  {signedIn ? "Signed in" : "Guest session"}
                </span>
              </div>

            </div>
          )}

        </div>

      </aside>

      {/* MAIN */}

      <main className="antimate-main">

        {/* HEADER */}

        <header className="antimate-header">

          <div className="antimate-header-left">

            {!sidebarOpen && (
              <button
                type="button"
                className="antimate-icon-button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Icon name="menu" />
              </button>
            )}

            <div className="antimate-model-name">
              ANTIMATE AI

              <span
                className={`antimate-model-indicator ${
                  busy ? "working" : ""
                }`}
              />
            </div>

          </div>

          <div className="antimate-header-right">

            {/* THINKING MODE */}

            <button
              type="button"
              className={`antimate-thinking-toggle ${
                thinkingEnabled ? "active" : ""
              }`}
              onClick={toggleThinking}
              disabled={busy}
              aria-pressed={thinkingEnabled}
              title={
                thinkingEnabled
                  ? "Thinking mode enabled"
                  : "Thinking mode disabled"
              }
            >
              <Icon name="brain" size={17} />

              <span>
                Thinking
              </span>

              <span className="antimate-toggle-state">
                {thinkingEnabled ? "ON" : "OFF"}
              </span>
            </button>

            {/* LANGUAGE */}

            <select
              className="antimate-language"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
              disabled={busy}
              aria-label="Language"
            >
              <option value="rw">RW</option>
              <option value="en">EN</option>
            </select>

          </div>

        </header>

        {/* CHAT AREA */}

        <section className="antimate-chat-area">

          <div
            className={`antimate-chat-content ${
              messages.length === 0
                ? "welcome-mode"
                : ""
            }`}
          >

            {messages.length === 0 ? (

              <div className="antimate-welcome">

                <div className="antimate-welcome-mark">
                  A
                </div>

                <h1>
                  {language === "rw"
                    ? "Muraho. Ndi ANTIMATE."
                    : "Hello. I'm ANTIMATE."}
                </h1>

                <p>
                  {language === "rw"
                    ? "Ni iki twaganiraho uyu munsi?"
                    : "What would you like to explore today?"}
                </p>

              </div>

            ) : (

              <div className="antimate-messages">

                {messages.map((message) => (

                  <article
                    className={`antimate-message ${message.role}`}
                    key={message.id}
                  >

                    {message.role === "assistant" && (
                      <div className="antimate-message-avatar">
                        A
                      </div>
                    )}

                    <div className="antimate-message-body">

                      {message.role === "user" ? (

                        <div className="antimate-user-bubble">
                          {message.text}
                        </div>

                      ) : (

                        <>

                          {/* LIVE STATUS */}

                          {message.status &&
                            message.status !== "completed" &&
                            message.status !== "failed" && (
                              <div className="antimate-agent-status">
                                {message.streaming && (
                                  <span className="antimate-status-dot" />
                                )}

                                {formatStatus(message.status)}
                              </div>
                            )}

                          {/* LIVE ANSWER */}

                          <div className="antimate-assistant-text">
                            {message.text || (
                              message.streaming
                                ? " "
                                : message.status === "stopped"
                                  ? "Generation stopped."
                                  : message.status === "failed"
                                    ? "Generation failed."
                                    : ""
                            )}

                            {message.streaming && (
                              <span className="antimate-cursor" />
                            )}
                          </div>

                          {/* TOOL ACTIVITY */}

                          {message.toolView && (
                            <details className="antimate-extra">

                              <summary>
                                Tool activity
                              </summary>

                              <pre>
                                {typeof message.toolView === "string"
                                  ? message.toolView
                                  : JSON.stringify(
                                      message.toolView,
                                      null,
                                      2
                                    )}
                              </pre>

                            </details>
                          )}

                          {/* REASONING SUMMARY */}

                          {message.reasoningSummary && (
                            <details className="antimate-extra">

                              <summary>
                                Thinking summary
                              </summary>

                              <p>
                                {message.reasoningSummary}
                              </p>

                            </details>
                          )}

                          {/* MESSAGE ACTIONS */}

                          {!message.streaming &&
                            message.text && (
                              <div className="antimate-message-actions">

                                <button
                                  type="button"
                                  className="antimate-icon-button"
                                  onClick={() =>
                                    copyMessage(message)
                                  }
                                  aria-label="Copy response"
                                  title="Copy response"
                                >
                                  <Icon
                                    name={
                                      copiedId === message.id
                                        ? "check"
                                        : "copy"
                                    }
                                    size={16}
                                  />
                                </button>

                              </div>
                            )}

                        </>

                      )}

                    </div>

                  </article>

                ))}

                <div ref={bottomRef} />

              </div>

            )}

          </div>

        </section>

        {/* COMPOSER */}

        <footer className="antimate-composer-area">

          {error && (
            <div className="antimate-error">
              {error}

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          {/* GLOBAL AGENT STATUS */}

          {busy && (
            <div className="antimate-live-status">
              <span className="antimate-status-dot" />

              {stopRequested
                ? "Stopping generation..."
                : formatStatus(agentStatus) ||
                  "ANTIMATE is working..."}
            </div>
          )}

          <form
            className="antimate-composer"
            onSubmit={handleSubmit}
          >

            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                language === "rw"
                  ? "Andika ubutumwa..."
                  : "Message ANTIMATE..."
              }
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={busy}
            />

            <div className="antimate-composer-bottom">

              <span className="antimate-composer-hint">
                {language === "rw"
                  ? "Enter wohereza · Shift + Enter ugakora umurongo mushya"
                  : "Enter to send · Shift + Enter for a new line"}
              </span>

              <span className="antimate-character-count">
                {input.length}/{MAX_MESSAGE_LENGTH}
              </span>

              {busy ? (

                <button
                  type="button"
                  className="antimate-stop"
                  onClick={stopGeneration}
                  disabled={stopRequested}
                  aria-label="Stop generation"
                  title="Stop generation"
                >
                  <Icon name="stop" size={18} />

                  <span>
                    {stopRequested ? "Stopping" : "Stop"}
                  </span>
                </button>

              ) : (

                <button
                  type="submit"
                  className="antimate-send"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  title="Send message"
                >
                  <Icon name="send" size={19} />
                </button>

              )}

            </div>

          </form>

          <div className="antimate-disclaimer">
            ANTIMATE can make mistakes. Verify important information.
          </div>

        </footer>

      </main>

    </div>
  );
}
