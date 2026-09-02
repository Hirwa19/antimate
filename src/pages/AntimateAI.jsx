import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import "./AntimateAI.css";

/*
============================================================
ANTIMATE AI
Simple professional AI chat UI
- Light / Dark mode
- Text chat
- Short voice recording
- Live voice
- Socket.IO streaming
============================================================
*/

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL
).replace(/\/$/, "");

const LOGO = "/antimate-logo.png";

const SHORT_RECORDING_MS = 1800;

export default function AntimateAI() {
  /* ========================================================
     STATE
  ======================================================== */

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [isLiveVoice, setIsLiveVoice] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [socketConnected, setSocketConnected] = useState(false);

  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState("");

  const [error, setError] = useState("");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("antimate-theme") || "light";
  });

  /* ========================================================
     REFS
  ======================================================== */

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const chunksRef = useRef([]);

  const recordingTimerRef = useRef(null);

  const audioRef = useRef(null);

  const textareaRef = useRef(null);

  const currentAnswerRef = useRef("");

  const isPlayingRef = useRef(false);

  const isRecordingRef = useRef(false);

  const isLiveVoiceRef = useRef(false);

  /* ========================================================
     THEME
  ======================================================== */

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-antimate-theme",
      theme
    );

    localStorage.setItem("antimate-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === "light" ? "dark" : "light"
    );
  };

  /* ========================================================
     AUTO RESIZE TEXTAREA
  ======================================================== */

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    const maxHeight = 150;

    textarea.style.height =
      Math.min(textarea.scrollHeight, maxHeight) + "px";
  }, [text]);

  /* ========================================================
     SOCKET.IO
  ======================================================== */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ ANTIMATE Socket connected");

      setSocketConnected(true);

      setStatus("");
    });

    socket.on("disconnect", () => {
      console.log("❌ ANTIMATE Socket disconnected");

      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error(
        "Socket connection error:",
        err
      );

      setSocketConnected(false);
    });

    /* --------------------------------------------------------
       STATUS
    -------------------------------------------------------- */

    socket.on("antimate:status", (data) => {
      const value =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.status ||
            "";

      setStatus(value);
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
      setIsProcessing(true);

      setStatus("ANTIMATE is thinking...");
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

      setMessages((prev) => {
        const last = prev[prev.length - 1];

        if (
          last &&
          last.role === "assistant" &&
          last.streaming
        ) {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              content: answer,
              streaming: false,
            },
          ];
        }

        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: answer,
            streaming: false,
          },
        ];
      });

      setIsProcessing(false);
      setStatus("");
    });

    /* --------------------------------------------------------
       STREAMING ANSWER CHUNKS
    -------------------------------------------------------- */

    socket.on("antimate:answer:chunk", (data) => {
      const chunk =
        typeof data === "string"
          ? data
          : data?.chunk ||
            data?.text ||
            data?.answer ||
            "";

      if (!chunk) return;

      currentAnswerRef.current += chunk;

      const answer = currentAnswerRef.current;

      setMessages((prev) => {
        const last = prev[prev.length - 1];

        if (
          last &&
          last.role === "assistant" &&
          last.streaming
        ) {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              content: answer,
            },
          ];
        }

        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: answer,
            streaming: true,
          },
        ];
      });
    });

    /* --------------------------------------------------------
       AUDIO
    -------------------------------------------------------- */

    socket.on("antimate:audio", (data) => {
      let audioUrl = "";

      if (typeof data === "string") {
        audioUrl = data;
      } else {
        audioUrl =
          data?.url ||
          data?.audio ||
          data?.audioUrl ||
          "";
      }

      if (!audioUrl) return;

      playAudio(audioUrl);
    });

    /* --------------------------------------------------------
       COMPLETE
    -------------------------------------------------------- */

    socket.on("antimate:complete", () => {
      setIsProcessing(false);

      setStatus("");

      setTranscript("");

      currentAnswerRef.current = "";
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
            "Something went wrong.";

      console.error(
        "ANTIMATE socket error:",
        message
      );

      setError(message);

      setIsProcessing(false);

      setIsRecording(false);

      setStatus("");

      stopMediaTracks();
    });

    return () => {
      socket.removeAllListeners();

      socket.disconnect();

      socketRef.current = null;

      clearTimeout(recordingTimerRef.current);

      stopMediaTracks();
    };
  }, []);

  /* ========================================================
     ABSOLUTE AUDIO URL
  ======================================================== */

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

  /* ========================================================
     AUDIO PLAYBACK
  ======================================================== */

  const playAudio = useCallback(
    (url) => {
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

        setStatus("ANTIMATE is speaking...");

        audio.onended = () => {
          isPlayingRef.current = false;

          setIsPlaying(false);

          setStatus("");

          /*
           * Live voice can reopen after answer playback.
           */
          if (isLiveVoiceRef.current) {
            setTimeout(() => {
              startLiveRecording();
            }, 250);
          }
        };

        audio.onerror = () => {
          isPlayingRef.current = false;

          setIsPlaying(false);

          setStatus("");

          console.error(
            "ANTIMATE audio playback failed"
          );
        };

        audio.play().catch((err) => {
          console.error(
            "Audio autoplay failed:",
            err
          );

          isPlayingRef.current = false;

          setIsPlaying(false);
        });
      } catch (err) {
        console.error(
          "Audio creation error:",
          err
        );

        setIsPlaying(false);
      }
    },
    [makeAbsoluteUrl]
  );

  /* ========================================================
     STOP MEDIA
  ======================================================== */

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      mediaStreamRef.current = null;
    }
  }, []);

  /* ========================================================
     SEND TEXT
  ======================================================== */

  const sendText = useCallback(async () => {
    const question = text.trim();

    if (!question) return;

    if (isProcessing || isPlaying) return;

    setError("");

    setTranscript("");

    setStatus("");

    setText("");

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
      },
    ]);

    setIsProcessing(true);

    try {
      const response = await fetch(
        `${API_URL}/api/antimate/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            message: question,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to get ANTIMATE response."
        );
      }

      const answer =
        data?.answer ||
        data?.response ||
        data?.text ||
        "Nta gisubizo nabonye.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (err) {
      console.error(
        "ANTIMATE text error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to ANTIMATE."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    text,
    isProcessing,
    isPlaying,
  ]);

  /* ========================================================
     SEND ENTER
  ======================================================== */

  const handleTextareaKeyDown = (event) => {
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

  /* ========================================================
     GET MEDIA RECORDER
  ======================================================== */

  const createRecorder = async (live = false) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Microphone is not supported by this browser."
      );
    }

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

    mediaStreamRef.current = stream;

    let mimeType = "";

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];

    for (const type of candidates) {
      if (
        MediaRecorder.isTypeSupported(type)
      ) {
        mimeType = type;
        break;
      }
    }

    const recorder = new MediaRecorder(
      stream,
      mimeType
        ? { mimeType }
        : undefined
    );

    mediaRecorderRef.current = recorder;

    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (
        event.data &&
        event.data.size > 0
      ) {
        chunksRef.current.push(
          event.data
        );

        /*
         * LIVE MODE
         * Send chunks immediately.
         */
        if (live) {
          const socket =
            socketRef.current;

          if (
            socket &&
            socket.connected
          ) {
            socket.emit(
              "antimate:voice:chunk",
              event.data
            );
          }
        }
      }
    };

    recorder.onerror = (event) => {
      console.error(
        "MediaRecorder error:",
        event.error
      );

      setError(
        "Microphone recording failed."
      );

      setIsRecording(false);

      stopMediaTracks();
    };

    return recorder;
  };

  /* ========================================================
     START SHORT RECORDING
  ======================================================== */

  const startRecording = async () => {
    if (
      isProcessing ||
      isPlaying ||
      isRecordingRef.current
    ) {
      return;
    }

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      setError(
        "Voice service is not connected yet."
      );

      return;
    }

    setError("");

    setTranscript("");

    setStatus("Listening...");

    try {
      const recorder =
        await createRecorder(false);

      isRecordingRef.current = true;

      setIsRecording(true);

      isLiveVoiceRef.current = false;

      setIsLiveVoice(false);

      socket.emit(
        "antimate:voice:start",
        {
          mode: "short",
        }
      );

      recorder.start();

      clearTimeout(
        recordingTimerRef.current
      );

      recordingTimerRef.current =
        setTimeout(() => {
          stopRecording();
        }, SHORT_RECORDING_MS);
    } catch (err) {
      console.error(
        "Microphone error:",
        err
      );

      setError(
        err.message ||
          "Unable to access microphone."
      );

      setStatus("");

      setIsRecording(false);

      isRecordingRef.current = false;

      stopMediaTracks();
    }
  };

  /* ========================================================
     START LIVE RECORDING
  ======================================================== */

  const startLiveRecording =
    useCallback(async () => {
      if (
        isProcessing ||
        isPlaying ||
        isRecordingRef.current
      ) {
        return;
      }

      const socket = socketRef.current;

      if (
        !socket ||
        !socket.connected
      ) {
        setError(
          "Voice service is not connected yet."
        );

        return;
      }

      setError("");

      setTranscript("");

      setStatus(
        "Live voice listening..."
      );

      try {
        const recorder =
          await createRecorder(true);

        isRecordingRef.current = true;

        setIsRecording(true);

        isLiveVoiceRef.current = true;

        setIsLiveVoice(true);

        socket.emit(
          "antimate:voice:start",
          {
            mode: "live",
          }
        );

        /*
         * timeslice sends data every 250ms.
         */
        recorder.start(250);
      } catch (err) {
        console.error(
          "Live microphone error:",
          err
        );

        setError(
          err.message ||
            "Unable to access microphone."
        );

        setStatus("");

        setIsRecording(false);

        isRecordingRef.current = false;

        isLiveVoiceRef.current = false;

        setIsLiveVoice(false);

        stopMediaTracks();
      }
    }, [
      isProcessing,
      isPlaying,
      stopMediaTracks,
    ]);

  /* ========================================================
     STOP RECORDING
  ======================================================== */

  const stopRecording = useCallback(
    () => {
      clearTimeout(
        recordingTimerRef.current
      );

      const recorder =
        mediaRecorderRef.current;

      const socket =
        socketRef.current;

      if (!recorder) {
        stopMediaTracks();

        isRecordingRef.current = false;

        setIsRecording(false);

        return;
      }

      const wasLive =
        isLiveVoiceRef.current;

      isRecordingRef.current = false;

      setIsRecording(false);

      setStatus(
        wasLive
          ? "Processing voice..."
          : "Processing..."
      );

      setIsProcessing(true);

      recorder.onstop = () => {
        stopMediaTracks();

        /*
         * For non-live mode we send
         * the complete Blob.
         */
        if (
          !wasLive &&
          socket &&
          socket.connected
        ) {
          const blob = new Blob(
            chunksRef.current,
            {
              type:
                recorder.mimeType ||
                "audio/webm",
            }
          );

          if (blob.size > 0) {
            socket.emit(
              "antimate:voice:chunk",
              blob
            );
          }
        }

        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "antimate:voice:end",
            {
              mode: wasLive
                ? "live"
                : "short",
            }
          );
        }

        mediaRecorderRef.current =
          null;

        chunksRef.current = [];
      };

      if (
        recorder.state !== "inactive"
      ) {
        recorder.stop();
      } else {
        stopMediaTracks();

        mediaRecorderRef.current =
          null;
      }
    },
    [stopMediaTracks]
  );

  /* ========================================================
     CANCEL VOICE
  ======================================================== */

  const cancelVoice = useCallback(() => {
    clearTimeout(
      recordingTimerRef.current
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

    if (recorder) {
      recorder.onstop = () => {
        stopMediaTracks();

        mediaRecorderRef.current =
          null;

        chunksRef.current = [];
      };

      if (
        recorder.state !== "inactive"
      ) {
        recorder.stop();
      }
    }

    stopMediaTracks();

    isRecordingRef.current = false;

    isLiveVoiceRef.current = false;

    setIsRecording(false);

    setIsLiveVoice(false);

    setIsProcessing(false);

    setTranscript("");

    setStatus("");
  }, [stopMediaTracks]);

  /* ========================================================
     SINGLE ACTION BUTTON
  ======================================================== */

  const handleActionButton = () => {
    /*
     * TEXT MODE
     */
    if (text.trim()) {
      sendText();

      return;
    }

    /*
     * PROCESSING
     */
    if (isProcessing) {
      return;
    }

    /*
     * SPEAKING
     */
    if (isPlaying) {
      return;
    }

    /*
     * RECORDING
     */
    if (isRecording) {
      stopRecording();

      return;
    }

    /*
     * EMPTY
     *
     * Short voice recording.
     */
    startRecording();
  };

  /* ========================================================
     LIVE BUTTON
  ======================================================== */

  const handleLiveVoice = () => {
    if (
      isProcessing ||
      isPlaying ||
      isRecording
    ) {
      return;
    }

    startLiveRecording();
  };

  /* ========================================================
     CLEAR ERROR WHEN USER TYPES
  ======================================================== */

  useEffect(() => {
    if (text.trim()) {
      setError("");
    }
  }, [text]);

  /* ========================================================
     UI HELPERS
  ======================================================== */

  const isEmpty =
    messages.length === 0;

  const showVoiceButtons =
    !text.trim() &&
    !isRecording &&
    !isProcessing &&
    !isPlaying;

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div
      className={`antimate-page ${
        theme === "dark"
          ? "theme-dark"
          : "theme-light"
      }`}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="antimate-header">
        <div className="antimate-brand">
          <img
            src={LOGO}
            alt="ANTIMATE"
            className="antimate-logo"
            onError={(event) => {
              event.currentTarget.style.display =
                "none";
            }}
          />

          <div className="antimate-brand-text">
            <strong>
              ANTIMATE
            </strong>

            <span>
              AI Assistant
            </span>
          </div>
        </div>

        <div className="antimate-header-actions">
          <div className="connection-status">
            <span
              className={`connection-dot ${
                socketConnected
                  ? "online"
                  : "offline"
              }`}
            />

            <span>
              {socketConnected
                ? "Online"
                : "Connecting"}
            </span>
          </div>

          <button
            type="button"
            className="theme-button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={
              theme === "light"
                ? "Dark mode"
                : "Light mode"
            }
          >
            {theme === "light" ? (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="4"
                />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="antimate-main">
        <div className="antimate-chat">
          {/* ================================================
              EMPTY STATE
          ================================================ */}

          {isEmpty && (
            <section className="welcome-screen">
              <div className="welcome-logo-wrap">
                <img
                  src={LOGO}
                  alt="ANTIMATE"
                  className="welcome-logo"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>

              <h1>
                Muraho, ndi ANTIMATE
              </h1>

              <p>
                Ask me anything about your
                system, chicks, brooding,
                environment, or anything
                else you need help with.
              </p>
            </section>
          )}

          {/* ================================================
              MESSAGES
          ================================================ */}

          <section className="messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${
                  message.role === "user"
                    ? "user-row"
                    : "assistant-row"
                }`}
              >
                {message.role ===
                  "assistant" && (
                  <div className="message-avatar">
                    <img
                      src={LOGO}
                      alt=""
                    />
                  </div>
                )}

                <div
                  className={`message-bubble ${
                    message.role ===
                    "user"
                      ? "user-bubble"
                      : "assistant-bubble"
                  }`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>

                  {message.streaming && (
                    <span className="streaming-cursor">
                      ●
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* ============================================
                THINKING
            ============================================ */}

            {isProcessing &&
              !isRecording &&
              !currentAnswerRef.current && (
                <div className="message-row assistant-row">
                  <div className="message-avatar">
                    <img
                      src={LOGO}
                      alt=""
                    />
                  </div>

                  <div className="message-bubble assistant-bubble thinking-bubble">
                    <span>
                      ANTIMATE
                    </span>

                    <div className="thinking-dots">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              )}
          </section>
        </div>
      </main>

      {/* ==================================================
          COMPOSER AREA
      ================================================== */}

      <footer className="composer-wrapper">
        <div className="composer-area">
          {/* -----------------------------------------------
              TRANSCRIPT
          ----------------------------------------------- */}

          {transcript && (
            <div className="transcript-card">
              <span className="transcript-label">
                You said
              </span>

              <span className="transcript-text">
                {transcript}
              </span>
            </div>
          )}

          {/* -----------------------------------------------
              STATUS
          ----------------------------------------------- */}

          {(status || isLiveVoice) && (
            <div className="voice-status">
              <span className="voice-status-dot" />

              <span>
                {status ||
                  (isLiveVoice
                    ? "Live voice"
                    : "")}
              </span>
            </div>
          )}

          {/* -----------------------------------------------
              ERROR
          ----------------------------------------------- */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* -----------------------------------------------
              COMPOSER
          ----------------------------------------------- */}

          <div
            className={`composer ${
              isRecording
                ? "recording"
                : ""
            } ${
              isProcessing
                ? "processing"
                : ""
            }`}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              onKeyDown={
                handleTextareaKeyDown
              }
              placeholder={
                isRecording
                  ? isLiveVoice
                    ? "Listening live..."
                    : "Listening..."
                  : isProcessing
                  ? "ANTIMATE is thinking..."
                  : "Ask ANTIMATE anything..."
              }
              disabled={
                isRecording ||
                isProcessing ||
                isPlaying
              }
              rows={1}
            />

            {/* ==========================================
                VOICE BUTTONS — ONLY WHEN EMPTY
            ========================================== */}

            {showVoiceButtons && (
              <div className="voice-actions">
                {/* RECORD */}
                <button
                  type="button"
                  className="voice-button record-button"
                  onClick={
                    handleActionButton
                  }
                  disabled={
                    !socketConnected
                  }
                  title="Record voice"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="8"
                      y="3"
                      width="8"
                      height="13"
                      rx="4"
                    />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
                  </svg>

                  <span>
                    Record
                  </span>
                </button>

                {/* LIVE VOICE */}
                <button
                  type="button"
                  className="voice-button live-button"
                  onClick={
                    handleLiveVoice
                  }
                  disabled={
                    !socketConnected
                  }
                  title="Live voice"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M3 12h3l2-6 4 12 2-6h7" />
                  </svg>

                  <span>
                    Live
                  </span>
                </button>
              </div>
            )}

            {/* ==========================================
                SINGLE ACTION BUTTON
                Appears when typing / recording /
                processing / speaking
            ========================================== */}

            {!showVoiceButtons && (
              <button
                type="button"
                className={`main-action-button ${
                  text.trim()
                    ? "send-action"
                    : ""
                } ${
                  isRecording
                    ? "stop-action"
                    : ""
                } ${
                  isProcessing
                    ? "loading-action"
                    : ""
                } ${
                  isPlaying
                    ? "speaking-action"
                    : ""
                }`}
                onClick={
                  handleActionButton
                }
                disabled={
                  isProcessing ||
                  isPlaying ||
                  (!text.trim() &&
                    !socketConnected)
                }
                aria-label={
                  text.trim()
                    ? "Send message"
                    : isRecording
                    ? "Stop recording"
                    : isProcessing
                    ? "Processing"
                    : "Voice"
                }
              >
                {/* SEND */}
                {text.trim() &&
                  !isProcessing &&
                  !isPlaying && (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M22 2 11 13" />
                      <path d="m22 2-7 20-4-9-9-4Z" />
                    </svg>
                  )}

                {/* STOP */}
                {isRecording && (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="6"
                      y="6"
                      width="12"
                      height="12"
                      rx="2"
                    />
                  </svg>
                )}

                {/* LOADING */}
                {isProcessing && (
                  <span className="action-loader">
                    <i />
                    <i />
                    <i />
                  </span>
                )}

                {/* SPEAKING */}
                {isPlaying && (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7M18 5a9 9 0 0 1 0 14" />
                  </svg>
                )}
              </button>
            )}
          </div>

          <div className="composer-hint">
            <span>
              ANTIMATE AI
            </span>

            <span className="hint-separator">
              •
            </span>

            <span>
              {text.trim()
                ? "Enter to send"
                : "Voice enabled"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}