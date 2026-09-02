// ============================================================
// ANTIMATE AI — PROFESSIONAL CHAT UI
// Socket.IO Voice + HTTP Text
// ============================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";
import "./AntimateAI.css";

// ============================================================
// CONFIG
// ============================================================

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_URL ||
  window.location.origin;

const CHAT_URL =
  `${API_URL}/api/antimate/chat`;

const HOLD_TO_RECORD_MS = 450;

const SHORT_RECORDING_MS = 1800;

const MAX_RECORDING_MS =
  Number(
    import.meta.env
      .VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

const CHUNK_INTERVAL_MS = 250;

// ============================================================
// HELPERS
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

  if (mime.includes("ogg")) {
    return ".ogg";
  }

  if (mime.includes("mp4")) {
    return ".mp4";
  }

  if (mime.includes("mpeg")) {
    return ".mp3";
  }

  return ".webm";
}

// ============================================================

function getAudioUrl(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
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

  if (url.startsWith("/")) {
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

  const recordingStartedAtRef =
    useRef(0);

  const holdTimerRef =
    useRef(null);

  const shortClickTimerRef =
    useRef(null);

  const autoStopTimerRef =
    useRef(null);

  const isHoldingRef =
    useRef(false);

  const isRecordingRef =
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
      "ANTIMATE yiteguye kugufasha."
    );

  const [processingMode, setProcessingMode] =
    useState(null);

  const [transcript, setTranscript] =
    useState("");

  const [thinkingText, setThinkingText] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  const messagesEndRef =
    useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "end",
      }
    );
  }, [
    messages,
    transcript,
    thinkingText,
  ]);

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
            !wakeLockRef.current
              .released
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
        } catch (error) {
          console.warn(
            "Wake Lock:",
            error
          );
        }
      },
      []
    );

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
  // ADD ASSISTANT MESSAGE
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
  // UPDATE STREAMING ASSISTANT
  // ==========================================================

  const updateStreamingAssistant =
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
              last?.role ===
                "assistant" &&
              last?.streaming
            ) {
              return previous.map(
                (message, index) =>
                  index ===
                    previous.length - 1
                    ? {
                        ...message,
                        text: clean,
                        mode,
                        streaming: true,
                      }
                    : message
              );
            }

            return [
              ...previous,
              {
                id:
                  `assistant-stream-${Date.now()}-${Math.random()}`,
                role: "assistant",
                text: clean,
                mode,
                streaming: true,
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
  // FINALIZE STREAM
  // ==========================================================

  const finalizeStreamingAssistant =
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
              last?.role ===
                "assistant" &&
              last?.streaming
            ) {
              return previous.map(
                (
                  message,
                  index
                ) =>
                  index ===
                    previous.length - 1
                    ? {
                        ...message,
                        text: clean,
                        mode,
                        streaming: false,
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
                streaming: false,
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
      async (rawUrl) => {
        const audioUrl =
          makeAbsoluteUrl(
            getAudioUrl(
              rawUrl
            )
          );

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

              setStatus(
                "ready"
              );

              setStatusMessage(
                "ANTIMATE yiteguye kongera kukumva."
              );

              audioRef.current =
                null;

              // Keep voice session available.
              // Microphone will be started again
              // only by the next user action.
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

              setStatus(
                "ready"
              );

              setStatusMessage(
                "Igisubizo cyabonetse ariko audio ntiyakinze."
              );

              audioRef.current =
                null;

              voiceSessionActiveRef.current =
                false;

              releaseWakeLock();
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
      ]
    );

  // ==========================================================
  // SOCKET.IO
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

          withCredentials:
            true,

          reconnection: true,

          reconnectionAttempts:
            Infinity,

          reconnectionDelay:
            1000,

          reconnectionDelayMax:
            5000,

          timeout: 20000,

          autoConnect: true,
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
            "ANTIMATE yiteguye kugufasha."
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
          "📡 ANTIMATE status:",
          data
        );

        const nextStatus =
          data.status ||
          "ready";

        setStatus(
          nextStatus
        );

        if (
          data.message
        ) {
          setStatusMessage(
            data.message
          );
        }

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
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
          "💬 ANTIMATE answer:",
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

        if (!answer) {
          return;
        }

        setThinkingText("");

        setProcessingMode(
          mode
        );

        updateStreamingAssistant(
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

        setThinkingText("");

        setIsProcessing(
          true
        );

        setProcessingMode(
          mode
        );

        setMessages(
          (previous) => {
            const last =
              previous[
                previous.length - 1
              ];

            let nextText =
              chunk;

            if (
              last?.role ===
                "assistant" &&
              last?.streaming
            ) {
              nextText =
                `${last.text}${chunk}`;
            }

            if (
              last?.role ===
                "assistant" &&
              last?.streaming
            ) {
              return previous.map(
                (
                  message,
                  index
                ) =>
                  index ===
                    previous.length - 1
                    ? {
                        ...message,
                        text: nextText,
                        mode,
                        streaming: true,
                      }
                    : message
              );
            }

            return [
              ...previous,
              {
                id:
                  `assistant-stream-${Date.now()}-${Math.random()}`,
                role: "assistant",
                text: nextText,
                mode,
                streaming: true,
                createdAt:
                  Date.now(),
              },
            ];
          }
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
          "🔊 ANTIMATE audio:",
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
          data.audio;

        if (raw) {
          playAudio(
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
          data.processing_mode ||
          data.mode ||
          "gpu";

        if (
          answer
        ) {
          finalizeStreamingAssistant(
            answer,
            mode
          );
        }

        setProcessingMode(
          mode
        );

        setIsProcessing(
          false
        );

        setIsRecording(
          false
        );

        isRecordingRef.current =
          false;

        setTranscript("");

        setThinkingText("");

        setStatus(
          "complete"
        );

        setStatusMessage(
          "ANTIMATE yarangije gusubiza."
        );
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
      socket.removeAllListeners();

      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [
    finalizeStreamingAssistant,
    playAudio,
    releaseWakeLock,
    requestWakeLock,
    stopMediaTracks,
    updateStreamingAssistant,
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
          !navigator.mediaDevices
            .getUserMedia
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

          voiceSessionActiveRef.current =
            true;

          await requestWakeLock();

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

          // ====================================================
          // BACKEND SESSION START
          // ====================================================

          socket.emit(
            "antimate:voice:start",
            {
              mimeType,
              extension,
              language: "rw",
            }
          );

          // ====================================================
          // AUDIO CHUNKS
          // ====================================================

          recorder.ondataavailable =
            async (event) => {
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
                "❌ MediaRecorder:",
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
            "ANTIMATE iri kumva..."
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
        isProcessing,
        isPlaying,
        MAX_RECORDING_MS,
        releaseWakeLock,
        requestWakeLock,
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

        clearTimeout(
          shortClickTimerRef.current
        );

        shortClickTimerRef.current =
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
          autoStopTimerRef.current
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

        setStatus(
          "ready"
        );

        setStatusMessage(
          "Recording yahagaritswe."
        );
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
      (event) => {
        event.preventDefault();

        if (
          isRecordingRef.current ||
          isProcessing ||
          isPlaying
        ) {
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
            HOLD_TO_RECORD_MS
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
      (event) => {
        event.preventDefault();

        const wasHolding =
          isHoldingRef.current;

        isHoldingRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        // ------------------------------------------------------
        // If recording already started:
        // Holding button -> release = stop.
        // ------------------------------------------------------

        if (
          isRecordingRef.current
        ) {
          stopRecording();
          return;
        }

        // ------------------------------------------------------
        // Short click:
        // Record approximately 1.8 seconds.
        // ------------------------------------------------------

        if (wasHolding) {
          startRecording();

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

        clearTimeout(
          shortClickTimerRef.current
        );

        if (
          isRecordingRef.current
        ) {
          stopRecording();
        }
      },
      [
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

        if (
          !clean ||
          isProcessing ||
          isRecording
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

        setThinkingText(
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

          setThinkingText("");

          addAssistantMessage(
            answer,
            mode
          );

          const rawAudio =
            data.audio_url ||
            data.audioUrl ||
            data.audio;

          const audioUrl =
            makeAbsoluteUrl(
              getAudioUrl(
                rawAudio
              )
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
            error?.message ||
              "Habaye ikibazo."
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
      [
        sendTextMessage,
      ]
    );

  // ==========================================================
  // CLEAR ERROR
  // ==========================================================

  const clearError =
    useCallback(() => {
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
          "ANTIMATE yiteguye kugufasha."
        );
      }
    }, [
      isRecording,
      isProcessing,
      isPlaying,
    ]);

  // ==========================================================
  // RECORD BUTTON STATE
  // ==========================================================

  const recordState =
    useMemo(() => {
      if (isRecording) {
        return "recording";
      }

      if (isProcessing) {
        return "processing";
      }

      if (isPlaying) {
        return "speaking";
      }

      return "idle";
    }, [
      isRecording,
      isProcessing,
      isPlaying,
    ]);

  // ==========================================================
  // CLEANUP
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
        autoStopTimerRef.current
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

      if (
        wakeLockRef.current
      ) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }

      voiceSessionActiveRef.current =
        false;
    };
  }, [
    stopMediaTracks,
  ]);

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

          <div className="antimate-brand-text">

            <strong>
              ANTIMATE
            </strong>

            <span>
              AI Assistant
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

          <span>
            {socketConnected
              ? "Online"
              : "Connecting"}
          </span>

        </div>

      </header>

      {/* ====================================================
          CHAT AREA
      ==================================================== */}

      <main className="antimate-main">

        <section className="antimate-chat">

          {/* ==================================================
              EMPTY STATE
          ================================================== */}

          {messages.length === 0 && (
            <div className="antimate-empty">

              <div className="antimate-empty-logo">
                <span />
              </div>

              <h1>
                Muraho 👋
              </h1>

              <p>
                Ndi <strong>ANTIMATE</strong>.
                <br />
                Vuga cyangwa wandike icyo ushaka
                kumenya.
              </p>

              <div className="antimate-suggestions">

                <button
                  type="button"
                  onClick={() =>
                    setText(
                      "Mpa inama zo kwita ku nkoko zanjye."
                    )
                  }
                >
                  🐔 Kwita ku nkoko
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setText(
                      "Ni gute nakurikirana ubushyuhe bwa brooder?"
                    )
                  }
                >
                  🌡️ Brooder
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setText(
                      "Mfasha kumenya ikibazo cy'inkoko zanjye."
                    )
                  }
                >
                  💡 Inama
                </button>

              </div>

            </div>
          )}

          {/* ==================================================
              MESSAGES
          ================================================== */}

          <div className="antimate-messages">

            {messages.map(
              (message) => (
                <div
                  key={
                    message.id
                  }
                  className={[
                    "antimate-message",
                    message.role,
                  ].join(" ")}
                >

                  {/* ==========================================
                      ASSISTANT AVATAR
                  ========================================== */}

                  {message.role ===
                    "assistant" && (
                    <div className="assistant-avatar">
                      <span />
                    </div>
                  )}

                  <div className="message-content">

                    <div className="message-bubble">

                      {message.text}

                      {message.streaming && (
                        <span className="streaming-cursor">
                          ▌
                        </span>
                      )}

                    </div>

                    {message.role ===
                      "assistant" &&
                      message.mode && (
                        <div className="message-meta">

                          <span>
                            ANTIMATE
                          </span>

                          <span className="mode-badge">
                            {message.mode ===
                            "cpu"
                              ? "CPU"
                              : "GPU"}
                          </span>

                        </div>
                      )}

                  </div>

                </div>
              )
            )}

            <div
              ref={
                messagesEndRef
              }
            />

          </div>

          {/* ==================================================
              TRANSCRIPT
          ================================================== */}

          {transcript && (
            <div className="antimate-transcript">

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

                <div className="assistant-avatar small">
                  <span />
                </div>

                <div className="thinking-box">

                  <div className="thinking-dots">
                    <i />
                    <i />
                    <i />
                  </div>

                  <span>
                    {thinkingText}
                  </span>

                </div>

              </div>
            )}

        </section>

        {/* ==================================================
            ERROR
        ================================================== */}

        {errorMessage && (
          <div className="antimate-error">

            <div>
              <strong>
                Habaye ikibazo
              </strong>

              <span>
                {errorMessage}
              </span>
            </div>

            <button
              type="button"
              onClick={
                clearError
              }
            >
              ×
            </button>

          </div>
        )}

        {/* ==================================================
            STATUS
        ================================================== */}

        <div className="antimate-status">

          <div
            className={[
              "status-dot",
              status,
            ].join(" ")}
          />

          <span>
            {isRecording
              ? "ANTIMATE iri kumva..."
              : isPlaying
              ? "ANTIMATE iri kuvuga..."
              : isProcessing
              ? "ANTIMATE iri gutekereza..."
              : statusMessage}
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
            COMPOSER
        ================================================== */}

        <section className="antimate-composer">

          <div className="composer-inner">

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
              placeholder="Andika ubutumwa..."
              rows={1}
              disabled={
                isProcessing ||
                isRecording
              }
              aria-label="Andika ubutumwa"
            />

            {/* =================================================
                RIGHT ACTION
            ================================================= */}

            <div className="composer-action">

              {text.trim() ? (

                <button
                  type="button"
                  className="send-button"
                  onClick={
                    sendTextMessage
                  }
                  disabled={
                    isProcessing ||
                    isRecording
                  }
                  aria-label="Ohereza ubutumwa"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M21.7 2.3a1 1 0 0 0-1.02-.24l-18 7a1 1 0 0 0 .05 1.88l7.2 2.4 2.4 7.2a1 1 0 0 0 .94.68h.08a1 1 0 0 0 .86-.6l7-18a1 1 0 0 0-.51-1.32ZM4.85 10l13.02-5.06-9.04 7.2L4.85 10Zm7.85 7.15-1.3-3.9 7.2-9.04-5.9 12.94Z"
                    />
                  </svg>
                </button>

              ) : (

                <button
                  type="button"
                  className={[
                    "voice-button",
                    recordState,
                  ].join(" ")}
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
                      : "Fata amajwi"
                  }
                >

                  <span className="voice-ripple one" />
                  <span className="voice-ripple two" />

                  {isRecording ? (

                    <span className="stop-icon">
                      <i />
                    </span>

                  ) : isPlaying ? (

                    <span className="speaker-icon">
                      🔊
                    </span>

                  ) : (

                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v6a3.5 3.5 0 0 0 3.5 3.5ZM17.5 12a5.5 5.5 0 0 1-11 0h1.8a3.7 3.7 0 1 0 7.4 0h1.8ZM11 19.7v2.3h2v-2.3a7.5 7.5 0 0 0 6.5-7.4h-1.8a5.7 5.7 0 0 1-11.4 0H4.5A7.5 7.5 0 0 0 11 19.7Z"
                      />
                    </svg>

                  )}

                </button>

              )}

            </div>

          </div>

          {/* =================================================
              VOICE HINT
          ================================================= */}

          <div className="composer-hint">

            {isRecording ? (
              <>
                <span className="live-dot" />
                Vuga ubu... kurekura button
                bihagarika recording.
              </>
            ) : (
              <>
                Kanda microphone cyangwa
                uyifateho kugira ngo uvuge.
              </>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}