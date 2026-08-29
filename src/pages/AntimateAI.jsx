import React, { useEffect, useRef, useState } from "react";

/*
|--------------------------------------------------------------------------
| ANTIMATE AI
|--------------------------------------------------------------------------
| Native CSS only — no Tailwind.
|
| Expected backend endpoints:
|   POST /api/antimate/text
|   POST /api/antimate/voice
|
| Voice:
|   Frontend sends audio as multipart/form-data.
|   Backend handles:
|   GPU first -> CPU fallback
|
| Adjust API_BASE_URL if your backend URL is different.
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const TEXT_ENDPOINT = `${API_BASE_URL}/api/antimate/text`;
const VOICE_ENDPOINT = `${API_BASE_URL}/api/antimate/voice`;

export default function AntimateAI() {
  // -----------------------------------------------------------------------
  // TEXT
  // -----------------------------------------------------------------------

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [textLoading, setTextLoading] = useState(false);

  // -----------------------------------------------------------------------
  // VOICE
  // -----------------------------------------------------------------------

  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);

  // -----------------------------------------------------------------------
  // GENERAL
  // -----------------------------------------------------------------------

  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("ready");

  const messagesEndRef = useRef(null);

  // -----------------------------------------------------------------------
  // AUTO SCROLL
  // -----------------------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // -----------------------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------------------

  const addMessage = (role, content, extra = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        content,
        ...extra,
      },
    ]);
  };

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  };

  const getHeaders = () => {
    const token = getToken();

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const extractAnswer = (data) => {
    if (!data) return "";

    return (
      data.answer_kinyarwanda ||
      data.answer ||
      data.response ||
      data.message ||
      data.reply ||
      data.output ||
      ""
    );
  };

  const extractError = (data) => {
    if (!data) {
      return "ANTIMATE ntiyashoboye gusubiza.";
    }

    return (
      data.error ||
      data.message ||
      data.detail ||
      "ANTIMATE ntiyashoboye gusubiza."
    );
  };

  // -----------------------------------------------------------------------
  // SEND TEXT
  // -----------------------------------------------------------------------

  const sendText = async (event) => {
    event?.preventDefault();

    const text = message.trim();

    if (!text || textLoading) {
      return;
    }

    setError("");
    setConnectionStatus("thinking");

    addMessage("user", text);

    setMessage("");
    setTextLoading(true);

    try {
      const response = await fetch(TEXT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getHeaders(),
        },
        body: JSON.stringify({
          text,
          language: "rw",
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || data.success === false) {
        throw new Error(extractError(data));
      }

      const answer = extractAnswer(data);

      if (!answer) {
        throw new Error("ANTIMATE yagarutse nta gisubizo.");
      }

      addMessage("assistant", answer, {
        mode: data.mode || data.processing_mode || "auto",
        processingTime: data.processing_time,
      });

      setConnectionStatus("ready");
    } catch (err) {
      console.error("ANTIMATE TEXT ERROR:", err);

      const errorMessage =
        err?.message || "Habaye ikibazo mu kuvugana na ANTIMATE.";

      setError(errorMessage);
      setConnectionStatus("error");

      addMessage("assistant", `⚠️ ${errorMessage}`);
    } finally {
      setTextLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // KEYBOARD
  // -----------------------------------------------------------------------

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendText(event);
    }
  };

  // -----------------------------------------------------------------------
  // START RECORDING
  // -----------------------------------------------------------------------

  const startRecording = async () => {
    if (isRecording || voiceLoading) {
      return;
    }

    setError("");
    setConnectionStatus("recording");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser yawe ntabwo yemera microphone. Gerageza Chrome cyangwa Firefox."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioChunksRef.current = [];

      let options = {};

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = {
          mimeType: "audio/webm;codecs=opus",
        };
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = {
          mimeType: "audio/webm",
        };
      }

      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        audioChunksRef.current = [];

        if (!blob.size) {
          setError("Nta audio yafashwe.");
          setConnectionStatus("error");
          return;
        }

        await sendVoice(blob);
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);

        stream.getTracks().forEach((track) => track.stop());

        setIsRecording(false);
        setError("Microphone recording failed.");
        setConnectionStatus("error");
      };

      recorder.start(250);

      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("MICROPHONE ERROR:", err);

      setIsRecording(false);
      setConnectionStatus("error");

      if (err?.name === "NotAllowedError") {
        setError(
          "Microphone permission yangiwe. Emera microphone muri browser settings."
        );
      } else if (err?.name === "NotFoundError") {
        setError("Nta microphone yabonetse kuri device.");
      } else {
        setError(
          err?.message || "Microphone ntiyashoboye gutangira recording."
        );
      }
    }
  };

  // -----------------------------------------------------------------------
  // STOP RECORDING
  // -----------------------------------------------------------------------

  const stopRecording = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      return;
    }

    setIsRecording(false);
    setConnectionStatus("uploading");

    mediaRecorder.stop();
    setMediaRecorder(null);
  };

  // -----------------------------------------------------------------------
  // SEND VOICE
  // -----------------------------------------------------------------------

  const sendVoice = async (audioBlob) => {
    setVoiceLoading(true);
    setError("");
    setConnectionStatus("thinking");

    addMessage("user", "🎤 Voice message", {
      isVoice: true,
    });

    try {
      const formData = new FormData();

      /*
       * Backend should convert this to:
       * WAV / 16kHz / mono
       *
       * before sending to the Kinyarwanda STT model.
       */
      formData.append("audio", audioBlob, "antimate_voice.webm");

      formData.append("language", "rw");

      const response = await fetch(VOICE_ENDPOINT, {
        method: "POST",
        headers: {
          ...getHeaders(),
        },
        body: formData,
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || data.success === false) {
        throw new Error(extractError(data));
      }

      const answer = extractAnswer(data);

      if (!answer) {
        throw new Error("ANTIMATE ntiyagarutse n'igisubizo.");
      }

      addMessage("assistant", answer, {
        mode: data.mode || data.processing_mode || "auto",
        processingTime: data.processing_time,
        transcript:
          data.transcript ||
          data.input_kinyarwanda ||
          data.text ||
          "",
      });

      setConnectionStatus("ready");

      // ---------------------------------------------------------------
      // PLAY TTS AUDIO IF BACKEND RETURNS AUDIO URL
      // ---------------------------------------------------------------

      const audioUrl =
        data.audio_url ||
        data.audio ||
        data.tts_url ||
        data.voice_url ||
        null;

      if (audioUrl) {
        try {
          const finalAudioUrl = audioUrl.startsWith("http")
            ? audioUrl
            : `${API_BASE_URL}${audioUrl}`;

          const audio = new Audio(finalAudioUrl);

          await audio.play();
        } catch (audioError) {
          console.warn("TTS playback failed:", audioError);
        }
      }
    } catch (err) {
      console.error("ANTIMATE VOICE ERROR:", err);

      const errorMessage =
        err?.message || "ANTIMATE voice request failed.";

      setError(errorMessage);
      setConnectionStatus("error");

      addMessage("assistant", `⚠️ ${errorMessage}`);
    } finally {
      setVoiceLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // CLEAR CHAT
  // -----------------------------------------------------------------------

  const clearChat = () => {
    if (isRecording) {
      stopRecording();
    }

    setMessages([]);
    setError("");
    setConnectionStatus("ready");
  };

  // -----------------------------------------------------------------------
  // STATUS TEXT
  // -----------------------------------------------------------------------

  const getStatusText = () => {
    if (connectionStatus === "recording") {
      return "Listening...";
    }

    if (connectionStatus === "uploading") {
      return "Sending voice...";
    }

    if (connectionStatus === "thinking") {
      return "ANTIMATE is thinking...";
    }

    if (connectionStatus === "error") {
      return "Connection error";
    }

    return "Ready";
  };

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  return (
    <div className="antimate-page">
      <div className="antimate-shell">
        {/* ================================================================
            HEADER
        ================================================================ */}

        <header className="antimate-header">
          <div className="antimate-brand">
            <div className="antimate-logo">
              A
            </div>

            <div>
              <h1>ANTIMATE AI</h1>
              <p>Kinyarwanda AI Assistant</p>
            </div>
          </div>

          <div className="antimate-header-actions">
            <div className={`connection-dot ${connectionStatus}`}>
              <span />
              {getStatusText()}
            </div>

            <button
              type="button"
              className="clear-button"
              onClick={clearChat}
              disabled={!messages.length && !error}
            >
              Clear
            </button>
          </div>
        </header>

        {/* ================================================================
            CHAT
        ================================================================ */}

        <main className="antimate-chat">
          {!messages.length ? (
            <section className="antimate-welcome">
              <div className="welcome-icon">
                ✦
              </div>

              <h2>Murakaza neza kuri ANTIMATE</h2>

              <p>
                Vuga cyangwa wandike mu Kinyarwanda. ANTIMATE izagusubiza
                mu buryo bwihuse.
              </p>

              <div className="welcome-actions">
                <button
                  type="button"
                  onClick={() => setMessage("Mpa amakuru kuri system yanjye.")}
                >
                  Ask about my system
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMessage("Ni gute nakurikirana ubushyuhe muri brooder?")
                  }
                >
                  Ask about brooder
                </button>
              </div>
            </section>
          ) : (
            <div className="message-list">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`message-row ${
                    item.role === "user" ? "user-row" : "assistant-row"
                  }`}
                >
                  <div
                    className={`message-avatar ${
                      item.role === "user"
                        ? "user-avatar"
                        : "assistant-avatar"
                    }`}
                  >
                    {item.role === "user" ? "U" : "A"}
                  </div>

                  <div className="message-content">
                    <div className="message-name">
                      {item.role === "user" ? "You" : "ANTIMATE"}
                    </div>

                    <div
                      className={`message-bubble ${
                        item.role === "user"
                          ? "user-message"
                          : "assistant-message"
                      }`}
                    >
                      {item.isVoice && (
                        <div className="voice-message-label">
                          🎤 Voice message
                        </div>
                      )}

                      {item.transcript && (
                        <div className="voice-transcript">
                          <span>Wavuze:</span>
                          {item.transcript}
                        </div>
                      )}

                      <div>{item.content}</div>
                    </div>

                    {item.role === "assistant" &&
                      (item.mode || item.processingTime) && (
                        <div className="message-meta">
                          {item.mode && (
                            <span>
                              {item.mode.toLowerCase() === "gpu"
                                ? "GPU"
                                : "CPU"}
                            </span>
                          )}

                          {item.processingTime && (
                            <span>{item.processingTime}s</span>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              ))}

              {(textLoading || voiceLoading) && (
                <div className="message-row assistant-row">
                  <div className="message-avatar assistant-avatar">
                    A
                  </div>

                  <div className="message-content">
                    <div className="message-name">ANTIMATE</div>

                    <div className="message-bubble assistant-message typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* ================================================================
            ERROR
        ================================================================ */}

        {error && (
          <div className="antimate-error">
            <span>⚠️</span>
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {/* ================================================================
            INPUT
        ================================================================ */}

        <footer className="antimate-input-area">
          <form
            className="antimate-input-wrapper"
            onSubmit={sendText}
          >
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Andika ubutumwa bwawe mu Kinyarwanda..."
              rows={1}
              disabled={textLoading || voiceLoading}
            />

            <div className="input-actions">
              <button
                type="button"
                className={`voice-button ${
                  isRecording ? "recording" : ""
                }`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={textLoading || voiceLoading}
                title={
                  isRecording
                    ? "Stop recording"
                    : "Speak to ANTIMATE"
                }
              >
                {isRecording ? "■" : "🎤"}
              </button>

              <button
                type="submit"
                className="send-button"
                disabled={
                  !message.trim() ||
                  textLoading ||
                  voiceLoading ||
                  isRecording
                }
              >
                ↑
              </button>
            </div>
          </form>

          <div className="input-hint">
            <span>Enter to send</span>
            <span>•</span>
            <span>Shift + Enter for new line</span>
            <span>•</span>
            <span>🎤 Voice supported</span>
          </div>
        </footer>
      </div>

      {/* ==================================================================
          NATIVE CSS
      ================================================================== */}

      <style>{`
        /* ================================================================
           PAGE
        ================================================================ */

        .antimate-page {
          min-height: 100%;
          width: 100%;
          background: var(--bg-primary, #f7f8fa);
          color: var(--text-primary, #17191c);
          display: flex;
          justify-content: center;
          box-sizing: border-box;
        }

        .antimate-shell {
          width: 100%;
          max-width: 1180px;
          min-height: calc(100vh - 32px);
          display: flex;
          flex-direction: column;
          padding: 18px 24px 20px;
          box-sizing: border-box;
        }

        /* ================================================================
           HEADER
        ================================================================ */

        .antimate-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 64px;
          border-bottom: 1px solid var(--border-color, #e4e7eb);
          padding-bottom: 14px;
          gap: 20px;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .antimate-logo {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-color, #20252b);
          color: #fff;
          font-size: 19px;
          font-weight: 700;
        }

        .antimate-brand h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        .antimate-brand p {
          margin: 3px 0 0;
          font-size: 12px;
          color: var(--text-secondary, #737980);
        }

        .antimate-header-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .connection-dot {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--text-secondary, #737980);
        }

        .connection-dot span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7c858d;
        }

        .connection-dot.ready span {
          background: #22a06b;
        }

        .connection-dot.recording span {
          background: #e5484d;
          animation: antimatePulse 1s infinite;
        }

        .connection-dot.thinking span,
        .connection-dot.uploading span {
          background: #d99820;
          animation: antimatePulse 1.2s infinite;
        }

        .connection-dot.error span {
          background: #e5484d;
        }

        .clear-button {
          border: 0;
          background: transparent;
          color: var(--text-secondary, #737980);
          font-size: 12px;
          cursor: pointer;
          padding: 7px 8px;
          border-radius: 6px;
        }

        .clear-button:hover:not(:disabled) {
          background: var(--hover-bg, #eef0f2);
          color: var(--text-primary, #17191c);
        }

        .clear-button:disabled {
          opacity: 0.35;
          cursor: default;
        }

        /* ================================================================
           CHAT
        ================================================================ */

        .antimate-chat {
          flex: 1;
          overflow-y: auto;
          padding: 28px 4px;
          min-height: 300px;
        }

        .message-list {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .message-row {
          display: flex;
          gap: 12px;
          margin-bottom: 26px;
          align-items: flex-start;
        }

        .user-row {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .assistant-avatar {
          background: var(--primary-color, #20252b);
          color: #fff;
        }

        .user-avatar {
          background: var(--secondary-bg, #e9ecef);
          color: var(--text-primary, #30343a);
        }

        .message-content {
          max-width: min(76%, 700px);
        }

        .user-row .message-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-name {
          color: var(--text-secondary, #737980);
          font-size: 11px;
          margin: 0 0 6px;
        }

        .message-bubble {
          line-height: 1.55;
          font-size: 14px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .assistant-message {
          color: var(--text-primary, #17191c);
        }

        .user-message {
          background: var(--user-message-bg, #e9edf1);
          border-radius: 13px;
          padding: 10px 14px;
          color: var(--text-primary, #17191c);
        }

        .message-meta {
          display: flex;
          gap: 9px;
          margin-top: 6px;
          font-size: 10px;
          color: var(--text-secondary, #8a9096);
        }

        .message-meta span + span {
          position: relative;
          padding-left: 9px;
        }

        .message-meta span + span::before {
          content: "•";
          position: absolute;
          left: 0;
        }

        /* ================================================================
           VOICE MESSAGE
        ================================================================ */

        .voice-message-label {
          font-size: 11px;
          color: var(--text-secondary, #737980);
          margin-bottom: 7px;
        }

        .voice-transcript {
          margin-bottom: 9px;
          padding-left: 9px;
          border-left: 2px solid var(--border-color, #dfe3e7);
          color: var(--text-secondary, #646a70);
          font-size: 12px;
        }

        .voice-transcript span {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 3px;
          color: var(--text-secondary, #858b91);
        }

        /* ================================================================
           TYPING
        ================================================================ */

        .typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 7px 0;
        }

        .typing span {
          width: 5px;
          height: 5px;
          background: #858b91;
          border-radius: 50%;
          animation: antimateTyping 1.2s infinite;
        }

        .typing span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes antimateTyping {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }

          30% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        @keyframes antimatePulse {
          0% {
            opacity: 1;
          }

          50% {
            opacity: 0.35;
          }

          100% {
            opacity: 1;
          }
        }

        /* ================================================================
           WELCOME
        ================================================================ */

        .antimate-welcome {
          max-width: 650px;
          margin: 8vh auto 0;
          text-align: center;
        }

        .welcome-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 17px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-color, #20252b);
          color: #fff;
          font-size: 21px;
        }

        .antimate-welcome h2 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.5px;
        }

        .antimate-welcome p {
          max-width: 520px;
          margin: 10px auto 22px;
          line-height: 1.6;
          font-size: 14px;
          color: var(--text-secondary, #737980);
        }

        .welcome-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .welcome-actions button {
          border: 1px solid var(--border-color, #e0e3e6);
          background: var(--surface, #fff);
          color: var(--text-primary, #33373c);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
        }

        .welcome-actions button:hover {
          background: var(--hover-bg, #f0f2f4);
        }

        /* ================================================================
           ERROR
        ================================================================ */

        .antimate-error {
          width: 100%;
          max-width: 900px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 11px;
          border: 1px solid #efc8ca;
          background: #fff7f7;
          color: #a12a30;
          border-radius: 8px;
          font-size: 12px;
          box-sizing: border-box;
        }

        .antimate-error button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 17px;
          cursor: pointer;
        }

        /* ================================================================
           INPUT
        ================================================================ */

        .antimate-input-area {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .antimate-input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          border: 1px solid var(--border-color, #dfe3e7);
          background: var(--surface, #fff);
          border-radius: 13px;
          padding: 7px;
          box-sizing: border-box;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .antimate-input-wrapper:focus-within {
          border-color: #aeb5bc;
          box-shadow: 0 0 0 3px rgba(80, 90, 100, 0.06);
        }

        .antimate-input-wrapper textarea {
          flex: 1;
          min-width: 0;
          resize: none;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary, #17191c);
          font-family: inherit;
          font-size: 14px;
          line-height: 1.45;
          padding: 9px 8px;
          max-height: 140px;
        }

        .antimate-input-wrapper textarea::placeholder {
          color: #9aa0a6;
        }

        .input-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .voice-button,
        .send-button {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
        }

        .voice-button {
          background: transparent;
          color: var(--text-secondary, #70767c);
        }

        .voice-button:hover:not(:disabled) {
          background: var(--hover-bg, #eef0f2);
          color: var(--text-primary, #17191c);
        }

        .voice-button.recording {
          background: #fce8e9;
          color: #c92d34;
          animation: antimateRecording 1.2s infinite;
        }

        .send-button {
          background: var(--primary-color, #20252b);
          color: #fff;
          font-size: 19px;
        }

        .send-button:hover:not(:disabled) {
          opacity: 0.86;
        }

        .voice-button:disabled,
        .send-button:disabled {
          opacity: 0.35;
          cursor: default;
        }

        @keyframes antimateRecording {
          0% {
            box-shadow: 0 0 0 0 rgba(201, 45, 52, 0.2);
          }

          70% {
            box-shadow: 0 0 0 7px rgba(201, 45, 52, 0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(201, 45, 52, 0);
          }
        }

        .input-hint {
          display: flex;
          justify-content: center;
          gap: 7px;
          padding-top: 8px;
          font-size: 10px;
          color: #92979d;
        }

        /* ================================================================
           DARK THEME
           Uses common variables so it follows the rest of the app when
           the application exposes dark-mode variables.
        ================================================================ */

        :global(.dark) .antimate-page,
        [data-theme="dark"] .antimate-page {
          background: #111315;
          color: #f1f3f4;
        }

        [data-theme="dark"] .antimate-header {
          border-color: #292d31;
        }

        [data-theme="dark"] .antimate-brand p,
        [data-theme="dark"] .connection-dot,
        [data-theme="dark"] .message-name,
        [data-theme="dark"] .message-meta,
        [data-theme="dark"] .antimate-welcome p,
        [data-theme="dark"] .input-hint {
          color: #8e959c;
        }

        [data-theme="dark"] .user-message {
          background: #292d31;
          color: #f1f3f4;
        }

        [data-theme="dark"] .welcome-actions button {
          background: #191c1f;
          border-color: #30353a;
          color: #e8eaec;
        }

        [data-theme="dark"] .welcome-actions button:hover {
          background: #24282c;
        }

        [data-theme="dark"] .antimate-input-wrapper {
          background: #191c1f;
          border-color: #30353a;
        }

        [data-theme="dark"] .antimate-input-wrapper textarea {
          color: #f1f3f4;
        }

        [data-theme="dark"] .user-avatar {
          background: #292d31;
          color: #e8eaec;
        }

        [data-theme="dark"] .antimate-error {
          background: #241719;
          border-color: #54292c;
          color: #ff8d92;
        }

        /* ================================================================
           MOBILE
        ================================================================ */

        @media (max-width: 700px) {
          .antimate-shell {
            min-height: 100vh;
            padding: 12px 12px 14px;
          }

          .antimate-header {
            min-height: 55px;
            padding-bottom: 11px;
          }

          .antimate-logo {
            width: 36px;
            height: 36px;
            border-radius: 9px;
          }

          .antimate-brand h1 {
            font-size: 15px;
          }

          .antimate-brand p {
            font-size: 10px;
          }

          .connection-dot {
            font-size: 10px;
          }

          .clear-button {
            display: none;
          }

          .antimate-chat {
            padding: 20px 0;
          }

          .message-content {
            max-width: 82%;
          }

          .antimate-welcome {
            margin-top: 12vh;
            padding: 0 10px;
          }

          .antimate-welcome h2 {
            font-size: 20px;
          }

          .antimate-welcome p {
            font-size: 13px;
          }

          .input-hint {
            font-size: 9px;
          }

          .input-hint span:nth-child(2),
          .input-hint span:nth-child(4) {
            display: none;
          }
        }

        @media (max-width: 430px) {
          .antimate-header-actions .connection-dot {
            font-size: 0;
          }

          .antimate-header-actions .connection-dot span {
            width: 8px;
            height: 8px;
          }

          .message-row {
            gap: 8px;
          }

          .message-avatar {
            width: 27px;
            height: 27px;
            flex-basis: 27px;
          }

          .message-bubble {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}