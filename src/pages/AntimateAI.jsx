// ============================================================
// ANTIMATE AI — FRONTEND
// Backend-driven AI status
// Socket.IO + Text + Voice
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://brooder-backend.onrender.com";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_BASE;

// ============================================================
// HELPERS
// ============================================================

const createRequestId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const safeJson = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: response.ok,
      message: text,
    };
  }
};

const getBackendStatus = (data) => {
  if (!data) return "";

  const candidates = [
    data.status,
    data.backend_status,
    data.processing_status,
    data.ai_status,
    data.message_status,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // UI STATE
  // ----------------------------------------------------------

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveVoice, setIsLiveVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // IMPORTANT:
  // This is NO LONGER controlled by frontend thinking phrases.
  // Backend Socket.IO status will update it.
  const [thinkingText, setThinkingText] = useState("");

  const [language, setLanguage] = useState("rw");

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const socketRef = useRef(null);

  const activeRequestIdRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceAnimationRef = useRef(null);

  const recordingChunksRef = useRef([]);

  const recordingStartedAtRef = useRef(null);

  const silenceStartedAtRef = useRef(null);

  const isLiveVoiceRef = useRef(false);

  const isRecordingRef = useRef(false);

  const isSendingRef = useRef(false);

  const audioRef = useRef(null);

  // Prevent automatic reopening multiple times.
  const reopeningVoiceRef = useRef(false);

  // ----------------------------------------------------------
  // SYNC REFS
  // ----------------------------------------------------------

  useEffect(() => {
    isLiveVoiceRef.current = isLiveVoice;
  }, [isLiveVoice]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  // ==========================================================
  // SOCKET.IO
  // ==========================================================

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socketRef.current = socket;

    // --------------------------------------------------------
    // CONNECTED
    // --------------------------------------------------------

    socket.on("connect", () => {
      console.log(
        "✅ ANTIMATE Socket connected:",
        socket.id
      );
    });

    // --------------------------------------------------------
    // DISCONNECTED
    // --------------------------------------------------------

    socket.on("disconnect", (reason) => {
      console.log(
        "⚠️ ANTIMATE Socket disconnected:",
        reason
      );
    });

    // --------------------------------------------------------
    // BACKEND STATUS
    // --------------------------------------------------------
    //
    // Backend should send:
    //
    // socket.emit("antimate:status", {
    //   requestId,
    //   status: "🧠 Ndimo gusesengura ikibazo cyawe..."
    // });
    //
    // OR:
    //
    // socket.emit("antimate:status", {
    //   requestId,
    //   statusKey: "ANALYZING",
    //   status: "Analyzing your request..."
    // });
    //
    // --------------------------------------------------------

    const handleBackendStatus = (payload) => {
      if (!payload) return;

      const incomingRequestId =
        payload.requestId ||
        payload.request_id ||
        payload.id;

      const activeRequestId =
        activeRequestIdRef.current;

      // Ignore statuses belonging to another request.
      if (
        incomingRequestId &&
        activeRequestId &&
        incomingRequestId !== activeRequestId
      ) {
        return;
      }

      const status =
        typeof payload.status === "string"
          ? payload.status.trim()
          : "";

      if (!status) return;

      console.log(
        "📡 ANTIMATE BACKEND STATUS:",
        status
      );

      setThinkingText(status);
    };

    socket.on(
      "antimate:status",
      handleBackendStatus
    );

    // Optional aliases, useful if backend currently
    // uses another event name.
    socket.on(
      "antimate_status",
      handleBackendStatus
    );

    socket.on(
      "ai:status",
      handleBackendStatus
    );

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    socket.on("antimate:error", (payload) => {
      console.error(
        "❌ ANTIMATE socket error:",
        payload
      );

      if (
        payload?.requestId &&
        activeRequestIdRef.current &&
        payload.requestId !==
          activeRequestIdRef.current
      ) {
        return;
      }

      if (payload?.status) {
        setThinkingText(payload.status);
      }
    });

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      socket.off(
        "antimate:status",
        handleBackendStatus
      );

      socket.off(
        "antimate_status",
        handleBackendStatus
      );

      socket.off(
        "ai:status",
        handleBackendStatus
      );

      socket.disconnect();

      socketRef.current = null;
    };
  }, []);

  // ==========================================================
  // AUDIO CLEANUP
  // ==========================================================

  const cleanupAudioRecording = useCallback(() => {
    if (silenceAnimationRef.current) {
      cancelAnimationFrame(
        silenceAnimationRef.current
      );

      silenceAnimationRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    silenceStartedAtRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => {
          try {
            track.stop();
          } catch {}
        });

      mediaStreamRef.current = null;
    }

    mediaRecorderRef.current = null;

    recordingChunksRef.current = [];
  }, []);

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const playAudio = useCallback(
    async (audioUrl) => {
      if (!audioUrl) return;

      try {
        setIsPlaying(true);

        const audio = new Audio(audioUrl);

        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;

          // --------------------------------------------------
          // LIVE VOICE:
          // after AI finishes speaking,
          // automatically reopen microphone.
          // --------------------------------------------------

          if (isLiveVoiceRef.current) {
            setTimeout(() => {
              if (
                !isLiveVoiceRef.current ||
                isRecordingRef.current ||
                isSendingRef.current
              ) {
                return;
              }

              startRecordingRef.current?.();
            }, 250);
          }
        };

        audio.onerror = () => {
          setIsPlaying(false);
          audioRef.current = null;

          if (isLiveVoiceRef.current) {
            setTimeout(() => {
              if (
                !isLiveVoiceRef.current ||
                isRecordingRef.current ||
                isSendingRef.current
              ) {
                return;
              }

              startRecordingRef.current?.();
            }, 250);
          }
        };

        await audio.play();
      } catch (error) {
        console.error(
          "❌ Audio playback error:",
          error
        );

        setIsPlaying(false);

        if (isLiveVoiceRef.current) {
          setTimeout(() => {
            if (
              !isLiveVoiceRef.current ||
              isRecordingRef.current ||
              isSendingRef.current
            ) {
              return;
            }

            startRecordingRef.current?.();
          }, 250);
        }
      }
    },
    []
  );

  // ==========================================================
  // STOP AUDIO PLAYBACK
  // ==========================================================

  const stopAudioPlayback = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}

      audioRef.current = null;
    }

    setIsPlaying(false);
  }, []);

  // ==========================================================
  // ADD MESSAGE
  // ==========================================================

  const addMessage = useCallback(
    (message) => {
      setMessages((prev) => [
        ...prev,
        {
          id:
            message.id ||
            `${Date.now()}_${Math.random()
              .toString(36)
              .slice(2)}`,
          ...message,
        },
      ]);
    },
    []
  );

  // ==========================================================
  // SEND TEXT
  // ==========================================================

  const sendText = useCallback(async () => {
    const text = input.trim();

    if (!text || isSendingRef.current) {
      return;
    }

    const requestId = createRequestId();

    activeRequestIdRef.current = requestId;

    setIsSending(true);

    // DO NOT set a frontend thinking phrase.
    // Backend will send the actual status.
    setThinkingText("");

    addMessage({
      role: "user",
      content: text,
      type: "text",
    });

    setInput("");

    try {
      const response = await fetch(
        `${API_BASE}/api/antimate/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            language,
            requestId,
          }),
        }
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `HTTP ${response.status}`
        );
      }

      // ------------------------------------------------------
      // If backend returned a final status in HTTP response,
      // display it temporarily.
      // ------------------------------------------------------

      const backendStatus =
        getBackendStatus(data);

      if (backendStatus) {
        setThinkingText(backendStatus);
      }

      // ------------------------------------------------------
      // RESPONSE TEXT
      // ------------------------------------------------------

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        data?.text ||
        "";

      if (answer) {
        addMessage({
          role: "assistant",
          content: answer,
          type: "text",
        });
      }

      // ------------------------------------------------------
      // AUDIO
      // ------------------------------------------------------

      const audioUrl =
        data?.audioUrl ||
        data?.audio_url ||
        data?.ttsUrl ||
        data?.tts_url ||
        null;

      if (audioUrl) {
        await playAudio(audioUrl);
      }
    } catch (error) {
      console.error(
        "❌ ANTIMATE text error:",
        error
      );

      addMessage({
        role: "assistant",
        content:
          language === "rw"
            ? "Habaye ikibazo mu gutunganya ubutumwa bwawe."
            : "There was a problem processing your request.",
        type: "error",
      });
    } finally {
      setThinkingText("");

      setIsSending(false);

      if (
        activeRequestIdRef.current === requestId
      ) {
        activeRequestIdRef.current = null;
      }
    }
  }, [
    input,
    language,
    addMessage,
    playAudio,
  ]);

  // ==========================================================
  // SILENCE DETECTION
  // ==========================================================

  const detectSilence = useCallback(() => {
    const analyser = analyserRef.current;

    if (
      !analyser ||
      !isRecordingRef.current ||
      !isLiveVoiceRef.current
    ) {
      return;
    }

    const bufferLength =
      analyser.fftSize;

    const dataArray =
      new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(
      dataArray
    );

    let sum = 0;

    for (let i = 0; i < bufferLength; i++) {
      const normalized =
        (dataArray[i] - 128) / 128;

      sum += normalized * normalized;
    }

    const rms = Math.sqrt(
      sum / bufferLength
    );

    // ----------------------------------------------
    // Silence threshold
    // ----------------------------------------------

    const SILENCE_THRESHOLD = 0.018;

    // ~1.8 seconds silence
    const SILENCE_DURATION = 1800;

    if (rms < SILENCE_THRESHOLD) {
      if (!silenceStartedAtRef.current) {
        silenceStartedAtRef.current =
          Date.now();
      } else {
        const silentFor =
          Date.now() -
          silenceStartedAtRef.current;

        if (
          silentFor >= SILENCE_DURATION
        ) {
          console.log(
            "🔇 Live voice silence detected"
          );

          stopRecordingRef.current?.(
            true
          );

          return;
        }
      }
    } else {
      silenceStartedAtRef.current = null;
    }

    silenceAnimationRef.current =
      requestAnimationFrame(
        detectSilence
      );
  }, []);

  // ==========================================================
  // SEND VOICE
  // ==========================================================

  const sendVoice = useCallback(
    async (audioBlob) => {
      if (
        !audioBlob ||
        audioBlob.size === 0 ||
        isSendingRef.current
      ) {
        return;
      }

      const requestId = createRequestId();

      activeRequestIdRef.current =
        requestId;

      setIsSending(true);

      // Backend controls the visible status.
      setThinkingText("");

      try {
        const formData = new FormData();

        formData.append(
          "audio",
          audioBlob,
          "antimate_voice.webm"
        );

        formData.append(
          "language",
          language
        );

        formData.append(
          "requestId",
          requestId
        );

        const response = await fetch(
          `${API_BASE}/api/antimate/voice`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data =
          await safeJson(response);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              `HTTP ${response.status}`
          );
        }

        // ----------------------------------------------------
        // Backend final status
        // ----------------------------------------------------

        const backendStatus =
          getBackendStatus(data);

        if (backendStatus) {
          setThinkingText(
            backendStatus
          );
        }

        // ----------------------------------------------------
        // TRANSCRIPT
        // ----------------------------------------------------

        const transcript =
          data?.transcript ||
          data?.transcription ||
          data?.text ||
          "";

        if (transcript) {
          addMessage({
            role: "user",
            content: transcript,
            type: "voice",
          });
        }

        // ----------------------------------------------------
        // AI ANSWER
        // ----------------------------------------------------

        const answer =
          data?.answer ||
          data?.response ||
          data?.message ||
          data?.reply ||
          "";

        if (answer) {
          addMessage({
            role: "assistant",
            content: answer,
            type: "text",
          });
        }

        // ----------------------------------------------------
        // AI AUDIO
        // ----------------------------------------------------

        const audioUrl =
          data?.audioUrl ||
          data?.audio_url ||
          data?.ttsUrl ||
          data?.tts_url ||
          null;

        if (audioUrl) {
          await playAudio(audioUrl);
        } else if (
          isLiveVoiceRef.current
        ) {
          // If there is no audio response,
          // reopen microphone.
          setTimeout(() => {
            if (
              isLiveVoiceRef.current &&
              !isRecordingRef.current &&
              !isSendingRef.current
            ) {
              startRecordingRef.current?.();
            }
          }, 250);
        }
      } catch (error) {
        console.error(
          "❌ ANTIMATE voice error:",
          error
        );

        addMessage({
          role: "assistant",
          content:
            language === "rw"
              ? "Habaye ikibazo mu gutunganya amajwi yawe."
              : "There was a problem processing your voice.",
          type: "error",
        });
      } finally {
        setThinkingText("");

        setIsSending(false);

        if (
          activeRequestIdRef.current ===
          requestId
        ) {
          activeRequestIdRef.current = null;
        }
      }
    },
    [
      language,
      addMessage,
      playAudio,
    ]
  );

  // ==========================================================
  // STOP RECORDING REF
  // ==========================================================

  const stopRecordingRef =
    useRef(null);

  // ==========================================================
  // START RECORDING REF
  // ==========================================================

  const startRecordingRef =
    useRef(null);

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = useCallback(
    (autoStop = false) => {
      const recorder =
        mediaRecorderRef.current;

      if (!recorder) return;

      console.log(
        autoStop
          ? "🛑 Recording auto-stopped"
          : "🛑 Recording stopped"
      );

      try {
        if (
          recorder.state !== "inactive"
        ) {
          recorder.stop();
        }
      } catch (error) {
        console.error(
          "stop recorder error:",
          error
        );
      }

      setIsRecording(false);

      isRecordingRef.current = false;

      silenceStartedAtRef.current = null;

      if (
        silenceAnimationRef.current
      ) {
        cancelAnimationFrame(
          silenceAnimationRef.current
        );

        silenceAnimationRef.current =
          null;
      }
    },
    []
  );

  stopRecordingRef.current =
    stopRecording;

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording = useCallback(
    async () => {
      if (
        isRecordingRef.current ||
        isSendingRef.current
      ) {
        return;
      }

      try {
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

        recordingChunksRef.current =
          [];

        let mimeType =
          "audio/webm;codecs=opus";

        if (
          !MediaRecorder.isTypeSupported(
            mimeType
          )
        ) {
          mimeType = "audio/webm";
        }

        if (
          !MediaRecorder.isTypeSupported(
            mimeType
          )
        ) {
          mimeType = "";
        }

        const recorder =
          mimeType
            ? new MediaRecorder(
                stream,
                { mimeType }
              )
            : new MediaRecorder(
                stream
              );

        mediaRecorderRef.current =
          recorder;

        recorder.ondataavailable =
          (event) => {
            if (
              event.data &&
              event.data.size > 0
            ) {
              recordingChunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onstop = async () => {
          const blob =
            new Blob(
              recordingChunksRef.current,
              {
                type:
                  recorder.mimeType ||
                  "audio/webm",
              }
            );

          cleanupAudioRecording();

          if (blob.size > 0) {
            await sendVoice(blob);
          }
        };

        recorder.onerror = (event) => {
          console.error(
            "❌ MediaRecorder error:",
            event
          );

          cleanupAudioRecording();

          setIsRecording(false);

          isRecordingRef.current =
            false;
        };

        recorder.start(100);

        recordingStartedAtRef.current =
          Date.now();

        silenceStartedAtRef.current =
          null;

        setIsRecording(true);

        isRecordingRef.current =
          true;

        console.log(
          isLiveVoiceRef.current
            ? "🎙️ LIVE VOICE recording started"
            : "🎙️ Voice recording started"
        );

        // ------------------------------------------------------
        // SILENCE DETECTION ONLY IN LIVE VOICE
        // ------------------------------------------------------

        if (isLiveVoiceRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (AudioContextClass) {
            const audioContext =
              new AudioContextClass();

            audioContextRef.current =
              audioContext;

            const source =
              audioContext.createMediaStreamSource(
                stream
              );

            const analyser =
              audioContext.createAnalyser();

            analyser.fftSize = 2048;

            analyser.smoothingTimeConstant =
              0.8;

            source.connect(analyser);

            analyserRef.current =
              analyser;

            silenceAnimationRef.current =
              requestAnimationFrame(
                detectSilence
              );
          }
        }
      } catch (error) {
        console.error(
          "❌ Microphone error:",
          error
        );

        setIsRecording(false);

        isRecordingRef.current =
          false;

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          addMessage({
            role: "assistant",
            type: "error",
            content:
              language === "rw"
                ? "Emerera ANTIMATE gukoresha microphone muri browser."
                : "Please allow microphone access in your browser.",
          });
        }
      }
    },
    [
      cleanupAudioRecording,
      detectSilence,
      sendVoice,
      addMessage,
      language,
    ]
  );

  startRecordingRef.current =
    startRecording;

  // ==========================================================
  // RECORD BUTTON
  // ==========================================================

  const handleRecordClick = useCallback(
    () => {
      if (isSendingRef.current) {
        return;
      }

      // ------------------------------------------------------
      // If already recording:
      // normal mode => stop manually
      // live mode => user can also stop manually
      // ------------------------------------------------------

      if (isRecordingRef.current) {
        stopRecordingRef.current?.(
          false
        );

        return;
      }

      // ------------------------------------------------------
      // Otherwise start normal recording.
      // ------------------------------------------------------

      setIsLiveVoice(false);

      isLiveVoiceRef.current =
        false;

      startRecordingRef.current?.();
    },
    []
  );

  // ==========================================================
  // LIVE VOICE
  // ==========================================================

  const startLiveVoice = useCallback(
    async () => {
      if (
        isSendingRef.current ||
        isRecordingRef.current
      ) {
        return;
      }

      setIsLiveVoice(true);

      isLiveVoiceRef.current =
        true;

      await startRecording();
    },
    [startRecording]
  );

  const stopLiveVoice = useCallback(
    () => {
      setIsLiveVoice(false);

      isLiveVoiceRef.current =
        false;

      if (isRecordingRef.current) {
        stopRecordingRef.current?.(
          false
        );
      }

      stopAudioPlayback();
    },
    [stopAudioPlayback]
  );

  // ==========================================================
  // HOLD DETECTION
  // ==========================================================

  const holdTimerRef = useRef(null);

  const pointerDownTimeRef = useRef(null);

  const HOLD_TIME = 5000;

  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();

      if (isSendingRef.current) {
        return;
      }

      pointerDownTimeRef.current =
        Date.now();

      holdTimerRef.current =
        setTimeout(async () => {
          holdTimerRef.current =
            null;

          // --------------------------------------------------
          // User held >= 5 seconds
          // switch to LIVE VOICE.
          // --------------------------------------------------

          console.log(
            "🎙️ 5s hold detected → LIVE VOICE"
          );

          if (
            isRecordingRef.current
          ) {
            stopRecordingRef.current?.(
              false
            );
          }

          setIsLiveVoice(true);

          isLiveVoiceRef.current =
            true;

          await startRecordingRef.current?.();
        }, HOLD_TIME);
    },
    []
  );

  const handlePointerUp = useCallback(
    (event) => {
      event.preventDefault();

      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current = null;
      }

      const start =
        pointerDownTimeRef.current;

      if (!start) return;

      const duration =
        Date.now() - start;

      pointerDownTimeRef.current =
        null;

      // ------------------------------------------------------
      // Short press
      // ------------------------------------------------------

      if (duration < HOLD_TIME) {
        handleRecordClick();
      }
    },
    [handleRecordClick]
  );

  const handlePointerCancel =
    useCallback(() => {
      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current = null;
      }

      pointerDownTimeRef.current =
        null;
    }, []);

  // ==========================================================
  // TEXT SUBMIT
  // ==========================================================

  const handleSubmit = useCallback(
    (event) => {
      event?.preventDefault();

      sendText();
    },
    [sendText]
  );

  // ==========================================================
  // CLEANUP ON UNMOUNT
  // ==========================================================

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );
      }

      if (
        silenceAnimationRef.current
      ) {
        cancelAnimationFrame(
          silenceAnimationRef.current
        );
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }

      cleanupAudioRecording();
    };
  }, [cleanupAudioRecording]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="antimate-page">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="antimate-header">
        <button
          type="button"
          className="antimate-back-button"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <div className="antimate-brand">
          <div className="antimate-logo">
            <div className="antimate-logo-ring">
              <div className="antimate-logo-core" />
            </div>
          </div>

          <div>
            <h1>ANTIMATE AI</h1>
            <span>
              {isLiveVoice
                ? language === "rw"
                  ? "Live Voice"
                  : "Live Voice"
                : "AI Assistant"}
            </span>
          </div>
        </div>

        <select
          value={language}
          onChange={(event) =>
            setLanguage(
              event.target.value
            )
          }
          className="antimate-language"
        >
          <option value="rw">
            Kinyarwanda
          </option>

          <option value="en">
            English
          </option>
        </select>
      </header>

      {/* ====================================================
          CHAT
      ==================================================== */}

      <main className="antimate-chat">
        {messages.length === 0 && (
          <div className="antimate-empty">
            <div className="antimate-big-logo">
              <div className="antimate-logo-ring">
                <div className="antimate-logo-core" />
              </div>
            </div>

            <h2>
              {language === "rw"
                ? "Muraho, ndi ANTIMATE AI"
                : "Hello, I'm ANTIMATE AI"}
            </h2>

            <p>
              {language === "rw"
                ? "Mbaza ikibazo icyo ari cyo cyose."
                : "Ask me anything."}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`antimate-message ${
              message.role === "user"
                ? "user"
                : "assistant"
            } ${
              message.type === "error"
                ? "error"
                : ""
            }`}
          >
            <div className="antimate-message-content">
              {message.content}
            </div>
          </div>
        ))}

        {/* ==================================================
            BACKEND STATUS
            ==================================================

            IMPORTANT:

            This text is ONLY whatever backend sends.

            No:
              "Aaah reka ndebe"
              "Ndimo gutekereza"
              "Hafi yo kukigusubiza"

            Frontend no longer generates those phrases.
        */}

        {thinkingText && (
          <div className="antimate-thinking">
            <div className="antimate-thinking-dots">
              <span />
              <span />
              <span />
            </div>

            <span>
              {thinkingText}
            </span>
          </div>
        )}
      </main>

      {/* ====================================================
          COMPOSER
      ==================================================== */}

      <form
        className="antimate-composer"
        onSubmit={handleSubmit}
      >
        <textarea
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();
              sendText();
            }
          }}
          placeholder={
            language === "rw"
              ? "Andika ubutumwa..."
              : "Type a message..."
          }
          disabled={isSending}
        />

        <div className="antimate-controls">
          {/* ==================================================
              LIVE VOICE BUTTON
          ================================================== */}

          {isLiveVoice && (
            <button
              type="button"
              className="antimate-live-stop"
              onClick={
                stopLiveVoice
              }
            >
              ■
            </button>
          )}

          {/* ==================================================
              RECORD BUTTON
          ================================================== */}

          {!isLiveVoice && (
            <button
              type="button"
              className={`antimate-record ${
                isRecording
                  ? "recording"
                  : ""
              }`}
              disabled={isSending}
              onPointerDown={
                handlePointerDown
              }
              onPointerUp={
                handlePointerUp
              }
              onPointerCancel={
                handlePointerCancel
              }
              onPointerLeave={() => {
                // Don't cancel hold here.
                // Some browsers fire pointerleave
                // while finger/mouse is still down.
              }}
              aria-label={
                isRecording
                  ? "Stop recording"
                  : "Record voice"
              }
            >
              <span className="record-icon" />
            </button>
          )}

          {/* ==================================================
              SEND BUTTON
          ================================================== */}

          <button
            type="submit"
            className="antimate-send"
            disabled={
              !input.trim() ||
              isSending
            }
          >
            ↑
          </button>
        </div>

        {/* ==================================================
            LIVE VOICE INFO
        ================================================== */}

        <div className="antimate-voice-hint">
          {isLiveVoice
            ? language === "rw"
              ? "🎙️ Vuga — nyuma y'amasegonda 1.8 utavuga, ANTIMATE irakohereza."
              : "🎙️ Speak — after 1.8 seconds of silence, ANTIMATE sends automatically."
            : language === "rw"
            ? "Kanda gato kugira ngo wandike amajwi • Gumana kuri button ≥5s kuri Live Voice"
            : "Short press to record • Hold ≥5s for Live Voice"}
        </div>
      </form>

      {/* ====================================================
          INLINE CSS
      ==================================================== */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .antimate-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(78, 110, 255, 0.16),
              transparent 38%
            ),
            #07111f;
          color: #fff;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .antimate-header {
          height: 72px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 20px;
          border-bottom: 1px solid
            rgba(255,255,255,0.08);
          background: rgba(7,17,31,0.78);
          backdrop-filter: blur(18px);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .antimate-back-button {
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 12px;
          background:
            rgba(255,255,255,0.07);
          color: white;
          font-size: 22px;
          cursor: pointer;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .antimate-brand h1 {
          margin: 0;
          font-size: 16px;
          letter-spacing: 0.04em;
        }

        .antimate-brand span {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          opacity: 0.58;
        }

        .antimate-logo {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
        }

        .antimate-logo-ring {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          padding: 3px;
          background:
            conic-gradient(
              from 0deg,
              #6d5dfc,
              #00d4ff,
              #22e6a8,
              #6d5dfc
            );
          animation:
            antimateSpin 4s linear infinite;
        }

        .antimate-logo-core {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #07111f;
        }

        @keyframes antimateSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .antimate-language {
          border: 1px solid
            rgba(255,255,255,0.1);
          border-radius: 10px;
          background:
            rgba(255,255,255,0.06);
          color: white;
          padding: 8px 10px;
          outline: none;
        }

        .antimate-language option {
          background: #07111f;
          color: white;
        }

        .antimate-chat {
          width: min(900px, 100%);
          flex: 1;
          margin: 0 auto;
          padding: 35px 20px 150px;
        }

        .antimate-empty {
          min-height: 55vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .antimate-big-logo {
          width: 110px;
          height: 110px;
          display: grid;
          place-items: center;
          margin-bottom: 20px;
          filter:
            drop-shadow(
              0 0 30px
              rgba(0,212,255,0.2)
            );
        }

        .antimate-big-logo
        .antimate-logo-ring {
          width: 80px;
          height: 80px;
          padding: 7px;
        }

        .antimate-empty h2 {
          margin: 0;
          font-size: 27px;
        }

        .antimate-empty p {
          opacity: 0.55;
          margin-top: 9px;
        }

        .antimate-message {
          display: flex;
          margin: 14px 0;
        }

        .antimate-message.user {
          justify-content: flex-end;
        }

        .antimate-message-content {
          max-width: 78%;
          padding: 13px 16px;
          border-radius: 18px;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .antimate-message.user
        .antimate-message-content {
          background:
            linear-gradient(
              135deg,
              rgba(100,90,255,0.25),
              rgba(0,212,255,0.14)
            );
          border:
            1px solid
            rgba(120,120,255,0.18);
          border-bottom-right-radius: 5px;
        }

        .antimate-message.assistant
        .antimate-message-content {
          background:
            rgba(255,255,255,0.055);
          border:
            1px solid
            rgba(255,255,255,0.07);
          border-bottom-left-radius: 5px;
        }

        .antimate-message.error
        .antimate-message-content {
          border-color:
            rgba(255,80,80,0.3);
        }

        /* ====================================================
           BACKEND THINKING STATUS
           ==================================================== */

        .antimate-thinking {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 18px 5px;
          color: rgba(255,255,255,0.68);
          font-size: 13px;
          animation:
            statusFade 0.25s ease;
        }

        @keyframes statusFade {
          from {
            opacity: 0;
            transform: translateY(3px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .antimate-thinking-dots {
          display: flex;
          gap: 4px;
        }

        .antimate-thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          animation:
            antimateDot 1.2s infinite;
        }

        .antimate-thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .antimate-thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes antimateDot {
          0%,
          60%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        .antimate-composer {
          position: fixed;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: min(900px, 100%);
          padding: 12px 20px 18px;
          background:
            linear-gradient(
              to top,
              #07111f 72%,
              transparent
            );
          z-index: 30;
        }

        .antimate-composer textarea {
          width: 100%;
          min-height: 54px;
          max-height: 160px;
          resize: vertical;
          border:
            1px solid
            rgba(255,255,255,0.09);
          border-radius: 18px;
          background:
            rgba(255,255,255,0.055);
          color: white;
          outline: none;
          padding: 15px 130px 15px 16px;
          font: inherit;
          backdrop-filter: blur(16px);
        }

        .antimate-composer textarea:focus {
          border-color:
            rgba(0,212,255,0.35);
        }

        .antimate-composer textarea::placeholder {
          color:
            rgba(255,255,255,0.38);
        }

        .antimate-controls {
          position: absolute;
          right: 30px;
          top: 21px;
          display: flex;
          gap: 7px;
        }

        .antimate-controls button {
          border: 0;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .antimate-record,
        .antimate-live-stop,
        .antimate-send {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          color: white;
        }

        .antimate-record {
          background:
            rgba(255,255,255,0.08);
        }

        .antimate-record:hover {
          background:
            rgba(255,255,255,0.13);
        }

        .antimate-record.recording {
          background:
            rgba(255,65,90,0.2);
          box-shadow:
            0 0 0 5px
            rgba(255,65,90,0.08);
        }

        .record-icon {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: currentColor;
        }

        .antimate-record.recording
        .record-icon {
          border-radius: 4px;
        }

        .antimate-live-stop {
          background:
            rgba(255,65,90,0.2);
        }

        .antimate-send {
          background:
            linear-gradient(
              135deg,
              #675cff,
              #00cfff
            );
          font-size: 20px;
        }

        .antimate-send:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .antimate-voice-hint {
          text-align: center;
          margin-top: 7px;
          font-size: 10px;
          color:
            rgba(255,255,255,0.32);
        }

        @media (max-width: 600px) {
          .antimate-header {
            padding: 0 12px;
          }

          .antimate-chat {
            padding-left: 12px;
            padding-right: 12px;
          }

          .antimate-message-content {
            max-width: 88%;
          }

          .antimate-composer {
            padding-left: 10px;
            padding-right: 10px;
          }

          .antimate-controls {
            right: 20px;
          }

          .antimate-composer textarea {
            padding-right: 125px;
          }
        }
      `}</style>
    </div>
  );
}
```

### Ibyahindutse

**1. `getThinkingPhrases()` yavanywemo burundu.**

Nta:

* `Aaah reka ndebe`
* `Ndimo gutekereza`
* `Ndimo gusesengura`
* `Hafi yo kukigusubiza`

bikiri muri frontend.

**2. Socket.IO ni yo itanga status.**

Frontend yumva:

```js
socket.on("antimate:status", (payload) => {
  setThinkingText(payload.status);
});
```

Bityo backend ishobora kohereza urugero:

```js
socket.emit("antimate:status", {
  requestId,
  status: "📝 Ndimo guhindura amajwi yawe mo inyandiko..."
});
```

hanyuma:

```js
socket.emit("antimate:status", {
  requestId,
  status: "🌍 Ndimo kumenya ururimi wavugiyemo..."
});
```

hanyuma:

```js
socket.emit("antimate:status", {
  requestId,
  status: "🧠 Ndimo gusesengura ikibazo cyawe..."
});
```

hanyuma:

```js
socket.emit("antimate:status", {
  requestId,
  status: "👤 Ndimo kureba context yawe..."
});
```

hanyuma:

```js
socket.emit("antimate:status", {
  requestId,
  status: "✦ Ndimo gutegura igisubizo..."
});
```

**3. `requestId` irinda status kuvanga requests.**

Urugero user ari kuvuga request A, backend ikohereza status ya request B; frontend izayirengagiza.

**4. Ntabwo frontend igena amagambo ya status.**

Ibi ni byo by'ingenzi: **backend ni yo izaba ifite intelligence yo kumenya icyo iri gukora kandi ikohereze status ikwiye.**

### Backend igomba kuba imeze gutya

Muri `antimateRoutes.js`, aho ibikorwa bitandukanye bitangirira, uzajya ukora:

```js
io.emit("antimate:status", {
  requestId,
  status: "📝 Ndimo guhindura amajwi yawe mo inyandiko..."
});