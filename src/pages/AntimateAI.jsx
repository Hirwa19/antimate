
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

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const MAX_MESSAGE_LENGTH = 12000;

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

function Icon({ name, size = 20 }) {
  const paths = {
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    send: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    moon: <><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></>,
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

function Typewriter({ text, onComplete }) {
  const [visibleText, setVisibleText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    const content = String(text || "");
    indexRef.current = 0;
    setVisibleText("");

    if (!content) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      const remaining = content.length - indexRef.current;

      // Increase the reveal speed for long answers.
      const step = remaining > 1500 ? 12 : remaining > 500 ? 6 : 3;

      indexRef.current = Math.min(
        indexRef.current + step,
        content.length
      );

      setVisibleText(
        content.slice(0, indexRef.current)
      );

      if (indexRef.current >= content.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 14);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="antimate-typewriter">
      {visibleText}
      {visibleText.length < String(text || "").length && (
        <span className="antimate-cursor" />
      )}
    </span>
  );
}

export default function AntimateAI() {
  const [conversationId, setConversationId] = useState(createId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("rw");
  const [theme, setTheme] = useState("light");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  const signedIn = Boolean(getToken());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, busy]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const newChat = useCallback(() => {
    if (busy) return;

    setConversationId(createId());
    setMessages([]);
    setInput("");
    setError("");
    setTypingMessageId(null);
    inputRef.current?.focus();
  }, [busy]);

  const toggleTheme = useCallback(() => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  }, []);

  const sendMessage = useCallback(async () => {
    const cleanText = input.trim();

    if (!cleanText || busy) return;

    if (cleanText.length > MAX_MESSAGE_LENGTH) {
      setError("Ubutumwa burenze umubare w'inyuguti wemerewe.");
      return;
    }

    const history = messages.map((item) => ({
      role: item.role,
      content: item.text,
    }));

    const userMessage = {
      id: createId(),
      role: "user",
      text: cleanText,
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

      const assistantMessage = {
        id: createId(),
        role: "assistant",
        text: answer,
        reasoningSummary: data.reasoning_summary || null,
        toolView: data.tool_view || null,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      setTypingMessageId(assistantMessage.id);

    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(
          requestError.status === 401
            ? "Ugomba kubanza kwinjira muri konti."
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
    messages,
    language,
    conversationId,
  ]);

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedId(message.id);

      setTimeout(() => {
        setCopiedId((current) =>
          current === message.id ? null : current
        );
      }, 1500);
    } catch {
      setError("Ntibyashobotse gukoporora ubutumwa.");
    }
  };

  return (
    <div className={`antimate-app ${theme}`}>

      {/* SIDEBAR */}

      <aside className={`antimate-sidebar ${sidebarOpen ? "expanded" : "collapsed"}`}>

        <div className="antimate-sidebar-top">

          <div className="antimate-brand">
            <div className="antimate-brand-mark">A</div>
            {sidebarOpen && (
              <span>ANTIMATE</span>
            )}
          </div>

          <button
            className="antimate-icon-button sidebar-toggle"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Icon name="menu" />
          </button>

        </div>

        <button
          className="antimate-new-chat"
          onClick={newChat}
          disabled={busy}
          title="New conversation"
        >
          <Icon name="plus" />
          {sidebarOpen && <span>New chat</span>}
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
            className="antimate-icon-button"
            onClick={toggleTheme}
            title="Appearance"
            aria-label="Toggle appearance"
          >
            <Icon name={theme === "light" ? "moon" : "sun"} />
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
                className="antimate-icon-button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Icon name="menu" />
              </button>
            )}

            <div className="antimate-model-name">
              ANTIMATE AI
              <span className="antimate-model-indicator" />
            </div>
          </div>

          <div className="antimate-header-right">

            <select
              className="antimate-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
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

          <div className={`antimate-chat-content ${messages.length === 0 ? "welcome-mode" : ""}`}>

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
                          <div className="antimate-assistant-text">
                            {typingMessageId === message.id ? (
                              <Typewriter
                                text={message.text}
                                onComplete={() =>
                                  setTypingMessageId(null)
                                }
                              />
                            ) : (
                              message.text
                            )}
                          </div>

                          {message.reasoningSummary && (
                            <details className="antimate-extra">
                              <summary>Reasoning summary</summary>
                              <p>{message.reasoningSummary}</p>
                            </details>
                          )}

                          {message.toolView && (
                            <details className="antimate-extra">
                              <summary>Tool activity</summary>
                              <pre>
                                {JSON.stringify(message.toolView, null, 2)}
                              </pre>
                            </details>
                          )}

                          <div className="antimate-message-actions">
                            <button
                              className="antimate-icon-button"
                              onClick={() => copyMessage(message)}
                              aria-label="Copy response"
                              title="Copy response"
                            >
                              <Icon
                                name={copiedId === message.id ? "check" : "copy"}
                                size={16}
                              />
                            </button>
                          </div>
                        </>

                      )}

                    </div>

                  </article>

                ))}

                {busy && (
                  <div className="antimate-loading">
                    <span />
                    <span />
                    <span />
                  </div>
                )}

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
            </div>
          )}

          <form
            className="antimate-composer"
            onSubmit={handleSubmit}
          >

            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
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

              <button
                className="antimate-send"
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send message"
              >
                <Icon name="send" size={19} />
              </button>

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
