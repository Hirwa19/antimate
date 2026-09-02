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

FEATURES
- Text chat
- Voice chat
- User voice bubbles on RIGHT
- AI responses on LEFT
- AI voice replay
- Backend reasoning/status
- Dark / Light primary theme
- Theme persistence
- 30s normal recording
- Hold 5s -> Live Voice
- 1.8s silence auto-send
- Auto reopen microphone after AI audio
- Socket.IO streaming
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

function PlayIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 5.5v13l10-6.5-10-6.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PauseIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="7"
        y="5"
        width="3.5"
        height="14"
        rx="1"
        fill="currentColor"
      />

      <rect
        x="13.5"
        y="5"
        width="3.5"
        height="14"
        rx="1"
        fill="currentColor"
      />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function SunIcon({ size = 19 }) {
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
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
      aria-hidden="true"
    >
      <path
        d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
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

  if (
    typeof MediaRecorder === "undefined"
  ) {
    return "";
  }

  for (const type of candidates) {
    try {
      if (
        MediaRecorder.isTypeSupported(type)
      ) {
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
    const blob = new Blob(
      [payload],
      {
        type: "audio/wav",
      }
    );

    return URL.createObjectURL(blob);
  }

  if (payload instanceof Blob) {
    return URL.createObjectURL(payload);
  }

  if (
    typeof payload === "object"
  ) {
    const value =
      payload.url ||
      payload.audioUrl ||
      payload.audio_url ||
      payload.path ||
      payload.file ||
      payload.data;

    if (value instanceof ArrayBuffer) {
      return URL.createObjectURL(
        new Blob(
          [value],
          {
            type: "audio/wav",
          }
        )
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

function formatAudioTime(seconds = 0) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const total = Math.max(
    0,
    Math.floor(seconds)
  );

  const minutes = Math.floor(
    total / 60
  );

  const secs = total % 60;

  return `${minutes}:${String(
    secs
  ).padStart(2, "0")}`;
}

/* ============================================================
   AUDIO MESSAGE
============================================================ */

function VoiceMessageBubble({
  audioUrl,
  duration,
  side = "user",
  onReplay,
}) {
  const audioElementRef =
    useRef(null);

  const [playing, setPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const handlePlay = useCallback(() => {
    if (!audioUrl) {
      return;
    }

    if (!audioElementRef.current) {
      const audio =
        new Audio(audioUrl);

      audio.preload = "metadata";

      audio.onloadedmetadata = () => {
        setCurrentTime(0);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(
          audio.currentTime || 0
        );
      };

      audio.onended = () => {
        setPlaying(false);
        setCurrentTime(0);
      };

      audio.onerror = () => {
        setPlaying(false);
      };

      audioElementRef.current =
        audio;
    }

    const audio =
      audioElementRef.current;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    audio
      .play()
      .then(() => {
        setPlaying(true);
      })
      .catch(() => {
        setPlaying(false);
      });
  }, [
    audioUrl,
    playing,
  ]);

  useEffect(() => {
    return () => {
      if (
        audioElementRef.current
      ) {
        try {
          audioElementRef.current.pause();
        } catch {
          // Ignore.
        }

        audioElementRef.current =
          null;
      }
    };
  }, []);

  const totalDuration =
    duration ||
    audioElementRef.current
      ?.duration ||
    0;

  const progress =
    totalDuration > 0
      ? Math.min(
          100,
          (currentTime /
            totalDuration) *
            100
        )
      : 0;

  return (
    <div
      className={`voice-message ${
        side === "user"
          ? "voice-message-user"
          : "voice-message-ai"
      }`}
    >
      <button
        type="button"
        className="voice-play-button"
        onClick={handlePlay}
        aria-label={
          playing
            ? "Pause audio"
            : "Play audio"
        }
      >
        {playing ? (
          <PauseIcon size={17} />
        ) : (
          <PlayIcon size={17} />
        )}
      </button>

      <div className="voice-message-body">
        <div className="voice-message-top">
          <span className="voice-label">
            {side === "user"
              ? "Ubutumwa bw'amajwi"
              : "ANTIMATE Voice"}
          </span>

          {side === "ai" &&
            onReplay && (
              <button
                type="button"
                className="voice-replay-mini"
                onClick={() => {
                  onReplay();
                }}
                title="Ongera wumve ijwi rya AI"
              >
                <VolumeIcon />
                <span>
                  Replay
                </span>
              </button>
            )}
        </div>

        <div className="voice-wave">
          {Array.from({
            length: 26,
          }).map((_, index) => {
            const heights = [
              7,
              13,
              10,
              17,
              9,
              20,
              12,
              16,
              8,
              14,
              21,
              11,
              18,
              9,
              15,
              20,
              10,
              17,
              12,
              8,
              16,
              21,
              11,
              15,
              9,
              13,
            ];

            return (
              <span
                key={index}
                className={
                  progress >
                  (index /
                    26) *
                    100
                    ? "active"
                    : ""
                }
                style={{
                  height: `${heights[index]}px`,
                }}
              />
            );
          })}
        </div>

        <div className="voice-message-bottom">
          <span>
            {formatAudioTime(
              currentTime
            )}
          </span>

          <span>
            {formatAudioTime(
              totalDuration
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AntimateAI() {
  /* ==========================================================
     CHAT
  ========================================================== */

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  /* ==========================================================
     THEME
  ========================================================== */

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
        // Ignore.
      }

      return "light";
    });

  /* ==========================================================
     CONNECTION
  ========================================================== */

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(false);

  /* ==========================================================
     AI STATUS
  ========================================================== */

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [status, setStatus] =
    useState("ready");

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  const [
    transcript,
    setTranscript,
  ] = useState("");

  const [
    backendReasoning,
    setBackendReasoning,
  ] = useState("");

  const [
    currentAnswer,
    setCurrentAnswer,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* ==========================================================
     RECORDING UI
  ========================================================== */

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(30);

  const [
    recordingMode,
    setRecordingMode,
  ] = useState("tap");

  const [liveVoice, setLiveVoice] =
    useState(false);

  /* ==========================================================
     REFS
  ========================================================== */

  const socketRef =
    useRef(null);

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

  const lastVoiceAnswerRef =
    useRef("");

  const currentAudioUrlRef =
    useRef("");

  const currentVoiceDurationRef =
    useRef(0);

  /* ==========================================================
     THEME EFFECT
  ========================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        "antimate-theme",
        theme
      );
    } catch {
      // Ignore.
    }

    document.documentElement
      .style
      .colorScheme = theme;
  }, [theme]);

  const toggleTheme =
    useCallback(() => {
      setTheme((prev) =>
        prev === "dark"
          ? "light"
          : "dark"
      );
    }, []);

  /* ==========================================================
     IDS
  ========================================================== */

  const createId =
    useCallback(() => {
      const id =
        messageIdRef.current;

      messageIdRef.current += 1;

      return `${Date.now()}-${id}`;
    }, []);

  /* ==========================================================
     ADD USER VOICE MESSAGE
  ========================================================== */

  const addVoiceMessage =
    useCallback(
      (
        audioUrl,
        duration = 0
      ) => {
        if (!audioUrl) {
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "user",
            type: "voice",
            audioUrl,
            duration,
          },
        ]);
      },
      [createId]
    );

  /* ==========================================================
     ADD AI MESSAGE
  ========================================================== */

  const addAssistantMessage =
    useCallback(
      (
        content,
        extra = {}
      ) => {
        if (!content) {
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            type: "text",
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
            wakeLockRef.current =
              null;
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
        wakeLockRef.current =
          null;
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

  /* ==========================================================
     STOP MEDIA TRACKS
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
              !isRecordingRef.current
            ) {
              return;
            }

            if (
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
              rms >
              voiceThreshold
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

                if (
                  stopRecordingRef.current
                ) {
                  stopRecordingRef.current(
                    {
                      liveSegment: true,
                    }
                  );
                }

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
     PLAY AI AUDIO
  ========================================================== */

  const playAudio =
    useCallback(
      (
        payload,
        answerMessageId = null
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

            if (
              liveResumeTimerRef.current
            ) {
              clearTimeout(
                liveResumeTimerRef.current
              );
            }

            liveResumeTimerRef.current =
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

        audio.preload =
          "auto";

        audioRef.current =
          audio;

        currentAudioUrlRef.current =
          audioUrl;

        isPlayingRef.current =
          true;

        setIsPlaying(true);

        setStatus("speaking");

        setStatusMessage(
          "ANTIMATE iri kuvuga…"
        );

        liveAudioReceivedRef.current =
          true;

        if (answerMessageId) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id ===
              answerMessageId
                ? {
                    ...message,
                    audioUrl,
                  }
                : message
            )
          );
        } else {
          /*
           * If answer message is not known yet,
           * remember audio for the next AI answer.
           */
          currentAudioUrlRef.current =
            audioUrl;
        }

        audio.onloadedmetadata =
          () => {
            currentVoiceDurationRef.current =
              Number.isFinite(
                audio.duration
              )
                ? audio.duration
                : 0;

            if (answerMessageId) {
              setMessages(
                (prev) =>
                  prev.map(
                    (message) =>
                      message.id ===
                      answerMessageId
                        ? {
                            ...message,
                            audioDuration:
                              Number.isFinite(
                                audio.duration
                              )
                                ? audio.duration
                                : 0,
                          }
                        : message
                  )
              );
            }
          };

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

          if (
            audioUrl.startsWith(
              "blob:"
            )
          ) {
            try {
              URL.revokeObjectURL(
                audioUrl
              );
            } catch {
              // Ignore.
            }
          }

          audioRef.current =
            null;

          currentAudioUrlRef.current =
            "";

          if (
            liveVoiceRef.current &&
            voiceSessionActiveRef.current
          ) {
            liveWaitingForResponseRef.current =
              false;

            if (
              liveResumeTimerRef.current
            ) {
              clearTimeout(
                liveResumeTimerRef.current
              );
            }

            liveResumeTimerRef.current =
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

            if (
              liveResumeTimerRef.current
            ) {
              clearTimeout(
                liveResumeTimerRef.current
              );
            }

            liveResumeTimerRef.current =
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

        audio.play().catch(
          (error) => {
            console.warn(
              "Audio autoplay failed:",
              error
            );

            isPlayingRef.current =
              false;

            setIsPlaying(false);

            /*
             * Important:
             * Even if autoplay is blocked,
             * do NOT destroy the voice message.
             */

            if (
              liveVoiceRef.current &&
              voiceSessionActiveRef.current
            ) {
              liveWaitingForResponseRef.current =
                false;

              if (
                liveResumeTimerRef.current
              ) {
                clearTimeout(
                  liveResumeTimerRef.current
                );
              }

              liveResumeTimerRef.current =
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
          }
        );
      },
      [releaseWakeLock]
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

        setBackendReasoning("");

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
              ? {
                  mimeType,
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

          /*
           * START SOCKET SESSION
           */

          const socket =
            socketRef.current;

          socket.emit(
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
           * Keep all chunk promises.
           *
           * This prevents voice:end from
           * arriving before the final
           * ArrayBuffer has been sent.
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

              if (
                !socket.connected
              ) {
                return;
              }

              const chunkPromise =
                event.data
                  .arrayBuffer()
                  .then(
                    (buffer) => {
                      if (
                        socket.connected
                      ) {
                        socket.emit(
                          "antimate:voice:chunk",
                          buffer
                        );
                      }
                    }
                  )
                  .catch(
                    (error) => {
                      console.warn(
                        "Audio chunk failed:",
                        error
                      );
                    }
                  );

              chunkPromises.push(
                chunkPromise
              );
            };

          /*
           * STOP
           */

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
               * Wait for ALL chunks.
               */

              try {
                await Promise.all(
                  chunkPromises
                );
              } catch {
                // Individual chunk errors
                // already handled.
              }

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

              setIsProcessing(
                true
              );

              setStatus(
                "processing"
              );

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

              setIsProcessing(
                false
              );

              setStatus("error");

              setStatusMessage("");

              setErrorMessage(
                "Habaye ikibazo mu gufata amajwi."
              );
            };

          /*
           * START MEDIA RECORDER
           */

          recorder.start(
            AUDIO_CHUNK_MS
          );

          setIsRecording(true);

          /*
           * LIVE SILENCE DETECTION
           */

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
        requestWakeLock,
        releaseWakeLock,
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
          /*
           * LIVE segment:
           * keep whole live session alive.
           */

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
  }, [
    stopRecording,
  ]);

  /* ==========================================================
     NORMAL 30 SECOND TIMER
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
         * Already recording?
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

        /*
         * Start normal recording.
         */

        startRecordingInternal(
          "tap"
        );

        /*
         * Hold for 5 seconds -> Live Voice.
         */

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

        /*
         * Live Voice continues after
         * button release.
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

      setBackendReasoning("");

      addAssistantMessage;

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "user",
          type: "text",
          content: value,
        },
      ]);

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

        addAssistantMessage(
          answer,
          {
            audioUrl:
              audioUrl ||
              "",
          }
        );

        if (audioUrl) {
          playAudio(
            audioUrl
          );
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
      addAssistantMessage,
      createId,
      isProcessing,
      isRecording,
      liveVoice,
      playAudio,
      text,
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
      ]);

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
       BACKEND STATUS
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
              "";

        if (message) {
          setStatusMessage(
            message
          );

          /*
           * Backend status replaces
           * frontend-generated thinking.
           */
          setBackendReasoning(
            message
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
      }
    );

    /* ======================================================
       BACKEND REASONING
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
              payload?.status ||
              "";

        if (value) {
          setBackendReasoning(
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

        if (chunk) {
          setCurrentAnswer(
            (prev) =>
              prev + chunk
          );
        }
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

        if (answer) {
          setCurrentAnswer(
            answer
          );

          /*
           * Avoid duplicate answers.
           */
          if (
            lastVoiceAnswerRef.current !==
            answer
          ) {
            lastVoiceAnswerRef.current =
              answer;

            addAssistantMessage(
              answer
            );
          }
        }

        setStatus(
          "speaking"
        );

        setStatusMessage("");

        setBackendReasoning("");
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

        const audioUrl =
          getAudioUrl(
            payload
          );

        if (!audioUrl) {
          playAudio(
            payload
          );

          return;
        }

        /*
         * Attach AI audio to the latest
         * assistant message.
         */

        setMessages((prev) => {
          let targetIndex = -1;

          for (
            let i =
              prev.length - 1;
            i >= 0;
            i--
          ) {
            if (
              prev[i].role ===
                "assistant" &&
              prev[i].type ===
                "text"
            ) {
              targetIndex = i;
              break;
            }
          }

          if (
            targetIndex === -1
          ) {
            return prev;
          }

          const target =
            prev[targetIndex];

          const updated = [
            ...prev,
          ];

          updated[
            targetIndex
          ] = {
            ...target,
            audioUrl,
          };

          return updated;
        });

        /*
         * Play immediately.
         */

        playAudio(
          audioUrl
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

        setIsProcessing(
          false
        );

        setStatus(
          liveVoiceRef.current
            ? "speaking"
            : "ready"
        );

        setStatusMessage("");

        setBackendReasoning("");

        /*
         * If server completed but did not
         * send audio, reopen live microphone.
         */

        if (
          liveVoiceRef.current &&
          voiceSessionActiveRef.current &&
          !liveAudioReceivedRef.current &&
          !isPlayingRef.current
        ) {
          liveWaitingForResponseRef.current =
            false;

          if (
            liveResumeTimerRef.current
          ) {
            clearTimeout(
              liveResumeTimerRef.current
            );
          }

          liveResumeTimerRef.current =
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

        setErrorMessage(
          message
        );

        setIsProcessing(
          false
        );

        setStatus("error");

        setStatusMessage("");

        setBackendReasoning("");

        if (
          liveVoiceRef.current &&
          voiceSessionActiveRef.current
        ) {
          liveWaitingForResponseRef.current =
            false;

          if (
            liveResumeTimerRef.current
          ) {
            clearTimeout(
              liveResumeTimerRef.current
            );
          }

          liveResumeTimerRef.current =
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
    addAssistantMessage,
    playAudio,
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

        holdTimerRef.current =
          null;
      }

      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current =
          null;
      }

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
        mediaRecorderRef.current
      ) {
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
          --surface-strong: #ffffff;
          --border: #e5e9f0;
          --text: #172033;
          --muted: #697386;
          --primary: #111827;
          --primary-soft: #eef2f7;
          --accent: #2563eb;
          --accent-soft: rgba(37,99,235,0.09);
          --danger: #dc2626;
          --success: #16a34a;
          --assistant-bubble: transparent;
          --user-voice: #111827;
          --user-voice-text: #ffffff;

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

        .antimate-page.theme-dark {
          --bg: #080d16;
          --surface: rgba(16,23,35,0.96);
          --surface-soft: #0d1522;
          --surface-strong: #111b2a;
          --border: #202b3b;
          --text: #f3f6fb;
          --muted: #9aa6b8;
          --primary: #f7f9fc;
          --primary-soft: #182131;
          --accent: #60a5fa;
          --accent-soft: rgba(96,165,250,0.12);
          --danger: #f87171;
          --success: #4ade80;
          --assistant-bubble: transparent;
          --user-voice: #f7f9fc;
          --user-voice-text: #0b1220;

          background:
            radial-gradient(
              circle at 20% 0%,
              rgba(37,99,235,0.13),
              transparent 32%
            ),
            var(--bg);
        }

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
          color: var(--text);
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

          background:
            white;

          border-radius: 50%;

          position: absolute;
        }

        @keyframes logoSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .antimate-connection {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding:
            7px 10px;

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

        .theme-toggle {
          width: 38px;
          height: 38px;

          border:
            1px solid
            var(--border);

          border-radius: 12px;

          background:
            var(--surface-soft);

          color:
            var(--text);

          display: grid;
          place-items: center;

          cursor: pointer;

          transition:
            transform 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease;
        }

        .theme-toggle:hover {
          transform:
            translateY(-1px);

          border-color:
            var(--accent);
        }

        .theme-toggle:active {
          transform:
            scale(0.94);
        }

        .antimate-chat {
          width:
            min(
              980px,
              calc(100% - 32px)
            );

          margin: 0 auto;

          flex: 1;

          min-height: 0;

          padding:
            28px 0 190px;

          overflow: visible;
        }

        .message-list {
          display: flex;
          flex-direction: column;
          gap: 24px;

          width: 100%;
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
          max-width: 560px;
        }

        .empty-title {
          font-size:
            clamp(
              26px,
              5vw,
              38px
            );

          font-weight: 800;

          letter-spacing: -0.04em;

          margin:
            0 0 10px;

          color:
            var(--text);
        }

        .empty-subtitle {
          margin: 0;

          color:
            var(--muted);

          line-height: 1.65;

          font-size: 14px;
        }

        .message-row {
          display: flex;
          width: 100%;
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

          gap: 10px;
        }

        .assistant-avatar {
          width: 34px;
          height: 34px;

          border-radius: 50%;

          display: grid;
          place-items: center;

          flex-shrink: 0;

          margin-top: 2px;
        }

        .assistant-avatar
        .antimate-logo-mark {
          width:
            32px !important;

          height:
            32px !important;
        }

        .message-content {
          max-width:
            min(
              760px,
              84%
            );

          min-width: 0;
        }

        .message-bubble {
          line-height: 1.7;

          font-size: 14px;

          white-space: pre-wrap;

          word-break: break-word;

          color:
            var(--text);
        }

        .message-bubble.user {
          padding:
            11px 15px;

          border-radius:
            18px 18px 5px 18px;

          background:
            var(--primary);

          color:
            var(--bg);

          max-width:
            min(
              760px,
              84%
            );
        }

        .theme-dark
        .message-bubble.user {
          color:
            #0a1020;
        }

        .message-bubble.assistant {
          padding:
            5px 0;

          color:
            var(--text);
        }

        .assistant-tools {
          display: flex;
          align-items: center;
          gap: 7px;

          margin-top: 8px;
        }

        .ai-replay-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          border:
            1px solid
            var(--border);

          background:
            var(--surface-soft);

          color:
            var(--muted);

          border-radius:
            999px;

          padding:
            6px 9px;

          font-size: 10px;

          font-weight: 700;

          cursor: pointer;

          transition:
            background 0.18s ease,
            color 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease;
        }

        .ai-replay-button:hover {
          color:
            var(--accent);

          border-color:
            var(--accent);

          transform:
            translateY(-1px);
        }

        .transcript-box {
          margin:
            0 0 0 44px;

          max-width:
            760px;

          padding:
            12px 14px;

          border-left:
            2px solid
            var(--accent);

          background:
            var(--surface-soft);

          border-radius:
            0 10px 10px 0;

          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.6;
        }

        .transcript-box strong {
          color:
            var(--text);
        }

        .reasoning-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          margin-left: 0;

          color:
            var(--muted);

          font-size:
            12px;

          min-height:
            32px;

          animation:
            reasoningIn
            0.25s ease;
        }

        .reasoning-content {
          min-width: 0;
          padding-top: 6px;
        }

        .reasoning-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 3px;
        }

        .reasoning-text {
          line-height: 1.5;
          color: var(--muted);
        }

        @keyframes reasoningIn {
          from {
            opacity: 0;
            transform:
              translateY(3px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        .current-answer {
          display: flex;
          align-items:
            flex-start;

          gap: 10px;

          margin-top: 5px;
        }

        .status-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          margin:
            18px 0;
        }

        .status-text {
          font-size:
            12px;

          color:
            var(--muted);
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

          border-radius:
            10px;

          background:
            rgba(220,38,38,0.08);

          border:
            1px solid
            rgba(220,38,38,0.18);

          color:
            var(--danger);

          font-size:
            12px;

          text-align:
            center;
        }

        /* ====================================================
           VOICE MESSAGE
        ==================================================== */

        .voice-message {
          display: flex;
          align-items: center;

          gap: 10px;

          width:
            min(
              340px,
              76vw
            );

          padding:
            10px 12px;

          border-radius:
            18px;

          border:
            1px solid
            var(--border);

          box-shadow:
            0 8px 25px
            rgba(15,23,42,0.07);
        }

        .voice-message-user {
          background:
            var(--primary);

          color:
            var(--user-voice-text);

          border-color:
            transparent;

          border-radius:
            18px 18px 5px 18px;
        }

        .voice-message-ai {
          background:
            var(--surface-soft);

          color:
            var(--text);

          border-radius:
            14px;
        }

        .voice-play-button {
          width: 38px;
          height: 38px;

          border: 0;

          border-radius:
            50%;

          display: grid;
          place-items: center;

          flex-shrink: 0;

          cursor: pointer;

          background:
            rgba(255,255,255,0.16);

          color:
            currentColor;
        }

        .voice-message-ai
        .voice-play-button {
          background:
            var(--primary);

          color:
            var(--bg);
        }

        .voice-message-user
        .voice-play-button {
          background:
            rgba(255,255,255,0.16);

          color:
            white;
        }

        .theme-dark
        .voice-message-user
        .voice-play-button {
          color:
            #0b1220;
        }

        .voice-message-body {
          flex: 1;
          min-width: 0;
        }

        .voice-message-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 6px;
        }

        .voice-label {
          font-size: 10px;

          font-weight: 800;

          opacity: 0.82;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .voice-replay-mini {
          display: inline-flex;
          align-items: center;
          gap: 4px;

          border: 0;

          background:
            transparent;

          color:
            var(--accent);

          font-size: 9px;

          font-weight: 800;

          cursor: pointer;

          padding: 2px 0;
        }

        .voice-wave {
          display: flex;
          align-items: center;

          gap: 2px;

          height: 22px;

          overflow: hidden;
        }

        .voice-wave span {
          width: 3px;

          min-height: 5px;

          border-radius: 999px;

          background:
            currentColor;

          opacity: 0.25;

          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }

        .voice-wave span.active {
          opacity: 0.92;
        }

        .voice-message-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-top: 4px;

          font-size: 9px;

          font-variant-numeric:
            tabular-nums;

          opacity: 0.65;
        }

        /* ====================================================
           SPEAKING
        ==================================================== */

        .speaking-indicator {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding:
            6px 10px;

          border-radius:
            999px;

          background:
            var(--surface-soft);

          border:
            1px solid
            var(--border);

          font-size:
            11px;

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

          border-radius:
            5px;

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

        /* ====================================================
           COMPOSER
        ==================================================== */

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
              920px,
              calc(100% - 16px)
            );

          margin: 0 auto;

          background:
            var(--surface);

          border:
            1px solid
            var(--border);

          border-radius:
            20px;

          box-shadow:
            0 16px 50px
            rgba(15,23,42,0.12);

          backdrop-filter:
            blur(18px);

          padding: 8px;
        }

        .composer-main {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .composer-textarea {
          flex: 1;
          min-width: 0;

          min-height:
            43px;

          max-height:
            140px;

          resize:
            none;

          border: 0;
          outline: none;

          background:
            transparent;

          color:
            var(--text);

          font: inherit;

          font-size:
            14px;

          line-height:
            1.5;

          padding:
            11px 10px;
        }

        .composer-textarea::placeholder {
          color:
            var(--muted);
        }

        .composer-textarea:disabled {
          opacity:
            0.55;
        }

        .composer-action {
          width: 44px;
          height: 44px;

          border: 0;

          border-radius:
            14px;

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

          touch-action:
            none;

          user-select:
            none;

          -webkit-user-select:
            none;
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
          opacity:
            0.45;

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

        .recording-info {
          display: flex;
          align-items: center;
          justify-content:
            space-between;

          gap: 10px;

          padding:
            5px 10px 3px;

          font-size:
            11px;

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

          border-radius:
            50%;

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

          font-weight:
            800;

          color:
            var(--text);
        }

        .composer-hint {
          text-align:
            center;

          color:
            var(--muted);

          font-size:
            10px;

          margin-top:
            7px;

          line-height:
            1.4;
        }

        .live-stop-button {
          margin-top:
            8px;

          width:
            100%;

          border:
            1px solid
            rgba(124,58,237,0.18);

          background:
            rgba(124,58,237,0.07);

          color:
            var(--muted);

          border-radius:
            10px;

          padding:
            7px 10px;

          cursor:
            pointer;

          font-size:
            11px;

          font-weight:
            700;
        }

        .live-stop-button:hover {
          color:
            #7c3aed;

          border-color:
            rgba(124,58,237,0.4);
        }

        /* ====================================================
           MOBILE
        ==================================================== */

        @media (max-width: 640px) {
          .antimate-header {
            height:
              62px;

            padding:
              0 14px;
          }

          .antimate-chat {
            width:
              min(
                100% - 20px,
                980px
              );

            padding-top:
              20px;

            padding-bottom:
              180px;
          }

          .antimate-brand-sub {
            display:
              none;
          }

          .antimate-connection {
            padding:
              6px 8px;
          }

          .message-content {
            max-width:
              88%;
          }

          .message-bubble {
            font-size:
              13.5px;
          }

          .message-bubble.user {
            max-width:
              88%;
          }

          .assistant-avatar {
            width:
              28px;

            height:
              28px;
          }

          .assistant-avatar
          .antimate-logo-mark {
            width:
              28px !important;

            height:
              28px !important;
          }

          .transcript-box {
            margin-left:
              38px;
          }

          .reasoning-row {
            margin-left:
              0;
          }

          .voice-message {
            width:
              min(
                330px,
                82vw
              );
          }

          .antimate-composer {
            width:
              100%;

            border-radius:
              17px;
          }

          .composer-action {
            width:
              43px;

            height:
              43px;
          }

          .theme-toggle {
            width:
              36px;

            height:
              36px;
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

        <div className="header-right">
          {/* ==================================================
              THEME SWITCH
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
              <SunIcon />
            ) : (
              <MoonIcon />
            )}
          </button>

          {/* ==================================================
              CONNECTION
          ================================================== */}

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
            {/* ==================================================
                MESSAGES
            ================================================== */}

            {messages.map(
              (message) => {
                /*
                 * USER TEXT
                 */

                if (
                  message.role ===
                    "user" &&
                  message.type ===
                    "text"
                ) {
                  return (
                    <div
                      key={
                        message.id
                      }
                      className="message-row user"
                    >
                      <div className="message-bubble user">
                        {
                          message.content
                        }
                      </div>
                    </div>
                  );
                }

                /*
                 * USER VOICE
                 */

                if (
                  message.role ===
                    "user" &&
                  message.type ===
                    "voice"
                ) {
                  return (
                    <div
                      key={
                        message.id
                      }
                      className="message-row user"
                    >
                      <VoiceMessageBubble
                        audioUrl={
                          message.audioUrl
                        }
                        duration={
                          message.duration
                        }
                        side="user"
                      />
                    </div>
                  );
                }

                /*
                 * AI MESSAGE
                 */

                if (
                  message.role ===
                  "assistant"
                ) {
                  return (
                    <div
                      key={
                        message.id
                      }
                      className="message-row assistant"
                    >
                      <div className="assistant-avatar">
                        <LogoMark
                          size={30}
                        />
                      </div>

                      <div className="message-content">
                        {message.content && (
                          <div className="message-bubble assistant">
                            {
                              message.content
                            }
                          </div>
                        )}

                        {message.audioUrl && (
                          <div className="assistant-tools">
                            <VoiceMessageBubble
                              audioUrl={
                                message.audioUrl
                              }
                              duration={
                                message.audioDuration ||
                                0
                              }
                              side="ai"
                              onReplay={() =>
                                playAudio(
                                  message.audioUrl
                                )
                              }
                            />

                            <button
                              type="button"
                              className="ai-replay-button"
                              onClick={() =>
                                playAudio(
                                  message.audioUrl
                                )
                              }
                            >
                              <VolumeIcon />
                              <span>
                                Ongera wumve
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              }
            )}

            {/* ==================================================
                USER TRANSCRIPT
            ================================================== */}

            {transcript && (
              <div className="transcript-box">
                <strong>
                  Wavuze:
                </strong>{" "}
                {transcript}
              </div>
            )}

            {/* ==================================================
                BACKEND REASONING
            ================================================== */}

            {isProcessing &&
              backendReasoning && (
                <div className="reasoning-row">
                  <div className="assistant-avatar">
                    <LogoMark
                      size={30}
                    />
                  </div>

                  <div className="reasoning-content">
                    <div className="reasoning-label">
                      ANTIMATE
                    </div>

                    <div className="reasoning-text">
                      {
                        backendReasoning
                      }
                    </div>
                  </div>
                </div>
              )}

            {/* ==================================================
                CURRENT STREAMING ANSWER
            ================================================== */}

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

                  <div className="message-content">
                    <div className="message-bubble assistant">
                      {
                        currentAnswer
                      }
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
            BACKEND STATUS
        ==================================================== */}

        {statusMessage &&
          !isPlaying &&
          !backendReasoning && (
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
              ref={
                textareaRef
              }
              className="composer-textarea"
              value={text}
              onChange={(
                event
              ) => {
                const value =
                  event.target
                    .value;

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
                ONE ACTION BUTTON
                RIGHT SIDE
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
              className="live-stop-button"
            >
              Hagarika Live Voice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}