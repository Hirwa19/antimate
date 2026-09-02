// ============================================================
// ANTIMATE AI — AntimateAI.jsx
// Modern Glass Chat UI
// Native CSS — NO external .css file
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

// ============================================================
// CONFIG
// ============================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/$/, "");

// ============================================================
// LOGO
// ============================================================
//
// Niba ufite logo uri local:
// import antimateLogo from "../assets/antimate-logo.png";
// hanyuma:
// const LOGO_URL = antimateLogo;
//
// Hano ndasize path ushobora guhinduramo.
// ============================================================

const LOGO_URL = "/antimate-logo.png";

// ============================================================
// HELPERS
// ============================================================

function makeAbsoluteUrl(value) {
  if (!value) return null;

  const url = String(value).trim();

  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return `${API_URL}/${url}`;
}

// ============================================================
// ICONS
// ============================================================

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
      <rect x="9" y="2" width="6" height="13" rx="3" />
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

function StopIcon({ size = 19 }) {
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
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.65 17.65 1.42 1.42" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.35 17.65-1.42 1.42" />
      <path d="m19.07 4.93-1.42 1.42" />
    </svg>
  );
}

function VolumeIcon({ size = 18 }) {
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
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SparkleIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.2 4.2L7 8.5l3.8 1.3L12 14l1.2-4.2L17 8.5l-3.8-1.3Z" />
      <path d="m19 14-.7 2.3-2.3.7 2.3.7.7 2.3.7-2.3 2.3-.7-2.3-.7Z" />
      <path d="m5 15-.6 1.9-1.9.6 1.9.6L5 20l.6-1.9 1.9-.6-1.9-.6Z" />
    </svg>
  );
}

