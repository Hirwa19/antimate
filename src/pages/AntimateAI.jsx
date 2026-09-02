import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

// ============================================================
// ANTIMATE AI — SELF CONTAINED JSX
// No AntimateAI.css required
// ============================================================

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_URL ||
  window.location.origin;

const CHAT_URL = `${API_URL}/api/antimate/chat`;

const NORMAL_RECORDING_MS = 30000;
const LIVE_HOLD_MS = 5000;
const LIVE_SILENCE_MS = 1800;
const CHUNK_INTERVAL_MS = 250;

// ============================================================
// HELPERS
// ============================================================

function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const type of types) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }

  return "";
}

function extensionFromMimeType(type = "") {
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mp4")) return "m4a";
  if (type.includes("wav")) return "wav";
  return "webm";
}

function makeAbsoluteUrl(value) {
  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function getAudioUrl(payload) {
  if (!payload) return "";

  if (typeof payload === "string") {
    return makeAbsoluteUrl(payload);
  }

  if (payload instanceof ArrayBuffer) {
    const blob = new Blob([payload], { type: "audio/mpeg" });
    return URL.createObjectURL(blob);
  }

  if (payload instanceof Blob) {
    return URL.createObjectURL(payload);
  }

  if (typeof payload === "object") {
    const candidate =
      payload.url ||
      payload.audioUrl ||
      payload.audio_url ||
      payload.file ||
      payload.path ||
      payload.src;

    if (candidate) {
      return makeAbsoluteUrl(candidate);
    }

    if (payload.data instanceof ArrayBuffer) {
      const blob = new Blob([payload.data], {
        type: payload.mimeType || "audio/mpeg",
      });

      return URL.createObjectURL(blob);
    }
  }

  return "";
}

// ============================================================
// ICONS
// ============================================================

function SendIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon({ size = 25 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="9"
        y="2"
        width="6"
        height="13"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M5 11C5 14.866 8.134 18 12 18C15.866 18 19 14.866 19 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M12 18V22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M8 22H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon({ size = 21 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function WaveIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 16H6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M8 11V21"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M13 7V25"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M18 4V28"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M23 9V23"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M28 13V19"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 12L10 17L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {
  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [socketConnected, setSocketConnected] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const [status, setStatus] = useState("ready");

  const [statusMessage, setStatusMessage] = useState(
    "ANTIMATE is ready"
  );

  const [processingMode, setProcessingMode] = useState("");

  const [transcript, setTranscript] = useState("");

  const [thinkingText, setThinkingText] = useState("");

  const [currentAnswer, setCurrentAnswer] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [recordingMode, setRecordingMode] = useState(null);

  const [remainingSeconds, setRemainingSeconds] = useState(30);

  const [liveMode, setLiveMode] = useState(false);

  const [isHolding, setIsHolding] = useState(false);

  const [hasSpeech, setHasSpeech] = useState(false);

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const audioContextRef = useRef(null);

  const analyserRef = useRef(null);

  const audioSourceRef = useRef(null);

  const silenceFrameRef = useRef(null);

  const silenceStartedAtRef = useRef(null);

  const hasSpokenRef = useRef(false);

  const recordingChunksRef = useRef([]);

  const recordingStartedAtRef = useRef(0);

  const recordingModeRef = useRef(null);

  const isRecordingRef = useRef(false);

  const liveModeRef = useRef(false);

  const voiceSessionActiveRef = useRef(false);

  const holdingRef = useRef(false);

  const holdTimerRef = useRef(null);

  const normalTimerRef = useRef(null);

  const liveRestartTimerRef = useRef(null);

  const audioRef = useRef(null);

  const wakeLockRef = useRef(null);

  const liveResponseWaitingRef = useRef(false);

  const liveAudioReceivedRef = useRef(false);

  const currentAudioUrlRef = useRef("");

  const liveAssistantMessageIdRef = useRef(null);

  const messagesEndRef = useRef(null);

  // ==========================================================
  // SCROLL
  // ==========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    messages,
    transcript,
    thinkingText,
    currentAnswer,
  ]);

  // ==========================================================
  // WAKE LOCK
  // ==========================================================

  const requestWakeLock = useCallback(async () => {
    try {
      if (
        "wakeLock" in navigator &&
        !wakeLockRef.current
      ) {
        wakeLockRef.current =
          await navigator.wakeLock.request("screen");

        wakeLockRef.current.addEventListener(
          "release",
          () => {
            wakeLockRef.current = null;
          }
        );
      }
    } catch {
      // Wake lock is optional.
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

  // ==========================================================
  // CLEAN AUDIO ANALYSIS
  // ==========================================================

  const stopSilenceDetection = useCallback(() => {
    if (silenceFrameRef.current) {
      cancelAnimationFrame(silenceFrameRef.current);
      silenceFrameRef.current = null;
    }

    try {
      audioSourceRef.current?.disconnect();
    } catch {}

    try {
      analyserRef.current?.disconnect();
    } catch {}

    audioSourceRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}

      audioContextRef.current = null;
    }

    silenceStartedAtRef.current = null;
    hasSpokenRef.current = false;
    setHasSpeech(false);
  }, []);

  // ==========================================================
  // MEDIA TRACKS
  // ==========================================================

  const stopMediaTracks = useCallback(() => {
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

    stopSilenceDetection();
  }, [stopSilenceDetection]);

  // ==========================================================
  // ADD MESSAGE
  // ==========================================================

  const addMessage = useCallback(
    (role, content, extra = {}) => {
      if (!content) return;

      setMessages((prev) => [
        ...prev,
        {
          id:
            Date.now() +
            Math.random().toString(36).slice(2),
          role,
          content,
          ...extra,
        },
      ]);
    },
    []
  );

  // ==========================================================
  // LIVE ASSISTANT MESSAGE
  // ==========================================================

  const updateLiveAssistantMessage = useCallback(
    (content) => {
      if (!content) return;

      setMessages((prev) => {
        const id = liveAssistantMessageIdRef.current;

        if (!id) {
          const newId =
            Date.now() +
            Math.random().toString(36).slice(2);

          liveAssistantMessageIdRef.current = newId;

          return [
            ...prev,
            {
              id: newId,
              role: "assistant",
              content,
            },
          ];
        }

        return prev.map((message) =>
          message.id === id
            ? {
                ...message,
                content,
              }
            : message
        );
      });
    },
    []
  );

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const startLiveRecordingAfterResponse =
    useCallback(() => {
      if (!liveModeRef.current) return;

      clearTimeout(liveRestartTimerRef.current);

      liveRestartTimerRef.current = setTimeout(() => {
        if (!liveModeRef.current) return;

        if (
          isRecordingRef.current ||
          isPlaying ||
          isProcessing
        ) {
          return;
        }

        startRecording("live");
      }, 180);
    }, [isPlaying, isProcessing]);

  const playAudio = useCallback(
    (payload) => {
      const url = getAudioUrl(payload);

      if (!url) {
        if (liveModeRef.current) {
          liveResponseWaitingRef.current = false;
          startLiveRecordingAfterResponse();
        }

        return;
      }

      if (currentAudioUrlRef.current) {
        if (
          currentAudioUrlRef.current.startsWith("blob:")
        ) {
          try {
            URL.revokeObjectURL(
              currentAudioUrlRef.current
            );
          } catch {}
        }
      }

      currentAudioUrlRef.current = url;

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }

      const audio = new Audio(url);

      audioRef.current = audio;

      liveAudioReceivedRef.current = true;

      setIsPlaying(true);
      setStatus("speaking");
      setStatusMessage("ANTIMATE is speaking...");

      audio.onended = () => {
        setIsPlaying(false);

        if (
          url.startsWith("blob:")
        ) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }

        currentAudioUrlRef.current = "";

        audioRef.current = null;

        if (liveModeRef.current) {
          liveResponseWaitingRef.current = false;

          setIsProcessing(false);
          setStatus("live");
          setStatusMessage(
            "Live Voice — listening..."
          );

          startLiveRecordingAfterResponse();
        } else {
          setIsProcessing(false);
          setStatus("ready");
          setStatusMessage("ANTIMATE is ready");
        }
      };

      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;

        if (liveModeRef.current) {
          liveResponseWaitingRef.current = false;

          setIsProcessing(false);

          startLiveRecordingAfterResponse();
        } else {
          setIsProcessing(false);
          setStatus("ready");
          setStatusMessage("ANTIMATE is ready");
        }
      };

      audio
        .play()
        .catch(() => {
          setIsPlaying(false);

          if (liveModeRef.current) {
            liveResponseWaitingRef.current = false;
            startLiveRecordingAfterResponse();
          }
        });
    },
    [startLiveRecordingAfterResponse]
  );

  // ==========================================================
  // SILENCE DETECTION
  // ==========================================================

  const startSilenceDetection = useCallback(
    (stream) => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContextClass) return;

        const context = new AudioContextClass();

        const analyser =
          context.createAnalyser();

        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.75;

        const source =
          context.createMediaStreamSource(stream);

        source.connect(analyser);

        audioContextRef.current = context;
        analyserRef.current = analyser;
        audioSourceRef.current = source;

        const data =
          new Uint8Array(
            analyser.fftSize
          );

        const detect = () => {
          if (
            !isRecordingRef.current ||
            !liveModeRef.current
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

          // Voice threshold.
          const speakingThreshold = 0.035;

          if (rms > speakingThreshold) {
            hasSpokenRef.current = true;

            silenceStartedAtRef.current = null;

            setHasSpeech(true);
          } else if (hasSpokenRef.current) {
            if (
              !silenceStartedAtRef.current
            ) {
              silenceStartedAtRef.current =
                Date.now();
            }

            const silentFor =
              Date.now() -
              silenceStartedAtRef.current;

            if (
              silentFor >= LIVE_SILENCE_MS
            ) {
              silenceStartedAtRef.current = null;

              stopRecording(true);

              return;
            }
          }

          silenceFrameRef.current =
            requestAnimationFrame(detect);
        };

        detect();
      } catch {
        // Silence detection is optional.
      }
    },
    []
  );

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording = useCallback(
    async (mode = "normal") => {
      if (isRecordingRef.current) return;

      if (
        !socketRef.current ||
        !socketConnected
      ) {
        setErrorMessage(
          "ANTIMATE server is not connected."
        );

        return;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setErrorMessage(
          "Microphone is not supported by this browser."
        );

        return;
      }

      if (
        mode === "normal" &&
        (isProcessing || isPlaying)
      ) {
        return;
      }

      try {
        setErrorMessage("");

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

        const recorderOptions =
          mimeType
            ? { mimeType }
            : undefined;

        const recorder =
          new MediaRecorder(
            stream,
            recorderOptions
          );

        mediaRecorderRef.current = recorder;

        recordingChunksRef.current = [];

        const actualMime =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        const extension =
          extensionFromMimeType(
            actualMime
          );

        recordingModeRef.current = mode;

        isRecordingRef.current = true;

        setIsRecording(true);

        setRecordingMode(mode);

        recordingStartedAtRef.current =
          Date.now();

        silenceStartedAtRef.current = null;

        hasSpokenRef.current = false;

        setHasSpeech(false);

        if (mode === "live") {
          liveModeRef.current = true;
          voiceSessionActiveRef.current =
            true;

          setLiveMode(true);

          setStatus("live");

          setStatusMessage(
            "Live Voice — listening..."
          );
        } else {
          setStatus("recording");

          setStatusMessage(
            "Recording..."
          );

          setRemainingSeconds(30);
        }

        socketRef.current.emit(
          "antimate:voice:start",
          {
            mimeType: actualMime,
            extension,
            language: "rw",
            mode:
              mode === "live"
                ? "live"
                : "normal",
          }
        );

        recorder.ondataavailable =
          async (event) => {
            if (
              !event.data ||
              event.data.size === 0
            ) {
              return;
            }

            recordingChunksRef.current.push(
              event.data
            );

            if (
              socketRef.current &&
              socketRef.current.connected
            ) {
              try {
                const buffer =
                  await event.data.arrayBuffer();

                socketRef.current.emit(
                  "antimate:voice:chunk",
                  buffer
                );
              } catch {}
            }
          };

        recorder.onerror = () => {
          setErrorMessage(
            "Microphone recording error."
          );

          isRecordingRef.current = false;

          setIsRecording(false);

          stopMediaTracks();
        };

        recorder.onstop = () => {
          const stoppedMode =
            recordingModeRef.current;

          isRecordingRef.current = false;

          setIsRecording(false);

          mediaRecorderRef.current = null;

          stopMediaTracks();

          if (
            socketRef.current &&
            socketRef.current.connected
          ) {
            socketRef.current.emit(
              "antimate:voice:end",
              {
                language: "rw",
                mode:
                  stoppedMode === "live"
                    ? "live"
                    : "normal",
              }
            );
          }

          if (stoppedMode === "live") {
            setStatus("processing");

            setStatusMessage(
              "ANTIMATE is processing..."
            );

            setIsProcessing(true);

            liveResponseWaitingRef.current =
              true;

            liveAudioReceivedRef.current =
              false;
          } else {
            setStatus("processing");

            setStatusMessage(
              "ANTIMATE is processing..."
            );

            setIsProcessing(true);
          }
        };

        recorder.start(
          CHUNK_INTERVAL_MS
        );

        if (mode === "live") {
          startSilenceDetection(stream);
        } else {
          clearInterval(
            normalTimerRef.current
          );

          normalTimerRef.current =
            setInterval(() => {
              const elapsed =
                Date.now() -
                recordingStartedAtRef.current;

              const remaining = Math.max(
                0,
                Math.ceil(
                  (NORMAL_RECORDING_MS -
                    elapsed) /
                    1000
                )
              );

              setRemainingSeconds(
                remaining
              );

              if (remaining <= 0) {
                clearInterval(
                  normalTimerRef.current
                );

                stopRecording(false);
              }
            }, 250);
        }
      } catch (error) {
        console.error(
          "Microphone error:",
          error
        );

        setErrorMessage(
          "Microphone permission was denied or the microphone is unavailable."
        );

        setStatus("error");

        setStatusMessage(
          "Microphone unavailable"
        );

        isRecordingRef.current = false;

        setIsRecording(false);

        stopMediaTracks();

        if (!liveModeRef.current) {
          await releaseWakeLock();
        }
      }
    },
    [
      socketConnected,
      isProcessing,
      isPlaying,
      requestWakeLock,
      stopMediaTracks,
      releaseWakeLock,
      startSilenceDetection,
    ]
  );

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = useCallback(
    (fromLiveSilence = false) => {
      clearInterval(
        normalTimerRef.current
      );

      const recorder =
        mediaRecorderRef.current;

      if (
        !recorder ||
        recorder.state === "inactive"
      ) {
        return;
      }

      const currentMode =
        recordingModeRef.current;

      if (
        currentMode === "live" ||
        fromLiveSilence
      ) {
        setStatus("processing");

        setStatusMessage(
          "ANTIMATE is processing..."
        );
      }

      try {
        recorder.stop();
      } catch {
        isRecordingRef.current = false;

        setIsRecording(false);

        stopMediaTracks();
      }

      if (
        currentMode !== "live" &&
        !liveModeRef.current
      ) {
        releaseWakeLock();
      }
    },
    [releaseWakeLock, stopMediaTracks]
  );

  // ==========================================================
  // CANCEL RECORDING
  // ==========================================================

  const cancelRecording = useCallback(() => {
    clearInterval(
      normalTimerRef.current
    );

    clearTimeout(
      liveRestartTimerRef.current
    );

    clearTimeout(
      holdTimerRef.current
    );

    holdingRef.current = false;

    setIsHolding(false);

    voiceSessionActiveRef.current = false;

    liveModeRef.current = false;

    setLiveMode(false);

    liveResponseWaitingRef.current = false;

    const recorder =
      mediaRecorderRef.current;

    if (recorder) {
      try {
        recorder.ondataavailable = null;
        recorder.onstop = null;

        if (
          recorder.state !== "inactive"
        ) {
          recorder.stop();
        }
      } catch {}
    }

    mediaRecorderRef.current = null;

    isRecordingRef.current = false;

    setIsRecording(false);

    stopMediaTracks();

    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }

    setIsPlaying(false);

    setIsProcessing(false);

    setStatus("ready");

    setStatusMessage(
      "ANTIMATE is ready"
    );

    setRemainingSeconds(30);

    releaseWakeLock();
  }, [
    releaseWakeLock,
    stopMediaTracks,
  ]);

  // ==========================================================
  // BUTTON POINTER DOWN
  // ==========================================================

  const handleVoicePointerDown =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (
          isProcessing ||
          isPlaying
        ) {
          return;
        }

        holdingRef.current = true;

        setIsHolding(true);

        // ----------------------------------------------------
        // If already recording:
        // holding/clicking again does NOT create a new
        // recording. The release/click will stop normal mode.
        // Live mode remains continuous.
        // ----------------------------------------------------

        if (isRecordingRef.current) {
          return;
        }

        // ----------------------------------------------------
        // Start recording immediately.
        //
        // We wait 5 seconds to decide whether this is:
        // normal mode or live mode.
        // ----------------------------------------------------

        await startRecording("normal");

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          setTimeout(() => {
            if (
              !holdingRef.current ||
              !isRecordingRef.current
            ) {
              return;
            }

            recordingModeRef.current =
              "live";

            liveModeRef.current = true;

            voiceSessionActiveRef.current =
              true;

            setLiveMode(true);

            setRecordingMode("live");

            setStatus("live");

            setStatusMessage(
              "Live Voice — listening..."
            );

            // Start silence detection on the
            // already-open microphone.
            if (
              mediaStreamRef.current
            ) {
              startSilenceDetection(
                mediaStreamRef.current
              );
            }
          }, LIVE_HOLD_MS);
      },
      [
        isProcessing,
        isPlaying,
        startRecording,
        startSilenceDetection,
      ]
    );

  // ==========================================================
  // BUTTON POINTER UP
  // ==========================================================

  const handleVoicePointerUp =
    useCallback(
      (event) => {
        event.preventDefault();

        clearTimeout(
          holdTimerRef.current
        );

        const wasHolding =
          holdingRef.current;

        holdingRef.current = false;

        setIsHolding(false);

        if (!wasHolding) return;

        // ----------------------------------------------------
        // LIVE MODE:
        //
        // Releasing the button does NOT stop live voice.
        // ----------------------------------------------------

        if (liveModeRef.current) {
          setStatus("live");

          setStatusMessage(
            "Live Voice — listening..."
          );

          return;
        }

        // ----------------------------------------------------
        // NORMAL MODE:
        //
        // First click/press starts recording.
        // Second click/press stops recording.
        //
        // Because recording was started immediately on
        // pointerdown, a short click leaves it recording.
        // ----------------------------------------------------

        if (isRecordingRef.current) {
          // IMPORTANT:
          // Do not stop on first release.
          //
          // The user wants short click -> recording stays on.
          return;
        }
      },
      []
    );

  // ==========================================================
  // NORMAL RECORD BUTTON CLICK
  //
  // This is used for the second click in normal mode.
  // ==========================================================

  const handleVoiceClick =
    useCallback(
      (event) => {
        event.preventDefault();

        // If live mode, clicking stops live session.
        if (liveModeRef.current) {
          cancelRecording();
          return;
        }

        // If normal recording is active,
        // clicking again stops it.
        if (isRecordingRef.current) {
          stopRecording(false);
        }
      },
      [cancelRecording, stopRecording]
    );

  // ==========================================================
  // SEND TEXT
  // ==========================================================

  const sendText = useCallback(async () => {
    const message = text.trim();

    if (!message) return;

    if (isRecordingRef.current) return;

    if (isProcessing) return;

    setErrorMessage("");

    addMessage("user", message);

    setText("");

    setIsProcessing(true);

    setStatus("processing");

    setStatusMessage(
      "ANTIMATE is thinking..."
    );

    setThinkingText(
      "ANTIMATE is analyzing your message..."
    );

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

      const response =
        await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            message,
            language: "rw",
          }),
        });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      const answer =
        data.answer ||
        data.response ||
        data.message ||
        data.text ||
        "";

      setThinkingText("");

      if (answer) {
        addMessage(
          "assistant",
          answer
        );

        setCurrentAnswer(answer);
      }

      if (data.audio) {
        playAudio(data.audio);
      } else {
        setIsProcessing(false);

        setStatus("ready");

        setStatusMessage(
          "ANTIMATE is ready"
        );
      }
    } catch (error) {
      console.error(
        "Text chat error:",
        error
      );

      setThinkingText("");

      setIsProcessing(false);

      setStatus("error");

      setStatusMessage(
        "Something went wrong"
      );

      setErrorMessage(
        "Failed to connect to ANTIMATE AI."
      );
    }
  }, [
    text,
    isProcessing,
    addMessage,
    playAudio,
  ]);

  // ==========================================================
  // TEXT KEYBOARD
  // ==========================================================

  const handleTextKeyDown =
    useCallback(
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          if (text.trim()) {
            sendText();
          }
        }
      },
      [text, sendText]
    );

  // ==========================================================
  // SOCKET
  // ==========================================================

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);

      setStatus("ready");

      setStatusMessage(
        "ANTIMATE is ready"
      );

      setErrorMessage("");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);

      if (!isRecordingRef.current) {
        setStatus("offline");

        setStatusMessage(
          "Reconnecting to ANTIMATE..."
        );
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
        const value =
          typeof payload === "string"
            ? payload
            : payload?.status ||
              payload?.message ||
              "";

        if (value) {
          setStatusMessage(value);
        }

        if (
          payload?.mode
        ) {
          setProcessingMode(
            payload.mode
          );
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

        setThinkingText(value);
      }
    );

    socket.on(
      "antimate:answer",
      (payload) => {
        const value =
          typeof payload === "string"
            ? payload
            : payload?.answer ||
              payload?.text ||
              payload?.message ||
              "";

        if (!value) return;

        if (liveModeRef.current) {
          updateLiveAssistantMessage(
            value
          );
        } else {
          addMessage(
            "assistant",
            value
          );

          setCurrentAnswer(value);
        }

        setTranscript("");
        setThinkingText("");
      }
    );

    socket.on(
      "antimate:answer:chunk",
      (payload) => {
        const value =
          typeof payload === "string"
            ? payload
            : payload?.chunk ||
              payload?.text ||
              "";

        if (!value) return;

        if (liveModeRef.current) {
          setMessages((prev) => {
            const id =
              liveAssistantMessageIdRef.current;

            if (!id) {
              const newId =
                Date.now() +
                Math.random()
                  .toString(36)
                  .slice(2);

              liveAssistantMessageIdRef.current =
                newId;

              return [
                ...prev,
                {
                  id: newId,
                  role: "assistant",
                  content: value,
                },
              ];
            }

            return prev.map(
              (message) =>
                message.id === id
                  ? {
                      ...message,
                      content:
                        message.content +
                        value,
                    }
                  : message
            );
          });
        } else {
          setCurrentAnswer(
            (prev) => prev + value
          );
        }
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
      (payload) => {
        const answer =
          payload?.answer ||
          payload?.text ||
          "";

        if (answer) {
          if (liveModeRef.current) {
            updateLiveAssistantMessage(
              answer
            );
          } else {
            addMessage(
              "assistant",
              answer
            );

            setCurrentAnswer(
              answer
            );
          }
        }

        setTranscript("");

        setThinkingText("");

        // ----------------------------------------------------
        // LIVE MODE:
        //
        // If server has audio, we wait for audio.onended.
        // If no audio is coming, reopen microphone now.
        // ----------------------------------------------------

        if (liveModeRef.current) {
          setIsProcessing(false);

          if (
            !liveAudioReceivedRef.current
          ) {
            liveResponseWaitingRef.current =
              false;

            setStatus("live");

            setStatusMessage(
              "Live Voice — listening..."
            );

            startLiveRecordingAfterResponse();
          }
        } else {
          if (!isPlaying) {
            setIsProcessing(false);

            setStatus("ready");

            setStatusMessage(
              "ANTIMATE is ready"
            );
          }
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
              "ANTIMATE AI error";

        setErrorMessage(message);

        setThinkingText("");

        setIsProcessing(false);

        if (liveModeRef.current) {
          setStatus("live");

          setStatusMessage(
            "Live Voice — listening..."
          );

          liveResponseWaitingRef.current =
            false;

          liveAudioReceivedRef.current =
            false;

          startLiveRecordingAfterResponse();
        } else {
          setStatus("error");

          setStatusMessage(
            "Something went wrong"
          );
        }
      }
    );

    return () => {
      socket.removeAllListeners();

      socket.disconnect();

      socketRef.current = null;
    };
  }, [
    addMessage,
    playAudio,
    updateLiveAssistantMessage,
    startLiveRecordingAfterResponse,
    isPlaying,
  ]);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      clearInterval(
        normalTimerRef.current
      );

      clearTimeout(
        holdTimerRef.current
      );

      clearTimeout(
        liveRestartTimerRef.current
      );

      stopSilenceDetection();

      if (mediaRecorderRef.current) {
        try {
          if (
            mediaRecorderRef.current
              .state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch {}
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }

      releaseWakeLock();
    };
  }, [
    releaseWakeLock,
    stopSilenceDetection,
  ]);

  // ==========================================================
  // DERIVED UI
  // ==========================================================

  const hasText =
    text.trim().length > 0;

  const voiceButtonDisabled =
    !socketConnected ||
    isProcessing ||
    isPlaying;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="antimate-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .antimate-page {
          --bg: #f6f8fb;
          --surface: #ffffff;
          --surface-soft: #f8fafc;
          --border: #e5e9ef;
          --text: #111827;
          --muted: #6b7280;
          --muted-2: #9ca3af;
          --primary: #111827;
          --primary-soft: #eef2f7;
          --user: #111827;
          --assistant: #ffffff;
          --danger: #dc2626;
          --success: #16a34a;

          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(
              circle at top right,
              rgba(99,102,241,.08),
              transparent 30%
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

          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        @media (prefers-color-scheme: dark) {
          .antimate-page {
            --bg: #080b11;
            --surface: #10151d;
            --surface-soft: #0d1219;
            --border: #202733;
            --text: #f4f7fb;
            --muted: #9aa4b2;
            --muted-2: #667085;
            --primary: #f4f7fb;
            --primary-soft: #171d27;
            --user: #eef2f7;
            --assistant: #10151d;
          }
        }

        .antimate-header {
          height: 68px;
          min-height: 68px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 22px;

          border-bottom: 1px solid var(--border);

          background: rgba(255,255,255,.72);

          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);

          position: relative;
          z-index: 10;
        }

        @media (prefers-color-scheme: dark) {
          .antimate-header {
            background: rgba(8,11,17,.76);
          }
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .antimate-logo {
          width: 37px;
          height: 37px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;

          background:
            conic-gradient(
              from 0deg,
              #8b5cf6,
              #06b6d4,
              #22c55e,
              #f59e0b,
              #ec4899,
              #8b5cf6
            );

          box-shadow:
            0 5px 18px rgba(99,102,241,.22);

          animation:
            logoSpin 7s linear infinite;
        }

        .antimate-logo::before {
          content: "";
          position: absolute;

          inset: 3px;

          border-radius: 50%;

          background: var(--surface);
        }

        .antimate-logo::after {
          content: "";
          position: absolute;

          width: 10px;
          height: 10px;

          border-radius: 50%;

          background: var(--text);

          z-index: 2;
        }

        @keyframes logoSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .antimate-brand-name {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: .08em;
          white-space: nowrap;
        }

        .antimate-brand-subtitle {
          font-size: 11px;
          color: var(--muted);
          margin-top: 1px;
        }

        .connection {
          display: flex;
          align-items: center;
          gap: 7px;

          padding: 7px 10px;

          border: 1px solid var(--border);
          border-radius: 999px;

          background: var(--surface);

          font-size: 11px;
          font-weight: 600;

          color: var(--muted);
        }

        .connection-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f59e0b;
        }

        .connection-dot.online {
          background: #22c55e;
          box-shadow:
            0 0 0 4px rgba(34,197,94,.10);
        }

        .connection-dot.offline {
          background: #ef4444;
        }

        .antimate-main {
          flex: 1;
          min-height: 0;

          width: 100%;
          max-width: 980px;

          margin: 0 auto;

          display: flex;
          flex-direction: column;

          padding: 22px 18px 18px;
        }

        .messages-area {
          flex: 1;
          min-height: 0;

          overflow-y: auto;

          padding:
            5px
            3px
            18px;

          scrollbar-width: thin;
        }

        .messages-area::-webkit-scrollbar {
          width: 5px;
        }

        .messages-area::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 20px;
        }

        .empty-state {
          min-height: 50vh;

          display: flex;
          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 30px;
        }

        .empty-content {
          max-width: 510px;
        }

        .empty-symbol {
          width: 54px;
          height: 54px;

          margin: 0 auto 18px;

          border-radius: 17px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--text);

          background:
            linear-gradient(
              135deg,
              var(--primary-soft),
              transparent
            );

          border: 1px solid var(--border);
        }

        .empty-title {
          font-size: 25px;
          font-weight: 750;

          margin: 0 0 8px;
        }

        .empty-description {
          color: var(--muted);

          line-height: 1.65;

          font-size: 14px;

          margin: 0;
        }

        .message-row {
          display: flex;
          margin: 10px 0;
          animation: messageIn .22s ease;
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(5px);
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

        .message-bubble {
          max-width: min(760px, 88%);
          padding: 12px 15px;

          border-radius: 17px;

          font-size: 14px;
          line-height: 1.62;

          white-space: pre-wrap;

          border: 1px solid var(--border);

          background: var(--assistant);

          box-shadow:
            0 2px 9px rgba(15,23,42,.025);
        }

        .message-row.user .message-bubble {
          background: var(--user);
          color: #ffffff;
          border-color: var(--user);

          border-bottom-right-radius: 6px;
        }

        .message-row.assistant .message-bubble {
          border-bottom-left-radius: 6px;
        }

        .message-label {
          display: flex;
          align-items: center;
          gap: 5px;

          font-size: 10px;
          font-weight: 750;

          text-transform: uppercase;
          letter-spacing: .08em;

          color: var(--muted);

          margin: 0 0 5px;
        }

        .message-row.user .message-label {
          justify-content: flex-end;
          color: rgba(255,255,255,.58);
        }

        .thinking-box,
        .transcript-box,
        .answer-box {
          margin: 12px 0;

          border: 1px solid var(--border);

          background: var(--surface);

          border-radius: 15px;

          padding: 12px 14px;

          font-size: 13px;

          animation: messageIn .22s ease;
        }

        .transcript-box {
          border-left: 3px solid #06b6d4;
        }

        .thinking-box {
          border-left: 3px solid #8b5cf6;
        }

        .answer-box {
          border-left: 3px solid #22c55e;
        }

        .box-title {
          display: flex;
          align-items: center;
          gap: 7px;

          color: var(--muted);

          font-size: 10px;
          font-weight: 750;

          text-transform: uppercase;
          letter-spacing: .07em;

          margin-bottom: 5px;
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

          animation: dotPulse 1.2s infinite;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: .18s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: .36s;
        }

        @keyframes dotPulse {
          0%, 70%, 100% {
            opacity: .3;
            transform: translateY(0);
          }

          35% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }

        .recording-info {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 10px;

          margin: 0 auto 10px;

          min-height: 34px;
        }

        .recording-pill {
          display: flex;
          align-items: center;
          gap: 9px;

          padding: 7px 12px;

          border-radius: 999px;

          background: var(--surface);

          border: 1px solid var(--border);

          font-size: 12px;
          font-weight: 650;
        }

        .recording-live-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background: #ef4444;

          animation: recordingPulse 1s infinite;
        }

        @keyframes recordingPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: .35;
            transform: scale(.7);
          }
        }

        .countdown {
          font-variant-numeric: tabular-nums;

          font-size: 13px;
          font-weight: 800;

          min-width: 30px;

          color: var(--text);
        }

        .live-wave {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 15px;
        }

        .live-wave span {
          display: block;

          width: 2px;

          border-radius: 5px;

          background: currentColor;

          animation: wave .75s ease-in-out infinite;
        }

        .live-wave span:nth-child(1) {
          height: 6px;
        }

        .live-wave span:nth-child(2) {
          height: 11px;
          animation-delay: .1s;
        }

        .live-wave span:nth-child(3) {
          height: 15px;
          animation-delay: .2s;
        }

        .live-wave span:nth-child(4) {
          height: 9px;
          animation-delay: .3s;
        }

        .live-wave span:nth-child(5) {
          height: 13px;
          animation-delay: .4s;
        }

        @keyframes wave {
          50% {
            transform: scaleY(.45);
          }
        }

        .error-box {
          margin: 8px 0 10px;

          padding: 10px 12px;

          border: 1px solid rgba(239,68,68,.2);

          background: rgba(239,68,68,.06);

          color: #ef4444;

          border-radius: 12px;

          font-size: 12px;
          line-height: 1.5;
        }

        .composer {
          position: relative;

          width: 100%;

          border: 1px solid var(--border);

          background: var(--surface);

          border-radius: 20px;

          padding: 8px;

          display: flex;
          align-items: flex-end;

          gap: 8px;

          box-shadow:
            0 8px 30px rgba(15,23,42,.055);

          transition:
            border-color .2s ease,
            box-shadow .2s ease;
        }

        .composer:focus-within {
          border-color:
            color-mix(
              in srgb,
              var(--text) 35%,
              var(--border)
            );

          box-shadow:
            0 10px 32px rgba(15,23,42,.075);
        }

        .composer-input {
          flex: 1;

          min-width: 0;

          border: none;
          outline: none;

          resize: none;

          background: transparent;

          color: var(--text);

          font-family: inherit;

          font-size: 14px;
          line-height: 1.5;

          padding:
            10px
            8px
            10px
            10px;

          min-height: 44px;
          max-height: 150px;
        }

        .composer-input::placeholder {
          color: var(--muted-2);
        }

        .composer-action {
          flex: 0 0 auto;

          width: 47px;
          height: 47px;

          border: none;

          border-radius: 15px;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          color: #ffffff;

          background: var(--text);

          box-shadow:
            0 6px 18px rgba(15,23,42,.15);

          transition:
            transform .15s ease,
            opacity .15s ease,
            box-shadow .15s ease;
        }

        .composer-action:hover:not(:disabled) {
          transform: translateY(-1px);

          box-shadow:
            0 9px 22px rgba(15,23,42,.2);
        }

        .composer-action:active:not(:disabled) {
          transform: scale(.95);
        }

        .composer-action:disabled {
          opacity: .42;
          cursor: not-allowed;
          box-shadow: none;
        }

        .composer-action.recording {
          background: #ef4444;

          box-shadow:
            0 0 0 7px rgba(239,68,68,.09),
            0 8px 22px rgba(239,68,68,.2);

          animation:
            recordButtonPulse 1.5s infinite;
        }

        .composer-action.live {
          background: #7c3aed;

          box-shadow:
            0 0 0 7px rgba(124,58,237,.09),
            0 8px 22px rgba(124,58,237,.2);
        }

        @keyframes recordButtonPulse {
          0%, 100% {
            box-shadow:
              0 0 0 5px rgba(239,68,68,.08),
              0 8px 22px rgba(239,68,68,.16);
          }

          50% {
            box-shadow:
              0 0 0 10px rgba(239,68,68,.025),
              0 8px 25px rgba(239,68,68,.24);
          }
        }

        .composer-hint {
          text-align: center;

          color: var(--muted-2);

          font-size: 10px;

          margin-top: 8px;

          line-height: 1.5;
        }

        .composer-hint strong {
          color: var(--muted);
          font-weight: 700;
        }

        .status-line {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          color: var(--muted-2);

          font-size: 10px;

          margin-top: 7px;

          min-height: 16px;
        }

        .status-mini-dot {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: var(--muted-2);
        }

        .status-mini-dot.live {
          background: #8b5cf6;
        }

        .status-mini-dot.recording {
          background: #ef4444;
        }

        .status-mini-dot.ready {
          background: #22c55e;
        }

        .status-mini-dot.processing {
          background: #f59e0b;
        }

        @media (max-width: 640px) {
          .antimate-header {
            height: 61px;
            min-height: 61px;

            padding: 0 14px;
          }

          .antimate-logo {
            width: 33px;
            height: 33px;
          }

          .antimate-brand-name {
            font-size: 14px;
          }

          .antimate-brand-subtitle {
            display: none;
          }

          .connection {
            padding: 6px 8px;
            font-size: 10px;
          }

          .antimate-main {
            padding:
              13px
              10px
              12px;
          }

          .messages-area {
            padding-bottom: 12px;
          }

          .empty-state {
            min-height: 42vh;
            padding: 20px;
          }

          .empty-title {
            font-size: 22px;
          }

          .message-bubble {
            max-width: 92%;
            font-size: 13.5px;
          }

          .composer {
            border-radius: 17px;
          }

          .composer-action {
            width: 45px;
            height: 45px;
            border-radius: 14px;
          }

          .composer-hint {
            font-size: 9px;
          }
        }
      `}</style>

      {/* ======================================================
          HEADER
          Logo remains ONLY here, top-left.
      ====================================================== */}

      <header className="antimate-header">
        <div className="antimate-brand">
          <div
            className="antimate-logo"
            aria-label="ANTIMATE"
          />

          <div>
            <div className="antimate-brand-name">
              ANTIMATE
            </div>

            <div className="antimate-brand-subtitle">
              AI Assistant
            </div>
          </div>
        </div>

        <div className="connection">
          <span
            className={`connection-dot ${
              socketConnected
                ? "online"
                : "offline"
            }`}
          />

          {socketConnected
            ? "Connected"
            : "Offline"}
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="antimate-main">
        <div className="messages-area">
          {/* -----------------------------------------------
              EMPTY STATE
              NO LOGO HERE
          ------------------------------------------------ */}

          {messages.length === 0 &&
          !transcript &&
          !thinkingText &&
          !currentAnswer ? (
            <div className="empty-state">
              <div className="empty-content">
                <div className="empty-symbol">
                  <SparkIcon size={24} />
                </div>

                <h1 className="empty-title">
                  How can I help you?
                </h1>

                <p className="empty-description">
                  Vuga na ANTIMATE cyangwa
                  andika ikibazo cyawe hano
                  hasi. Ushobora gukoresha
                  Kinyarwanda cyangwa English.
                </p>
              </div>
            </div>
          ) : null}

          {/* -----------------------------------------------
              MESSAGES
          ------------------------------------------------ */}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-row ${message.role}`}
            >
              <div className="message-bubble">
                <div className="message-label">
                  {message.role ===
                  "assistant" ? (
                    <>
                      <SparkIcon size={11} />
                      ANTIMATE
                    </>
                  ) : (
                    "YOU"
                  )}
                </div>

                {message.content}
              </div>
            </div>
          ))}

          {/* -----------------------------------------------
              TRANSCRIPT
          ------------------------------------------------ */}

          {transcript ? (
            <div className="transcript-box">
              <div className="box-title">
                <MicIcon size={13} />
                Voice transcript
              </div>

              {transcript}
            </div>
          ) : null}

          {/* -----------------------------------------------
              THINKING
          ------------------------------------------------ */}

          {thinkingText ? (
            <div className="thinking-box">
              <div className="box-title">
                <SparkIcon size={13} />
                ANTIMATE
                <span className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>

              {thinkingText}
            </div>
          ) : null}

          {/* -----------------------------------------------
              CURRENT ANSWER
          ------------------------------------------------ */}

          {currentAnswer &&
          !messages.some(
            (message) =>
              message.role ===
                "assistant" &&
              message.content ===
                currentAnswer
          ) ? (
            <div className="answer-box">
              <div className="box-title">
                <SparkIcon size={13} />
                ANTIMATE
              </div>

              {currentAnswer}
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        {/* ==================================================
            RECORDING STATUS
        ================================================== */}

        {isRecording ? (
          <div className="recording-info">
            <div className="recording-pill">
              <span className="recording-live-dot" />

              {liveMode ? (
                <>
                  <span>
                    Live Voice
                  </span>

                  <div className="live-wave">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  {hasSpeech ? (
                    <span>
                      Listening
                    </span>
                  ) : (
                    <span>
                      Speak...
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>
                    Recording
                  </span>

                  <span className="countdown">
                    {remainingSeconds}s
                  </span>
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* ==================================================
            ERROR
        ================================================== */}

        {errorMessage ? (
          <div className="error-box">
            {errorMessage}
          </div>
        ) : null}

        {/* ==================================================
            COMPOSER
        ================================================== */}

        <div className="composer">
          <textarea
            className="composer-input"
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            onKeyDown={handleTextKeyDown}
            placeholder={
              liveMode
                ? "Live Voice is active..."
                : "Message ANTIMATE..."
            }
            disabled={
              isRecording ||
              isProcessing ||
              isPlaying ||
              liveMode
            }
            rows={1}
          />

          {/* ----------------------------------------------
              ONE BUTTON:
              Empty → Voice waveform
              Text → Send
          ----------------------------------------------- */}

          {hasText ? (
            <button
              type="button"
              className="composer-action"
              onClick={sendText}
              disabled={
                isProcessing ||
                isRecording ||
                isPlaying ||
                !socketConnected
              }
              aria-label="Send message"
              title="Send message"
            >
              <SendIcon size={21} />
            </button>
          ) : (
            <button
              type="button"
              className={`composer-action ${
                isRecording
                  ? liveMode
                    ? "live"
                    : "recording"
                  : ""
              }`}
              disabled={
                voiceButtonDisabled
              }
              onPointerDown={
                handleVoicePointerDown
              }
              onPointerUp={
                handleVoicePointerUp
              }
              onPointerCancel={
                handleVoicePointerUp
              }
              onClick={
                handleVoiceClick
              }
              onContextMenu={(event) =>
                event.preventDefault()
              }
              aria-label={
                liveMode
                  ? "Stop live voice"
                  : isRecording
                  ? "Stop recording"
                  : "Voice recorder"
              }
              title={
                liveMode
                  ? "Stop live voice"
                  : isRecording
                  ? "Click to stop recording"
                  : "Click to record • Hold 5s for Live Voice"
              }
            >
              {isRecording ? (
                liveMode ? (
                  <StopIcon size={19} />
                ) : (
                  <StopIcon size={19} />
                )
              ) : (
                <WaveIcon size={25} />
              )}
            </button>
          )}
        </div>

        {/* ==================================================
            HINT
        ================================================== */}

        {!isRecording &&
        !hasText &&
        !liveMode ? (
          <div className="composer-hint">
            <strong>Click</strong>{" "}
            to record up to 30s
            {" • "}
            <strong>Hold 5s</strong>{" "}
            for Live Voice
          </div>
        ) : null}

        {isRecording &&
        !liveMode ? (
          <div className="composer-hint">
            Click the button again to stop
            recording
          </div>
        ) : null}

        {liveMode ? (
          <div className="composer-hint">
            Live Voice: silence of 1.8s sends
            the current segment automatically.
          </div>
        ) : null}

        {/* ==================================================
            STATUS
        ================================================== */}

        <div className="status-line">
          <span
            className={`status-mini-dot ${status}`}
          />

          {statusMessage}

          {processingMode ? (
            <span>
              • {processingMode}
            </span>
          ) : null}
        </div>
      </main>
    </div>
  );
}