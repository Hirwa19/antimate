import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

/* ============================================================
   ANTIMATE AI
   Professional Chat + Voice UI
   Single JSX file — Native CSS inside <style>
============================================================ */

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/$/, "");

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const MAX_RECORD_SECONDS = 30;
const SILENCE_DURATION = 1800;

/* ============================================================
   ICONS
============================================================ */

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.7 2.3a1 1 0 0 0-1.04-.22L3.26 8.58a1 1 0 0 0 .08 1.89l7.09 2.36 2.36 7.09a1 1 0 0 0 .93.68h.03a1 1 0 0 0 .93-.61l6.5-17.4a1 1 0 0 0-.48-1.29ZM5.98 9.55l11.7-4.36-6.05 6.05L5.98 9.55Zm7.84 7.84-1.59-4.77 6.06-6.06-4.47 10.83Z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v6a3.5 3.5 0 0 0 3.5 3.5Zm-2-9.5a2 2 0 1 1 4 0v6a2 2 0 1 1-4 0V6Zm8 6a6 6 0 0 1-12 0H4.5a7.5 7.5 0 0 0 6.75 7.46V22h1.5v-2.54A7.5 7.5 0 0 0 19.5 12H18Z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.2 15.35A8.5 8.5 0 0 1 8.65 3.8a8.5 8.5 0 1 0 11.55 11.55Z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Zm13.5 3a5.5 5.5 0 0 0-2.5-4.6v9.2a5.5 5.5 0 0 0 2.5-4.6Zm0-9.1v2.06A8 8 0 0 1 17.5 19v2.06a10 10 0 0 0 0-17.16Z" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 8.5a15 15 0 0 1 19 0l-1.4 1.4a13 13 0 0 0-16.2 0L2.5 8.5Zm3.2 3.2a10.5 10.5 0 0 1 12.6 0l-1.4 1.4a8.5 8.5 0 0 0-9.8 0l-1.4-1.4Zm3.25 3.25a5.9 5.9 0 0 1 6.1 0L12 18.8l-3.05-3.85Z" />
    </svg>
  );
}

/* ============================================================
   ANTIMATE LOGO
============================================================ */

