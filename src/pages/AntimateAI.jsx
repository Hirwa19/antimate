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
ANTIMATE AI — MARKET LEVEL UI
============================================================

FEATURES
------------------------------------------------------------
• Apple-inspired premium UI
• Light / dark theme
• Responsive desktop + mobile
• Smooth message animations
• Edit recent user message
• Copy messages
• Replay assistant voice
• Stop assistant voice
• Regenerate last answer
• Live Voice mode
• Automatic silence detection
• Live transcript
• Streaming answer text
• Voice waveform
• Scroll-to-bottom button
• Welcome prompt cards
• Conversation statistics
• Message timestamps
• Message action toolbar
• Character counter
• Auto-growing textarea
• Connection status
• Thinking animation
• Keyboard shortcuts
• Mobile safe-area support
• Socket.IO voice pipeline preserved

NO AntimateAI.css REQUIRED
============================================================
*/

/* ============================================================
   CONFIG
============================================================ */

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/$/, "");

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const NORMAL_RECORDING_MS = 30_000;
const LIVE_HOLD_MS = 5_000;
const LIVE_SILENCE_MS = 1_800;
const AUDIO_CHUNK_MS = 250;

const THINKING_MESSAGES = [
  "Reka ndebe…",
  "Ndabitekerezaho…",
  "Ndimo gutunganya igisubizo…",
  "Ndashaka kuguha igisubizo cyiza…",
  "Hasigaye akanya gato…",
];

const MAX_TEXT_LENGTH = 4000;

/* ============================================================
   ICON SYSTEM
============================================================ */

function Icon({
  name,
  size = 20,
  stroke = 1.9,
  className = "",
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const paths = {
    send: (
      <>
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      </>
    ),

    mic: (
      <>
        <rect x="8" y="3" width="8" height="12" rx="4" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
        <path d="M9 21h6" />
      </>
    ),

    stop: (
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        fill="currentColor"
        stroke="none"
      />
    ),

    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
        <path d="M4 4v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
        <path d="M20 20v-5h-5" />
      </>
    ),

    volume: (
      <>
        <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
        <path d="M17 9.5a4 4 0 0 1 0 5" />
        <path d="M19.5 7a8 8 0 0 1 0 10" />
      </>
    ),

    volumeOff: (
      <>
        <path d="m4 4 16 16" />
        <path d="M9 9 13 6v12l-4-3H5V9h4Z" />
      </>
    ),

    chevronDown: <path d="m6 9 6 6 6-6" />,

    chevronUp: <path d="m18 15-6-6-6 6" />,

    arrowDown: (
      <>
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </>
    ),

    sparkles: (
      <>
        <path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2L12 3Z" />
        <path d="m19 13-.8 2.2L16 16l2.2.8L19 19l.8-2.2L22 16l-2.2-.8L19 13Z" />
        <path d="m5 14-.7 2L2 17l2.3 1L5 20l.7-2L8 17l-2.3-1L5 14Z" />
      </>
    ),

    menu: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    x: (
      <>
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="m6 7 1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </>
    ),

    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    activity: (
      <>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </>
    ),

    headphones: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Z" />
        <path d="M20 14h-3v5h2a1 1 0 0 0 1-1v-4Z" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),

    moon: (
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
    ),

    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </>
    ),

    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
      </>
    ),

    keyboard: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01" />
        <path d="M7 14h10" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {paths[name] || null}
    </svg>
  );
}

/* ============================================================
   LOGO
============================================================ */

