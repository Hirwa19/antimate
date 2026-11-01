import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_URL ||
  window.location.origin;

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const HOLD_TO_RECORD_MS = 450;
const SHORT_RECORDING_MS = 1800;
const CHUNK_INTERVAL_MS = 250;

const MAX_RECORDING_MS =
  Number(import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS) || 120000;

const HISTORY_LIMIT = 30;

// ============================================================
// HELPERS
// ============================================================

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createConversationId() {
  return `conv-${createId()}`;
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  return (
    types.find((type) => {
      try {
        return MediaRecorder.isTypeSupported(type);
      } catch {
        return false;
      }
    }) || ""
  );
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
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("file://")) return null;

  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return url;
}

function normalizeAnswer(data = {}) {
  return (
    data.answer ||
    data.answer_rw ||
    data.answer_kinyarwanda ||
    data.text ||
    data.message ||
    ""
  );
}

function normalizeMode(data = {}) {
  return (
    data.processing_mode ||
    data.mode ||
    "gpu"
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {
  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const audioRef = useRef(null);
  const wakeLockRef = useRef(null);

  const audioChunksRef = useRef([]);

  const isRecordingRef = useRef(false);
  const isStartingRecordingRef = useRef(false);
  const isHoldingRef = useRef(false);

  const voiceSessionActiveRef = useRef(false);
  const audioReceivedRef = useRef(false);

  const currentAnswerRef = useRef("");
  const processingModeRef = useRef("gpu");

  const liveAssistantMessageIdRef = useRef(null);

  const holdTimerRef = useRef(null);
  const shortClickTimerRef = useRef(null);
  const autoStopTimerRef = useRef(null);

  const conversationIdRef = useRef(
    localStorage.getItem("antimate_conversation_id") ||
      createConversationId()
  );

  const mountedRef = useRef(true);

  const messagesRef = useRef([]);

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("antimate_messages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [text, setText] = useState("");

  const [socketConnected, setSocketConnected] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [status, setStatus] = useState("ready");

  const [statusMessage, setStatusMessage] = useState(
    "Kanda microphone utangire kuvuga."
  );

  const [processingMode, setProcessingMode] = useState(null);

  const [transcript, setTranscript] = useState("");
  const [thinkingText, setThinkingText] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // ----------------------------------------------------------
  // KEEP REFS SYNCHRONIZED
  // ----------------------------------------------------------

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    processingModeRef.current = processingMode || "gpu";
  }, [processingMode]);

  // ----------------------------------------------------------
  // PERSIST CONVERSATION
  // ----------------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        "antimate_messages",
        JSON.stringify(messages.slice(-HISTORY_LIMIT))
      );

      localStorage.setItem(
        "antimate_conversation_id",
        conversationIdRef.current
      );
    } catch (error) {
      console.warn("Could not save conversation:", error);
    }
  }, [messages]);

  // ----------------------------------------------------------
  // MESSAGE HISTORY
  // ----------------------------------------------------------

  const getHistory = useCallback(() => {
    return messagesRef.current
      .slice(-HISTORY_LIMIT)
      .map((message) => ({
        role: message.role,
        content: message.text,
      }));
  }, []);

  // ----------------------------------------------------------
  // ADD USER MESSAGE
  // ----------------------------------------------------------

  const addUserMessage = useCallback((message) => {
    const clean = String(message || "").trim();

    if (!clean) return;

    setMessages((previous) => [
      ...previous,
      {
        id: `user-${createId()}`,
        role: "user",
        text: clean,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  // ----------------------------------------------------------
  // ADD ASSISTANT MESSAGE
  // ----------------------------------------------------------

  const addAssistantMessage = useCallback((message, mode = "gpu") => {
    const clean = String(message || "").trim();

    if (!clean) return;

    setMessages((previous) => {
      const last = previous[previous.length - 1];

      if (
        last?.role === "assistant" &&
        last?.text === clean
      ) {
        return previous;
      }

      return [
        ...previous,
        {
          id: `assistant-${createId()}`,
          role: "assistant",
          text: clean,
          mode,
          createdAt: Date.now(),
        },
      ];
    });
  }, []);

  // ----------------------------------------------------------
  // LIVE ASSISTANT MESSAGE
  // ----------------------------------------------------------

  const updateLiveAssistantMessage = useCallback(
    (answer, mode = "gpu") => {
      const clean = String(answer || "");

      if (!clean.trim()) return;

      setMessages((previous) => {
        let liveId = liveAssistantMessageIdRef.current;

        if (!liveId) {
          liveId = `assistant-live-${createId()}`;
          liveAssistantMessageIdRef.current = liveId;

          return [
            ...previous,
            {
              id: liveId,
              role: "assistant",
              text: clean,
              mode,
              live: true,
              createdAt: Date.now(),
            },
          ];
        }

        const exists = previous.some(
          (message) => message.id === liveId
        );

        if (!exists) {
          return [
            ...previous,
            {
              id: liveId,
              role: "assistant",
              text: clean,
              mode,
              live: true,
              createdAt: Date.now(),
            },
          ];
        }

        return previous.map((message) =>
          message.id === liveId
            ? {
                ...message,
                text: clean,
                mode,
                live: true,
              }
            : message
        );
      });
    },
    []
  );

  // ----------------------------------------------------------
  // FINALIZE LIVE MESSAGE
  // ----------------------------------------------------------

  const finalizeLiveAssistantMessage = useCallback(
    (answer, mode = "gpu") => {
      const clean = String(answer || "").trim();

      if (!clean) return;

      const liveId = liveAssistantMessageIdRef.current;

      setMessages((previous) => {
        if (liveId) {
          const exists = previous.some(
            (message) => message.id === liveId
          );

          if (exists) {
            return previous.map((message) =>
              message.id === liveId
                ? {
                    ...message,
                    text: clean,
                    mode,
                    live: false,
                  }
                : message
            );
          }
        }

        const last = previous[previous.length - 1];

        if (
          last?.role === "assistant" &&
          last?.text === clean
        ) {
          return previous;
        }

        return [
          ...previous,
          {
            id: `assistant-${createId()}`,
            role: "assistant",
            text: clean,
            mode,
            live: false,
            createdAt: Date.now(),
          },
        ];
      });

      liveAssistantMessageIdRef.current = null;
    },
    []
  );

  // ----------------------------------------------------------
  // STOP MEDIA TRACKS
  // ----------------------------------------------------------

  const stopMediaTracks = useCallback(() => {
    const stream = mediaStreamRef.current;

    if (!stream) return;

    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignore already stopped tracks.
      }
    });

    mediaStreamRef.current = null;
  }, []);

  // ----------------------------------------------------------
  // WAKE LOCK
  // ----------------------------------------------------------

  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;

    if (!voiceSessionActiveRef.current) return;

    if (
      wakeLockRef.current &&
      !wakeLockRef.current.released
    ) {
      return;
    }

    try {
      const lock = await navigator.wakeLock.request("screen");

      if (!voiceSessionActiveRef.current) {
        await lock.release();
        return;
      }

      wakeLockRef.current = lock;

      lock.addEventListener("release", () => {
        if (wakeLockRef.current === lock) {
          wakeLockRef.current = null;
        }
      });
    } catch (error) {
      console.warn("Wake Lock request failed:", error);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    const lock = wakeLockRef.current;

    wakeLockRef.current = null;

    if (lock) {
      try {
        await lock.release();
      } catch {
        // Ignore release errors.
      }
    }
  }, []);

  // ----------------------------------------------------------
  // END VOICE SESSION
  // ----------------------------------------------------------

  const endVoiceSession = useCallback(() => {
    voiceSessionActiveRef.current = false;
    audioReceivedRef.current = false;

    isRecordingRef.current = false;
    isStartingRecordingRef.current = false;

    setIsRecording(false);
    setIsProcessing(false);

    stopMediaTracks();
    releaseWakeLock();
  }, [stopMediaTracks, releaseWakeLock]);

  // ----------------------------------------------------------
  // AUDIO PLAYBACK
  // ----------------------------------------------------------

  const playAudio = useCallback(
    async (audioUrl) => {
      if (!audioUrl) return;

      const url = makeAbsoluteUrl(audioUrl);

      if (!url) return;

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }

        const audio = new Audio(url);

        audio.preload = "auto";
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          setStatus("speaking");
          setStatusMessage("ANTIMATE iri kuvuga...");
        };

        audio.onended = () => {
          if (audioRef.current !== audio) return;

          audioRef.current = null;
          setIsPlaying(false);

          if (voiceSessionActiveRef.current) {
            endVoiceSession();
          }

          setStatus("ready");
          setStatusMessage(
            "ANTIMATE yiteguye kongera kumva."
          );
        };

        audio.onerror = () => {
          if (audioRef.current !== audio) return;

          audioRef.current = null;
          setIsPlaying(false);

          if (voiceSessionActiveRef.current) {
            endVoiceSession();
          }

          setStatus("ready");
          setStatusMessage(
            "Igisubizo cyabonetse ariko audio ntiyakinze."
          );
        };

        await audio.play();
      } catch (error) {
        console.error("Audio playback error:", error);

        setIsPlaying(false);

        if (voiceSessionActiveRef.current) {
          endVoiceSession();
        }

        setStatusMessage("Audio ntiyashoboye gukina.");
      }
    },
    [endVoiceSession]
  );

  // ==========================================================
  // SOCKET.IO CONNECTION
  // One connection for the lifetime of this component.
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    // --------------------------------------------------------
    // CONNECT
    // --------------------------------------------------------

    const onConnect = () => {
      if (!mountedRef.current) return;

      setSocketConnected(true);
      setErrorMessage("");

      if (
        !isRecordingRef.current &&
        !isProcessing &&
        !isPlaying
      ) {
        setStatus("ready");
        setStatusMessage("ANTIMATE yiteguye kumva.");
      }

      if (voiceSessionActiveRef.current) {
        requestWakeLock();
      }
    };

    // --------------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------------

    const onDisconnect = (reason) => {
      console.warn("Socket disconnected:", reason);

      if (!mountedRef.current) return;

      setSocketConnected(false);

      if (isRecordingRef.current) {
        setErrorMessage(
          "Connection yacitse igihe wari uri gufata amajwi. Ongera ugerageze."
        );

        setStatus("error");
        setStatusMessage("Socket connection yatakaye.");

        const recorder = mediaRecorderRef.current;

        if (recorder && recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            // Ignore.
          }
        }

        mediaRecorderRef.current = null;

        endVoiceSession();
      } else {
        setStatus("disconnected");
        setStatusMessage(
          "Connection yacitse. Ngerageza kongera kuyihuza..."
        );
      }
    };

    // --------------------------------------------------------
    // CONNECT ERROR
    // --------------------------------------------------------

    const onConnectError = (error) => {
      console.error("Socket connection error:", error);

      if (!mountedRef.current) return;

      setSocketConnected(false);
      setErrorMessage("ANTIMATE server ntabwo iri kuboneka.");
    };

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    const onStatus = (data = {}) => {
      if (!mountedRef.current) return;

      const nextStatus = data.status || "ready";

      setStatus(nextStatus);

      if (data.mode) {
        processingModeRef.current = data.mode;
        setProcessingMode(data.mode);
      }

      if (data.message) {
        setStatusMessage(data.message);
      }

      if (nextStatus === "recording") {
        setIsRecording(true);
        isRecordingRef.current = true;

        voiceSessionActiveRef.current = true;
        requestWakeLock();
      }

      if (
        [
          "converting",
          "processing",
          "gpu_fallback",
          "uploaded",
          "receiving",
        ].includes(nextStatus)
      ) {
        setIsProcessing(true);
      }

      if (nextStatus === "cancelled") {
        endVoiceSession();
        setStatus("ready");
      }
    };

    // --------------------------------------------------------
    // TRANSCRIPT
    // --------------------------------------------------------

    const onTranscript = (data = {}) => {
      if (!mountedRef.current) return;

      const value =
        data.transcript ||
        data.text ||
        data.message ||
        "";

      if (value) {
        setTranscript(value);
      }
    };

    // --------------------------------------------------------
    // THINKING
    // --------------------------------------------------------

    const onThinking = (data = {}) => {
      if (!mountedRef.current) return;

      setIsProcessing(true);

      if (data.mode) {
        processingModeRef.current = data.mode;
        setProcessingMode(data.mode);
      }

      setThinkingText(
        data.text || "ANTIMATE iri gutekereza..."
      );
    };

    // --------------------------------------------------------
    // ANSWER
    // --------------------------------------------------------

    const onAnswer = (data = {}) => {
      if (!mountedRef.current) return;

      const answer = normalizeAnswer(data);

      const mode = normalizeMode(data);

      processingModeRef.current = mode;
      setProcessingMode(mode);

      if (answer) {
        currentAnswerRef.current = answer;

        setThinkingText("");

        updateLiveAssistantMessage(answer, mode);
      }
    };

    // --------------------------------------------------------
    // ANSWER CHUNK
    // --------------------------------------------------------

    const onAnswerChunk = (data = {}) => {
      if (!mountedRef.current) return;

      const chunk =
        data.chunk ||
        data.text ||
        data.answer ||
        "";

      if (!chunk) return;

      const mode = normalizeMode(data);

      processingModeRef.current = mode;
      setProcessingMode(mode);

      setIsProcessing(true);
      setThinkingText("");

      const nextAnswer = data.done
        ? chunk
        : currentAnswerRef.current + chunk;

      currentAnswerRef.current = nextAnswer;

      updateLiveAssistantMessage(nextAnswer, mode);
    };

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    const onAudio = (data = {}) => {
      if (!mountedRef.current) return;

      const rawUrl = getAudioUrl(
        data.audio_url ||
          data.audioUrl ||
          data.audio
      );

      if (data.mode) {
        processingModeRef.current = data.mode;
        setProcessingMode(data.mode);
      }

      if (rawUrl) {
        audioReceivedRef.current = true;
        playAudio(rawUrl);
      }
    };

    // --------------------------------------------------------
    // COMPLETE
    // --------------------------------------------------------

    const onComplete = (data = {}) => {
      if (!mountedRef.current) return;

      const answer = normalizeAnswer(data);

      const mode = normalizeMode(data);

      processingModeRef.current = mode;
      setProcessingMode(mode);

      const finalAnswer =
        answer || currentAnswerRef.current;

      if (finalAnswer) {
        currentAnswerRef.current = finalAnswer;

        finalizeLiveAssistantMessage(finalAnswer, mode);
      }

      setIsProcessing(false);
      setIsRecording(false);

      isRecordingRef.current = false;
      isStartingRecordingRef.current = false;

      setStatus("complete");

      setStatusMessage(
        "ANTIMATE yarangije gusubiza."
      );

      // Keep Wake Lock while audio is playing.
      // If no audio is expected, release the session.
      if (!audioReceivedRef.current) {
        endVoiceSession();
      }
    };

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    const onError = (data = {}) => {
      if (!mountedRef.current) return;

      const message =
        data.message ||
        data.error ||
        "ANTIMATE AI habayemo ikibazo.";

      setErrorMessage(message);

      setStatus("error");
      setStatusMessage(message);

      endVoiceSession();
    };

    // --------------------------------------------------------
    // REGISTER EVENTS
    // --------------------------------------------------------

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    socket.on("antimate:status", onStatus);
    socket.on("antimate:transcript", onTranscript);
    socket.on("antimate:thinking", onThinking);
    socket.on("antimate:answer", onAnswer);
    socket.on("antimate:answer:chunk", onAnswerChunk);
    socket.on("antimate:audio", onAudio);
    socket.on("antimate:complete", onComplete);
    socket.on("antimate:error", onError);

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      mountedRef.current = false;

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);

      socket.off("antimate:status", onStatus);
      socket.off("antimate:transcript", onTranscript);
      socket.off("antimate:thinking", onThinking);
      socket.off("antimate:answer", onAnswer);
      socket.off("antimate:answer:chunk", onAnswerChunk);
      socket.off("antimate:audio", onAudio);
      socket.off("antimate:complete", onComplete);
      socket.off("antimate:error", onError);

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    requestWakeLock,
    endVoiceSession,
    updateLiveAssistantMessage,
    finalizeLiveAssistantMessage,
    playAudio,
  ]);

  // ==========================================================
  // RECORDING
  // ==========================================================

  const startRecording = useCallback(async () => {
    if (
      isRecordingRef.current ||
      isStartingRecordingRef.current
    ) {
      return;
    }

    if (isProcessing || isPlaying) return;

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
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

    isStartingRecordingRef.current = true;

    try {
      setErrorMessage("");

      setTranscript("");
      setThinkingText("");

      currentAnswerRef.current = "";
      liveAssistantMessageIdRef.current = null;

      audioReceivedRef.current = false;
      audioChunksRef.current = [];

      voiceSessionActiveRef.current = true;

      await requestWakeLock();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

      // Component may have been unmounted while requesting mic.
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      // Socket might have disconnected while requesting mic.
      if (!socket.connected) {
        stream.getTracks().forEach((track) => track.stop());

        throw new Error(
          "Socket connection yatakaye. Ongera ugerageze."
        );
      }

      mediaStreamRef.current = stream;

      const preferredMime = getSupportedMimeType();

      let recorder;

      try {
        recorder = preferredMime
          ? new MediaRecorder(stream, {
              mimeType: preferredMime,
            })
          : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      const actualMimeType =
        recorder.mimeType ||
        preferredMime ||
        "audio/webm";

      const extension =
        extensionFromMimeType(actualMimeType);

      // ------------------------------------------------------
      // START BACKEND SESSION
      // ------------------------------------------------------

      socket.emit("antimate:voice:start", {
        mimeType: actualMimeType,
        extension,
        language: "rw",
        conversationId: conversationIdRef.current,
        history: getHistory(),
      });

      // ------------------------------------------------------
      // AUDIO CHUNKS
      // ------------------------------------------------------

      recorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0) return;

        audioChunksRef.current.push(event.data);

        if (
          socket.connected &&
          isRecordingRef.current
        ) {
          try {
            const buffer = await event.data.arrayBuffer();

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
              "Audio chunk conversion error:",
              error
            );
          }
        }
      };

      // ------------------------------------------------------
      // RECORDER ERROR
      // ------------------------------------------------------

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);

        setErrorMessage(
          "Microphone recording habayemo ikibazo."
        );

        setStatus("error");

        try {
          if (socket.connected) {
            socket.emit("antimate:voice:cancel");
          }
        } catch {
          // Ignore.
        }

        mediaRecorderRef.current = null;

        endVoiceSession();
      };

      // ------------------------------------------------------
      // START
      // ------------------------------------------------------

      isRecordingRef.current = true;
      isStartingRecordingRef.current = false;

      setIsRecording(true);
      setIsProcessing(false);

      setStatus("recording");
      setStatusMessage("ANTIMATE iri kumva...");

      recorder.start(CHUNK_INTERVAL_MS);

      // ------------------------------------------------------
      // MAX RECORDING TIME
      // ------------------------------------------------------

      clearTimeout(autoStopTimerRef.current);

      autoStopTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current) {
          stopRecording();
        }
      }, MAX_RECORDING_MS);
    } catch (error) {
      console.error("Microphone error:", error);

      setErrorMessage(
        error?.message ||
          "Microphone ntiyashoboye gufunguka."
      );

      setStatus("error");

      mediaRecorderRef.current = null;

      endVoiceSession();
    } finally {
      isStartingRecordingRef.current = false;
    }
  }, [
    isProcessing,
    isPlaying,
    requestWakeLock,
    getHistory,
    endVoiceSession,
  ]);

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = useCallback(() => {
    clearTimeout(autoStopTimerRef.current);
    autoStopTimerRef.current = null;

    if (!isRecordingRef.current) return;

    isRecordingRef.current = false;

    setIsRecording(false);
    setIsProcessing(true);

    setStatus("uploaded");

    setStatusMessage(
      "Audio yakiriwe. ANTIMATE iri gutekereza..."
    );

    const socket = socketRef.current;
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        stopMediaTracks();

        if (socket && socket.connected) {
          socket.emit("antimate:voice:end");
        } else {
          endVoiceSession();

          setStatus("error");
          setErrorMessage(
            "Connection yatakaye mbere yo kohereza audio."
          );
        }
      };

      try {
        recorder.stop();
      } catch (error) {
        console.error("Recorder stop error:", error);

        stopMediaTracks();

        if (socket?.connected) {
          socket.emit("antimate:voice:end");
        }
      }
    } else {
      stopMediaTracks();

      if (socket?.connected) {
        socket.emit("antimate:voice:end");
      }
    }

    mediaRecorderRef.current = null;
  }, [stopMediaTracks, endVoiceSession]);

  // ==========================================================
  // CANCEL RECORDING
  // ==========================================================

  const cancelRecording = useCallback(() => {
    clearTimeout(holdTimerRef.current);
    clearTimeout(shortClickTimerRef.current);
    clearTimeout(autoStopTimerRef.current);

    holdTimerRef.current = null;
    shortClickTimerRef.current = null;
    autoStopTimerRef.current = null;

    isHoldingRef.current = false;
    isStartingRecordingRef.current = false;

    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit("antimate:voice:cancel");
    }

    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Ignore.
      }
    }

    mediaRecorderRef.current = null;

    endVoiceSession();

    setStatus("cancelled");
    setStatusMessage("Recording yahagaritswe.");
  }, [endVoiceSession]);

  // ==========================================================
  // POINTER EVENTS
  // ==========================================================

  const handleRecordPointerDown = useCallback(
    (event) => {
      event.preventDefault();

      if (
        isRecordingRef.current ||
        isStartingRecordingRef.current ||
        isProcessing ||
        isPlaying
      ) {
        return;
      }

      isHoldingRef.current = true;

      try {
        event.currentTarget.setPointerCapture(
          event.pointerId
        );
      } catch {
        // Pointer capture may not be supported.
      }

      clearTimeout(holdTimerRef.current);

      holdTimerRef.current = setTimeout(() => {
        if (isHoldingRef.current) {
          startRecording();
        }
      }, HOLD_TO_RECORD_MS);
    },
    [isProcessing, isPlaying, startRecording]
  );

  const handleRecordPointerUp = useCallback(
    (event) => {
      event.preventDefault();

      const wasHolding = isHoldingRef.current;

      isHoldingRef.current = false;

      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;

      // Long press: stop the recording.
      if (
        isRecordingRef.current ||
        isStartingRecordingRef.current
      ) {
        if (isRecordingRef.current) {
          stopRecording();
        }

        return;
      }

      // Short click: record for approximately 1.8 seconds.
      if (wasHolding) {
        clearTimeout(shortClickTimerRef.current);

        startRecording().then(() => {
          if (!mountedRef.current) return;

          shortClickTimerRef.current = setTimeout(() => {
            if (isRecordingRef.current) {
              stopRecording();
            }
          }, SHORT_RECORDING_MS);
        });
      }
    },
    [startRecording, stopRecording]
  );

  const handleRecordPointerCancel = useCallback(
    (event) => {
      event.preventDefault();

      isHoldingRef.current = false;

      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;

      clearTimeout(shortClickTimerRef.current);
      shortClickTimerRef.current = null;

      if (isRecordingRef.current) {
        stopRecording();
      }
    },
    [stopRecording]
  );

  // ==========================================================
  // TEXT CHAT
  // ==========================================================

  const sendTextMessage = useCallback(async () => {
    const cleanText = text.trim();

    if (!cleanText) return;

    if (
      isProcessing ||
      isRecording ||
      isStartingRecordingRef.current
    ) {
      return;
    }

    setText("");
    setErrorMessage("");

    setStatus("processing");
    setStatusMessage("ANTIMATE iri gutekereza...");
    setIsProcessing(true);

    currentAnswerRef.current = "";
    liveAssistantMessageIdRef.current = null;

    addUserMessage(cleanText);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanText,
          language: "rw",
          conversationId: conversationIdRef.current,
          history: getHistory(),
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `ANTIMATE ntiyashoboye gusubiza. HTTP ${response.status}`
        );
      }

      const answer = normalizeAnswer(data);

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      const mode = normalizeMode(data);

      setProcessingMode(mode);
      processingModeRef.current = mode;

      currentAnswerRef.current = answer;

      addAssistantMessage(answer, mode);

      const rawAudio = getAudioUrl(
        data.audio_url ||
          data.audioUrl ||
          data.audio
      );

      if (rawAudio) {
        await playAudio(rawAudio);
      } else {
        setStatus("complete");
        setStatusMessage(
          "ANTIMATE yarangije gusubiza."
        );
      }
    } catch (error) {
      console.error("Text chat error:", error);

      setErrorMessage(
        error?.message ||
          "ANTIMATE ntiyashoboye gusubiza."
      );

      setStatus("error");

      setStatusMessage(
        error?.message || "Habaye ikibazo."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    text,
    isProcessing,
    isRecording,
    addUserMessage,
    addAssistantMessage,
    getHistory,
    playAudio,
  ]);

  // ----------------------------------------------------------
  // ENTER TO SEND
  // ----------------------------------------------------------

  const handleTextKeyDown = useCallback(
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

  // ----------------------------------------------------------
  // CLEAR ERROR
  // ----------------------------------------------------------

  const clearError = useCallback(() => {
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
  }, [isRecording, isProcessing, isPlaying]);

  // ----------------------------------------------------------
  // CLEAR CONVERSATION
  // ----------------------------------------------------------

  const clearConversation = useCallback(() => {
    if (
      isRecording ||
      isProcessing ||
      isPlaying
    ) {
      return;
    }

    setMessages([]);

    messagesRef.current = [];

    currentAnswerRef.current = "";
    liveAssistantMessageIdRef.current = null;

    conversationIdRef.current = createConversationId();

    localStorage.removeItem("antimate_messages");

    localStorage.setItem(
      "antimate_conversation_id",
      conversationIdRef.current
    );

    setTranscript("");
    setThinkingText("");
    setErrorMessage("");

    setStatus("ready");
    setStatusMessage("Ikiganiro gishya cyatangiye.");
  }, [isRecording, isProcessing, isPlaying]);

  // ==========================================================
  // PAGE VISIBILITY
  // ==========================================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        voiceSessionActiveRef.current
      ) {
        requestWakeLock();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [requestWakeLock]);

  // ==========================================================
  // FINAL CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      clearTimeout(holdTimerRef.current);
      clearTimeout(shortClickTimerRef.current);
      clearTimeout(autoStopTimerRef.current);

      const socket = socketRef.current;

      if (socket?.connected && isRecordingRef.current) {
        socket.emit("antimate:voice:cancel");
      }

      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Ignore.
        }
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = "";
        } catch {
          // Ignore.
        }

        audioRef.current = null;
      }

      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {
          // Ignore.
        }

        wakeLockRef.current = null;
      }
    };
  }, []);

  // ==========================================================
  // DERIVED UI
  // ==========================================================

  const recordButtonClass = [
    "antimate-record-button",
    isRecording ? "recording" : "",
    isProcessing ? "processing" : "",
    isPlaying ? "speaking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // ==========================================================
  // STYLES
  // ==========================================================

  const styles = `
    * {
      box-sizing: border-box;
    }

    .antimate-ai {
      --bg: #06111f;
      --surface: #0b1b2d;
      --surface-2: #10263d;
      --border: rgba(148,163,184,.16);
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #22c55e;
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      color: var(--text);
      background: linear-gradient(145deg,#030712,#071827 55%,#06111f);
      font-family: Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
      overflow: hidden;
    }

    .antimate-ai button,
    .antimate-ai textarea {
      font: inherit;
    }

    .antimate-header {
      position: sticky;
      top: 0;
      z-index: 20;
      min-height: 76px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px clamp(16px,4vw,42px);
      background: rgba(3,7,18,.92);
      border-bottom: 1px solid var(--border);
    }

    .antimate-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .antimate-brand h1 {
      margin: 0;
      font-size: 21px;
      letter-spacing: .04em;
      font-weight: 800;
    }

    .antimate-subtitle {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 11px;
    }

    .antimate-logo,
    .antimate-empty-logo {
      position: relative;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: conic-gradient(#22c55e,#06b6d4,#8b5cf6,#22c55e);
      box-shadow: 0 0 28px rgba(34,197,94,.2);
      animation: antimate-spin 7s linear infinite;
    }

    .antimate-logo {
      width: 43px;
      height: 43px;
    }

    .antimate-logo::before,
    .antimate-empty-logo::before {
      content: "";
      position: absolute;
      inset: 3px;
      border-radius: inherit;
      background: #06111f;
    }

    .antimate-logo span,
    .antimate-empty-logo span {
      position: relative;
      z-index: 1;
      width: 38%;
      height: 38%;
      border: 2px solid white;
      border-radius: 50%;
    }

    .antimate-connection {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(15,23,42,.65);
      color: var(--muted);
      font-size: 12px;
    }

    .connection-dot,
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #64748b;
    }

    .antimate-connection.online {
      color: #86efac;
    }

    .antimate-connection.online .connection-dot {
      background: #22c55e;
      box-shadow: 0 0 10px #22c55e;
    }

    .antimate-main {
      width: min(100%,980px);
      margin: 0 auto;
      padding: 18px clamp(12px,3vw,28px) 28px;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .antimate-chat {
      position: relative;
      flex: 1;
      min-height: 430px;
      max-height: calc(100vh - 245px);
      overflow-y: auto;
      padding: 12px 3px 18px;
      scrollbar-width: thin;
    }

    .antimate-empty {
      min-height: 410px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 30px 18px;
    }

    .antimate-empty-logo {
      width: 92px;
      height: 92px;
      margin-bottom: 24px;
    }

    .antimate-empty h2 {
      margin: 0 0 9px;
      font-size: clamp(24px,5vw,34px);
      font-weight: 800;
      color: #a7f3d0;
    }

    .antimate-empty p {
      max-width: 420px;
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }

    .antimate-messages {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .antimate-message {
      display: flex;
      flex-direction: column;
      max-width: min(82%,720px);
      animation: antimate-message-in .25s ease-out;
    }

    .antimate-message.user {
      align-self: flex-end;
      align-items: flex-end;
    }

    .antimate-message.assistant {
      align-self: flex-start;
      align-items: flex-start;
    }

    .message-bubble {
      padding: 12px 15px;
      border-radius: 18px;
      line-height: 1.6;
      font-size: 14px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .antimate-message.user .message-bubble {
      color: #ecfdf5;
      background: #087b50;
      border-bottom-right-radius: 5px;
    }

    .antimate-message.assistant .message-bubble {
      color: #e2e8f0;
      background: #10263d;
      border: 1px solid var(--border);
      border-bottom-left-radius: 5px;
    }

    .message-mode {
      margin: 5px 4px 0;
      color: #64748b;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .12em;
    }

    .antimate-live-transcript,
    .antimate-thinking {
      margin-top: 12px;
      border: 1px solid var(--border);
      background: rgba(15,23,42,.62);
      border-radius: 16px;
      padding: 11px 14px;
    }

    .antimate-live-transcript span {
      color: #67e8f9;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .antimate-live-transcript p {
      margin: 5px 0 0;
      color: #cbd5e1;
      font-size: 13px;
      line-height: 1.5;
    }

    .antimate-thinking {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #cbd5e1;
      font-size: 13px;
    }

    .thinking-dots {
      display: flex;
      gap: 4px;
    }

    .thinking-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      animation: antimate-bounce 1s infinite;
    }

    .thinking-dots span:nth-child(2) {
      animation-delay: .15s;
    }

    .thinking-dots span:nth-child(3) {
      animation-delay: .3s;
    }

    .antimate-thinking small {
      margin-left: auto;
      color: #64748b;
      font-weight: 700;
    }

    .antimate-status {
      min-height: 38px;
      display: flex;
      align-items: center;
      gap: 9px;
      margin: 8px 0;
      padding: 8px 12px;
      color: var(--muted);
      font-size: 11px;
      border-radius: 12px;
      background: rgba(15,23,42,.52);
      border: 1px solid var(--border);
    }

    .antimate-status.ready .status-indicator {
      background: #22c55e;
    }

    .antimate-status.recording .status-indicator,
    .antimate-status.error .status-indicator {
      background: #ef4444;
    }

    .antimate-status.processing .status-indicator,
    .antimate-status.uploaded .status-indicator,
    .antimate-status.receiving .status-indicator {
      background: #06b6d4;
    }

    .antimate-status.speaking .status-indicator {
      background: #a78bfa;
    }

    .status-mode {
      margin-left: auto;
      padding: 3px 7px;
      border-radius: 999px;
      background: rgba(148,163,184,.1);
      color: #94a3b8;
      font-size: 9px;
      font-weight: 800;
    }

    .antimate-error {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 7px 0;
      padding: 10px 12px;
      color: #fecaca;
      background: rgba(127,29,29,.25);
      border: 1px solid rgba(239,68,68,.28);
      border-radius: 12px;
      font-size: 12px;
    }

    .antimate-error span {
      flex: 1;
    }

    .antimate-error button {
      border: 0;
      background: transparent;
      color: #fca5a5;
      font-size: 22px;
      cursor: pointer;
    }

    .antimate-voice-control {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 9px 0 13px;
    }

    .antimate-record-button {
      position: relative;
      width: 82px;
      height: 82px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 50%;
      color: white;
      background: #059669;
      box-shadow: 0 12px 34px rgba(16,185,129,.24);
      cursor: pointer;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .antimate-record-button:disabled {
      cursor: not-allowed;
      opacity: .52;
    }

    .record-button-ring {
      position: absolute;
      inset: -8px;
      border: 1px solid rgba(34,197,94,.25);
      border-radius: 50%;
      pointer-events: none;
    }

    .antimate-record-button.recording {
      background: #dc2626;
      box-shadow: 0 0 0 9px rgba(239,68,68,.09);
    }

    .antimate-record-button.processing {
      background: #0891b2;
    }

    .antimate-record-button.speaking {
      background: #7c3aed;
    }

    .record-icon {
      position: relative;
      z-index: 2;
      font-size: 28px;
      line-height: 1;
    }

    .voice-help {
      margin-top: 14px;
      color: #64748b;
      font-size: 11px;
      text-align: center;
    }

    .antimate-input {
      display: flex;
      align-items: flex-end;
      gap: 9px;
      padding: 9px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: rgba(15,23,42,.76);
    }

    .antimate-input textarea {
      flex: 1;
      min-width: 0;
      max-height: 120px;
      resize: vertical;
      border: 0;
      outline: 0;
      padding: 10px 8px;
      color: #f8fafc;
      background: transparent;
      line-height: 1.45;
      font-size: 13px;
    }

    .antimate-input textarea::placeholder {
      color: #64748b;
    }

    .antimate-send-button,
    .antimate-clear-button {
      height: 42px;
      border: 0;
      border-radius: 12px;
      color: white;
      cursor: pointer;
    }

    .antimate-send-button {
      width: 42px;
      flex: 0 0 42px;
      background: #059669;
      font-size: 19px;
    }

    .antimate-clear-button {
      padding: 0 12px;
      background: rgba(148,163,184,.12);
      color: #cbd5e1;
      font-size: 11px;
    }

    .antimate-send-button:disabled,
    .antimate-clear-button:disabled {
      opacity: .35;
      cursor: not-allowed;
    }

    @keyframes antimate-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes antimate-bounce {
      0%,80%,100% { transform: translateY(0); opacity: .45; }
      40% { transform: translateY(-5px); opacity: 1; }
    }

    @keyframes antimate-message-in {
      from { opacity: 0; transform: translateY(7px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width:640px) {
      .antimate-header {
        min-height: 66px;
        padding: 10px 13px;
      }

      .antimate-logo {
        width: 38px;
        height: 38px;
      }

      .antimate-subtitle {
        font-size: 9px;
      }

      .antimate-connection {
        padding: 7px 9px;
        font-size: 10px;
      }

      .antimate-main {
        padding: 10px 10px 18px;
      }

      .antimate-chat {
        min-height: 350px;
        max-height: calc(100vh - 230px);
      }

      .antimate-message {
        max-width: 91%;
      }

      .message-bubble {
        padding: 10px 12px;
        font-size: 13px;
      }

      .antimate-record-button {
        width: 74px;
        height: 74px;
      }
    }

    @media (prefers-reduced-motion:reduce) {
      .antimate-ai *,
      .antimate-ai *::before,
      .antimate-ai *::after {
        animation-duration: .001ms !important;
        animation-iteration-count: 1 !important;
      }
    }
  `;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      <style>{styles}</style>

      <div className="antimate-ai">
        {/* HEADER */}

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
              socketConnected ? "online" : "offline",
            ].join(" ")}
          >
            <span className="connection-dot" />

            {socketConnected
              ? "Online"
              : "Connecting..."}
          </div>
        </header>

        {/* MAIN */}

        <main className="antimate-main">
          {/* CHAT */}

          <section className="antimate-chat">
            {messages.length === 0 && (
              <div className="antimate-empty">
                <div className="antimate-empty-logo">
                  <span />
                </div>

                <h2>Muraho, ndi ANTIMATE</h2>

                <p>
                  Vuga cyangwa wandike ubutumwa mu Kinyarwanda.
                </p>
              </div>
            )}

            <div className="antimate-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={[
                    "antimate-message",
                    message.role === "user"
                      ? "user"
                      : "assistant",
                  ].join(" ")}
                >
                  <div className="message-bubble">
                    {message.text}
                  </div>

                  {message.role === "assistant" &&
                    message.mode && (
                      <div className="message-mode">
                        {String(message.mode).toUpperCase()}
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* TRANSCRIPT */}

            {transcript && (
              <div className="antimate-live-transcript">
                <span>Wavuze:</span>
                <p>{transcript}</p>
              </div>
            )}

            {/* THINKING */}

            {isProcessing && thinkingText && (
              <div className="antimate-thinking">
                <div className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span>{thinkingText}</span>

                {processingMode && (
                  <small>
                    {String(processingMode).toUpperCase()}
                  </small>
                )}
              </div>
            )}
          </section>

          {/* STATUS */}

          <div
            className={[
              "antimate-status",
              status,
            ].join(" ")}
          >
            <span className="status-indicator" />

            <span>{statusMessage}</span>

            {processingMode && (
              <span className="status-mode">
                {String(processingMode).toUpperCase()}
              </span>
            )}
          </div>

          {/* ERROR */}

          {errorMessage && (
            <div className="antimate-error">
              <span>{errorMessage}</span>

              <button
                type="button"
                onClick={clearError}
                aria-label="Close error"
              >
                ×
              </button>
            </div>
          )}

          {/* VOICE CONTROL */}

          <section className="antimate-voice-control">
            <button
              type="button"
              className={recordButtonClass}
              onPointerDown={handleRecordPointerDown}
              onPointerUp={handleRecordPointerUp}
              onPointerCancel={handleRecordPointerCancel}
              onLostPointerCapture={handleRecordPointerCancel}
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

          {/* TEXT INPUT */}

          <section className="antimate-input">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder="Andika ubutumwa mu Kinyarwanda..."
              rows={1}
              disabled={isProcessing || isRecording}
            />

            <button
              type="button"
              onClick={sendTextMessage}
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

            <button
              type="button"
              onClick={clearConversation}
              disabled={
                isRecording ||
                isProcessing ||
                isPlaying
              }
              className="antimate-clear-button"
              title="Start a new conversation"
            >
              New
            </button>
          </section>
        </main>
      </div>
    </>
  );
}