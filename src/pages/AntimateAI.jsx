import React, { useEffect, useRef, useState } from "react";

/*
============================================================
ANTIMATE AI
Professional Chat UI
Native CSS — no Tailwind
============================================================
*/

const API_BASE =
  import.meta.env.VITE_ANTIMATE_API_URL ||
  "https://antimate-ai.hf.space";

const MAX_RECORDING_SECONDS = 30;

export default function AntimateAI() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  /*
  ============================================================
  THEME COLORS
  ============================================================
  */

  const styles = `
    * {
      box-sizing: border-box;
    }

    .antimate-page {
      min-height: 100vh;
      width: 100%;
      background: var(--bg-primary, #f7f8fa);
      color: var(--text-primary, #16181d);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .antimate-header {
      height: 68px;
      min-height: 68px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      background: var(--bg-secondary, #ffffff);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 10;
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
      background: #111827;
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

    .antimate-brand-name {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    .antimate-brand-status {
      margin-top: 4px;
      font-size: 11px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .online-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
    }

    .antimate-chat {
      flex: 1;
      overflow-y: auto;
      padding: 28px 20px 150px;
      scroll-behavior: smooth;
    }

    .antimate-chat-inner {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
    }

    .welcome {
      text-align: center;
      padding: 70px 20px 30px;
    }

    .welcome-icon {
      width: 54px;
      height: 54px;
      margin: 0 auto 18px;
      border-radius: 16px;
      background: #111827;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .welcome-title {
      font-size: 27px;
      font-weight: 700;
      letter-spacing: -0.7px;
      margin-bottom: 9px;
    }

    .welcome-text {
      max-width: 520px;
      margin: auto;
      color: #6b7280;
      line-height: 1.6;
      font-size: 14px;
    }

    .message-row {
      display: flex;
      margin-bottom: 22px;
      width: 100%;
    }

    .message-row.user {
      justify-content: flex-end;
    }

    .message-row.ai {
      justify-content: flex-start;
    }

    .message {
      max-width: min(680px, 86%);
      font-size: 14px;
      line-height: 1.65;
    }

    .message-user {
      background: #111827;
      color: #ffffff;
      border-radius: 18px 18px 4px 18px;
      padding: 12px 16px;
    }

    .message-ai {
      background: transparent;
      color: var(--text-primary, #16181d);
      padding: 5px 0;
    }

    .message-label {
      font-size: 11px;
      color: #8a8f98;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .thinking {
      display: flex;
      align-items: center;
      gap: 9px;
      color: #777e88;
      font-size: 13px;
      padding: 8px 0 18px;
    }

    .thinking-dots {
      display: flex;
      gap: 3px;
    }

    .thinking-dots span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #8b929c;
      animation: thinkingPulse 1.2s infinite;
    }

    .thinking-dots span:nth-child(2) {
      animation-delay: .15s;
    }

    .thinking-dots span:nth-child(3) {
      animation-delay: .3s;
    }

    @keyframes thinkingPulse {
      0%, 80%, 100% {
        opacity: .25;
        transform: translateY(0);
      }

      40% {
        opacity: 1;
        transform: translateY(-2px);
      }
    }

    .voice-result {
      margin-top: 12px;
      width: 310px;
      max-width: 100%;
      padding: 11px 13px;
      border: 1px solid #e2e4e8;
      border-radius: 13px;
      background: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .voice-result-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: #f1f3f5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #30343b;
      flex-shrink: 0;
    }

    .voice-result-info {
      flex: 1;
      min-width: 0;
    }

    .voice-result-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .voice-result-subtitle {
      font-size: 10px;
      color: #858b94;
    }

    .replay-button {
      border: none;
      background: #111827;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform .15s ease, opacity .15s ease;
    }

    .replay-button:hover {
      transform: scale(1.05);
    }

    .replay-button:active {
      transform: scale(.95);
    }

    .input-area {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 20;
      pointer-events: none;
      padding: 0 18px 18px;
      background: linear-gradient(
        to top,
        var(--bg-primary, #f7f8fa) 45%,
        rgba(247,248,250,0)
      );
    }

    .input-wrapper {
      pointer-events: auto;
      max-width: 820px;
      margin: 0 auto;
      position: relative;
    }

    .input-box {
      min-height: 58px;
      border: 1px solid #dfe2e6;
      background: var(--bg-secondary, #ffffff);
      border-radius: 18px;
      display: flex;
      align-items: flex-end;
      padding: 9px 9px 9px 16px;
      box-shadow: 0 7px 25px rgba(0,0,0,.07);
    }

    .text-input {
      flex: 1;
      border: none;
      outline: none;
      resize: none;
      background: transparent;
      color: var(--text-primary, #16181d);
      font-family: inherit;
      font-size: 14px;
      line-height: 20px;
      min-height: 38px;
      max-height: 120px;
      padding: 9px 6px;
    }

    .text-input::placeholder {
      color: #9aa0a8;
    }

    .input-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-bottom: 1px;
    }

    .voice-button,
    .send-button {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all .15s ease;
    }

    .voice-button {
      background: #f0f2f4;
      color: #252a31;
    }

    .voice-button:hover {
      background: #e7e9ec;
    }

    .voice-button.recording {
      background: #111827;
      color: white;
      border-radius: 50%;
      animation: recordingGlow 1.3s infinite;
    }

    @keyframes recordingGlow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(17,24,39,.22);
      }

      50% {
        box-shadow: 0 0 0 8px rgba(17,24,39,0);
      }
    }

    .send-button {
      background: #111827;
      color: white;
    }

    .send-button:disabled {
      opacity: .35;
      cursor: not-allowed;
    }

    .send-button:not(:disabled):hover {
      transform: translateY(-1px);
    }

    .sound-wave {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    .sound-wave span {
      width: 2.5px;
      height: 8px;
      border-radius: 3px;
      background: currentColor;
      transition: height .15s ease;
    }

    .sound-wave span:nth-child(1) {
      height: 6px;
    }

    .sound-wave span:nth-child(2) {
      height: 11px;
    }

    .sound-wave span:nth-child(3) {
      height: 17px;
    }

    .sound-wave span:nth-child(4) {
      height: 11px;
    }

    .sound-wave span:nth-child(5) {
      height: 6px;
    }

    .voice-button.recording .sound-wave span {
      animation: waveAnimation .65s infinite alternate ease-in-out;
    }

    .voice-button.recording .sound-wave span:nth-child(2) {
      animation-delay: .1s;
    }

    .voice-button.recording .sound-wave span:nth-child(3) {
      animation-delay: .2s;
    }

    .voice-button.recording .sound-wave span:nth-child(4) {
      animation-delay: .3s;
    }

    .voice-button.recording .sound-wave span:nth-child(5) {
      animation-delay: .4s;
    }

    @keyframes waveAnimation {
      from {
        height: 5px;
      }

      to {
        height: 18px;
      }
    }

    .recording-status {
      position: absolute;
      bottom: calc(100% + 9px);
      left: 50%;
      transform: translateX(-50%);
      background: #111827;
      color: white;
      border-radius: 11px;
      padding: 7px 12px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      box-shadow: 0 5px 18px rgba(0,0,0,.15);
    }

    .recording-time {
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      min-width: 35px;
    }

    .recording-progress {
      width: 70px;
      height: 3px;
      border-radius: 3px;
      background: rgba(255,255,255,.22);
      overflow: hidden;
    }

    .recording-progress-bar {
      height: 100%;
      background: white;
      transition: width .2s linear;
    }

    .input-hint {
      text-align: center;
      font-size: 10px;
      color: #969ba3;
      margin-top: 7px;
    }

    .error-message {
      color: #b42318;
      background: #fff1f0;
      border: 1px solid #ffd6d2;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 12px;
      margin-bottom: 18px;
    }

    @media (max-width: 650px) {
      .antimate-header {
        padding: 0 15px;
      }

      .antimate-chat {
        padding: 20px 14px 140px;
      }

      .welcome {
        padding-top: 45px;
      }

      .welcome-title {
        font-size: 23px;
      }

      .message {
        max-width: 92%;
      }

      .input-area {
        padding: 0 10px 10px;
      }

      .input-box {
        border-radius: 15px;
      }

      .input-hint {
        display: none;
      }
    }

    @media (prefers-color-scheme: dark) {
      .antimate-page {
        --bg-primary: #101214;
        --bg-secondary: #17191d;
        --text-primary: #f3f4f6;
        --border-color: #292d33;
      }

      .antimate-header {
        border-color: #292d33;
      }

      .antimate-logo {
        background: #f4f4f5;
        color: #111827;
      }

      .message-user {
        background: #f4f4f5;
        color: #111827;
      }

      .voice-result {
        background: #17191d;
        border-color: #30343b;
      }

      .voice-result-icon,
      .voice-button {
        background: #24272c;
        color: #f3f4f6;
      }

      .input-box {
        border-color: #30343b;
      }

      .send-button,
      .replay-button {
        background: #f4f4f5;
        color: #111827;
      }

      .input-area {
        background: linear-gradient(
          to top,
          #101214 45%,
          rgba(16,18,20,0)
        );
      }
    }
  `;

  /*
  ============================================================
  AUTO SCROLL
  ============================================================
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  /*
  ============================================================
  CLEANUP
  ============================================================
  */

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  /*
  ============================================================
  THINKING MESSAGES
  ============================================================
  */

  const thinkingMessages = [
    "Ndigutekereza...",
    "Ndimo kureba amakuru ya system...",
    "Reka ndebe uko nabigusubiza neza...",
    "Ndimo gutegura igisubizo...",
    "Mpa akanya gato...",
  ];

  const startThinking = () => {
    const random =
      thinkingMessages[
        Math.floor(Math.random() * thinkingMessages.length)
      ];

    setThinkingText(random);
    setIsThinking(true);
  };

  /*
  ============================================================
  TEXT API
  ============================================================
  */

  const sendText = async () => {
    const cleanText = text.trim();

    if (!cleanText || isThinking) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text: cleanText,
      },
    ]);

    setText("");
    startThinking();

    try {
      const response = await fetch(
        `${API_BASE}/gradio_api/call/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: [cleanText],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const result = await response.json();

      let answer =
        result?.data?.[0]?.answer_kinyarwanda ||
        result?.data?.[0]?.answer ||
        result?.data?.[0] ||
        "";

      if (
        typeof answer === "object" &&
        answer !== null
      ) {
        answer =
          answer.answer_kinyarwanda ||
          answer.answer ||
          JSON.stringify(answer);
      }

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: String(answer),
        },
      ]);
    } catch (error) {
      console.error("ANTIMATE TEXT ERROR:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          type: "ai",
          error: true,
          text:
            "Ntabwo nabashije kubona igisubizo ubu. Ongera ugerageze.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  /*
  ============================================================
  KEYBOARD
  ============================================================
  */

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
  START RECORDING
  ============================================================
  */

  const startRecording = async () => {
    if (isRecording || isThinking) return;

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Browser ntiyemera microphone."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      let mimeType = "";

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];

      for (const type of supportedTypes) {
        if (
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
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        const blob = new Blob(
          audioChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        if (blob.size > 0) {
          await sendVoice(blob);
        }

        mediaRecorderRef.current = null;
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        stopRecording();
      };

      recorder.start(250);

      setRecordingSeconds(0);
      setIsRecording(true);

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingSeconds((previous) => {
            const next = previous + 1;

            if (
              next >=
              MAX_RECORDING_SECONDS
            ) {
              stopRecording();
            }

            return next;
          });
        }, 1000);
    } catch (error) {
      console.error(
        "MICROPHONE ERROR:",
        error
      );

      setIsRecording(false);

      alert(
        "Microphone ntiyemeye. Reba permission ya browser hanyuma wongere ugerageze."
      );
    }
  };

  /*
  ============================================================
  STOP RECORDING
  ============================================================
  */

  const stopRecording = () => {
    if (
      recordingTimerRef.current
    ) {
      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current = null;
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
    }
  };

  /*
  ============================================================
  SEND VOICE
  ============================================================
  */

  const sendVoice = async (blob) => {
    startThinking();

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text: "🎤 Voice message",
      },
    ]);

    try {
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

      /*
       * This endpoint should match
       * antimateRoutes.js.
       */
      const response = await fetch(
        `${API_BASE}/api/antimate/voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      /*
      ========================================================
      CASE 1 — JSON RESPONSE
      ========================================================
      */

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        const data =
          await response.json();

        const answer =
          data?.answer_kinyarwanda ||
          data?.answer ||
          data?.response ||
          data?.data?.answer_kinyarwanda ||
          "";

        const returnedAudio =
          data?.audio_url ||
          data?.audio ||
          data?.audio_output ||
          data?.data?.audio_url ||
          null;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            text:
              answer ||
              "ANTIMATE yatanze response.",
            audio: returnedAudio,
          },
        ]);

        /*
         * If backend gives an audio URL,
         * play it automatically.
         */
        if (returnedAudio) {
          playAudio(returnedAudio);
        }

        return;
      }

      /*
      ========================================================
      CASE 2 — AUDIO RESPONSE
      ========================================================
      */

      const audioBlob =
        await response.blob();

      const url =
        URL.createObjectURL(audioBlob);

      setAudioUrl(url);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          type: "ai",
          text:
            "ANTIMATE yagusubije mu ijwi.",
          audio: url,
        },
      ]);

      /*
       * AUTO PLAY
       */
      setTimeout(() => {
        playAudio(url);
      }, 100);
    } catch (error) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        error
      );

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          type: "ai",
          error: true,
          text:
            "Voice ntibashije gutunganywa. Ongera ugerageze.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  /*
  ============================================================
  AUDIO PLAYBACK
  ============================================================
  */

  const playAudio = (url) => {
    if (!url) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio =
        new Audio(url);

      audioRef.current = audio;

      setAudioPlaying(true);

      audio.onended = () => {
        setAudioPlaying(false);
      };

      audio.onerror = () => {
        setAudioPlaying(false);
      };

      audio.play().catch((error) => {
        console.warn(
          "Autoplay blocked:",
          error
        );

        setAudioPlaying(false);
      });
    } catch (error) {
      console.error(
        "AUDIO PLAY ERROR:",
        error
      );

      setAudioPlaying(false);
    }
  };

  /*
  ============================================================
  REPLAY
  ============================================================
  */

  const replayAudio = (url) => {
    playAudio(url);
  };

  /*
  ============================================================
  FORMAT RECORDING TIMER
  ============================================================
  */

  const remainingSeconds =
    MAX_RECORDING_SECONDS -
    recordingSeconds;

  const recordingProgress =
    (recordingSeconds /
      MAX_RECORDING_SECONDS) *
    100;

  /*
  ============================================================
  ICONS
  ============================================================
  */

  const SoundWaveIcon = () => (
    <div className="sound-wave">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );

  const SendIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );

  const ReplayIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <>
      <style>{styles}</style>

      <div className="antimate-page">
        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="antimate-header">
          <div className="antimate-brand">
            <div className="antimate-logo">
              A
            </div>

            <div className="antimate-brand-text">
              <div className="antimate-brand-name">
                ANTIMATE AI
              </div>

              <div className="antimate-brand-status">
                <span className="online-dot" />
                Online
              </div>
            </div>
          </div>
        </header>

        {/* ==================================================
            CHAT
        ================================================== */}

        <main className="antimate-chat">
          <div className="antimate-chat-inner">

            {messages.length === 0 && (
              <div className="welcome">
                <div className="welcome-icon">
                  A
                </div>

                <div className="welcome-title">
                  Muraho, ndi ANTIMATE
                </div>

                <div className="welcome-text">
                  Ndi AI assistant ushobora
                  kubaza mu Kinyarwanda ukoresheje
                  text cyangwa voice.
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${
                  message.type === "user"
                    ? "user"
                    : "ai"
                }`}
              >
                <div
                  className={`message ${
                    message.type === "user"
                      ? "message-user"
                      : "message-ai"
                  }`}
                >
                  {message.type === "ai" && (
                    <div className="message-label">
                      ANTIMATE
                    </div>
                  )}

                  {message.text}

                  {/* ========================================
                      AUDIO RESPONSE
                  ======================================== */}

                  {message.audio && (
                    <div className="voice-result">
                      <div className="voice-result-icon">
                        <SoundWaveIcon />
                      </div>

                      <div className="voice-result-info">
                        <div className="voice-result-title">
                          ANTIMATE Voice
                        </div>

                        <div className="voice-result-subtitle">
                          {audioPlaying
                            ? "Irimo gukina..."
                            : "Kanda replay wongere uyumve"}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="replay-button"
                        onClick={() =>
                          replayAudio(
                            message.audio
                          )
                        }
                        aria-label="Replay voice"
                        title="Replay"
                      >
                        <ReplayIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* ==============================================
                THINKING
            ============================================== */}

            {isThinking && (
              <div className="thinking">
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

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* ==================================================
            FIXED INPUT
        ================================================== */}

        <div className="input-area">
          <div className="input-wrapper">

            {/* ==============================================
                RECORDING STATUS
            ============================================== */}

            {isRecording && (
              <div className="recording-status">
                <span>
                  🎙️
                </span>

                <span className="recording-time">
                  {remainingSeconds}s
                </span>

                <div className="recording-progress">
                  <div
                    className="recording-progress-bar"
                    style={{
                      width: `${recordingProgress}%`,
                    }}
                  />
                </div>

                <span>
                  Vuga...
                </span>
              </div>
            )}

            <div className="input-box">

              {/* ==========================================
                  TEXT INPUT
              ========================================== */}

              <textarea
                className="text-input"
                rows={1}
                value={text}
                disabled={
                  isThinking ||
                  isRecording
                }
                placeholder={
                  isRecording
                    ? "Recording..."
                    : "Andika ubutumwa..."
                }
                onChange={(event) =>
                  setText(
                    event.target.value
                  )
                }
                onKeyDown={handleKeyDown}
              />

              <div className="input-actions">

                {/* ========================================
                    VOICE BUTTON
                ======================================== */}

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
                  disabled={
                    isThinking
                  }
                  aria-label={
                    isRecording
                      ? "Stop recording"
                      : "Record voice"
                  }
                  title={
                    isRecording
                      ? "Stop recording"
                      : "Record voice"
                  }
                >
                  <SoundWaveIcon />
                </button>

                {/* ========================================
                    SEND BUTTON
                ======================================== */}

                <button
                  type="button"
                  className="send-button"
                  onClick={sendText}
                  disabled={
                    !text.trim() ||
                    isThinking ||
                    isRecording
                  }
                  aria-label="Send"
                  title="Send"
                >
                  <SendIcon />
                </button>
              </div>
            </div>

            <div className="input-hint">
              Enter = send • Shift + Enter = new line
              • Voice max 30s
            </div>
          </div>
        </div>
      </div>
    </>
  );
}