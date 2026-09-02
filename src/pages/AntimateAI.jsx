import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

/*
============================================================
 ANTIMATE AI — PREMIUM CHAT / VOICE UI
 -----------------------------------------------------------
 FEATURES
 - Text chat
 - 30 second Record
 - Live Voice
 - 1.8s silence auto-send
 - Auto reopen microphone after AI response
 - AI voice replay
 - Light / Dark theme
 - Glassmorphism UI
 - Single contextual action button
 - Socket.IO streaming
============================================================
*/

/* =========================================================
   CONFIG
========================================================= */

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/+$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/+$/, "");

/*
 IMPORTANT:
 Keep your existing ANTIMATE AI logo here.
 If your project already has an imported logo, replace this
 constant with that imported asset.
*/
const LOGO_SRC = "/antimate-ai-logo.png";

/* =========================================================
   HELPERS
========================================================= */

function makeAbsoluteUrl(value) {
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `00:${String(s).padStart(2, "0")}`;
}

/* =========================================================
   ICONS
========================================================= */

const Icon = {
  Mic: ({ size = 22 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3" />
      <path d="M8.5 21h7" />
    </svg>
  ),

  MicOff: ({ size = 22 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 9v5.5a3 3 0 0 0 5.2 2.05" />
      <path d="M15 9V6a3 3 0 0 0-5.6-1.5" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 11.9 3.6" />
      <path d="M12 18v3" />
      <path d="M8.5 21h7" />
      <path d="M3 3l18 18" />
    </svg>
  ),

  Send: ({ size = 21 }) => (
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
  ),

  Stop: ({ size = 20 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
  ),

  Sun: ({ size = 19 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
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
  ),

  Moon: ({ size = 19 }) => (
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
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5Z" />
    </svg>
  ),

  Volume: ({ size = 18 }) => (
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
      <path d="M11 5 6 9H3v6h3l5 4Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  ),

  Rotate: ({ size = 17 }) => (
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
      <path d="M3 12a9 9 0 0 1 15.2-6.5L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.2 6.5L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),

  Spark: ({ size = 18 }) => (
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
      <path d="m12 3 1.4 5.1L18 10l-4.6 1.9L12 17l-1.4-5.1L6 10l4.6-1.9Z" />
      <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
    </svg>
  ),

  Wifi: ({ size = 14 }) => (
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
      <path d="M5 12.5a11 11 0 0 1 14 0" />
      <path d="M8.5 16a6 6 0 0 1 7 0" />
      <path d="M12 19h.01" />
    </svg>
  ),
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AntimateAI() {
  /* =======================================================
     STATE
  ======================================================= */

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [recordMode, setRecordMode] = useState(null);
  // "record" | "live" | null

  const [recordSeconds, setRecordSeconds] = useState(30);

  const [isPlaying, setIsPlaying] = useState(false);

  const [socketConnected, setSocketConnected] = useState(false);

  const [error, setError] = useState("");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("antimate-ai-theme") || "dark";
  });

  const [transcript, setTranscript] = useState("");

  const [currentAnswer, setCurrentAnswer] = useState("");

  /* =======================================================
     REFS
  ======================================================= */

  const socketRef = useRef(null);

  const recorderRef = useRef(null);

  const streamRef = useRef(null);

  const chunksRef = useRef([]);

  const audioRef = useRef(null);

  const textareaRef = useRef(null);

  const recordTimerRef = useRef(null);

  const silenceTimerRef = useRef(null);

  const liveRestartTimerRef = useRef(null);

  const currentAnswerRef = useRef("");

  const isPlayingRef = useRef(false);

  const isRecordingRef = useRef(false);

  const recordModeRef = useRef(null);

  const ignoreNextAutoLiveRef = useRef(false);

  /* =======================================================
     THEME
  ======================================================= */

  useEffect(() => {
    localStorage.setItem("antimate-ai-theme", theme);
    document.documentElement.setAttribute(
      "data-antimate-theme",
      theme
    );
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  /* =======================================================
     AUTO RESIZE TEXTAREA
  ======================================================= */

  useEffect(() => {
    const el = textareaRef.current;

    if (!el) return;

    el.style.height = "auto";

    el.style.height = `${Math.min(el.scrollHeight, 170)}px`;
  }, [text]);

  /* =======================================================
     ADD MESSAGE
  ======================================================= */

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  /* =======================================================
     UPDATE LAST ASSISTANT MESSAGE
  ======================================================= */

  const updateLiveAssistant = useCallback((answer) => {
    setMessages((prev) => {
      const copy = [...prev];

      const lastIndex = copy.length - 1;

      if (
        lastIndex >= 0 &&
        copy[lastIndex].role === "assistant" &&
        copy[lastIndex].streaming
      ) {
        copy[lastIndex] = {
          ...copy[lastIndex],
          text: answer,
          streaming: true,
        };

        return copy;
      }

      copy.push({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: answer,
        streaming: true,
        voiceUrl: null,
      });

      return copy;
    });
  }, []);

  /* =======================================================
     FINISH ASSISTANT MESSAGE
  ======================================================= */

  const finishAssistantMessage = useCallback(
    (answer, audioUrl = null) => {
      setMessages((prev) => {
        const copy = [...prev];

        const lastIndex = copy.length - 1;

        if (
          lastIndex >= 0 &&
          copy[lastIndex].role === "assistant" &&
          copy[lastIndex].streaming
        ) {
          copy[lastIndex] = {
            ...copy[lastIndex],
            text: answer || copy[lastIndex].text || "",
            streaming: false,
            voiceUrl:
              audioUrl || copy[lastIndex].voiceUrl || null,
          };

          return copy;
        }

        copy.push({
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: answer || "",
          streaming: false,
          voiceUrl: audioUrl,
        });

        return copy;
      });
    },
    []
  );

  /* =======================================================
     PLAY AUDIO
  ======================================================= */

  const playAudio = useCallback((url) => {
    if (!url) return;

    const absoluteUrl = makeAbsoluteUrl(url);

    if (!absoluteUrl) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(absoluteUrl);

      audioRef.current = audio;

      isPlayingRef.current = true;
      setIsPlaying(true);

      audio.onended = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);

        /*
         Live voice:
         After AI finishes playing, reopen microphone.
        */
        if (recordModeRef.current === "live") {
          if (ignoreNextAutoLiveRef.current) {
            ignoreNextAutoLiveRef.current = false;
            return;
          }

          if (!isRecordingRef.current) {
            liveRestartTimerRef.current = setTimeout(() => {
              startLiveRecording();
            }, 350);
          }
        }
      };

      audio.onerror = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
      };

      audio.play().catch(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
      });
    } catch (err) {
      console.error("Audio playback error:", err);

      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, []);

  /* =======================================================
     SOCKET CONNECTION
  ======================================================= */

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
      console.log("🔌 ANTIMATE Socket connected:", socket.id);
      setSocketConnected(true);
      setError("");
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 ANTIMATE Socket disconnected:", reason);
      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setSocketConnected(false);
    });

    /* -------------------------------------------------------
       STATUS
    ------------------------------------------------------- */

    socket.on("antimate:status", (data) => {
      console.log("ANTIMATE STATUS:", data);

      if (data?.status === "processing") {
        setIsProcessing(true);
      }

      if (data?.status === "recording") {
        setIsProcessing(false);
      }
    });

    /* -------------------------------------------------------
       TRANSCRIPT
    ------------------------------------------------------- */

    socket.on("antimate:transcript", (data) => {
      const value =
        data?.text ||
        data?.transcript ||
        data?.message ||
        "";

      if (value) {
        setTranscript(value);
      }
    });

    /* -------------------------------------------------------
       THINKING
    ------------------------------------------------------- */

    socket.on("antimate:thinking", () => {
      setIsProcessing(true);
    });

    /* -------------------------------------------------------
       COMPLETE ANSWER
    ------------------------------------------------------- */

    socket.on("antimate:answer", (data) => {
      const answer =
        data?.answer ||
        data?.text ||
        data?.message ||
        "";

      if (answer) {
        currentAnswerRef.current = answer;
        setCurrentAnswer(answer);
        updateLiveAssistant(answer);
      }
    });

    /* -------------------------------------------------------
       STREAMING ANSWER
    ------------------------------------------------------- */

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

      setCurrentAnswer(currentAnswerRef.current);

      updateLiveAssistant(currentAnswerRef.current);
    });

    /* -------------------------------------------------------
       AUDIO
    ------------------------------------------------------- */

    socket.on("antimate:audio", (data) => {
      const url =
        data?.url ||
        data?.audioUrl ||
        data?.audio ||
        data?.file ||
        null;

      if (url) {
        const absolute = makeAbsoluteUrl(url);

        /*
         Attach audio to latest assistant message.
        */
        setMessages((prev) => {
          const copy = [...prev];

          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === "assistant") {
              copy[i] = {
                ...copy[i],
                voiceUrl: absolute,
                streaming: false,
              };

              break;
            }
          }

          return copy;
        });

        /*
         Automatically play AI answer.
        */
        playAudio(absolute);
      }
    });

    /* -------------------------------------------------------
       COMPLETE
    ------------------------------------------------------- */

    socket.on("antimate:complete", (data) => {
      const answer =
        data?.answer ||
        data?.text ||
        currentAnswerRef.current ||
        "";

      const audioUrl = makeAbsoluteUrl(
        data?.audioUrl ||
          data?.audio ||
          data?.url ||
          null
      );

      finishAssistantMessage(answer, audioUrl);

      setIsProcessing(false);
      setTranscript("");

      if (audioUrl) {
        playAudio(audioUrl);
      }
    });

    /* -------------------------------------------------------
       ERROR
    ------------------------------------------------------- */

    socket.on("antimate:error", (data) => {
      console.error("ANTIMATE SOCKET ERROR:", data);

      const message =
        data?.message ||
        data?.error ||
        "Habaye ikibazo mu gutunganya ijwi.";

      setError(message);
      setIsProcessing(false);
      setIsRecording(false);

      isRecordingRef.current = false;
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [
    finishAssistantMessage,
    playAudio,
    updateLiveAssistant,
  ]);

  /* =======================================================
     STOP MEDIA
  ======================================================= */

  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });

      streamRef.current = null;
    }
  }, []);

  /* =======================================================
     CLEAR TIMERS
  ======================================================= */

  const clearRecordingTimers = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (liveRestartTimerRef.current) {
      clearTimeout(liveRestartTimerRef.current);
      liveRestartTimerRef.current = null;
    }
  }, []);

  /* =======================================================
     STOP RECORDING
  ======================================================= */

  const stopRecording = useCallback(
    (send = true) => {
      clearRecordingTimers();

      const recorder = recorderRef.current;

      isRecordingRef.current = false;

      setIsRecording(false);

      if (!recorder) {
        stopMediaTracks();
        return;
      }

      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch (err) {
        console.error("Recorder stop error:", err);
      }

      if (!send) {
        try {
          socketRef.current?.emit("antimate:voice:cancel");
        } catch {}

        chunksRef.current = [];

        recorderRef.current = null;

        stopMediaTracks();

        return;
      }
    },
    [clearRecordingTimers, stopMediaTracks]
  );

  /* =======================================================
     START RECORDING
  ======================================================= */

  const startRecording = useCallback(
    async (mode = "record") => {
      if (isRecordingRef.current) return;

      if (isPlayingRef.current) {
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Browser yawe ntabwo yemera microphone."
        );
        return;
      }

      if (!socketRef.current?.connected) {
        setError(
          "ANTIMATE AI ntabwo iri connected kuri server."
        );
        return;
      }

      try {
        setError("");

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

        const mimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
        ];

        const selectedMime = mimeTypes.find((type) =>
          MediaRecorder.isTypeSupported(type)
        );

        const recorder = selectedMime
          ? new MediaRecorder(stream, {
              mimeType: selectedMime,
            })
          : new MediaRecorder(stream);

        recorderRef.current = recorder;

        recordModeRef.current = mode;

        setRecordMode(mode);

        isRecordingRef.current = true;

        setIsRecording(true);

        setRecordSeconds(30);

        setTranscript("");

        socketRef.current.emit("antimate:voice:start", {
          mode,
          mimeType: recorder.mimeType,
        });

        recorder.ondataavailable = (event) => {
          if (!event.data || event.data.size === 0) {
            return;
          }

          chunksRef.current.push(event.data);

          /*
           Send chunks immediately.
          */
          socketRef.current?.emit(
            "antimate:voice:chunk",
            event.data
          );

          /*
           LIVE VOICE SILENCE DETECTION
           --------------------------------
           The backend can also handle VAD, but this
           frontend timer gives a fallback behavior.
          */
          if (mode === "live") {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }

            silenceTimerRef.current = setTimeout(() => {
              if (
                isRecordingRef.current &&
                recordModeRef.current === "live"
              ) {
                stopRecording(true);
              }
            }, 1800);
          }
        };

        recorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);

          setError(
            "Microphone recording yabonyemo ikibazo."
          );

          stopRecording(false);
        };

        recorder.onstop = () => {
          const wasLive =
            recordModeRef.current === "live";

          const hadChunks =
            chunksRef.current.length > 0;

          socketRef.current?.emit("antimate:voice:end", {
            mode: wasLive ? "live" : "record",
            hasAudio: hadChunks,
          });

          recorderRef.current = null;

          chunksRef.current = [];

          stopMediaTracks();

          /*
           Live mode:
           backend response will play,
           then onended() will reopen mic.
          */
        };

        /*
         250ms chunks:
         good balance between latency and network overhead.
        */
        recorder.start(250);

        /* ---------------------------------------------------
           30 SECOND RECORDING LIMIT
        --------------------------------------------------- */

        if (mode === "record") {
          let remaining = 30;

          recordTimerRef.current = setInterval(() => {
            remaining -= 1;

            setRecordSeconds(remaining);

            if (remaining <= 0) {
              stopRecording(true);
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Microphone error:", err);

        setIsRecording(false);

        isRecordingRef.current = false;

        recordModeRef.current = null;

        setRecordMode(null);

        stopMediaTracks();

        if (err?.name === "NotAllowedError") {
          setError(
            "Microphone permission irakenewe kugira ngo ukoreshe voice."
          );
        } else {
          setError(
            "Ntabwo microphone yashoboye gufunguka."
          );
        }
      }
    },
    [stopMediaTracks, stopRecording]
  );

  /* =======================================================
     LIVE RECORDING
  ======================================================= */

  const startLiveRecording = useCallback(() => {
    if (isPlayingRef.current) return;

    if (isRecordingRef.current) return;

    if (recordModeRef.current !== "live") {
      recordModeRef.current = "live";
      setRecordMode("live");
    }

    startRecording("live");
  }, [startRecording]);

  /* =======================================================
     STOP LIVE VOICE
  ======================================================= */

  const stopLiveVoice = useCallback(() => {
    recordModeRef.current = null;

    setRecordMode(null);

    ignoreNextAutoLiveRef.current = true;

    if (liveRestartTimerRef.current) {
      clearTimeout(liveRestartTimerRef.current);
      liveRestartTimerRef.current = null;
    }

    if (isRecordingRef.current) {
      stopRecording(true);
    }
  }, [stopRecording]);

  /* =======================================================
     RECORD BUTTON
     ---------------
     Click = normal 30 sec record.
  ======================================================= */

  const handleRecord = useCallback(() => {
    if (isProcessing || isPlaying) return;

    if (isRecording) {
      stopRecording(true);
      return;
    }

    recordModeRef.current = "record";

    startRecording("record");
  }, [
    isProcessing,
    isPlaying,
    isRecording,
    startRecording,
    stopRecording,
  ]);

  /* =======================================================
     LIVE BUTTON
  ======================================================= */

  const handleLiveVoice = useCallback(() => {
    if (isProcessing || isPlaying) return;

    if (recordModeRef.current === "live") {
      stopLiveVoice();
      return;
    }

    recordModeRef.current = "live";

    setRecordMode("live");

    startLiveRecording();
  }, [
    isProcessing,
    isPlaying,
    startLiveRecording,
    stopLiveVoice,
  ]);

  /* =======================================================
     TEXT CHAT
  ======================================================= */

  const sendText = useCallback(async () => {
    const message = text.trim();

    if (!message || isProcessing || isPlaying) {
      return;
    }

    setError("");

    setText("");

    setTranscript("");

    currentAnswerRef.current = "";

    setCurrentAnswer("");

    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
    });

    setIsProcessing(true);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Chat request failed."
        );
      }

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        data?.text ||
        "";

      const audioUrl = makeAbsoluteUrl(
        data?.audioUrl ||
          data?.audio ||
          data?.url ||
          null
      );

      finishAssistantMessage(answer, audioUrl);

      if (audioUrl) {
        playAudio(audioUrl);
      }
    } catch (err) {
      console.error("Text chat error:", err);

      setError(
        err?.message ||
          "ANTIMATE AI yananiwe gusubiza."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    text,
    isProcessing,
    isPlaying,
    addMessage,
    finishAssistantMessage,
    playAudio,
  ]);

  /* =======================================================
     KEYBOARD
  ======================================================= */

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        if (text.trim()) {
          sendText();
        }
      }
    },
    [sendText, text]
  );

  /* =======================================================
     SINGLE ACTION BUTTON
  ======================================================= */

  const actionType = useMemo(() => {
    if (isProcessing) {
      return "processing";
    }

    if (isPlaying) {
      return "playing";
    }

    if (text.trim()) {
      return "send";
    }

    if (isRecording) {
      return "stop";
    }

    return "mic";
  }, [
    isProcessing,
    isPlaying,
    text,
    isRecording,
  ]);

  const handleMainAction = useCallback(() => {
    if (actionType === "processing") return;

    if (actionType === "playing") return;

    if (actionType === "send") {
      sendText();
      return;
    }

    if (actionType === "stop") {
      stopRecording(true);
      return;
    }

    if (actionType === "mic") {
      handleRecord();
    }
  }, [
    actionType,
    sendText,
    stopRecording,
    handleRecord,
  ]);

  /* =======================================================
     REPLAY
  ======================================================= */

  const replayAudio = useCallback(
    (url) => {
      if (isPlaying) return;

      playAudio(url);
    },
    [isPlaying, playAudio]
  );

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      clearRecordingTimers();

      try {
        if (recorderRef.current) {
          if (
            recorderRef.current.state !== "inactive"
          ) {
            recorderRef.current.stop();
          }
        }
      } catch {}

      stopMediaTracks();

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
  }, [
    clearRecordingTimers,
    stopMediaTracks,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <style>{`
        /* =====================================================
           ANTIMATE AI UI
        ===================================================== */

        :root {
          --ai-bg: #071018;
          --ai-bg-soft: #0a151f;
          --ai-surface: rgba(255,255,255,0.055);
          --ai-surface-strong: rgba(255,255,255,0.085);
          --ai-border: rgba(255,255,255,0.10);
          --ai-border-strong: rgba(255,255,255,0.17);

          --ai-text: #f4f7fb;
          --ai-text-soft: #9caab8;
          --ai-text-faint: #6f7d8b;

          --ai-user: #183344;
          --ai-user-border: rgba(102,209,255,0.15);

          --ai-accent-1: #48e5ff;
          --ai-accent-2: #8d63ff;
          --ai-accent-3: #ff4fd8;
          --ai-accent-4: #3cff9d;

          --ai-danger: #ff657c;

          --ai-shadow:
            0 25px 80px rgba(0,0,0,0.30);

          --ai-radius: 26px;
        }

        [data-antimate-theme="light"] {
          --ai-bg: #f5f8fb;
          --ai-bg-soft: #eef3f7;
          --ai-surface: rgba(255,255,255,0.72);
          --ai-surface-strong: rgba(255,255,255,0.90);
          --ai-border: rgba(24,39,55,0.09);
          --ai-border-strong: rgba(24,39,55,0.15);

          --ai-text: #17222d;
          --ai-text-soft: #607080;
          --ai-text-faint: #8794a1;

          --ai-user: #eaf6fc;
          --ai-user-border: rgba(28,148,197,0.12);

          --ai-shadow:
            0 25px 70px rgba(42,62,80,0.12);
        }

        * {
          box-sizing: border-box;
        }

        .antimate-ai-page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 20% 10%,
              rgba(72,229,255,0.075),
              transparent 30%
            ),
            radial-gradient(
              circle at 85% 18%,
              rgba(141,99,255,0.08),
              transparent 30%
            ),
            var(--ai-bg);
          color: var(--ai-text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          transition:
            background .3s ease,
            color .3s ease;
        }

        .antimate-ai-page::before {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(72,229,255,0.08),
              transparent 68%
            );
          top: -190px;
          left: -130px;
          pointer-events: none;
        }

        .antimate-ai-page::after {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(141,99,255,0.07),
              transparent 70%
            );
          bottom: -280px;
          right: -160px;
          pointer-events: none;
        }

        .antimate-ai-shell {
          position: relative;
          z-index: 2;
          width: min(1120px, calc(100% - 32px));
          min-height: 100vh;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .antimate-ai-header {
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .antimate-logo-wrap {
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          position: relative;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.11),
              rgba(255,255,255,0.025)
            );
          border: 1px solid var(--ai-border);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 10px 35px rgba(0,0,0,0.12);
          overflow: hidden;
        }

        .antimate-logo-wrap::before {
          content: "";
          position: absolute;
          inset: -40%;
          background:
            conic-gradient(
              from 0deg,
              transparent,
              var(--ai-accent-1),
              var(--ai-accent-2),
              var(--ai-accent-3),
              var(--ai-accent-4),
              transparent
            );
          animation: antimateLogoSpin 4.5s linear infinite;
          opacity: .75;
        }

        .antimate-logo-inner {
          position: relative;
          z-index: 2;
          width: 37px;
          height: 37px;
          border-radius: 12px;
          background: var(--ai-bg-soft);
          display: grid;
          place-items: center;
        }

        .antimate-logo {
          width: 30px;
          height: 30px;
          object-fit: contain;
          display: block;
        }

        @keyframes antimateLogoSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .antimate-brand-text {
          min-width: 0;
        }

        .antimate-brand-title {
          font-size: 16px;
          font-weight: 750;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .antimate-brand-subtitle {
          margin-top: 4px;
          font-size: 11px;
          color: var(--ai-text-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .antimate-header-right {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .antimate-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 999px;
          background: var(--ai-surface);
          border: 1px solid var(--ai-border);
          color: var(--ai-text-soft);
          font-size: 11px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .antimate-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--ai-danger);
          box-shadow: 0 0 10px rgba(255,101,124,.4);
        }

        .antimate-status.connected
          .antimate-status-dot {
          background: var(--ai-accent-4);
          box-shadow:
            0 0 12px rgba(60,255,157,.65);
        }

        .antimate-theme-button {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid var(--ai-border);
          background: var(--ai-surface);
          color: var(--ai-text);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition:
            transform .2s ease,
            background .2s ease,
            border-color .2s ease;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .antimate-theme-button:hover {
          transform: translateY(-1px);
          border-color: var(--ai-border-strong);
          background: var(--ai-surface-strong);
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .antimate-main {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .antimate-chat {
          flex: 1;
          width: 100%;
          max-width: 850px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 82px);
        }

        /* =====================================================
           EMPTY STATE
        ===================================================== */

        .antimate-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 55px 20px 40px;
        }

        .antimate-empty-content {
          width: min(620px, 100%);
        }

        .antimate-empty-logo {
          width: 90px;
          height: 90px;
          margin: 0 auto 25px;
          position: relative;
          display: grid;
          place-items: center;
          border-radius: 28px;
          background: var(--ai-surface);
          border: 1px solid var(--ai-border);
          box-shadow: var(--ai-shadow);
          overflow: hidden;
        }

        .antimate-empty-logo::before {
          content: "";
          position: absolute;
          inset: -80%;
          background:
            conic-gradient(
              transparent,
              var(--ai-accent-1),
              var(--ai-accent-2),
              var(--ai-accent-3),
              var(--ai-accent-4),
              transparent
            );
          animation: antimateLogoSpin 5s linear infinite;
          opacity: .72;
        }

        .antimate-empty-logo-inner {
          position: relative;
          z-index: 2;
          width: 74px;
          height: 74px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          background: var(--ai-bg);
        }

        .antimate-empty-logo img {
          width: 57px;
          height: 57px;
          object-fit: contain;
        }

        .antimate-empty-title {
          margin: 0;
          font-size: clamp(28px, 5vw, 43px);
          font-weight: 760;
          letter-spacing: -0.045em;
          line-height: 1.06;
        }

        .antimate-empty-title span {
          background:
            linear-gradient(
              90deg,
              var(--ai-accent-1),
              var(--ai-accent-2),
              var(--ai-accent-3),
              var(--ai-accent-4),
              var(--ai-accent-1)
            );
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: antimateTextGradient 7s linear infinite;
        }

        @keyframes antimateTextGradient {
          from {
            background-position: 0% center;
          }

          to {
            background-position: 300% center;
          }
        }

        .antimate-empty-description {
          margin: 15px auto 0;
          max-width: 510px;
          color: var(--ai-text-soft);
          font-size: 14px;
          line-height: 1.65;
        }

        .antimate-empty-hint {
          margin-top: 25px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border-radius: 999px;
          border: 1px solid var(--ai-border);
          background: var(--ai-surface);
          color: var(--ai-text-soft);
          font-size: 11px;
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
        }

        /* =====================================================
           MESSAGES
        ===================================================== */

        .antimate-messages {
          flex: 1;
          overflow-y: auto;
          padding: 26px 0 18px;
          scrollbar-width: thin;
          scrollbar-color:
            rgba(150,170,190,.25)
            transparent;
        }

        .antimate-messages::-webkit-scrollbar {
          width: 5px;
        }

        .antimate-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .antimate-messages::-webkit-scrollbar-thumb {
          background: rgba(150,170,190,.25);
          border-radius: 99px;
        }

        .antimate-message-row {
          width: 100%;
          display: flex;
          margin-bottom: 17px;
        }

        .antimate-message-row.user {
          justify-content: flex-end;
        }

        .antimate-message-row.assistant {
          justify-content: flex-start;
        }

        .antimate-message {
          max-width: min(78%, 680px);
          padding: 14px 16px;
          border-radius: 20px;
          line-height: 1.6;
          font-size: 14px;
          position: relative;
          animation: antimateMessageIn .25s ease;
        }

        @keyframes antimateMessageIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .antimate-message.user {
          background:
            linear-gradient(
              145deg,
              var(--ai-user),
              color-mix(
                in srgb,
                var(--ai-user) 72%,
                transparent
              )
            );
          border: 1px solid var(--ai-user-border);
          border-bottom-right-radius: 7px;
          color: var(--ai-text);
        }

        .antimate-message.assistant {
          background: var(--ai-surface);
          border: 1px solid var(--ai-border);
          border-bottom-left-radius: 7px;
          color: var(--ai-text);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .antimate-message-label {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
          color: var(--ai-text-soft);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .antimate-mini-logo {
          width: 18px;
          height: 18px;
          object-fit: contain;
        }

        .antimate-message-text {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .antimate-message-streaming::after {
          content: "";
          display: inline-block;
          width: 5px;
          height: 15px;
          margin-left: 4px;
          vertical-align: -2px;
          background: var(--ai-accent-1);
          animation: antimateCursor .8s infinite;
        }

        @keyframes antimateCursor {
          0%, 45% {
            opacity: 1;
          }

          46%, 100% {
            opacity: 0;
          }
        }

        .antimate-replay {
          margin-top: 11px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border: 1px solid var(--ai-border);
          border-radius: 9px;
          background: transparent;
          color: var(--ai-text-soft);
          font-size: 10px;
          cursor: pointer;
          transition:
            background .2s ease,
            color .2s ease,
            border-color .2s ease;
        }

        .antimate-replay:hover {
          background: var(--ai-surface-strong);
          color: var(--ai-text);
          border-color: var(--ai-border-strong);
        }

        /* =====================================================
           THINKING
        ===================================================== */

        .antimate-thinking {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 2px 13px;
          color: var(--ai-text-soft);
          font-size: 11px;
        }

        .antimate-thinking-dots {
          display: flex;
          gap: 4px;
        }

        .antimate-thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--ai-accent-1);
          animation: antimateThinking 1.1s infinite;
        }

        .antimate-thinking-dots span:nth-child(2) {
          animation-delay: .15s;
        }

        .antimate-thinking-dots span:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes antimateThinking {
          0%, 70%, 100% {
            transform: translateY(0);
            opacity: .45;
          }

          35% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        /* =====================================================
           TRANSCRIPT
        ===================================================== */

        .antimate-transcript {
          margin: 0 0 11px;
          padding: 10px 13px;
          border: 1px solid var(--ai-border);
          background: var(--ai-surface);
          border-radius: 13px;
          color: var(--ai-text-soft);
          font-size: 11px;
        }

        .antimate-transcript strong {
          color: var(--ai-text);
          font-weight: 650;
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .antimate-error {
          margin-bottom: 10px;
          padding: 10px 13px;
          border: 1px solid rgba(255,101,124,.18);
          background: rgba(255,101,124,.07);
          color: var(--ai-danger);
          border-radius: 13px;
          font-size: 11px;
          line-height: 1.45;
        }

        /* =====================================================
           COMPOSER
        ===================================================== */

        .antimate-composer-area {
          position: sticky;
          bottom: 0;
          padding: 12px 0 23px;
          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--ai-bg) 22%
            );
        }

        .antimate-composer {
          width: 100%;
          position: relative;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 9px 9px 9px 16px;
          border-radius: 24px;
          border: 1px solid var(--ai-border);
          background:
            linear-gradient(
              145deg,
              var(--ai-surface-strong),
              var(--ai-surface)
            );
          box-shadow: var(--ai-shadow);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          transition:
            border-color .25s ease,
            box-shadow .25s ease;
        }

        .antimate-composer:focus-within {
          border-color: rgba(72,229,255,.28);
          box-shadow:
            0 25px 80px rgba(0,0,0,.25),
            0 0 0 3px rgba(72,229,255,.035);
        }

        .antimate-textarea {
          flex: 1;
          min-width: 0;
          min-height: 40px;
          max-height: 170px;
          resize: none;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--ai-text);
          font: inherit;
          font-size: 14px;
          line-height: 1.55;
          padding: 10px 4px;
        }

        .antimate-textarea::placeholder {
          color: var(--ai-text-faint);
        }

        .antimate-action {
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          border-radius: 15px;
          border: 0;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: #071018;
          background:
            linear-gradient(
              135deg,
              var(--ai-accent-1),
              #72c9ff 48%,
              var(--ai-accent-2)
            );
          box-shadow:
            0 8px 24px rgba(72,229,255,.18);
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            filter .2s ease;
          touch-action: manipulation;
        }

        .antimate-action:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow:
            0 12px 30px rgba(72,229,255,.24);
        }

        .antimate-action:active:not(:disabled) {
          transform: scale(.96);
        }

        .antimate-action:disabled {
          cursor: default;
          opacity: .65;
          filter: saturate(.65);
        }

        .antimate-action.recording {
          color: white;
          background:
            linear-gradient(
              135deg,
              #ff5e77,
              #ff4263
            );
          box-shadow:
            0 8px 30px rgba(255,76,103,.24);
          animation:
            antimateRecordPulse 1.5s infinite;
        }

        @keyframes antimateRecordPulse {
          0%, 100% {
            box-shadow:
              0 8px 30px rgba(255,76,103,.22);
          }

          50% {
            box-shadow:
              0 8px 38px rgba(255,76,103,.42);
          }
        }

        .antimate-action.live {
          color: white;
          background:
            linear-gradient(
              135deg,
              #8d63ff,
              #c354e8
            );
          box-shadow:
            0 8px 30px rgba(141,99,255,.24);
        }

        .antimate-action.processing {
          background: var(--ai-surface-strong);
          color: var(--ai-text);
          border: 1px solid var(--ai-border);
          box-shadow: none;
        }

        .antimate-action.playing {
          background:
            linear-gradient(
              135deg,
              var(--ai-accent-4),
              var(--ai-accent-1)
            );
        }

        /* =====================================================
           VOICE CONTROLS
           Only visible when input is empty.
        ===================================================== */

        .antimate-voice-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 11px;
        }

        .antimate-voice-button {
          min-height: 36px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 12px;
          border: 1px solid var(--ai-border);
          background: var(--ai-surface);
          color: var(--ai-text-soft);
          cursor: pointer;
          font-size: 10px;
          font-weight: 650;
          transition:
            transform .2s ease,
            background .2s ease,
            color .2s ease,
            border-color .2s ease;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .antimate-voice-button:hover {
          transform: translateY(-1px);
          color: var(--ai-text);
          background: var(--ai-surface-strong);
          border-color: var(--ai-border-strong);
        }

        .antimate-voice-button.recording {
          color: #ff7288;
          border-color: rgba(255,101,124,.25);
          background: rgba(255,101,124,.07);
        }

        .antimate-voice-button.live-active {
          color: #a990ff;
          border-color: rgba(141,99,255,.25);
          background: rgba(141,99,255,.08);
        }

        .antimate-countdown {
          min-width: 54px;
          text-align: center;
          font-variant-numeric: tabular-nums;
          font-weight: 750;
          color: #ff7187;
        }

        .antimate-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ff617a;
          animation: antimateLiveDot 1s infinite;
        }

        @keyframes antimateLiveDot {
          0%, 100% {
            opacity: .35;
            transform: scale(.8);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .antimate-live-wave {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 13px;
        }

        .antimate-live-wave span {
          width: 2px;
          border-radius: 4px;
          background: currentColor;
          animation: antimateWave .8s ease-in-out infinite;
        }

        .antimate-live-wave span:nth-child(1) {
          height: 5px;
        }

        .antimate-live-wave span:nth-child(2) {
          height: 10px;
          animation-delay: .12s;
        }

        .antimate-live-wave span:nth-child(3) {
          height: 13px;
          animation-delay: .24s;
        }

        .antimate-live-wave span:nth-child(4) {
          height: 8px;
          animation-delay: .36s;
        }

        @keyframes antimateWave {
          0%, 100% {
            transform: scaleY(.55);
          }

          50% {
            transform: scaleY(1);
          }
        }

        .antimate-composer-note {
          text-align: center;
          color: var(--ai-text-faint);
          font-size: 9px;
          margin-top: 8px;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .antimate-footer {
          text-align: center;
          padding: 0 0 14px;
          color: var(--ai-text-faint);
          font-size: 9px;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 700px) {
          .antimate-ai-shell {
            width: min(100% - 18px, 1120px);
          }

          .antimate-ai-header {
            height: 68px;
          }

          .antimate-brand-subtitle {
            display: none;
          }

          .antimate-status {
            padding: 7px 9px;
          }

          .antimate-status span:last-child {
            display: none;
          }

          .antimate-chat {
            min-height: calc(100vh - 68px);
          }

          .antimate-empty {
            padding-top: 25px;
          }

          .antimate-empty-logo {
            width: 76px;
            height: 76px;
            border-radius: 23px;
          }

          .antimate-empty-logo-inner {
            width: 63px;
            height: 63px;
            border-radius: 19px;
          }

          .antimate-empty-logo img {
            width: 49px;
            height: 49px;
          }

          .antimate-empty-title {
            font-size: 31px;
          }

          .antimate-empty-description {
            font-size: 13px;
          }

          .antimate-message {
            max-width: 88%;
            font-size: 13px;
          }

          .antimate-composer-area {
            padding-bottom: 13px;
          }

          .antimate-composer {
            border-radius: 21px;
            padding-left: 13px;
          }

          .antimate-action {
            width: 43px;
            height: 43px;
            flex-basis: 43px;
            border-radius: 14px;
          }

          .antimate-voice-controls {
            gap: 7px;
          }

          .antimate-voice-button {
            padding: 0 10px;
            font-size: 9px;
          }
        }

        @media (max-width: 430px) {
          .antimate-brand-title {
            font-size: 14px;
          }

          .antimate-logo-wrap {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
            border-radius: 13px;
          }

          .antimate-logo-inner {
            width: 33px;
            height: 33px;
          }

          .antimate-logo {
            width: 26px;
            height: 26px;
          }

          .antimate-theme-button {
            width: 35px;
            height: 35px;
          }

          .antimate-voice-button span.label {
            display: none;
          }

          .antimate-voice-button {
            width: 42px;
            padding: 0;
          }
        }

        /* =====================================================
           REDUCED MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="antimate-ai-page">
        <div className="antimate-ai-shell">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="antimate-ai-header">

            <div className="antimate-brand">

              <div className="antimate-logo-wrap">
                <div className="antimate-logo-inner">
                  <img
                    src={LOGO_SRC}
                    alt="ANTIMATE AI"
                    className="antimate-logo"
                    onError={(event) => {
                      /*
                       Do not replace your logo.
                       If path is wrong, keep the container
                       rather than injecting another logo.
                      */
                      event.currentTarget.style.opacity = "0";
                    }}
                  />
                </div>
              </div>

              <div className="antimate-brand-text">
                <div className="antimate-brand-title">
                  ANTIMATE AI
                </div>

                <div className="antimate-brand-subtitle">
                  Intelligent poultry & farm assistant
                </div>
              </div>

            </div>

            <div className="antimate-header-right">

              <div
                className={
                  "antimate-status " +
                  (socketConnected ? "connected" : "")
                }
              >
                <span className="antimate-status-dot" />

                <span>
                  {socketConnected
                    ? "Connected"
                    : "Connecting"}
                </span>

                <Icon.Wifi size={13} />
              </div>

              <button
                type="button"
                className="antimate-theme-button"
                onClick={toggleTheme}
                aria-label="Change theme"
                title={
                  theme === "dark"
                    ? "Light theme"
                    : "Dark theme"
                }
              >
                {theme === "dark" ? (
                  <Icon.Sun />
                ) : (
                  <Icon.Moon />
                )}
              </button>

            </div>

          </header>

          {/* =================================================
              MAIN
          ================================================= */}

          <main className="antimate-main">

            <div className="antimate-chat">

              {/* =================================================
                  EMPTY STATE
              ================================================= */}

              {messages.length === 0 ? (
                <section className="antimate-empty">

                  <div className="antimate-empty-content">

                    <div className="antimate-empty-logo">
                      <div className="antimate-empty-logo-inner">
                        <img
                          src={LOGO_SRC}
                          alt="ANTIMATE AI"
                          onError={(event) => {
                            event.currentTarget.style.opacity =
                              "0";
                          }}
                        />
                      </div>
                    </div>

                    <h1 className="antimate-empty-title">
                      Muraho, ndi{" "}
                      <span>ANTIMATE AI</span>
                    </h1>

                    <p className="antimate-empty-description">
                      Ndi umufasha wawe w'ubwenge ushobora
                      kugufasha gusobanukirwa amakuru ya
                      Smart Brooder, inkoko, sensors,
                      environment n'ibindi bibazo bijyanye
                      n'ubworozi.
                    </p>

                    <div className="antimate-empty-hint">
                      <Icon.Spark size={14} />
                      Andika cyangwa ukoreshe ijwi
                    </div>

                  </div>

                </section>
              ) : (

                /* =================================================
                   MESSAGES
                ================================================= */

                <div className="antimate-messages">

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        "antimate-message-row " +
                        message.role
                      }
                    >

                      <div
                        className={
                          "antimate-message " +
                          message.role +
                          (message.streaming
                            ? " antimate-message-streaming"
                            : "")
                        }
                      >

                        {message.role === "assistant" && (
                          <div className="antimate-message-label">
                            <img
                              src={LOGO_SRC}
                              alt=""
                              className="antimate-mini-logo"
                            />
                            ANTIMATE AI
                          </div>
                        )}

                        <div className="antimate-message-text">
                          {message.text}
                        </div>

                        {message.role === "assistant" &&
                          message.voiceUrl &&
                          !message.streaming && (
                            <button
                              type="button"
                              className="antimate-replay"
                              onClick={() =>
                                replayAudio(
                                  message.voiceUrl
                                )
                              }
                              disabled={isPlaying}
                            >
                              <Icon.Rotate size={15} />

                              <span>
                                Replay voice
                              </span>
                            </button>
                          )}

                      </div>

                    </div>
                  ))}

                  {/* THINKING */}

                  {isProcessing &&
                    !currentAnswer && (
                      <div className="antimate-thinking">
                        <div className="antimate-thinking-dots">
                          <span />
                          <span />
                          <span />
                        </div>

                        <span>
                          ANTIMATE iratekereza...
                        </span>
                      </div>
                    )}

                </div>
              )}

              {/* =================================================
                  COMPOSER
              ================================================= */}

              <div className="antimate-composer-area">

                {/* TRANSCRIPT */}

                {transcript && (
                  <div className="antimate-transcript">
                    <strong>Wavuze:</strong>{" "}
                    {transcript}
                  </div>
                )}

                {/* ERROR */}

                {error && (
                  <div className="antimate-error">
                    {error}
                  </div>
                )}

                <div className="antimate-composer">

                  <textarea
                    ref={textareaRef}
                    className="antimate-textarea"
                    value={text}
                    onChange={(event) => {
                      setText(event.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isRecording
                        ? recordMode === "live"
                          ? "Vuga... ANTIMATE irakumva."
                          : `Recording... ${formatTime(
                              recordSeconds
                            )}`
                        : "Andika ubutumwa..."
                    }
                    rows={1}
                    disabled={
                      isProcessing ||
                      isRecording ||
                      isPlaying
                    }
                  />

                  {/* =================================================
                      SINGLE CONTEXTUAL BUTTON
                  ================================================= */}

                  <button
                    type="button"
                    className={
                      "antimate-action " +
                      (isRecording
                        ? "recording "
                        : "") +
                      (recordMode === "live"
                        ? "live "
                        : "") +
                      (isProcessing
                        ? "processing "
                        : "") +
                      (isPlaying
                        ? "playing"
                        : "")
                    }
                    onClick={handleMainAction}
                    disabled={
                      isProcessing ||
                      isPlaying
                    }
                    aria-label={
                      actionType === "send"
                        ? "Send message"
                        : actionType === "stop"
                        ? "Stop recording"
                        : actionType === "playing"
                        ? "Playing answer"
                        : actionType === "processing"
                        ? "Processing"
                        : "Record voice"
                    }
                  >

                    {actionType === "send" && (
                      <Icon.Send />
                    )}

                    {actionType === "mic" && (
                      <Icon.Mic />
                    )}

                    {actionType === "stop" && (
                      <Icon.Stop />
                    )}

                    {actionType === "playing" && (
                      <Icon.Volume />
                    )}

                    {actionType === "processing" && (
                      <div className="antimate-thinking-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    )}

                  </button>

                </div>

                {/* =================================================
                    VOICE BUTTONS
                    Visible only when text is empty.
                ================================================= */}

                {!text.trim() && (
                  <div className="antimate-voice-controls">

                    {/* RECORD */}

                    <button
                      type="button"
                      className={
                        "antimate-voice-button " +
                        (isRecording &&
                        recordMode === "record"
                          ? "recording"
                          : "")
                      }
                      onClick={handleRecord}
                      disabled={
                        isProcessing ||
                        isPlaying ||
                        (isRecording &&
                          recordMode === "live")
                      }
                    >

                      {isRecording &&
                      recordMode === "record" ? (
                        <>
                          <span className="antimate-live-dot" />

                          <span className="antimate-countdown">
                            {formatTime(recordSeconds)}
                          </span>

                          <span className="label">
                            Stop
                          </span>
                        </>
                      ) : (
                        <>
                          <Icon.Mic size={15} />

                          <span className="label">
                            Record
                          </span>

                          <span>
                            30s
                          </span>
                        </>
                      )}

                    </button>

                    {/* LIVE VOICE */}

                    <button
                      type="button"
                      className={
                        "antimate-voice-button " +
                        (recordMode === "live"
                          ? "live-active"
                          : "")
                      }
                      onClick={handleLiveVoice}
                      disabled={
                        isProcessing ||
                        isPlaying ||
                        (isRecording &&
                          recordMode === "record")
                      }
                    >

                      {recordMode === "live" ? (
                        <>
                          <span className="antimate-live-wave">
                            <span />
                            <span />
                            <span />
                            <span />
                          </span>

                          <span className="label">
                            Live ON
                          </span>
                        </>
                      ) : (
                        <>
                          <Icon.Mic size={15} />

                          <span className="label">
                            Live Voice
                          </span>
                        </>
                      )}

                    </button>

                  </div>
                )}

                <div className="antimate-composer-note">
                  {isRecording &&
                  recordMode === "record"
                    ? `Recording • ${formatTime(
                        recordSeconds
                      )} remaining`
                    : recordMode === "live"
                    ? "Live voice • silence 1.8s → send automatically"
                    : text.trim()
                    ? "Enter to send • Shift + Enter for new line"
                    : "Record ≤ 30s • Live Voice listens automatically"}
                </div>

              </div>

              <footer className="antimate-footer">
                ANTIMATE AI may occasionally make mistakes.
              </footer>

            </div>

          </main>

        </div>
      </div>
    </>
  );
}