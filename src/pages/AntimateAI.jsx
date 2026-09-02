// ============================================================
// ANTIMATE AI — FRONTEND
// SOCKET.IO VOICE + TEXT CHAT
// ============================================================
//
// FEATURES
//
// • Socket.IO voice streaming
// • Kinyarwanda transcript
// • Streaming Kinyarwanda answer
// • Audio response playback
// • Short click → ~1.8 sec recording
// • Hold → continuous recording
// • Auto stop after max duration
// • Socket reconnect
// • Wake Lock
// • Recording timer
// • Live waveform
// • Responsive UI
// • Dark/light theme support
// • No external CSS required
//
// BACKEND SOCKET EVENTS
//
// CLIENT -> SERVER
//   antimate:voice:start
//   antimate:voice:chunk
//   antimate:voice:end
//   antimate:voice:cancel
//
// SERVER -> CLIENT
//   antimate:status
//   antimate:transcript
//   antimate:thinking
//   antimate:answer
//   antimate:answer:chunk
//   antimate:audio
//   antimate:complete
//   antimate:error
//
// ============================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
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

const CHAT_URL =
  `${API_URL}/api/antimate/chat`;

const HOLD_THRESHOLD_MS = 650;

const SHORT_RECORDING_MS = 1800;

const MAX_RECORDING_MS =
  Number(
    import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

const CHUNK_INTERVAL_MS = 250;

// ============================================================
// THINKING MESSAGES
// ============================================================

const THINKING_MESSAGES = [
  "Reka ndebe...",
  "Ndabitekerezaho...",
  "Ndimo gutunganya igisubizo...",
  "Reka ndebe amakuru mfite...",
  "Ndimo gushaka igisubizo cyiza...",
];

// ============================================================
// MIME TYPE
// ============================================================

function getSupportedMimeType() {
  if (
    typeof MediaRecorder === "undefined"
  ) {
    return "";
  }

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const type of types) {
    try {
      if (
        MediaRecorder.isTypeSupported(type)
      ) {
        return type;
      }
    } catch {
      // Ignore
    }
  }

  return "";
}

// ============================================================
// MIME EXTENSION
// ============================================================

function extensionFromMimeType(
  mimeType
) {
  const mime =
    String(
      mimeType || ""
    ).toLowerCase();

  if (
    mime.includes("ogg")
  ) {
    return ".ogg";
  }

  if (
    mime.includes("mp4")
  ) {
    return ".mp4";
  }

  if (
    mime.includes("mpeg")
  ) {
    return ".mp3";
  }

  return ".webm";
}

// ============================================================
// AUDIO URL
// ============================================================

function getAudioUrl(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value === "object"
  ) {
    return (
      value.url ||
      value.audio_url ||
      value.audioUrl ||
      value.path ||
      null
    );
  }

  return null;
}

// ============================================================
// ABSOLUTE URL
// ============================================================

function makeAbsoluteUrl(url) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (
    url.startsWith("file://")
  ) {
    return null;
  }

  if (
    url.startsWith("/")
  ) {
    return `${API_URL}${url}`;
  }

  return url;
}

// ============================================================
// TIME FORMAT
// ============================================================

