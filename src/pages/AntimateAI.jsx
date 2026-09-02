import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

/*
============================================================
ANTIMATE AI — MARKET LEVEL UI
============================================================

Features
- Premium responsive AI chat interface
- Light / Dark theme
- Socket.IO voice streaming
- 30 second normal voice recording
- Hold 5 seconds → Live Voice
- 1.8s silence → automatic send
- AI audio playback
- Automatic microphone reopen in Live Voice
- Text chat
- Streaming answer support
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
   ICONS
============================================================ */

function SendIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21.5 2.5 10.6 13.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="m21.5 2.5-6.8 19-4.1-8.1-8.1-4.1 19-6.8Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon({ size = 21 }) {
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
        strokeWidth="1.8"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon({ size = 18 }) {
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
        rx="2.5"
        fill="currentColor"
      />
    </svg>
  );
}

function WaveIcon({ size = 21 }) {
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

function PlusIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkleIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z"
        fill="currentColor"
      />
      <path
        d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"
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
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M17 9.5a4 4 0 0 1 0 5M19.5 7a8 8 0 0 1 0 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoMark({ size = 38 }) {
  return (
    <div
      className="antimate-logo"
      style={{
        width: size,
        height: size,
      }}
      aria-hidden="true"
    >
      <div className="logo-orbit orbit-one" />
      <div className="logo-orbit orbit-two" />
      <div className="logo-core" />
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
  const clean = type.toLowerCase();

  if (clean.includes("ogg")) return "ogg";
  if (clean.includes("mp4") || clean.includes("m4a")) return "m4a";
  if (clean.includes("wav")) return "wav";

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

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AntimateAI() {
  /* ==========================================================
     STATE
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

  const recordingTimerRef =
    useRef(null);

  const holdTimerRef =
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

  const stopRecordingRef =
    useRef(null);

  const startRecordingInternalRef =
    useRef(null);

  const messageIdRef =
    useRef(1);

  const liveResumeTimerRef =
    useRef(null);

  const lastAnswerRef =
    useRef("");

  /* ==========================================================
     CREATE MESSAGE ID
  ========================================================== */

  const createId = useCallback(() => {
    const id = messageIdRef.current;
    messageIdRef.current += 1;

    return `${Date.now()}-${id}`;
  }, []);

  /* ==========================================================
     ADD MESSAGE
  ========================================================== */

  const addMessage = useCallback(
    (role, content, extra = {}) => {
      if (!content) return;

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role,
          content,
          ...extra,
        },
      ]);
    },
    [createId]
  );

  /* ==========================================================
     WAKE LOCK
  ========================================================== */

  const requestWakeLock = useCallback(async () => {
    try {
      if (!("wakeLock" in navigator)) {
        return;
      }

      if (wakeLockRef.current) {
        return;
      }

      wakeLockRef.current =
        await navigator.wakeLock.request("screen");

      wakeLockRef.current.addEventListener(
        "release",
        () => {
          wakeLockRef.current = null;
        }
      );
    } catch {
      // Optional browser feature.
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
     STOP SILENCE DETECTION
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

  /* ==========================================================
     STOP MEDIA TRACKS
  ========================================================== */

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

  /* ==========================================================
     LIVE RESUME
  ========================================================== */

  const scheduleLiveResume =
    useCallback(
      (delay = 350) => {
        if (liveResumeTimerRef.current) {
          clearTimeout(
            liveResumeTimerRef.current
          );
        }

        liveResumeTimerRef.current =
          setTimeout(() => {
            liveResumeTimerRef.current =
              null;

            if (
              !mountedRef.current ||
              !liveVoiceRef.current ||
              !voiceSessionActiveRef.current ||
              isRecordingRef.current ||
              isPlayingRef.current
            ) {
              return;
            }

            startRecordingInternalRef.current?.(
              "live"
            );
          }, delay);
      },
      []
    );

  /* ==========================================================
     START SILENCE DETECTION
  ========================================================== */

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

          for (let i = 0; i < data.length; i++) {
            const normalized =
              (data[i] - 128) / 128;

            sum +=
              normalized * normalized;
          }

          const rms = Math.sqrt(
            sum / data.length
          );

          const voiceThreshold = 0.025;

          if (rms > voiceThreshold) {
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
     PLAY AUDIO
  ========================================================== */

  const playAudio = useCallback(
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

          scheduleLiveResume(350);
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

      audioRef.current = audio;

      isPlayingRef.current = true;

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

        isPlayingRef.current = false;
        setIsPlaying(false);

        setStatus(
          liveVoiceRef.current
            ? "listening"
            : "ready"
        );

        setStatusMessage("");

        if (audioUrl.startsWith("blob:")) {
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

          scheduleLiveResume(300);
        } else {
          releaseWakeLock();
        }
      };

      audio.onerror = () => {
        if (!mountedRef.current) {
          return;
        }

        isPlayingRef.current = false;
        setIsPlaying(false);

        audioRef.current = null;

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
          "Audio autoplay failed:",
          error
        );

        isPlayingRef.current = false;
        setIsPlaying(false);

        if (
          liveVoiceRef.current &&
          voiceSessionActiveRef.current
        ) {
          scheduleLiveResume(500);
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
        setThinkingText("");

        if (mode === "tap") {
          lastAnswerRef.current = "";
        }

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

          const sessionMimeType =
            supportedMime ||
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
                recordingExtensionRef.current,

              language: "rw",

              mode,
            }
          );

          /*
           * IMPORTANT:
           * Wait for all async ArrayBuffer conversions
           * before sending voice:end.
           */

          const chunkPromises = [];

          recorder.ondataavailable =
            (event) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              const socket =
                socketRef.current;

              if (!socket?.connected) {
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

              chunkPromises.push(
                promise
              );
            };

          recorder.onstop = async () => {
            try {
              await Promise.all(
                chunkPromises
              );
            } catch {
              // Continue.
            }

            if (
              mediaRecorderRef.current ===
              recorder
            ) {
              mediaRecorderRef.current =
                null;
            }

            stopMediaTracks();

            const socket =
              socketRef.current;

            if (socket?.connected) {
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

          recorder.onerror = (event) => {
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
     NORMAL RECORDING TIMER
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
     VOICE POINTER DOWN
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

        pressStartedAtRef.current =
          Date.now();

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
              !pointerActiveRef.current
            ) {
              return;
            }

            if (
              !isRecordingRef.current
            ) {
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
              "Live Voice: vuga → silence 1.8s → wohereza"
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

  /* ==========================================================
     VOICE POINTER UP
  ========================================================== */

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

      /*
       * Live Voice intentionally continues
       * after releasing the button.
       */
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

  const stopLiveVoice =
    useCallback(() => {
      liveVoiceRef.current = false;
      voiceSessionActiveRef.current =
        false;

      liveWaitingForResponseRef.current =
        false;

      setLiveVoice(false);

      if (liveResumeTimerRef.current) {
        clearTimeout(
          liveResumeTimerRef.current
        );

        liveResumeTimerRef.current = null;
      }

      if (isRecordingRef.current) {
        stopRecording({
          liveSegment: false,
        });
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // Ignore.
        }

        audioRef.current = null;
      }

      isPlayingRef.current = false;

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
      const value = text.trim();

      if (!value) return;
      if (isProcessing) return;
      if (isRecording) return;
      if (liveVoice) return;

      setErrorMessage("");
      setText("");
      setTranscript("");
      setCurrentAnswer("");
      setThinkingText("");

      addMessage("user", value);

      setIsProcessing(true);
      setStatus("processing");

      try {
        const response =
          await fetch(CHAT_URL, {
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
          });

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

        if (audioPayload) {
          playAudio(audioPayload);
        }

        setIsProcessing(false);

        setStatus(
          audioPayload
            ? "speaking"
            : "ready"
        );

        setStatusMessage("");
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
    }, [
      addMessage,
      isProcessing,
      isRecording,
      liveVoice,
      playAudio,
      text,
    ]);

  /* ==========================================================
     TEXTAREA
  ========================================================== */

  const handleTextareaChange =
    useCallback((event) => {
      const value =
        event.target.value;

      setText(value);

      const element =
        event.target;

      element.style.height = "auto";

      element.style.height =
        `${Math.min(
          element.scrollHeight,
          150
        )}px`;
    }, []);

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
    mountedRef.current = true;

    console.log(
      "🔌 Connecting ANTIMATE Socket.IO:",
      SOCKET_URL
    );

    const socket = io(
      SOCKET_URL,
      {
        transports: [
          "websocket",
          "polling",
        ],

        withCredentials: true,

        reconnection: true,

        reconnectionAttempts:
          Infinity,

        reconnectionDelay: 1000,

        reconnectionDelayMax:
          5000,

        timeout: 20000,
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
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
    });

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

        setStatus("offline");

        setStatusMessage(
          "Ntabwo nshoboye guhuza na ANTIMATE server."
        );
      }
    );

    socket.io.on(
      "reconnect",
      (attempt) => {
        console.log(
          "🔄 ANTIMATE Socket reconnected:",
          attempt
        );
      }
    );

    /* --------------------------------------------------------
       STATUS
    -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       TRANSCRIPT
    -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       THINKING
    -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       ANSWER CHUNK
    -------------------------------------------------------- */

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
            (prev) => prev + chunk
          );
        }
      }
    );

    /* --------------------------------------------------------
       FINAL ANSWER
    -------------------------------------------------------- */

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
          setCurrentAnswer(answer);

          /*
           * Avoid duplicate assistant messages.
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

        setStatus("speaking");
        setStatusMessage("");
      }
    );

    /* --------------------------------------------------------
       AUDIO
    -------------------------------------------------------- */

    socket.on(
      "antimate:audio",
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        playAudio(payload);
      }
    );

    /* --------------------------------------------------------
       COMPLETE
    -------------------------------------------------------- */

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

        setStatus(
          liveVoiceRef.current
            ? "speaking"
            : "ready"
        );

        setStatusMessage("");

        /*
         * If Live Voice has no audio,
         * reopen microphone automatically.
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
      }
    );

    /* --------------------------------------------------------
       ERROR
    -------------------------------------------------------- */

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

          scheduleLiveResume(700);
        }
      }
    );

    /* --------------------------------------------------------
       CLEANUP
    -------------------------------------------------------- */

    return () => {
      mountedRef.current = false;

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
        socketRef.current = null;
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
          (prev) =>
            (prev + 1) %
            THINKING_MESSAGES.length
        );
      }, 2200);

    return () =>
      clearInterval(interval);
  }, [isProcessing]);

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
      }

      if (recordingTimerRef.current) {
        clearInterval(
          recordingTimerRef.current
        );
      }

      if (liveResumeTimerRef.current) {
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
          // Ignore.
        }
      }

      stopSilenceDetection();
      stopMediaTracks();

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // Ignore.
        }

        audioRef.current = null;
      }

      isPlayingRef.current = false;
      isRecordingRef.current = false;
      liveVoiceRef.current = false;
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

  const connectionLabel =
    socketConnected
      ? "Online"
      : "Connecting";

  const displayedThinking =
    thinkingText ||
    THINKING_MESSAGES[
      thinkingIndex
    ];

  const actionTitle =
    hasText
      ? "Ohereza ubutumwa"
      : isRecording
      ? liveVoice
        ? "Live Voice irakora"
        : "Kanda uhagarike recording"
      : "Kanda ufate amajwi • Hold 5s kuri Live Voice";

  const showWelcome =
    messages.length === 0 &&
    !transcript &&
    !currentAnswer;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="antimate-shell">
      <style>{`
        /* ====================================================
           GLOBAL
        ==================================================== */

        * {
          box-sizing: border-box;
        }

        :root {
          color-scheme: light dark;
        }

        body {
          margin: 0;
        }

        button,
        textarea {
          font: inherit;
        }

        .antimate-shell {
          --bg: #f7f8fb;
          --bg-secondary: #ffffff;
          --surface: rgba(255,255,255,0.78);
          --surface-solid: #ffffff;
          --surface-hover: #f3f5f9;
          --border: rgba(15,23,42,0.08);
          --border-strong: rgba(15,23,42,0.13);
          --text: #101828;
          --text-soft: #344054;
          --muted: #667085;
          --muted-2: #98a2b3;
          --primary: #111827;
          --primary-hover: #1d2939;
          --accent: #635bff;
          --accent-2: #8b5cf6;
          --accent-soft: rgba(99,91,255,0.09);
          --success: #12b76a;
          --danger: #f04438;
          --shadow:
            0 20px 70px rgba(16,24,40,0.08);

          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;

          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(99,91,255,0.09),
              transparent 32%
            ),
            linear-gradient(
              180deg,
              #fafbfc 0%,
              var(--bg) 100%
            );

          color: var(--text);

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          letter-spacing: -0.01em;
        }

        @media (prefers-color-scheme: dark) {
          .antimate-shell {
            --bg: #080b12;
            --bg-secondary: #0d111a;
            --surface: rgba(15,19,29,0.82);
            --surface-solid: #101621;
            --surface-hover: #151b27;
            --border: rgba(255,255,255,0.075);
            --border-strong: rgba(255,255,255,0.12);
            --text: #f5f7fa;
            --text-soft: #d0d5dd;
            --muted: #98a2b3;
            --muted-2: #667085;
            --primary: #f5f7fa;
            --primary-hover: #ffffff;
            --accent: #8179ff;
            --accent-2: #a78bfa;
            --accent-soft: rgba(129,121,255,0.11);
            --success: #32d583;
            --danger: #f97066;
            --shadow:
              0 25px 80px rgba(0,0,0,0.35);

            background:
              radial-gradient(
                circle at 50% -10%,
                rgba(99,91,255,0.15),
                transparent 34%
              ),
              linear-gradient(
                180deg,
                #0a0d14 0%,
                #080b12 100%
              );
          }
        }

        /* ====================================================
           HEADER
        ==================================================== */

        .antimate-topbar {
          position: sticky;
          top: 0;
          z-index: 50;

          height: 72px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 28px;

          border-bottom:
            1px solid var(--border);

          background:
            color-mix(
              in srgb,
              var(--surface-solid) 82%,
              transparent
            );

          backdrop-filter:
            blur(22px);

          -webkit-backdrop-filter:
            blur(22px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .brand-logo {
          position: relative;

          width: 38px;
          height: 38px;

          display: grid;
          place-items: center;

          border-radius: 12px;

          background:
            linear-gradient(
              145deg,
              #151b2b,
              #2a3150
            );

          box-shadow:
            0 8px 25px
            rgba(30,41,59,0.18);

          overflow: hidden;
        }

        @media (prefers-color-scheme: dark) {
          .brand-logo {
            background:
              linear-gradient(
                145deg,
                #171d2c,
                #0f1420
              );
          }
        }

        .brand-logo .antimate-logo {
          transform: scale(0.72);
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .brand-name {
          font-size: 15px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .brand-subtitle {
          margin-top: 5px;

          font-size: 10px;
          font-weight: 600;

          color: var(--muted);

          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .model-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          height: 32px;
          padding: 0 11px;

          border:
            1px solid var(--border);

          border-radius: 999px;

          background:
            var(--surface);

          color:
            var(--text-soft);

          font-size: 11px;
          font-weight: 700;
        }

        .model-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;

          background:
            var(--accent);

          box-shadow:
            0 0 0 4px
            var(--accent-soft);
        }

        .connection-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          height: 32px;
          padding: 0 11px;

          border:
            1px solid var(--border);

          border-radius: 999px;

          background:
            var(--surface);

          color:
            var(--muted);

          font-size: 11px;
          font-weight: 700;
        }

        .connection-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            var(--muted-2);
        }

        .connection-dot.online {
          background:
            var(--success);

          box-shadow:
            0 0 0 4px
            rgba(18,183,106,0.10);
        }

        /* ====================================================
           LOGO
        ==================================================== */

        .antimate-logo {
          position: relative;
          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 50%;

          background:
            conic-gradient(
              from 0deg,
              #625bff,
              #a855f7,
              #06b6d4,
              #625bff
            );

          box-shadow:
            0 8px 25px
            rgba(99,91,255,0.20);

          animation:
            logoRotate
            9s
            linear
            infinite;
        }

        .logo-orbit {
          position: absolute;

          width: 65%;
          height: 65%;

          border-radius: 50%;

          border:
            1.5px solid
            rgba(255,255,255,0.92);
        }

        .orbit-one {
          transform:
            rotate(45deg)
            scaleX(0.65);
        }

        .orbit-two {
          transform:
            rotate(-45deg)
            scaleX(0.65);
        }

        .logo-core {
          position: absolute;

          width: 18%;
          height: 18%;

          border-radius: 50%;

          background: white;

          box-shadow:
            0 0 12px
            rgba(255,255,255,0.9);
        }

        @keyframes logoRotate {
          to {
            transform: rotate(360deg);
          }
        }

        /* ====================================================
           MAIN
        ==================================================== */

        .antimate-main {
          flex: 1;

          width: min(
            920px,
            calc(100% - 36px)
          );

          margin: 0 auto;

          padding:
            30px 0
            180px;
        }

        .message-stack {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        /* ====================================================
           WELCOME
        ==================================================== */

        .welcome {
          min-height:
            calc(100vh - 290px);

          display: flex;
          align-items: center;
          justify-content: center;

          padding:
            40px 10px;
        }

        .welcome-content {
          width: min(
            680px,
            100%
          );

          text-align: center;
        }

        .welcome-logo {
          width: 68px;
          height: 68px;

          margin: 0 auto 24px;

          display: grid;
          place-items: center;

          border-radius: 21px;

          background:
            linear-gradient(
              145deg,
              rgba(99,91,255,0.10),
              rgba(139,92,246,0.04)
            );

          border:
            1px solid
            rgba(99,91,255,0.12);

          box-shadow:
            0 18px 50px
            rgba(99,91,255,0.08);
        }

        .welcome-logo .antimate-logo {
          box-shadow:
            0 10px 30px
            rgba(99,91,255,0.25);
        }

        .welcome-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          margin-bottom: 14px;

          padding:
            6px 10px;

          border-radius: 999px;

          background:
            var(--accent-soft);

          color:
            var(--accent);

          font-size: 10px;
          font-weight: 800;

          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .welcome-title {
          margin: 0;

          font-size:
            clamp(
              34px,
              6vw,
              54px
            );

          line-height: 1.02;

          font-weight: 850;

          letter-spacing:
            -0.055em;

          background:
            linear-gradient(
              110deg,
              var(--text),
              var(--text-soft)
            );

          -webkit-background-clip:
            text;

          background-clip:
            text;

          -webkit-text-fill-color:
            transparent;
        }

        .welcome-description {
          max-width: 570px;

          margin:
            17px auto 0;

          color:
            var(--muted);

          font-size: 14px;

          line-height: 1.7;
        }

        .welcome-suggestions {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 10px;

          margin-top: 30px;
        }

        .suggestion-card {
          border:
            1px solid
            var(--border);

          background:
            var(--surface);

          color:
            var(--text-soft);

          border-radius: 16px;

          padding:
            14px;

          text-align: left;

          cursor: pointer;

          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .suggestion-card:hover {
          transform:
            translateY(-2px);

          border-color:
            rgba(99,91,255,0.22);

          background:
            var(--surface-hover);

          box-shadow:
            0 12px 30px
            rgba(15,23,42,0.06);
        }

        .suggestion-icon {
          width: 30px;
          height: 30px;

          display: grid;
          place-items: center;

          border-radius: 9px;

          background:
            var(--accent-soft);

          color:
            var(--accent);

          margin-bottom: 10px;
        }

        .suggestion-title {
          display: block;

          font-size: 12px;
          font-weight: 800;
        }

        .suggestion-text {
          display: block;

          margin-top: 4px;

          color:
            var(--muted);

          font-size: 10px;

          line-height: 1.45;
        }

        /* ====================================================
           MESSAGES
        ==================================================== */

        .message-row {
          display: flex;
          width: 100%;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;

          align-items: flex-start;

          gap: 12px;
        }

        .assistant-avatar {
          width: 34px;
          height: 34px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 11px;

          background:
            var(--surface-solid);

          border:
            1px solid var(--border);

          box-shadow:
            0 5px 18px
            rgba(15,23,42,0.06);
        }

        .assistant-avatar .antimate-logo {
          width: 25px !important;
          height: 25px !important;
        }

        .message-content {
          max-width:
            min(
              760px,
              88%
            );
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 7px;

          margin-bottom: 7px;

          font-size: 10px;
          font-weight: 700;

          color:
            var(--muted-2);
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
            18px
            18px
            5px
            18px;

          background:
            var(--primary);

          color:
            var(--bg);

          box-shadow:
            0 8px 24px
            rgba(15,23,42,0.08);
        }

        .message-bubble.assistant {
          color:
            var(--text);
        }

        /* ====================================================
           TRANSCRIPT
        ==================================================== */

        .transcript-card {
          margin-left: 46px;

          width: min(
            700px,
            calc(100% - 46px)
          );

          padding:
            13px 15px;

          border:
            1px solid
            rgba(99,91,255,0.12);

          border-left:
            3px solid
            var(--accent);

          border-radius:
            0 13px 13px 0;

          background:
            var(--accent-soft);

          color:
            var(--text-soft);

          font-size: 12px;

          line-height: 1.6;
        }

        .transcript-label {
          display: block;

          margin-bottom: 3px;

          color:
            var(--accent);

          font-size: 10px;
          font-weight: 800;

          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ====================================================
           THINKING
        ==================================================== */

        .thinking {
          display: flex;
          align-items: center;
          gap: 11px;

          margin-left: 0;

          color:
            var(--muted);

          font-size: 12px;
        }

        .thinking-avatar {
          width: 34px;
          height: 34px;

          display: grid;
          place-items: center;

          border-radius: 11px;

          background:
            var(--surface-solid);

          border:
            1px solid var(--border);
        }

        .thinking-avatar .antimate-logo {
          width: 24px !important;
          height: 24px !important;
        }

        .thinking-copy {
          display: flex;
          align-items: center;
          gap: 8px;
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
            0.30s;
        }

        @keyframes thinkingDot {
          0%,
          60%,
          100% {
            transform:
              translateY(0);
            opacity: 0.35;
          }

          30% {
            transform:
              translateY(-4px);
            opacity: 1;
          }
        }

        /* ====================================================
           SPEAKING
        ==================================================== */

        .speaking-row {
          display: flex;
          align-items: center;
          gap: 9px;

          margin-left: 46px;

          width: fit-content;

          padding:
            7px 11px;

          border:
            1px solid
            var(--border);

          border-radius:
            999px;

          background:
            var(--surface);

          color:
            var(--muted);

          font-size: 10px;
          font-weight: 700;
        }

        .speaking-wave {
          height: 15px;

          display: flex;
          align-items: center;

          gap: 2px;
        }

        .speaking-wave span {
          width: 2px;

          border-radius: 999px;

          background:
            var(--accent);

          animation:
            audioWave
            0.75s
            ease-in-out
            infinite;
        }

        .speaking-wave span:nth-child(1) {
          height: 5px;
        }

        .speaking-wave span:nth-child(2) {
          height: 10px;
          animation-delay:
            0.1s;
        }

        .speaking-wave span:nth-child(3) {
          height: 14px;
          animation-delay:
            0.2s;
        }

        .speaking-wave span:nth-child(4) {
          height: 8px;
          animation-delay:
            0.3s;
        }

        @keyframes audioWave {
          50% {
            transform:
              scaleY(0.35);
          }
        }

        /* ====================================================
           ERROR
        ==================================================== */

        .error-card {
          margin:
            10px auto;

          width: min(
            650px,
            100%
          );

          padding:
            11px 14px;

          border:
            1px solid
            rgba(240,68,56,0.16);

          border-radius: 12px;

          background:
            rgba(240,68,56,0.06);

          color:
            var(--danger);

          font-size: 11px;

          text-align: center;
        }

        /* ====================================================
           COMPOSER AREA
        ==================================================== */

        .composer-layer {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 40;

          pointer-events: none;

          padding:
            20px
            max(
              18px,
              env(safe-area-inset-right)
            )
            max(
              18px,
              env(safe-area-inset-bottom)
            )
            max(
              18px,
              env(safe-area-inset-left)
            );

          background:
            linear-gradient(
              to top,
              var(--bg) 38%,
              transparent 100%
            );
        }

        .composer-container {
          width: min(
            820px,
            calc(100% - 12px)
          );

          margin: 0 auto;

          pointer-events: auto;
        }

        .recording-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 8px;

          padding:
            8px 13px;

          border:
            1px solid var(--border);

          border-radius: 12px;

          background:
            var(--surface);

          backdrop-filter:
            blur(18px);

          box-shadow:
            0 8px 25px
            rgba(15,23,42,0.06);
        }

        .recording-left {
          display: flex;
          align-items: center;
          gap: 8px;

          color:
            var(--muted);

          font-size: 10px;
          font-weight: 800;

          letter-spacing:
            0.06em;
        }

        .recording-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            var(--danger);

          box-shadow:
            0 0 0 4px
            rgba(240,68,56,0.09);

          animation:
            pulseDot
            1.1s
            infinite;
        }

        .recording-dot.live {
          background:
            var(--accent);

          box-shadow:
            0 0 0 4px
            var(--accent-soft);
        }

        @keyframes pulseDot {
          50% {
            opacity: 0.35;
            transform: scale(0.75);
          }
        }

        .recording-time {
          font-size: 11px;
          font-weight: 800;

          font-variant-numeric:
            tabular-nums;

          color:
            var(--text);
        }

        .composer {
          position: relative;

          display: flex;
          align-items: flex-end;

          min-height: 62px;

          padding:
            8px 8px 8px 12px;

          border:
            1px solid
            var(--border-strong);

          border-radius: 20px;

          background:
            var(--surface);

          backdrop-filter:
            blur(25px);

          -webkit-backdrop-filter:
            blur(25px);

          box-shadow:
            var(--shadow);

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .composer:focus-within {
          border-color:
            rgba(99,91,255,0.28);

          box-shadow:
            0 22px 70px
            rgba(15,23,42,0.12),
            0 0 0 4px
            rgba(99,91,255,0.045);
        }

        .composer-side-icon {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          margin-bottom: 3px;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 11px;

          background:
            transparent;

          color:
            var(--muted);

          cursor: pointer;

          transition:
            background 0.18s ease,
            color 0.18s ease;
        }

        .composer-side-icon:hover {
          background:
            var(--surface-hover);

          color:
            var(--text);
        }

        .composer-textarea {
          flex: 1;

          min-width: 0;

          min-height: 44px;
          max-height: 150px;

          padding:
            11px 7px;

          resize: none;

          border: 0;
          outline: 0;

          background:
            transparent;

          color:
            var(--text);

          font-size: 14px;

          line-height: 1.55;
        }

        .composer-textarea::placeholder {
          color:
            var(--muted-2);
        }

        .composer-textarea:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ====================================================
           ACTION BUTTON
        ==================================================== */

        .composer-action {
          position: relative;

          width: 46px;
          height: 46px;

          flex-shrink: 0;

          margin-bottom: 0;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 14px;

          background:
            var(--primary);

          color:
            var(--bg);

          cursor: pointer;

          user-select: none;
          -webkit-user-select: none;

          touch-action: none;

          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            background 0.16s ease;
        }

        .composer-action:hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 8px 22px
            rgba(15,23,42,0.15);
        }

        .composer-action:active {
          transform:
            scale(0.94);
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

          color: white;

          animation:
            recordingPulse
            1.6s
            infinite;
        }

        .composer-action.live {
          background:
            linear-gradient(
              135deg,
              var(--accent),
              var(--accent-2)
            );

          color: white;

          animation:
            livePulse
            1.6s
            infinite;
        }

        @keyframes recordingPulse {
          50% {
            box-shadow:
              0 0 0 8px
              rgba(240,68,56,0.07);
          }
        }

        @keyframes livePulse {
          50% {
            box-shadow:
              0 0 0 9px
              rgba(99,91,255,0.07);
          }
        }

        /* ====================================================
           HINT
        ==================================================== */

        .composer-hint {
          margin-top: 8px;

          text-align: center;

          color:
            var(--muted-2);

          font-size: 9px;

          line-height: 1.45;
        }

        .live-stop {
          width: 100%;

          margin-top: 8px;

          padding:
            8px 12px;

          border:
            1px solid
            rgba(99,91,255,0.13);

          border-radius: 10px;

          background:
            var(--accent-soft);

          color:
            var(--muted);

          font-size: 10px;
          font-weight: 800;

          cursor: pointer;

          transition:
            background 0.18s ease,
            color 0.18s ease;
        }

        .live-stop:hover {
          background:
            rgba(99,91,255,0.13);

          color:
            var(--text);
        }

        /* ====================================================
           MOBILE
        ==================================================== */

        @media (max-width: 700px) {
          .antimate-topbar {
            height: 64px;
            padding:
              0 15px;
          }

          .brand-subtitle {
            display: none;
          }

          .brand-name {
            font-size: 14px;
          }

          .model-pill {
            display: none;
          }

          .connection-pill {
            height: 30px;
            padding:
              0 9px;
          }

          .antimate-main {
            width:
              calc(100% - 20px);

            padding:
              22px 0 185px;
          }

          .welcome {
            min-height:
              calc(100vh - 275px);

            padding:
              30px 0;
          }

          .welcome-logo {
            width: 58px;
            height: 58px;
            border-radius: 17px;
          }

          .welcome-title {
            font-size:
              clamp(
                32px,
                10vw,
                44px
              );
          }

          .welcome-description {
            font-size: 13px;
          }

          .welcome-suggestions {
            grid-template-columns:
              1fr;
          }

          .suggestion-card {
            padding: 12px;
          }

          .message-content {
            max-width:
              90%;
          }

          .message-bubble {
            font-size: 13.5px;
          }

          .assistant-avatar,
          .thinking-avatar {
            width: 31px;
            height: 31px;
            border-radius: 10px;
          }

          .transcript-card,
          .speaking-row {
            margin-left: 43px;
          }

          .composer-layer {
            padding:
              14px
              10px
              max(
                10px,
                env(safe-area-inset-bottom)
              );
          }

          .composer-container {
            width: 100%;
          }

          .composer {
            min-height: 58px;
            border-radius: 18px;
          }

          .composer-side-icon {
            display: none;
          }

          .composer-action {
            width: 43px;
            height: 43px;
            border-radius: 13px;
          }

          .composer-textarea {
            font-size: 13.5px;
            min-height: 42px;
          }

          .composer-hint {
            font-size: 8.5px;
          }
        }

        @media (max-width: 430px) {
          .brand-logo {
            width: 35px;
            height: 35px;
          }

          .antimate-topbar {
            padding: 0 12px;
          }

          .connection-pill {
            font-size: 10px;
          }

          .antimate-main {
            width:
              calc(100% - 16px);
          }

          .message-row.assistant {
            gap: 8px;
          }

          .message-content {
            max-width:
              calc(100% - 42px);
          }

          .message-bubble {
            font-size: 13px;
          }
        }

        /* ====================================================
           ACCESSIBILITY
        ==================================================== */

        .composer-action:focus-visible,
        .composer-side-icon:focus-visible,
        .suggestion-card:focus-visible,
        .live-stop:focus-visible {
          outline:
            3px solid
            rgba(99,91,255,0.22);

          outline-offset: 2px;
        }

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
        <div className="brand">
          <div className="brand-logo">
            <LogoMark size={38} />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              ANTIMATE
            </div>

            <div className="brand-subtitle">
              Intelligent Agriculture AI
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="model-pill">
            <span className="model-pill-dot" />
            ANTIMATE AI
            <ChevronDownIcon size={13} />
          </div>

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
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="antimate-main">
        {showWelcome ? (
          <section className="welcome">
            <div className="welcome-content">
              <div className="welcome-logo">
                <LogoMark size={46} />
              </div>

              <div className="welcome-eyebrow">
                <SparkleIcon size={13} />
                AI FOR SMART FARMING
              </div>

              <h1 className="welcome-title">
                Muraho, ndi ANTIMATE.
              </h1>

              <p className="welcome-description">
                Umufasha wawe w'ubwenge mu
                bworozi. Mbwira ikibazo cyawe,
                andika ubutumwa cyangwa ukoreshe
                ijwi — ANTIMATE azagufasha
                gufata icyemezo cyiza.
              </p>

              <div className="welcome-suggestions">
                <button
                  type="button"
                  className="suggestion-card"
                  onClick={() =>
                    setText(
                      "Ni ibihe bintu nakurikiranira hafi mu cyumba cy'inkoko?"
                    )
                  }
                >
                  <span className="suggestion-icon">
                    <SparkleIcon size={16} />
                  </span>

                  <span className="suggestion-title">
                    Smart Brooding
                  </span>

                  <span className="suggestion-text">
                    Mfasha gukurikirana imiterere
                    myiza y'icyumba.
                  </span>
                </button>

                <button
                  type="button"
                  className="suggestion-card"
                  onClick={() =>
                    setText(
                      "Ni gute nakwirinda ibibazo by'ubushyuhe ku nkoko?"
                    )
                  }
                >
                  <span className="suggestion-icon">
                    <WaveIcon size={16} />
                  </span>

                  <span className="suggestion-title">
                    Climate & Health
                  </span>

                  <span className="suggestion-text">
                    Sobanura uko ubushyuhe
                    n'ubushuhe bigira ingaruka.
                  </span>
                </button>

                <button
                  type="button"
                  className="suggestion-card"
                  onClick={() =>
                    setText(
                      "Mfasha kumenya niba brooding system yanjye ikora neza."
                    )
                  }
                >
                  <span className="suggestion-icon">
                    <CheckIcon size={16} />
                  </span>

                  <span className="suggestion-title">
                    System Analysis
                  </span>

                  <span className="suggestion-text">
                    Sesengura imikorere ya Smart
                    Brooder.
                  </span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="message-stack">
            {messages.map(
              (message) => (
                <div
                  key={message.id}
                  className={`message-row ${
                    message.role
                  }`}
                >
                  {message.role ===
                    "assistant" && (
                    <div className="assistant-avatar">
                      <LogoMark size={25} />
                    </div>
                  )}

                  <div className="message-content">
                    {message.role ===
                      "assistant" && (
                      <div className="message-meta">
                        ANTIMATE
                        <span>•</span>
                        AI Assistant
                      </div>
                    )}

                    <div
                      className={`message-bubble ${
                        message.role
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* TRANSCRIPT */}

            {transcript && (
              <div className="transcript-card">
                <span className="transcript-label">
                  Wavuze
                </span>

                {transcript}
              </div>
            )}

            {/* THINKING */}

            {isProcessing && (
              <div className="thinking">
                <div className="thinking-avatar">
                  <LogoMark size={24} />
                </div>

                <div className="thinking-copy">
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

            {/* CURRENT STREAMING ANSWER */}

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
                    <LogoMark size={25} />
                  </div>

                  <div className="message-content">
                    <div className="message-meta">
                      ANTIMATE
                      <span>•</span>
                      AI Assistant
                    </div>

                    <div className="message-bubble assistant">
                      {currentAnswer}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ====================================================
            SPEAKING
        ==================================================== */}

        {isPlaying && (
          <div className="speaking-row">
            <VolumeIcon size={16} />

            <span>
              ANTIMATE iri kuvuga
            </span>

            <div className="speaking-wave">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {/* ====================================================
            STATUS
        ==================================================== */}

        {statusMessage &&
          !isPlaying &&
          !isProcessing && (
            <div
              style={{
                margin:
                  "14px auto 0",
                textAlign:
                  "center",
                color:
                  "var(--muted)",
                fontSize:
                  "10px",
              }}
            >
              {statusMessage}
            </div>
          )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {errorMessage && (
          <div className="error-card">
            {errorMessage}
          </div>
        )}
      </main>

      {/* ======================================================
          COMPOSER
      ====================================================== */}

      <div className="composer-layer">
        <div className="composer-container">
          {/* RECORDING BAR */}

          {isRecording && (
            <div className="recording-bar">
              <div className="recording-left">
                <span
                  className={`recording-dot ${
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
                  ? "AUTO • 1.8s SILENCE"
                  : `00:${String(
                      recordingSeconds
                    ).padStart(
                      2,
                      "0"
                    )}`}
              </span>
            </div>
          )}

          <div className="composer">
            {/* OPTIONAL LEFT ACTION */}

            <button
              type="button"
              className="composer-side-icon"
              aria-label="Add"
              title="Add"
              disabled={
                isRecording ||
                liveVoice ||
                isProcessing
              }
            >
              <PlusIcon size={19} />
            </button>

            {/* TEXT */}

            <textarea
              ref={textareaRef}
              className="composer-textarea"
              value={text}
              onChange={
                handleTextareaChange
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

            {/* RIGHT ACTION */}

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
                title={actionTitle}
                aria-label={actionTitle}
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
                    <WaveIcon size={21} />
                  ) : (
                    <StopIcon size={18} />
                  )
                ) : (
                  <MicIcon size={21} />
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
                <SendIcon size={20} />
              </button>
            )}
          </div>

          {/* HINT */}

          <div className="composer-hint">
            {liveVoice
              ? "Vuga → silence 1.8s → automatically send → ANTIMATE aravuga → microphone irongera gufunguka"
              : isRecording
              ? "Kanda microphone nanone uhagarike recording"
              : "Kanda microphone • 30s recording • Hold 5s kuri Live Voice"}
          </div>

          {/* LIVE STOP */}

          {liveVoice && (
            <button
              type="button"
              className="live-stop"
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
  );
}