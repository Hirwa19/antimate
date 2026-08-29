import React, { useEffect, useRef, useState } from "react";

/*
============================================================
 ANTIMATE AI
 Frontend
 - Native CSS only
 - No Tailwind
 - Text + Voice
 - 30 second voice countdown
 - Replay ANTIMATE voice answer
 - Thinking/status messages
============================================================
*/

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const THINKING_MESSAGES = [
  "Ndigutekereza...",
  "Ndikureba amakuru ya system...",
  "Ndimo gutegura igisubizo...",
  "ANTIMATE irimo gutunganya ikibazo cyawe...",
  "Mpa akanya gato...",
];

const VOICE_MESSAGES = [
  "Ndumva ibyo uvuze...",
  "Ndimo gusesengura ijwi ryawe...",
  "Ndikureba amakuru ya system...",
  "Ndimo gutegura igisubizo...",
];

export default function AntimateAI() {
  // ==========================================================
  // TEXT STATE
  // ==========================================================

  const [text, setText] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerEnglish, setAnswerEnglish] = useState("");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");

  // ==========================================================
  // VOICE STATE
  // ==========================================================

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(30);
  const [voiceAnswer, setVoiceAnswer] = useState("");
  const [voiceAudio, setVoiceAudio] = useState(null);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");

  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [voiceThinkingIndex, setVoiceThinkingIndex] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const countdownRef = useRef(null);
  const streamRef = useRef(null);

  const textInputRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // ==========================================================
  // THINKING MESSAGE ROTATION
  // ==========================================================

  useEffect(() => {
    if (!processing) return;

    const interval = setInterval(() => {
      setThinkingIndex((previous) => {
        return (previous + 1) % THINKING_MESSAGES.length;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [processing]);

  useEffect(() => {
    if (!voiceProcessing) return;

    const interval = setInterval(() => {
      setVoiceThinkingIndex((previous) => {
        return (previous + 1) % VOICE_MESSAGES.length;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [voiceProcessing]);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (voiceAudio) {
        URL.revokeObjectURL(voiceAudio);
      }
    };
  }, [voiceAudio]);

  // ==========================================================
  // TEXT CHAT
  // ==========================================================

  const sendText = async () => {
    const cleanText = text.trim();

    if (!cleanText || processing) {
      return;
    }

    setProcessing(true);
    setStatus("");
    setAnswer("");
    setAnswerEnglish("");

    try {
      /*
       * ANTIMATE AI text endpoint
       *
       * Backend:
       * POST /api/antimate/text
       *
       * Body:
       * {
       *   "text": "..."
       * }
       */

      const response = await fetch(
        `${API_BASE_URL}/api/antimate/text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
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

      if (data.success === false) {
        throw new Error(
          data.error ||
            data.message ||
            "ANTIMATE ntiyashoboye gutanga igisubizo."
        );
      }

      const rwAnswer =
        data.answer_kinyarwanda ||
        data.answer_rw ||
        data.answer ||
        data.response ||
        "";

      const enAnswer =
        data.answer_english ||
        data.answer_en ||
        "";

      setAnswer(String(rwAnswer || "").trim());
      setAnswerEnglish(String(enAnswer || "").trim());

      setStatus("ANTIMATE yasubije neza.");
    } catch (error) {
      console.error("ANTIMATE TEXT ERROR:", error);

      setAnswer("");
      setAnswerEnglish("");

      setStatus(
        error?.message ||
          "Habaye ikibazo mu kuvugana na ANTIMATE AI."
      );
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================================
  // TEXT KEYBOARD
  // ==========================================================

  const handleTextKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendText();
    }
  };

  // ==========================================================
  // START VOICE RECORDING
  // ==========================================================

  const startRecording = async () => {
    if (isRecording || voiceProcessing) {
      return;
    }

    try {
      setVoiceStatus("");
      setVoiceAnswer("");
      setVoiceAudio(null);
      setRecordSeconds(30);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser yawe ntabwo yemera microphone."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      let mimeType = "";

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      for (const type of supportedTypes) {
        if (
          window.MediaRecorder &&
          MediaRecorder.isTypeSupported(type)
        ) {
          mimeType = type;
          break;
        }
      }

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

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        stopRecording(true);

        setVoiceStatus(
          "❌ Habaye ikibazo mu gufata amajwi."
        );
      };

      recorder.onstop = async () => {
        const actualType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        const blob = new Blob(
          audioChunksRef.current,
          {
            type: actualType,
          }
        );

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          streamRef.current = null;
        }

        if (blob.size === 0) {
          setVoiceStatus(
            "⚠️ Nta majwi yafashwe."
          );
          return;
        }

        await sendVoice(blob, actualType);
      };

      recorder.start(250);

      setIsRecording(true);
      setVoiceStatus(
        "🎙️ Vuga mu Kinyarwanda..."
      );

      // ======================================================
      // 30 SECOND COUNTDOWN
      // ======================================================

      countdownRef.current = setInterval(() => {
        setRecordSeconds((previous) => {
          if (previous <= 1) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;

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

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      setIsRecording(false);

      setVoiceStatus(
        error?.message ||
          "❌ Microphone ntiyabashije gufunguka."
      );
    }
  };

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = (silent = false) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setIsRecording(false);

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      try {
        recorder.stop();
      } catch (error) {
        console.error(
          "STOP RECORDING ERROR:",
          error
        );
      }
    } else if (!silent && !voiceProcessing) {
      setVoiceStatus(
        "⚠️ Nta majwi yafashwe."
      );
    }
  };

  // ==========================================================
  // SEND VOICE
  // ==========================================================

  const sendVoice = async (
    blob,
    mimeType
  ) => {
    setVoiceProcessing(true);
    setVoiceStatus("");

    try {
      /*
       * Backend endpoint:
       *
       * POST /api/antimate/voice
       *
       * Multipart field:
       * audio
       *
       * Backend should:
       * browser audio
       *       ↓
       * convert to WAV
       *       ↓
       * 16kHz mono
       *       ↓
       * ANTIMATE AI
       */

      const extension =
        mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("mp4")
          ? "mp4"
          : "webm";

      const formData = new FormData();

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

      if (data.success === false) {
        throw new Error(
          data.error ||
            data.message ||
            "ANTIMATE ntiyashoboye gusubiza."
        );
      }

      const recognizedText =
        data.transcription ||
        data.text ||
        data.input_kinyarwanda ||
        data.kinyarwanda_text ||
        "";

      const rwAnswer =
        data.answer_kinyarwanda ||
        data.answer_rw ||
        data.answer ||
        data.response ||
        "";

      const returnedAudio =
        data.audio_url ||
        data.audio ||
        data.voice_url ||
        data.output_audio ||
        null;

      if (rwAnswer) {
        setVoiceAnswer(
          String(rwAnswer).trim()
        );
      }

      if (returnedAudio) {
        const absoluteAudio =
          String(returnedAudio).startsWith(
            "http"
          )
            ? returnedAudio
            : `${API_BASE_URL}${returnedAudio}`;

        setVoiceAudio(absoluteAudio);
      }

      setVoiceStatus(
        recognizedText
          ? `Wavuze: "${recognizedText}"`
          : "ANTIMATE yasubije neza."
      );

      /*
       * If backend returns a base64/data URL,
       * this also supports it.
       */

      if (
        data.audio_base64 &&
        !returnedAudio
      ) {
        const audioData =
          data.audio_base64;

        const audioUrl =
          audioData.startsWith("data:")
            ? audioData
            : `data:audio/wav;base64,${audioData}`;

        setVoiceAudio(audioUrl);
      }
    } catch (error) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        error
      );

      setVoiceAnswer("");

      setVoiceStatus(
        error?.message ||
          "❌ Habaye ikibazo mu kohereza voice kuri ANTIMATE."
      );
    } finally {
      setVoiceProcessing(false);
    }
  };

  // ==========================================================
  // REPLAY ANSWER
  // ==========================================================

  const replayVoice = () => {
    if (!voiceAudio) {
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = 0;

      audioPlayerRef.current
        .play()
        .catch((error) => {
          console.error(
            "AUDIO PLAY ERROR:",
            error
          );
        });
    }
  };

  // ==========================================================
  // FORMAT COUNTDOWN
  // ==========================================================

  const formattedSeconds =
    String(recordSeconds).padStart(
      2,
      "0"
    );

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
          min-height: 100vh;
          width: 100%;
          padding: 28px 22px 50px;
          background: var(--bg-primary, #f6f8fb);
          color: var(--text-primary, #172033);
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .antimate-container {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
        }

        .antimate-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .antimate-logo {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          background: #111827;
          color: white;
          box-shadow:
            0 7px 20px rgba(17, 24, 39, 0.16);
        }

        .antimate-title {
          margin: 0;
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.5px;
        }

        .antimate-subtitle {
          margin: 3px 0 0;
          font-size: 13px;
          color: #697386;
        }

        .ai-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #697386;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow:
            0 0 0 4px rgba(34, 197, 94, 0.10);
        }

        .antimate-intro {
          margin-bottom: 25px;
        }

        .antimate-intro h2 {
          margin: 0 0 8px;
          font-size: 22px;
          letter-spacing: -0.3px;
        }

        .antimate-intro p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.65;
        }

        .mode-section {
          margin-top: 26px;
        }

        .section-label {
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .text-composer {
          border: 1px solid #e2e6ed;
          border-radius: 18px;
          background: #ffffff;
          padding: 13px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .text-composer:focus-within {
          border-color: #aeb7c7;
          box-shadow:
            0 0 0 4px rgba(17, 24, 39, 0.04);
        }

        .text-input {
          width: 100%;
          min-height: 105px;
          resize: vertical;
          border: none;
          outline: none;
          background: transparent;
          color: #172033;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.6;
        }

        .text-input::placeholder {
          color: #9aa3b2;
        }

        .composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 8px;
        }

        .composer-hint {
          color: #98a2b3;
          font-size: 12px;
        }

        .send-button {
          border: none;
          min-width: 108px;
          height: 40px;
          padding: 0 17px;
          border-radius: 10px;
          background: #111827;
          color: white;
          font-weight: 650;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .send-button:hover {
          transform: translateY(-1px);
        }

        .send-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
          transform: none;
        }

        .response-area {
          margin-top: 24px;
        }

        .response-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
          font-size: 12px;
          font-weight: 700;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .response-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #111827;
        }

        .thinking {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 17px 2px;
          color: #667085;
          font-size: 14px;
        }

        .thinking-dots {
          display: flex;
          gap: 4px;
        }

        .thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #667085;
          animation: thinkingPulse 1.2s infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes thinkingPulse {
          0%,
          70%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }

          35% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        .answer-text {
          padding: 18px 0;
          font-size: 15px;
          line-height: 1.8;
          white-space: pre-wrap;
          color: #273142;
        }

        .answer-empty {
          padding: 14px 0;
          color: #9aa3b2;
          font-size: 14px;
        }

        .voice-section {
          margin-top: 42px;
          padding-top: 28px;
          border-top: 1px solid #e5e7eb;
        }

        .voice-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .voice-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
        }

        .voice-description {
          margin: 4px 0 0;
          color: #7a8494;
          font-size: 13px;
        }

        .voice-recorder {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 205px;
          border: 1px solid #e2e6ed;
          border-radius: 20px;
          background: #ffffff;
          padding: 25px;
          text-align: center;
        }

        .voice-center {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .voice-button {
          position: relative;
          width: 76px;
          height: 76px;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: #111827;
          color: white;
          box-shadow:
            0 10px 28px rgba(17, 24, 39, 0.20);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .voice-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 14px 30px rgba(17, 24, 39, 0.25);
        }

        .voice-button.recording {
          background: #b42318;
          box-shadow:
            0 0 0 10px rgba(180, 35, 24, 0.08),
            0 12px 28px rgba(180, 35, 24, 0.22);
          animation: recordPulse 1.5s infinite;
        }

        .voice-button.processing {
          background: #4b5563;
          cursor: wait;
        }

        @keyframes recordPulse {
          0% {
            box-shadow:
              0 0 0 0 rgba(180, 35, 24, 0.18),
              0 12px 28px rgba(180, 35, 24, 0.22);
          }

          70% {
            box-shadow:
              0 0 0 13px rgba(180, 35, 24, 0),
              0 12px 28px rgba(180, 35, 24, 0.22);
          }

          100% {
            box-shadow:
              0 0 0 0 rgba(180, 35, 24, 0),
              0 12px 28px rgba(180, 35, 24, 0.22);
          }
        }

        .voice-icon {
          width: 29px;
          height: 29px;
          display: block;
        }

        .voice-countdown {
          margin-top: 15px;
          font-size: 25px;
          font-weight: 750;
          font-variant-numeric: tabular-nums;
          color: #111827;
        }

        .voice-countdown-label {
          margin-top: 2px;
          color: #8a94a3;
          font-size: 11px;
        }

        .voice-instruction {
          margin-top: 13px;
          color: #667085;
          font-size: 13px;
        }

        .voice-processing {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 15px;
          color: #667085;
          font-size: 13px;
        }

        .mini-loader {
          width: 14px;
          height: 14px;
          border: 2px solid #d6dae1;
          border-top-color: #111827;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .voice-status {
          margin-top: 13px;
          color: #667085;
          font-size: 12px;
          line-height: 1.5;
        }

        .voice-answer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eceff3;
        }

        .voice-answer-text {
          color: #273142;
          font-size: 15px;
          line-height: 1.75;
          white-space: pre-wrap;
        }

        .audio-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 15px;
        }

        .replay-button {
          height: 38px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #dfe3e9;
          border-radius: 9px;
          background: #ffffff;
          color: #273142;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease;
        }

        .replay-button:hover {
          background: #f8fafc;
          border-color: #cdd3dc;
        }

        .audio-player {
          display: none;
        }

        .error-message {
          margin-top: 12px;
          padding: 11px 13px;
          border-left: 3px solid #b42318;
          background: #fff7f6;
          color: #9f2017;
          font-size: 13px;
          line-height: 1.5;
          border-radius: 5px;
        }

        .success-message {
          margin-top: 10px;
          color: #347a4b;
          font-size: 12px;
        }

        .footer-note {
          margin-top: 42px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #98a2b3;
          font-size: 11px;
        }

        @media (max-width: 700px) {
          .antimate-page {
            padding: 20px 15px 35px;
          }

          .antimate-header {
            align-items: flex-start;
          }

          .antimate-title {
            font-size: 22px;
          }

          .ai-status {
            display: none;
          }

          .composer-footer {
            align-items: flex-end;
          }

          .composer-hint {
            max-width: 60%;
          }

          .voice-recorder {
            min-height: 190px;
          }
        }
      `}</style>

      <div className="antimate-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="antimate-header">
          <div className="antimate-brand">
            <div className="antimate-logo">
              ✦
            </div>

            <div>
              <h1 className="antimate-title">
                ANTIMATE AI
              </h1>

              <p className="antimate-subtitle">
                Intelligent Kinyarwanda Assistant
              </p>
            </div>
          </div>

          <div className="ai-status">
            <span className="status-dot" />
            <span>AI Online</span>
          </div>
        </header>

        {/* ====================================================
            INTRO
        ==================================================== */}

        <section className="antimate-intro">
          <h2>
            Muraho, ndi ANTIMATE.
          </h2>

          <p>
            Mubaze ikibazo cyangwa muvugane nanjye mu Kinyarwanda.
            Nzagufasha gusesengura amakuru no kubona igisubizo.
          </p>
        </section>

        {/* ====================================================
            TEXT
        ==================================================== */}

        <section className="mode-section">
          <div className="section-label">
            Andika ikibazo
          </div>

          <div className="text-composer">
            <textarea
              ref={textInputRef}
              className="text-input"
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              onKeyDown={handleTextKeyDown}
              placeholder="Andika ubutumwa bwawe mu Kinyarwanda..."
              disabled={processing}
            />

            <div className="composer-footer">
              <span className="composer-hint">
                Enter = Ohereza
              </span>

              <button
                type="button"
                className="send-button"
                onClick={sendText}
                disabled={
                  processing ||
                  !text.trim()
                }
              >
                {processing
                  ? "Ndimo..."
                  : "Ohereza"}
              </button>
            </div>
          </div>

          {/* TEXT RESPONSE */}

          <div className="response-area">
            <div className="response-label">
              <span className="response-dot" />
              ANTIMATE
            </div>

            {processing && (
              <div className="thinking">
                <div className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span>
                  {
                    THINKING_MESSAGES[
                      thinkingIndex
                    ]
                  }
                </span>
              </div>
            )}

            {!processing && answer && (
              <>
                <div className="answer-text">
                  {answer}
                </div>

                {status && (
                  <div className="success-message">
                    {status}
                  </div>
                )}
              </>
            )}

            {!processing &&
              !answer &&
              status && (
                <div className="error-message">
                  {status}
                </div>
              )}
          </div>
        </section>

        {/* ====================================================
            VOICE
        ==================================================== */}

        <section className="voice-section">
          <div className="voice-header">
            <div>
              <h3 className="voice-title">
                Vugana na ANTIMATE
              </h3>

              <p className="voice-description">
                Vuga mu Kinyarwanda. Ufite amasegonda 30.
              </p>
            </div>
          </div>

          <div className="voice-recorder">
            <div className="voice-center">

              <button
                type="button"
                className={`voice-button ${
                  isRecording
                    ? "recording"
                    : ""
                } ${
                  voiceProcessing
                    ? "processing"
                    : ""
                }`}
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }}
                disabled={voiceProcessing}
                aria-label={
                  isRecording
                    ? "Stop recording"
                    : "Start recording"
                }
              >
                {isRecording ? (
                  /*
                   * STOP ICON
                   */
                  <svg
                    className="voice-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="7"
                      y="7"
                      width="10"
                      height="10"
                      rx="2"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  /*
                   * NEW VOICE ICON
                   * Stylized waveform/microphone
                   */
                  <svg
                    className="voice-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 15.5C13.93 15.5 15.5 13.93 15.5 12V7.5C15.5 5.57 13.93 4 12 4C10.07 4 8.5 5.57 8.5 7.5V12C8.5 13.93 10.07 15.5 12 15.5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />

                    <path
                      d="M5.5 11.5V12C5.5 15.59 8.41 18.5 12 18.5C15.59 18.5 18.5 15.59 18.5 12V11.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    <path
                      d="M12 18.5V21"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    <path
                      d="M9 21H15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>

              {isRecording && (
                <>
                  <div className="voice-countdown">
                    {formattedSeconds}s
                  </div>

                  <div className="voice-countdown-label">
                    igihe gisigaye
                  </div>
                </>
              )}

              {!isRecording &&
                !voiceProcessing && (
                  <div className="voice-instruction">
                    Kanda kuri microphone utangire kuvuga
                  </div>
                )}

              {isRecording && (
                <div className="voice-instruction">
                  Kanda nanone uhagarike gufata amajwi
                </div>
              )}

              {voiceProcessing && (
                <div className="voice-processing">
                  <span className="mini-loader" />

                  <span>
                    {
                      VOICE_MESSAGES[
                        voiceThinkingIndex
                      ]
                    }
                  </span>
                </div>
              )}

              {voiceStatus && (
                <div className="voice-status">
                  {voiceStatus}
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              VOICE ANSWER
          ================================================== */}

          {voiceAnswer && (
            <div className="voice-answer">

              <div className="response-label">
                <span className="response-dot" />
                ANTIMATE Voice Answer
              </div>

              <div className="voice-answer-text">
                {voiceAnswer}
              </div>

              {voiceAudio && (
                <div className="audio-controls">

                  <button
                    type="button"
                    className="replay-button"
                    onClick={replayVoice}
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 4.5V19.5L19 12L5 4.5Z"
                        fill="currentColor"
                      />
                    </svg>

                    Ongera wumve
                  </button>

                  <audio
                    ref={audioPlayerRef}
                    className="audio-player"
                    src={voiceAudio}
                    preload="auto"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="footer-note">
          ANTIMATE AI · Kinyarwanda Intelligent Assistant
        </div>

      </div>
    </div>
  );
}