function formatSeconds(
  milliseconds
) {
  const seconds = Math.max(
    0,
    Math.floor(
      milliseconds / 1000
    )
  );

  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    seconds % 60;

  return `${String(
    minutes
  ).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {
  // ==========================================================
  // SOCKET
  // ==========================================================

  const socketRef =
    useRef(null);

  // ==========================================================
  // MEDIA
  // ==========================================================

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const recordingStartedAtRef =
    useRef(0);

  const holdTimerRef =
    useRef(null);

  const shortClickTimerRef =
    useRef(null);

  const maxRecordingTimerRef =
    useRef(null);

  const isRecordingRef =
    useRef(false);

  const pointerDownRef =
    useRef(false);

  const longPressRef =
    useRef(false);

  // ==========================================================
  // AUDIO
  // ==========================================================

  const audioRef =
    useRef(null);

  // ==========================================================
  // WAKE LOCK
  // ==========================================================

  const wakeLockRef =
    useRef(null);

  const voiceSessionActiveRef =
    useRef(false);

  // ==========================================================
  // LIVE ANSWER
  // ==========================================================

  const liveAssistantMessageIdRef =
    useRef(null);

  const answerBufferRef =
    useRef("");

  // ==========================================================
  // RECORDING TIMER
  // ==========================================================

  const recordingTimerRef =
    useRef(null);

  // ==========================================================
  // STATE
  // ==========================================================

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

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
    useState(
      "ANTIMATE yiteguye kumva."
    );

  const [processingMode, setProcessingMode] =
    useState(null);

  const [transcript, setTranscript] =
    useState("");

  const [thinkingText, setThinkingText] =
    useState("");

  const [currentAnswer, setCurrentAnswer] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [recordingDuration, setRecordingDuration] =
    useState(0);

  const [isLongPress, setIsLongPress] =
    useState(false);

  const [waveform, setWaveform] =
    useState(
      Array.from(
        { length: 22 },
        () => 0.18
      )
    );

  // ==========================================================
  // RANDOM THINKING MESSAGE
  // ==========================================================

  const thinkingIndexRef =
    useRef(0);

  // ==========================================================
  // WAKE LOCK
  // ==========================================================

  const requestWakeLock =
    useCallback(
      async () => {
        if (
          !("wakeLock" in navigator)
        ) {
          return;
        }

        if (
          !voiceSessionActiveRef.current
        ) {
          return;
        }

        try {
          if (
            wakeLockRef.current &&
            !wakeLockRef.current.released
          ) {
            return;
          }

          const lock =
            await navigator.wakeLock.request(
              "screen"
            );

          wakeLockRef.current =
            lock;

          console.log(
            "🔒 ANTIMATE Wake Lock enabled"
          );

          lock.addEventListener(
            "release",
            () => {
              wakeLockRef.current =
                null;
            }
          );
        } catch (error) {
          console.warn(
            "Wake Lock failed:",
            error
          );
        }
      },
      []
    );

  // ==========================================================
  // RELEASE WAKE LOCK
  // ==========================================================

  const releaseWakeLock =
    useCallback(
      async () => {
        if (
          wakeLockRef.current
        ) {
          try {
            await wakeLockRef.current.release();
          } catch {}

          wakeLockRef.current =
            null;
        }
      },
      []
    );

  // ==========================================================
  // STOP MEDIA
  // ==========================================================

  const stopMediaTracks =
    useCallback(() => {
      const stream =
        mediaStreamRef.current;

      if (!stream) {
        return;
      }

      stream
        .getTracks()
        .forEach(
          (track) => {
            try {
              track.stop();
            } catch {}
          }
        );

      mediaStreamRef.current =
        null;
    }, []);

  // ==========================================================
  // RESET RECORDING TIMER
  // ==========================================================

  const resetRecordingTimer =
    useCallback(() => {
      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current =
          null;
      }

      setRecordingDuration(0);
    }, []);

  // ==========================================================
  // UPDATE WAVEFORM
  // ==========================================================

  useEffect(() => {
    if (!isRecording) {
      setWaveform(
        Array.from(
          { length: 22 },
          () => 0.18
        )
      );

      return;
    }

    const interval =
      setInterval(() => {
        setWaveform(
          Array.from(
            { length: 22 },
            () =>
              0.18 +
              Math.random() *
                0.82
          )
        );
      }, 110);

    return () =>
      clearInterval(
        interval
      );
  }, [isRecording]);

  // ==========================================================
  // RECORDING TIMER
  // ==========================================================

  useEffect(() => {
    if (!isRecording) {
      resetRecordingTimer();
      return;
    }

    recordingStartedAtRef.current =
      Date.now();

    recordingTimerRef.current =
      setInterval(() => {
        const elapsed =
          Date.now() -
          recordingStartedAtRef.current;

        setRecordingDuration(
          elapsed
        );
      }, 100);

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
    resetRecordingTimer,
  ]);

  // ==========================================================
  // VISIBILITY / WAKE LOCK
  // ==========================================================

  useEffect(() => {
    const onVisibility =
      async () => {
        if (
          document.visibilityState ===
            "visible" &&
          voiceSessionActiveRef.current
        ) {
          await requestWakeLock();
        }
      };

    document.addEventListener(
      "visibilitychange",
      onVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
    };
  }, [
    requestWakeLock,
  ]);

  // ==========================================================
  // THINKING ROTATION
  // ==========================================================

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    setThinkingText(
      THINKING_MESSAGES[0]
    );

    const interval =
      setInterval(() => {
        thinkingIndexRef.current =
          (thinkingIndexRef.current +
            1) %
          THINKING_MESSAGES.length;

        setThinkingText(
          THINKING_MESSAGES[
            thinkingIndexRef.current
          ]
        );
      }, 1800);

    return () =>
      clearInterval(
        interval
      );
  }, [isProcessing]);

  // ==========================================================
  // UPDATE LIVE ASSISTANT
  // ==========================================================

  const updateLiveAssistantMessage =
    useCallback(
      (
        answer,
        mode = "gpu"
      ) => {
        if (
          !answer ||
          !answer.trim()
        ) {
          return;
        }

        const clean =
          answer.trim();

        setMessages(
          (previous) => {
            const liveId =
              liveAssistantMessageIdRef.current;

            if (!liveId) {
              const id =
                `assistant-live-${Date.now()}-${Math.random()}`;

              liveAssistantMessageIdRef.current =
                id;

              return [
                ...previous,
                {
                  id,
                  role: "assistant",
                  text: clean,
                  mode,
                  live: true,
                  createdAt:
                    Date.now(),
                },
              ];
            }

            return previous.map(
              (message) =>
                message.id ===
                liveId
                  ? {
                      ...message,
                      text: clean,
                      mode,
                      live: true,
                    }
                  : message
            );
          }
        );
      },
      []
    );

  // ==========================================================
  // FINALIZE ASSISTANT
  // ==========================================================

  const finalizeLiveAssistantMessage =
    useCallback(
      (
        answer,
        mode = "gpu"
      ) => {
        if (
          !answer ||
          !answer.trim()
        ) {
          return;
        }

        const clean =
          answer.trim();

        setMessages(
          (previous) => {
            const liveId =
              liveAssistantMessageIdRef.current;

            if (liveId) {
              return previous.map(
                (message) =>
                  message.id ===
                  liveId
                    ? {
                        ...message,
                        text: clean,
                        mode,
                        live: false,
                      }
                    : message
              );
            }

            return [
              ...previous,
              {
                id:
                  `assistant-${Date.now()}-${Math.random()}`,
                role: "assistant",
                text: clean,
                mode,
                live: false,
                createdAt:
                  Date.now(),
              },
            ];
          }
        );

        liveAssistantMessageIdRef.current =
          null;
      },
      []
    );

  // ==========================================================
  // USER MESSAGE
  // ==========================================================

  const addUserMessage =
    useCallback(
      (message) => {
        if (
          !message ||
          !message.trim()
        ) {
          return;
        }

        setMessages(
          (previous) => [
            ...previous,
            {
              id:
                `user-${Date.now()}-${Math.random()}`,
              role: "user",
              text:
                message.trim(),
              createdAt:
                Date.now(),
            },
          ]
        );
      },
      []
    );

  // ==========================================================
  // ASSISTANT MESSAGE
  // ==========================================================

  const addAssistantMessage =
    useCallback(
      (
        message,
        mode = "gpu"
      ) => {
        if (
          !message ||
          !message.trim()
        ) {
          return;
        }

        const clean =
          message.trim();

        setMessages(
          (previous) => {
            const last =
              previous[
                previous.length - 1
              ];

            if (
              last?.role ===
                "assistant" &&
              last?.text ===
                clean
            ) {
              return previous;
            }

            return [
              ...previous,
              {
                id:
                  `assistant-${Date.now()}-${Math.random()}`,
                role: "assistant",
                text: clean,
                mode,
                live: false,
                createdAt:
                  Date.now(),
              },
            ];
          }
        );
      },
      []
    );

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const playAudio =
    useCallback(
      async (audioUrl) => {
        if (!audioUrl) {
          return;
        }

        try {
          if (
            audioRef.current
          ) {
            try {
              audioRef.current.pause();
            } catch {}

            audioRef.current =
              null;
          }

          const audio =
            new Audio(
              audioUrl
            );

          audio.preload =
            "auto";

          audioRef.current =
            audio;

          audio.onplay =
            () => {
              setIsPlaying(true);

              setStatus(
                "speaking"
              );

              setStatusMessage(
                "ANTIMATE iri kuvuga..."
              );
            };

          audio.onended =
            () => {
              setIsPlaying(false);

              setStatus(
                "complete"
              );

              setStatusMessage(
                "ANTIMATE yarangije kuvuga."
              );

              audioRef.current =
                null;

              // Keep voice session active
              // only if it was a live session.
              if (
                voiceSessionActiveRef.current
              ) {
                requestWakeLock();
              } else {
                releaseWakeLock();
              }
            };

          audio.onerror =
            (event) => {
              console.error(
                "❌ Audio playback failed:",
                event
              );

              setIsPlaying(false);

              setStatus(
                "complete"
              );

              setStatusMessage(
                "Igisubizo cyabonetse ariko audio ntiyakinze."
              );

              audioRef.current =
                null;
            };

          await audio.play();
        } catch (error) {
          console.error(
            "❌ Audio play error:",
            error
          );

          setIsPlaying(false);
        }
      },
      [
        requestWakeLock,
        releaseWakeLock,
      ]
    );

  // ==========================================================
  // SOCKET.IO CONNECTION
  // ==========================================================

  useEffect(() => {
    console.log(
      "🔌 Connecting ANTIMATE Socket.IO:",
      SOCKET_URL
    );

    const socket =
      io(
        SOCKET_URL,
        {
          transports: [
            "websocket",
            "polling",
          ],

          withCredentials:
            true,

          autoConnect:
            true,

          reconnection:
            true,

          reconnectionAttempts:
            Infinity,

          reconnectionDelay:
            1000,

          reconnectionDelayMax:
            5000,

          timeout:
            20000,
        }
      );

    socketRef.current =
      socket;

    // ========================================================
    // CONNECT
    // ========================================================

    socket.on(
      "connect",
      () => {
        console.log(
          "🔌 ANTIMATE Socket connected:",
          socket.id
        );

        setSocketConnected(
          true
        );

        setErrorMessage("");

        if (
          !isRecordingRef.current &&
          !voiceSessionActiveRef.current
        ) {
          setStatus(
            "ready"
          );

          setStatusMessage(
            "ANTIMATE yiteguye kumva."
          );
        }
      }
    );

    // ========================================================
    // DISCONNECT
    // ========================================================

    socket.on(
      "disconnect",
      (reason) => {
        console.warn(
          "🔌 Socket disconnected:",
          reason
        );

        setSocketConnected(
          false
        );

        if (
          !isRecordingRef.current
        ) {
          setStatus(
            "disconnected"
          );

          setStatusMessage(
            "Connection yacitse. Ngerageza kongera kuyihuza..."
          );
        }
      }
    );

    // ========================================================
    // CONNECT ERROR
    // ========================================================

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "❌ Socket connection error:",
          error
        );

        setSocketConnected(
          false
        );

        setErrorMessage(
          "ANTIMATE server ntabwo iri kuboneka."
        );
      }
    );

    // ========================================================
    // STATUS
    // ========================================================

    socket.on(
      "antimate:status",
      (data = {}) => {
        console.log(
          "📡 antimate:status",
          data
        );

        const nextStatus =
          data.status ||
          "ready";

        setStatus(
          nextStatus
        );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        if (
          data.message
        ) {
          setStatusMessage(
            data.message
          );
        }

        if (
          nextStatus ===
          "recording"
        ) {
          setIsRecording(
            true
          );

          isRecordingRef.current =
            true;

          voiceSessionActiveRef.current =
            true;

          requestWakeLock();
        }

        if (
          [
            "receiving",
            "uploaded",
            "converting",
            "processing",
            "gpu_fallback",
          ].includes(
            nextStatus
          )
        ) {
          setIsProcessing(
            true
          );
        }

        if (
          nextStatus ===
          "cancelled"
        ) {
          setIsRecording(
            false
          );

          setIsProcessing(
            false
          );

          isRecordingRef.current =
            false;

          voiceSessionActiveRef.current =
            false;

          releaseWakeLock();
        }
      }
    );

    // ========================================================
    // TRANSCRIPT
    // ========================================================

    socket.on(
      "antimate:transcript",
      (data = {}) => {
        console.log(
          "📝 antimate:transcript",
          data
        );

        const value =
          data.transcript ||
          data.text ||
          data.message ||
          "";

        if (value) {
          setTranscript(
            value
          );
        }
      }
    );

    // ========================================================
    // THINKING
    // ========================================================

    socket.on(
      "antimate:thinking",
      (data = {}) => {
        console.log(
          "🧠 antimate:thinking",
          data
        );

        setIsProcessing(
          true
        );

        setThinkingText(
          data.text ||
            "ANTIMATE iri gutekereza..."
        );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }
      }
    );

    // ========================================================
    // ANSWER
    // ========================================================

    socket.on(
      "antimate:answer",
      (data = {}) => {
        console.log(
          "💬 antimate:answer",
          data
        );

        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          data.message ||
          "";

        const mode =
          data.mode ||
          data.processing_mode ||
          "gpu";

        if (
          !answer
        ) {
          return;
        }

        answerBufferRef.current =
          answer;

        setCurrentAnswer(
          answer
        );

        setThinkingText("");

        updateLiveAssistantMessage(
          answer,
          mode
        );
      }
    );

    // ========================================================
    // ANSWER CHUNK
    // ========================================================

    socket.on(
      "antimate:answer:chunk",
      (data = {}) => {
        console.log(
          "🧩 antimate:answer:chunk",
          data
        );

        const chunk =
          data.chunk ||
          data.text ||
          data.answer ||
          "";

        if (
          !chunk
        ) {
          return;
        }

        const mode =
          data.mode ||
          data.processing_mode ||
          "gpu";

        if (
          data.done
        ) {
          answerBufferRef.current =
            chunk;
        } else {
          answerBufferRef.current +=
            chunk;
        }

        const answer =
          answerBufferRef.current;

        setIsProcessing(
          true
        );

        setThinkingText("");

        setCurrentAnswer(
          answer
        );

        updateLiveAssistantMessage(
          answer,
          mode
        );
      }
    );

    // ========================================================
    // AUDIO
    // ========================================================

    socket.on(
      "antimate:audio",
      (data = {}) => {
        console.log(
          "🔊 antimate:audio",
          data
        );

        const rawAudio =
          getAudioUrl(
            data.audio_url ||
              data.audioUrl ||
              data.audio
          );

        const audioUrl =
          makeAbsoluteUrl(
            rawAudio
          );

        if (
          data.mode ||
          data.processing_mode
        ) {
          setProcessingMode(
            data.mode ||
              data.processing_mode
          );
        }

        if (
          audioUrl
        ) {
          playAudio(
            audioUrl
          );
        }
      }
    );

    // ========================================================
    // COMPLETE
    // ========================================================

    socket.on(
      "antimate:complete",
      (data = {}) => {
        console.log(
          "✅ antimate:complete",
          data
        );

        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          answerBufferRef.current ||
          "";

        const mode =
          data.processing_mode ||
          data.mode ||
          "gpu";

        if (
          answer
        ) {
          answerBufferRef.current =
            answer;

          setCurrentAnswer(
            answer
          );

          finalizeLiveAssistantMessage(
            answer,
            mode
          );
        }

        setIsProcessing(
          false
        );

        setIsRecording(
          false
        );

        isRecordingRef.current =
          false;

        setStatus(
          "complete"
        );

        setStatusMessage(
          "ANTIMATE yarangije gusubiza."
        );

        setTranscript("");

        // Do NOT release wake lock here.
        // Audio may still be playing.
      }
    );

    // ========================================================
    // ERROR
    // ========================================================

    socket.on(
      "antimate:error",
      (data = {}) => {
        console.error(
          "🔥 antimate:error",
          data
        );

        const message =
          data.message ||
          data.error ||
          "ANTIMATE AI habayemo ikibazo.";

        setErrorMessage(
          message
        );

        setIsRecording(
          false
        );

        setIsProcessing(
          false
        );

        isRecordingRef.current =
          false;

        voiceSessionActiveRef.current =
          false;

        setStatus(
          "error"
        );

        setStatusMessage(
          message
        );

        stopMediaTracks();

        releaseWakeLock();
      }
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      socket.off(
        "connect"
      );

      socket.off(
        "disconnect"
      );

      socket.off(
        "connect_error"
      );

      socket.off(
        "antimate:status"
      );

      socket.off(
        "antimate:transcript"
      );

      socket.off(
        "antimate:thinking"
      );

      socket.off(
        "antimate:answer"
      );

      socket.off(
        "antimate:answer:chunk"
      );

      socket.off(
        "antimate:audio"
      );

      socket.off(
        "antimate:complete"
      );

      socket.off(
        "antimate:error"
      );

      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [
    finalizeLiveAssistantMessage,
    playAudio,
    releaseWakeLock,
    requestWakeLock,
    stopMediaTracks,
    updateLiveAssistantMessage,
  ]);

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording =
    useCallback(
      async () => {
        if (
          isRecordingRef.current
        ) {
          return false;
        }

        if (
          isProcessing ||
          isPlaying
        ) {
          return false;
        }

        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          setErrorMessage(
            "ANTIMATE server ntabwo ihujwe na Socket.IO."
          );

          setStatus(
            "error"
          );

          return false;
        }

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          setErrorMessage(
            "Browser yawe ntabwo yemera microphone."
          );

          setStatus(
            "error"
          );

          return false;
        }

        try {
          setErrorMessage("");

          setTranscript("");

          setThinkingText("");

          setCurrentAnswer("");

          answerBufferRef.current =
            "";

          liveAssistantMessageIdRef.current =
            null;

          voiceSessionActiveRef.current =
            true;

          await requestWakeLock();

          // --------------------------------------------------
          // MICROPHONE
          // --------------------------------------------------

          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                audio: {
                  channelCount: 1,
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },

                video: false,
              }
            );

          mediaStreamRef.current =
            stream;

          // --------------------------------------------------
          // MEDIA RECORDER
          // --------------------------------------------------

          const preferredMime =
            getSupportedMimeType();

          let recorder;

          try {
            recorder =
              preferredMime
                ? new MediaRecorder(
                    stream,
                    {
                      mimeType:
                        preferredMime,
                    }
                  )
                : new MediaRecorder(
                    stream
                  );
          } catch {
            recorder =
              new MediaRecorder(
                stream
              );
          }

          mediaRecorderRef.current =
            recorder;

          const actualMimeType =
            recorder.mimeType ||
            preferredMime ||
            "audio/webm";

          const extension =
            extensionFromMimeType(
              actualMimeType
            );

          // --------------------------------------------------
          // START BACKEND SESSION
          // --------------------------------------------------

          socket.emit(
            "antimate:voice:start",
            {
              mimeType:
                actualMimeType,

              extension,

              language:
                "rw",
            }
          );

          // --------------------------------------------------
          // DATA AVAILABLE
          // --------------------------------------------------

          recorder.ondataavailable =
            async (event) => {
              if (
                !event.data ||
                event.data.size <= 0
              ) {
                return;
              }

              try {
                const buffer =
                  await event.data.arrayBuffer();

                if (
                  socket.connected
                ) {
                  socket.emit(
                    "antimate:voice:chunk",
                    buffer
                  );
                }
              } catch (
                error
              ) {
                console.error(
                  "❌ Chunk error:",
                  error
                );
              }
            };

          // --------------------------------------------------
          // ERROR
          // --------------------------------------------------

          recorder.onerror =
            (event) => {
              console.error(
                "❌ MediaRecorder error:",
                event
              );

              setErrorMessage(
                "Microphone recording habayemo ikibazo."
              );

              setStatus(
                "error"
              );

              isRecordingRef.current =
                false;

              setIsRecording(
                false
              );

              voiceSessionActiveRef.current =
                false;

              try {
                socket.emit(
                  "antimate:voice:cancel"
                );
              } catch {}

              stopMediaTracks();

              releaseWakeLock();
            };

          // --------------------------------------------------
          // RECORDING START
          // --------------------------------------------------

          isRecordingRef.current =
            true;

          setIsRecording(
            true
          );

          setIsProcessing(
            false
          );

          setStatus(
            "recording"
          );

          setStatusMessage(
            "ANTIMATE iri kumva..."
          );

          recordingStartedAtRef.current =
            Date.now();

          recorder.start(
            CHUNK_INTERVAL_MS
          );

          // --------------------------------------------------
          // MAX RECORDING
          // --------------------------------------------------

          clearTimeout(
            maxRecordingTimerRef.current
          );

          maxRecordingTimerRef.current =
            setTimeout(
              () => {
                if (
                  isRecordingRef.current
                ) {
                  stopRecording();
                }
              },
              MAX_RECORDING_MS
            );

          return true;
        } catch (error) {
          console.error(
            "🔥 Microphone error:",
            error
          );

          setErrorMessage(
            error?.message ||
              "Microphone ntiyashoboye gufunguka."
          );

          setStatus(
            "error"
          );

          isRecordingRef.current =
            false;

          setIsRecording(
            false
          );

          voiceSessionActiveRef.current =
            false;

          stopMediaTracks();

          releaseWakeLock();

          return false;
        }
      },
      [
        isProcessing,
        isPlaying,
        requestWakeLock,
        releaseWakeLock,
        stopMediaTracks,
      ]
    );

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording =
    useCallback(
      () => {
        clearTimeout(
          maxRecordingTimerRef.current
        );

        maxRecordingTimerRef.current =
          null;

        const socket =
          socketRef.current;

        const recorder =
          mediaRecorderRef.current;

        if (
          !isRecordingRef.current
        ) {
          return;
        }

        isRecordingRef.current =
          false;

        setIsRecording(
          false
        );

        setIsProcessing(
          true
        );

        setStatus(
          "uploaded"
        );

        setStatusMessage(
          "Audio yakiriwe. ANTIMATE iri gutekereza..."
        );

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          recorder.onstop =
            () => {
              console.log(
                "🎙️ Final audio chunk ready"
              );

              mediaRecorderRef.current =
                null;

              stopMediaTracks();

              if (
                socket &&
                socket.connected
              ) {
                socket.emit(
                  "antimate:voice:end"
                );
              } else {
                setErrorMessage(
                  "Socket connection yacitse mbere yo kohereza audio."
                );

                setIsProcessing(
                  false
                );
              }
            };

          try {
            recorder.stop();
          } catch (
            error
          ) {
            console.warn(
              "Recorder stop error:",
              error
            );

            mediaRecorderRef.current =
              null;

            stopMediaTracks();

            if (
              socket &&
              socket.connected
            ) {
              socket.emit(
                "antimate:voice:end"
              );
            }
          }
        } else {
          mediaRecorderRef.current =
            null;

          stopMediaTracks();

          if (
            socket &&
            socket.connected
          ) {
            socket.emit(
              "antimate:voice:end"
            );
          }
        }
      },
      [stopMediaTracks]
    );

  // ==========================================================
  // CANCEL
  // ==========================================================

  const cancelRecording =
    useCallback(
      () => {
        clearTimeout(
          holdTimerRef.current
        );

        clearTimeout(
          shortClickTimerRef.current
        );

        clearTimeout(
          maxRecordingTimerRef.current
        );

        holdTimerRef.current =
          null;

        shortClickTimerRef.current =
          null;

        maxRecordingTimerRef.current =
          null;

        pointerDownRef.current =
          false;

        longPressRef.current =
          false;

        isRecordingRef.current =
          false;

        setIsRecording(
          false
        );

        setIsProcessing(
          false
        );

        setIsLongPress(
          false
        );

        setStatus(
          "cancelled"
        );

        setStatusMessage(
          "Recording yahagaritswe."
        );

        const socket =
          socketRef.current;

        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "antimate:voice:cancel"
          );
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
          } catch {}
        }

        mediaRecorderRef.current =
          null;

        stopMediaTracks();

        voiceSessionActiveRef.current =
          false;

        releaseWakeLock();
      },
      [
        releaseWakeLock,
        stopMediaTracks,
      ]
    );

  // ==========================================================
  // POINTER DOWN
  // ==========================================================

  const handleRecordPointerDown =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (
          isProcessing ||
          isPlaying ||
          isRecordingRef.current
        ) {
          return;
        }

        pointerDownRef.current =
          true;

        longPressRef.current =
          false;

        setIsLongPress(
          false
        );

        clearTimeout(
          holdTimerRef.current
        );

        // --------------------------------------------------
        // Start after hold threshold
        // --------------------------------------------------

        holdTimerRef.current =
          setTimeout(
            async () => {
              if (
                !pointerDownRef.current
              ) {
                return;
              }

              longPressRef.current =
                true;

              setIsLongPress(
                true
              );

              await startRecording();
            },
            HOLD_THRESHOLD_MS
          );
      },
      [
        isProcessing,
        isPlaying,
        startRecording,
      ]
    );

  // ==========================================================
  // POINTER UP
  // ==========================================================

  const handleRecordPointerUp =
    useCallback(
      async (event) => {
        event.preventDefault();

        const wasLongPress =
          longPressRef.current;

        pointerDownRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        // --------------------------------------------------
        // LONG PRESS
        // --------------------------------------------------

        if (
          wasLongPress
        ) {
          setIsLongPress(
            false
          );

          if (
            isRecordingRef.current
          ) {
            stopRecording();
          }

          return;
        }

        // --------------------------------------------------
        // SHORT CLICK
        // --------------------------------------------------

        setIsLongPress(
          false
        );

        const started =
          await startRecording();

        if (
          !started
        ) {
          return;
        }

        clearTimeout(
          shortClickTimerRef.current
        );

        shortClickTimerRef.current =
          setTimeout(
            () => {
              if (
                isRecordingRef.current
              ) {
                stopRecording();
              }
            },
            SHORT_RECORDING_MS
          );
      },
      [
        startRecording,
        stopRecording,
      ]
    );

  // ==========================================================
  // POINTER CANCEL
  // ==========================================================

  const handleRecordPointerCancel =
    useCallback(
      (event) => {
        event.preventDefault();

        pointerDownRef.current =
          false;

        longPressRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        clearTimeout(
          shortClickTimerRef.current
        );

        holdTimerRef.current =
          null;

        shortClickTimerRef.current =
          null;

        setIsLongPress(
          false
        );

        if (
          isRecordingRef.current
        ) {
          stopRecording();
        }
      },
      [stopRecording]
    );

  // ==========================================================
  // SEND TEXT
  // ==========================================================

  const sendTextMessage =
    useCallback(
      async () => {
        const cleanText =
          text.trim();

        if (
          !cleanText
        ) {
          return;
        }

        if (
          isProcessing ||
          isRecording ||
          isPlaying
        ) {
          return;
        }

        setText("");

        setErrorMessage("");

        setTranscript("");

        setCurrentAnswer("");

        answerBufferRef.current =
          "";

        liveAssistantMessageIdRef.current =
          null;

        setStatus(
          "processing"
        );

        setIsProcessing(
          true
        );

        setStatusMessage(
          "ANTIMATE iri gutekereza..."
        );

        addUserMessage(
          cleanText
        );

        try {
          const response =
            await fetch(
              CHAT_URL,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Accept:
                    "application/json",
                },

                credentials:
                  "include",

                body:
                  JSON.stringify({
                    message:
                      cleanText,

                    language:
                      "rw",
                  }),
              }
            );

          let data =
            {};

          try {
            data =
              await response.json();
          } catch {
            data = {};
          }

          if (
            !response.ok
          ) {
            throw new Error(
              data.message ||
                data.error ||
                `ANTIMATE request failed (${response.status})`
            );
          }

          const answer =
            data.answer ||
            data.answer_rw ||
            data.answer_kinyarwanda ||
            data.message ||
            data.text ||
            "";

          if (
            !answer
          ) {
            throw new Error(
              "ANTIMATE ntiyagaruye igisubizo."
            );
          }

          const mode =
            data.processing_mode ||
            data.mode ||
            "gpu";

          setProcessingMode(
            mode
          );

          setCurrentAnswer(
            answer
          );

          addAssistantMessage(
            answer,
            mode
          );

          const rawAudio =
            getAudioUrl(
              data.audio_url ||
                data.audioUrl ||
                data.audio
            );

          const audioUrl =
            makeAbsoluteUrl(
              rawAudio
            );

          if (
            audioUrl
          ) {
            await playAudio(
              audioUrl
            );
          } else {
            setStatus(
              "complete"
            );

            setStatusMessage(
              "ANTIMATE yarangije gusubiza."
            );
          }
        } catch (error) {
          console.error(
            "🔥 Text chat error:",
            error
          );

          setErrorMessage(
            error?.message ||
              "ANTIMATE ntiyashoboye gusubiza."
          );

          setStatus(
            "error"
          );

          setStatusMessage(
            "Habaye ikibazo mu kohereza ubutumwa."
          );
        } finally {
          setIsProcessing(
            false
          );
        }
      },
      [
        text,
        isProcessing,
        isRecording,
        isPlaying,
        addUserMessage,
        addAssistantMessage,
        playAudio,
      ]
    );

  // ==========================================================
  // ENTER
  // ==========================================================

  const handleTextKeyDown =
    useCallback(
      (event) => {
        if (
          event.key ===
            "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          sendTextMessage();
        }
      },
      [sendTextMessage]
    );

  // ==========================================================
  // CLEAR ERROR
  // ==========================================================

  const clearError =
    useCallback(
      () => {
        setErrorMessage("");

        if (
          !isRecording &&
          !isProcessing &&
          !isPlaying
        ) {
          setStatus(
            "ready"
          );

          setStatusMessage(
            "ANTIMATE yiteguye kumva."
          );
        }
      },
      [
        isRecording,
        isProcessing,
        isPlaying,
      ]
    );

  // ==========================================================
  // BUTTON STATE
  // ==========================================================

  const buttonClass =
    useMemo(
      () =>
        [
          "antimate-record-button",

          isRecording
            ? "recording"
            : "",

          isProcessing
            ? "processing"
            : "",

          isPlaying
            ? "speaking"
            : "",

          isLongPress
            ? "holding"
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      [
        isRecording,
        isProcessing,
        isPlaying,
        isLongPress,
      ]
    );

  // ==========================================================
  // FINAL CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      clearTimeout(
        holdTimerRef.current
      );

      clearTimeout(
        shortClickTimerRef.current
      );

      clearTimeout(
        maxRecordingTimerRef.current
      );

      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );
      }

      const socket =
        socketRef.current;

      if (
        socket &&
        socket.connected &&
        isRecordingRef.current
      ) {
        socket.emit(
          "antimate:voice:cancel"
        );
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
        } catch {}
      }

      stopMediaTracks();

      if (
        audioRef.current
      ) {
        try {
          audioRef.current.pause();
        } catch {}
      }

      voiceSessionActiveRef.current =
        false;

      if (
        wakeLockRef.current
      ) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, [
    stopMediaTracks,
  ]);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="antimate-ai-page">

      {/* ======================================================
          INLINE STYLE
      ====================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .antimate-ai-page {
          --bg: #f7f9fc;
          --surface: #ffffff;
          --surface-soft: #f1f5f9;
          --border: #e2e8f0;
          --text: #0f172a;
          --muted: #64748b;
          --primary: #0f766e;
          --primary-2: #14b8a6;
          --primary-soft: rgba(20,184,166,.12);
          --danger: #ef4444;
          --shadow: 0 16px 45px rgba(15,23,42,.08);

          min-height: 100vh;
          width: 100%;
          background: var(--bg);
          color: var(--text);
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        @media (prefers-color-scheme: dark) {
          .antimate-ai-page {
            --bg: #07111f;
            --surface: #0d1a2b;
            --surface-soft: #122238;
            --border: rgba(255,255,255,.09);
            --text: #f8fafc;
            --muted: #94a3b8;
            --primary: #14b8a6;
            --primary-2: #2dd4bf;
            --primary-soft: rgba(20,184,166,.14);
            --shadow: 0 18px 50px rgba(0,0,0,.25);
          }
        }

        .antimate-header {
          width: 100%;
          min-height: 72px;
          padding: 14px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
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
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 50%;
          position: relative;
          display: grid;
          place-items: center;
          background:
            conic-gradient(
              from 0deg,
              #14b8a6,
              #3b82f6,
              #8b5cf6,
              #14b8a6
            );
          animation: antimateLogoSpin 7s linear infinite;
          box-shadow:
            0 8px 24px rgba(20,184,166,.22);
        }

        .antimate-logo::before {
          content: "";
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: var(--surface);
          position: absolute;
        }

        .antimate-logo span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #14b8a6;
          position: relative;
          z-index: 2;
          box-shadow:
            0 0 13px rgba(20,184,166,.75);
        }

        @keyframes antimateLogoSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .antimate-brand-text {
          min-width: 0;
        }

        .antimate-brand-text h1 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: .5px;
          white-space: nowrap;
        }

        .antimate-subtitle {
          display: block;
          margin-top: 2px;
          color: var(--muted);
          font-size: 11px;
          white-space: nowrap;
        }

        .antimate-connection {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
        }

        .connection-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #94a3b8;
        }

        .antimate-connection.online .connection-dot {
          background: #22c55e;
          box-shadow:
            0 0 0 4px rgba(34,197,94,.12),
            0 0 12px rgba(34,197,94,.6);
        }

        .antimate-connection.offline .connection-dot {
          background: #ef4444;
        }

        .antimate-main {
          flex: 1;
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 0 18px 18px;
        }

        .antimate-chat {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 28px 2px 18px;
          scroll-behavior: smooth;
        }

        .antimate-empty {
          min-height: 52vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px 20px;
        }

        .antimate-empty-logo {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            conic-gradient(
              from 0deg,
              #14b8a6,
              #3b82f6,
              #8b5cf6,
              #14b8a6
            );
          animation:
            antimateLogoSpin 8s linear infinite;
          box-shadow:
            0 20px 55px rgba(20,184,166,.22);
          position: relative;
        }

        .antimate-empty-logo::before {
          content: "";
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--surface);
        }

        .antimate-empty-logo span {
          position: relative;
          z-index: 2;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #14b8a6;
          box-shadow:
            0 0 25px rgba(20,184,166,.7);
        }

        .antimate-empty h2 {
          margin: 24px 0 7px;
          font-size: clamp(22px, 4vw, 31px);
          letter-spacing: -.7px;
        }

        .antimate-empty p {
          max-width: 480px;
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .antimate-messages {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .antimate-message {
          display: flex;
          width: 100%;
          gap: 9px;
          animation: messageIn .25s ease;
        }

        @keyframes messageIn {
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
          justify-content: flex-end;
        }

        .antimate-message.assistant {
          justify-content: flex-start;
          align-items: flex-start;
        }

        .antimate-message.assistant::before {
          content: "";
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          margin-top: 2px;
          border-radius: 50%;
          background:
            conic-gradient(
              #14b8a6,
              #3b82f6,
              #8b5cf6,
              #14b8a6
            );
          box-shadow:
            0 5px 18px rgba(20,184,166,.16);
        }

        .message-bubble {
          max-width: min(760px, 82%);
          padding: 12px 15px;
          border-radius: 17px;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .antimate-message.user
        .message-bubble {
          background: var(--primary);
          color: white;
          border-bottom-right-radius: 5px;
          box-shadow:
            0 8px 22px rgba(15,118,110,.16);
        }

        .antimate-message.assistant
        .message-bubble {
          background: var(--surface);
          border: 1px solid var(--border);
          border-bottom-left-radius: 5px;
          box-shadow: var(--shadow);
        }

        .message-mode {
          font-size: 9px;
          color: var(--muted);
          margin-top: 4px;
          margin-left: 5px;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        .antimate-live-transcript {
          margin: 18px auto 0;
          width: min(760px, 92%);
          padding: 12px 14px;
          border-radius: 14px;
          background: var(--primary-soft);
          border: 1px solid rgba(20,184,166,.18);
        }

        .antimate-live-transcript span {
          display: block;
          font-size: 10px;
          font-weight: 800;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: .7px;
          margin-bottom: 4px;
        }

        .antimate-live-transcript p {
          margin: 0;
          color: var(--text);
          font-size: 13px;
          line-height: 1.55;
        }

        .antimate-thinking {
          width: fit-content;
          max-width: 90%;
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 18px 0 0 40px;
          padding: 10px 13px;
          border-radius: 14px;
          color: var(--muted);
          background: var(--surface);
          border: 1px solid var(--border);
          font-size: 12px;
        }

        .thinking-dots {
          display: flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--primary);
          animation: thinkingDot 1.1s infinite;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: .15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes thinkingDot {
          0%, 100% {
            transform: translateY(0);
            opacity: .35;
          }

          50% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .antimate-thinking small {
          padding-left: 5px;
          font-size: 9px;
          font-weight: 800;
          color: var(--primary);
        }

        .antimate-current-answer {
          margin: 18px auto;
          width: min(760px, 92%);
          padding: 13px 15px;
          border-radius: 15px;
          background: var(--surface);
          border: 1px solid var(--border);
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          box-shadow: var(--shadow);
        }

        .antimate-status {
          width: 100%;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--muted);
          font-size: 11px;
          text-align: center;
        }

        .status-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--primary);
        }

        .antimate-status.recording
        .status-indicator {
          background: #ef4444;
          animation:
            statusPulse 1s infinite;
        }

        .antimate-status.error
        .status-indicator {
          background: #ef4444;
        }

        @keyframes statusPulse {
          50% {
            opacity: .3;
            transform: scale(.7);
          }
        }

        .status-mode {
          padding: 3px 7px;
          border-radius: 6px;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .6px;
        }

        .antimate-error {
          width: 100%;
          margin: 5px 0 8px;
          padding: 9px 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid rgba(239,68,68,.18);
          background: rgba(239,68,68,.08);
          color: #ef4444;
          border-radius: 11px;
          font-size: 11px;
        }

        .antimate-error button {
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
        }

        .antimate-voice-control {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5px 0 12px;
        }

        .antimate-record-button {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 0;
          cursor: pointer;
          position: relative;
          display: grid;
          place-items: center;
          background:
            linear-gradient(
              145deg,
              #14b8a6,
              #0f766e
            );
          color: white;
          box-shadow:
            0 12px 30px rgba(15,118,110,.26);
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            opacity .18s ease;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .antimate-record-button:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.03);
          box-shadow:
            0 17px 35px rgba(15,118,110,.30);
        }

        .antimate-record-button:active:not(:disabled) {
          transform: scale(.95);
        }

        .antimate-record-button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .antimate-record-button.recording {
          background:
            linear-gradient(
              145deg,
              #ef4444,
              #dc2626
            );
          box-shadow:
            0 0 0 8px rgba(239,68,68,.10),
            0 14px 35px rgba(239,68,68,.28);
          animation:
            recordingPulse 1.5s infinite;
        }

        @keyframes recordingPulse {
          50% {
            box-shadow:
              0 0 0 13px rgba(239,68,68,.04),
              0 14px 35px rgba(239,68,68,.30);
          }
        }

        .antimate-record-button.processing {
          background:
            linear-gradient(
              145deg,
              #6366f1,
              #4338ca
            );
        }

        .antimate-record-button.speaking {
          background:
            linear-gradient(
              145deg,
              #8b5cf6,
              #6d28d9
            );
        }

        .record-button-ring {
          position: absolute;
          inset: -6px;
          border: 1px solid rgba(20,184,166,.22);
          border-radius: 50%;
          pointer-events: none;
        }

        .recording .record-button-ring {
          border-color:
            rgba(239,68,68,.35);
          animation:
            ringPulse 1.4s infinite;
        }

        @keyframes ringPulse {
          50% {
            inset: -12px;
            opacity: .2;
          }
        }

        .record-icon {
          position: relative;
          z-index: 2;
          font-size: 22px;
          line-height: 1;
        }

        .recording .record-icon {
          font-size: 18px;
        }

        .voice-waveform {
          height: 28px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          opacity: 0;
          transform: translateY(4px);
          transition:
            opacity .2s ease,
            transform .2s ease;
        }

        .voice-waveform.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .voice-wave-bar {
          width: 3px;
          min-height: 4px;
          max-height: 23px;
          border-radius: 5px;
          background: var(--primary);
          transition: height .1s ease;
        }

        .recording +
        .voice-waveform .voice-wave-bar {
          background: #ef4444;
        }

        .voice-help {
          margin-top: 8px;
          color: var(--muted);
          font-size: 10px;
          text-align: center;
        }

        .recording-timer {
          margin-top: 4px;
          font-size: 10px;
          font-weight: 800;
          color: #ef4444;
          font-variant-numeric: tabular-nums;
        }

        .antimate-input {
          width: 100%;
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 9px;
          border-radius: 18px;
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
        }

        .antimate-input textarea {
          flex: 1;
          min-width: 0;
          max-height: 130px;
          min-height: 42px;
          resize: none;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text);
          font: inherit;
          font-size: 13px;
          line-height: 1.5;
          padding: 11px 7px;
        }

        .antimate-input textarea::placeholder {
          color: var(--muted);
        }

        .antimate-send-button {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border: 0;
          border-radius: 13px;
          display: grid;
          place-items: center;
          cursor: pointer;
          background: var(--primary);
          color: white;
          font-size: 18px;
          transition:
            transform .15s ease,
            opacity .15s ease;
        }

        .antimate-send-button:hover:not(:disabled) {
          transform: scale(1.04);
        }

        .antimate-send-button:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {

          .antimate-header {
            min-height: 62px;
            padding: 10px 14px;
          }

          .antimate-logo {
            width: 35px;
            height: 35px;
            flex-basis: 35px;
          }

          .antimate-logo::before {
            width: 24px;
            height: 24px;
          }

          .antimate-brand-text h1 {
            font-size: 13px;
          }

          .antimate-subtitle {
            font-size: 9px;
          }

          .antimate-main {
            padding:
              0 10px 10px;
          }

          .antimate-chat {
            padding-top: 16px;
          }

          .message-bubble {
            max-width: 86%;
            font-size: 13px;
          }

          .antimate-message.assistant::before {
            width: 27px;
            height: 27px;
            flex-basis: 27px;
          }

          .antimate-thinking {
            margin-left: 34px;
          }

          .antimate-record-button {
            width: 62px;
            height: 62px;
          }

          .antimate-input {
            border-radius: 15px;
          }

          .antimate-connection {
            font-size: 10px;
          }
        }

        @media (max-height: 650px) {
          .antimate-empty {
            min-height: 38vh;
          }

          .antimate-empty-logo {
            width: 65px;
            height: 65px;
          }

          .antimate-empty-logo::before {
            width: 48px;
            height: 48px;
          }

          .antimate-empty h2 {
            margin-top: 14px;
            font-size: 22px;
          }

          .antimate-record-button {
            width: 58px;
            height: 58px;
          }

          .antimate-voice-control {
            padding-bottom: 5px;
          }
        }

      `}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="antimate-header">

        <div className="antimate-brand">

          <div className="antimate-logo">
            <span />
          </div>

          <div className="antimate-brand-text">

            <h1>
              ANTIMATE AI
            </h1>

            <span className="antimate-subtitle">
              Kinyarwanda Voice AI
            </span>

          </div>

        </div>

        <div
          className={[
            "antimate-connection",
            socketConnected
              ? "online"
              : "offline",
          ].join(" ")}
        >

          <span className="connection-dot" />

          {socketConnected
            ? "Online"
            : "Connecting..."}

        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="antimate-main">

        {/* ====================================================
            CHAT
        ==================================================== */}

        <section className="antimate-chat">

          {messages.length ===
            0 && (
            <div className="antimate-empty">

              <div className="antimate-empty-logo">
                <span />
              </div>

              <h2>
                Muraho, ndi ANTIMATE
              </h2>

              <p>
                Vuga cyangwa wandike ubutumwa
                mu Kinyarwanda.
              </p>

            </div>
          )}

          <div className="antimate-messages">

            {messages.map(
              (message) => (
                <div
                  key={
                    message.id
                  }
                  className={[
                    "antimate-message",

                    message.role ===
                    "user"
                      ? "user"
                      : "assistant",
                  ].join(" ")}
                >

                  <div>

                    <div className="message-bubble">
                      {message.text}
                    </div>

                    {message.role ===
                      "assistant" &&
                      message.mode && (
                        <div className="message-mode">
                          {message.mode ===
                          "cpu"
                            ? "CPU"
                            : "GPU"}
                        </div>
                      )}

                  </div>

                </div>
              )
            )}

          </div>

          {/* ==================================================
              TRANSCRIPT
          ================================================== */}

          {transcript && (
            <div className="antimate-live-transcript">

              <span>
                Wavuze
              </span>

              <p>
                {transcript}
              </p>

            </div>
          )}

          {/* ==================================================
              THINKING
          ================================================== */}

          {isProcessing &&
            thinkingText && (
              <div className="antimate-thinking">

                <div className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span>
                  {thinkingText}
                </span>

                {processingMode && (
                  <small>
                    {processingMode ===
                    "cpu"
                      ? "CPU"
                      : "GPU"}
                  </small>
                )}

              </div>
            )}

          {/* ==================================================
              CURRENT STREAMING ANSWER
          ================================================== */}

          {currentAnswer &&
            liveAssistantMessageIdRef.current ===
              null &&
            false && (
              <div className="antimate-current-answer">
                {currentAnswer}
              </div>
            )}

        </section>

        {/* ====================================================
            STATUS
        ==================================================== */}

        <div
          className={[
            "antimate-status",
            status,
          ].join(" ")}
        >

          <span className="status-indicator" />

          <span>
            {statusMessage}
          </span>

          {processingMode && (
            <span className="status-mode">
              {processingMode ===
              "cpu"
                ? "CPU"
                : "GPU"}
            </span>
          )}

        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {errorMessage && (
          <div className="antimate-error">

            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={
                clearError
              }
              aria-label="Close error"
            >
              ×
            </button>

          </div>
        )}

        {/* ====================================================
            VOICE CONTROL
        ==================================================== */}

        <section className="antimate-voice-control">

          <button
            type="button"
            className={
              buttonClass
            }
            onPointerDown={
              handleRecordPointerDown
            }
            onPointerUp={
              handleRecordPointerUp
            }
            onPointerCancel={
              handleRecordPointerCancel
            }
            onPointerLeave={
              isRecording
                ? undefined
                : handleRecordPointerCancel
            }
            disabled={
              isProcessing ||
              isPlaying ||
              !socketConnected
            }
            aria-label={
              isRecording
                ? "Hagarika recording"
                : "Tangira recording"
            }
          >

            <span className="record-button-ring" />

            <span className="record-icon">

              {isRecording
                ? "■"
                : isPlaying
                ? "🔊"
                : isProcessing
                ? "✦"
                : "🎙️"}

            </span>

          </button>

          <div
            className={[
              "voice-waveform",
              isRecording
                ? "visible"
                : "",
            ].join(" ")}
          >

            {waveform.map(
              (
                height,
                index
              ) => (
                <span
                  key={index}
                  className="voice-wave-bar"
                  style={{
                    height:
                      `${Math.max(
                        4,
                        height * 23
                      )}px`,
                  }}
                />
              )
            )}

          </div>

          {isRecording && (
            <div className="recording-timer">
              {formatSeconds(
                recordingDuration
              )}
            </div>
          )}

          <div className="voice-help">

            {isRecording
              ? "Kanda cyangwa ureke button uhagarike"
              : "Kanda gato = recording · Fataho = kuvuga igihe kirekire"}

          </div>

        </section>

        {/* ====================================================
            TEXT INPUT
        ==================================================== */}

        <section className="antimate-input">

          <textarea
            value={text}
            onChange={(event) =>
              setText(
                event.target.value
              )
            }
            onKeyDown={
              handleTextKeyDown
            }
            placeholder="Andika ubutumwa mu Kinyarwanda..."
            rows={1}
            disabled={
              isProcessing ||
              isRecording ||
              isPlaying
            }
          />

          <button
            type="button"
            className="antimate-send-button"
            onClick={
              sendTextMessage
            }
            disabled={
              !text.trim() ||
              isProcessing ||
              isRecording ||
              isPlaying
            }
            aria-label="Ohereza ubutumwa"
          >
            ➤
          </button>

        </section>

      </main>

    </div>
  );
}