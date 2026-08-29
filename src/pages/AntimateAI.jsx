import React, { useEffect, useRef, useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";

/*
============================================================
ANTIMATE AI
============================================================

FEATURES
- Text chat
- Voice recording max 30 seconds
- 30s countdown
- Voice transcript appears on USER side
- AI voice answer appears on AI side
- AI voice automatically plays once
- Replay button remains available
- Fixed bottom composer
- Voice icon when text is empty
- Send icon when typing
- Thinking/status messages
- O-shaped ANTIMATE animated logo
- Theme controlled by AppSettingsContext
- Language controlled by AppSettingsContext
- Native CSS only
============================================================
*/

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const ANTIMATE_VOICE_ENDPOINT =
  `${API_BASE}/api/antimate/voice`;

const ANTIMATE_TEXT_ENDPOINT =
  `${API_BASE}/api/antimate/chat`;

const MAX_RECORDING_SECONDS = 30;

/*
============================================================
ANTIMATE O LOGO
============================================================

This is the reusable O-shaped animated ANTIMATE mark.
*/

function AntimateLogo({ size = 42, small = false }) {
  return (
    <div
      className={`antimate-logo-mark ${
        small ? "antimate-logo-small" : ""
      }`}
      style={{
        width: size,
        height: size,
      }}
      aria-label="ANTIMATE"
    >
      <div className="antimate-logo-orbit antimate-logo-orbit-one" />
      <div className="antimate-logo-orbit antimate-logo-orbit-two" />

      <div className="antimate-logo-core">
        <div className="antimate-logo-inner" />
      </div>
    </div>
  );
}

/*
============================================================
ICON COMPONENTS
============================================================
*/

function MicIcon({ size = 21 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="8" y="3" width="8" height="12" rx="4" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function StopIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  );
}

function SendIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

function PlayIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="7 4 20 12 7 20 7 4" />
    </svg>
  );
}

function PauseIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="7" y="5" width="3.5" height="14" rx="1" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
    </svg>
  );
}

function SoundWaveIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 4v16" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </svg>
  );
}

/*
============================================================
VOICE WAVE
============================================================
*/

