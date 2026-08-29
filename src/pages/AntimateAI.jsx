import React, { useEffect, useRef, useState } from "react";

/*
============================================================
 ANTIMATE AI
 Voice + Text Chat
 Native CSS — no Tailwind
============================================================
*/

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const THINKING_MESSAGES = [
  "Ndigutekereza...",
  "Ndimo kureba amakuru ya system...",
  "Ndimo gutegura igisubizo...",
  "Mpa akanya gato...",
];

export default function AntimateAI() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState(
    THINKING_MESSAGES[0]
  );

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(30);

  const [voiceAudio, setVoiceAudio] = useState(null);
  const [voiceLoading, setVoiceLoading] = useState(false);

  // ==========================================================
  // REFS
  // ==========================================================

  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const audioPlayerRef = useRef(null);
  const thinkingTimerRef = useRef(null);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      stopRecordingTimer();

      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
      }

      if (voiceAudio) {
        URL.revokeObjectURL(voiceAudio);
      }
    };
  }, [voiceAudio]);

  // ==========================================================
  // THINKING ANIMATION
  // ==========================================================

  const startThinking = () => {
    let index = 0;

    setThinkingText(THINKING_MESSAGES[0]);

    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
    }

    thinkingTimerRef.current = setInterval(() => {
      index = (index + 1) % THINKING_MESSAGES.length;

      setThinkingText(THINKING_MESSAGES[index]);
    }, 1800);
  };

  const stopThinking = () => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  };

  // ==========================================================
  // TEXTAREA AUTO RESIZE
  // ==========================================================

  const handleMessageChange = (event) => {
    const value = event.target.value;

    setMessage(value);

    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = "auto";

      const maxHeight = 130;

      textarea.style.height = `${Math.min(
        textarea.scrollHeight,
        maxHeight
      )}px`;
    }
  };

  // ==========================================================
  // ADD MESSAGE
  // ==========================================================

  const addMessage = (role, content, extra = {}) => {
    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        content,
        ...extra,
      },
    ]);
  };

  // ==========================================================
  // TEXT CHAT
  // ==========================================================

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || loading) {
      return;
    }

    addMessage("user", text);

    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setLoading(true);
    startThinking();

    try {
      /*
       * Backend:
       *
       * POST /api/antimate/chat
       *
       * {
       *   "message": "..."
       * }
       */

      const response = await fetch(
        `${API_BASE}/api/antimate/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `HTTP ${response.status}`
        );
      }

      const answer =
        data?.answer_kinyarwanda ||
        data?.answer ||
        data?.response ||
        data?.text ||
        data?.message;

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      addMessage("assistant", answer);
    } catch (error) {
      console.error("ANTIMATE TEXT ERROR:", error);

      addMessage(
        "error",
        `❌ Habaye ikibazo: ${
          error?.message || "Ntibyashobotse kubona igisubizo."
        }`
      );
    } finally {
      stopThinking();
      setLoading(false);
    }
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendMessage();
    }
  };

  // ==========================================================
  // RECORDING TIMER
  // ==========================================================

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording = async () => {
    if (loading || voiceLoading || isRecording) {
      return;
    }

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Browser yawe ntabwo yemera microphone."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      audioChunksRef.current = [];

      let mimeType = "";

      const possibleTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      for (const type of possibleTypes) {
        if (
          MediaRecorder.isTypeSupported &&
          MediaRecorder.isTypeSupported(type)
        ) {
          mimeType = type;
          break;
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        const actualType =
          recorder.mimeType || "audio/webm";

        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: actualType,
          }
        );

        audioChunksRef.current = [];

        await processVoice(audioBlob);
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        stream
          .getTracks()
          .forEach((track) => track.stop());

        stopRecordingTimer();

        setIsRecording(false);
        setRecordingTime(30);
      };

      recorder.start();

      setIsRecording(true);
      setRecordingTime(30);

      // ======================================================
      // 30 SECOND COUNTDOWN
      // ======================================================

      stopRecordingTimer();

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingTime((previous) => {
            if (previous <= 1) {
              clearInterval(
                recordingTimerRef.current
              );

              recordingTimerRef.current = null;

              setTimeout(() => {
                stopRecording();
              }, 50);

              return 0;
            }

            return previous - 1;
          });
        }, 1000);
    } catch (error) {
      console.error(
        "MICROPHONE ERROR:",
        error
      );

      setIsRecording(false);
      setRecordingTime(30);

      alert(
        error?.message ||
          "Microphone ntiyashoboye gufunguka."
      );
    }
  };

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = () => {
    stopRecordingTimer();

    const recorder = mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    } else {
      setIsRecording(false);
      setRecordingTime(30);
    }
  };

  // ==========================================================
  // VOICE PROCESSING
  // ==========================================================

  const processVoice = async (audioBlob) => {
    setIsRecording(false);
    setRecordingTime(30);

    if (!audioBlob || audioBlob.size === 0) {
      return;
    }

    setVoiceLoading(true);
    setLoading(true);

    startThinking();

    try {
      /*
       * IMPORTANT:
       *
       * Browser ishobora kohereza WEBM/OPUS.
       *
       * Backend ya antimateRoutes.js ni yo izabanza
       * guhindura audio ikayishyira:
       *
       * WAV
       * 16kHz
       * Mono
       *
       * mbere yo kohereza kuri ANTIMATE AI.
       */

      const extension =
        audioBlob.type.includes("ogg")
          ? "ogg"
          : audioBlob.type.includes("mp4")
          ? "mp4"
          : "webm";

      const formData = new FormData();

      formData.append(
        "audio",
        audioBlob,
        `antimate_voice.${extension}`
      );

      const response = await fetch(
        `${API_BASE}/api/antimate/voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `HTTP ${response.status}`
        );
      }

      // ======================================================
      // USER TRANSCRIPTION
      // ======================================================

      const userText =
        data?.transcription ||
        data?.transcribed_text ||
        data?.input_kinyarwanda ||
        data?.text ||
        "";

      if (userText) {
        addMessage(
          "user",
          userText,
          {
            voice: true,
          }
        );
      }

      // ======================================================
      // ANTIMATE ANSWER
      // ======================================================

      const answer =
        data?.answer_kinyarwanda ||
        data?.answer ||
        data?.response ||
        "";

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
      // VOICE RESPONSE
      // ======================================================

      const audioUrl =
        data?.audio_url ||
        data?.audio ||
        data?.voice_url ||
        data?.output_audio ||
        null;

      if (audioUrl) {
        const finalAudioUrl =
          audioUrl.startsWith("http")
            ? audioUrl
            : `${API_BASE}${audioUrl}`;

        setVoiceAudio(finalAudioUrl);

        /*
         * Auto-play nyuma gato kugira ngo
         * React ibanze ishyire audio element kuri DOM.
         */

        setTimeout(() => {
          if (audioPlayerRef.current) {
            audioPlayerRef.current
              .play()
              .catch((error) => {
                console.warn(
                  "Autoplay blocked:",
                  error
                );
              });
          }
        }, 150);
      }
    } catch (error) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        error
      );

      addMessage(
        "error",
        `❌ Voice processing failed: ${
          error?.message ||
          "Ntibyashobotse gutunganya ijwi."
        }`
      );
    } finally {
      stopThinking();

      setVoiceLoading(false);
      setLoading(false);
    }
  };

  // ==========================================================
  // REPLAY VOICE
  // ==========================================================

  const replayVoice = () => {
    if (!audioPlayerRef.current) {
      return;
    }

    audioPlayerRef.current.currentTime = 0;

    audioPlayerRef.current
      .play()
      .catch((error) => {
        console.warn(
          "Replay failed:",
          error
        );
      });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  const hasText = message.trim().length > 0;

  return (
    <div className="antimate-page">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="antimate-header">
        <div className="antimate-header-left">
          <div className="antimate-logo">
            <span className="antimate-logo-dot" />
          </div>

          <div>
            <h1>ANTIMATE AI</h1>
            <span className="antimate-online">
              <span className="online-dot" />
              Online
            </span>
          </div>
        </div>
      </header>

      {/* ====================================================
          CHAT AREA
      ==================================================== */}

      <main className="antimate-chat">
        {messages.length === 0 && !loading && (
          <div className="antimate-welcome">
            <div className="welcome-wave">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <h2>Muraho 👋</h2>

            <p>
              Ndi ANTIMATE AI. Andika cyangwa
              vuga icyo ushaka kumenya.
            </p>

            <div className="welcome-hints">
              <span>💬 Andika ikibazo</span>
              <span>🎙️ Vuga mu Kinyarwanda</span>
            </div>
          </div>
        )}

        {/* ==================================================
            MESSAGES
        ================================================== */}

        <div className="message-list">
          {messages.map((item) => (
            <div
              key={item.id}
              className={`message-row ${
                item.role === "user"
                  ? "message-user-row"
                  : item.role === "error"
                  ? "message-error-row"
                  : "message-ai-row"
              }`}
            >
              <div
                className={`message ${
                  item.role === "user"
                    ? "message-user"
                    : item.role === "error"
                    ? "message-error"
                    : "message-ai"
                }`}
              >
                {item.role === "assistant" && (
                  <div className="message-label">
                    ANTIMATE
                  </div>
                )}

                {item.voice &&
                  item.role === "user" && (
                    <div className="voice-message-label">
                      <SoundWaveIcon small />
                      Voice message
                    </div>
                  )}

                <div className="message-content">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ==================================================
            THINKING
        ================================================== */}

        {loading && (
          <div className="thinking-row">
            <div className="thinking-dots">
              <span />
              <span />
              <span />
            </div>

            <span>{thinkingText}</span>
          </div>
        )}

        {/* ==================================================
            VOICE RESPONSE
        ================================================== */}

        {voiceAudio && (
          <div className="voice-response">
            <div className="voice-response-left">
              <div className="voice-response-icon">
                <SoundWaveIcon />
              </div>

              <div>
                <div className="voice-response-title">
                  ANTIMATE Voice
                </div>

                <div className="voice-response-subtitle">
                  Kinyarwanda response
                </div>
              </div>
            </div>

            <div className="voice-response-controls">
              <audio
                ref={audioPlayerRef}
                src={voiceAudio}
                controls
                preload="auto"
              />

              <button
                type="button"
                className="replay-button"
                onClick={replayVoice}
                title="Replay"
              >
                <ReplayIcon />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================
          RECORDING OVERLAY
      ==================================================== */}

      {isRecording && (
        <div className="recording-status">
          <div className="recording-animation">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="recording-text">
            <strong>Ndumva...</strong>
            <span>Vuga mu Kinyarwanda</span>
          </div>

          <div className="recording-countdown">
            {recordingTime}s
          </div>

          <button
            type="button"
            className="stop-recording-button"
            onClick={stopRecording}
          >
            <StopIcon />
          </button>
        </div>
      )}

      {/* ====================================================
          FIXED INPUT AREA
      ==================================================== */}

      <div className="antimate-input-wrapper">
        <div className="antimate-input-area">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Ndumva..."
                : "Andika ubutumwa..."
            }
            rows={1}
            disabled={
              loading ||
              isRecording ||
              voiceLoading
            }
          />

          <div className="input-action">
            {!hasText ? (
              <button
                type="button"
                className="voice-button"
                onClick={startRecording}
                disabled={
                  loading ||
                  isRecording ||
                  voiceLoading
                }
                title="Vuga"
              >
                <SoundWaveIcon />
              </button>
            ) : (
              <button
                type="button"
                className="send-button"
                onClick={sendMessage}
                disabled={
                  loading ||
                  voiceLoading
                }
                title="Send"
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>

        <div className="input-footer">
          <span>
            ANTIMATE AI
          </span>

          <span>
            Shift + Enter = new line
          </span>
        </div>
      </div>

      {/* ====================================================
          NATIVE CSS
      ==================================================== */}

      <style>{`
        /* ====================================================
           ROOT
        ==================================================== */

        .antimate-page {
          --antimate-bg: var(--background, #0b1117);
          --antimate-surface: var(--card-background, #111922);
          --antimate-surface-2: #151f29;
          --antimate-border: var(
            --border-color,
            rgba(255,255,255,0.09)
          );

          --antimate-text: var(
            --text-color,
            #f1f5f9
          );

          --antimate-muted: var(
            --secondary-text,
            #94a3b8
          );

          --antimate-primary: var(
            --primary-color,
            #22c55e
          );

          min-height: 100vh;
          width: 100%;

          background: var(--antimate-bg);
          color: var(--antimate-text);

          display: flex;
          flex-direction: column;

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          box-sizing: border-box;
        }

        .antimate-page *,
        .antimate-page *::before,
        .antimate-page *::after {
          box-sizing: border-box;
        }

        /* ====================================================
           HEADER
        ==================================================== */

        .antimate-header {
          position: sticky;
          top: 0;
          z-index: 20;

          height: 68px;

          display: flex;
          align-items: center;

          padding: 0 24px;

          background:
            color-mix(
              in srgb,
              var(--antimate-bg) 92%,
              transparent
            );

          border-bottom:
            1px solid var(--antimate-border);

          backdrop-filter: blur(14px);
        }

        .antimate-header-left {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .antimate-logo {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background:
            linear-gradient(
              145deg,
              var(--antimate-primary),
              color-mix(
                in srgb,
                var(--antimate-primary) 55%,
                #000
              )
            );

          box-shadow:
            0 7px 25px
            color-mix(
              in srgb,
              var(--antimate-primary) 22%,
              transparent
            );
        }

        .antimate-logo-dot {
          width: 12px;
          height: 12px;

          border-radius: 50%;

          background: white;

          box-shadow:
            0 0 0 5px
            rgba(255,255,255,0.12);
        }

        .antimate-header h1 {
          margin: 0;

          font-size: 15px;
          line-height: 18px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .antimate-online {
          display: flex;
          align-items: center;
          gap: 5px;

          margin-top: 2px;

          color: var(--antimate-muted);

          font-size: 11px;
        }

        .online-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: var(--antimate-primary);

          box-shadow:
            0 0 8px
            color-mix(
              in srgb,
              var(--antimate-primary) 70%,
              transparent
            );
        }

        /* ====================================================
           CHAT
        ==================================================== */

        .antimate-chat {
          flex: 1;

          width: min(
            900px,
            calc(100% - 32px)
          );

          margin: 0 auto;

          padding:
            34px 0
            150px;

          overflow-y: auto;
        }

        .antimate-welcome {
          min-height: 330px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 40px 20px;
        }

        .welcome-wave {
          height: 48px;

          display: flex;
          align-items: center;

          gap: 5px;

          margin-bottom: 22px;
        }

        .welcome-wave span {
          width: 4px;

          border-radius: 10px;

          background: var(--antimate-primary);

          animation:
            welcomeWave 1.1s
            ease-in-out infinite;
        }

        .welcome-wave span:nth-child(1) {
          height: 17px;
          animation-delay: 0s;
        }

        .welcome-wave span:nth-child(2) {
          height: 31px;
          animation-delay: 0.1s;
        }

        .welcome-wave span:nth-child(3) {
          height: 45px;
          animation-delay: 0.2s;
        }

        .welcome-wave span:nth-child(4) {
          height: 28px;
          animation-delay: 0.3s;
        }

        .welcome-wave span:nth-child(5) {
          height: 16px;
          animation-delay: 0.4s;
        }

        .antimate-welcome h2 {
          margin: 0 0 8px;

          font-size: 26px;
          font-weight: 700;
        }

        .antimate-welcome p {
          max-width: 500px;

          margin: 0;

          color: var(--antimate-muted);

          font-size: 14px;
          line-height: 1.7;
        }

        .welcome-hints {
          display: flex;
          gap: 10px;

          margin-top: 22px;

          flex-wrap: wrap;
          justify-content: center;
        }

        .welcome-hints span {
          padding: 8px 12px;

          border:
            1px solid var(--antimate-border);

          border-radius: 999px;

          color: var(--antimate-muted);

          font-size: 12px;
        }

        /* ====================================================
           MESSAGES
        ==================================================== */

        .message-list {
          display: flex;
          flex-direction: column;

          gap: 18px;
        }

        .message-row {
          width: 100%;

          display: flex;
        }

        .message-user-row {
          justify-content: flex-end;
        }

        .message-ai-row,
        .message-error-row {
          justify-content: flex-start;
        }

        .message {
          max-width: min(
            75%,
            680px
          );

          padding: 12px 15px;

          border-radius: 16px;

          font-size: 14px;
          line-height: 1.65;

          word-break: break-word;
          white-space: pre-wrap;
        }

        .message-user {
          background: var(--antimate-primary);

          color: #07100a;

          border-bottom-right-radius: 5px;
        }

        .message-ai {
          background: var(--antimate-surface);

          border:
            1px solid var(--antimate-border);

          border-bottom-left-radius: 5px;
        }

        .message-error {
          background: rgba(239,68,68,0.08);

          border:
            1px solid rgba(239,68,68,0.25);

          color: #fca5a5;
        }

        .message-label {
          margin-bottom: 5px;

          color: var(--antimate-primary);

          font-size: 10px;
          font-weight: 700;

          letter-spacing: 0.8px;
        }

        .voice-message-label {
          display: flex;
          align-items: center;
          gap: 5px;

          margin-bottom: 6px;

          font-size: 10px;
          opacity: 0.75;
        }

        /* ====================================================
           THINKING
        ==================================================== */

        .thinking-row {
          display: flex;
          align-items: center;

          gap: 9px;

          margin-top: 20px;

          color: var(--antimate-muted);

          font-size: 12px;
        }

        .thinking-dots {
          display: flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: var(--antimate-primary);

          animation:
            thinkingDots 1.2s
            infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        /* ====================================================
           VOICE RESPONSE
        ==================================================== */

        .voice-response {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 16px;

          margin-top: 24px;

          padding: 13px 15px;

          background: var(--antimate-surface);

          border:
            1px solid var(--antimate-border);

          border-radius: 15px;
        }

        .voice-response-left {
          display: flex;
          align-items: center;

          gap: 10px;

          min-width: 0;
        }

        .voice-response-icon {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background:
            color-mix(
              in srgb,
              var(--antimate-primary) 12%,
              transparent
            );

          color: var(--antimate-primary);
        }

        .voice-response-title {
          font-size: 13px;
          font-weight: 600;
        }

        .voice-response-subtitle {
          margin-top: 2px;

          color: var(--antimate-muted);

          font-size: 10px;
        }

        .voice-response-controls {
          display: flex;
          align-items: center;

          gap: 8px;
        }

        .voice-response audio {
          width: 250px;
          height: 34px;
        }

        .replay-button {
          width: 36px;
          height: 36px;

          flex-shrink: 0;

          border: 0;
          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            color-mix(
              in srgb,
              var(--antimate-primary) 13%,
              transparent
            );

          color: var(--antimate-primary);

          cursor: pointer;

          transition:
            transform 0.18s ease,
            background 0.18s ease;
        }

        .replay-button:hover {
          transform: scale(1.05);

          background:
            color-mix(
              in srgb,
              var(--antimate-primary) 22%,
              transparent
            );
        }

        /* ====================================================
           RECORDING
        ==================================================== */

        .recording-status {
          position: fixed;

          left: 50%;
          bottom: 105px;

          transform: translateX(-50%);

          z-index: 50;

          width: min(
            500px,
            calc(100% - 30px)
          );

          display: flex;
          align-items: center;

          gap: 13px;

          padding: 12px 14px;

          background:
            color-mix(
              in srgb,
              var(--antimate-surface) 96%,
              transparent
            );

          border:
            1px solid
            color-mix(
              in srgb,
              var(--antimate-primary) 30%,
              var(--antimate-border)
            );

          border-radius: 15px;

          box-shadow:
            0 18px 50px rgba(0,0,0,0.35);

          backdrop-filter: blur(18px);
        }

        .recording-animation {
          width: 42px;
          height: 35px;

          display: flex;
          align-items: center;

          justify-content: center;

          gap: 3px;
        }

        .recording-animation span {
          width: 3px;

          border-radius: 5px;

          background: var(--antimate-primary);

          animation:
            recordingWave 0.75s
            ease-in-out infinite;
        }

        .recording-animation span:nth-child(1) {
          height: 11px;
        }

        .recording-animation span:nth-child(2) {
          height: 20px;
          animation-delay: 0.1s;
        }

        .recording-animation span:nth-child(3) {
          height: 30px;
          animation-delay: 0.2s;
        }

        .recording-animation span:nth-child(4) {
          height: 21px;
          animation-delay: 0.3s;
        }

        .recording-animation span:nth-child(5) {
          height: 12px;
          animation-delay: 0.4s;
        }

        .recording-text {
          flex: 1;

          display: flex;
          flex-direction: column;
        }

        .recording-text strong {
          font-size: 13px;
        }

        .recording-text span {
          margin-top: 2px;

          color: var(--antimate-muted);

          font-size: 11px;
        }

        .recording-countdown {
          min-width: 42px;

          color: var(--antimate-primary);

          font-size: 14px;
          font-weight: 700;

          text-align: center;
        }

        .stop-recording-button {
          width: 36px;
          height: 36px;

          border: 0;
          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #ef4444;

          color: white;

          cursor: pointer;
        }

        /* ====================================================
           FIXED INPUT
        ==================================================== */

        .antimate-input-wrapper {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding:
            12px
            max(
              16px,
              env(safe-area-inset-right)
            )
            max(
              14px,
              env(safe-area-inset-bottom)
            )
            max(
              16px,
              env(safe-area-inset-left)
            );

          background:
            linear-gradient(
              to top,
              var(--antimate-bg) 70%,
              transparent
            );
        }

        .antimate-input-area {
          width: min(
            900px,
            100%
          );

          min-height: 54px;

          margin: 0 auto;

          display: flex;
          align-items: flex-end;

          gap: 8px;

          padding: 7px 8px 7px 15px;

          background: var(--antimate-surface);

          border:
            1px solid var(--antimate-border);

          border-radius: 17px;

          box-shadow:
            0 10px 35px rgba(0,0,0,0.18);
        }

        .antimate-input-area textarea {
          flex: 1;

          width: 100%;

          min-height: 38px;
          max-height: 130px;

          padding:
            9px
            0;

          resize: none;

          overflow-y: auto;

          border: 0;
          outline: 0;

          background: transparent;

          color: var(--antimate-text);

          font-family: inherit;
          font-size: 14px;
          line-height: 20px;
        }

        .antimate-input-area textarea::placeholder {
          color: var(--antimate-muted);
        }

        .antimate-input-area textarea:disabled {
          opacity: 0.7;
        }

        .input-action {
          flex-shrink: 0;
        }

        .voice-button,
        .send-button {
          width: 40px;
          height: 40px;

          border: 0;
          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            transform 0.16s ease,
            background 0.16s ease,
            opacity 0.16s ease;
        }

        .voice-button {
          background:
            color-mix(
              in srgb,
              var(--antimate-primary) 13%,
              transparent
            );

          color: var(--antimate-primary);
        }

        .send-button {
          background: var(--antimate-primary);

          color: #07100a;
        }

        .voice-button:hover,
        .send-button:hover {
          transform: translateY(-1px);
        }

        .voice-button:disabled,
        .send-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }

        .input-footer {
          width: min(
            900px,
            100%
          );

          margin: 6px auto 0;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 4px;

          color: var(--antimate-muted);

          font-size: 9px;

          opacity: 0.65;
        }

        /* ====================================================
           ICONS
        ==================================================== */

        .sound-wave-icon {
          width: 21px;
          height: 21px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 2px;
        }

        .sound-wave-icon span {
          width: 2.5px;

          border-radius: 4px;

          background: currentColor;
        }

        .sound-wave-icon span:nth-child(1) {
          height: 7px;
        }

        .sound-wave-icon span:nth-child(2) {
          height: 13px;
        }

        .sound-wave-icon span:nth-child(3) {
          height: 19px;
        }

        .sound-wave-icon span:nth-child(4) {
          height: 13px;
        }

        .sound-wave-icon span:nth-child(5) {
          height: 7px;
        }

        .sound-wave-small {
          width: 14px;
          height: 14px;
        }

        .sound-wave-small span {
          width: 2px;
        }

        .sound-wave-small span:nth-child(1) {
          height: 5px;
        }

        .sound-wave-small span:nth-child(2) {
          height: 9px;
        }

        .sound-wave-small span:nth-child(3) {
          height: 13px;
        }

        .sound-wave-small span:nth-child(4) {
          height: 9px;
        }

        .sound-wave-small span:nth-child(5) {
          height: 5px;
        }

        /* ====================================================
           ANIMATIONS
        ==================================================== */

        @keyframes welcomeWave {
          0%,
          100% {
            transform: scaleY(0.7);
          }

          50% {
            transform: scaleY(1);
          }
        }

        @keyframes thinkingDots {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }

          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @keyframes recordingWave {
          0%,
          100% {
            transform: scaleY(0.6);
          }

          50% {
            transform: scaleY(1.15);
          }
        }

        /* ====================================================
           MOBILE
        ==================================================== */

        @media (max-width: 650px) {
          .antimate-header {
            height: 60px;
            padding: 0 15px;
          }

          .antimate-logo {
            width: 34px;
            height: 34px;
          }

          .antimate-chat {
            width: calc(100% - 24px);

            padding-top: 20px;
            padding-bottom: 145px;
          }

          .antimate-welcome {
            min-height: 300px;
          }

          .antimate-welcome h2 {
            font-size: 23px;
          }

          .message {
            max-width: 88%;

            font-size: 13.5px;
          }

          .voice-response {
            align-items: flex-start;

            flex-direction: column;
          }

          .voice-response-controls {
            width: 100%;
          }

          .voice-response audio {
            width: 100%;
            flex: 1;
          }

          .recording-status {
            bottom: 96px;
          }

          .input-footer {
            display: none;
          }

          .antimate-input-wrapper {
            padding-bottom:
              max(
                10px,
                env(safe-area-inset-bottom)
              );
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .antimate-page * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   SOUND WAVE ICON
============================================================ */

function SoundWaveIcon({ small = false }) {
  return (
    <span
      className={`sound-wave-icon ${
        small ? "sound-wave-small" : ""
      }`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

/* ============================================================
   SEND ICON
============================================================ */

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

/* ============================================================
   REPLAY ICON
============================================================ */

function ReplayIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
    </svg>
  );
}

/* ============================================================
   STOP ICON
============================================================ */

function StopIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
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
  );
}