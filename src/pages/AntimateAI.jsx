// ============================================================
// ANTIMATE AI — FRONTEND
// SOCKET.IO VOICE STREAMING
// ============================================================
//
// FEATURES
//
// TEXT
//   POST /api/antimate/chat
//
// VOICE
//   Socket.IO
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
// RECORDING
//
//   Short click
//      ↓
//   ~1.8 sec recording
//      ↓
//   send automatically
//
//   Hold
//      ↓
//   recording starts
//      ↓
//   if user keeps holding for ~5 sec
//      ↓
//   live mode
//
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import "./AntimateAI.css";

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
// RECORDING CONFIG
// ============================================================

const SHORT_RECORDING_MS = 1800;

// Hold this long to enter live mode
const LIVE_HOLD_MS = 5000;

// MediaRecorder chunk interval
const CHUNK_INTERVAL_MS = 250;

// Maximum normal recording
const MAX_RECORDING_MS =
  Number(
    import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

// Silence threshold for future/live logic
const SILENCE_MS = 1800;

// ============================================================
// MIME TYPE
// ============================================================

function getSupportedMimeType() {
  if (
    typeof MediaRecorder ===
    "undefined"
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
        MediaRecorder.isTypeSupported(
          type
        )
      ) {
        return type;
      }
    } catch {}
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
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    typeof value ===
    "object"
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
    url.startsWith(
      "blob:"
    )
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

  const audioChunksRef =
    useRef([]);

  // ==========================================================
  // RECORDING REFS
  // ==========================================================

  const recordingStartedAtRef =
    useRef(0);

  const isRecordingRef =
    useRef(false);

  const isHoldingRef =
    useRef(false);

  const liveModeRef =
    useRef(false);

  const voiceSessionActiveRef =
    useRef(false);

  const recordingSessionIdRef =
    useRef(null);

  // ==========================================================
  // TIMERS
  // ==========================================================

  const holdTimerRef =
    useRef(null);

  const shortClickTimerRef =
    useRef(null);

  const autoStopTimerRef =
    useRef(null);

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

  // ==========================================================
  // ANSWER REFS
  // ==========================================================

  const currentAnswerRef =
    useRef("");

  const liveAssistantMessageIdRef =
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

  // ==========================================================
  // SYNC ANSWER REF
  // ==========================================================

  useEffect(() => {
    currentAnswerRef.current =
      currentAnswer;
  }, [currentAnswer]);

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
  // VISIBILITY
  // ==========================================================

  useEffect(() => {
    const onVisibilityChange =
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
      onVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, [requestWakeLock]);

  // ==========================================================
  // STOP MEDIA TRACKS
  // ==========================================================

  const stopMediaTracks =
    useCallback(
      () => {
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
      },
      []
    );

  // ==========================================================
  // CLEAR TIMERS
  // ==========================================================

  const clearRecordingTimers =
    useCallback(
      () => {
        clearTimeout(
          holdTimerRef.current
        );

        clearTimeout(
          shortClickTimerRef.current
        );

        clearTimeout(
          autoStopTimerRef.current
        );

        holdTimerRef.current =
          null;

        shortClickTimerRef.current =
          null;

        autoStopTimerRef.current =
          null;
      },
      []
    );

  // ==========================================================
  // UPDATE LIVE MESSAGE
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
  // FINALIZE LIVE MESSAGE
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
  // ADD USER MESSAGE
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
  // ADD ASSISTANT MESSAGE
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

              // ------------------------------------------------
              // IMPORTANT:
              //
              // For normal voice:
              // session ends here.
              //
              // For live mode:
              // reopen microphone.
              // ------------------------------------------------

              if (
                liveModeRef.current &&
                voiceSessionActiveRef.current
              ) {
                setStatus(
                  "ready"
                );

                setStatusMessage(
                  "ANTIMATE yiteguye kongera kumva..."
                );

                setIsProcessing(
                  false
                );

                // Give browser a small delay
                // before reopening microphone.
                setTimeout(
                  () => {
                    if (
                      liveModeRef.current &&
                      voiceSessionActiveRef.current &&
                      !isRecordingRef.current
                    ) {
                      startRecording();
                    }
                  },
                  250
                );

                return;
              }

              setStatus(
                "complete"
              );

              setStatusMessage(
                "ANTIMATE yarangije gusubiza."
              );

              voiceSessionActiveRef.current =
                false;

              stopMediaTracks();

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

              setStatus(
                "error"
              );

              setStatusMessage(
                "Audio ntiyashoboye gukinwa."
              );

              if (
                !liveModeRef.current
              ) {
                voiceSessionActiveRef.current =
                  false;

                releaseWakeLock();
              }
            };

          await audio.play();
        } catch (error) {
          console.error(
            "❌ Audio play error:",
            error
          );

          setIsPlaying(
            false
          );
        }
      },
      [
        releaseWakeLock,
        stopMediaTracks,
      ]
    );

  // ==========================================================
  // CONNECT SOCKET — ONLY ONCE
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

          autoConnect:
            true,

          withCredentials:
            true,
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
        }

        if (
          [
            "converting",
            "processing",
            "gpu_fallback",
            "uploaded",
            "receiving",
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

        setThinkingText(
          data.text ||
            "ANTIMATE iri gutekereza..."
        );
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

        if (mode) {
          setProcessingMode(
            mode
          );
        }

        if (answer) {
          currentAnswerRef.current =
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

        setThinkingText("");

        currentAnswerRef.current =
          data.done
            ? chunk
            : currentAnswerRef.current +
              chunk;

        setCurrentAnswer(
          currentAnswerRef.current
        );

        updateLiveAssistantMessage(
          currentAnswerRef.current,
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
          "🔊 Audio:",
          data
        );

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
        } else {
          console.warn(
            "⚠️ No usable audio URL received"
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
          currentAnswerRef.current ||
          "";

        const mode =
          data.processing_mode ||
          data.mode ||
          "gpu";

        setProcessingMode(
          mode
        );

        if (answer) {
          currentAnswerRef.current =
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

        setThinkingText("");

        // ------------------------------------------------------
        // DO NOT kill voice session here.
        //
        // Audio may still be playing.
        // ------------------------------------------------------

        if (
          liveModeRef.current
        ) {
          setStatus(
            "speaking"
          );

          setStatusMessage(
            "ANTIMATE iri kuvuga..."
          );
        } else {
          setStatus(
            "complete"
          );

          setStatusMessage(
            "ANTIMATE yarangije gusubiza."
          );
        }
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

        liveModeRef.current =
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
      console.log(
        "🔌 Cleaning ANTIMATE Socket.IO"
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

      socketRef.current =
        null;
    };
  }, [
    requestWakeLock,
    releaseWakeLock,
    stopMediaTracks,
    playAudio,
    updateLiveAssistantMessage,
    finalizeLiveAssistantMessage,
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
          clearRecordingTimers();

          setErrorMessage("");

          setTranscript("");

          setThinkingText("");

          setCurrentAnswer("");

          currentAnswerRef.current =
            "";

          liveAssistantMessageIdRef.current =
            null;

          audioChunksRef.current =
            [];

          voiceSessionActiveRef.current =
            true;

          await requestWakeLock();

          // ====================================================
          // MICROPHONE
          // ====================================================

          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                audio: {
                  channelCount: 1,
                  echoCancellation:
                    true,
                  noiseSuppression:
                    true,
                  autoGainControl:
                    true,
                },

                video: false,
              }
            );

          mediaStreamRef.current =
            stream;

          // ====================================================
          // MIME
          // ====================================================

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

          // ====================================================
          // CREATE BACKEND SESSION
          // ====================================================

          const sessionId =
            `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

          recordingSessionIdRef.current =
            sessionId;

          console.log(
            "🎤 Starting ANTIMATE voice session:",
            sessionId
          );

          socket.emit(
            "antimate:voice:start",
            {
              sessionId,

              mimeType:
                actualMime,

              extension,

              language:
                "rw",
            }
          );

          // ====================================================
          // DATA AVAILABLE
          // ====================================================

          recorder.ondataavailable =
            async (event) => {
              if (
                !event.data ||
                event.data.size ===
                  0
              ) {
                return;
              }

              audioChunksRef.current.push(
                event.data
              );

              if (
                !socket.connected
              ) {
                console.warn(
                  "⚠️ Socket disconnected while sending audio"
                );

                return;
              }

              try {
                const buffer =
                  await event.data.arrayBuffer();

                if (
                  !buffer ||
                  buffer.byteLength ===
                    0
                ) {
                  return;
                }

                socket.emit(
                  "antimate:voice:chunk",
                  buffer
                );

                console.log(
                  "🎙️ Audio chunk sent:",
                  buffer.byteLength,
                  "bytes"
                );
              } catch (error) {
                console.error(
                  "❌ Audio chunk error:",
                  error
                );
              }
            };

          // ====================================================
          // RECORDER ERROR
          // ====================================================

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

          // ====================================================
          // START
          // ====================================================

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
            liveModeRef.current
              ? "ANTIMATE iri kumva..."
              : "ANTIMATE iri kumva..."
          );

          recordingStartedAtRef.current =
            Date.now();

          recorder.start(
            CHUNK_INTERVAL_MS
          );

          // ====================================================
          // MAX RECORDING
          // ====================================================

          clearTimeout(
            autoStopTimerRef.current
          );

          autoStopTimerRef.current =
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
        clearRecordingTimers,
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
          autoStopTimerRef.current
        );

        autoStopTimerRef.current =
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

        console.log(
          "🛑 Stopping ANTIMATE recording"
        );

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

        // ====================================================
        // FINAL CHUNK
        // ====================================================

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
              console.log(
                "🎙️ Final recording chunk ready"
              );

              finishSocketSession();
            };

          try {
            recorder.stop();
          } catch (error) {
            console.warn(
              "Recorder stop error:",
              error
            );

            finishSocketSession();
          }
        } else {
          finishSocketSession();
        }

        mediaRecorderRef.current =
          null;
      },
      [stopMediaTracks]
    );

  // ==========================================================
  // CANCEL
  // ==========================================================

  const cancelRecording =
    useCallback(
      () => {
        console.log(
          "❌ Cancelling ANTIMATE voice"
        );

        clearRecordingTimers();

        isHoldingRef.current =
          false;

        isRecordingRef.current =
          false;

        liveModeRef.current =
          false;

        voiceSessionActiveRef.current =
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

        releaseWakeLock();
      },
      [
        clearRecordingTimers,
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
          isRecordingRef.current ||
          isProcessing ||
          isPlaying
        ) {
          return;
        }

        // Important:
        // prevent pointer leave from cancelling
        // immediately on mobile/desktop.
        try {
          event.currentTarget.setPointerCapture(
            event.pointerId
          );
        } catch {}

        isHoldingRef.current =
          true;

        liveModeRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        // ====================================================
        // 5 SECOND HOLD -> LIVE MODE
        // ====================================================

        holdTimerRef.current =
          setTimeout(
            () => {
              if (
                !isHoldingRef.current
              ) {
                return;
              }

              console.log(
                "🎙️ LIVE VOICE MODE activated"
              );

              liveModeRef.current =
                true;

              setStatusMessage(
                "Live voice mode: vuga, ANTIMATE izahita ikumva..."
              );

              if (
                !isRecordingRef.current
              ) {
                startRecording();
              }
            },
            LIVE_HOLD_MS
          );
      },
      [
        clearRecordingTimers,
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
      (event) => {
        event.preventDefault();

        try {
          event.currentTarget.releasePointerCapture(
            event.pointerId
          );
        } catch {}

        const wasHolding =
          isHoldingRef.current;

        isHoldingRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        // ====================================================
        // IF RECORDING
        // ====================================================

        if (
          isRecordingRef.current
        ) {
          // Live mode:
          // releasing button should NOT necessarily
          // cancel the whole voice system.
          //
          // It simply sends current segment.
          if (
            liveModeRef.current
          ) {
            stopRecording();
            return;
          }

          // Normal hold/click recording
          stopRecording();

          return;
        }

        // ====================================================
        // SHORT CLICK
        // ====================================================

        if (
          wasHolding
        ) {
          liveModeRef.current =
            false;

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

          startRecording();
        }
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

        isHoldingRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        clearTimeout(
          shortClickTimerRef.current
        );

        shortClickTimerRef.current =
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
        const cleanText =
          text.trim();

        if (!cleanText) {
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

          let data = {};

          try {
            data =
              await response.json();
          } catch {}

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

          currentAnswerRef.current =
            answer;

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
  // FINAL CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      clearRecordingTimers();

      isHoldingRef.current =
        false;

      isRecordingRef.current =
        false;

      liveModeRef.current =
        false;

      voiceSessionActiveRef.current =
        false;

      const socket =
        socketRef.current;

      if (
        socket &&
        socket.connected
      ) {
        try {
          socket.emit(
            "antimate:voice:cancel"
          );
        } catch {}
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

      if (
        wakeLockRef.current
      ) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, [
    clearRecordingTimers,
    stopMediaTracks,
  ]);

  // ==========================================================
  // BUTTON CLASS
  // ==========================================================

  const recordButtonClass =
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

      liveModeRef.current
        ? "live-mode"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="antimate-ai">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="antimate-header">

        <div className="antimate-brand">

          <div className="antimate-logo">
            <span />
          </div>

          <div>
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

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="antimate-main">

        {/* ==================================================
            CHAT
        ================================================== */}

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
              )
            )}

          </div>

          {/* ==================================================
              TRANSCRIPT
          ================================================== */}

          {transcript && (
            <div className="antimate-live-transcript">

              <span>
                Wavuze:
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
              CURRENT ANSWER
          ================================================== */}

          {currentAnswer && (
            <div className="antimate-current-answer">
              {currentAnswer}
            </div>
          )}

        </section>

        {/* ==================================================
            STATUS
        ================================================== */}

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

        {/* ==================================================
            ERROR
        ================================================== */}

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

        {/* ==================================================
            VOICE
        ================================================== */}

        <section className="antimate-voice-control">

          <button
            type="button"
            className={
              recordButtonClass
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
            disabled={
              isProcessing ||
              isPlaying ||
              !socketConnected
            }
            aria-label={
              isRecording
                ? "Reka gufata amajwi"
                : "Fata amajwi"
            }
          >

            <span className="record-button-ring" />

            <span className="record-icon">

              {isRecording
                ? "■"
                : isPlaying
                ? "🔊"
                : "🎙️"}

            </span>

          </button>

          <div className="voice-help">

            {isRecording
              ? liveModeRef.current
                ? "Live voice: vuga, reka aho ushaka kohereza igice"
                : "Reka button uhagarike recording"
              : "Kanda gato = 1.8s • Fata ~5s = Live Voice"}

          </div>

        </section>

        {/* ==================================================
            TEXT INPUT
        ================================================== */}

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
              isRecording
            }
          />

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
            className="antimate-send-button"
            aria-label="Send message"
          >
            ➤
          </button>

        </section>

      </main>

    </div>
  );
}