function VoiceWave() {
  return (
    <span className="antimate-voice-wave" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

/*
============================================================
MAIN COMPONENT
============================================================
*/

export default function AntimateAI() {
  const { theme, isDark, language } = useAppSettings();

  /*
  ------------------------------------------------------------
  MESSAGES
  ------------------------------------------------------------
  */

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [isSending, setIsSending] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [thinkingText, setThinkingText] = useState("");

  const [audioPlayingId, setAudioPlayingId] = useState(null);

  const [recordingError, setRecordingError] = useState("");

  /*
  ------------------------------------------------------------
  REFS
  ------------------------------------------------------------
  */

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const recordingTimerRef = useRef(null);

  const audioRefs = useRef({});

  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);

  /*
  ------------------------------------------------------------
  THEME
  ------------------------------------------------------------

  We intentionally use the theme from AppSettingsContext.
  Browser/system theme is NOT used.
  */

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    document.body.setAttribute(
      "data-theme",
      theme
    );
  }, [theme]);

  /*
  ------------------------------------------------------------
  AUTO SCROLL
  ------------------------------------------------------------
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, thinkingText]);

  /*
  ------------------------------------------------------------
  CLEANUP
  ------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      stopRecordingTimer();

      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      Object.values(audioRefs.current).forEach(
        (audio) => {
          try {
            audio.pause();
            audio.src = "";
          } catch (_) {}
        }
      );
    };
  }, []);

  /*
  ============================================================
  THINKING
  ============================================================
  */

  const startThinking = (type = "text") => {
    if (language === "rw") {
      setThinkingText(
        type === "voice"
          ? "🎤 Ndumva ibyo uvuze..."
          : "🧠 Ndigutekereza..."
      );

      return;
    }

    setThinkingText(
      type === "voice"
        ? "🎤 Listening..."
        : "🧠 Thinking..."
    );
  };

  const stopThinking = () => {
    setThinkingText("");
  };

  /*
  ============================================================
  RECORDING TIMER
  ============================================================
  */

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const startRecordingTimer = () => {
    stopRecordingTimer();

    setRecordingSeconds(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((previous) => {
        const next = previous + 1;

        if (next >= MAX_RECORDING_SECONDS) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;

          setTimeout(() => {
            stopVoiceRecording();
          }, 50);

          return MAX_RECORDING_SECONDS;
        }

        return next;
      });
    }, 1000);
  };

  /*
  ============================================================
  FORMAT TIME
  ============================================================
  */

  const formatRecordingTime = (seconds) => {
    const remaining = Math.max(
      0,
      MAX_RECORDING_SECONDS - seconds
    );

    const mins = Math.floor(remaining / 60);

    const secs = remaining % 60;

    return `${String(mins).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  /*
  ============================================================
  MIME TYPE
  ============================================================
  */

  const getSupportedMimeType = () => {
    if (
      typeof MediaRecorder === "undefined" ||
      !MediaRecorder.isTypeSupported
    ) {
      return "";
    }

    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "";
  };

  /*
  ============================================================
  START RECORDING
  ============================================================
  */

  const startVoiceRecording = async () => {
    if (isSending || isRecording) return;

    setRecordingError("");

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          language === "rw"
            ? "Browser ntabwo ishyigikira microphone."
            : "This browser does not support microphone access."
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

      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopRecordingTimer();

        stream
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;

        mediaRecorderRef.current = null;

        setIsRecording(false);

        setRecordingSeconds(0);

        if (!chunks.length) {
          setRecordingError(
            language === "rw"
              ? "Nta audio yafashwe. Ongera ugerageze."
              : "No audio was recorded. Please try again."
          );

          return;
        }

        const finalType =
          recorder.mimeType ||
          "audio/webm";

        const blob = new Blob(chunks, {
          type: finalType,
        });

        await sendVoice(blob);
      };

      recorder.onerror = () => {
        stopRecordingTimer();

        stream
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;

        mediaRecorderRef.current = null;

        setIsRecording(false);

        setRecordingSeconds(0);

        setRecordingError(
          language === "rw"
            ? "Habaye ikibazo mu gufata amajwi."
            : "There was a problem recording audio."
        );
      };

      mediaRecorderRef.current = recorder;

      recorder.start();

      setIsRecording(true);

      startRecordingTimer();
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      setIsRecording(false);

      setRecordingSeconds(0);

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }

      setRecordingError(
        error?.message ||
          (language === "rw"
            ? "Microphone ntiyabashije gufunguka."
            : "Microphone could not be opened.")
      );
    }
  };

  /*
  ============================================================
  STOP RECORDING
  ============================================================
  */

  const stopVoiceRecording = () => {
    stopRecordingTimer();

    const recorder =
      mediaRecorderRef.current;

    if (!recorder) {
      setIsRecording(false);
      setRecordingSeconds(0);
      return;
    }

    if (recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch (error) {
        console.error(
          "Stopping recorder failed:",
          error
        );
      }
    }
  };

  /*
  ============================================================
  RESPONSE PARSER
  ============================================================
  */

  const parseResponse = async (response) => {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      return await response.json();
    }

    const raw = await response.text();

    try {
      return JSON.parse(raw);
    } catch (_) {
      return {
        success: false,
        error:
          raw ||
          "Invalid server response",
      };
    }
  };

  /*
  ============================================================
  RESPONSE EXTRACTION
  ============================================================
  */

  const extractAnswer = (data) => {
    if (!data) return "";

    return (
      data.answer_kinyarwanda ||
      data.answer ||
      data.text ||
      data.response ||
      data.message ||
      data.output ||
      ""
    );
  };

  /*
  ============================================================
  ADD USER MESSAGE
  ============================================================
  */

  const addUserMessage = ({
    text: messageText,
    voice = false,
  }) => {
    const id =
      `user-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    const message = {
      id,
      role: "user",
      text: messageText,
      voice,
      timestamp: new Date(),
    };

    setMessages((previous) => [
      ...previous,
      message,
    ]);

    return message;
  };

  /*
  ============================================================
  ADD AI MESSAGE
  ============================================================
  */

  const addAIMessage = ({
    text: messageText,
    audioUrl = null,
    autoPlay = false,
  }) => {
    const id =
      `ai-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    const message = {
      id,
      role: "assistant",
      text: messageText,
      audioUrl,
      voice: Boolean(audioUrl),
      timestamp: new Date(),
    };

    setMessages((previous) => [
      ...previous,
      message,
    ]);

    if (audioUrl && autoPlay) {
      setTimeout(() => {
        playVoice(id, audioUrl);
      }, 150);
    }

    return message;
  };

  /*
  ============================================================
  TEXT SEND
  ============================================================
  */

  const sendText = async () => {
    const cleanText = text.trim();

    if (
      !cleanText ||
      isSending ||
      isRecording
    ) {
      return;
    }

    setText("");

    if (inputRef.current) {
      inputRef.current.style.height =
        "auto";
    }

    addUserMessage({
      text: cleanText,
      voice: false,
    });

    setIsSending(true);

    startThinking("text");

    try {
      const response = await fetch(
        ANTIMATE_TEXT_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
            message: cleanText,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (
        !response.ok ||
        data?.success === false
      ) {
        throw new Error(
          data?.error ||
            `Request failed (${response.status})`
        );
      }

      const answer =
        extractAnswer(data);

      if (!answer) {
        throw new Error(
          language === "rw"
            ? "ANTIMATE ntiyagaruye igisubizo."
            : "ANTIMATE did not return an answer."
        );
      }

      addAIMessage({
        text: answer,
        audioUrl:
          data.audio_url ||
          data.audio ||
          null,
        autoPlay: false,
      });
    } catch (error) {
      console.error(
        "Text request error:",
        error
      );

      addAIMessage({
        text:
          language === "rw"
            ? "Mbabarira, habaye ikibazo mu kubona igisubizo. Ongera ugerageze."
            : "Sorry, there was a problem getting a response. Please try again.",
      });
    } finally {
      stopThinking();

      setIsSending(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  /*
  ============================================================
  VOICE SEND
  ============================================================
  */

  const sendVoice = async (blob) => {
    setIsSending(true);

    startThinking("voice");

    try {
      const formData = new FormData();

      const extension =
        blob.type.includes("ogg")
          ? "ogg"
          : blob.type.includes("mp4")
          ? "mp4"
          : "webm";

      formData.append(
        "audio",
        blob,
        `antimate_voice.${extension}`
      );

      const response = await fetch(
        ANTIMATE_VOICE_ENDPOINT,
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await parseResponse(response);

      if (
        !response.ok ||
        data?.success === false
      ) {
        throw new Error(
          data?.error ||
            `Voice request failed (${response.status})`
        );
      }

      const transcript =
        data.input_kinyarwanda ||
        data.transcript ||
        data.transcription ||
        data.text ||
        "";

      const answer =
        data.answer_kinyarwanda ||
        data.answer ||
        data.response ||
        "";

      if (transcript) {
        addUserMessage({
          text: transcript,
          voice: true,
        });
      }

      if (!answer) {
        throw new Error(
          language === "rw"
            ? "ANTIMATE ntiyagaruye voice answer."
            : "ANTIMATE did not return a voice answer."
        );
      }

      const audioUrl =
        data.audio_url ||
        data.audio ||
        data.output_audio ||
        data.voice_url ||
        null;

      addAIMessage({
        text: answer,
        audioUrl,
        autoPlay: Boolean(audioUrl),
      });
    } catch (error) {
      console.error(
        "Voice request error:",
        error
      );

      addAIMessage({
        text:
          language === "rw"
            ? "Mbabarira, sinabashije kumva neza cyangwa kubona igisubizo. Ongera uvuge."
            : "Sorry, I could not understand you or get a response. Please try again.",
      });
    } finally {
      stopThinking();

      setIsSending(false);
    }
  };

  /*
  ============================================================
  PLAY VOICE
  ============================================================
  */

  const playVoice = async (
    messageId,
    url
  ) => {
    if (!url) return;

    try {
      Object.entries(
        audioRefs.current
      ).forEach(([id, audio]) => {
        if (id !== messageId) {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch (_) {}
        }
      });

      let audio =
        audioRefs.current[messageId];

      if (!audio) {
        audio = new Audio(url);

        audio.preload = "auto";

        audio.onplay = () => {
          setAudioPlayingId(
            messageId
          );
        };

        audio.onended = () => {
          setAudioPlayingId(null);
        };

        audio.onerror = () => {
          setAudioPlayingId(null);
        };

        audioRefs.current[messageId] =
          audio;
      }

      setAudioPlayingId(messageId);

      audio.currentTime = 0;

      await audio.play();
    } catch (error) {
      console.error(
        "Audio playback error:",
        error
      );

      setAudioPlayingId(null);
    }
  };

  /*
  ============================================================
  REPLAY
  ============================================================
  */

  const replayVoice = (message) => {
    if (!message?.audioUrl) return;

    playVoice(
      message.id,
      message.audioUrl
    );
  };

  /*
  ============================================================
  INPUT
  ============================================================
  */

  const handleInputChange = (event) => {
    const value = event.target.value;

    setText(value);

    const input = event.target;

    input.style.height = "auto";

    input.style.height =
      `${Math.min(
        input.scrollHeight,
        120
      )}px`;
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendText();
    }
  };

  /*
  ============================================================
  ERROR AUTO CLEAR
  ============================================================
  */

  useEffect(() => {
    if (!recordingError) return;

    const timer = setTimeout(() => {
      setRecordingError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [recordingError]);

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <>
      <style>{`

        /* ==================================================
           GLOBAL
        ================================================== */

        .antimate-page {
          --antimate-bg:
            ${isDark ? "#080b10" : "#f7f9fc"};

          --antimate-surface:
            ${isDark ? "#11161d" : "#ffffff"};

          --antimate-surface-soft:
            ${isDark ? "#151b23" : "#f1f4f8"};

          --antimate-text:
            ${isDark ? "#f7f9fc" : "#111827"};

          --antimate-text-soft:
            ${isDark ? "#d0d6df" : "#374151"};

          --antimate-muted:
            ${isDark ? "#8f99a8" : "#6b7280"};

          --antimate-border:
            ${isDark ? "#252d38" : "#e2e7ee"};

          --antimate-primary:
            ${isDark ? "#f5f7fa" : "#111827"};

          --antimate-primary-text:
            ${isDark ? "#0b0f14" : "#ffffff"};

          --antimate-user-bg:
            ${isDark ? "#e9edf2" : "#111827"};

          --antimate-user-text:
            ${isDark ? "#0b0f14" : "#ffffff"};

          --antimate-hover:
            ${isDark ? "#1b222c" : "#eef2f7"};

          --antimate-shadow:
            ${isDark
              ? "0 18px 50px rgba(0,0,0,.35)"
              : "0 18px 50px rgba(15,23,42,.09)"};

          width: 100%;
          height: 100%;
          min-height: 100vh;

          display: flex;
          flex-direction: column;

          background: var(--antimate-bg);

          color: var(--antimate-text);

          overflow: hidden;

          position: relative;

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        /* ==================================================
           ANTIMATE O LOGO
        ================================================== */

        .antimate-logo-mark {
          position: relative;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          overflow: hidden;

          background:
            conic-gradient(
              from 0deg,
              #7c3aed,
              #2563eb,
              #06b6d4,
              #22c55e,
              #f59e0b,
              #ef4444,
              #ec4899,
              #7c3aed
            );

          animation:
            antimate-logo-spin 8s linear infinite;

          box-shadow:
            0 0 0 1px
              ${isDark
                ? "rgba(255,255,255,.14)"
                : "rgba(17,24,39,.08)"},
            0 7px 24px
              ${isDark
                ? "rgba(37,99,235,.22)"
                : "rgba(37,99,235,.14)"};
        }

        .antimate-logo-orbit {
          position: absolute;

          inset: 3px;

          border-radius: 50%;

          border: 1.5px solid
            rgba(255,255,255,.55);

          opacity: .8;
        }

        .antimate-logo-orbit-one {
          transform: rotate(35deg)
            scaleX(.72);
        }

        .antimate-logo-orbit-two {
          transform: rotate(-35deg)
            scaleX(.72);
        }

        .antimate-logo-core {
          position: absolute;

          width: 54%;
          height: 54%;

          border-radius: 50%;

          background:
            ${isDark
              ? "#080b10"
              : "#ffffff"};

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow:
            0 0 0 1px
              ${isDark
                ? "rgba(255,255,255,.12)"
                : "rgba(17,24,39,.09)"};
        }

        .antimate-logo-inner {
          width: 35%;
          height: 35%;

          border-radius: 50%;

          background:
            conic-gradient(
              #22c55e,
              #06b6d4,
              #2563eb,
              #8b5cf6,
              #ec4899,
              #22c55e
            );

          animation:
            antimate-logo-inner-spin
            3.5s linear infinite;
        }

        @keyframes antimate-logo-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes antimate-logo-inner-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(-360deg);
          }
        }

        /* ==================================================
           HEADER
        ================================================== */

        .antimate-header {
          height: 72px;
          min-height: 72px;

          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 25px;

          background:
            ${isDark
              ? "rgba(8,11,16,.88)"
              : "rgba(247,249,252,.92)"};

          border-bottom:
            1px solid
            var(--antimate-border);

          backdrop-filter: blur(16px);

          position: relative;

          z-index: 20;
        }

        .antimate-title-area {
          display: flex;
          align-items: center;

          gap: 12px;
        }

        .antimate-header-logo {
          width: 42px;
          height: 42px;
        }

        .antimate-title-wrap {
          display: flex;
          flex-direction: column;

          min-width: 0;
        }

        .antimate-title {
          font-size: 16px;

          font-weight: 750;

          letter-spacing: -.35px;

          color:
            var(--antimate-text);
        }

        .antimate-subtitle {
          margin-top: 3px;

          font-size: 11px;

          color:
            var(--antimate-muted);

          letter-spacing: .1px;
        }

        .antimate-status {
          display: flex;
          align-items: center;

          gap: 7px;

          padding: 7px 11px;

          border:
            1px solid
            var(--antimate-border);

          border-radius: 999px;

          background:
            var(--antimate-surface);

          color:
            var(--antimate-muted);

          font-size: 11px;

          font-weight: 600;
        }

        .antimate-status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #22c55e;

          box-shadow:
            0 0 0 3px
            ${isDark
              ? "rgba(34,197,94,.12)"
              : "rgba(34,197,94,.10)"};
        }

        /* ==================================================
           CHAT
        ================================================== */

        .antimate-chat {
          flex: 1;

          width: 100%;

          max-width: 980px;

          margin: 0 auto;

          overflow-y: auto;

          padding:
            30px 24px 160px;

          scrollbar-width: thin;

          scrollbar-color:
            ${isDark
              ? "#394352 transparent"
              : "#cbd3df transparent"};
        }

        .antimate-chat::-webkit-scrollbar {
          width: 6px;
        }

        .antimate-chat::-webkit-scrollbar-track {
          background: transparent;
        }

        .antimate-chat::-webkit-scrollbar-thumb {
          background:
            ${isDark
              ? "#394352"
              : "#cbd3df"};

          border-radius: 10px;
        }

        /* ==================================================
           WELCOME
        ================================================== */

        .antimate-welcome {
          min-height: 58vh;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 40px 20px;
        }

        .antimate-welcome-logo {
          width: 82px;
          height: 82px;

          margin-bottom: 23px;

          filter:
            drop-shadow(
              0 12px 28px
              ${isDark
                ? "rgba(37,99,235,.18)"
                : "rgba(37,99,235,.12)"}
            );
        }

        .antimate-welcome h1 {
          margin: 0;

          font-size: 29px;

          line-height: 1.2;

          font-weight: 760;

          letter-spacing: -.9px;

          color:
            var(--antimate-text);
        }

        .antimate-welcome p {
          max-width: 560px;

          margin: 12px 0 0;

          color:
            var(--antimate-muted);

          line-height: 1.65;

          font-size: 14px;
        }

        .antimate-welcome-badge {
          display: flex;
          align-items: center;
          gap: 7px;

          margin-top: 20px;

          padding: 7px 11px;

          border:
            1px solid
            var(--antimate-border);

          border-radius: 999px;

          background:
            var(--antimate-surface);

          color:
            var(--antimate-text-soft);

          font-size: 11px;

          font-weight: 600;
        }

        .antimate-welcome-badge span {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #22c55e;
        }

        /* ==================================================
           MESSAGE
        ================================================== */

        .antimate-message {
          width: 100%;

          display: flex;

          margin-bottom: 24px;
        }

        .antimate-message.user {
          justify-content: flex-end;
        }

        .antimate-message.assistant {
          justify-content: flex-start;
        }

        .antimate-message-content {
          max-width:
            min(78%, 720px);

          display: flex;

          flex-direction: column;
        }

        .antimate-message.user
        .antimate-message-content {
          align-items: flex-end;
        }

        .antimate-message.assistant
        .antimate-message-content {
          align-items: flex-start;
        }

        /* ==================================================
           AI IDENTITY
        ================================================== */

        .antimate-ai-row {
          display: flex;
          align-items: center;

          gap: 9px;

          margin-bottom: 7px;
        }

        .antimate-ai-avatar {
          width: 27px;
          height: 27px;
        }

        .antimate-message-label {
          font-size: 11px;

          font-weight: 700;

          color:
            var(--antimate-muted);
        }

        .antimate-user-label {
          margin:
            0 8px 7px;
        }

        /* ==================================================
           BUBBLE
        ================================================== */

        .antimate-bubble {
          padding: 13px 16px;

          border-radius: 18px;

          font-size: 14px;

          line-height: 1.62;

          white-space: pre-wrap;

          overflow-wrap: anywhere;

          box-shadow:
            0 1px 2px
            ${isDark
              ? "rgba(0,0,0,.12)"
              : "rgba(15,23,42,.04)"};
        }

        .antimate-message.user
        .antimate-bubble {
          background:
            var(--antimate-user-bg);

          color:
            var(--antimate-user-text);

          border-bottom-right-radius: 5px;
        }

        .antimate-message.assistant
        .antimate-bubble {
          background:
            var(--antimate-surface);

          border:
            1px solid
            var(--antimate-border);

          color:
            var(--antimate-text);

          border-bottom-left-radius: 5px;
        }

        /* ==================================================
           VOICE MARK
        ================================================== */

        .antimate-voice-mark {
          display: flex;
          align-items: center;

          gap: 8px;

          font-size: 10px;

          font-weight: 600;

          margin-bottom: 8px;

          color:
            currentColor;

          opacity: .7;
        }

        .antimate-voice-wave {
          display: inline-flex;

          align-items: center;

          gap: 2px;

          height: 14px;
        }

        .antimate-voice-wave span {
          display: block;

          width: 2px;

          border-radius: 3px;

          background:
            currentColor;

          animation:
            antimate-wave 1s ease-in-out
            infinite;
        }

        .antimate-voice-wave span:nth-child(1) {
          height: 5px;
          animation-delay: .0s;
        }

        .antimate-voice-wave span:nth-child(2) {
          height: 10px;
          animation-delay: .1s;
        }

        .antimate-voice-wave span:nth-child(3) {
          height: 7px;
          animation-delay: .2s;
        }

        .antimate-voice-wave span:nth-child(4) {
          height: 13px;
          animation-delay: .3s;
        }

        .antimate-voice-wave span:nth-child(5) {
          height: 8px;
          animation-delay: .4s;
        }

        .antimate-voice-wave span:nth-child(6) {
          height: 11px;
          animation-delay: .5s;
        }

        .antimate-voice-wave span:nth-child(7) {
          height: 5px;
          animation-delay: .6s;
        }

        @keyframes antimate-wave {
          0%,
          100% {
            transform: scaleY(.65);
            opacity: .55;
          }

          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        /* ==================================================
           AUDIO CONTROLS
        ================================================== */

        .antimate-voice-controls {
          display: flex;

          align-items: center;

          gap: 9px;

          margin-top: 9px;

          padding: 6px 9px;

          border:
            1px solid
            var(--antimate-border);

          border-radius: 12px;

          background:
            var(--antimate-surface);

          box-shadow:
            0 4px 16px
            ${isDark
              ? "rgba(0,0,0,.15)"
              : "rgba(15,23,42,.04)"};
        }

        .antimate-replay {
          width: 31px;
          height: 31px;

          border: none;

          border-radius: 50%;

          background:
            var(--antimate-primary);

          color:
            var(--antimate-primary-text);

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            transform .15s ease,
            opacity .15s ease;
        }

        .antimate-replay:hover {
          transform: scale(1.05);
        }

        .antimate-replay:disabled {
          opacity: .55;

          cursor: default;

          transform: none;
        }

        .antimate-voice-status {
          min-width: 48px;

          font-size: 10px;

          color:
            var(--antimate-muted);

          font-weight: 600;
        }

        /* ==================================================
           THINKING
        ================================================== */

        .antimate-thinking {
          display: flex;

          align-items: center;

          gap: 10px;

          color:
            var(--antimate-muted);

          font-size: 12px;

          margin:
            4px 0 22px 38px;
        }

        .antimate-thinking-dots {
          display: flex;

          align-items: center;

          gap: 4px;
        }

        .antimate-thinking-dots span {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background:
            currentColor;

          animation:
            antimate-dot 1.2s infinite;
        }

        .antimate-thinking-dots span:nth-child(2) {
          animation-delay: .15s;
        }

        .antimate-thinking-dots span:nth-child(3) {
          animation-delay: .30s;
        }

        @keyframes antimate-dot {
          0%,
          60%,
          100% {
            opacity: .25;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        /* ==================================================
           COMPOSER WRAPPER
        ================================================== */

        .antimate-composer-wrapper {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding:
            18px
            18px
            20px;

          background:
            linear-gradient(
              to bottom,
              transparent 0%,
              ${isDark
                ? "rgba(8,11,16,.84)"
                : "rgba(247,249,252,.86)"}
              35%,
              ${isDark
                ? "#080b10"
                : "#f7f9fc"}
              100%
            );

          pointer-events: none;
        }

        .antimate-composer {
          pointer-events: auto;

          width: 100%;

          max-width: 980px;

          margin: 0 auto;

          display: flex;

          align-items: flex-end;

          gap: 9px;

          padding:
            8px 9px 8px 15px;

          background:
            var(--antimate-surface);

          border:
            1px solid
            var(--antimate-border);

          border-radius: 19px;

          box-shadow:
            var(--antimate-shadow);

          transition:
            border-color .2s ease,
            box-shadow .2s ease;
        }

        .antimate-composer:focus-within {
          border-color:
            ${isDark
              ? "#485465"
              : "#b9c4d3"};

          box-shadow:
            0 18px 50px
            ${isDark
              ? "rgba(0,0,0,.42)"
              : "rgba(15,23,42,.12)"};
        }

        /* ==================================================
           INPUT
        ================================================== */

        .antimate-input {
          flex: 1;

          resize: none;

          border: none;

          outline: none;

          background: transparent;

          color:
            var(--antimate-text);

          font-family: inherit;

          font-size: 14px;

          line-height: 1.5;

          min-height: 39px;

          max-height: 120px;

          padding: 9px 2px;

          overflow-y: auto;
        }

        .antimate-input::placeholder {
          color:
            var(--antimate-muted);

          opacity: .9;
        }

        .antimate-input:disabled {
          opacity: .65;

          cursor: not-allowed;
        }

        /* ==================================================
           ACTION BUTTON
        ================================================== */

        .antimate-action-button {
          width: 43px;
          height: 43px;

          min-width: 43px;

          border: none;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          background:
            var(--antimate-primary);

          color:
            var(--antimate-primary-text);

          transition:
            transform .15s ease,
            opacity .15s ease,
            box-shadow .15s ease;
        }

        .antimate-action-button:hover {
          transform: scale(1.045);

          box-shadow:
            0 5px 18px
            ${isDark
              ? "rgba(0,0,0,.35)"
              : "rgba(15,23,42,.15)"};
        }

        .antimate-action-button:active {
          transform: scale(.97);
        }

        .antimate-action-button:disabled {
          opacity: .42;

          cursor: default;

          transform: none;

          box-shadow: none;
        }

        .antimate-action-button.recording {
          background: #dc2626;

          color: #ffffff;

          animation:
            antimate-record-pulse
            1.4s infinite;
        }

        @keyframes antimate-record-pulse {
          0% {
            box-shadow:
              0 0 0 0
              rgba(220,38,38,.30);
          }

          70% {
            box-shadow:
              0 0 0 11px
              rgba(220,38,38,0);
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(220,38,38,0);
          }
        }

        /* ==================================================
           RECORDING PANEL
        ================================================== */

        .antimate-recording-area {
          position: fixed;

          left: 50%;

          bottom: 91px;

          transform:
            translateX(-50%);

          z-index: 40;

          display: flex;

          align-items: center;

          gap: 10px;

          padding:
            9px 14px;

          border-radius: 14px;

          background:
            var(--antimate-surface);

          border:
            1px solid
            var(--antimate-border);

          box-shadow:
            var(--antimate-shadow);

          font-size: 11px;

          color:
            var(--antimate-text);
        }

        .antimate-recording-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background: #ef4444;

          animation:
            antimate-recording-blink
            1s infinite;
        }

        @keyframes antimate-recording-blink {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: .25;
          }
        }

        .antimate-recording-label {
          font-weight: 700;
        }

        .antimate-countdown {
          min-width: 38px;

          font-weight: 800;

          font-variant-numeric:
            tabular-nums;

          color:
            var(--antimate-text);
        }

        .antimate-recording-hint {
          color:
            var(--antimate-muted);
        }

        /* ==================================================
           ERROR
        ================================================== */

        .antimate-error {
          position: fixed;

          left: 50%;

          bottom: 147px;

          transform:
            translateX(-50%);

          z-index: 50;

          max-width:
            calc(100% - 30px);

          padding:
            9px 13px;

          border-radius: 11px;

          background:
            ${isDark
              ? "#301719"
              : "#fff1f2"};

          color:
            ${isDark
              ? "#fecaca"
              : "#b4232c"};

          border:
            1px solid
            ${isDark
              ? "#5a292d"
              : "#fecdd3"};

          font-size: 11px;

          box-shadow:
            var(--antimate-shadow);
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 700px) {

          .antimate-header {
            height: 62px;
            min-height: 62px;

            padding:
              0 14px;
          }

          .antimate-header-logo {
            width: 37px;
            height: 37px;
          }

          .antimate-title {
            font-size: 14px;
          }

          .antimate-subtitle {
            font-size: 10px;
          }

          .antimate-status {
            display: none;
          }

          .antimate-chat {
            padding:
              22px
              12px
              140px;
          }

          .antimate-message-content {
            max-width: 89%;
          }

          .antimate-bubble {
            font-size: 13.5px;

            padding:
              12px 14px;
          }

          .antimate-welcome {
            min-height: 57vh;

            padding:
              25px 15px;
          }

          .antimate-welcome-logo {
            width: 70px;
            height: 70px;
          }

          .antimate-welcome h1 {
            font-size: 23px;
          }

          .antimate-welcome p {
            font-size: 13px;
          }

          .antimate-composer-wrapper {
            padding:
              10px
              10px
              calc(
                10px +
                env(safe-area-inset-bottom)
              );
          }

          .antimate-composer {
            border-radius: 17px;

            padding:
              7px
              8px
              7px
              13px;
          }

          .antimate-action-button {
            width: 41px;
            height: 41px;
            min-width: 41px;
          }

          .antimate-recording-area {
            bottom: 79px;

            max-width:
              calc(100% - 24px);

            white-space: nowrap;
          }

          .antimate-recording-hint {
            display: none;
          }

          .antimate-error {
            bottom: 130px;
          }

          .antimate-thinking {
            margin-left: 20px;
          }
        }

        @media (max-width: 420px) {

          .antimate-title-area {
            gap: 9px;
          }

          .antimate-header-logo {
            width: 34px;
            height: 34px;
          }

          .antimate-message-content {
            max-width: 92%;
          }

          .antimate-welcome h1 {
            font-size: 21px;
          }

          .antimate-welcome p {
            font-size: 12.5px;
          }
        }

      `}</style>

      <div className="antimate-page">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="antimate-header">

          <div className="antimate-title-area">

            <AntimateLogo
              size={42}
            />

            <div className="antimate-title-wrap">

              <div className="antimate-title">
                ANTIMATE AI
              </div>

              <div className="antimate-subtitle">
                {language === "rw"
                  ? "Umufasha w'ubwenge"
                  : "Intelligent Assistant"}
              </div>

            </div>

          </div>

          <div className="antimate-status">

            <span className="antimate-status-dot" />

            {language === "rw"
              ? "Iri gukora"
              : "Online"}

          </div>

        </header>

        {/* ==================================================
            CHAT
        ================================================== */}

        <main className="antimate-chat">

          {messages.length === 0 &&
            !thinkingText && (

              <div className="antimate-welcome">

                <AntimateLogo
                  size={82}
                />

                <h1>
                  {language === "rw"
                    ? "Muraho, ndi ANTIMATE"
                    : "Hello, I'm ANTIMATE"}
                </h1>

                <p>
                  {language === "rw"
                    ? "Andika ubutumwa cyangwa ukoreshe microphone uvuge mu Kinyarwanda. Ndi hano kugufasha."
                    : "Type a message or use the microphone to speak. I'm here to help you."}
                </p>

                <div className="antimate-welcome-badge">

                  <span />

                  {language === "rw"
                    ? "ANTIMATE AI iri online"
                    : "ANTIMATE AI is online"}

                </div>

              </div>
            )}

          {messages.map((message) => (

            <div
              key={message.id}
              className={`antimate-message ${
                message.role === "user"
                  ? "user"
                  : "assistant"
              }`}
            >

              <div className="antimate-message-content">

                {/* =========================================
                    AI HEADER
                ========================================= */}

                {message.role ===
                  "assistant" ? (

                  <div className="antimate-ai-row">

                    <AntimateLogo
                      size={27}
                      small
                    />

                    <div className="antimate-message-label">
                      ANTIMATE
                    </div>

                  </div>

                ) : (

                  <div className="antimate-message-label antimate-user-label">
                    {language === "rw"
                      ? "Wowe"
                      : "You"}
                  </div>

                )}

                {/* =========================================
                    MESSAGE
                ========================================= */}

                <div className="antimate-bubble">

                  {message.voice && (

                    <div className="antimate-voice-mark">

                      <VoiceWave />

                      {message.role ===
                      "user"
                        ? language === "rw"
                          ? "Ijwi ryawe"
                          : "Voice message"
                        : language === "rw"
                        ? "Ijwi rya ANTIMATE"
                        : "ANTIMATE Voice"}

                    </div>

                  )}

                  {message.text}

                </div>

                {/* =========================================
                    AI AUDIO
                ========================================= */}

                {message.role ===
                  "assistant" &&
                  message.audioUrl && (

                    <div className="antimate-voice-controls">

                      <button
                        type="button"
                        className="antimate-replay"
                        onClick={() =>
                          replayVoice(
                            message
                          )
                        }
                        disabled={
                          audioPlayingId ===
                          message.id
                        }
                        aria-label={
                          language === "rw"
                            ? "Ongera wumve"
                            : "Replay voice"
                        }
                        title={
                          language === "rw"
                            ? "Ongera wumve"
                            : "Replay"
                        }
                      >

                        {audioPlayingId ===
                        message.id ? (
                          <PauseIcon />
                        ) : (
                          <PlayIcon />
                        )}

                      </button>

                      <span className="antimate-voice-status">

                        {audioPlayingId ===
                        message.id
                          ? language === "rw"
                            ? "Irimo kuvuga"
                            : "Playing"
                          : language === "rw"
                          ? "Ongera wumve"
                          : "Replay"}

                      </span>

                    </div>
                  )}

              </div>

            </div>

          ))}

          {/* ==================================================
              THINKING
          ================================================== */}

          {thinkingText && (

            <div className="antimate-thinking">

              <AntimateLogo
                size={22}
                small
              />

              <div className="antimate-thinking-dots">
                <span />
                <span />
                <span />
              </div>

              <span>
                {thinkingText}
              </span>

            </div>
          )}

          <div
            ref={messagesEndRef}
            style={{
              height: 10,
            }}
          />

        </main>

        {/* ==================================================
            RECORDING STATUS
        ================================================== */}

        {isRecording && (

          <div className="antimate-recording-area">

            <span className="antimate-recording-dot" />

            <span className="antimate-recording-label">
              {language === "rw"
                ? "Ndakumva..."
                : "Listening..."}
            </span>

            <span className="antimate-countdown">
              {formatRecordingTime(
                recordingSeconds
              )}
            </span>

            <span className="antimate-recording-hint">
              {language === "rw"
                ? "kanda microphone guhagarika"
                : "tap microphone to stop"}
            </span>

          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {recordingError && (

          <div className="antimate-error">
            {recordingError}
          </div>
        )}

        {/* ==================================================
            FIXED COMPOSER
        ================================================== */}

        <div className="antimate-composer-wrapper">

          <div className="antimate-composer">

            <textarea
              ref={inputRef}
              className="antimate-input"
              value={text}
              onChange={
                handleInputChange
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder={
                language === "rw"
                  ? "Andika ubutumwa..."
                  : "Message ANTIMATE..."
              }
              rows={1}
              disabled={
                isSending ||
                isRecording
              }
              aria-label={
                language === "rw"
                  ? "Ubutumwa"
                  : "Message"
              }
            />

            {/* =============================================
                EMPTY INPUT = MICROPHONE
            ============================================= */}

            {!text.trim() ? (

              <button
                type="button"
                className={`antimate-action-button ${
                  isRecording
                    ? "recording"
                    : ""
                }`}
                onClick={
                  isRecording
                    ? stopVoiceRecording
                    : startVoiceRecording
                }
                disabled={
                  isSending
                }
                aria-label={
                  isRecording
                    ? "Stop recording"
                    : "Start voice recording"
                }
                title={
                  isRecording
                    ? "Stop"
                    : language === "rw"
                    ? "Vuga"
                    : "Speak"
                }
              >

                {isRecording ? (
                  <StopIcon />
                ) : (
                  <MicIcon />
                )}

              </button>

            ) : (

              /* ===========================================
                 TEXT EXISTS = SEND
              =========================================== */

              <button
                type="button"
                className="antimate-action-button"
                onClick={sendText}
                disabled={
                  isSending ||
                  !text.trim()
                }
                aria-label="Send message"
                title="Send"
              >

                <SendIcon />

              </button>

            )}

          </div>

        </div>

      </div>
    </>
  );
}