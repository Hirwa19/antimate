// ============================================================
// ANTIMATE AI — CLEAN PROFESSIONAL FRONTEND
// ============================================================
//
// FEATURES
// ------------------------------------------------------------
// • Text chat
// • Socket.IO voice streaming
// • Kinyarwanda voice interaction
// • Short tap = short voice recording
// • Hold = continuous recording
// • Automatic audio playback
// • Wake Lock
// • GPU / CPU indicator
// • Reconnecting Socket.IO
// • ONE SMART ACTION BUTTON
// • Responsive desktop + mobile UI
//
// BACKEND SOCKET EVENTS
// ------------------------------------------------------------
// CLIENT:
//   antimate:voice:start
//   antimate:voice:chunk
//   antimate:voice:end
//   antimate:voice:cancel
//
// SERVER:
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

const SHORT_RECORDING_MS = 1800;

const HOLD_THRESHOLD_MS = 450;

const MAX_RECORDING_MS =
  Number(
    import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

const CHUNK_INTERVAL_MS = 250;

// ============================================================
// HELPERS
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
      // ignore
    }
  }

  return "";
}

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
// ANTIMATE LOGO
// ============================================================

function AntimateLogo({
  small = false,
}) {
  return (
    <div
      className={
        small
          ? "antimate-logo small"
          : "antimate-logo"
      }
      aria-hidden="true"
    >
      <span className="logo-core" />
      <span className="logo-ring ring-one" />
      <span className="logo-ring ring-two" />
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
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

  const recordingStartedAtRef =
    useRef(0);

  const holdTimerRef =
    useRef(null);

  const shortStopTimerRef =
    useRef(null);

  const maxRecordingTimerRef =
    useRef(null);

  const isRecordingRef =
    useRef(false);

  const isHoldingRef =
    useRef(false);

  const wakeLockRef =
    useRef(null);

  const voiceSessionActiveRef =
    useRef(false);

  const audioRef =
    useRef(null);

  const liveAssistantIdRef =
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
    status,
    setStatus,
  ] = useState("ready");

  const [
    statusMessage,
    setStatusMessage,
  ] = useState(
    "Andika cyangwa kanda microphone."
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
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);

  // ==========================================================
  // DERIVED
  // ==========================================================

  const isTyping =
    text.trim().length > 0;

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
        } catch {
          // Wake Lock is optional.
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
  // ADD / UPDATE ASSISTANT
  // ==========================================================

  const updateAssistant =
    useCallback(
      (
        answer,
        mode = "gpu"
      ) => {
        const clean =
          String(
            answer || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => {
            const existingId =
              liveAssistantIdRef.current;

            if (!existingId) {
              const id =
                `assistant-live-${Date.now()}-${Math.random()}`;

              liveAssistantIdRef.current =
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
                existingId
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

  const finalizeAssistant =
    useCallback(
      (
        answer,
        mode = "gpu"
      ) => {
        const clean =
          String(
            answer || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => {
            const existingId =
              liveAssistantIdRef.current;

            if (
              existingId
            ) {
              return previous.map(
                (message) =>
                  message.id ===
                  existingId
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

        liveAssistantIdRef.current =
          null;
      },
      []
    );

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const playAudio =
    useCallback(
      async (url) => {
        if (!url) {
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
            new Audio(url);

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

              setStatus(
                "ready"
              );

              setStatusMessage(
                "ANTIMATE yiteguye."
              );

              // Voice session can remain active
              // for future live mode implementation.
              if (
                !voiceSessionActiveRef.current
              ) {
                releaseWakeLock();
              }
            };

          audio.onerror =
            () => {
              setIsPlaying(
                false
              );

              audioRef.current =
                null;

              setStatus(
                "ready"
              );

              setStatusMessage(
                "Igisubizo cyabonetse."
              );
            };

          await audio.play();
        } catch (error) {
          console.error(
            "❌ Audio playback error:",
            error
          );

          setIsPlaying(
            false
          );
        }
      },
      [
        releaseWakeLock,
      ]
    );

  // ==========================================================
  // SOCKET CONNECTION
  // ==========================================================

  useEffect(() => {
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

          withCredentials: true,
        }
      );

    socketRef.current =
      socket;

    // ========================================================
    // CONNECT
    // ========================================================

    const handleConnect =
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
          !isProcessing &&
          !isPlaying
        ) {
          setStatus(
            "ready"
          );

          setStatusMessage(
            "Andika cyangwa kanda microphone."
          );
        }
      };

    // ========================================================
    // DISCONNECT
    // ========================================================

    const handleDisconnect =
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
            "Connection yacitse. Ndongera kuyihuza..."
          );
        }
      };

    // ========================================================
    // CONNECT ERROR
    // ========================================================

    const handleConnectError =
      (error) => {
        console.error(
          "❌ Socket error:",
          error
        );

        setSocketConnected(
          false
        );

        setErrorMessage(
          "ANTIMATE server ntabwo iri kuboneka."
        );
      };

    // ========================================================
    // STATUS
    // ========================================================

    const handleStatus =
      (data = {}) => {
        console.log(
          "📡 ANTIMATE status:",
          data
        );

        const nextStatus =
          data.status ||
          "ready";

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

        setStatus(
          nextStatus
        );

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
            "converting",
            "processing",
            "uploaded",
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

          stopMediaTracks();

          releaseWakeLock();
        }
      };

    // ========================================================
    // TRANSCRIPT
    // ========================================================

    const handleTranscript =
      (data = {}) => {
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
      };

    // ========================================================
    // THINKING
    // ========================================================

    const handleThinking =
      (data = {}) => {
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
      };

    // ========================================================
    // ANSWER
    // ========================================================

    const handleAnswer =
      (data = {}) => {
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

        if (!answer) {
          return;
        }

        setProcessingMode(
          mode
        );

        setThinkingText("");

        updateAssistant(
          answer,
          mode
        );
      };

    // ========================================================
    // ANSWER CHUNK
    // ========================================================

    const handleAnswerChunk =
      (data = {}) => {
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

        setThinkingText("");

        // ----------------------------------------------------
        // Build the streamed answer from the existing message
        // ----------------------------------------------------

        setMessages(
          (previous) => {
            const existingId =
              liveAssistantIdRef.current;

            if (!existingId) {
              const id =
                `assistant-live-${Date.now()}-${Math.random()}`;

              liveAssistantIdRef.current =
                id;

              return [
                ...previous,
                {
                  id,
                  role: "assistant",
                  text: chunk,
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
                existingId
                  ? {
                      ...message,
                      text:
                        message.text +
                        chunk,
                      mode,
                      live: true,
                    }
                  : message
            );
          }
        );
      };

    // ========================================================
    // AUDIO
    // ========================================================

    const handleAudio =
      (data = {}) => {
        const raw =
          getAudioUrl(
            data.audio_url ||
              data.audioUrl ||
              data.audio
          );

        const audioUrl =
          makeAbsoluteUrl(
            raw
          );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        if (audioUrl) {
          playAudio(
            audioUrl
          );
        }
      };

    // ========================================================
    // COMPLETE
    // ========================================================

    const handleComplete =
      (data = {}) => {
        console.log(
          "✅ ANTIMATE complete:",
          data
        );

        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          "";

        const mode =
          data.mode ||
          data.processing_mode ||
          "gpu";

        if (
          data.mode ||
          data.processing_mode
        ) {
          setProcessingMode(
            mode
          );
        }

        if (answer) {
          finalizeAssistant(
            answer,
            mode
          );
        } else {
          setMessages(
            (previous) =>
              previous.map(
                (message) =>
                  message.id ===
                  liveAssistantIdRef.current
                    ? {
                        ...message,
                        live: false,
                      }
                    : message
              )
          );

          liveAssistantIdRef.current =
            null;
        }

        setIsProcessing(
          false
        );

        setIsRecording(
          false
        );

        isRecordingRef.current =
          false;

        setThinkingText("");

        setStatus(
          "complete"
        );

        setStatusMessage(
          "ANTIMATE yarangije gusubiza."
        );
      };

    // ========================================================
    // ERROR
    // ========================================================

    const handleError =
      (data = {}) => {
        console.error(
          "🔥 ANTIMATE error:",
          data
        );

        const message =
          data.message ||
          data.error ||
          "ANTIMATE habayemo ikibazo.";

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
      };

    // ========================================================
    // REGISTER
    // ========================================================

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleConnectError
    );

    socket.on(
      "antimate:status",
      handleStatus
    );

    socket.on(
      "antimate:transcript",
      handleTranscript
    );

    socket.on(
      "antimate:thinking",
      handleThinking
    );

    socket.on(
      "antimate:answer",
      handleAnswer
    );

    socket.on(
      "antimate:answer:chunk",
      handleAnswerChunk
    );

    socket.on(
      "antimate:audio",
      handleAudio
    );

    socket.on(
      "antimate:complete",
      handleComplete
    );

    socket.on(
      "antimate:error",
      handleError
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleConnectError
      );

      socket.off(
        "antimate:status",
        handleStatus
      );

      socket.off(
        "antimate:transcript",
        handleTranscript
      );

      socket.off(
        "antimate:thinking",
        handleThinking
      );

      socket.off(
        "antimate:answer",
        handleAnswer
      );

      socket.off(
        "antimate:answer:chunk",
        handleAnswerChunk
      );

      socket.off(
        "antimate:audio",
        handleAudio
      );

      socket.off(
        "antimate:complete",
        handleComplete
      );

      socket.off(
        "antimate:error",
        handleError
      );

      socket.disconnect();

      socketRef.current =
        null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // RECORDING TIMER
  // ==========================================================

  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(
        0
      );
      return;
    }

    const interval =
      setInterval(() => {
        const elapsed =
          Date.now() -
          recordingStartedAtRef.current;

        setRecordingSeconds(
          Math.floor(
            elapsed / 1000
          )
        );
      }, 250);

    return () =>
      clearInterval(
        interval
      );
  }, [
    isRecording,
  ]);

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording =
    useCallback(
      async () => {
        if (
          isRecordingRef.current ||
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
            "ANTIMATE server ntabwo ihujwe."
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

          setThinkingText("");

          liveAssistantIdRef.current =
            null;

          voiceSessionActiveRef.current =
            true;

          await requestWakeLock();

          // --------------------------------------------------
          // GET MICROPHONE
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

          const mimeType =
            recorder.mimeType ||
            preferredMime ||
            "audio/webm";

          const extension =
            extensionFromMimeType(
              mimeType
            );

          // --------------------------------------------------
          // START BACKEND VOICE SESSION
          // --------------------------------------------------

          socket.emit(
            "antimate:voice:start",
            {
              mimeType,
              extension,
              language: "rw",
            }
          );

          // --------------------------------------------------
          // AUDIO CHUNKS
          // --------------------------------------------------

          recorder.ondataavailable =
            (event) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              if (
                socket.connected &&
                isRecordingRef.current
              ) {
                event.data
                  .arrayBuffer()
                  .then(
                    (buffer) => {
                      if (
                        socket.connected &&
                        isRecordingRef.current
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
                      console.error(
                        "❌ Chunk error:",
                        error
                      );
                    }
                  );
              }
            };

          // --------------------------------------------------
          // RECORDER ERROR
          // --------------------------------------------------

          recorder.onerror =
            (event) => {
              console.error(
                "❌ MediaRecorder:",
                event
              );

              setErrorMessage(
                "Recording habayemo ikibazo."
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
          // START
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
          shortStopTimerRef.current
        );

        clearTimeout(
          maxRecordingTimerRef.current
        );

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

        // --------------------------------------------------
        // We keep voiceSessionActive true until processing
        // / audio response is finished.
        // --------------------------------------------------

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          recorder.onstop =
            () => {
              stopMediaTracks();

              if (
                socket &&
                socket.connected
              ) {
                socket.emit(
                  "antimate:voice:end"
                );
              }
            };

          try {
            recorder.stop();
          } catch {
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

        mediaRecorderRef.current =
          null;
      },
      [
        stopMediaTracks,
      ]
    );

  // ==========================================================
  // CANCEL RECORDING
  // ==========================================================

  const cancelRecording =
    useCallback(
      () => {
        clearTimeout(
          holdTimerRef.current
        );

        clearTimeout(
          shortStopTimerRef.current
        );

        clearTimeout(
          maxRecordingTimerRef.current
        );

        isHoldingRef.current =
          false;

        isRecordingRef.current =
          false;

        setIsRecording(
          false
        );

        setIsProcessing(
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
  // SMART ACTION BUTTON
  // ==========================================================

  const handleActionDown =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          isProcessing ||
          isPlaying
        ) {
          return;
        }

        // ----------------------------------------------------
        // TEXT MODE
        // ----------------------------------------------------

        if (
          isTyping
        ) {
          return;
        }

        if (
          !socketConnected
        ) {
          setErrorMessage(
            "ANTIMATE server ntabwo ihujwe."
          );

          return;
        }

        isHoldingRef.current =
          true;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          setTimeout(
            () => {
              if (
                isHoldingRef.current
              ) {
                startRecording();
              }
            },
            HOLD_THRESHOLD_MS
          );
      },
      [
        isProcessing,
        isPlaying,
        isTyping,
        socketConnected,
        startRecording,
      ]
    );

  // ==========================================================

  const handleActionUp =
    useCallback(
      (event) => {
        event.preventDefault();

        // ----------------------------------------------------
        // TEXT MODE
        // ----------------------------------------------------

        if (
          isTyping
        ) {
          return;
        }

        const wasHolding =
          isHoldingRef.current;

        isHoldingRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        // ----------------------------------------------------
        // ALREADY RECORDING
        // ----------------------------------------------------

        if (
          isRecordingRef.current
        ) {
          stopRecording();
          return;
        }

        // ----------------------------------------------------
        // SHORT CLICK
        // ----------------------------------------------------

        if (
          wasHolding
        ) {
          startRecording();

          clearTimeout(
            shortStopTimerRef.current
          );

          shortStopTimerRef.current =
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
        }
      },
      [
        isTyping,
        startRecording,
        stopRecording,
      ]
    );

  // ==========================================================

  const handleActionCancel =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          isTyping
        ) {
          return;
        }

        isHoldingRef.current =
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
      [
        isTyping,
        stopRecording,
      ]
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

        setThinkingText(
          "ANTIMATE iri gutekereza..."
        );

        setIsProcessing(
          true
        );

        setStatus(
          "processing"
        );

        setStatusMessage(
          "ANTIMATE iri gutekereza..."
        );

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

          addAssistantMessageSafe(
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

          if (audioUrl) {
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
            "🔥 Text chat:",
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
            "Habaye ikibazo mu gusubiza."
          );
        } finally {
          setIsProcessing(
            false
          );

          setThinkingText("");
        }
      },
      [
        text,
        isProcessing,
        isRecording,
        isPlaying,
        addUserMessage,
        playAudio,
      ]
    );

  // ==========================================================
  // SAFE ASSISTANT ADD
  // ==========================================================

  const addAssistantMessageSafe =
    useCallback(
      (
        answer,
        mode
      ) => {
        const clean =
          String(
            answer || ""
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
              last?.role ===
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
  // ENTER
  // ==========================================================

  const handleTextKeyDown =
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
      [
        sendTextMessage,
      ]
    );

  // ==========================================================
  // AUTO TEXTAREA HEIGHT
  // ==========================================================

  const handleTextChange =
    useCallback(
      (event) => {
        const value =
          event.target.value;

        setText(
          value
        );

        event.target.style.height =
          "auto";

        event.target.style.height =
          `${Math.min(
            event.target.scrollHeight,
            140
          )}px`;
      },
      []
    );

  // ==========================================================
  // CLOSE ERROR
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
            "Andika cyangwa kanda microphone."
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
  // ACTION BUTTON CONTENT
  // ==========================================================

  const actionButton =
    useMemo(
      () => {
        // -----------------------------------------------
        // PROCESSING
        // -----------------------------------------------

        if (
          isProcessing
        ) {
          return {
            icon: "• • •",
            label:
              "ANTIMATE iri gutekereza",
            type: "processing",
          };
        }

        // -----------------------------------------------
        // PLAYING
        // -----------------------------------------------

        if (
          isPlaying
        ) {
          return {
            icon: "■",
            label:
              "Hagarika amajwi",
            type: "playing",
          };
        }

        // -----------------------------------------------
        // RECORDING
        // -----------------------------------------------

        if (
          isRecording
        ) {
          return {
            icon: "■",
            label:
              "Hagarika recording",
            type: "recording",
          };
        }

        // -----------------------------------------------
        // TEXT
        // -----------------------------------------------

        if (
          isTyping
        ) {
          return {
            icon: "↑",
            label:
              "Ohereza ubutumwa",
            type: "send",
          };
        }

        // -----------------------------------------------
        // DEFAULT
        // -----------------------------------------------

        return {
          icon: "⌕",
          label:
            "Fata amajwi",
          type: "microphone",
        };
      },
      [
        isProcessing,
        isPlaying,
        isRecording,
        isTyping,
      ]
    );

  // ==========================================================
  // SMART BUTTON CLICK
  // ==========================================================

  const handleActionClick =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          isProcessing
        ) {
          return;
        }

        if (
          isPlaying
        ) {
          if (
            audioRef.current
          ) {
            try {
              audioRef.current.pause();
            } catch {}

            audioRef.current =
              null;
          }

          setIsPlaying(
            false
          );

          setStatus(
            "ready"
          );

          setStatusMessage(
            "ANTIMATE yiteguye."
          );

          return;
        }

        if (
          isTyping
        ) {
          sendTextMessage();
        }
      },
      [
        isProcessing,
        isPlaying,
        isTyping,
        sendTextMessage,
      ]
    );

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      clearTimeout(
        holdTimerRef.current
      );

      clearTimeout(
        shortStopTimerRef.current
      );

      clearTimeout(
        maxRecordingTimerRef.current
      );

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
  // RENDER
  // ==========================================================

  return (
    <div className="antimate-page">

      {/* ====================================================
          GLOBAL STYLE
      ==================================================== */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .antimate-page {
          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(
              circle at 15% 10%,
              rgba(59, 130, 246, 0.08),
              transparent 30%
            ),
            radial-gradient(
              circle at 85% 80%,
              rgba(16, 185, 129, 0.06),
              transparent 28%
            ),
            #f8fafc;
          color: #0f172a;
          display: flex;
          flex-direction: column;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .antimate-shell {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ==================================================
           HEADER
        ================================================== */

        .antimate-header {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid
            rgba(15, 23, 42, 0.07);
          background:
            rgba(248, 250, 252, 0.88);
          backdrop-filter: blur(18px);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .antimate-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .antimate-brand-title {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .antimate-brand-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
        }

        /* ==================================================
           LOGO
        ================================================== */

        .antimate-logo {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(
              135deg,
              #0f172a,
              #1e293b
            );
          box-shadow:
            0 8px 20px
            rgba(15, 23, 42, 0.18);
          overflow: hidden;
          flex-shrink: 0;
        }

        .antimate-logo.small {
          width: 30px;
          height: 30px;
          border-radius: 10px;
        }

        .logo-core {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #fff;
          position: relative;
          z-index: 3;
          box-shadow:
            0 0 14px
            rgba(255, 255, 255, 0.7);
        }

        .logo-ring {
          position: absolute;
          border: 1px solid
            rgba(255, 255, 255, 0.72);
          border-radius: 50%;
          transform: rotate(35deg);
        }

        .ring-one {
          width: 26px;
          height: 16px;
        }

        .ring-two {
          width: 16px;
          height: 28px;
        }

        .antimate-logo.small .logo-core {
          width: 8px;
          height: 8px;
        }

        .antimate-logo.small .ring-one {
          width: 20px;
          height: 12px;
        }

        .antimate-logo.small .ring-two {
          width: 12px;
          height: 21px;
        }

        /* ==================================================
           CONNECTION
        ================================================== */

        .connection-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #64748b;
        }

        .connection-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #94a3b8;
        }

        .connection-status.online {
          color: #15803d;
        }

        .connection-status.online
        .connection-dot {
          background: #22c55e;
          box-shadow:
            0 0 0 4px
            rgba(34, 197, 94, 0.1);
        }

        /* ==================================================
           MAIN
        ================================================== */

        .antimate-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .antimate-chat {
          flex: 1;
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
          padding: 32px 24px 150px;
        }

        /* ==================================================
           EMPTY STATE
        ================================================== */

        .antimate-empty {
          min-height: 55vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
        }

        .antimate-empty .antimate-logo {
          width: 62px;
          height: 62px;
          border-radius: 20px;
          margin-bottom: 20px;
        }

        .antimate-empty h2 {
          margin: 0;
          font-size: 27px;
          letter-spacing: -0.04em;
        }

        .antimate-empty p {
          margin: 9px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        /* ==================================================
           MESSAGES
        ================================================== */

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .message-row {
          display: flex;
          width: 100%;
          gap: 10px;
          animation:
            messageIn
            0.25s
            ease;
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform:
              translateY(5px);
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
          justify-content: flex-start;
          align-items: flex-start;
        }

        .assistant-avatar {
          margin-top: 2px;
        }

        .message-content {
          max-width: min(
            78%,
            680px
          );
        }

        .message-bubble {
          padding: 13px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-row.user
        .message-bubble {
          background: #0f172a;
          color: white;
          border-bottom-right-radius: 5px;
        }

        .message-row.assistant
        .message-bubble {
          background: white;
          border: 1px solid
            rgba(15, 23, 42, 0.07);
          color: #1e293b;
          border-bottom-left-radius: 5px;
          box-shadow:
            0 5px 20px
            rgba(15, 23, 42, 0.035);
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 6px;
          padding: 0 3px;
          font-size: 10px;
          color: #94a3b8;
        }

        .message-row.user
        .message-meta {
          justify-content: flex-end;
        }

        .message-mode {
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ==================================================
           TRANSCRIPT
        ================================================== */

        .voice-transcript {
          margin-top: 24px;
          padding: 13px 15px;
          border-left: 2px solid #94a3b8;
          background:
            rgba(148, 163, 184, 0.07);
          border-radius: 0 12px 12px 0;
        }

        .voice-transcript-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
        }

        .voice-transcript-text {
          margin: 5px 0 0;
          font-size: 13px;
          line-height: 1.55;
          color: #475569;
        }

        /* ==================================================
           THINKING
        ================================================== */

        .thinking {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 18px;
          color: #64748b;
          font-size: 13px;
        }

        .thinking-dots {
          display: flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #64748b;
          animation:
            thinking
            1.2s
            infinite;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes thinking {
          0%,
          60%,
          100% {
            opacity: 0.25;
            transform:
              translateY(0);
          }

          30% {
            opacity: 1;
            transform:
              translateY(-3px);
          }
        }

        /* ==================================================
           BOTTOM AREA
        ================================================== */

        .antimate-bottom {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          padding:
            14px 20px
            calc(
              14px +
              env(
                safe-area-inset-bottom
              )
            );
          background:
            linear-gradient(
              to top,
              rgba(248, 250, 252, 0.98),
              rgba(248, 250, 252, 0.92),
              rgba(248, 250, 252, 0)
            );
          pointer-events: none;
        }

        .bottom-inner {
          max-width: 820px;
          margin: 0 auto;
          pointer-events: auto;
        }

        /* ==================================================
           STATUS
        ================================================== */

        .status-line {
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-bottom: 8px;
          font-size: 11px;
          color: #64748b;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #94a3b8;
        }

        .status-line.recording
        .status-dot {
          background: #ef4444;
          box-shadow:
            0 0 0 5px
            rgba(239, 68, 68, 0.09);
          animation:
            pulse
            1s
            infinite;
        }

        .status-line.speaking
        .status-dot {
          background: #22c55e;
        }

        .status-line.processing
        .status-dot {
          background: #f59e0b;
          animation:
            pulse
            1.2s
            infinite;
        }

        @keyframes pulse {
          50% {
            opacity: 0.35;
            transform: scale(0.8);
          }
        }

        .status-mode {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 5px;
          background: #e2e8f0;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* ==================================================
           INPUT
        ================================================== */

        .input-shell {
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 7px;
          background:
            rgba(255, 255, 255, 0.96);
          border:
            1px solid
            rgba(15, 23, 42, 0.09);
          border-radius: 22px;
          box-shadow:
            0 10px 35px
            rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(18px);
        }

        .text-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          color: #0f172a;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          padding: 10px 9px;
          max-height: 140px;
        }

        .text-input::placeholder {
          color: #94a3b8;
        }

        /* ==================================================
           ONE ACTION BUTTON
        ================================================== */

        .smart-action {
          width: 45px;
          height: 45px;
          border: none;
          border-radius: 15px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          background: #0f172a;
          box-shadow:
            0 6px 18px
            rgba(15, 23, 42, 0.18);
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
          -webkit-tap-highlight-color:
            transparent;
          touch-action: manipulation;
          user-select: none;
        }

        .smart-action:hover {
          transform:
            translateY(-1px);
          box-shadow:
            0 9px 22px
            rgba(15, 23, 42, 0.22);
        }

        .smart-action:active {
          transform:
            scale(0.94);
        }

        .smart-action:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          transform: none;
        }

        .smart-action.microphone {
          background: #0f172a;
        }

        .smart-action.send {
          background: #2563eb;
        }

        .smart-action.recording {
          background: #dc2626;
          box-shadow:
            0 0 0 7px
            rgba(220, 38, 38, 0.09),
            0 8px 22px
            rgba(220, 38, 38, 0.2);
          animation:
            recordingButton
            1.5s
            infinite;
        }

        @keyframes recordingButton {
          50% {
            box-shadow:
              0 0 0 11px
              rgba(220, 38, 38, 0.04),
              0 8px 22px
              rgba(220, 38, 38, 0.15);
          }
        }

        .smart-action.processing {
          background: #475569;
          cursor: wait;
        }

        .smart-action.playing {
          background: #16a34a;
        }

        .action-icon {
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .processing-icon {
          font-size: 12px;
          letter-spacing: 2px;
          animation:
            processingDots
            1s
            infinite;
        }

        @keyframes processingDots {
          50% {
            opacity: 0.4;
          }
        }

        /* ==================================================
           RECORDING INFO
        ================================================== */

        .recording-info {
          position: absolute;
          bottom: 86px;
          left: 50%;
          transform:
            translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 11px;
          border-radius: 10px;
          background: #0f172a;
          color: white;
          font-size: 10px;
          white-space: nowrap;
          box-shadow:
            0 8px 24px
            rgba(15, 23, 42, 0.18);
        }

        .recording-time {
          font-variant-numeric:
            tabular-nums;
          font-weight: 700;
        }

        .recording-wave {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 15px;
        }

        .recording-wave span {
          width: 2px;
          height: 5px;
          border-radius: 2px;
          background: white;
          animation:
            wave
            0.8s
            infinite
            ease-in-out;
        }

        .recording-wave span:nth-child(2) {
          animation-delay: 0.1s;
          height: 10px;
        }

        .recording-wave span:nth-child(3) {
          animation-delay: 0.2s;
          height: 14px;
        }

        .recording-wave span:nth-child(4) {
          animation-delay: 0.3s;
          height: 8px;
        }

        .recording-wave span:nth-child(5) {
          animation-delay: 0.4s;
          height: 12px;
        }

        @keyframes wave {
          50% {
            transform:
              scaleY(0.45);
          }
        }

        /* ==================================================
           ERROR
        ================================================== */

        .error-message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          padding: 9px 12px;
          border-radius: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 11px;
        }

        .error-close {
          border: none;
          background: transparent;
          color: inherit;
          font-size: 17px;
          cursor: pointer;
          line-height: 1;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 700px) {
          .antimate-header {
            height: 62px;
            padding:
              0 15px;
          }

          .antimate-brand-title {
            font-size: 14px;
          }

          .antimate-brand-subtitle {
            font-size: 10px;
          }

          .antimate-logo {
            width: 35px;
            height: 35px;
            border-radius: 11px;
          }

          .connection-status {
            font-size: 10px;
          }

          .antimate-chat {
            padding:
              22px 13px 145px;
          }

          .message-content {
            max-width: 87%;
          }

          .message-bubble {
            font-size: 13px;
            padding:
              11px 13px;
          }

          .antimate-empty {
            min-height: 60vh;
          }

          .antimate-empty h2 {
            font-size: 23px;
          }

          .antimate-bottom {
            padding:
              10px 10px
              calc(
                10px +
                env(
                  safe-area-inset-bottom
                )
              );
          }

          .input-shell {
            border-radius: 19px;
            padding: 6px;
          }

          .text-input {
            font-size: 13px;
            padding: 10px 7px;
          }

          .smart-action {
            width: 43px;
            height: 43px;
            border-radius: 14px;
          }

          .recording-info {
            bottom: 76px;
          }
        }

        /* ==================================================
           DARK THEME
        ================================================== */

        @media (prefers-color-scheme: dark) {
          .antimate-page {
            background:
              radial-gradient(
                circle at 15% 10%,
                rgba(59, 130, 246, 0.08),
                transparent 30%
              ),
              #020617;
            color: #e2e8f0;
          }

          .antimate-header {
            background:
              rgba(2, 6, 23, 0.88);
            border-bottom-color:
              rgba(255,255,255,0.07);
          }

          .antimate-brand-subtitle,
          .connection-status {
            color: #64748b;
          }

          .antimate-empty p {
            color: #64748b;
          }

          .message-row.assistant
          .message-bubble {
            background: #0f172a;
            color: #e2e8f0;
            border-color:
              rgba(255,255,255,0.07);
          }

          .voice-transcript {
            background:
              rgba(255,255,255,0.03);
            border-color: #475569;
          }

          .voice-transcript-text {
            color: #94a3b8;
          }

          .antimate-bottom {
            background:
              linear-gradient(
                to top,
                rgba(2,6,23,0.99),
                rgba(2,6,23,0.94),
                rgba(2,6,23,0)
              );
          }

          .input-shell {
            background:
              rgba(15,23,42,0.96);
            border-color:
              rgba(255,255,255,0.08);
          }

          .text-input {
            color: #e2e8f0;
          }

          .text-input::placeholder {
            color: #64748b;
          }

          .thinking {
            color: #94a3b8;
          }

          .status-line {
            color: #64748b;
          }

          .status-mode {
            background: #1e293b;
            color: #94a3b8;
          }
        }
      `}</style>

      {/* ====================================================
          SHELL
      ==================================================== */}

      <div className="antimate-shell">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="antimate-header">

          <div className="antimate-brand">

            <AntimateLogo />

            <div className="antimate-brand-text">

              <span className="antimate-brand-title">
                ANTIMATE AI
              </span>

              <span className="antimate-brand-subtitle">
                Kinyarwanda AI Assistant
              </span>

            </div>

          </div>

          <div
            className={[
              "connection-status",
              socketConnected
                ? "online"
                : "offline",
            ].join(" ")}
          >
            <span className="connection-dot" />

            {socketConnected
              ? "Online"
              : "Connecting"}
          </div>

        </header>

        {/* ==================================================
            MAIN CHAT
        ================================================== */}

        <main className="antimate-main">

          <section className="antimate-chat">

            {/* ==============================================
                EMPTY
            ============================================== */}

            {messages.length === 0 && (
              <div className="antimate-empty">

                <AntimateLogo />

                <h2>
                  Muraho, ndi ANTIMATE.
                </h2>

                <p>
                  Andika ikibazo cyangwa
                  uvuge mu Kinyarwanda.
                </p>

              </div>
            )}

            {/* ==============================================
                MESSAGES
            ============================================== */}

            {messages.length > 0 && (
              <div className="messages-list">

                {messages.map(
                  (message) => (
                    <div
                      key={
                        message.id
                      }
                      className={[
                        "message-row",
                        message.role,
                      ].join(" ")}
                    >

                      {message.role ===
                        "assistant" && (
                        <div className="assistant-avatar">
                          <AntimateLogo
                            small
                          />
                        </div>
                      )}

                      <div className="message-content">

                        <div className="message-bubble">
                          {message.text}
                        </div>

                        {message.role ===
                          "assistant" &&
                          message.mode && (
                          <div className="message-meta">

                            <span className="message-mode">
                              {message.mode ===
                              "cpu"
                                ? "CPU"
                                : "GPU"}
                            </span>

                            {message.live && (
                              <span>
                                • live
                              </span>
                            )}

                          </div>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

            {/* ==============================================
                TRANSCRIPT
            ============================================== */}

            {transcript && (
              <div className="voice-transcript">

                <div className="voice-transcript-label">
                  Wavuze
                </div>

                <div className="voice-transcript-text">
                  {transcript}
                </div>

              </div>
            )}

            {/* ==============================================
                THINKING
            ============================================== */}

            {isProcessing && (
              <div className="thinking">

                <div className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span>
                  {thinkingText ||
                    "ANTIMATE iri gutekereza..."}
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
            )}

          </section>

        </main>

        {/* ==================================================
            BOTTOM CONTROL
        ================================================== */}

        <div className="antimate-bottom">

          <div className="bottom-inner">

            {/* ==============================================
                ERROR
            ============================================== */}

            {errorMessage && (
              <div className="error-message">

                <span>
                  {errorMessage}
                </span>

                <button
                  type="button"
                  className="error-close"
                  onClick={
                    clearError
                  }
                  aria-label="Close"
                >
                  ×
                </button>

              </div>
            )}

            {/* ==============================================
                STATUS
            ============================================== */}

            <div
              className={[
                "status-line",
                status,
              ].join(" ")}
            >

              <span className="status-dot" />

              <span>
                {isRecording
                  ? "ANTIMATE iri kumva..."
                  : isPlaying
                  ? "ANTIMATE iri kuvuga..."
                  : statusMessage}
              </span>

              {isRecording && (
                <span className="status-mode">
                  {recordingSeconds}s
                </span>
              )}

            </div>

            {/* ==============================================
                INPUT
            ============================================== */}

            <div className="input-shell">

              <textarea
                className="text-input"
                value={text}
                onChange={
                  handleTextChange
                }
                onKeyDown={
                  handleTextKeyDown
                }
                placeholder={
                  isRecording
                    ? "ANTIMATE iri kumva..."
                    : "Andika ubutumwa..."
                }
                rows={1}
                disabled={
                  isRecording ||
                  isProcessing
                }
              />

              {/* ============================================
                  ONE SMART BUTTON
              ============================================ */}

              <button
                type="button"
                className={[
                  "smart-action",
                  actionButton.type,
                ].join(" ")}

                disabled={
                  (
                    !isTyping &&
                    !isRecording &&
                    !isPlaying &&
                    !socketConnected
                  ) ||
                  isProcessing
                }

                onClick={
                  handleActionClick
                }

                onPointerDown={
                  !isTyping &&
                  !isPlaying &&
                  !isProcessing
                    ? handleActionDown
                    : undefined
                }

                onPointerUp={
                  !isTyping &&
                  !isPlaying &&
                  !isProcessing
                    ? handleActionUp
                    : undefined
                }

                onPointerCancel={
                  !isTyping &&
                  !isPlaying &&
                  !isProcessing
                    ? handleActionCancel
                    : undefined
                }

                onPointerLeave={
                  !isTyping &&
                  isRecording
                    ? handleActionCancel
                    : undefined
                }

                aria-label={
                  actionButton.label
                }

              >

                <span
                  className={
                    actionButton.type ===
                    "processing"
                      ? "action-icon processing-icon"
                      : "action-icon"
                  }
                >
                  {actionButton.icon}
                </span>

              </button>

            </div>

            {/* ==============================================
                RECORDING INFO
            ============================================== */}

            {isRecording && (
              <div className="recording-info">

                <div className="recording-wave">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <span>
                  Vuga...
                </span>

                <span className="recording-time">
                  {recordingSeconds}s
                </span>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}