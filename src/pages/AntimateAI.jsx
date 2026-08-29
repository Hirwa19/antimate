import React, { useEffect, useRef, useState } from "react";

/* ============================================================
   ANTIMATE AI
   Voice + Text
   Native CSS only
   ============================================================ */

const ANTIMATE_API =
  import.meta.env.VITE_ANTIMATE_AI_URL ||
  "https://antimate-ai.hf.space";

const MAX_RECORDING_SECONDS = 30;

const THINKING_MESSAGES = [
  "Aah, reka ntekerezeho...",
  "Ndimo kureba amakuru ya system...",
  "Ndimo gusesengura ikibazo cyawe...",
  "Ndimo gutegura igisubizo...",
  "Hasigaye akanya gato...",
];

export default function AntimateAI() {
  /* ==========================================================
     TEXT STATE
     ========================================================== */

  const [text, setText] = useState("");
  const [textLoading, setTextLoading] = useState(false);
  const [textResponse, setTextResponse] = useState(null);

  /* ==========================================================
     VOICE STATE
     ========================================================== */

  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [voiceLoading, setVoiceLoading] = useState(false);

  const [voiceText, setVoiceText] = useState("");
  const [voiceAnswer, setVoiceAnswer] = useState("");
  const [voiceAudio, setVoiceAudio] = useState(null);

  const [status, setStatus] = useState("");

  /* ==========================================================
     UI STATE
     ========================================================== */

  const [activeMode, setActiveMode] = useState("voice");
  const [thinkingIndex, setThinkingIndex] = useState(0);

  /* ==========================================================
     REFS
     ========================================================== */

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const audioChunksRef = useRef([]);

  const recordingTimerRef = useRef(null);
  const thinkingTimerRef = useRef(null);

  const audioPlayerRef = useRef(null);

  /* ==========================================================
     THINKING MESSAGE ROTATION
     ========================================================== */

  useEffect(() => {
    if (!textLoading && !voiceLoading) {
      return;
    }

    thinkingTimerRef.current = setInterval(() => {
      setThinkingIndex((prev) => {
        return (prev + 1) % THINKING_MESSAGES.length;
      });
    }, 2200);

    return () => {
      clearInterval(thinkingTimerRef.current);
    };
  }, [textLoading, voiceLoading]);

  /* ==========================================================
     RECORDING TIMER
     ========================================================== */

  useEffect(() => {
    if (!recording) {
      return;
    }

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        const next = prev + 1;

        if (next >= MAX_RECORDING_SECONDS) {
          setTimeout(() => {
            stopRecording();
          }, 0);
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(recordingTimerRef.current);
    };
  }, [recording]);

  /* ==========================================================
     CLEANUP
     ========================================================== */

  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
      clearInterval(thinkingTimerRef.current);

      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (voiceAudio) {
        URL.revokeObjectURL(voiceAudio);
      }
    };
  }, []);

  /* ============================================================
     HELPERS
     ============================================================ */

  function getThinkingMessage() {
    return THINKING_MESSAGES[thinkingIndex];
  }

  function formatTime(seconds) {
    const remaining = Math.max(
      MAX_RECORDING_SECONDS - seconds,
      0
    );

    return `00:${String(remaining).padStart(2, "0")}`;
  }

  function getRecordingPercentage() {
    return Math.min(
      (recordingSeconds / MAX_RECORDING_SECONDS) * 100,
      100
    );
  }

  /* ============================================================
     FIND AUDIO MIME TYPE
     ============================================================ */

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

  /* ============================================================
     START RECORDING
     ============================================================ */

  async function startRecording() {
    if (recording || voiceLoading) {
      return;
    }

    try {
      setStatus("🎤 Tegereza gato, microphone iratangira...");
      setVoiceText("");
      setVoiceAnswer("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();

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
        const chunks = audioChunksRef.current;

        const finalMimeType =
          recorder.mimeType || mimeType || "audio/webm";

        const blob = new Blob(chunks, {
          type: finalMimeType,
        });

        audioChunksRef.current = [];

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => {
            track.stop();
          });

          mediaStreamRef.current = null;
        }

        setRecording(false);
        setRecordingSeconds(0);

        if (blob.size === 0) {
          setStatus("❌ Nta audio yafashwe.");
          return;
        }

        await sendVoiceToAntimate(blob);
      };

      recorder.onerror = () => {
        setRecording(false);
        setRecordingSeconds(0);

        setStatus(
          "❌ Habaye ikibazo mu gufata amajwi."
        );

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => {
            track.stop();
          });

          mediaStreamRef.current = null;
        }
      };

      recorder.start(250);

      setRecordingSeconds(0);
      setRecording(true);

      setStatus("🎤 Vuga mu Kinyarwanda...");

    } catch (error) {
      console.error("Microphone error:", error);

      setRecording(false);
      setRecordingSeconds(0);

      setStatus(
        "❌ Microphone ntiyabonetse cyangwa permission ntiyatanzwe."
      );
    }
  }

  /* ============================================================
     STOP RECORDING
     ============================================================ */

  function stopRecording() {
    if (!mediaRecorderRef.current) {
      return;
    }

    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    clearInterval(recordingTimerRef.current);

    setRecording(false);
  }

  /* ============================================================
     SEND VOICE TO ANTIMATE
     ============================================================ */

  async function sendVoiceToAntimate(blob) {
    setVoiceLoading(true);
    setThinkingIndex(0);

    setStatus(getThinkingMessage());

    try {
      /*
       * We intentionally send the original browser audio.
       *
       * antimateRoutes.js is responsible for converting it
       * to WAV / 16kHz / mono before sending it to ANTIMATE AI.
       */

      const formData = new FormData();

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
        "/api/antimate/voice",
        {
          method: "POST",
          body: formData,
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "Server ntiyagaruye response ya JSON."
        );
      }

      if (!response.ok || !data) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Voice request failed (${response.status})`
        );
      }

      /*
       * Expected response can contain:
       *
       * transcription
       * text
       * answer
       * answer_kinyarwanda
       * audio
       * audio_url
       *
       * We support multiple names so frontend remains
       * compatible with antimateRoutes.js versions.
       */

      const recognizedText =
        data.transcription ||
        data.text ||
        data.input_kinyarwanda ||
        data.stt ||
        "";

      const answer =
        data.answer_kinyarwanda ||
        data.answer ||
        data.response ||
        data.output ||
        "";

      setVoiceText(recognizedText);
      setVoiceAnswer(answer);

      /* ========================================================
         AUDIO RESPONSE
         ======================================================== */

      const audioUrl =
        data.audio_url ||
        data.audioUrl ||
        data.audio ||
        data.voice_url ||
        data.voiceUrl ||
        null;

      if (audioUrl) {
        const finalAudioUrl = normalizeAudioUrl(
          audioUrl
        );

        setVoiceAudio(finalAudioUrl);

        /*
         * Give React time to render the <audio> element,
         * then automatically play it.
         */

        setTimeout(() => {
          playAudio(finalAudioUrl);
        }, 250);
      }

      setStatus("✅ ANTIMATE yarangije.");

    } catch (error) {
      console.error(
        "ANTIMATE voice error:",
        error
      );

      setStatus(
        `❌ ${error.message || "Voice request failed."}`
      );
    } finally {
      setVoiceLoading(false);
    }
  }

  /* ============================================================
     NORMALIZE AUDIO URL
     ============================================================ */

  function normalizeAudioUrl(url) {
    if (!url) {
      return null;
    }

    if (typeof url !== "string") {
      return null;
    }

    /*
     * Absolute URL
     */
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:")
    ) {
      return url;
    }

    /*
     * Backend-relative URL
     */
    if (url.startsWith("/")) {
      return url;
    }

    return `/${url}`;
  }

  /* ============================================================
     PLAY AUDIO
     ============================================================ */

  function playAudio(url = voiceAudio) {
    if (!url) {
      return;
    }

    /*
     * If the audio element is already rendered,
     * use it directly.
     */

    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = url;

      audioPlayerRef.current
        .play()
        .catch((error) => {
          console.warn(
            "Autoplay blocked by browser:",
            error
          );
        });

      return;
    }

    /*
     * Fallback for browsers where the element has
     * not rendered yet.
     */

    const audio = new Audio(url);

    audio.play().catch((error) => {
      console.warn(
        "Audio autoplay blocked:",
        error
      );
    });
  }

  /* ============================================================
     REPLAY
     ============================================================ */

  function replayVoice() {
    if (!audioPlayerRef.current) {
      if (voiceAudio) {
        playAudio(voiceAudio);
      }

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
  }

  /* ============================================================
     TEXT CHAT
     ============================================================ */

  async function sendText() {
    const cleanText = text.trim();

    if (!cleanText || textLoading) {
      return;
    }

    setTextLoading(true);
    setThinkingIndex(0);
    setTextResponse(null);

    setStatus(getThinkingMessage());

    try {
      const response = await fetch(
        "/api/antimate/chat",
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

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "Server ntiyagaruye JSON response."
        );
      }

      if (!response.ok || !data) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Chat request failed (${response.status})`
        );
      }

      const answer =
        data.answer_kinyarwanda ||
        data.answer ||
        data.response ||
        data.output ||
        "";

      setTextResponse({
        input: cleanText,
        answer,
        english:
          data.answer_english ||
          data.internal_english ||
          "",
        mode: data.mode || "",
      });

      setStatus("✅ ANTIMATE yarangije.");

    } catch (error) {
      console.error(
        "ANTIMATE text error:",
        error
      );

      setStatus(
        `❌ ${error.message || "Text request failed."}`
      );
    } finally {
      setTextLoading(false);
    }
  }

  /* ============================================================
     TEXT ENTER
     ============================================================ */

  function handleTextKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendText();
    }
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <style>{`
        /* ======================================================
           ANTIMATE AI
           NATIVE CSS
           ====================================================== */

        .antimate-page {
          min-height: 100%;
          width: 100%;
          box-sizing: border-box;
          padding: 28px;
          color: var(--text-primary, #111827);
          background: var(--bg-primary, #ffffff);
        }

        .antimate-container {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
        }

        /* ======================================================
           HEADER
           ====================================================== */

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
          background: var(
            --accent-color,
            #2563eb
          );
          color: white;
          font-size: 23px;
          font-weight: 800;
          box-shadow:
            0 8px 22px
            rgba(37, 99, 235, 0.18);
        }

        .antimate-title {
          margin: 0;
          font-size: 25px;
          line-height: 1.2;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .antimate-subtitle {
          margin: 4px 0 0;
          color: var(
            --text-secondary,
            #6b7280
          );
          font-size: 13px;
        }

        .antimate-status-dot {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        .antimate-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow:
            0 0 0 4px
            rgba(34, 197, 94, 0.1);
        }

        /* ======================================================
           MODE TABS
           ====================================================== */

        .antimate-tabs {
          display: inline-flex;
          padding: 4px;
          margin-bottom: 22px;
          border-radius: 10px;
          background: var(
            --bg-secondary,
            #f3f4f6
          );
          border: 1px solid var(
            --border-color,
            #e5e7eb
          );
        }

        .antimate-tab {
          border: none;
          background: transparent;
          color: var(
            --text-secondary,
            #6b7280
          );
          padding: 9px 18px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition:
            background 0.18s ease,
            color 0.18s ease;
        }

        .antimate-tab:hover {
          color: var(
            --text-primary,
            #111827
          );
        }

        .antimate-tab.active {
          background: var(
            --bg-primary,
            #ffffff
          );
          color: var(
            --accent-color,
            #2563eb
          );
          box-shadow:
            0 1px 4px
            rgba(0, 0, 0, 0.08);
        }

        /* ======================================================
           MAIN AREA
           ====================================================== */

        .antimate-main {
          border-top: 1px solid var(
            --border-color,
            #e5e7eb
          );
          padding-top: 24px;
        }

        /* ======================================================
           VOICE SECTION
           ====================================================== */

        .voice-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px 0 18px;
        }

        .voice-description {
          max-width: 550px;
          margin: 0 auto 28px;
          color: var(
            --text-secondary,
            #6b7280
          );
          font-size: 14px;
          line-height: 1.65;
        }

        /* ======================================================
           RECORD BUTTON
           ====================================================== */

        .voice-button-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .voice-button-ring {
          position: absolute;
          width: 116px;
          height: 116px;
          border-radius: 50%;
          border: 2px solid
            rgba(37, 99, 235, 0.15);
          pointer-events: none;
        }

        .voice-button-ring.recording {
          animation:
            antimatePulse 1.25s
            infinite ease-out;
          border-color:
            rgba(239, 68, 68, 0.4);
        }

        @keyframes antimatePulse {
          0% {
            transform: scale(0.92);
            opacity: 1;
          }

          70% {
            transform: scale(1.18);
            opacity: 0;
          }

          100% {
            transform: scale(1.18);
            opacity: 0;
          }
        }

        .voice-record-button {
          position: relative;
          z-index: 2;
          width: 88px;
          height: 88px;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          background: var(
            --accent-color,
            #2563eb
          );
          box-shadow:
            0 12px 30px
            rgba(37, 99, 235, 0.22);
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .voice-record-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 15px 34px
            rgba(37, 99, 235, 0.28);
        }

        .voice-record-button.recording {
          background: #ef4444;
          box-shadow:
            0 12px 30px
            rgba(239, 68, 68, 0.25);
        }

        .voice-record-button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }

        .voice-mic-icon {
          width: 34px;
          height: 34px;
        }

        .voice-stop-icon {
          width: 27px;
          height: 27px;
          border-radius: 7px;
          background: white;
        }

        /* ======================================================
           COUNTDOWN
           ====================================================== */

        .recording-countdown {
          min-height: 34px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .countdown-number {
          font-size: 20px;
          font-weight: 750;
          font-variant-numeric: tabular-nums;
          color: var(
            --text-primary,
            #111827
          );
        }

        .countdown-label {
          margin-top: 2px;
          font-size: 11px;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        .recording-progress {
          width: min(280px, 80vw);
          height: 4px;
          overflow: hidden;
          border-radius: 20px;
          background: var(
            --border-color,
            #e5e7eb
          );
          margin-bottom: 18px;
        }

        .recording-progress-bar {
          height: 100%;
          border-radius: inherit;
          background: #ef4444;
          transition: width 0.2s linear;
        }

        /* ======================================================
           VOICE STATUS
           ====================================================== */

        .voice-status {
          min-height: 24px;
          font-size: 13px;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        .thinking-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .thinking-dots {
          display: inline-flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(
            --accent-color,
            #2563eb
          );
          animation:
            antimateDots 1.2s
            infinite ease-in-out;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes antimateDots {
          0%,
          60%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        /* ======================================================
           RESPONSE
           ====================================================== */

        .response-area {
          width: 100%;
          margin-top: 24px;
          border-top: 1px solid var(
            --border-color,
            #e5e7eb
          );
          padding-top: 24px;
        }

        .response-label {
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        .response-text {
          margin: 0;
          font-size: 16px;
          line-height: 1.75;
          color: var(
            --text-primary,
            #111827
          );
          white-space: pre-wrap;
        }

        .recognized-text {
          margin-bottom: 22px;
        }

        /* ======================================================
           AUDIO PLAYER
           ====================================================== */

        .voice-audio-area {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid var(
            --border-color,
            #e5e7eb
          );
        }

        .audio-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .replay-button {
          flex-shrink: 0;
          border: 1px solid var(
            --border-color,
            #d1d5db
          );
          background: var(
            --bg-primary,
            #ffffff
          );
          color: var(
            --accent-color,
            #2563eb
          );
          width: 40px;
          height: 40px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            background 0.18s ease,
            transform 0.18s ease;
        }

        .replay-button:hover {
          background: var(
            --bg-secondary,
            #f3f4f6
          );
          transform: translateY(-1px);
        }

        .replay-icon {
          width: 18px;
          height: 18px;
        }

        .voice-audio-player {
          flex: 1;
          min-width: 0;
          height: 40px;
        }

        /* ======================================================
           TEXT CHAT
           ====================================================== */

        .text-section {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        .text-description {
          color: var(
            --text-secondary,
            #6b7280
          );
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .text-input-wrapper {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .text-input {
          flex: 1;
          resize: vertical;
          min-height: 52px;
          max-height: 180px;
          padding: 14px 15px;
          border: 1px solid var(
            --border-color,
            #d1d5db
          );
          border-radius: 10px;
          background: var(
            --bg-primary,
            #ffffff
          );
          color: var(
            --text-primary,
            #111827
          );
          outline: none;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          box-sizing: border-box;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .text-input:focus {
          border-color: var(
            --accent-color,
            #2563eb
          );
          box-shadow:
            0 0 0 3px
            rgba(37, 99, 235, 0.08);
        }

        .text-input::placeholder {
          color: #9ca3af;
        }

        .send-button {
          min-width: 105px;
          height: 52px;
          border: none;
          border-radius: 10px;
          padding: 0 17px;
          color: white;
          background: var(
            --accent-color,
            #2563eb
          );
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition:
            opacity 0.18s ease,
            transform 0.18s ease;
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .send-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .text-response {
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid var(
            --border-color,
            #e5e7eb
          );
        }

        /* ======================================================
           GLOBAL STATUS
           ====================================================== */

        .global-status {
          margin-top: 22px;
          min-height: 22px;
          text-align: center;
          font-size: 12px;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        /* ======================================================
           FOOTER
           ====================================================== */

        .antimate-footer {
          margin-top: 35px;
          padding-top: 18px;
          border-top: 1px solid var(
            --border-color,
            #e5e7eb
          );
          text-align: center;
          color: var(
            --text-secondary,
            #9ca3af
          );
          font-size: 11px;
        }

        /* ======================================================
           DARK THEME SUPPORT
           ====================================================== */

        [data-theme="dark"] .antimate-page,
        .dark .antimate-page {
          --bg-primary: #111827;
          --bg-secondary: #1f2937;
          --text-primary: #f9fafb;
          --text-secondary: #9ca3af;
          --border-color: #374151;
        }

        /* ======================================================
           MOBILE
           ====================================================== */

        @media (max-width: 700px) {
          .antimate-page {
            padding: 18px 14px;
          }

          .antimate-header {
            margin-bottom: 22px;
          }

          .antimate-title {
            font-size: 21px;
          }

          .antimate-logo {
            width: 42px;
            height: 42px;
            border-radius: 12px;
          }

          .antimate-status-dot {
            display: none;
          }

          .antimate-tabs {
            width: 100%;
          }

          .antimate-tab {
            flex: 1;
          }

          .voice-section {
            padding-top: 18px;
          }

          .text-input-wrapper {
            align-items: stretch;
            flex-direction: column;
          }

          .send-button {
            width: 100%;
          }

          .audio-row {
            align-items: stretch;
          }

          .voice-audio-player {
            min-width: 0;
          }
        }
      `}</style>

      <div className="antimate-page">
        <div className="antimate-container">

          {/* ==================================================
              HEADER
              ================================================== */}

          <header className="antimate-header">

            <div className="antimate-title-area">

              <div className="antimate-logo">
                AI
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

            <div className="antimate-status-dot">
              <span className="antimate-dot" />
              Online
            </div>

          </header>

          {/* ==================================================
              TABS
              ================================================== */}

          <div className="antimate-tabs">

            <button
              type="button"
              className={
                activeMode === "voice"
                  ? "antimate-tab active"
                  : "antimate-tab"
              }
              onClick={() => {
                setActiveMode("voice");
              }}
            >
              🎙️ Voice
            </button>

            <button
              type="button"
              className={
                activeMode === "text"
                  ? "antimate-tab active"
                  : "antimate-tab"
              }
              onClick={() => {
                setActiveMode("text");
              }}
            >
              💬 Text
            </button>

          </div>

          <main className="antimate-main">

            {/* ==================================================
                VOICE
                ================================================== */}

            {activeMode === "voice" && (
              <section className="voice-section">

                <p className="voice-description">
                  Vuga mu Kinyarwanda. ANTIMATE azumva ibyo
                  wavuze, abisesengure, hanyuma agusubize
                  mu Kinyarwanda.
                </p>

                {/* COUNTDOWN */}

                <div className="recording-countdown">

                  {recording ? (
                    <>
                      <div className="countdown-number">
                        {formatTime(recordingSeconds)}
                      </div>

                      <div className="countdown-label">
                        Igihe gisigaye
                      </div>
                    </>
                  ) : (
                    <div className="countdown-label">
                      Maximum recording: 30 seconds
                    </div>
                  )}

                </div>

                {/* PROGRESS */}

                {recording && (
                  <div className="recording-progress">
                    <div
                      className="recording-progress-bar"
                      style={{
                        width: `${getRecordingPercentage()}%`,
                      }}
                    />
                  </div>
                )}

                {/* RECORD BUTTON */}

                <div className="voice-button-wrapper">

                  <div
                    className={
                      recording
                        ? "voice-button-ring recording"
                        : "voice-button-ring"
                    }
                  />

                  <button
                    type="button"
                    className={
                      recording
                        ? "voice-record-button recording"
                        : "voice-record-button"
                    }
                    disabled={voiceLoading}
                    onClick={
                      recording
                        ? stopRecording
                        : startRecording
                    }
                    aria-label={
                      recording
                        ? "Stop recording"
                        : "Start recording"
                    }
                  >

                    {recording ? (
                      <span className="voice-stop-icon" />
                    ) : (
                      <svg
                        className="voice-mic-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="7"
                          y="3"
                          width="10"
                          height="13"
                          rx="5"
                        />

                        <path d="M4.5 11a7.5 7.5 0 0 0 15 0" />

                        <path d="M12 19v3" />

                        <path d="M8.5 22h7" />
                      </svg>
                    )}

                  </button>

                </div>

                <div className="voice-status">

                  {recording ? (
                    "🎤 Vuga... Kanda kuri button uhagarike."
                  ) : voiceLoading ? (
                    <span className="thinking-status">

                      {getThinkingMessage()}

                      <span className="thinking-dots">
                        <span />
                        <span />
                        <span />
                      </span>

                    </span>
                  ) : (
                    "Kanda kuri microphone utangire."
                  )}

                </div>

                {/* =================================================
                    VOICE RESPONSE
                    ================================================= */}

                {(voiceText ||
                  voiceAnswer ||
                  voiceAudio) && (
                  <div className="response-area">

                    {voiceText && (
                      <div className="recognized-text">

                        <div className="response-label">
                          Ibyo wavuze
                        </div>

                        <p className="response-text">
                          {voiceText}
                        </p>

                      </div>
                    )}

                    {voiceAnswer && (
                      <div>

                        <div className="response-label">
                          ANTIMATE
                        </div>

                        <p className="response-text">
                          {voiceAnswer}
                        </p>

                      </div>
                    )}

                    {voiceAudio && (
                      <div className="voice-audio-area">

                        <div className="response-label">
                          ANTIMATE Voice
                        </div>

                        <div className="audio-row">

                          <button
                            type="button"
                            className="replay-button"
                            onClick={replayVoice}
                            title="Replay"
                            aria-label="Replay ANTIMATE voice"
                          >

                            <svg
                              className="replay-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 12a9 9 0 1 0 3-6.7" />

                              <path d="M3 4v5h5" />
                            </svg>

                          </button>

                          <audio
                            ref={audioPlayerRef}
                            className="voice-audio-player"
                            src={voiceAudio}
                            controls
                            preload="auto"
                          />

                        </div>

                      </div>
                    )}

                  </div>
                )}

              </section>
            )}

            {/* ==================================================
                TEXT
                ================================================== */}

            {activeMode === "text" && (
              <section className="text-section">

                <p className="text-description">
                  Andika ikibazo cyawe mu Kinyarwanda.
                  ANTIMATE azagisubiza mu Kinyarwanda.
                </p>

                <div className="text-input-wrapper">

                  <textarea
                    className="text-input"
                    value={text}
                    onChange={(event) => {
                      setText(event.target.value);
                    }}
                    onKeyDown={handleTextKeyDown}
                    placeholder="Andika ubutumwa bwawe hano..."
                    disabled={textLoading}
                  />

                  <button
                    type="button"
                    className="send-button"
                    disabled={
                      textLoading ||
                      !text.trim()
                    }
                    onClick={sendText}
                  >
                    {textLoading
                      ? "Ndimo gutekereza..."
                      : "Ohereza"}
                  </button>

                </div>

                {/* THINKING */}

                {textLoading && (
                  <div className="global-status">

                    <span className="thinking-status">

                      {getThinkingMessage()}

                      <span className="thinking-dots">
                        <span />
                        <span />
                        <span />
                      </span>

                    </span>

                  </div>
                )}

                {/* RESPONSE */}

                {textResponse && (
                  <div className="text-response">

                    <div className="response-label">
                      Ikibazo cyawe
                    </div>

                    <p className="response-text">
                      {textResponse.input}
                    </p>

                    <div
                      style={{
                        marginTop: "22px",
                      }}
                    >

                      <div className="response-label">
                        ANTIMATE
                      </div>

                      <p className="response-text">
                        {textResponse.answer}
                      </p>

                    </div>

                  </div>
                )}

              </section>
            )}

          </main>

          {/* ==================================================
              GLOBAL STATUS
              ================================================== */}

          {!textLoading &&
            !voiceLoading &&
            status && (
              <div className="global-status">
                {status}
              </div>
            )}

          {/* ==================================================
              FOOTER
              ================================================== */}

          <footer className="antimate-footer">
            ANTIMATE AI · Kinyarwanda Intelligent Assistant
          </footer>

        </div>
      </div>
    </>
  );
}