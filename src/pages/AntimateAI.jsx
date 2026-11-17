import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./AntimateAI.css";

/* =========================================================
   ENDPOINTS (unchanged)
   ========================================================= */
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const CHAT_STREAM_URL = `${API_URL}/api/antimate/chat/stream`;
const CHAT_STOP_URL = `${API_URL}/api/antimate/chat/stop`;

const MAX_MESSAGE_LENGTH = 12000;
const CHAT_HISTORY_LIMIT = 60;

/* =========================================================
   HELPERS (unchanged)
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
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function getErrorMessage(data, fallback) {
  return data?.message || data?.error || fallback;
}

function formatStatus(status) {
  if (!status) return "";
  if (typeof status === "string") return status.replace(/[_-]/g, " ");
  if (typeof status === "object") {
    return status.status || status.message || status.label || "Processing";
  }
  return String(status);
}

function getConversationStorageKey() {
  const token = getToken();
  return `antimate_chat_history_v1_${token ? token.slice(-16) : "guest"}`;
}

function readConversationHistory() {
  try {
    const stored = localStorage.getItem(getConversationStorageKey());
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  const seen = new Set();

  return images
    .map((item) => {
      if (typeof item === "string") {
        item = { image: item, title: "Image result", source: item };
      }
      if (!item || typeof item !== "object") return null;

      const image =
        item.image || item.thumbnail || item.image_url || item.thumbnail_url || "";

      if (typeof image !== "string" || !/^https?:\/\//i.test(image)) return null;
      if (seen.has(image)) return null;
      seen.add(image);

      const source = item.source || item.url || item.page_url || image;

      return {
        image,
        title: item.title || item.name || "Image result",
        source:
          typeof source === "string" && /^https?:\/\//i.test(source)
            ? source
            : image,
      };
    })
    .filter(Boolean);
}

function renderAssistantContent(text, images = [], messageId = "") {
  const content = String(text || "");
  const availableImages = Array.isArray(images) ? images : [];

  const markerPattern = /\[\[IMAGE_(\d+)\]\]/g;
  const rendered = [];
  let lastIndex = 0;
  let match;

  while ((match = markerPattern.exec(content)) !== null) {
    const markerStart = match.index;
    const imageIndex = Number(match[1]) - 1;

    if (markerStart > lastIndex) {
      rendered.push(content.slice(lastIndex, markerStart));
    }

    const image = availableImages[imageIndex];
    if (image && image.image) {
      rendered.push(
        <figure
          className="antimate-inline-image"
          key={`${messageId}-inline-image-${imageIndex}`}
        >
          <a
            href={image.source || image.image}
            target="_blank"
            rel="noopener noreferrer"
            title={image.title || "Open image"}
          >
            <img
              src={image.image}
              alt={image.title || "ANTIMATE AI image"}
              loading="lazy"
              onError={(e) => e.currentTarget.classList.add("image-load-failed")}
            />
          </a>
          {image.title && <figcaption>{image.title}</figcaption>}
        </figure>
      );
    }

    lastIndex = markerPattern.lastIndex;
  }

  if (lastIndex < content.length) {
    rendered.push(content.slice(lastIndex));
  }

  return rendered;
}

/* =========================================================
   INCREMENTAL WORD REVEAL (unchanged behaviour)
   ========================================================= */
