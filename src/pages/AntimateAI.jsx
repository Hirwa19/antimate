
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./AntimateAI.css";

/* =========================================================
   ENDPOINTS
   ========================================================= */
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const CHAT_STREAM_URL = `${API_URL}/api/antimate/chat/stream`;
const CHAT_STOP_URL = `${API_URL}/api/antimate/chat/stop`;

const MAX_MESSAGE_LENGTH = 12000;
const CHAT_HISTORY_LIMIT = 60;

/* =========================================================
   HELPERS
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

  if (typeof status === "string") {
    return status.replace(/[_-]/g, " ");
  }

  if (typeof status === "object") {
    return status.status || status.message || status.label || "Processing";
  }

  return String(status);
}

/* =========================================================
   CONVERSATION STORAGE
   ========================================================= */
function getConversationStorageKey() {
  const token = getToken();
  return `antimate_chat_history_v1_${token.slice(-16)}`;
}

function readConversationHistory() {
  if (!getToken()) return [];

  try {
    const stored = localStorage.getItem(getConversationStorageKey());
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* =========================================================
   IMAGE NORMALIZATION
   ========================================================= */
function normalizeImages(images) {
  if (!Array.isArray(images)) return [];

  const seen = new Set();

  return images
    .map((item) => {
      if (typeof item === "string") {
        item = {
          image: item,
          title: "Image result",
          source: item,
        };
      }

      if (!item || typeof item !== "object") return null;

      const image =
        item.image ||
        item.image_url ||
        item.thumbnail ||
        item.thumbnail_url ||
        "";

      if (typeof image !== "string") return null;
      if (!/^https?:\/\//i.test(image)) return null;
      if (seen.has(image)) return null;

      seen.add(image);

      const source =
        item.source ||
        item.url ||
        item.page_url ||
        image;

      return {
        image,
        title: item.title || item.name || "Image result",
        source:
          typeof source === "string" &&
          /^https?:\/\//i.test(source)
            ? source
            : image,
      };
    })
    .filter(Boolean);
}

/* =========================================================
   IMAGE MARKDOWN NORMALIZATION
   ========================================================= */
function normalizeAssistantMarkdown(text) {
  let content = String(text || "");

  // Repair nested malformed Markdown:
  // ![Lion]([https://image.jpg](https://image.jpg))
  content = content.replace(
    /!\[([^\]]*)\]\s*\\?\(\s*\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)\s*\)/gi,
    (_, alt, firstUrl) => `![${alt}](${firstUrl.trim()})`
  );

  // Repair escaped parentheses:
  // ![Lion]\(https://image.jpg\)
  content = content.replace(
    /!\[([^\]]*)\]\s*\\\((https?:\/\/[^\s)]+)\\?\)/gi,
    (_, alt, url) => `![${alt}](${url})`
  );

  return content;
}

/* =========================================================
   INLINE IMAGE RENDERER
   ========================================================= */
function renderAssistantContent(text, images = [], messageId = "") {
  const content = normalizeAssistantMarkdown(text);
  const availableImages = normalizeImages(images);

  const imagePattern =
    /\[\[IMAGE_(\d+)\]\]|!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/gi;

  const rendered = [];

  let lastIndex = 0;
  let match;
  let imageCounter = 0;

  while ((match = imagePattern.exec(content)) !== null) {
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      rendered.push(content.slice(lastIndex, matchStart));
    }

    let image = null;
    let alt = "";

    if (match[1]) {
      const imageIndex = Number(match[1]) - 1;
      image = availableImages[imageIndex] || null;
    } else {
      alt = match[2] || "ANTIMATE AI image";

      const imageUrl = match[3];

      image = {
        image: imageUrl,
        source: imageUrl,
        title: alt,
      };

      const matchingImage = availableImages.find(
        (item) => item.image === imageUrl
      );

      if (matchingImage) {
        image = matchingImage;
      }
    }

    if (image?.image) {
      const currentImageNumber = imageCounter++;

      rendered.push(
        <figure
          className="antimate-inline-image"
          key={`${messageId}-image-${currentImageNumber}`}
        >
          <a
            href={image.source || image.image}
            target="_blank"
            rel="noopener noreferrer"
            title={image.title || "Open image"}
          >
            <img
              src={image.image}
              alt={image.title || alt || "ANTIMATE AI image"}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.classList.add("image-load-failed");
              }}
            />
          </a>

          {image.title && (
            <figcaption>{image.title}</figcaption>
          )}
        </figure>
      );
    }

    lastIndex = imagePattern.lastIndex;
  }

  if (lastIndex < content.length) {
    rendered.push(content.slice(lastIndex));
  }

  return rendered;
}

