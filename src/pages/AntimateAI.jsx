import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

/*
============================================================
ANTIMATE AI
SELF-CONTAINED JSX
No AntimateAI.css required
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

/* ============================================================
   ICONS
============================================================ */

function SendIcon({ size = 21 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21.7 2.3 10.8 13.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="m21.7 2.3-7 19.4-3.9-8.5-8.5-3.9 19.4-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WaveIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="3"
        width="8"
        height="12"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        fill="currentColor"
      />
    </svg>
  );
}

function VolumeIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10v4h4l5 4V6l-5 4H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M17 9.5a4 4 0 0 1 0 5M19.5 7a8 8 0 0 1 0 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SunIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.2 15.3A8.7 8.7 0 0 1 8.7 3.8 8.7 8.7 0 1 0 20.2 15.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReplayIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11a8 8 0 0 0-14.8-4L3 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M3 5v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M4 13a8 8 0 0 0 14.8 4L21 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M21 19v-5h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrainIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 4a3 3 0 0 0-5 2.2A3.5 3.5 0 0 0 5.5 13 3.5 3.5 0 0 0 9 19.5V4ZM15 4a3 3 0 0 1 5 2.2A3.5 3.5 0 0 1 18.5 13 3.5 3.5 0 0 1 15 19.5V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9 8h2M9 12h2M13 8h2M13 12h2M9 16h2M13 16h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoMark({ size = 34 }) {
  return (
    <div
      className="antimate-logo-mark"
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="antimate-logo-ring" />
      <div className="antimate-logo-core" />
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

function getReasoningFromPayload(payload) {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return "";
  }

  return (
    payload.reasoning ||
    payload.backend_reasoning ||
    payload.backendReasoning ||
    payload.thinking ||
    payload.stage ||
    payload.reason ||
    payload.process ||
    ""
  );
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

  /* ==========================================================
     THEME
  ========================================================== */

  const [theme, setTheme] = useState(() => {
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
      // Ignore.
    }

    return "light";
  });

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

  const [backendReasoning, setBackendReasoning] =
    useState("");

  const [currentAnswer, setCurrentAnswer] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* ==========================================================
     RECORDING UI
  ========================================================== */

  const [recordingSeconds, setRecordingSeconds] =
    useState(30);

  const [recordingMode, setRecordingMode] =
    useState("tap");

  const [liveVoice, setLiveVoice] =
    useState(false);

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

  const stopRecordingRef =
    useRef(null);

  const startRecordingInternalRef =
    useRef(null);

  const messageIdRef =
    useRef(1);

  const streamingAnswerIdRef =
    useRef(null);

  const lastFinalAnswerRef =
    useRef("");

  const liveResumeTimerRef =
    useRef(null);

  const messageAudioUrlsRef =
    useRef([]);

  /* ==========================================================
     IDS
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
    document.documentElement
      .setAttribute(
        "data-antimate-theme",
        theme
      );

    try {
      localStorage.setItem(
        "antimate-theme",
        theme
      );
    } catch {
      // Ignore.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) =>
      prev === "dark"
        ? "light"
        : "dark"
    );
  }, []);

  /* ==========================================================
     ADD MESSAGE
  ========================================================== */

  const addMessage = useCallback(
    (
      role,
      content,
      extra = {}
    ) => {
      if (
        !content &&
        !extra.audioUrl &&
        !extra.reasoning
      ) {
        return null;
      }

      const id = createId();

      setMessages((prev) => [
        ...prev,
        {
          id,
          role,
          content:
            content || "",
          ...extra,
        },
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
      if (!id) {
        return;
      }

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
     WAKE LOCK
  ========================================================== */

  const requestWakeLock =
    useCallback(async () => {
      try {
        if (
          !("wakeLock" in navigator)
        ) {
          return;
        }

        if (
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
        // Optional feature.
      }
    }, []);

  const releaseWakeLock =
    useCallback(async () => {
      try {
        if (
          wakeLockRef.current
        ) {
          await wakeLockRef.current.release();

          wakeLockRef.current =
            null;
        }
      } catch {
        wakeLockRef.current = null;
      }
    }, []);

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
          // Ignore.
        }

        audioContextRef.current =
          null;
      }

      analyserRef.current =
        null;
    }, []);

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
              // Ignore.
            }
          });

        mediaStreamRef.current =
          null;
      }

      stopSilenceDetection();
    }, [
      stopSilenceDetection,
    ]);

  /* ==========================================================
     START SILENCE DETECTION
  ========================================================== */

  const startSilenceDetection =
    useCallback(
      (stream) => {
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

          analyser.fftSize =
            2048;

          analyser.smoothingTimeConstant =
            0.85;

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
              let i = 0;
              i < data.length;
              i++
            ) {
              const normalized =
                (data[i] - 128) /
                128;

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
      },
      []
    );

  /* ==========================================================
     SCHEDULE LIVE RESUME
  ========================================================== */

  const scheduleLiveResume =
    useCallback(
      (delay = 300) => {
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

  const playAudio = useCallback(
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

          scheduleLiveResume(350);
        }

        return;
      }

      if (
        messageId
      ) {
        updateMessage(
          messageId,
          {
            audioUrl,
          }
        );
      }

      messageAudioUrlsRef.current.push(
        audioUrl
      );

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
        if (
          !mountedRef.current
        ) {
          return;
        }

        isPlayingRef.current =
          false;

        setIsPlaying(false);

        setStatus("ready");

        setStatusMessage("");

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
        if (
          !mountedRef.current
        ) {
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

          scheduleLiveResume(400);
        } else {
          releaseWakeLock();
        }
      };

      audio
        .play()
        .catch((error) => {
          console.warn(
            "Audio autoplay failed:",
            error
          );

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
          }
        });
    },
    [
      releaseWakeLock,
      scheduleLiveResume,
      updateMessage,
    ]
  );

  /* ==========================================================
     REPLAY AI AUDIO
  ========================================================== */

  const replayAudio = useCallback(
    (audioUrl) => {
      if (!audioUrl) {
        return;
      }

      playAudio(audioUrl);
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
          !navigator.mediaDevices
            .getUserMedia
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

        setBackendReasoning("");

        streamingAnswerIdRef.current =
          null;

        lastFinalAnswerRef.current =
          "";

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

          if (
            mode === "live"
          ) {
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
          } else {
            setLiveVoice(false);

            setRecordingMode("tap");

            setRecordingSeconds(30);

            setStatus("recording");

            setStatusMessage(
              "Ndumva…"
            );
          }

          /*
           * LOCAL AUDIO CHUNKS
           *
           * Izi ni zo zikoreshwa kugira ngo
           * user voice message igaragare muri chat.
           */

          const localAudioChunks = [];

          /*
           * SOCKET SESSION
           */

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

          /*
           * Prevent voice:end from racing
           * the final async ArrayBuffer conversion.
           */

          const pendingChunkPromises =
            [];

          recorder.ondataavailable =
            (event) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              localAudioChunks.push(
                event.data
              );

              if (
                !socketRef.current?.connected
              ) {
                return;
              }

              const chunkPromise =
                event.data
                  .arrayBuffer()
                  .then((buffer) => {
                    if (
                      socketRef.current
                        ?.connected
                    ) {
                      socketRef.current.emit(
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

              pendingChunkPromises.push(
                chunkPromise
              );
            };

          recorder.onstop =
            async () => {
              if (
                mediaRecorderRef.current ===
                recorder
              ) {
                mediaRecorderRef.current =
                  null;
              }

              stopMediaTracks();

              /*
               * CREATE USER AUDIO MESSAGE
               */

              if (
                localAudioChunks.length
              ) {
                try {
                  const audioBlob =
                    new Blob(
                      localAudioChunks,
                      {
                        type:
                          sessionMimeType,
                      }
                    );

                  const localAudioUrl =
                    URL.createObjectURL(
                      audioBlob
                    );

                  messageAudioUrlsRef.current.push(
                    localAudioUrl
                  );

                  addMessage(
                    "user",
                    "",
                    {
                      audioUrl:
                        localAudioUrl,
                      isVoice: true,
                    }
                  );
                } catch (error) {
                  console.warn(
                    "Could not create local voice message:",
                    error
                  );
                }
              }

              /*
               * WAIT FOR LAST SOCKET CHUNKS
               */

              try {
                await Promise.all(
                  pendingChunkPromises
                );
              } catch {
                // Ignore.
              }

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

              if (
                mode === "live"
              ) {
                liveWaitingForResponseRef.current =
                  true;

                liveAudioReceivedRef.current =
                  false;
              }
            };

          recorder.onerror = (
            event
          ) => {
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

          if (
            mode === "live"
          ) {
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
        addMessage,
        releaseWakeLock,
        requestWakeLock,
        startSilenceDetection,
        stopMediaTracks,
      ]
    );

  useEffect(() => {
    startRecordingInternalRef.current =
      startRecordingInternal;
  }, [
    startRecordingInternal,
  ]);

  /* ==========================================================
     STOP RECORDING
  ========================================================== */

  const stopRecording =
    useCallback(
      ({
        liveSegment = false,
      } = {}) => {
        if (
          !isRecordingRef.current
        ) {
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
          event.pointerType ===
            "mouse" &&
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

        /*
         * Already recording:
         * normal => stop
         * live => keep running
         */

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

        startRecordingInternal("tap");

        /*
         * HOLD 5 SECONDS => LIVE
         */

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
              stopSilenceDetection();

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
        stopSilenceDetection,
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

        /*
         * Normal recording remains active
         * until second click or 30 seconds.
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

      if (
        liveResumeTimerRef.current
      ) {
        clearTimeout(
          liveResumeTimerRef.current
        );

        liveResumeTimerRef.current =
          null;
      }

      setLiveVoice(false);

      if (
        isRecordingRef.current
      ) {
        stopRecording({
          liveSegment: false,
        });
      }

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
    useCallback(async () => {
      const value =
        text.trim();

      if (!value) {
        return;
      }

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

      setBackendReasoning("");

      streamingAnswerIdRef.current =
        null;

      lastFinalAnswerRef.current =
        "";

      addMessage(
        "user",
        value,
        {
          isVoice: false,
        }
      );

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

        if (
          !response.ok
        ) {
          throw new Error(
            `Request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        /*
         * BACKEND REASONING
         */

        const reasoning =
          getReasoningFromPayload(
            data
          );

        if (reasoning) {
          setBackendReasoning(
            reasoning
          );
        }

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

        /*
         * CREATE AI MESSAGE
         */

        const aiMessageId =
          addMessage(
            "assistant",
            answer,
            {
              reasoning:
                reasoning || "",
            }
          );

        lastFinalAnswerRef.current =
          answer;

        /*
         * AUDIO
         */

        const audioPayload =
          data?.audio ||
          data?.audioUrl ||
          data?.audio_url ||
          data?.voice_url ||
          data?.voiceUrl;

        if (audioPayload) {
          const audioUrl =
            getAudioUrl(
              audioPayload
            );

          if (audioUrl) {
            updateMessage(
              aiMessageId,
              {
                audioUrl,
              }
            );

            playAudio(
              audioUrl,
              aiMessageId
            );
          }
        }

        setIsProcessing(
          false
        );

        setStatus("ready");

        setStatusMessage("");
      } catch (error) {
        console.error(
          "ANTIMATE CHAT ERROR:",
          error
        );

        setIsProcessing(
          false
        );

        setStatus("error");

        setErrorMessage(
          "Ntabwo nshoboye kubona igisubizo ubu. Ongera ugerageze."
        );
      }
    }, [
      addMessage,
      isProcessing,
      isRecording,
      liveVoice,
      playAudio,
      text,
      updateMessage,
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

    /* ======================================================
       CONNECT
    ====================================================== */

    socket.on(
      "connect",
      () => {
        console.log(
          "🔌 ANTIMATE Socket connected:",
          socket.id
        );

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

    /* ======================================================
       DISCONNECT
    ====================================================== */

    socket.on(
      "disconnect",
      (reason) => {
        console.warn(
          "❌ ANTIMATE Socket disconnected:",
          reason
        );

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

    /* ======================================================
       CONNECT ERROR
    ====================================================== */

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "🔥 ANTIMATE SOCKET ERROR:",
          error
        );

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

    /* ======================================================
       RECONNECT
    ====================================================== */

    socket.io.on(
      "reconnect",
      (attempt) => {
        console.log(
          "🔄 ANTIMATE Socket reconnected:",
          attempt
        );
      }
    );

    /* ======================================================
       STATUS
    ====================================================== */

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
              payload?.stage ||
              "";

        const reasoning =
          getReasoningFromPayload(
            payload
          );

        if (message) {
          setStatusMessage(
            message
          );
        }

        if (reasoning) {
          setBackendReasoning(
            reasoning
          );
        }
      }
    );

    /* ======================================================
       TRANSCRIPT
    ====================================================== */

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

        const reasoning =
          getReasoningFromPayload(
            payload
          );

        if (reasoning) {
          setBackendReasoning(
            reasoning
          );
        }
      }
    );

    /* ======================================================
       THINKING / BACKEND REASONING
    ====================================================== */

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
              payload?.reasoning ||
              payload?.thinking ||
              payload?.stage ||
              "";

        /*
         * Important:
         *
         * We display what the BACKEND actually
         * sends instead of fake frontend text.
         */

        if (value) {
          setBackendReasoning(
            value
          );

          setStatusMessage(
            value
          );
        }
      }
    );

    /* ======================================================
       ANSWER CHUNK
    ====================================================== */

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

        const reasoning =
          getReasoningFromPayload(
            payload
          );

        if (reasoning) {
          setBackendReasoning(
            reasoning
          );
        }

        if (!chunk) {
          return;
        }

        setCurrentAnswer(
          (prev) =>
            prev + chunk
        );

        /*
         * Create ONE streaming message
         * and update it.
         */

        setMessages((prev) => {
          const existingId =
            streamingAnswerIdRef.current;

          if (existingId) {
            return prev.map(
              (message) =>
                message.id ===
                existingId
                  ? {
                      ...message,
                      content:
                        `${message.content || ""}${chunk}`,
                      reasoning:
                        reasoning ||
                        message.reasoning ||
                        "",
                    }
                  : message
            );
          }

          const newId =
            createId();

          streamingAnswerIdRef.current =
            newId;

          return [
            ...prev,
            {
              id: newId,
              role: "assistant",
              content: chunk,
              reasoning:
                reasoning || "",
            },
          ];
        });
      }
    );

    /* ======================================================
       ANSWER
    ====================================================== */

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

        const reasoning =
          getReasoningFromPayload(
            payload
          );

        if (reasoning) {
          setBackendReasoning(
            reasoning
          );
        }

        if (answer) {
          setCurrentAnswer(
            answer
          );

          /*
           * If a streaming message already exists,
           * update it instead of creating duplicate.
           */

          if (
            streamingAnswerIdRef.current
          ) {
            updateMessage(
              streamingAnswerIdRef.current,
              {
                content:
                  answer,

                reasoning:
                  reasoning || "",
              }
            );
          } else if (
            answer !==
            lastFinalAnswerRef.current
          ) {
            const id =
              addMessage(
                "assistant",
                answer,
                {
                  reasoning:
                    reasoning ||
                    "",
                }
              );

            streamingAnswerIdRef.current =
              id;
          }

          lastFinalAnswerRef.current =
            answer;
        }

        setStatus(
          "speaking"
        );

        if (reasoning) {
          setStatusMessage(
            reasoning
          );
        }
      }
    );

    /* ======================================================
       AUDIO
    ====================================================== */

    socket.on(
      "antimate:audio",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        const targetId =
          streamingAnswerIdRef.current;

        playAudio(
          payload,
          targetId
        );
      }
    );

    /* ======================================================
       COMPLETE
    ====================================================== */

    socket.on(
      "antimate:complete",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        console.log(
          "✅ ANTIMATE voice complete:",
          payload
        );

        const reasoning =
          getReasoningFromPayload(
            payload
          );

        if (reasoning) {
          setBackendReasoning(
            reasoning
          );
        }

        setIsProcessing(
          false
        );

        setStatus(
          liveVoiceRef.current
            ? "speaking"
            : "ready"
        );

        if (reasoning) {
          setStatusMessage(
            reasoning
          );
        }

        /*
         * If no audio arrived, continue live mode.
         */

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

        streamingAnswerIdRef.current =
          null;
      }
    );

    /* ======================================================
       ERROR
    ====================================================== */

    socket.on(
      "antimate:error",
      (payload) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        console.error(
          "🔥 ANTIMATE voice error:",
          payload
        );

        const message =
          typeof payload ===
          "string"
            ? payload
            : payload?.message ||
              payload?.error ||
              "ANTIMATE habonye ikibazo.";

        const reasoning =
          getReasoningFromPayload(
            payload
          );

        setErrorMessage(
          message
        );

        if (reasoning) {
          setBackendReasoning(
            reasoning
          );
        }

        setIsProcessing(
          false
        );

        setStatus("error");

        setStatusMessage(
          reasoning || ""
        );

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

    /* ======================================================
       CLEAN SOCKET
    ====================================================== */

    return () => {
      mountedRef.current =
        false;

      console.log(
        "🔌 Cleaning ANTIMATE Socket.IO"
      );

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
    createId,
    playAudio,
    scheduleLiveResume,
    updateMessage,
  ]);

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

      /*
       * Revoke local voice URLs.
       */

      messageAudioUrlsRef.current.forEach(
        (url) => {
          if (
            typeof url ===
              "string" &&
            url.startsWith("blob:")
          ) {
            try {
              URL.revokeObjectURL(
                url
              );
            } catch {
              // Ignore.
            }
          }
        }
      );

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
     UI DERIVED VALUES
  ========================================================== */

  const hasText =
    text.trim().length > 0;

  const connectionLabel =
    socketConnected
      ? "Online"
      : "Offline";

  const actionTitle =
    hasText
      ? "Ohereza ubutumwa"
      : isRecording
      ? liveVoice
        ? "Live Voice irakora"
        : "Kanda uhagarike recording"
      : "Kanda ufate amajwi • Hold 5s kuri Live Voice";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className={`antimate-page ${
        theme === "dark"
          ? "theme-dark"
          : "theme-light"
      }`}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .antimate-page {
          --bg: #f6f8fb;
          --surface: rgba(255,255,255,0.94);
          --surface-soft: #f8fafc;
          --border: #e5e9f0;
          --text: #172033;
          --muted: #697386;
          --primary: #111827;
          --primary-soft: #eef2f7;
          --accent: #2563eb;
          --danger: #dc2626;
          --success: #16a34a;

          min-height: 100vh;
          width: 100%;

          background:
            radial-gradient(
              circle at 20% 0%,
              rgba(37,99,235,0.06),
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

          transition:
            background 0.25s ease,
            color 0.25s ease;
        }

        /*
        ========================================================
        MANUAL DARK THEME
        ========================================================
        */

        .antimate-page.theme-dark {
          --bg: #080d16;
          --surface: rgba(16,23,35,0.96);
          --surface-soft: #0d1522;
          --border: #202b3b;
          --text: #f3f6fb;
          --muted: #a3adbd;
          --primary: #f7f9fc;
          --primary-soft: #182131;
          --accent: #60a5fa;
          --danger: #f87171;
          --success: #4ade80;

          background:
            radial-gradient(
              circle at 20% 0%,
              rgba(37,99,235,0.13),
              transparent 32%
            ),
            var(--bg);
        }

        /*
        ========================================================
        HEADER
        ========================================================
        */

        .antimate-header {
          height: 68px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 24px;

          border-bottom:
            1px solid
            var(--border);

          background:
            var(--surface);

          backdrop-filter:
            blur(18px);

          position: sticky;
          top: 0;

          z-index: 20;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .antimate-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }

        .antimate-brand-name {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .antimate-brand-sub {
          margin-top: 4px;
          font-size: 10px;
          color: var(--muted);
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .antimate-logo-mark {
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
            0 8px 24px
              rgba(37,99,235,0.15);

          animation:
            logoSpin
            7s linear infinite;
        }

        .antimate-logo-ring {
          width: 64%;
          height: 64%;

          border:
            2px solid
            rgba(255,255,255,0.9);

          border-radius: 50%;

          position: absolute;
        }

        .antimate-logo-core {
          width: 18%;
          height: 18%;

          background: white;

          border-radius: 50%;

          position: absolute;
        }

        @keyframes logoSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /*
        ========================================================
        HEADER CONTROLS
        ========================================================
        */

        .header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .theme-toggle {
          width: 36px;
          height: 36px;

          display: grid;
          place-items: center;

          border:
            1px solid
            var(--border);

          background:
            var(--surface-soft);

          color:
            var(--text);

          border-radius: 11px;

          cursor: pointer;

          transition:
            transform 0.18s ease,
            background 0.18s ease,
            border 0.18s ease;
        }

        .theme-toggle:hover {
          transform:
            translateY(-1px);
        }

        .theme-toggle:active {
          transform:
            scale(0.94);
        }

        .antimate-connection {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 7px 10px;

          border:
            1px solid
            var(--border);

          border-radius: 999px;

          background:
            var(--surface-soft);

          font-size: 11px;

          color:
            var(--muted);

          font-weight: 700;
        }

        .connection-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            var(--danger);
        }

        .connection-dot.online {
          background:
            var(--success);

          box-shadow:
            0 0 0 4px
            rgba(22,163,74,0.10);
        }

        /*
        ========================================================
        CHAT
        ========================================================
        */

        .antimate-chat {
          width:
            min(
              980px,
              calc(100% - 32px)
            );

          margin: 0 auto;

          flex: 1;

          min-height:
            calc(100vh - 68px);

          padding:
            28px 0 165px;
        }

        .message-list {
          display: flex;
          flex-direction: column;
          gap: 24px;

          min-height:
            calc(100vh - 250px);
        }

        .empty-state {
          min-height:
            calc(100vh - 280px);

          display: flex;
          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 40px 20px;
        }

        .empty-inner {
          max-width: 530px;
        }

        .empty-title {
          font-size:
            clamp(26px, 5vw, 38px);

          font-weight: 800;

          letter-spacing: -0.04em;

          margin:
            0 0 10px;
        }

        .empty-subtitle {
          margin: 0;

          color:
            var(--muted);

          line-height: 1.65;

          font-size: 14px;
        }

        /*
        ========================================================
        MESSAGE ROWS
        ========================================================
        */

        .message-row {
          display: flex;
          width: 100%;
        }

        .message-row.user {
          justify-content: flex-end;
          align-items: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;
          align-items: flex-start;
          gap: 10px;
        }

        .assistant-avatar {
          width: 32px;
          height: 32px;

          border-radius: 50%;

          display: grid;
          place-items: center;

          flex-shrink: 0;

          margin-top: 2px;
        }

        .assistant-avatar
        .antimate-logo-mark {
          width: 30px !important;
          height: 30px !important;
        }

        /*
        ========================================================
        MESSAGE BUBBLE
        ========================================================
        */

        .message-bubble {
          max-width:
            min(
              800px,
              88%
            );

          line-height: 1.7;

          font-size: 14px;

          white-space: pre-wrap;

          word-break: break-word;
        }

        .message-bubble.user {
          padding:
            12px 16px;

          border-radius:
            18px 18px 5px 18px;

          background:
            var(--primary);

          color:
            var(--bg);

          box-shadow:
            0 7px 20px
            rgba(15,23,42,0.08);
        }

        .message-bubble.assistant {
          padding:
            5px 0;

          color:
            var(--text);

          max-width:
            min(
              800px,
              88%
            );
        }

        /*
        ========================================================
        USER VOICE MESSAGE
        ========================================================
        */

        .voice-message-user {
          width:
            min(
              370px,
              82vw
            );

          padding:
            10px 12px;

          border-radius:
            18px 18px 5px 18px;

          background:
            var(--primary);

          color:
            var(--bg);

          box-shadow:
            0 8px 25px
            rgba(15,23,42,0.10);
        }

        .voice-message-user-header {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 7px;

          margin-bottom: 7px;

          font-size: 10px;

          opacity: 0.72;

          font-weight: 700;
        }

        .voice-message-user audio {
          width: 100%;
          height: 38px;

          display: block;
        }

        /*
        ========================================================
        AI VOICE / REPLAY
        ========================================================
        */

        .assistant-content {
          max-width:
            min(
              800px,
              88%
            );

          min-width: 0;
        }

        .assistant-audio-controls {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-top: 11px;
        }

        .replay-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          border:
            1px solid
            var(--border);

          background:
            var(--surface-soft);

          color:
            var(--text);

          border-radius:
            999px;

          padding:
            7px 11px;

          cursor: pointer;

          font-size: 11px;

          font-weight: 700;

          transition:
            transform 0.18s ease,
            background 0.18s ease;
        }

        .replay-button:hover {
          transform:
            translateY(-1px);
        }

        .replay-button:active {
          transform:
            scale(0.96);
        }

        /*
        ========================================================
        BACKEND REASONING
        ========================================================
        */

        .backend-reasoning {
          margin-top: 10px;

          width:
            min(
              780px,
              100%
            );

          border:
            1px solid
            var(--border);

          background:
            var(--surface-soft);

          border-radius: 12px;

          overflow: hidden;
        }

        .backend-reasoning-header {
          display: flex;
          align-items: center;
          gap: 7px;

          padding:
            8px 11px;

          color:
            var(--muted);

          font-size: 10px;

          font-weight: 800;

          letter-spacing:
            0.04em;

          text-transform:
            uppercase;
        }

        .backend-reasoning-body {
          padding:
            9px 11px 11px;

          border-top:
            1px solid
            var(--border);

          color:
            var(--muted);

          font-size: 11px;

          line-height: 1.55;

          white-space: pre-wrap;
        }

        /*
        ========================================================
        TRANSCRIPT
        ========================================================
        */

        .transcript-box {
          margin:
            0 0 0 42px;

          max-width:
            800px;

          padding:
            11px 14px;

          border-left:
            2px solid
            var(--accent);

          background:
            var(--surface-soft);

          border-radius:
            0 10px 10px 0;

          color:
            var(--muted);

          font-size: 13px;

          line-height: 1.55;
        }

        /*
        ========================================================
        PROCESSING / BACKEND REASONING SESSION
        ========================================================
        */

        .thinking-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          margin-left: 0;

          color:
            var(--muted);

          font-size: 12px;

          min-height: 30px;

          max-width:
            820px;
        }

        .thinking-content {
          flex: 1;
          min-width: 0;
        }

        .thinking-label {
          display: flex;
          align-items: center;
          gap: 6px;

          font-size: 10px;

          font-weight: 800;

          color:
            var(--accent);

          text-transform:
            uppercase;

          letter-spacing:
            0.05em;

          margin-bottom: 4px;
        }

        .thinking-message {
          color:
            var(--muted);

          line-height: 1.55;
        }

        .thinking-dots {
          display: inline-flex;
          gap: 4px;

          margin-left: 6px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;

          border-radius: 50%;

          background:
            var(--accent);

          animation:
            thinkingDot
            1.2s
            infinite
            ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay:
            0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay:
            0.3s;
        }

        @keyframes thinkingDot {
          0%,
          60%,
          100% {
            transform:
              translateY(0);

            opacity:
              0.35;
          }

          30% {
            transform:
              translateY(-4px);

            opacity:
              1;
          }
        }

        /*
        ========================================================
        CURRENT ANSWER
        ========================================================
        */

        .current-answer {
          display: flex;
          align-items: flex-start;

          gap: 10px;

          margin-top: 5px;
        }

        /*
        ========================================================
        STATUS
        ========================================================
        */

        .status-area {
          display: flex;
          flex-direction: column;
          align-items: center;

          gap: 8px;

          margin:
            18px 0;
        }

        .status-text {
          font-size: 12px;
          color: var(--muted);

          text-align: center;
        }

        .error-text {
          width:
            min(
              680px,
              100%
            );

          margin:
            12px auto;

          padding:
            10px 13px;

          border-radius: 10px;

          background:
            rgba(220,38,38,0.08);

          border:
            1px solid
            rgba(220,38,38,0.18);

          color:
            var(--danger);

          font-size: 12px;

          text-align: center;
        }

        /*
        ========================================================
        SPEAKING
        ========================================================
        */

        .speaking-indicator {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding:
            6px 10px;

          border-radius: 999px;

          background:
            var(--surface-soft);

          border:
            1px solid
            var(--border);

          font-size: 11px;

          color:
            var(--muted);
        }

        .speaking-wave {
          display: flex;
          align-items: center;

          gap: 2px;

          height: 14px;
        }

        .speaking-wave span {
          width: 2px;

          border-radius: 5px;

          background:
            var(--accent);

          animation:
            audioWave
            0.8s
            ease-in-out
            infinite;
        }

        .speaking-wave span:nth-child(1) {
          height: 5px;
        }

        .speaking-wave span:nth-child(2) {
          height: 11px;

          animation-delay:
            0.1s;
        }

        .speaking-wave span:nth-child(3) {
          height: 7px;

          animation-delay:
            0.2s;
        }

        .speaking-wave span:nth-child(4) {
          height: 13px;

          animation-delay:
            0.3s;
        }

        @keyframes audioWave {
          50% {
            transform:
              scaleY(0.35);
          }
        }

        /*
        ========================================================
        COMPOSER
        ========================================================
        */

        .antimate-composer-wrap {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding:
            12px
            max(
              16px,
              env(safe-area-inset-right)
            )
            max(
              16px,
              env(safe-area-inset-bottom)
            )
            max(
              16px,
              env(safe-area-inset-left)
            );

          background:
            linear-gradient(
              to top,
              var(--bg) 72%,
              transparent
            );
        }

        .antimate-composer {
          width:
            min(
              980px,
              calc(100% - 16px)
            );

          margin: 0 auto;

          background:
            var(--surface);

          border:
            1px solid
            var(--border);

          border-radius: 20px;

          box-shadow:
            0 16px 50px
            rgba(15,23,42,0.12);

          backdrop-filter:
            blur(18px);

          padding: 8px;
        }

        .theme-dark
        .antimate-composer {
          box-shadow:
            0 18px 55px
            rgba(0,0,0,0.30);
        }

        .composer-main {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .composer-textarea {
          flex: 1;
          min-width: 0;

          min-height: 43px;
          max-height: 140px;

          resize: none;

          border: 0;
          outline: none;

          background:
            transparent;

          color:
            var(--text);

          font: inherit;

          font-size: 14px;

          line-height: 1.5;

          padding:
            11px 10px;
        }

        .composer-textarea::placeholder {
          color:
            var(--muted);
        }

        .composer-action {
          width: 44px;
          height: 44px;

          border: 0;

          border-radius: 14px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          cursor: pointer;

          background:
            var(--primary);

          color:
            var(--bg);

          transition:
            transform 0.18s ease,
            opacity 0.18s ease,
            background 0.18s ease;

          touch-action: none;

          user-select: none;

          -webkit-user-select: none;
        }

        .composer-action:hover {
          transform:
            translateY(-1px);
        }

        .composer-action:active {
          transform:
            scale(0.94);
        }

        .composer-action:disabled {
          opacity: 0.45;

          cursor:
            not-allowed;

          transform:
            none;
        }

        .composer-action.recording {
          background:
            var(--danger);

          color:
            white;

          animation:
            recordingPulse
            1.6s
            infinite;
        }

        .composer-action.live {
          background:
            #7c3aed;

          color:
            white;

          animation:
            livePulse
            1.5s
            infinite;
        }

        @keyframes recordingPulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0
              rgba(220,38,38,0.25);
          }

          50% {
            box-shadow:
              0 0 0 9px
              rgba(220,38,38,0.06);
          }
        }

        @keyframes livePulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0
              rgba(124,58,237,0.30);
          }

          50% {
            box-shadow:
              0 0 0 10px
              rgba(124,58,237,0.05);
          }
        }

        /*
        ========================================================
        RECORDING INFO
        ========================================================
        */

        .recording-info {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          padding:
            5px 10px 3px;

          font-size: 11px;

          color:
            var(--muted);
        }

        .recording-info-left {
          display: flex;
          align-items: center;

          gap: 7px;
        }

        .recording-indicator {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            var(--danger);

          animation:
            indicatorPulse
            1s
            infinite;
        }

        .live-indicator {
          background:
            #7c3aed;
        }

        @keyframes indicatorPulse {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.35;
          }
        }

        .recording-time {
          font-variant-numeric:
            tabular-nums;

          font-weight: 800;

          color:
            var(--text);
        }

        .composer-hint {
          text-align: center;

          color:
            var(--muted);

          font-size: 10px;

          margin-top: 7px;

          line-height: 1.4;
        }

        /*
        ========================================================
        MOBILE
        ========================================================
        */

        @media (max-width: 640px) {
          .antimate-header {
            height: 62px;

            padding:
              0 14px;
          }

          .antimate-chat {
            width:
              calc(100% - 20px);

            padding-top:
              20px;

            padding-bottom:
              175px;
          }

          .antimate-brand-sub {
            display: none;
          }

          .antimate-connection {
            padding:
              6px 8px;
          }

          .message-bubble {
            max-width:
              90%;

            font-size:
              13.5px;
          }

          .assistant-content {
            max-width:
              90%;
          }

          .assistant-avatar {
            width: 28px;
            height: 28px;
          }

          .thinking-row,
          .transcript-box {
            margin-left:
              0;
          }

          .voice-message-user {
            width:
              min(
                330px,
                82vw
              );
          }

          .antimate-composer {
            width: 100%;

            border-radius:
              17px;
          }

          .composer-action {
            width: 43px;
            height: 43px;
          }

          .backend-reasoning {
            max-width:
              100%;
          }

          .theme-toggle {
            width: 34px;
            height: 34px;
          }
        }
      `}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="antimate-header">
        <div className="antimate-brand">
          <LogoMark size={35} />

          <div className="antimate-brand-text">
            <div className="antimate-brand-name">
              ANTIMATE
            </div>

            <div className="antimate-brand-sub">
              AI Assistant
            </div>
          </div>
        </div>

        <div className="header-controls">
          {/* ==================================================
              PRIMARY THEME SWITCH
          ================================================== */}

          <button
            type="button"
            className="theme-toggle"
            onClick={
              toggleTheme
            }
            title={
              theme === "dark"
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"
            }
            aria-label={
              theme === "dark"
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"
            }
          >
            {theme === "dark" ? (
              <SunIcon size={18} />
            ) : (
              <MoonIcon size={18} />
            )}
          </button>

          <div className="antimate-connection">
            <span
              className={`connection-dot ${
                socketConnected
                  ? "online"
                  : ""
              }`}
            />

            {connectionLabel}
          </div>
        </div>
      </header>

      {/* ======================================================
          CHAT
      ====================================================== */}

      <main className="antimate-chat">
        {messages.length === 0 &&
        !transcript &&
        !currentAnswer ? (
          <div className="empty-state">
            <div className="empty-inner">
              <h1 className="empty-title">
                Muraho 👋
              </h1>

              <p className="empty-subtitle">
                Ndi ANTIMATE. Mbwira icyo
                ushaka kumenya cyangwa
                ukoreshe microphone kugira
                ngo tuvugane.
              </p>
            </div>
          </div>
        ) : (
          <div className="message-list">
            {messages.map(
              (message) => {
                const isAssistant =
                  message.role ===
                  "assistant";

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
                    {/* =========================================
                        USER MESSAGE
                    ========================================= */}

                    {isUser ? (
                      message.audioUrl ? (
                        <div className="voice-message-user">
                          <div className="voice-message-user-header">
                            <VolumeIcon
                              size={14}
                            />

                            <span>
                              Ubutumwa bwamajwi
                            </span>
                          </div>

                          <audio
                            controls
                            preload="metadata"
                            src={
                              message.audioUrl
                            }
                          />
                        </div>
                      ) : (
                        <div className="message-bubble user">
                          {
                            message.content
                          }
                        </div>
                      )
                    ) : null}

                    {/* =========================================
                        ASSISTANT MESSAGE
                    ========================================= */}

                    {isAssistant && (
                      <>
                        <div className="assistant-avatar">
                          <LogoMark
                            size={30}
                          />
                        </div>

                        <div className="assistant-content">
                          <div className="message-bubble assistant">
                            {
                              message.content
                            }
                          </div>

                          {/* =================================
                              AI REASONING
                          ================================= */}

                          {message.reasoning && (
                            <div className="backend-reasoning">
                              <div className="backend-reasoning-header">
                                <BrainIcon />

                                <span>
                                  Backend reasoning
                                </span>
                              </div>

                              <div className="backend-reasoning-body">
                                {
                                  message.reasoning
                                }
                              </div>
                            </div>
                          )}

                          {/* =================================
                              AI REPLAY
                          ================================= */}

                          {message.audioUrl && (
                            <div className="assistant-audio-controls">
                              <button
                                type="button"
                                className="replay-button"
                                onClick={() =>
                                  replayAudio(
                                    message.audioUrl
                                  )
                                }
                                title="Subiramo ijwi rya ANTIMATE"
                              >
                                <ReplayIcon />

                                <span>
                                  Subiramo ijwi
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              }
            )}

            {/* =================================================
                USER TRANSCRIPT
            ================================================= */}

            {transcript && (
              <div className="transcript-box">
                <strong>
                  Wavuze:
                </strong>{" "}
                {transcript}
              </div>
            )}

            {/* =================================================
                BACKEND PROCESSING / REASONING
            ================================================= */}

            {isProcessing && (
              <div className="thinking-row">
                <div className="assistant-avatar">
                  <LogoMark
                    size={30}
                  />
                </div>

                <div className="thinking-content">
                  <div className="thinking-label">
                    <BrainIcon />

                    <span>
                      Backend reasoning
                    </span>

                    <span className="thinking-dots">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>

                  <div className="thinking-message">
                    {backendReasoning ||
                      statusMessage ||
                      "ANTIMATE iri gutunganya request…"}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                CURRENT STREAMING ANSWER
            ================================================= */}

            {currentAnswer &&
              !messages.some(
                (message) =>
                  message.role ===
                    "assistant" &&
                  message.content ===
                    currentAnswer
              ) && (
                <div className="current-answer">
                  <div className="assistant-avatar">
                    <LogoMark
                      size={30}
                    />
                  </div>

                  <div className="assistant-content">
                    <div className="message-bubble assistant">
                      {
                        currentAnswer
                      }
                    </div>

                    {backendReasoning && (
                      <div className="backend-reasoning">
                        <div className="backend-reasoning-header">
                          <BrainIcon />

                          <span>
                            Backend reasoning
                          </span>
                        </div>

                        <div className="backend-reasoning-body">
                          {
                            backendReasoning
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ====================================================
            SPEAKING
        ==================================================== */}

        {isPlaying && (
          <div className="status-area">
            <div className="speaking-indicator">
              <VolumeIcon />

              <span>
                ANTIMATE iri kuvuga…
              </span>

              <div className="speaking-wave">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            STATUS
        ==================================================== */}

        {statusMessage &&
          !isPlaying &&
          !isProcessing && (
            <div className="status-area">
              <div className="status-text">
                {statusMessage}
              </div>
            </div>
          )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {errorMessage && (
          <div className="error-text">
            {errorMessage}
          </div>
        )}
      </main>

      {/* ======================================================
          COMPOSER
      ====================================================== */}

      <div className="antimate-composer-wrap">
        <div className="antimate-composer">
          {/* ==================================================
              RECORDING INFO
          ================================================== */}

          {isRecording && (
            <div className="recording-info">
              <div className="recording-info-left">
                <span
                  className={`recording-indicator ${
                    liveVoice
                      ? "live-indicator"
                      : ""
                  }`}
                />

                <span>
                  {liveVoice
                    ? "LIVE VOICE"
                    : "Recording"}
                </span>
              </div>

              {liveVoice ? (
                <span className="recording-time">
                  Auto silence:
                  {" "}
                  1.8s
                </span>
              ) : (
                <span className="recording-time">
                  00:
                  {String(
                    recordingSeconds
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>
              )}
            </div>
          )}

          {/* ==================================================
              MAIN COMPOSER
          ================================================== */}

          <div className="composer-main">
            <textarea
              className="composer-textarea"
              value={text}
              onChange={(event) => {
                const value =
                  event.target.value;

                setText(value);

                const element =
                  event.target;

                element.style.height =
                  "auto";

                element.style.height =
                  `${Math.min(
                    element.scrollHeight,
                    140
                  )}px`;
              }}
              onKeyDown={
                handleTextareaKeyDown
              }
              placeholder={
                liveVoice
                  ? "Live Voice irakora…"
                  : "Andika ubutumwa cyangwa ukoreshe ijwi…"
              }
              disabled={
                liveVoice
              }
              rows={1}
            />

            {/* =================================================
                RIGHT ACTION BUTTON
            ================================================= */}

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
                    <WaveIcon
                      size={22}
                    />
                  ) : (
                    <StopIcon
                      size={18}
                    />
                  )
                ) : (
                  <MicIcon
                    size={22}
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
                onClick={
                  sendTextMessage
                }
              >
                <SendIcon
                  size={21}
                />
              </button>
            )}
          </div>

          {/* ==================================================
              HINT
          ================================================== */}

          <div className="composer-hint">
            {liveVoice
              ? "Live Voice: vuga → silence 1.8s → wohereza automatically → ANTIMATE aravuga → mic yongere ifunguke"
              : isRecording
              ? "Kanda microphone nanone uhagarike recording"
              : "Kanda voice • recording 30s • hold 5s kuri Live Voice"}
          </div>

          {/* ==================================================
              LIVE STOP CONTROL
          ================================================== */}

          {liveVoice && (
            <button
              type="button"
              onClick={
                stopLiveVoice
              }
              style={{
                marginTop: 8,
                width: "100%",
                border:
                  "1px solid rgba(124,58,237,0.18)",
                background:
                  "rgba(124,58,237,0.07)",
                color:
                  "var(--muted)",
                borderRadius: 10,
                padding:
                  "7px 10px",
                cursor:
                  "pointer",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Hagarika Live Voice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}