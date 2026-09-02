import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import {
  Send,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Loader2,
  Bot,
  User,
  Wifi,
  WifiOff,
  X,
  Sun,
  Moon,
} from "lucide-react";

/* ============================================================
   CONFIG
============================================================ */

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/+$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/+$/, "");

const MAX_RECORDING_SECONDS = 30;
const HOLD_TO_LIVE_MS = 5000;
const SILENCE_LIMIT_MS = 1800;
const SILENCE_THRESHOLD = 0.025;

/* ============================================================
   HELPERS
============================================================ */

function makeId(prefix = "msg") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getSupportedMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];

  for (const type of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }

  return "";
}

function extensionFromMime(mimeType = "") {
  if (mimeType.includes("ogg")) return ".ogg";
  if (mimeType.includes("mp4")) return ".mp4";
  if (mimeType.includes("wav")) return ".wav";
  return ".webm";
}

function absoluteAudioUrl(value) {
  if (!value) return null;

  if (typeof value === "object") {
    if (value.url) return absoluteAudioUrl(value.url);
    if (value.path) return absoluteAudioUrl(value.path);
    if (value.src) return absoluteAudioUrl(value.src);
  }

  if (typeof value !== "string") return null;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function extractAnswer(payload) {
  if (!payload) return "";

  if (typeof payload === "string") {
    return payload.trim();
  }

  const keys = [
    "answer_kinyarwanda",
    "answer_rw",
    "answer",
    "response",
    "reply",
    "text",
    "message",
    "generated_text",
    "output",
  ];

  for (const key of keys) {
    const value = payload[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function extractAudio(payload) {
  if (!payload) return null;

  if (typeof payload === "string") {
    return absoluteAudioUrl(payload);
  }

  const keys = [
    "audio_url",
    "audioUrl",
    "audio",
    "voice_url",
    "voiceUrl",
    "url",
  ];

  for (const key of keys) {
    if (payload[key]) {
      const url = absoluteAudioUrl(payload[key]);

      if (url) return url;
    }
  }

  return null;
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AntimateAI() {
  /* ============================================================
     STATE
  ============================================================ */

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [connected, setConnected] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [isLiveVoice, setIsLiveVoice] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [backendReasoning, setBackendReasoning] =
    useState("");

  const [error, setError] = useState("");

  const [playingMessageId, setPlayingMessageId] =
    useState(null);

  /*
   * PRIMARY THEME
   * false = light
   * true  = dark
   */
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          "antimate-primary-theme"
        );

      if (saved === "dark") return true;
      if (saved === "light") return false;

      return false;
    } catch {
      return false;
    }
  });

  /* ============================================================
     REFS
  ============================================================ */

  const socketRef = useRef(null);

  const recorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const audioRef = useRef(null);

  const recordingTimerRef = useRef(null);

  const holdTimerRef = useRef(null);

  const silenceAnimationRef = useRef(null);

  const audioContextRef = useRef(null);

  const pointerActiveRef = useRef(false);

  const voiceSessionActiveRef = useRef(false);

  const liveWaitingForResponseRef = useRef(false);

  const isLiveVoiceRef = useRef(false);

  const isPlayingRef = useRef(false);

  const isProcessingRef = useRef(false);

  const startRecordingInternalRef =
    useRef(null);

  const liveResumeTimerRef = useRef(null);

  const wakeLockRef = useRef(null);

  const currentAudioMessageIdRef =
    useRef(null);

  const lastAnswerRef = useRef("");

  /* ============================================================
     SYNC REFS
  ============================================================ */

  useEffect(() => {
    isLiveVoiceRef.current = isLiveVoice;
  }, [isLiveVoice]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  /* ============================================================
     THEME
  ============================================================ */

  useEffect(() => {
    try {
      localStorage.setItem(
        "antimate-primary-theme",
        darkMode ? "dark" : "light"
      );
    } catch {
      // localStorage optional
    }
  }, [darkMode]);

  const toggleTheme = useCallback(() => {
    setDarkMode((previous) => !previous);
  }, []);

  /* ============================================================
     WAKE LOCK
  ============================================================ */

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current =
          await navigator.wakeLock.request(
            "screen"
          );
      }
    } catch {
      // Optional feature
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

  /* ============================================================
     STOP SILENCE DETECTION
  ============================================================ */

  const stopSilenceDetection =
    useCallback(() => {
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
    }, []);

  /* ============================================================
     STOP MEDIA TRACKS
  ============================================================ */

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
  }, []);

  /* ============================================================
     LIVE RESUME
  ============================================================ */

  const scheduleLiveResume =
    useCallback((delay = 500) => {
      if (!voiceSessionActiveRef.current) {
        return;
      }

      if (liveResumeTimerRef.current) {
        clearTimeout(
          liveResumeTimerRef.current
        );
      }

      liveResumeTimerRef.current =
        setTimeout(() => {
          liveResumeTimerRef.current = null;

          if (
            !voiceSessionActiveRef.current
          ) {
            return;
          }

          if (isPlayingRef.current) {
            return;
          }

          if (isProcessingRef.current) {
            return;
          }

          const fn =
            startRecordingInternalRef.current;

          if (fn) {
            fn("live");
          }
        }, delay);
    }, []);

  /* ============================================================
     PLAY AUDIO
  ============================================================ */

  const playAudio = useCallback(
    (url, messageId = null) => {
      if (!url) return;

      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }

      const audio = new Audio(url);

      audioRef.current = audio;

      currentAudioMessageIdRef.current =
        messageId || null;

      setIsPlaying(true);

      if (messageId) {
        setPlayingMessageId(messageId);
      }

      if (isLiveVoiceRef.current) {
        liveWaitingForResponseRef.current =
          true;
      }

      audio.onplay = () => {
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);

        setPlayingMessageId(null);

        if (
          isLiveVoiceRef.current &&
          voiceSessionActiveRef.current
        ) {
          liveWaitingForResponseRef.current =
            false;

          scheduleLiveResume(250);
        }
      };

      audio.onerror = () => {
        console.error(
          "❌ Audio playback failed."
        );

        setIsPlaying(false);

        setPlayingMessageId(null);

        if (
          isLiveVoiceRef.current &&
          voiceSessionActiveRef.current
        ) {
          liveWaitingForResponseRef.current =
            false;

          scheduleLiveResume(500);
        }
      };

      audio.play().catch((err) => {
        console.error(
          "❌ Audio autoplay failed:",
          err
        );

        setIsPlaying(false);

        setPlayingMessageId(null);

        if (
          isLiveVoiceRef.current &&
          voiceSessionActiveRef.current
        ) {
          scheduleLiveResume(700);
        }
      });
    },
    [scheduleLiveResume]
  );

  /* ============================================================
     REPLAY AI VOICE
  ============================================================ */

  const replayAIMessage = useCallback(
    (message) => {
      if (!message?.audioUrl) return;

      if (
        playingMessageId === message.id &&
        audioRef.current
      ) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}

        setIsPlaying(false);
        setPlayingMessageId(null);

        return;
      }

      playAudio(
        message.audioUrl,
        message.id
      );
    },
    [playAudio, playingMessageId]
  );

  /* ============================================================
     SOCKET.IO
  ============================================================ */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: [
        "websocket",
        "polling",
      ],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    /* ----------------------------------------------------------
       CONNECT
    ---------------------------------------------------------- */

    socket.on("connect", () => {
      console.log(
        "🔌 ANTIMATE SOCKET CONNECTED:",
        socket.id
      );

      setConnected(true);
      setError("");
    });

    /* ----------------------------------------------------------
       DISCONNECT
    ---------------------------------------------------------- */

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "🔌 ANTIMATE SOCKET DISCONNECTED:",
          reason
        );

        setConnected(false);
      }
    );

    /* ----------------------------------------------------------
       CONNECTION ERROR
    ---------------------------------------------------------- */

    socket.on(
      "connect_error",
      (err) => {
        console.error(
          "❌ ANTIMATE SOCKET ERROR:",
          err.message
        );

        setConnected(false);
      }
    );

    /* ----------------------------------------------------------
       BACKEND STATUS / REASONING
    ---------------------------------------------------------- */

    socket.on(
      "antimate:status",
      (payload) => {
        console.log(
          "📡 ANTIMATE BACKEND STATUS:",
          payload
        );

        const message =
          payload?.message ||
          payload?.status ||
          payload?.reasoning ||
          payload?.stage ||
          "";

        if (message) {
          setBackendReasoning(message);
        }
      }
    );

    /* ----------------------------------------------------------
       BACKEND THINKING
       No fake "Reka ndebe..."
       This comes directly from backend.
    ---------------------------------------------------------- */

    socket.on(
      "antimate:thinking",
      (payload) => {
        console.log(
          "🧠 ANTIMATE BACKEND REASONING:",
          payload
        );

        setIsProcessing(true);

        const reasoning =
          payload?.message ||
          payload?.reasoning ||
          payload?.status ||
          payload?.stage ||
          "";

        if (reasoning) {
          setBackendReasoning(
            reasoning
          );
        }
      }
    );

    /* ----------------------------------------------------------
       VOICE TRANSCRIPT
    ---------------------------------------------------------- */

    socket.on(
      "antimate:transcript",
      (payload) => {
        console.log(
          "📝 ANTIMATE TRANSCRIPT:",
          payload
        );

        const transcript =
          payload?.text ||
          payload?.transcript ||
          payload?.message ||
          "";

        if (!transcript) return;

        setMessages((prev) => [
          ...prev,
          {
            id: makeId("user"),
            role: "user",
            type: "voice",
            text: transcript,
            audioLabel:
              "Ubutumwa bw’amajwi",
            timestamp: Date.now(),
          },
        ]);
      }
    );

    /* ----------------------------------------------------------
       ANSWER CHUNKS
    ---------------------------------------------------------- */

    socket.on(
      "antimate:answer:chunk",
      (payload) => {
        const chunk =
          typeof payload === "string"
            ? payload
            : payload?.text ||
              payload?.answer ||
              payload?.chunk ||
              "";

        if (!chunk) return;

        setMessages((prev) => {
          const index = [...prev]
            .reverse()
            .findIndex(
              (message) =>
                message.role ===
                  "assistant" &&
                message.streaming
            );

          if (index === -1) {
            return [
              ...prev,
              {
                id: makeId("ai"),
                role: "assistant",
                type: "text",
                text: chunk,
                streaming: true,
                timestamp: Date.now(),
              },
            ];
          }

          const realIndex =
            prev.length - 1 - index;

          return prev.map(
            (message, i) => {
              if (i !== realIndex) {
                return message;
              }

              return {
                ...message,
                text: `${message.text || ""}${chunk}`,
              };
            }
          );
        });
      }
    );

    /* ----------------------------------------------------------
       FINAL ANSWER
    ---------------------------------------------------------- */

    socket.on(
      "antimate:answer",
      (payload) => {
        console.log(
          "🤖 ANTIMATE ANSWER:",
          payload
        );

        const answer =
          extractAnswer(payload);

        const audioUrl =
          extractAudio(payload);

        if (!answer) return;

        lastAnswerRef.current =
          answer;

        setMessages((prev) => {
          const streamingIndex =
            [...prev]
              .reverse()
              .findIndex(
                (message) =>
                  message.role ===
                    "assistant" &&
                  message.streaming
              );

          if (streamingIndex !== -1) {
            const realIndex =
              prev.length -
              1 -
              streamingIndex;

            return prev.map(
              (message, index) => {
                if (
                  index !== realIndex
                ) {
                  return message;
                }

                return {
                  ...message,
                  text: answer,
                  streaming: false,
                  audioUrl:
                    audioUrl ||
                    message.audioUrl ||
                    null,
                };
              }
            );
          }

          const lastMessage =
            prev[prev.length - 1];

          if (
            lastMessage?.role ===
              "assistant" &&
            lastMessage.text === answer
          ) {
            return prev.map(
              (message) => {
                if (
                  message.id !==
                  lastMessage.id
                ) {
                  return message;
                }

                return {
                  ...message,
                  audioUrl:
                    audioUrl ||
                    message.audioUrl ||
                    null,
                };
              }
            );
          }

          return [
            ...prev,
            {
              id: makeId("ai"),
              role: "assistant",
              type: "text",
              text: answer,
              audioUrl:
                audioUrl || null,
              streaming: false,
              timestamp: Date.now(),
            },
          ];
        });

        setIsProcessing(true);
      }
    );

    /* ----------------------------------------------------------
       AI AUDIO
    ---------------------------------------------------------- */

    socket.on(
      "antimate:audio",
      (payload) => {
        console.log(
          "🔊 ANTIMATE AUDIO:",
          payload
        );

        const url =
          extractAudio(payload);

        if (!url) {
          console.warn(
            "⚠️ No playable audio URL received."
          );

          return;
        }

        /*
         * Attach audio URL to latest AI
         * message so replay button works.
         */

        setMessages((prev) => {
          let targetIndex = -1;

          for (
            let i = prev.length - 1;
            i >= 0;
            i--
          ) {
            if (
              prev[i].role ===
              "assistant"
            ) {
              targetIndex = i;
              break;
            }
          }

          if (targetIndex === -1) {
            return prev;
          }

          return prev.map(
            (message, index) => {
              if (
                index !== targetIndex
              ) {
                return message;
              }

              return {
                ...message,
                audioUrl: url,
              };
            }
          );
        });

        /*
         * Find latest AI message ID
         * after state update isn't immediate,
         * therefore audio plays without requiring
         * messageId. Replay gets the URL from state.
         */

        playAudio(url);
      }
    );

    /* ----------------------------------------------------------
       COMPLETE
    ---------------------------------------------------------- */

    socket.on(
      "antimate:complete",
      (payload) => {
        console.log(
          "✅ ANTIMATE COMPLETE:",
          payload
        );

        setIsProcessing(false);

        /*
         * Keep backend reasoning visible
         * until next backend status arrives.
         */

        if (
          isLiveVoiceRef.current &&
          voiceSessionActiveRef.current &&
          !isPlayingRef.current
        ) {
          scheduleLiveResume(500);
        }
      }
    );

    /* ----------------------------------------------------------
       ERROR
    ---------------------------------------------------------- */

    socket.on(
      "antimate:error",
      (payload) => {
        console.error(
          "❌ ANTIMATE ERROR:",
          payload
        );

        const message =
          payload?.message ||
          payload?.error ||
          "Habaye ikibazo mu gutunganya voice.";

        setError(message);

        setIsProcessing(false);

        setBackendReasoning("");

        if (
          isLiveVoiceRef.current &&
          voiceSessionActiveRef.current
        ) {
          scheduleLiveResume(700);
        }
      }
    );

    /* ----------------------------------------------------------
       CLEAN SOCKET
    ---------------------------------------------------------- */

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [playAudio, scheduleLiveResume]);

  /* ============================================================
     START SILENCE DETECTION
  ============================================================ */

  const startSilenceDetection =
    useCallback(
      (stream) => {
        stopSilenceDetection();

        try {
          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (!AudioContextClass) {
            return;
          }

          const context =
            new AudioContextClass();

          const source =
            context.createMediaStreamSource(
              stream
            );

          const analyser =
            context.createAnalyser();

          analyser.fftSize = 2048;

          source.connect(analyser);

          audioContextRef.current =
            context;

          const data = new Uint8Array(
            analyser.fftSize
          );

          let silenceStarted = null;

          const check = () => {
            if (
              !voiceSessionActiveRef.current
            ) {
              return;
            }

            if (!recorderRef.current) {
              return;
            }

            if (
              recorderRef.current.state !==
              "recording"
            ) {
              return;
            }

            analyser.getByteTimeDomainData(
              data
            );

            let sum = 0;

            for (
              let i = 0;
              i < data.length;
              i++
            ) {
              const normalized =
                (data[i] - 128) / 128;

              sum +=
                normalized *
                normalized;
            }

            const rms = Math.sqrt(
              sum / data.length
            );

            if (
              rms < SILENCE_THRESHOLD
            ) {
              if (!silenceStarted) {
                silenceStarted =
                  Date.now();
              }

              if (
                Date.now() -
                  silenceStarted >=
                SILENCE_LIMIT_MS
              ) {
                console.log(
                  "🔇 LIVE SILENCE DETECTED"
                );

                stopCurrentRecording();

                silenceStarted = null;

                return;
              }
            } else {
              silenceStarted = null;
            }

            silenceAnimationRef.current =
              requestAnimationFrame(
                check
              );
          };

          check();
        } catch (err) {
          console.error(
            "❌ Silence detection error:",
            err
          );
        }
      },
      [stopSilenceDetection]
    );

  /* ============================================================
     START RECORDING
  ============================================================ */

  const startRecordingInternal =
    useCallback(
      async (mode = "tap") => {
        if (
          !socketRef.current?.connected
        ) {
          setError(
            "ANTIMATE ntabwo ihujwe na server. Ongera ugerageze."
          );

          return;
        }

        if (recorderRef.current) {
          return;
        }

        setError("");

        setBackendReasoning(
          mode === "live"
            ? "Live voice iratangira..."
            : "Voice recording iratangira..."
        );

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

          const mimeType =
            getSupportedMimeType();

          const recorder =
            new MediaRecorder(
              stream,
              mimeType
                ? { mimeType }
                : undefined
            );

          recorderRef.current =
            recorder;

          const actualMimeType =
            recorder.mimeType ||
            mimeType ||
            "audio/webm";

          const extension =
            extensionFromMime(
              actualMimeType
            );

          /*
           * Important:
           * Wait for all async audio chunks
           * before sending voice:end.
           */

          const chunkPromises = [];

          recorder.ondataavailable = (
            event
          ) => {
            if (
              !event.data ||
              !event.data.size
            ) {
              return;
            }

            const promise =
              event.data
                .arrayBuffer()
                .then((buffer) => {
                  const socket =
                    socketRef.current;

                  if (
                    !socket?.connected
                  ) {
                    return;
                  }

                  socket.emit(
                    "antimate:voice:chunk",
                    buffer
                  );
                })
                .catch((err) => {
                  console.error(
                    "❌ Voice chunk error:",
                    err
                  );
                });

            chunkPromises.push(
              promise
            );
          };

          recorder.onerror = (
            event
          ) => {
            console.error(
              "❌ MediaRecorder error:",
              event
            );

            setError(
              "Habaye ikibazo mu gufata amajwi."
            );
          };

          recorder.onstop = async () => {
            stopSilenceDetection();

            stopMediaTracks();

            await Promise.all(
              chunkPromises
            );

            const socket =
              socketRef.current;

            if (socket?.connected) {
              socket.emit(
                "antimate:voice:end",
                {
                  mode,
                  mimeType:
                    actualMimeType,
                  extension,
                }
              );
            }

            recorderRef.current =
              null;

            setIsRecording(false);

            if (mode === "live") {
              liveWaitingForResponseRef.current =
                true;

              setIsProcessing(true);

              setBackendReasoning(
                "ANTIMATE iri gutunganya ubutumwa bw’amajwi..."
              );
            } else {
              setIsProcessing(true);

              setBackendReasoning(
                "ANTIMATE iri gutunganya ubutumwa bw’amajwi..."
              );
            }
          };

          recorder.start(250);

          setIsRecording(true);

          setRecordingSeconds(0);

          await requestWakeLock();

          socketRef.current.emit(
            "antimate:voice:start",
            {
              mimeType:
                actualMimeType,
              extension,
              language: "rw",
              mode,
            }
          );

          if (recordingTimerRef.current) {
            clearInterval(
              recordingTimerRef.current
            );
          }

          recordingTimerRef.current =
            setInterval(() => {
              setRecordingSeconds(
                (seconds) => {
                  const next =
                    seconds + 1;

                  if (
                    next >=
                      MAX_RECORDING_SECONDS &&
                    recorderRef.current
                      ?.state ===
                      "recording"
                  ) {
                    stopCurrentRecording();
                  }

                  return next;
                }
              );
            }, 1000);

          if (mode === "live") {
            startSilenceDetection(
              stream
            );
          }
        } catch (err) {
          console.error(
            "❌ Microphone error:",
            err
          );

          stopMediaTracks();

          setIsRecording(false);

          setError(
            "Ntabwo nshoboye gufungura microphone. Reba permission ya browser."
          );

          setBackendReasoning("");
        }
      },
      [
        requestWakeLock,
        startSilenceDetection,
        stopCurrentRecording,
        stopMediaTracks,
        stopSilenceDetection,
      ]
    );

  useEffect(() => {
    startRecordingInternalRef.current =
      startRecordingInternal;
  }, [startRecordingInternal]);

  /* ============================================================
     STOP CURRENT RECORDING
  ============================================================ */

  const stopCurrentRecording =
    useCallback(() => {
      if (recordingTimerRef.current) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current = null;
      }

      stopSilenceDetection();

      const recorder =
        recorderRef.current;

      if (
        recorder &&
        recorder.state === "recording"
      ) {
        recorder.stop();
      } else {
        stopMediaTracks();

        recorderRef.current = null;

        setIsRecording(false);
      }

      setRecordingSeconds(0);
    }, [
      stopMediaTracks,
      stopSilenceDetection,
    ]);

  /* ============================================================
     HOLD / TAP
  ============================================================ */

  const handleVoicePointerDown =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (isProcessingRef.current) {
          return;
        }

        if (isPlayingRef.current) {
          return;
        }

        if (
          event.currentTarget
            .setPointerCapture &&
          event.pointerId !== undefined
        ) {
          try {
            event.currentTarget.setPointerCapture(
              event.pointerId
            );
          } catch {}
        }

        pointerActiveRef.current =
          true;

        /*
         * Second press stops normal recording.
         */

        if (recorderRef.current) {
          stopCurrentRecording();

          return;
        }

        voiceSessionActiveRef.current =
          false;

        await startRecordingInternal(
          "tap"
        );

        /*
         * Hold for 5 seconds =>
         * live voice.
         */

        holdTimerRef.current =
          setTimeout(() => {
            if (
              !pointerActiveRef.current
            ) {
              return;
            }

            if (!recorderRef.current) {
              return;
            }

            console.log(
              "🎙️ HOLD >= 5s — LIVE VOICE ENABLED"
            );

            voiceSessionActiveRef.current =
              true;

            setIsLiveVoice(true);

            isLiveVoiceRef.current =
              true;

            setBackendReasoning(
              "Live voice mode irakora..."
            );

            if (
              mediaStreamRef.current
            ) {
              startSilenceDetection(
                mediaStreamRef.current
              );
            }
          }, HOLD_TO_LIVE_MS);
      },
      [
        startRecordingInternal,
        startSilenceDetection,
        stopCurrentRecording,
      ]
    );

  const handleVoicePointerUp =
    useCallback((event) => {
      event.preventDefault();

      pointerActiveRef.current =
        false;

      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current = null;
      }

      if (
        event.currentTarget
          .releasePointerCapture &&
        event.pointerId !== undefined
      ) {
        try {
          event.currentTarget.releasePointerCapture(
            event.pointerId
          );
        } catch {}
      }

      /*
       * Normal tap:
       * recording continues until
       * user presses again.
       *
       * Live:
       * recording continues automatically.
       */
    }, []);

  /* ============================================================
     STOP LIVE VOICE
  ============================================================ */

  const stopLiveVoice =
    useCallback(() => {
      voiceSessionActiveRef.current =
        false;

      liveWaitingForResponseRef.current =
        false;

      setIsLiveVoice(false);

      isLiveVoiceRef.current =
        false;

      if (liveResumeTimerRef.current) {
        clearTimeout(
          liveResumeTimerRef.current
        );

        liveResumeTimerRef.current =
          null;
      }

      if (
        socketRef.current?.connected
      ) {
        socketRef.current.emit(
          "antimate:voice:cancel"
        );
      }

      stopCurrentRecording();

      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }

      setIsPlaying(false);

      setPlayingMessageId(null);

      setBackendReasoning("");

      releaseWakeLock();
    }, [
      releaseWakeLock,
      stopCurrentRecording,
    ]);

  /* ============================================================
     TEXT CHAT
  ============================================================ */

  const sendTextMessage =
    useCallback(async () => {
      const text = input.trim();

      if (!text) return;

      if (isProcessingRef.current) {
        return;
      }

      setError("");

      setBackendReasoning(
        "ANTIMATE iri gutunganya ikibazo..."
      );

      setMessages((prev) => [
        ...prev,
        {
          id: makeId("user"),
          role: "user",
          type: "text",
          text,
          timestamp: Date.now(),
        },
      ]);

      setInput("");

      setIsProcessing(true);

      try {
        const response =
          await fetch(
            `${API_URL}/api/antimate/chat`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify({
                message: text,
                language: "rw",
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              `HTTP ${response.status}`
          );
        }

        const answer =
          extractAnswer(data);

        const audioUrl =
          extractAudio(data);

        if (answer) {
          const messageId =
            makeId("ai");

          setMessages((prev) => [
            ...prev,
            {
              id: messageId,
              role: "assistant",
              type: "text",
              text: answer,
              audioUrl,
              timestamp: Date.now(),
            },
          ]);

          if (audioUrl) {
            playAudio(
              audioUrl,
              messageId
            );
          }
        }

        setBackendReasoning("");
      } catch (err) {
        console.error(
          "❌ Text chat error:",
          err
        );

        setError(
          err.message ||
            "Habaye ikibazo mu kohereza ubutumwa."
        );

        setBackendReasoning("");
      } finally {
        setIsProcessing(false);
      }
    }, [input, playAudio]);

  /* ============================================================
     INPUT KEYBOARD
  ============================================================ */

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendTextMessage();
    }
  };

  /* ============================================================
     CLEANUP
  ============================================================ */

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );
      }

      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );
      }

      if (
        liveResumeTimerRef.current
      ) {
        clearTimeout(
          liveResumeTimerRef.current
        );
      }

      stopSilenceDetection();

      stopMediaTracks();

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
  }, [
    stopMediaTracks,
    stopSilenceDetection,
  ]);

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div
      className={`antimate-page ${
        darkMode ? "dark-theme" : "light-theme"
      }`}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .antimate-page {
          min-height: 100vh;
          width: 100%;

          background:
            radial-gradient(
              circle at top left,
              rgba(52, 211, 153, 0.10),
              transparent 32%
            ),
            var(--antimate-bg);

          color: var(--antimate-text);

          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          display: flex;
          flex-direction: column;

          transition:
            background 0.3s ease,
            color 0.3s ease;

          --antimate-bg: #f6f8fb;
          --antimate-surface: #ffffff;
          --antimate-surface-2: #f0f3f7;
          --antimate-border: rgba(15, 23, 42, 0.09);
          --antimate-text: #101828;
          --antimate-muted: #667085;
          --antimate-ai: #ffffff;
          --antimate-user: #dff7ed;
          --antimate-green: #16a34a;
          --antimate-green-dark: #15803d;
        }

        .antimate-page.dark-theme {
          --antimate-bg: #07111f;
          --antimate-surface: #0d1a2b;
          --antimate-surface-2: #122238;
          --antimate-border: rgba(255, 255, 255, 0.09);
          --antimate-text: #f8fafc;
          --antimate-muted: #94a3b8;
          --antimate-ai: #0e1c2e;
          --antimate-user: #123b2d;
          --antimate-green: #22c55e;
          --antimate-green-dark: #16a34a;
        }

        /* ======================================================
           HEADER
        ====================================================== */

        .antimate-header {
          height: 70px;
          padding: 0 22px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-bottom:
            1px solid
            var(--antimate-border);

          background:
            rgba(255,255,255,0.72);

          backdrop-filter: blur(18px);

          position: sticky;
          top: 0;
          z-index: 20;

          transition:
            background 0.3s ease,
            border-color 0.3s ease;
        }

        .dark-theme .antimate-header {
          background:
            rgba(7,17,31,0.78);
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 10px;

          font-weight: 800;
          font-size: 18px;
        }

        .antimate-logo {
          width: 38px;
          height: 38px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #22c55e,
              #06b6d4,
              #8b5cf6
            );

          color: white;

          box-shadow:
            0 0 0 4px rgba(34,197,94,0.08),
            0 8px 24px rgba(34,197,94,0.20);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 7px;

          font-size: 12px;
          color: var(--antimate-muted);
        }

        .connection-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background: #ef4444;
        }

        .connection-dot.online {
          background: #22c55e;

          box-shadow:
            0 0 10px
            rgba(34,197,94,0.65);
        }

        /* ======================================================
           THEME BUTTON
        ====================================================== */

        .theme-toggle {
          width: 38px;
          height: 38px;

          border-radius: 50%;

          border:
            1px solid
            var(--antimate-border);

          background:
            var(--antimate-surface-2);

          color:
            var(--antimate-text);

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            background 0.2s ease,
            color 0.2s ease;
        }

        .theme-toggle:hover {
          transform: translateY(-2px);

          background:
            var(--antimate-green);

          color: white;

          border-color:
            var(--antimate-green);
        }

        /* ======================================================
           CHAT
        ====================================================== */

        .chat-container {
          width: 100%;
          max-width: 980px;

          margin: 0 auto;

          flex: 1;

          display: flex;
          flex-direction: column;

          padding:
            25px
            18px
            160px;
        }

        .welcome {
          text-align: center;

          padding:
            50px
            20px
            35px;
        }

        .welcome-logo {
          width: 76px;
          height: 76px;

          margin:
            0 auto
            18px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #22c55e,
              #06b6d4,
              #8b5cf6
            );

          color: white;

          box-shadow:
            0 15px 45px
            rgba(34,197,94,0.22);
        }

        .welcome h1 {
          margin:
            0 0 9px;

          font-size: 30px;
        }

        .welcome p {
          margin: 0;

          color:
            var(--antimate-muted);

          font-size: 15px;
        }

        .messages {
          display: flex;
          flex-direction: column;

          gap: 18px;

          width: 100%;
        }

        /* ======================================================
           MESSAGE ROWS
        ====================================================== */

        .message-row {
          width: 100%;
          display: flex;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;
        }

        /* ======================================================
           USER MESSAGE — RIGHT
        ====================================================== */

        .message-card.user {
          max-width:
            min(78%, 620px);

          background:
            var(--antimate-user);

          border:
            1px solid
            rgba(34,197,94,0.12);

          border-radius:
            20px
            20px
            5px
            20px;

          padding:
            13px 15px;

          box-shadow:
            0 7px 25px
            rgba(15,23,42,0.05);
        }

        .user-message-content {
          display: flex;
          align-items: flex-start;

          gap: 10px;
        }

        .user-message-icon {
          width: 32px;
          height: 32px;

          flex:
            0 0 32px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            rgba(34,197,94,0.14);

          color:
            var(--antimate-green);
        }

        /* ======================================================
           VOICE MESSAGE — RIGHT
        ====================================================== */

        .voice-message {
          min-width: 250px;
        }

        .voice-message-title {
          display: flex;
          align-items: center;

          gap: 8px;

          font-size: 12px;
          font-weight: 800;

          color:
            var(--antimate-green-dark);

          margin-bottom: 8px;
        }

        .voice-message-wave {
          display: flex;
          align-items: center;

          gap: 3px;

          height: 25px;

          margin-bottom: 8px;
        }

        .voice-message-wave span {
          width: 3px;

          border-radius: 10px;

          background:
            var(--antimate-green);

          animation:
            voiceWave
            1s
            ease-in-out
            infinite;
        }

        .voice-message-wave span:nth-child(1) {
          height: 8px;
          animation-delay: 0s;
        }

        .voice-message-wave span:nth-child(2) {
          height: 16px;
          animation-delay: 0.1s;
        }

        .voice-message-wave span:nth-child(3) {
          height: 23px;
          animation-delay: 0.2s;
        }

        .voice-message-wave span:nth-child(4) {
          height: 13px;
          animation-delay: 0.3s;
        }

        .voice-message-wave span:nth-child(5) {
          height: 20px;
          animation-delay: 0.4s;
        }

        .voice-message-wave span:nth-child(6) {
          height: 10px;
          animation-delay: 0.5s;
        }

        @keyframes voiceWave {
          0%, 100% {
            transform: scaleY(0.65);
            opacity: 0.65;
          }

          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .voice-message-transcript {
          color:
            var(--antimate-text);

          line-height: 1.5;

          font-size: 14px;

          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        /* ======================================================
           AI MESSAGE — LEFT
        ====================================================== */

        .message-card.assistant {
          max-width:
            min(82%, 700px);

          background:
            var(--antimate-ai);

          border:
            1px solid
            var(--antimate-border);

          border-radius:
            20px
            20px
            20px
            5px;

          padding:
            14px 16px;

          box-shadow:
            0 7px 30px
            rgba(15,23,42,0.055);
        }

        .ai-message-content {
          display: flex;
          align-items: flex-start;

          gap: 11px;
        }

        .ai-avatar {
          width: 36px;
          height: 36px;

          flex:
            0 0 36px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          color: white;

          background:
            linear-gradient(
              135deg,
              #22c55e,
              #06b6d4,
              #8b5cf6
            );

          box-shadow:
            0 6px 18px
            rgba(34,197,94,0.20);
        }

        .ai-content {
          min-width: 0;
          flex: 1;
        }

        .ai-name {
          font-size: 12px;

          font-weight: 800;

          margin-bottom: 5px;
        }

        .ai-text {
          font-size: 15px;

          line-height: 1.65;

          white-space: pre-wrap;

          overflow-wrap: anywhere;
        }

        /* ======================================================
           AI ACTIONS
        ====================================================== */

        .ai-actions {
          display: flex;
          align-items: center;

          margin-top: 10px;

          gap: 7px;
        }

        .replay-button {
          width: 34px;
          height: 34px;

          border-radius: 50%;

          border:
            1px solid
            var(--antimate-border);

          background:
            var(--antimate-surface-2);

          color:
            var(--antimate-muted);

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            background 0.2s ease,
            color 0.2s ease;
        }

        .replay-button:hover {
          transform:
            translateY(-2px);

          background:
            var(--antimate-green);

          color: white;

          border-color:
            var(--antimate-green);
        }

        .replay-button.playing {
          background:
            var(--antimate-green);

          color: white;

          border-color:
            var(--antimate-green);
        }

        /* ======================================================
           BACKEND REASONING
        ====================================================== */

        .thinking-row {
          display: flex;
          justify-content: flex-start;
        }

        .thinking-card {
          display: flex;
          align-items: center;

          gap: 10px;

          color:
            var(--antimate-muted);

          background:
            var(--antimate-surface);

          border:
            1px solid
            var(--antimate-border);

          border-radius: 18px;

          padding:
            10px 14px;

          font-size: 13px;

          max-width: 90%;

          transition:
            background 0.3s ease;
        }

        .thinking-loader {
          animation:
            spin
            1s
            linear
            infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ======================================================
           ERROR
        ====================================================== */

        .error-box {
          max-width: 980px;

          width:
            calc(100% - 36px);

          margin:
            0 auto
            12px;

          padding:
            10px 13px;

          border-radius: 12px;

          background:
            rgba(239,68,68,0.09);

          border:
            1px solid
            rgba(239,68,68,0.18);

          color: #ef4444;

          font-size: 13px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;
        }

        .error-close {
          border: none;

          background:
            transparent;

          color: inherit;

          cursor: pointer;
        }

        /* ======================================================
           COMPOSER
        ====================================================== */

        .composer-wrapper {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding:
            14px
            18px
            calc(
              14px +
              env(
                safe-area-inset-bottom
              )
            );

          background:
            linear-gradient(
              to top,
              var(--antimate-bg) 65%,
              transparent
            );
        }

        .composer {
          max-width: 980px;

          margin: 0 auto;

          min-height: 58px;

          display: flex;
          align-items: flex-end;

          gap: 10px;

          padding:
            8px
            8px
            8px
            16px;

          border:
            1px solid
            var(--antimate-border);

          border-radius: 20px;

          background:
            var(--antimate-surface);

          box-shadow:
            0 12px 45px
            rgba(15,23,42,0.12);
        }

        .composer textarea {
          flex: 1;

          min-width: 0;

          min-height: 40px;

          max-height: 130px;

          resize: none;

          border: none;

          outline: none;

          background:
            transparent;

          color:
            var(--antimate-text);

          font-size: 15px;

          line-height: 1.45;

          padding:
            9px 2px;
        }

        .composer textarea::placeholder {
          color:
            var(--antimate-muted);
        }

        .composer-action {
          width: 44px;
          height: 44px;

          flex:
            0 0 44px;

          border: none;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          background:
            var(--antimate-green);

          color: white;

          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .composer-action:hover {
          transform:
            translateY(-2px);

          background:
            var(--antimate-green-dark);

          box-shadow:
            0 7px 22px
            rgba(34,197,94,0.25);
        }

        .composer-action:disabled {
          opacity: 0.45;

          cursor: not-allowed;

          transform: none;

          box-shadow: none;
        }

        .composer-action.recording {
          background: #ef4444;

          box-shadow:
            0 0 0 7px
            rgba(239,68,68,0.12);

          animation:
            recordingPulse
            1.2s
            ease-in-out
            infinite;
        }

        .composer-action.live {
          background: #f97316;

          box-shadow:
            0 0 0 7px
            rgba(249,115,22,0.12);
        }

        @keyframes recordingPulse {
          0%, 100% {
            box-shadow:
              0 0 0 6px
              rgba(239,68,68,0.12);
          }

          50% {
            box-shadow:
              0 0 0 11px
              rgba(239,68,68,0.04);
          }
        }

        /* ======================================================
           RECORDING STATUS
        ====================================================== */

        .recording-status {
          max-width: 980px;

          margin:
            0 auto
            7px;

          display: flex;

          justify-content:
            flex-end;
        }

        .recording-pill {
          display: flex;
          align-items: center;

          gap: 8px;

          padding:
            7px 11px;

          border-radius: 14px;

          background:
            var(--antimate-surface);

          border:
            1px solid
            var(--antimate-border);

          font-size: 12px;

          color:
            var(--antimate-muted);
        }

        .recording-live-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #ef4444;

          animation:
            recordingDot
            1s
            infinite;
        }

        @keyframes recordingDot {
          50% {
            opacity: 0.3;
          }
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 650px) {
          .antimate-header {
            height: 62px;

            padding:
              0 14px;
          }

          .chat-container {
            padding:
              18px
              10px
              145px;
          }

          .welcome {
            padding:
              38px
              12px
              25px;
          }

          .welcome h1 {
            font-size: 25px;
          }

          .message-card.user,
          .message-card.assistant {
            max-width: 88%;
          }

          .voice-message {
            min-width: 210px;
          }

          .composer-wrapper {
            padding:
              9px
              9px
              calc(
                9px +
                env(
                  safe-area-inset-bottom
                )
              );
          }

          .composer {
            border-radius: 18px;
          }

          .header-actions {
            gap: 9px;
          }

          .connection-status span:last-child {
            display: none;
          }
        }
      `}</style>

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="antimate-header">
        <div className="antimate-brand">
          <div className="antimate-logo">
            <Bot size={21} />
          </div>

          <span>ANTIMATE AI</span>
        </div>

        <div className="header-actions">
          {/* PRIMARY THEME */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={
              darkMode
                ? "Hindura kuri Light Mode"
                : "Hindura kuri Dark Mode"
            }
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          {/* CONNECTION */}
          <div className="connection-status">
            <span
              className={`connection-dot ${
                connected
                  ? "online"
                  : ""
              }`}
            />

            {connected ? (
              <>
                <Wifi size={14} />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff size={14} />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          CHAT
      ======================================================== */}

      <main className="chat-container">
        {messages.length === 0 && (
          <div className="welcome">
            <div className="welcome-logo">
              <Bot size={38} />
            </div>

            <h1>
              Murakaza neza kuri ANTIMATE AI
            </h1>

            <p>
              Vugana nanjye cyangwa wandike
              ikibazo cyawe.
            </p>
          </div>
        )}

        <div className="messages">
          {messages.map((message) => {
            const isUser =
              message.role === "user";

            const isVoice =
              message.type === "voice";

            return (
              <div
                key={message.id}
                className={`message-row ${
                  isUser
                    ? "user"
                    : "assistant"
                }`}
              >
                {/* ==================================================
                    USER
                ================================================== */}

                {isUser ? (
                  <div className="message-card user">
                    {isVoice ? (
                      <div className="voice-message">
                        <div className="voice-message-title">
                          <Mic size={14} />

                          <span>
                            Ubutumwa bw’amajwi
                          </span>
                        </div>

                        <div className="voice-message-wave">
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>

                        {message.text && (
                          <div className="voice-message-transcript">
                            {message.text}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="user-message-content">
                        <div className="user-message-icon">
                          <User size={16} />
                        </div>

                        <div>
                          {message.text}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ==================================================
                     AI
                  ================================================== */

                  <div className="message-card assistant">
                    <div className="ai-message-content">
                      <div className="ai-avatar">
                        <Bot size={19} />
                      </div>

                      <div className="ai-content">
                        <div className="ai-name">
                          ANTIMATE AI
                        </div>

                        <div className="ai-text">
                          {message.text}
                        </div>

                        {/* ============================================
                            REPLAY AI VOICE
                        ============================================ */}

                        {message.audioUrl && (
                          <div className="ai-actions">
                            <button
                              type="button"
                              className={`replay-button ${
                                playingMessageId ===
                                message.id
                                  ? "playing"
                                  : ""
                              }`}
                              onClick={() =>
                                replayAIMessage(
                                  message
                                )
                              }
                              title={
                                playingMessageId ===
                                message.id
                                  ? "Hagarika ijwi"
                                  : "Ongera wumve ijwi rya AI"
                              }
                            >
                              {playingMessageId ===
                              message.id ? (
                                <VolumeX
                                  size={17}
                                />
                              ) : (
                                <Volume2
                                  size={17}
                                />
                              )}
                            </button>

                            <span
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "var(--antimate-muted)",
                              }}
                            >
                              Ongera wumve
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ========================================================
              BACKEND REASONING / STATUS
          ======================================================== */}

          {isProcessing &&
            backendReasoning && (
              <div className="thinking-row">
                <div className="thinking-card">
                  <Loader2
                    size={16}
                    className="thinking-loader"
                  />

                  <span>
                    {backendReasoning}
                  </span>
                </div>
              </div>
            )}
        </div>
      </main>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div className="error-box">
          <span>{error}</span>

          <button
            className="error-close"
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================
          COMPOSER
      ======================================================== */}

      <div className="composer-wrapper">
        {isRecording && (
          <div className="recording-status">
            <div className="recording-pill">
              <span className="recording-live-dot" />

              <span>
                {isLiveVoice
                  ? "Live voice"
                  : "Ndimo gufata amajwi"}
              </span>

              <strong>
                {recordingSeconds}s
              </strong>

              {isLiveVoice && (
                <button
                  type="button"
                  onClick={
                    stopLiveVoice
                  }
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    color: "#ef4444",
                    cursor: "pointer",
                    display: "flex",
                    alignItems:
                      "center",
                  }}
                  title="Hagarika live voice"
                >
                  <Square size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="composer">
          <textarea
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value
              )
            }
            onKeyDown={handleKeyDown}
            placeholder={
              isLiveVoice
                ? "Vuga..."
                : "Andika ubutumwa..."
            }
            disabled={
              isLiveVoice ||
              isProcessing
            }
            rows={1}
          />

          <button
            type="button"
            className={`composer-action ${
              isRecording
                ? isLiveVoice
                  ? "live"
                  : "recording"
                : ""
            }`}
            disabled={
              isProcessing &&
              !isRecording
            }
            onPointerDown={
              input.trim()
                ? undefined
                : handleVoicePointerDown
            }
            onPointerUp={
              input.trim()
                ? undefined
                : handleVoicePointerUp
            }
            onPointerCancel={
              input.trim()
                ? undefined
                : handleVoicePointerUp
            }
            onClick={
              input.trim()
                ? sendTextMessage
                : undefined
            }
            title={
              input.trim()
                ? "Ohereza"
                : isRecording
                ? "Hagarika gufata amajwi"
                : "Kanda gufata amajwi"
            }
          >
            {input.trim() ? (
              <Send size={20} />
            ) : isRecording ? (
              <Square size={18} />
            ) : (
              <Mic size={21} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}