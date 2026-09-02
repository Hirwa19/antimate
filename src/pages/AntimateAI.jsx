import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

/* ============================================================
   ANTIMATE AI
   SELF-CONTAINED JSX
   No AntimateAI.css required
   ============================================================ */

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_URL ||
  window.location.origin;

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const HOLD_TO_LIVE_MS = 5000;
const NORMAL_RECORDING_MS = 30000;
const SILENCE_DURATION_MS = 1800;
const SILENCE_CHECK_MS = 100;

const THINKING_MESSAGES = [
  "Reka ndebe...",
  "Ndimo kubitekerezaho...",
  "Ndimo gutunganya igisubizo...",
  "Ndimo kureba amakuru mfite...",
  "Hafi kurangira...",
];

/* ============================================================
   ICONS
   ============================================================ */

function AntimateMark({ small = false }) {
  return (
    <div
      className={`antimate-mark ${small ? "small" : ""}`}
      aria-label="ANTIMATE"
    >
      <div className="antimate-mark-ring">
        <span />
      </div>
    </div>
  );
}

function WaveIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="icon-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 18V14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M10 22V10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M16 26V6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M22 22V10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M27 18V14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="icon-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 3L10.8 13.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3L14.5 21L10.8 13.2L3 9.5L21 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="icon-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        fill="currentColor"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="spark-icon"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L13.9 8.1L20 10L13.9 11.9L12 18L10.1 11.9L4 10L10.1 8.1L12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */

