// ============================================================
// ANTIMATE AI — FRONTEND
// SOCKET.IO VOICE STREAMING
// ============================================================
//
// BACKEND SOCKET EVENTS:
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
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import "./AntimateAI.css";

// ============================================================
// CONFIG
// ============================================================

// IMPORTANT:
// If your frontend and backend are deployed separately,
// put the backend URL in VITE_API_URL.
//
// Example:
// VITE_API_URL=https://your-backend.onrender.com
//
// If frontend is served by the same backend, leave it empty.

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

// Socket.IO normally connects to the backend root.
// Example:
// https://your-backend.onrender.com
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_URL ||
  window.location.origin;

// HTTP fallback endpoint
const CHAT_URL =
  `${API_URL}/api/antimate/chat`;

const VOICE_URL =
  `${API_URL}/api/antimate/voice`;

// ============================================================
// MEDIA SETTINGS
// ============================================================

const HOLD_TO_RECORD_MS = 450;

const MAX_RECORDING_MS =
  Number(
    import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

// MediaRecorder timeslice.
// Smaller value = more immediate streaming.
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
      // Ignore unsupported browser errors.
    }
  }

  return "";
}

function extensionFromMimeType(mimeType) {
  const mime =
    String(mimeType || "").toLowerCase();

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

function getAudioUrl(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
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

  if (url.startsWith("file://")) {
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

  const audioChunksRef =
    useRef([]);

  const recordingStartedAtRef =
    useRef(0);

  const holdTimerRef =
    useRef(null);

  const autoStopTimerRef =
    useRef(null);

  const isHoldingRef =
    useRef(false);

  const isRecordingRef =
    useRef(false);

  // ==========================================================
  // AUDIO PLAYBACK
  // ==========================================================

  const audioRef =
    useRef(null);

  // ==========================================================
  // CHAT
  // ==========================================================

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  // ==========================================================
  // CONNECTION
  // ==========================================================

  const [socketConnected, setSocketConnected] =
    useState(false);

  // ==========================================================
  // VOICE STATE
  // ==========================================================

  const [isRecording, setIsRecording] =
    useState(false);

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [status, setStatus] =
    useState("ready");

  const [statusMessage, setStatusMessage] =
    useState("Kanda microphone utangire kuvuga.");

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
  // CONNECT SOCKET.IO
  // ==========================================================

  useEffect(() => {
    const socket = io(
      SOCKET_URL,
      {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 20000,
      }
    );

    socketRef.current = socket;

    // --------------------------------------------------------
    // CONNECT
    // --------------------------------------------------------

    socket.on("connect", () => {
      console.log(
        "🔌 ANTIMATE Socket connected:",
        socket.id
      );

      setSocketConnected(true);

      setErrorMessage("");

      setStatus("ready");

      setStatusMessage(
        "ANTIMATE yiteguye kumva."
      );
    });

    // --------------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------------

    socket.on(
      "disconnect",
      (reason) => {
        console.warn(
          "🔌 ANTIMATE Socket disconnected:",
          reason
        );

        setSocketConnected(false);

        if (!isRecordingRef.current) {
          setStatus("disconnected");

          setStatusMessage(
            "Connection yacitse. Ngerageza kongera kuyihuza..."
          );
        }
      }
    );

    // --------------------------------------------------------
    // CONNECT ERROR
    // --------------------------------------------------------

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "❌ ANTIMATE Socket connection error:",
          error
        );

        setSocketConnected(false);

        setErrorMessage(
          "ANTIMATE server ntabwo iri kuboneka."
        );
      }
    );

    // ========================================================
    // antimate:status
    // ========================================================

    socket.on(
      "antimate:status",
      (data = {}) => {
        console.log(
          "📡 antimate:status",
          data
        );

        const nextStatus =
          data.status || "ready";

        setStatus(nextStatus);

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
          setIsRecording(true);
          isRecordingRef.current =
            true;
        }

        if (
          nextStatus ===
            "converting" ||
          nextStatus ===
            "processing" ||
          nextStatus ===
            "gpu_fallback" ||
          nextStatus ===
            "uploaded" ||
          nextStatus ===
            "receiving"
        ) {
          setIsProcessing(true);
        }

        if (
          nextStatus ===
          "cancelled"
        ) {
          setIsRecording(false);
          setIsProcessing(false);

          isRecordingRef.current =
            false;
        }
      }
    );

    // ========================================================
    // antimate:transcript
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
          setTranscript(value);
        }
      }
    );

    // ========================================================
    // antimate:thinking
    // ========================================================

    socket.on(
      "antimate:thinking",
      (data = {}) => {
        console.log(
          "🧠 antimate:thinking",
          data
        );

        setIsProcessing(true);

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
    // antimate:answer
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
          "";

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        if (answer) {
          setCurrentAnswer(
            answer
          );
        }
      }
    );

    // ========================================================
    // antimate:answer:chunk
    // ========================================================

    socket.on(
      "antimate:answer:chunk",
      (data = {}) => {
        console.log(
          "🧩 antimate:answer:chunk",
          data
        );

        const chunk =
          data.chunk || "";

        if (!chunk) {
          return;
        }

        setCurrentAnswer(
          (previous) =>
            data.done
              ? chunk
              : previous + chunk
        );
      }
    );

    // ========================================================
    // antimate:audio
    // ========================================================

    socket.on(
      "antimate:audio",
      (data = {}) => {
        console.log(
          "🔊 antimate:audio",
          data
        );

        const rawUrl =
          getAudioUrl(
            data.audio_url ||
              data.audioUrl ||
              data.audio
          );

        const audioUrl =
          makeAbsoluteUrl(
            rawUrl
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
      }
    );

    // ========================================================
    // antimate:complete
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
          "";

        if (
          data.processing_mode
        ) {
          setProcessingMode(
            data.processing_mode
          );
        }

        if (answer) {
          setCurrentAnswer(
            answer
          );
        }

        setIsProcessing(false);

        setIsRecording(false);

        isRecordingRef.current =
          false;

        setStatus("complete");

        setStatusMessage(
          "ANTIMATE yarangije gusubiza."
        );

        // Add voice response to chat
        if (answer) {
          addAssistantMessage(
            answer,
            data.processing_mode ||
              processingMode ||
              "gpu"
          );
        }

        // ----------------------------------------------------
        // IMPORTANT:
        // After answer is completed and audio is played,
        // mic can be opened again by starting a new recording.
        // ----------------------------------------------------
      }
    );

    // ========================================================
    // antimate:error
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

        setIsRecording(false);

        setIsProcessing(false);

        isRecordingRef.current =
          false;

        setStatus("error");

        setStatusMessage(
          message
        );

        stopMediaTracks();
      }
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");

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
  }, []);

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

        setMessages(
          (previous) => {
            // Prevent duplicate answer when complete
            // event fires after answer event.
            const last =
              previous[
                previous.length - 1
              ];

            if (
              last?.role ===
                "assistant" &&
              last?.text ===
                message.trim()
            ) {
              return previous;
            }

            return [
              ...previous,
              {
                id:
                  `assistant-${Date.now()}-${Math.random()}`,
                role:
                  "assistant",
                text:
                  message.trim(),
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
  // STOP MEDIA TRACKS
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

          audioRef.current =
            audio;

          audio.preload =
            "auto";

          audio.onplay =
            () => {
              setIsPlaying(true);
              setStatus("speaking");
              setStatusMessage(
                "ANTIMATE iri kuvuga..."
              );
            };

          audio.onended =
            () => {
              setIsPlaying(false);
              setStatus("ready");
              setStatusMessage(
                "ANTIMATE yiteguye kongera kumva."
              );

              audioRef.current =
                null;

              // Cleanly release microphone resources.
              stopMediaTracks();
            };

          audio.onerror =
            () => {
              console.error(
                "❌ Audio playback failed."
              );

              setIsPlaying(false);

              setStatus("ready");

              setStatusMessage(
                "Igisubizo cyabonetse ariko audio ntiyakinze."
              );

              audioRef.current =
                null;
            };

          await audio.play();
        } catch (error) {
          console.error(
            "❌ Could not play ANTIMATE audio:",
            error
          );

          setIsPlaying(false);
        }
      },
      [stopMediaTracks]
    );

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

          setStatus("error");

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

        try {
          setErrorMessage("");

          setTranscript("");

          setThinkingText("");

          setCurrentAnswer("");

          audioChunksRef.current =
            [];

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

          const mimeType =
            getSupportedMimeType();

          let recorder;

          try {
            recorder =
              mimeType
                ? new MediaRecorder(
                    stream,
                    {
                      mimeType,
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
            mimeType ||
            "audio/webm";

          const extension =
            extensionFromMimeType(
              actualMimeType
            );

          // ----------------------------------------------------
          // Start backend session FIRST
          // ----------------------------------------------------

          socket.emit(
            "antimate:voice:start",
            {
              mimeType:
                actualMimeType,
              extension,
              language: "rw",
            }
          );

          // ----------------------------------------------------
          // MediaRecorder data
          // ----------------------------------------------------

          recorder.ondataavailable =
            (event) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              audioChunksRef.current.push(
                event.data
              );

              if (
                socket.connected &&
                isRecordingRef.current
              ) {
                // Socket.IO can serialize Blob,
                // but ArrayBuffer is more predictable.
                event.data
                  .arrayBuffer()
                  .then(
                    (arrayBuffer) => {
                      if (
                        socket.connected &&
                        isRecordingRef.current
                      ) {
                        socket.emit(
                          "antimate:voice:chunk",
                          arrayBuffer
                        );
                      }
                    }
                  )
                  .catch(
                    (error) => {
                      console.error(
                        "❌ Audio chunk conversion error:",
                        error
                      );
                    }
                  );
              }
            };

          recorder.onerror =
            (event) => {
              console.error(
                "❌ MediaRecorder error:",
                event
              );

              setErrorMessage(
                "Microphone recording habayemo ikibazo."
              );

              setStatus("error");

              isRecordingRef.current =
                false;

              setIsRecording(false);

              try {
                socket.emit(
                  "antimate:voice:cancel"
                );
              } catch {}

              stopMediaTracks();
            };

          recorder.onstop =
            () => {
              console.log(
                "🎙️ MediaRecorder stopped."
              );

              stopMediaTracks();
            };

          // ----------------------------------------------------
          // Start recording
          // ----------------------------------------------------

          isRecordingRef.current =
            true;

          setIsRecording(true);

          setStatus("recording");

          setStatusMessage(
            "ANTIMATE iri kumva..."
          );

          recordingStartedAtRef.current =
            Date.now();

          recorder.start(
            CHUNK_INTERVAL_MS
          );

          // ----------------------------------------------------
          // Maximum recording timeout
          // ----------------------------------------------------

          clearTimeout(
            autoStopTimerRef.current
          );

          autoStopTimerRef.current =
            setTimeout(() => {
              if (
                isRecordingRef.current
              ) {
                stopRecording();
              }
            }, MAX_RECORDING_MS);
        } catch (error) {
          console.error(
            "🔥 Microphone error:",
            error
          );

          setErrorMessage(
            error?.message ||
              "Microphone ntiyashoboye gufunguka."
          );

          setStatus("error");

          isRecordingRef.current =
            false;

          setIsRecording(false);

          stopMediaTracks();
        }
      },
      [
        isProcessing,
        isPlaying,
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

        isRecordingRef.current =
          false;

        setIsRecording(false);

        setIsProcessing(true);

        setStatus("uploaded");

        setStatusMessage(
          "Audio yakiriwe. ANTIMATE iri gutekereza..."
        );

        // ------------------------------------------------------
        // Stop MediaRecorder.
        //
        // IMPORTANT:
        // MediaRecorder's final dataavailable event may fire
        // immediately before onstop. We therefore wait for
        // onstop before telling backend voice:end.
        // ------------------------------------------------------

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          recorder.onstop =
            () => {
              console.log(
                "🎙️ Final recording chunk ready."
              );

              stopMediaTracks();

              // ------------------------------------------------
              // Tell backend that all chunks are finished.
              // ------------------------------------------------

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
      [stopMediaTracks]
    );

  // ==========================================================
  // CANCEL RECORDING
  // ==========================================================

  const cancelRecording =
    useCallback(
      () => {
        clearTimeout(
          autoStopTimerRef.current
        );

        autoStopTimerRef.current =
          null;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        isRecordingRef.current =
          false;

        setIsRecording(false);

        setIsProcessing(false);

        setStatus("cancelled");

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
      },
      [stopMediaTracks]
    );

  // ==========================================================
  // HOLD START
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
          setTimeout(() => {
            if (
              isHoldingRef.current
            ) {
              startRecording();
            }
          }, HOLD_TO_RECORD_MS);
      },
      [
        isProcessing,
        isPlaying,
        startRecording,
      ]
    );

  // ==========================================================
  // HOLD END
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
        // If recording has already started,
        // release = stop recording.
        // ------------------------------------------------------

        if (
          isRecordingRef.current
        ) {
          stopRecording();
          return;
        }

        // ------------------------------------------------------
        // Short click:
        // Start a short recording and automatically stop it.
        //
        // This preserves the normal "click record" behavior.
        // ------------------------------------------------------

        if (wasHolding) {
          startRecording();

          setTimeout(() => {
            if (
              isRecordingRef.current
            ) {
              stopRecording();
            }
          }, 1800);
        }
      },
      [
        startRecording,
        stopRecording,
      ]
    );

  // ==========================================================
  // POINTER CANCEL / LEAVE
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

        if (
          isRecordingRef.current
        ) {
          stopRecording();
        }
      },
      [stopRecording]
    );

  // ==========================================================
  // SEND TEXT MESSAGE
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
          isRecording
        ) {
          return;
        }

        setText("");

        setErrorMessage("");

        setStatus("processing");

        setIsProcessing(true);

        setStatusMessage(
          "ANTIMATE iri gutekereza..."
        );

        addUserMessage(
          cleanText
        );

        try {
          // ----------------------------------------------------
          // Prefer Socket.IO for voice only.
          // Text uses existing HTTP endpoint.
          // ----------------------------------------------------

          const response =
            await fetch(
              CHAT_URL,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify(
                  {
                    message:
                      cleanText,
                    language:
                      "rw",
                  }
                ),
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

          // ----------------------------------------------------
          // HTTP chat can also return audio_url.
          // ----------------------------------------------------

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

          setStatus("error");

          setStatusMessage(
            error?.message ||
              "Habaye ikibazo."
          );
        } finally {
          setIsProcessing(false);
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
  // TEXT ENTER
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
      [sendTextMessage]
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
        setStatus("ready");

        setStatusMessage(
          "ANTIMATE yiteguye kumva."
        );
      }
    }, [
      isRecording,
      isProcessing,
      isPlaying,
    ]);

  // ==========================================================
  // CLEANUP WHEN COMPONENT UNMOUNTS
  // ==========================================================

  useEffect(() => {
    return () => {
      clearTimeout(
        holdTimerRef.current
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
      }

      if (
        audioRef.current
      ) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
  }, []);

  // ==========================================================
  // DERIVED STATE
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
            <h1>ANTIMATE AI</h1>

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
          {messages.length === 0 && (
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

          {/* =================================================
              LIVE TRANSCRIPT
          ================================================= */}

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

          {/* =================================================
              THINKING
          ================================================= */}

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

          {/* =================================================
              CURRENT ANSWER
          ================================================= */}

          {currentAnswer &&
            isProcessing && (
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
            VOICE CONTROL
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
              ? "Reka button uhagarike recording"
              : "Kanda gato cyangwa uyifateho uvuge"}
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