function LogoMark({ size = 38, mini = false }) {
  return (
    <div
      className={`antimate-logo ${mini ? "mini" : ""}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <span className="logo-orbit orbit-one" />
      <span className="logo-orbit orbit-two" />
      <span className="logo-core" />
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getSupportedMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {
      // Continue.
    }
  }

  return "";
}

function extensionFromMimeType(type = "") {
  const cleanType = type.toLowerCase();

  if (cleanType.includes("ogg")) {
    return "ogg";
  }

  if (
    cleanType.includes("mp4") ||
    cleanType.includes("m4a")
  ) {
    return "m4a";
  }

  if (cleanType.includes("wav")) {
    return "wav";
  }

  return "webm";
}

function makeAbsoluteUrl(url) {
  if (!url) {
    return "";
  }

  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return `${API_URL}/${url}`;
}

function getAudioUrl(payload) {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return makeAbsoluteUrl(payload);
  }

  if (payload instanceof ArrayBuffer) {
    return URL.createObjectURL(
      new Blob([payload], {
        type: "audio/wav",
      })
    );
  }

  if (payload instanceof Blob) {
    return URL.createObjectURL(payload);
  }

  if (typeof payload === "object") {
    const value =
      payload.url ||
      payload.audioUrl ||
      payload.audio_url ||
      payload.path ||
      payload.file ||
      payload.data;

    if (value instanceof ArrayBuffer) {
      return URL.createObjectURL(
        new Blob([value], {
          type: "audio/wav",
        })
      );
    }

    if (value instanceof Blob) {
      return URL.createObjectURL(value);
    }

    if (typeof value === "string") {
      return makeAbsoluteUrl(value);
    }
  }

  return "";
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AntimateAI() {
  /* ==========================================================
     CHAT STATE
  ========================================================== */

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [copiedId, setCopiedId] = useState(null);
  const [replayingId, setReplayingId] = useState(null);

  const [showScrollButton, setShowScrollButton] =
    useState(false);

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved =
        localStorage.getItem("antimate-theme");

      if (saved === "dark") return true;
      if (saved === "light") return false;

      return window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches ?? false;
    } catch {
      return false;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ==========================================================
     CONNECTION
  ========================================================== */

  const [socketConnected, setSocketConnected] =
    useState(false);

  /* ==========================================================
     AI STATUS
  ========================================================== */

  const [isRecording, setIsRecording] =
    useState(false);

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [status, setStatus] =
    useState("ready");

  const [statusMessage, setStatusMessage] =
    useState("");

  const [transcript, setTranscript] =
    useState("");

  const [thinkingText, setThinkingText] =
    useState("");

  const [currentAnswer, setCurrentAnswer] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* ==========================================================
     RECORDING
  ========================================================== */

  const [recordingSeconds, setRecordingSeconds] =
    useState(30);

  const [recordingMode, setRecordingMode] =
    useState("tap");

  const [liveVoice, setLiveVoice] =
    useState(false);

  /* ==========================================================
     THINKING
  ========================================================== */

  const [thinkingIndex, setThinkingIndex] =
    useState(0);

  /* ==========================================================
     REFS
  ========================================================== */

  const socketRef = useRef(null);

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const recordingMimeTypeRef =
    useRef("");

  const recordingExtensionRef =
    useRef("");

  const holdTimerRef =
    useRef(null);

  const recordingTimerRef =
    useRef(null);

  const pressStartedAtRef =
    useRef(0);

  const pointerActiveRef =
    useRef(false);

  const isRecordingRef =
    useRef(false);

  const isPlayingRef =
    useRef(false);

  const recordingModeRef =
    useRef("tap");

  const liveVoiceRef =
    useRef(false);

  const voiceSessionActiveRef =
    useRef(false);

  const audioRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const analyserRef =
    useRef(null);

  const silenceAnimationRef =
    useRef(null);

  const silenceStartedAtRef =
    useRef(null);

  const speechDetectedRef =
    useRef(false);

  const liveWaitingForResponseRef =
    useRef(false);

  const liveAudioReceivedRef =
    useRef(false);

  const wakeLockRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  const textareaRef =
    useRef(null);

  const scrollRef =
    useRef(null);

  const bottomRef =
    useRef(null);

  const stopRecordingRef =
    useRef(null);

  const startRecordingInternalRef =
    useRef(null);

  const messageIdRef =
    useRef(1);

  const replayingMessageRef =
    useRef(null);

  /* ==========================================================
     CREATE ID
  ========================================================== */

  const createId = useCallback(() => {
    const id =
      messageIdRef.current;

    messageIdRef.current += 1;

    return `${Date.now()}-${id}`;
  }, []);

  /* ==========================================================
     THEME
  ========================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        "antimate-theme",
        darkMode ? "dark" : "light"
      );
    } catch {
      // Ignore.
    }
  }, [darkMode]);

  /* ==========================================================
     WAKE LOCK
  ========================================================== */

  const requestWakeLock =
    useCallback(async () => {
      try {
        if (!("wakeLock" in navigator)) {
          return;
        }

        if (wakeLockRef.current) {
          return;
        }

        wakeLockRef.current =
          await navigator.wakeLock.request(
            "screen"
          );

        wakeLockRef.current.addEventListener(
          "release",
          () => {
            wakeLockRef.current = null;
          }
        );
      } catch {
        // Optional feature.
      }
    }, []);

  const releaseWakeLock =
    useCallback(async () => {
      try {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      } catch {
        wakeLockRef.current = null;
      }
    }, []);

  /* ==========================================================
     SCROLL
  ========================================================== */

  const scrollToBottom =
    useCallback((smooth = true) => {
      bottomRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }, []);

  const handleScroll =
    useCallback(() => {
      const element =
        scrollRef.current;

      if (!element) return;

      const distance =
        element.scrollHeight -
        element.scrollTop -
        element.clientHeight;

      setShowScrollButton(
        distance > 260
      );
    }, []);

  useEffect(() => {
    if (
      messages.length ||
      currentAnswer ||
      transcript
    ) {
      scrollToBottom();
    }
  }, [
    messages.length,
    currentAnswer,
    transcript,
    isProcessing,
    scrollToBottom,
  ]);

  /* ==========================================================
     SILENCE DETECTION
  ========================================================== */

  const stopSilenceDetection =
    useCallback(() => {
      if (silenceAnimationRef.current) {
        cancelAnimationFrame(
          silenceAnimationRef.current
        );

        silenceAnimationRef.current = null;
      }

      silenceStartedAtRef.current = null;

      speechDetectedRef.current = false;

      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {
          // Ignore.
        }

        audioContextRef.current = null;
      }

      analyserRef.current = null;
    }, []);

  const stopMediaTracks =
    useCallback(() => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {
              // Ignore.
            }
          });

        mediaStreamRef.current = null;
      }

      stopSilenceDetection();
    }, [stopSilenceDetection]);

  const startSilenceDetection =
    useCallback((stream) => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContextClass) {
          return;
        }

        const audioContext =
          new AudioContextClass();

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;

        source.connect(analyser);

        audioContextRef.current =
          audioContext;

        analyserRef.current =
          analyser;

        const data =
          new Uint8Array(
            analyser.fftSize
          );

        const detect = () => {
          if (!isRecordingRef.current) {
            return;
          }

          if (!liveVoiceRef.current) {
            return;
          }

          analyser.getByteTimeDomainData(
            data
          );

          let sum = 0;

          for (
            let i = 0;
            i < data.length;
            i++
          ) {
            const normalized =
              (data[i] - 128) / 128;

            sum +=
              normalized *
              normalized;
          }

          const rms =
            Math.sqrt(
              sum / data.length
            );

          const voiceThreshold =
            0.025;

          if (
            rms > voiceThreshold
          ) {
            speechDetectedRef.current =
              true;

            silenceStartedAtRef.current =
              null;
          } else if (
            speechDetectedRef.current
          ) {
            if (
              !silenceStartedAtRef.current
            ) {
              silenceStartedAtRef.current =
                Date.now();
            }

            const silentFor =
              Date.now() -
              silenceStartedAtRef.current;

            if (
              silentFor >=
              LIVE_SILENCE_MS
            ) {
              silenceStartedAtRef.current =
                null;

              stopRecordingRef.current?.({
                liveSegment: true,
              });

              return;
            }
          }

          silenceAnimationRef.current =
            requestAnimationFrame(
              detect
            );
        };

        detect();
      } catch (error) {
        console.warn(
          "Silence detection unavailable:",
          error
        );
      }
    }, []);

  /* ==========================================================
     ADD MESSAGE
  ========================================================== */

  const addMessage =
    useCallback(
      (
        role,
        content,
        extra = {}
      ) => {
        if (!content) {
          return null;
        }

        const newMessage = {
          id: createId(),
          role,
          content,
          timestamp:
            extra.timestamp ||
            new Date(),
          ...extra,
        };

        setMessages((prev) => [
          ...prev,
          newMessage,
        ]);

        return newMessage;
      },
      [createId]
    );

  /* ==========================================================
     COPY MESSAGE
  ========================================================== */

  const copyMessage =
    useCallback(async (
      message
    ) => {
      try {
        await navigator.clipboard.writeText(
          message.content
        );

        setCopiedId(message.id);

        setTimeout(() => {
          if (mountedRef.current) {
            setCopiedId(null);
          }
        }, 1600);
      } catch {
        try {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            message.content;

          document.body.appendChild(
            textarea
          );

          textarea.select();

          document.execCommand(
            "copy"
          );

          textarea.remove();

          setCopiedId(message.id);

          setTimeout(() => {
            if (
              mountedRef.current
            ) {
              setCopiedId(null);
            }
          }, 1600);
        } catch {
          // Ignore.
        }
      }
    }, []);

  /* ==========================================================
     PLAY AUDIO
  ========================================================== */

  const playAudio =
    useCallback(
      (
        payload,
        messageId = null
      ) => {
        const audioUrl =
          getAudioUrl(payload);

        if (!audioUrl) {
          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            setTimeout(() => {
              if (
                liveVoiceRef.current &&
                voiceSessionActiveRef.current &&
                !isRecordingRef.current &&
                !isPlayingRef.current
              ) {
                startRecordingInternalRef.current?.(
                  "live"
                );
              }
            }, 350);
          }

          return;
        }

        if (audioRef.current) {
          try {
            audioRef.current.pause();
          } catch {
            // Ignore.
          }

          audioRef.current = null;
        }

        const audio =
          new Audio(audioUrl);

        audio.preload = "auto";

        audioRef.current =
          audio;

        isPlayingRef.current =
          true;

        setIsPlaying(true);

        if (messageId) {
          replayingMessageRef.current =
            messageId;

          setReplayingId(messageId);
        }

        setStatus("speaking");

        setStatusMessage(
          "ANTIMATE iri kuvuga…"
        );

        liveAudioReceivedRef.current =
          true;

        audio.onended = () => {
          if (!mountedRef.current) {
            return;
          }

          isPlayingRef.current =
            false;

          setIsPlaying(false);

          setReplayingId(null);

          replayingMessageRef.current =
            null;

          setStatus("ready");

          setStatusMessage("");

          if (
            audioUrl.startsWith("blob:")
          ) {
            try {
              URL.revokeObjectURL(
                audioUrl
              );
            } catch {
              // Ignore.
            }
          }

          audioRef.current = null;

          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            setTimeout(() => {
              if (
                liveVoiceRef.current &&
                voiceSessionActiveRef.current &&
                !isRecordingRef.current &&
                !isPlayingRef.current
              ) {
                startRecordingInternalRef.current?.(
                  "live"
                );
              }
            }, 300);
          } else {
            releaseWakeLock();
          }
        };

        audio.onerror = () => {
          if (!mountedRef.current) {
            return;
          }

          isPlayingRef.current =
            false;

          setIsPlaying(false);

          setReplayingId(null);

          replayingMessageRef.current =
            null;

          audioRef.current = null;

          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            setTimeout(() => {
              if (
                liveVoiceRef.current &&
                voiceSessionActiveRef.current &&
                !isRecordingRef.current &&
                !isPlayingRef.current
              ) {
                startRecordingInternalRef.current?.(
                  "live"
                );
              }
            }, 400);
          } else {
            releaseWakeLock();
          }
        };

        audio.play().catch((error) => {
          console.warn(
            "Audio playback failed:",
            error
          );

          isPlayingRef.current =
            false;

          setIsPlaying(false);

          setReplayingId(null);

          replayingMessageRef.current =
            null;

          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            setTimeout(() => {
              if (
                liveVoiceRef.current &&
                voiceSessionActiveRef.current &&
                !isRecordingRef.current &&
                !isPlayingRef.current
              ) {
                startRecordingInternalRef.current?.(
                  "live"
                );
              }
            }, 500);
          }
        });
      },
      [releaseWakeLock]
    );

  /* ==========================================================
     STOP AUDIO
  ========================================================== */

  const stopAudio =
    useCallback(() => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {
          // Ignore.
        }

        audioRef.current = null;
      }

      isPlayingRef.current =
        false;

      setIsPlaying(false);

      setReplayingId(null);

      replayingMessageRef.current =
        null;

      if (!liveVoiceRef.current) {
        setStatus("ready");
        setStatusMessage("");
        releaseWakeLock();
      }
    }, [releaseWakeLock]);

  /* ==========================================================
     REPLAY ASSISTANT MESSAGE
  ========================================================== */

  const replayMessage =
    useCallback(
      (message) => {
        if (!message?.audioUrl) {
          return;
        }

        playAudio(
          message.audioUrl,
          message.id
        );
      },
      [playAudio]
    );

  /* ==========================================================
     START RECORDING
  ========================================================== */

  const startRecordingInternal =
    useCallback(
      async (mode = "tap") => {
        if (
          !socketRef.current?.connected
        ) {
          setErrorMessage(
            "Connection to ANTIMATE server ntiraboneka."
          );

          setStatus("offline");

          return;
        }

        if (
          isRecordingRef.current
        ) {
          return;
        }

        if (
          isPlayingRef.current &&
          !liveVoiceRef.current
        ) {
          return;
        }

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          setErrorMessage(
            "Browser yawe ntabwo yemera microphone."
          );

          setStatus("error");

          return;
        }

        setErrorMessage("");

        setTranscript("");

        setCurrentAnswer("");

        try {
          await requestWakeLock();

          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              }
            );

          mediaStreamRef.current =
            stream;

          const mimeType =
            getSupportedMimeType();

          recordingMimeTypeRef.current =
            mimeType;

          recordingExtensionRef.current =
            extensionFromMimeType(
              mimeType
            );

          const recorderOptions =
            mimeType
              ? { mimeType }
              : undefined;

          const recorder =
            new MediaRecorder(
              stream,
              recorderOptions
            );

          mediaRecorderRef.current =
            recorder;

          const sessionMimeType =
            mimeType ||
            recorder.mimeType ||
            "audio/webm";

          recordingMimeTypeRef.current =
            sessionMimeType;

          recordingExtensionRef.current =
            extensionFromMimeType(
              sessionMimeType
            );

          recordingModeRef.current =
            mode;

          isRecordingRef.current =
            true;

          if (mode === "live") {
            liveVoiceRef.current =
              true;

            voiceSessionActiveRef.current =
              true;

            setLiveVoice(true);

            setRecordingMode("live");

            setStatus("listening");

            setStatusMessage(
              "Live Voice: ndagutega…"
            );

            speechDetectedRef.current =
              false;

            silenceStartedAtRef.current =
              null;
          } else {
            setLiveVoice(false);

            setRecordingMode("tap");

            setRecordingSeconds(30);

            setStatus("recording");

            setStatusMessage(
              "Ndumva…"
            );
          }

          socketRef.current.emit(
            "antimate:voice:start",
            {
              mimeType:
                sessionMimeType,

              extension:
                extensionFromMimeType(
                  sessionMimeType
                ),

              language: "rw",

              mode,
            }
          );

          recorder.ondataavailable =
            async (event) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              if (
                !socketRef.current?.connected
              ) {
                return;
              }

              try {
                const buffer =
                  await event.data.arrayBuffer();

                socketRef.current.emit(
                  "antimate:voice:chunk",
                  buffer
                );
              } catch (error) {
                console.warn(
                  "Audio chunk failed:",
                  error
                );
              }
            };

          recorder.onstop = () => {
            if (
              mediaRecorderRef.current ===
              recorder
            ) {
              mediaRecorderRef.current =
                null;
            }

            stopMediaTracks();

            if (
              socketRef.current?.connected
            ) {
              socketRef.current.emit(
                "antimate:voice:end",
                {
                  mode,
                }
              );
            }

            setIsProcessing(true);

            setStatus("processing");

            setStatusMessage(
              "ANTIMATE irimo gutunganya…"
            );

            if (mode === "live") {
              liveWaitingForResponseRef.current =
                true;

              liveAudioReceivedRef.current =
                false;
            }
          };

          recorder.onerror =
            (event) => {
              console.error(
                "MediaRecorder error:",
                event
              );

              isRecordingRef.current =
                false;

              setIsRecording(false);

              stopMediaTracks();

              setIsProcessing(false);

              setStatus("error");

              setStatusMessage("");

              setErrorMessage(
                "Habaye ikibazo mu gufata amajwi."
              );
            };

          recorder.start(
            AUDIO_CHUNK_MS
          );

          setIsRecording(true);

          if (mode === "live") {
            startSilenceDetection(
              stream
            );
          }
        } catch (error) {
          console.error(
            "START RECORDING ERROR:",
            error
          );

          isRecordingRef.current =
            false;

          setIsRecording(false);

          stopMediaTracks();

          if (
            error?.name ===
            "NotAllowedError"
          ) {
            setErrorMessage(
              "Microphone ntiyemerewe. Fungura microphone permission muri browser."
            );
          } else if (
            error?.name ===
            "NotFoundError"
          ) {
            setErrorMessage(
              "Nta microphone yabonetse kuri device."
            );
          } else {
            setErrorMessage(
              "Ntabwo nshoboye gufungura microphone."
            );
          }

          setStatus("error");

          setStatusMessage("");

          releaseWakeLock();
        }
      },
      [
        requestWakeLock,
        releaseWakeLock,
        startSilenceDetection,
        stopMediaTracks,
      ]
    );

  useEffect(() => {
    startRecordingInternalRef.current =
      startRecordingInternal;
  }, [startRecordingInternal]);

  /* ==========================================================
     STOP RECORDING
  ========================================================== */

  const stopRecording =
    useCallback(
      ({
        liveSegment = false,
      } = {}) => {
        if (!isRecordingRef.current) {
          return;
        }

        isRecordingRef.current =
          false;

        setIsRecording(false);

        stopSilenceDetection();

        if (
          recordingTimerRef.current
        ) {
          clearInterval(
            recordingTimerRef.current
          );

          recordingTimerRef.current =
            null;
        }

        const recorder =
          mediaRecorderRef.current;

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          try {
            recorder.stop();
          } catch (error) {
            console.warn(
              "Recorder stop failed:",
              error
            );
          }
        }

        if (!liveSegment) {
          liveVoiceRef.current =
            false;

          voiceSessionActiveRef.current =
            false;

          setLiveVoice(false);

          setRecordingMode("tap");

          releaseWakeLock();
        } else {
          liveVoiceRef.current =
            true;

          voiceSessionActiveRef.current =
            true;

          setLiveVoice(true);

          setRecordingMode("live");
        }
      },
      [
        releaseWakeLock,
        stopSilenceDetection,
      ]
    );

  useEffect(() => {
    stopRecordingRef.current =
      stopRecording;
  }, [stopRecording]);

  /* ==========================================================
     RECORDING TIMER
  ========================================================== */

  useEffect(() => {
    if (
      !isRecording ||
      recordingMode !== "tap"
    ) {
      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current =
          null;
      }

      return;
    }

    recordingTimerRef.current =
      setInterval(() => {
        setRecordingSeconds(
          (prev) => {
            if (prev <= 1) {
              if (
                recordingTimerRef.current
              ) {
                clearInterval(
                  recordingTimerRef.current
                );

                recordingTimerRef.current =
                  null;
              }

              setTimeout(() => {
                stopRecording({
                  liveSegment: false,
                });
              }, 0);

              return 0;
            }

            return prev - 1;
          }
        );
      }, 1000);

    return () => {
      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current =
          null;
      }
    };
  }, [
    isRecording,
    recordingMode,
    stopRecording,
  ]);

  /* ==========================================================
     VOICE BUTTON
  ========================================================== */

  const handleVoicePointerDown =
    useCallback(
      (event) => {
        if (text.trim()) {
          return;
        }

        if (
          event.pointerType === "mouse" &&
          event.button !== 0
        ) {
          return;
        }

        if (
          isProcessing &&
          !isRecordingRef.current
        ) {
          return;
        }

        event.currentTarget.setPointerCapture?.(
          event.pointerId
        );

        pointerActiveRef.current =
          true;

        pressStartedAtRef.current =
          Date.now();

        if (
          isRecordingRef.current
        ) {
          if (
            !liveVoiceRef.current
          ) {
            stopRecording({
              liveSegment: false,
            });
          }

          return;
        }

        startRecordingInternal(
          "tap"
        );

        holdTimerRef.current =
          setTimeout(() => {
            if (
              !pointerActiveRef.current
            ) {
              return;
            }

            if (
              !isRecordingRef.current
            ) {
              return;
            }

            liveVoiceRef.current =
              true;

            voiceSessionActiveRef.current =
              true;

            recordingModeRef.current =
              "live";

            setLiveVoice(true);

            setRecordingMode("live");

            setStatus("listening");

            setStatusMessage(
              "Live Voice: vuga, silence 1.8s izohita yohereza…"
            );

            speechDetectedRef.current =
              false;

            silenceStartedAtRef.current =
              null;

            if (
              mediaStreamRef.current
            ) {
              startSilenceDetection(
                mediaStreamRef.current
              );
            }
          }, LIVE_HOLD_MS);
      },
      [
        isProcessing,
        startRecordingInternal,
        startSilenceDetection,
        stopRecording,
        text,
      ]
    );

  const handleVoicePointerUp =
    useCallback(
      (event) => {
        try {
          event.currentTarget.releasePointerCapture?.(
            event.pointerId
          );
        } catch {
          // Ignore.
        }

        pointerActiveRef.current =
          false;

        if (
          holdTimerRef.current
        ) {
          clearTimeout(
            holdTimerRef.current
          );

          holdTimerRef.current =
            null;
        }

        if (
          liveVoiceRef.current
        ) {
          return;
        }
      },
      []
    );

  const handleVoicePointerCancel =
    useCallback(() => {
      pointerActiveRef.current =
        false;

      if (
        holdTimerRef.current
      ) {
        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;
      }
    }, []);

  /* ==========================================================
     STOP LIVE VOICE
  ========================================================== */

  const stopLiveVoice =
    useCallback(() => {
      liveVoiceRef.current =
        false;

      voiceSessionActiveRef.current =
        false;

      liveWaitingForResponseRef.current =
        false;

      setLiveVoice(false);

      if (isRecordingRef.current) {
        stopRecording({
          liveSegment: false,
        });
      }

      stopAudio();

      setIsProcessing(false);

      setStatus("ready");

      setStatusMessage("");

      releaseWakeLock();
    }, [
      releaseWakeLock,
      stopAudio,
      stopRecording,
    ]);

  /* ==========================================================
     SEND TEXT
  ========================================================== */

  const sendTextMessage =
    useCallback(
      async (
        customText = null,
        editMessageId = null
      ) => {
        const value =
          (
            customText ??
            text
          ).trim();

        if (!value) {
          return;
        }

        if (
          value.length >
          MAX_TEXT_LENGTH
        ) {
          setErrorMessage(
            `Ubutumwa ntiburenza inyuguti ${MAX_TEXT_LENGTH.toLocaleString()}.`
          );

          return;
        }

        if (isProcessing) {
          return;
        }

        if (isRecording) {
          return;
        }

        if (liveVoice) {
          return;
        }

        setErrorMessage("");

        setText("");

        setTranscript("");

        setCurrentAnswer("");

        if (editMessageId) {
          setMessages((prev) => {
            const index =
              prev.findIndex(
                (message) =>
                  message.id ===
                  editMessageId
              );

            if (index === -1) {
              return prev;
            }

            return [
              ...prev.slice(
                0,
                index
              ),
              {
                ...prev[index],
                content: value,
                timestamp:
                  new Date(),
                edited: true,
              },
              ...prev.slice(
                index + 1
              ),
            ];
          });

          setEditingId(null);
          setEditingText("");
        } else {
          addMessage(
            "user",
            value
          );
        }

        setIsProcessing(true);

        setStatus("processing");

        setStatusMessage("");

        try {
          const response =
            await fetch(
              CHAT_URL,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                  Accept:
                    "application/json",
                },

                credentials:
                  "include",

                body: JSON.stringify({
                  message: value,
                  language: "rw",
                }),
              }
            );

          if (!response.ok) {
            throw new Error(
              `Request failed: ${response.status}`
            );
          }

          const data =
            await response.json();

          const answer =
            data?.answer ||
            data?.response ||
            data?.message ||
            data?.text ||
            data?.answer_kinyarwanda ||
            data?.answer_rw ||
            "";

          if (!answer) {
            throw new Error(
              "Empty answer"
            );
          }

          setCurrentAnswer(
            answer
          );

          const audioPayload =
            data?.audio ||
            data?.audioUrl ||
            data?.audio_url ||
            data?.voice_url ||
            data?.voiceUrl;

          const audioUrl =
            getAudioUrl(
              audioPayload
            );

          const newAssistant =
            addMessage(
              "assistant",
              answer,
              {
                audioUrl:
                  audioUrl ||
                  null,
              }
            );

          setIsProcessing(
            false
          );

          setStatus(
            audioPayload
              ? "speaking"
              : "ready"
          );

          setStatusMessage("");

          if (audioPayload) {
            playAudio(
              audioPayload,
              newAssistant?.id
            );
          }
        } catch (error) {
          console.error(
            "ANTIMATE CHAT ERROR:",
            error
          );

          setIsProcessing(false);

          setStatus("error");

          setErrorMessage(
            "Ntabwo nshoboye kubona igisubizo ubu. Ongera ugerageze."
          );
        }
      },
      [
        addMessage,
        isProcessing,
        isRecording,
        liveVoice,
        playAudio,
        text,
      ]
    );

  /* ==========================================================
     EDIT MESSAGE
  ========================================================== */

  const beginEdit =
    useCallback(
      (message) => {
        setEditingId(
          message.id
        );

        setEditingText(
          message.content
        );

        setTimeout(() => {
          const input =
            document.querySelector(
              `[data-edit-input="${message.id}"]`
            );

          input?.focus();

          if (
            input?.select
          ) {
            input.select();
          }
        }, 50);
      },
      []
    );

  const cancelEdit =
    useCallback(() => {
      setEditingId(null);
      setEditingText("");
    }, []);

  const submitEdit =
    useCallback(
      (message) => {
        const value =
          editingText.trim();

        if (!value) {
          return;
        }

        sendTextMessage(
          value,
          message.id
        );
      },
      [
        editingText,
        sendTextMessage,
      ]
    );

  /* ==========================================================
     REGENERATE
  ========================================================== */

  const regenerateLastAnswer =
    useCallback(() => {
      const lastUser =
        [...messages]
          .reverse()
          .find(
            (message) =>
              message.role ===
              "user"
          );

      if (!lastUser) {
        return;
      }

      setIsProcessing(true);
      setStatus("processing");

      setMessages((prev) => {
        const lastAssistantIndex =
          [...prev]
            .map(
              (message, index) => ({
                message,
                index,
              })
            )
            .reverse()
            .find(
              ({
                message,
              }) =>
                message.role ===
                "assistant"
            )?.index;

        if (
          lastAssistantIndex ===
          undefined
        ) {
          return prev;
        }

        return prev.filter(
          (_, index) =>
            index !==
            lastAssistantIndex
        );
      });

      sendTextMessage(
        lastUser.content
      );
    }, [
      messages,
      sendTextMessage,
    ]);

  /* ==========================================================
     ENTER
  ========================================================== */

  const handleTextareaKeyDown =
    useCallback(
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          if (
            text.trim()
          ) {
            sendTextMessage();
          }
        }

        if (
          event.key === "Escape"
        ) {
          setText("");
          textareaRef.current?.blur();
        }
      },
      [
        sendTextMessage,
        text,
      ]
    );

  /* ==========================================================
     SOCKET.IO
  ========================================================== */

  useEffect(() => {
    mountedRef.current =
      true;

    const socket =
      io(SOCKET_URL, {
        transports: [
          "websocket",
          "polling",
        ],

        withCredentials: true,

        reconnection: true,

        reconnectionAttempts: Infinity,

        reconnectionDelay: 1000,

        reconnectionDelayMax: 5000,

        timeout: 20000,
      });

    socketRef.current =
      socket;

    socket.on(
      "connect",
      () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        setSocketConnected(
          true
        );

        if (
          !isRecordingRef.current
        ) {
          setStatus("ready");

          setStatusMessage("");

          setErrorMessage("");
        }
      }
    );

    socket.on(
      "disconnect",
      () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        setSocketConnected(
          false
        );

        if (
          !isRecordingRef.current
        ) {
          setStatus("offline");

          setStatusMessage(
            "ANTIMATE server ntiraboneka."
          );
        }
      }
    );

    socket.on(
      "connect_error",
      () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        setSocketConnected(
          false
        );

        setStatus("offline");

        setStatusMessage(
          "Ntabwo nshoboye guhuza na ANTIMATE server."
        );
      }
    );

    socket.io.on(
      "reconnect",
      () => {
        if (
          mountedRef.current
        ) {
          setSocketConnected(
            true
          );
        }
      }
    );

    socket.on(
      "antimate:status",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        const message =
          typeof payload ===
          "string"
            ? payload
            : payload?.message ||
              payload?.status ||
              "";

        if (message) {
          setStatusMessage(
            message
          );
        }
      }
    );

    socket.on(
      "antimate:transcript",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        const value =
          typeof payload ===
          "string"
            ? payload
            : payload?.text ||
              payload?.transcript ||
              "";

        if (value) {
          setTranscript(
            value
          );
        }
      }
    );

    socket.on(
      "antimate:thinking",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        setIsProcessing(
          true
        );

        setStatus(
          "thinking"
        );

        const value =
          typeof payload ===
          "string"
            ? payload
            : payload?.message ||
              payload?.text ||
              "";

        if (value) {
          setThinkingText(
            value
          );
        }
      }
    );

    socket.on(
      "antimate:answer:chunk",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        const chunk =
          typeof payload ===
          "string"
            ? payload
            : payload?.text ||
              payload?.chunk ||
              payload?.content ||
              "";

        if (chunk) {
          setCurrentAnswer(
            (prev) =>
              prev + chunk
          );
        }
      }
    );

    socket.on(
      "antimate:answer",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        const answer =
          typeof payload ===
          "string"
            ? payload
            : payload?.answer ||
              payload?.text ||
              payload?.content ||
              payload?.message ||
              payload?.answer_kinyarwanda ||
              payload?.answer_rw ||
              "";

        if (answer) {
          setCurrentAnswer(
            answer
          );

          const audioUrl =
            getAudioUrl(
              payload?.audio ||
              payload?.audioUrl ||
              payload?.audio_url ||
              payload?.voice_url ||
              payload?.voiceUrl
            );

          addMessage(
            "assistant",
            answer,
            {
              audioUrl:
                audioUrl ||
                null,
            }
          );
        }

        setStatus(
          "speaking"
        );

        setStatusMessage("");
      }
    );

    socket.on(
      "antimate:audio",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        playAudio(
          payload
        );
      }
    );

    socket.on(
      "antimate:complete",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        console.log(
          "ANTIMATE voice complete:",
          payload
        );

        setIsProcessing(
          false
        );

        setStatus(
          liveVoiceRef.current
            ? "speaking"
            : "ready"
        );

        setStatusMessage("");

        if (
          liveVoiceRef.current &&
          voiceSessionActiveRef.current &&
          !liveAudioReceivedRef.current &&
          !isPlayingRef.current
        ) {
          liveWaitingForResponseRef.current =
            false;

          setTimeout(() => {
            if (
              liveVoiceRef.current &&
              voiceSessionActiveRef.current &&
              !isRecordingRef.current &&
              !isPlayingRef.current
            ) {
              startRecordingInternalRef.current?.(
                "live"
              );
            }
          }, 400);
        }
      }
    );

    socket.on(
      "antimate:error",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        const message =
          typeof payload ===
          "string"
            ? payload
            : payload?.message ||
              payload?.error ||
              "ANTIMATE habonye ikibazo.";

        setErrorMessage(
          message
        );

        setIsProcessing(
          false
        );

        setStatus("error");

        setStatusMessage("");

        if (
          liveVoiceRef.current &&
          voiceSessionActiveRef.current
        ) {
          liveWaitingForResponseRef.current =
            false;

          setTimeout(() => {
            if (
              liveVoiceRef.current &&
              voiceSessionActiveRef.current &&
              !isRecordingRef.current &&
              !isPlayingRef.current
            ) {
              startRecordingInternalRef.current?.(
                "live"
              );
            }
          }, 700);
        }
      }
    );

    return () => {
      mountedRef.current =
        false;

      socket.removeAllListeners();

      socket.io.removeAllListeners(
        "reconnect"
      );

      socket.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }
    };
  }, [
    addMessage,
    playAudio,
  ]);

  /* ==========================================================
     THINKING ROTATION
  ========================================================== */

  useEffect(() => {
    if (!isProcessing) {
      setThinkingIndex(0);
      return;
    }

    const interval =
      setInterval(() => {
        setThinkingIndex(
          (prev) =>
            (prev + 1) %
            THINKING_MESSAGES.length
        );
      }, 2200);

    return () =>
      clearInterval(
        interval
      );
  }, [isProcessing]);

  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      mountedRef.current =
        false;

      if (
        holdTimerRef.current
      ) {
        clearTimeout(
          holdTimerRef.current
        );
      }

      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );
      }

      if (
        mediaRecorderRef.current
      ) {
        try {
          if (
            mediaRecorderRef.current
              .state !==
            "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch {
          // Ignore.
        }
      }

      stopSilenceDetection();

      stopMediaTracks();

      if (
        audioRef.current
      ) {
        try {
          audioRef.current.pause();
        } catch {
          // Ignore.
        }

        audioRef.current =
          null;
      }

      isPlayingRef.current =
        false;

      isRecordingRef.current =
        false;

      liveVoiceRef.current =
        false;

      voiceSessionActiveRef.current =
        false;

      releaseWakeLock();
    };
  }, [
    releaseWakeLock,
    stopMediaTracks,
    stopSilenceDetection,
  ]);

  /* ==========================================================
     DERIVED UI
  ========================================================== */

  const hasText =
    text.trim().length > 0;

  const displayedThinking =
    thinkingText ||
    THINKING_MESSAGES[
      thinkingIndex
    ];

  const lastUserMessage =
    [...messages]
      .reverse()
      .find(
        (message) =>
          message.role ===
          "user"
      );

  const lastAssistantMessage =
    [...messages]
      .reverse()
      .find(
        (message) =>
          message.role ===
          "assistant"
      );

  const messageCount =
    messages.length;

  const wordCount =
    messages
      .reduce(
        (total, message) =>
          total +
          message.content
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length,
        0
      );

  const actionTitle =
    hasText
      ? "Ohereza ubutumwa"
      : isRecording
      ? liveVoice
        ? "Live Voice irakora"
        : "Kanda uhagarike recording"
      : "Kanda ufate amajwi • Hold 5s kuri Live Voice";

  const quickPrompts = useMemo(
    () => [
      {
        icon: "sparkles",
        title: "Tangira ikiganiro",
        text: "Muraho ANTIMATE, wamfasha uyu munsi?",
      },
      {
        icon: "activity",
        title: "Brooder",
        text: "Ni gute nakurikirana neza ubushyuhe n'ubushuhe muri brooder?",
      },
      {
        icon: "info",
        title: "Amakuru",
        text: "Mbwira ibintu by'ingenzi nkeneye kumenya ku micungire y'inkoko.",
      },
    ],
    []
  );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className={`antimate-app ${
        darkMode
          ? "dark"
          : "light"
      }`}
    >
      <style>{`
        /* =====================================================
           RESET
        ===================================================== */

        .antimate-app,
        .antimate-app * {
          box-sizing: border-box;
        }

        .antimate-app {
          --bg: #f7f8fa;
          --bg-deep: #eef1f5;
          --surface: rgba(255,255,255,0.78);
          --surface-solid: #ffffff;
          --surface-soft: rgba(246,248,251,0.88);
          --surface-hover: rgba(238,242,247,0.95);

          --border: rgba(20,28,43,0.09);
          --border-strong: rgba(20,28,43,0.14);

          --text: #101522;
          --text-secondary: #566174;
          --muted: #8a94a5;

          --accent: #2563eb;
          --accent-2: #7c3aed;
          --accent-soft: rgba(37,99,235,0.09);

          --success: #16a34a;
          --danger: #ef4444;
          --warning: #f59e0b;

          --shadow-sm:
            0 2px 8px rgba(15,23,42,0.05);

          --shadow:
            0 16px 45px rgba(15,23,42,0.09);

          --shadow-lg:
            0 30px 80px rgba(15,23,42,0.13);

          min-height: 100vh;
          width: 100%;

          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(37,99,235,0.08),
              transparent 26%
            ),
            radial-gradient(
              circle at 90% 10%,
              rgba(124,58,237,0.06),
              transparent 25%
            ),
            var(--bg);

          color: var(--text);

          font-family:
            Inter,
            ui-sans-serif,
            -apple-system,
            BlinkMacSystemFont,
            "SF Pro Display",
            "SF Pro Text",
            "Segoe UI",
            sans-serif;

          display: flex;
          overflow: hidden;
          position: relative;
        }

        .antimate-app.dark {
          --bg: #070b12;
          --bg-deep: #0b111b;

          --surface:
            rgba(13,18,28,0.76);

          --surface-solid:
            #101722;

          --surface-soft:
            rgba(18,25,37,0.82);

          --surface-hover:
            rgba(28,38,53,0.96);

          --border:
            rgba(255,255,255,0.075);

          --border-strong:
            rgba(255,255,255,0.12);

          --text: #f4f7fb;
          --text-secondary: #a7b0c0;
          --muted: #727e90;

          --accent: #70a5ff;
          --accent-2: #a78bfa;
          --accent-soft:
            rgba(96,165,250,0.12);

          --shadow:
            0 20px 60px rgba(0,0,0,0.30);

          --shadow-lg:
            0 30px 100px rgba(0,0,0,0.42);

          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(37,99,235,0.15),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 0%,
              rgba(124,58,237,0.13),
              transparent 27%
            ),
            var(--bg);
        }

        button,
        textarea {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color:
            transparent;
        }

        /* =====================================================
           LOGO
        ===================================================== */

        .antimate-logo {
          position: relative;
          flex-shrink: 0;

          border-radius: 50%;

          display: grid;
          place-items: center;

          background:
            conic-gradient(
              from 0deg,
              #2563eb,
              #7c3aed,
              #06b6d4,
              #2563eb
            );

          box-shadow:
            0 0 0 4px
              rgba(37,99,235,0.08),
            0 10px 30px
              rgba(37,99,235,0.20);

          animation:
            logoFloat
            6s
            ease-in-out
            infinite;
        }

        .antimate-logo.mini {
          box-shadow:
            0 0 0 3px
              rgba(37,99,235,0.07),
            0 6px 18px
              rgba(37,99,235,0.14);
        }

        .logo-orbit {
          position: absolute;

          border:
            1.5px solid
            rgba(255,255,255,0.92);

          border-radius: 50%;
        }

        .orbit-one {
          width: 68%;
          height: 68%;

          transform:
            rotate(28deg)
            scaleX(0.62);
        }

        .orbit-two {
          width: 68%;
          height: 68%;

          transform:
            rotate(-28deg)
            scaleX(0.62);
        }

        .logo-core {
          width: 18%;
          height: 18%;

          border-radius: 50%;

          background: white;

          box-shadow:
            0 0 14px
            rgba(255,255,255,0.85);
        }

        @keyframes logoFloat {
          0%,
          100% {
            transform:
              translateY(0)
              rotate(0deg);
          }

          50% {
            transform:
              translateY(-2px)
              rotate(3deg);
          }
        }

        /* =====================================================
           APP LAYOUT
        ===================================================== */

        .antimate-shell {
          width: 100%;
          height: 100vh;

          display: flex;
          position: relative;
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .antimate-sidebar {
          width: 272px;
          height: 100vh;

          flex-shrink: 0;

          display: flex;
          flex-direction: column;

          padding: 18px;

          border-right:
            1px solid
            var(--border);

          background:
            rgba(
              250,
              251,
              253,
              0.72
            );

          backdrop-filter:
            blur(28px);

          -webkit-backdrop-filter:
            blur(28px);

          z-index: 50;

          transition:
            transform 0.32s
              cubic-bezier(
                .22,
                1,
                .36,
                1
              );
        }

        .dark .antimate-sidebar {
          background:
            rgba(
              8,
              13,
              21,
              0.72
            );
        }

        .sidebar-brand {
          display: flex;
          align-items: center;

          gap: 11px;

          padding:
            6px 5px 20px;
        }

        .sidebar-brand-copy {
          min-width: 0;
        }

        .sidebar-brand-name {
          font-size: 16px;
          font-weight: 850;

          letter-spacing:
            -0.04em;
        }

        .sidebar-brand-sub {
          margin-top: 4px;

          color:
            var(--muted);

          font-size: 10px;

          font-weight: 700;

          letter-spacing:
            0.10em;

          text-transform:
            uppercase;
        }

        .new-chat-button {
          width: 100%;

          height: 46px;

          display: flex;
          align-items: center;
          gap: 10px;

          padding:
            0 14px;

          border:
            1px solid
            var(--border-strong);

          border-radius: 14px;

          color:
            var(--text);

          background:
            var(--surface);

          box-shadow:
            var(--shadow-sm);

          cursor: pointer;

          font-weight: 750;
          font-size: 13px;

          transition:
            transform 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .new-chat-button:hover {
          transform:
            translateY(-1px);

          background:
            var(--surface-hover);

          box-shadow:
            var(--shadow);
        }

        .sidebar-section {
          margin-top: 28px;
        }

        .sidebar-label {
          padding:
            0 7px 9px;

          font-size: 10px;

          font-weight: 800;

          text-transform:
            uppercase;

          letter-spacing:
            0.09em;

          color:
            var(--muted);
        }

        .sidebar-feature {
          display: flex;
          align-items: center;

          gap: 10px;

          width: 100%;

          padding:
            10px 8px;

          border-radius: 12px;

          color:
            var(--text-secondary);

          font-size: 12px;
          font-weight: 650;
        }

        .sidebar-feature-icon {
          width: 30px;
          height: 30px;

          display: grid;
          place-items: center;

          border-radius: 9px;

          color:
            var(--accent);

          background:
            var(--accent-soft);
        }

        .sidebar-spacer {
          flex: 1;
        }

        .sidebar-status {
          padding:
            12px;

          border:
            1px solid
            var(--border);

          border-radius: 15px;

          background:
            var(--surface-soft);
        }

        .sidebar-status-row {
          display: flex;
          align-items: center;

          gap: 8px;

          font-size: 11px;
          font-weight: 750;
        }

        .status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            var(--danger);
        }

        .status-dot.online {
          background:
            var(--success);

          box-shadow:
            0 0 0 5px
            rgba(22,163,74,0.09);
        }

        .sidebar-status-text {
          color:
            var(--text-secondary);
        }

        .sidebar-footer {
          padding-top: 12px;

          color:
            var(--muted);

          text-align: center;

          font-size: 9px;

          line-height: 1.5;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .antimate-main {
          min-width: 0;
          flex: 1;

          height: 100vh;

          display: flex;
          flex-direction: column;

          position: relative;
        }

        /* =====================================================
           TOPBAR
        ===================================================== */

        .antimate-topbar {
          height: 68px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 26px;

          border-bottom:
            1px solid
            var(--border);

          background:
            var(--surface);

          backdrop-filter:
            blur(24px);

          -webkit-backdrop-filter:
            blur(24px);

          position: relative;

          z-index: 20;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-menu {
          width: 38px;
          height: 38px;

          display: none;
          place-items: center;

          border:
            1px solid
            var(--border);

          border-radius: 12px;

          background:
            var(--surface-soft);

          color:
            var(--text);

          cursor: pointer;
        }

        .topbar-title {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .topbar-title-main {
          font-size: 14px;
          font-weight: 800;

          letter-spacing:
            -0.02em;
        }

        .topbar-title-sub {
          color:
            var(--muted);

          font-size: 10px;
          font-weight: 600;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .connection-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          height: 32px;

          padding:
            0 10px;

          border:
            1px solid
            var(--border);

          border-radius:
            999px;

          background:
            var(--surface-soft);

          color:
            var(--text-secondary);

          font-size: 10px;
          font-weight: 750;
        }

        .theme-button {
          width: 34px;
          height: 34px;

          display: grid;
          place-items: center;

          border:
            1px solid
            var(--border);

          border-radius: 11px;

          color:
            var(--text-secondary);

          background:
            var(--surface-soft);

          cursor: pointer;

          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .theme-button:hover {
          transform:
            translateY(-1px);

          background:
            var(--surface-hover);
        }

        /* =====================================================
           CHAT SCROLL AREA
        ===================================================== */

        .antimate-scroll {
          flex: 1;

          overflow-y: auto;
          overflow-x: hidden;

          scroll-behavior: smooth;

          scrollbar-width:
            thin;

          scrollbar-color:
            var(--border-strong)
            transparent;
        }

        .antimate-scroll::-webkit-scrollbar {
          width: 7px;
        }

        .antimate-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .antimate-scroll::-webkit-scrollbar-thumb {
          background:
            var(--border-strong);

          border-radius:
            999px;
        }

        .chat-container {
          width:
            min(
              900px,
              calc(100% - 40px)
            );

          margin:
            0 auto;

          padding:
            36px 0 210px;
        }

        /* =====================================================
           WELCOME
        ===================================================== */

        .welcome {
          min-height:
            calc(
              100vh - 280px
            );

          display: flex;
          align-items: center;
          justify-content: center;

          padding:
            35px 0;
        }

        .welcome-inner {
          width: 100%;
          max-width: 690px;

          text-align: center;
        }

        .welcome-logo-wrap {
          width: 74px;
          height: 74px;

          margin:
            0 auto 20px;

          display: grid;
          place-items: center;

          border-radius: 25px;

          background:
            linear-gradient(
              145deg,
              var(--surface-solid),
              var(--surface-soft)
            );

          border:
            1px solid
            var(--border);

          box-shadow:
            var(--shadow-lg);
        }

        .welcome-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding:
            6px 10px;

          border-radius:
            999px;

          background:
            var(--accent-soft);

          color:
            var(--accent);

          font-size: 10px;
          font-weight: 800;

          letter-spacing:
            0.05em;

          text-transform:
            uppercase;

          margin-bottom: 12px;
        }

        .welcome-title {
          margin:
            0;

          font-size:
            clamp(
              34px,
              6vw,
              56px
            );

          line-height:
            0.98;

          letter-spacing:
            -0.065em;

          font-weight:
            850;
        }

        .welcome-title-gradient {
          background:
            linear-gradient(
              100deg,
              var(--text) 15%,
              var(--accent) 52%,
              var(--accent-2) 90%
            );

          -webkit-background-clip:
            text;

          background-clip:
            text;

          color:
            transparent;
        }

        .welcome-subtitle {
          max-width:
            560px;

          margin:
            18px auto 0;

          color:
            var(--text-secondary);

          font-size: 14px;

          line-height:
            1.75;
        }

        .quick-prompts {
          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 10px;

          margin-top:
            28px;
        }

        .quick-card {
          text-align:
            left;

          border:
            1px solid
            var(--border);

          background:
            var(--surface);

          border-radius:
            17px;

          padding:
            15px;

          cursor: pointer;

          color:
            var(--text);

          box-shadow:
            var(--shadow-sm);

          transition:
            transform 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease,
            box-shadow 0.22s ease;
        }

        .quick-card:hover {
          transform:
            translateY(-3px);

          background:
            var(--surface-hover);

          border-color:
            var(--border-strong);

          box-shadow:
            var(--shadow);
        }

        .quick-card-icon {
          width: 33px;
          height: 33px;

          display: grid;
          place-items: center;

          border-radius:
            10px;

          background:
            var(--accent-soft);

          color:
            var(--accent);

          margin-bottom:
            11px;
        }

        .quick-card-title {
          font-size:
            12px;

          font-weight:
            800;

          margin-bottom:
            4px;
        }

        .quick-card-text {
          color:
            var(--muted);

          font-size:
            10px;

          line-height:
            1.5;
        }

        /* =====================================================
           MESSAGE LIST
        ===================================================== */

        .message-list {
          display:
            flex;

          flex-direction:
            column;

          gap:
            30px;
        }

        .message-row {
          display:
            flex;

          width:
            100%;

          animation:
            messageIn
            0.38s
            cubic-bezier(
              .22,
              1,
              .36,
              1
            );
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform:
              translateY(8px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        .message-row.user {
          justify-content:
            flex-end;
        }

        .message-row.assistant {
          justify-content:
            flex-start;

          align-items:
            flex-start;

          gap:
            12px;
        }

        .assistant-avatar {
          width:
            34px;

          height:
            34px;

          flex-shrink:
            0;

          display:
            grid;

          place-items:
            center;

          margin-top:
            1px;
        }

        .assistant-avatar
        .antimate-logo {
          width:
            32px !important;

          height:
            32px !important;
        }

        .message-content-column {
          max-width:
            min(
              760px,
              86%
            );

          min-width:
            0;
        }

        .message-meta {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          margin:
            0 0 6px 2px;

          color:
            var(--muted);

          font-size:
            9px;

          font-weight:
            700;
        }

        .message-bubble {
          line-height:
            1.72;

          font-size:
            14px;

          white-space:
            pre-wrap;

          word-break:
            break-word;
        }

        .message-bubble.user {
          padding:
            12px 16px;

          border-radius:
            19px 19px 6px 19px;

          background:
            linear-gradient(
              135deg,
              var(--text),
              #273246
            );

          color:
            #ffffff;

          box-shadow:
            0 8px 24px
            rgba(
              15,
              23,
              42,
              0.12
            );
        }

        .dark .message-bubble.user {
          background:
            linear-gradient(
              135deg,
              #eaf0f7,
              #cbd5e1
            );

          color:
            #101522;
        }

        .message-bubble.assistant {
          padding:
            2px 0;

          color:
            var(--text);
        }

        /* =====================================================
           MESSAGE ACTIONS
        ===================================================== */

        .message-actions {
          display:
            flex;

          align-items:
            center;

          gap:
            3px;

          margin-top:
            8px;

          opacity:
            0;

          transform:
            translateY(
              -3px
            );

          pointer-events:
            none;

          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }

        .message-row:hover
        .message-actions,
        .message-actions:focus-within {
          opacity:
            1;

          transform:
            translateY(0);

          pointer-events:
            auto;
        }

        .message-row.user
        .message-actions {
          justify-content:
            flex-end;
        }

        .message-action {
          height:
            29px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          padding:
            0 7px;

          border:
            0;

          border-radius:
            8px;

          background:
            transparent;

          color:
            var(--muted);

          cursor:
            pointer;

          font-size:
            9px;

          font-weight:
            700;

          transition:
            background 0.18s ease,
            color 0.18s ease;
        }

        .message-action:hover {
          background:
            var(--surface-hover);

          color:
            var(--text);
        }

        .message-action.active {
          color:
            var(--accent);
        }

        /* =====================================================
           EDIT
        ===================================================== */

        .edit-box {
          width:
            min(
              700px,
              100%
            );

          padding:
            10px;

          border:
            1px solid
            var(--border-strong);

          border-radius:
            18px;

          background:
            var(--surface);

          box-shadow:
            var(--shadow);

          backdrop-filter:
            blur(20px);
        }

        .edit-textarea {
          width:
            100%;

          min-height:
            90px;

          resize:
            vertical;

          border:
            0;

          outline:
            0;

          background:
            transparent;

          color:
            var(--text);

          font-size:
            14px;

          line-height:
            1.6;

          padding:
            5px;
        }

        .edit-controls {
          display:
            flex;

          justify-content:
            flex-end;

          gap:
            7px;

          margin-top:
            7px;
        }

        .edit-control {
          border:
            0;

          border-radius:
            10px;

          padding:
            7px 11px;

          cursor:
            pointer;

          font-size:
            10px;

          font-weight:
            800;
        }

        .edit-cancel {
          color:
            var(--text-secondary);

          background:
            var(--surface-hover);
        }

        .edit-save {
          color:
            white;

          background:
            var(--accent);
        }

        /* =====================================================
           TRANSCRIPT
        ===================================================== */

        .transcript-card {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            10px;

          margin:
            6px 0 0 46px;

          padding:
            12px 14px;

          max-width:
            700px;

          border:
            1px solid
            rgba(
              37,
              99,
              235,
              0.14
            );

          border-left:
            3px solid
            var(--accent);

          border-radius:
            0 13px 13px 0;

          background:
            var(--accent-soft);

          color:
            var(--text-secondary);

          font-size:
            11px;

          line-height:
            1.6;

          animation:
            softIn
            0.3s
            ease;
        }

        @keyframes softIn {
          from {
            opacity: 0;
            transform:
              translateY(4px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        .transcript-label {
          flex-shrink:
            0;

          color:
            var(--accent);

          font-weight:
            850;
        }

        /* =====================================================
           THINKING
        ===================================================== */

        .thinking-row {
          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          margin-left:
            46px;

          min-height:
            34px;

          color:
            var(--muted);

          font-size:
            11px;

          animation:
            softIn
            0.3s
            ease;
        }

        .thinking-avatar {
          width:
            32px;

          height:
            32px;

          display:
            grid;

          place-items:
            center;
        }

        .thinking-copy {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;
        }

        .thinking-dots {
          display:
            flex;

          gap:
            3px;
        }

        .thinking-dots span {
          width:
            4px;

          height:
            4px;

          border-radius:
            50%;

          background:
            var(--accent);

          animation:
            thinkingDot
            1.15s
            infinite
            ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay:
            0.14s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay:
            0.28s;
        }

        @keyframes thinkingDot {
          0%,
          60%,
          100% {
            opacity:
              0.25;

            transform:
              translateY(
                0
              );
          }

          30% {
            opacity:
              1;

            transform:
              translateY(
                -4px
              );
          }
        }

        /* =====================================================
           SPEAKING BAR
        ===================================================== */

        .speaking-bar {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            9px;

          margin:
            14px 0 0 46px;

          padding:
            7px 11px;

          border:
            1px solid
            var(--border);

          border-radius:
            999px;

          background:
            var(--surface);

          box-shadow:
            var(--shadow-sm);

          color:
            var(--text-secondary);

          font-size:
            10px;

          font-weight:
            700;

          animation:
            softIn
            0.3s
            ease;
        }

        .speaking-bars {
          display:
            flex;

          align-items:
            center;

          gap:
            2px;

          height:
            15px;
        }

        .speaking-bars span {
          width:
            2px;

          border-radius:
            4px;

          background:
            var(--accent);

          animation:
            audioBar
            0.8s
            ease-in-out
            infinite;
        }

        .speaking-bars span:nth-child(1) {
          height:
            5px;
        }

        .speaking-bars span:nth-child(2) {
          height:
            11px;

          animation-delay:
            0.1s;
        }

        .speaking-bars span:nth-child(3) {
          height:
            7px;

          animation-delay:
            0.2s;
        }

        .speaking-bars span:nth-child(4) {
          height:
            13px;

          animation-delay:
            0.3s;
        }

        .speaking-bars span:nth-child(5) {
          height:
            8px;

          animation-delay:
            0.4s;
        }

        @keyframes audioBar {
          50% {
            transform:
              scaleY(
                0.3
              );
          }
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .error-banner {
          margin:
            20px auto 0;

          width:
            min(
              700px,
              100%
            );

          padding:
            11px 14px;

          display:
            flex;

          align-items:
            flex-start;

          gap:
            9px;

          border:
            1px solid
            rgba(
              239,
              68,
              68,
              0.16
            );

          border-radius:
            13px;

          background:
            rgba(
              239,
              68,
              68,
              0.07
            );

          color:
            var(--danger);

          font-size:
            11px;

          line-height:
            1.5;
        }

        /* =====================================================
           SCROLL BUTTON
        ===================================================== */

        .scroll-button {
          position:
            fixed;

          right:
            30px;

          bottom:
            135px;

          width:
            36px;

          height:
            36px;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid
            var(--border-strong);

          border-radius:
            50%;

          background:
            var(--surface);

          backdrop-filter:
            blur(18px);

          color:
            var(--text);

          box-shadow:
            var(--shadow);

          cursor:
            pointer;

          z-index:
            40;

          animation:
            softIn
            0.25s
            ease;
        }

        .scroll-button:hover {
          transform:
            translateY(
              -2px
            );
        }

        /* =====================================================
           COMPOSER AREA
        ===================================================== */

        .composer-layer {
          position:
            absolute;

          left:
            0;

          right:
            0;

          bottom:
            0;

          z-index:
            30;

          pointer-events:
            none;

          padding:
            15px 0
            max(
              16px,
              env(
                safe-area-inset-bottom
              )
            );
        }

        .composer-gradient {
          position:
            absolute;

          left:
            0;

          right:
            0;

          bottom:
            0;

          height:
            180px;

          background:
            linear-gradient(
              to top,
              var(--bg) 15%,
              transparent
            );

          pointer-events:
            none;
        }

        .composer-inner {
          width:
            min(
              900px,
              calc(100% - 40px)
            );

          margin:
            0 auto;

          position:
            relative;

          pointer-events:
            auto;
        }

        .composer-shell {
          border:
            1px solid
            var(--border-strong);

          border-radius:
            23px;

          background:
            var(--surface);

          backdrop-filter:
            blur(28px)
            saturate(
              1.25
            );

          -webkit-backdrop-filter:
            blur(28px)
            saturate(
              1.25
            );

          box-shadow:
            var(--shadow-lg);

          padding:
            8px;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .composer-shell:focus-within {
          border-color:
            rgba(
              37,
              99,
              235,
              0.28
            );

          box-shadow:
            0 22px 70px
              rgba(
                15,
                23,
                42,
                0.13
              );
        }

        .composer-recording-info {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          padding:
            4px 10px 7px;

          color:
            var(--muted);

          font-size:
            9px;

          font-weight:
            750;
        }

        .recording-info-left {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;
        }

        .recording-indicator {
          width:
            7px;

          height:
            7px;

          border-radius:
            50%;

          background:
            var(--danger);

          box-shadow:
            0 0 0 5px
              rgba(
                239,
                68,
                68,
                0.07
              );

          animation:
            recordingPulse
            1.2s
            infinite;
        }

        .recording-indicator.live {
          background:
            var(--accent-2);

          box-shadow:
            0 0 0 5px
              rgba(
                124,
                58,
                237,
                0.08
              );
        }

        @keyframes recordingPulse {
          0%,
          100% {
            opacity:
              1;
          }

          50% {
            opacity:
              0.35;
          }
        }

        .recording-time {
          color:
            var(--text);

          font-variant-numeric:
            tabular-nums;

          font-weight:
            850;
        }

        .composer-main {
          display:
            flex;

          align-items:
            flex-end;

          gap:
            7px;
        }

        .composer-textarea {
          flex:
            1;

          min-width:
            0;

          min-height:
            44px;

          max-height:
            160px;

          resize:
            none;

          border:
            0;

          outline:
            none;

          background:
            transparent;

          color:
            var(--text);

          font-size:
            14px;

          line-height:
            1.55;

          padding:
            11px 10px;

          overflow-y:
            auto;
        }

        .composer-textarea::placeholder {
          color:
            var(--muted);
        }

        .composer-textarea:disabled {
          opacity:
            0.55;
        }

        .composer-button {
          width:
            45px;

          height:
            45px;

          flex-shrink:
            0;

          display:
            grid;

          place-items:
            center;

          border:
            0;

          border-radius:
            15px;

          color:
            var(--bg);

          background:
            var(--text);

          cursor:
            pointer;

          transition:
            transform 0.18s ease,
            opacity 0.18s ease,
            box-shadow 0.18s ease;
        }

        .composer-button:hover {
          transform:
            translateY(
              -1px
            );

          box-shadow:
            0 8px 24px
              rgba(
                15,
                23,
                42,
                0.15
              );
        }

        .composer-button:active {
          transform:
            scale(
              0.94
            );
        }

        .composer-button:disabled {
          opacity:
            0.4;

          cursor:
            not-allowed;

          transform:
            none;

          box-shadow:
            none;
        }

        .composer-button.recording {
          color:
            white;

          background:
            var(--danger);

          animation:
            recordingButton
            1.5s
            infinite;
        }

        .composer-button.live {
          color:
            white;

          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #5b21b6
            );

          animation:
            liveButton
            1.5s
            infinite;
        }

        @keyframes recordingButton {
          0%,
          100% {
            box-shadow:
              0 0 0 0
                rgba(
                  239,
                  68,
                  68,
                  0.25
                );
          }

          50% {
            box-shadow:
              0 0 0 9px
                rgba(
                  239,
                  68,
                  68,
                  0.05
                );
          }
        }

        @keyframes liveButton {
          0%,
          100% {
            box-shadow:
              0 0 0 0
                rgba(
                  124,
                  58,
                  237,
                  0.3
                );
          }

          50% {
            box-shadow:
              0 0 0 10px
                rgba(
                  124,
                  58,
                  237,
                  0.05
                );
          }
        }

        .composer-footer {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          padding:
            7px 8px 1px;
        }

        .composer-hint {
          color:
            var(--muted);

          font-size:
            9px;

          line-height:
            1.4;
        }

        .composer-count {
          color:
            var(--muted);

          font-size:
            9px;

          font-variant-numeric:
            tabular-nums;
        }

        .live-stop-button {
          width:
            100%;

          margin-top:
            7px;

          padding:
            8px;

          border:
            1px solid
            rgba(
              124,
              58,
              237,
              0.15
            );

          border-radius:
            11px;

          color:
            var(--text-secondary);

          background:
            rgba(
              124,
              58,
              237,
              0.07
            );

          cursor:
            pointer;

          font-size:
            10px;

          font-weight:
            800;

          transition:
            background 0.18s ease;
        }

        .live-stop-button:hover {
          background:
            rgba(
              124,
              58,
              237,
              0.12
            );
        }

        /* =====================================================
           LIVE VOICE CENTER
        ===================================================== */

        .live-status {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            10px;

          margin:
            14px 0 0;

          color:
            var(--accent-2);

          font-size:
            10px;

          font-weight:
            800;
        }

        .live-wave {
          display:
            flex;

          align-items:
            center;

          gap:
            2px;

          height:
            16px;
        }

        .live-wave span {
          width:
            2px;

          border-radius:
            4px;

          background:
            var(--accent-2);

          animation:
            liveWave
            0.9s
            ease-in-out
            infinite;
        }

        .live-wave span:nth-child(1) {
          height:
            5px;
        }

        .live-wave span:nth-child(2) {
          height:
            10px;

          animation-delay:
            .1s;
        }

        .live-wave span:nth-child(3) {
          height:
            15px;

          animation-delay:
            .2s;
        }

        .live-wave span:nth-child(4) {
          height:
            8px;

          animation-delay:
            .3s;
        }

        .live-wave span:nth-child(5) {
          height:
            12px;

          animation-delay:
            .4s;
        }

        @keyframes liveWave {
          50% {
            transform:
              scaleY(
                .25
              );
          }
        }

        /* =====================================================
           MOBILE OVERLAY
        ===================================================== */

        .sidebar-overlay {
          position:
            fixed;

          inset:
            0;

          background:
            rgba(
              0,
              0,
              0,
              0.34
            );

          backdrop-filter:
            blur(3px);

          z-index:
            45;

          display:
            none;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 900px) {
          .antimate-sidebar {
            position:
              fixed;

            left:
              0;

            top:
              0;

            transform:
              translateX(
                -105%
              );

            box-shadow:
              20px 0 70px
                rgba(
                  0,
                  0,
                  0,
                  0.18
                );
          }

          .antimate-sidebar.open {
            transform:
              translateX(
                0
              );
          }

          .sidebar-overlay {
            display:
              block;

            opacity:
              0;

            pointer-events:
              none;

            transition:
              opacity 0.25s ease;
          }

          .sidebar-overlay.open {
            opacity:
              1;

            pointer-events:
              auto;
          }

          .mobile-menu {
            display:
              grid;
          }

          .chat-container {
            width:
              min(
                900px,
                calc(100% - 28px)
              );
          }

          .quick-prompts {
            grid-template-columns:
              1fr;
          }

          .quick-card {
            display:
              flex;

            align-items:
              center;

            gap:
              11px;
          }

          .quick-card-icon {
            margin:
              0;
          }

          .quick-card-copy {
            min-width:
              0;
          }
        }

        @media (max-width: 640px) {
          .antimate-topbar {
            height:
              60px;

            padding:
              0 12px;
          }

          .topbar-title-sub {
            display:
              none;
          }

          .connection-pill {
            height:
              29px;

            padding:
              0 8px;
          }

          .connection-pill
          .connection-label-text {
            display:
              none;
          }

          .chat-container {
            width:
              calc(
                100% - 20px
              );

            padding:
              24px 0 190px;
          }

          .welcome {
            min-height:
              calc(
                100vh - 240px
              );
          }

          .welcome-title {
            font-size:
              38px;
          }

          .welcome-subtitle {
            font-size:
              13px;
          }

          .quick-prompts {
            margin-top:
              22px;
          }

          .message-list {
            gap:
              25px;
          }

          .message-row.assistant {
            gap:
              8px;
          }

          .assistant-avatar {
            width:
              29px;

            height:
              29px;
          }

          .assistant-avatar
          .antimate-logo {
            width:
              28px !important;

            height:
              28px !important;
          }

          .message-content-column {
            max-width:
              calc(
                100% - 37px
              );
          }

          .message-bubble {
            font-size:
              13.5px;
          }

          .message-bubble.user {
            padding:
              10px 13px;
          }

          .message-actions {
            opacity:
              1;

            transform:
              none;

            pointer-events:
              auto;
          }

          .message-action {
            padding:
              0 6px;
          }

          .message-action-label {
            display:
              none;
          }

          .transcript-card,
          .thinking-row,
          .speaking-bar {
            margin-left:
              37px;
          }

          .composer-inner {
            width:
              calc(
                100% - 12px
              );
          }

          .composer-shell {
            border-radius:
              19px;

            padding:
              7px;
          }

          .composer-textarea {
            font-size:
              13.5px;

            min-height:
              42px;
          }

          .composer-button {
            width:
              43px;

            height:
              43px;

            border-radius:
              14px;
          }

          .composer-hint {
            max-width:
              78%;

            white-space:
              nowrap;

            overflow:
              hidden;

            text-overflow:
              ellipsis;
          }

          .scroll-button {
            right:
              18px;

            bottom:
              122px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .antimate-app *,
          .antimate-app *::before,
          .antimate-app *::after {
            animation-duration:
              0.01ms !important;

            animation-iteration-count:
              1 !important;

            scroll-behavior:
              auto !important;

            transition-duration:
              0.01ms !important;
          }
        }
      `}</style>

      {/* ======================================================
          MOBILE SIDEBAR OVERLAY
      ====================================================== */}

      <div
        className={`sidebar-overlay ${
          sidebarOpen
            ? "open"
            : ""
        }`}
        onClick={() =>
          setSidebarOpen(false)
        }
      />

      <div className="antimate-shell">
        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside
          className={`antimate-sidebar ${
            sidebarOpen
              ? "open"
              : ""
          }`}
        >
          <div className="sidebar-brand">
            <LogoMark size={39} />

            <div className="sidebar-brand-copy">
              <div className="sidebar-brand-name">
                ANTIMATE
              </div>

              <div className="sidebar-brand-sub">
                Intelligence
              </div>
            </div>
          </div>

          <button
            type="button"
            className="new-chat-button"
            onClick={() => {
              setMessages([]);
              setText("");
              setTranscript("");
              setCurrentAnswer("");
              setErrorMessage("");
              setSidebarOpen(false);
              scrollToBottom(false);
            }}
          >
            <Icon
              name="plus"
              size={17}
            />

            <span>
              Ikiganiro gishya
            </span>
          </button>

          <div className="sidebar-section">
            <div className="sidebar-label">
              ANTIMATE
            </div>

            <div className="sidebar-feature">
              <span className="sidebar-feature-icon">
                <Icon
                  name="sparkles"
                  size={15}
                />
              </span>

              <span>
                AI Assistant
              </span>
            </div>

            <div className="sidebar-feature">
              <span className="sidebar-feature-icon">
                <Icon
                  name="activity"
                  size={15}
                />
              </span>

              <span>
                Smart Brooder AI
              </span>
            </div>

            <div className="sidebar-feature">
              <span className="sidebar-feature-icon">
                <Icon
                  name="headphones"
                  size={15}
                />
              </span>

              <span>
                Live Voice
              </span>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">
              Ikiganiro
            </div>

            <div className="sidebar-feature">
              <span className="sidebar-feature-icon">
                <Icon
                  name="clock"
                  size={14}
                />
              </span>

              <span>
                {messageCount} messages
              </span>
            </div>

            <div className="sidebar-feature">
              <span className="sidebar-feature-icon">
                <Icon
                  name="keyboard"
                  size={14}
                />
              </span>

              <span>
                {wordCount} words
              </span>
            </div>
          </div>

          <div className="sidebar-spacer" />

          <div className="sidebar-status">
            <div className="sidebar-status-row">
              <span
                className={`status-dot ${
                  socketConnected
                    ? "online"
                    : ""
                }`}
              />

              <span className="sidebar-status-text">
                {socketConnected
                  ? "ANTIMATE Online"
                  : "Connecting…"}
              </span>
            </div>
          </div>

          <div className="sidebar-footer">
            ANTIMATE AI • Intelligent assistance
          </div>
        </aside>

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="antimate-main">
          {/* ==================================================
              TOP BAR
          ================================================== */}

          <header className="antimate-topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="mobile-menu"
                onClick={() =>
                  setSidebarOpen(
                    true
                  )
                }
                aria-label="Open menu"
              >
                <Icon
                  name="menu"
                  size={18}
                />
              </button>

              <div className="topbar-title">
                <div className="topbar-title-main">
                  ANTIMATE AI
                </div>

                <div className="topbar-title-sub">
                  Intelligent conversation
                </div>
              </div>
            </div>

            <div className="topbar-actions">
              <div className="connection-pill">
                <span
                  className={`status-dot ${
                    socketConnected
                      ? "online"
                      : ""
                  }`}
                />

                <span className="connection-label-text">
                  {socketConnected
                    ? "Online"
                    : "Offline"}
                </span>
              </div>

              <button
                type="button"
                className="theme-button"
                onClick={() =>
                  setDarkMode(
                    (prev) =>
                      !prev
                  )
                }
                title={
                  darkMode
                    ? "Light theme"
                    : "Dark theme"
                }
                aria-label={
                  darkMode
                    ? "Light theme"
                    : "Dark theme"
                }
              >
                <Icon
                  name={
                    darkMode
                      ? "sun"
                      : "moon"
                  }
                  size={16}
                />
              </button>
            </div>
          </header>

          {/* ==================================================
              SCROLL AREA
          ================================================== */}

          <div
            ref={scrollRef}
            className="antimate-scroll"
            onScroll={
              handleScroll
            }
          >
            <div className="chat-container">
              {/* ================================================
                  EMPTY / WELCOME
              ================================================= */}

              {messages.length ===
                0 &&
              !transcript &&
              !currentAnswer ? (
                <section className="welcome">
                  <div className="welcome-inner">
                    <div className="welcome-logo-wrap">
                      <LogoMark
                        size={58}
                      />
                    </div>

                    <div className="welcome-eyebrow">
                      <Icon
                        name="sparkles"
                        size={12}
                      />

                      ANTIMATE AI
                    </div>

                    <h1 className="welcome-title">
                      Muraho.
                      <br />

                      <span className="welcome-title-gradient">
                        Tuvugane ubwenge.
                      </span>
                    </h1>

                    <p className="welcome-subtitle">
                      Ndi ANTIMATE — umufasha wawe
                      w'ubwenge. Andika ikibazo,
                      vuga ukoresheje ijwi, cyangwa
                      tangira Live Voice tuganire
                      mu buryo busanzwe.
                    </p>

                    <div className="quick-prompts">
                      {quickPrompts.map(
                        (prompt) => (
                          <button
                            type="button"
                            key={
                              prompt.title
                            }
                            className="quick-card"
                            onClick={() => {
                              setText(
                                prompt.text
                              );

                              textareaRef.current?.focus();
                            }}
                          >
                            <span className="quick-card-icon">
                              <Icon
                                name={
                                  prompt.icon
                                }
                                size={16}
                              />
                            </span>

                            <span className="quick-card-copy">
                              <span className="quick-card-title">
                                {
                                  prompt.title
                                }
                              </span>

                              <span className="quick-card-text">
                                {
                                  prompt.text
                                }
                              </span>
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="message-list">
                  {/* ==============================================
                      MESSAGES
                  ============================================== */}

                  {messages.map(
                    (message) => {
                      const isEditing =
                        editingId ===
                        message.id;

                      const isUser =
                        message.role ===
                        "user";

                      return (
                        <div
                          key={
                            message.id
                          }
                          className={`message-row ${
                            message.role
                          }`}
                        >
                          {!isUser && (
                            <div className="assistant-avatar">
                              <LogoMark
                                size={31}
                                mini
                              />
                            </div>
                          )}

                          <div className="message-content-column">
                            <div className="message-meta">
                              <span>
                                {isUser
                                  ? "Wowe"
                                  : "ANTIMATE"}
                              </span>

                              <span>
                                •
                              </span>

                              <span>
                                {formatTime(
                                  new Date(
                                    message.timestamp
                                  )
                                )}
                              </span>

                              {message.edited && (
                                <>
                                  <span>
                                    •
                                  </span>

                                  <span>
                                    edited
                                  </span>
                                </>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="edit-box">
                                <textarea
                                  data-edit-input={
                                    message.id
                                  }
                                  className="edit-textarea"
                                  value={
                                    editingText
                                  }
                                  maxLength={
                                    MAX_TEXT_LENGTH
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setEditingText(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  onKeyDown={(
                                    event
                                  ) => {
                                    if (
                                      event.key ===
                                        "Enter" &&
                                      !event.shiftKey
                                    ) {
                                      event.preventDefault();

                                      submitEdit(
                                        message
                                      );
                                    }

                                    if (
                                      event.key ===
                                      "Escape"
                                    ) {
                                      cancelEdit();
                                    }
                                  }}
                                />

                                <div className="edit-controls">
                                  <button
                                    type="button"
                                    className="edit-control edit-cancel"
                                    onClick={
                                      cancelEdit
                                    }
                                  >
                                    Kureka
                                  </button>

                                  <button
                                    type="button"
                                    className="edit-control edit-save"
                                    onClick={() =>
                                      submitEdit(
                                        message
                                      )
                                    }
                                    disabled={
                                      !editingText.trim()
                                    }
                                  >
                                    Ohereza
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`message-bubble ${
                                  message.role
                                }`}
                              >
                                {
                                  message.content
                                }
                              </div>
                            )}

                            {!isEditing && (
                              <div className="message-actions">
                                <button
                                  type="button"
                                  className={`message-action ${
                                    copiedId ===
                                    message.id
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    copyMessage(
                                      message
                                    )
                                  }
                                  title="Copy"
                                >
                                  <Icon
                                    name={
                                      copiedId ===
                                      message.id
                                        ? "check"
                                        : "copy"
                                    }
                                    size={13}
                                  />

                                  <span className="message-action-label">
                                    {copiedId ===
                                    message.id
                                      ? "Copied"
                                      : "Copy"}
                                  </span>
                                </button>

                                {isUser && (
                                  <button
                                    type="button"
                                    className="message-action"
                                    onClick={() =>
                                      beginEdit(
                                        message
                                      )
                                    }
                                    title="Edit"
                                  >
                                    <Icon
                                      name="edit"
                                      size={13}
                                    />

                                    <span className="message-action-label">
                                      Edit
                                    </span>
                                  </button>
                                )}

                                {!isUser &&
                                  message.audioUrl && (
                                    <button
                                      type="button"
                                      className={`message-action ${
                                        replayingId ===
                                        message.id
                                          ? "active"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        replayMessage(
                                          message
                                        )
                                      }
                                      title="Replay voice"
                                    >
                                      <Icon
                                        name="volume"
                                        size={13}
                                      />

                                      <span className="message-action-label">
                                        {replayingId ===
                                        message.id
                                          ? "Playing"
                                          : "Replay"}
                                      </span>
                                    </button>
                                  )}

                                {!isUser &&
                                  message ===
                                    lastAssistantMessage && (
                                    <button
                                      type="button"
                                      className="message-action"
                                      onClick={
                                        regenerateLastAnswer
                                      }
                                      title="Regenerate"
                                    >
                                      <Icon
                                        name="refresh"
                                        size={13}
                                      />

                                      <span className="message-action-label">
                                        Regenerate
                                      </span>
                                    </button>
                                  )}

                                {!isUser &&
                                  isPlaying &&
                                  replayingId ===
                                    message.id && (
                                    <button
                                      type="button"
                                      className="message-action"
                                      onClick={
                                        stopAudio
                                      }
                                      title="Stop voice"
                                    >
                                      <Icon
                                        name="stop"
                                        size={11}
                                      />

                                      <span className="message-action-label">
                                        Stop
                                      </span>
                                    </button>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}

                  {/* ============================================
                      TRANSCRIPT
                  ============================================ */}

                  {transcript && (
                    <div className="transcript-card">
                      <span className="transcript-label">
                        Wavuze:
                      </span>

                      <span>
                        {transcript}
                      </span>
                    </div>
                  )}

                  {/* ============================================
                      THINKING
                  ============================================ */}

                  {isProcessing && (
                    <div className="thinking-row">
                      <div className="thinking-avatar">
                        <LogoMark
                          size={29}
                          mini
                        />
                      </div>

                      <div className="thinking-copy">
                        <span>
                          {
                            displayedThinking
                          }
                        </span>

                        <div className="thinking-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================
                      STREAMING CURRENT ANSWER
                  ============================================ */}

                  {currentAnswer &&
                    !messages.some(
                      (message) =>
                        message.role ===
                          "assistant" &&
                        message.content ===
                          currentAnswer
                    ) && (
                      <div className="message-row assistant">
                        <div className="assistant-avatar">
                          <LogoMark
                            size={31}
                            mini
                          />
                        </div>

                        <div className="message-content-column">
                          <div className="message-meta">
                            <span>
                              ANTIMATE
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              now
                            </span>
                          </div>

                          <div className="message-bubble assistant">
                            {
                              currentAnswer
                            }
                          </div>
                        </div>
                      </div>
                    )}

                  {/* ============================================
                      SPEAKING
                  ============================================ */}

                  {isPlaying && (
                    <div className="speaking-bar">
                      <Icon
                        name="volume"
                        size={14}
                      />

                      <span>
                        ANTIMATE iri kuvuga
                      </span>

                      <div className="speaking-bars">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>

                      <button
                        type="button"
                        className="message-action"
                        onClick={
                          stopAudio
                        }
                        style={{
                          height: 24,
                          padding:
                            "0 5px",
                        }}
                      >
                        <Icon
                          name="stop"
                          size={9}
                        />

                        <span>
                          Stop
                        </span>
                      </button>
                    </div>
                  )}

                  {/* ============================================
                      ERROR
                  ============================================ */}

                  {errorMessage && (
                    <div className="error-banner">
                      <Icon
                        name="info"
                        size={15}
                      />

                      <span>
                        {errorMessage}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* ==================================================
              SCROLL TO BOTTOM
          ================================================== */}

          {showScrollButton && (
            <button
              type="button"
              className="scroll-button"
              onClick={() =>
                scrollToBottom()
              }
              title="Go to latest"
              aria-label="Go to latest"
            >
              <Icon
                name="arrowDown"
                size={16}
              />
            </button>
          )}

          {/* ==================================================
              COMPOSER
          ================================================== */}

          <div className="composer-layer">
            <div className="composer-gradient" />

            <div className="composer-inner">
              {liveVoice && (
                <div className="live-status">
                  <div className="live-wave">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <span>
                    LIVE VOICE ACTIVE
                  </span>
                </div>
              )}

              <div className="composer-shell">
                {/* ============================================
                    RECORDING INFO
                ============================================ */}

                {isRecording && (
                  <div className="composer-recording-info">
                    <div className="recording-info-left">
                      <span
                        className={`recording-indicator ${
                          liveVoice
                            ? "live"
                            : ""
                        }`}
                      />

                      <span>
                        {liveVoice
                          ? "LIVE VOICE"
                          : "RECORDING"}
                      </span>
                    </div>

                    <span className="recording-time">
                      {liveVoice
                        ? "Silence 1.8s"
                        : `00:${String(
                            recordingSeconds
                          ).padStart(
                            2,
                            "0"
                          )}`}
                    </span>
                  </div>
                )}

                {/* ============================================
                    MAIN INPUT
                ============================================ */}

                <div className="composer-main">
                  <textarea
                    ref={textareaRef}
                    className="composer-textarea"
                    value={text}
                    maxLength={
                      MAX_TEXT_LENGTH
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event
                          .target
                          .value;

                      setText(
                        value
                      );

                      const element =
                        event.target;

                      element.style.height =
                        "auto";

                      element.style.height =
                        `${Math.min(
                          element.scrollHeight,
                          160
                        )}px`;
                    }}
                    onKeyDown={
                      handleTextareaKeyDown
                    }
                    placeholder={
                      liveVoice
                        ? "Live Voice irakora…"
                        : "Andika ubutumwa kuri ANTIMATE…"
                    }
                    disabled={
                      liveVoice
                    }
                    rows={1}
                  />

                  {!hasText ? (
                    <button
                      type="button"
                      className={`composer-button ${
                        isRecording
                          ? liveVoice
                            ? "live"
                            : "recording"
                          : ""
                      }`}
                      title={
                        actionTitle
                      }
                      aria-label={
                        actionTitle
                      }
                      disabled={
                        isProcessing &&
                        !liveVoice &&
                        !isRecording
                      }
                      onPointerDown={
                        handleVoicePointerDown
                      }
                      onPointerUp={
                        handleVoicePointerUp
                      }
                      onPointerCancel={
                        handleVoicePointerCancel
                      }
                    >
                      {isRecording ? (
                        liveVoice ? (
                          <Icon
                            name="activity"
                            size={20}
                          />
                        ) : (
                          <Icon
                            name="stop"
                            size={18}
                          />
                        )
                      ) : (
                        <Icon
                          name="mic"
                          size={21}
                        />
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="composer-button"
                      title="Ohereza ubutumwa"
                      aria-label="Ohereza ubutumwa"
                      disabled={
                        isProcessing ||
                        isRecording ||
                        liveVoice
                      }
                      onClick={() =>
                        sendTextMessage()
                      }
                    >
                      <Icon
                        name="send"
                        size={19}
                      />
                    </button>
                  )}
                </div>

                {/* ============================================
                    FOOTER
                ============================================ */}

                <div className="composer-footer">
                  <div className="composer-hint">
                    {liveVoice
                      ? "Vuga → silence 1.8s → auto send → voice reply"
                      : isRecording
                      ? "Kanda mic uhagarike"
                      : "Mic = voice • Hold 5s = Live Voice • Enter = send"}
                  </div>

                  <div className="composer-count">
                    {text.length > 0
                      ? `${text.length}/${MAX_TEXT_LENGTH}`
                      : ""}
                  </div>
                </div>

                {/* ============================================
                    LIVE STOP
                ============================================ */}

                {liveVoice && (
                  <button
                    type="button"
                    className="live-stop-button"
                    onClick={
                      stopLiveVoice
                    }
                  >
                    Hagarika Live Voice
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}