function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  for (const type of types) {
    try {
      if (
        typeof MediaRecorder !== "undefined" &&
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

function extensionFromMimeType(mimeType = "") {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

function makeAbsoluteUrl(url) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return `${API_URL}/${url}`;
}

function getAudioUrl(payload) {
  if (!payload) return "";

  if (typeof payload === "string") {
    return makeAbsoluteUrl(payload);
  }

  if (payload instanceof ArrayBuffer) {
    const blob = new Blob([payload], {
      type: "audio/wav",
    });

    return URL.createObjectURL(blob);
  }

  if (payload instanceof Blob) {
    return URL.createObjectURL(payload);
  }

  if (typeof payload === "object") {
    const possible =
      payload.url ||
      payload.audioUrl ||
      payload.audio_url ||
      payload.path ||
      payload.file ||
      payload.data;

    if (typeof possible === "string") {
      return makeAbsoluteUrl(possible);
    }

    if (possible instanceof ArrayBuffer) {
      const blob = new Blob([possible], {
        type: payload.mimeType || "audio/wav",
      });

      return URL.createObjectURL(blob);
    }

    if (possible instanceof Blob) {
      return URL.createObjectURL(possible);
    }
  }

  return "";
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function AntimateAI() {
  /* ----------------------------------------------------------
     CHAT
     ---------------------------------------------------------- */

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  /* ----------------------------------------------------------
     CONNECTION
     ---------------------------------------------------------- */

  const [socketConnected, setSocketConnected] = useState(false);

  /* ----------------------------------------------------------
     VOICE
     ---------------------------------------------------------- */

  const [isRecording, setIsRecording] = useState(false);
  const [isLiveVoice, setIsLiveVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(30);

  /* ----------------------------------------------------------
     PROCESSING
     ---------------------------------------------------------- */

  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");

  /* ----------------------------------------------------------
     STATUS / ERROR
     ---------------------------------------------------------- */

  const [status, setStatus] = useState("ready");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* ----------------------------------------------------------
     REFS
     ---------------------------------------------------------- */

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const audioRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceAnimationRef = useRef(null);

  const recordingStartRef = useRef(0);
  const recordingModeRef = useRef("tap");

  const isRecordingRef = useRef(false);
  const isLiveVoiceRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isPlayingRef = useRef(false);

  const liveSessionRef = useRef(false);

  const holdTimerRef = useRef(null);
  const normalCountdownRef = useRef(null);
  const maxRecordingTimerRef = useRef(null);

  const pointerDownRef = useRef(false);
  const pointerDownTimeRef = useRef(0);

  const hasSpokenRef = useRef(false);
  const silenceStartedRef = useRef(null);

  const currentVoiceSessionRef = useRef(null);

  const liveWaitingForAudioRef = useRef(false);
  const liveResponseCompleteRef = useRef(false);

  const wakeLockRef = useRef(null);

  const messagesEndRef = useRef(null);

  const thinkingTimerRef = useRef(null);
  const thinkingIndexRef = useRef(0);

  /* ==========================================================
     KEEP REFS SYNCHRONIZED
     ========================================================== */

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isLiveVoiceRef.current = isLiveVoice;
  }, [isLiveVoice]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  /* ==========================================================
     SCROLL
     ========================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, thinkingText, transcript, currentAnswer]);

  /* ==========================================================
     THINKING ANIMATION
     ========================================================== */

  const startThinking = useCallback(() => {
    clearInterval(thinkingTimerRef.current);

    thinkingIndexRef.current = 0;

    setThinkingText(THINKING_MESSAGES[0]);

    thinkingTimerRef.current = setInterval(() => {
      thinkingIndexRef.current =
        (thinkingIndexRef.current + 1) % THINKING_MESSAGES.length;

      setThinkingText(
        THINKING_MESSAGES[thinkingIndexRef.current]
      );
    }, 1700);
  }, []);

  const stopThinking = useCallback(() => {
    clearInterval(thinkingTimerRef.current);
    thinkingTimerRef.current = null;
    setThinkingText("");
  }, []);

  /* ==========================================================
     WAKE LOCK
     ========================================================== */

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current =
          await navigator.wakeLock.request("screen");
      }
    } catch {
      // Wake lock is optional
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      wakeLockRef.current = null;
    }
  }, []);

  /* ==========================================================
     CLEAN AUDIO ANALYSIS
     ========================================================== */

  const stopSilenceDetection = useCallback(() => {
    if (silenceAnimationRef.current) {
      cancelAnimationFrame(silenceAnimationRef.current);
      silenceAnimationRef.current = null;
    }

    silenceStartedRef.current = null;
    hasSpokenRef.current = false;

    try {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    } catch {
      // ignore
    }

    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  /* ==========================================================
     MEDIA CLEANUP
     ========================================================== */

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });

      mediaStreamRef.current = null;
    }

    mediaRecorderRef.current = null;
  }, []);

  /* ==========================================================
     START SILENCE DETECTION
     ========================================================== */

  const startSilenceDetection = useCallback(
    (stream) => {
      if (!stream) return;

      try {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContextClass) return;

        const context = new AudioContextClass();

        const source = context.createMediaStreamSource(stream);

        const analyser = context.createAnalyser();

        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.75;

        source.connect(analyser);

        audioContextRef.current = context;
        analyserRef.current = analyser;

        const data = new Uint8Array(
          analyser.fftSize
        );

        const checkSilence = () => {
          if (
            !isLiveVoiceRef.current ||
            !isRecordingRef.current
          ) {
            return;
          }

          analyser.getByteTimeDomainData(data);

          let sum = 0;

          for (let i = 0; i < data.length; i++) {
            const normalized =
              (data[i] - 128) / 128;

            sum += normalized * normalized;
          }

          const rms = Math.sqrt(
            sum / data.length
          );

          const threshold = 0.018;

          if (rms > threshold) {
            hasSpokenRef.current = true;
            silenceStartedRef.current = null;
          } else if (hasSpokenRef.current) {
            if (!silenceStartedRef.current) {
              silenceStartedRef.current = Date.now();
            }

            const silentFor =
              Date.now() -
              silenceStartedRef.current;

            if (silentFor >= SILENCE_DURATION_MS) {
              silenceStartedRef.current = null;

              if (
                isRecordingRef.current &&
                isLiveVoiceRef.current
              ) {
                stopRecording(true);
                return;
              }
            }
          }

          silenceAnimationRef.current =
            requestAnimationFrame(checkSilence);
        };

        checkSilence();
      } catch {
        // If silence detection is unavailable,
        // live mode still works manually.
      }
    },
    []
  );

  /* ==========================================================
     STOP RECORDING
     ========================================================== */

  const stopRecording = useCallback(
    (liveSegment = false) => {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;

      clearInterval(normalCountdownRef.current);
      normalCountdownRef.current = null;

      stopSilenceDetection();

      const recorder =
        mediaRecorderRef.current;

      if (!recorder) {
        setIsRecording(false);

        if (!liveSegment) {
          setIsProcessing(false);
        }

        return;
      }

      const shouldKeepLive =
        liveSegment &&
        liveSessionRef.current;

      setIsRecording(false);
      isRecordingRef.current = false;

      if (shouldKeepLive) {
        setStatus("processing");
        setStatusMessage(
          "Ndimo gutegura igisubizo..."
        );

        setIsProcessing(true);
        isProcessingRef.current = true;
      } else {
        setStatus("processing");
        setStatusMessage(
          "Ndimo gutunganya amajwi..."
        );

        setIsProcessing(true);
        isProcessingRef.current = true;
      }

      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch {
        // ignore
      }

      mediaRecorderRef.current = null;
    },
    [stopSilenceDetection]
  );

  /* ==========================================================
     START RECORDING
     ========================================================== */

  const startRecording = useCallback(
    async (mode = "tap") => {
      if (isRecordingRef.current) return;

      if (
        isProcessingRef.current ||
        isPlayingRef.current
      ) {
        return;
      }

      const socket = socketRef.current;

      if (!socket || !socket.connected) {
        setErrorMessage(
          "ANTIMATE ntabwo ihujwe na server."
        );

        return;
      }

      setErrorMessage("");

      try {
        await requestWakeLock();

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });

        mediaStreamRef.current = stream;

        const mimeType =
          getSupportedMimeType();

        const recorderOptions = mimeType
          ? { mimeType }
          : undefined;

        const recorder =
          new MediaRecorder(
            stream,
            recorderOptions
          );

        mediaRecorderRef.current = recorder;

        const actualMimeType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        const extension =
          extensionFromMimeType(
            actualMimeType
          );

        const sessionId =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

        currentVoiceSessionRef.current =
          sessionId;

        recordingModeRef.current = mode;

        if (mode === "live") {
          liveSessionRef.current = true;

          setIsLiveVoice(true);
          isLiveVoiceRef.current = true;

          liveWaitingForAudioRef.current =
            false;

          liveResponseCompleteRef.current =
            false;
        } else {
          setIsLiveVoice(false);
          isLiveVoiceRef.current = false;
        }

        recorder.ondataavailable = async (
          event
        ) => {
          if (
            !event.data ||
            event.data.size === 0
          ) {
            return;
          }

          const currentSocket =
            socketRef.current;

          if (
            !currentSocket ||
            !currentSocket.connected
          ) {
            return;
          }

          try {
            const buffer =
              await event.data.arrayBuffer();

            currentSocket.emit(
              "antimate:voice:chunk",
              buffer
            );
          } catch (error) {
            console.error(
              "Voice chunk error:",
              error
            );
          }
        };

        recorder.onstop = () => {
          const currentSocket =
            socketRef.current;

          if (
            currentSocket &&
            currentSocket.connected
          ) {
            currentSocket.emit(
              "antimate:voice:end",
              {
                sessionId,
                mimeType: actualMimeType,
                extension,
                language: "rw",
              }
            );
          }

          stopMediaTracks();

          const live =
            liveSessionRef.current &&
            isLiveVoiceRef.current;

          if (!live) {
            releaseWakeLock();
          }
        };

        recorder.onerror = (event) => {
          console.error(
            "MediaRecorder error:",
            event
          );

          setErrorMessage(
            "Habaye ikibazo mu gufata amajwi."
          );

          setIsRecording(false);
          isRecordingRef.current = false;

          stopMediaTracks();
          releaseWakeLock();
        };

        recorder.start(250);

        setIsRecording(true);
        isRecordingRef.current = true;

        recordingStartRef.current =
          Date.now();

        setStatus(
          mode === "live"
            ? "live"
            : "recording"
        );

        setStatusMessage(
          mode === "live"
            ? "Live Voice irakora..."
            : "Ndumva..."
        );

        setTranscript("");
        setCurrentAnswer("");

        if (mode === "tap") {
          setRecordingSeconds(30);

          clearInterval(
            normalCountdownRef.current
          );

          normalCountdownRef.current =
            setInterval(() => {
              const elapsed =
                Date.now() -
                recordingStartRef.current;

              const remaining = Math.max(
                0,
                Math.ceil(
                  (NORMAL_RECORDING_MS -
                    elapsed) /
                    1000
                )
              );

              setRecordingSeconds(
                remaining
              );

              if (remaining <= 0) {
                stopRecording(false);
              }
            }, 250);

          clearTimeout(
            maxRecordingTimerRef.current
          );

          maxRecordingTimerRef.current =
            setTimeout(() => {
              stopRecording(false);
            }, NORMAL_RECORDING_MS);
        } else {
          startSilenceDetection(
            stream
          );
        }

        socket.emit(
          "antimate:voice:start",
          {
            sessionId,
            mimeType: actualMimeType,
            extension,
            language: "rw",
            mode,
          }
        );
      } catch (error) {
        console.error(
          "Microphone error:",
          error
        );

        setErrorMessage(
          "Ntabwo nabashije gufungura microphone. Reba permission ya microphone."
        );

        setIsRecording(false);
        isRecordingRef.current = false;

        stopMediaTracks();
        releaseWakeLock();
      }
    },
    [
      releaseWakeLock,
      requestWakeLock,
      startSilenceDetection,
      stopMediaTracks,
      stopRecording,
    ]
  );

  /* ==========================================================
     CANCEL RECORDING
     ========================================================== */

  const cancelRecording = useCallback(() => {
    clearTimeout(maxRecordingTimerRef.current);
    clearInterval(normalCountdownRef.current);

    maxRecordingTimerRef.current = null;
    normalCountdownRef.current = null;

    stopSilenceDetection();

    const recorder =
      mediaRecorderRef.current;

    const socket =
      socketRef.current;

    if (socket?.connected) {
      socket.emit(
        "antimate:voice:cancel",
        {
          sessionId:
            currentVoiceSessionRef.current,
        }
      );
    }

    try {
      if (
        recorder &&
        recorder.state !== "inactive"
      ) {
        recorder.stop();
      }
    } catch {
      // ignore
    }

    mediaRecorderRef.current = null;

    stopMediaTracks();

    liveSessionRef.current = false;

    setIsRecording(false);
    setIsLiveVoice(false);
    setIsProcessing(false);

    isRecordingRef.current = false;
    isLiveVoiceRef.current = false;
    isProcessingRef.current = false;

    setStatus("ready");
    setStatusMessage("");

    releaseWakeLock();
  }, [
    releaseWakeLock,
    stopMediaTracks,
    stopSilenceDetection,
  ]);

  /* ==========================================================
     PLAY AUDIO
     ========================================================== */

  const playAudio = useCallback(
    (payload) => {
      const audioUrl = getAudioUrl(
        payload
      );

      if (!audioUrl) {
        if (
          liveSessionRef.current &&
          isLiveVoiceRef.current
        ) {
          setTimeout(() => {
            if (
              liveSessionRef.current &&
              !isRecordingRef.current
            ) {
              setIsProcessing(false);
              isProcessingRef.current = false;

              startRecording("live");
            }
          }, 500);
        }

        return;
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // ignore
        }
      }

      const audio =
        new Audio(audioUrl);

      audioRef.current = audio;

      setIsPlaying(true);
      isPlayingRef.current = true;

      setStatus("speaking");
      setStatusMessage(
        "ANTIMATE iravuga..."
      );

      liveWaitingForAudioRef.current =
        true;

      audio.onended = () => {
        setIsPlaying(false);
        isPlayingRef.current = false;

        if (audioUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(
              audioUrl
            );
          } catch {
            // ignore
          }
        }

        if (
          liveSessionRef.current &&
          isLiveVoiceRef.current
        ) {
          setTimeout(() => {
            if (
              liveSessionRef.current &&
              !isRecordingRef.current
            ) {
              liveWaitingForAudioRef.current =
                false;

              liveResponseCompleteRef.current =
                false;

              setIsProcessing(false);
              isProcessingRef.current =
                false;

              setStatus("live");
              setStatusMessage(
                "Live Voice irakomeza..."
              );

              startRecording("live");
            }
          }, 350);
        } else {
          setIsProcessing(false);
          isProcessingRef.current = false;

          setStatus("ready");
          setStatusMessage("");

          releaseWakeLock();
        }
      };

      audio.onerror = () => {
        setIsPlaying(false);
        isPlayingRef.current = false;

        if (
          liveSessionRef.current &&
          isLiveVoiceRef.current
        ) {
          setTimeout(() => {
            if (
              liveSessionRef.current &&
              !isRecordingRef.current
            ) {
              setIsProcessing(false);
              isProcessingRef.current =
                false;

              startRecording("live");
            }
          }, 500);
        } else {
          setIsProcessing(false);
          isProcessingRef.current = false;

          setStatus("ready");
          setStatusMessage("");

          releaseWakeLock();
        }
      };

      audio
        .play()
        .catch((error) => {
          console.error(
            "Audio play error:",
            error
          );

          audio.onended?.();
        });
    },
    [releaseWakeLock, startRecording]
  );

  /* ==========================================================
     SOCKET SETUP
     ========================================================== */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);

      if (!isRecordingRef.current) {
        setStatus("offline");
      }
    });

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error
        );

        setSocketConnected(false);
      }
    );

    socket.on(
      "antimate:status",
      (payload) => {
        const message =
          typeof payload === "string"
            ? payload
            : payload?.message ||
              payload?.status ||
              "";

        if (message) {
          setStatusMessage(message);
        }
      }
    );

    socket.on(
      "antimate:transcript",
      (payload) => {
        const value =
          typeof payload === "string"
            ? payload
            : payload?.text ||
              payload?.transcript ||
              "";

        if (value) {
          setTranscript(value);

          setIsProcessing(true);
          isProcessingRef.current =
            true;

          setStatus("thinking");

          startThinking();
        }
      }
    );

    socket.on(
      "antimate:thinking",
      (payload) => {
        const value =
          typeof payload === "string"
            ? payload
            : payload?.text ||
              payload?.message ||
              "";

        if (value) {
          setThinkingText(value);
        } else {
          startThinking();
        }

        setIsProcessing(true);
        isProcessingRef.current =
          true;

        setStatus("thinking");
      }
    );

    socket.on(
      "antimate:answer:chunk",
      (payload) => {
        const chunk =
          typeof payload === "string"
            ? payload
            : payload?.text ||
              payload?.chunk ||
              payload?.content ||
              "";

        if (!chunk) return;

        setCurrentAnswer((prev) => {
          const next = prev + chunk;

          return next;
        });

        setIsProcessing(true);
        isProcessingRef.current =
          true;

        setStatus("answering");

        stopThinking();
      }
    );

    socket.on(
      "antimate:answer",
      (payload) => {
        const answer =
          typeof payload === "string"
            ? payload
            : payload?.answer ||
              payload?.text ||
              payload?.content ||
              "";

        if (answer) {
          setCurrentAnswer(answer);

          setMessages((prev) => [
            ...prev,
            {
              id:
                Date.now() +
                Math.random(),
              role: "assistant",
              content: answer,
            },
          ]);
        }

        stopThinking();

        setStatus("answering");
      }
    );

    socket.on(
      "antimate:audio",
      (payload) => {
        playAudio(payload);
      }
    );

    socket.on(
      "antimate:complete",
      () => {
        stopThinking();

        liveResponseCompleteRef.current =
          true;

        if (
          liveSessionRef.current &&
          isLiveVoiceRef.current
        ) {
          /*
           * If audio comes later, audio.onended
           * will reopen the microphone.
           *
           * If no audio comes, reopen here.
           */
          setTimeout(() => {
            if (
              liveSessionRef.current &&
              isLiveVoiceRef.current &&
              !isPlayingRef.current &&
              !isRecordingRef.current
            ) {
              setIsProcessing(false);
              isProcessingRef.current =
                false;

              startRecording("live");
            }
          }, 900);
        } else {
          setIsProcessing(false);
          isProcessingRef.current = false;

          setStatus("ready");
          setStatusMessage("");
        }
      }
    );

    socket.on(
      "antimate:error",
      (payload) => {
        const message =
          typeof payload === "string"
            ? payload
            : payload?.message ||
              payload?.error ||
              "Habaye ikibazo kuri ANTIMATE.";

        setErrorMessage(message);

        setIsProcessing(false);
        isProcessingRef.current =
          false;

        stopThinking();

        if (
          liveSessionRef.current &&
          isLiveVoiceRef.current
        ) {
          setTimeout(() => {
            if (
              liveSessionRef.current &&
              !isRecordingRef.current &&
              !isPlayingRef.current
            ) {
              startRecording("live");
            }
          }, 1000);
        } else {
          setStatus("error");
        }
      }
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [
    playAudio,
    startRecording,
    startThinking,
    stopThinking,
  ]);

  /* ==========================================================
     TEXT CHAT
     ========================================================== */

  const sendTextMessage = useCallback(
    async () => {
      const message = text.trim();

      if (!message) return;

      if (
        isProcessingRef.current ||
        isRecordingRef.current ||
        isPlayingRef.current
      ) {
        return;
      }

      setErrorMessage("");

      setMessages((prev) => [
        ...prev,
        {
          id:
            Date.now() +
            Math.random(),
          role: "user",
          content: message,
        },
      ]);

      setText("");

      setTranscript("");
      setCurrentAnswer("");

      setIsProcessing(true);
      isProcessingRef.current = true;

      setStatus("thinking");

      startThinking();

      try {
        const response =
          await fetch(CHAT_URL, {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              message,
              language: "rw",
            }),
          });

        if (!response.ok) {
          throw new Error(
            `Request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        const answer =
          data.answer ||
          data.message ||
          data.response ||
          "";

        stopThinking();

        if (answer) {
          setMessages((prev) => [
            ...prev,
            {
              id:
                Date.now() +
                Math.random(),
              role: "assistant",
              content: answer,
            },
          ]);

          setCurrentAnswer(answer);
        }

        if (
          data.audio ||
          data.audioUrl ||
          data.audio_url ||
          data.url
        ) {
          playAudio(
            data.audio ||
              data.audioUrl ||
              data.audio_url ||
              data.url
          );
        } else {
          setIsProcessing(false);
          isProcessingRef.current =
            false;

          setStatus("ready");
          setStatusMessage("");
        }
      } catch (error) {
        console.error(
          "Text chat error:",
          error
        );

        stopThinking();

        setIsProcessing(false);
        isProcessingRef.current =
          false;

        setStatus("error");

        setErrorMessage(
          "Ntabwo nabashije kubona igisubizo. Ongera ugerageze."
        );
      }
    },
    [
      playAudio,
      startThinking,
      stopThinking,
      text,
    ]
  );

  /* ==========================================================
     POINTER HOLD / SHORT CLICK
     ========================================================== */

  const handleVoicePointerDown =
    useCallback(
      async (event) => {
        if (event.pointerType === "mouse") {
          event.currentTarget.setPointerCapture?.(
            event.pointerId
          );
        }

        if (
          isProcessingRef.current ||
          isPlayingRef.current
        ) {
          return;
        }

        pointerDownRef.current = true;

        pointerDownTimeRef.current =
          Date.now();

        /*
         * Start recording immediately.
         *
         * This means if the user keeps holding
         * the button, we don't lose the first
         * seconds of speech.
         */
        await startRecording("tap");

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          setTimeout(() => {
            if (
              pointerDownRef.current &&
              isRecordingRef.current
            ) {
              recordingModeRef.current =
                "live";

              liveSessionRef.current = true;

              setIsLiveVoice(true);
              isLiveVoiceRef.current = true;

              /*
               * Restart the current recorder
               * as a live segment so silence
               * detection becomes active.
               */
              stopRecording(true);

              setTimeout(() => {
                if (
                  liveSessionRef.current &&
                  !isRecordingRef.current
                ) {
                  setIsProcessing(false);
                  isProcessingRef.current =
                    false;

                  startRecording("live");
                }
              }, 100);
            }
          }, HOLD_TO_LIVE_MS);
      },
      [startRecording, stopRecording]
    );

  const handleVoicePointerUp =
    useCallback(
      (event) => {
        try {
          event.currentTarget.releasePointerCapture?.(
            event.pointerId
          );
        } catch {
          // ignore
        }

        pointerDownRef.current = false;

        clearTimeout(
          holdTimerRef.current
        );

        const duration =
          Date.now() -
          pointerDownTimeRef.current;

        /*
         * If live mode has already been activated,
         * releasing the button DOES NOT stop recording.
         */
        if (
          isLiveVoiceRef.current ||
          liveSessionRef.current
        ) {
          return;
        }

        /*
         * Normal tap mode:
         *
         * First click starts 30-second recording.
         * Second click stops it.
         *
         * Because startRecording() happened on
         * pointerdown, if pointer is released quickly
         * we intentionally KEEP recording.
         */
        if (
          duration < HOLD_TO_LIVE_MS &&
          isRecordingRef.current
        ) {
          return;
        }
      },
      []
    );

  const handleVoiceClick =
    useCallback(() => {
      /*
       * Click event fires after pointer events.
       *
       * We deliberately don't use it to start/stop
       * because pointer events already control the
       * recording state.
       */
    }, []);

  /* ==========================================================
     BUTTON SECOND CLICK STOP
     ========================================================== */

  const handleVoiceButtonPress =
    useCallback(
      async (event) => {
        if (event) {
          event.preventDefault();
        }

        /*
         * If currently recording in normal mode,
         * another click stops it.
         */
        if (
          isRecordingRef.current &&
          !isLiveVoiceRef.current
        ) {
          stopRecording(false);
          return;
        }

        /*
         * Live mode intentionally cannot be stopped
         * by a simple release. The user can tap again
         * after live mode has started.
         */
        if (
          isRecordingRef.current &&
          isLiveVoiceRef.current
        ) {
          liveSessionRef.current = false;

          setIsLiveVoice(false);
          isLiveVoiceRef.current = false;

          stopRecording(false);

          setIsProcessing(false);
          isProcessingRef.current = false;

          setStatus("ready");
          setStatusMessage("");

          return;
        }
      },
      [stopRecording]
    );

  /*
   * We need a clean "tap" behavior:
   *
   * pointerdown:
   *   if not recording -> start
   *   if already recording -> stop
   *
   * Hold:
   *   after 5s -> live
   */

  const handleVoicePointerDownFinal =
    useCallback(
      async (event) => {
        if (event.pointerType === "mouse") {
          event.currentTarget.setPointerCapture?.(
            event.pointerId
          );
        }

        event.preventDefault();

        if (
          isProcessingRef.current ||
          isPlayingRef.current
        ) {
          return;
        }

        /*
         * Already recording:
         * button press means STOP.
         */
        if (isRecordingRef.current) {
          if (isLiveVoiceRef.current) {
            liveSessionRef.current = false;

            setIsLiveVoice(false);
            isLiveVoiceRef.current = false;

            stopRecording(false);

            setIsProcessing(false);
            isProcessingRef.current = false;

            setStatus("ready");
            setStatusMessage("");
          } else {
            stopRecording(false);
          }

          return;
        }

        pointerDownRef.current = true;

        pointerDownTimeRef.current =
          Date.now();

        await startRecording("tap");

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          setTimeout(() => {
            if (
              pointerDownRef.current &&
              isRecordingRef.current
            ) {
              /*
               * Convert the currently running
               * recording into live mode.
               */
              liveSessionRef.current = true;

              setIsLiveVoice(true);
              isLiveVoiceRef.current = true;

              stopRecording(true);

              setTimeout(() => {
                if (
                  liveSessionRef.current &&
                  !isRecordingRef.current
                ) {
                  setIsProcessing(false);
                  isProcessingRef.current =
                    false;

                  startRecording("live");
                }
              }, 120);
            }
          }, HOLD_TO_LIVE_MS);
      },
      [startRecording, stopRecording]
    );

  const handleVoicePointerUpFinal =
    useCallback((event) => {
      try {
        event.currentTarget.releasePointerCapture?.(
          event.pointerId
        );
      } catch {
        // ignore
      }

      pointerDownRef.current = false;

      clearTimeout(
        holdTimerRef.current
      );

      /*
       * Releasing does NOT stop normal recording.
       * It also does NOT stop live voice.
       *
       * A second press stops normal recording.
       */
    }, []);

  /* ==========================================================
     KEYBOARD
     ========================================================== */

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

  /* ==========================================================
     STOP LIVE SESSION ON UNMOUNT
     ========================================================== */

  useEffect(() => {
    return () => {
      clearTimeout(
        holdTimerRef.current
      );

      clearTimeout(
        maxRecordingTimerRef.current
      );

      clearInterval(
        normalCountdownRef.current
      );

      clearInterval(
        thinkingTimerRef.current
      );

      stopSilenceDetection();

      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // ignore
      }

      stopMediaTracks();

      try {
        audioRef.current?.pause();
      } catch {
        // ignore
      }

      releaseWakeLock();
    };
  }, [
    releaseWakeLock,
    stopMediaTracks,
    stopSilenceDetection,
  ]);

  /* ==========================================================
     UI DERIVED VALUES
     ========================================================== */

  const hasText = text.trim().length > 0;

  const showThinking =
    isProcessing &&
    !currentAnswer &&
    !isPlaying &&
    thinkingText;

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="antimate-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .antimate-page {
          --bg: #f7f9fc;
          --surface: #ffffff;
          --surface-soft: #f3f6fa;
          --border: #e5eaf0;
          --text: #111827;
          --muted: #6b7280;
          --primary: #111827;
          --primary-soft: #eef2f7;
          --assistant: #f5f7fa;
          --danger: #dc2626;
          --success: #16a34a;

          width: 100%;
          height: 100vh;
          min-height: 620px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background:
            radial-gradient(
              circle at top right,
              rgba(59, 130, 246, 0.06),
              transparent 32%
            ),
            var(--bg);
          color: var(--text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        @media (prefers-color-scheme: dark) {
          .antimate-page {
            --bg: #070b12;
            --surface: #0d131d;
            --surface-soft: #111925;
            --border: #202938;
            --text: #f3f4f6;
            --muted: #8d98a8;
            --primary: #f8fafc;
            --primary-soft: #17202d;
            --assistant: #101722;
            --danger: #f87171;
            --success: #4ade80;

            background:
              radial-gradient(
                circle at top right,
                rgba(59, 130, 246, 0.10),
                transparent 35%
              ),
              var(--bg);
          }
        }

        .antimate-header {
          flex: 0 0 auto;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.68);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 10;
        }

        @media (prefers-color-scheme: dark) {
          .antimate-header {
            background: rgba(7,11,18,0.72);
          }
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .brand-name {
          font-size: 16px;
          font-weight: 750;
          letter-spacing: -0.02em;
        }

        .brand-subtitle {
          margin-top: 2px;
          color: var(--muted);
          font-size: 11px;
        }

        .connection {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-left: 18px;
          color: var(--muted);
          font-size: 11px;
        }

        .connection-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
        }

        .connection-dot.connected {
          background: var(--success);
          box-shadow: 0 0 0 4px rgba(34,197,94,0.10);
        }

        .antimate-mark {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .antimate-mark.small {
          width: 30px;
          height: 30px;
          flex-basis: 30px;
        }

        .antimate-mark-ring {
          position: relative;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          padding: 2px;
          background:
            conic-gradient(
              from 0deg,
              #60a5fa,
              #a78bfa,
              #22d3ee,
              #60a5fa
            );
          animation: logoSpin 5s linear infinite;
        }

        .antimate-mark-ring::after {
          content: "";
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: var(--surface);
        }

        .antimate-mark-ring span {
          position: absolute;
          inset: 7px;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #60a5fa,
              #a78bfa
            );
          z-index: 2;
        }

        @keyframes logoSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .antimate-content {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding: 30px 20px 150px;
          scroll-behavior: smooth;
        }

        .antimate-chat {
          width: min(820px, 100%);
          margin: 0 auto;
        }

        .welcome {
          min-height: 55vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
        }

        .welcome-logo {
          margin-bottom: 18px;
        }

        .welcome h1 {
          margin: 0;
          font-size: clamp(27px, 4vw, 40px);
          letter-spacing: -0.04em;
          font-weight: 800;
        }

        .welcome p {
          max-width: 500px;
          margin: 11px auto 0;
          color: var(--muted);
          line-height: 1.65;
          font-size: 14px;
        }

        .suggestions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 25px;
        }

        .suggestion {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 999px;
          padding: 9px 13px;
          font-size: 12px;
          cursor: pointer;
          transition:
            transform .18s ease,
            background .18s ease,
            border-color .18s ease;
        }

        .suggestion:hover {
          transform: translateY(-1px);
          background: var(--surface-soft);
        }

        .message-row {
          display: flex;
          width: 100%;
          margin: 18px 0;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;
        }

        .assistant-message-wrap {
          width: min(100%, 720px);
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .message-avatar {
          flex: 0 0 auto;
          margin-top: 3px;
        }

        .message {
          max-width: min(78%, 620px);
          border-radius: 18px;
          padding: 12px 15px;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .message.user {
          color: white;
          background: #111827;
          border-bottom-right-radius: 5px;
        }

        @media (prefers-color-scheme: dark) {
          .message.user {
            background: #e5e7eb;
            color: #111827;
          }
        }

        .message.assistant {
          background: var(--assistant);
          border: 1px solid var(--border);
          border-top-left-radius: 5px;
          max-width: 100%;
        }

        .live-answer {
          width: min(100%, 720px);
        }

        .thinking-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 18px 0;
        }

        .thinking-avatar {
          flex: 0 0 auto;
        }

        .thinking-bubble {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 16px;
          border-top-left-radius: 5px;
          background: var(--assistant);
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 13px;
        }

        .thinking-dots {
          display: inline-flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
          animation: thinkingDot 1.2s infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: .15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: .30s;
        }

        @keyframes thinkingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: .45;
          }

          30% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        .transcript {
          margin-top: 8px;
          color: var(--muted);
          font-size: 12px;
          font-style: italic;
        }

        .error {
          width: min(820px, calc(100% - 32px));
          margin: 0 auto 10px;
          padding: 10px 13px;
          border: 1px solid rgba(220,38,38,.22);
          background: rgba(220,38,38,.07);
          color: var(--danger);
          border-radius: 12px;
          font-size: 12px;
        }

        .antimate-composer {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 20;
          padding:
            12px
            max(16px, env(safe-area-inset-right))
            calc(14px + env(safe-area-inset-bottom))
            max(16px, env(safe-area-inset-left));
          pointer-events: none;
        }

        .composer-inner {
          width: min(820px, 100%);
          margin: 0 auto;
          pointer-events: auto;
        }

        .recording-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          margin-bottom: 8px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          box-shadow: 0 10px 35px rgba(0,0,0,.07);
          font-size: 12px;
        }

        .recording-status-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .recording-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: recordPulse 1s infinite;
        }

        @keyframes recordPulse {
          0%, 100% {
            transform: scale(1);
            opacity: .55;
          }

          50% {
            transform: scale(1.4);
            opacity: 1;
          }
        }

        .recording-label {
          color: var(--muted);
        }

        .recording-time {
          font-variant-numeric: tabular-nums;
          font-weight: 750;
        }

        .live-badge {
          color: #ef4444;
          font-weight: 800;
          letter-spacing: .06em;
          font-size: 10px;
        }

        .composer {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: rgba(255,255,255,.88);
          box-shadow:
            0 14px 45px rgba(0,0,0,.10),
            0 2px 8px rgba(0,0,0,.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        @media (prefers-color-scheme: dark) {
          .composer {
            background: rgba(13,19,29,.90);
            box-shadow:
              0 16px 50px rgba(0,0,0,.35);
          }
        }

        .composer textarea {
          flex: 1;
          min-width: 0;
          min-height: 44px;
          max-height: 150px;
          resize: none;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--text);
          padding: 12px 8px 10px 10px;
          font: inherit;
          font-size: 14px;
          line-height: 1.45;
        }

        .composer textarea::placeholder {
          color: var(--muted);
        }

        .voice-action {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 15px;
          cursor: pointer;
          color: white;
          background: #111827;
          transition:
            transform .15s ease,
            opacity .15s ease,
            border-radius .2s ease;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        @media (prefers-color-scheme: dark) {
          .voice-action {
            color: #111827;
            background: #f3f4f6;
          }
        }

        .voice-action:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .voice-action:active:not(:disabled) {
          transform: scale(.94);
        }

        .voice-action.recording {
          background: #ef4444;
          color: white;
          border-radius: 50%;
          animation: buttonPulse 1.4s infinite;
        }

        .voice-action.live {
          background:
            linear-gradient(
              135deg,
              #ef4444,
              #dc2626
            );
          color: white;
          border-radius: 50%;
          animation: livePulse 1.4s infinite;
        }

        .voice-action:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        @keyframes buttonPulse {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(239,68,68,.30);
          }

          50% {
            box-shadow:
              0 0 0 8px rgba(239,68,68,0);
          }
        }

        @keyframes livePulse {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(239,68,68,.40);
          }

          50% {
            box-shadow:
              0 0 0 10px rgba(239,68,68,0);
          }
        }

        .icon-svg {
          width: 21px;
          height: 21px;
        }

        .composer-hint {
          text-align: center;
          margin-top: 7px;
          color: var(--muted);
          font-size: 10px;
          opacity: .85;
        }

        .status-line {
          width: min(820px, 100%);
          margin: 0 auto 6px;
          text-align: center;
          color: var(--muted);
          font-size: 11px;
          min-height: 15px;
        }

        .spark-icon {
          width: 13px;
          height: 13px;
          color: #8b5cf6;
        }

        @media (max-width: 640px) {
          .antimate-header {
            height: 62px;
            padding: 0 15px;
          }

          .connection {
            margin-left: 10px;
          }

          .brand-subtitle {
            display: none;
          }

          .antimate-content {
            padding:
              20px
              12px
              145px;
          }

          .message {
            max-width: 88%;
            font-size: 13.5px;
          }

          .assistant-message-wrap {
            gap: 7px;
          }

          .composer {
            border-radius: 17px;
          }

          .voice-action {
            width: 44px;
            height: 44px;
            flex-basis: 44px;
          }

          .welcome {
            min-height: 60vh;
          }

          .welcome h1 {
            font-size: 28px;
          }
        }
      `}</style>

      {/* ======================================================
          HEADER
          Logo stays TOP LEFT
          ====================================================== */}

      <header className="antimate-header">
        <div className="antimate-brand">
          <AntimateMark />

          <div>
            <div className="brand-name">
              ANTIMATE
            </div>

            <div className="brand-subtitle">
              Intelligent Poultry Assistant
            </div>
          </div>

          <div className="connection">
            <span
              className={`connection-dot ${
                socketConnected
                  ? "connected"
                  : ""
              }`}
            />

            {socketConnected
              ? "Connected"
              : "Connecting..."}
          </div>
        </div>
      </header>

      {/* ======================================================
          CHAT AREA
          ====================================================== */}

      <main className="antimate-content">
        <div className="antimate-chat">
          {messages.length === 0 &&
            !thinkingText &&
            !transcript &&
            !currentAnswer && (
              <section className="welcome">
                <div className="welcome-logo">
                  <AntimateMark />
                </div>

                <h1>
                  Muraho, ndi ANTIMATE.
                </h1>

                <p>
                  Ndi umufasha wawe w'ubworozi.
                  Ushobora kumbaza ikibazo
                  ukoresheje text cyangwa ijwi.
                </p>

                <div className="suggestions">
                  <button
                    className="suggestion"
                    onClick={() =>
                      setText(
                        "Ni iki nakora kugira ngo inkoko zanjye zikure neza?"
                      )
                    }
                  >
                    💡 Ubworozi bwiza
                  </button>

                  <button
                    className="suggestion"
                    onClick={() =>
                      setText(
                        "Ni ubuhe bushyuhe bukwiye ku nkoko zanjye?"
                      )
                    }
                  >
                    🌡️ Ubushyuhe
                  </button>

                  <button
                    className="suggestion"
                    onClick={() =>
                      setText(
                        "Ni gute nakwirinda indwara mu nkoko?"
                      )
                    }
                  >
                    🐔 Indwara
                  </button>
                </div>
              </section>
            )}

          {/* USER / ASSISTANT MESSAGES */}

          {messages.map((message) => {
            if (
              message.role === "user"
            ) {
              return (
                <div
                  key={message.id}
                  className="message-row user"
                >
                  <div className="message user">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className="message-row assistant"
              >
                <div className="assistant-message-wrap">
                  <div className="message-avatar">
                    <AntimateMark small />
                  </div>

                  <div className="message assistant">
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* TRANSCRIPT */}

          {transcript && (
            <div className="message-row user">
              <div className="message user">
                {transcript}
              </div>
            </div>
          )}

          {/* THINKING */}

          {showThinking && (
            <div className="thinking-row">
              <div className="thinking-avatar">
                <AntimateMark small />
              </div>

              <div className="thinking-bubble">
                <SparkIcon />

                <span>
                  {thinkingText}
                </span>

                <span className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}

          {/* STREAMING / CURRENT ANSWER */}

          {currentAnswer &&
            isProcessing && (
              <div className="message-row assistant">
                <div className="assistant-message-wrap">
                  <div className="message-avatar">
                    <AntimateMark small />
                  </div>

                  <div className="message assistant live-answer">
                    {currentAnswer}
                  </div>
                </div>
              </div>
            )}

          <div
            ref={messagesEndRef}
            style={{
              height: 1,
            }}
          />
        </div>
      </main>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {errorMessage && (
        <div className="error">
          {errorMessage}
        </div>
      )}

      {/* ======================================================
          COMPOSER
          Everything is now on the RIGHT
          ====================================================== */}

      <div className="antimate-composer">
        <div className="composer-inner">
          {/* RECORDING STATUS */}

          {isRecording && (
            <div className="recording-status">
              <div className="recording-status-left">
                <span className="recording-indicator" />

                <span className="recording-label">
                  {isLiveVoice
                    ? "ANTIMATE Live Voice"
                    : "Ndumva..."}
                </span>

                {isLiveVoice && (
                  <span className="live-badge">
                    LIVE
                  </span>
                )}
              </div>

              {!isLiveVoice && (
                <span className="recording-time">
                  00:
                  {String(
                    recordingSeconds
                  ).padStart(2, "0")}
                </span>
              )}

              {isLiveVoice && (
                <span className="recording-time">
                  1.8s silence → send
                </span>
              )}
            </div>
          )}

          <div className="status-line">
            {status === "speaking" &&
              "ANTIMATE iravuga..."}

            {status === "processing" &&
              !isPlaying &&
              "Ndimo gutunganya..."}

            {status === "live" &&
              !isRecording &&
              "Live Voice irategereje..."}

            {status === "recording" &&
              "Ndumva..."}

            {status === "thinking" &&
              !thinkingText &&
              "Ndimo kubitekerezaho..."}

            {status === "error" &&
              "Habaye ikibazo."}

            {![
              "speaking",
              "processing",
              "live",
              "recording",
              "thinking",
              "error",
            ].includes(status) &&
              statusMessage}
          </div>

          <div className="composer">
            <textarea
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              onKeyDown={
                handleTextKeyDown
              }
              placeholder={
                isRecording
                  ? "ANTIMATE irumva..."
                  : "Andika ubutumwa..."
              }
              disabled={
                isRecording ||
                isProcessing ||
                isPlaying
              }
              rows={1}
            />

            {/* =================================================
                EMPTY TEXT → VOICE WAVE
                TEXT → SEND
                ================================================= */}

            {!hasText ? (
              <button
                type="button"
                className={`voice-action ${
                  isLiveVoice
                    ? "live"
                    : isRecording
                    ? "recording"
                    : ""
                }`}
                disabled={
                  isProcessing &&
                  !isRecording
                }
                onPointerDown={
                  handleVoicePointerDownFinal
                }
                onPointerUp={
                  handleVoicePointerUpFinal
                }
                onPointerCancel={
                  handleVoicePointerUpFinal
                }
                aria-label={
                  isRecording
                    ? "Stop voice"
                    : "Start voice"
                }
              >
                {isRecording ? (
                  <StopIcon />
                ) : (
                  <WaveIcon />
                )}
              </button>
            ) : (
              <button
                type="button"
                className="voice-action"
                disabled={
                  !text.trim() ||
                  isProcessing ||
                  isRecording ||
                  isPlaying
                }
                onClick={
                  sendTextMessage
                }
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            )}
          </div>

          <div className="composer-hint">
            {hasText
              ? "Enter to send • Shift + Enter for new line"
              : "Kanda rimwe gufata amajwi • komeza ≥5s kuri Live Voice"}
          </div>
        </div>
      </div>
    </div>
  );
}