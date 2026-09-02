// ============================================================
// ANTIMATE AI — PROFESSIONAL GLASSMORPHISM UI
// Single-file JSX + Native CSS
//
// FEATURES
// ------------------------------------------------------------
// • Glassmorphism AI chat interface
// • Animated ANTIMATE AI O/Cycle logo
// • 30-second normal voice recording
// • Live voice mode
// • 1.8s silence auto-send
// • Mic automatically re-opens after AI audio finishes
// • Text mode replaces voice controls with ONE Send button
// • Socket.IO voice streaming
// • HTTP text chat
// • Kinyarwanda / English friendly
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

const CHAT_URL = `${API_URL}/api/antimate/chat`;

// ============================================================
// CONSTANTS
// ============================================================

const MAX_RECORD_SECONDS = 30;
const SILENCE_DURATION = 1800;
const LIVE_SILENCE_THRESHOLD = 0.018;

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
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="13" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
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
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
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

function VolumeIcon({ size = 21 }) {
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
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function ChevronDownIcon({ size = 15 }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ============================================================
// ANTIMATE AI LOGO
// ============================================================

function AntimateLogo({ small = false }) {
  return (
    <div
      className={`antimate-logo-wrap ${
        small ? "antimate-logo-small" : ""
      }`}
    >
      <div className="antimate-logo-ring">
        <div className="antimate-logo-core">
          <span />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// THINKING DOTS
// ============================================================

function ThinkingDots() {
  return (
    <div className="thinking-dots">
      <span />
      <span />
      <span />
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AntimateAI() {
  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [isLiveVoice, setIsLiveVoice] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const [socketConnected, setSocketConnected] = useState(false);

  const [recordSeconds, setRecordSeconds] = useState(
    MAX_RECORD_SECONDS
  );

  const [liveListening, setLiveListening] = useState(false);

  const [transcript, setTranscript] = useState("");

  const [error, setError] = useState("");

  const [currentAnswer, setCurrentAnswer] = useState("");

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const audioChunksRef = useRef([]);

  const timerRef = useRef(null);

  const silenceTimerRef = useRef(null);

  const analyserRef = useRef(null);

  const audioContextRef = useRef(null);

  const silenceAnimationRef = useRef(null);

  const textareaRef = useRef(null);

  const bottomRef = useRef(null);

  const audioRef = useRef(null);

  const currentAnswerRef = useRef("");

  const isPlayingRef = useRef(false);

  const liveVoiceRef = useRef(false);

  const liveListeningRef = useRef(false);

  const manuallyStoppedRef = useRef(false);

  // ==========================================================
  // KEEP REFS SYNCHRONIZED
  // ==========================================================

  useEffect(() => {
    currentAnswerRef.current = currentAnswer;
  }, [currentAnswer]);

  useEffect(() => {
    liveVoiceRef.current = isLiveVoice;
  }, [isLiveVoice]);

  useEffect(() => {
    liveListeningRef.current = liveListening;
  }, [liveListening]);

  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, currentAnswer]);

  // ==========================================================
  // AUTO RESIZE TEXTAREA
  // ==========================================================

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      160
    )}px`;
  }, [text]);

  // ==========================================================
  // STOP MEDIA TRACKS
  // ==========================================================

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }

      audioContextRef.current = null;
    }

    analyserRef.current = null;

    if (silenceAnimationRef.current) {
      cancelAnimationFrame(
        silenceAnimationRef.current
      );

      silenceAnimationRef.current = null;
    }
  }, []);

  // ==========================================================
  // CLEAR RECORD TIMER
  // ==========================================================

  const clearRecordTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ==========================================================
  // CLEAR SILENCE TIMER
  // ==========================================================

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // ==========================================================
  // FINISH AUDIO PLAYBACK
  // ==========================================================

  const finishPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);

    // --------------------------------------------------------
    // IMPORTANT:
    // Live mode automatically re-opens microphone after
    // response audio has finished.
    // --------------------------------------------------------

    if (liveVoiceRef.current && !manuallyStoppedRef.current) {
      setTimeout(() => {
        if (!liveVoiceRef.current) return;

        startLiveListening();
      }, 350);
    }
  }, []);

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const playAudio = useCallback(
    async (url) => {
      if (!url) return;

      try {
        let finalUrl = url;

        if (typeof url === "string") {
          if (url.startsWith("/")) {
            finalUrl = `${API_URL}${url}`;
          } else if (
            !url.startsWith("http://") &&
            !url.startsWith("https://") &&
            !url.startsWith("blob:")
          ) {
            finalUrl = `${API_URL}/${url}`;
          }
        }

        if (audioRef.current) {
          try {
            audioRef.current.pause();
          } catch {
            // ignore
          }
        }

        const audio = new Audio(finalUrl);

        audioRef.current = audio;

        isPlayingRef.current = true;
        setIsPlaying(true);

        audio.onended = finishPlayback;

        audio.onerror = () => {
          finishPlayback();
        };

        await audio.play();
      } catch (err) {
        console.error("Audio playback error:", err);

        finishPlayback();
      }
    },
    [finishPlayback]
  );

  // ==========================================================
  // ADD USER MESSAGE
  // ==========================================================

  const addUserMessage = useCallback((content) => {
    if (!content?.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        role: "user",
        content: content.trim(),
      },
    ]);
  }, []);

  // ==========================================================
  // ADD ASSISTANT MESSAGE
  // ==========================================================

  const addAssistantMessage = useCallback((content) => {
    if (!content?.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: content.trim(),
      },
    ]);
  }, []);

  // ==========================================================
  // SOCKET.IO CONNECTION
  // ==========================================================

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "🔌 ANTIMATE Socket connected:",
        socket.id
      );

      setSocketConnected(true);
      setError("");
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "🔌 ANTIMATE Socket disconnected:",
        reason
      );

      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error(
        "Socket connection error:",
        err
      );

      setSocketConnected(false);
    });

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    socket.on("antimate:status", (data) => {
      console.log("ANTIMATE STATUS:", data);
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

      setCurrentAnswer((prev) => {
        const next = prev + chunk;

        currentAnswerRef.current = next;

        return next;
      });
    });

    // --------------------------------------------------------
    // COMPLETE ANSWER
    // --------------------------------------------------------

    socket.on("antimate:answer", (data) => {
      const answer =
        typeof data === "string"
          ? data
          : data?.answer ||
            data?.text ||
            "";

      if (!answer) return;

      currentAnswerRef.current = answer;

      setCurrentAnswer(answer);
    });

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    socket.on("antimate:audio", (data) => {
      const audioUrl =
        typeof data === "string"
          ? data
          : data?.url ||
            data?.audio ||
            data?.audioUrl ||
            data?.path ||
            "";

      if (audioUrl) {
        playAudio(audioUrl);
      }
    });

    // --------------------------------------------------------
    // COMPLETE
    // --------------------------------------------------------

    socket.on("antimate:complete", (data) => {
      const answer =
        currentAnswerRef.current ||
        (typeof data === "string"
          ? data
          : data?.answer ||
            data?.text ||
            "");

      if (answer?.trim()) {
        addAssistantMessage(answer);
      }

      currentAnswerRef.current = "";

      setCurrentAnswer("");
      setIsProcessing(false);
      setTranscript("");
    });

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    socket.on("antimate:error", (data) => {
      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            "Habaye ikibazo mu gusubiza.";

      console.error(
        "ANTIMATE SOCKET ERROR:",
        message
      );

      setError(message);

      setIsProcessing(false);
      setCurrentAnswer("");
      setTranscript("");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [addAssistantMessage, playAudio]);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      clearRecordTimer();
      clearSilenceTimer();

      stopMediaTracks();

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // ignore
        }
      }
    };
  }, [
    clearRecordTimer,
    clearSilenceTimer,
    stopMediaTracks,
  ]);

  // ==========================================================
  // SEND TEXT
  // ==========================================================

  const sendText = useCallback(async () => {
    const message = text.trim();

    if (!message) return;

    if (isProcessing) return;

    setError("");

    setText("");

    addUserMessage(message);

    setIsProcessing(true);

    setCurrentAnswer("");

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        data?.text ||
        "";

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruje igisubizo."
        );
      }

      addAssistantMessage(answer);

      if (data?.audio || data?.audioUrl) {
        await playAudio(
          data.audio || data.audioUrl
        );
      }
    } catch (err) {
      console.error("Text chat error:", err);

      setError(
        err?.message ||
          "Habaye ikibazo. Ongera ugerageze."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    text,
    isProcessing,
    addUserMessage,
    addAssistantMessage,
    playAudio,
  ]);

  // ==========================================================
  // NORMAL RECORDING — START
  // ==========================================================

  const startNormalRecording = useCallback(
    async () => {
      if (isRecording || isProcessing) return;

      if (!socketRef.current || !socketConnected) {
        setError(
          "Voice connection ntirarangira. Ongera ugerageze."
        );

        return;
      }

      setError("");

      manuallyStoppedRef.current = false;

      audioChunksRef.current = [];

      setRecordSeconds(MAX_RECORD_SECONDS);

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

        mediaStreamRef.current = stream;

        const mimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
        ];

        const supportedMime =
          mimeTypes.find((type) =>
            MediaRecorder.isTypeSupported(type)
          ) || "";

        const recorder = new MediaRecorder(
          stream,
          supportedMime
            ? { mimeType: supportedMime }
            : undefined
        );

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (!event.data || event.data.size === 0) {
            return;
          }

          audioChunksRef.current.push(event.data);

          if (
            socketRef.current &&
            socketConnected
          ) {
            socketRef.current.emit(
              "antimate:voice:chunk",
              event.data
            );
          }
        };

        recorder.onstop = () => {
          stopMediaTracks();

          setIsRecording(false);

          clearRecordTimer();

          if (
            !manuallyStoppedRef.current &&
            socketRef.current
          ) {
            socketRef.current.emit(
              "antimate:voice:end"
            );
          }
        };

        recorder.onerror = (event) => {
          console.error(
            "MediaRecorder error:",
            event
          );

          setError(
            "Recording yanze gukora."
          );

          setIsRecording(false);

          stopMediaTracks();

          clearRecordTimer();
        };

        socketRef.current.emit(
          "antimate:voice:start",
          {
            mode: "record",
            maxDuration: MAX_RECORD_SECONDS,
          }
        );

        recorder.start(250);

        setIsRecording(true);

        // ------------------------------------------------------
        // 30 SECOND COUNTDOWN
        // ------------------------------------------------------

        let remaining = MAX_RECORD_SECONDS;

        timerRef.current = setInterval(() => {
          remaining -= 1;

          setRecordSeconds(remaining);

          if (remaining <= 0) {
            clearRecordTimer();

            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !==
                "inactive"
            ) {
              mediaRecorderRef.current.stop();
            }
          }
        }, 1000);
      } catch (err) {
        console.error(
          "Microphone error:",
          err
        );

        setError(
          "Ntibyashobotse gufungura microphone. Reba microphone permission."
        );

        setIsRecording(false);

        stopMediaTracks();
      }
    },
    [
      isRecording,
      isProcessing,
      socketConnected,
      clearRecordTimer,
      stopMediaTracks,
    ]
  );

  // ==========================================================
  // NORMAL RECORDING — STOP
  // ==========================================================

  const stopNormalRecording = useCallback(() => {
    clearRecordTimer();

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      manuallyStoppedRef.current = true;

      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  }, [clearRecordTimer]);

  // ==========================================================
  // SILENCE DETECTION
  // ==========================================================

  const monitorSilence = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;

    const bufferLength = analyser.fftSize;

    const dataArray = new Uint8Array(
      bufferLength
    );

    let silenceStartedAt = null;

    const check = () => {
      if (!liveVoiceRef.current) return;

      if (!liveListeningRef.current) return;

      analyser.getByteTimeDomainData(
        dataArray
      );

      let sum = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const normalized =
          (dataArray[i] - 128) / 128;

        sum += normalized * normalized;
      }

      const rms = Math.sqrt(
        sum / dataArray.length
      );

      const silent =
        rms < LIVE_SILENCE_THRESHOLD;

      if (silent) {
        if (!silenceStartedAt) {
          silenceStartedAt = Date.now();
        }

        if (
          Date.now() - silenceStartedAt >=
          SILENCE_DURATION
        ) {
          stopLiveListening(true);

          return;
        }
      } else {
        silenceStartedAt = null;
      }

      silenceAnimationRef.current =
        requestAnimationFrame(check);
    };

    check();
  }, []);

  // ==========================================================
  // LIVE VOICE — START LISTENING
  // ==========================================================

  const startLiveListening = useCallback(
    async () => {
      if (!liveVoiceRef.current) return;

      if (isPlayingRef.current) return;

      if (isProcessing) return;

      if (
        !socketRef.current ||
        !socketConnected
      ) {
        setError(
          "Live voice connection ntiraboneka."
        );

        return;
      }

      clearSilenceTimer();

      stopMediaTracks();

      audioChunksRef.current = [];

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

        mediaStreamRef.current = stream;

        const mimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
        ];

        const supportedMime =
          mimeTypes.find((type) =>
            MediaRecorder.isTypeSupported(type)
          ) || "";

        const recorder = new MediaRecorder(
          stream,
          supportedMime
            ? { mimeType: supportedMime }
            : undefined
        );

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (!event.data || event.data.size === 0) {
            return;
          }

          audioChunksRef.current.push(event.data);

          if (
            socketRef.current &&
            socketConnected
          ) {
            socketRef.current.emit(
              "antimate:voice:chunk",
              event.data
            );
          }
        };

        recorder.onstop = () => {
          stopMediaTracks();

          setLiveListening(false);

          liveListeningRef.current = false;

          if (
            socketRef.current &&
            !manuallyStoppedRef.current
          ) {
            socketRef.current.emit(
              "antimate:voice:end"
            );
          }
        };

        socketRef.current.emit(
          "antimate:voice:start",
          {
            mode: "live",
            silenceDuration: SILENCE_DURATION,
          }
        );

        recorder.start(250);

        setLiveListening(true);

        liveListeningRef.current = true;

        // Start silence monitor after mic opens.
        setTimeout(() => {
          if (
            liveVoiceRef.current &&
            liveListeningRef.current
          ) {
            try {
              const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

              if (!AudioContext) return;

              const audioContext =
                new AudioContext();

              audioContextRef.current =
                audioContext;

              const source =
                audioContext.createMediaStreamSource(
                  stream
                );

              const analyser =
                audioContext.createAnalyser();

              analyser.fftSize = 2048;

              source.connect(analyser);

              analyserRef.current =
                analyser;

              monitorSilence();
            } catch (err) {
              console.warn(
                "Silence detection unavailable:",
                err
              );
            }
          }
        }, 150);
      } catch (err) {
        console.error(
          "Live microphone error:",
          err
        );

        setError(
          "Ntibyashobotse gufungura microphone ya Live Voice."
        );

        setLiveListening(false);

        liveListeningRef.current = false;

        stopMediaTracks();
      }
    },
    [
      isProcessing,
      socketConnected,
      clearSilenceTimer,
      stopMediaTracks,
      monitorSilence,
    ]
  );

  // ==========================================================
  // LIVE VOICE — STOP
  // ==========================================================

  const stopLiveListening = useCallback(
    (autoSend = false) => {
      clearSilenceTimer();

      if (silenceAnimationRef.current) {
        cancelAnimationFrame(
          silenceAnimationRef.current
        );

        silenceAnimationRef.current = null;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {
        manuallyStoppedRef.current =
          !autoSend;

        mediaRecorderRef.current.stop();
      }

      setLiveListening(false);

      liveListeningRef.current = false;
    },
    [clearSilenceTimer]
  );

  // ==========================================================
  // TOGGLE LIVE VOICE
  // ==========================================================

  const toggleLiveVoice = useCallback(() => {
    setError("");

    if (isPlayingRef.current) {
      return;
    }

    if (isProcessing) {
      return;
    }

    if (isLiveVoice) {
      manuallyStoppedRef.current = true;

      stopLiveListening(false);

      setIsLiveVoice(false);

      liveVoiceRef.current = false;

      return;
    }

    setIsLiveVoice(true);

    liveVoiceRef.current = true;

    manuallyStoppedRef.current = false;

    setTimeout(() => {
      if (liveVoiceRef.current) {
        startLiveListening();
      }
    }, 100);
  }, [
    isLiveVoice,
    isProcessing,
    stopLiveListening,
    startLiveListening,
  ]);

  // ==========================================================
  // RECORD BUTTON
  // ==========================================================

  const handleRecordButton = useCallback(() => {
    if (isProcessing || isPlaying) return;

    if (isRecording) {
      stopNormalRecording();
      return;
    }

    startNormalRecording();
  }, [
    isProcessing,
    isPlaying,
    isRecording,
    stopNormalRecording,
    startNormalRecording,
  ]);

  // ==========================================================
  // KEYBOARD
  // ==========================================================

  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        sendText();
      }
    },
    [sendText]
  );

  // ==========================================================
  // CLEAR ERROR WHEN USER TYPES
  // ==========================================================

  const handleTextChange = (event) => {
    setText(event.target.value);

    if (error) {
      setError("");
    }
  };

  // ==========================================================
  // DETERMINE COMPOSER MODE
  // ==========================================================

  const hasText = text.trim().length > 0;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <style>{`
        /* ====================================================
           ANTIMATE AI — NATIVE CSS
           ==================================================== */

        * {
          box-sizing: border-box;
        }

        :root {
          --bg-main: #060914;
          --bg-secondary: #0b1020;

          --glass: rgba(255, 255, 255, 0.055);
          --glass-strong: rgba(255, 255, 255, 0.085);

          --border: rgba(255, 255, 255, 0.105);

          --text: #f5f7fb;
          --muted: #8d96aa;

          --accent-1: #8b5cf6;
          --accent-2: #06b6d4;
          --accent-3: #ec4899;

          --user-message:
            linear-gradient(
              135deg,
              rgba(139, 92, 246, 0.92),
              rgba(79, 70, 229, 0.92)
            );
        }

        body {
          margin: 0;
          background:
            radial-gradient(
              circle at 15% 15%,
              rgba(124, 58, 237, 0.13),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 20%,
              rgba(6, 182, 212, 0.11),
              transparent 28%
            ),
            radial-gradient(
              circle at 50% 100%,
              rgba(236, 72, 153, 0.07),
              transparent 35%
            ),
            var(--bg-main);

          color: var(--text);

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

        /* ====================================================
           PAGE
           ==================================================== */

        .antimate-page {
          min-height: 100vh;
          width: 100%;

          position: relative;

          overflow: hidden;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.015),
              transparent 35%
            );
        }

        .antimate-page::before {
          content: "";

          position: absolute;

          width: 460px;
          height: 460px;

          left: -220px;
          top: 20%;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(139,92,246,0.12),
              transparent 70%
            );

          filter: blur(10px);

          pointer-events: none;
        }

        .antimate-page::after {
          content: "";

          position: absolute;

          width: 420px;
          height: 420px;

          right: -200px;
          bottom: 10%;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(6,182,212,0.10),
              transparent 70%
            );

          filter: blur(10px);

          pointer-events: none;
        }

        /* ====================================================
           HEADER
           ==================================================== */

        .antimate-header {
          height: 76px;

          width: 100%;

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding:
            0
            clamp(18px, 4vw, 48px);

          border-bottom:
            1px solid
            rgba(255,255,255,0.055);

          background:
            rgba(6,9,20,0.62);

          backdrop-filter:
            blur(24px);

          -webkit-backdrop-filter:
            blur(24px);

          position: relative;

          z-index: 20;
        }

        .antimate-brand {
          display: flex;

          align-items: center;

          gap: 12px;

          min-width: 0;
        }

        .antimate-brand-text {
          display: flex;

          flex-direction: column;

          gap: 1px;
        }

        .antimate-brand-name {
          font-size: 15px;

          font-weight: 700;

          letter-spacing: 0.05em;

          white-space: nowrap;
        }

        .antimate-brand-subtitle {
          font-size: 10px;

          color: var(--muted);

          letter-spacing: 0.09em;

          text-transform: uppercase;

          white-space: nowrap;
        }

        /* ====================================================
           LOGO
           ==================================================== */

        .antimate-logo-wrap {
          width: 42px;
          height: 42px;

          display: grid;

          place-items: center;

          flex: 0 0 auto;
        }

        .antimate-logo-ring {
          width: 38px;
          height: 38px;

          border-radius: 50%;

          position: relative;

          display: grid;

          place-items: center;

          background:
            conic-gradient(
              from 0deg,
              #8b5cf6,
              #06b6d4,
              #22d3ee,
              #ec4899,
              #8b5cf6
            );

          animation:
            antimateSpin 5s linear infinite;

          box-shadow:
            0 0 20px
            rgba(139,92,246,0.22);
        }

        .antimate-logo-ring::before {
          content: "";

          position: absolute;

          inset: 3px;

          border-radius: 50%;

          background: var(--bg-main);
        }

        .antimate-logo-core {
          width: 20px;
          height: 20px;

          border-radius: 50%;

          position: relative;

          z-index: 2;

          display: grid;

          place-items: center;

          background:
            radial-gradient(
              circle at 35% 30%,
              #ffffff,
              rgba(255,255,255,0.8) 12%,
              rgba(139,92,246,0.45) 40%,
              rgba(6,182,212,0.35) 70%,
              transparent 72%
            );

          box-shadow:
            0 0 15px
            rgba(6,182,212,0.35);
        }

        .antimate-logo-core span {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #ffffff;

          box-shadow:
            0 0 10px #ffffff;

          animation:
            antimatePulse 2s ease-in-out infinite;
        }

        .antimate-logo-small {
          transform: scale(0.82);
        }

        @keyframes antimateSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes antimatePulse {
          0%,
          100% {
            transform: scale(0.75);
            opacity: 0.65;
          }

          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        /* ====================================================
           CONNECTION
           ==================================================== */

        .antimate-connection {
          display: flex;

          align-items: center;

          gap: 7px;

          color: var(--muted);

          font-size: 11px;

          padding: 7px 11px;

          border-radius: 999px;

          background:
            rgba(255,255,255,0.035);

          border:
            1px solid
            rgba(255,255,255,0.06);
        }

        .connection-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #64748b;

          box-shadow: 0 0 0 transparent;

          transition:
            background 0.25s ease,
            box-shadow 0.25s ease;
        }

        .connection-dot.online {
          background: #22c55e;

          box-shadow:
            0 0 10px
            rgba(34,197,94,0.7);
        }

        /* ====================================================
           CHAT AREA
           ==================================================== */

        .antimate-main {
          width: min(
            940px,
            calc(100% - 30px)
          );

          height:
            calc(100vh - 76px);

          margin: 0 auto;

          display: flex;

          flex-direction: column;

          position: relative;

          z-index: 5;
        }

        .antimate-chat {
          flex: 1;

          min-height: 0;

          overflow-y: auto;

          padding:
            34px
            4px
            170px;

          scrollbar-width: thin;

          scrollbar-color:
            rgba(255,255,255,0.13)
            transparent;
        }

        .antimate-chat::-webkit-scrollbar {
          width: 5px;
        }

        .antimate-chat::-webkit-scrollbar-track {
          background: transparent;
        }

        .antimate-chat::-webkit-scrollbar-thumb {
          background:
            rgba(255,255,255,0.12);

          border-radius: 10px;
        }

        /* ====================================================
           EMPTY STATE
           ==================================================== */

        .antimate-empty {
          min-height:
            calc(100vh - 290px);

          display: flex;

          align-items: center;

          justify-content: center;

          flex-direction: column;

          text-align: center;

          padding: 40px 20px;
        }

        .antimate-empty-logo {
          margin-bottom: 22px;

          transform: scale(1.55);
        }

        .antimate-empty-title {
          margin: 0;

          font-size:
            clamp(25px, 5vw, 38px);

          font-weight: 650;

          letter-spacing: -0.04em;
        }

        .antimate-empty-title span {
          background:
            linear-gradient(
              90deg,
              #ffffff,
              #b9c3d7
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;
        }

        .antimate-empty-subtitle {
          max-width: 540px;

          margin:
            12px
            auto
            0;

          color: var(--muted);

          line-height: 1.65;

          font-size: 14px;
        }

        .antimate-empty-hint {
          margin-top: 20px;

          color:
            rgba(255,255,255,0.40);

          font-size: 11px;
        }

        /* ====================================================
           MESSAGE
           ==================================================== */

        .message-row {
          width: 100%;

          display: flex;

          margin-bottom: 22px;

          animation:
            messageAppear 0.28s ease both;
        }

        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(8px);
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
          display: flex;

          align-items: flex-end;

          gap: 9px;

          max-width: min(
            78%,
            720px
          );
        }

        .message-row.user
        .message-content-wrap {
          flex-direction: row-reverse;
        }

        .assistant-avatar {
          width: 29px;
          height: 29px;

          flex: 0 0 auto;

          display: grid;

          place-items: center;

          border-radius: 50%;

          background:
            rgba(255,255,255,0.045);

          border:
            1px solid
            rgba(255,255,255,0.09);
        }

        .message-bubble {
          padding:
            13px
            16px;

          border-radius: 19px;

          font-size: 14px;

          line-height: 1.65;

          white-space: pre-wrap;

          word-break: break-word;
        }

        .message-row.user
        .message-bubble {
          background: var(--user-message);

          border-bottom-right-radius: 6px;

          box-shadow:
            0 10px 30px
            rgba(79,70,229,0.15);
        }

        .message-row.assistant
        .message-bubble {
          background:
            rgba(255,255,255,0.045);

          border:
            1px solid
            rgba(255,255,255,0.075);

          border-bottom-left-radius: 6px;

          backdrop-filter:
            blur(15px);

          -webkit-backdrop-filter:
            blur(15px);
        }

        /* ====================================================
           LIVE ANSWER
           ==================================================== */

        .live-answer {
          display: flex;

          align-items: flex-end;

          gap: 9px;

          margin-bottom: 22px;
        }

        .live-answer-bubble {
          max-width:
            min(78%, 720px);

          padding:
            13px
            16px;

          border-radius: 19px;

          border-bottom-left-radius: 6px;

          background:
            rgba(255,255,255,0.045);

          border:
            1px solid
            rgba(255,255,255,0.075);

          line-height: 1.65;

          font-size: 14px;
        }

        /* ====================================================
           THINKING
           ==================================================== */

        .thinking-message {
          display: flex;

          align-items: flex-end;

          gap: 9px;

          margin-bottom: 22px;
        }

        .thinking-bubble {
          display: flex;

          align-items: center;

          gap: 9px;

          padding:
            12px
            15px;

          border-radius: 18px;

          border-bottom-left-radius: 6px;

          background:
            rgba(255,255,255,0.04);

          border:
            1px solid
            rgba(255,255,255,0.065);
        }

        .thinking-label {
          color: var(--muted);

          font-size: 11px;
        }

        .thinking-dots {
          display: flex;

          gap: 4px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;

          border-radius: 50%;

          background:
            rgba(255,255,255,0.65);

          animation:
            thinkingBounce 1.2s
            infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.30s;
        }

        @keyframes thinkingBounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }

          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        /* ====================================================
           TRANSCRIPT
           ==================================================== */

        .transcript-card {
          margin:
            0
            auto
            15px;

          max-width: 720px;

          padding:
            9px
            13px;

          border-radius: 12px;

          color:
            rgba(255,255,255,0.58);

          background:
            rgba(255,255,255,0.025);

          border:
            1px solid
            rgba(255,255,255,0.055);

          font-size: 11px;
        }

        .transcript-label {
          color:
            rgba(255,255,255,0.35);

          margin-right: 6px;
        }

        /* ====================================================
           ERROR
           ==================================================== */

        .antimate-error {
          width: 100%;

          padding:
            10px
            13px;

          margin-bottom: 10px;

          border-radius: 12px;

          background:
            rgba(239,68,68,0.07);

          border:
            1px solid
            rgba(239,68,68,0.14);

          color:
            #fca5a5;

          font-size: 11px;

          text-align: center;
        }

        /* ====================================================
           COMPOSER AREA
           ==================================================== */

        .composer-zone {
          position: absolute;

          left: 0;
          right: 0;

          bottom: 22px;

          z-index: 30;

          padding:
            0 0 5px;
        }

        .composer-zone::before {
          content: "";

          position: absolute;

          left: -30px;
          right: -30px;

          bottom: -22px;

          height: 150px;

          pointer-events: none;

          background:
            linear-gradient(
              to top,
              var(--bg-main) 15%,
              rgba(6,9,20,0.90) 55%,
              transparent
            );
        }

        .composer-content {
          position: relative;

          z-index: 2;
        }

        /* ====================================================
           COMPOSER
           ==================================================== */

        .composer {
          width: 100%;

          min-height: 70px;

          display: flex;

          align-items: flex-end;

          gap: 10px;

          padding:
            10px
            10px
            10px
            17px;

          border-radius: 23px;

          background:
            rgba(18,23,39,0.76);

          border:
            1px solid
            rgba(255,255,255,0.10);

          box-shadow:
            0 20px 60px
            rgba(0,0,0,0.38),
            inset 0 1px 0
            rgba(255,255,255,0.035);

          backdrop-filter:
            blur(28px);

          -webkit-backdrop-filter:
            blur(28px);

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .composer:focus-within {
          border-color:
            rgba(139,92,246,0.28);

          box-shadow:
            0 20px 60px
            rgba(0,0,0,0.40),
            0 0 0 3px
            rgba(139,92,246,0.045);
        }

        .composer textarea {
          flex: 1;

          min-width: 0;

          min-height: 45px;

          max-height: 160px;

          resize: none;

          border: 0;

          outline: 0;

          background: transparent;

          color: var(--text);

          padding:
            11px
            0;

          line-height: 1.5;

          font-size: 14px;

          scrollbar-width: thin;
        }

        .composer textarea::placeholder {
          color:
            rgba(255,255,255,0.30);
        }

        /* ====================================================
           SINGLE ACTION BUTTON
           ==================================================== */

        .composer-action {
          width: 48px;
          height: 48px;

          flex: 0 0 48px;

          border: 0;

          border-radius: 16px;

          display: grid;

          place-items: center;

          cursor: pointer;

          color: #ffffff;

          position: relative;

          overflow: hidden;

          background:
            linear-gradient(
              135deg,
              #8b5cf6,
              #6366f1,
              #06b6d4
            );

          box-shadow:
            0 8px 25px
            rgba(99,102,241,0.27);

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            filter 0.18s ease;
        }

        .composer-action::before {
          content: "";

          position: absolute;

          inset: -40%;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.23),
              transparent
            );

          transform:
            translateX(-100%)
            rotate(20deg);

          transition:
            transform 0.5s ease;
        }

        .composer-action:hover::before {
          transform:
            translateX(100%)
            rotate(20deg);
        }

        .composer-action:hover {
          transform: translateY(-2px);

          box-shadow:
            0 12px 30px
            rgba(99,102,241,0.36);
        }

        .composer-action:active {
          transform: scale(0.95);
        }

        .composer-action:disabled {
          cursor: default;

          opacity: 0.58;

          transform: none;

          box-shadow:
            0 6px 20px
            rgba(99,102,241,0.13);
        }

        /* ====================================================
           RECORD MODE
           ==================================================== */

        .record-action {
          background:
            radial-gradient(
              circle at center,
              rgba(139,92,246,0.95),
              rgba(99,102,241,0.94)
            );
        }

        .record-action.recording {
          background:
            linear-gradient(
              135deg,
              #ef4444,
              #dc2626
            );

          box-shadow:
            0 8px 30px
            rgba(239,68,68,0.30);
        }

        .recording-ring {
          position: absolute;

          inset: 4px;

          border-radius: 13px;

          border:
            1px solid
            rgba(255,255,255,0.30);

          animation:
            recordingPulse 1.2s
            ease-in-out infinite;
        }

        @keyframes recordingPulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.94);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .record-count {
          position: absolute;

          right: -3px;
          top: -8px;

          min-width: 25px;

          height: 20px;

          display: grid;

          place-items: center;

          padding: 0 5px;

          border-radius: 999px;

          background: #ef4444;

          color: white;

          border:
            2px solid
            #121727;

          font-size: 9px;

          font-weight: 800;
        }

        /* ====================================================
           VOICE CONTROLS — ONLY 2 BUTTONS
           ==================================================== */

        .voice-controls {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 10px;

          margin-top: 10px;

          position: relative;

          z-index: 3;
        }

        .voice-mode-button {
          height: 34px;

          min-width: 120px;

          padding:
            0 13px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          border-radius: 999px;

          border:
            1px solid
            rgba(255,255,255,0.08);

          color:
            rgba(255,255,255,0.72);

          background:
            rgba(255,255,255,0.035);

          cursor: pointer;

          font-size: 10px;

          font-weight: 600;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease,
            color 0.2s ease;
        }

        .voice-mode-button:hover {
          background:
            rgba(255,255,255,0.075);

          border-color:
            rgba(255,255,255,0.14);

          transform:
            translateY(-1px);

          color: white;
        }

        .voice-mode-button.active {
          color: white;

          background:
            rgba(34,197,94,0.10);

          border-color:
            rgba(34,197,94,0.28);

          box-shadow:
            0 0 18px
            rgba(34,197,94,0.07);
        }

        .live-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background:
            #64748b;
        }

        .voice-mode-button.active
        .live-dot {
          background:
            #22c55e;

          box-shadow:
            0 0 9px
            rgba(34,197,94,0.75);

          animation:
            liveDot 1.1s
            ease-in-out infinite;
        }

        @keyframes liveDot {
          0%,
          100% {
            opacity: 0.5;
          }

          50% {
            opacity: 1;
          }
        }

        .live-listening-label {
          position: absolute;

          top: -24px;

          left: 50%;

          transform:
            translateX(-50%);

          white-space: nowrap;

          color:
            rgba(255,255,255,0.42);

          font-size: 9px;

          letter-spacing: 0.08em;

          text-transform: uppercase;
        }

        /* ====================================================
           PLAYING STATE
           ==================================================== */

        .speaking-indicator {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          margin-bottom: 8px;

          color:
            rgba(255,255,255,0.42);

          font-size: 10px;
        }

        .speaking-bars {
          display: flex;

          align-items: center;

          gap: 2px;

          height: 13px;
        }

        .speaking-bars span {
          width: 2px;

          height: 5px;

          border-radius: 5px;

          background:
            rgba(139,92,246,0.85);

          animation:
            speakingBar 0.8s
            ease-in-out infinite;
        }

        .speaking-bars span:nth-child(2) {
          animation-delay: 0.12s;
        }

        .speaking-bars span:nth-child(3) {
          animation-delay: 0.24s;
        }

        .speaking-bars span:nth-child(4) {
          animation-delay: 0.36s;
        }

        @keyframes speakingBar {
          0%,
          100% {
            height: 4px;
          }

          50% {
            height: 13px;
          }
        }

        /* ====================================================
           FOOTER
           ==================================================== */

        .antimate-footer-note {
          text-align: center;

          margin-top: 7px;

          color:
            rgba(255,255,255,0.22);

          font-size: 9px;
        }

        /* ====================================================
           MOBILE
           ==================================================== */

        @media (max-width: 700px) {
          .antimate-header {
            height: 68px;

            padding:
              0
              15px;
          }

          .antimate-main {
            width:
              calc(100% - 18px);

            height:
              calc(100vh - 68px);
          }

          .antimate-chat {
            padding:
              25px
              1px
              185px;
          }

          .antimate-empty {
            min-height:
              calc(100vh - 290px);
          }

          .antimate-empty-logo {
            transform: scale(1.35);
          }

          .antimate-empty-title {
            font-size: 28px;
          }

          .antimate-empty-subtitle {
            font-size: 13px;
          }

          .message-content-wrap {
            max-width: 88%;
          }

          .live-answer-bubble {
            max-width: 88%;
          }

          .composer-zone {
            bottom: 13px;
          }

          .composer-zone::before {
            left: -15px;
            right: -15px;

            bottom: -13px;
          }

          .composer {
            min-height: 64px;

            border-radius: 20px;

            padding:
              8px
              8px
              8px
              14px;
          }

          .composer-action {
            width: 46px;
            height: 46px;

            flex-basis: 46px;
          }

          .voice-controls {
            gap: 7px;
          }

          .voice-mode-button {
            min-width: 112px;
          }

          .antimate-connection span:last-child {
            display: none;
          }

          .antimate-brand-subtitle {
            display: none;
          }
        }

        @media (max-width: 420px) {
          .antimate-brand-name {
            font-size: 13px;
          }

          .antimate-connection {
            padding:
              6px 8px;
          }

          .voice-mode-button {
            min-width: 105px;

            font-size: 9px;
          }
        }

        /* ====================================================
           REDUCED MOTION
           ==================================================== */

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration:
              0.01ms !important;

            animation-iteration-count:
              1 !important;

            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* ======================================================
          PAGE
          ====================================================== */}

      <div className="antimate-page">

        {/* ====================================================
            HEADER
            ==================================================== */}

        <header className="antimate-header">

          <div className="antimate-brand">

            <AntimateLogo />

            <div className="antimate-brand-text">
              <div className="antimate-brand-name">
                ANTIMATE AI
              </div>

              <div className="antimate-brand-subtitle">
                Intelligent Farming Assistant
              </div>
            </div>

          </div>

          <div className="antimate-connection">

            <span
              className={`connection-dot ${
                socketConnected
                  ? "online"
                  : ""
              }`}
            />

            <span>
              {socketConnected
                ? "Connected"
                : "Connecting..."}
            </span>

          </div>

        </header>

        {/* ====================================================
            MAIN
            ==================================================== */}

        <main className="antimate-main">

          <section className="antimate-chat">

            {/* ==================================================
                EMPTY STATE
                ================================================== */}

            {messages.length === 0 &&
              !currentAnswer &&
              !isProcessing && (
                <div className="antimate-empty">

                  <div className="antimate-empty-logo">
                    <AntimateLogo />
                  </div>

                  <h1 className="antimate-empty-title">
                    <span>
                      Muraho, ndi ANTIMATE
                    </span>
                  </h1>

                  <p className="antimate-empty-subtitle">
                    Umufasha wawe w'ubwenge mu
                    bworozi. Ushobora kumbaza
                    ikibazo ukoresheje text,
                    recording cyangwa Live Voice.
                  </p>

                  <div className="antimate-empty-hint">
                    Andika cyangwa hitamo uburyo
                    bw'amajwi munsi.
                  </div>

                </div>
              )}

            {/* ==================================================
                MESSAGES
                ================================================== */}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${
                  message.role
                }`}
              >

                <div className="message-content-wrap">

                  {message.role ===
                    "assistant" && (
                    <div className="assistant-avatar">
                      <AntimateLogo small />
                    </div>
                  )}

                  <div className="message-bubble">
                    {message.content}
                  </div>

                </div>

              </div>
            ))}

            {/* ==================================================
                TRANSCRIPT
                ================================================== */}

            {transcript && (
              <div className="transcript-card">
                <span className="transcript-label">
                  Wavuze:
                </span>

                {transcript}
              </div>
            )}

            {/* ==================================================
                LIVE ANSWER
                ================================================== */}

            {currentAnswer && (
              <div className="live-answer">

                <div className="assistant-avatar">
                  <AntimateLogo small />
                </div>

                <div className="live-answer-bubble">
                  {currentAnswer}
                </div>

              </div>
            )}

            {/* ==================================================
                THINKING
                ================================================== */}

            {isProcessing &&
              !currentAnswer && (
                <div className="thinking-message">

                  <div className="assistant-avatar">
                    <AntimateLogo small />
                  </div>

                  <div className="thinking-bubble">

                    <span className="thinking-label">
                      ANTIMATE iratekereza
                    </span>

                    <ThinkingDots />

                  </div>

                </div>
              )}

            <div ref={bottomRef} />

          </section>

          {/* ==================================================
              COMPOSER
              ================================================== */}

          <div className="composer-zone">

            <div className="composer-content">

              {/* ==============================================
                  SPEAKING INDICATOR
                  ============================================== */}

              {isPlaying && (
                <div className="speaking-indicator">

                  <div className="speaking-bars">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <span>
                    ANTIMATE iri kuvuga...
                  </span>

                  <VolumeIcon size={13} />

                </div>
              )}

              {/* ==============================================
                  ERROR
                  ============================================== */}

              {error && (
                <div className="antimate-error">
                  {error}
                </div>
              )}

              {/* ==============================================
                  INPUT
                  ============================================== */}

              <div className="composer">

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isLiveVoice
                      ? "Live Voice iri gukora..."
                      : "Andika ubutumwa..."
                  }
                  disabled={
                    isProcessing ||
                    isPlaying ||
                    isLiveVoice
                  }
                  rows={1}
                />

                {/* ==========================================
                    ONE ACTION BUTTON
                    ========================================== */}

                <button
                  type="button"
                  className={`composer-action ${
                    isRecording
                      ? "record-action recording"
                      : ""
                  }`}
                  disabled={
                    isProcessing ||
                    isPlaying ||
                    isLiveVoice
                  }
                  onClick={
                    hasText
                      ? sendText
                      : handleRecordButton
                  }
                  aria-label={
                    hasText
                      ? "Send message"
                      : isRecording
                      ? "Stop recording"
                      : "Record voice"
                  }
                >

                  {/* RECORD COUNT */}
                  {isRecording && (
                    <>
                      <div className="recording-ring" />

                      <div className="record-count">
                        {recordSeconds}
                      </div>

                      <StopIcon size={19} />
                    </>
                  )}

                  {/* NORMAL MIC */}
                  {!hasText &&
                    !isRecording && (
                      <MicIcon size={21} />
                    )}

                  {/* SEND */}
                  {hasText && (
                    <SendIcon size={21} />
                  )}

                </button>

              </div>

              {/* ==============================================
                  ONLY 2 VOICE BUTTONS WHEN INPUT EMPTY
                  ============================================== */}

              {!hasText && (
                <div className="voice-controls">

                  {/* ------------------------------------------
                      RECORD
                      ------------------------------------------ */}

                  <button
                    type="button"
                    className={`voice-mode-button ${
                      isRecording
                        ? "active"
                        : ""
                    }`}
                    onClick={
                      handleRecordButton
                    }
                    disabled={
                      isProcessing ||
                      isPlaying ||
                      isLiveVoice
                    }
                  >

                    {isRecording ? (
                      <>
                        <StopIcon size={14} />
                        <span>
                          Stop · {recordSeconds}s
                        </span>
                      </>
                    ) : (
                      <>
                        <MicIcon size={14} />
                        <span>
                          Record · 30s
                        </span>
                      </>
                    )}

                  </button>

                  {/* ------------------------------------------
                      LIVE VOICE
                      ------------------------------------------ */}

                  <button
                    type="button"
                    className={`voice-mode-button ${
                      isLiveVoice
                        ? "active"
                        : ""
                    }`}
                    onClick={
                      toggleLiveVoice
                    }
                    disabled={
                      isProcessing ||
                      isPlaying ||
                      isRecording
                    }
                  >

                    <span className="live-dot" />

                    <span>
                      {isLiveVoice
                        ? liveListening
                          ? "Listening..."
                          : "Live Voice"
                        : "Live Voice"}
                    </span>

                  </button>

                  {isLiveVoice &&
                    liveListening && (
                      <div className="live-listening-label">
                        Speak naturally · silence
                        sends automatically
                      </div>
                    )}

                </div>
              )}

              {/* ==============================================
                  FOOTER
                  ============================================== */}

              <div className="antimate-footer-note">
                ANTIMATE AI can make mistakes.
                Verify important farming decisions.
              </div>

            </div>

          </div>

        </main>

      </div>
    </>
  );
}