/* =========================================================
   INCREMENTAL TEXT
   ========================================================= */
function IncrementalText({ text, images, messageId, streaming }) {
  const segments = useMemo(
    () => renderAssistantContent(text, images, messageId),
    [text, images, messageId]
  );

  const totalWords = useMemo(
    () =>
      segments.reduce((count, segment) => {
        if (typeof segment === "string") {
          return count + segment.split(/(\s+)/).filter(Boolean).length;
        }
        return count + 1;
      }, 0),
    [segments]
  );

  const [revealed, setRevealed] = useState(totalWords);

  useEffect(() => {
    if (!streaming) {
      setRevealed(totalWords);
      return undefined;
    }

    if (revealed >= totalWords) return undefined;

    const timer = window.setInterval(() => {
      setRevealed((current) => Math.min(current + 4, totalWords));
    }, 36);

    return () => window.clearInterval(timer);
  }, [revealed, totalWords, streaming]);

  let budget = revealed;

  return (
    <div className={`antimate-assistant-text ${streaming ? "streaming" : ""}`}>
      {segments.map((segment, index) => {
        if (typeof segment !== "string") {
          if (budget > 0) budget -= 1;
          return budget >= 0 ? segment : null;
        }

        const tokens = segment.split(/(\s+)/);
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

      {streaming && (
        <span className="antimate-caret" aria-hidden="true" />
      )}
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
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,

    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    brain: (
      <>
        <path d="M12 18V5" />
        <path d="M12 8a4 4 0 0 0-7.5-1.8A4 4 0 0 0 5 14a4 4 0 0 0 7 2.6" />
        <path d="M12 8a4 4 0 0 1 7.5-1.8A4 4 0 0 1 19 14a4 4 0 0 1-7 2.6" />
        <path d="M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </>
    ),

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
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </>
    ),

    speaker: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    ),

    "speaker-off": (
      <>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="m16 9 5 5m0-5-5 5" />
      </>
    ),

    like: (
      <path d="M7 10v10H3V10h4Zm4 10h6.3a2 2 0 0 0 2-1.6l1.4-6A2 2 0 0 0 18.7 10H14V6a2 2 0 0 0-2-2l-1 6v10Z" />
    ),

    "like-filled": (
      <path
        d="M7 10v10H3V10h4Zm4 10h6.3a2 2 0 0 0 2-1.6l1.4-6A2 2 0 0 0 18.7 10H14V6a2 2 0 0 0-2-2l-1 6v10Z"
        fill="currentColor"
      />
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),

    appearance: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 0 0 18 4.5 4.5 0 0 1 0-9 4.5 4.5 0 0 0 0-9Z" />
      </>
    ),

    back: <path d="M19 12H5m7-7-7 7 7 7" />,

    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),

    mic: (
      <>
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </>
    ),

    "mic-off": (
      <>
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
        <path d="m3 3 18 18" />
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
   SSE PARSER
   ========================================================= */
function parseSSEBlock(block) {
  if (!block || !block.trim()) return null;

  let event = "message";
  const dataLines = [];

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith(":")) continue;

    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
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
      // Already released.
    }
  }
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
export default function AntimateAI() {
  const [conversationId, setConversationId] = useState(createId);
  const [messages, setMessages] = useState([]);

  const [savedConversations, setSavedConversations] = useState(
    readConversationHistory
  );

  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("dark");
  const [thinkingEnabled, setThinkingEnabled] = useState(false);

  const [busy, setBusy] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [speakingId, setSpeakingId] = useState(null);
  const [listening, setListening] = useState(false);

  const [openConversationMenu, setOpenConversationMenu] = useState(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [renamingConversationId, setRenamingConversationId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const stopRequestedRef = useRef(false);
  const recognitionRef = useRef(null);

  const signedIn = Boolean(getToken());

  /* =========================================================
     SPEECH RECOGNITION SUPPORT
     ========================================================= */
  const sttSupported = useMemo(() => {
    if (typeof window === "undefined") return false;

    return Boolean(
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
  }, []);

  /* =========================================================
     PERSIST SIGNED-IN HISTORY ONLY
     ========================================================= */
  useEffect(() => {
    try {
      if (!getToken()) {
        localStorage.removeItem("antimate_chat_history_v1_guest");
        return;
      }

      localStorage.setItem(
        getConversationStorageKey(),
        JSON.stringify(savedConversations.slice(0, CHAT_HISTORY_LIMIT))
      );
    } catch (storageError) {
      console.warn(
        "[ANTIMATE AI] Could not save chat history:",
        storageError
      );
    }
  }, [savedConversations]);

  /* =========================================================
     SYNC ACTIVE CONVERSATION
     ========================================================= */
  useEffect(() => {
    if (!getToken() || !messages.length) return;

    const firstUserMessage = messages.find(
      (item) => item.role === "user"
    );

    const title = (firstUserMessage?.text || "New conversation")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 56);

    setSavedConversations((previous) => {
      const existing = previous.find(
        (item) => item.id === conversationId
      );

      const updated = {
        id: conversationId,
        title: existing?.title || title || "New conversation",
        messages,
        updatedAt: Date.now(),
        pinned: Boolean(existing?.pinned),
      };

      return [
        updated,
        ...previous.filter((item) => item.id !== conversationId),
      ]
        .sort(
          (a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
            (b.updatedAt || 0) - (a.updatedAt || 0)
        )
        .slice(0, CHAT_HISTORY_LIMIT);
    });
  }, [conversationId, messages]);

  /* =========================================================
     ELAPSED TIME
     ========================================================= */
  useEffect(() => {
    if (!busy) {
      setElapsed(0);
      return undefined;
    }

    setElapsed(0);
    const started = Date.now();

    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);

    return () => window.clearInterval(timer);
  }, [busy]);

  /* =========================================================
     AUTO SCROLL
     ========================================================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, busy]);

  /* =========================================================
     CLEANUP
     ========================================================= */
  useEffect(
    () => () => {
      abortRef.current?.abort();

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors.
      }
    },
    []
  );

  /* =========================================================
     CLOSE PROFILE MENU ON OUTSIDE CLICK
     ========================================================= */
  useEffect(() => {
    if (!openProfileMenu) return undefined;

    const handleClick = (event) => {
      if (!event.target.closest?.(".antimate-profile-wrap")) {
        setOpenProfileMenu(false);
      }
    };

    window.addEventListener("mousedown", handleClick);

    return () => {
      window.removeEventListener("mousedown", handleClick);
    };
  }, [openProfileMenu]);

  /* =========================================================
     SPEECH RECOGNITION SETUP
     ========================================================= */
  useEffect(() => {
    if (!sttSupported) return undefined;

    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SR();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }

      if (finalText) {
        setInput((current) => {
          const separator =
            current && !current.endsWith(" ") ? " " : "";

          return `${current}${separator}${finalText}`.slice(
            0,
            MAX_MESSAGE_LENGTH
          );
        });
      }
    };

    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setError(
          "Microphone access denied. Please allow it in your browser."
        );
      } else if (
        event.error !== "no-speech" &&
        event.error !== "aborted"
      ) {
        setError(`Speech recognition error: ${event.error}`);
      }

      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore.
      }

      recognitionRef.current = null;
    };
  }, [sttSupported]);

  /* =========================================================
     STOP TTS/STT WHEN LANGUAGE IS NOT ENGLISH
     ========================================================= */
  useEffect(() => {
    if (language === "en") return;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore.
      }

      setListening(false);
    }
  }, [language, listening]);

  /* =========================================================
     MESSAGE UPDATE
     ========================================================= */
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

  /* =========================================================
     CONVERSATION ACTIONS
     ========================================================= */
  const openConversation = useCallback(
    (conversation) => {
      if (busy || !signedIn || !conversation) return;

      setConversationId(conversation.id);
      setMessages(
        Array.isArray(conversation.messages)
          ? conversation.messages
          : []
      );

      setInput("");
      setError("");
      setStopRequested(false);
      stopRequestedRef.current = false;

      inputRef.current?.focus();
    },
    [busy, signedIn]
  );

  const togglePinConversation = useCallback(
    (id) => {
      if (busy || !signedIn) return;

      setSavedConversations((previous) =>
        previous
          .map((item) =>
            item.id === id
              ? { ...item, pinned: !item.pinned }
              : item
          )
          .sort(
            (a, b) =>
              Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
              (b.updatedAt || 0) - (a.updatedAt || 0)
          )
      );

      setOpenConversationMenu(null);
    },
    [busy, signedIn]
  );

  const beginRenameConversation = useCallback(
    (conversation) => {
      if (busy || !signedIn || !conversation) return;

      setRenamingConversationId(conversation.id);
      setRenameDraft(conversation.title || "");
      setOpenConversationMenu(null);
    },
    [busy, signedIn]
  );

  const commitRenameConversation = useCallback(
    (id) => {
      if (!signedIn) return;

      const title = renameDraft.trim().slice(0, 80);
      if (!title) return;

      setSavedConversations((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, title } : item
        )
      );

      setRenamingConversationId(null);
      setRenameDraft("");
    },
    [renameDraft, signedIn]
  );

  const deleteConversation = useCallback(
    (id) => {
      if (busy || !signedIn) return;

      const confirmed = window.confirm(
        "Delete this conversation from this browser?"
      );

      if (!confirmed) return;

      setSavedConversations((previous) =>
        previous.filter((item) => item.id !== id)
      );

      setOpenConversationMenu(null);

      if (conversationId === id) {
        setConversationId(createId());
        setMessages([]);
        setInput("");
        setError("");
      }
    },
    [busy, conversationId, signedIn]
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

  /* =========================================================
     THEME AND THINKING
     ========================================================= */
  const toggleTheme = useCallback(() => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  }, []);

  const toggleThinking = useCallback(() => {
    if (busy || !signedIn) return;
    setThinkingEnabled((current) => !current);
  }, [busy, signedIn]);

  /* =========================================================
     EDIT QUESTION
     ========================================================= */
  const editQuestion = useCallback(
    (messageId) => {
      if (busy) return;

      setMessages((previous) => {
        const index = previous.findIndex(
          (message) => message.id === messageId
        );

        if (index === -1) return previous;

        const target = previous[index];
        if (target.role !== "user") return previous;

        const next = previous.slice();

        const removeCount =
          next[index + 1]?.role === "assistant" ? 2 : 1;

        next.splice(index, removeCount);
        return next;
      });

      const target = messages.find(
        (message) => message.id === messageId
      );

      if (target?.text) setInput(target.text);

      inputRef.current?.focus();
    },
    [busy, messages]
  );

  /* =========================================================
     TEXT TO SPEECH
     ========================================================= */
  const speakMessage = useCallback(
    (message) => {
      if (language !== "en") return;

      if (
        typeof window === "undefined" ||
        !window.speechSynthesis
      ) {
        setError(
          "Text-to-speech is not supported in this browser."
        );
        return;
      }

      const synth = window.speechSynthesis;

      if (speakingId === message.id) {
        synth.cancel();
        setSpeakingId(null);
        return;
      }

      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(
        message.text || ""
      );

      utterance.lang = "en-US";
      utterance.rate = 0.95;

      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      setSpeakingId(message.id);
      synth.speak(utterance);
    },
    [language, speakingId]
  );

  /* =========================================================
     SPEECH TO TEXT
     ========================================================= */
  const toggleListening = useCallback(() => {
    if (language !== "en") return;

    const recognition = recognitionRef.current;

    if (!recognition) {
      setError(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    if (listening) {
      try {
        recognition.stop();
      } catch {
        // Ignore.
      }

      setListening(false);
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    try {
      recognition.start();
      setListening(true);
      setError("");
    } catch (err) {
      if (err?.name !== "InvalidStateError") {
        setError("Could not start speech recognition.");
      }
    }
  }, [language, listening]);

  /* =========================================================
     LIKE
     ========================================================= */
  const toggleLike = useCallback((messageId) => {
    setLikedIds((previous) => {
      const next = new Set(previous);

      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }

      return next;
    });
  }, []);

  /* =========================================================
     SHARE
     ========================================================= */
  const shareConversation = useCallback(async () => {
    const current = savedConversations.find(
      (item) => item.id === conversationId
    );

    const text = current?.title || "ANTIMATE conversation";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "ANTIMATE",
          text,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${text} — ${window.location.href}`
        );

        setCopiedId("share");

        setTimeout(() => {
          setCopiedId((currentId) =>
            currentId === "share" ? null : currentId
          );
        }, 1500);
      }
    } catch {
      // User cancelled sharing.
    }
  }, [conversationId, savedConversations]);

  /* =========================================================
     AUTH ACTIONS
     ========================================================= */
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("token");
    } catch {
      // Ignore.
    }

    window.location.href = "/login";
  }, []);

  const handleSignIn = useCallback(() => {
    window.location.href = "/login";
  }, []);

  /* =========================================================
     SEND MESSAGE
     ========================================================= */
  const sendMessage = useCallback(async () => {
    const cleanText = input.trim();

    if (!cleanText || busy) return;

    if (cleanText.length > MAX_MESSAGE_LENGTH) {
      setError("Ubutumwa burenze umubare w'inyuguti wemerewe.");
      return;
    }

    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore.
      }

      setListening(false);
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
      images: [],
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
          thinking_enabled: signedIn ? thinkingEnabled : false,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

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
        const data = await response.json().catch(() => ({}));

        throw new Error(
          getErrorMessage(
            data,
            "Backend did not return an SSE stream."
          )
        );
      }

      await readSSEStream(response, ({ event, data }) => {
        if (!data || typeof data !== "object") return;

        switch (event) {
          case "meta": {
            if (data.conversation_id) {
              setConversationId(data.conversation_id);
            }
            break;
          }

          case "status": {
            const status = formatStatus(
              data.status || data.message
            );

            updateAssistantMessage(assistantMessageId, {
              status,
            });
            break;
          }

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

            const incomingImages =
              data.images ??
              data.image_results ??
              data.gallery ??
              data.tool_result?.results ??
              data.tool_results?.images;

            if (incomingImages !== undefined) {
              updates.images = normalizeImages(incomingImages);
            }

            updateAssistantMessage(
              assistantMessageId,
              updates
            );

            if (data.conversation_id) {
              setConversationId(data.conversation_id);
            }
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
                ? {
                    images: normalizeImages(finalImages),
                  }
                : {}),

              reasoningSummary:
                data.reasoning_summary || null,

              toolView: data.tool_view || null,
              status: "completed",
              streaming: false,
              processingMode: data.processing_mode || null,
            });

            if (data.conversation_id) {
              setConversationId(data.conversation_id);
            }
            break;
          }

          case "error": {
            streamError = new Error(
              getErrorMessage(
                data,
                "ANTIMATE AI encountered an error."
              )
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
        throw new Error(
          "ANTIMATE stream ended without a complete event."
        );
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
        console.error(
          "[ANTIMATE AI] Frontend stream error:",
          requestError
        );

        setError(
          requestError.status === 401
            ? "Your session is invalid. Please sign in again."
            : requestError.message ||
                "Habaye ikibazo mu guhuza na ANTIMATE AI."
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
    listening,
    signedIn,
    updateAssistantMessage,
  ]);

  /* =========================================================
     STOP GENERATION
     ========================================================= */
  const stopGeneration = useCallback(async () => {
    if (!busy || stopRequestedRef.current) return;

    stopRequestedRef.current = true;
    setStopRequested(true);

    try {
      const token = getToken();

      const response = await fetch(CHAT_STOP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
        body: JSON.stringify({
          conversation_id: conversationId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          getErrorMessage(data, "Unable to stop generation.")
        );
      }
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

  /* =========================================================
     FORM HANDLERS
     ========================================================= */
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

  /* =========================================================
     COPY MESSAGE
     ========================================================= */
  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.text || "");

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

  /* =========================================================
     CONVERSATION DISPLAY DATA
     ========================================================= */
  const sortedConversations = useMemo(
    () =>
      [...savedConversations].sort(
        (a, b) =>
          Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
          (b.updatedAt || 0) - (a.updatedAt || 0)
      ),
    [savedConversations]
  );

  const activeConversationTitle = signedIn
    ? savedConversations.find(
        (item) => item.id === conversationId
      )?.title || "New chat"
    : "Guest chat";

  /* =========================================================
     RENDER
     ========================================================= */
  return (
    <div className={`antimate-app ${theme}`}>
      <header className="antimate-topbar">
        <div className="antimate-topbar-left">
          <div className="antimate-logo" aria-label="ANTIMATE">
            <span className="antimate-logo-mark">A</span>
            <span className="antimate-logo-text">ANTIMATE</span>
          </div>

          <button
            type="button"
            className="antimate-ghost-btn"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Icon name="menu" size={18} />
          </button>
        </div>

        <div className="antimate-topbar-center">
          <span
            className="antimate-convo-name"
            title={activeConversationTitle}
          >
            {activeConversationTitle}
          </span>
        </div>

        <div className="antimate-topbar-right">
          <button
            type="button"
            className="antimate-ghost-btn antimate-share"
            onClick={shareConversation}
            aria-label="Share conversation"
            title="Share"
          >
            <Icon
              name={copiedId === "share" ? "check" : "share"}
              size={17}
            />
            <span>Share</span>
          </button>
        </div>
      </header>

      <div className="antimate-body">
        <aside
          className={`antimate-sidebar ${
            sidebarOpen ? "open" : "closed"
          }`}
        >
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
            {!signedIn ? (
              <div className="antimate-convo-empty">
                <p>Guest mode</p>
                <span>
                  Your chats stay only in this session.
                  They are not saved to your account or browser history.
                </span>
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="antimate-convo-empty">
                No conversations
              </div>
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
                        onChange={(event) =>
                          setRenameDraft(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            setRenamingConversationId(null);
                          }
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
                        {conversation.pinned && (
                          <span className="antimate-pin">◆</span>
                        )}

                        <span className="antimate-convo-title">
                          {conversation.title}
                        </span>
                      </button>

                      <div className="antimate-convo-menu-wrap">
                        <button
                          type="button"
                          className="antimate-convo-menu-btn"
                          onClick={() =>
                            setOpenConversationMenu((current) =>
                              current === conversation.id
                                ? null
                                : conversation.id
                            )
                          }
                          disabled={busy}
                          aria-label="Conversation options"
                          aria-expanded={
                            openConversationMenu === conversation.id
                          }
                        >
                          <Icon name="more" size={16} />
                        </button>

                        {openConversationMenu === conversation.id && (
                          <div
                            className="antimate-convo-menu"
                            role="menu"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                beginRenameConversation(conversation)
                              }
                            >
                              <Icon name="edit" size={15} />
                              Rename
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                togglePinConversation(conversation.id)
                              }
                            >
                              <Icon name="pin" size={15} />
                              {conversation.pinned ? "Unpin" : "Pin"}
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              className="danger"
                              onClick={() =>
                                deleteConversation(conversation.id)
                              }
                            >
                              <Icon name="trash" size={15} />
                              Delete
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

          <div className="antimate-sidebar-foot">
            <div className="antimate-user">
              <span className="antimate-user-avatar">
                {signedIn ? "U" : "G"}
              </span>

              <span className="antimate-user-label">
                {signedIn ? "Account" : "Guest"}
              </span>
            </div>

            <div className="antimate-profile-wrap">
              <button
                type="button"
                className="antimate-ghost-btn"
                onClick={() =>
                  setOpenProfileMenu((value) => !value)
                }
                aria-label="Profile options"
                aria-expanded={openProfileMenu}
              >
                <Icon name="more" size={17} />
              </button>

              {openProfileMenu && (
                <div className="antimate-profile-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setOpenProfileMenu(false)}
                  >
                    <Icon name="settings" size={15} />
                    Settings
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleTheme();
                      setOpenProfileMenu(false);
                    }}
                  >
                    <Icon name="appearance" size={15} />
                    Appearance
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfileMenu(false);
                      window.history.back();
                    }}
                  >
                    <Icon name="back" size={15} />
                    Back
                  </button>

                  {signedIn ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="danger"
                      onClick={() => {
                        setOpenProfileMenu(false);
                        handleLogout();
                      }}
                    >
                      <Icon name="logout" size={15} />
                      Logout
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenProfileMenu(false);
                        handleSignIn();
                      }}
                    >
                      <Icon name="logout" size={15} />
                      Sign in
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="antimate-main">
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
                  const isAssistant =
                    message.role === "assistant";

                  const statusLabel = isAssistant
                    ? message.status === "completed"
                      ? ""
                      : formatStatus(message.status)
                    : "";

                  const showElapsed =
                    isAssistant && message.streaming;

                  return (
                    <article
                      key={message.id}
                      className={`antimate-turn ${message.role}`}
                    >
                      {message.role === "user" ? (
                        <div className="antimate-user-row">
                          <p className="antimate-user-text">
                            {message.text}
                          </p>

                          <button
                            type="button"
                            className="antimate-ghost-btn antimate-edit-q"
                            onClick={() => editQuestion(message.id)}
                            aria-label="Edit question"
                            title="Edit question"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="antimate-answer">
                          {statusLabel && (
                            <div className="antimate-answer-meta">
                              <span className="antimate-answer-status">
                                {message.streaming && (
                                  <span className="antimate-dot" />
                                )}

                                {statusLabel}

                                {showElapsed && (
                                  <span className="antimate-elapsed">
                                    · {elapsed}s
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          <IncrementalText
                            text={message.text}
                            images={message.images}
                            messageId={message.id}
                            streaming={Boolean(message.streaming)}
                          />

                          {message.reasoningSummary && (
                            <details className="antimate-details">
                              <summary>Thinking summary</summary>
                              <p>{message.reasoningSummary}</p>
                            </details>
                          )}

                          <div className="antimate-answer-footer">
                            <div className="antimate-tool-left">
                              {message.toolView && (
                                <details className="antimate-tool-text">
                                  <summary>Tool activity</summary>

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
                            </div>

                            {!message.streaming &&
                              (message.text ||
                                message.images?.length > 0) && (
                                <div className="antimate-answer-actions">
                                  {language === "en" && (
                                    <button
                                      type="button"
                                      className="antimate-ghost-btn"
                                      onClick={() =>
                                        speakMessage(message)
                                      }
                                      aria-label="Read answer aloud"
                                      title={
                                        speakingId === message.id
                                          ? "Stop reading"
                                          : "Read answer aloud"
                                      }
                                    >
                                      <Icon
                                        name={
                                          speakingId === message.id
                                            ? "speaker-off"
                                            : "speaker"
                                        }
                                        size={15}
                                      />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className={`antimate-ghost-btn ${
                                      likedIds.has(message.id)
                                        ? "liked"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      toggleLike(message.id)
                                    }
                                    aria-label="Like answer"
                                    title="Like"
                                    aria-pressed={likedIds.has(message.id)}
                                  >
                                    <Icon
                                      name={
                                        likedIds.has(message.id)
                                          ? "like-filled"
                                          : "like"
                                      }
                                      size={15}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    className="antimate-ghost-btn"
                                    onClick={() => copyMessage(message)}
                                    aria-label="Copy response"
                                    title="Copy"
                                  >
                                    <Icon
                                      name={
                                        copiedId === message.id
                                          ? "check"
                                          : "copy"
                                      }
                                      size={15}
                                    />
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}

                <div ref={bottomRef} />
              </div>
            )}
          </section>

          <footer className="antimate-composer-wrap">
            {error && (
              <div className="antimate-error">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss"
                >
                  <Icon name="close" size={14} />
                </button>
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
                    ? "Andika ubutumwa…"
                    : listening
                    ? "Listening… speak now"
                    : "Message ANTIMATE…"
                }
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={busy}
              />

              <div className="antimate-composer-row">
                {language === "en" && sttSupported && (
                  <button
                    type="button"
                    className={`antimate-ghost-btn antimate-mic ${
                      listening ? "listening" : ""
                    }`}
                    onClick={toggleListening}
                    disabled={busy}
                    aria-label={
                      listening ? "Stop dictation" : "Start dictation"
                    }
                    title={
                      listening ? "Stop dictation" : "Dictate"
                    }
                  >
                    <Icon
                      name={listening ? "mic-off" : "mic"}
                      size={17}
                    />
                  </button>
                )}

                <button
                  type="button"
                  className={`antimate-chip ${
                    thinkingEnabled ? "on" : ""
                  }`}
                  onClick={toggleThinking}
                  disabled={busy || !signedIn}
                  aria-pressed={thinkingEnabled}
                  title={
                    signedIn
                      ? "Thinking mode"
                      : "Sign in to use Thinking mode"
                  }
                >
                  <Icon name="brain" size={15} />
                  <span>Thinking</span>
                </button>

                <div className="antimate-composer-meta">
                  <select
                    className="antimate-select"
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

                  {busy && (
                    <span className="antimate-inline-status">
                      <span className="antimate-dot" />
                      {stopRequested ? "Stopping" : "Generating"} ·{" "}
                      {elapsed}s
                    </span>
                  )}

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

            <p className="antimate-hint">
              {language === "rw"
                ? "Enter wohereza · Shift+Enter umurongo mushya"
                : "Enter to send · Shift+Enter for a new line"}
            </p>

            {!signedIn && (
              <p className="antimate-hint">
                Guest mode · Your chat is temporary and will disappear
                when you leave or refresh this page.
              </p>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
