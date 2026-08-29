import React, { useEffect, useRef, useState } from "react";
import "./AntimateAI.css";

/*
============================================================
 ANTIMATE AI
 Voice + Text Chat
 Native CSS — No Tailwind
============================================================
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const MAX_RECORDING_SECONDS = 30;

const THINKING_MESSAGES = [
  "Aah, reka ndebe amakuru mfite...",
  "Ndimo gutekereza ku gisubizo...",
  "Ndimo kureba amakuru ya system...",
  "Ndimo gutegura igisubizo...",
];

export default function AntimateAI() {
  // ==========================================================
  // CHAT
  // ==========================================================

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [isThinking, setIsThinking] = useState(false);

  const [thinkingMessage, setThinkingMessage] = useState(
    THINKING_MESSAGES[0]
  );

  // ==========================================================
  // VOICE
  // ==========================================================

  const [isRecording, setIsRecording] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [voiceAudio, setVoiceAudio] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);

  const audioChunksRef = useRef([]);

  const recordingTimerRef = useRef(null);

  const audioRef = useRef(null);

  // ==========================================================
  // UI
  // ==========================================================

  const messagesEndRef = useRef(null);

  const textareaRef = useRef(null);

  const thinkingIntervalRef = useRef(null);

  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }

      if (voiceAudio?.url) {
        URL.revokeObjectURL(voiceAudio.url);
      }
    };
  }, [voiceAudio]);

  // ==========================================================
  // THINKING ANIMATION
  // ==========================================================

  const startThinking = () => {
    setIsThinking(true);

    let index = 0;

    setThinkingMessage(THINKING_MESSAGES[0]);

    thinkingIntervalRef.current = setInterval(() => {
      index = (index + 1) % THINKING_MESSAGES.length;

      setThinkingMessage(THINKING_MESSAGES[index]);
    }, 2200);
  };

  const stopThinking = () => {
    setIsThinking(false);

    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
  };

  // ==========================================================
  // ADD MESSAGE
  // ==========================================================

  const addMessage = (role, content, extra = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        id:
          Date.now() +
          Math.random().toString(36).substring(2, 8),

        role,

        content,

        ...extra,
      },
    ]);
  };

  // ==========================================================
  // TEXT INPUT
  // ==========================================================

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  // ==========================================================
  // TEXT SUBMIT
  // ==========================================================

  const handleSendText = async () => {
    const message = text.trim();

    if (!message || isThinking) {
      return;
    }

    addMessage("user", message);

    setText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    startThinking();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/antimate/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text: message,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `ANTIMATE API error (${response.status})`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "ANTIMATE ntiyagarutse n'igisubizo."
        );
      }

      const answer =
        data.answer_kinyarwanda ||
        data.answer ||
        data.response ||
        "";

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagarutse n'igisubizo."
        );
      }

      addMessage("assistant", answer);
    } catch (error) {
      console.error("ANTIMATE TEXT ERROR:", error);

      addMessage(
        "assistant",
        `❌ Habaye ikibazo: ${
          error?.message || "Unknown error"
        }`
      );
    } finally {
      stopThinking();
    }
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSendText();
    }
  };

  // ==========================================================
  // TEXTAREA AUTO RESIZE
  // ==========================================================

  const handleTextareaInput = (event) => {
    setText(event.target.value);

    const element = event.target;

    element.style.height = "auto";

    element.style.height = `${Math.min(
      element.scrollHeight,
      140
    )}px`;
  };

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording = async () => {
    if (isRecording || isThinking) {
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      audioChunksRef.current = [];

      let mimeType = "";

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        mimeType = "audio/webm;codecs=opus";
      } else if (
        MediaRecorder.isTypeSupported("audio/webm")
      ) {
        mimeType = "audio/webm";
      } else if (
        MediaRecorder.isTypeSupported("audio/ogg")
      ) {
        mimeType = "audio/ogg";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });

        const blob = new Blob(
          audioChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        if (!blob.size) {
          setIsRecording(false);
          return;
        }

        await sendVoice(blob);
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        setIsRecording(false);
      };

      recorder.start(250);

      setIsRecording(true);

      setRecordingSeconds(0);

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingSeconds((previous) => {
            const next = previous + 1;

            if (next >= MAX_RECORDING_SECONDS) {
              setTimeout(() => {
                stopRecording();
              }, 0);
            }

            return next;
          });
        }, 1000);
    } catch (error) {
      console.error(
        "MICROPHONE ERROR:",
        error
      );

      alert(
        "Microphone ntiyemerewe. Reba ko browser yemerewe gukoresha microphone."
      );
    }
  };

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);

      recordingTimerRef.current = null;
    }

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }

    setIsRecording(false);
  };

  // ==========================================================
  // VOICE API
  // ==========================================================

  const sendVoice = async (blob) => {
    startThinking();

    try {
      const formData = new FormData();

      /*
       * Browser normally gives us WebM/OGG.
       *
       * Backend /antimateRoutes.js is responsible for:
       *
       * WebM/OGG
       *      ↓
       * FFmpeg
       *      ↓
       * WAV 16kHz mono
       *      ↓
       * ANTIMATE AI
       */

      const extension =
        blob.type.includes("ogg")
          ? "ogg"
          : "webm";

      formData.append(
        "audio",
        blob,
        `antimate_voice.${extension}`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/antimate/voice`,
        {
          method: "POST",

          body: formData,
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Voice API error (${response.status})`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "ANTIMATE ntiyashoboye gutunganya voice."
        );
      }

      const userText =
        data.transcription ||
        data.input_kinyarwanda ||
        data.text ||
        "";

      const answer =
        data.answer_kinyarwanda ||
        data.answer ||
        data.response ||
        "";

      if (userText) {
        addMessage("user", userText);
      }

      if (answer) {
        addMessage(
          "assistant",
          answer,
          {
            voice: true,
          }
        );
      }

      // ======================================================
      // AUDIO RESPONSE
      // ======================================================

      if (data.audio_url) {
        let audioUrl = data.audio_url;

        if (
          audioUrl.startsWith("/")
        ) {
          audioUrl =
            `${API_BASE_URL}${audioUrl}`;
        }

        setVoiceAudio({
          url: audioUrl,
          blob: null,
        });

        /*
         * Browser may block autoplay after async fetch.
         * We still attempt it.
         */
        setTimeout(() => {
          playVoice(audioUrl);
        }, 150);
      } else if (data.audio) {
        /*
         * Supports base64 audio if backend
         * ever returns it.
         */

        const audioBlob =
          base64ToBlob(
            data.audio,
            data.audio_mime_type ||
              "audio/wav"
          );

        const audioUrl =
          URL.createObjectURL(audioBlob);

        setVoiceAudio({
          url: audioUrl,
          blob: audioBlob,
        });

        setTimeout(() => {
          playVoice(audioUrl);
        }, 150);
      }
    } catch (error) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        error
      );

      addMessage(
        "assistant",
        `❌ Habaye ikibazo kuri voice: ${
          error?.message ||
          "Unknown error"
        }`
      );
    } finally {
      stopThinking();
    }
  };

  // ==========================================================
  // BASE64 → BLOB
  // ==========================================================

  const base64ToBlob = (
    base64,
    mimeType
  ) => {
    const byteCharacters =
      atob(base64);

    const byteArrays = [];

    const chunkSize = 1024;

    for (
      let offset = 0;
      offset < byteCharacters.length;
      offset += chunkSize
    ) {
      const slice =
        byteCharacters.slice(
          offset,
          offset + chunkSize
        );

      const byteNumbers =
        new Array(slice.length);

      for (
        let i = 0;
        i < slice.length;
        i++
      ) {
        byteNumbers[i] =
          slice.charCodeAt(i);
      }

      byteArrays.push(
        new Uint8Array(byteNumbers)
      );
    }

    return new Blob(
      byteArrays,
      {
        type: mimeType,
      }
    );
  };

  // ==========================================================
  // PLAY VOICE
  // ==========================================================

  const playVoice = (url) => {
    if (!url) {
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();

        audioRef.current.currentTime = 0;
      }

      const audio =
        new Audio(url);

      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
      };

      const playPromise =
        audio.play();

      if (
        playPromise &&
        typeof playPromise.catch ===
          "function"
      ) {
        playPromise.catch((error) => {
          console.warn(
            "Autoplay blocked:",
            error
          );

          setIsPlaying(false);
        });
      }
    } catch (error) {
      console.error(
        "PLAY AUDIO ERROR:",
        error
      );

      setIsPlaying(false);
    }
  };

  // ==========================================================
  // REPLAY
  // ==========================================================

  const handleReplay = () => {
    if (!voiceAudio?.url) {
      return;
    }

    playVoice(
      voiceAudio.url
    );
  };

  // ==========================================================
  // FORMAT RECORDING TIMER
  // ==========================================================

  const formatRecordingTime = (
    seconds
  ) => {
    const remaining =
      MAX_RECORDING_SECONDS -
      seconds;

    return `00:${String(
      Math.max(0, remaining)
    ).padStart(2, "0")}`;
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="antimate-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="antimate-header">

        <div className="antimate-brand">

          <div className="antimate-brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div>
            <h1>ANTIMATE AI</h1>

            <p>
              Intelligent assistant
            </p>
          </div>

        </div>

        <div className="antimate-status">

          <span className="status-dot"></span>

          <span>
            Online
          </span>

        </div>

      </header>

      {/* ====================================================
          CHAT AREA
      ==================================================== */}

      <main className="antimate-chat">

        {messages.length === 0 && (
          <section className="antimate-welcome">

            <div className="welcome-wave">

              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>

            </div>

            <h2>
              Murakaza neza kuri ANTIMATE
            </h2>

            <p>
              Vuga cyangwa wandike ubutumwa
              bwawe mu Kinyarwanda.
            </p>

          </section>
        )}

        <div className="antimate-messages">

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-row ${
                message.role === "user"
                  ? "message-user"
                  : "message-assistant"
              }`}
            >

              <div
                className={`message-bubble ${
                  message.role === "user"
                    ? "bubble-user"
                    : "bubble-assistant"
                }`}
              >

                <div className="message-content">
                  {message.content}
                </div>

                {message.role ===
                  "assistant" &&
                  message.voice && (
                    <div className="message-voice-label">
                      <span className="mini-wave">
                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>
                      </span>

                      Voice response
                    </div>
                  )}

              </div>

            </div>
          ))}

          {/* ==================================================
              THINKING
          ================================================== */}

          {isThinking && (
            <div className="message-row message-assistant">

              <div className="thinking-bubble">

                <div className="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <span>
                  {thinkingMessage}
                </span>

              </div>

            </div>
          )}

          <div
            ref={messagesEndRef}
            className="messages-end"
          />

        </div>

      </main>

      {/* ====================================================
          VOICE RESPONSE PLAYER
      ==================================================== */}

      {voiceAudio?.url && (
        <div className="voice-response-bar">

          <div className="voice-response-left">

            <button
              type="button"
              className={`replay-button ${
                isPlaying
                  ? "playing"
                  : ""
              }`}
              onClick={
                handleReplay
              }
              aria-label="Replay voice"
            >

              {isPlaying ? (
                <span className="pause-icon">
                  ❚❚
                </span>
              ) : (
                <span className="play-icon">
                  ▶
                </span>
              )}

            </button>

            <div>
              <strong>
                ANTIMATE Voice
              </strong>

              <span>
                Kanda kugira ngo wongere uyumve
              </span>
            </div>

          </div>

          <div className="voice-bars">

            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>

          </div>

        </div>
      )}

      {/* ====================================================
          RECORDING OVERLAY
      ==================================================== */}

      {isRecording && (
        <div className="recording-panel">

          <div className="recording-indicator">
            <span></span>
          </div>

          <div className="recording-text">

            <strong>
              Ndakumva...
            </strong>

            <span>
              Vuga mu Kinyarwanda
            </span>

          </div>

          <div className="recording-countdown">
            {formatRecordingTime(
              recordingSeconds
            )}
          </div>

          <button
            type="button"
            className="stop-recording-button"
            onClick={
              stopRecording
            }
          >
            Guhagarika
          </button>

        </div>
      )}

      {/* ====================================================
          INPUT AREA — FIXED BOTTOM
      ==================================================== */}

      <div className="antimate-input-wrapper">

        <div className="antimate-input">

          <textarea
            ref={textareaRef}
            value={text}
            onChange={
              handleTextareaInput
            }
            onKeyDown={
              handleKeyDown
            }
            rows={1}
            placeholder={
              isRecording
                ? "Recording..."
                : "Andika ubutumwa bwawe..."
            }
            disabled={
              isRecording ||
              isThinking
            }
          />

          {/* ==================================================
              VOICE / SEND BUTTON
          ================================================== */}

          {text.trim() ? (
            <button
              type="button"
              className="action-button send-button"
              onClick={
                handleSendText
              }
              disabled={
                isThinking ||
                isRecording
              }
              aria-label="Send"
            >

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M3 20L21 12L3 4L3 10L15 12L3 14V20Z"
                  fill="currentColor"
                />
              </svg>

            </button>
          ) : (
            <button
              type="button"
              className={`action-button voice-button ${
                isRecording
                  ? "recording"
                  : ""
              }`}
              onClick={
                isRecording
                  ? stopRecording
                  : startRecording
              }
              disabled={
                isThinking
              }
              aria-label={
                isRecording
                  ? "Stop recording"
                  : "Voice"
              }
            >

              <svg
                viewBox="0 0 64 64"
                aria-hidden="true"
              >

                <path
                  d="M4 32H12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M16 24V40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M26 17V47"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M38 10V54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M50 18V46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <path
                  d="M58 26V38"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

              </svg>

            </button>
          )}

        </div>

        <div className="input-hint">
          {isRecording
            ? `Recording • ${formatRecordingTime(
                recordingSeconds
              )}`
            : "Shift + Enter kugira ngo umanure umurongo"}
        </div>

      </div>

    </div>
  );
}
```

```css
/* ============================================================
   ANTIMATE AI
   Native CSS
   No Tailwind
============================================================ */

.antimate-page {
  --antimate-bg: var(--background, #f7f8fa);
  --antimate-surface: var(--card, #ffffff);
  --antimate-text: var(--foreground, #111827);
  --antimate-muted: var(--muted-foreground, #6b7280);
  --antimate-border: var(--border, #e5e7eb);
  --antimate-primary: var(--primary, #111827);
  --antimate-primary-text: var(--primary-foreground, #ffffff);

  min-height: 100vh;

  background: var(--antimate-bg);

  color: var(--antimate-text);

  display: flex;

  flex-direction: column;

  overflow: hidden;

  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

/* ============================================================
   HEADER
============================================================ */

.antimate-header {
  height: 68px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 0 24px;

  border-bottom: 1px solid
    var(--antimate-border);

  background: var(--antimate-surface);
}

.antimate-brand {
  display: flex;

  align-items: center;

  gap: 12px;
}

.antimate-brand-mark {
  width: 38px;

  height: 38px;

  border-radius: 11px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 3px;

  background: var(--antimate-primary);

  color: var(--antimate-primary-text);
}

.antimate-brand-mark span {
  width: 3px;

  height: 13px;

  border-radius: 4px;

  background: currentColor;
}

.antimate-brand-mark span:nth-child(1) {
  height: 8px;
}

.antimate-brand-mark span:nth-child(2) {
  height: 18px;
}

.antimate-brand-mark span:nth-child(3) {
  height: 11px;
}

.antimate-brand h1 {
  margin: 0;

  font-size: 15px;

  font-weight: 700;

  letter-spacing: 0.02em;
}

.antimate-brand p {
  margin: 2px 0 0;

  font-size: 11px;

  color: var(--antimate-muted);
}

.antimate-status {
  display: flex;

  align-items: center;

  gap: 7px;

  font-size: 12px;

  color: var(--antimate-muted);
}

.status-dot {
  width: 7px;

  height: 7px;

  border-radius: 50%;

  background: #22c55e;

  box-shadow:
    0 0 0 3px
    rgba(34, 197, 94, 0.12);
}

/* ============================================================
   CHAT
============================================================ */

.antimate-chat {
  flex: 1;

  width: 100%;

  overflow-y: auto;

  padding: 28px 18px 170px;
}

.antimate-messages {
  width: 100%;

  max-width: 860px;

  margin: 0 auto;
}

.antimate-welcome {
  min-height: 45vh;

  display: flex;

  align-items: center;

  justify-content: center;

  flex-direction: column;

  text-align: center;

  color: var(--antimate-muted);
}

.antimate-welcome h2 {
  margin: 20px 0 8px;

  color: var(--antimate-text);

  font-size: 24px;

  font-weight: 700;
}

.antimate-welcome p {
  max-width: 420px;

  margin: 0;

  font-size: 14px;

  line-height: 1.7;
}

/* ============================================================
   WELCOME WAVE
============================================================ */

.welcome-wave {
  height: 48px;

  display: flex;

  align-items: center;

  gap: 5px;
}

.welcome-wave span {
  width: 5px;

  border-radius: 10px;

  background: var(--antimate-text);

  animation: welcomeWave 1.2s
    ease-in-out infinite;
}

.welcome-wave span:nth-child(1) {
  height: 15px;
  animation-delay: 0s;
}

.welcome-wave span:nth-child(2) {
  height: 25px;
  animation-delay: 0.1s;
}

.welcome-wave span:nth-child(3) {
  height: 36px;
  animation-delay: 0.2s;
}

.welcome-wave span:nth-child(4) {
  height: 46px;
  animation-delay: 0.3s;
}

.welcome-wave span:nth-child(5) {
  height: 32px;
  animation-delay: 0.4s;
}

.welcome-wave span:nth-child(6) {
  height: 22px;
  animation-delay: 0.5s;
}

.welcome-wave span:nth-child(7) {
  height: 14px;
  animation-delay: 0.6s;
}

@keyframes welcomeWave {
  0%,
  100% {
    transform: scaleY(0.7);
  }

  50% {
    transform: scaleY(1);
  }
}

/* ============================================================
   MESSAGES
============================================================ */

.message-row {
  display: flex;

  width: 100%;

  margin-bottom: 18px;
}

.message-user {
  justify-content: flex-end;
}

.message-assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: min(720px, 84%);

  padding: 12px 15px;

  border-radius: 16px;

  font-size: 14px;

  line-height: 1.65;

  word-break: break-word;
}

.bubble-user {
  background: var(--antimate-primary);

  color: var(--antimate-primary-text);

  border-bottom-right-radius: 5px;
}

.bubble-assistant {
  background: var(--antimate-surface);

  border: 1px solid
    var(--antimate-border);

  border-bottom-left-radius: 5px;

  box-shadow:
    0 2px 8px
    rgba(0, 0, 0, 0.025);
}

.message-content {
  white-space: pre-wrap;
}

.message-voice-label {
  display: flex;

  align-items: center;

  gap: 7px;

  margin-top: 9px;

  padding-top: 8px;

  border-top: 1px solid
    var(--antimate-border);

  font-size: 10px;

  color: var(--antimate-muted);
}

.mini-wave {
  height: 14px;

  display: flex;

  align-items: center;

  gap: 2px;
}

.mini-wave i {
  width: 2px;

  border-radius: 4px;

  background: currentColor;
}

.mini-wave i:nth-child(1) {
  height: 6px;
}

.mini-wave i:nth-child(2) {
  height: 11px;
}

.mini-wave i:nth-child(3) {
  height: 8px;
}

.mini-wave i:nth-child(4) {
  height: 13px;
}

/* ============================================================
   THINKING
============================================================ */

.thinking-bubble {
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 10px 13px;

  border: 1px solid
    var(--antimate-border);

  border-radius: 14px;

  background: var(--antimate-surface);

  color: var(--antimate-muted);

  font-size: 12px;
}

.thinking-dots {
  display: flex;

  align-items: center;

  gap: 3px;
}

.thinking-dots span {
  width: 5px;

  height: 5px;

  border-radius: 50%;

  background: currentColor;

  animation: thinkingDots 1.2s
    infinite ease-in-out;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes thinkingDots {
  0%,
  80%,
  100% {
    opacity: 0.3;

    transform: translateY(0);
  }

  40% {
    opacity: 1;

    transform: translateY(-3px);
  }
}

/* ============================================================
   VOICE RESPONSE
============================================================ */

.voice-response-bar {
  position: fixed;

  left: 50%;

  bottom: 91px;

  transform: translateX(-50%);

  width: min(
    560px,
    calc(100% - 32px)
  );

  min-height: 58px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  padding: 9px 12px;

  border: 1px solid
    var(--antimate-border);

  border-radius: 15px;

  background: var(--antimate-surface);

  box-shadow:
    0 10px 35px
    rgba(0, 0, 0, 0.08);

  z-index: 30;
}

.voice-response-left {
  display: flex;

  align-items: center;

  gap: 10px;

  min-width: 0;
}

.voice-response-left strong {
  display: block;

  font-size: 12px;
}

.voice-response-left span {
  display: block;

  margin-top: 2px;

  font-size: 10px;

  color: var(--antimate-muted);
}

.replay-button {
  width: 36px;

  height: 36px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  border: 0;

  border-radius: 50%;

  background: var(--antimate-primary);

  color: var(--antimate-primary-text);

  cursor: pointer;

  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}

.replay-button:hover {
  transform: scale(1.05);
}

.replay-button:active {
  transform: scale(0.95);
}

.play-icon {
  margin-left: 2px;

  font-size: 11px !important;

  color: inherit !important;
}

.pause-icon {
  font-size: 11px !important;

  color: inherit !important;
}

.voice-bars {
  height: 28px;

  display: flex;

  align-items: center;

  gap: 3px;

  opacity: 0.55;
}

.voice-bars span {
  width: 3px;

  border-radius: 5px;

  background: var(--antimate-text);
}

.voice-bars span:nth-child(1) {
  height: 8px;
}

.voice-bars span:nth-child(2) {
  height: 17px;
}

.voice-bars span:nth-child(3) {
  height: 23px;
}

.voice-bars span:nth-child(4) {
  height: 13px;
}

.voice-bars span:nth-child(5) {
  height: 25px;
}

.voice-bars span:nth-child(6) {
  height: 15px;
}

.voice-bars span:nth-child(7) {
  height: 21px;
}

.voice-bars span:nth-child(8) {
  height: 9px;
}

/* ============================================================
   RECORDING PANEL
============================================================ */

.recording-panel {
  position: fixed;

  left: 50%;

  bottom: 90px;

  transform: translateX(-50%);

  width: min(
    600px,
    calc(100% - 32px)
  );

  display: flex;

  align-items: center;

  gap: 12px;

  padding: 11px 13px;

  border: 1px solid
    var(--antimate-border);

  border-radius: 16px;

  background: var(--antimate-surface);

  box-shadow:
    0 10px 35px
    rgba(0, 0, 0, 0.1);

  z-index: 40;
}

.recording-indicator {
  width: 38px;

  height: 38px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 50%;

  background:
    rgba(239, 68, 68, 0.1);
}

.recording-indicator span {
  width: 10px;

  height: 10px;

  border-radius: 50%;

  background: #ef4444;

  animation: recordingPulse 1s
    infinite;
}

@keyframes recordingPulse {
  0% {
    transform: scale(1);

    opacity: 1;
  }

  50% {
    transform: scale(1.25);

    opacity: 0.65;
  }

  100% {
    transform: scale(1);

    opacity: 1;
  }
}

.recording-text {
  flex: 1;

  min-width: 0;
}

.recording-text strong {
  display: block;

  font-size: 12px;
}

.recording-text span {
  display: block;

  margin-top: 2px;

  font-size: 10px;

  color: var(--antimate-muted);
}

.recording-countdown {
  font-size: 14px;

  font-weight: 700;

  font-variant-numeric: tabular-nums;
}

.stop-recording-button {
  border: 1px solid
    var(--antimate-border);

  border-radius: 9px;

  padding: 7px 10px;

  background: transparent;

  color: var(--antimate-text);

  font-size: 11px;

  cursor: pointer;
}

.stop-recording-button:hover {
  background: var(--antimate-bg);
}

/* ============================================================
   INPUT
============================================================ */

.antimate-input-wrapper {
  position: fixed;

  left: 50%;

  bottom: 0;

  transform: translateX(-50%);

  width: 100%;

  max-width: 900px;

  padding: 10px 18px 12px;

  background: var(--antimate-bg);

  z-index: 20;
}

.antimate-input {
  width: 100%;

  min-height: 50px;

  display: flex;

  align-items: flex-end;

  gap: 8px;

  padding: 6px 7px 6px 14px;

  border: 1px solid
    var(--antimate-border);

  border-radius: 15px;

  background: var(--antimate-surface);

  box-shadow:
    0 4px 18px
    rgba(0, 0, 0, 0.045);
}

.antimate-input textarea {
  flex: 1;

  width: 100%;

  min-width: 0;

  max-height: 140px;

  resize: none;

  overflow-y: auto;

  border: 0;

  outline: 0;

  background: transparent;

  color: var(--antimate-text);

  padding: 7px 0;

  font-family: inherit;

  font-size: 14px;

  line-height: 1.5;
}

.antimate-input textarea::placeholder {
  color: var(--antimate-muted);

  opacity: 0.8;
}

.antimate-input textarea:disabled {
  opacity: 0.65;
}

.action-button {
  width: 38px;

  height: 38px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  border: 0;

  border-radius: 11px;

  cursor: pointer;

  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.action-button:active:not(:disabled) {
  transform: scale(0.94);
}

.action-button:disabled {
  cursor: not-allowed;

  opacity: 0.45;
}

.voice-button {
  background: var(--antimate-primary);

  color: var(--antimate-primary-text);
}

.voice-button svg {
  width: 24px;

  height: 24px;
}

.voice-button.recording {
  background: #ef4444;
}

.send-button {
  background: var(--antimate-primary);

  color: var(--antimate-primary-text);
}

.send-button svg {
  width: 19px;

  height: 19px;
}

.input-hint {
  padding: 5px 4px 0;

  text-align: center;

  font-size: 9px;

  color: var(--antimate-muted);
}

/* ============================================================
   SCROLLBAR
============================================================ */

.antimate-chat::-webkit-scrollbar {
  width: 5px;
}

.antimate-chat::-webkit-scrollbar-thumb {
  border-radius: 10px;

  background: rgba(107, 114, 128, 0.25);
}

.antimate-chat::-webkit-scrollbar-track {
  background: transparent;
}

/* ============================================================
   MOBILE
============================================================ */

@media (max-width: 600px) {
  .antimate-header {
    height: 62px;

    padding: 0 15px;
  }

  .antimate-chat {
    padding:
      20px 12px
      160px;
  }

  .message-bubble {
    max-width: 90%;

    font-size: 13px;
  }

  .antimate-welcome {
    min-height: 40vh;
  }

  .antimate-welcome h2 {
    font-size: 20px;
  }

  .antimate-input-wrapper {
    padding:
      8px 10px
      10px;
  }

  .voice-response-bar,
  .recording-panel {
    width: calc(100% - 20px);

    bottom: 86px;
  }

  .voice-bars {
    display: none;
  }

  .recording-panel {
    gap: 8px;
  }

  .recording-countdown {
    margin-left: auto;
  }

  .stop-recording-button {
    padding: 7px 8px;
  }
}

/* ============================================================
   DARK MODE
============================================================ */

@media (prefers-color-scheme: dark) {
  .antimate-page {
    --antimate-bg: var(
      --background,
      #0b0d10
    );

    --antimate-surface: var(
      --card,
      #111418
    );

    --antimate-text: var(
      --foreground,
      #f3f4f6
    );

    --antimate-muted: var(
      --muted-foreground,
      #9ca3af
    );

    --antimate-border: var(
      --border,
      #262b33
    );
  }
}