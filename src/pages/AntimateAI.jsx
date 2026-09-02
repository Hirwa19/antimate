// ============================================================
// ANTIMATE AI — FRONTEND
// SOCKET.IO VOICE + TEXT AI
// FULL SELF-CONTAINED JSX
// ============================================================
//
// FEATURES
//
// TEXT
//  - Kinyarwanda text chat
//  - GPU / CPU indicator
//
// VOICE
//  - Socket.IO streaming
//  - Kinyarwanda transcript
//  - Answer streaming
//  - Audio playback
//  - Short click -> ~1.8 sec recording
//  - Hold -> continuous/live recording
//  - Silence can be handled by backend
//  - Auto reconnect
//  - Wake Lock
//
// SOCKET CLIENT EVENTS
//
//  antimate:voice:start
//  antimate:voice:chunk
//  antimate:voice:end
//  antimate:voice:cancel
//
// SOCKET SERVER EVENTS
//
//  antimate:status
//  antimate:transcript
//  antimate:thinking
//  antimate:answer
//  antimate:answer:chunk
//  antimate:audio
//  antimate:complete
//  antimate:error
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

// ============================================================
// RECORDING SETTINGS
// ============================================================

// Short click recording
const SHORT_RECORDING_MS = 1800;

// Time after which a press becomes live/hold mode
const HOLD_TO_LIVE_MS = 900;

