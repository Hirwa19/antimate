import React, { useEffect, useRef, useState } from "react";

/*
============================================================
 ANTIMATE AI
 Native CSS only — no Tailwind
 Voice + Text
 GPU first → backend CPU fallback
============================================================
*/

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const THINKING_MESSAGES = [
  "Ndigutekereza...",
  "Ndimo gusesengura ikibazo cyawe...",
  "Ndimo kureba amakuru ya system...",
  "Ndimo gutegura igisubizo...",
  "Mpa akanya gato...",
  "Ndimo guhuza amakuru mfite...",
];

export default function AntimateAI() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState(
    THINKING_MESSAGES[0]
  );
  const [error, setError] = useState("");

  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  /*
  ============================================================
   THEME
  ============================================================
  */

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const savedTheme =
        localStorage.getItem("theme") ||
        localStorage.getItem("antimate-theme");

      if (savedTheme === "dark") {
        root.classList.add("dark");
      } else if (savedTheme === "light") {
        root.classList.remove("dark");
      }
    };

    applyTheme();

    window.addEventListener("storage", applyTheme);

    return () => {
      window.removeEventListener("storage", applyTheme);
    };
  }, []);

  /*
  ============================================================
   THINKING ANIMATION
  ============================================================
  */

  const startThinking = () => {
    setLoading(true);
    setThinkingText(THINKING_MESSAGES[0]);

    let index = 0;

    thinkingIntervalRef.current = setInterval(() => {
      index = (index + 1) % THINKING_MESSAGES.length;
      setThinkingText(THINKING_MESSAGES[index]);
    }, 2200);
  };

  const stopThinking = () => {
    setLoading(false);

    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  /*
  ============================================================
   ADD MESSAGE
  ============================================================
  */

  const addMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        content,
        time: new Date(),
      },
    ]);
  };

  /*
  ============================================================
   TEXT CHAT
  ============================================================
  */

  const sendTextMessage = async () => {
    const cleanText = text.trim();

    if (!cleanText || loading) return;

    setError("");

    addMessage("user", cleanText);
    setText("");

    startThinking();

    try {
      const response = await fetch(
        `${API_BASE}/api/antimate/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
            message: cleanText,
            language: "rw",
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
            `Server error: ${response.status}`
        );
      }

      const answer =
        data?.answer_kinyarwanda ||
        data?.answer ||
        data?.response ||
        data?.message ||
        data?.result ||
        "";

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruje igisubizo."
        );
      }

      addMessage("assistant", answer);

      /*
       * If backend sends generated audio,
       * automatically play it.
       */
      if (data?.audio_url) {
        playAudio(data.audio_url);
      }
    } catch (err) {
      console.error("ANTIMATE TEXT ERROR:", err);

      setError(
        err?.message ||
          "Habaye ikibazo mu kuvugana na ANTIMATE."
      );
    } finally {
      stopThinking();
    }
  };

  /*
  ============================================================
   ENTER KEY
  ============================================================
  */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendTextMessage();
    }
  };

  /*
  ============================================================
   AUDIO PLAYBACK
  ============================================================
  */

  const playAudio = (url) => {
    try {
      setAudioUrl(url);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.warn(
              "Autoplay blocked:",
              err
            );
          });
        }
      }, 150);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  /*
  ============================================================
   FIND AUDIO FROM API RESPONSE
  ============================================================
  */

  const extractAudio = async (data) => {
    /*
     * Backend may return:
     *
     * audio_url
     * audio
     * audio_output
     * output_audio
     * audio_path
     */

    const audioValue =
      data?.audio_url ||
      data?.audio ||
      data?.audio_output ||
      data?.output_audio ||
      data?.audio_path;

    if (!audioValue) {
      return null;
    }

    /*
     * Already a browser URL
     */
    if (
      typeof audioValue === "string" &&
      (
        audioValue.startsWith("http://") ||
        audioValue.startsWith("https://") ||
        audioValue.startsWith("blob:")
      )
    ) {
      return audioValue;
    }

    /*
     * If backend returns a relative URL
     */
    if (
      typeof audioValue === "string" &&
      audioValue.startsWith("/")
    ) {
      return `${API_BASE}${audioValue}`;
    }

    return null;
  };

  /*
  ============================================================
   VOICE RECORDING
  ============================================================
  */

  const startRecording = async () => {
    if (recording || loading) return;

    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser yawe ntishyigikira microphone."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

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
        MediaRecorder.isTypeSupported("audio/mp4")
      ) {
        mimeType = "audio/mp4";
      }

      const recorder = new MediaRecorder(
        stream,
        mimeType
          ? {
              mimeType,
            }
          : undefined
      );

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        const finalMime =
          recorder.mimeType || "audio/webm";

        const blob = new Blob(
          audioChunksRef.current,
          {
            type: finalMime,
          }
        );

        if (!blob.size) {
          setError(
            "Nta audio yafashwe. Ongera ugerageze."
          );
          return;
        }

        await sendVoice(blob);
      };

      mediaRecorderRef.current = recorder;

      recorder.start(250);

      setRecording(true);
    } catch (err) {
      console.error(
        "MICROPHONE ERROR:",
        err
      );

      setRecording(false);

      if (
        err?.name === "NotAllowedError"
      ) {
        setError(
          "Microphone permission ntabwo yatanzwe."
        );
      } else {
        setError(
          err?.message ||
            "Microphone ntiyashoboye gufunguka."
        );
      }
    }
  };

  /*
  ============================================================
   STOP RECORDING
  ============================================================
  */

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    try {
      if (
        mediaRecorderRef.current.state !==
        "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error(
        "STOP RECORDING ERROR:",
        err
      );
    }

    setRecording(false);
  };

  /*
  ============================================================
   VOICE API
  ============================================================
  */

  const sendVoice = async (audioBlob) => {
    startThinking();
    setError("");

    try {
      const formData = new FormData();

      /*
       * Important:
       * Backend antimateRoutes.js should accept
       * field name "audio".
       */
      formData.append(
        "audio",
        audioBlob,
        "antimate_voice.webm"
      );

      formData.append(
        "language",
        "rw"
      );

      formData.append(
        "mode",
        "auto"
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
            `Voice server error: ${response.status}`
        );
      }

      /*
       * STT result
       */
      const recognizedText =
        data?.input_kinyarwanda ||
        data?.kinyarwanda_text ||
        data?.transcription ||
        data?.text ||
        "";

      /*
       * Final ANTIMATE response
       */
      const answer =
        data?.answer_kinyarwanda ||
        data?.answer ||
        data?.response ||
        data?.result ||
        "";

      if (recognizedText) {
        addMessage(
          "user",
          recognizedText
        );
      }

      if (answer) {
        addMessage(
          "assistant",
          answer
        );
      }

      /*
       * Audio response
       */
      const returnedAudio =
        await extractAudio(data);

      if (returnedAudio) {
        playAudio(returnedAudio);
      }

      if (!recognizedText && !answer) {
        throw new Error(
          "ANTIMATE ntiyagaruje text cyangwa answer."
        );
      }
    } catch (err) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Habaye ikibazo mu gutunganya voice."
      );
    } finally {
      stopThinking();
    }
  };

  /*
  ============================================================
   CLEAR CHAT
  ============================================================
  */

  const clearChat = () => {
    setMessages([]);
    setError("");
    setAudioUrl(null);
  };

  /*
  ============================================================
   FORMAT TIME
  ============================================================
  */

  const formatTime = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat(
      "rw-RW",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  };

  /*
  ============================================================
   RENDER
  ============================================================
  */

  return (
    <div className="antimate-page">

      <style>{`
        /* =====================================================
           ANTIMATE AI — NATIVE CSS
        ===================================================== */

        .antimate-page {
          min-height: 100vh;
          width: 100%;
          background: var(--bg, #f7f8fa);
          color: var(--text, #17191c);
          display: flex;
          flex-direction: column;
          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .dark .antimate-page {
          --bg: #0f1115;
          --surface: #171a20;
          --surface-2: #1d2128;
          --border: #2a2f38;
          --text: #f1f3f5;
          --muted: #9ba3ae;
          --accent: #6ea8fe;
        }

        .antimate-page {
          --surface: #ffffff;
          --surface-2: #f1f3f5;
          --border: #e2e5e9;
          --text: #17191c;
          --muted: #69717d;
          --accent: #2563eb;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .antimate-header {
          height: 68px;
          min-height: 68px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .antimate-logo {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
        }

        .antimate-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .antimate-brand-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        .antimate-brand-subtitle {
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
        }

        .antimate-online {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--muted);
        }

        .antimate-online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow:
            0 0 0 4px rgba(34, 197, 94, 0.10);
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .antimate-main {
          width: min(100%, 980px);
          margin: 0 auto;
          padding: 34px 20px 150px;
          flex: 1;
          box-sizing: border-box;
        }

        .antimate-welcome {
          padding: 14px 2px 26px;
        }

        .antimate-welcome h1 {
          margin: 0;
          font-size: clamp(25px, 4vw, 34px);
          line-height: 1.2;
          letter-spacing: -0.7px;
        }

        .antimate-welcome p {
          margin: 9px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        /* =====================================================
           CHAT
        ===================================================== */

        .antimate-chat {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .antimate-message-row {
          display: flex;
          width: 100%;
        }

        .antimate-message-row.user {
          justify-content: flex-end;
        }

        .antimate-message-row.assistant {
          justify-content: flex-start;
        }

        .antimate-message {
          max-width: min(760px, 88%);
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .antimate-message-avatar {
          width: 30px;
          height: 30px;
          min-width: 30px;
          border-radius: 9px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }

        .antimate-message-body {
          min-width: 0;
        }

        .antimate-message-content {
          padding: 12px 15px;
          border-radius: 15px;
          background: var(--surface);
          border: 1px solid var(--border);
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .antimate-message-row.user
          .antimate-message {
          flex-direction: row-reverse;
        }

        .antimate-message-row.user
          .antimate-message-content {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
          border-bottom-right-radius: 5px;
        }

        .antimate-message-row.assistant
          .antimate-message-content {
          border-bottom-left-radius: 5px;
        }

        .antimate-message-time {
          margin-top: 5px;
          font-size: 10px;
          color: var(--muted);
        }

        .antimate-message-row.user
          .antimate-message-time {
          text-align: right;
        }

        /* =====================================================
           THINKING
        ===================================================== */

        .antimate-thinking {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0 0 40px;
          color: var(--muted);
          font-size: 13px;
        }

        .thinking-dots {
          display: flex;
          gap: 4px;
        }

        .thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--muted);
          animation: antimateDot 1.3s infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.16s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.32s;
        }

        @keyframes antimateDot {
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
           ERROR
        ===================================================== */

        .antimate-error {
          margin: 15px 0;
          padding: 10px 13px;
          border-left: 3px solid #ef4444;
          background: rgba(239, 68, 68, 0.07);
          color: #dc2626;
          font-size: 13px;
          border-radius: 6px;
        }

        .dark .antimate-error {
          color: #fca5a5;
        }

        /* =====================================================
           INPUT AREA
        ===================================================== */

        .antimate-composer-wrap {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--bg) 18px
            );
          padding: 26px 20px 18px;
        }

        .antimate-composer {
          width: min(100%, 940px);
          margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 17px;
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 8px;
          box-sizing: border-box;
          box-shadow:
            0 8px 30px rgba(0, 0, 0, 0.07);
        }

        .dark .antimate-composer {
          box-shadow:
            0 8px 30px rgba(0, 0, 0, 0.25);
        }

        .antimate-textarea {
          flex: 1;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          color: var(--text);
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          min-height: 42px;
          max-height: 130px;
          padding: 10px 8px;
        }

        .antimate-textarea::placeholder {
          color: var(--muted);
        }

        .antimate-action {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            background 0.15s ease;
          font-size: 17px;
        }

        .antimate-action:hover {
          transform: translateY(-1px);
        }

        .antimate-action:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }

        .antimate-action.send {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .antimate-action.recording {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
          animation: recordingPulse 1.3s infinite;
        }

        @keyframes recordingPulse {
          0% {
            box-shadow: 0 0 0 0
              rgba(239, 68, 68, 0.4);
          }

          70% {
            box-shadow: 0 0 0 9px
              rgba(239, 68, 68, 0);
          }

          100% {
            box-shadow: 0 0 0 0
              rgba(239, 68, 68, 0);
          }
        }

        .antimate-clear {
          border: none;
          background: transparent;
          color: var(--muted);
          font-size: 12px;
          cursor: pointer;
          margin-top: 9px;
          padding: 3px 0;
        }

        .antimate-clear:hover {
          color: var(--text);
        }

        .antimate-composer-info {
          width: min(100%, 940px);
          margin: 7px auto 0;
          text-align: center;
          font-size: 10px;
          color: var(--muted);
        }

        /* =====================================================
           AUDIO
        ===================================================== */

        .antimate-audio {
          display: none;
        }

        /* =====================================================
           EMPTY STATE
        ===================================================== */

        .antimate-empty {
          padding: 65px 20px;
          text-align: center;
          color: var(--muted);
        }

        .antimate-empty-icon {
          font-size: 34px;
          margin-bottom: 14px;
        }

        .antimate-empty-title {
          color: var(--text);
          font-size: 17px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .antimate-empty-text {
          font-size: 13px;
          line-height: 1.6;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 640px) {
          .antimate-header {
            padding: 0 15px;
          }

          .antimate-main {
            padding: 24px 13px 145px;
          }

          .antimate-welcome {
            padding-bottom: 22px;
          }

          .antimate-message {
            max-width: 94%;
          }

          .antimate-message-content {
            font-size: 13px;
          }

          .antimate-composer-wrap {
            padding:
              22px 10px 12px;
          }

          .antimate-composer {
            border-radius: 15px;
          }

          .antimate-brand-subtitle {
            display: none;
          }

          .antimate-online {
            font-size: 10px;
          }
        }
      `}</style>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="antimate-header">
        <div className="antimate-brand">
          <div className="antimate-logo">
            AI
          </div>

          <div className="antimate-brand-text">
            <div className="antimate-brand-title">
              ANTIMATE AI
            </div>

            <div className="antimate-brand-subtitle">
              Umufasha wawe w'ubwenge
            </div>
          </div>
        </div>

        <div className="antimate-online">
          <span className="antimate-online-dot" />
          Online
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="antimate-main">

        <section className="antimate-welcome">
          <h1>
            Muraho 👋
          </h1>

          <p>
            Vugana na ANTIMATE mu Kinyarwanda cyangwa
            wandike ikibazo cyawe hano.
          </p>
        </section>

        {/* =================================================
            CHAT
        ================================================= */}

        <section className="antimate-chat">

          {messages.length === 0 && !loading ? (
            <div className="antimate-empty">
              <div className="antimate-empty-icon">
                🧠
              </div>

              <div className="antimate-empty-title">
                ANTIMATE yiteguye
              </div>

              <div className="antimate-empty-text">
                Tangira wandika cyangwa ukande kuri
                microphone uvuge.
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`antimate-message-row ${message.role}`}
              >
                <div className="antimate-message">

                  <div className="antimate-message-avatar">
                    {message.role === "user"
                      ? "W"
                      : "AI"}
                  </div>

                  <div className="antimate-message-body">
                    <div className="antimate-message-content">
                      {message.content}
                    </div>

                    <div className="antimate-message-time">
                      {formatTime(message.time)}
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}

          {/* THINKING */}

          {loading && (
            <div className="antimate-thinking">
              <div className="thinking-dots">
                <span />
                <span />
                <span />
              </div>

              <span>
                {thinkingText}
              </span>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="antimate-error">
              {error}
            </div>
          )}

        </section>

        {/* Hidden audio player */}

        {audioUrl && (
          <audio
            ref={audioRef}
            className="antimate-audio"
            src={audioUrl}
            controls={false}
          />
        )}

      </main>

      {/* =====================================================
          COMPOSER
      ===================================================== */}

      <div className="antimate-composer-wrap">

        <div className="antimate-composer">

          {/* MICROPHONE */}

          <button
            type="button"
            className={`antimate-action ${
              recording
                ? "recording"
                : ""
            }`}
            onClick={
              recording
                ? stopRecording
                : startRecording
            }
            disabled={loading}
            title={
              recording
                ? "Hagarika recording"
                : "Vuga"
            }
          >
            {recording ? "■" : "🎤"}
          </button>

          {/* TEXT */}

          <textarea
            className="antimate-textarea"
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={
              recording
                ? "Ndimo kumva..."
                : "Andika ubutumwa bwawe..."
            }
            disabled={
              loading || recording
            }
            rows={1}
          />

          {/* SEND */}

          <button
            type="button"
            className="antimate-action send"
            onClick={sendTextMessage}
            disabled={
              loading ||
              recording ||
              !text.trim()
            }
            title="Ohereza"
          >
            ↑
          </button>

        </div>

        {messages.length > 0 && (
          <div
            style={{
              width: "min(100%, 940px)",
              margin: "0 auto",
            }}
          >
            <button
              className="antimate-clear"
              onClick={clearChat}
              type="button"
            >
              Siba conversation
            </button>
          </div>
        )}

        <div className="antimate-composer-info">
          Enter = Ohereza · Shift + Enter = Umurongo mushya
          · 🎤 = Vuga
        </div>

      </div>

    </div>
  );
}