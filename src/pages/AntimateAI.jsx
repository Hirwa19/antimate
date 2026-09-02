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
 ANTIMATE AI — MARKET LEVEL EXPERIENCE
 ------------------------------------------------------------
 - Premium Apple-inspired UI
 - Responsive desktop / tablet / mobile
 - Dark / light mode
 - Socket.IO voice
 - Normal voice recording
 - 5s hold -> Live Voice
 - 1.8s silence -> automatic send
 - Automatic mic reopening after AI audio
 - Text chat
 - Suggested prompts
 - Quick actions
 - Message actions
 - Connection state
 - Smooth micro-interactions
 - Self-contained JSX
 - No external CSS required
============================================================
*/

/* ============================================================
   CONFIG
============================================================ */

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/+$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/+$/, "");

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

/* ============================================================
   ICON SYSTEM
============================================================ */

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
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

    wave: (
      <>
        <path d="M4 10v4" />
        <path d="M8 7v10" />
        <path d="M12 4v16" />
        <path d="M16 7v10" />
        <path d="M20 10v4" />
      </>
    ),

    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.42 1.42" />
        <path d="m17.65 17.65 1.42 1.42" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m4.93 19.07 1.42-1.42" />
        <path d="m17.65 6.35 1.42-1.42" />
      </>
    ),

    moon: (
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
    ),

    copy: (
      <>
        <rect x="9" y="9" width="10" height="10" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    volume: (
      <>
        <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
        <path d="M17 9.5a4 4 0 0 1 0 5" />
        <path d="M19.5 7a8 8 0 0 1 0 10" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    sparkles: (
      <>
        <path d="m12 3-1.3 4.7L6 9l4.7 1.3L12 15l1.3-4.7L18 9l-4.7-1.3L12 3Z" />
        <path d="m19 14-.7 2.3L16 17l2.3.7L19 20l.7-2.3L22 17l-2.3-.7L19 14Z" />
        <path d="m5 14-.6 1.8L3 16.4l1.4.6L5 18.5l.6-1.5 1.4-.6-1.4-.6L5 14Z" />
      </>
    ),

    arrow: <path d="m5 12h14m-6-6 6 6-6 6" />,

    leaf: (
      <>
        <path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 10-6 10-15Z" />
        <path d="M5 19c2-4 5-7 10-9" />
      </>
    ),

    chicken: (
      <>
        <path d="M8 19c-2.5 0-4-1.7-4-4 0-2.8 2-5 5-5 .4-2.7 2.4-4.5 5-4.5 2.8 0 5 2.1 5 5 0 1-.3 2-.9 2.8" />
        <path d="M14 7.5c.4-1.5 1.5-2.5 3-2.5" />
        <path d="M17 5c1-.8 2-.6 2.5.2" />
        <path d="M18 12h3" />
        <path d="M11 19v2" />
        <path d="M15 19v2" />
      </>
    ),

    activity: (
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    ),

    shield: (
      <path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Z" />
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.5-1H6v-2.4h.2a1.7 1.7 0 0 0 1.5-1A1.7 1.7 0 0 0 8.1 8.7L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.4h-.2a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),

    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),

    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="m9 7 1-3h4l1 3" />
        <path d="M6 7l1 14h10l1-14" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),

    chevron: <path d="m7 10 5 5 5-5" />,

    back: <path d="m15 18-6-6 6-6" />,
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