// Maximum recording duration
const MAX_RECORDING_MS =
  Number(
    import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

// Send MediaRecorder chunks every 250ms
const CHUNK_INTERVAL_MS = 250;

// ============================================================
// THINKING MESSAGES
// ============================================================

const THINKING_MESSAGES = [
  "Reka ndebe...",
  "Ndabitekerezaho...",
  "Ndimo gutunganya igisubizo...",
  "Reka nsubize neza...",
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
    "audio/mp4",
    "audio/ogg",
  ];

  for (
    const type of types
  ) {
    try {
      if (
        MediaRecorder.isTypeSupported(
          type
        )
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

function makeAbsoluteUrl(
  url
) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith(
      "http://"
    ) ||
    url.startsWith(
      "https://"
    ) ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (
    url.startsWith(
      "file://"
    )
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
// COMPONENT
// ============================================================

export default function AntimateAI() {
  // ==========================================================
  // REFS
  // ==========================================================

  const socketRef =
    useRef(null);

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const audioRef =
    useRef(null);

  const wakeLockRef =
    useRef(null);

  const holdTimerRef =
    useRef(null);

  const shortRecordTimerRef =
    useRef(null);

  const maxRecordTimerRef =
    useRef(null);

  const thinkingTimerRef =
    useRef(null);

  const recordingStartedAtRef =
    useRef(0);

  const isRecordingRef =
    useRef(false);

  const isLiveModeRef =
    useRef(false);

  const pointerDownRef =
    useRef(false);

  const voiceSessionActiveRef =
    useRef(false);

  const autoContinueLiveRef =
    useRef(false);

  const liveAssistantMessageIdRef =
    useRef(null);

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    text,
    setText,
  ] = useState("");

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(false);

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

  const [
    isLiveMode,
    setIsLiveMode,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState("ready");

  const [
    statusMessage,
    setStatusMessage,
  ] = useState(
    "ANTIMATE yiteguye kumva."
  );

  const [
    processingMode,
    setProcessingMode,
  ] = useState(null);

  const [
    transcript,
    setTranscript,
  ] = useState("");

  const [
    thinkingText,
    setThinkingText,
  ] = useState("");

  const [
    currentAnswer,
    setCurrentAnswer,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);

  // ==========================================================
  // CLEAN TIMERS
  // ==========================================================

  const clearAllTimers =
    useCallback(() => {
      clearTimeout(
        holdTimerRef.current
      );

      clearTimeout(
        shortRecordTimerRef.current
      );

      clearTimeout(
        maxRecordTimerRef.current
      );

      clearInterval(
        thinkingTimerRef.current
      );

      holdTimerRef.current =
        null;

      shortRecordTimerRef.current =
        null;

      maxRecordTimerRef.current =
        null;

      thinkingTimerRef.current =
        null;
    }, []);

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

          lock.addEventListener(
            "release",
            () => {
              wakeLockRef.current =
                null;
            }
          );

          console.log(
            "🔒 ANTIMATE Wake Lock ON"
          );
        } catch (
          error
        ) {
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
  // VISIBILITY
  // ==========================================================

  useEffect(() => {
    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
            "visible" &&
          voiceSessionActiveRef.current
        ) {
          requestWakeLock();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [
    requestWakeLock,
  ]);

  // ==========================================================
  // STOP MEDIA
  // ==========================================================

  const stopMediaTracks =
    useCallback(() => {
      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
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
      }
    }, []);

  // ==========================================================
  // ADD USER MESSAGE
  // ==========================================================

  const addUserMessage =
    useCallback(
      (value) => {
        const clean =
          String(
            value || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => [
            ...previous,
            {
              id:
                `user-${Date.now()}-${Math.random()}`,
              role: "user",
              text: clean,
              createdAt:
                Date.now(),
            },
          ]
        );
      },
      []
    );

  // ==========================================================
  // ADD ASSISTANT
  // ==========================================================

  const addAssistantMessage =
    useCallback(
      (
        value,
        mode = "gpu"
      ) => {
        const clean =
          String(
            value || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => {
            const last =
              previous[
                previous.length - 1
              ];

            if (
              last &&
              last.role ===
                "assistant" &&
              last.text ===
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
  // UPDATE STREAMING ASSISTANT
  // ==========================================================

  const updateLiveAssistant =
    useCallback(
      (
        value,
        mode = "gpu"
      ) => {
        const clean =
          String(
            value || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => {
            let liveId =
              liveAssistantMessageIdRef.current;

            if (!liveId) {
              liveId =
                `assistant-live-${Date.now()}-${Math.random()}`;

              liveAssistantMessageIdRef.current =
                liveId;

              return [
                ...previous,
                {
                  id: liveId,
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
  // FINALIZE STREAMING ASSISTANT
  // ==========================================================

  const finalizeLiveAssistant =
    useCallback(
      (
        value,
        mode = "gpu"
      ) => {
        const clean =
          String(
            value || ""
          ).trim();

        if (!clean) {
          return;
        }

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
  // THINKING ANIMATION
  // ==========================================================

  const startThinkingAnimation =
    useCallback(() => {
      clearInterval(
        thinkingTimerRef.current
      );

      let index = 0;

      setThinkingText(
        THINKING_MESSAGES[0]
      );

      thinkingTimerRef.current =
        setInterval(
          () => {
            index =
              (index + 1) %
              THINKING_MESSAGES.length;

            setThinkingText(
              THINKING_MESSAGES[
                index
              ]
            );
          },
          1600
        );
    }, []);

  const stopThinkingAnimation =
    useCallback(() => {
      clearInterval(
        thinkingTimerRef.current
      );

      thinkingTimerRef.current =
        null;

      setThinkingText("");
    }, []);

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const playAudio =
    useCallback(
      async (
        rawAudioUrl
      ) => {
        const audioUrl =
          makeAbsoluteUrl(
            getAudioUrl(
              rawAudioUrl
            )
          );

        if (!audioUrl) {
          return false;
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

          audioRef.current =
            audio;

          audio.preload =
            "auto";

          audio.onplay =
            () => {
              setIsPlaying(
                true
              );

              setStatus(
                "speaking"
              );

              setStatusMessage(
                "ANTIMATE iri kuvuga..."
              );
            };

          audio.onended =
            () => {
              setIsPlaying(
                false
              );

              audioRef.current =
                null;

              // ----------------------------------------------
              // LIVE MODE
              // ----------------------------------------------

              if (
                autoContinueLiveRef.current
              ) {
                setStatus(
                  "ready"
                );

                setStatusMessage(
                  "ANTIMATE yongeye gufungura microphone..."
                );

                setTimeout(
                  () => {
                    if (
                      autoContinueLiveRef.current &&
                      !isRecordingRef.current
                    ) {
                      startRecording();
                    }
                  },
                  350
                );

                return;
              }

              setStatus(
                "ready"
              );

              setStatusMessage(
                "ANTIMATE yiteguye kongera kumva."
              );

              voiceSessionActiveRef.current =
                false;

              releaseWakeLock();
            };

          audio.onerror =
            () => {
              console.error(
                "❌ Audio playback failed"
              );

              setIsPlaying(
                false
              );

              audioRef.current =
                null;

              if (
                autoContinueLiveRef.current
              ) {
                setTimeout(
                  () => {
                    if (
                      autoContinueLiveRef.current &&
                      !isRecordingRef.current
                    ) {
                      startRecording();
                    }
                  },
                  500
                );

                return;
              }

              setStatus(
                "ready"
              );

              setStatusMessage(
                "Igisubizo cyabonetse ariko audio ntiyakinze."
              );

              voiceSessionActiveRef.current =
                false;

              releaseWakeLock();
            };

          await audio.play();

          return true;
        } catch (
          error
        ) {
          console.error(
            "❌ Could not play audio:",
            error
          );

          setIsPlaying(
            false
          );

          return false;
        }
      },
      [
        releaseWakeLock,
      ]
    );

  // ==========================================================
  // SOCKET.IO
  // ==========================================================

  useEffect(() => {
    console.log(
      "🔌 Connecting ANTIMATE Socket:",
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

          reconnection: true,

          reconnectionAttempts:
            Infinity,

          reconnectionDelay:
            1000,

          reconnectionDelayMax:
            5000,

          timeout: 20000,

          autoConnect: true,

          withCredentials: true,
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
          !isPlaying
        ) {
          setStatus(
            "ready"
          );

          setStatusMessage(
            "ANTIMATE yiteguye kumva."
          );
        }

        if (
          voiceSessionActiveRef.current
        ) {
          requestWakeLock();
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
          "🔌 ANTIMATE Socket disconnected:",
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
          "❌ ANTIMATE Socket error:",
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
          "📝 Transcript:",
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
          "🧠 Thinking:",
          data
        );

        setIsProcessing(
          true
        );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        if (
          data.text
        ) {
          setThinkingText(
            data.text
          );
        } else {
          startThinkingAnimation();
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
          "💬 Answer:",
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

        setProcessingMode(
          mode
        );

        if (answer) {
          setCurrentAnswer(
            answer
          );

          updateLiveAssistant(
            answer,
            mode
          );
        }

        stopThinkingAnimation();
      }
    );

    // ========================================================
    // ANSWER CHUNK
    // ========================================================

    socket.on(
      "antimate:answer:chunk",
      (data = {}) => {
        console.log(
          "🧩 Answer chunk:",
          data
        );

        const chunk =
          data.chunk ||
          data.text ||
          data.answer ||
          "";

        if (!chunk) {
          return;
        }

        const mode =
          data.mode ||
          data.processing_mode ||
          "gpu";

        setProcessingMode(
          mode
        );

        setIsProcessing(
          true
        );

        stopThinkingAnimation();

        setCurrentAnswer(
          (previous) => {
            const next =
              data.done
                ? chunk
                : previous +
                  chunk;

            updateLiveAssistant(
              next,
              mode
            );

            return next;
          }
        );
      }
    );

    // ========================================================
    // AUDIO
    // ========================================================

    socket.on(
      "antimate:audio",
      async (
        data = {}
      ) => {
        console.log(
          "🔊 Audio:",
          data
        );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        const raw =
          data.audio_url ||
          data.audioUrl ||
          data.audio ||
          data.voice_url ||
          data.voiceUrl ||
          data.url;

        if (raw) {
          await playAudio(
            raw
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
          "✅ Complete:",
          data
        );

        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          "";

        const mode =
          data.processing_mode ||
          data.mode ||
          "gpu";

        setProcessingMode(
          mode
        );

        if (answer) {
          setCurrentAnswer(
            answer
          );

          finalizeLiveAssistant(
            answer,
            mode
          );
        } else if (
          currentAnswer
        ) {
          finalizeLiveAssistant(
            currentAnswer,
            mode
          );
        }

        stopThinkingAnimation();

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
          "ANTIMATE yarangije gutunganya igisubizo."
        );

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
          "🔥 ANTIMATE error:",
          data
        );

        const message =
          data.message ||
          data.error ||
          "ANTIMATE AI habayemo ikibazo.";

        setErrorMessage(
          message
        );

        setStatus(
          "error"
        );

        setStatusMessage(
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

        autoContinueLiveRef.current =
          false;

        stopMediaTracks();

        releaseWakeLock();

        stopThinkingAnimation();
      }
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      console.log(
        "🧹 Cleaning ANTIMATE Socket"
      );

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

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }
    };

    // IMPORTANT:
    // This effect intentionally has stable dependencies.
    // It must NOT reconnect every time state changes.
  }, [
    finalizeLiveAssistant,
    playAudio,
    releaseWakeLock,
    requestWakeLock,
    startThinkingAnimation,
    stopMediaTracks,
    stopThinkingAnimation,
    updateLiveAssistant,
  ]);

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording =
    useCallback(
      async (
        live = false
      ) => {
        if (
          isRecordingRef.current
        ) {
          return;
        }

        if (
          isProcessing ||
          isPlaying
        ) {
          return;
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

          return;
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

          return;
        }

        try {
          setErrorMessage("");

          setTranscript("");

          setCurrentAnswer("");

          stopThinkingAnimation();

          liveAssistantMessageIdRef.current =
            null;

          isLiveModeRef.current =
            live;

          setIsLiveMode(
            live
          );

          if (live) {
            autoContinueLiveRef.current =
              true;
          }

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
          // MIME
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

          const actualMime =
            recorder.mimeType ||
            preferredMime ||
            "audio/webm";

          const extension =
            extensionFromMimeType(
              actualMime
            );

          // --------------------------------------------------
          // START BACKEND SESSION
          // --------------------------------------------------

          socket.emit(
            "antimate:voice:start",
            {
              mimeType:
                actualMime,

              extension,

              language:
                "rw",

              mode:
                live
                  ? "live"
                  : "tap",
            }
          );

          // --------------------------------------------------
          // DATA
          // --------------------------------------------------

          recorder.ondataavailable =
            async (
              event
            ) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              if (
                !isRecordingRef.current
              ) {
                return;
              }

              try {
                const buffer =
                  await event.data.arrayBuffer();

                if (
                  socket.connected &&
                  isRecordingRef.current
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
          // RECORDER ERROR
          // --------------------------------------------------

          recorder.onerror =
            () => {
              console.error(
                "❌ MediaRecorder error"
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

              autoContinueLiveRef.current =
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
          // STATE
          // --------------------------------------------------

          isRecordingRef.current =
            true;

          setIsRecording(
            true
          );

          setIsProcessing(
            false
          );

          setRecordingSeconds(
            0
          );

          setStatus(
            "recording"
          );

          setStatusMessage(
            live
              ? "ANTIMATE iri muri Live Voice..."
              : "ANTIMATE iri kumva..."
          );

          recordingStartedAtRef.current =
            Date.now();

          // --------------------------------------------------
          // START MEDIA RECORDER
          // --------------------------------------------------

          recorder.start(
            CHUNK_INTERVAL_MS
          );

          // --------------------------------------------------
          // RECORDING CLOCK
          // --------------------------------------------------

          clearTimeout(
            maxRecordTimerRef.current
          );

          maxRecordTimerRef.current =
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

          const clock =
            setInterval(
              () => {
                if (
                  !isRecordingRef.current
                ) {
                  clearInterval(
                    clock
                  );

                  return;
                }

                const elapsed =
                  Date.now() -
                  recordingStartedAtRef.current;

                setRecordingSeconds(
                  Math.floor(
                    elapsed /
                      1000
                  )
                );
              },
              250
            );

          // Save clock cleanup indirectly
          recorder.__antimateClock =
            clock;
        } catch (
          error
        ) {
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

          autoContinueLiveRef.current =
            false;

          stopMediaTracks();

          releaseWakeLock();
        }
      },
      [
        isProcessing,
        isPlaying,
        requestWakeLock,
        releaseWakeLock,
        stopMediaTracks,
        stopThinkingAnimation,
      ]
    );

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording =
    useCallback(
      () => {
        clearTimeout(
          maxRecordTimerRef.current
        );

        maxRecordTimerRef.current =
          null;

        clearTimeout(
          shortRecordTimerRef.current
        );

        shortRecordTimerRef.current =
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

        stopThinkingAnimation();

        // --------------------------------------------------
        // Stop clock
        // --------------------------------------------------

        if (
          recorder &&
          recorder.__antimateClock
        ) {
          clearInterval(
            recorder.__antimateClock
          );

          recorder.__antimateClock =
            null;
        }

        // --------------------------------------------------
        // Stop recorder first
        // --------------------------------------------------

        const finishSocketSession =
          () => {
            stopMediaTracks();

            if (
              socket &&
              socket.connected
            ) {
              console.log(
                "📤 Sending antimate:voice:end"
              );

              socket.emit(
                "antimate:voice:end"
              );
            }
          };

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          recorder.onstop =
            () => {
              finishSocketSession();
            };

          try {
            recorder.stop();
          } catch {
            finishSocketSession();
          }
        } else {
          finishSocketSession();
        }

        mediaRecorderRef.current =
          null;

        // IMPORTANT:
        // Do not disable voiceSessionActive here.
        // Audio response may still be playing.
      },
      [
        clearAllTimers,
        stopMediaTracks,
        stopThinkingAnimation,
      ]
    );

  // ==========================================================
  // CANCEL
  // ==========================================================

  const cancelRecording =
    useCallback(
      () => {
        clearAllTimers();

        const socket =
          socketRef.current;

        const recorder =
          mediaRecorderRef.current;

        isRecordingRef.current =
          false;

        pointerDownRef.current =
          false;

        isLiveModeRef.current =
          false;

        autoContinueLiveRef.current =
          false;

        setIsRecording(
          false
        );

        setIsProcessing(
          false
        );

        setIsLiveMode(
          false
        );

        setStatus(
          "cancelled"
        );

        setStatusMessage(
          "Recording yahagaritswe."
        );

        if (
          recorder &&
          recorder.__antimateClock
        ) {
          clearInterval(
            recorder.__antimateClock
          );
        }

        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "antimate:voice:cancel"
          );
        }

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
        clearAllTimers,
        releaseWakeLock,
        stopMediaTracks,
      ]
    );

  // ==========================================================
  // POINTER DOWN
  // ==========================================================

  const handleRecordPointerDown =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          isProcessing ||
          isPlaying ||
          !socketConnected
        ) {
          return;
        }

        if (
          isRecordingRef.current
        ) {
          return;
        }

        pointerDownRef.current =
          true;

        // --------------------------------------------------
        // After 900ms => live mode
        // --------------------------------------------------

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          setTimeout(
            () => {
              if (
                pointerDownRef.current &&
                !isRecordingRef.current
              ) {
                console.log(
                  "🎙️ HOLD detected -> LIVE MODE"
                );

                startRecording(
                  true
                );
              }
            },
            HOLD_TO_LIVE_MS
          );
      },
      [
        clearTimeout,
        isProcessing,
        isPlaying,
        socketConnected,
        startRecording,
      ]
    );

  // ==========================================================
  // POINTER UP
  // ==========================================================

  const handleRecordPointerUp =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          !pointerDownRef.current
        ) {
          return;
        }

        pointerDownRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        // --------------------------------------------------
        // If already recording:
        //
        // live -> stop when released
        // --------------------------------------------------

        if (
          isRecordingRef.current
        ) {
          stopRecording();

          return;
        }

        // --------------------------------------------------
        // Short click:
        //
        // Start recording then automatically stop
        // after 1.8 seconds.
        // --------------------------------------------------

        console.log(
          "🎤 SHORT CLICK -> 1.8s recording"
        );

        startRecording(
          false
        );

        clearTimeout(
          shortRecordTimerRef.current
        );

        shortRecordTimerRef.current =
          setTimeout(
            () => {
              if (
                isRecordingRef.current &&
                !isLiveModeRef.current
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

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

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
        const clean =
          text.trim();

        if (!clean) {
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

        setStatus(
          "processing"
        );

        setStatusMessage(
          "ANTIMATE iri gutekereza..."
        );

        setIsProcessing(
          true
        );

        startThinkingAnimation();

        addUserMessage(
          clean
        );

        try {
          const response =
            await fetch(
              CHAT_URL,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                credentials:
                  "include",

                body:
                  JSON.stringify({
                    message:
                      clean,

                    language:
                      "rw",
                  }),
              }
            );

          let data = {};

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
                "ANTIMATE ntiyashoboye gusubiza."
            );
          }

          const answer =
            data.answer ||
            data.answer_rw ||
            data.answer_kinyarwanda ||
            data.message ||
            data.text ||
            "";

          if (!answer) {
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

          stopThinkingAnimation();

          const audio =
            data.audio_url ||
            data.audioUrl ||
            data.audio ||
            data.voice_url ||
            data.voiceUrl;

          if (audio) {
            await playAudio(
              audio
            );
          } else {
            setStatus(
              "complete"
            );

            setStatusMessage(
              "ANTIMATE yarangije gusubiza."
            );
          }
        } catch (
          error
        ) {
          console.error(
            "🔥 Text chat error:",
            error
          );

          stopThinkingAnimation();

          setErrorMessage(
            error?.message ||
              "ANTIMATE ntiyashoboye gusubiza."
          );

          setStatus(
            "error"
          );

          setStatusMessage(
            error?.message ||
              "Habaye ikibazo."
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
        startThinkingAnimation,
        stopThinkingAnimation,
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
  // STOP LIVE MODE
  // ==========================================================

  const stopLiveMode =
    useCallback(
      () => {
        autoContinueLiveRef.current =
          false;

        isLiveModeRef.current =
          false;

        setIsLiveMode(
          false
        );

        if (
          isRecordingRef.current
        ) {
          stopRecording();
        }

        setStatusMessage(
          "Live Voice yahagaritswe."
        );
      },
      [stopRecording]
    );

  // ==========================================================
  // FINAL CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      clearAllTimers();

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.__antimateClock
      ) {
        clearInterval(
          recorder.__antimateClock
        );
      }

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

      autoContinueLiveRef.current =
        false;

      voiceSessionActiveRef.current =
        false;

      releaseWakeLock();
    };
  }, [
    clearAllTimers,
    releaseWakeLock,
    stopMediaTracks,
  ]);

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const buttonDisabled =
    isProcessing ||
    isPlaying ||
    !socketConnected;

  const recordButtonText =
    isRecording
      ? isLiveMode
        ? "LIVE"
        : "STOP"
      : "MIC";

  const connectionText =
    socketConnected
      ? "Online"
      : "Connecting...";

  const modeLabel =
    processingMode === "cpu"
      ? "CPU"
      : processingMode ===
        "gpu"
      ? "GPU"
      : null;

  // ==========================================================
  // INLINE STYLES
  // ==========================================================

  const styles = useMemo(
    () => ({
      page: {
        minHeight:
          "100vh",

        width:
          "100%",

        background:
          "linear-gradient(180deg, #07111f 0%, #0b1727 45%, #07101d 100%)",

        color:
          "#f8fafc",

        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

        display:
          "flex",

        flexDirection:
          "column",

        overflow:
          "hidden",
      },

      header: {
        height:
          "70px",

        minHeight:
          "70px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        padding:
          "0 22px",

        borderBottom:
          "1px solid rgba(255,255,255,.07)",

        background:
          "rgba(7,17,31,.78)",

        backdropFilter:
          "blur(18px)",

        position:
          "sticky",

        top:
          0,

        zIndex:
          20,
      },

      brand: {
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "11px",
      },

      logo: {
        width:
          "38px",

        height:
          "38px",

        borderRadius:
          "50%",

        position:
          "relative",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        background:
          "conic-gradient(from 0deg, #22d3ee, #6366f1, #a855f7, #22d3ee)",

        boxShadow:
          "0 0 24px rgba(99,102,241,.38)",

        animation:
          "antimateLogoSpin 7s linear infinite",
      },

      logoInner: {
        width:
          "24px",

        height:
          "24px",

        borderRadius:
          "50%",

        background:
          "#07111f",

        boxShadow:
          "inset 0 0 12px rgba(34,211,238,.2)",
      },

      title: {
        margin:
          0,

        fontSize:
          "15px",

        fontWeight:
          800,

        letterSpacing:
          ".08em",
      },

      subtitle: {
        display:
          "block",

        marginTop:
          "2px",

        fontSize:
          "10px",

        color:
          "#7f91a8",

        letterSpacing:
          ".05em",
      },

      connection: {
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "7px",

        fontSize:
          "11px",

        color:
          socketConnected
            ? "#86efac"
            : "#fbbf24",
      },

      connectionDot: {
        width:
          "7px",

        height:
          "7px",

        borderRadius:
          "50%",

        background:
          socketConnected
            ? "#22c55e"
            : "#f59e0b",

        boxShadow:
          socketConnected
            ? "0 0 10px rgba(34,197,94,.8)"
            : "0 0 10px rgba(245,158,11,.7)",
      },

      main: {
        width:
          "100%",

        maxWidth:
          "920px",

        margin:
          "0 auto",

        padding:
          "24px 18px 28px",

        flex:
          1,

        display:
          "flex",

        flexDirection:
          "column",

        minHeight:
          "calc(100vh - 70px)",
      },

      chat: {
        flex:
          1,

        overflowY:
          "auto",

        padding:
          "8px 2px 22px",

        display:
          "flex",

        flexDirection:
          "column",

        scrollBehavior:
          "smooth",
      },

      empty: {
        flex:
          1,

        minHeight:
          "420px",

        display:
          "flex",

        flexDirection:
          "column",

        justifyContent:
          "center",

        alignItems:
          "center",

        textAlign:
          "center",

        padding:
          "30px",
      },

      emptyLogo: {
        width:
          "76px",

        height:
          "76px",

        borderRadius:
          "50%",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        background:
          "conic-gradient(from 0deg, #22d3ee, #6366f1, #a855f7, #22d3ee)",

        boxShadow:
          "0 0 45px rgba(99,102,241,.35)",

        animation:
          "antimateLogoSpin 7s linear infinite",

        marginBottom:
          "22px",
      },

      emptyLogoInner: {
        width:
          "54px",

        height:
          "54px",

        borderRadius:
          "50%",

        background:
          "#0a1524",

        border:
          "1px solid rgba(255,255,255,.07)",
      },

      emptyTitle: {
        fontSize:
          "25px",

        margin:
          "0 0 9px",

        fontWeight:
          800,
      },

      emptyText: {
        margin:
          0,

        color:
          "#8ea0b6",

        fontSize:
          "14px",

        maxWidth:
          "430px",

        lineHeight:
          1.7,
      },

      messages: {
        display:
          "flex",

        flexDirection:
          "column",

        gap:
          "14px",

        width:
          "100%",
      },

      messageRow: {
        display:
          "flex",

        width:
          "100%",
      },

      userRow: {
        justifyContent:
          "flex-end",
      },

      assistantRow: {
        justifyContent:
          "flex-start",
      },

      assistantAvatar: {
        width:
          "29px",

        height:
          "29px",

        flex:
          "0 0 29px",

        borderRadius:
          "50%",

        marginRight:
          "9px",

        marginTop:
          "2px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        background:
          "conic-gradient(from 0deg, #22d3ee, #6366f1, #a855f7, #22d3ee)",

        boxShadow:
          "0 0 15px rgba(99,102,241,.25)",
      },

      avatarInner: {
        width:
          "19px",

        height:
          "19px",

        borderRadius:
          "50%",

        background:
          "#091423",
      },

      bubble: {
        maxWidth:
          "min(76%, 650px)",

        padding:
          "12px 15px",

        borderRadius:
          "17px",

        fontSize:
          "14px",

        lineHeight:
          1.65,

        whiteSpace:
          "pre-wrap",

        wordBreak:
          "break-word",
      },

      userBubble: {
        background:
          "linear-gradient(135deg, #2563eb, #4f46e5)",

        color:
          "#fff",

        borderBottomRightRadius:
          "5px",

        boxShadow:
          "0 8px 25px rgba(37,99,235,.18)",
      },

      assistantBubble: {
        background:
          "rgba(255,255,255,.055)",

        border:
          "1px solid rgba(255,255,255,.075)",

        color:
          "#e5edf7",

        borderBottomLeftRadius:
          "5px",

        boxShadow:
          "0 8px 25px rgba(0,0,0,.12)",
      },

      mode: {
        fontSize:
          "9px",

        color:
          "#71849a",

        marginTop:
          "4px",

        letterSpacing:
          ".08em",

        textTransform:
          "uppercase",
      },

      transcript: {
        marginTop:
          "15px",

        padding:
          "11px 13px",

        borderRadius:
          "13px",

        background:
          "rgba(34,211,238,.055)",

        border:
          "1px solid rgba(34,211,238,.12)",
      },

      transcriptLabel: {
        fontSize:
          "10px",

        color:
          "#22d3ee",

        fontWeight:
          700,
      },

      transcriptText: {
        margin:
          "4px 0 0",

        color:
          "#b7c6d8",

        fontSize:
          "13px",

        lineHeight:
          1.55,
      },

      thinking: {
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "9px",

        margin:
          "12px 0",

        padding:
          "10px 13px",

        width:
          "fit-content",

        borderRadius:
          "12px",

        background:
          "rgba(255,255,255,.04)",

        color:
          "#93a6bc",

        fontSize:
          "12px",
      },

      thinkingDots: {
        display:
          "flex",

        gap:
          "3px",
      },

      dot: {
        width:
          "5px",

        height:
          "5px",

        borderRadius:
          "50%",

        background:
          "#22d3ee",

        animation:
          "antimateDot 1.1s infinite ease-in-out",
      },

      currentAnswer: {
        marginTop:
          "10px",

        padding:
          "12px 14px",

        borderRadius:
          "14px",

        background:
          "rgba(99,102,241,.045)",

        border:
          "1px solid rgba(99,102,241,.08)",

        color:
          "#d8e3ef",

        fontSize:
          "13px",

        lineHeight:
          1.65,

        whiteSpace:
          "pre-wrap",
      },

      status: {
        minHeight:
          "38px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        gap:
          "8px",

        fontSize:
          "11px",

        color:
          "#8193a8",

        marginBottom:
          "10px",
      },

      statusDot: {
        width:
          "6px",

        height:
          "6px",

        borderRadius:
          "50%",

        background:
          isRecording
            ? "#ef4444"
            : isProcessing
            ? "#f59e0b"
            : isPlaying
            ? "#22d3ee"
            : "#64748b",

        boxShadow:
          isRecording
            ? "0 0 12px rgba(239,68,68,.8)"
            : isProcessing
            ? "0 0 12px rgba(245,158,11,.7)"
            : "none",
      },

      modeBadge: {
        padding:
          "3px 7px",

        borderRadius:
          "999px",

        background:
          "rgba(255,255,255,.055)",

        color:
          "#73869b",

        fontSize:
          "9px",

        fontWeight:
          700,

        letterSpacing:
          ".08em",
      },

      error: {
        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "10px",

        padding:
          "10px 12px",

        marginBottom:
          "10px",

        borderRadius:
          "12px",

        background:
          "rgba(239,68,68,.08)",

        border:
          "1px solid rgba(239,68,68,.18)",

        color:
          "#fca5a5",

        fontSize:
          "12px",
      },

      errorButton: {
        border:
          "none",

        background:
          "transparent",

        color:
          "#fca5a5",

        fontSize:
          "20px",

        cursor:
          "pointer",

        lineHeight:
          1,
      },

      composer: {
        display:
          "flex",

        alignItems:
          "flex-end",

        gap:
          "9px",

        padding:
          "9px",

        borderRadius:
          "21px",

        background:
          "rgba(255,255,255,.045)",

        border:
          "1px solid rgba(255,255,255,.09)",

        boxShadow:
          "0 15px 40px rgba(0,0,0,.18)",

        backdropFilter:
          "blur(16px)",
      },

      textarea: {
        flex:
          1,

        resize:
          "none",

        minHeight:
          "42px",

        maxHeight:
          "120px",

        padding:
          "11px 9px",

        border:
          "none",

        outline:
          "none",

        background:
          "transparent",

        color:
          "#f1f5f9",

        fontSize:
          "14px",

        lineHeight:
          1.45,

        fontFamily:
          "inherit",
      },

      textareaDisabled: {
        opacity:
          ".55",
      },

      sendButton: {
        width:
          "43px",

        height:
          "43px",

        flex:
          "0 0 43px",

        border:
          "none",

        borderRadius:
          "14px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        cursor:
          "pointer",

        fontSize:
          "20px",

        color:
          "#fff",

        background:
          text.trim()
            ? "linear-gradient(135deg,#2563eb,#6366f1)"
            : "rgba(255,255,255,.07)",

        opacity:
          text.trim() &&
          !isProcessing &&
          !isRecording
            ? 1
            : .45,

        transition:
          "all .2s ease",
      },

      recordButton: {
        width:
          "43px",

        height:
          "43px",

        flex:
          "0 0 43px",

        border:
          "none",

        borderRadius:
          "14px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        cursor:
          buttonDisabled
            ? "not-allowed"
            : "pointer",

        color:
          "#fff",

        background:
          isRecording
            ? isLiveMode
              ? "linear-gradient(135deg,#dc2626,#7f1d1d)"
              : "linear-gradient(135deg,#ef4444,#be123c)"
            : "rgba(255,255,255,.075)",

        border:
          isRecording
            ? "1px solid rgba(248,113,113,.3)"
            : "1px solid rgba(255,255,255,.07)",

        boxShadow:
          isRecording
            ? "0 0 24px rgba(239,68,68,.3)"
            : "none",

        opacity:
          buttonDisabled
            ? .45
            : 1,

        transition:
          "all .2s ease",

        touchAction:
          "none",

        userSelect:
          "none",

        WebkitUserSelect:
          "none",
      },

      recordIcon: {
        fontSize:
          isRecording
            ? "14px"
            : "18px",

        fontWeight:
          800,

        letterSpacing:
          ".03em",
      },

      liveBadge: {
        position:
          "absolute",

        top:
          "-26px",

        left:
          "50%",

        transform:
          "translateX(-50%)",

        padding:
          "4px 8px",

        borderRadius:
          "999px",

        background:
          "rgba(239,68,68,.12)",

        border:
          "1px solid rgba(239,68,68,.22)",

        color:
          "#fca5a5",

        fontSize:
          "9px",

        fontWeight:
          800,

        letterSpacing:
          ".1em",

        whiteSpace:
          "nowrap",
      },

      help: {
        textAlign:
          "center",

        color:
          "#66788d",

        fontSize:
          "10px",

        marginTop:
          "8px",

        lineHeight:
          1.5,
      },

      voiceWrapper: {
        position:
          "relative",

        display:
          "flex",

        justifyContent:
          "center",

        margin:
          "0 0 8px",
      },
    }),
    [
      socketConnected,
      isRecording,
      isProcessing,
      isPlaying,
      isLiveMode,
      buttonDisabled,
      text,
    ]
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={styles.page}>

      {/* ====================================================
          GLOBAL ANIMATIONS
      ==================================================== */}

      <style>
        {`
          @keyframes antimateLogoSpin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes antimateDot {
            0%, 100% {
              opacity: .25;
              transform: translateY(0);
            }

            50% {
              opacity: 1;
              transform: translateY(-3px);
            }
          }

          @keyframes antimatePulse {
            0% {
              box-shadow: 0 0 0 0 rgba(239,68,68,.35);
            }

            70% {
              box-shadow: 0 0 0 12px rgba(239,68,68,0);
            }

            100% {
              box-shadow: 0 0 0 0 rgba(239,68,68,0);
            }
          }

          * {
            box-sizing: border-box;
          }

          textarea::placeholder {
            color: #61738a;
          }

          ::-webkit-scrollbar {
            width: 5px;
          }

          ::-webkit-scrollbar-track {
            background: transparent;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,.1);
            border-radius: 10px;
          }

          @media (max-width: 640px) {
            .antimate-responsive-main {
              padding-left: 11px !important;
              padding-right: 11px !important;
              padding-top: 12px !important;
            }
          }
        `}
      </style>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header style={styles.header}>

        <div style={styles.brand}>

          <div style={styles.logo}>
            <div style={styles.logoInner} />
          </div>

          <div>
            <h1 style={styles.title}>
              ANTIMATE AI
            </h1>

            <span style={styles.subtitle}>
              Kinyarwanda Voice AI
            </span>
          </div>

        </div>

        <div style={styles.connection}>

          <span
            style={
              styles.connectionDot
            }
          />

          {connectionText}

        </div>

      </header>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main
        className="antimate-responsive-main"
        style={styles.main}
      >

        {/* ==================================================
            CHAT
        ================================================== */}

        <section style={styles.chat}>

          {messages.length === 0 && (
            <div style={styles.empty}>

              <div
                style={
                  styles.emptyLogo
                }
              >
                <div
                  style={
                    styles.emptyLogoInner
                  }
                />
              </div>

              <h2
                style={
                  styles.emptyTitle
                }
              >
                Muraho, ndi ANTIMATE
              </h2>

              <p
                style={
                  styles.emptyText
                }
              >
                Vuga cyangwa wandike ubutumwa
                mu Kinyarwanda. Nshobora kugufasha
                gusobanura ibibazo, gutanga inama,
                no gukorana nawe mu buryo bw'amajwi.
              </p>

            </div>
          )}

          <div style={styles.messages}>

            {messages.map(
              (message) => {
                const isUser =
                  message.role ===
                  "user";

                return (
                  <div
                    key={
                      message.id
                    }
                    style={{
                      ...styles.messageRow,
                      ...(isUser
                        ? styles.userRow
                        : styles.assistantRow),
                    }}
                  >

                    {!isUser && (
                      <div
                        style={
                          styles.assistantAvatar
                        }
                      >
                        <div
                          style={
                            styles.avatarInner
                          }
                        />
                      </div>
                    )}

                    <div>

                      <div
                        style={{
                          ...styles.bubble,
                          ...(isUser
                            ? styles.userBubble
                            : styles.assistantBubble),
                        }}
                      >
                        {message.text}
                      </div>

                      {!isUser &&
                        message.mode && (
                          <div
                            style={
                              styles.mode
                            }
                          >
                            {message.mode ===
                            "cpu"
                              ? "CPU"
                              : "GPU"}
                          </div>
                        )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {/* =================================================
              TRANSCRIPT
          ================================================= */}

          {transcript && (
            <div
              style={
                styles.transcript
              }
            >
              <span
                style={
                  styles.transcriptLabel
                }
              >
                WAVUZE
              </span>

              <p
                style={
                  styles.transcriptText
                }
              >
                {transcript}
              </p>
            </div>
          )}

          {/* =================================================
              THINKING
          ================================================= */}

          {isProcessing &&
            thinkingText && (
              <div
                style={
                  styles.thinking
                }
              >

                <div
                  style={
                    styles.thinkingDots
                  }
                >
                  <span
                    style={{
                      ...styles.dot,
                      animationDelay:
                        "0ms",
                    }}
                  />

                  <span
                    style={{
                      ...styles.dot,
                      animationDelay:
                        "160ms",
                    }}
                  />

                  <span
                    style={{
                      ...styles.dot,
                      animationDelay:
                        "320ms",
                    }}
                  />
                </div>

                <span>
                  {thinkingText}
                </span>

                {modeLabel && (
                  <span
                    style={
                      styles.modeBadge
                    }
                  >
                    {modeLabel}
                  </span>
                )}

              </div>
            )}

          {/* =================================================
              CURRENT ANSWER
          ================================================= */}

          {currentAnswer && (
            <div
              style={
                styles.currentAnswer
              }
            >
              {currentAnswer}
            </div>
          )}

        </section>

        {/* ==================================================
            STATUS
        ================================================== */}

        <div
          style={
            styles.status
          }
        >

          <span
            style={
              styles.statusDot
            }
          />

          <span>
            {statusMessage}
          </span>

          {recordingSeconds >
            0 &&
            isRecording && (
              <span
                style={
                  styles.modeBadge
                }
              >
                {recordingSeconds}s
              </span>
            )}

          {isLiveMode &&
            isRecording && (
              <span
                style={
                  styles.modeBadge
                }
              >
                LIVE
              </span>
            )}

          {modeLabel && (
            <span
              style={
                styles.modeBadge
              }
            >
              {modeLabel}
            </span>
          )}

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {errorMessage && (
          <div
            style={
              styles.error
            }
          >

            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={
                clearError
              }
              style={
                styles.errorButton
              }
            >
              ×
            </button>

          </div>
        )}

        {/* ==================================================
            COMPOSER
        ================================================== */}

        <section
          style={
            styles.composer
          }
        >

          {/* =================================================
              TEXT
          ================================================= */}

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
              isRecording
            }
            style={{
              ...styles.textarea,

              ...(isProcessing ||
              isRecording
                ? styles.textareaDisabled
                : {}),
            }}
          />

          {/* =================================================
              SEND
          ================================================= */}

          {text.trim() ? (
            <button
              type="button"
              onClick={
                sendTextMessage
              }
              disabled={
                !text.trim() ||
                isProcessing ||
                isRecording
              }
              style={
                styles.sendButton
              }
              aria-label="Send"
            >
              ➤
            </button>
          ) : (
            /* ===============================================
               VOICE BUTTON
            =============================================== */

            <div
              style={
                styles.voiceWrapper
              }
            >

              {isLiveMode &&
                isRecording && (
                  <div
                    style={
                      styles.liveBadge
                    }
                  >
                    LIVE VOICE
                  </div>
                )}

              <button
                type="button"
                disabled={
                  buttonDisabled
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
                onContextMenu={(
                  event
                ) =>
                  event.preventDefault()
                }
                style={{
                  ...styles.recordButton,

                  ...(isRecording
                    ? {
                        animation:
                          "antimatePulse 1.5s infinite",
                      }
                    : {}),
                }}
                aria-label={
                  isRecording
                    ? "Stop recording"
                    : "Record voice"
                }
              >
                <span
                  style={
                    styles.recordIcon
                  }
                >
                  {recordButtonText ===
                  "STOP"
                    ? "■"
                    : recordButtonText ===
                      "LIVE"
                    ? "■"
                    : "🎙"}
                </span>
              </button>

            </div>
          )}

        </section>

        {/* ==================================================
            HELP
        ================================================== */}

        <div
          style={
            styles.help
          }
        >
          {isRecording
            ? isLiveMode
              ? "Live Voice: reka button uhagarike kugira ngo wohereze ibyo wavuze."
              : "Recording: ANTIMATE iri kumva..."
            : text.trim()
            ? "Kanda ➤ cyangwa Enter wohereze ubutumwa."
            : "Kanda gato = 1.8s • Fata button = Live Voice"}
        </div>

      </main>
    </div>
  );
}