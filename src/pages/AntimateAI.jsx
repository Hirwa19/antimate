// ============================================================
// ANTIMATE AI — PROFESSIONAL CHAT UI (NATIVE CSS EDITION)
// Socket.IO Voice + HTTP Text
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

// ============================================================
// CONFIG
// ============================================================

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_URL || window.location.origin;

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const HOLD_TO_RECORD_MS = 450;
const SHORT_RECORDING_MS = 1800;

const MAX_RECORDING_MS =
  Number(import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS) || 120000;

const CHUNK_INTERVAL_MS = 250;

// ============================================================
// HELPERS
// ============================================================

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") {
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
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {
      // ignore
    }
  }

  return "";
}

function extensionFromMimeType(mimeType) {
  const mime = String(mimeType || "").toLowerCase();

  if (mime.includes("ogg")) return ".ogg";
  if (mime.includes("mp4")) return ".mp4";
  if (mime.includes("mpeg")) return ".mp3";
  return ".webm";
}

function getAudioUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.url || value.audio_url || value.audioUrl || value.path || null;
  }
  return null;
}

function makeAbsoluteUrl(url) {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  if (url.startsWith("file://")) return null;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AntimateAI() {
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingStartedAtRef = useRef(0);
  const holdTimerRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const audioRef = useRef(null);
  const wakeLockRef = useRef(null);
  const voiceSessionActiveRef = useRef(false);
  const messagesEndRef = useRef(null);

  // States
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("ready");
  const [statusMessage, setStatusMessage] = useState("ANTIMATE yiteguye kugufasha.");
  const [processingMode, setProcessingMode] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [thinkingText, setThinkingText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, transcript, thinkingText]);

  // Wake Lock Logic
  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator) || !voiceSessionActiveRef.current) return;
    try {
      if (wakeLockRef.current && !wakeLockRef.current.released) return;
      const lock = await navigator.wakeLock.request("screen");
      wakeLockRef.current = lock;
      lock.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch (error) {
      console.warn("Wake Lock:", error);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && voiceSessionActiveRef.current) {
        await requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [requestWakeLock]);

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }
  }, []);

  // Message Helpers
  const addUserMessage = useCallback((value) => {
    const clean = String(value || "").trim();
    if (!clean) return;
    setMessages((previous) => [
      ...previous,
      {
        id: `user-${Date.now()}-${Math.random()}`,
        role: "user",
        text: clean,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const updateStreamingAssistant = useCallback((value, mode = "gpu") => {
    const clean = String(value || "").trim();
    if (!clean) return;

    setMessages((previous) => {
      const last = previous[previous.length - 1];
      if (last?.role === "assistant" && last?.streaming) {
        return previous.map((message, index) =>
          index === previous.length - 1
            ? { ...message, text: clean, mode, streaming: true }
            : message
        );
      }
      return [
        ...previous,
        {
          id: `assistant-stream-${Date.now()}-${Math.random()}`,
          role: "assistant",
          text: clean,
          mode,
          streaming: true,
          createdAt: Date.now(),
        },
      ];
    });
  }, []);

  const finalizeStreamingAssistant = useCallback((value, mode = "gpu") => {
    const clean = String(value || "").trim();
    if (!clean) return;

    setMessages((previous) => {
      const last = previous[previous.length - 1];
      if (last?.role === "assistant" && last?.streaming) {
        return previous.map((message, index) =>
          index === previous.length - 1
            ? { ...message, text: clean, mode, streaming: false }
            : message
        );
      }
      return [
        ...previous,
        {
          id: `assistant-${Date.now()}-${Math.random()}`,
          role: "assistant",
          text: clean,
          mode,
          streaming: false,
          createdAt: Date.now(),
        },
      ];
    });
  }, []);

  // Audio Player
  const playAudio = useCallback(
    async (rawUrl) => {
      const audioUrl = makeAbsoluteUrl(getAudioUrl(rawUrl));
      if (!audioUrl) return;

      try {
        if (audioRef.current) {
          try {
            audioRef.current.pause();
          } catch {}
          audioRef.current = null;
        }

        const audio = new Audio(audioUrl);
        audio.preload = "auto";
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          setStatus("speaking");
          setStatusMessage("ANTIMATE iri kuvuga...");
        };

        audio.onended = () => {
          setIsPlaying(false);
          setStatus("ready");
          setStatusMessage("ANTIMATE yiteguye kongera kukumva.");
          audioRef.current = null;
          voiceSessionActiveRef.current = false;
          releaseWakeLock();
        };

        audio.onerror = () => {
          console.error("❌ Audio playback failed");
          setIsPlaying(false);
          setStatus("ready");
          setStatusMessage("Igisubizo cyabonetse ariko audio ntiyakinze.");
          audioRef.current = null;
          voiceSessionActiveRef.current = false;
          releaseWakeLock();
        };

        await audio.play();
      } catch (error) {
        console.error("❌ Audio play error:", error);
        setIsPlaying(false);
      }
    },
    [releaseWakeLock]
  );

  // Stop Recording
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;

    isRecordingRef.current = false;
    setIsRecording(false);
    setIsProcessing(true);
    setStatus("processing");
    setStatusMessage("ANTIMATE iri gusesengura ijwi...");

    clearTimeout(autoStopTimerRef.current);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    stopMediaTracks();

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("antimate:voice:stop");
    }
  }, [stopMediaTracks]);

  // Start Recording
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current || isProcessing || isPlaying) return;

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setErrorMessage("ANTIMATE server ntabwo ihujwe.");
      setStatus("error");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Browser yawe ntabwo yemera microphone.");
      setStatus("error");
      return;
    }

    try {
      setErrorMessage("");
      setTranscript("");
      setThinkingText("");
      voiceSessionActiveRef.current = true;
      await requestWakeLock();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      mediaStreamRef.current = stream;
      const preferredMime = getSupportedMimeType();
      let recorder;

      try {
        recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      const mimeType = recorder.mimeType || preferredMime || "audio/webm";
      const extension = extensionFromMimeType(mimeType);

      socket.emit("antimate:voice:start", {
        mimeType,
        extension,
        language: "rw",
      });

      recorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0 || !isRecordingRef.current) return;
        try {
          const buffer = await event.data.arrayBuffer();
          if (socket.connected && isRecordingRef.current) {
            socket.emit("antimate:voice:chunk", buffer);
          }
        } catch (error) {
          console.error("❌ Audio chunk error:", error);
        }
      };

      recorder.onerror = (event) => {
        console.error("❌ MediaRecorder:", event);
        setErrorMessage("Microphone recording habayemo ikibazo.");
        setStatus("error");
        isRecordingRef.current = false;
        setIsRecording(false);
        voiceSessionActiveRef.current = false;
        try {
          socket.emit("antimate:voice:cancel");
        } catch {}
        stopMediaTracks();
        releaseWakeLock();
      };

      isRecordingRef.current = true;
      setIsRecording(true);
      setIsProcessing(false);
      setStatus("recording");
      setStatusMessage("ANTIMATE iri kumva...");
      recordingStartedAtRef.current = Date.now();

      recorder.start(CHUNK_INTERVAL_MS);

      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current) {
          stopRecording();
        }
      }, MAX_RECORDING_MS);
    } catch (error) {
      console.error("🔥 Microphone error:", error);
      setErrorMessage(error?.message || "Microphone ntiyashoboye gufunguka.");
      setStatus("error");
      isRecordingRef.current = false;
      setIsRecording(false);
      voiceSessionActiveRef.current = false;
      stopMediaTracks();
      releaseWakeLock();
    }
  }, [isProcessing, isPlaying, requestWakeLock, stopMediaTracks, releaseWakeLock, stopRecording]);

  // Socket Connections
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setErrorMessage("");
      if (!isRecordingRef.current && !isPlaying) {
        setStatus("ready");
        setStatusMessage("ANTIMATE yiteguye kugufasha.");
      }
      if (voiceSessionActiveRef.current) requestWakeLock();
    });

    socket.on("disconnect", (reason) => {
      setSocketConnected(false);
      if (!isRecordingRef.current) {
        setStatus("disconnected");
        setStatusMessage("Connection yacitse. Ngerageza kongera kuyihuza...");
      }
    });

    socket.on("connect_error", (error) => {
      setSocketConnected(false);
      setErrorMessage("ANTIMATE server ntabwo iri kuboneka.");
    });

    socket.on("antimate:status", (data = {}) => {
      const nextStatus = data.status || "ready";
      setStatus(nextStatus);
      if (data.message) setStatusMessage(data.message);
      if (data.mode) setProcessingMode(data.mode);

      if (nextStatus === "recording") {
        setIsRecording(true);
        isRecordingRef.current = true;
        voiceSessionActiveRef.current = true;
        requestWakeLock();
      }

      if (["converting", "processing", "gpu_fallback", "uploaded", "receiving"].includes(nextStatus)) {
        setIsProcessing(true);
      }

      if (nextStatus === "cancelled") {
        setIsRecording(false);
        setIsProcessing(false);
        isRecordingRef.current = false;
        voiceSessionActiveRef.current = false;
        releaseWakeLock();
      }
    });

    socket.on("antimate:transcript", (data = {}) => {
      const value = data.transcript || data.text || data.message || "";
      if (value) setTranscript(value);
    });

    socket.on("antimate:thinking", (data = {}) => {
      setIsProcessing(true);
      if (data.mode) setProcessingMode(data.mode);
      setThinkingText(data.text || "ANTIMATE iri gutekereza...");
    });

    socket.on("antimate:answer", (data = {}) => {
      const answer = data.answer || data.answer_rw || data.answer_kinyarwanda || data.text || data.message || "";
      const mode = data.mode || data.processing_mode || "gpu";
      if (!answer) return;

      setThinkingText("");
      setProcessingMode(mode);
      updateStreamingAssistant(answer, mode);
    });

    socket.on("antimate:answer:chunk", (data = {}) => {
      const chunk = data.chunk || data.text || data.answer || "";
      if (!chunk) return;
      const mode = data.mode || data.processing_mode || "gpu";

      setThinkingText("");
      setIsProcessing(true);
      setProcessingMode(mode);

      setMessages((previous) => {
        const last = previous[previous.length - 1];
        let nextText = chunk;

        if (last?.role === "assistant" && last?.streaming) {
          nextText = `${last.text}${chunk}`;
          return previous.map((message, index) =>
            index === previous.length - 1
              ? { ...message, text: nextText, mode, streaming: true }
              : message
          );
        }

        return [
          ...previous,
          {
            id: `assistant-stream-${Date.now()}-${Math.random()}`,
            role: "assistant",
            text: nextText,
            mode,
            streaming: true,
            createdAt: Date.now(),
          },
        ];
      });
    });

    socket.on("antimate:audio", (data = {}) => {
      if (data.mode) setProcessingMode(data.mode);
      const raw = data.audio_url || data.audioUrl || data.audio;
      if (raw) playAudio(raw);
    });

    socket.on("antimate:complete", (data = {}) => {
      const answer = data.answer || data.answer_rw || data.answer_kinyarwanda || data.text || "";
      const mode = data.processing_mode || data.mode || "gpu";

      if (answer) finalizeStreamingAssistant(answer, mode);
      setProcessingMode(mode);
      setIsProcessing(false);
      setIsRecording(false);
      isRecordingRef.current = false;
      setTranscript("");
      setThinkingText("");
      setStatus("complete");
      setStatusMessage("ANTIMATE yarangije gusubiza.");
    });

    socket.on("antimate:error", (data = {}) => {
      const message = data.message || data.error || "ANTIMATE AI habayemo ikibazo.";
      setErrorMessage(message);
      setIsRecording(false);
      setIsProcessing(false);
      isRecordingRef.current = false;
      voiceSessionActiveRef.current = false;
      setStatus("error");
      setStatusMessage(message);
      stopMediaTracks();
      releaseWakeLock();
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [finalizeStreamingAssistant, playAudio, releaseWakeLock, requestWakeLock, stopMediaTracks, updateStreamingAssistant]);

  // Send Text Message
  const handleSendText = async (e) => {
    e?.preventDefault();
    const clean = text.trim();
    if (!clean || isProcessing || isRecording) return;

    addUserMessage(clean);
    setText("");
    setIsProcessing(true);
    setStatus("processing");
    setStatusMessage("ANTIMATE iri gutekereza...");
    setThinkingText("ANTIMATE iri gutekereza...");

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, language: "rw" }),
      });

      if (!res.ok) throw new Error("HTTP chat error");
      const data = await res.json();
      const reply = data.answer || data.text || data.message || "Nta gisubizo cyatanzwe.";

      setThinkingText("");
      finalizeStreamingAssistant(reply, data.mode || "http");
      setIsProcessing(false);
      setStatus("ready");
      setStatusMessage("ANTIMATE yiteguye kugufasha.");
    } catch (err) {
      console.error(err);
      setThinkingText("");
      setIsProcessing(false);
      setStatus("error");
      setErrorMessage("Ntabwo mushoboye kuvugana mu buryo bwa HTTP.");
    }
  };

  // Hold triggers
  const handleMouseDown = () => {
    isHoldingRef.current = true;
    holdTimerRef.current = setTimeout(() => {
      if (isHoldingRef.current) startRecording();
    }, HOLD_TO_RECORD_MS);
  };

  const handleMouseUp = () => {
    isHoldingRef.current = false;
    clearTimeout(holdTimerRef.current);
    if (isRecordingRef.current) {
      const duration = Date.now() - recordingStartedAtRef.current;
      if (duration < SHORT_RECORDING_MS) {
        setTimeout(stopRecording, SHORT_RECORDING_MS - duration);
      } else {
        stopRecording();
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <div style={styles.logoBox}>
            A
            <span
              style={{
                ...styles.statusDot,
                backgroundColor: socketConnected ? "#10b981" : "#f43f5e",
              }}
            />
          </div>
          <div>
            <h1 style={styles.brandTitle}>ANTIMATE AI</h1>
            <p style={styles.brandSubtitle}>
              <span>{statusMessage}</span>
              {processingMode && (
                <span style={styles.modeBadge}>{processingMode}</span>
              )}
            </p>
          </div>
        </div>

        {/* CONNECTION BADGE */}
        <div
          style={{
            ...styles.connectionBadge,
            backgroundColor: socketConnected ? "rgba(6, 78, 59, 0.4)" : "rgba(136, 19, 55, 0.4)",
            borderColor: socketConnected ? "rgba(6, 95, 70, 0.5)" : "rgba(159, 18, 57, 0.5)",
            color: socketConnected ? "#34d399" : "#fb7185",
          }}
        >
          <span
            style={{
              ...styles.connectionDot,
              backgroundColor: socketConnected ? "#34d399" : "#f43f5e",
            }}
          />
          {socketConnected ? "Online" : "Offline"}
        </div>
      </header>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div style={styles.errorBanner}>
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage("")}
            style={styles.errorCloseBtn}
          >
            ✕
          </button>
        </div>
      )}

      {/* MESSAGES CONTAINER */}
      <main style={styles.mainChat}>
        {messages.length === 0 && !transcript && !thinkingText ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎙️</div>
            <h3 style={styles.emptyTitle}>Murakaza neza kuri ANTIMATE AI</h3>
            <p style={styles.emptySubtitle}>
              Kanda ukoreshe bouton y'ijwi cyangwa wandike ikibazo cyawe mu Kinyarwanda.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
                  }}
                >
                  <p style={styles.messageText}>{msg.text}</p>
                  <div style={styles.messageMeta}>
                    {msg.mode && msg.role === "assistant" && (
                      <span style={{ textTransform: "uppercase", fontFamily: "monospace" }}>
                        {msg.mode}
                      </span>
                    )}
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* LIVE TRANSCRIPT */}
            {transcript && (
              <div style={{ ...styles.messageRow, justifyContent: "flex-end" }}>
                <div style={styles.transcriptBubble}>
                  <span style={styles.transcriptLabel}>Iri kumva...</span>
                  "{transcript}"
                </div>
              </div>
            )}

            {/* THINKING INDICATOR */}
            {thinkingText && (
              <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
                <div style={styles.thinkingBubble}>
                  <span style={styles.typingDots}>...</span>
                  <span>{thinkingText}</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* VOICE RECORDING BAR */}
      {isRecording && (
        <div style={styles.recordingOverlay}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={styles.recordingPulse} />
            <span>Iri gufata ijwi... Komeza ufunge cyangwa ureke bouton igihe urangije.</span>
          </div>
          <button onClick={stopRecording} style={styles.stopBtn}>
            Hagarika
          </button>
        </div>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <form onSubmit={handleSendText} style={styles.formGroup}>
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            onClick={() => {
              if (!isHoldingRef.current) {
                isRecording ? stopRecording() : startRecording();
              }
            }}
            disabled={isProcessing || isPlaying}
            style={{
              ...styles.micBtn,
              backgroundColor: isRecording
                ? "#e11d48"
                : isPlaying
                ? "#d97706"
                : "#059669",
              opacity: isProcessing || isPlaying ? 0.6 : 1,
            }}
            title="Kanda cyangwa Ufatishe uburyo bw'ijwi"
          >
            {isRecording ? "⏹" : isPlaying ? "🔊" : "🎙️"}
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Bandika ubutumwa hano..."
            disabled={isRecording || isProcessing}
            style={styles.textInput}
          />

          <button
            type="submit"
            disabled={!text.trim() || isProcessing || isRecording}
            style={{
              ...styles.sendBtn,
              opacity: !text.trim() || isProcessing || isRecording ? 0.4 : 1,
            }}
          >
            ➔
          </button>
        </form>
      </footer>
    </div>
  );
}

// ============================================================
// NATIVE INLINE STYLES (PURE CSS)
// ============================================================

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: "960px",
    margin: "0 auto",
    backgroundColor: "#020617",
    color: "#f8fafc",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #1e293b",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(8px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoBox: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #10b981 0%, #2dd4bf 100%)",
    fontWeight: "900",
    color: "#020617",
    fontSize: "20px",
  },
  statusDot: {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    border: "2px solid #020617",
  },
  brandTitle: {
    fontWeight: "700",
    fontSize: "18px",
    margin: 0,
    color: "#f1f5f9",
  },
  brandSubtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "2px 0 0 0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  modeBadge: {
    textTransform: "uppercase",
    fontSize: "10px",
    backgroundColor: "rgba(6, 78, 59, 0.8)",
    color: "#34d399",
    border: "1px solid rgba(6, 95, 70, 0.5)",
    padding: "1px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
  },
  connectionBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "500",
    border: "1px solid",
  },
  connectionDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  errorBanner: {
    backgroundColor: "rgba(136, 19, 55, 0.8)",
    borderBottom: "1px solid rgba(159, 18, 57, 0.6)",
    padding: "10px 24px",
    fontSize: "12px",
    color: "#fecdd3",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorCloseBtn: {
    background: "none",
    border: "none",
    color: "#fb7185",
    fontWeight: "bold",
    cursor: "pointer",
  },
  mainChat: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  emptyState: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#64748b",
  },
  emptyIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    marginBottom: "16px",
  },
  emptyTitle: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: "16px",
    margin: "0 0 4px 0",
  },
  emptySubtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
    maxWidth: "320px",
  },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: "16px",
    padding: "12px 16px",
    fontSize: "14px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  userBubble: {
    backgroundColor: "#059669",
    color: "#ffffff",
    borderBottomRightRadius: "2px",
  },
  assistantBubble: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    color: "#e2e8f0",
    borderBottomLeftRadius: "2px",
  },
  messageText: {
    whiteSpace: "pre-wrap",
    lineHeight: "1.5",
    margin: 0,
  },
  messageMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
    fontSize: "10px",
    opacity: 0.6,
    marginTop: "6px",
  },
  transcriptBubble: {
    maxWidth: "75%",
    backgroundColor: "rgba(6, 78, 59, 0.4)",
    border: "1px solid rgba(6, 95, 70, 0.4)",
    color: "#a7f3d0",
    borderRadius: "16px",
    borderBottomRightRadius: "2px",
    padding: "12px 16px",
    fontSize: "14px",
    fontStyle: "italic",
  },
  transcriptLabel: {
    fontSize: "12px",
    color: "#10b981",
    display: "block",
    fontStyle: "normal",
    fontWeight: "600",
    marginBottom: "2px",
  },
  thinkingBubble: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    borderRadius: "16px",
    borderBottomLeftRadius: "2px",
    padding: "12px 16px",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  typingDots: {
    color: "#34d399",
    fontWeight: "bold",
  },
  recordingOverlay: {
    backgroundColor: "rgba(6, 78, 59, 0.6)",
    borderTop: "1px solid rgba(6, 95, 70, 0.5)",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#6ee7b7",
  },
  recordingPulse: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#f43f5e",
    display: "inline-block",
  },
  stopBtn: {
    padding: "4px 12px",
    backgroundColor: "#e11d48",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "500",
    cursor: "pointer",
  },
  footer: {
    padding: "16px",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderTop: "1px solid #1e293b",
    backdropFilter: "blur(8px)",
  },
  formGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  micBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    fontWeight: "bold",
    color: "#020617",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#020617",
    border: "1px solid #1e293b",
    color: "#f8fafc",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#1e293b",
    border: "none",
    color: "#34d399",
    fontWeight: "bold",
    fontSize: "18px",
    cursor: "pointer",
    flexShrink: 0,
  },
};