function XIcon({ size = 17 }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {
  // ==========================================================
  // THEME
  // ==========================================================

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("antimate-ai-theme");

      if (saved === "dark") return true;
      if (saved === "light") return false;

      return window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "antimate-ai-theme",
        darkMode ? "dark" : "light"
      );
    } catch {
      // Ignore storage errors.
    }
  }, [darkMode]);

  // ==========================================================
  // CHAT STATE
  // ==========================================================

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const [socketConnected, setSocketConnected] = useState(false);

  const [transcript, setTranscript] = useState("");

  const [error, setError] = useState("");

  const [recordingMode, setRecordingMode] = useState(null);

  const [hasStarted, setHasStarted] = useState(false);

  // ==========================================================
  // REFS
  // ==========================================================

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const holdTimerRef = useRef(null);

  const shortRecordTimerRef = useRef(null);

  const audioRef = useRef(null);

  const textareaRef = useRef(null);

  const bottomRef = useRef(null);

  const currentAnswerRef = useRef("");

  const isPlayingRef = useRef(false);

  const isProcessingRef = useRef(false);

  const pointerActionRef = useRef(false);

  // ==========================================================
  // KEEP REFS IN SYNC
  // ==========================================================

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, transcript]);

  // ==========================================================
  // AUTO RESIZE TEXTAREA
  // ==========================================================

  useEffect(() => {
    const el = textareaRef.current;

    if (!el) return;

    el.style.height = "auto";

    const nextHeight = Math.min(el.scrollHeight, 180);

    el.style.height = `${Math.max(nextHeight, 28)}px`;
  }, [input]);

  // ==========================================================
  // ADD MESSAGE
  // ==========================================================

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // ==========================================================
  // UPDATE LAST ASSISTANT MESSAGE
  // ==========================================================

  const updateAssistantMessage = useCallback((answer) => {
    setMessages((prev) => {
      const copy = [...prev];

      let index = -1;

      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "assistant") {
          index = i;
          break;
        }
      }

      if (index === -1) {
        copy.push({
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: answer,
          streaming: true,
        });
      } else {
        copy[index] = {
          ...copy[index],
          content: answer,
          streaming: true,
        };
      }

      return copy;
    });
  }, []);

  // ==========================================================
  // FINISH ASSISTANT
  // ==========================================================

  const finishAssistantMessage = useCallback((answer) => {
    setMessages((prev) => {
      const copy = [...prev];

      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "assistant") {
          copy[i] = {
            ...copy[i],
            content: answer || copy[i].content || "",
            streaming: false,
          };

          return copy;
        }
      }

      return copy;
    });
  }, []);

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const playAudio = useCallback((audioUrl) => {
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
      };

      audio.onerror = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
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

  // ==========================================================
  // SOCKET.IO
  // ==========================================================

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
      console.log("✅ ANTIMATE Socket connected:", socket.id);
      setSocketConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ ANTIMATE Socket disconnected:", reason);
      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ ANTIMATE Socket error:", err.message);
      setSocketConnected(false);
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

      if (
        status.toLowerCase().includes("thinking") ||
        status.toLowerCase().includes("processing")
      ) {
        setIsProcessing(true);
      }
    });

    // --------------------------------------------------------
    // TRANSCRIPT
    // --------------------------------------------------------

    socket.on("antimate:transcript", (data) => {
      const text =
        typeof data === "string"
          ? data
          : data?.text ||
            data?.transcript ||
            "";

      if (text) {
        setTranscript(text);
      }
    });

    // --------------------------------------------------------
    // THINKING
    // --------------------------------------------------------

    socket.on("antimate:thinking", () => {
      setIsProcessing(true);
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
            "";

      if (answer) {
        currentAnswerRef.current = answer;

        updateAssistantMessage(answer);
      }

      setIsProcessing(false);
    });

    // --------------------------------------------------------
    // ANSWER CHUNK
    // --------------------------------------------------------

    socket.on("antimate:answer:chunk", (data) => {
      const chunk =
        typeof data === "string"
          ? data
          : data?.chunk ||
            data?.text ||
            data?.answer ||
            "";

      if (!chunk) return;

      currentAnswerRef.current += chunk;

      updateAssistantMessage(currentAnswerRef.current);
    });

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    socket.on("antimate:audio", (data) => {
      const audioUrl =
        typeof data === "string"
          ? data
          : data?.url ||
            data?.audioUrl ||
            data?.audio ||
            data?.path ||
            null;

      if (audioUrl) {
        playAudio(audioUrl);
      }
    });

    // --------------------------------------------------------
    // COMPLETE
    // --------------------------------------------------------

    socket.on("antimate:complete", (data) => {
      const answer =
        typeof data === "string"
          ? data
          : data?.answer ||
            data?.text ||
            currentAnswerRef.current ||
            "";

      if (answer) {
        currentAnswerRef.current = answer;

        finishAssistantMessage(answer);
      }

      setIsProcessing(false);
      setTranscript("");
      setRecordingMode(null);
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
      setRecordingMode(null);
    });

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [
    finishAssistantMessage,
    playAudio,
    updateAssistantMessage,
  ]);

  // ==========================================================
  // STOP MEDIA STREAM
  // ==========================================================

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }
  }, []);

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = useCallback(
    (send = true) => {
      clearTimeout(holdTimerRef.current);
      clearTimeout(shortRecordTimerRef.current);

      holdTimerRef.current = null;
      shortRecordTimerRef.current = null;

      const recorder = mediaRecorderRef.current;

      if (!recorder) {
        setIsRecording(false);
        setRecordingMode(null);
        return;
      }

      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch (err) {
        console.error("Stop recorder error:", err);
      }

      if (!send) {
        try {
          socketRef.current?.emit("antimate:voice:cancel");
        } catch {
          // Ignore.
        }

        setIsRecording(false);
        setRecordingMode(null);
      }
    },
    []
  );

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording = useCallback(
    async (mode = "record") => {
      if (isProcessingRef.current) return;

      if (isPlayingRef.current) return;

      if (!socketRef.current?.connected) {
        setError(
          "Voice service is not connected. Please wait a moment."
        );
        return;
      }

      setError("");
      setTranscript("");
      currentAnswerRef.current = "";

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Microphone is not supported by this browser."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

        mediaStreamRef.current = stream;

        let mimeType = "";

        if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
          )
        ) {
          mimeType = "audio/webm;codecs=opus";
        } else if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported("audio/webm")
        ) {
          mimeType = "audio/webm";
        }

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;

        const chunks = [];

        recorder.ondataavailable = (event) => {
          if (!event.data || event.data.size === 0) {
            return;
          }

          chunks.push(event.data);

          try {
            socketRef.current?.emit(
              "antimate:voice:chunk",
              event.data
            );
          } catch (err) {
            console.error(
              "Voice chunk send error:",
              err
            );
          }
        };

        recorder.onerror = (event) => {
          console.error(
            "MediaRecorder error:",
            event
          );

          setError("Microphone recording failed.");

          setIsRecording(false);
          setRecordingMode(null);

          stopMediaTracks();
        };

        recorder.onstop = () => {
          stopMediaTracks();

          setIsRecording(false);

          if (send) {
            try {
              socketRef.current?.emit(
                "antimate:voice:end"
              );

              setIsProcessing(true);
            } catch (err) {
              console.error(
                "Voice end error:",
                err
              );

              setError(
                "Failed to send voice recording."
              );
            }
          }

          mediaRecorderRef.current = null;
        };

        recorder.start(250);

        setIsRecording(true);
        setRecordingMode(mode);

        socketRef.current.emit(
          "antimate:voice:start",
          {
            mode,
            mimeType:
              recorder.mimeType ||
              mimeType ||
              "audio/webm",
          }
        );

        // ------------------------------------------------------
        // SHORT RECORD
        // ------------------------------------------------------

        if (mode === "short") {
          shortRecordTimerRef.current = setTimeout(() => {
            if (
              mediaRecorderRef.current?.state ===
              "recording"
            ) {
              stopRecording(true);
            }
          }, 1800);
        }
      } catch (err) {
        console.error(
          "Microphone permission / recording error:",
          err
        );

        stopMediaTracks();

        setIsRecording(false);
        setRecordingMode(null);

        setError(
          err?.message ||
            "Microphone permission is required."
        );
      }
    },
    [stopMediaTracks, stopRecording]
  );

  // ==========================================================
  // SHORT VOICE TAP
  // ==========================================================

  const startShortVoice = useCallback(() => {
    if (isProcessingRef.current) return;

    if (isPlayingRef.current) return;

    startRecording("short");
  }, [startRecording]);

  // ==========================================================
  // HOLD / LIVE VOICE
  // ==========================================================

  const handlePointerDown = useCallback(
    (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (isProcessingRef.current) return;

      if (isPlayingRef.current) return;

      // -------------------------------------------------------
      // If user typed text, this button is SEND.
      // -------------------------------------------------------

      if (input.trim()) {
        return;
      }

      pointerActionRef.current = true;

      clearTimeout(holdTimerRef.current);

      // Hold for 500ms => live recording.
      holdTimerRef.current = setTimeout(() => {
        startRecording("live");
      }, 500);
    },
    [input, startRecording]
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (!pointerActionRef.current) return;

      pointerActionRef.current = false;

      clearTimeout(holdTimerRef.current);

      holdTimerRef.current = null;

      // -------------------------------------------------------
      // If currently recording, stop it.
      // -------------------------------------------------------

      if (isRecording) {
        stopRecording(true);
        return;
      }

      // -------------------------------------------------------
      // If it was a quick tap, start short voice.
      // -------------------------------------------------------

      if (!input.trim()) {
        startShortVoice();
      }
    },
    [
      input,
      isRecording,
      startShortVoice,
      stopRecording,
    ]
  );

  const handlePointerCancel = useCallback(() => {
    pointerActionRef.current = false;

    clearTimeout(holdTimerRef.current);

    holdTimerRef.current = null;

    if (isRecording) {
      stopRecording(true);
    }
  }, [isRecording, stopRecording]);

  // ==========================================================
  // SEND TEXT
  // ==========================================================

  const sendText = useCallback(async () => {
    const text = input.trim();

    if (!text) return;

    if (isProcessingRef.current) return;

    if (isPlayingRef.current) return;

    setError("");

    setInput("");

    setTranscript("");

    setHasStarted(true);

    setIsProcessing(true);

    currentAnswerRef.current = "";

    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    });

    try {
      const response = await fetch(
        `${API_URL}/api/antimate/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            message: text,
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const raw = await response.text();

        try {
          data = JSON.parse(raw);
        } catch {
          data = {
            answer: raw,
          };
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`
        );
      }

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        data?.text ||
        "";

      if (!answer) {
        throw new Error(
          "ANTIMATE returned an empty response."
        );
      }

      addMessage({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
      });

      // If backend sends an audio URL for text responses.
      const audioUrl =
        data?.audioUrl ||
        data?.audio ||
        data?.audio_url ||
        null;

      if (audioUrl) {
        playAudio(audioUrl);
      }
    } catch (err) {
      console.error("ANTIMATE text error:", err);

      setError(
        err?.message ||
          "Unable to connect to ANTIMATE AI."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, input, playAudio]);

  // ==========================================================
  // MAIN ACTION
  // ==========================================================

  const handleMainAction = useCallback(
    (event) => {
      // If there is text, this is SEND.
      if (input.trim()) {
        event.preventDefault();

        sendText();

        return;
      }

      // Otherwise pointer events handle voice.
    },
    [input, sendText]
  );

  // ==========================================================
  // KEYBOARD
  // ==========================================================

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        if (input.trim()) {
          sendText();
        }
      }
    },
    [input, sendText]
  );

  // ==========================================================
  // CLEAR ERROR WHEN USER STARTS AGAIN
  // ==========================================================

  useEffect(() => {
    if (input.trim()) {
      setError("");
    }
  }, [input]);

  // ==========================================================
  // BUTTON STATE
  // ==========================================================

  const getActionState = () => {
    if (isProcessing) {
      return "thinking";
    }

    if (isPlaying) {
      return "speaking";
    }

    if (isRecording) {
      return "recording";
    }

    if (input.trim()) {
      return "send";
    }

    return "voice";
  };

  const actionState = getActionState();

  // ==========================================================
  // STYLES
  // ==========================================================

  const css = `
    * {
      box-sizing: border-box;
    }

    .antimate-ai-page {
      --bg: ${
        darkMode
          ? "#060a0f"
          : "#f6f8fb"
      };

      --bg-soft: ${
        darkMode
          ? "#0b1119"
          : "#eef2f7"
      };

      --surface: ${
        darkMode
          ? "rgba(18, 25, 35, 0.82)"
          : "rgba(255, 255, 255, 0.82)"
      };

      --surface-solid: ${
        darkMode
          ? "#111923"
          : "#ffffff"
      };

      --surface-hover: ${
        darkMode
          ? "rgba(255,255,255,0.07)"
          : "rgba(15,23,42,0.05)"
      };

      --border: ${
        darkMode
          ? "rgba(255,255,255,0.09)"
          : "rgba(15,23,42,0.09)"
      };

      --border-strong: ${
        darkMode
          ? "rgba(255,255,255,0.15)"
          : "rgba(15,23,42,0.14)"
      };

      --text: ${
        darkMode
          ? "#f5f7fa"
          : "#101828"
      };

      --text-soft: ${
        darkMode
          ? "#a8b3c2"
          : "#667085"
      };

      --text-muted: ${
        darkMode
          ? "#7d8998"
          : "#98a2b3"
      };

      --primary: #18a56f;
      --primary-dark: #0f8b5d;

      --user-bg: ${
        darkMode
          ? "#163d31"
          : "#e6f7f0"
      };

      --assistant-bg: ${
        darkMode
          ? "rgba(255,255,255,0.045)"
          : "rgba(255,255,255,0.94)"
      };

      min-height: 100vh;
      width: 100%;
      background:
        radial-gradient(
          circle at 15% 0%,
          ${
            darkMode
              ? "rgba(24,165,111,0.08)"
              : "rgba(24,165,111,0.06)"
          },
          transparent 32%
        ),
        radial-gradient(
          circle at 90% 10%,
          ${
            darkMode
              ? "rgba(76,112,255,0.07)"
              : "rgba(76,112,255,0.05)"
          },
          transparent 30%
        ),
        var(--bg);

      color: var(--text);

      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      display: flex;
      flex-direction: column;

      overflow: hidden;

      transition:
        background 0.3s ease,
        color 0.3s ease;
    }

    .antimate-ai-page button,
    .antimate-ai-page textarea {
      font: inherit;
    }

    /* ========================================================
       HEADER
       ======================================================== */

    .antimate-header {
      width: 100%;
      height: 72px;

      display: flex;
      align-items: center;
      justify-content: space-between;

      padding:
        0
        clamp(16px, 4vw, 42px);

      border-bottom: 1px solid var(--border);

      background:
        ${
          darkMode
            ? "rgba(6,10,15,0.72)"
            : "rgba(246,248,251,0.72)"
        };

      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);

      position: relative;
      z-index: 10;
    }

    .antimate-brand {
      display: flex;
      align-items: center;
      gap: 11px;

      min-width: 0;
    }

    .antimate-logo {
      width: 39px;
      height: 39px;

      border-radius: 12px;

      object-fit: contain;

      flex-shrink: 0;

      filter:
        drop-shadow(
          0 5px 15px
          ${
            darkMode
              ? "rgba(24,165,111,0.15)"
              : "rgba(24,165,111,0.12)"
          }
        );
    }

    .antimate-brand-text {
      min-width: 0;
    }

    .antimate-brand-title {
      font-size: 15px;
      line-height: 1.1;
      font-weight: 750;
      letter-spacing: -0.02em;
      color: var(--text);
    }

    .antimate-brand-subtitle {
      margin-top: 4px;

      font-size: 11px;
      color: var(--text-muted);

      white-space: nowrap;
    }

    .antimate-header-right {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 7px;

      padding: 7px 10px;

      border-radius: 999px;

      color: var(--text-soft);

      font-size: 11px;
      font-weight: 600;

      background: var(--surface);
      border: 1px solid var(--border);

      backdrop-filter: blur(12px);
    }

    .connection-dot {
      width: 7px;
      height: 7px;

      border-radius: 50%;

      background: ${
        socketConnected
          ? "#20c997"
          : "#98a2b3"
      };

      box-shadow: ${
        socketConnected
          ? "0 0 0 4px rgba(32,201,151,0.10)"
          : "none"
      };
    }

    .theme-button {
      width: 38px;
      height: 38px;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      border-radius: 11px;

      border: 1px solid var(--border);

      background: var(--surface);

      color: var(--text-soft);

      cursor: pointer;

      transition:
        transform 0.18s ease,
        background 0.18s ease,
        color 0.18s ease;
    }

    .theme-button:hover {
      transform: translateY(-1px);
      background: var(--surface-hover);
      color: var(--text);
    }

    .theme-button:active {
      transform: scale(0.96);
    }

    /* ========================================================
       CHAT AREA
       ======================================================== */

    .antimate-main {
      flex: 1;

      min-height: 0;

      width: 100%;

      display: flex;
      flex-direction: column;
    }

    .antimate-chat {
      width: min(920px, 100%);

      margin: 0 auto;

      padding:
        24px
        clamp(14px, 3vw, 28px)
        160px;

      flex: 1;

      overflow-y: auto;

      scrollbar-width: thin;

      scrollbar-color:
        ${
          darkMode
            ? "rgba(255,255,255,0.13) transparent"
            : "rgba(15,23,42,0.12) transparent"
        };
    }

    .antimate-chat::-webkit-scrollbar {
      width: 6px;
    }

    .antimate-chat::-webkit-scrollbar-track {
      background: transparent;
    }

    .antimate-chat::-webkit-scrollbar-thumb {
      background:
        ${
          darkMode
            ? "rgba(255,255,255,0.12)"
            : "rgba(15,23,42,0.10)"
        };

      border-radius: 99px;
    }

    /* ========================================================
       EMPTY STATE
       ======================================================== */

    .empty-state {
      min-height: calc(100vh - 235px);

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      text-align: center;

      padding: 40px 10px;
    }

    .empty-logo-wrap {
      width: 76px;
      height: 76px;

      display: flex;
      align-items: center;
      justify-content: center;

      margin-bottom: 20px;

      border-radius: 24px;

      background:
        ${
          darkMode
            ? "rgba(24,165,111,0.08)"
            : "rgba(24,165,111,0.07)"
        };

      border: 1px solid
        ${
          darkMode
            ? "rgba(24,165,111,0.15)"
            : "rgba(24,165,111,0.12)"
        };

      box-shadow:
        0 20px 60px
        ${
          darkMode
            ? "rgba(0,0,0,0.22)"
            : "rgba(15,23,42,0.07)"
        };
    }

    .empty-logo {
      width: 53px;
      height: 53px;
      object-fit: contain;
    }

    .empty-title {
      margin: 0;

      font-size:
        clamp(25px, 5vw, 34px);

      font-weight: 760;

      letter-spacing: -0.045em;

      color: var(--text);
    }

    .empty-description {
      max-width: 500px;

      margin:
        11px auto 0;

      color: var(--text-soft);

      font-size: 14px;

      line-height: 1.65;
    }

    .empty-hint {
      display: flex;
      align-items: center;
      gap: 7px;

      margin-top: 20px;

      color: var(--text-muted);

      font-size: 11px;
    }

    .empty-hint-icon {
      color: var(--primary);
    }

    /* ========================================================
       MESSAGES
       ======================================================== */

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .message-row {
      width: 100%;

      display: flex;

      animation:
        messageIn 0.25s ease both;
    }

    @keyframes messageIn {
      from {
        opacity: 0;
        transform: translateY(5px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-row.user {
      justify-content: flex-end;
    }

    .message-row.assistant {
      justify-content: flex-start;
    }

    .message-content-wrap {
      max-width: min(76%, 680px);

      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .message-row.user .message-content-wrap {
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 31px;
      height: 31px;

      flex-shrink: 0;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 10px;

      border: 1px solid var(--border);

      background: var(--surface);

      overflow: hidden;
    }

    .message-avatar img {
      width: 22px;
      height: 22px;

      object-fit: contain;
    }

    .user-avatar {
      font-size: 11px;
      font-weight: 700;

      color: var(--primary);

      background:
        ${
          darkMode
            ? "rgba(24,165,111,0.10)"
            : "rgba(24,165,111,0.08)"
        };
    }

    .message-bubble {
      padding:
        11px
        14px;

      border-radius: 17px;

      font-size: 14px;

      line-height: 1.68;

      white-space: pre-wrap;

      word-break: break-word;
    }

    .message-row.user .message-bubble {
      background: var(--user-bg);

      border:
        1px solid
        ${
          darkMode
            ? "rgba(24,165,111,0.15)"
            : "rgba(24,165,111,0.10)"
        };

      border-bottom-right-radius: 5px;
    }

    .message-row.assistant .message-bubble {
      background: var(--assistant-bg);

      border: 1px solid var(--border);

      border-bottom-left-radius: 5px;

      box-shadow:
        0 8px 25px
        ${
          darkMode
            ? "rgba(0,0,0,0.10)"
            : "rgba(15,23,42,0.025)"
        };
    }

    .streaming-cursor {
      display: inline-block;

      width: 5px;
      height: 15px;

      margin-left: 4px;

      vertical-align: -2px;

      border-radius: 3px;

      background: var(--primary);

      animation: blink 0.9s infinite;
    }

    @keyframes blink {
      0%, 45% {
        opacity: 1;
      }

      46%, 100% {
        opacity: 0;
      }
    }

    /* ========================================================
       THINKING
       ======================================================== */

    .thinking-bubble {
      display: flex;
      align-items: center;
      gap: 8px;

      min-height: 44px;

      padding: 0 14px;

      border-radius: 16px;

      background: var(--assistant-bg);

      border: 1px solid var(--border);

      color: var(--text-soft);

      font-size: 13px;
    }

    .thinking-dots {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .thinking-dot {
      width: 5px;
      height: 5px;

      border-radius: 50%;

      background: var(--primary);

      animation: thinking 1.2s infinite ease-in-out;
    }

    .thinking-dot:nth-child(2) {
      animation-delay: 0.15s;
    }

    .thinking-dot:nth-child(3) {
      animation-delay: 0.3s;
    }

    @keyframes thinking {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.35;
      }

      30% {
        transform: translateY(-3px);
        opacity: 1;
      }
    }

    /* ========================================================
       TRANSCRIPT
       ======================================================== */

    .transcript-card {
      margin-top: 13px;

      padding:
        10px
        12px;

      border-radius: 12px;

      border: 1px solid
        ${
          darkMode
            ? "rgba(24,165,111,0.14)"
            : "rgba(24,165,111,0.11)"
        };

      background:
        ${
          darkMode
            ? "rgba(24,165,111,0.055)"
            : "rgba(24,165,111,0.045)"
        };

      color: var(--text-soft);

      font-size: 12px;
      line-height: 1.5;
    }

    .transcript-label {
      display: block;

      margin-bottom: 3px;

      color: var(--primary);

      font-size: 10px;

      font-weight: 750;

      text-transform: uppercase;

      letter-spacing: 0.08em;
    }

    /* ========================================================
       ERROR
       ======================================================== */

    .error-bar {
      position: fixed;

      left: 50%;

      bottom: 122px;

      transform: translateX(-50%);

      z-index: 30;

      width: min(
        calc(100% - 28px),
        600px
      );

      display: flex;
      align-items: center;
      gap: 9px;

      padding:
        10px
        12px;

      border-radius: 13px;

      border: 1px solid
        ${
          darkMode
            ? "rgba(239,68,68,0.20)"
            : "rgba(239,68,68,0.16)"
        };

      background:
        ${
          darkMode
            ? "rgba(60,18,22,0.94)"
            : "rgba(255,245,245,0.96)"
        };

      color:
        ${
          darkMode
            ? "#ffb4b4"
            : "#b42318"
        };

      box-shadow:
        0 12px 35px
        ${
          darkMode
            ? "rgba(0,0,0,0.28)"
            : "rgba(15,23,42,0.08)"
        };

      backdrop-filter: blur(18px);

      font-size: 12px;
    }

    .error-icon {
      flex-shrink: 0;

      width: 7px;
      height: 7px;

      border-radius: 50%;

      background: #ef4444;
    }

    /* ========================================================
       COMPOSER
       ======================================================== */

    .composer-area {
      position: fixed;

      left: 0;
      right: 0;
      bottom: 0;

      z-index: 20;

      padding:
        15px
        clamp(14px, 3vw, 28px)
        max(
          18px,
          env(safe-area-inset-bottom)
        );

      pointer-events: none;
    }

    .composer-inner {
      width: min(920px, 100%);

      margin: 0 auto;

      pointer-events: auto;
    }

    .composer-status {
      min-height: 18px;

      margin-bottom: 6px;

      padding-left: 4px;

      color: var(--text-muted);

      font-size: 10px;

      text-align: left;
    }

    .composer-status.recording {
      color: var(--primary);

      font-weight: 650;
    }

    .composer-status.thinking {
      color: var(--text-soft);
    }

    .composer {
      width: 100%;

      min-height: 64px;

      display: flex;
      align-items: flex-end;

      gap: 10px;

      padding:
        11px
        11px
        11px
        17px;

      border-radius: 21px;

      border: 1px solid var(--border-strong);

      background: var(--surface-solid);

      box-shadow:
        0 18px 55px
        ${
          darkMode
            ? "rgba(0,0,0,0.38)"
            : "rgba(15,23,42,0.10)"
        };

      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);

      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .composer:focus-within {
      border-color:
        ${
          darkMode
            ? "rgba(24,165,111,0.38)"
            : "rgba(24,165,111,0.30)"
        };

      box-shadow:
        0 18px 55px
        ${
          darkMode
            ? "rgba(0,0,0,0.42)"
            : "rgba(15,23,42,0.12)"
        },
        0 0 0 3px
        ${
          darkMode
            ? "rgba(24,165,111,0.06)"
            : "rgba(24,165,111,0.04)"
        };
    }

    .composer textarea {
      flex: 1;

      width: 100%;

      min-width: 0;

      min-height: 40px;
      max-height: 180px;

      resize: none;

      border: 0;
      outline: 0;

      background: transparent;

      color: var(--text);

      font-size: 14px;

      line-height: 1.55;

      padding:
        8px
        0;

      scrollbar-width: thin;
    }

    .composer textarea::placeholder {
      color: var(--text-muted);
    }

    .composer textarea:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    /* ========================================================
       EMPTY INPUT VOICE OPTIONS
       ======================================================== */

    .voice-options {
      display: flex;

      align-items: center;

      gap: 7px;

      flex-shrink: 0;
    }

    .voice-option {
      height: 39px;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      gap: 7px;

      padding:
        0
        12px;

      border-radius: 12px;

      border: 1px solid var(--border);

      background:
        ${
          darkMode
            ? "rgba(255,255,255,0.035)"
            : "rgba(15,23,42,0.025)"
        };

      color: var(--text-soft);

      font-size: 11px;

      font-weight: 650;

      cursor: pointer;

      user-select: none;

      touch-action: none;

      transition:
        transform 0.18s ease,
        background 0.18s ease,
        color 0.18s ease,
        border-color 0.18s ease;
    }

    .voice-option:hover {
      transform: translateY(-1px);

      color: var(--text);

      background: var(--surface-hover);
    }

    .voice-option.live {
      color: var(--primary);

      border-color:
        ${
          darkMode
            ? "rgba(24,165,111,0.18)"
            : "rgba(24,165,111,0.14)"
        };

      background:
        ${
          darkMode
            ? "rgba(24,165,111,0.055)"
            : "rgba(24,165,111,0.045)"
        };
    }

    .voice-option:active {
      transform: scale(0.96);
    }

    .voice-option-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .voice-option-text {
      white-space: nowrap;
    }

    /* ========================================================
       MAIN ACTION BUTTON
       ======================================================== */

    .action-button {
      width: 43px;
      height: 43px;

      flex-shrink: 0;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      border: 0;

      border-radius: 14px;

      background: var(--primary);

      color: white;

      cursor: pointer;

      box-shadow:
        0 7px 20px
        ${
          darkMode
            ? "rgba(24,165,111,0.18)"
            : "rgba(24,165,111,0.18)"
        };

      transition:
        transform 0.18s ease,
        background 0.18s ease,
        box-shadow 0.18s ease;
    }

    .action-button:hover:not(:disabled) {
      transform: translateY(-1px);

      background: var(--primary-dark);

      box-shadow:
        0 10px 25px
        rgba(24,165,111,0.22);
    }

    .action-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .action-button:disabled {
      cursor: default;

      opacity: 0.65;
    }

    .action-button.recording {
      background: #ef4444;

      box-shadow:
        0 0 0 7px
        ${
          darkMode
            ? "rgba(239,68,68,0.10)"
            : "rgba(239,68,68,0.08)"
        };

      animation:
        recordingPulse 1.35s infinite;
    }

    @keyframes recordingPulse {
      0%, 100% {
        box-shadow:
          0 0 0 5px
          rgba(239,68,68,0.08);
      }

      50% {
        box-shadow:
          0 0 0 9px
          rgba(239,68,68,0.13);
      }
    }

    .action-button.speaking {
      background: #667085;
    }

    /* ========================================================
       LOADING
       ======================================================== */

    .action-loading {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .action-loading span {
      width: 4px;
      height: 4px;

      border-radius: 50%;

      background: white;

      animation:
        actionDots 1s infinite ease-in-out;
    }

    .action-loading span:nth-child(2) {
      animation-delay: 0.12s;
    }

    .action-loading span:nth-child(3) {
      animation-delay: 0.24s;
    }

    @keyframes actionDots {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.45;
      }

      30% {
        transform: translateY(-3px);
        opacity: 1;
      }
    }

    /* ========================================================
       FOOTER NOTE
       ======================================================== */

    .composer-note {
      margin-top: 7px;

      text-align: center;

      color: var(--text-muted);

      font-size: 9px;

      line-height: 1.4;
    }

    /* ========================================================
       MOBILE
       ======================================================== */

    @media (max-width: 700px) {
      .antimate-header {
        height: 64px;

        padding:
          0
          13px;
      }

      .antimate-logo {
        width: 35px;
        height: 35px;
      }

      .antimate-brand-title {
        font-size: 14px;
      }

      .antimate-brand-subtitle {
        display: none;
      }

      .connection-status {
        padding:
          6px
          8px;

        font-size: 0;
      }

      .connection-dot {
        width: 7px;
        height: 7px;
      }

      .theme-button {
        width: 35px;
        height: 35px;
      }

      .antimate-chat {
        padding:
          18px
          11px
          145px;
      }

      .empty-state {
        min-height: calc(100vh - 205px);

        padding:
          30px
          10px;
      }

      .empty-logo-wrap {
        width: 68px;
        height: 68px;

        border-radius: 21px;
      }

      .empty-logo {
        width: 48px;
        height: 48px;
      }

      .empty-title {
        font-size: 26px;
      }

      .empty-description {
        font-size: 13px;

        max-width: 340px;
      }

      .message-content-wrap {
        max-width: 88%;
      }

      .message-avatar {
        width: 28px;
        height: 28px;
        border-radius: 9px;
      }

      .message-avatar img {
        width: 19px;
        height: 19px;
      }

      .message-bubble {
        font-size: 13.5px;

        padding:
          10px
          12px;
      }

      .composer-area {
        padding:
          10px
          10px
          max(
            12px,
            env(safe-area-inset-bottom)
          );
      }

      .composer-status {
        margin-bottom: 5px;
      }

      .composer {
        min-height: 59px;

        padding:
          8px
          8px
          8px
          13px;

        border-radius: 18px;

        gap: 7px;
      }

      .composer textarea {
        font-size: 14px;
      }

      .voice-option {
        width: 39px;
        height: 39px;

        padding: 0;

        border-radius: 12px;
      }

      .voice-option-text {
        display: none;
      }

      .action-button {
        width: 41px;
        height: 41px;

        border-radius: 13px;
      }

      .error-bar {
        bottom: 105px;
      }

      .composer-note {
        display: none;
      }
    }

    @media (max-width: 390px) {
      .antimate-brand-title {
        font-size: 13px;
      }

      .message-content-wrap {
        max-width: 92%;
      }

      .empty-title {
        font-size: 24px;
      }
    }

    /* ========================================================
       REDUCED MOTION
       ======================================================== */

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.001ms !important;
      }
    }
  `;

  // ==========================================================
  // RENDER ACTION BUTTON
  // ==========================================================

  const renderActionButton = () => {
    if (actionState === "thinking") {
      return (
        <button
          type="button"
          className="action-button"
          disabled
          aria-label="ANTIMATE is thinking"
        >
          <span className="action-loading">
            <span />
            <span />
            <span />
          </span>
        </button>
      );
    }

    if (actionState === "speaking") {
      return (
        <button
          type="button"
          className="action-button speaking"
          disabled
          aria-label="ANTIMATE is speaking"
        >
          <VolumeIcon size={19} />
        </button>
      );
    }

    if (actionState === "recording") {
      return (
        <button
          type="button"
          className="action-button recording"
          aria-label="Stop recording"
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <StopIcon size={18} />
        </button>
      );
    }

    if (actionState === "send") {
      return (
        <button
          type="button"
          className="action-button"
          aria-label="Send message"
          onClick={handleMainAction}
        >
          <SendIcon size={20} />
        </button>
      );
    }

    return (
      <button
        type="button"
        className="action-button"
        aria-label="Hold to speak"
        disabled={!socketConnected}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <MicIcon size={20} />
      </button>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <style>{css}</style>

      <div
        className="antimate-ai-page"
        data-theme={darkMode ? "dark" : "light"}
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="antimate-header">
          <div className="antimate-brand">
            <img
              src={LOGO_URL}
              alt="ANTIMATE"
              className="antimate-logo"
              onError={(event) => {
                event.currentTarget.style.visibility =
                  "hidden";
              }}
            />

            <div className="antimate-brand-text">
              <div className="antimate-brand-title">
                ANTIMATE AI
              </div>

              <div className="antimate-brand-subtitle">
                Smart farming assistant
              </div>
            </div>
          </div>

          <div className="antimate-header-right">
            <div
              className="connection-status"
              title={
                socketConnected
                  ? "Voice service connected"
                  : "Voice service disconnected"
              }
            >
              <span className="connection-dot" />

              <span>
                {socketConnected
                  ? "Connected"
                  : "Offline"}
              </span>
            </div>

            <button
              type="button"
              className="theme-button"
              aria-label={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                darkMode
                  ? "Light mode"
                  : "Dark mode"
              }
              onClick={() =>
                setDarkMode((value) => !value)
              }
            >
              {darkMode ? (
                <SunIcon size={18} />
              ) : (
                <MoonIcon size={18} />
              )}
            </button>
          </div>
        </header>

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="antimate-main">
          <div className="antimate-chat">
            {!messages.length ? (
              <section className="empty-state">
                <div className="empty-logo-wrap">
                  <img
                    src={LOGO_URL}
                    alt="ANTIMATE AI"
                    className="empty-logo"
                  />
                </div>

                <h1 className="empty-title">
                  Muraho, ndi ANTIMATE
                </h1>

                <p className="empty-description">
                  Umufasha wawe w'ubwenge mu bworozi.
                  Mbaza ikibazo cyawe, andika cyangwa
                  ukoreshe ijwi.
                </p>

                <div className="empty-hint">
                  <span className="empty-hint-icon">
                    <SparkleIcon size={14} />
                  </span>

                  <span>
                    Ask anything about your farm
                  </span>
                </div>
              </section>
            ) : (
              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-row ${message.role}`}
                  >
                    <div className="message-content-wrap">
                      <div
                        className={`message-avatar ${
                          message.role === "user"
                            ? "user-avatar"
                            : ""
                        }`}
                      >
                        {message.role ===
                        "assistant" ? (
                          <img
                            src={LOGO_URL}
                            alt="ANTIMATE"
                          />
                        ) : (
                          "YOU"
                        )}
                      </div>

                      <div className="message-bubble">
                        {message.content}

                        {message.streaming && (
                          <span className="streaming-cursor" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isProcessing &&
                  !currentAnswerRef.current && (
                    <div className="message-row assistant">
                      <div className="message-content-wrap">
                        <div className="message-avatar">
                          <img
                            src={LOGO_URL}
                            alt="ANTIMATE"
                          />
                        </div>

                        <div className="thinking-bubble">
                          <span>
                            ANTIMATE iri gutekereza
                          </span>

                          <span className="thinking-dots">
                            <span className="thinking-dot" />
                            <span className="thinking-dot" />
                            <span className="thinking-dot" />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {transcript && (
                  <div className="transcript-card">
                    <span className="transcript-label">
                      Wavuze
                    </span>

                    {transcript}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="error-bar">
            <span className="error-icon" />

            <span>{error}</span>
          </div>
        )}

        {/* ====================================================
            COMPOSER
        ==================================================== */}

        <div className="composer-area">
          <div className="composer-inner">
            <div
              className={`composer-status ${
                isRecording
                  ? "recording"
                  : isProcessing
                  ? "thinking"
                  : ""
              }`}
            >
              {isRecording &&
                (recordingMode === "live"
                  ? "● Live voice — release to send"
                  : "● Listening — release to send")}

              {!isRecording &&
                isProcessing &&
                "ANTIMATE iri gutekereza..."}

              {!isRecording &&
                !isProcessing &&
                isPlaying &&
                "ANTIMATE iri kuvuga..."}

              {!isRecording &&
                !isProcessing &&
                !isPlaying &&
                !input.trim() &&
                "Hold microphone to speak"}

              {!isRecording &&
                !isProcessing &&
                !isPlaying &&
                input.trim() &&
                "Ready to send"}
            </div>

            <div className="composer">
              <textarea
                ref={textareaRef}
                value={input}
                disabled={
                  isProcessing ||
                  isPlaying ||
                  isRecording
                }
                placeholder={
                  isRecording
                    ? "Listening..."
                    : "Message ANTIMATE..."
                }
                rows={1}
                onChange={(event) => {
                  setInput(event.target.value);
                  setHasStarted(true);
                }}
                onKeyDown={handleKeyDown}
              />

              {/* ------------------------------------------------
                  EMPTY INPUT:
                  RECORD + LIVE VOICE
                  ------------------------------------------------ */}

              {!input.trim() &&
                !isRecording &&
                !isProcessing &&
                !isPlaying && (
                  <div className="voice-options">
                    <button
                      type="button"
                      className="voice-option"
                      disabled={!socketConnected}
                      onClick={startShortVoice}
                      aria-label="Record voice"
                      title="Record voice"
                    >
                      <span className="voice-option-icon">
                        <MicIcon size={17} />
                      </span>

                      <span className="voice-option-text">
                        Record
                      </span>
                    </button>

                    <button
                      type="button"
                      className="voice-option live"
                      disabled={!socketConnected}
                      onPointerDown={(event) => {
                        event.preventDefault();

                        if (!socketConnected) {
                          return;
                        }

                        startRecording("live");
                      }}
                      onPointerUp={(event) => {
                        event.preventDefault();

                        if (isRecording) {
                          stopRecording(true);
                        }
                      }}
                      onPointerCancel={() => {
                        if (isRecording) {
                          stopRecording(true);
                        }
                      }}
                      aria-label="Live voice"
                      title="Hold for live voice"
                    >
                      <span className="voice-option-icon">
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background:
                              "currentColor",
                            display: "inline-block",
                            boxShadow:
                              "0 0 0 4px rgba(24,165,111,0.10)",
                          }}
                        />
                      </span>

                      <span className="voice-option-text">
                        Live
                      </span>
                    </button>
                  </div>
                )}

              {/* ------------------------------------------------
                  SINGLE MAIN ACTION
                  ------------------------------------------------ */}

              {renderActionButton()}
            </div>

            <div className="composer-note">
              ANTIMATE can make mistakes. Verify important
              farming decisions.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}