function IncrementalText({ text, images, messageId, streaming }) {
  const segments = useMemo(
    () => renderAssistantContent(text, images, messageId),
    [text, images, messageId]
  );

  const totalWords = useMemo(() => {
    return segments.reduce((count, seg) => {
      if (typeof seg === "string") {
        return count + seg.split(/(\s+)/).filter(Boolean).length;
      }
      return count + 1;
    }, 0);
  }, [segments]);

  const [revealed, setRevealed] = useState(totalWords);

  useEffect(() => {
    if (!streaming) {
      setRevealed(totalWords);
      return undefined;
    }
    if (revealed >= totalWords) return undefined;

    const tick = window.setInterval(() => {
      setRevealed((current) => Math.min(current + 3, totalWords));
    }, 40);

    return () => window.clearInterval(tick);
  }, [revealed, totalWords, streaming]);

  let budget = revealed;

  return (
    <div className={`antimate-assistant-text ${streaming ? "streaming" : ""}`}>
      {segments.map((seg, index) => {
        if (typeof seg !== "string") {
          if (budget > 0) budget -= 1;
          return budget >= 0 ? seg : null;
        }

        const tokens = seg.split(/(\s+)/);
        const visible = [];
        for (const token of tokens) {
          if (visible.length >= budget) break;
          visible.push(token);
        }
        budget -= visible.length;

        if (!visible.length) return null;

        return (
          <span key={`seg-${index}`} className="antimate-text-segment">
            {visible.join("")}
          </span>
        );
      })}
      {streaming && <span className="antimate-caret" aria-hidden="true" />}
    </div>
  );
}

/* =========================================================
   ICONS
   ========================================================= */
function Icon({ name, size = 20 }) {
  const paths = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    plus: <path d="M12 5v14M5 12h14" />,
    send: <path d="M12 19V5M5 12l7-7 7 7" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    brain: (
      <>
        <path d="M12 18V5" />
        <path d="M12 8a4 4 0 0 0-7.5-1.8A4 4 0 0 0 5 14a4 4 0 0 0 7 2.6" />
        <path d="M12 8a4 4 0 0 1 7.5-1.8A4 4 0 0 1 19 14a4 4 0 0 1-7 2.6" />
        <path d="M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </>
    ),
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    pin: <path d="m16 3 5 5-4 1-4 4-1 5-3-3-5 5 5-5-3-3 5-1 4-4Z" />,
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2m3 0-1 14H6L5 6" />
        <path d="M10 11v5m4-5v5" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </>
    ),
    speaker: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    ),
    retry: (
      <>
        <path d="M20 11a8 8 0 1 0-2.3 6.7" />
        <path d="M20 4v7h-7" />
      </>
    ),
    like: (
      <path d="M7 10v10H4V10h3Zm3 10h7.5a2.5 2.5 0 0 0 2.5-2.5V12l-3-7a2 2 0 0 0-1.9-1.3H10a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
    appearance: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none" />
      </>
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
   SSE PARSER (unchanged)
   ========================================================= */
function parseSSEBlock(block) {
  if (!block || !block.trim()) return null;

  let event = "message";
  const dataLines = [];

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }

  if (!dataLines.length) return null;

  const rawData = dataLines.join("\n");
  if (!rawData || rawData === "[DONE]") return null;

  let data;
  try {
    data = JSON.parse(rawData);
  } catch {
    data = rawData;
  }

  return { event, data };
}

