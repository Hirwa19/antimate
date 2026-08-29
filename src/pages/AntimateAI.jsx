import React, { useEffect, useRef, useState } from "react";

/*
|--------------------------------------------------------------------------
| ANTIMATE AI
|--------------------------------------------------------------------------
| Voice + Text assistant
|
| Features:
| - 30 second voice recording countdown
| - Voice replay
| - Modern voice icon
| - Thinking/status messages
| - Text chat
| - Native CSS inside this JSX
| - No Tailwind
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

const VOICE_LIMIT_SECONDS = 30;

const THINKING_MESSAGES = [
  "Aah, reka ntekerezeho gato...",
  "Ndimo kureba amakuru ya system...",
  "Ndimo gutegura igisubizo...",
  "Mpa akanya gato, ndimo kubisesengura...",
  "Ndimo gushaka igisubizo cyiza...",
];

export default function AntimateAI() {
  // -----------------------------------------------------------------------
  // TEXT
  // -----------------------------------------------------------------------

  const [text, setText] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [textLoading, setTextLoading] = useState(false);

  // -----------------------------------------------------------------------
  // VOICE
  // -----------------------------------------------------------------------

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [voiceLoading, setVoiceLoading] = useState(false);

  const [voiceInputText, setVoiceInputText] = useState("");
  const [voiceAnswer, setVoiceAnswer] = useState("");
  const [voiceAudio, setVoiceAudio] = useState(null);

  const [statusMessage, setStatusMessage] = useState("");

  // -----------------------------------------------------------------------
  // THINKING MESSAGE
  // -----------------------------------------------------------------------

  const [thinkingIndex, setThinkingIndex] = useState(0);

  // -----------------------------------------------------------------------
  // RECORDING REFS
  // -----------------------------------------------------------------------

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const thinkingTimerRef = useRef(null);

  // -----------------------------------------------------------------------
  // CLEANUP
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopRecordingTimer();

      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
      }

      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          // recorder already stopped
        }
      }
    };
  }, []);

  // -----------------------------------------------------------------------
  // THINKING ANIMATION
  // -----------------------------------------------------------------------

  const startThinking = () => {
    setThinkingIndex(0);

    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
    }

    thinkingTimerRef.current = setInterval(() => {
      setThinkingIndex((previous) => {
        return (previous + 1) % THINKING_MESSAGES.length;
      });
    }, 2200);
  };

  const stopThinking = () => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  };

  // -----------------------------------------------------------------------
  // RECORDING TIMER
  // -----------------------------------------------------------------------

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // -----------------------------------------------------------------------
  // GET AUDIO MIME TYPE
  // -----------------------------------------------------------------------

  const getSupportedMimeType = () => {
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
  };

  // -----------------------------------------------------------------------
  // START RECORDING
  // -----------------------------------------------------------------------

  const startRecording = async () => {
    if (isRecording || voiceLoading) {
      return;
    }

    try {
      setVoiceInputText("");
      setVoiceAnswer("");
      setVoiceAudio(null);
      setStatusMessage("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatusMessage(
          "❌ Browser yawe ntabwo yemera microphone."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = getSupportedMimeType();

      const recorderOptions = mimeType
        ? { mimeType }
        : undefined;

      const recorder = new MediaRecorder(
        stream,
        recorderOptions
      );

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setStatusMessage(
          "❌ Habaye ikibazo mu gufata amajwi."
        );

        stopRecordingTimer();

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        setIsRecording(false);
      };

      recorder.onstop = async () => {
        stopRecordingTimer();

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        setIsRecording(false);

        const actualMimeType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        const blob = new Blob(
          audioChunksRef.current,
          {
            type: actualMimeType,
          }
        );

        if (!blob.size) {
          setStatusMessage(
            "❌ Nta audio yabonetse."
          );
          return;
        }

        await sendVoiceToAntimate(blob);
      };

      recorder.start(250);

      setIsRecording(true);
      setRecordingSeconds(0);
      setStatusMessage(
        "🎙️ Ndumva... vuga mu Kinyarwanda."
      );

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((previous) => {
          const next = previous + 1;

          if (next >= VOICE_LIMIT_SECONDS) {
            setTimeout(() => {
              stopRecording();
            }, 0);
          }

          return next;
        });
      }, 1000);
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      stopRecordingTimer();

      setIsRecording(false);

      if (
        error?.name ===
        "NotAllowedError"
      ) {
        setStatusMessage(
          "❌ Microphone permission ntabwo yatanzwe."
        );
      } else if (
        error?.name ===
        "NotFoundError"
      ) {
        setStatusMessage(
          "❌ Nta microphone yabonetse kuri device."
        );
      } else {
        setStatusMessage(
          `❌ Microphone error: ${
            error?.message || "Unknown error"
          }`
        );
      }
    }
  };

  // -----------------------------------------------------------------------
  // STOP RECORDING
  // -----------------------------------------------------------------------

  const stopRecording = () => {
    stopRecordingTimer();

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }
  };

  // -----------------------------------------------------------------------
  // SEND VOICE
  // -----------------------------------------------------------------------

  const sendVoiceToAntimate = async (audioBlob) => {
    setVoiceLoading(true);
    startThinking();

    setStatusMessage(
      "🧠 " + THINKING_MESSAGES[0]
    );

    try {
      /*
       * Backend route:
       *
       * POST /api/antimate/voice
       *
       * It should receive:
       * multipart/form-data
       * audio=<file>
       */

      const formData = new FormData();

      const extension =
        audioBlob.type.includes("ogg")
          ? "ogg"
          : "webm";

      formData.append(
        "audio",
        audioBlob,
        `antimate_voice.${extension}`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/antimate/voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `HTTP ${response.status}`
        );
      }

      if (!data) {
        throw new Error(
          "Server ntabwo yagaruye response."
        );
      }

      /*
       * Expected response can contain:
       *
       * {
       *   success: true,
       *   input_kinyarwanda: "...",
       *   answer_kinyarwanda: "...",
       *   audio_url: "..."
       * }
       */

      const inputText =
        data.input_kinyarwanda ||
        data.transcription ||
        data.text ||
        "";

      const answer =
        data.answer_kinyarwanda ||
        data.answer ||
        data.response ||
        "";

      setVoiceInputText(inputText);
      setVoiceAnswer(answer);

      // ---------------------------------------------------------------
      // AUDIO RESPONSE
      // ---------------------------------------------------------------

      if (data.audio_url) {
        const audioUrl =
          data.audio_url.startsWith("http")
            ? data.audio_url
            : `${API_BASE_URL}${data.audio_url}`;

        setVoiceAudio(audioUrl);
      } else if (data.audio) {
        /*
         * Supports base64 audio if backend
         * returns it directly.
         */

        const audioUrl =
          data.audio.startsWith("data:")
            ? data.audio
            : `data:audio/wav;base64,${data.audio}`;

        setVoiceAudio(audioUrl);
      } else if (data.audio_base64) {
        setVoiceAudio(
          `data:audio/wav;base64,${data.audio_base64}`
        );
      } else {
        setVoiceAudio(null);
      }

      setStatusMessage(
        "✅ ANTIMATE yagusubije."
      );
    } catch (error) {
      console.error(
        "ANTIMATE voice error:",
        error
      );

      setStatusMessage(
        `❌ ${error?.message || "Voice request failed."}`
      );
    } finally {
      stopThinking();
      setVoiceLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // SEND TEXT
  // -----------------------------------------------------------------------

  const sendTextToAntimate = async () => {
    const cleanText = text.trim();

    if (!cleanText || textLoading) {
      return;
    }

    setTextLoading(true);
    setTextAnswer("");
    startThinking();

    setStatusMessage(
      "🧠 " + THINKING_MESSAGES[0]
    );

    try {
      /*
       * Backend route:
       *
       * POST /api/antimate/text
       *
       * If your AntimateRoutes uses another
       * route, change only this URL.
       */

      const response = await fetch(
        `${API_BASE_URL}/api/antimate/text`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        data = null;
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
        "";

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      setTextAnswer(answer);

      setStatusMessage(
        "✅ ANTIMATE yagusubije."
      );
    } catch (error) {
      console.error(
        "ANTIMATE text error:",
        error
      );

      setStatusMessage(
        `❌ ${error?.message || "Text request failed."}`
      );
    } finally {
      stopThinking();
      setTextLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // ENTER KEY
  // -----------------------------------------------------------------------

  const handleTextKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendTextToAntimate();
    }
  };

  // -----------------------------------------------------------------------
  // CLEAR
  // -----------------------------------------------------------------------

  const clearConversation = () => {
    setText("");
    setTextAnswer("");

    setVoiceInputText("");
    setVoiceAnswer("");
    setVoiceAudio(null);

    setStatusMessage("");
  };

  // -----------------------------------------------------------------------
  // FORMAT TIMER
  // -----------------------------------------------------------------------

  const remainingSeconds =
    VOICE_LIMIT_SECONDS - recordingSeconds;

  const progress =
    Math.min(
      recordingSeconds /
        VOICE_LIMIT_SECONDS,
      1
    ) * 100;

  // -----------------------------------------------------------------------
  // UI
  // -----------------------------------------------------------------------

  return (
    <>
      <style>{`
        .antimate-page {
          width: 100%;
          min-height: 100%;
          padding: 28px;
          box-sizing: border-box;
          color: var(--text-primary, #172033);
          background: var(--bg-primary, #f7f8fb);
        }

        .antimate-container {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
        }

        .antimate-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .antimate-title-area {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .antimate-logo {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-color, #2563eb);
          color: white;
          box-shadow: 0 7px 18px rgba(37, 99, 235, 0.20);
        }

        .antimate-logo svg {
          width: 25px;
          height: 25px;
        }

        .antimate-title {
          margin: 0;
          font-size: 25px;
          font-weight: 700;
          letter-spacing: -0.4px;
        }

        .antimate-subtitle {
          margin: 4px 0 0;
          color: var(--text-secondary, #667085);
          font-size: 14px;
        }

        .antimate-clear {
          border: 1px solid var(--border-color, #e5e7eb);
          background: var(--bg-secondary, #ffffff);
          color: var(--text-secondary, #667085);
          padding: 9px 14px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          transition: 0.2s ease;
        }

        .antimate-clear:hover {
          color: var(--text-primary, #172033);
          border-color: var(--primary-color, #2563eb);
        }

        .antimate-status {
          min-height: 22px;
          margin-bottom: 18px;
          font-size: 14px;
          color: var(--text-secondary, #667085);
        }

        .antimate-thinking {
          display: inline-flex;
          align-items: center;
          gap: 9px;
        }

        .thinking-dots {
          display: flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--primary-color, #2563eb);
          animation: antimateDot 1.2s infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes antimateDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.35;
          }

          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .antimate-section {
          margin-bottom: 30px;
        }

        .antimate-section-title {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 650;
        }

        .antimate-text-box {
          position: relative;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          background: var(--bg-secondary, #ffffff);
          border-radius: 14px;
          padding: 12px;
          transition: border-color 0.2s ease,
                      box-shadow 0.2s ease;
        }

        .antimate-text-box:focus-within {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .antimate-textarea {
          flex: 1;
          min-height: 46px;
          max-height: 150px;
          resize: vertical;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--text-primary, #172033);
          font: inherit;
          line-height: 1.55;
          padding: 6px 4px;
        }

        .antimate-textarea::placeholder {
          color: var(--text-secondary, #98a2b3);
        }

        .antimate-send {
          min-width: 92px;
          height: 42px;
          border: 0;
          border-radius: 9px;
          background: var(--primary-color, #2563eb);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .antimate-send:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(0.96);
        }

        .antimate-send:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .antimate-answer {
          margin-top: 14px;
          padding: 15px 16px;
          border-left: 3px solid var(--primary-color, #2563eb);
          background: var(--bg-secondary, #ffffff);
          border-radius: 0 10px 10px 0;
          line-height: 1.65;
          white-space: pre-wrap;
          color: var(--text-primary, #172033);
        }

        .antimate-voice-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 0 5px;
        }

        .voice-button {
          position: relative;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          border: 1px solid var(--border-color, #e5e7eb);
          background: var(--bg-secondary, #ffffff);
          color: var(--primary-color, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .voice-button:hover:not(:disabled) {
          transform: scale(1.04);
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 9px 28px rgba(37, 99, 235, 0.15);
        }

        .voice-button.recording {
          color: #dc2626;
          border-color: #fca5a5;
          box-shadow:
            0 0 0 9px rgba(220, 38, 38, 0.07),
            0 8px 25px rgba(220, 38, 38, 0.12);
          animation: recordingPulse 1.7s infinite;
        }

        .voice-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes recordingPulse {
          0%, 100% {
            box-shadow:
              0 0 0 8px rgba(220, 38, 38, 0.06);
          }

          50% {
            box-shadow:
              0 0 0 15px rgba(220, 38, 38, 0.03);
          }
        }

        .voice-button svg {
          width: 31px;
          height: 31px;
        }

        .voice-label {
          margin-top: 13px;
          font-size: 14px;
          color: var(--text-secondary, #667085);
        }

        .recording-time {
          margin-top: 7px;
          font-size: 22px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: var(--text-primary, #172033);
        }

        .recording-limit {
          margin-top: 2px;
          font-size: 12px;
          color: var(--text-secondary, #98a2b3);
        }

        .recording-progress {
          width: min(360px, 80%);
          height: 4px;
          margin-top: 12px;
          background: var(--border-color, #e5e7eb);
          border-radius: 99px;
          overflow: hidden;
        }

        .recording-progress-inner {
          height: 100%;
          background: var(--primary-color, #2563eb);
          border-radius: inherit;
          transition: width 1s linear;
        }

        .voice-transcript {
          width: 100%;
          margin-top: 25px;
        }

        .voice-line {
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .voice-line:last-child {
          border-bottom: 0;
        }

        .voice-line-label {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #667085);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .voice-line-text {
          line-height: 1.6;
          color: var(--text-primary, #172033);
        }

        .voice-replay {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .replay-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          background: var(--bg-secondary, #ffffff);
          color: var(--text-primary, #172033);
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .replay-button:hover {
          border-color: var(--primary-color, #2563eb);
          color: var(--primary-color, #2563eb);
        }

        .replay-button svg {
          width: 17px;
          height: 17px;
        }

        .voice-player {
          flex: 1;
          min-width: 0;
          height: 40px;
        }

        .antimate-divider {
          height: 1px;
          background: var(--border-color, #e5e7eb);
          margin: 28px 0;
        }

        .antimate-footer {
          text-align: center;
          padding: 12px 0 5px;
          color: var(--text-secondary, #98a2b3);
          font-size: 12px;
        }

        @media (max-width: 700px) {
          .antimate-page {
            padding: 18px;
          }

          .antimate-header {
            align-items: flex-start;
          }

          .antimate-title {
            font-size: 21px;
          }

          .antimate-subtitle {
            font-size: 13px;
          }

          .antimate-clear {
            padding: 8px 10px;
          }

          .antimate-text-box {
            flex-direction: column;
            align-items: stretch;
          }

          .antimate-send {
            width: 100%;
          }

          .voice-replay {
            flex-direction: column;
            align-items: stretch;
          }

          .replay-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="antimate-page">
        <div className="antimate-container">

          {/* ------------------------------------------------------------ */}
          {/* HEADER                                                       */}
          {/* ------------------------------------------------------------ */}

          <div className="antimate-header">
            <div className="antimate-title-area">

              <div className="antimate-logo">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v18" />
                  <path d="M7 7.5v9" />
                  <path d="M17 7.5v9" />
                  <path d="M4 10v4" />
                  <path d="M20 10v4" />
                </svg>
              </div>

              <div>
                <h1 className="antimate-title">
                  ANTIMATE AI
                </h1>

                <p className="antimate-subtitle">
                  Umufasha wawe w'ubwenge mu Kinyarwanda
                </p>
              </div>
            </div>

            <button
              type="button"
              className="antimate-clear"
              onClick={clearConversation}
            >
              Clear
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* STATUS                                                       */}
          {/* ------------------------------------------------------------ */}

          <div className="antimate-status">
            {(textLoading || voiceLoading) ? (
              <div className="antimate-thinking">
                <span>
                  {THINKING_MESSAGES[thinkingIndex]}
                </span>

                <span className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : (
              statusMessage
            )}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* TEXT                                                         */}
          {/* ------------------------------------------------------------ */}

          <section className="antimate-section">
            <h2 className="antimate-section-title">
              Andika ubutumwa
            </h2>

            <div className="antimate-text-box">

              <textarea
                className="antimate-textarea"
                value={text}
                onChange={(event) =>
                  setText(event.target.value)
                }
                onKeyDown={handleTextKeyDown}
                placeholder="Andika icyo ushaka kubaza ANTIMATE..."
                disabled={textLoading}
                rows={2}
              />

              <button
                type="button"
                className="antimate-send"
                onClick={sendTextToAntimate}
                disabled={
                  textLoading ||
                  !text.trim()
                }
              >
                {textLoading
                  ? "Ndimo..."
                  : "Ohereza"}
              </button>
            </div>

            {textAnswer && (
              <div className="antimate-answer">
                {textAnswer}
              </div>
            )}
          </section>

          <div className="antimate-divider" />

          {/* ------------------------------------------------------------ */}
          {/* VOICE                                                        */}
          {/* ------------------------------------------------------------ */}

          <section className="antimate-section">

            <h2 className="antimate-section-title">
              Vugana na ANTIMATE
            </h2>

            <div className="antimate-voice-area">

              <button
                type="button"
                className={`voice-button ${
                  isRecording
                    ? "recording"
                    : ""
                }`}
                onClick={
                  isRecording
                    ? stopRecording
                    : startRecording
                }
                disabled={voiceLoading}
                aria-label={
                  isRecording
                    ? "Hagarika gufata amajwi"
                    : "Tangira gufata amajwi"
                }
              >
                {isRecording ? (
                  /* STOP ICON */
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect
                      x="7"
                      y="7"
                      width="10"
                      height="10"
                      rx="2"
                    />
                  </svg>
                ) : (
                  /* NEW MICROPHONE ICON */
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="8"
                      y="3"
                      width="8"
                      height="12"
                      rx="4"
                    />

                    <path d="M5 11a7 7 0 0 0 14 0" />

                    <path d="M12 18v3" />

                    <path d="M8.5 21h7" />

                    <path d="M19 8v3" />

                    <path d="M5 8v3" />
                  </svg>
                )}
              </button>

              <div className="voice-label">
                {isRecording
                  ? "Kanda hano uhagarike recording"
                  : voiceLoading
                  ? "ANTIMATE irimo gutekereza..."
                  : "Kanda utangire kuvuga"}
              </div>

              {isRecording && (
                <>
                  <div className="recording-time">
                    00:
                    {String(
                      remainingSeconds
                    ).padStart(2, "0")}
                  </div>

                  <div className="recording-limit">
                    Igihe gisigaye • max 30 seconds
                  </div>

                  <div className="recording-progress">
                    <div
                      className="recording-progress-inner"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </>
              )}

              {/* -------------------------------------------------------- */}
              {/* VOICE RESULT                                             */}
              {/* -------------------------------------------------------- */}

              {(voiceInputText ||
                voiceAnswer ||
                voiceAudio) && (
                <div className="voice-transcript">

                  {voiceInputText && (
                    <div className="voice-line">
                      <span className="voice-line-label">
                        Wavuze
                      </span>

                      <div className="voice-line-text">
                        {voiceInputText}
                      </div>
                    </div>
                  )}

                  {voiceAnswer && (
                    <div className="voice-line">
                      <span className="voice-line-label">
                        ANTIMATE
                      </span>

                      <div className="voice-line-text">
                        {voiceAnswer}
                      </div>
                    </div>
                  )}

                  {voiceAudio && (
                    <div className="voice-replay">

                      <button
                        type="button"
                        className="replay-button"
                        onClick={() => {
                          const audio =
                            new Audio(
                              voiceAudio
                            );

                          audio.play().catch(
                            (error) => {
                              console.error(
                                "Replay error:",
                                error
                              );
                            }
                          );
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                        </svg>

                        Ongera wumve
                      </button>

                      <audio
                        className="voice-player"
                        src={voiceAudio}
                        controls
                        preload="metadata"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ------------------------------------------------------------ */}
          {/* FOOTER                                                       */}
          {/* ------------------------------------------------------------ */}

          <div className="antimate-footer">
            ANTIMATE AI • Kinyarwanda Intelligent Assistant
          </div>

        </div>
      </div>
    </>
  );
}