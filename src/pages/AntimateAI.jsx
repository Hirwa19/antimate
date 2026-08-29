import React, { useEffect, useRef, useState } from "react";

/*
|--------------------------------------------------------------------------
| ANTIMATE AI
|--------------------------------------------------------------------------
| Native CSS only
| Voice + Text
| 30 second voice recording countdown
| Automatic voice playback + replay
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

const ANTIMATE_AI_URL =
  import.meta.env.VITE_ANTIMATE_AI_URL ||
  "https://antimate-ai.hf.space";

const MAX_RECORDING_SECONDS = 30;

const THINKING_MESSAGES = [
  "Ndigutekereza...",
  "Ndimo kureba amakuru ya system...",
  "Ndimo gusesengura ikibazo cyawe...",
  "Ndimo gutegura igisubizo...",
  "Hasigaye akanya gato...",
];

export default function AntimateAI() {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [voiceAudio, setVoiceAudio] = useState(null);
  const [voicePlaying, setVoicePlaying] = useState(false);

  const [error, setError] = useState("");

  // -------------------------------------------------------------------------
  // REFS
  // -------------------------------------------------------------------------

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  const chunksRef = useRef([]);

  // -------------------------------------------------------------------------
  // AUTO SCROLL
  // -------------------------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // -------------------------------------------------------------------------
  // THINKING ANIMATION
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!loading) {
      setThinkingIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setThinkingIndex((previous) => {
        return (previous + 1) % THINKING_MESSAGES.length;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [loading]);

  // -------------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopRecordingTimer();

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (voiceAudio) {
        URL.revokeObjectURL(voiceAudio);
      }
    };
  }, [voiceAudio]);

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  function stopRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function addUserMessage(text, type = "text") {
    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        role: "user",
        type,
        content: text,
        createdAt: new Date(),
      },
    ]);
  }

  function addAssistantMessage(text) {
    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        role: "assistant",
        type: "text",
        content: text,
        createdAt: new Date(),
      },
    ]);
  }

  // -------------------------------------------------------------------------
  // TEXT SEND
  // -------------------------------------------------------------------------

  async function sendTextMessage() {
    const text = message.trim();

    if (!text || loading) {
      return;
    }

    setError("");
    setMessage("");

    addUserMessage(text, "text");

    setLoading(true);

    try {
      /*
       * ANTIMATE AI TEXT ENDPOINT
       *
       * Gradio API:
       * /gradio_api/call/chat
       */

      const response = await fetch(
        `${ANTIMATE_AI_URL}/gradio_api/call/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: [text],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `ANTIMATE AI returned HTTP ${response.status}`
        );
      }

      const result = await response.json();

      /*
       * Gradio returns an event_id.
       *
       * We then listen to:
       * /gradio_api/call/chat/{event_id}
       */

      const eventId = result?.event_id;

      if (!eventId) {
        throw new Error("ANTIMATE AI ntiyatanze event ID.");
      }

      const answer = await readGradioResult(
        `${ANTIMATE_AI_URL}/gradio_api/call/chat/${eventId}`
      );

      const finalAnswer =
        answer?.answer_kinyarwanda ||
        answer?.answer ||
        answer?.output ||
        answer?.data?.answer_kinyarwanda ||
        answer?.data?.answer ||
        answer?.data?.output ||
        extractTextFromGradio(answer);

      if (!finalAnswer) {
        throw new Error(
          "ANTIMATE AI ntiyagaruye igisubizo."
        );
      }

      addAssistantMessage(finalAnswer);
    } catch (err) {
      console.error("ANTIMATE TEXT ERROR:", err);

      setError(
        err?.message ||
          "Habaye ikibazo mu kuvugana na ANTIMATE AI."
      );
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // ENTER KEY
  // -------------------------------------------------------------------------

  function handleTextKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendTextMessage();
    }
  }

  // -------------------------------------------------------------------------
  // GRADIO RESULT READER
  // -------------------------------------------------------------------------

  async function readGradioResult(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Gradio result error: HTTP ${response.status}`
      );
    }

    const reader = response.body?.getReader();

    if (!reader) {
      return await response.json();
    }

    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let finalData = null;

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        const clean = line.trim();

        if (!clean) {
          continue;
        }

        const dataLine = clean.startsWith("data:")
          ? clean.substring(5).trim()
          : clean;

        if (!dataLine) {
          continue;
        }

        try {
          const parsed = JSON.parse(dataLine);

          if (parsed?.data !== undefined) {
            finalData = parsed.data;
          } else {
            finalData = parsed;
          }
        } catch {
          // Ignore non JSON SSE messages.
        }
      }
    }

    return finalData;
  }

  // -------------------------------------------------------------------------
  // EXTRACT GRADIO TEXT
  // -------------------------------------------------------------------------

  function extractTextFromGradio(value) {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const extracted = extractTextFromGradio(item);

        if (extracted) {
          return extracted;
        }
      }

      return "";
    }

    if (typeof value === "object") {
      const possibleKeys = [
        "answer_kinyarwanda",
        "answer",
        "output",
        "text",
        "content",
        "value",
      ];

      for (const key of possibleKeys) {
        if (value[key]) {
          const extracted = extractTextFromGradio(
            value[key]
          );

          if (extracted) {
            return extracted;
          }
        }
      }
    }

    return "";
  }

  // -------------------------------------------------------------------------
  // VOICE START
  // -------------------------------------------------------------------------

  async function startRecording() {
    if (loading || isRecording) {
      return;
    }

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

      mediaStreamRef.current = stream;

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

      const recorderOptions = mimeType
        ? { mimeType }
        : undefined;

      const recorder = new MediaRecorder(
        stream,
        recorderOptions
      );

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        setError(
          "Habaye ikibazo mu gufata amajwi."
        );

        stopRecording();
      };

      recorder.onstop = async () => {
        stopRecordingTimer();

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          mediaStreamRef.current = null;
        }

        const actualMimeType =
          recorder.mimeType || mimeType || "audio/webm";

        const audioBlob = new Blob(
          chunksRef.current,
          {
            type: actualMimeType,
          }
        );

        chunksRef.current = [];

        setIsRecording(false);
        setRecordingSeconds(0);

        if (!audioBlob.size) {
          setError(
            "Nta majwi yafashwe. Ongera ugerageze."
          );
          return;
        }

        await sendVoiceMessage(
          audioBlob,
          actualMimeType
        );
      };

      mediaRecorderRef.current = recorder;

      recorder.start(250);

      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((previous) => {
          const next = previous + 1;

          if (
            next >= MAX_RECORDING_SECONDS
          ) {
            setTimeout(() => {
              stopRecording();
            }, 0);
          }

          return next;
        });
      }, 1000);
    } catch (err) {
      console.error(
        "MICROPHONE ERROR:",
        err
      );

      setIsRecording(false);

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }

      setError(
        err?.message ||
          "Microphone ntiyemeye gufunguka."
      );
    }
  }

  // -------------------------------------------------------------------------
  // VOICE STOP
  // -------------------------------------------------------------------------

  function stopRecording() {
    stopRecordingTimer();

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    } else {
      setIsRecording(false);
      setRecordingSeconds(0);

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }
    }
  }

  // -------------------------------------------------------------------------
  // VOICE TOGGLE
  // -------------------------------------------------------------------------

  function handleVoiceButton() {
    if (loading) {
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // -------------------------------------------------------------------------
  // SEND VOICE
  // -------------------------------------------------------------------------

  async function sendVoiceMessage(
    audioBlob,
    mimeType
  ) {
    setLoading(true);
    setError("");

    /*
     * We don't add the binary audio itself to the chat.
     * Instead, we show a small user voice message.
     */

    addUserMessage(
      "🎙️ Voice message",
      "voice"
    );

    try {
      /*
       * First send audio to backend.
       *
       * The backend /api/antimate/voice is responsible
       * for converting the incoming audio to:
       *
       * WAV
       * 16 kHz
       * Mono
       *
       * before sending it to ANTIMATE AI.
       */

      const formData = new FormData();

      const extension =
        mimeType.includes("mp4")
          ? "mp4"
          : "webm";

      const file = new File(
        [audioBlob],
        `antimate_voice.${extension}`,
        {
          type: mimeType,
        }
      );

      formData.append("audio", file);

      const response = await fetch(
        `${API_BASE_URL}/api/antimate/voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            `Voice API HTTP ${response.status}`
        );
      }

      const contentType =
        response.headers.get("content-type") ||
        "";

      /*
       * Backend may return JSON.
       */

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        const result =
          await response.json();

        if (
          result?.success === false
        ) {
          throw new Error(
            result.error ||
              "ANTIMATE voice request failed."
          );
        }

        const answer =
          result?.answer_kinyarwanda ||
          result?.answer ||
          result?.response ||
          result?.data?.answer_kinyarwanda ||
          result?.data?.answer;

        /*
         * Voice returned as URL/path.
         */

        const returnedAudio =
          result?.audio_url ||
          result?.audio ||
          result?.voice_url ||
          result?.data?.audio_url ||
          result?.data?.audio;

        if (answer) {
          addAssistantMessage(answer);
        }

        if (returnedAudio) {
          const audioUrl =
            normalizeAudioUrl(
              returnedAudio
            );

          if (audioUrl) {
            setVoiceAudio(audioUrl);

            setTimeout(() => {
              playAudio(audioUrl);
            }, 150);
          }
        }

        if (!answer) {
          /*
           * Some APIs return only audio.
           */
          if (!returnedAudio) {
            throw new Error(
              "ANTIMATE ntiyagaruye answer cyangwa audio."
            );
          }
        }

        return;
      }

      /*
       * Backend may directly return audio/wav.
       */

      if (
        contentType.includes("audio/")
      ) {
        const responseBlob =
          await response.blob();

        const audioUrl =
          URL.createObjectURL(
            responseBlob
          );

        setVoiceAudio(audioUrl);

        setTimeout(() => {
          playAudio(audioUrl);
        }, 150);

        return;
      }

      /*
       * Fallback:
       * Try JSON even if content-type is unusual.
       */

      const raw =
        await response.text();

      try {
        const result =
          JSON.parse(raw);

        const answer =
          result?.answer_kinyarwanda ||
          result?.answer ||
          result?.response;

        if (answer) {
          addAssistantMessage(answer);
        }

        const returnedAudio =
          result?.audio_url ||
          result?.audio;

        if (returnedAudio) {
          const audioUrl =
            normalizeAudioUrl(
              returnedAudio
            );

          setVoiceAudio(audioUrl);

          setTimeout(() => {
            playAudio(audioUrl);
          }, 150);
        }
      } catch {
        throw new Error(
          "ANTIMATE voice response ntizwi."
        );
      }
    } catch (err) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Habaye ikibazo mu kohereza voice kuri ANTIMATE."
      );
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // NORMALIZE AUDIO URL
  // -------------------------------------------------------------------------

  function normalizeAudioUrl(value) {
    if (!value) {
      return null;
    }

    if (
      typeof value !== "string"
    ) {
      return null;
    }

    if (
      value.startsWith("blob:") ||
      value.startsWith("data:") ||
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      return value;
    }

    if (value.startsWith("/")) {
      return `${ANTIMATE_AI_URL}${value}`;
    }

    return `${ANTIMATE_AI_URL}/${value}`;
  }

  // -------------------------------------------------------------------------
  // PLAY AUDIO
  // -------------------------------------------------------------------------

  function playAudio(url = voiceAudio) {
    if (!url) {
      return;
    }

    if (!audioRef.current) {
      const audio =
        new Audio(url);

      audioRef.current = audio;

      audio.onplay = () => {
        setVoicePlaying(true);
      };

      audio.onended = () => {
        setVoicePlaying(false);
      };

      audio.onerror = () => {
        setVoicePlaying(false);
        setError(
          "Audio ntiyashoboye gukinwa."
        );
      };
    }

    /*
     * If URL changed, replace audio source.
     */

    if (
      audioRef.current.src !== url
    ) {
      audioRef.current.src = url;
    }

    audioRef.current.currentTime = 0;

    audioRef.current
      .play()
      .catch((err) => {
        console.error(
          "AUDIO PLAY ERROR:",
          err
        );

        setVoicePlaying(false);
      });
  }

  // -------------------------------------------------------------------------
  // REPLAY
  // -------------------------------------------------------------------------

  function replayVoice() {
    if (!voiceAudio) {
      return;
    }

    playAudio(voiceAudio);
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <div className="antimate-page">
      <style>{`
        /* ============================================================
           ANTIMATE AI
           Native CSS
        ============================================================ */

        .antimate-page {
          min-height: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--background, #f7f8fa);
          color: var(--text-primary, #111827);
        }

        .antimate-shell {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          padding: 22px 22px 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        /* ============================================================
           HEADER
        ============================================================ */

        .antimate-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 18px;
          border-bottom: 1px solid
            var(--border-color, #e5e7eb);
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .antimate-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(
            --primary-color,
            #2563eb
          );
          color: white;
          font-size: 20px;
          font-weight: 700;
          box-shadow:
            0 4px 12px
              rgba(37, 99, 235, 0.16);
        }

        .antimate-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .antimate-subtitle {
          margin: 2px 0 0;
          font-size: 12px;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        .antimate-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow:
            0 0 0 4px
              rgba(34, 197, 94, 0.10);
        }

        /* ============================================================
           CHAT AREA
        ============================================================ */

        .antimate-chat {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 28px 4px 24px;
          scrollbar-width: thin;
        }

        .antimate-empty {
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
        }

        .empty-content {
          max-width: 500px;
        }

        .empty-icon {
          font-size: 42px;
          margin-bottom: 14px;
          opacity: 0.9;
        }

        .empty-title {
          margin: 0 0 8px;
          font-size: 25px;
          font-weight: 700;
          letter-spacing: -0.04em;
        }

        .empty-text {
          margin: 0;
          color: var(
            --text-secondary,
            #6b7280
          );
          line-height: 1.65;
          font-size: 14px;
        }

        /* ============================================================
           MESSAGE
        ============================================================ */

        .message-row {
          display: flex;
          margin-bottom: 20px;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;
        }

        .message {
          max-width: min(760px, 82%);
          line-height: 1.6;
          font-size: 14px;
        }

        .message.user {
          padding: 11px 15px;
          border-radius: 17px 17px 5px 17px;
          background: var(
            --primary-color,
            #2563eb
          );
          color: white;
        }

        .message.assistant {
          padding: 4px 0;
          color: var(
            --text-primary,
            #111827
          );
        }

        .message-label {
          font-size: 11px;
          font-weight: 600;
          color: var(
            --text-secondary,
            #6b7280
          );
          margin-bottom: 4px;
        }

        .message-text {
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* ============================================================
           THINKING
        ============================================================ */

        .thinking {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(
            --text-secondary,
            #6b7280
          );
          font-size: 13px;
          padding: 8px 0;
        }

        .thinking-dots {
          display: flex;
          gap: 4px;
        }

        .thinking-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          animation: thinkingPulse 1.3s
            infinite ease-in-out;
        }

        .thinking-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes thinkingPulse {
          0%,
          70%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }

          35% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }

        /* ============================================================
           VOICE RESPONSE
        ============================================================ */

        .voice-response {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 9px;
          padding: 10px 13px;
          width: fit-content;
          max-width: 100%;
          border: 1px solid
            var(--border-color, #e5e7eb);
          border-radius: 12px;
          background: var(
            --surface-color,
            #ffffff
          );
        }

        .voice-response-button {
          border: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: var(
            --primary-color,
            #2563eb
          );
          color: white;
          font-size: 14px;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .voice-response-button:hover {
          transform: scale(1.04);
        }

        .voice-response-button:active {
          transform: scale(0.96);
        }

        .voice-response-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .voice-response-title {
          font-size: 12px;
          font-weight: 600;
        }

        .voice-response-subtitle {
          font-size: 11px;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        /* ============================================================
           ERROR
        ============================================================ */

        .antimate-error {
          margin: 0 0 14px;
          padding: 10px 13px;
          border-radius: 10px;
          background: rgba(
            239,
            68,
            68,
            0.08
          );
          color: #dc2626;
          font-size: 12px;
          border: 1px solid
            rgba(239, 68, 68, 0.15);
        }

        /* ============================================================
           COMPOSER
        ============================================================ */

        .antimate-composer-area {
          padding: 12px 0 20px;
          background: var(
            --background,
            #f7f8fa
          );
        }

        .recording-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 9px;
          font-size: 12px;
          font-weight: 600;
          color: #dc2626;
        }

        .recording-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: recordingPulse 1s
            infinite;
        }

        @keyframes recordingPulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: 0.35;
            transform: scale(0.75);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .composer {
          min-height: 58px;
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 8px 8px 8px 14px;
          border: 1px solid
            var(--border-color, #dfe3e8);
          border-radius: 17px;
          background: var(
            --surface-color,
            #ffffff
          );
          box-shadow:
            0 5px 18px
              rgba(0, 0, 0, 0.035);
        }

        .composer-input {
          flex: 1;
          min-width: 0;
          resize: none;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(
            --text-primary,
            #111827
          );
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          padding: 9px 0;
          max-height: 130px;
        }

        .composer-input::placeholder {
          color: var(
            --text-secondary,
            #9ca3af
          );
        }

        .composer-button {
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 17px;
          transition:
            transform 0.15s ease,
            background 0.15s ease,
            opacity 0.15s ease;
        }

        .composer-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .composer-button:hover:not(
            :disabled
          ) {
          transform: translateY(-1px);
        }

        .voice-button {
          background: transparent;
          color: var(
            --text-secondary,
            #6b7280
          );
        }

        .voice-button:hover:not(
            :disabled
          ) {
          background: var(
            --hover-color,
            #f1f3f5
          );
          color: var(
            --text-primary,
            #111827
          );
        }

        .voice-button.recording {
          background: #ef4444;
          color: white;
          border-radius: 50%;
          animation: voiceButtonPulse
            1.2s infinite;
        }

        @keyframes voiceButtonPulse {
          0% {
            box-shadow:
              0 0 0 0
                rgba(239, 68, 68, 0.35);
          }

          70% {
            box-shadow:
              0 0 0 9px
                rgba(239, 68, 68, 0);
          }

          100% {
            box-shadow:
              0 0 0 0
                rgba(239, 68, 68, 0);
          }
        }

        .send-button {
          background: var(
            --primary-color,
            #2563eb
          );
          color: white;
        }

        .send-button:hover:not(
            :disabled
          ) {
          background: var(
            --primary-hover,
            #1d4ed8
          );
        }

        .composer-hint {
          text-align: center;
          margin-top: 8px;
          font-size: 10px;
          color: var(
            --text-secondary,
            #9ca3af
          );
        }

        /* ============================================================
           MOBILE
        ============================================================ */

        @media (max-width: 700px) {
          .antimate-shell {
            padding: 14px 13px 0;
          }

          .antimate-header {
            padding-bottom: 13px;
          }

          .antimate-logo {
            width: 37px;
            height: 37px;
            border-radius: 10px;
            font-size: 17px;
          }

          .antimate-title {
            font-size: 16px;
          }

          .antimate-status {
            display: none;
          }

          .antimate-chat {
            padding-top: 20px;
          }

          .message {
            max-width: 90%;
          }

          .empty-title {
            font-size: 22px;
          }

          .empty-text {
            font-size: 13px;
          }

          .antimate-composer-area {
            padding-bottom: 12px;
          }

          .composer {
            border-radius: 15px;
          }
        }

        /* ============================================================
           DARK THEME SUPPORT
        ============================================================ */

        [data-theme="dark"] .antimate-page {
          --background: #0f1115;
          --surface-color: #171a21;
          --border-color: #292e38;
          --text-primary: #f3f4f6;
          --text-secondary: #9ca3af;
          --hover-color: #222630;
        }

        @media (prefers-color-scheme: dark) {
          .antimate-page.auto-theme {
            --background: #0f1115;
            --surface-color: #171a21;
            --border-color: #292e38;
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --hover-color: #222630;
          }
        }
      `}</style>

      <div className="antimate-shell">

        {/* ==========================================================
            HEADER
        ========================================================== */}

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
                Umufasha wawe w'ubwenge mu Kinyarwanda
              </p>
            </div>
          </div>

          <div className="antimate-status">
            <span className="status-dot" />
            Online
          </div>
        </header>

        {/* ==========================================================
            CHAT
        ========================================================== */}

        <main className="antimate-chat">

          {messages.length === 0 && (
            <div className="antimate-empty">
              <div className="empty-content">
                <div className="empty-icon">
                  ✦
                </div>

                <h2 className="empty-title">
                  Muraho, ndi ANTIMATE
                </h2>

                <p className="empty-text">
                  Andika ikibazo cyangwa ukoreshe
                  microphone uvuge mu Kinyarwanda.
                  Nzakugeraho n'igisubizo gisobanutse.
                </p>
              </div>
            </div>
          )}

          {messages.map((item) => (
            <div
              key={item.id}
              className={`message-row ${item.role}`}
            >
              <div
                className={`message ${item.role}`}
              >
                {item.role ===
                  "assistant" && (
                  <div className="message-label">
                    ANTIMATE
                  </div>
                )}

                <div className="message-text">
                  {item.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="message assistant">
                <div className="message-label">
                  ANTIMATE
                </div>

                <div className="thinking">
                  <div className="thinking-dots">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>

                  <span>
                    {
                      THINKING_MESSAGES[
                        thinkingIndex
                      ]
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VOICE RESPONSE
          ======================================================== */}

          {voiceAudio && (
            <div className="message-row assistant">
              <div className="message assistant">
                <div className="message-label">
                  ANTIMATE Voice
                </div>

                <div className="voice-response">
                  <button
                    type="button"
                    className="voice-response-button"
                    onClick={
                      replayVoice
                    }
                    aria-label="Replay ANTIMATE voice"
                  >
                    {voicePlaying
                      ? "⏸"
                      : "▶"}
                  </button>

                  <div className="voice-response-info">
                    <div className="voice-response-title">
                      ANTIMATE Voice
                    </div>

                    <div className="voice-response-subtitle">
                      {voicePlaying
                        ? "Ndimo kuvuga..."
                        : "Kanda ▶ wongere wumve"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            ref={messagesEndRef}
          />
        </main>

        {/* ==========================================================
            ERROR
        ========================================================== */}

        {error && (
          <div className="antimate-error">
            {error}
          </div>
        )}

        {/* ==========================================================
            COMPOSER
        ========================================================== */}

        <div className="antimate-composer-area">

          {isRecording && (
            <div className="recording-bar">
              <span className="recording-pulse" />

              <span>
                Ndimo gufata amajwi
              </span>

              <strong>
                {recordingSeconds}s
              </strong>

              <span>
                / {MAX_RECORDING_SECONDS}s
              </span>
            </div>
          )}

          <div className="composer">

            <textarea
              className="composer-input"
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={
                handleTextKeyDown
              }
              placeholder={
                isRecording
                  ? "Kanda microphone urangize recording..."
                  : "Andika ubutumwa..."
              }
              rows={1}
              disabled={
                loading || isRecording
              }
            />

            {/* ======================================================
                VOICE BUTTON
            ====================================================== */}

            <button
              type="button"
              className={`composer-button voice-button ${
                isRecording
                  ? "recording"
                  : ""
              }`}
              onClick={
                handleVoiceButton
              }
              disabled={loading}
              aria-label={
                isRecording
                  ? "Stop recording"
                  : "Record voice"
              }
              title={
                isRecording
                  ? "Stop recording"
                  : "Vuga"
              }
            >
              {isRecording
                ? "■"
                : "◉"}
            </button>

            {/* ======================================================
                SEND BUTTON
            ====================================================== */}

            <button
              type="button"
              className="composer-button send-button"
              onClick={
                sendTextMessage
              }
              disabled={
                loading ||
                isRecording ||
                !message.trim()
              }
              aria-label="Send message"
              title="Ohereza"
            >
              ↑
            </button>
          </div>

          <div className="composer-hint">
            Enter = Ohereza · Microphone = Vuga
            · Voice ntirenze amasegonda 30
          </div>
        </div>
      </div>
    </div>
  );
}