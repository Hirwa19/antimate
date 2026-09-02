import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import "./AntimateAI.css";

/* ============================================================
   ANTIMATE AI
   Clean Glass / Voice-first Chat UI
   ============================================================ */

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/$/, "");

const MAX_RECORD_SECONDS = 30;
const SILENCE_LIMIT = 1800;

export default function AntimateAI() {
  /* ============================================================
     STATE
     ============================================================ */

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [socketConnected, setSocketConnected] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isLiveVoice, setIsLiveVoice] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [recordSeconds, setRecordSeconds] = useState(0);

  const [transcript, setTranscript] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");

  const [error, setError] = useState("");

  /* ============================================================
     REFS
     ============================================================ */

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const recordTimerRef = useRef(null);
  const holdTimerRef = useRef(null);

  const isRecordingRef = useRef(false);
  const isLiveVoiceRef = useRef(false);
  const isPlayingRef = useRef(false);

  const currentAnswerRef = useRef("");

  const textareaRef = useRef(null);

  const shortRecordingRef = useRef(false);

  /* ============================================================
     KEEP REFS IN SYNC
     ============================================================ */

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isLiveVoiceRef.current = isLiveVoice;
  }, [isLiveVoice]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentAnswerRef.current = currentAnswer;
  }, [currentAnswer]);

  /* ============================================================
     HELPERS
     ============================================================ */

  const makeAbsoluteUrl = useCallback((url) => {
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
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  /* ============================================================
     ADD MESSAGE
     ============================================================ */

  const addMessage = useCallback((role, content) => {
    if (!content) return;

    setMessages((prev) => [
      ...prev,
      {
        id:
          Date.now() +
          Math.random()
            .toString(36)
            .slice(2),
        role,
        content,
        time: new Date(),
      },
    ]);
  }, []);

  /* ============================================================
     UPDATE LAST ASSISTANT MESSAGE
     ============================================================ */

  const updateAssistantMessage = useCallback((content) => {
    if (!content) return;

    setMessages((prev) => {
      const copy = [...prev];

      const lastIndex = copy.length - 1;

      if (
        lastIndex >= 0 &&
        copy[lastIndex].role === "assistant"
      ) {
        copy[lastIndex] = {
          ...copy[lastIndex],
          content,
        };
      } else {
        copy.push({
          id:
            Date.now() +
            Math.random()
              .toString(36)
              .slice(2),
          role: "assistant",
          content,
          time: new Date(),
        });
      }

      return copy;
    });

    scrollToBottom();
  }, [scrollToBottom]);

  /* ============================================================
     AUDIO PLAYBACK
     ============================================================ */

  const playAudio = useCallback(
    async (audioUrl) => {
      if (!audioUrl) return;

      try {
        setIsPlaying(true);
        isPlayingRef.current = true;

        const audio = new Audio(
          makeAbsoluteUrl(audioUrl)
        );

        audio.preload = "auto";

        audio.onended = () => {
          setIsPlaying(false);
          isPlayingRef.current = false;

          /*
           * LIVE VOICE:
           * after AI finishes speaking,
           * microphone becomes active again.
           */
          if (isLiveVoiceRef.current) {
            setTimeout(() => {
              startLiveVoice();
            }, 250);
          }
        };

        audio.onerror = () => {
          setIsPlaying(false);
          isPlayingRef.current = false;

          if (isLiveVoiceRef.current) {
            setTimeout(() => {
              startLiveVoice();
            }, 250);
          }
        };

        await audio.play();
      } catch (err) {
        console.error("Audio playback error:", err);

        setIsPlaying(false);
        isPlayingRef.current = false;

        if (isLiveVoiceRef.current) {
          setTimeout(() => {
            startLiveVoice();
          }, 250);
        }
      }
    },
    [makeAbsoluteUrl]
  );

  /* ============================================================
     SOCKET CONNECTION
     ============================================================ */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "🟢 ANTIMATE Socket connected:",
        socket.id
      );

      setSocketConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "🔴 ANTIMATE Socket disconnected:",
        reason
      );

      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error(
        "Socket connection error:",
        err
      );

      setSocketConnected(false);
    });

    /* ==========================================================
       STATUS
       ========================================================== */

    socket.on("antimate:status", (data) => {
      console.log(
        "ANTIMATE STATUS:",
        data
      );
    });

    /* ==========================================================
       TRANSCRIPT
       ========================================================== */

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

    /* ==========================================================
       THINKING
       ========================================================== */

    socket.on("antimate:thinking", () => {
      setIsProcessing(true);
    });

    /* ==========================================================
       ANSWER
       ========================================================== */

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

      updateAssistantMessage(answer);

      setIsProcessing(false);
    });

    /* ==========================================================
       STREAMING ANSWER CHUNKS
       ========================================================== */

    socket.on(
      "antimate:answer:chunk",
      (data) => {
        const chunk =
          typeof data === "string"
            ? data
            : data?.chunk ||
              data?.text ||
              data?.answer ||
              "";

        if (!chunk) return;

        const next =
          currentAnswerRef.current + chunk;

        currentAnswerRef.current = next;

        setCurrentAnswer(next);

        updateAssistantMessage(next);

        setIsProcessing(false);
      }
    );

    /* ==========================================================
       AUDIO
       ========================================================== */

    socket.on("antimate:audio", async (data) => {
      const audioUrl =
        typeof data === "string"
          ? data
          : data?.url ||
            data?.audioUrl ||
            data?.audio ||
            "";

      if (!audioUrl) return;

      await playAudio(audioUrl);
    });

    /* ==========================================================
       COMPLETE
       ========================================================== */

    socket.on("antimate:complete", () => {
      setIsProcessing(false);

      /*
       * Don't immediately reopen microphone here.
       * We wait for audio.onended().
       */
      setTranscript("");
      setCurrentAnswer("");
      currentAnswerRef.current = "";
    });

    /* ==========================================================
       ERROR
       ========================================================== */

    socket.on("antimate:error", (data) => {
      console.error(
        "ANTIMATE SOCKET ERROR:",
        data
      );

      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            "Habaye ikibazo mu gutunganya request.";

      setError(message);

      setIsProcessing(false);
      setIsRecording(false);

      isRecordingRef.current = false;

      stopMediaTracks();
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [playAudio, updateAssistantMessage]);

  /* ============================================================
     STOP MEDIA
     ============================================================ */

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }

      audioContextRef.current = null;
    }

    analyserRef.current = null;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    setRecordSeconds(0);
  }, []);

  /* ============================================================
     SEND TEXT
     ============================================================ */

  const sendText = useCallback(async () => {
    const value = text.trim();

    if (!value || isProcessing || isPlaying) {
      return;
    }

    setError("");

    addMessage("user", value);

    setText("");

    setIsProcessing(true);

    currentAnswerRef.current = "";
    setCurrentAnswer("");

    try {
      const response = await fetch(
        `${API_URL}/api/antimate/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            message: value,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data = await response.json();

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        "";

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      addMessage("assistant", answer);
    } catch (err) {
      console.error("Text chat error:", err);

      setError(
        "Ntabwo nashoboye kohereza ubutumwa. Ongera ugerageze."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    text,
    isProcessing,
    isPlaying,
    addMessage,
  ]);

  /* ============================================================
     STOP RECORDING
     ============================================================ */

  const stopRecording = useCallback(
    (send = true) => {
      const recorder =
        mediaRecorderRef.current;

      if (!recorder) {
        setIsRecording(false);
        isRecordingRef.current = false;
        stopMediaTracks();
        return;
      }

      if (
        recorder.state === "recording"
      ) {
        recorder.stop();
      }

      setIsRecording(false);
      isRecordingRef.current = false;

      if (send) {
        setIsProcessing(true);
      }

      if (recordTimerRef.current) {
        clearInterval(
          recordTimerRef.current
        );

        recordTimerRef.current = null;
      }
    },
    [stopMediaTracks]
  );

  /* ============================================================
     START NORMAL RECORDING
     ============================================================ */

  const startRecording = useCallback(
    async ({
      live = false,
      shortTap = false,
    } = {}) => {
      if (
        isProcessing ||
        isPlaying ||
        isRecordingRef.current
      ) {
        return;
      }

      if (!socketRef.current?.connected) {
        setError(
          "ANTIMATE voice connection ntabwo iraboneka."
        );

        return;
      }

      setError("");

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

        mediaStreamRef.current = stream;

        let mimeType =
          "audio/webm;codecs=opus";

        if (
          !MediaRecorder.isTypeSupported(
            mimeType
          )
        ) {
          mimeType = "audio/webm";
        }

        const recorder =
          new MediaRecorder(stream, {
            mimeType,
          });

        mediaRecorderRef.current =
          recorder;

        isRecordingRef.current = true;

        setIsRecording(true);
        setIsLiveVoice(live);

        isLiveVoiceRef.current = live;

        setRecordSeconds(0);

        shortRecordingRef.current =
          shortTap;

        /* ======================================================
           START SOCKET SESSION
           ====================================================== */

        socketRef.current.emit(
          "antimate:voice:start",
          {
            mode: live
              ? "live"
              : "record",
          }
        );

        recorder.ondataavailable = (
          event
        ) => {
          if (
            event.data &&
            event.data.size > 0 &&
            socketRef.current?.connected
          ) {
            socketRef.current.emit(
              "antimate:voice:chunk",
              event.data
            );
          }
        };

        recorder.onstop = () => {
          stopMediaTracks();

          if (
            socketRef.current?.connected
          ) {
            socketRef.current.emit(
              "antimate:voice:end"
            );
          }

          mediaRecorderRef.current =
            null;

          setIsRecording(false);
          isRecordingRef.current =
            false;

          if (
            !live &&
            shortRecordingRef.current
          ) {
            setIsProcessing(true);
          }
        };

        /*
         * 250ms timeslice gives the backend
         * frequent chunks instead of waiting
         * until recording finishes.
         */
        recorder.start(250);

        /* ======================================================
           MAX 30 SECOND RECORDING
           ====================================================== */

        recordTimerRef.current =
          setInterval(() => {
            setRecordSeconds(
              (previous) => {
                const next =
                  previous + 1;

                if (
                  next >=
                  MAX_RECORD_SECONDS
                ) {
                  setTimeout(() => {
                    stopRecording(true);
                  }, 0);
                }

                return next;
              }
            );
          }, 1000);

        /*
         * SHORT TAP:
         *
         * record automatically for about
         * 1.8 seconds.
         */
        if (shortTap) {
          setTimeout(() => {
            if (
              isRecordingRef.current
            ) {
              stopRecording(true);
            }
          }, 1800);
        }

        /*
         * LIVE:
         * start silence detector.
         */
        if (live) {
          startSilenceDetection(
            stream,
            () => {
              if (
                isRecordingRef.current &&
                isLiveVoiceRef.current
              ) {
                stopRecording(true);
              }
            }
          );
        }
      } catch (err) {
        console.error(
          "Microphone error:",
          err
        );

        setError(
          "Ntabwo nashoboye gufungura microphone. Reba microphone permission."
        );

        setIsRecording(false);
        isRecordingRef.current =
          false;

        stopMediaTracks();
      }
    },
    [
      isProcessing,
      isPlaying,
      stopRecording,
      stopMediaTracks,
    ]
  );

  /* ============================================================
     SILENCE DETECTOR
     ============================================================ */

  const startSilenceDetection = useCallback(
    (stream, onSilence) => {
      try {
        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContext) {
          return;
        }

        const audioContext =
          new AudioContext();

        audioContextRef.current =
          audioContext;

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 2048;

        analyser.smoothingTimeConstant =
          0.8;

        analyserRef.current =
          analyser;

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        source.connect(analyser);

        const dataArray =
          new Uint8Array(
            analyser.fftSize
          );

        let silentSince = null;

        const check = () => {
          if (
            !isRecordingRef.current ||
            !isLiveVoiceRef.current
          ) {
            return;
          }

          analyser.getByteTimeDomainData(
            dataArray
          );

          let sum = 0;

          for (
            let i = 0;
            i < dataArray.length;
            i++
          ) {
            const normalized =
              (dataArray[i] - 128) /
              128;

            sum +=
              normalized *
              normalized;
          }

          const rms = Math.sqrt(
            sum / dataArray.length
          );

          /*
           * Voice threshold.
           * Lower = more sensitive.
           */
          const isSilent =
            rms < 0.018;

          if (isSilent) {
            if (silentSince === null) {
              silentSince = Date.now();
            }

            if (
              Date.now() -
                silentSince >=
              SILENCE_LIMIT
            ) {
              onSilence();

              return;
            }
          } else {
            silentSince = null;
          }

          silenceTimerRef.current =
            requestAnimationFrame(
              check
            );
        };

        check();
      } catch (err) {
        console.error(
          "Silence detection error:",
          err
        );
      }
    },
    []
  );

  /* ============================================================
     LIVE VOICE
     ============================================================ */

  const startLiveVoice =
    useCallback(async () => {
      if (
        isPlayingRef.current ||
        isProcessing ||
        isRecordingRef.current
      ) {
        return;
      }

      await startRecording({
        live: true,
        shortTap: false,
      });
    }, [isProcessing, startRecording]);

  /* ============================================================
     RECORD BUTTON CLICK
     ============================================================ */

  const handleRecordClick = useCallback(
    async () => {
      if (
        isProcessing ||
        isPlaying
      ) {
        return;
      }

      /*
       * If currently recording,
       * stop.
       */
      if (isRecordingRef.current) {
        stopRecording(true);
        return;
      }

      /*
       * Empty input = short record.
       */
      await startRecording({
        live: false,
        shortTap: true,
      });
    },
    [
      isProcessing,
      isPlaying,
      startRecording,
      stopRecording,
    ]
  );

  /* ============================================================
     LIVE BUTTON
     ============================================================ */

  const handleLiveClick =
    useCallback(async () => {
      if (
        isProcessing ||
        isPlaying
      ) {
        return;
      }

      if (isRecordingRef.current) {
        stopRecording(true);
        return;
      }

      await startLiveVoice();
    }, [
      isProcessing,
      isPlaying,
      startLiveVoice,
      stopRecording,
    ]);

  /* ============================================================
     KEYBOARD
     ============================================================ */

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

  /* ============================================================
     AUTO RESIZE TEXTAREA
     ============================================================ */

  useEffect(() => {
    const textarea =
      textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      150
    )}px`;
  }, [text]);

  /* ============================================================
     CLEANUP
     ============================================================ */

  useEffect(() => {
    return () => {
      stopMediaTracks();

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (holdTimerRef.current) {
        clearTimeout(
          holdTimerRef.current
        );
      }
    };
  }, [stopMediaTracks]);

  /* ============================================================
     UI STATE
     ============================================================ */

  const hasText = text.trim().length > 0;

  const showWelcome =
    messages.length === 0 &&
    !isProcessing &&
    !isRecording;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="antimate-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="antimate-header">

        <div className="antimate-brand">

          {/* KEEP YOUR ORIGINAL LOGO */}
          <div className="antimate-logo">
            <span className="logo-orbit orbit-1" />
            <span className="logo-orbit orbit-2" />
            <span className="logo-orbit orbit-3" />
            <span className="logo-core" />
          </div>

          <div className="brand-text">
            <div className="brand-name">
              ANTIMATE
            </div>

            <div className="brand-ai">
              AI Assistant
            </div>
          </div>

        </div>

        <div className="connection-status">
          <span
            className={
              socketConnected
                ? "status-dot online"
                : "status-dot offline"
            }
          />

          <span>
            {socketConnected
              ? "Online"
              : "Connecting..."}
          </span>
        </div>

      </header>

      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="antimate-main">

        {/* ====================================================
            WELCOME
            ==================================================== */}

        {showWelcome && (
          <section className="welcome">

            <div className="welcome-logo-wrap">

              <div className="antimate-logo large">
                <span className="logo-orbit orbit-1" />
                <span className="logo-orbit orbit-2" />
                <span className="logo-orbit orbit-3" />
                <span className="logo-core" />
              </div>

            </div>

            <h1>
              Muraho, ndi{" "}
              <span>ANTIMATE</span>
            </h1>

            <p>
              Umufasha wawe w'ubwenge.
              Mbwira icyo ushaka kumenya
              cyangwa ukoreshe ijwi.
            </p>

          </section>
        )}

        {/* ====================================================
            MESSAGES
            ==================================================== */}

        <section className="messages">

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-row ${
                message.role
              }`}
            >

              {message.role ===
                "assistant" && (
                <div className="message-avatar">
                  <div className="antimate-logo mini">
                    <span className="logo-orbit orbit-1" />
                    <span className="logo-orbit orbit-2" />
                    <span className="logo-orbit orbit-3" />
                    <span className="logo-core" />
                  </div>
                </div>
              )}

              <div className="message-bubble">
                {message.content}
              </div>

            </div>
          ))}

          {/* ==================================================
              TRANSCRIPT
              ================================================== */}

          {transcript && (
            <div className="voice-transcript">
              <span className="transcript-label">
                Wavuze
              </span>

              <span>
                {transcript}
              </span>
            </div>
          )}

          {/* ==================================================
              THINKING
              ================================================== */}

          {isProcessing && (
            <div className="message-row assistant">

              <div className="message-avatar">
                <div className="antimate-logo mini">
                  <span className="logo-orbit orbit-1" />
                  <span className="logo-orbit orbit-2" />
                  <span className="logo-orbit orbit-3" />
                  <span className="logo-core" />
                </div>
              </div>

              <div className="thinking-bubble">
                <span />
                <span />
                <span />
              </div>

            </div>
          )}

        </section>

      </main>

      {/* ======================================================
          COMPOSER
          ====================================================== */}

      <div className="composer-area">

        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (
          <div className="composer-error">
            {error}
          </div>
        )}

        {/* ====================================================
            RECORDING PANEL
            ==================================================== */}

        {isRecording && (
          <div className="recording-panel">

            <div className="recording-left">

              <span className="recording-pulse" />

              <span>
                {isLiveVoice
                  ? "ANTIMATE iragutega..."
                  : "Recording..."}
              </span>

            </div>

            <div className="recording-time">
              {String(
                MAX_RECORD_SECONDS -
                  recordSeconds
              ).padStart(2, "0")}
              s
            </div>

          </div>
        )}

        {/* ====================================================
            INPUT
            ==================================================== */}

        <div className="composer">

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Vuga..."
                : "Andika ubutumwa..."
            }
            disabled={
              isRecording ||
              isProcessing ||
              isPlaying
            }
            rows={1}
          />

          {/* ==================================================
              EMPTY STATE:
              TWO VOICE BUTTONS
              ================================================== */}

          {!hasText &&
            !isRecording &&
            !isProcessing &&
            !isPlaying && (
              <div className="voice-actions">

                <button
                  className="voice-button record-button"
                  onClick={
                    handleRecordClick
                  }
                  type="button"
                  aria-label="Record voice"
                >
                  <span className="mic-icon">
                    🎙
                  </span>

                  <span className="button-label">
                    Record
                  </span>
                </button>

                <button
                  className="voice-button live-button"
                  onClick={
                    handleLiveClick
                  }
                  type="button"
                  aria-label="Live voice"
                >
                  <span className="live-mic">
                    🎤
                  </span>

                  <span className="button-label">
                    Live
                  </span>
                </button>

              </div>
            )}

          {/* ==================================================
              RECORDING STOP BUTTON
              ================================================== */}

          {isRecording && (
            <button
              className="main-action stop-action"
              onClick={() =>
                stopRecording(true)
              }
              type="button"
              aria-label="Stop recording"
            >
              <span className="stop-square" />
            </button>
          )}

          {/* ==================================================
              PROCESSING
              ================================================== */}

          {isProcessing && (
            <button
              className="main-action processing-action"
              disabled
              type="button"
            >
              <span className="spinner" />
            </button>
          )}

          {/* ==================================================
              SPEAKING
              ================================================== */}

          {isPlaying && (
            <button
              className="main-action speaking-action"
              disabled
              type="button"
            >
              <span className="speaker-icon">
                🔊
              </span>
            </button>
          )}

          {/* ==================================================
              TEXT SEND
              ================================================== */}

          {hasText &&
            !isRecording &&
            !isProcessing &&
            !isPlaying && (
              <button
                className="main-action send-action"
                onClick={sendText}
                disabled={
                  !text.trim()
                }
                type="button"
                aria-label="Send message"
              >
                <span className="send-arrow">
                  ↑
                </span>
              </button>
            )}

        </div>

        <div className="composer-hint">
          {hasText
            ? "Enter kugira wohereze • Shift + Enter gukora umurongo mushya"
            : "Record cyangwa Live Voice"}
        </div>

      </div>

    </div>
  );
}