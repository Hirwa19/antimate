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
 ANTIMATE AI — MARKET LEVEL CHAT UI
 ------------------------------------------------------------
 Features:
 - Apple-inspired premium UI
 - Responsive desktop/mobile
 - Light/Dark theme
 - Smooth message animations
 - Edit recent user message
 - Copy message
 - Replay AI voice
 - Stop AI voice
 - Regenerate last AI answer
 - Live Voice
 - Live transcript / captions
 - Recording timer
 - Silence detection
 - Socket.IO voice streaming
 - Text chat
 - Quick prompts
 - Auto scroll
 - Scroll-to-bottom button
 - Message timestamps
 - Message action toolbar
 - Connection indicator
 - Thinking animation
 - Voice waveform
 - Composer auto resize
 - Keyboard shortcuts
 - Mobile safe-area support
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

const QUICK_PROMPTS = [
  {
    icon: "🐔",
    text: "Mpa inama zo kurera inkoko neza",
  },
  {
    icon: "🌡️",
    text: "Ni gute nakwirinda ubushyuhe bwinshi mu kiraro?",
  },
  {
    icon: "💧",
    text: "Humidity nziza ku nkoko ni ingahe?",
  },
  {
    icon: "🩺",
    text: "Ni ibihe bimenyetso by'indwara mu nkoko?",
  },
];

/* ============================================================
   ICON SYSTEM
============================================================ */

