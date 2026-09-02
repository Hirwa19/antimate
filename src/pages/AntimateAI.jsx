// ============================================================
// ANTIMATE AI — AntimateAI.jsx
// Modern Chat UI
// Native CSS inside JSX — NO .css FILE
// Socket.IO Voice + Text Chat
// Light / Dark Mode
// Record + Live Voice
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

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

// 👉 Keep your existing logo path here.
const LOGO_SRC = "/antimate-logo.png";

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const makeAbsoluteUrl = (value) => {
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
};

// ------------------------------------------------------------
// ICONS
// ------------------------------------------------------------

function MicIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
    </svg>
  );
}

function SendIcon({ size = 21 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  );
}

function StopIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SunIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
    </svg>
  );
}

function VolumeIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function LiveIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M5.6 5.6a9 9 0 0 0 0 12.8" />
      <path d="M18.4 5.6a9 9 0 0 1 0 12.8" />
    </svg>
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

  const [text, setText] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [connectionState, setConnectionState] =
    useState("connecting");

  const [error, setError] = useState("");

  const [currentAnswer, setCurrentAnswer] =
    useState("");

  const [transcript, setTranscript] = useState("");

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("antimate-theme");

      if (saved === "dark" || saved === "light") {
        return saved;
      }

      return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const socketRef = useRef(null);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  const chunksRef = useRef([]);

  const holdTimerRef = useRef(null);
  const shortRecordingTimerRef = useRef(null);

  const recordingStartedRef = useRef(false);
  const pointerDownRef = useRef(false);

  const isLiveModeRef = useRef(false);

  const currentAnswerRef = useRef("");
  const isPlayingRef = useRef(false);

  const audioRef = useRef(null);

  const textareaRef = useRef(null);

  const messagesEndRef = useRef(null);

  // ----------------------------------------------------------
  // THEME
  // ----------------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem("antimate-theme", theme);
    } catch {}

    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // ----------------------------------------------------------
  // COLORS
  // ----------------------------------------------------------

  const dark = theme === "dark";

  const colors = {
    bg: dark ? "#070b12" : "#f7f9fc",

    surface: dark
      ? "rgba(18, 24, 35, 0.82)"
      : "rgba(255,255,255,0.88)",

    surfaceSolid: dark ? "#111722" : "#ffffff",

    border: dark
      ? "rgba(255,255,255,0.08)"
      : "rgba(15,23,42,0.08)",

    text: dark ? "#f5f7fb" : "#172033",

    muted: dark ? "#8d98aa" : "#6b7280",

    soft: dark
      ? "rgba(255,255,255,0.045)"
      : "rgba(15,23,42,0.035)",

    userBubble: dark ? "#182337" : "#eef3fa",

    input: dark
      ? "rgba(14,19,29,0.94)"
      : "rgba(255,255,255,0.96)",

    accent: "#5b6cff",

    accentSoft: dark
      ? "rgba(91,108,255,0.15)"
      : "rgba(91,108,255,0.09)",

    danger: "#ef4444",

    success: "#22c55e",

    shadow: dark
      ? "0 20px 60px rgba(0,0,0,.35)"
      : "0 20px 60px rgba(15,23,42,.10)",
  };

  // ----------------------------------------------------------
  // SCROLL TO BOTTOM
  // ----------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, currentAnswer, isProcessing]);

  // ----------------------------------------------------------
  // TEXTAREA AUTO RESIZE
  // ----------------------------------------------------------

  useEffect(() => {
    const el = textareaRef.current;

    if (!el) return;

    el.style.height = "auto";

    el.style.height = `${Math.min(
      Math.max(el.scrollHeight, 24),
      150
    )}px`;
  }, [text]);

  // ----------------------------------------------------------
  // ADD MESSAGE
  // ----------------------------------------------------------

  const addMessage = useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      {
        id:
          Date.now() +
          Math.random()
            .toString(36)
            .slice(2),

        ...message,
      },
    ]);
  }, []);

  // ----------------------------------------------------------
  // UPDATE LAST ASSISTANT MESSAGE
  // ----------------------------------------------------------

  const updateAssistantMessage = useCallback(
    (answer) => {
      setMessages((prev) => {
        const copy = [...prev];

        const lastIndex = copy.length - 1;

        if (
          lastIndex >= 0 &&
          copy[lastIndex].role === "assistant"
        ) {
          copy[lastIndex] = {
            ...copy[lastIndex],
            content: answer,
          };

          return copy;
        }

        return [
          ...copy,
          {
            id:
              Date.now() +
              Math.random()
                .toString(36)
                .slice(2),

            role: "assistant",

            content: answer,
          },
        ];
      });
    },
    []
  );

  // ----------------------------------------------------------
  // AUDIO PLAYBACK
  // ----------------------------------------------------------

  const playAudio = useCallback(
    async (audioUrl) => {
      if (!audioUrl) return;

      const absoluteUrl = makeAbsoluteUrl(audioUrl);

      if (!absoluteUrl) return;

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        const audio = new Audio(absoluteUrl);

        audioRef.current = audio;

        isPlayingRef.current = true;
        setIsPlaying(true);

        audio.onended = () => {
          isPlayingRef.current = false;
          setIsPlaying(false);
          audioRef.current = null;
        };

        audio.onerror = () => {
          isPlayingRef.current = false;
          setIsPlaying(false);
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        console.error("Audio playback error:", err);

        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    },
    []
  );

  // ----------------------------------------------------------
  // SOCKET.IO
  // ----------------------------------------------------------

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "✅ ANTIMATE Socket connected:",
        socket.id
      );

      setConnectionState("connected");
      setError("");
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "⚠️ ANTIMATE Socket disconnected:",
        reason
      );

      setConnectionState("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error(
        "❌ Socket connection error:",
        err
      );

      setConnectionState("error");
    });

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    socket.on("antimate:status", (data) => {
      console.log("ANTIMATE STATUS:", data);

      const status =
        typeof data === "string"
          ? data
          : data?.status || data?.message || "";

      const normalized = String(status).toLowerCase();

      if (
        normalized.includes("thinking") ||
        normalized.includes("processing")
      ) {
        setIsProcessing(true);
      }
    });

    // --------------------------------------------------------
    // TRANSCRIPT
    // --------------------------------------------------------

    socket.on("antimate:transcript", (data) => {
      const value =
        typeof data === "string"
          ? data
          : data?.text ||
            data?.transcript ||
            "";

      if (value) {
        setTranscript(value);
      }
    });

    // --------------------------------------------------------
    // THINKING
    // --------------------------------------------------------

    socket.on("antimate:thinking", () => {
      setIsProcessing(true);
    });

    // --------------------------------------------------------
    // COMPLETE
    // --------------------------------------------------------

    socket.on("antimate:complete", () => {
      setIsProcessing(false);

      const answer =
        currentAnswerRef.current;

      if (answer) {
        updateAssistantMessage(answer);
      }

      currentAnswerRef.current = "";
      setCurrentAnswer("");
    });

    // --------------------------------------------------------
    // ANSWER
    // --------------------------------------------------------

    socket.on("antimate:answer", (data) => {
      const answer =
        typeof data === "string"
          ? data
          : data?.answer ||
            data?.text ||
            data?.content ||
            "";

      if (!answer) return;

      currentAnswerRef.current = answer;

      setCurrentAnswer(answer);

      updateAssistantMessage(answer);

      setIsProcessing(false);
    });

    // --------------------------------------------------------
    // ANSWER CHUNK
    // --------------------------------------------------------

    socket.on(
      "antimate:answer:chunk",
      (data) => {
        const chunk =
          typeof data === "string"
            ? data
            : data?.chunk ||
              data?.text ||
              data?.answer ||
              "";

        if (!chunk) return;

        const next =
          currentAnswerRef.current + chunk;

        currentAnswerRef.current = next;

        setCurrentAnswer(next);

        updateAssistantMessage(next);
      }
    );

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    socket.on("antimate:audio", (data) => {
      const audio =
        typeof data === "string"
          ? data
          : data?.audio ||
            data?.url ||
            data?.audioUrl ||
            data?.path;

      if (audio) {
        playAudio(audio);
      }
    });

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    socket.on("antimate:error", (data) => {
      console.error("ANTIMATE SOCKET ERROR:", data);

      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            "Something went wrong.";

      setError(message);
      setIsProcessing(false);
      setIsRecording(false);
      setIsLiveMode(false);

      currentAnswerRef.current = "";
      setCurrentAnswer("");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [playAudio, updateAssistantMessage]);

  // ----------------------------------------------------------
  // CLEAN MEDIA
  // ----------------------------------------------------------

  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }
  }, []);

  // ----------------------------------------------------------
  // STOP RECORDING
  // ----------------------------------------------------------

  const stopRecording = useCallback(
    (cancel = false) => {
      clearTimeout(
        shortRecordingTimerRef.current
      );

      clearTimeout(holdTimerRef.current);

      const recorder = recorderRef.current;

      if (!recorder) {
        setIsRecording(false);
        setIsLiveMode(false);
        stopMediaTracks();
        return;
      }

      try {
        if (
          recorder.state !== "inactive"
        ) {
          recorder.stop();
        }
      } catch (err) {
        console.error(
          "Recorder stop error:",
          err
        );
      }

      if (cancel) {
        const socket =
          socketRef.current;

        socket?.emit(
          "antimate:voice:cancel"
        );

        chunksRef.current = [];

        setIsRecording(false);
        setIsLiveMode(false);

        recorderRef.current = null;

        stopMediaTracks();
      }
    },
    [stopMediaTracks]
  );

  // ----------------------------------------------------------
  // START RECORDING
  // ----------------------------------------------------------

  const startRecording = useCallback(
    async (live = false) => {
      if (isProcessing || isPlaying) return;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Microphone is not supported by this browser."
        );

        return;
      }

      const socket = socketRef.current;

      if (!socket?.connected) {
        setError(
          "ANTIMATE AI is not connected. Please wait a moment."
        );

        return;
      }

      setError("");

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

        streamRef.current = stream;

        chunksRef.current = [];

        isLiveModeRef.current = live;

        setIsLiveMode(live);
        setIsRecording(true);
        setTranscript("");

        currentAnswerRef.current = "";
        setCurrentAnswer("");

        socket.emit(
          "antimate:voice:start",
          {
            live,
            mode: live
              ? "live"
              : "record",
          }
        );

        let mimeType = "";

        if (
          MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
          )
        ) {
          mimeType =
            "audio/webm;codecs=opus";
        } else if (
          MediaRecorder.isTypeSupported(
            "audio/webm"
          )
        ) {
          mimeType = "audio/webm";
        } else if (
          MediaRecorder.isTypeSupported(
            "audio/mp4"
          )
        ) {
          mimeType = "audio/mp4";
        }

        const recorder = mimeType
          ? new MediaRecorder(stream, {
              mimeType,
              audioBitsPerSecond: 64000,
            })
          : new MediaRecorder(stream);

        recorderRef.current = recorder;

        recorder.ondataavailable = (
          event
        ) => {
          if (!event.data || event.data.size === 0) {
            return;
          }

          chunksRef.current.push(
            event.data
          );

          socket.emit(
            "antimate:voice:chunk",
            event.data
          );
        };

        recorder.onstop = () => {
          stopMediaTracks();

          const wasLive =
            isLiveModeRef.current;

          setIsRecording(false);

          recorderRef.current = null;

          if (cancel) {
            return;
          }

          if (socket?.connected) {
            socket.emit(
              "antimate:voice:end",
              {
                live: wasLive,
              }
            );
          }

          chunksRef.current = [];

          isLiveModeRef.current = false;

          setIsLiveMode(false);

          setIsProcessing(true);
        };

        recorder.onerror = (event) => {
          console.error(
            "MediaRecorder error:",
            event
          );

          setError(
            "Microphone recording failed."
          );

          setIsRecording(false);
          setIsLiveMode(false);

          stopMediaTracks();
        };

        // Send chunks continuously.
        recorder.start(250);

        // ----------------------------------------------------
        // NORMAL RECORDING
        // ----------------------------------------------------

        if (!live) {
          shortRecordingTimerRef.current =
            setTimeout(() => {
              if (
                recorderRef.current &&
                recorderRef.current.state !==
                  "inactive"
              ) {
                recorderRef.current.stop();
              }
            }, 1800);
        }
      } catch (err) {
        console.error(
          "Microphone permission error:",
          err
        );

        setError(
          "Microphone permission is required to use voice."
        );

        setIsRecording(false);
        setIsLiveMode(false);

        stopMediaTracks();
      }
    },
    [
      isProcessing,
      isPlaying,
      stopMediaTracks,
    ]
  );

  // ----------------------------------------------------------
  // RECORD BUTTON POINTER DOWN
  // ----------------------------------------------------------

  const handleVoicePointerDown =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          isProcessing ||
          isPlaying ||
          isRecording
        ) {
          return;
        }

        if (text.trim()) return;

        pointerDownRef.current = true;

        recordingStartedRef.current = false;

        // ----------------------------------------------------
        // HOLD -> LIVE VOICE
        // ----------------------------------------------------

        holdTimerRef.current =
          setTimeout(() => {
            if (
              pointerDownRef.current &&
              !recordingStartedRef.current
            ) {
              recordingStartedRef.current = true;

              startRecording(true);
            }
          }, 500);
      },
      [
        isProcessing,
        isPlaying,
        isRecording,
        text,
        startRecording,
      ]
    );

  // ----------------------------------------------------------
  // RECORD BUTTON POINTER UP
  // ----------------------------------------------------------

  const handleVoicePointerUp =
    useCallback(
      (event) => {
        event.preventDefault();

        pointerDownRef.current = false;

        clearTimeout(
          holdTimerRef.current
        );

        // ----------------------------------------------------
        // LIVE RECORDING WAS STARTED
        // ----------------------------------------------------

        if (recordingStartedRef.current) {
          recordingStartedRef.current = false;

          stopRecording(false);

          return;
        }

        // ----------------------------------------------------
        // SHORT TAP -> NORMAL RECORDING
        // ----------------------------------------------------

        if (
          !isRecording &&
          !isProcessing &&
          !isPlaying
        ) {
          startRecording(false);
        }
      },
      [
        isRecording,
        isProcessing,
        isPlaying,
        startRecording,
        stopRecording,
      ]
    );

  // ----------------------------------------------------------
  // STOP BUTTON
  // ----------------------------------------------------------

  const handleStop = useCallback(
    (event) => {
      event?.preventDefault();

      pointerDownRef.current = false;

      clearTimeout(
        holdTimerRef.current
      );

      stopRecording(false);
    },
    [stopRecording]
  );

  // ----------------------------------------------------------
  // SEND TEXT
  // ----------------------------------------------------------

  const sendText = useCallback(async () => {
    const message = text.trim();

    if (!message || isProcessing || isPlaying) {
      return;
    }

    setError("");

    setText("");

    addMessage({
      role: "user",
      content: message,
    });

    setIsProcessing(true);

    currentAnswerRef.current = "";
    setCurrentAnswer("");

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
            message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data = await response.json();

      const answer =
        data?.answer ||
        data?.text ||
        data?.response ||
        data?.message ||
        "";

      if (!answer) {
        throw new Error(
          "ANTIMATE returned an empty response."
        );
      }

      addMessage({
        role: "assistant",
        content: answer,
      });

      currentAnswerRef.current = answer;

      setCurrentAnswer(answer);

      if (
        data?.audio ||
        data?.audioUrl ||
        data?.audio_url ||
        data?.url
      ) {
        await playAudio(
          data.audio ||
            data.audioUrl ||
            data.audio_url ||
            data.url
        );
      }
    } catch (err) {
      console.error(
        "ANTIMATE text error:",
        err
      );

      setError(
        err?.message ||
          "Unable to connect to ANTIMATE AI."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    text,
    isProcessing,
    isPlaying,
    addMessage,
    playAudio,
  ]);

  // ----------------------------------------------------------
  // ENTER TO SEND
  // ----------------------------------------------------------

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        sendText();
      }
    },
    [sendText]
  );

  // ----------------------------------------------------------
  // MAIN ACTION
  // ----------------------------------------------------------

  const handleMainAction = useCallback(
    (event) => {
      event?.preventDefault();

      if (isProcessing || isPlaying) {
        return;
      }

      if (isRecording) {
        handleStop(event);

        return;
      }

      if (text.trim()) {
        sendText();

        return;
      }
    },
    [
      isProcessing,
      isPlaying,
      isRecording,
      text,
      handleStop,
      sendText,
    ]
  );

  // ----------------------------------------------------------
  // CLEAR ERROR WHEN USER TYPES
  // ----------------------------------------------------------

  useEffect(() => {
    if (text.trim()) {
      setError("");
    }
  }, [text]);

  // ----------------------------------------------------------
  // CLEANUP
  // ----------------------------------------------------------

  useEffect(() => {
    return () => {
      clearTimeout(
        holdTimerRef.current
      );

      clearTimeout(
        shortRecordingTimerRef.current
      );

      try {
        if (
          recorderRef.current &&
          recorderRef.current.state !==
            "inactive"
        ) {
          recorderRef.current.stop();
        }
      } catch {}

      stopMediaTracks();

      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [stopMediaTracks]);

  // ----------------------------------------------------------
  // UI STATES
  // ----------------------------------------------------------

  const hasText = Boolean(text.trim());

  const showVoiceOptions =
    !hasText &&
    !isRecording &&
    !isProcessing &&
    !isPlaying;

  const connectionLabel =
    connectionState === "connected"
      ? "Connected"
      : connectionState === "connecting"
      ? "Connecting..."
      : "Offline";

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div
      style={{
        ...styles.page,

        background: colors.bg,

        color: colors.text,
      }}
    >
      {/* ====================================================
          GLOBAL STYLE
      ==================================================== */}

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          html, body, #root {
            margin: 0;
            padding: 0;
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

          button {
            -webkit-tap-highlight-color: transparent;
          }

          textarea::placeholder {
            color: ${
              dark
                ? "#707b8e"
                : "#9aa3b2"
            };
          }

          ::-webkit-scrollbar {
            width: 7px;
          }

          ::-webkit-scrollbar-track {
            background: transparent;
          }

          ::-webkit-scrollbar-thumb {
            background: ${
              dark
                ? "rgba(255,255,255,.12)"
                : "rgba(15,23,42,.12)"
            };
            border-radius: 20px;
          }

          @keyframes antimatePulse {
            0%, 100% {
              transform: scale(1);
              opacity: .75;
            }

            50% {
              transform: scale(1.08);
              opacity: 1;
            }
          }

          @keyframes antimateThinking {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: .35;
            }

            40% {
              transform: translateY(-4px);
              opacity: 1;
            }
          }

          @keyframes antimateSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes antimateWave {
            0%, 100% {
              height: 5px;
            }

            50% {
              height: 17px;
            }
          }

          .antimate-theme-button:hover {
            transform: translateY(-1px);
            background: ${
              dark
                ? "rgba(255,255,255,.08)"
                : "rgba(15,23,42,.055)"
            } !important;
          }

          .antimate-send-button:hover {
            transform: translateY(-2px);
            box-shadow:
              0 10px 28px rgba(91,108,255,.28);
          }

          .antimate-voice-option:hover {
            transform: translateY(-1px);
            background: ${
              dark
                ? "rgba(255,255,255,.075)"
                : "rgba(15,23,42,.05)"
            } !important;
          }

          .antimate-composer:focus-within {
            border-color: ${
              dark
                ? "rgba(91,108,255,.55)"
                : "rgba(91,108,255,.38)"
            } !important;

            box-shadow:
              0 0 0 4px ${
                dark
                  ? "rgba(91,108,255,.08)"
                  : "rgba(91,108,255,.055)"
              };
          }
        `}
      </style>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header
        style={{
          ...styles.header,

          borderBottom:
            `1px solid ${colors.border}`,

          background:
            dark
              ? "rgba(7,11,18,.78)"
              : "rgba(247,249,252,.78)",

          backdropFilter: "blur(18px)",

          WebkitBackdropFilter:
            "blur(18px)",
        }}
      >
        <div style={styles.headerInner}>
          {/* LOGO */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colors.surfaceSolid,
                border:
                  `1px solid ${colors.border}`,
                boxShadow:
                  dark
                    ? "0 8px 25px rgba(0,0,0,.2)"
                    : "0 8px 25px rgba(15,23,42,.08)",
              }}
            >
              <img
                src={LOGO_SRC}
                alt="ANTIMATE"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.currentTarget.style.display =
                    "none";
                }}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 750,
                  letterSpacing: "-.02em",
                }}
              >
                ANTIMATE AI
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  marginTop: 1,
                }}
              >
                Intelligent farming assistant
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            {/* CONNECTION */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,

                padding:
                  "7px 10px",

                borderRadius: 999,

                background: colors.soft,

                border:
                  `1px solid ${colors.border}`,

                fontSize: 11,

                color: colors.muted,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",

                  background:
                    connectionState ===
                    "connected"
                      ? colors.success
                      : connectionState ===
                        "connecting"
                      ? "#f59e0b"
                      : colors.danger,

                  boxShadow:
                    connectionState ===
                    "connected"
                      ? `0 0 0 4px ${
                          dark
                            ? "rgba(34,197,94,.09)"
                            : "rgba(34,197,94,.12)"
                        }`
                      : "none",
                }}
              />

              <span>
                {connectionLabel}
              </span>
            </div>

            {/* THEME BUTTON */}
            <button
              className="antimate-theme-button"
              type="button"
              onClick={() =>
                setTheme(
                  dark ? "light" : "dark"
                )
              }
              title={
                dark
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              style={{
                ...styles.iconButton,

                background: colors.soft,

                border:
                  `1px solid ${colors.border}`,

                color: colors.text,
              }}
            >
              {dark ? (
                <SunIcon />
              ) : (
                <MoonIcon />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================
          MAIN CHAT
      ==================================================== */}

      <main style={styles.main}>
        <div style={styles.chatContainer}>
          {/* ==================================================
              EMPTY CHAT
          ================================================== */}

          {messages.length === 0 ? (
            <div
              style={{
                ...styles.emptyState,

                minHeight:
                  "calc(100vh - 220px)",
              }}
            >
              <div
                style={{
                  ...styles.emptyLogo,

                  background:
                    colors.surfaceSolid,

                  border:
                    `1px solid ${colors.border}`,

                  boxShadow:
                    colors.shadow,
                }}
              >
                <img
                  src={LOGO_SRC}
                  alt="ANTIMATE AI"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>

              <h1
                style={{
                  ...styles.emptyTitle,

                  color: colors.text,
                }}
              >
                Muraho 👋
              </h1>

              <p
                style={{
                  ...styles.emptyText,

                  color: colors.muted,
                }}
              >
                Ndi ANTIMATE AI. Mbwira icyo
                ushaka kumenya ku bworozi
                cyangwa ku system yawe.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginTop: 20,
                  maxWidth: 620,
                }}
              >
                {[
                  "Ubushyuhe bwiza ku nkoko ni ubuhe?",
                  "Ngenzura brooder yanjye nte?",
                  "Ni iki nakora iyo humidity iri hasi?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      setText(suggestion)
                    }
                    style={{
                      border:
                        `1px solid ${colors.border}`,

                      background:
                        colors.surface,

                      color: colors.muted,

                      borderRadius: 999,

                      padding:
                        "9px 13px",

                      cursor: "pointer",

                      fontSize: 12,

                      transition:
                        "all .2s ease",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* =================================================
               MESSAGE LIST
            ================================================= */

            <div style={styles.messageList}>
              {messages.map((message) => {
                const isUser =
                  message.role === "user";

                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",

                      justifyContent:
                        isUser
                          ? "flex-end"
                          : "flex-start",

                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",

                        flexDirection:
                          isUser
                            ? "row-reverse"
                            : "row",

                        alignItems:
                          "flex-start",

                        gap: 10,

                        maxWidth:
                          "min(760px, 88%)",
                      }}
                    >
                      {/* AVATAR */}
                      {!isUser && (
                        <div
                          style={{
                            flexShrink: 0,

                            width: 31,
                            height: 31,

                            borderRadius: 10,

                            overflow: "hidden",

                            background:
                              colors.surfaceSolid,

                            border:
                              `1px solid ${colors.border}`,

                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                          }}
                        >
                          <img
                            src={LOGO_SRC}
                            alt="AI"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit:
                                "contain",
                            }}
                          />
                        </div>
                      )}

                      {/* MESSAGE */}
                      <div
                        style={{
                          padding:
                            isUser
                              ? "12px 15px"
                              : "4px 0",

                          borderRadius:
                            isUser
                              ? "17px 17px 5px 17px"
                              : 0,

                          background:
                            isUser
                              ? colors.userBubble
                              : "transparent",

                          color:
                            colors.text,

                          fontSize: 14,

                          lineHeight: 1.7,

                          whiteSpace:
                            "pre-wrap",

                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* THINKING */}
              {isProcessing &&
                !currentAnswer && (
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "flex-start",
                      gap: 10,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 31,
                        height: 31,
                        borderRadius: 10,
                        overflow: "hidden",
                        background:
                          colors.surfaceSolid,
                        border:
                          `1px solid ${colors.border}`,
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                      }}
                    >
                      <img
                        src={LOGO_SRC}
                        alt="AI"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit:
                            "contain",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 5,
                        height: 31,
                      }}
                    >
                      {[0, 1, 2].map(
                        (index) => (
                          <span
                            key={index}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius:
                                "50%",
                              background:
                                colors.muted,

                              animation:
                                `antimateThinking 1.2s ${index *
                                  0.15}s infinite`,
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}

              <div
                ref={messagesEndRef}
                style={{
                  height: 10,
                }}
              />
            </div>
          )}

          {/* ==================================================
              TRANSCRIPT
          ================================================== */}

          {transcript && (
            <div
              style={{
                marginBottom: 9,

                padding:
                  "9px 12px",

                borderRadius: 12,

                background:
                  colors.accentSoft,

                border:
                  `1px solid ${
                    dark
                      ? "rgba(91,108,255,.16)"
                      : "rgba(91,108,255,.12)"
                  }`,

                color: colors.muted,

                fontSize: 12,
              }}
            >
              <span
                style={{
                  color: colors.accent,
                  fontWeight: 700,
                  marginRight: 5,
                }}
              >
                Wavuze:
              </span>

              {transcript}
            </div>
          )}

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              style={{
                marginBottom: 9,

                padding:
                  "9px 12px",

                borderRadius: 12,

                background: dark
                  ? "rgba(239,68,68,.09)"
                  : "rgba(239,68,68,.06)",

                border:
                  "1px solid rgba(239,68,68,.16)",

                color: colors.danger,

                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* ==================================================
              COMPOSER
          ================================================== */}

          <div
            style={{
              ...styles.composerWrapper,
            }}
          >
            <div
              className="antimate-composer"
              style={{
                ...styles.composer,

                background: colors.input,

                border:
                  `1px solid ${colors.border}`,

                boxShadow: colors.shadow,
              }}
            >
              {/* TEXTAREA */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) =>
                  setText(
                    event.target.value
                  )
                }
                onKeyDown={handleKeyDown}
                disabled={
                  isRecording ||
                  isProcessing ||
                  isPlaying
                }
                placeholder={
                  isRecording
                    ? isLiveMode
                      ? "Listening live..."
                      : "Listening..."
                    : isPlaying
                    ? "ANTIMATE is speaking..."
                    : "Ask ANTIMATE anything..."
                }
                rows={1}
                style={{
                  ...styles.textarea,

                  color: colors.text,

                  background:
                    "transparent",

                  cursor:
                    isRecording ||
                    isProcessing ||
                    isPlaying
                      ? "not-allowed"
                      : "text",
                }}
              />

              {/* =================================================
                  EMPTY STATE: RECORD + LIVE
              ================================================= */}

              {showVoiceOptions && (
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {/* RECORD */}
                  <button
                    className="antimate-voice-option"
                    type="button"
                    onPointerDown={
                      handleVoicePointerDown
                    }
                    onPointerUp={
                      handleVoicePointerUp
                    }
                    onPointerCancel={
                      handleVoicePointerUp
                    }
                    style={{
                      ...styles.voiceButton,

                      background:
                        colors.soft,

                      border:
                        `1px solid ${colors.border}`,

                      color:
                        colors.text,
                    }}
                    title="Record voice"
                  >
                    <MicIcon size={19} />

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 650,
                      }}
                    >
                      Record
                    </span>
                  </button>

                  {/* LIVE */}
                  <button
                    className="antimate-voice-option"
                    type="button"
                    onClick={() => {
                      startRecording(true);
                    }}
                    style={{
                      ...styles.voiceButton,

                      background:
                        colors.soft,

                      border:
                        `1px solid ${colors.border}`,

                      color:
                        colors.text,
                    }}
                    title="Start live voice"
                  >
                    <LiveIcon size={18} />

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 650,
                      }}
                    >
                      Live
                    </span>
                  </button>
                </div>
              )}

              {/* =================================================
                  RECORDING / PROCESSING / SPEAKING / SEND
              ================================================= */}

              {!showVoiceOptions && (
                <>
                  {/* RECORDING */}
                  {isRecording && (
                    <button
                      type="button"
                      onClick={
                        handleStop
                      }
                      style={{
                        ...styles.actionButton,

                        background:
                          colors.danger,

                        color: "#fff",

                        boxShadow:
                          "0 8px 22px rgba(239,68,68,.25)",
                      }}
                      title="Stop recording"
                    >
                      <StopIcon />

                      {isLiveMode && (
                        <span
                          style={{
                            position:
                              "absolute",

                            top: -2,
                            right: -2,

                            width: 7,
                            height: 7,

                            borderRadius:
                              "50%",

                            background:
                              "#fff",

                            animation:
                              "antimatePulse 1s infinite",
                          }}
                        />
                      )}
                    </button>
                  )}

                  {/* PROCESSING */}
                  {!isRecording &&
                    isProcessing && (
                      <button
                        type="button"
                        disabled
                        style={{
                          ...styles.actionButton,

                          background:
                            colors.accentSoft,

                          color:
                            colors.accent,
                        }}
                      >
                        <span
                          style={{
                            width: 19,
                            height: 19,

                            borderRadius:
                              "50%",

                            border:
                              `2px solid ${
                                dark
                                  ? "rgba(91,108,255,.25)"
                                  : "rgba(91,108,255,.22)"
                              }`,

                            borderTopColor:
                              colors.accent,

                            animation:
                              "antimateSpin .8s linear infinite",
                          }}
                        />
                      </button>
                    )}

                  {/* SPEAKING */}
                  {!isRecording &&
                    !isProcessing &&
                    isPlaying && (
                      <button
                        type="button"
                        disabled
                        style={{
                          ...styles.actionButton,

                          background:
                            colors.accentSoft,

                          color:
                            colors.accent,
                        }}
                      >
                        <VolumeIcon />

                        <span
                          style={{
                            position:
                              "absolute",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap: 2,

                            bottom: -2,
                            right: -2,
                          }}
                        >
                          {[0, 1, 2].map(
                            (i) => (
                              <span
                                key={i}
                                style={{
                                  width: 2,
                                  height:
                                    6 +
                                    i *
                                      3,

                                  borderRadius:
                                    3,

                                  background:
                                    colors.accent,

                                  animation:
                                    `antimateWave .8s ${i *
                                      0.12}s infinite`,
                                }}
                              />
                            )
                          )}
                        </span>
                      </button>
                    )}

                  {/* SEND */}
                  {!isRecording &&
                    !isProcessing &&
                    !isPlaying &&
                    hasText && (
                      <button
                        className="antimate-send-button"
                        type="button"
                        onClick={
                          handleMainAction
                        }
                        disabled={
                          !hasText
                        }
                        style={{
                          ...styles.actionButton,

                          background:
                            colors.accent,

                          color: "#fff",

                          boxShadow:
                            "0 8px 22px rgba(91,108,255,.22)",
                        }}
                        title="Send"
                      >
                        <SendIcon />
                      </button>
                    )}
                </>
              )}
            </div>

            {/* FOOTER NOTE */}
            <div
              style={{
                textAlign: "center",

                marginTop: 8,

                color: colors.muted,

                fontSize: 10,

                opacity: 0.75,
              }}
            >
              ANTIMATE can make mistakes. Verify
              important farming decisions.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// INLINE STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",

    width: "100%",

    display: "flex",

    flexDirection: "column",

    overflow: "hidden",

    transition:
      "background .25s ease, color .25s ease",
  },

  header: {
    position: "sticky",

    top: 0,

    zIndex: 50,

    width: "100%",
  },

  headerInner: {
    width: "100%",

    maxWidth: 1100,

    margin: "0 auto",

    padding:
      "12px 18px",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    gap: 15,
  },

  iconButton: {
    width: 38,

    height: 38,

    borderRadius: 12,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    cursor: "pointer",

    transition:
      "all .2s ease",
  },

  main: {
    flex: 1,

    minHeight: 0,

    width: "100%",

    display: "flex",

    justifyContent: "center",
  },

  chatContainer: {
    width: "100%",

    maxWidth: 900,

    minHeight:
      "calc(100vh - 65px)",

    padding:
      "0 18px 20px",

    display: "flex",

    flexDirection: "column",
  },

  emptyState: {
    flex: 1,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent:
      "center",

    textAlign: "center",

    padding:
      "30px 0 160px",
  },

  emptyLogo: {
    width: 76,

    height: 76,

    borderRadius: 24,

    display: "flex",

    alignItems: "center",

    justifyContent:
      "center",

    overflow: "hidden",

    marginBottom: 20,

    padding: 7,
  },

  emptyTitle: {
    margin: 0,

    fontSize: 31,

    lineHeight: 1.15,

    fontWeight: 800,

    letterSpacing:
      "-.04em",
  },

  emptyText: {
    margin:
      "10px auto 0",

    maxWidth: 520,

    fontSize: 14,

    lineHeight: 1.65,
  },

  messageList: {
    flex: 1,

    minHeight: 0,

    overflowY: "auto",

    padding:
      "30px 4px 150px",
  },

  composerWrapper: {
    position: "sticky",

    bottom: 0,

    zIndex: 20,

    width: "100%",

    paddingTop: 8,

    paddingBottom: 4,

    background:
      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0) 10%)",
  },

  composer: {
    width: "100%",

    minHeight: 62,

    borderRadius: 19,

    display: "flex",

    alignItems: "flex-end",

    gap: 8,

    padding:
      "10px 10px 10px 15px",

    transition:
      "all .2s ease",

    backdropFilter:
      "blur(20px)",

    WebkitBackdropFilter:
      "blur(20px)",
  },

  textarea: {
    flex: 1,

    width: "100%",

    minWidth: 0,

    maxHeight: 150,

    resize: "none",

    outline: "none",

    border: "none",

    padding:
      "9px 0",

    fontSize: 14,

    lineHeight: 1.55,

    overflowY: "auto",

  },

  voiceButton: {
    height: 40,

    minWidth: 40,

    padding:
      "0 11px",

    borderRadius: 12,

    display: "flex",

    alignItems: "center",

    justifyContent:
      "center",

    gap: 6,

    cursor: "pointer",

    transition:
      "all .2s ease",

    touchAction: "none",

    userSelect: "none",
  },

  actionButton: {
    position: "relative",

    flexShrink: 0,

    width: 42,

    height: 42,

    border: "none",

    borderRadius: 14,

    display: "flex",

    alignItems: "center",

    justifyContent:
      "center",

    cursor: "pointer",

    transition:
      "all .2s ease",
  },
};