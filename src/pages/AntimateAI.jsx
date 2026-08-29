import React, { useEffect, useRef, useState } from "react";
import "./AntimateAI.css";

/*
============================================================
ANTIMATE AI
============================================================
- Native CSS only
- 30 second voice recording countdown
- Voice answer replay
- GPU -> CPU fallback handled by backend
- Text + Voice
============================================================
*/

// ============================================================
// CONFIG
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_ANTIMATE_AI_URL ||
  "https://your-antimate-ai-space.hf.space";

const VOICE_ENDPOINT = `${API_BASE_URL}/gradio_api/call/voice`;
const VOICE_CPU_ENDPOINT = `${API_BASE_URL}/gradio_api/call/voice_cpu`;
const TEXT_ENDPOINT = `${API_BASE_URL}/gradio_api/call/chat`;

const MAX_RECORDING_SECONDS = 30;

// ============================================================
// THINKING MESSAGES
// ============================================================

const THINKING_MESSAGES = [
  "Ndimo gutekereza...",
  "Ndimo kureba amakuru ya system...",
  "Reka ndebe icyo nakubwira...",
  "Ndimo gutegura igisubizo...",
  "Ndimo gusesengura ikibazo cyawe...",
  "Hafi kurangira...",
];

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {
  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  // ----------------------------------------------------------
  // VOICE
  // ----------------------------------------------------------

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);

  // ----------------------------------------------------------
  // PROCESSING
  // ----------------------------------------------------------

  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("");

  // ----------------------------------------------------------
  // AUDIO
  // ----------------------------------------------------------

  const [voiceAnswerUrl, setVoiceAnswerUrl] = useState(null);
  const [isPlayingAnswer, setIsPlayingAnswer] = useState(false);

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  const [error, setError] = useState("");

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  const recordingTimerRef = useRef(null);
  const thinkingTimerRef = useRef(null);

  const recordedAudioRef = useRef(null);
  const answerAudioRef = useRef(null);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      stopMediaStream();
      clearInterval(recordingTimerRef.current);
      clearInterval(thinkingTimerRef.current);

      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }

      if (voiceAnswerUrl) {
        URL.revokeObjectURL(voiceAnswerUrl);
      }
    };
  }, []);

  // ==========================================================
  // THINKING MESSAGE ROTATION
  // ==========================================================

  const startThinkingMessages = () => {
    let index = 0;

    setThinkingMessage(THINKING_MESSAGES[0]);

    thinkingTimerRef.current = setInterval(() => {
      index = (index + 1) % THINKING_MESSAGES.length;
      setThinkingMessage(THINKING_MESSAGES[index]);
    }, 2200);
  };

  const stopThinkingMessages = () => {
    clearInterval(thinkingTimerRef.current);
    thinkingTimerRef.current = null;
    setThinkingMessage("");
  };

  // ==========================================================
  // MEDIA STREAM
  // ==========================================================

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      mediaStreamRef.current = null;
    }
  };

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording = async () => {
    if (isProcessing) return;

    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser yawe ntabwo ishyigikira microphone recording."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;

      audioChunksRef.current = [];

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      let selectedMimeType = "";

      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const recorder = selectedMimeType
        ? new MediaRecorder(stream, {
            mimeType: selectedMimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        createRecordedAudio();
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);

        setError("Habaye ikibazo mu gufata amajwi.");
        setIsRecording(false);

        stopMediaStream();
      };

      recorder.start(250);

      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((previous) => {
          const next = previous + 1;

          // Automatic stop at 30 seconds
          if (next >= MAX_RECORDING_SECONDS) {
            setTimeout(() => {
              stopRecording();
            }, 0);
          }

          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);

      setError(
        err?.message ||
          "Microphone ntiyabonetse cyangwa permission ntiyatanzwe."
      );

      setIsRecording(false);
      stopMediaStream();
    }
  };

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = () => {
    clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    stopMediaStream();

    setIsRecording(false);
  };

  // ==========================================================
  // CREATE RECORDED AUDIO
  // ==========================================================

  const createRecordedAudio = () => {
    if (!audioChunksRef.current.length) {
      setError("Nta audio yafashwe.");
      return;
    }

    const mimeType =
      mediaRecorderRef.current?.mimeType || "audio/webm";

    const audioBlob = new Blob(audioChunksRef.current, {
      type: mimeType,
    });

    const url = URL.createObjectURL(audioBlob);

    setRecordedAudioUrl((oldUrl) => {
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }

      return url;
    });
  };

  // ==========================================================
  // SEND VOICE
  // ==========================================================

  const sendVoice = async () => {
    if (!recordedAudioUrl || isProcessing) {
      return;
    }

    setError("");

    setIsProcessing(true);
    startThinkingMessages();

    try {
      const response = await fetch(recordedAudioUrl);

      if (!response.ok) {
        throw new Error("Recorded audio ntiyashoboye gusomwa.");
      }

      const blob = await response.blob();

      /*
      ----------------------------------------------------------
      NOTE:
      ANTIMATE backend is responsible for converting incoming
      audio to WAV 16kHz mono.
      ----------------------------------------------------------
      */

      const formData = new FormData();

      formData.append(
        "audio",
        new File(
          [blob],
          "antimate_voice_input.webm",
          {
            type: blob.type || "audio/webm",
          }
        )
      );

      /*
      ----------------------------------------------------------
      PRIMARY VOICE REQUEST
      ----------------------------------------------------------
      */

      let result = await callVoiceEndpoint(
        VOICE_ENDPOINT,
        formData
      );

      /*
      ----------------------------------------------------------
      CPU FALLBACK
      ----------------------------------------------------------
      If GPU endpoint fails because:
      - quota exhausted
      - CUDA unavailable
      - GPU allocation failed
      ----------------------------------------------------------
      */

      if (!result.success) {
        console.warn(
          "GPU voice endpoint failed. Trying CPU fallback..."
        );

        result = await callVoiceEndpoint(
          VOICE_CPU_ENDPOINT,
          formData
        );
      }

      if (!result.success) {
        throw new Error(
          result.error ||
            "ANTIMATE voice service yanze gutanga response."
        );
      }

      handleVoiceResponse(result);
    } catch (err) {
      console.error("Voice request error:", err);

      setError(
        err?.message ||
          "Habaye ikibazo mu kohereza voice kuri ANTIMATE."
      );
    } finally {
      setIsProcessing(false);
      stopThinkingMessages();
    }
  };

  // ==========================================================
  // CALL VOICE ENDPOINT
  // ==========================================================

  const callVoiceEndpoint = async (endpoint, formData) => {
    try {
      /*
      Gradio API normally uses:
      POST /gradio_api/call/{api_name}

      The exact request format can depend on Gradio version.
      */

      const uploadResponse = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        return {
          success: false,
          error: `HTTP ${uploadResponse.status}`,
        };
      }

      const data = await uploadResponse.json();

      return normalizeVoiceResponse(data);
    } catch (err) {
      console.error("Endpoint failed:", endpoint, err);

      return {
        success: false,
        error: err?.message || "Voice endpoint failed",
      };
    }
  };

  // ==========================================================
  // NORMALIZE VOICE RESPONSE
  // ==========================================================

  const normalizeVoiceResponse = (data) => {
    /*
    ----------------------------------------------------------
    Supports different possible response structures.
    ----------------------------------------------------------
    */

    if (!data) {
      return {
        success: false,
        error: "Empty response.",
      };
    }

    if (data.success === false) {
      return data;
    }

    const result =
      data.data ||
      data.result ||
      data;

    let kinyarwandaText = "";
    let englishText = "";
    let answerText = "";
    let audioUrl = null;

    if (Array.isArray(result)) {
      kinyarwandaText = result[0] || "";
      englishText = result[1] || "";
      answerText = result[2] || "";

      const possibleAudio = result[3];

      if (typeof possibleAudio === "string") {
        audioUrl = possibleAudio;
      } else if (possibleAudio?.url) {
        audioUrl = possibleAudio.url;
      } else if (possibleAudio?.path) {
        audioUrl = possibleAudio.path;
      }
    } else if (typeof result === "object") {
      kinyarwandaText =
        result.input_kinyarwanda ||
        result.kinyarwanda_text ||
        result.transcription ||
        "";

      englishText =
        result.internal_english ||
        result.english_text ||
        "";

      answerText =
        result.answer_kinyarwanda ||
        result.answer ||
        result.text ||
        "";

      if (result.audio) {
        audioUrl =
          typeof result.audio === "string"
            ? result.audio
            : result.audio.url || result.audio.path;
      }

      if (!audioUrl && result.audio_output) {
        audioUrl =
          typeof result.audio_output === "string"
            ? result.audio_output
            : result.audio_output.url ||
              result.audio_output.path;
      }
    }

    return {
      success: true,
      input_kinyarwanda: kinyarwandaText,
      internal_english: englishText,
      answer_kinyarwanda: answerText,
      audio_url: audioUrl,
      raw: data,
    };
  };

  // ==========================================================
  // HANDLE VOICE RESPONSE
  // ==========================================================

  const handleVoiceResponse = (result) => {
    const userMessage = result.input_kinyarwanda || "Voice message";

    const assistantMessage =
      result.answer_kinyarwanda ||
      "ANTIMATE ntiyatanze igisubizo.";

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        type: "voice",
        text: userMessage,
      },
      {
        id: Date.now() + 1,
        role: "assistant",
        type: "voice",
        text: assistantMessage,
      },
    ]);

    if (result.audio_url) {
      setVoiceAnswerUrl(result.audio_url);
    }

    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
  };

  // ==========================================================
  // TEXT REQUEST
  // ==========================================================

  const sendText = async () => {
    const cleanText = text.trim();

    if (!cleanText || isProcessing) {
      return;
    }

    setError("");

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        type: "text",
        text: cleanText,
      },
    ]);

    setText("");
    setIsProcessing(true);

    startThinkingMessages();

    try {
      const result = await callTextEndpoint(cleanText);

      if (!result.success) {
        throw new Error(
          result.error ||
            "ANTIMATE text service yanze gutanga response."
        );
      }

      const answer =
        result.answer_kinyarwanda ||
        result.answer ||
        "ANTIMATE ntiyatanze igisubizo.";

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          type: "text",
          text: answer,
        },
      ]);
    } catch (err) {
      console.error("Text request error:", err);

      setError(
        err?.message ||
          "Habaye ikibazo mu kohereza ubutumwa."
      );
    } finally {
      setIsProcessing(false);
      stopThinkingMessages();
    }
  };

  // ==========================================================
  // TEXT ENDPOINT
  // ==========================================================

  const callTextEndpoint = async (userText) => {
    try {
      /*
      Current backend / Gradio chat endpoint.

      Depending on your Gradio version, the endpoint may
      require the event API protocol.

      This keeps the frontend isolated so it can be changed
      without touching the UI.
      */

      const response = await fetch(TEXT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [userText],
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      if (data.success === false) {
        return data;
      }

      const result = data.data || data.result || data;

      if (Array.isArray(result)) {
        return {
          success: true,
          answer_kinyarwanda:
            result[3] ||
            result[2] ||
            result[0] ||
            "",
        };
      }

      if (typeof result === "object") {
        return {
          success: true,
          answer_kinyarwanda:
            result.answer_kinyarwanda ||
            result.answer ||
            result.text ||
            "",
        };
      }

      return {
        success: true,
        answer_kinyarwanda: String(result || ""),
      };
    } catch (err) {
      return {
        success: false,
        error: err?.message || "Text endpoint failed",
      };
    }
  };

  // ==========================================================
  // PLAY RECORDED VOICE
  // ==========================================================

  const playRecordedVoice = () => {
    if (!recordedAudioUrl) return;

    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
    }

    const audio = new Audio(recordedAudioUrl);

    recordedAudioRef.current = audio;

    audio.play().catch((err) => {
      console.error("Recorded audio playback error:", err);
    });
  };

  // ==========================================================
  // REPLAY ANTIMATE ANSWER
  // ==========================================================

  const replayAnswer = () => {
    if (!voiceAnswerUrl) return;

    if (answerAudioRef.current) {
      answerAudioRef.current.pause();
      answerAudioRef.current.currentTime = 0;
    }

    const audio = new Audio(voiceAnswerUrl);

    answerAudioRef.current = audio;

    setIsPlayingAnswer(true);

    audio.onended = () => {
      setIsPlayingAnswer(false);
    };

    audio.onerror = () => {
      setIsPlayingAnswer(false);
      setError("Voice answer ntiyashoboye gukinwa.");
    };

    audio.play().catch((err) => {
      console.error("Answer playback error:", err);
      setIsPlayingAnswer(false);
    });
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleTextKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendText();
    }
  };

  // ==========================================================
  // CLEAR CONVERSATION
  // ==========================================================

  const clearConversation = () => {
    setMessages([]);
    setError("");
    setVoiceAnswerUrl(null);
    setRecordedAudioUrl(null);
  };

  // ==========================================================
  // RECORDING PROGRESS
  // ==========================================================

  const recordingProgress =
    (recordingSeconds / MAX_RECORDING_SECONDS) * 100;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <style>{`
        .antimate-page {
          width: 100%;
          min-height: calc(100vh - 70px);
          background: var(--bg-primary, #f7f8fa);
          color: var(--text-primary, #17191c);
          padding: 28px;
          box-sizing: border-box;
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
          margin-bottom: 24px;
          gap: 20px;
        }

        .antimate-title-area {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .antimate-logo {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-color, #111827);
          color: white;
          font-size: 21px;
          font-weight: 800;
        }

        .antimate-title {
          margin: 0;
          font-size: 24px;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .antimate-subtitle {
          margin: 3px 0 0;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .clear-button {
          border: 0;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 13px;
          padding: 8px 4px;
        }

        .clear-button:hover {
          color: var(--text-primary, #17191c);
        }

        .antimate-chat {
          min-height: 420px;
          max-height: 58vh;
          overflow-y: auto;
          padding: 8px 2px 24px;
          scroll-behavior: smooth;
        }

        .empty-state {
          min-height: 390px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
        }

        .empty-icon {
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--bg-secondary, #eef0f3);
          font-size: 29px;
          margin-bottom: 16px;
        }

        .empty-state h2 {
          margin: 0 0 7px;
          font-size: 20px;
        }

        .empty-state p {
          margin: 0;
          max-width: 470px;
          color: var(--text-secondary, #73777f);
          font-size: 14px;
          line-height: 1.6;
        }

        .message {
          display: flex;
          margin: 12px 0;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.assistant {
          justify-content: flex-start;
        }

        .message-content {
          max-width: min(720px, 82%);
          padding: 13px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
        }

        .message.user .message-content {
          background: var(--accent-color, #111827);
          color: white;
          border-bottom-right-radius: 5px;
        }

        .message.assistant .message-content {
          background: var(--bg-secondary, #eceff2);
          color: var(--text-primary, #17191c);
          border-bottom-left-radius: 5px;
        }

        .message-label {
          display: block;
          font-size: 10px;
          opacity: 0.6;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .voice-message-icon {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-right: 7px;
        }

        .thinking {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 8px 0 20px;
          color: var(--text-secondary, #70757d);
          font-size: 13px;
        }

        .thinking-dots {
          display: flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
          animation: antimateDot 1.2s infinite;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: .15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes antimateDot {
          0%, 60%, 100% {
            opacity: .25;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        .voice-answer {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid rgba(127,127,127,.16);
        }

        .replay-button {
          border: 0;
          background: transparent;
          padding: 3px;
          color: inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .replay-button:hover {
          opacity: .7;
        }

        .composer {
          position: sticky;
          bottom: 0;
          padding-top: 14px;
          background: var(--bg-primary, #f7f8fa);
        }

        .composer-box {
          border: 1px solid var(--border-color, #dfe2e6);
          background: var(--bg-secondary, #ffffff);
          border-radius: 17px;
          overflow: hidden;
          box-shadow: 0 5px 22px rgba(0,0,0,.04);
        }

        .text-input {
          width: 100%;
          min-height: 62px;
          max-height: 150px;
          resize: vertical;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary, #17191c);
          padding: 16px 17px;
          font: inherit;
          font-size: 14px;
          box-sizing: border-box;
        }

        .text-input::placeholder {
          color: var(--text-secondary, #92969d);
        }

        .composer-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px 10px 12px;
          border-top: 1px solid var(--border-color, #eceef1);
        }

        .composer-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .voice-button {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid var(--border-color, #dfe2e6);
          background: transparent;
          color: var(--text-primary, #22252a);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all .18s ease;
        }

        .voice-button:hover {
          background: var(--bg-primary, #f4f5f7);
          transform: translateY(-1px);
        }

        .voice-button.recording {
          background: #17191c;
          color: white;
          border-color: #17191c;
          animation: recordPulse 1.5s infinite;
        }

        @keyframes recordPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(20,20,20,.15);
          }

          50% {
            box-shadow: 0 0 0 8px rgba(20,20,20,.06);
          }
        }

        .send-button {
          min-width: 84px;
          height: 40px;
          padding: 0 15px;
          border: 0;
          border-radius: 11px;
          background: var(--accent-color, #111827);
          color: white;
          cursor: pointer;
          font-weight: 650;
          font-size: 13px;
          transition: opacity .18s ease;
        }

        .send-button:hover:not(:disabled) {
          opacity: .86;
        }

        .send-button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .recording-panel {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px 14px;
          margin-bottom: 10px;
          border: 1px solid var(--border-color, #dedfe2);
          background: var(--bg-secondary, #fff);
          border-radius: 14px;
        }

        .recording-status-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #17191c;
          color: white;
          flex-shrink: 0;
        }

        .recording-info {
          flex: 1;
          min-width: 0;
        }

        .recording-time {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .recording-progress {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }

        .recording-progress-bar {
          height: 100%;
          background: #17191c;
          border-radius: inherit;
          transition: width .2s linear;
        }

        .stop-recording {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          color: #70757d;
          padding: 5px;
        }

        .recorded-preview {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 13px;
          margin-bottom: 10px;
          border: 1px solid var(--border-color, #dedfe2);
          background: var(--bg-secondary, #fff);
          border-radius: 13px;
        }

        .preview-play {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-size: 17px;
        }

        .preview-text {
          flex: 1;
          font-size: 12px;
          color: var(--text-secondary, #6f747c);
        }

        .preview-send {
          border: 0;
          border-radius: 9px;
          padding: 7px 11px;
          background: var(--accent-color, #111827);
          color: white;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .error-message {
          margin-top: 9px;
          padding: 9px 11px;
          border-radius: 10px;
          font-size: 12px;
          background: #fff0f0;
          color: #a12727;
          border: 1px solid #ffd8d8;
        }

        .status-line {
          text-align: center;
          margin-top: 9px;
          font-size: 10px;
          color: var(--text-secondary, #969aa1);
        }

        @media (max-width: 700px) {
          .antimate-page {
            padding: 18px 12px;
          }

          .antimate-header {
            margin-bottom: 16px;
          }

          .antimate-title {
            font-size: 20px;
          }

          .antimate-chat {
            min-height: 55vh;
          }

          .message-content {
            max-width: 88%;
          }

          .composer-box {
            border-radius: 15px;
          }
        }

        @media (prefers-color-scheme: dark) {
          .antimate-page {
            --bg-primary: #111315;
            --bg-secondary: #1a1d20;
            --text-primary: #f1f3f5;
            --text-secondary: #9da3aa;
            --border-color: #2c3035;
            --accent-color: #f1f3f5;
          }

          .send-button {
            color: #111315;
          }

          .recording-status-icon {
            background: #f1f3f5;
            color: #111315;
          }

          .recording-progress {
            background: #30343a;
          }

          .recording-progress-bar {
            background: #f1f3f5;
          }

          .voice-button.recording {
            background: #f1f3f5;
            color: #111315;
            border-color: #f1f3f5;
          }

          .error-message {
            background: #29191b;
            color: #ffb5b5;
            border-color: #4d292c;
          }
        }
      `}</style>

      <div className="antimate-page">
        <div className="antimate-container">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="antimate-header">
            <div className="antimate-title-area">
              <div className="antimate-logo">
                A
              </div>

              <div>
                <h1 className="antimate-title">
                  ANTIMATE AI
                </h1>

                <p className="antimate-subtitle">
                  Umufasha wawe wa AI mu Kinyarwanda
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                className="clear-button"
                onClick={clearConversation}
              >
                Clear
              </button>
            )}
          </header>

          {/* =================================================
              CHAT
          ================================================= */}

          <main className="antimate-chat">

            {messages.length === 0 && !isProcessing && (
              <div className="empty-state">
                <div className="empty-icon">
                  ✦
                </div>

                <h2>
                  Muraho, ndi ANTIMATE
                </h2>

                <p>
                  Andika ikibazo cyangwa ukoreshe ijwi.
                  Ndi hano kugufasha gusobanukirwa,
                  gusesengura no kubona ibisubizo.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role}`}
              >
                <div className="message-content">

                  <span className="message-label">
                    {message.role === "user"
                      ? "Wowe"
                      : "ANTIMATE"}
                  </span>

                  {message.type === "voice" && (
                    <span className="voice-message-icon">
                      <VoiceWaveIcon size={16} />
                    </span>
                  )}

                  {message.text}

                  {message.role === "assistant" &&
                    message.type === "voice" &&
                    voiceAnswerUrl && (
                      <div className="voice-answer">
                        <button
                          className="replay-button"
                          onClick={replayAnswer}
                          title="Replay ANTIMATE voice"
                        >
                          {isPlayingAnswer ? (
                            <PauseIcon size={18} />
                          ) : (
                            <ReplayIcon size={18} />
                          )}
                        </button>

                        <span>
                          {isPlayingAnswer
                            ? "ANTIMATE iri kuvuga..."
                            : "Replay voice answer"}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="thinking">
                <span>
                  {thinkingMessage || "Ndimo gutekereza..."}
                </span>

                <span className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
          </main>

          {/* =================================================
              COMPOSER
          ================================================= */}

          <section className="composer">

            {/* Recording */}
            {isRecording && (
              <div className="recording-panel">

                <div className="recording-status-icon">
                  <MicIcon size={18} />
                </div>

                <div className="recording-info">
                  <div className="recording-time">
                    <strong>
                      🎙️ Uri kuvuga
                    </strong>

                    <span>
                      {recordingSeconds}s /{" "}
                      {MAX_RECORDING_SECONDS}s
                    </span>
                  </div>

                  <div className="recording-progress">
                    <div
                      className="recording-progress-bar"
                      style={{
                        width: `${recordingProgress}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  className="stop-recording"
                  onClick={stopRecording}
                >
                  Kurangiza
                </button>
              </div>
            )}

            {/* Recorded preview */}
            {recordedAudioUrl && !isRecording && (
              <div className="recorded-preview">

                <button
                  className="preview-play"
                  onClick={playRecordedVoice}
                  title="Replay recording"
                >
                  ▶
                </button>

                <span className="preview-text">
                  Voice yafashwe neza.
                </span>

                <button
                  className="preview-send"
                  onClick={sendVoice}
                  disabled={isProcessing}
                >
                  Ohereza
                </button>
              </div>
            )}

            <div className="composer-box">

              <textarea
                className="text-input"
                value={text}
                onChange={(event) =>
                  setText(event.target.value)
                }
                onKeyDown={handleTextKeyDown}
                placeholder="Andika ubutumwa bwawe hano..."
                disabled={isProcessing || isRecording}
              />

              <div className="composer-actions">

                <div className="composer-left">

                  {/* NEW VOICE ICON */}
                  <button
                    className={`voice-button ${
                      isRecording ? "recording" : ""
                    }`}
                    onClick={
                      isRecording
                        ? stopRecording
                        : startRecording
                    }
                    disabled={isProcessing}
                    title={
                      isRecording
                        ? "Hagarika recording"
                        : "Vuga mu Kinyarwanda"
                    }
                  >
                    {isRecording ? (
                      <StopIcon size={19} />
                    ) : (
                      <MicIcon size={20} />
                    )}
                  </button>

                </div>

                <button
                  className="send-button"
                  onClick={sendText}
                  disabled={
                    !text.trim() ||
                    isProcessing ||
                    isRecording
                  }
                >
                  {isProcessing
                    ? "..."
                    : "Ohereza"}
                </button>

              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="status-line">
              🎙️ Voice: kugeza kuri 30 seconds
              {" • "}
              🧠 ANTIMATE AI
            </div>

          </section>
        </div>
      </div>
    </>
  );
}

// ============================================================
// ICONS
// ============================================================

function MicIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
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
    </svg>
  );
}

function StopIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
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

function ReplayIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 5v5h5" />
    </svg>
  );
}

function PauseIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect
        x="6"
        y="5"
        width="4"
        height="14"
        rx="1"
      />

      <rect
        x="14"
        y="5"
        width="4"
        height="14"
        rx="1"
      />
    </svg>
  );
}

function VoiceWaveIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 10v4" />
      <path d="M9 7v10" />
      <path d="M13 5v14" />
      <path d="M17 8v8" />
      <path d="M21 10v4" />
    </svg>
  );
}