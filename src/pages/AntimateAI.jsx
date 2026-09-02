// ============================================================
// ANTIMATE AI — PROFESSIONAL CHAT UI (TAILWIND EDITION)
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

  // Message Helper Functions
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

  // Stop Recording Engine
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

  // Start Recording Engine
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

  // Hold to talk triggers
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
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
            A
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                socketConnected ? "bg-emerald-400" : "bg-rose-500"
              }`}
            />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ANTIMATE AI
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>{statusMessage}</span>
              {processingMode && (
                <span className="uppercase text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.2 rounded font-mono">
                  {processingMode}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* CONNECTION STATUS BADGE */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              socketConnected
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
                : "bg-rose-950/40 text-rose-400 border-rose-800/50"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                socketConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            {socketConnected ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-800/60 px-6 py-2.5 text-xs text-rose-200 flex items-center justify-between animate-fadeIn">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage("")}
            className="text-rose-400 hover:text-rose-100 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* CHAT MESSAGES BODY */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 sm:px-6">
        {messages.length === 0 && !transcript && !thinkingText ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl">
              🎙️
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="text-slate-200 font-semibold text-base">
                Murakaza neza kuri ANTIMATE AI
              </h3>
              <p className="text-xs text-slate-400">
                Kanda ukoreshe bouton y'ijwi cyangwa wandike ikibazo cyawe mu Kinyarwanda.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm space-y-1 ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end gap-2 text-[10px] opacity-60">
                    {msg.mode && msg.role === "assistant" && (
                      <span className="uppercase font-mono">{msg.mode}</span>
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
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 rounded-2xl rounded-br-none px-4 py-3 text-sm italic">
                  <span className="text-xs text-emerald-500 block not-italic font-semibold mb-0.5">
                    Iri kumva...
                  </span>
                  "{transcript}"
                </div>
              </div>
            )}

            {/* THINKING INDICATOR */}
            {thinkingText && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span>{thinkingText}</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* VOICE RECORDING OVERLAY (ACTIVE) */}
      {isRecording && (
        <div className="bg-emerald-950/60 border-t border-emerald-800/50 px-6 py-3 flex items-center justify-between text-xs text-emerald-300 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <span>Iri gufata ijwi... Komeza ufunge cyangwa ureke bouton igihe urangije.</span>
          </div>
          <button
            onClick={stopRecording}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-medium transition"
          >
            Hagarika
          </button>
        </div>
      )}

      {/* FOOTER INPUT CONTROLS */}
      <footer className="p-4 bg-slate-900/80 border-t border-slate-800/80 backdrop-blur-md">
        <form onSubmit={handleSendText} className="flex items-center gap-2">
          {/* MIC HOLD/CLICK BUTTON */}
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
            className={`relative flex items-center justify-center w-12 h-12 rounded-xl font-bold transition-all shadow-md shrink-0 ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse"
                : isPlaying
                ? "bg-amber-600 text-white cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950"
            }`}
            title="Kanda cyangwa Ufatishe uburyo bw'ijwi"
          >
            {isRecording ? "⏹" : isPlaying ? "🔊" : "🎙️"}
          </button>

          {/* TEXT INPUT */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Bandika ubutumwa hano..."
            disabled={isRecording || isProcessing}
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 disabled:opacity-50"
          />

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={!text.trim() || isProcessing || isRecording}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-slate-800 text-emerald-400 font-bold transition shrink-0"
          >
            ➔
          </button>
        </form>
      </footer>
    </div>
  );
}