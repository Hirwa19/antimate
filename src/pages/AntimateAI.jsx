import React, { useEffect, useRef, useState } from "react";

/*
============================================================
ANTIMATE AI
============================================================

Features:
- Text chat
- Voice recording max 30 seconds
- 30s countdown while recording
- Voice transcript appears on USER side
- AI voice answer appears on AI side
- AI voice automatically plays once
- Replay button remains available
- Fixed bottom composer
- Voice icon when text is empty
- Send icon when user is typing
- Thinking/status messages
- Native CSS only
- No Tailwind
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

export default function AntimateAI() {
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [isSending, setIsSending] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [thinkingText, setThinkingText] = useState("");

  const [audioPlayingId, setAudioPlayingId] = useState(null);

  const [recordingError, setRecordingError] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const recordingTimerRef = useRef(null);

  const audioRefs = useRef({});

  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);

  /*
  ============================================================
  AUTO SCROLL
  ============================================================
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, thinkingText]);

  /*
  ============================================================
  CLEANUP
  ============================================================
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

      Object.values(audioRefs.current).forEach((audio) => {
        try {
          audio.pause();
          audio.src = "";
        } catch (_) {}
      });
    };
  }, []);

  /*
  ============================================================
  THINKING MESSAGES
  ============================================================
  */

  const startThinking = (type = "text") => {
    if (type === "voice") {
      setThinkingText("🎤 Ndumva ibyo uvuze...");
      return;
    }

    setThinkingText("🧠 Ndigutekereza...");
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
  GET RECORDER MIME TYPE
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
  START VOICE RECORDING
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
          "Browser ntabwo ishyigikira microphone."
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
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopRecordingTimer();

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        setIsRecording(false);
        setRecordingSeconds(0);

        if (!chunks.length) {
          setRecordingError(
            "Nta audio yafashwe. Ongera ugerageze."
          );
          return;
        }

        const finalType =
          recorder.mimeType || "audio/webm";

        const blob = new Blob(chunks, {
          type: finalType,
        });

        await sendVoice(blob);
      };

      recorder.onerror = () => {
        stopRecordingTimer();

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        setIsRecording(false);
        setRecordingSeconds(0);

        setRecordingError(
          "Habaye ikibazo mu gufata amajwi."
        );
      };

      mediaRecorderRef.current = recorder;

      recorder.start();

      setIsRecording(true);

      startRecordingTimer();
    } catch (error) {
      console.error("Microphone error:", error);

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
          "Microphone ntiyabashije gufunguka."
      );
    }
  };

  /*
  ============================================================
  STOP VOICE RECORDING
  ============================================================
  */

  const stopVoiceRecording = () => {
    stopRecordingTimer();

    const recorder = mediaRecorderRef.current;

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
  EXTRACT JSON
  ============================================================
  */

  const parseResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const raw = await response.text();

    try {
      return JSON.parse(raw);
    } catch (_) {
      return {
        success: false,
        error: raw || "Invalid server response",
      };
    }
  };

  /*
  ============================================================
  NORMALIZE AI RESPONSE
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

    if (!cleanText || isSending || isRecording) {
      return;
    }

    setText("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
            message: cleanText,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ||
            `Request failed (${response.status})`
        );
      }

      const answer = extractAnswer(data);

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
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
      console.error("Text request error:", error);

      addAIMessage({
        text:
          "Mbabarira, habaye ikibazo mu kubona igisubizo. Ongera ugerageze.",
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

      /*
       * Backend should convert this incoming audio
       * to WAV 16kHz mono before sending it to ANTIMATE AI.
       */

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

      const data = await parseResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ||
            `Voice request failed (${response.status})`
        );
      }

      /*
       * IMPORTANT:
       * The transcribed text belongs to USER.
       */

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

      /*
       * Add transcript to USER side.
       */

      if (transcript) {
        addUserMessage({
          text: transcript,
          voice: true,
        });
      }

      /*
       * Add AI response to AI side.
       */

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye voice answer."
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
      console.error("Voice request error:", error);

      addAIMessage({
        text:
          "Mbabarira, sinabashije kumva neza cyangwa kubona igisubizo. Ongera uvuge.",
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

  const playVoice = async (messageId, url) => {
    if (!url) return;

    try {
      /*
       * Stop every other audio first.
       */

      Object.entries(audioRefs.current).forEach(
        ([id, audio]) => {
          if (id !== messageId) {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (_) {}
          }
        }
      );

      let audio = audioRefs.current[messageId];

      if (!audio) {
        audio = new Audio(url);

        audio.preload = "auto";

        audio.onplay = () => {
          setAudioPlayingId(messageId);
        };

        audio.onended = () => {
          setAudioPlayingId(null);
        };

        audio.onerror = () => {
          setAudioPlayingId(null);
        };

        audioRefs.current[messageId] = audio;
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
  INPUT HANDLING
  ============================================================
  */

  const handleInputChange = (event) => {
    const value = event.target.value;

    setText(value);

    const input = event.target;

    input.style.height = "auto";

    input.style.height =
      `${Math.min(input.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendText();
    }
  };

  /*
  ============================================================
  CLEAR RECORDING ERROR
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

        * {
          box-sizing: border-box;
        }

        .antimate-page {
          --antimate-bg: var(--bg-color, #f7f8fa);
          --antimate-surface: var(--card-bg, #ffffff);
          --antimate-text: var(--text-color, #17191c);
          --antimate-muted: var(--secondary-text, #73777d);
          --antimate-border: var(--border-color, #e6e8eb);
          --antimate-primary: var(--primary-color, #111111);

          width: 100%;
          height: 100%;
          min-height: 100vh;

          background: var(--antimate-bg);
          color: var(--antimate-text);

          display: flex;
          flex-direction: column;

          position: relative;
          overflow: hidden;
        }

        .antimate-header {
          height: 68px;
          min-height: 68px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 24px;

          border-bottom: 1px solid var(--antimate-border);

          background: var(--antimate-bg);

          position: relative;
          z-index: 10;
        }

        .antimate-title-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .antimate-logo {
          width: 38px;
          height: 38px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: var(--antimate-primary);
          color: white;

          font-size: 17px;
          font-weight: 700;

          flex-shrink: 0;
        }

        .antimate-title {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        .antimate-subtitle {
          font-size: 12px;
          color: var(--antimate-muted);
          margin-top: 2px;
        }

        .antimate-status {
          display: flex;
          align-items: center;
          gap: 7px;

          font-size: 12px;
          color: var(--antimate-muted);
        }

        .antimate-status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #36a269;
        }

        .antimate-chat {
          flex: 1;

          width: 100%;
          max-width: 920px;

          margin: 0 auto;

          overflow-y: auto;

          padding: 30px 22px 150px;

          scrollbar-width: thin;
        }

        .antimate-chat::-webkit-scrollbar {
          width: 6px;
        }

        .antimate-chat::-webkit-scrollbar-thumb {
          background: #cfd2d6;
          border-radius: 10px;
        }

        .antimate-welcome {
          min-height: 55vh;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 30px 20px;
        }

        .antimate-welcome-icon {
          width: 64px;
          height: 64px;

          border-radius: 18px;

          background: var(--antimate-primary);
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 27px;
          font-weight: 700;

          margin-bottom: 20px;
        }

        .antimate-welcome h1 {
          margin: 0;

          font-size: 27px;
          letter-spacing: -0.7px;
        }

        .antimate-welcome p {
          max-width: 520px;

          margin: 10px 0 0;

          color: var(--antimate-muted);

          line-height: 1.6;
          font-size: 14px;
        }

        .antimate-message {
          width: 100%;

          display: flex;

          margin-bottom: 20px;
        }

        .antimate-message.user {
          justify-content: flex-end;
        }

        .antimate-message.assistant {
          justify-content: flex-start;
        }

        .antimate-message-content {
          max-width: min(75%, 680px);

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

        .antimate-message-label {
          font-size: 11px;
          font-weight: 600;

          color: var(--antimate-muted);

          margin: 0 8px 6px;
        }

        .antimate-bubble {
          padding: 12px 15px;

          border-radius: 17px;

          font-size: 14px;
          line-height: 1.55;

          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .antimate-message.user .antimate-bubble {
          background: var(--antimate-primary);
          color: white;

          border-bottom-right-radius: 5px;
        }

        .antimate-message.assistant .antimate-bubble {
          background: var(--antimate-surface);

          border: 1px solid var(--antimate-border);

          color: var(--antimate-text);

          border-bottom-left-radius: 5px;
        }

        .antimate-voice-mark {
          display: flex;
          align-items: center;
          gap: 7px;

          font-size: 11px;
          margin-bottom: 7px;

          opacity: 0.78;
        }

        .antimate-message.user
        .antimate-voice-mark {
          justify-content: flex-end;
        }

        .antimate-wave-mini {
          display: inline-flex;
          align-items: center;
          gap: 2px;

          height: 13px;
        }

        .antimate-wave-mini span {
          width: 2px;
          border-radius: 3px;
          background: currentColor;
        }

        .antimate-wave-mini span:nth-child(1) {
          height: 5px;
        }

        .antimate-wave-mini span:nth-child(2) {
          height: 10px;
        }

        .antimate-wave-mini span:nth-child(3) {
          height: 7px;
        }

        .antimate-wave-mini span:nth-child(4) {
          height: 12px;
        }

        .antimate-wave-mini span:nth-child(5) {
          height: 6px;
        }

        .antimate-voice-controls {
          display: flex;

          align-items: center;
          gap: 9px;

          margin-top: 8px;

          padding: 7px 10px;

          border: 1px solid var(--antimate-border);

          border-radius: 12px;

          background: var(--antimate-surface);

          width: fit-content;
        }

        .antimate-replay {
          width: 31px;
          height: 31px;

          border: none;

          border-radius: 50%;

          background: var(--antimate-primary);
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .antimate-replay:hover {
          transform: scale(1.05);
        }

        .antimate-replay:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .antimate-voice-status {
          font-size: 11px;
          color: var(--antimate-muted);
          min-width: 42px;
        }

        .antimate-thinking {
          display: flex;

          align-items: center;

          gap: 9px;

          color: var(--antimate-muted);

          font-size: 13px;

          margin: 6px 0 20px 8px;
        }

        .antimate-thinking-dots {
          display: flex;
          gap: 3px;
        }

        .antimate-thinking-dots span {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: currentColor;

          animation: antimate-dot 1.2s infinite;
        }

        .antimate-thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .antimate-thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes antimate-dot {
          0%,
          60%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        .antimate-composer-wrapper {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding: 14px 18px 18px;

          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--antimate-bg) 22%
            );

          pointer-events: none;
        }

        .antimate-composer {
          pointer-events: auto;

          width: 100%;
          max-width: 920px;

          margin: 0 auto;

          display: flex;
          align-items: flex-end;

          gap: 9px;

          padding: 8px 9px 8px 14px;

          background: var(--antimate-surface);

          border: 1px solid var(--antimate-border);

          border-radius: 18px;

          box-shadow:
            0 8px 30px rgba(0, 0, 0, 0.08);
        }

        .antimate-input {
          flex: 1;

          resize: none;

          border: none;
          outline: none;

          background: transparent;

          color: var(--antimate-text);

          font-family: inherit;

          font-size: 14px;

          line-height: 1.5;

          min-height: 38px;
          max-height: 120px;

          padding: 9px 2px;

          overflow-y: auto;
        }

        .antimate-input::placeholder {
          color: var(--antimate-muted);
        }

        .antimate-action-button {
          width: 42px;
          height: 42px;

          min-width: 42px;

          border: none;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          background: var(--antimate-primary);
          color: white;

          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .antimate-action-button:hover {
          transform: scale(1.04);
        }

        .antimate-action-button:disabled {
          opacity: 0.45;
          cursor: default;
          transform: none;
        }

        .antimate-action-button.recording {
          background: #c83232;
          animation: antimate-record-pulse 1.4s infinite;
        }

        @keyframes antimate-record-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(200, 50, 50, 0.35);
          }

          70% {
            box-shadow: 0 0 0 10px rgba(200, 50, 50, 0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(200, 50, 50, 0);
          }
        }

        .antimate-recording-area {
          position: fixed;

          left: 50%;
          bottom: 86px;

          transform: translateX(-50%);

          z-index: 40;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 9px 14px;

          border-radius: 13px;

          background: var(--antimate-surface);

          border: 1px solid var(--antimate-border);

          box-shadow:
            0 8px 25px rgba(0, 0, 0, 0.12);

          font-size: 12px;
        }

        .antimate-recording-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background: #d33;

          animation: antimate-recording-blink 1s infinite;
        }

        @keyframes antimate-recording-blink {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.3;
          }
        }

        .antimate-countdown {
          font-weight: 700;

          font-variant-numeric: tabular-nums;

          min-width: 38px;
        }

        .antimate-recording-hint {
          color: var(--antimate-muted);
        }

        .antimate-error {
          position: fixed;

          left: 50%;
          bottom: 143px;

          transform: translateX(-50%);

          z-index: 50;

          max-width: calc(100% - 30px);

          padding: 9px 13px;

          border-radius: 10px;

          background: #fff2f2;

          color: #a52d2d;

          border: 1px solid #f0caca;

          font-size: 12px;
        }

        .antimate-empty-space {
          height: 10px;
        }

        @media (max-width: 700px) {

          .antimate-header {
            height: 60px;
            min-height: 60px;

            padding: 0 15px;
          }

          .antimate-logo {
            width: 34px;
            height: 34px;
          }

          .antimate-title {
            font-size: 15px;
          }

          .antimate-status {
            display: none;
          }

          .antimate-chat {
            padding:
              22px
              13px
              135px;
          }

          .antimate-message-content {
            max-width: 88%;
          }

          .antimate-bubble {
            font-size: 13.5px;
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
              calc(10px + env(safe-area-inset-bottom));
          }

          .antimate-composer {
            border-radius: 16px;
          }

          .antimate-recording-area {
            bottom: 78px;
          }
        }

        @media (prefers-color-scheme: dark) {

          .antimate-page {
            --antimate-bg: var(--bg-color, #101214);
            --antimate-surface: var(--card-bg, #17191c);
            --antimate-text: var(--text-color, #f2f3f4);
            --antimate-muted: var(--secondary-text, #92979e);
            --antimate-border: var(--border-color, #292d32);
          }

          .antimate-composer {
            box-shadow:
              0 8px 30px rgba(0, 0, 0, 0.25);
          }

          .antimate-error {
            background: #2b1717;
            border-color: #573030;
            color: #ff9b9b;
          }
        }

      `}</style>

      <div className="antimate-page">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="antimate-header">

          <div className="antimate-title-area">

            <div className="antimate-logo">
              A
            </div>

            <div>
              <div className="antimate-title">
                ANTIMATE AI
              </div>

              <div className="antimate-subtitle">
                Intelligent Assistant
              </div>
            </div>

          </div>

          <div className="antimate-status">
            <span className="antimate-status-dot" />
            Online
          </div>

        </header>

        {/* ==================================================
            CHAT
        ================================================== */}

        <main className="antimate-chat">

          {messages.length === 0 &&
            !thinkingText && (
              <div className="antimate-welcome">

                <div className="antimate-welcome-icon">
                  A
                </div>

                <h1>
                  Muraho, ndi ANTIMATE
                </h1>

                <p>
                  Andika ubutumwa cyangwa ukoreshe
                  microphone uvuge mu Kinyarwanda.
                  Ndi hano kugufasha.
                </p>

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

                <div className="antimate-message-label">
                  {message.role === "user"
                    ? "Wowe"
                    : "ANTIMATE"}
                </div>

                <div className="antimate-bubble">

                  {message.voice && (
                    <div className="antimate-voice-mark">

                      <span className="antimate-wave-mini">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>

                      {message.role === "user"
                        ? "Voice message"
                        : "ANTIMATE Voice"}
                    </div>
                  )}

                  {message.text}

                </div>

                {/* =========================================
                    AI VOICE CONTROLS
                ========================================= */}

                {message.role === "assistant" &&
                  message.audioUrl && (
                    <div className="antimate-voice-controls">

                      <button
                        type="button"
                        className="antimate-replay"
                        onClick={() =>
                          replayVoice(message)
                        }
                        disabled={
                          audioPlayingId ===
                          message.id
                        }
                        aria-label="Replay voice"
                        title="Replay"
                      >
                        {audioPlayingId ===
                        message.id ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="6"
                              y="5"
                              width="4"
                              height="14"
                            />
                            <rect
                              x="14"
                              y="5"
                              width="4"
                              height="14"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>

                      <span className="antimate-voice-status">
                        {audioPlayingId ===
                        message.id
                          ? "Playing"
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
            className="antimate-empty-space"
          />

        </main>

        {/* ==================================================
            RECORDING STATUS
        ================================================== */}

        {isRecording && (
          <div className="antimate-recording-area">

            <span className="antimate-recording-dot" />

            <span>
              Ndakumva...
            </span>

            <span className="antimate-countdown">
              {formatRecordingTime(
                recordingSeconds
              )}
            </span>

            <span className="antimate-recording-hint">
              kanda microphone guhagarika
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
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Andika ubutumwa..."
              rows={1}
              disabled={
                isSending || isRecording
              }
              aria-label="Message"
            />

            {/* =============================================
                EMPTY INPUT = SOUND WAVE
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
                disabled={isSending}
                aria-label={
                  isRecording
                    ? "Stop recording"
                    : "Start voice recording"
                }
                title={
                  isRecording
                    ? "Stop recording"
                    : "Vuga"
                }
              >

                {isRecording ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                  /*
                   * SOUND WAVE ICON
                   */
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 10v4" />
                    <path d="M8 7v10" />
                    <path d="M12 4v16" />
                    <path d="M16 7v10" />
                    <path d="M20 10v4" />
                  </svg>
                )}

              </button>
            ) : (
              /* ===========================================
                 TEXT EXISTS = SEND ICON
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

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>

              </button>
            )}

          </div>

        </div>

      </div>
    </>
  );
}