function LogoMark({
  size = 38,
  animated = true,
}) {
  return (
    <div
      className={`ai-logo ${animated ? "ai-logo-animated" : ""}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="ai-logo-orbit orbit-one" />
      <div className="ai-logo-orbit orbit-two" />
      <div className="ai-logo-core" />
      <div className="ai-logo-glow" />
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {
      // continue
    }
  }

  return "";
}

function extensionFromMimeType(type = "") {
  const value = type.toLowerCase();

  if (value.includes("ogg")) return "ogg";
  if (value.includes("mp4") || value.includes("m4a")) return "m4a";
  if (value.includes("wav")) return "wav";

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

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")}`;
}

/* ============================================================
   QUICK ACTION DATA
============================================================ */

const QUICK_ACTIONS = [
  {
    id: "brooding",
    icon: "chicken",
    title: "Brooding",
    description: "Temperatures, humidity & chicks",
    prompt:
      "Mfasha kumenya niba conditions za brooding ziri neza ku nkoko zanjye.",
  },
  {
    id: "health",
    icon: "shield",
    title: "Chick Health",
    description: "Health signs & prevention",
    prompt:
      "Ni ibihe bimenyetso by'ingenzi nakurikiranaho kugira ngo menye ko inkoko zanjye zifite ubuzima bwiza?",
  },
  {
    id: "environment",
    icon: "activity",
    title: "Environment",
    description: "Analyze room conditions",
    prompt:
      "Nsobanurira uko temperature na humidity bigira impact ku nkoko zanjye.",
  },
  {
    id: "smart",
    icon: "sparkles",
    title: "Smart Advice",
    description: "Get a practical recommendation",
    prompt:
      "Mpa inama y'ingenzi nakurikiza uyu munsi kugira ngo ndusheho kunoza brooding.",
  },
];

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AntimateAI() {
  /* ==========================================================
     CORE STATE
  ========================================================== */

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

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

  const [recordingSeconds, setRecordingSeconds] =
    useState(30);

  const [recordingMode, setRecordingMode] =
    useState("tap");

  const [liveVoice, setLiveVoice] =
    useState(false);

  const [thinkingIndex, setThinkingIndex] =
    useState(0);

  const [copiedId, setCopiedId] =
    useState(null);

  const [theme, setTheme] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            "antimate-theme"
          );

        if (
          saved === "dark" ||
          saved === "light"
        ) {
          return saved;
        }
      } catch {
        // ignore
      }

      return "dark";
    });

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [showFeatures, setShowFeatures] =
    useState(false);

  /* ==========================================================
     REFS
  ========================================================== */

  const socketRef = useRef(null);

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const recordingTimerRef =
    useRef(null);

  const holdTimerRef =
    useRef(null);

  const silenceAnimationRef =
    useRef(null);

  const silenceStartedAtRef =
    useRef(null);

  const speechDetectedRef =
    useRef(false);

  const audioContextRef =
    useRef(null);

  const analyserRef =
    useRef(null);

  const audioRef =
    useRef(null);

  const wakeLockRef =
    useRef(null);

  const textareaRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  const isRecordingRef =
    useRef(false);

  const isPlayingRef =
    useRef(false);

  const liveVoiceRef =
    useRef(false);

  const voiceSessionActiveRef =
    useRef(false);

  const liveAudioReceivedRef =
    useRef(false);

  const liveWaitingForResponseRef =
    useRef(false);

  const pointerActiveRef =
    useRef(false);

  const messageIdRef =
    useRef(1);

  const startRecordingInternalRef =
    useRef(null);

  const stopRecordingRef =
    useRef(null);

  const lastAnswerRef =
    useRef("");

  const liveResumeTimerRef =
    useRef(null);

  /* ==========================================================
     IDS
  ========================================================== */

  const createId = useCallback(() => {
    const value =
      messageIdRef.current;

    messageIdRef.current += 1;

    return `${Date.now()}-${value}`;
  }, []);

  /* ==========================================================
     THEME
  ========================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        "antimate-theme",
        theme
      );
    } catch {
      // ignore
    }
  }, [theme]);

  /* ==========================================================
     WAKE LOCK
  ========================================================== */

  const requestWakeLock =
    useCallback(async () => {
      try {
        if (
          !("wakeLock" in navigator) ||
          wakeLockRef.current
        ) {
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
        // optional
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
     ADD MESSAGE
  ========================================================== */

  const addMessage =
    useCallback(
      (
        role,
        content,
        extra = {}
      ) => {
        if (!content?.trim()) {
          return;
        }

        setMessages((previous) => [
          ...previous,
          {
            id: createId(),
            role,
            content: content.trim(),
            timestamp: Date.now(),
            ...extra,
          },
        ]);
      },
      [createId]
    );

  /* ==========================================================
     AUTO RESIZE TEXTAREA
  ========================================================== */

  const resizeTextarea =
    useCallback(() => {
      const element =
        textareaRef.current;

      if (!element) return;

      element.style.height = "auto";

      element.style.height = `${Math.min(
        element.scrollHeight,
        150
      )}px`;
    }, []);

  useEffect(() => {
    resizeTextarea();
  }, [text, resizeTextarea]);

  /* ==========================================================
     SILENCE DETECTION
  ========================================================== */

  const stopSilenceDetection =
    useCallback(() => {
      if (
        silenceAnimationRef.current
      ) {
        cancelAnimationFrame(
          silenceAnimationRef.current
        );

        silenceAnimationRef.current =
          null;
      }

      silenceStartedAtRef.current =
        null;

      speechDetectedRef.current =
        false;

      if (
        audioContextRef.current
      ) {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }

        audioContextRef.current =
          null;
      }

      analyserRef.current =
        null;
    }, []);

  const startSilenceDetection =
    useCallback(
      (stream) => {
        stopSilenceDetection();

        try {
          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (!AudioContextClass) {
            return;
          }

          const context =
            new AudioContextClass();

          const source =
            context.createMediaStreamSource(
              stream
            );

          const analyser =
            context.createAnalyser();

          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.82;

          source.connect(analyser);

          audioContextRef.current =
            context;

          analyserRef.current =
            analyser;

          const data =
            new Uint8Array(
              analyser.fftSize
            );

          const detect = () => {
            if (
              !isRecordingRef.current ||
              !liveVoiceRef.current
            ) {
              return;
            }

            analyser.getByteTimeDomainData(
              data
            );

            let sum = 0;

            for (
              let index = 0;
              index < data.length;
              index += 1
            ) {
              const normalized =
                (data[index] - 128) / 128;

              sum +=
                normalized *
                normalized;
            }

            const rms =
              Math.sqrt(
                sum / data.length
              );

            const threshold = 0.025;

            if (rms > threshold) {
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
            "Silence detector unavailable:",
            error
          );
        }
      },
      [stopSilenceDetection]
    );

  /* ==========================================================
     STOP MEDIA
  ========================================================== */

  const stopMediaTracks =
    useCallback(() => {
      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {
              // ignore
            }
          });

        mediaStreamRef.current =
          null;
      }

      stopSilenceDetection();
    }, [stopSilenceDetection]);

  /* ==========================================================
     LIVE RESUME
  ========================================================== */

  const scheduleLiveResume =
    useCallback(
      (delay = 350) => {
        if (
          liveResumeTimerRef.current
        ) {
          clearTimeout(
            liveResumeTimerRef.current
          );
        }

        liveResumeTimerRef.current =
          setTimeout(() => {
            liveResumeTimerRef.current =
              null;

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
          }, delay);
      },
      []
    );

  /* ==========================================================
     PLAY AUDIO
  ========================================================== */

  const playAudio =
    useCallback(
      (payload) => {
        const audioUrl =
          getAudioUrl(payload);

        if (!audioUrl) {
          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            scheduleLiveResume(400);
          }

          return;
        }

        if (audioRef.current) {
          try {
            audioRef.current.pause();
          } catch {
            // ignore
          }
        }

        const audio =
          new Audio(audioUrl);

        audioRef.current =
          audio;

        isPlayingRef.current =
          true;

        setIsPlaying(true);

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
              // ignore
            }
          }

          audioRef.current =
            null;

          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            scheduleLiveResume(300);
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

          audioRef.current =
            null;

          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            scheduleLiveResume(500);
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

          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            scheduleLiveResume(700);
          } else {
            releaseWakeLock();
          }
        });
      },
      [
        releaseWakeLock,
        scheduleLiveResume,
      ]
    );

  /* ==========================================================
     START RECORDING
  ========================================================== */

  const startRecordingInternal =
    useCallback(
      async (mode = "tap") => {
        const socket =
          socketRef.current;

        if (!socket?.connected) {
          setErrorMessage(
            "Connection ya ANTIMATE ntiraboneka."
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
            "Browser yawe ntabwo ishyigikira microphone."
          );

          setStatus("error");

          return;
        }

        setErrorMessage("");
        setTranscript("");
        setCurrentAnswer("");
        setThinkingText("");

        lastAnswerRef.current = "";

        try {
          await requestWakeLock();

          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                  channelCount: 1,
                },
              }
            );

          if (!mountedRef.current) {
            stream
              .getTracks()
              .forEach((track) => track.stop());

            return;
          }

          mediaStreamRef.current =
            stream;

          const supportedMime =
            getSupportedMimeType();

          const recorderOptions =
            supportedMime
              ? {
                  mimeType:
                    supportedMime,
                }
              : undefined;

          const recorder =
            new MediaRecorder(
              stream,
              recorderOptions
            );

          mediaRecorderRef.current =
            recorder;

          const actualMime =
            recorder.mimeType ||
            supportedMime ||
            "audio/webm";

          const extension =
            extensionFromMimeType(
              actualMime
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
            liveVoiceRef.current =
              false;

            setLiveVoice(false);
            setRecordingMode("tap");
            setRecordingSeconds(30);
            setStatus("recording");

            setStatusMessage(
              "Ndumva…"
            );
          }

          /* -----------------------------------------------
             SOCKET START
          ------------------------------------------------ */

          socket.emit(
            "antimate:voice:start",
            {
              mimeType: actualMime,
              extension,
              language: "rw",
              mode,
            }
          );

          /*
           * IMPORTANT:
           * Keep all chunk promises locally so that
           * voice:end cannot reach the server before
           * the final ArrayBuffer has been emitted.
           */

          const pendingChunks = [];

          recorder.ondataavailable =
            (event) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              const promise =
                event.data
                  .arrayBuffer()
                  .then((buffer) => {
                    if (
                      socket.connected
                    ) {
                      socket.emit(
                        "antimate:voice:chunk",
                        buffer
                      );
                    }
                  })
                  .catch((error) => {
                    console.warn(
                      "Audio chunk failed:",
                      error
                    );
                  });

              pendingChunks.push(
                promise
              );
            };

          recorder.onstop =
            async () => {
              try {
                await Promise.all(
                  pendingChunks
                );
              } catch {
                // individual chunks already handled
              }

              if (
                mediaRecorderRef.current ===
                recorder
              ) {
                mediaRecorderRef.current =
                  null;
              }

              stopMediaTracks();

              if (
                socket.connected
              ) {
                socket.emit(
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
     NORMAL RECORDING TIMER
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
          (previous) => {
            if (previous <= 1) {
              clearInterval(
                recordingTimerRef.current
              );

              recordingTimerRef.current =
                null;

              setTimeout(() => {
                stopRecording({
                  liveSegment: false,
                });
              }, 0);

              return 0;
            }

            return previous - 1;
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
            if (
              !pointerActiveRef.current ||
              !isRecordingRef.current
            ) {
              return;
            }

            liveVoiceRef.current =
              true;

            voiceSessionActiveRef.current =
              true;

            setLiveVoice(true);
            setRecordingMode("live");

            setStatus("listening");

            setStatusMessage(
              "Live Voice: vuga. Silence ya 1.8s izohita yohereza."
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
          // ignore
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

        /*
         * Live Voice stays active after release.
         */
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

      if (
        liveResumeTimerRef.current
      ) {
        clearTimeout(
          liveResumeTimerRef.current
        );

        liveResumeTimerRef.current =
          null;
      }

      if (
        isRecordingRef.current
      ) {
        stopRecording({
          liveSegment: false,
        });
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // ignore
        }

        audioRef.current =
          null;
      }

      isPlayingRef.current =
        false;

      setIsPlaying(false);

      setIsProcessing(false);

      setStatus("ready");

      setStatusMessage("");

      releaseWakeLock();
    }, [
      releaseWakeLock,
      stopRecording,
    ]);

  /* ==========================================================
     SEND TEXT
  ========================================================== */

  const sendTextMessage =
    useCallback(
      async (providedText = null) => {
        const value = (
          providedText ??
          text
        ).trim();

        if (!value) return;

        if (
          isProcessing ||
          isRecording ||
          liveVoice
        ) {
          return;
        }

        setErrorMessage("");
        setText("");
        setTranscript("");
        setCurrentAnswer("");
        setThinkingText("");

        lastAnswerRef.current = "";

        addMessage(
          "user",
          value
        );

        setIsProcessing(true);

        setStatus("thinking");

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

          addMessage(
            "assistant",
            answer
          );

          lastAnswerRef.current =
            answer;

          const audioPayload =
            data?.audio ||
            data?.audioUrl ||
            data?.audio_url ||
            data?.voice_url ||
            data?.voiceUrl;

          setIsProcessing(false);

          if (audioPayload) {
            playAudio(
              audioPayload
            );
          } else {
            setStatus("ready");
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
     QUICK ACTION
  ========================================================== */

  const handleQuickAction =
    useCallback(
      (prompt) => {
        sendTextMessage(prompt);
      },
      [sendTextMessage]
    );

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

          sendTextMessage();
        }
      },
      [sendTextMessage]
    );

  /* ==========================================================
     COPY
  ========================================================== */

  const copyMessage =
    useCallback(
      async (message) => {
        try {
          await navigator.clipboard.writeText(
            message.content
          );

          setCopiedId(message.id);

          setTimeout(() => {
            setCopiedId(null);
          }, 1500);
        } catch {
          // ignore
        }
      },
      []
    );

  /* ==========================================================
     READ MESSAGE
  ========================================================== */

  const readMessage =
    useCallback((content) => {
      if (
        !("speechSynthesis" in window)
      ) {
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const utterance =
          new SpeechSynthesisUtterance(
            content
          );

        utterance.lang = "rw-RW";
        utterance.rate = 0.92;
        utterance.pitch = 1;

        window.speechSynthesis.speak(
          utterance
        );
      } catch {
        // ignore
      }
    }, []);

  /* ==========================================================
     SOCKET.IO
  ========================================================== */

  useEffect(() => {
    mountedRef.current =
      true;

    console.log(
      "🔌 Connecting ANTIMATE Socket.IO:",
      SOCKET_URL
    );

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

    /* CONNECT */

    socket.on(
      "connect",
      () => {
        console.log(
          "🔌 ANTIMATE Socket connected:",
          socket.id
        );

        if (!mountedRef.current) {
          return;
        }

        setSocketConnected(true);

        if (!isRecordingRef.current) {
          setStatus("ready");
          setStatusMessage("");
          setErrorMessage("");
        }
      }
    );

    /* DISCONNECT */

    socket.on(
      "disconnect",
      (reason) => {
        console.warn(
          "❌ ANTIMATE Socket disconnected:",
          reason
        );

        if (!mountedRef.current) {
          return;
        }

        setSocketConnected(false);

        if (!isRecordingRef.current) {
          setStatus("offline");

          setStatusMessage(
            "ANTIMATE server ntiraboneka."
          );
        }
      }
    );

    /* CONNECT ERROR */

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "🔥 ANTIMATE SOCKET ERROR:",
          error
        );

        if (!mountedRef.current) {
          return;
        }

        setSocketConnected(false);

        if (!isRecordingRef.current) {
          setStatus("offline");

          setStatusMessage(
            "Ntabwo nshoboye guhuza na ANTIMATE server."
          );
        }
      }
    );

    /* RECONNECT */

    socket.io.on(
      "reconnect",
      (attempt) => {
        console.log(
          "🔄 ANTIMATE Socket reconnected:",
          attempt
        );
      }
    );

    /* STATUS */

    socket.on(
      "antimate:status",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        const message =
          typeof payload === "string"
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

    /* TRANSCRIPT */

    socket.on(
      "antimate:transcript",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

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

    /* THINKING */

    socket.on(
      "antimate:thinking",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

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

    /* ANSWER CHUNK */

    socket.on(
      "antimate:answer:chunk",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        const chunk =
          typeof payload === "string"
            ? payload
            : payload?.text ||
              payload?.chunk ||
              payload?.content ||
              "";

        if (chunk) {
          setCurrentAnswer(
            (previous) =>
              previous + chunk
          );
        }
      }
    );

    /* ANSWER */

    socket.on(
      "antimate:answer",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

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
          setCurrentAnswer(
            answer
          );

          /*
           * Prevent duplicate message when
           * answer event is fired more than once.
           */

          if (
            lastAnswerRef.current !==
            answer
          ) {
            addMessage(
              "assistant",
              answer
            );

            lastAnswerRef.current =
              answer;
          }
        }

        setIsProcessing(true);
        setStatus("speaking");
      }
    );

    /* AUDIO */

    socket.on(
      "antimate:audio",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        playAudio(payload);
      }
    );

    /* COMPLETE */

    socket.on(
      "antimate:complete",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        console.log(
          "✅ ANTIMATE voice complete:",
          payload
        );

        setIsProcessing(false);

        if (
          liveVoiceRef.current
        ) {
          setStatus("speaking");
        } else {
          setStatus("ready");
        }

        setStatusMessage("");

        if (
          liveVoiceRef.current &&
          voiceSessionActiveRef.current &&
          !liveAudioReceivedRef.current &&
          !isPlayingRef.current
        ) {
          liveWaitingForResponseRef.current =
            false;

          scheduleLiveResume(400);
        }
      }
    );

    /* ERROR */

    socket.on(
      "antimate:error",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        console.error(
          "🔥 ANTIMATE voice error:",
          payload
        );

        const message =
          typeof payload === "string"
            ? payload
            : payload?.message ||
              payload?.error ||
              "ANTIMATE habonye ikibazo.";

        setErrorMessage(
          message
        );

        setIsProcessing(false);

        setStatus("error");

        setStatusMessage("");

        if (
          liveVoiceRef.current &&
          voiceSessionActiveRef.current
        ) {
          liveWaitingForResponseRef.current =
            false;

          scheduleLiveResume(700);
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
    scheduleLiveResume,
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
          (previous) =>
            (previous + 1) %
            THINKING_MESSAGES.length
        );
      }, 2200);

    return () =>
      clearInterval(interval);
  }, [isProcessing]);

  /* ==========================================================
     KEYBOARD SHORTCUT
  ========================================================== */

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        if (
          event.key === "/" &&
          document.activeElement?.tagName !==
            "TEXTAREA"
        ) {
          event.preventDefault();

          textareaRef.current?.focus();
        }

        if (
          event.key === "Escape" &&
          liveVoiceRef.current
        ) {
          stopLiveVoice();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [stopLiveVoice]);

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
        liveResumeTimerRef.current
      ) {
        clearTimeout(
          liveResumeTimerRef.current
        );
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }

      stopSilenceDetection();
      stopMediaTracks();

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // ignore
        }
      }

      if (
        "speechSynthesis" in window
      ) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
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

  const isEmpty =
    messages.length === 0 &&
    !transcript &&
    !currentAnswer;

  const connectionLabel =
    socketConnected
      ? "ANTIMATE Online"
      : "Connecting…";

  const actionTitle =
    hasText
      ? "Ohereza ubutumwa"
      : isRecording
      ? liveVoice
        ? "Live Voice irakora"
        : "Kanda uhagarike recording"
      : "Kanda uvuge • Hold 5s kuri Live Voice";

  const themeIcon =
    theme === "dark"
      ? "sun"
      : "moon";

  const messageCount =
    messages.length;

  const composerDisabled =
    liveVoice ||
    (isProcessing &&
      !isRecording &&
      !hasText);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className={`antimate-shell theme-${theme}`}
    >
      <style>{`
        /* =====================================================
           RESET
        ===================================================== */

        .antimate-shell,
        .antimate-shell * {
          box-sizing: border-box;
        }

        .antimate-shell {
          --bg: #f7f8fb;
          --surface: rgba(255,255,255,.78);
          --surface-solid: #ffffff;
          --surface-soft: #f3f5f8;
          --surface-hover: #eef1f5;

          --text: #111318;
          --text-secondary: #5f6673;
          --text-tertiary: #89919e;

          --border: rgba(17,19,24,.09);
          --border-strong: rgba(17,19,24,.15);

          --primary: #111318;
          --primary-text: #ffffff;

          --blue: #2463eb;
          --purple: #7957ff;
          --cyan: #20c7d9;
          --green: #18a957;
          --red: #e5484d;

          --shadow-sm:
            0 1px 2px rgba(15,23,42,.04),
            0 5px 18px rgba(15,23,42,.035);

          --shadow-lg:
            0 20px 70px rgba(15,23,42,.10);

          min-height: 100dvh;
          width: 100%;
          overflow: hidden;

          color: var(--text);

          background:
            radial-gradient(
              circle at 15% -10%,
              rgba(36,99,235,.075),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 0%,
              rgba(121,87,255,.055),
              transparent 25%
            ),
            var(--bg);

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "SF Pro Display",
            "SF Pro Text",
            "Segoe UI",
            sans-serif;

          transition:
            background .35s ease,
            color .35s ease;
        }

        .antimate-shell.theme-dark {
          --bg: #080a0e;
          --surface: rgba(16,19,25,.76);
          --surface-solid: #101319;
          --surface-soft: #151920;
          --surface-hover: #1b2028;

          --text: #f5f7fa;
          --text-secondary: #a2a9b5;
          --text-tertiary: #707885;

          --border: rgba(255,255,255,.075);
          --border-strong: rgba(255,255,255,.13);

          --primary: #f4f5f7;
          --primary-text: #0b0d11;

          --shadow-sm:
            0 1px 2px rgba(0,0,0,.15),
            0 12px 35px rgba(0,0,0,.15);

          --shadow-lg:
            0 30px 90px rgba(0,0,0,.45);

          background:
            radial-gradient(
              circle at 10% -10%,
              rgba(36,99,235,.15),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 0%,
              rgba(121,87,255,.10),
              transparent 28%
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
           HEADER
        ===================================================== */

        .antimate-topbar {
          height: 72px;
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 clamp(16px, 3vw, 34px);

          position: fixed;
          inset:
            0 0 auto 0;

          z-index: 100;

          border-bottom:
            1px solid var(--border);

          background:
            var(--surface);

          backdrop-filter:
            blur(28px)
            saturate(180%);

          -webkit-backdrop-filter:
            blur(28px)
            saturate(180%);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;

          min-width: 0;
        }

        .brand-logo {
          position: relative;

          width: 37px;
          height: 37px;

          flex-shrink: 0;
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;

          min-width: 0;
        }

        .brand-name {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -.025em;
        }

        .brand-tagline {
          color: var(--text-tertiary);

          font-size: 9px;
          font-weight: 800;

          letter-spacing: .11em;
          text-transform: uppercase;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .connection-pill {
          display: flex;
          align-items: center;
          gap: 7px;

          height: 34px;

          padding:
            0 11px;

          border:
            1px solid var(--border);

          border-radius: 999px;

          background:
            var(--surface-solid);

          color:
            var(--text-secondary);

          font-size: 11px;
          font-weight: 700;
        }

        .connection-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            var(--text-tertiary);

          transition:
            background .25s ease,
            box-shadow .25s ease;
        }

        .connection-dot.online {
          background: var(--green);

          box-shadow:
            0 0 0 4px
            rgba(24,169,87,.10);
        }

        .top-icon-button {
          width: 36px;
          height: 36px;

          display: grid;
          place-items: center;

          border:
            1px solid var(--border);

          border-radius: 11px;

          color: var(--text-secondary);

          background:
            var(--surface-solid);

          cursor: pointer;

          transition:
            transform .18s ease,
            background .18s ease,
            color .18s ease,
            border-color .18s ease;
        }

        .top-icon-button:hover {
          transform: translateY(-1px);
          background:
            var(--surface-hover);
          color: var(--text);
          border-color:
            var(--border-strong);
        }

        .mobile-menu-button {
          display: none;
        }

        /* =====================================================
           LOGO
        ===================================================== */

        .ai-logo {
          position: relative;

          display: grid;
          place-items: center;

          flex-shrink: 0;

          border-radius: 50%;

          background:
            conic-gradient(
              from 0deg,
              #1f5fff,
              #7d4cff,
              #17c7d8,
              #1f5fff
            );

          box-shadow:
            0 0 0 4px
              rgba(36,99,235,.055),
            0 8px 30px
              rgba(36,99,235,.16);

          overflow: hidden;
        }

        .ai-logo-core {
          width: 24%;
          height: 24%;

          border-radius: 50%;

          background: #ffffff;

          position: relative;
          z-index: 4;

          box-shadow:
            0 0 14px
            rgba(255,255,255,.9);
        }

        .ai-logo-orbit {
          position: absolute;

          width: 62%;
          height: 62%;

          border:
            1.5px solid
            rgba(255,255,255,.9);

          border-radius: 50%;

          z-index: 3;
        }

        .orbit-one {
          transform:
            rotate(45deg)
            scaleX(.7);
        }

        .orbit-two {
          transform:
            rotate(-45deg)
            scaleX(.7);
        }

        .ai-logo-glow {
          position: absolute;

          width: 75%;
          height: 75%;

          border-radius: 50%;

          background:
            rgba(255,255,255,.13);

          filter:
            blur(5px);
        }

        .ai-logo-animated {
          animation:
            logoBreath
            5s
            ease-in-out
            infinite;
        }

        @keyframes logoBreath {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.035);
          }
        }

        /* =====================================================
           PAGE LAYOUT
        ===================================================== */

        .antimate-body {
          min-height: 100dvh;

          display: flex;

          padding-top: 72px;
        }

        .desktop-rail {
          width: 238px;

          flex-shrink: 0;

          padding:
            26px 14px 110px;

          border-right:
            1px solid var(--border);

          position: fixed;

          top: 72px;
          bottom: 0;
          left: 0;

          overflow-y: auto;

          scrollbar-width: none;
        }

        .desktop-rail::-webkit-scrollbar {
          display: none;
        }

        .rail-label {
          padding:
            0 11px 9px;

          color:
            var(--text-tertiary);

          font-size: 9px;
          font-weight: 800;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .rail-item {
          width: 100%;

          display: flex;
          align-items: center;
          gap: 11px;

          padding:
            10px 11px;

          margin-bottom: 3px;

          border: 0;
          border-radius: 12px;

          background: transparent;

          color:
            var(--text-secondary);

          cursor: pointer;

          text-align: left;

          transition:
            background .18s ease,
            color .18s ease,
            transform .18s ease;
        }

        .rail-item:hover {
          background:
            var(--surface-hover);

          color:
            var(--text);

          transform:
            translateX(2px);
        }

        .rail-item.active {
          background:
            var(--surface-hover);

          color:
            var(--text);

          font-weight: 750;
        }

        .rail-item-icon {
          width: 31px;
          height: 31px;

          display: grid;
          place-items: center;

          border-radius: 9px;

          background:
            var(--surface-solid);

          border:
            1px solid var(--border);
        }

        .rail-item-text {
          flex: 1;
          min-width: 0;
        }

        .rail-item-title {
          font-size: 12px;
          font-weight: 700;
        }

        .rail-item-sub {
          margin-top: 2px;

          color:
            var(--text-tertiary);

          font-size: 9px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rail-bottom {
          margin-top: 22px;
          padding:
            14px;

          border:
            1px solid var(--border);

          border-radius: 17px;

          background:
            linear-gradient(
              145deg,
              var(--surface-solid),
              var(--surface-soft)
            );
        }

        .rail-bottom-icon {
          width: 31px;
          height: 31px;

          display: grid;
          place-items: center;

          margin-bottom: 9px;

          border-radius: 10px;

          color:
            var(--blue);

          background:
            rgba(36,99,235,.09);
        }

        .rail-bottom-title {
          font-size: 12px;
          font-weight: 800;
        }

        .rail-bottom-text {
          margin-top: 5px;

          color:
            var(--text-secondary);

          font-size: 10px;
          line-height: 1.5;
        }

        .main-area {
          width: 100%;

          margin-left: 238px;

          display: flex;
          justify-content: center;
        }

        .chat-column {
          width:
            min(
              960px,
              calc(100% - 50px)
            );

          padding:
            45px 0 185px;
        }

        /* =====================================================
           WELCOME
        ===================================================== */

        .welcome {
          min-height:
            calc(100dvh - 260px);

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding:
            20px 0 45px;

          animation:
            welcomeIn
            .65s
            cubic-bezier(.2,.8,.2,1);
        }

        @keyframes welcomeIn {
          from {
            opacity: 0;
            transform:
              translateY(14px)
              scale(.985);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .welcome-logo-wrap {
          position: relative;

          margin-bottom: 22px;
        }

        .welcome-logo-ring {
          position: absolute;

          inset: -13px;

          border:
            1px solid
            var(--border);

          border-radius: 50%;

          animation:
            ringPulse
            3s
            ease-in-out
            infinite;
        }

        @keyframes ringPulse {
          0%,
          100% {
            transform: scale(.94);
            opacity: .45;
          }

          50% {
            transform: scale(1.08);
            opacity: .8;
          }
        }

        .welcome-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding:
            6px 10px;

          margin-bottom: 12px;

          border:
            1px solid var(--border);

          border-radius: 999px;

          color:
            var(--text-secondary);

          background:
            var(--surface);

          font-size: 10px;
          font-weight: 750;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background:
            var(--green);

          box-shadow:
            0 0 0 4px
            rgba(24,169,87,.08);
        }

        .welcome-title {
          margin: 0;

          text-align: center;

          font-size:
            clamp(
              35px,
              6vw,
              64px
            );

          line-height:
            .98;

          letter-spacing:
            -.055em;

          font-weight:
            850;

          max-width: 820px;
        }

        .welcome-title-gradient {
          background:
            linear-gradient(
              100deg,
              var(--text),
              var(--text-secondary)
            );

          -webkit-background-clip:
            text;

          background-clip:
            text;

          color: transparent;
        }

        .welcome-description {
          max-width: 610px;

          margin:
            17px auto 0;

          color:
            var(--text-secondary);

          text-align: center;

          font-size:
            clamp(
              13px,
              2vw,
              15px
            );

          line-height:
            1.65;
        }

        .welcome-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;

          margin-top: 27px;
        }

        .welcome-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding:
            9px 12px;

          border:
            1px solid var(--border);

          border-radius: 999px;

          color:
            var(--text-secondary);

          background:
            var(--surface);

          cursor: pointer;

          font-size: 10px;
          font-weight: 700;

          transition:
            transform .18s ease,
            background .18s ease,
            border-color .18s ease,
            color .18s ease;
        }

        .welcome-chip:hover {
          transform:
            translateY(-2px);

          background:
            var(--surface-hover);

          color:
            var(--text);

          border-color:
            var(--border-strong);
        }

        .quick-grid {
          width: 100%;

          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );

          gap: 9px;

          margin-top: 40px;
        }

        .quick-card {
          min-height: 135px;

          display: flex;
          flex-direction: column;

          padding: 15px;

          border:
            1px solid var(--border);

          border-radius: 18px;

          background:
            var(--surface);

          box-shadow:
            var(--shadow-sm);

          cursor: pointer;

          text-align: left;

          transition:
            transform .22s cubic-bezier(.2,.8,.2,1),
            box-shadow .22s ease,
            border-color .22s ease,
            background .22s ease;
        }

        .quick-card:hover {
          transform:
            translateY(-4px);

          box-shadow:
            var(--shadow-lg);

          border-color:
            var(--border-strong);

          background:
            var(--surface-solid);
        }

        .quick-card-icon {
          width: 34px;
          height: 34px;

          display: grid;
          place-items: center;

          border-radius: 10px;

          background:
            var(--surface-soft);

          color:
            var(--blue);
        }

        .quick-card-title {
          margin-top: 14px;

          font-size: 12px;
          font-weight: 800;
        }

        .quick-card-description {
          margin-top: 4px;

          color:
            var(--text-tertiary);

          font-size: 10px;
          line-height: 1.45;
        }

        .quick-card-arrow {
          margin-top: auto;

          display: flex;
          justify-content: flex-end;

          color:
            var(--text-tertiary);
        }

        /* =====================================================
           MESSAGES
        ===================================================== */

        .message-list {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .message-row {
          width: 100%;

          display: flex;

          animation:
            messageIn
            .4s
            cubic-bezier(.2,.8,.2,1);
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
          justify-content: flex-end;
        }

        .message-row.assistant {
          align-items: flex-start;
          gap: 11px;
        }

        .assistant-avatar {
          width: 31px;
          height: 31px;

          display: grid;
          place-items: center;

          flex-shrink: 0;

          margin-top: 2px;
        }

        .assistant-avatar .ai-logo {
          width: 29px !important;
          height: 29px !important;
        }

        .message-content {
          max-width:
            min(
              760px,
              85%
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
            11px 15px;

          border-radius:
            19px
            19px
            5px
            19px;

          color:
            var(--primary-text);

          background:
            var(--primary);

          box-shadow:
            0 7px 22px
            rgba(0,0,0,.07);
        }

        .theme-dark
        .message-bubble.user {
          box-shadow:
            0 8px 25px
            rgba(0,0,0,.28);
        }

        .message-bubble.assistant {
          color:
            var(--text);
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 4px;

          margin-top: 7px;

          opacity: 0;

          transition:
            opacity .18s ease;
        }

        .message-row:hover
        .message-meta {
          opacity: 1;
        }

        .message-action {
          width: 28px;
          height: 28px;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 8px;

          background:
            transparent;

          color:
            var(--text-tertiary);

          cursor: pointer;

          transition:
            background .18s ease,
            color .18s ease;
        }

        .message-action:hover {
          background:
            var(--surface-hover);

          color:
            var(--text);
        }

        /* =====================================================
           TRANSCRIPT
        ===================================================== */

        .transcript-card {
          margin-left: 42px;

          max-width: 760px;

          padding:
            12px 15px;

          border:
            1px solid
            rgba(36,99,235,.12);

          border-left:
            3px solid
            var(--blue);

          border-radius:
            0 13px 13px 0;

          background:
            rgba(36,99,235,.045);

          color:
            var(--text-secondary);

          font-size: 12px;
          line-height: 1.55;
        }

        .transcript-label {
          display: block;

          margin-bottom: 3px;

          color:
            var(--blue);

          font-size: 9px;
          font-weight: 800;

          letter-spacing: .08em;

          text-transform:
            uppercase;
        }

        /* =====================================================
           THINKING
        ===================================================== */

        .thinking-row {
          display: flex;
          align-items: center;
          gap: 10px;

          margin-left: 0;

          color:
            var(--text-secondary);

          font-size: 12px;

          animation:
            messageIn
            .3s
            ease;
        }

        .thinking-text {
          min-width: 130px;
        }

        .thinking-dots {
          display: flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;

          border-radius: 50%;

          background:
            var(--blue);

          animation:
            dotBounce
            1.1s
            ease-in-out
            infinite;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay:
            .14s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay:
            .28s;
        }

        @keyframes dotBounce {
          0%,
          60%,
          100% {
            transform:
              translateY(0);
            opacity: .35;
          }

          30% {
            transform:
              translateY(-4px);
            opacity: 1;
          }
        }

        /* =====================================================
           CURRENT STREAM ANSWER
        ===================================================== */

        .stream-answer {
          display: flex;
          align-items: flex-start;
          gap: 11px;

          animation:
            messageIn
            .3s
            ease;
        }

        .stream-answer-content {
          max-width:
            760px;

          padding-top: 2px;

          font-size: 14px;
          line-height: 1.72;

          white-space: pre-wrap;
        }

        /* =====================================================
           SPEAKING
        ===================================================== */

        .speaking-card {
          display: inline-flex;
          align-items: center;
          gap: 10px;

          margin:
            22px 0 0 42px;

          padding:
            8px 12px;

          border:
            1px solid var(--border);

          border-radius: 999px;

          background:
            var(--surface);

          box-shadow:
            var(--shadow-sm);

          color:
            var(--text-secondary);

          font-size: 10px;
          font-weight: 750;
        }

        .speaking-bars {
          height: 15px;

          display: flex;
          align-items: center;
          gap: 2px;
        }

        .speaking-bars span {
          width: 2px;

          border-radius: 5px;

          background:
            var(--blue);

          animation:
            speakingBar
            .75s
            ease-in-out
            infinite;
        }

        .speaking-bars span:nth-child(1) {
          height: 5px;
        }

        .speaking-bars span:nth-child(2) {
          height: 11px;
          animation-delay: .1s;
        }

        .speaking-bars span:nth-child(3) {
          height: 7px;
          animation-delay: .2s;
        }

        .speaking-bars span:nth-child(4) {
          height: 13px;
          animation-delay: .3s;
        }

        .speaking-bars span:nth-child(5) {
          height: 8px;
          animation-delay: .4s;
        }

        @keyframes speakingBar {
          50% {
            transform:
              scaleY(.35);
          }
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .error-card {
          margin:
            18px auto;

          max-width: 720px;

          display: flex;
          align-items: flex-start;
          gap: 9px;

          padding:
            11px 13px;

          border:
            1px solid
            rgba(229,72,77,.18);

          border-radius: 12px;

          background:
            rgba(229,72,77,.06);

          color:
            var(--red);

          font-size: 11px;
          line-height: 1.5;
        }

        /* =====================================================
           COMPOSER AREA
        ===================================================== */

        .composer-zone {
          position: fixed;

          left: 238px;
          right: 0;
          bottom: 0;

          z-index: 90;

          padding:
            18px
            clamp(12px, 3vw, 35px)
            max(
              16px,
              env(safe-area-inset-bottom)
            );

          pointer-events:
            none;

          background:
            linear-gradient(
              to top,
              var(--bg) 50%,
              transparent
            );
        }

        .composer-wrap {
          width:
            min(
              960px,
              100%
            );

          margin:
            0 auto;

          pointer-events:
            auto;
        }

        .live-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          margin-bottom: 8px;

          padding:
            9px 12px;

          border:
            1px solid
            rgba(121,87,255,.16);

          border-radius: 13px;

          background:
            rgba(121,87,255,.07);

          box-shadow:
            0 10px 35px
            rgba(121,87,255,.07);

          animation:
            liveBannerIn
            .35s
            ease;
        }

        @keyframes liveBannerIn {
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

        .live-banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .live-pulse {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            var(--purple);

          box-shadow:
            0 0 0 5px
            rgba(121,87,255,.08);

          animation:
            livePulse
            1.2s
            infinite;
        }

        @keyframes livePulse {
          50% {
            box-shadow:
              0 0 0 8px
              rgba(121,87,255,.025);
          }
        }

        .live-banner-text {
          font-size: 10px;
          font-weight: 800;
        }

        .live-banner-sub {
          margin-left: 6px;

          color:
            var(--text-tertiary);

          font-size: 9px;
        }

        .live-stop {
          border: 0;

          padding:
            6px 9px;

          border-radius: 8px;

          background:
            var(--surface-solid);

          color:
            var(--text-secondary);

          font-size: 9px;
          font-weight: 800;

          cursor: pointer;
        }

        .composer {
          position: relative;

          display: flex;
          align-items: flex-end;

          min-height: 62px;

          padding:
            7px 7px 7px 14px;

          border:
            1px solid var(--border-strong);

          border-radius: 22px;

          background:
            var(--surface);

          box-shadow:
            var(--shadow-lg);

          backdrop-filter:
            blur(28px)
            saturate(180%);

          -webkit-backdrop-filter:
            blur(28px)
            saturate(180%);

          transition:
            border-color .25s ease,
            box-shadow .25s ease;
        }

        .composer:focus-within {
          border-color:
            rgba(36,99,235,.27);

          box-shadow:
            0 20px 70px
            rgba(36,99,235,.10);
        }

        .composer-recording {
          border-color:
            rgba(229,72,77,.25);
        }

        .composer-live {
          border-color:
            rgba(121,87,255,.28);
        }

        .composer-textarea {
          flex: 1;

          min-width: 0;

          min-height: 46px;
          max-height: 150px;

          resize: none;

          border: 0;
          outline: 0;

          padding:
            12px 9px;

          background:
            transparent;

          color:
            var(--text);

          font-size: 14px;

          line-height: 1.5;

          overflow-y: auto;
        }

        .composer-textarea::placeholder {
          color:
            var(--text-tertiary);
        }

        .composer-textarea:disabled {
          opacity: .65;
        }

        .composer-action {
          position: relative;

          width: 47px;
          height: 47px;

          display: grid;
          place-items: center;

          flex-shrink: 0;

          border: 0;

          border-radius: 16px;

          background:
            var(--primary);

          color:
            var(--primary-text);

          cursor: pointer;

          touch-action: none;

          user-select: none;
          -webkit-user-select: none;

          transition:
            transform .16s ease,
            box-shadow .2s ease,
            background .2s ease,
            opacity .2s ease;
        }

        .composer-action:hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 7px 20px
            rgba(0,0,0,.12);
        }

        .composer-action:active {
          transform:
            scale(.93);
        }

        .composer-action:disabled {
          opacity: .38;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .composer-action.recording {
          background:
            var(--red);

          color: white;

          animation:
            recordPulse
            1.5s
            infinite;
        }

        .composer-action.live {
          background:
            linear-gradient(
              135deg,
              #7353ff,
              #9c55ff
            );

          color: white;

          animation:
            liveButtonPulse
            1.45s
            infinite;
        }

        @keyframes recordPulse {
          50% {
            box-shadow:
              0 0 0 9px
              rgba(229,72,77,.07);
          }
        }

        @keyframes liveButtonPulse {
          50% {
            box-shadow:
              0 0 0 10px
              rgba(121,87,255,.07);
          }
        }

        .recording-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 8px 7px 5px;

          color:
            var(--text-secondary);

          font-size: 9px;
          font-weight: 750;
        }

        .recording-state {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .recording-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background:
            var(--red);

          animation:
            indicatorPulse
            1s
            infinite;
        }

        .recording-dot.live {
          background:
            var(--purple);
        }

        @keyframes indicatorPulse {
          50% {
            opacity: .35;
          }
        }

        .recording-time {
          color:
            var(--text);

          font-variant-numeric:
            tabular-nums;

          font-weight: 850;
        }

        .composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            7px 5px 0;

          color:
            var(--text-tertiary);

          font-size: 9px;
        }

        .composer-footer-left {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .footer-key {
          display: inline-flex;
          align-items: center;

          padding:
            3px 6px;

          border:
            1px solid var(--border);

          border-radius: 6px;

          background:
            var(--surface-solid);

          font-size: 8px;
          font-weight: 800;
        }

        .composer-status {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* =====================================================
           MOBILE MENU
        ===================================================== */

        .mobile-overlay {
          position: fixed;
          inset: 0;

          z-index: 200;

          background:
            rgba(0,0,0,.38);

          backdrop-filter:
            blur(8px);

          animation:
            overlayIn
            .2s
            ease;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .mobile-panel {
          width:
            min(
              320px,
              86vw
            );

          height: 100%;

          padding:
            85px 16px 20px;

          background:
            var(--surface-solid);

          border-right:
            1px solid var(--border);

          animation:
            panelIn
            .3s
            cubic-bezier(.2,.8,.2,1);
        }

        @keyframes panelIn {
          from {
            transform:
              translateX(-100%);
          }

          to {
            transform:
              translateX(0);
          }
        }

        .mobile-close {
          position: absolute;

          top: 18px;
          right: 18px;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {
          .desktop-rail {
            width: 205px;
          }

          .main-area {
            margin-left: 205px;
          }

          .composer-zone {
            left: 205px;
          }

          .quick-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 820px) {
          .desktop-rail {
            display: none;
          }

          .main-area {
            margin-left: 0;
          }

          .composer-zone {
            left: 0;
          }

          .mobile-menu-button {
            display: grid;
          }

          .chat-column {
            width:
              min(
                100% - 28px,
                760px
              );

            padding-top:
              34px;
          }

          .connection-pill {
            display: none;
          }

          .welcome {
            min-height:
              calc(100dvh - 240px);
          }
        }

        @media (max-width: 600px) {
          .antimate-topbar {
            height: 62px;

            padding:
              0 12px;
          }

          .antimate-body {
            padding-top:
              62px;
          }

          .brand-tagline {
            display: none;
          }

          .brand-name {
            font-size: 14px;
          }

          .top-icon-button {
            width: 35px;
            height: 35px;
          }

          .chat-column {
            width:
              calc(100% - 20px);

            padding:
              22px 0 175px;
          }

          .welcome {
            min-height:
              calc(100dvh - 250px);

            padding:
              20px 0 25px;
          }

          .welcome-logo-wrap {
            margin-bottom: 17px;
          }

          .welcome-title {
            font-size:
              clamp(
                34px,
                12vw,
                48px
              );
          }

          .welcome-description {
            font-size: 13px;
          }

          .welcome-actions {
            gap: 6px;
            margin-top: 21px;
          }

          .welcome-chip {
            padding:
              8px 9px;

            font-size: 9px;
          }

          .quick-grid {
            grid-template-columns:
              repeat(2, minmax(0,1fr));

            gap: 7px;

            margin-top: 27px;
          }

          .quick-card {
            min-height: 125px;
            padding: 12px;
            border-radius: 15px;
          }

          .quick-card-title {
            margin-top: 11px;
          }

          .message-list {
            gap: 22px;
          }

          .message-content {
            max-width:
              88%;
          }

          .message-bubble {
            font-size: 13.5px;
          }

          .message-meta {
            opacity: 1;
          }

          .transcript-card {
            margin-left: 39px;
          }

          .speaking-card {
            margin-left: 39px;
          }

          .composer-zone {
            padding:
              10px
              10px
              max(
                10px,
                env(safe-area-inset-bottom)
              );

            background:
              linear-gradient(
                to top,
                var(--bg) 68%,
                transparent
              );
          }

          .composer {
            min-height: 59px;

            padding:
              6px 6px 6px 10px;

            border-radius: 19px;
          }

          .composer-textarea {
            min-height: 44px;

            font-size: 13px;

            padding:
              11px 6px;
          }

          .composer-action {
            width: 45px;
            height: 45px;

            border-radius: 15px;
          }

          .composer-footer {
            display: none;
          }

          .live-banner {
            padding:
              8px 10px;

            border-radius: 11px;
          }

          .live-banner-sub {
            display: none;
          }

          .error-card {
            font-size: 10px;
          }
        }

        @media (max-width: 390px) {
          .quick-grid {
            grid-template-columns:
              1fr;
          }

          .quick-card {
            min-height: 92px;
          }

          .quick-card-description {
            max-width: 230px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration:
              .001ms !important;

            animation-iteration-count:
              1 !important;

            scroll-behavior:
              auto !important;

            transition-duration:
              .001ms !important;
          }
        }
      `}</style>

      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <header className="antimate-topbar">
        <div className="brand">
          <div className="brand-logo">
            <LogoMark
              size={37}
            />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              ANTIMATE
            </div>

            <div className="brand-tagline">
              Intelligent Farming AI
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="connection-pill">
            <span
              className={`connection-dot ${
                socketConnected
                  ? "online"
                  : ""
              }`}
            />

            {connectionLabel}
          </div>

          <button
            type="button"
            className="top-icon-button"
            title={
              theme === "dark"
                ? "Light mode"
                : "Dark mode"
            }
            aria-label="Change theme"
            onClick={() =>
              setTheme(
                theme === "dark"
                  ? "light"
                  : "dark"
              )
            }
          >
            <Icon
              name={themeIcon}
              size={17}
            />
          </button>

          <button
            type="button"
            className="top-icon-button mobile-menu-button"
            aria-label="Open menu"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
          >
            <Icon
              name="menu"
              size={18}
            />
          </button>
        </div>
      </header>

      {/* ======================================================
          BODY
      ====================================================== */}

      <div className="antimate-body">
        {/* ====================================================
            DESKTOP RAIL
        ==================================================== */}

        <aside className="desktop-rail">
          <div className="rail-label">
            Explore ANTIMATE
          </div>

          {QUICK_ACTIONS.map(
            (action, index) => (
              <button
                key={action.id}
                type="button"
                className={`rail-item ${
                  index === 0
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleQuickAction(
                    action.prompt
                  )
                }
              >
                <span className="rail-item-icon">
                  <Icon
                    name={action.icon}
                    size={16}
                  />
                </span>

                <span className="rail-item-text">
                  <span className="rail-item-title">
                    {action.title}
                  </span>

                  <span className="rail-item-sub">
                    {action.description}
                  </span>
                </span>
              </button>
            )
          )}

          <div
            className="rail-label"
            style={{
              marginTop: 24,
            }}
          >
            Assistant
          </div>

          <button
            type="button"
            className="rail-item"
            onClick={() => {
              setMessages([]);
              setTranscript("");
              setCurrentAnswer("");
              setErrorMessage("");
            }}
          >
            <span className="rail-item-icon">
              <Icon
                name="plus"
                size={16}
              />
            </span>

            <span className="rail-item-text">
              <span className="rail-item-title">
                New conversation
              </span>

              <span className="rail-item-sub">
                Start fresh
              </span>
            </span>
          </button>

          <button
            type="button"
            className="rail-item"
            onClick={() =>
              setShowFeatures(
                (previous) =>
                  !previous
              )
            }
          >
            <span className="rail-item-icon">
              <Icon
                name="sparkles"
                size={16}
              />
            </span>

            <span className="rail-item-text">
              <span className="rail-item-title">
                AI capabilities
              </span>

              <span className="rail-item-sub">
                Explore features
              </span>
            </span>

            <Icon
              name="chevron"
              size={14}
            />
          </button>

          {showFeatures && (
            <div
              style={{
                padding:
                  "5px 10px 8px 53px",
                color:
                  "var(--text-tertiary)",
                fontSize: 9,
                lineHeight: 1.65,
              }}
            >
              Voice AI
              <br />
              Kinyarwanda
              <br />
              Smart Brooding
              <br />
              Environment analysis
              <br />
              Personalized advice
            </div>
          )}

          <div className="rail-bottom">
            <div className="rail-bottom-icon">
              <Icon
                name="shield"
                size={16}
              />
            </div>

            <div className="rail-bottom-title">
              Built for smarter farming
            </div>

            <div className="rail-bottom-text">
              ANTIMATE ihuza AI,
              IoT n'ubumenyi bwa
              brooding kugira ngo
              ufate decisions nziza.
            </div>
          </div>
        </aside>

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="main-area">
          <section className="chat-column">
            {isEmpty ? (
              <div className="welcome">
                <div className="welcome-logo-wrap">
                  <div className="welcome-logo-ring" />

                  <LogoMark
                    size={76}
                  />
                </div>

                <div className="welcome-eyebrow">
                  <span className="eyebrow-dot" />
                  ANTIMATE AI IS READY
                </div>

                <h1 className="welcome-title">
                  Think smarter.
                  <br />
                  <span className="welcome-title-gradient">
                    Farm better.
                  </span>
                </h1>

                <p className="welcome-description">
                  Ndi ANTIMATE — AI assistant
                  w'umworozi. Mbaza ikibazo,
                  vuga mu Kinyarwanda, cyangwa
                  hitamo kimwe muri ibi bikurikira.
                </p>

                <div className="welcome-actions">
                  <button
                    type="button"
                    className="welcome-chip"
                    onClick={() =>
                      handleQuickAction(
                        QUICK_ACTIONS[0]
                          .prompt
                      )
                    }
                  >
                    <Icon
                      name="chicken"
                      size={14}
                    />
                    Brooding
                  </button>

                  <button
                    type="button"
                    className="welcome-chip"
                    onClick={() =>
                      handleQuickAction(
                        QUICK_ACTIONS[1]
                          .prompt
                      )
                    }
                  >
                    <Icon
                      name="shield"
                      size={14}
                    />
                    Health
                  </button>

                  <button
                    type="button"
                    className="welcome-chip"
                    onClick={() =>
                      handleQuickAction(
                        QUICK_ACTIONS[2]
                          .prompt
                      )
                    }
                  >
                    <Icon
                      name="activity"
                      size={14}
                    />
                    Environment
                  </button>

                  <button
                    type="button"
                    className="welcome-chip"
                    onClick={() =>
                      handleQuickAction(
                        QUICK_ACTIONS[3]
                          .prompt
                      )
                    }
                  >
                    <Icon
                      name="sparkles"
                      size={14}
                    />
                    Smart Advice
                  </button>
                </div>

                <div className="quick-grid">
                  {QUICK_ACTIONS.map(
                    (action) => (
                      <button
                        key={action.id}
                        type="button"
                        className="quick-card"
                        onClick={() =>
                          handleQuickAction(
                            action.prompt
                          )
                        }
                      >
                        <span className="quick-card-icon">
                          <Icon
                            name={
                              action.icon
                            }
                            size={17}
                          />
                        </span>

                        <span className="quick-card-title">
                          {action.title}
                        </span>

                        <span className="quick-card-description">
                          {
                            action.description
                          }
                        </span>

                        <span className="quick-card-arrow">
                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="message-list">
                {messages.map(
                  (message) => (
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
                            size={29}
                          />
                        </div>
                      )}

                      <div className="message-content">
                        <div
                          className={`message-bubble ${
                            message.role
                          }`}
                        >
                          {
                            message.content
                          }
                        </div>

                        {message.role ===
                          "assistant" && (
                          <div className="message-meta">
                            <button
                              type="button"
                              className="message-action"
                              title="Copy"
                              onClick={() =>
                                copyMessage(
                                  message
                                )
                              }
                            >
                              {copiedId ===
                              message.id ? (
                                <Icon
                                  name="check"
                                  size={14}
                                />
                              ) : (
                                <Icon
                                  name="copy"
                                  size={14}
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              className="message-action"
                              title="Read aloud"
                              onClick={() =>
                                readMessage(
                                  message.content
                                )
                              }
                            >
                              <Icon
                                name="volume"
                                size={14}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {transcript && (
                  <div className="transcript-card">
                    <span className="transcript-label">
                      Wavuze
                    </span>

                    {transcript}
                  </div>
                )}

                {isProcessing && (
                  <div className="thinking-row">
                    <div className="assistant-avatar">
                      <LogoMark
                        size={29}
                      />
                    </div>

                    <div className="thinking-text">
                      {
                        displayedThinking
                      }
                    </div>

                    <div className="thinking-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}

                {currentAnswer &&
                  !messages.some(
                    (message) =>
                      message.role ===
                        "assistant" &&
                      message.content ===
                        currentAnswer
                  ) && (
                    <div className="stream-answer">
                      <div className="assistant-avatar">
                        <LogoMark
                          size={29}
                        />
                      </div>

                      <div className="stream-answer-content">
                        {
                          currentAnswer
                        }
                      </div>
                    </div>
                  )}
              </div>
            )}

            {isPlaying && (
              <div className="speaking-card">
                <Icon
                  name="volume"
                  size={15}
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
              </div>
            )}

            {errorMessage && (
              <div className="error-card">
                <Icon
                  name="info"
                  size={15}
                />

                <span>
                  {errorMessage}
                </span>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ======================================================
          COMPOSER
      ====================================================== */}

      <div className="composer-zone">
        <div className="composer-wrap">
          {liveVoice && (
            <div className="live-banner">
              <div className="live-banner-left">
                <span className="live-pulse" />

                <span className="live-banner-text">
                  LIVE VOICE
                </span>

                <span className="live-banner-sub">
                  Vuga → 1.8s silence →
                  send automatically
                </span>
              </div>

              <button
                type="button"
                className="live-stop"
                onClick={
                  stopLiveVoice
                }
              >
                Hagarika
              </button>
            </div>
          )}

          <div
            className={`composer ${
              isRecording
                ? liveVoice
                  ? "composer-live"
                  : "composer-recording"
                : ""
            }`}
          >
            {isRecording && (
              <div
                className="recording-strip"
                style={{
                  position:
                    "absolute",
                  top: -25,
                  left: 7,
                  right: 7,
                }}
              >
                <div className="recording-state">
                  <span
                    className={`recording-dot ${
                      liveVoice
                        ? "live"
                        : ""
                    }`}
                  />

                  {liveVoice
                    ? "LIVE VOICE"
                    : "RECORDING"}
                </div>

                <div className="recording-time">
                  {liveVoice
                    ? "AUTO 1.8s"
                    : formatTime(
                        recordingSeconds
                      )}
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              className="composer-textarea"
              value={text}
              onChange={(event) => {
                setText(
                  event.target.value
                );

                resizeTextarea();
              }}
              onKeyDown={
                handleTextareaKeyDown
              }
              placeholder={
                liveVoice
                  ? "Live Voice irakora…"
                  : "Andika ikibazo cyangwa uvuge…"
              }
              disabled={
                liveVoice
              }
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
                  actionTitle
                }
                aria-label={
                  actionTitle
                }
                disabled={
                  composerDisabled
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
                      name="wave"
                      size={21}
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
                className="composer-action"
                title="Ohereza"
                aria-label="Ohereza"
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
              <span>
                ANTIMATE AI
              </span>

              <span>•</span>

              <span>
                Kinyarwanda ready
              </span>

              <span className="footer-key">
                /
              </span>

              <span>
                focus
              </span>
            </div>

            <div className="composer-status">
              {socketConnected ? (
                <>
                  <span className="connection-dot online" />
                  Secure connection
                </>
              ) : (
                <>
                  <span className="connection-dot" />
                  Connecting
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setMobileMenuOpen(
              false
            )
          }
        >
          <aside
            className="mobile-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="top-icon-button mobile-close"
              onClick={() =>
                setMobileMenuOpen(
                  false
                )
              }
              aria-label="Close menu"
            >
              <Icon
                name="close"
                size={18}
              />
            </button>

            <div className="rail-label">
              ANTIMATE
            </div>

            {QUICK_ACTIONS.map(
              (action) => (
                <button
                  key={action.id}
                  type="button"
                  className="rail-item"
                  onClick={() => {
                    setMobileMenuOpen(
                      false
                    );

                    handleQuickAction(
                      action.prompt
                    );
                  }}
                >
                  <span className="rail-item-icon">
                    <Icon
                      name={
                        action.icon
                      }
                      size={16}
                    />
                  </span>

                  <span className="rail-item-text">
                    <span className="rail-item-title">
                      {action.title}
                    </span>

                    <span className="rail-item-sub">
                      {
                        action.description
                      }
                    </span>
                  </span>

                  <Icon
                    name="arrow"
                    size={13}
                  />
                </button>
              )
            )}

            <div
              className="rail-label"
              style={{
                marginTop: 25,
              }}
            >
              Conversation
            </div>

            <button
              type="button"
              className="rail-item"
              onClick={() => {
                setMessages([]);
                setTranscript("");
                setCurrentAnswer("");
                setErrorMessage("");
                setMobileMenuOpen(
                  false
                );
              }}
            >
              <span className="rail-item-icon">
                <Icon
                  name="plus"
                  size={16}
                />
              </span>

              <span className="rail-item-text">
                <span className="rail-item-title">
                  New conversation
                </span>

                <span className="rail-item-sub">
                  Start fresh
                </span>
              </span>
            </button>

            <button
              type="button"
              className="rail-item"
              onClick={() =>
                setTheme(
                  theme === "dark"
                    ? "light"
                    : "dark"
                )
              }
            >
              <span className="rail-item-icon">
                <Icon
                  name={
                    theme ===
                    "dark"
                      ? "sun"
                      : "moon"
                  }
                  size={16}
                />
              </span>

              <span className="rail-item-text">
                <span className="rail-item-title">
                  Appearance
                </span>

                <span className="rail-item-sub">
                  {theme ===
                  "dark"
                    ? "Dark mode"
                    : "Light mode"}
                </span>
              </span>
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}