function AntimateLogo({ small = false }) {
  return (
    <div
      className={`antimate-logo-wrap ${small ? "logo-small" : ""}`}
      aria-label="ANTIMATE AI"
    >
      <div className="antimate-logo">
        <div className="logo-orbit orbit-one" />
        <div className="logo-orbit orbit-two" />
        <div className="logo-core">
          <span />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AntimateAI() {
  /* ----------------------------------------------------------
     UI
  ---------------------------------------------------------- */

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("antimate-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [recording, setRecording] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  const [recordSeconds, setRecordSeconds] =
    useState(MAX_RECORD_SECONDS);

  const [liveListening, setLiveListening] = useState(false);

  const [status, setStatus] = useState(
    "Muraho! Ndi ANTIMATE AI."
  );

  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

  /* ----------------------------------------------------------
     REFS
  ---------------------------------------------------------- */

  const socketRef = useRef(null);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const audioRef = useRef(null);

  const recordTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const liveAudioChunksRef = useRef([]);

  const currentAnswerRef = useRef("");
  const isPlayingRef = useRef(false);

  const liveModeRef = useRef(false);
  const recordingRef = useRef(false);
  const liveListeningRef = useRef(false);

  /* ==========================================================
     THEME
  ========================================================== */

  useEffect(() => {
    try {
      localStorage.setItem("antimate-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  /* ==========================================================
     AUTO SCROLL
  ========================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, currentAnswer, transcript]);

  /* ==========================================================
     TEXTAREA AUTO HEIGHT
  ========================================================== */

  useEffect(() => {
    const el = textareaRef.current;

    if (!el) return;

    el.style.height = "auto";

    const maxHeight = 150;

    el.style.height = `${Math.min(
      el.scrollHeight,
      maxHeight
    )}px`;
  }, [text]);

  /* ==========================================================
     CLEANUP RECORDING
  ========================================================== */

  const clearTimers = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }
  }, []);

  /* ==========================================================
     AUDIO PLAYBACK
  ========================================================== */

  const makeAbsoluteUrl = useCallback((url) => {
    if (!url) return null;

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    if (url.startsWith("/")) {
      return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
  }, []);

  const playAudio = useCallback(
    async (url) => {
      const absoluteUrl = makeAbsoluteUrl(url);

      if (!absoluteUrl) return;

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        const audio = new Audio(absoluteUrl);

        audioRef.current = audio;

        isPlayingRef.current = true;
        setIsPlaying(true);
        setStatus("ANTIMATE AI iri kuvuga...");

        audio.onended = async () => {
          isPlayingRef.current = false;
          setIsPlaying(false);

          if (liveModeRef.current) {
            setStatus("Ntegereje ko uvuga...");

            // Re-open live microphone automatically
            setTimeout(() => {
              if (
                liveModeRef.current &&
                !isPlayingRef.current
              ) {
                startLiveListening();
              }
            }, 250);
          } else {
            setStatus("Niteguye kugufasha.");
          }
        };

        audio.onerror = () => {
          isPlayingRef.current = false;
          setIsPlaying(false);
          setError("Audio response yanze gukinwa.");
          setStatus("Niteguye kugufasha.");
        };

        await audio.play();
      } catch (err) {
        console.error("AUDIO PLAY ERROR:", err);

        isPlayingRef.current = false;
        setIsPlaying(false);

        setError(
          "Ntabwo nashoboye gukina audio y'igisubizo."
        );
      }
    },
    [makeAbsoluteUrl]
  );

  /* ==========================================================
     SOCKET.IO
  ========================================================== */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "✅ ANTIMATE Socket connected:",
        socket.id
      );

      setSocketConnected(true);
      setError("");
      setStatus("ANTIMATE AI irahari.");
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "🔌 ANTIMATE Socket disconnected:",
        reason
      );

      setSocketConnected(false);

      if (!recordingRef.current) {
        setStatus("Socket iri kongera kwihuza...");
      }
    });

    socket.on("connect_error", (err) => {
      console.error(
        "❌ ANTIMATE Socket error:",
        err.message
      );

      setSocketConnected(false);
    });

    /* --------------------------------------------------------
       STATUS
    -------------------------------------------------------- */

    socket.on("antimate:status", (data) => {
      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.status ||
            "";

      if (message) {
        setStatus(message);
      }
    });

    /* --------------------------------------------------------
       TRANSCRIPT
    -------------------------------------------------------- */

    socket.on("antimate:transcript", (data) => {
      const value =
        typeof data === "string"
          ? data
          : data?.text ||
            data?.transcript ||
            "";

      if (value) {
        setTranscript(value);
      }
    });

    /* --------------------------------------------------------
       THINKING
    -------------------------------------------------------- */

    socket.on("antimate:thinking", () => {
      setStatus("ANTIMATE AI iri gutekereza...");
      setIsProcessing(true);
    });

    /* --------------------------------------------------------
       COMPLETE ANSWER
    -------------------------------------------------------- */

    socket.on("antimate:answer", (data) => {
      const answer =
        typeof data === "string"
          ? data
          : data?.answer ||
            data?.text ||
            "";

      if (!answer) return;

      currentAnswerRef.current = answer;

      setCurrentAnswer(answer);
      setIsProcessing(false);

      setMessages((prev) => {
        const next = [...prev];

        const last = next[next.length - 1];

        if (
          last &&
          last.role === "assistant" &&
          last.streaming
        ) {
          next[next.length - 1] = {
            ...last,
            content: answer,
            streaming: false,
          };
        } else {
          next.push({
            role: "assistant",
            content: answer,
            streaming: false,
          });
        }

        return next;
      });
    });

    /* --------------------------------------------------------
       STREAMING ANSWER
    -------------------------------------------------------- */

    socket.on("antimate:answer:chunk", (data) => {
      const chunk =
        typeof data === "string"
          ? data
          : data?.chunk ||
            data?.text ||
            "";

      if (!chunk) return;

      currentAnswerRef.current += chunk;

      const nextAnswer =
        currentAnswerRef.current;

      setCurrentAnswer(nextAnswer);
      setIsProcessing(false);

      setMessages((prev) => {
        const next = [...prev];

        const last = next[next.length - 1];

        if (
          last &&
          last.role === "assistant" &&
          last.streaming
        ) {
          next[next.length - 1] = {
            ...last,
            content: nextAnswer,
            streaming: true,
          };
        } else {
          next.push({
            role: "assistant",
            content: nextAnswer,
            streaming: true,
          });
        }

        return next;
      });
    });

    /* --------------------------------------------------------
       AUDIO
    -------------------------------------------------------- */

    socket.on("antimate:audio", async (data) => {
      const url =
        typeof data === "string"
          ? data
          : data?.url ||
            data?.audioUrl ||
            data?.audio ||
            null;

      if (url) {
        await playAudio(url);
      }
    });

    /* --------------------------------------------------------
       COMPLETE
    -------------------------------------------------------- */

    socket.on("antimate:complete", () => {
      setIsProcessing(false);

      const finalAnswer =
        currentAnswerRef.current;

      if (finalAnswer) {
        setMessages((prev) => {
          const next = [...prev];

          const last = next[next.length - 1];

          if (
            last &&
            last.role === "assistant"
          ) {
            next[next.length - 1] = {
              ...last,
              content: finalAnswer,
              streaming: false,
            };
          }

          return next;
        });
      }

      setCurrentAnswer("");
      currentAnswerRef.current = "";

      if (!isPlayingRef.current) {
        if (!liveModeRef.current) {
          setStatus("Niteguye kugufasha.");
        }
      }
    });

    /* --------------------------------------------------------
       ERROR
    -------------------------------------------------------- */

    socket.on("antimate:error", (data) => {
      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            "Habaye ikibazo.";

      console.error(
        "ANTIMATE SOCKET ERROR:",
        message
      );

      setError(message);
      setIsProcessing(false);
      setRecording(false);
      setLiveListening(false);

      recordingRef.current = false;
      liveListeningRef.current = false;

      clearTimers();
      stopMediaTracks();

      setStatus("Niteguye kongera kugerageza.");
    });

    return () => {
      clearTimers();
      stopMediaTracks();

      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [
    clearTimers,
    playAudio,
    stopMediaTracks,
  ]);

  /* ==========================================================
     SEND TEXT
  ========================================================== */

  const sendText = useCallback(async () => {
    const message = text.trim();

    if (!message || isProcessing || isPlaying) {
      return;
    }

    setError("");
    setText("");
    setTranscript("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: message,
      },
    ]);

    setIsProcessing(true);
    setStatus("ANTIMATE AI iri gutekereza...");

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `HTTP ${response.status}`
        );
      }

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        "";

      if (!answer) {
        throw new Error(
          "Backend ntiyagaruye igisubizo."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
        },
      ]);

      setStatus("Niteguye kugufasha.");
    } catch (err) {
      console.error("TEXT CHAT ERROR:", err);

      setError(
        err?.message ||
          "Ntabwo nabashije kohereza ubutumwa."
      );

      setStatus("Hari ikibazo mu kohereza ubutumwa.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    isPlaying,
    isProcessing,
    text,
  ]);

  /* ==========================================================
     RECORD MODE
     
     Short voice recording.
     Maximum = 30 seconds.
  ========================================================== */

  const finishRecording = useCallback(() => {
    clearTimers();

    const recorder = mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      try {
        recorder.stop();
      } catch (err) {
        console.error(
          "RECORDER STOP ERROR:",
          err
        );
      }
    }

    recordingRef.current = false;
    setRecording(false);

    stopMediaTracks();
  }, [
    clearTimers,
    stopMediaTracks,
  ]);

  const startRecordMode = useCallback(async () => {
    if (
      isProcessing ||
      isPlaying ||
      recordingRef.current ||
      liveModeRef.current
    ) {
      return;
    }

    if (!socketRef.current?.connected) {
      setError(
        "Voice ntiraboneka: Socket.IO ntirahuye na server."
      );
      return;
    }

    setError("");
    setTranscript("");
    setStatus("Tangira kuvuga...");
    setRecordSeconds(MAX_RECORD_SECONDS);

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      mediaStreamRef.current = stream;

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];

      const mimeType =
        mimeCandidates.find((type) =>
          MediaRecorder.isTypeSupported(type)
        ) || "";

      const recorder = new MediaRecorder(
        stream,
        mimeType
          ? { mimeType }
          : undefined
      );

      mediaRecorderRef.current = recorder;
      recordingRef.current = true;

      setRecording(true);

      recorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          socketRef.current?.emit(
            "antimate:voice:chunk",
            event.data
          );
        }
      };

      recorder.onstop = () => {
        recordingRef.current = false;
        setRecording(false);

        clearTimers();
        stopMediaTracks();

        socketRef.current?.emit(
          "antimate:voice:end"
        );

        setIsProcessing(true);
        setStatus(
          "ANTIMATE AI iri gutunganya ijwi..."
        );
      };

      recorder.onerror = (event) => {
        console.error(
          "MEDIA RECORDER ERROR:",
          event
        );

        setError(
          "Habaye ikibazo mu gufata amajwi."
        );

        finishRecording();
      };

      socketRef.current.emit(
        "antimate:voice:start",
        {
          mode: "record",
          mimeType:
            recorder.mimeType || mimeType,
        }
      );

      recorder.start(250);

      /* 30 SECOND COUNTDOWN */

      let remaining = MAX_RECORD_SECONDS;

      recordTimerRef.current =
        setInterval(() => {
          remaining -= 1;

          setRecordSeconds(
            Math.max(remaining, 0)
          );

          if (remaining <= 0) {
            finishRecording();
          }
        }, 1000);
    } catch (err) {
      console.error(
        "MICROPHONE ERROR:",
        err
      );

      setError(
        "Ntabwo nabashije gufungura microphone. Reba microphone permission."
      );

      recordingRef.current = false;
      setRecording(false);

      stopMediaTracks();
      clearTimers();
    }
  }, [
    clearTimers,
    finishRecording,
    isPlaying,
    isProcessing,
    stopMediaTracks,
  ]);

  /* ==========================================================
     LIVE VOICE
  ========================================================== */

  const stopLiveListening = useCallback(() => {
    clearTimers();

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      try {
        recorder.stop();
      } catch (err) {
        console.error(
          "LIVE STOP ERROR:",
          err
        );
      }
    }

    liveListeningRef.current = false;
    recordingRef.current = false;

    setLiveListening(false);
    setRecording(false);

    stopMediaTracks();
  }, [
    clearTimers,
    stopMediaTracks,
  ]);

  const sendLiveAudio = useCallback(() => {
    clearTimers();

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      try {
        recorder.stop();
      } catch (err) {
        console.error(
          "LIVE AUDIO STOP ERROR:",
          err
        );
      }
    }

    liveListeningRef.current = false;
    recordingRef.current = false;

    setLiveListening(false);
    setRecording(false);

    stopMediaTracks();

    socketRef.current?.emit(
      "antimate:voice:end"
    );

    setIsProcessing(true);
    setStatus(
      "ANTIMATE AI iri gutunganya ibyo wavuze..."
    );
  }, [
    clearTimers,
    stopMediaTracks,
  ]);

  const startLiveListening = useCallback(async () => {
    if (
      !liveModeRef.current ||
      isPlayingRef.current ||
      isProcessing
    ) {
      return;
    }

    if (
      recordingRef.current ||
      liveListeningRef.current
    ) {
      return;
    }

    if (!socketRef.current?.connected) {
      setError(
        "Live Voice ntiraboneka: Socket.IO ntirahuye na server."
      );
      return;
    }

    try {
      setError("");
      setTranscript("");

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      mediaStreamRef.current = stream;

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];

      const mimeType =
        mimeCandidates.find((type) =>
          MediaRecorder.isTypeSupported(type)
        ) || "";

      const recorder = new MediaRecorder(
        stream,
        mimeType
          ? { mimeType }
          : undefined
      );

      mediaRecorderRef.current = recorder;

      liveAudioChunksRef.current = [];

      recordingRef.current = true;
      liveListeningRef.current = true;

      setRecording(true);
      setLiveListening(true);

      setStatus("Ntegereje ko uvuga...");

      recorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          liveAudioChunksRef.current.push(
            event.data
          );

          socketRef.current?.emit(
            "antimate:voice:chunk",
            event.data
          );

          /*
             Iyo chunk ije, user aracyavuga.
             Dusubizaho silence timer.
          */

          if (silenceTimerRef.current) {
            clearTimeout(
              silenceTimerRef.current
            );
          }

          silenceTimerRef.current =
            setTimeout(() => {
              if (
                liveListeningRef.current
              ) {
                sendLiveAudio();
              }
            }, SILENCE_DURATION);
        }
      };

      recorder.onstop = () => {
        recordingRef.current = false;

        setRecording(false);
        setLiveListening(false);

        stopMediaTracks();
      };

      recorder.onerror = (event) => {
        console.error(
          "LIVE MEDIA ERROR:",
          event
        );

        setError(
          "Live microphone yagize ikibazo."
        );

        stopLiveListening();
      };

      socketRef.current.emit(
        "antimate:voice:start",
        {
          mode: "live",
          mimeType:
            recorder.mimeType || mimeType,
        }
      );

      recorder.start(250);

      /*
         Niba user acecetse ako kanya,
         silence timer izohereza audio nyuma ya 1.8s.
      */

      silenceTimerRef.current =
        setTimeout(() => {
          if (
            liveListeningRef.current
          ) {
            sendLiveAudio();
          }
        }, SILENCE_DURATION);
    } catch (err) {
      console.error(
        "LIVE MICROPHONE ERROR:",
        err
      );

      setError(
        "Ntabwo nabashije gufungura microphone ya Live Voice."
      );

      liveListeningRef.current = false;
      recordingRef.current = false;

      setLiveListening(false);
      setRecording(false);

      stopMediaTracks();
      clearTimers();
    }
  }, [
    clearTimers,
    isProcessing,
    sendLiveAudio,
    stopLiveListening,
    stopMediaTracks,
  ]);

  /*
     IMPORTANT:
     playAudio uses startLiveListening before declaration.
     Store it in ref after function exists.
  */

  const startLiveListeningRef =
    useRef(null);

  useEffect(() => {
    startLiveListeningRef.current =
      startLiveListening;
  }, [startLiveListening]);

  /*
     Re-open live microphone after response.
  */

  useEffect(() => {
    if (
      !isPlaying &&
      liveModeRef.current &&
      !isProcessing &&
      !recordingRef.current
    ) {
      const timer = setTimeout(() => {
        if (
          liveModeRef.current &&
          !recordingRef.current &&
          !isPlayingRef.current
        ) {
          startLiveListeningRef.current?.();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    isPlaying,
    isProcessing,
  ]);

  /* ==========================================================
     LIVE MODE TOGGLE
  ========================================================== */

  const toggleLiveMode = useCallback(() => {
    if (
      isProcessing ||
      isPlaying
    ) {
      return;
    }

    if (liveModeRef.current) {
      liveModeRef.current = false;

      setLiveMode(false);
      setLiveListening(false);

      stopLiveListening();

      setStatus(
        "Live Voice yazimye."
      );

      return;
    }

    if (!socketConnected) {
      setError(
        "Live Voice ntiraboneka kuko server itarahuzwa."
      );
      return;
    }

    setError("");

    liveModeRef.current = true;
    setLiveMode(true);

    setStatus(
      "Live Voice irafunguye..."
    );

    setTimeout(() => {
      startLiveListeningRef.current?.();
    }, 150);
  }, [
    isPlaying,
    isProcessing,
    socketConnected,
    stopLiveListening,
  ]);

  /* ==========================================================
     RECORD BUTTON
  ========================================================== */

  const handleRecordButton = useCallback(() => {
    if (recordingRef.current) {
      finishRecording();
      return;
    }

    startRecordMode();
  }, [
    finishRecording,
    startRecordMode,
  ]);

  /* ==========================================================
     KEYBOARD
  ========================================================== */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (text.trim()) {
        sendText();
      }
    }
  };

  /* ==========================================================
     INPUT CHANGE
  ========================================================== */

  const handleTextChange = (event) => {
    const value = event.target.value;

    setText(value);

    if (value.trim()) {
      /*
         User started typing.
         Live voice should not continue.
      */

      if (liveModeRef.current) {
        liveModeRef.current = false;

        setLiveMode(false);

        if (
          recordingRef.current ||
          liveListeningRef.current
        ) {
          stopLiveListening();
        }
      }

      if (!recordingRef.current) {
        setStatus("Andika ubutumwa...");
      }
    } else {
      if (!recordingRef.current) {
        setStatus(
          liveModeRef.current
            ? "Live Voice iriteguye."
            : "Hitamo uburyo bwo kuvuga."
        );
      }
    }
  };

  /* ==========================================================
     CLEAR ERROR ON NEW ACTION
  ========================================================== */

  const clearError = () => {
    if (error) setError("");
  };

  /* ==========================================================
     DERIVED UI
  ========================================================== */

  const hasText = Boolean(text.trim());

  const showVoiceButtons =
    !hasText &&
    !isProcessing &&
    !isPlaying;

  const displayRecordTime =
    `00:${String(recordSeconds).padStart(
      2,
      "0"
    )}`;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className={`antimate-page ${
        theme === "light"
          ? "theme-light"
          : "theme-dark"
      }`}
      onClick={clearError}
    >
      <style>{`

        /* =====================================================
           GLOBAL
        ===================================================== */

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
        }

        body {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        textarea {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        /* =====================================================
           PAGE
        ===================================================== */

        .antimate-page {
          --bg:
            #06080d;

          --bg-soft:
            #0b0e15;

          --surface:
            rgba(18, 22, 31, 0.76);

          --surface-strong:
            rgba(23, 28, 39, 0.94);

          --surface-message:
            rgba(22, 27, 38, 0.9);

          --border:
            rgba(255, 255, 255, 0.09);

          --border-strong:
            rgba(255, 255, 255, 0.15);

          --text:
            #f5f7fb;

          --text-soft:
            #b8bfcd;

          --text-muted:
            #7f8796;

          --accent:
            #ffffff;

          --accent-text:
            #05070b;

          --danger:
            #ff6b7d;

          min-height: 100vh;
          width: 100%;
          color: var(--text);
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(102, 78, 255, 0.11),
              transparent 38%
            ),
            radial-gradient(
              circle at 0% 100%,
              rgba(0, 212, 255, 0.06),
              transparent 35%
            ),
            var(--bg);

          display: flex;
          flex-direction: column;

          overflow: hidden;

          transition:
            background 0.35s ease,
            color 0.35s ease;
        }

        .antimate-page.theme-light {
          --bg:
            #f4f6fa;

          --bg-soft:
            #ffffff;

          --surface:
            rgba(255, 255, 255, 0.8);

          --surface-strong:
            rgba(255, 255, 255, 0.95);

          --surface-message:
            #ffffff;

          --border:
            rgba(16, 24, 40, 0.09);

          --border-strong:
            rgba(16, 24, 40, 0.15);

          --text:
            #10131a;

          --text-soft:
            #525a69;

          --text-muted:
            #7a8392;

          --accent:
            #10131a;

          --accent-text:
            #ffffff;

          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(105, 87, 255, 0.1),
              transparent 38%
            ),
            #f4f6fa;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .antimate-header {
          width: 100%;
          height: 72px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 clamp(18px, 4vw, 48px);

          border-bottom:
            1px solid var(--border);

          background:
            color-mix(
              in srgb,
              var(--bg) 78%,
              transparent
            );

          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);

          position: relative;
          z-index: 10;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .brand-name {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .brand-title {
          font-size: 16px;
          font-weight: 750;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }

        .brand-subtitle {
          color: var(--text-muted);
          font-size: 11px;
          margin-top: 2px;
          white-space: nowrap;
        }

        /* =====================================================
           LOGO
        ===================================================== */

        .antimate-logo-wrap {
          width: 40px;
          height: 40px;

          display: grid;
          place-items: center;

          flex-shrink: 0;
        }

        .antimate-logo-wrap.logo-small {
          width: 34px;
          height: 34px;
        }

        .antimate-logo {
          width: 34px;
          height: 34px;

          position: relative;

          border-radius: 50%;

          display: grid;
          place-items: center;

          filter:
            drop-shadow(
              0 0 10px rgba(91, 94, 255, 0.25)
            );
        }

        .logo-small .antimate-logo {
          width: 29px;
          height: 29px;
        }

        .logo-orbit {
          position: absolute;
          inset: 2px;

          border-radius: 50%;

          border:
            3px solid transparent;

          border-top-color:
            #7c5cff;

          border-right-color:
            #00d9ff;

          border-bottom-color:
            #20e39a;

          border-left-color:
            #ff4f9a;

          animation:
            logoSpin 2.7s linear infinite;
        }

        .orbit-two {
          inset: 6px;

          border-width: 2px;

          border-top-color:
            #00d9ff;

          border-right-color:
            #ff4f9a;

          border-bottom-color:
            #7c5cff;

          border-left-color:
            #20e39a;

          animation:
            logoSpinReverse 1.9s linear infinite;
        }

        .logo-core {
          width: 12px;
          height: 12px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle at 35% 30%,
              #ffffff,
              #7c5cff 42%,
              #00d9ff
            );

          box-shadow:
            0 0 10px rgba(0, 217, 255, 0.45);
        }

        .logo-core span {
          display: block;

          width: 4px;
          height: 4px;

          margin: 4px;

          border-radius: 50%;

          background: #ffffff;
          opacity: 0.9;
        }

        @keyframes logoSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes logoSpinReverse {
          to {
            transform: rotate(-360deg);
          }
        }

        /* =====================================================
           HEADER RIGHT
        ===================================================== */

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .connection {
          display: flex;
          align-items: center;
          gap: 7px;

          color: var(--text-muted);

          font-size: 11px;
          white-space: nowrap;
        }

        .connection-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #ff6677;

          box-shadow:
            0 0 0 4px
            rgba(255, 102, 119, 0.08);
        }

        .connection-dot.connected {
          background: #27df9b;

          box-shadow:
            0 0 0 4px
            rgba(39, 223, 155, 0.09),
            0 0 12px
            rgba(39, 223, 155, 0.4);
        }

        .theme-button {
          width: 36px;
          height: 36px;

          border: 1px solid var(--border);
          border-radius: 50%;

          background: var(--surface);

          color: var(--text);

          display: grid;
          place-items: center;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .theme-button:hover {
          transform: translateY(-1px);
          border-color: var(--border-strong);
          background: var(--surface-strong);
        }

        .theme-button svg {
          width: 17px;
          height: 17px;

          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* =====================================================
           CHAT AREA
        ===================================================== */

        .chat-shell {
          width: 100%;
          max-width: 920px;

          flex: 1;

          margin: 0 auto;

          display: flex;
          flex-direction: column;

          padding:
            28px
            clamp(16px, 4vw, 28px)
            24px;

          min-height: 0;
        }

        .messages {
          flex: 1;

          min-height: 0;

          overflow-y: auto;

          padding:
            12px
            0
            30px;

          scrollbar-width: thin;
          scrollbar-color:
            var(--border-strong)
            transparent;
        }

        .messages::-webkit-scrollbar {
          width: 5px;
        }

        .messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages::-webkit-scrollbar-thumb {
          background: var(--border-strong);
          border-radius: 20px;
        }

        /* =====================================================
           EMPTY STATE
        ===================================================== */

        .empty-state {
          min-height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 30px 0 70px;
        }

        .empty-inner {
          width: 100%;
          max-width: 560px;

          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .empty-logo {
          width: 82px;
          height: 82px;

          display: grid;
          place-items: center;

          margin-bottom: 24px;

          border-radius: 27px;

          background:
            linear-gradient(
              145deg,
              rgba(124, 92, 255, 0.1),
              rgba(0, 217, 255, 0.04)
            );

          border:
            1px solid var(--border);

          box-shadow:
            0 20px 50px
            rgba(0, 0, 0, 0.13);
        }

        .empty-logo .antimate-logo {
          width: 55px;
          height: 55px;
        }

        .empty-logo .logo-core {
          width: 18px;
          height: 18px;
        }

        .empty-logo .logo-core span {
          width: 6px;
          height: 6px;
          margin: 6px;
        }

        .empty-title {
          margin: 0;

          font-size:
            clamp(28px, 5vw, 43px);

          line-height: 1.05;

          letter-spacing: -0.045em;

          font-weight: 780;
        }

        .empty-title span {
          background:
            linear-gradient(
              90deg,
              #7c5cff,
              #00d9ff,
              #20e39a,
              #ff4f9a,
              #7c5cff
            );

          background-size: 300% auto;

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;

          animation:
            gradientMove 5s linear infinite;
        }

        @keyframes gradientMove {
          to {
            background-position: 300% center;
          }
        }

        .empty-description {
          max-width: 490px;

          margin:
            15px auto 0;

          color: var(--text-soft);

          font-size: 14px;

          line-height: 1.7;
        }

        .empty-hint {
          margin-top: 24px;

          color: var(--text-muted);

          font-size: 12px;
        }

        /* =====================================================
           MESSAGES
        ===================================================== */

        .message-row {
          display: flex;

          width: 100%;

          margin-bottom: 18px;

          animation:
            messageIn 0.25s ease;
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

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;
        }

        .message-content {
          display: flex;
          gap: 10px;

          max-width: min(78%, 700px);
        }

        .assistant-avatar {
          width: 30px;
          height: 30px;

          flex-shrink: 0;

          margin-top: 3px;

          border-radius: 10px;

          display: grid;
          place-items: center;

          background:
            var(--surface);

          border:
            1px solid var(--border);
        }

        .assistant-avatar .antimate-logo {
          width: 22px;
          height: 22px;
        }

        .assistant-avatar .logo-orbit {
          border-width: 2px;
        }

        .assistant-avatar .logo-core {
          width: 7px;
          height: 7px;
        }

        .assistant-avatar .logo-core span {
          display: none;
        }

        .message-bubble {
          padding:
            12px
            15px;

          border-radius: 17px;

          font-size: 14px;

          line-height: 1.65;

          white-space: pre-wrap;

          word-break: break-word;
        }

        .assistant .message-bubble {
          background:
            var(--surface-message);

          border:
            1px solid var(--border);

          border-top-left-radius: 5px;

          color: var(--text);
        }

        .user .message-bubble {
          background:
            var(--accent);

          color:
            var(--accent-text);

          border-bottom-right-radius: 5px;
        }

        .streaming-cursor {
          display: inline-block;

          width: 5px;
          height: 15px;

          margin-left: 3px;

          vertical-align: -2px;

          border-radius: 2px;

          background: currentColor;

          animation:
            cursorBlink 0.8s infinite;
        }

        @keyframes cursorBlink {
          50% {
            opacity: 0;
          }
        }

        /* =====================================================
           TRANSCRIPT
        ===================================================== */

        .transcript-box {
          width: min(78%, 700px);

          margin:
            0
            auto
            12px;

          padding:
            10px
            13px;

          border:
            1px solid var(--border);

          border-radius: 13px;

          background:
            var(--surface);

          color: var(--text-soft);

          font-size: 12px;

          line-height: 1.5;
        }

        .transcript-label {
          display: block;

          color: var(--text-muted);

          font-size: 10px;

          text-transform: uppercase;

          letter-spacing: 0.08em;

          margin-bottom: 3px;
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .error-message {
          margin:
            0 auto
            12px;

          width: min(100%, 700px);

          padding:
            10px
            13px;

          border:
            1px solid
            rgba(255, 107, 125, 0.2);

          border-radius: 12px;

          background:
            rgba(255, 107, 125, 0.07);

          color:
            var(--danger);

          font-size: 12px;

          line-height: 1.5;
        }

        /* =====================================================
           COMPOSER
        ===================================================== */

        .composer-wrap {
          width: 100%;

          margin-top: auto;
        }

        .status-line {
          min-height: 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          margin-bottom: 8px;

          color: var(--text-muted);

          font-size: 11px;
        }

        .status-pulse {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background:
            #7c5cff;

          box-shadow:
            0 0 0 4px
            rgba(124, 92, 255, 0.07);

          animation:
            statusPulse 1.4s infinite;
        }

        @keyframes statusPulse {
          50% {
            transform: scale(0.65);
            opacity: 0.5;
          }
        }

        .composer {
          position: relative;

          width: 100%;

          min-height: 64px;

          display: flex;
          align-items: flex-end;

          gap: 10px;

          padding:
            9px
            9px
            9px
            17px;

          border:
            1px solid var(--border-strong);

          border-radius: 22px;

          background:
            var(--surface-strong);

          box-shadow:
            0 18px 60px
            rgba(0, 0, 0, 0.13);

          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .composer:focus-within {
          border-color:
            rgba(124, 92, 255, 0.35);

          box-shadow:
            0 18px 65px
            rgba(0, 0, 0, 0.17),
            0 0 0 3px
            rgba(124, 92, 255, 0.04);
        }

        .composer textarea {
          flex: 1;

          width: 100%;

          min-height: 43px;
          max-height: 150px;

          resize: none;

          border: none;
          outline: none;

          background: transparent;

          color: var(--text);

          font-size: 14px;

          line-height: 1.55;

          padding:
            11px
            0
            9px;

          scrollbar-width: thin;
        }

        .composer textarea::placeholder {
          color: var(--text-muted);
        }

        .composer textarea::-webkit-scrollbar {
          width: 4px;
        }

        /* =====================================================
           ACTION AREA
        ===================================================== */

        .voice-actions {
          display: flex;
          align-items: center;
          gap: 7px;

          flex-shrink: 0;
        }

        .action-button {
          position: relative;

          width: 45px;
          height: 45px;

          flex-shrink: 0;

          border: none;

          border-radius: 15px;

          display: grid;
          place-items: center;

          cursor: pointer;

          color: #ffffff;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .action-button:hover {
          transform: translateY(-1px);
        }

        .action-button:active {
          transform: scale(0.95);
        }

        .action-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          transform: none;
        }

        .action-button svg {
          width: 20px;
          height: 20px;

          fill: currentColor;
        }

        /* RECORD */

        .record-button {
          background:
            linear-gradient(
              145deg,
              #ff4f7b,
              #ff315f
            );

          box-shadow:
            0 8px 25px
            rgba(255, 49, 95, 0.2);
        }

        .record-button.recording {
          background:
            linear-gradient(
              145deg,
              #ff304f,
              #c71835
            );

          animation:
            recordPulse 1.2s infinite;
        }

        @keyframes recordPulse {
          50% {
            box-shadow:
              0 0 0 7px
              rgba(255, 48, 79, 0.09),
              0 8px 28px
              rgba(255, 48, 79, 0.3);
          }
        }

        /* LIVE */

        .live-button {
          background:
            linear-gradient(
              145deg,
              #16d99a,
              #0caf7a
            );

          box-shadow:
            0 8px 25px
            rgba(22, 217, 154, 0.17);
        }

        .live-button.active {
          background:
            linear-gradient(
              145deg,
              #00cfff,
              #5672ff
            );

          animation:
            livePulse 1.5s infinite;
        }

        @keyframes livePulse {
          50% {
            box-shadow:
              0 0 0 7px
              rgba(0, 207, 255, 0.08),
              0 8px 28px
              rgba(0, 207, 255, 0.24);
          }
        }

        /* SEND */

        .send-button {
          background:
            var(--accent);

          color:
            var(--accent-text);

          box-shadow:
            0 8px 25px
            rgba(0, 0, 0, 0.12);
        }

        /* =====================================================
           RECORD COUNTDOWN
        ===================================================== */

        .record-countdown {
          position: absolute;

          top: -36px;
          right: 0;

          padding:
            6px
            10px;

          border:
            1px solid
            rgba(255, 107, 125, 0.18);

          border-radius: 10px;

          background:
            var(--surface-strong);

          color:
            var(--danger);

          font-size: 11px;

          font-variant-numeric:
            tabular-nums;

          backdrop-filter: blur(15px);
        }

        /* =====================================================
           LIVE INDICATOR
        ===================================================== */

        .live-indicator {
          position: absolute;

          top: -36px;
          left: 0;

          display: flex;
          align-items: center;

          gap: 6px;

          color:
            #20d99b;

          font-size: 11px;
        }

        .live-indicator-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background:
            #20d99b;

          animation:
            liveDot 1s infinite;
        }

        @keyframes liveDot {
          50% {
            opacity: 0.3;
            transform: scale(0.7);
          }
        }

        /* =====================================================
           PROCESSING
        ===================================================== */

        .processing {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .processing span {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: currentColor;

          animation:
            processingDot 1.1s infinite;
        }

        .processing span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .processing span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes processingDot {
          0%,
          70%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }

          35% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .composer-footer {
          display: flex;
          justify-content: center;

          margin-top: 9px;

          color: var(--text-muted);

          font-size: 10px;

          text-align: center;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 650px) {

          .antimate-header {
            height: 62px;

            padding:
              0
              14px;
          }

          .brand-title {
            font-size: 14px;
          }

          .brand-subtitle {
            display: none;
          }

          .connection {
            font-size: 10px;
          }

          .chat-shell {
            padding:
              15px
              12px
              15px;
          }

          .messages {
            padding-top: 5px;
            padding-bottom: 18px;
          }

          .message-content {
            max-width: 90%;
          }

          .transcript-box {
            width: 90%;
          }

          .empty-state {
            padding:
              15px
              0
              40px;
          }

          .empty-logo {
            width: 68px;
            height: 68px;

            border-radius: 22px;
          }

          .empty-logo .antimate-logo {
            width: 45px;
            height: 45px;
          }

          .empty-title {
            font-size: 31px;
          }

          .empty-description {
            font-size: 13px;
            padding: 0 15px;
          }

          .composer {
            min-height: 60px;

            padding:
              7px
              7px
              7px
              14px;

            border-radius: 20px;
          }

          .composer textarea {
            font-size: 14px;
            min-height: 43px;
          }

          .action-button {
            width: 43px;
            height: 43px;
            border-radius: 14px;
          }

          .record-countdown,
          .live-indicator {
            top: -33px;
          }

          .composer-footer {
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }

      `}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="antimate-header">
        <div className="brand">
          <AntimateLogo />

          <div className="brand-name">
            <div className="brand-title">
              ANTIMATE AI
            </div>

            <div className="brand-subtitle">
              Intelligent Brooding Assistant
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="connection">
            <span
              className={`connection-dot ${
                socketConnected
                  ? "connected"
                  : ""
              }`}
            />

            {socketConnected
              ? "Online"
              : "Connecting"}
          </div>

          <button
            type="button"
            className="theme-button"
            onClick={() =>
              setTheme((prev) =>
                prev === "dark"
                  ? "light"
                  : "dark"
              )
            }
            aria-label="Change theme"
            title={
              theme === "dark"
                ? "Light theme"
                : "Dark theme"
            }
          >
            {theme === "dark" ? (
              <SunIcon />
            ) : (
              <MoonIcon />
            )}
          </button>
        </div>
      </header>

      {/* ======================================================
          MAIN CHAT
      ====================================================== */}

      <main className="chat-shell">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-inner">
                <div className="empty-logo">
                  <AntimateLogo />
                </div>

                <h1 className="empty-title">
                  Muraho, ndi{" "}
                  <span>
                    ANTIMATE AI
                  </span>
                </h1>

                <p className="empty-description">
                  Umufasha wawe w'ubworozi.
                  Ushobora kumbaza ikibazo,
                  kwandika ubutumwa cyangwa
                  gukoresha ijwi.
                </p>

                <div className="empty-hint">
                  Andika hasi cyangwa hitamo
                  uburyo bwo kuvuga.
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map(
                (message, index) => (
                  <div
                    key={`${index}-${message.role}`}
                    className={`message-row ${
                      message.role
                    }`}
                  >
                    <div className="message-content">
                      {message.role ===
                        "assistant" && (
                        <div className="assistant-avatar">
                          <AntimateLogo
                            small
                          />
                        </div>
                      )}

                      <div className="message-bubble">
                        {message.content}

                        {message.streaming && (
                          <span className="streaming-cursor" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </>
          )}

          {transcript && (
            <div className="transcript-box">
              <span className="transcript-label">
                Wavuze
              </span>

              {transcript}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ====================================================
            COMPOSER
        ==================================================== */}

        <div className="composer-wrap">
          <div className="status-line">
            <span className="status-pulse" />
            <span>{status}</span>
          </div>

          <div className="composer">
            {/* LIVE STATUS */}

            {liveMode && (
              <div className="live-indicator">
                <span className="live-indicator-dot" />

                {liveListening
                  ? "LIVE"
                  : "LIVE Voice"}
              </div>
            )}

            {/* RECORD COUNTDOWN */}

            {recording &&
              !liveMode && (
                <div className="record-countdown">
                  {displayRecordTime}
                </div>
              )}

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={
                liveMode
                  ? "Live Voice iriteguye..."
                  : "Andika ubutumwa..."
              }
              rows={1}
              disabled={
                isProcessing ||
                isPlaying
              }
              aria-label="Andika ubutumwa"
            />

            {/* =================================================
                ONE AREA — BUTTONS CHANGE WITH ACTION
            ================================================= */}

            <div className="voice-actions">
              {/* -----------------------------------------------
                  PROCESSING
              ----------------------------------------------- */}

              {isProcessing && (
                <button
                  type="button"
                  className="action-button send-button"
                  disabled
                  aria-label="Processing"
                >
                  <div className="processing">
                    <span />
                    <span />
                    <span />
                  </div>
                </button>
              )}

              {/* -----------------------------------------------
                  SPEAKING
              ----------------------------------------------- */}

              {!isProcessing &&
                isPlaying && (
                  <button
                    type="button"
                    className="action-button send-button"
                    disabled
                    aria-label="ANTIMATE is speaking"
                  >
                    <VolumeIcon />
                  </button>
                )}

              {/* -----------------------------------------------
                  USER TYPING
                  ONLY SEND BUTTON
              ----------------------------------------------- */}

              {!isProcessing &&
                !isPlaying &&
                hasText && (
                  <button
                    type="button"
                    className="action-button send-button"
                    onClick={sendText}
                    disabled={!text.trim()}
                    aria-label="Send message"
                    title="Send"
                  >
                    <SendIcon />
                  </button>
                )}

              {/* -----------------------------------------------
                  EMPTY INPUT
                  ONLY TWO VOICE BUTTONS
              ----------------------------------------------- */}

              {!isProcessing &&
                !isPlaying &&
                !hasText &&
                showVoiceButtons && (
                  <>
                    {/* RECORD 30s */}

                    <button
                      type="button"
                      className={`action-button record-button ${
                        recording &&
                        !liveMode
                          ? "recording"
                          : ""
                      }`}
                      onClick={
                        handleRecordButton
                      }
                      disabled={
                        !socketConnected ||
                        liveMode
                      }
                      aria-label={
                        recording &&
                        !liveMode
                          ? "Stop recording"
                          : "Record voice"
                      }
                      title={
                        recording &&
                        !liveMode
                          ? "Stop recording"
                          : "Record — max 30 seconds"
                      }
                    >
                      {recording &&
                      !liveMode ? (
                        <StopIcon />
                      ) : (
                        <MicIcon />
                      )}
                    </button>

                    {/* LIVE VOICE */}

                    <button
                      type="button"
                      className={`action-button live-button ${
                        liveMode
                          ? "active"
                          : ""
                      }`}
                      onClick={
                        toggleLiveMode
                      }
                      disabled={
                        !socketConnected
                      }
                      aria-label={
                        liveMode
                          ? "Stop live voice"
                          : "Live voice"
                      }
                      title={
                        liveMode
                          ? "Stop Live Voice"
                          : "Live Voice"
                      }
                    >
                      {liveMode ? (
                        <StopIcon />
                      ) : (
                        <MicIcon />
                      )}
                    </button>
                  </>
                )}
            </div>
          </div>

          <div className="composer-footer">
            {liveMode
              ? "Live Voice: ceceka amasegonda 1.8 kugira ngo ijwi ryoherezwe."
              : "Enter → kohereza  •  Shift + Enter → umurongo mushya"}
          </div>
        </div>
      </main>
    </div>
  );
}