async function readSSEStream(response, onEvent) {
  if (!response.body) throw new Error("Streaming response body is unavailable.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let match;
      while ((match = /\r?\n\r?\n/.exec(buffer))) {
        const block = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        const parsed = parseSSEBlock(block);
        if (parsed) onEvent(parsed);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      const parsed = parseSSEBlock(buffer);
      if (parsed) onEvent(parsed);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
export default function AntimateAI() {
  const [conversationId, setConversationId] = useState(createId);
  const [messages, setMessages] = useState([]);
  const [savedConversations, setSavedConversations] = useState(readConversationHistory);

  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("dark");
  const [thinkingEnabled, setThinkingEnabled] = useState(false);

  const [busy, setBusy] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [openConversationMenu, setOpenConversationMenu] = useState(null);
  const [renamingConversationId, setRenamingConversationId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  /* TTS + like state */
  const [speakingId, setSpeakingId] = useState(null);
  const [likedIds, setLikedIds] = useState(() => new Set());

  /* live seconds counter for the streaming answer */
  const [liveSeconds, setLiveSeconds] = useState(0);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const stopRequestedRef = useRef(false);
  const profileMenuRef = useRef(null);

  const signedIn = Boolean(getToken());

  /* ---- live seconds ticker ---- */
  useEffect(() => {
    if (!busy) {
      setLiveSeconds(0);
      return undefined;
    }
    setLiveSeconds(0);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setLiveSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  /* ---- click-outside for profile menu ---- */
  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const handler = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileMenuOpen]);

  /* ---- persist history ---- */
  useEffect(() => {
    try {
      localStorage.setItem(
        getConversationStorageKey(),
        JSON.stringify(savedConversations.slice(0, CHAT_HISTORY_LIMIT))
      );
    } catch (storageError) {
      console.warn("[ANTIMATE AI] Could not save chat history:", storageError);
    }
  }, [savedConversations]);

  /* ---- sync active conversation ---- */
  useEffect(() => {
    if (!messages.length) return;
    const firstUserMessage = messages.find((item) => item.role === "user");
    const title = (firstUserMessage?.text || "New conversation")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 56);

    setSavedConversations((previous) => {
      const existing = previous.find((item) => item.id === conversationId);
      const updated = {
        id: conversationId,
        title: existing?.title || title || "New conversation",
        messages,
        updatedAt: Date.now(),
        pinned: Boolean(existing?.pinned),
      };
      return [updated, ...previous.filter((item) => item.id !== conversationId)]
        .sort(
          (a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
            (b.updatedAt || 0) - (a.updatedAt || 0)
        )
        .slice(0, CHAT_HISTORY_LIMIT);
    });
  }, [conversationId, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ---- current conversation title for top bar ---- */
  const currentTitle = useMemo(() => {
    const found = savedConversations.find((item) => item.id === conversationId);
    if (found?.title) return found.title;
    const firstUser = messages.find((m) => m.role === "user");
    return firstUser?.text?.slice(0, 56) || "New conversation";
  }, [savedConversations, conversationId, messages]);

  const updateAssistantMessage = useCallback((messageId, updates) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId ? { ...message, ...updates } : message
      )
    );
  }, []);

  /* ---- conversation actions ---- */
  const openConversation = useCallback(
    (conversation) => {
      if (busy || !conversation) return;
      setConversationId(conversation.id);
      setMessages(Array.isArray(conversation.messages) ? conversation.messages : []);
      setInput("");
      setError("");
      setStopRequested(false);
      stopRequestedRef.current = false;
      inputRef.current?.focus();
    },
    [busy]
  );

  const togglePinConversation = useCallback(
    (id) => {
      if (busy) return;
      setSavedConversations((previous) =>
        previous
          .map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item))
          .sort(
            (a, b) =>
              Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
              (b.updatedAt || 0) - (a.updatedAt || 0)
          )
      );
      setOpenConversationMenu(null);
    },
    [busy]
  );

  const beginRenameConversation = useCallback(
    (conversation) => {
      if (busy || !conversation) return;
      setRenamingConversationId(conversation.id);
      setRenameDraft(conversation.title || "");
      setOpenConversationMenu(null);
    },
    [busy]
  );

  const commitRenameConversation = useCallback(
    (id) => {
      const title = renameDraft.trim().slice(0, 80);
      if (!title) return;
      setSavedConversations((previous) =>
        previous.map((item) => (item.id === id ? { ...item, title } : item))
      );
      setRenamingConversationId(null);
      setRenameDraft("");
    },
    [renameDraft]
  );

  const deleteConversation = useCallback(
    (id) => {
      if (busy) return;
      const confirmed = window.confirm("Delete this conversation from this browser?");
      if (!confirmed) return;
      setSavedConversations((previous) => previous.filter((item) => item.id !== id));
      setOpenConversationMenu(null);
      if (conversationId === id) {
        setConversationId(createId());
        setMessages([]);
        setInput("");
        setError("");
      }
    },
    [busy, conversationId]
  );

  const newChat = useCallback(() => {
    if (busy) return;
    setConversationId(createId());
    setMessages([]);
    setInput("");
    setError("");
    setStopRequested(false);
    stopRequestedRef.current = false;
    inputRef.current?.focus();
  }, [busy]);

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === "light" ? "dark" : "light")),
    []
  );

  const toggleThinking = useCallback(() => {
    if (busy) return;
    setThinkingEnabled((current) => !current);
  }, [busy]);

  /* ---- TTS ---- */
  const speakMessage = useCallback((message) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingId === message.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.text || "");
    utterance.lang = language === "rw" ? "rw-RW" : "en-US";
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(message.id);
    window.speechSynthesis.speak(utterance);
  }, [speakingId, language]);

  /* ---- Like ---- */
  const toggleLike = useCallback((id) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ---- Retry ---- */
  const retryMessage = useCallback(
    (assistantMessage) => {
      if (busy) return;
      const idx = messages.findIndex((m) => m.id === assistantMessage.id);
      if (idx < 1) return;
      const previousUser = messages[idx - 1];
      if (!previousUser || previousUser.role !== "user") return;

      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id));
      setInput(previousUser.text || "");
      inputRef.current?.focus();
    },
    [busy, messages]
  );

  /* ---- Edit (user message → back into composer) ---- */
  const editUserMessage = useCallback(
    (message) => {
      if (busy) return;
      setInput(message.text || "");
      inputRef.current?.focus();
    },
    [busy]
  );

  /* =========================================================
     SEND (unchanged)
     ========================================================= */
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
      setError("Ubutumwa burenze umubare w'inyuguti wemerewe.");
      return;
    }

    const history = messages
      .filter((item) => item.text)
      .map((item) => ({ role: item.role, content: item.text }));

    const userMessage = { id: createId(), role: "user", text: cleanText };
    const assistantMessageId = createId();
    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      images: [],
      reasoningSummary: null,
      toolView: null,
      status: "thinking",
      streaming: true,
    };

    setMessages((previous) => [...previous, userMessage, assistantMessage]);
    setInput("");
    setError("");
    setBusy(true);
    setStopRequested(false);
    stopRequestedRef.current = false;

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
        const data = await response.json().catch(() => ({}));
        const requestError = new Error(
          getErrorMessage(data, `ANTIMATE request failed (${response.status}).`)
        );
        requestError.status = response.status;
        throw requestError;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const data = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage(data, "Backend did not return an SSE stream."));
      }

      await readSSEStream(response, ({ event, data }) => {
        if (!data || typeof data !== "object") return;

        switch (event) {
          case "meta": {
            if (data.conversation_id) setConversationId(data.conversation_id);
            break;
          }

          case "status": {
            const status = formatStatus(data.status || data.message);
            updateAssistantMessage(assistantMessageId, { status });
            break;
          }

          case "update": {
            const updates = { status: formatStatus(data.agent_status || "generating") };
            if (typeof data.answer === "string") updates.text = data.answer;
            if (data.tool_view !== undefined) updates.toolView = data.tool_view;

            const incomingImages =
              data.images ??
              data.image_results ??
              data.gallery ??
              data.tool_result?.results ??
              data.tool_results?.images;

            if (incomingImages !== undefined) {
              updates.images = normalizeImages(incomingImages);
            }

            updateAssistantMessage(assistantMessageId, updates);
            if (data.conversation_id) setConversationId(data.conversation_id);
            break;
          }

          case "complete": {
            streamCompleted = true;
            const answer = String(
              data.answer ||
                data.answer_rw ||
                data.answer_kinyarwanda ||
                data.answer_english ||
                ""
            ).trim();

            const finalImages =
              data.images ??
              data.image_results ??
              data.gallery ??
              data.tool_result?.results ??
              data.tool_results?.images;

            updateAssistantMessage(assistantMessageId, {
              text: answer,
              ...(finalImages !== undefined
                ? { images: normalizeImages(finalImages) }
                : {}),
              reasoningSummary: data.reasoning_summary || null,
              toolView: data.tool_view || null,
              status: "completed",
              streaming: false,
              processingMode: data.processing_mode || null,
            });

            if (data.conversation_id) setConversationId(data.conversation_id);
            break;
          }

          case "error": {
            streamError = new Error(
              getErrorMessage(data, "ANTIMATE AI encountered an error.")
            );
            break;
          }

          case "stopped": {
            streamStopped = true;
            updateAssistantMessage(assistantMessageId, {
              status: "stopped",
              streaming: false,
            });
            break;
          }

          default:
            break;
        }
      });

      if (streamError) throw streamError;

      if (streamStopped || stopRequestedRef.current) {
        updateAssistantMessage(assistantMessageId, {
          status: "stopped",
          streaming: false,
        });
      } else if (!streamCompleted) {
        throw new Error("ANTIMATE stream ended without a complete event.");
      }

      if (streamCompleted) {
        updateAssistantMessage(assistantMessageId, {
          streaming: false,
          status: "completed",
        });
      }
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        if (stopRequestedRef.current) {
          updateAssistantMessage(assistantMessageId, {
            status: "stopped",
            streaming: false,
          });
        }
      } else {
        console.error("[ANTIMATE AI] Frontend stream error:", requestError);
        setError(
          requestError.status === 401
            ? "Ugomba kubanza kwinjira muri konti."
            : requestError.message || "Habaye ikibazo mu guhuza na ANTIMATE AI."
        );
        updateAssistantMessage(assistantMessageId, {
          status: "failed",
          streaming: false,
        });
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

  const stopGeneration = useCallback(async () => {
    if (!busy || stopRequestedRef.current) return;

    stopRequestedRef.current = true;
    setStopRequested(true);

    try {
      const response = await fetch(CHAT_STOP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({ conversation_id: conversationId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, "Unable to stop generation."));
      }
    } catch (stopError) {
      console.error("[ANTIMATE AI] Stop request failed:", stopError);
      stopRequestedRef.current = false;
      setStopRequested(false);
      setError(stopError.message || "Ntibyashobotse guhagarika generation.");
    }
  }, [busy, conversationId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.text || "");
      setCopiedId(message.id);
      setTimeout(() => {
        setCopiedId((current) => (current === message.id ? null : current));
      }, 1500);
    } catch {
      setError("Ntibyashobotse gukoporora ubutumwa.");
    }
  };

  const shareConversation = async () => {
    const url = `${window.location.origin}${window.location.pathname}?c=${conversationId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: currentTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedId("share");
        setTimeout(() => setCopiedId((c) => (c === "share" ? null : c)), 1500);
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  };

  const sortedConversations = useMemo(
    () =>
      [...savedConversations].sort(
        (a, b) =>
          Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
          (b.updatedAt || 0) - (a.updatedAt || 0)
      ),
    [savedConversations]
  );

  /* =========================================================
     RENDER
     ========================================================= */
  return (
    <div className={`antimate-app ${theme}`}>
      {/* ---------- SIDEBAR ---------- */}
      <aside className={`antimate-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <button
          type="button"
          className="antimate-new-chat"
          onClick={newChat}
          disabled={busy}
        >
          <Icon name="plus" size={16} />
          <span>New chat</span>
        </button>

        <div className="antimate-convo-list">
          {sortedConversations.length === 0 ? (
            <div className="antimate-convo-empty">No conversations</div>
          ) : (
            sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`antimate-convo-row ${
                  conversation.id === conversationId ? "active" : ""
                } ${conversation.pinned ? "pinned" : ""}`}
              >
                {renamingConversationId === conversation.id ? (
                  <form
                    className="antimate-rename"
                    onSubmit={(event) => {
                      event.preventDefault();
                      commitRenameConversation(conversation.id);
                    }}
                  >
                    <input
                      autoFocus
                      value={renameDraft}
                      maxLength={80}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setRenamingConversationId(null);
                      }}
                    />
                    <button type="submit" aria-label="Save name">
                      <Icon name="check" size={14} />
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      className="antimate-convo-item"
                      onClick={() => openConversation(conversation)}
                      disabled={busy}
                      title={conversation.title}
                    >
                      {conversation.pinned && <span className="antimate-pin">◆</span>}
                      <span className="antimate-convo-title">{conversation.title}</span>
                    </button>

                    <div className="antimate-convo-menu-wrap">
                      <button
                        type="button"
                        className="antimate-convo-menu-btn"
                        onClick={() =>
                          setOpenConversationMenu((current) =>
                            current === conversation.id ? null : conversation.id
                          )
                        }
                        disabled={busy}
                        aria-label="Conversation options"
                        aria-expanded={openConversationMenu === conversation.id}
                      >
                        <Icon name="more" size={16} />
                      </button>

                      {openConversationMenu === conversation.id && (
                        <div className="antimate-convo-menu" role="menu">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => beginRenameConversation(conversation)}
                          >
                            <Icon name="edit" size={15} /> Rename
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => togglePinConversation(conversation.id)}
                          >
                            <Icon name="pin" size={15} />{" "}
                            {conversation.pinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="danger"
                            onClick={() => deleteConversation(conversation.id)}
                          >
                            <Icon name="trash" size={15} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ---------- MAIN ---------- */}
      <main className="antimate-main">
        {/* ===== TOP BAR ===== */}
        <header className="antimate-topbar">
          <div className="antimate-topbar-left">
            <div className="antimate-logo">
              <span className="antimate-logo-mark">A</span>
              <span className="antimate-logo-word">ANTIMATE</span>
            </div>

            <button
              type="button"
              className="antimate-ghost-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <Icon name="menu" size={17} />
            </button>

            <h2 className="antimate-topbar-title" title={currentTitle}>
              {currentTitle}
            </h2>
          </div>

          <div className="antimate-topbar-right">
            <button
              type="button"
              className="antimate-ghost-btn"
              onClick={shareConversation}
              aria-label="Share conversation"
              title="Share"
            >
              <Icon name="share" size={16} />
            </button>
          </div>
        </header>

        {/* ===== MESSAGES ===== */}
        <section className="antimate-scroll">
          {messages.length === 0 ? (
            <div className="antimate-welcome">
              <h1 className="antimate-welcome-title">
                {language === "rw" ? "Muraho." : "Hello."}
              </h1>
              <p className="antimate-welcome-sub">
                {language === "rw"
                  ? "Ni iki twaganiraho uyu munsi?"
                  : "What would you like to explore today?"}
              </p>
            </div>
          ) : (
            <div className="antimate-stream">
              {messages.map((message) => {
                const isAssistant = message.role === "assistant";
                const isStreaming = Boolean(message.streaming);

                const showStatus =
                  isAssistant &&
                  (isStreaming ||
                    (message.status &&
                      message.status !== "completed" &&
                      message.status !== "failed"));

                const statusLabel = showStatus ? formatStatus(message.status) : "";

                return (
                  <article key={message.id} className={`antimate-turn ${message.role}`}>
                    {message.role === "user" ? (
                      <div className="antimate-user-wrap">
                        <p className="antimate-user-text">{message.text}</p>
                        <div className="antimate-user-actions">
                          <button
                            type="button"
                            className="antimate-ghost-btn"
                            onClick={() => editUserMessage(message)}
                            aria-label="Edit message"
                            title="Edit"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="antimate-ghost-btn"
                            onClick={() => copyMessage(message)}
                            aria-label="Copy message"
                            title="Copy"
                          >
                            <Icon
                              name={copiedId === message.id ? "check" : "copy"}
                              size={14}
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="antimate-answer">
                        {/* TOP LINE: status + seconds (left) | tool activity (left, beside) */}
                        <div className="antimate-answer-top">
                          <div className="antimate-answer-left">
                            {showStatus && (
                              <span className="antimate-answer-status">
                                {isStreaming && <span className="antimate-dot" />}
                                {statusLabel}
                                {isStreaming && (
                                  <span className="antimate-answer-seconds">
                                    {liveSeconds}s
                                  </span>
                                )}
                              </span>
                            )}

                            {message.toolView && (
                              <details className="antimate-tool-text">
                                <summary>Tool activity</summary>
                                <pre>
                                  {typeof message.toolView === "string"
                                    ? message.toolView
                                    : JSON.stringify(message.toolView, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>

                        {/* INCREMENTAL TEXT — left-aligned */}
                        <IncrementalText
                          text={message.text}
                          images={message.images}
                          messageId={message.id}
                          streaming={isStreaming}
                        />

                        {message.reasoningSummary && (
                          <details className="antimate-details">
                            <summary>Thinking summary</summary>
                            <p>{message.reasoningSummary}</p>
                          </details>
                        )}

                        {/* ACTION ICONS: TTS, Retry, Edit, Like, Copy */}
                        {!isStreaming && (message.text || message.images?.length > 0) && (
                          <div className="antimate-answer-actions">
                            <button
                              type="button"
                              className={`antimate-ghost-btn ${speakingId === message.id ? "active" : ""}`}
                              onClick={() => speakMessage(message)}
                              aria-label="Read answer aloud"
                              title="Read aloud"
                            >
                              <Icon name="speaker" size={15} />
                            </button>
                            <button
                              type="button"
                              className="antimate-ghost-btn"
                              onClick={() => retryMessage(message)}
                              aria-label="Retry"
                              title="Retry"
                            >
                              <Icon name="retry" size={15} />
                            </button>
                            <button
                              type="button"
                              className="antimate-ghost-btn"
                              onClick={() => editUserMessage(message)}
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Icon name="edit" size={15} />
                            </button>
                            <button
                              type="button"
                              className={`antimate-ghost-btn ${likedIds.has(message.id) ? "active" : ""}`}
                              onClick={() => toggleLike(message.id)}
                              aria-label="Like"
                              title="Like"
                            >
                              <Icon name="like" size={15} />
                            </button>
                            <button
                              type="button"
                              className="antimate-ghost-btn"
                              onClick={() => copyMessage(message)}
                              aria-label="Copy"
                              title="Copy"
                            >
                              <Icon
                                name={copiedId === message.id ? "check" : "copy"}
                                size={15}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        {/* ===== COMPOSER ===== */}
        <footer className="antimate-composer-wrap">
          {error && (
            <div className="antimate-error">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss">
                <Icon name="close" size={14} />
              </button>
            </div>
          )}

          <form className="antimate-composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === "rw" ? "Andika ubutumwa…" : "Message ANTIMATE…"
              }
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={busy}
            />

            <div className="antimate-composer-row">
              <button
                type="button"
                className={`antimate-chip ${thinkingEnabled ? "on" : ""}`}
                onClick={toggleThinking}
                disabled={busy}
                aria-pressed={thinkingEnabled}
                title="Thinking mode"
              >
                <Icon name="brain" size={15} />
                <span>Thinking</span>
              </button>

              <div className="antimate-composer-meta">
                <select
                  className="antimate-select"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  disabled={busy}
                  aria-label="Language"
                >
                  <option value="rw">RW</option>
                  <option value="en">EN</option>
                </select>

                <span className="antimate-count">
                  {input.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>

              {busy ? (
                <button
                  type="button"
                  className="antimate-send antimate-stop"
                  onClick={stopGeneration}
                  disabled={stopRequested}
                  aria-label="Stop generation"
                  title="Stop generation"
                >
                  <Icon name="stop" size={17} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="antimate-send"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  title="Send message"
                >
                  <Icon name="send" size={17} />
                </button>
              )}
            </div>
          </form>

          <div className="antimate-composer-foot">
            <p className="antimate-hint">
              {language === "rw"
                ? "Enter wohereza · Shift+Enter umurongo mushya"
                : "Enter to send · Shift+Enter for a new line"}
            </p>

            {/* ===== THREE-DOT PROFILE MENU ===== */}
            <div className="antimate-profile" ref={profileMenuRef}>
              <button
                type="button"
                className="antimate-ghost-btn antimate-profile-btn"
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-label="Profile menu"
                aria-expanded={profileMenuOpen}
                title="Menu"
              >
                <Icon name="more" size={17} />
              </button>

              {profileMenuOpen && (
                <div className="antimate-profile-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setError("Settings coming soon.");
                    }}
                  >
                    <Icon name="settings" size={15} /> Settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleTheme();
                      setProfileMenuOpen(false);
                    }}
                  >
                    <Icon name={theme === "light" ? "moon" : "sun"} size={15} />
                    Appearance · {theme === "light" ? "Dark" : "Light"}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="danger"
                    onClick={handleLogout}
                  >
                    <Icon name="logout" size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}