function Icon({
  name,
  size = 20,
  strokeWidth = 1.9,
  className = "",
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const paths = {
    send: (
      <>
        <path d="M21.7 2.3 10.8 13.2" />
        <path d="m21.7 2.3-7 19.4-3.9-8.5-8.5-3.9 19.4-7Z" />
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
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
        <path d="M3 4v6h6" />
        <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
        <path d="M21 20v-6h-6" />
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
        <path d="M4 10v4h4l5 4v-6" />
        <path d="M13 6v2" />
      </>
    ),

    chevronDown: <path d="m6 9 6 6 6-6" />,

    arrowDown: (
      <>
        <path d="M12 5v14" />
        <path d="m6 13 6 6 6-6" />
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
        <path d="m18 6-12 12" />
      </>
    ),

    sparkles: (
      <>
        <path d="m12 3-1.1 4.1L7 8.5l3.9 1.4L12 14l1.1-4.1L17 8.5l-3.9-1.4Z" />
        <path d="m19 13-.6 2.4L16 16l2.4.6L19 19l.6-2.4L22 16l-2.4-.6Z" />
        <path d="m5 15-.5 2L2 17.5l2.5.5L5 20l.5-2L8 17.5 5.5 17Z" />
      </>
    ),

    menu: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    wifi: (
      <>
        <path d="M5 12.5a11 11 0 0 1 14 0" />
        <path d="M8 15.5a6.8 6.8 0 0 1 8 0" />
        <path d="M11 18.5a2.5 2.5 0 0 1 2 0" />
      </>
    ),

    keyboard: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 10h.01M11 10h.01M15 10h.01M19 10h.01" />
        <path d="M7 14h10" />
      </>
    ),

    arrowUp: (
      <>
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

/* ============================================================
   LOGO
============================================================ */

function LogoMark({ size = 38 }) {
  return (
    <div
      className="antimate-logo"
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="antimate-logo-orbit orbit-one" />
      <div className="antimate-logo-orbit orbit-two" />
      <div className="antimate-logo-core">
        <span />
      </div>
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
  if (!url) return "";

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
  if (!payload) return "";

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

function formatTime(date = Date.now()) {
  try {
    return new Intl.DateTimeFormat("rw-RW", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

function formatRecordingTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;

  return `${String(mins).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")}`;
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AntimateAI() {
  /* ==========================================================
     CHAT
  ========================================================== */

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  /* ==========================================================
     CONNECTION
  ========================================================== */

  const [socketConnected, setSocketConnected] =
    useState(false);

  /* ==========================================================
     AI STATUS
  ========================================================== */

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [status, setStatus] = useState("ready");
  const [statusMessage, setStatusMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [thinkingText, setThinkingText] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* ==========================================================
     RECORDING
  ========================================================== */

  const [recordingSeconds, setRecordingSeconds] =
    useState(30);

  const [recordingMode, setRecordingMode] =
    useState("tap");

  const [liveVoice, setLiveVoice] = useState(false);

  /* ==========================================================
     THINKING
  ========================================================== */

  const [thinkingIndex, setThinkingIndex] = useState(0);

  /* ==========================================================
     UI
  ========================================================== */

  const [showScrollButton, setShowScrollButton] =
    useState(false);

  const [showQuickPrompts, setShowQuickPrompts] =
    useState(true);

  const [isNearBottom, setIsNearBottom] =
    useState(true);

  /* ==========================================================
     REFS
  ========================================================== */

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const recordingMimeTypeRef = useRef("");
  const recordingExtensionRef = useRef("");

  const holdTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const pointerActiveRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isPlayingRef = useRef(false);

  const recordingModeRef = useRef("tap");

  const liveVoiceRef = useRef(false);
  const voiceSessionActiveRef = useRef(false);

  const audioRef = useRef(null);
  const currentAudioUrlRef = useRef("");

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const silenceAnimationRef = useRef(null);
  const silenceStartedAtRef = useRef(null);
  const speechDetectedRef = useRef(false);

  const liveWaitingForResponseRef = useRef(false);
  const liveAudioReceivedRef = useRef(false);

  const wakeLockRef = useRef(null);

  const mountedRef = useRef(true);

  const textareaRef = useRef(null);
  const chatScrollRef = useRef(null);

  const stopRecordingRef = useRef(null);
  const startRecordingInternalRef = useRef(null);

  const messageIdRef = useRef(1);

  const latestUserMessageRef = useRef("");

  /* ==========================================================
     CREATE ID
  ========================================================== */

  const createId = useCallback(() => {
    const id = messageIdRef.current;
    messageIdRef.current += 1;

    return `${Date.now()}-${id}`;
  }, []);

  /* ==========================================================
     WAKE LOCK
  ========================================================== */

  const requestWakeLock = useCallback(async () => {
    try {
      if (!("wakeLock" in navigator)) return;
      if (wakeLockRef.current) return;

      wakeLockRef.current =
        await navigator.wakeLock.request("screen");

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

  const releaseWakeLock = useCallback(async () => {
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
     STOP AUDIO
  ========================================================== */

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Ignore.
      }
    }

    if (
      currentAudioUrlRef.current &&
      currentAudioUrlRef.current.startsWith("blob:")
    ) {
      try {
        URL.revokeObjectURL(
          currentAudioUrlRef.current
        );
      } catch {
        // Ignore.
      }
    }

    currentAudioUrlRef.current = "";
    audioRef.current = null;

    isPlayingRef.current = false;
    setIsPlaying(false);

    if (!liveVoiceRef.current) {
      setStatus("ready");
      setStatusMessage("");
    }
  }, []);

  /* ==========================================================
     SILENCE DETECTION
  ========================================================== */

  const stopSilenceDetection = useCallback(() => {
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

  /* ==========================================================
     STOP MEDIA TRACKS
  ========================================================== */

  const stopMediaTracks = useCallback(() => {
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

  /* ==========================================================
     ADD MESSAGE
  ========================================================== */

  const addMessage = useCallback(
    (role, content, extra = {}) => {
      if (!content) return null;

      const id = createId();

      const message = {
        id,
        role,
        content,
        createdAt: Date.now(),
        ...extra,
      };

      setMessages((prev) => [
        ...prev,
        message,
      ]);

      return id;
    },
    [createId]
  );

  /* ==========================================================
     UPDATE MESSAGE
  ========================================================== */

  const updateMessage = useCallback(
    (id, updates) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id
            ? {
                ...message,
                ...updates,
              }
            : message
        )
      );
    },
    []
  );

  /* ==========================================================
     REMOVE MESSAGE
  ========================================================== */

  const removeMessagesAfter = useCallback(
    (id) => {
      setMessages((prev) => {
        const index = prev.findIndex(
          (message) => message.id === id
        );

        if (index === -1) return prev;

        return prev.slice(0, index + 1);
      });
    },
    []
  );

  /* ==========================================================
     START SILENCE DETECTION
  ========================================================== */

  const startSilenceDetection = useCallback(
    (stream) => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContextClass) return;

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

        analyserRef.current = analyser;

        const data = new Uint8Array(
          analyser.fftSize
        );

        const detect = () => {
          if (!isRecordingRef.current) return;

          if (!liveVoiceRef.current) return;

          analyser.getByteTimeDomainData(data);

          let sum = 0;

          for (let i = 0; i < data.length; i++) {
            const normalized =
              (data[i] - 128) / 128;

            sum += normalized * normalized;
          }

          const rms = Math.sqrt(
            sum / data.length
          );

          const voiceThreshold = 0.025;

          if (rms > voiceThreshold) {
            speechDetectedRef.current = true;
            silenceStartedAtRef.current = null;
          } else if (
            speechDetectedRef.current
          ) {
            if (!silenceStartedAtRef.current) {
              silenceStartedAtRef.current =
                Date.now();
            }

            const silentFor =
              Date.now() -
              silenceStartedAtRef.current;

            if (
              silentFor >= LIVE_SILENCE_MS
            ) {
              silenceStartedAtRef.current = null;

              if (stopRecordingRef.current) {
                stopRecordingRef.current({
                  liveSegment: true,
                });
              }

              return;
            }
          }

          silenceAnimationRef.current =
            requestAnimationFrame(detect);
        };

        detect();
      } catch (error) {
        console.warn(
          "Silence detection unavailable:",
          error
        );
      }
    },
    []
  );

  /* ==========================================================
     PLAY AUDIO
  ========================================================== */

  const playAudio = useCallback(
    (payload, messageId = null) => {
      const audioUrl = getAudioUrl(payload);

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

      stopAudio();

      currentAudioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);

      audio.preload = "auto";

      audioRef.current = audio;

      isPlayingRef.current = true;

      setIsPlaying(true);
      setStatus("speaking");

      setStatusMessage(
        "ANTIMATE iri kuvuga…"
      );

      liveAudioReceivedRef.current = true;

      if (messageId) {
        updateMessage(messageId, {
          audioUrl,
        });
      }

      audio.onended = () => {
        if (!mountedRef.current) return;

        if (
          audioUrl.startsWith("blob:")
        ) {
          try {
            URL.revokeObjectURL(audioUrl);
          } catch {
            // Ignore.
          }
        }

        currentAudioUrlRef.current = "";

        audioRef.current = null;

        isPlayingRef.current = false;

        setIsPlaying(false);

        setStatus("ready");
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
          }, 300);
        } else {
          releaseWakeLock();
        }
      };

      audio.onerror = () => {
        if (!mountedRef.current) return;

        currentAudioUrlRef.current = "";

        audioRef.current = null;

        isPlayingRef.current = false;

        setIsPlaying(false);

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
          "Audio autoplay failed:",
          error
        );

        isPlayingRef.current = false;
        setIsPlaying(false);

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
    [
      releaseWakeLock,
      stopAudio,
      updateMessage,
    ]
  );

  /* ==========================================================
     START RECORDING
  ========================================================== */

  const startRecordingInternal = useCallback(
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

      if (isRecordingRef.current) {
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

        mediaStreamRef.current = stream;

        const mimeType =
          getSupportedMimeType();

        recordingMimeTypeRef.current =
          mimeType;

        recordingExtensionRef.current =
          extensionFromMimeType(
            mimeType
          );

        const recorderOptions = mimeType
          ? { mimeType }
          : undefined;

        const recorder =
          new MediaRecorder(
            stream,
            recorderOptions
          );

        mediaRecorderRef.current = recorder;

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

        recordingModeRef.current = mode;

        isRecordingRef.current = true;

        if (mode === "live") {
          liveVoiceRef.current = true;
          voiceSessionActiveRef.current =
            true;

          setLiveVoice(true);
          setRecordingMode("live");

          setStatus("listening");

          setStatusMessage(
            "Live Voice: ndagutega…"
          );

          speechDetectedRef.current = false;
          silenceStartedAtRef.current = null;
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
            mimeType: sessionMimeType,
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
            mediaRecorderRef.current = null;
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

        recorder.onerror = (event) => {
          console.error(
            "MediaRecorder error:",
            event
          );

          isRecordingRef.current = false;

          setIsRecording(false);

          stopMediaTracks();

          setIsProcessing(false);

          setStatus("error");

          setStatusMessage("");

          setErrorMessage(
            "Habaye ikibazo mu gufata amajwi."
          );
        };

        recorder.start(AUDIO_CHUNK_MS);

        setIsRecording(true);

        if (mode === "live") {
          startSilenceDetection(stream);
        }
      } catch (error) {
        console.error(
          "START RECORDING ERROR:",
          error
        );

        isRecordingRef.current = false;

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
      releaseWakeLock,
      requestWakeLock,
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

  const stopRecording = useCallback(
    ({ liveSegment = false } = {}) => {
      if (!isRecordingRef.current) {
        return;
      }

      isRecordingRef.current = false;

      setIsRecording(false);

      stopSilenceDetection();

      if (recordingTimerRef.current) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current = null;
      }

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !== "inactive"
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
        liveVoiceRef.current = false;

        voiceSessionActiveRef.current =
          false;

        setLiveVoice(false);

        setRecordingMode("tap");

        releaseWakeLock();
      } else {
        liveVoiceRef.current = true;

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
      if (recordingTimerRef.current) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current = null;
      }

      return;
    }

    recordingTimerRef.current =
      setInterval(() => {
        setRecordingSeconds((prev) => {
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
        });
      }, 1000);

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current = null;
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
        if (text.trim()) return;

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

        pointerActiveRef.current = true;

        if (isRecordingRef.current) {
          if (!liveVoiceRef.current) {
            stopRecording({
              liveSegment: false,
            });
          }

          return;
        }

        startRecordingInternal("tap");

        holdTimerRef.current =
          setTimeout(() => {
            if (!pointerActiveRef.current) {
              return;
            }

            if (!isRecordingRef.current) {
              return;
            }

            liveVoiceRef.current = true;

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

            if (mediaStreamRef.current) {
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
    useCallback((event) => {
      try {
        event.currentTarget.releasePointerCapture?.(
          event.pointerId
        );
      } catch {
        // Ignore.
      }

      pointerActiveRef.current = false;

      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current = null;
      }

      if (liveVoiceRef.current) {
        return;
      }
    }, []);

  const handleVoicePointerCancel =
    useCallback(() => {
      pointerActiveRef.current = false;

      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current = null;
      }
    }, []);

  /* ==========================================================
     STOP LIVE VOICE
  ========================================================== */

  const stopLiveVoice = useCallback(() => {
    liveVoiceRef.current = false;

    voiceSessionActiveRef.current = false;

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

  const sendTextMessage = useCallback(
    async (
      overrideText = null,
      options = {}
    ) => {
      const value =
        overrideText !== null
          ? overrideText.trim()
          : text.trim();

      if (!value) return;

      if (
        isProcessing &&
        !options.allowDuringProcessing
      ) {
        return;
      }

      if (isRecording) return;
      if (liveVoice) return;

      setErrorMessage("");

      if (overrideText === null) {
        setText("");
      }

      setTranscript("");
      setCurrentAnswer("");

      const userId = addMessage(
        "user",
        value,
        {
          edited: Boolean(
            options.edited
          ),
        }
      );

      latestUserMessageRef.current =
        value;

      setIsProcessing(true);

      setStatus("processing");
      setStatusMessage("");

      try {
        const response = await fetch(
          CHAT_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },

            credentials: "include",

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

        setCurrentAnswer(answer);

        const assistantId = addMessage(
          "assistant",
          answer
        );

        const audioPayload =
          data?.audio ||
          data?.audioUrl ||
          data?.audio_url ||
          data?.voice_url ||
          data?.voiceUrl;

        if (audioPayload) {
          const audioUrl =
            getAudioUrl(audioPayload);

          updateMessage(
            assistantId,
            {
              audioUrl,
            }
          );

          playAudio(
            audioPayload,
            assistantId
          );
        }

        setIsProcessing(false);

        setStatus("ready");

        setStatusMessage("");

        return {
          userId,
          assistantId,
          answer,
        };
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

        return null;
      }
    },
    [
      addMessage,
      isProcessing,
      isRecording,
      liveVoice,
      playAudio,
      text,
      updateMessage,
    ]
  );

  /* ==========================================================
     EDIT MESSAGE
  ========================================================== */

  const startEditMessage = useCallback(
    (message) => {
      if (!message || message.role !== "user") {
        return;
      }

      setEditingId(message.id);
      setEditingText(message.content);

      setTimeout(() => {
        const editor =
          document.querySelector(
            `[data-edit-input="${message.id}"]`
          );

        editor?.focus();
      }, 50);
    },
    []
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingText("");
  }, []);

  const submitEdit = useCallback(
    async (message) => {
      const value =
        editingText.trim();

      if (!value) return;

      setEditingId(null);
      setEditingText("");

      setMessages((prev) => {
        const index = prev.findIndex(
          (item) =>
            item.id === message.id
        );

        if (index === -1) {
          return prev;
        }

        const next = prev.slice(
          0,
          index
        );

        return next;
      });

      setIsProcessing(true);
      setStatus("processing");

      setErrorMessage("");

      try {
        const response = await fetch(
          CHAT_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },

            credentials: "include",

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

        const newUserId = addMessage(
          "user",
          value,
          {
            edited: true,
          }
        );

        const assistantId = addMessage(
          "assistant",
          answer
        );

        const audioPayload =
          data?.audio ||
          data?.audioUrl ||
          data?.audio_url ||
          data?.voice_url ||
          data?.voiceUrl;

        if (audioPayload) {
          updateMessage(
            assistantId,
            {
              audioUrl:
                getAudioUrl(
                  audioPayload
                ),
            }
          );

          playAudio(
            audioPayload,
            assistantId
          );
        }

        latestUserMessageRef.current =
          value;

        setCurrentAnswer(answer);

        setIsProcessing(false);
        setStatus("ready");
        setStatusMessage("");

        return {
          newUserId,
          assistantId,
        };
      } catch (error) {
        console.error(
          "EDIT MESSAGE ERROR:",
          error
        );

        setIsProcessing(false);

        setStatus("error");

        setErrorMessage(
          "Ntabwo nshoboye kohereza ubutumwa bwahinduwe."
        );
      }
    },
    [
      addMessage,
      editingText,
      playAudio,
      updateMessage,
    ]
  );

  /* ==========================================================
     COPY MESSAGE
  ========================================================== */

  const copyMessage = useCallback(
    async (message) => {
      try {
        await navigator.clipboard.writeText(
          message.content
        );

        setCopiedId(message.id);

        setTimeout(() => {
          setCopiedId((current) =>
            current === message.id
              ? null
              : current
          );
        }, 1600);
      } catch (error) {
        console.warn(
          "Clipboard unavailable:",
          error
        );
      }
    },
    []
  );

  /* ==========================================================
     REPLAY MESSAGE AUDIO
  ========================================================== */

  const replayMessage = useCallback(
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
     REGENERATE LAST ANSWER
  ========================================================== */

  const regenerateLastAnswer =
    useCallback(async () => {
      const lastUser = [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "user"
        );

      if (!lastUser) return;

      if (
        isProcessing ||
        isRecording ||
        liveVoice
      ) {
        return;
      }

      const index = messages.findIndex(
        (message) =>
          message.id === lastUser.id
      );

      setMessages((prev) =>
        prev.slice(0, index + 1)
      );

      setIsProcessing(true);

      setStatus("thinking");

      setStatusMessage("");

      try {
        const response = await fetch(
          CHAT_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              message:
                lastUser.content,
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

        const assistantId = addMessage(
          "assistant",
          answer
        );

        const audioPayload =
          data?.audio ||
          data?.audioUrl ||
          data?.audio_url ||
          data?.voice_url ||
          data?.voiceUrl;

        if (audioPayload) {
          updateMessage(
            assistantId,
            {
              audioUrl:
                getAudioUrl(
                  audioPayload
                ),
            }
          );

          playAudio(
            audioPayload,
            assistantId
          );
        }

        setCurrentAnswer(answer);

        setIsProcessing(false);

        setStatus("ready");
      } catch (error) {
        console.error(
          "REGENERATE ERROR:",
          error
        );

        setIsProcessing(false);

        setStatus("error");

        setErrorMessage(
          "Ntabwo nshoboye kongera gutanga igisubizo."
        );
      }
    }, [
      addMessage,
      isProcessing,
      isRecording,
      liveVoice,
      messages,
      playAudio,
      updateMessage,
    ]);

  /* ==========================================================
     ENTER KEY
  ========================================================== */

  const handleTextareaKeyDown =
    useCallback(
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          if (text.trim()) {
            sendTextMessage();
          }

          return;
        }

        if (
          event.key === "Escape" &&
          editingId
        ) {
          cancelEdit();
        }
      },
      [
        cancelEdit,
        editingId,
        sendTextMessage,
        text,
      ]
    );

  /* ==========================================================
     SOCKET.IO
  ========================================================== */

  useEffect(() => {
    mountedRef.current = true;

    const socket = io(SOCKET_URL, {
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

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;

      setSocketConnected(true);

      if (!isRecordingRef.current) {
        setStatus("ready");
        setStatusMessage("");
        setErrorMessage("");
      }
    });

    socket.on(
      "disconnect",
      (reason) => {
        console.warn(
          "ANTIMATE socket disconnected:",
          reason
        );

        if (!mountedRef.current) return;

        setSocketConnected(false);

        if (!isRecordingRef.current) {
          setStatus("offline");

          setStatusMessage(
            "ANTIMATE server ntiraboneka."
          );
        }
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "ANTIMATE socket error:",
          error
        );

        if (!mountedRef.current) return;

        setSocketConnected(false);

        setStatus("offline");

        setStatusMessage(
          "Ntabwo nshoboye guhuza na ANTIMATE server."
        );
      }
    );

    socket.io.on(
      "reconnect",
      () => {
        if (!mountedRef.current) return;

        setSocketConnected(true);

        if (!isRecordingRef.current) {
          setStatus("ready");
          setStatusMessage("");
        }
      }
    );

    socket.on(
      "antimate:status",
      (payload) => {
        if (!mountedRef.current) return;

        const message =
          typeof payload === "string"
            ? payload
            : payload?.message ||
              payload?.status ||
              "";

        if (message) {
          setStatusMessage(message);
        }
      }
    );

    socket.on(
      "antimate:transcript",
      (payload) => {
        if (!mountedRef.current) return;

        const value =
          typeof payload === "string"
            ? payload
            : payload?.text ||
              payload?.transcript ||
              "";

        if (value) {
          setTranscript(value);
        }
      }
    );

    socket.on(
      "antimate:thinking",
      (payload) => {
        if (!mountedRef.current) return;

        setIsProcessing(true);

        setStatus("thinking");

        const value =
          typeof payload === "string"
            ? payload
            : payload?.message ||
              payload?.text ||
              "";

        if (value) {
          setThinkingText(value);
        }
      }
    );

    socket.on(
      "antimate:answer:chunk",
      (payload) => {
        if (!mountedRef.current) return;

        const chunk =
          typeof payload === "string"
            ? payload
            : payload?.text ||
              payload?.chunk ||
              payload?.content ||
              "";

        if (chunk) {
          setCurrentAnswer(
            (prev) => prev + chunk
          );
        }
      }
    );

    socket.on(
      "antimate:answer",
      (payload) => {
        if (!mountedRef.current) return;

        const answer =
          typeof payload === "string"
            ? payload
            : payload?.answer ||
              payload?.text ||
              payload?.content ||
              payload?.message ||
              payload?.answer_kinyarwanda ||
              payload?.answer_rw ||
              "";

        if (answer) {
          setCurrentAnswer(answer);

          addMessage(
            "assistant",
            answer
          );
        }

        setStatus("speaking");
        setStatusMessage("");
      }
    );

    socket.on(
      "antimate:audio",
      (payload) => {
        if (!mountedRef.current) return;

        /*
         * Attach audio to the most recent
         * assistant message when possible.
         */

        setMessages((prev) => {
          const lastAssistant =
            [...prev]
              .reverse()
              .find(
                (message) =>
                  message.role ===
                  "assistant"
              );

          if (!lastAssistant) {
            return prev;
          }

          const audioUrl =
            getAudioUrl(payload);

          if (!audioUrl) {
            return prev;
          }

          return prev.map(
            (message) =>
              message.id ===
              lastAssistant.id
                ? {
                    ...message,
                    audioUrl,
                  }
                : message
          );
        });

        playAudio(payload);
      }
    );

    socket.on(
      "antimate:complete",
      (payload) => {
        if (!mountedRef.current) return;

        console.log(
          "ANTIMATE voice complete:",
          payload
        );

        setIsProcessing(false);

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
        if (!mountedRef.current) return;

        console.error(
          "ANTIMATE voice error:",
          payload
        );

        const message =
          typeof payload === "string"
            ? payload
            : payload?.message ||
              payload?.error ||
              "ANTIMATE habonye ikibazo.";

        setErrorMessage(message);

        setIsProcessing(false);

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
      mountedRef.current = false;

      socket.removeAllListeners();

      socket.io.removeAllListeners(
        "reconnect"
      );

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [addMessage, playAudio]);

  /* ==========================================================
     THINKING ROTATION
  ========================================================== */

  useEffect(() => {
    if (!isProcessing) {
      setThinkingIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setThinkingIndex(
        (prev) =>
          (prev + 1) %
          THINKING_MESSAGES.length
      );
    }, 2200);

    return () =>
      clearInterval(interval);
  }, [isProcessing]);

  /* ==========================================================
     AUTO SCROLL
  ========================================================== */

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const container =
        chatScrollRef.current;

      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth
          ? "smooth"
          : "auto",
      });
    },
    []
  );

  useEffect(() => {
    if (isNearBottom) {
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    }
  }, [
    messages,
    transcript,
    currentAnswer,
    isProcessing,
    isNearBottom,
    scrollToBottom,
  ]);

  const handleChatScroll = useCallback(() => {
    const container =
      chatScrollRef.current;

    if (!container) return;

    const distance =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    const near =
      distance < 180;

    setIsNearBottom(near);
    setShowScrollButton(!near);
  }, []);

  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current = null;
      }

      if (recordingTimerRef.current) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current = null;
      }

      if (mediaRecorderRef.current) {
        try {
          if (
            mediaRecorderRef.current
              .state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch {
          // Ignore.
        }
      }

      stopSilenceDetection();
      stopMediaTracks();
      stopAudio();

      isPlayingRef.current = false;
      isRecordingRef.current = false;

      liveVoiceRef.current = false;
      voiceSessionActiveRef.current = false;

      releaseWakeLock();
    };
  }, [
    releaseWakeLock,
    stopAudio,
    stopMediaTracks,
    stopSilenceDetection,
  ]);

  /* ==========================================================
     TEXTAREA AUTO HEIGHT
  ========================================================== */

  const handleTextChange = useCallback(
    (event) => {
      const value = event.target.value;

      setText(value);

      const element = event.target;

      element.style.height = "auto";

      element.style.height = `${Math.min(
        element.scrollHeight,
        150
      )}px`;
    },
    []
  );

  /* ==========================================================
     QUICK PROMPT
  ========================================================== */

  const handleQuickPrompt = useCallback(
    (prompt) => {
      setText(prompt);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    },
    []
  );

  /* ==========================================================
     UI DERIVED VALUES
  ========================================================== */

  const hasText = text.trim().length > 0;

  const connectionLabel =
    socketConnected
      ? "Online"
      : "Offline";

  const displayedThinking =
    thinkingText ||
    THINKING_MESSAGES[thinkingIndex];

  const lastAssistantMessage =
    useMemo(
      () =>
        [...messages]
          .reverse()
          .find(
            (message) =>
              message.role ===
              "assistant"
          ),
      [messages]
    );

  const hasConversation =
    messages.length > 0 ||
    Boolean(transcript) ||
    Boolean(currentAnswer);

  /* ==========================================================
     MESSAGE ACTIONS
  ========================================================== */

  const renderMessageActions = (
    message,
    isLastAssistant
  ) => {
    const canEdit =
      message.role === "user" &&
      messages[
        messages.length - 1
      ]?.id === message.id;

    return (
      <div
        className={`message-actions ${
          message.role === "user"
            ? "user-actions"
            : ""
        }`}
      >
        <button
          type="button"
          className="message-action"
          title="Copy"
          onClick={() =>
            copyMessage(message)
          }
        >
          <Icon
            name={
              copiedId === message.id
                ? "check"
                : "copy"
            }
            size={15}
          />

          <span>
            {copiedId === message.id
              ? "Copied"
              : "Copy"}
          </span>
        </button>

        {message.role === "user" &&
          canEdit && (
            <button
              type="button"
              className="message-action"
              title="Edit"
              onClick={() =>
                startEditMessage(
                  message
                )
              }
            >
              <Icon
                name="edit"
                size={15}
              />

              <span>Edit</span>
            </button>
          )}

        {message.role ===
          "assistant" &&
          message.audioUrl && (
            <button
              type="button"
              className={`message-action ${
                isPlaying &&
                isLastAssistant
                  ? "active"
                  : ""
              }`}
              title={
                isPlaying &&
                isLastAssistant
                  ? "Stop"
                  : "Replay voice"
              }
              onClick={() => {
                if (
                  isPlaying &&
                  isLastAssistant
                ) {
                  stopAudio();
                } else {
                  replayMessage(
                    message
                  );
                }
              }}
            >
              <Icon
                name={
                  isPlaying &&
                  isLastAssistant
                    ? "stop"
                    : "volume"
                }
                size={15}
              />

              <span>
                {isPlaying &&
                isLastAssistant
                  ? "Stop"
                  : "Replay"}
              </span>
            </button>
          )}

        {message.role ===
          "assistant" &&
          isLastAssistant && (
            <button
              type="button"
              className="message-action"
              title="Regenerate"
              disabled={
                isProcessing ||
                isRecording ||
                liveVoice
              }
              onClick={
                regenerateLastAnswer
              }
            >
              <Icon
                name="refresh"
                size={15}
              />

              <span>Regenerate</span>
            </button>
          )}
      </div>
    );
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="antimate-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        :root {
          color-scheme: light dark;
        }

        .antimate-page {
          --bg: #f5f7fa;
          --surface: rgba(255,255,255,0.78);
          --surface-solid: #ffffff;
          --surface-soft: rgba(247,249,252,0.86);
          --surface-hover: rgba(242,245,249,0.95);
          --border: rgba(17,24,39,0.08);
          --border-strong: rgba(17,24,39,0.13);
          --text: #111827;
          --muted: #6b7280;
          --muted-2: #9aa2af;
          --primary: #111827;
          --primary-text: #ffffff;
          --accent: #2563eb;
          --accent-2: #7c3aed;
          --success: #16a34a;
          --danger: #ef4444;
          --warning: #f59e0b;

          min-height: 100dvh;
          width: 100%;

          background:
            radial-gradient(
              900px 450px at 50% -180px,
              rgba(37,99,235,0.10),
              transparent 70%
            ),
            radial-gradient(
              600px 300px at 100% 10%,
              rgba(124,58,237,0.06),
              transparent 70%
            ),
            var(--bg);

          color: var(--text);

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "SF Pro Display",
            "SF Pro Text",
            "Segoe UI",
            sans-serif;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        @media (prefers-color-scheme: dark) {
          .antimate-page {
            --bg: #070a0f;
            --surface: rgba(15,19,27,0.74);
            --surface-solid: #10151d;
            --surface-soft: rgba(18,24,33,0.88);
            --surface-hover: rgba(26,33,44,0.95);
            --border: rgba(255,255,255,0.08);
            --border-strong: rgba(255,255,255,0.13);
            --text: #f5f7fb;
            --muted: #929baa;
            --muted-2: #687283;
            --primary: #f5f7fb;
            --primary-text: #0a0d12;
            --accent: #60a5fa;
            --accent-2: #a78bfa;
            --success: #4ade80;
            --danger: #f87171;
            --warning: #fbbf24;

            background:
              radial-gradient(
                900px 450px at 50% -180px,
                rgba(37,99,235,0.16),
                transparent 70%
              ),
              radial-gradient(
                600px 300px at 100% 10%,
                rgba(124,58,237,0.11),
                transparent 70%
              ),
              var(--bg);
          }
        }

        button,
        textarea {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        /* ======================================================
           TOP BAR
        ====================================================== */

        .antimate-topbar {
          height: 70px;
          min-height: 70px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0
            max(
              18px,
              env(safe-area-inset-right)
            )
            0
            max(
              18px,
              env(safe-area-inset-left)
            );

          position: relative;
          z-index: 50;

          border-bottom:
            1px solid var(--border);

          background:
            color-mix(
              in srgb,
              var(--surface-solid) 74%,
              transparent
            );

          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
        }

        .antimate-top-left {
          display: flex;
          align-items: center;
          gap: 12px;

          min-width: 0;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .antimate-brand-copy {
          display: flex;
          flex-direction: column;

          min-width: 0;
        }

        .antimate-brand-title {
          font-size: 15px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .antimate-brand-subtitle {
          margin-top: 4px;

          color: var(--muted);

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .antimate-logo {
          position: relative;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 50%;

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
              rgba(37,99,235,0.07),
            0 8px 30px
              rgba(37,99,235,0.20);

          animation:
            antimateLogoRotate
            12s
            linear
            infinite;
        }

        .antimate-logo-orbit {
          position: absolute;

          width: 68%;
          height: 68%;

          border:
            1.5px solid
            rgba(255,255,255,0.92);

          border-radius: 50%;
        }

        .orbit-one {
          transform:
            rotate(55deg)
            scaleX(0.62);
        }

        .orbit-two {
          transform:
            rotate(-55deg)
            scaleX(0.62);
        }

        .antimate-logo-core {
          width: 22%;
          height: 22%;

          display: grid;
          place-items: center;

          border-radius: 50%;

          background: #fff;

          box-shadow:
            0 0 12px
            rgba(255,255,255,0.75);

          position: relative;
        }

        .antimate-logo-core span {
          width: 35%;
          height: 35%;

          border-radius: 50%;

          background: #2563eb;
        }

        @keyframes antimateLogoRotate {
          to {
            transform: rotate(360deg);
          }
        }

        .antimate-top-right {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .connection-pill {
          display: flex;
          align-items: center;
          gap: 7px;

          min-height: 34px;

          padding:
            0 11px;

          border:
            1px solid
            var(--border);

          border-radius: 999px;

          background:
            var(--surface);

          color:
            var(--muted);

          font-size: 11px;
          font-weight: 700;

          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .connection-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            var(--danger);

          box-shadow:
            0 0 0 3px
            rgba(239,68,68,0.09);
        }

        .connection-dot.online {
          background:
            var(--success);

          box-shadow:
            0 0 0 3px
            rgba(22,163,74,0.10);
        }

        /* ======================================================
           CHAT SCROLL
        ====================================================== */

        .antimate-chat-scroll {
          flex: 1;

          min-height: 0;

          overflow-y: auto;
          overflow-x: hidden;

          scroll-behavior: smooth;

          overscroll-behavior-y: contain;

          scrollbar-width: thin;
          scrollbar-color:
            rgba(127,127,127,0.20)
            transparent;
        }

        .antimate-chat-scroll::-webkit-scrollbar {
          width: 7px;
        }

        .antimate-chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .antimate-chat-scroll::-webkit-scrollbar-thumb {
          background:
            rgba(127,127,127,0.18);

          border-radius: 999px;
        }

        .antimate-chat-content {
          width:
            min(
              930px,
              calc(100% - 38px)
            );

          margin: 0 auto;

          padding:
            38px 0 230px;
        }

        /* ======================================================
           WELCOME
        ====================================================== */

        .welcome-shell {
          min-height:
            calc(
              100dvh -
              70px -
              180px
            );

          display: flex;
          align-items: center;
          justify-content: center;

          padding:
            45px 0 30px;
        }

        .welcome-inner {
          width: 100%;
          max-width: 670px;

          text-align: center;

          animation:
            welcomeIn
            0.7s
            cubic-bezier(
              .22,
              1,
              .36,
              1
            );
        }

        @keyframes welcomeIn {
          from {
            opacity: 0;
            transform:
              translateY(18px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .welcome-logo-wrap {
          width: 76px;
          height: 76px;

          margin:
            0 auto 24px;

          display: grid;
          place-items: center;

          border-radius: 28px;

          background:
            var(--surface);

          border:
            1px solid
            var(--border);

          box-shadow:
            0 24px 70px
              rgba(15,23,42,0.12);

          backdrop-filter: blur(24px);
        }

        .welcome-title {
          margin: 0;

          font-size:
            clamp(
              31px,
              6vw,
              48px
            );

          line-height: 1.03;

          font-weight: 850;

          letter-spacing:
            -0.055em;
        }

        .welcome-title-gradient {
          background:
            linear-gradient(
              100deg,
              var(--text),
              var(--accent),
              var(--accent-2)
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;
        }

        .welcome-subtitle {
          max-width: 580px;

          margin:
            16px auto 0;

          color:
            var(--muted);

          font-size: 14px;
          line-height: 1.7;
        }

        .quick-prompts {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );

          gap: 10px;

          margin:
            30px auto 0;

          max-width: 630px;
        }

        .quick-prompt {
          display: flex;
          align-items: center;
          gap: 10px;

          min-width: 0;

          padding:
            13px 14px;

          border:
            1px solid
            var(--border);

          border-radius: 16px;

          background:
            var(--surface);

          color:
            var(--text);

          text-align: left;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;

          box-shadow:
            0 8px 30px
            rgba(15,23,42,0.035);

          backdrop-filter: blur(18px);
        }

        .quick-prompt:hover {
          transform:
            translateY(-2px);

          background:
            var(--surface-hover);

          border-color:
            var(--border-strong);

          box-shadow:
            0 14px 35px
            rgba(15,23,42,0.08);
        }

        .quick-prompt:active {
          transform:
            scale(0.98);
        }

        .quick-prompt-icon {
          width: 32px;
          height: 32px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 10px;

          background:
            var(--surface-soft);

          font-size: 16px;
        }

        .quick-prompt-text {
          min-width: 0;

          overflow: hidden;

          white-space: nowrap;
          text-overflow: ellipsis;

          font-size: 12px;
          font-weight: 650;
        }

        /* ======================================================
           MESSAGES
        ====================================================== */

        .message-list {
          display: flex;
          flex-direction: column;

          gap: 29px;
        }

        .message-row {
          width: 100%;

          display: flex;

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
              translateY(9px)
              scale(0.995);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;

          align-items: flex-start;

          gap: 11px;
        }

        .assistant-avatar {
          width: 34px;
          height: 34px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          margin-top: 2px;
        }

        .assistant-avatar .antimate-logo {
          width: 31px !important;
          height: 31px !important;
        }

        .message-column {
          max-width:
            min(
              790px,
              88%
            );

          min-width: 0;
        }

        .message-bubble {
          font-size: 14px;

          line-height: 1.72;

          white-space: pre-wrap;

          word-break: break-word;
        }

        .message-bubble.user {
          padding:
            12px 16px;

          border-radius:
            20px
            20px
            6px
            20px;

          background:
            var(--primary);

          color:
            var(--primary-text);

          box-shadow:
            0 8px 25px
              rgba(15,23,42,0.10);
        }

        .message-bubble.assistant {
          padding:
            2px 0 0;

          color:
            var(--text);
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 7px;

          margin-top: 7px;

          color:
            var(--muted-2);

          font-size: 10px;
          font-weight: 600;
        }

        .user .message-meta {
          justify-content: flex-end;
        }

        .message-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: 3px;

          margin-top: 7px;

          opacity: 0;

          transform:
            translateY(3px);

          pointer-events: none;

          transition:
            opacity 0.18s ease,
            transform 0.18s ease;
        }

        .message-column:hover
        .message-actions,
        .message-actions:focus-within {
          opacity: 1;

          transform:
            translateY(0);

          pointer-events: auto;
        }

        .user-actions {
          justify-content: flex-end;
        }

        .message-action {
          min-height: 29px;

          display: inline-flex;
          align-items: center;
          gap: 5px;

          padding:
            0 8px;

          border: 0;

          border-radius: 8px;

          background:
            transparent;

          color:
            var(--muted);

          cursor: pointer;

          font-size: 10px;
          font-weight: 700;

          transition:
            background 0.16s ease,
            color 0.16s ease;
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

        .message-action:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ======================================================
           EDIT
        ====================================================== */

        .edit-box {
          width: 100%;

          padding: 8px;

          border:
            1px solid
            var(--border-strong);

          border-radius: 19px;

          background:
            var(--surface);

          box-shadow:
            0 10px 35px
              rgba(15,23,42,0.08);

          backdrop-filter:
            blur(20px);
        }

        .edit-textarea {
          width: 100%;

          min-height: 80px;

          border: 0;
          outline: none;
          resize: vertical;

          background: transparent;

          color: var(--text);

          padding: 9px;

          line-height: 1.6;

          font-size: 14px;
        }

        .edit-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 6px;

          padding:
            4px;
        }

        .edit-button {
          min-height: 33px;

          padding:
            0 12px;

          border: 0;

          border-radius: 10px;

          cursor: pointer;

          font-size: 11px;
          font-weight: 750;
        }

        .edit-cancel {
          background:
            var(--surface-soft);

          color:
            var(--muted);
        }

        .edit-save {
          background:
            var(--primary);

          color:
            var(--primary-text);
        }

        /* ======================================================
           TRANSCRIPT
        ====================================================== */

        .transcript-card {
          margin:
            8px 0 0 45px;

          max-width: 750px;

          padding:
            13px 15px;

          border:
            1px solid
            rgba(37,99,235,0.13);

          border-left:
            3px solid
            var(--accent);

          border-radius:
            0
            15px
            15px
            0;

          background:
            rgba(37,99,235,0.045);

          color:
            var(--muted);

          font-size: 12px;

          line-height: 1.6;

          animation:
            messageIn
            0.3s
            ease;
        }

        .transcript-label {
          color:
            var(--accent);

          font-weight: 800;
        }

        /* ======================================================
           THINKING
        ====================================================== */

        .thinking-row {
          display: flex;
          align-items: center;
          gap: 10px;

          margin-left: 1px;

          min-height: 36px;

          color:
            var(--muted);

          font-size: 12px;
        }

        .thinking-content {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .thinking-dots {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;

          border-radius: 50%;

          background:
            var(--accent);

          animation:
            thinkingDot
            1.25s
            infinite
            ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes thinkingDot {
          0%,
          60%,
          100% {
            transform:
              translateY(0);

            opacity:
              0.28;
          }

          30% {
            transform:
              translateY(-4px);

            opacity:
              1;
          }
        }

        /* ======================================================
           LIVE CAPTION
        ====================================================== */

        .live-caption {
          position: sticky;

          bottom: 0;

          z-index: 5;

          width:
            min(
              620px,
              calc(100% - 20px)
            );

          margin:
            18px auto 0;

          padding:
            12px 16px;

          border:
            1px solid
            rgba(124,58,237,0.17);

          border-radius: 18px;

          background:
            color-mix(
              in srgb,
              var(--surface-solid) 80%,
              transparent
            );

          backdrop-filter:
            blur(25px);

          box-shadow:
            0 16px 50px
              rgba(15,23,42,0.12);

          animation:
            captionIn
            0.35s
            cubic-bezier(
              .22,
              1,
              .36,
              1
            );
        }

        @keyframes captionIn {
          from {
            opacity: 0;
            transform:
              translateY(10px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .live-caption-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 6px;
        }

        .live-caption-label {
          display: flex;
          align-items: center;
          gap: 7px;

          color:
            var(--accent-2);

          font-size: 9px;
          font-weight: 850;

          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .live-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background:
            var(--accent-2);

          animation:
            liveDot
            1s
            infinite;
        }

        @keyframes liveDot {
          50% {
            opacity: 0.3;
            transform: scale(0.7);
          }
        }

        .live-caption-text {
          color:
            var(--text);

          font-size: 13px;

          line-height: 1.55;
        }

        /* ======================================================
           SPEAKING BAR
        ====================================================== */

        .speaking-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;

          width:
            min(
              650px,
              calc(100% - 20px)
            );

          margin:
            22px auto 0;

          padding:
            10px 12px 10px 14px;

          border:
            1px solid
            var(--border);

          border-radius: 16px;

          background:
            var(--surface);

          backdrop-filter: blur(22px);

          box-shadow:
            0 10px 40px
              rgba(15,23,42,0.07);
        }

        .speaking-left {
          display: flex;
          align-items: center;
          gap: 9px;

          color:
            var(--muted);

          font-size: 11px;
          font-weight: 700;
        }

        .speaking-icon {
          width: 29px;
          height: 29px;

          display: grid;
          place-items: center;

          border-radius: 9px;

          color:
            var(--accent);

          background:
            rgba(37,99,235,0.08);
        }

        .speaking-wave {
          display: flex;
          align-items: center;

          gap: 3px;

          height: 18px;
        }

        .speaking-wave span {
          width: 2.5px;

          border-radius: 999px;

          background:
            var(--accent);

          animation:
            voiceWave
            0.8s
            ease-in-out
            infinite;
        }

        .speaking-wave span:nth-child(1) {
          height: 6px;
        }

        .speaking-wave span:nth-child(2) {
          height: 12px;
          animation-delay: 0.08s;
        }

        .speaking-wave span:nth-child(3) {
          height: 18px;
          animation-delay: 0.16s;
        }

        .speaking-wave span:nth-child(4) {
          height: 11px;
          animation-delay: 0.24s;
        }

        .speaking-wave span:nth-child(5) {
          height: 7px;
          animation-delay: 0.32s;
        }

        @keyframes voiceWave {
          50% {
            transform:
              scaleY(0.3);
          }
        }

        .stop-speaking {
          min-height: 31px;

          display: inline-flex;
          align-items: center;
          gap: 5px;

          padding:
            0 10px;

          border: 0;

          border-radius: 9px;

          background:
            var(--surface-soft);

          color:
            var(--muted);

          cursor: pointer;

          font-size: 10px;
          font-weight: 750;

          transition:
            background 0.16s ease,
            color 0.16s ease;
        }

        .stop-speaking:hover {
          background:
            var(--surface-hover);

          color:
            var(--danger);
        }

        /* ======================================================
           ERROR
        ====================================================== */

        .error-banner {
          width:
            min(
              700px,
              calc(100% - 20px)
            );

          margin:
            18px auto;

          padding:
            11px 14px;

          display: flex;
          align-items: center;
          justify-content: center;

          text-align: center;

          border:
            1px solid
            rgba(239,68,68,0.16);

          border-radius: 13px;

          background:
            rgba(239,68,68,0.07);

          color:
            var(--danger);

          font-size: 11px;
          line-height: 1.5;
        }

        /* ======================================================
           SCROLL BUTTON
        ====================================================== */

        .scroll-bottom-button {
          position: fixed;

          right: 26px;
          bottom: 180px;

          z-index: 40;

          width: 39px;
          height: 39px;

          display: grid;
          place-items: center;

          border:
            1px solid
            var(--border);

          border-radius: 50%;

          background:
            var(--surface);

          color:
            var(--text);

          box-shadow:
            0 10px 35px
              rgba(15,23,42,0.13);

          backdrop-filter:
            blur(20px);

          cursor: pointer;

          animation:
            floatIn
            0.25s
            ease;
        }

        @keyframes floatIn {
          from {
            opacity: 0;
            transform:
              translateY(7px)
              scale(0.9);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        /* ======================================================
           COMPOSER AREA
        ====================================================== */

        .composer-dock {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 45;

          padding:
            14px
            max(
              16px,
              env(safe-area-inset-right)
            )
            max(
              15px,
              env(safe-area-inset-bottom)
            )
            max(
              16px,
              env(safe-area-inset-left)
            );

          pointer-events: none;

          background:
            linear-gradient(
              to top,
              var(--bg) 62%,
              transparent
            );
        }

        .composer-container {
          width:
            min(
              930px,
              calc(100% - 12px)
            );

          margin: 0 auto;

          pointer-events: auto;
        }

        .recording-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;

          min-height: 37px;

          padding:
            0 12px;

          margin-bottom: 7px;

          border:
            1px solid
            var(--border);

          border-radius: 13px;

          background:
            var(--surface);

          box-shadow:
            0 10px 30px
              rgba(15,23,42,0.06);

          backdrop-filter: blur(24px);

          animation:
            recordingStripIn
            0.25s
            ease;
        }

        @keyframes recordingStripIn {
          from {
            opacity: 0;
            transform:
              translateY(6px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        .recording-left {
          display: flex;
          align-items: center;
          gap: 8px;

          color:
            var(--muted);

          font-size: 10px;
          font-weight: 800;
        }

        .recording-pulse {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            var(--danger);

          box-shadow:
            0 0 0 4px
            rgba(239,68,68,0.09);

          animation:
            recordingPulse
            1.1s
            infinite;
        }

        .recording-pulse.live {
          background:
            var(--accent-2);

          box-shadow:
            0 0 0 4px
            rgba(124,58,237,0.09);
        }

        @keyframes recordingPulse {
          50% {
            opacity: 0.4;
            transform: scale(0.72);
          }
        }

        .recording-right {
          color:
            var(--text);

          font-size: 10px;

          font-variant-numeric:
            tabular-nums;

          font-weight: 800;
        }

        .composer-card {
          position: relative;

          border:
            1px solid
            var(--border-strong);

          border-radius: 22px;

          background:
            color-mix(
              in srgb,
              var(--surface-solid) 84%,
              transparent
            );

          box-shadow:
            0 20px 70px
              rgba(15,23,42,0.13);

          backdrop-filter:
            blur(30px);

          -webkit-backdrop-filter:
            blur(30px);

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .composer-card:focus-within {
          border-color:
            rgba(37,99,235,0.22);

          box-shadow:
            0 20px 75px
              rgba(15,23,42,0.16),
            0 0 0 3px
              rgba(37,99,235,0.035);
        }

        .composer-main {
          display: flex;
          align-items: flex-end;

          gap: 8px;

          padding:
            8px;
        }

        .composer-leading {
          width: 42px;
          height: 42px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 13px;

          background:
            var(--surface-soft);

          color:
            var(--muted);

          cursor: pointer;

          transition:
            transform 0.18s ease,
            background 0.18s ease;
        }

        .composer-leading:hover {
          background:
            var(--surface-hover);

          transform:
            translateY(-1px);
        }

        .composer-textarea {
          flex: 1;

          min-width: 0;

          min-height: 44px;
          max-height: 150px;

          resize: none;

          border: 0;
          outline: 0;

          background:
            transparent;

          color:
            var(--text);

          padding:
            11px 8px;

          line-height: 1.5;

          font-size: 14px;

          overflow-y: auto;
        }

        .composer-textarea::placeholder {
          color:
            var(--muted-2);
        }

        .composer-textarea:disabled {
          opacity: 0.58;
        }

        .composer-action {
          width: 44px;
          height: 44px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 14px;

          background:
            var(--primary);

          color:
            var(--primary-text);

          cursor: pointer;

          touch-action: none;
          user-select: none;
          -webkit-user-select: none;

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .composer-action:hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 8px 24px
              rgba(15,23,42,0.15);
        }

        .composer-action:active {
          transform:
            scale(0.93);
        }

        .composer-action:disabled {
          opacity: 0.4;

          cursor: not-allowed;

          transform: none;

          box-shadow: none;
        }

        .composer-action.recording {
          background:
            var(--danger);

          color: #fff;

          animation:
            recordButtonPulse
            1.5s
            infinite;
        }

        .composer-action.live {
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #6366f1
            );

          color: #fff;

          animation:
            liveButtonPulse
            1.5s
            infinite;
        }

        @keyframes recordButtonPulse {
          50% {
            box-shadow:
              0 0 0 9px
              rgba(239,68,68,0.07);
          }
        }

        @keyframes liveButtonPulse {
          50% {
            box-shadow:
              0 0 0 10px
              rgba(124,58,237,0.07);
          }
        }

        .composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 12px
            8px;

          color:
            var(--muted-2);

          font-size: 9px;
          font-weight: 650;
        }

        .composer-footer-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .composer-footer-right {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .shortcut {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .kbd {
          padding:
            2px 5px;

          border:
            1px solid
            var(--border);

          border-radius: 5px;

          background:
            var(--surface-soft);

          font-size: 8px;
        }

        .live-stop-button {
          width: 100%;

          min-height: 36px;

          margin-top: 7px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          border:
            1px solid
            rgba(124,58,237,0.16);

          border-radius: 12px;

          background:
            rgba(124,58,237,0.055);

          color:
            var(--accent-2);

          cursor: pointer;

          font-size: 10px;
          font-weight: 800;

          transition:
            background 0.18s ease;
        }

        .live-stop-button:hover {
          background:
            rgba(124,58,237,0.10);
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 700px) {
          .antimate-topbar {
            height: 61px;
            min-height: 61px;

            padding-left: 13px;
            padding-right: 13px;
          }

          .antimate-brand-subtitle {
            display: none;
          }

          .connection-pill {
            min-height: 31px;

            padding:
              0 8px;

            font-size: 9px;
          }

          .antimate-chat-content {
            width:
              calc(100% - 20px);

            padding:
              22px 0 230px;
          }

          .welcome-shell {
            min-height:
              calc(
                100dvh -
                61px -
                200px
              );

            padding:
              25px 0;
          }

          .welcome-logo-wrap {
            width: 65px;
            height: 65px;

            border-radius: 23px;

            margin-bottom: 19px;
          }

          .welcome-subtitle {
            font-size: 13px;
          }

          .quick-prompts {
            grid-template-columns:
              1fr;

            margin-top: 24px;
          }

          .quick-prompt {
            padding:
              11px 12px;
          }

          .message-list {
            gap: 24px;
          }

          .assistant-avatar {
            width: 28px;
            height: 28px;
          }

          .assistant-avatar .antimate-logo {
            width: 27px !important;
            height: 27px !important;
          }

          .message-column {
            max-width:
              calc(
                100% - 39px
              );
          }

          .message-bubble {
            font-size: 13.5px;
          }

          .message-bubble.user {
            padding:
              10px 13px;

            border-radius:
              17px
              17px
              5px
              17px;
          }

          .message-actions {
            opacity: 1;

            transform:
              none;

            pointer-events: auto;

            margin-top: 5px;
          }

          .message-action {
            min-height: 27px;

            padding:
              0 6px;

            font-size: 9px;
          }

          .message-action span {
            display: none;
          }

          .transcript-card {
            margin-left: 37px;

            font-size: 11px;
          }

          .composer-dock {
            padding-top: 9px;
          }

          .composer-container {
            width: 100%;
          }

          .composer-card {
            border-radius: 18px;
          }

          .composer-main {
            padding: 6px;
          }

          .composer-leading {
            display: none;
          }

          .composer-textarea {
            min-height: 43px;

            padding:
              10px 8px;
          }

          .composer-action {
            width: 42px;
            height: 42px;

            border-radius: 13px;
          }

          .composer-footer {
            padding:
              0 10px
              7px;
          }

          .composer-footer-right {
            display: none;
          }

          .scroll-bottom-button {
            right: 15px;
            bottom: 156px;

            width: 36px;
            height: 36px;
          }

          .speaking-bar {
            width:
              calc(100% - 12px);

            padding:
              9px 10px;
          }

          .live-caption {
            width:
              calc(100% - 12px);
          }
        }

        @media (max-width: 420px) {
          .antimate-brand-title {
            font-size: 14px;
          }

          .antimate-logo {
            width: 31px !important;
            height: 31px !important;
          }

          .connection-pill {
            gap: 5px;
          }

          .connection-pill span:last-child {
            display: none;
          }

          .welcome-title {
            font-size: 30px;
          }

          .welcome-subtitle {
            font-size: 12px;
          }
        }

        /* ======================================================
           REDUCED MOTION
        ====================================================== */

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration:
              0.001ms !important;

            animation-iteration-count:
              1 !important;

            scroll-behavior:
              auto !important;

            transition-duration:
              0.001ms !important;
          }
        }
      `}</style>

      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <header className="antimate-topbar">
        <div className="antimate-top-left">
          <div className="antimate-brand">
            <LogoMark size={36} />

            <div className="antimate-brand-copy">
              <div className="antimate-brand-title">
                ANTIMATE
              </div>

              <div className="antimate-brand-subtitle">
                Intelligent AI Assistant
              </div>
            </div>
          </div>
        </div>

        <div className="antimate-top-right">
          <div className="connection-pill">
            <span
              className={`connection-dot ${
                socketConnected
                  ? "online"
                  : ""
              }`}
            />

            <span>
              {connectionLabel}
            </span>
          </div>
        </div>
      </header>

      {/* ======================================================
          CHAT AREA
      ====================================================== */}

      <div
        ref={chatScrollRef}
        className="antimate-chat-scroll"
        onScroll={handleChatScroll}
      >
        <main className="antimate-chat-content">
          {!hasConversation ? (
            <section className="welcome-shell">
              <div className="welcome-inner">
                <div className="welcome-logo-wrap">
                  <LogoMark size={50} />
                </div>

                <h1 className="welcome-title">
                  Muraho 👋
                  <br />

                  <span className="welcome-title-gradient">
                    Tuvugane na ANTIMATE
                  </span>
                </h1>

                <p className="welcome-subtitle">
                  Ndi ANTIMATE — AI assistant
                  ushobora kubaza, kuvugisha
                  ijwi, cyangwa gukoresha Live
                  Voice kugira ngo tuganire mu
                  buryo busanzwe.
                </p>

                {showQuickPrompts && (
                  <div className="quick-prompts">
                    {QUICK_PROMPTS.map(
                      (prompt) => (
                        <button
                          key={
                            prompt.text
                          }
                          type="button"
                          className="quick-prompt"
                          onClick={() =>
                            handleQuickPrompt(
                              prompt.text
                            )
                          }
                        >
                          <span className="quick-prompt-icon">
                            {
                              prompt.icon
                            }
                          </span>

                          <span className="quick-prompt-text">
                            {
                              prompt.text
                            }
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="message-list">
              {messages.map(
                (message, index) => {
                  const isLast =
                    index ===
                    messages.length -
                      1;

                  const isLastAssistant =
                    message.role ===
                      "assistant" &&
                    message.id ===
                      lastAssistantMessage?.id;

                  if (
                    editingId ===
                      message.id &&
                    message.role ===
                      "user"
                  ) {
                    return (
                      <div
                        key={
                          message.id
                        }
                        className="message-row user"
                      >
                        <div className="message-column">
                          <div className="edit-box">
                            <textarea
                              data-edit-input={
                                message.id
                              }
                              className="edit-textarea"
                              value={
                                editingText
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

                            <div className="edit-footer">
                              <button
                                type="button"
                                className="edit-button edit-cancel"
                                onClick={
                                  cancelEdit
                                }
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                className="edit-button edit-save"
                                disabled={
                                  !editingText.trim() ||
                                  isProcessing
                                }
                                onClick={() =>
                                  submitEdit(
                                    message
                                  )
                                }
                              >
                                Save & Send
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={
                        message.id
                      }
                      className={`message-row ${
                        message.role
                      }`}
                    >
                      {message.role ===
                        "assistant" && (
                        <div className="assistant-avatar">
                          <LogoMark
                            size={31}
                          />
                        </div>
                      )}

                      <div className="message-column">
                        <div
                          className={`message-bubble ${
                            message.role
                          }`}
                        >
                          {
                            message.content
                          }
                        </div>

                        <div className="message-meta">
                          <span>
                            {message.role ===
                            "assistant"
                              ? "ANTIMATE"
                              : "Wowe"}
                          </span>

                          <span>•</span>

                          <span>
                            {formatTime(
                              message.createdAt
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

                        {renderMessageActions(
                          message,
                          isLastAssistant
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              {/* ==================================================
                  TRANSCRIPT
              ================================================== */}

              {transcript && (
                <div className="transcript-card">
                  <div>
                    <span className="transcript-label">
                      Wavuze
                    </span>
                  </div>

                  <div>
                    {transcript}
                  </div>
                </div>
              )}

              {/* ==================================================
                  THINKING
              ================================================== */}

              {isProcessing && (
                <div className="thinking-row">
                  <div className="assistant-avatar">
                    <LogoMark size={29} />
                  </div>

                  <div className="thinking-content">
                    <span>
                      {displayedThinking}
                    </span>

                    <div className="thinking-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================
                  STREAMING ANSWER
              ================================================== */}

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
                      <LogoMark size={31} />
                    </div>

                    <div className="message-column">
                      <div className="message-bubble assistant">
                        {
                          currentAnswer
                        }
                      </div>
                    </div>
                  </div>
                )}

              {/* ==================================================
                  LIVE CAPTION
              ================================================== */}

              {liveVoice &&
                (transcript ||
                  isRecording ||
                  isPlaying) && (
                  <div className="live-caption">
                    <div className="live-caption-top">
                      <div className="live-caption-label">
                        <span className="live-dot" />
                        LIVE VOICE
                      </div>

                      <div
                        style={{
                          color:
                            "var(--muted-2)",
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        {isPlaying
                          ? "ANTIMATE SPEAKING"
                          : isRecording
                          ? "LISTENING"
                          : "PROCESSING"}
                      </div>
                    </div>

                    <div className="live-caption-text">
                      {transcript ||
                        statusMessage ||
                        "Ndagutega…"}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* ====================================================
              SPEAKING
          ==================================================== */}

          {isPlaying && (
            <div className="speaking-bar">
              <div className="speaking-left">
                <div className="speaking-icon">
                  <Icon
                    name="volume"
                    size={16}
                  />
                </div>

                <span>
                  ANTIMATE iri kuvuga…
                </span>

                <div className="speaking-wave">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <button
                type="button"
                className="stop-speaking"
                onClick={stopAudio}
              >
                <Icon
                  name="stop"
                  size={12}
                />

                Stop
              </button>
            </div>
          )}

          {/* ====================================================
              ERROR
          ==================================================== */}

          {errorMessage && (
            <div className="error-banner">
              {errorMessage}
            </div>
          )}
        </main>
      </div>

      {/* ======================================================
          SCROLL TO BOTTOM
      ====================================================== */}

      {showScrollButton && (
        <button
          type="button"
          className="scroll-bottom-button"
          title="Scroll to latest"
          aria-label="Scroll to latest"
          onClick={() => {
            setIsNearBottom(true);
            setShowScrollButton(false);
            scrollToBottom(true);
          }}
        >
          <Icon
            name="arrowDown"
            size={17}
          />
        </button>
      )}

      {/* ======================================================
          COMPOSER
      ====================================================== */}

      <div className="composer-dock">
        <div className="composer-container">
          {isRecording && (
            <div className="recording-strip">
              <div className="recording-left">
                <span
                  className={`recording-pulse ${
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

              <div className="recording-right">
                {liveVoice
                  ? "Auto silence 1.8s"
                  : formatRecordingTime(
                      recordingSeconds
                    )}
              </div>
            </div>
          )}

          <div className="composer-card">
            <div className="composer-main">
              <button
                type="button"
                className="composer-leading"
                title="Quick prompts"
                aria-label="Quick prompts"
                onClick={() =>
                  setShowQuickPrompts(
                    (prev) => !prev
                  )
                }
              >
                <Icon
                  name="sparkles"
                  size={18}
                />
              </button>

              <textarea
                ref={textareaRef}
                className="composer-textarea"
                value={text}
                onChange={
                  handleTextChange
                }
                onKeyDown={
                  handleTextareaKeyDown
                }
                placeholder={
                  liveVoice
                    ? "Live Voice irakora…"
                    : "Andika ubutumwa cyangwa ukoreshe ijwi…"
                }
                disabled={liveVoice}
                rows={1}
              />

              {!hasText ? (
                <button
                  type="button"
                  className={`composer-action ${
                    isRecording
                      ? liveVoice
                        ? "live"
                        : "recording"
                      : ""
                  }`}
                  title={
                    isRecording
                      ? liveVoice
                        ? "Live Voice irakora"
                        : "Kanda uhagarike recording"
                      : "Kanda ufate amajwi • Hold 5s kuri Live Voice"
                  }
                  aria-label={
                    isRecording
                      ? liveVoice
                        ? "Live Voice irakora"
                        : "Kanda uhagarike recording"
                      : "Kanda ufate amajwi"
                  }
                  disabled={
                    isProcessing &&
                    !isRecording &&
                    !liveVoice
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
                      <div className="speaking-wave">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
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
                  className="composer-action"
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
                    size={20}
                  />
                </button>
              )}
            </div>

            <div className="composer-footer">
              <div className="composer-footer-left">
                {liveVoice ? (
                  <>
                    <span>
                      Live Voice
                    </span>

                    <span>•</span>

                    <span>
                      silence 1.8s =
                      auto send
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      ANTIMATE can
                      listen, think
                      & speak
                    </span>
                  </>
                )}
              </div>

              <div className="composer-footer-right">
                <span className="shortcut">
                  <Icon
                    name="keyboard"
                    size={11}
                  />

                  <span>
                    <span className="kbd">
                      Enter
                    </span>{" "}
                    send
                  </span>
                </span>

                <span>•</span>

                <span>
                  <span className="kbd">
                    Shift
                  </span>{" "}
                  +{" "}
                  <span className="kbd">
                    Enter
                  </span>{" "}
                  new line
                </span>
              </div>
            </div>

            {liveVoice && (
              <button
                type="button"
                className="live-stop-button"
                onClick={
                  stopLiveVoice
                }
              >
                <Icon
                  name="x"
                  size={14}
                />

                Hagarika Live Voice
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}