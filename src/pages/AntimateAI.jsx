import React, { useEffect, useRef, useState } from "react";

/*
============================================================
ANTIMATE AI
============================================================

Features:
- Text conversation
- Voice conversation
- 30 second recording countdown
- Automatic stop at 0 seconds
- Voice answer replay
- Thinking / processing messages
- Native CSS only
- Responsive
- Theme aware
- GPU/CPU fallback is handled by backend
============================================================
*/

const VOICE_API_URL = "/api/antimate/voice";
const TEXT_API_URL = "/api/antimate/chat";

const MAX_RECORDING_SECONDS = 30;

const THINKING_MESSAGES = [
  "Ndigutekereza...",
  "Ndimo kureba amakuru ya system...",
  "Reka ndebe neza ikibazo cyawe...",
  "Ndimo gutegura igisubizo...",
  "Mpa akanya gato...",
  "ANTIMATE iracyatekereza..."
];

export default function AntimateAI() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [message, setMessage] = useState("");

  const [conversation, setConversation] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [recordingTime, setRecordingTime] = useState(
    MAX_RECORDING_SECONDS
  );

  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);

  const [voiceAnswerUrl, setVoiceAnswerUrl] = useState(null);

  const [thinkingMessage, setThinkingMessage] = useState(
    "ANTIMATE iriteguye."
  );

  const [error, setError] = useState("");

  // ==========================================================
  // REFS
  // ==========================================================

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const audioChunksRef = useRef([]);

  const recordingTimerRef = useRef(null);

  const thinkingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);

  const recordedAudioRef = useRef(null);

  const answerAudioRef = useRef(null);

  // ==========================================================
  // AUTH TOKEN
  // ==========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      ""
    );
  };

  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [conversation, isLoading]);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      stopRecordingCleanup();

      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
      }

      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }

      if (voiceAnswerUrl) {
        URL.revokeObjectURL(voiceAnswerUrl);
      }
    };
  }, []);

  // ==========================================================
  // THINKING MESSAGE
  // ==========================================================

  const startThinkingMessages = () => {
    let index = 0;

    setThinkingMessage(THINKING_MESSAGES[0]);

    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
    }

    thinkingTimerRef.current = setInterval(() => {
      index = (index + 1) % THINKING_MESSAGES.length;

      setThinkingMessage(
        THINKING_MESSAGES[index]
      );
    }, 2200);
  };

  const stopThinkingMessages = () => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    setThinkingMessage("ANTIMATE yiteguye.");
  };

  // ==========================================================
  // GENERIC HEADERS
  // ==========================================================

  const getHeaders = () => {
    const token = getToken();

    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  // ==========================================================
  // RESPONSE PARSER
  // ==========================================================

  const parseJsonResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: response.ok,
        message: text
      };
    }
  };

  // ==========================================================
  // EXTRACT TEXT ANSWER
  // ==========================================================

  const extractAnswer = (data) => {
    if (!data) {
      return "";
    }

    return (
      data.answer_kinyarwanda ||
      data.answerKinyarwanda ||
      data.answer ||
      data.response ||
      data.message ||
      data.text ||
      ""
    );
  };

  // ==========================================================
  // EXTRACT VOICE FILE
  // ==========================================================

  const extractAudioUrl = (data) => {
    if (!data) {
      return null;
    }

    return (
      data.audio_url ||
      data.audioUrl ||
      data.voice_url ||
      data.voiceUrl ||
      data.audio ||
      null
    );
  };

  // ==========================================================
  // ADD MESSAGE
  // ==========================================================

  const addMessage = (role, text, extra = {}) => {
    setConversation((previous) => [
      ...previous,
      {
        id:
          Date.now() +
          Math.random()
            .toString(36)
            .substring(2, 8),

        role,

        text,

        ...extra
      }
    ]);
  };

  // ==========================================================
  // TEXT SUBMIT
  // ==========================================================

  const sendTextMessage = async () => {
    const text = message.trim();

    if (!text || isLoading) {
      return;
    }

    setError("");

    setMessage("");

    addMessage("user", text);

    setIsLoading(true);

    startThinkingMessages();

    try {
      const response = await fetch(
        TEXT_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            ...getHeaders()
          },

          body: JSON.stringify({
            text,

            message: text,

            language: "rw"
          })
        }
      );

      const data = await parseJsonResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Request failed (${response.status})`
        );
      }

      const answer = extractAnswer(data);

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      addMessage(
        "assistant",
        answer,
        {
          type: "text"
        }
      );
    } catch (err) {
      console.error(
        "ANTIMATE TEXT ERROR:",
        err
      );

      const errorMessage =
        err?.message ||
        "Habaye ikibazo mu kuvugana na ANTIMATE.";

      setError(errorMessage);

      addMessage(
        "assistant",
        "Mbabarira, habaye ikibazo mu gutanga igisubizo."
      );
    } finally {
      stopThinkingMessages();

      setIsLoading(false);
    }
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleTextKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendTextMessage();
    }
  };

  // ==========================================================
  // RECORDING CLEANUP
  // ==========================================================

  const stopRecordingCleanup = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);

      recordingTimerRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      mediaStreamRef.current = null;
    }
  };

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording = async () => {
    if (isRecording || isLoading) {
      return;
    }

    setError("");

    setRecordedAudioUrl(null);

    audioChunksRef.current = [];

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Browser yawe ntabwo ishyigikira microphone."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });

      mediaStreamRef.current = stream;

      let mimeType = "";

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        mimeType =
          "audio/webm;codecs=opus";
      } else if (
        MediaRecorder.isTypeSupported(
          "audio/webm"
        )
      ) {
        mimeType = "audio/webm";
      } else if (
        MediaRecorder.isTypeSupported(
          "audio/ogg;codecs=opus"
        )
      ) {
        mimeType =
          "audio/ogg;codecs=opus";
      }

      const recorder = mimeType
        ? new MediaRecorder(
            stream,
            { mimeType }
          )
        : new MediaRecorder(stream);

      mediaRecorderRef.current =
        recorder;

      recorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        const finalMimeType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        const blob = new Blob(
          audioChunksRef.current,
          {
            type: finalMimeType
          }
        );

        stopRecordingCleanup();

        setIsRecording(false);

        setRecordingTime(
          MAX_RECORDING_SECONDS
        );

        if (blob.size === 0) {
          setError(
            "Nta audio yafashwe."
          );

          return;
        }

        const localUrl =
          URL.createObjectURL(blob);

        setRecordedAudioUrl(
          localUrl
        );

        await sendVoiceToAntimate(
          blob,
          finalMimeType
        );
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        setError(
          "Habaye ikibazo mu gufata amajwi."
        );

        stopRecordingCleanup();

        setIsRecording(false);

        setRecordingTime(
          MAX_RECORDING_SECONDS
        );
      };

      recorder.start(250);

      setIsRecording(true);

      setRecordingTime(
        MAX_RECORDING_SECONDS
      );

      // ======================================================
      // 30 SECOND COUNTDOWN
      // ======================================================

      let remaining =
        MAX_RECORDING_SECONDS;

      if (recordingTimerRef.current) {
        clearInterval(
          recordingTimerRef.current
        );
      }

      recordingTimerRef.current =
        setInterval(() => {
          remaining -= 1;

          setRecordingTime(
            Math.max(remaining, 0)
          );

          if (remaining <= 0) {
            clearInterval(
              recordingTimerRef.current
            );

            recordingTimerRef.current =
              null;

            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current
                .state !== "inactive"
            ) {
              mediaRecorderRef.current.stop();
            }
          }
        }, 1000);
    } catch (err) {
      console.error(
        "MICROPHONE ERROR:",
        err
      );

      stopRecordingCleanup();

      setIsRecording(false);

      setRecordingTime(
        MAX_RECORDING_SECONDS
      );

      setError(
        err?.message ||
          "Microphone ntiyashoboye gufunguka."
      );
    }
  };

  // ==========================================================
  // STOP RECORDING MANUALLY
  // ==========================================================

  const stopRecording = () => {
    if (
      !mediaRecorderRef.current
    ) {
      return;
    }

    if (
      mediaRecorderRef.current.state !==
      "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // ==========================================================
  // SEND VOICE
  // ==========================================================

  const sendVoiceToAntimate = async (
    blob,
    mimeType
  ) => {
    setIsLoading(true);

    startThinkingMessages();

    setError("");

    addMessage(
      "user",
      "🎤 Ubutumwa bw'ijwi",
      {
        type: "voice"
      }
    );

    try {
      const formData =
        new FormData();

      /*
       * Backend receives "audio".
       *
       * The backend is responsible for:
       * WebM/OGG/etc -> WAV
       * 16kHz
       * mono
       */

      let extension = "webm";

      if (
        mimeType.includes("ogg")
      ) {
        extension = "ogg";
      }

      if (
        mimeType.includes("wav")
      ) {
        extension = "wav";
      }

      const audioFile =
        new File(
          [blob],
          `antimate_voice.${extension}`,
          {
            type:
              mimeType ||
              "audio/webm"
          }
        );

      formData.append(
        "audio",
        audioFile
      );

      formData.append(
        "language",
        "rw"
      );

      const token = getToken();

      const headers = {};

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      const response =
        await fetch(
          VOICE_API_URL,
          {
            method: "POST",

            headers,

            body: formData
          }
        );

      /*
       * Voice endpoint can return:
       *
       * JSON:
       * {
       *   success: true,
       *   answer_kinyarwanda: "...",
       *   audio_url: "..."
       * }
       *
       * OR binary audio.
       */

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !response.ok
      ) {
        let errorData = null;

        try {
          errorData =
            contentType.includes(
              "application/json"
            )
              ? await response.json()
              : {
                  message:
                    await response.text()
                };
        } catch {
          errorData = null;
        }

        throw new Error(
          errorData?.error ||
            errorData?.message ||
            `Voice request failed (${response.status})`
        );
      }

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        const data =
          await response.json();

        if (
          data?.success === false
        ) {
          throw new Error(
            data?.error ||
              data?.message ||
              "ANTIMATE voice failed."
          );
        }

        const answer =
          extractAnswer(data);

        const remoteAudioUrl =
          extractAudioUrl(data);

        if (remoteAudioUrl) {
          setVoiceAnswerUrl(
            remoteAudioUrl
          );
        }

        if (answer) {
          addMessage(
            "assistant",
            answer,
            {
              type: "voice",
              audioUrl:
                remoteAudioUrl ||
                null
            }
          );
        } else {
          addMessage(
            "assistant",
            "ANTIMATE ntiyagaruye text y'igisubizo."
          );
        }

        /*
         * If backend returned a local/base64
         * audio representation, support it.
         */

        if (
          data?.audio_base64
        ) {
          const audioBlob =
            base64ToBlob(
              data.audio_base64,
              data.audio_mime_type ||
                "audio/wav"
            );

          const url =
            URL.createObjectURL(
              audioBlob
            );

          setVoiceAnswerUrl(
            url
          );
        }

        return;
      }

      /*
       * Binary audio response
       */

      if (
        contentType.startsWith(
          "audio/"
        )
      ) {
        const audioBlob =
          await response.blob();

        const url =
          URL.createObjectURL(
            audioBlob
          );

        setVoiceAnswerUrl(
          url
        );

        addMessage(
          "assistant",
          "ANTIMATE yasubije mu ijwi.",
          {
            type: "voice",
            audioUrl: url
          }
        );

        return;
      }

      /*
       * Fallback: attempt JSON/text
       */

      const rawText =
        await response.text();

      let data;

      try {
        data =
          JSON.parse(rawText);
      } catch {
        data = {
          message: rawText
        };
      }

      const answer =
        extractAnswer(data);

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      addMessage(
        "assistant",
        answer,
        {
          type: "voice"
        }
      );
    } catch (err) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Habaye ikibazo mu kohereza voice kuri ANTIMATE."
      );

      addMessage(
        "assistant",
        "Mbabarira, ANTIMATE ntiyashoboye gutunganya voice yawe."
      );
    } finally {
      stopThinkingMessages();

      setIsLoading(false);
    }
  };

  // ==========================================================
  // BASE64 -> BLOB
  // ==========================================================

  const base64ToBlob = (
    base64,
    mimeType
  ) => {
    const byteCharacters =
      atob(base64);

    const byteNumbers =
      new Array(
        byteCharacters.length
      );

    for (
      let i = 0;
      i <
      byteCharacters.length;
      i++
    ) {
      byteNumbers[i] =
        byteCharacters.charCodeAt(
          i
        );
    }

    const byteArray =
      new Uint8Array(
        byteNumbers
      );

    return new Blob(
      [byteArray],
      {
        type: mimeType
      }
    );
  };

  // ==========================================================
  // REPLAY ANSWER
  // ==========================================================

  const replayAnswer = () => {
    if (!voiceAnswerUrl) {
      return;
    }

    if (
      answerAudioRef.current
    ) {
      answerAudioRef.current.currentTime = 0;

      answerAudioRef.current.play().catch(
        (err) => {
          console.error(
            "Audio replay error:",
            err
          );
        }
      );
    }
  };

  // ==========================================================
  // CLEAR CONVERSATION
  // ==========================================================

  const clearConversation = () => {
    setConversation([]);

    setError("");

    setVoiceAnswerUrl(null);

    setRecordedAudioUrl(null);

    setThinkingMessage(
      "ANTIMATE yiteguye."
    );
  };

  // ==========================================================
  // FORMAT COUNTDOWN
  // ==========================================================

  const formatTime = (
    seconds
  ) => {
    return String(
      Math.max(seconds, 0)
    ).padStart(2, "0");
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <style>{`

        /* ====================================================
           ANTIMATE AI
           Native CSS
        ==================================================== */

        .antimate-page {
          --ai-bg: var(--background, #f7f8fa);
          --ai-surface: var(--card-background, #ffffff);
          --ai-text: var(--text-primary, #17202a);
          --ai-muted: var(--text-secondary, #6b7280);
          --ai-border: var(--border-color, #e5e7eb);
          --ai-primary: var(--primary-color, #2563eb);
          --ai-primary-soft: rgba(37, 99, 235, 0.10);
          --ai-user-bg: var(--primary-color, #2563eb);
          --ai-assistant-bg: var(--card-background, #ffffff);
          --ai-danger: #dc2626;
          --ai-success: #16a34a;

          min-height: 100%;
          width: 100%;

          background:
            var(--ai-bg);

          color:
            var(--ai-text);

          box-sizing: border-box;

          display: flex;
          flex-direction: column;
        }

        .antimate-page *,
        .antimate-page *::before,
        .antimate-page *::after {
          box-sizing: border-box;
        }

        /* ====================================================
           HEADER
        ==================================================== */

        .antimate-header {
          width: 100%;

          padding:
            18px 24px;

          border-bottom:
            1px solid var(--ai-border);

          background:
            var(--ai-bg);

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          position: sticky;
          top: 0;

          z-index: 20;

          backdrop-filter:
            blur(10px);
        }

        .antimate-brand {
          display: flex;
          align-items: center;

          gap: 12px;

          min-width: 0;
        }

        .antimate-logo {
          width: 42px;
          height: 42px;

          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            var(--ai-primary-soft);

          color:
            var(--ai-primary);

          flex-shrink: 0;
        }

        .antimate-logo svg {
          width: 24px;
          height: 24px;
        }

        .antimate-title-wrap {
          min-width: 0;
        }

        .antimate-title {
          margin: 0;

          font-size: 18px;
          font-weight: 700;

          letter-spacing: -0.2px;
        }

        .antimate-subtitle {
          margin: 2px 0 0;

          font-size: 12px;

          color:
            var(--ai-muted);
        }

        .antimate-header-actions {
          display: flex;
          align-items: center;

          gap: 8px;
        }

        .antimate-clear-button {
          border: 1px solid var(--ai-border);

          background: transparent;

          color:
            var(--ai-muted);

          height: 36px;

          padding:
            0 12px;

          border-radius: 9px;

          cursor: pointer;

          font-size: 12px;

          transition:
            0.18s ease;
        }

        .antimate-clear-button:hover {
          color:
            var(--ai-text);

          border-color:
            var(--ai-primary);
        }

        /* ====================================================
           MAIN
        ==================================================== */

        .antimate-main {
          width: 100%;

          max-width: 980px;

          margin: 0 auto;

          flex: 1;

          display: flex;
          flex-direction: column;

          padding:
            24px 20px 150px;
        }

        /* ====================================================
           EMPTY STATE
        ==================================================== */

        .antimate-empty {
          flex: 1;

          min-height: 480px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 40px 20px;
        }

        .antimate-empty-icon {
          width: 68px;
          height: 68px;

          border-radius: 20px;

          background:
            var(--ai-primary-soft);

          color:
            var(--ai-primary);

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 20px;
        }

        .antimate-empty-icon svg {
          width: 36px;
          height: 36px;
        }

        .antimate-empty h2 {
          margin: 0;

          font-size: 27px;

          letter-spacing:
            -0.7px;
        }

        .antimate-empty p {
          margin:
            10px 0 0;

          max-width: 540px;

          line-height: 1.6;

          color:
            var(--ai-muted);

          font-size: 14px;
        }

        /* ====================================================
           CONVERSATION
        ==================================================== */

        .antimate-conversation {
          display: flex;

          flex-direction: column;

          gap: 20px;

          width: 100%;
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
          max-width: min(78%, 720px);

          display: flex;
          flex-direction: column;

          gap: 8px;
        }

        .antimate-message.user {
          align-items: flex-end;
        }

        .antimate-message.assistant {
          align-items: flex-start;
        }

        .antimate-message-label {
          font-size: 11px;

          color:
            var(--ai-muted);

          padding:
            0 4px;
        }

        .antimate-message-bubble {
          padding:
            12px 15px;

          border-radius: 16px;

          font-size: 14px;

          line-height: 1.65;

          white-space: pre-wrap;

          word-break: break-word;
        }

        .antimate-message.user
        .antimate-message-bubble {
          background:
            var(--ai-user-bg);

          color:
            #ffffff;

          border-bottom-right-radius:
            5px;
        }

        .antimate-message.assistant
        .antimate-message-bubble {
          background:
            var(--ai-assistant-bg);

          border:
            1px solid var(--ai-border);

          color:
            var(--ai-text);

          border-bottom-left-radius:
            5px;
        }

        /* ====================================================
           VOICE MESSAGE
        ==================================================== */

        .antimate-voice-message {
          display: flex;
          align-items: center;

          gap: 10px;
        }

        .antimate-voice-mini-icon {
          width: 32px;
          height: 32px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            var(--ai-primary-soft);

          color:
            var(--ai-primary);

          flex-shrink: 0;
        }

        .antimate-voice-mini-icon svg {
          width: 17px;
          height: 17px;
        }

        .antimate-replay-button {
          border: none;

          width: 38px;
          height: 38px;

          border-radius: 50%;

          background:
            var(--ai-primary-soft);

          color:
            var(--ai-primary);

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          transition:
            transform 0.15s ease,
            background 0.15s ease;
        }

        .antimate-replay-button:hover {
          transform: scale(1.05);

          background:
            rgba(37, 99, 235, 0.17);
        }

        .antimate-replay-button svg {
          width: 17px;
          height: 17px;
        }

        /* ====================================================
           THINKING
        ==================================================== */

        .antimate-thinking {
          display: flex;
          align-items: center;

          gap: 10px;

          margin:
            6px 0 0;

          color:
            var(--ai-muted);

          font-size: 13px;
        }

        .antimate-thinking-dots {
          display: flex;
          gap: 4px;
        }

        .antimate-thinking-dots span {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background:
            var(--ai-primary);

          animation:
            antimateDot 1.2s infinite ease-in-out;
        }

        .antimate-thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .antimate-thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes antimateDot {
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

        /* ====================================================
           ERROR
        ==================================================== */

        .antimate-error {
          margin-top: 12px;

          padding:
            10px 12px;

          border-radius: 9px;

          border:
            1px solid rgba(220, 38, 38, 0.25);

          background:
            rgba(220, 38, 38, 0.07);

          color:
            var(--ai-danger);

          font-size: 12px;
        }

        /* ====================================================
           INPUT AREA
        ==================================================== */

        .antimate-input-wrapper {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding:
            12px 20px 18px;

          pointer-events: none;

          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--ai-bg) 30%
            );
        }

        .antimate-input-area {
          width: 100%;

          max-width: 980px;

          margin: 0 auto;

          pointer-events: auto;

          background:
            var(--ai-surface);

          border:
            1px solid var(--ai-border);

          border-radius: 16px;

          padding:
            8px;

          display: flex;

          align-items: flex-end;

          gap: 8px;

          box-shadow:
            0 8px 30px rgba(0,0,0,0.08);
        }

        .antimate-textarea {
          flex: 1;

          min-width: 0;

          border: none;

          outline: none;

          resize: none;

          background:
            transparent;

          color:
            var(--ai-text);

          font-family: inherit;

          font-size: 14px;

          line-height: 1.5;

          padding:
            10px 8px;

          min-height: 42px;

          max-height: 130px;
        }

        .antimate-textarea::placeholder {
          color:
            var(--ai-muted);
        }

        /* ====================================================
           VOICE BUTTON
        ==================================================== */

        .antimate-voice-button {
          width: 44px;
          height: 44px;

          flex-shrink: 0;

          border: none;

          border-radius: 12px;

          background:
            var(--ai-primary-soft);

          color:
            var(--ai-primary);

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;

          transition:
            0.18s ease;
        }

        .antimate-voice-button:hover {
          transform: translateY(-1px);

          background:
            rgba(37, 99, 235, 0.16);
        }

        .antimate-voice-button.recording {
          background:
            rgba(220, 38, 38, 0.10);

          color:
            var(--ai-danger);
        }

        .antimate-voice-button:disabled {
          opacity: 0.5;

          cursor: not-allowed;

          transform: none;
        }

        .antimate-voice-button svg {
          width: 22px;
          height: 22px;
        }

        .antimate-recording-ring {
          position: absolute;

          inset: -4px;

          border:
            2px solid var(--ai-danger);

          border-radius: 15px;

          opacity: 0.45;

          animation:
            recordingPulse 1.3s infinite;
        }

        @keyframes recordingPulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }

          70% {
            transform: scale(1.08);
            opacity: 0;
          }

          100% {
            transform: scale(1.08);
            opacity: 0;
          }
        }

        /* ====================================================
           COUNTDOWN
        ==================================================== */

        .antimate-recording-info {
          position: absolute;

          bottom: 70px;

          left: 50%;

          transform:
            translateX(-50%);

          z-index: 40;

          display: flex;

          align-items: center;

          gap: 10px;

          background:
            var(--ai-surface);

          border:
            1px solid var(--ai-border);

          border-radius: 12px;

          padding:
            8px 12px;

          box-shadow:
            0 8px 25px rgba(0,0,0,0.10);

          white-space: nowrap;
        }

        .antimate-recording-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            var(--ai-danger);

          animation:
            recordingDot 1s infinite;
        }

        @keyframes recordingDot {
          50% {
            opacity: 0.35;
          }
        }

        .antimate-recording-text {
          font-size: 12px;

          color:
            var(--ai-muted);
        }

        .antimate-recording-time {
          font-size: 14px;

          font-weight: 700;

          color:
            var(--ai-danger);

          min-width: 24px;

          text-align: center;
        }

        /* ====================================================
           SEND BUTTON
        ==================================================== */

        .antimate-send-button {
          width: 44px;
          height: 44px;

          flex-shrink: 0;

          border: none;

          border-radius: 12px;

          background:
            var(--ai-primary);

          color:
            #ffffff;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          transition:
            0.18s ease;
        }

        .antimate-send-button:hover {
          transform:
            translateY(-1px);

          filter:
            brightness(1.05);
        }

        .antimate-send-button:disabled {
          opacity: 0.45;

          cursor: not-allowed;

          transform: none;
        }

        .antimate-send-button svg {
          width: 20px;
          height: 20px;
        }

        /* ====================================================
           RECORDED AUDIO PREVIEW
        ==================================================== */

        .antimate-recorded-preview {
          width: 100%;

          max-width: 980px;

          margin:
            0 auto 8px;

          display: flex;

          align-items: center;

          gap: 10px;

          padding:
            8px 12px;

          background:
            var(--ai-surface);

          border:
            1px solid var(--ai-border);

          border-radius: 12px;
        }

        .antimate-recorded-preview-label {
          font-size: 11px;

          color:
            var(--ai-muted);

          white-space: nowrap;
        }

        .antimate-recorded-preview audio {
          width: 100%;

          height: 34px;
        }

        /* ====================================================
           VOICE ANSWER PLAYER
        ==================================================== */

        .antimate-answer-player {
          margin-top: 4px;

          display: flex;

          align-items: center;

          gap: 8px;
        }

        .antimate-answer-player-text {
          font-size: 11px;

          color:
            var(--ai-muted);
        }

        /* ====================================================
           LOADING SPINNER
        ==================================================== */

        .antimate-spinner {
          width: 17px;
          height: 17px;

          border:
            2px solid var(--ai-border);

          border-top-color:
            var(--ai-primary);

          border-radius: 50%;

          animation:
            antimateSpin 0.7s linear infinite;
        }

        @keyframes antimateSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ====================================================
           RESPONSIVE
        ==================================================== */

        @media (max-width: 700px) {

          .antimate-header {
            padding:
              14px 14px;
          }

          .antimate-main {
            padding:
              18px 12px 145px;
          }

          .antimate-title {
            font-size: 16px;
          }

          .antimate-subtitle {
            display: none;
          }

          .antimate-message {
            max-width: 88%;
          }

          .antimate-empty {
            min-height: 420px;
          }

          .antimate-empty h2 {
            font-size: 23px;
          }

          .antimate-input-wrapper {
            padding:
              10px 10px 12px;
          }

          .antimate-input-area {
            border-radius: 14px;
          }

          .antimate-recording-info {
            bottom: 65px;
          }

          .antimate-clear-button {
            padding:
              0 9px;
          }
        }

      `}</style>

      <div className="antimate-page">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="antimate-header">

          <div className="antimate-brand">

            <div className="antimate-logo">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v18" />
                <path d="M8 7v10" />
                <path d="M16 7v10" />
                <path d="M5 10v4" />
                <path d="M19 10v4" />
              </svg>

            </div>

            <div className="antimate-title-wrap">

              <h1 className="antimate-title">
                ANTIMATE AI
              </h1>

              <p className="antimate-subtitle">
                Umufasha wawe w'ubwenge mu Kinyarwanda
              </p>

            </div>

          </div>

          {conversation.length > 0 && (
            <div className="antimate-header-actions">

              <button
                type="button"
                className="antimate-clear-button"
                onClick={
                  clearConversation
                }
              >
                Siba conversation
              </button>

            </div>
          )}

        </header>

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="antimate-main">

          {conversation.length === 0 ? (

            <section className="antimate-empty">

              <div className="antimate-empty-icon">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v18" />
                  <path d="M8 7v10" />
                  <path d="M16 7v10" />
                  <path d="M5 10v4" />
                  <path d="M19 10v4" />
                </svg>

              </div>

              <h2>
                Muraho, ndi ANTIMATE
              </h2>

              <p>
                Andika ikibazo cyangwa ukoreshe
                microphone uvuge mu Kinyarwanda.
                Nzakugerageza gusubiza mu buryo
                bworoshye kandi busobanutse.
              </p>

            </section>

          ) : (

            <section className="antimate-conversation">

              {conversation.map(
                (item) => (

                  <div
                    key={item.id}
                    className={
                      `antimate-message-row ${item.role}`
                    }
                  >

                    <div
                      className={
                        `antimate-message ${item.role}`
                      }
                    >

                      <div className="antimate-message-label">
                        {item.role === "user"
                          ? "Wowe"
                          : "ANTIMATE"}
                      </div>

                      <div className="antimate-message-bubble">

                        {item.type === "voice" ? (

                          <div className="antimate-voice-message">

                            <div className="antimate-voice-mini-icon">

                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <path d="M12 19v3" />
                                <path d="M8 22h8" />
                              </svg>

                            </div>

                            <span>
                              {item.text}
                            </span>

                          </div>

                        ) : (

                          item.text

                        )}

                      </div>

                      {item.role ===
                        "assistant" &&
                        (
                          item.audioUrl ||
                          voiceAnswerUrl
                        ) && (

                          <div className="antimate-answer-player">

                            <button
                              type="button"
                              className="antimate-replay-button"
                              onClick={() => {

                                const url =
                                  item.audioUrl ||
                                  voiceAnswerUrl;

                                if (
                                  answerAudioRef.current
                                ) {

                                  answerAudioRef.current.src =
                                    url;

                                  answerAudioRef.current.currentTime =
                                    0;

                                  answerAudioRef.current
                                    .play()
                                    .catch(
                                      console.error
                                    );

                                }

                              }}
                              aria-label="Replay ANTIMATE voice answer"
                              title="Replay"
                            >

                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>

                            </button>

                            <span className="antimate-answer-player-text">
                              Ongera wumve igisubizo
                            </span>

                          </div>

                        )}

                    </div>

                  </div>

                )
              )}

              {isLoading && (

                <div className="antimate-message-row assistant">

                  <div className="antimate-message assistant">

                    <div className="antimate-message-label">
                      ANTIMATE
                    </div>

                    <div className="antimate-message-bubble">

                      <div className="antimate-thinking">

                        <div className="antimate-thinking-dots">

                          <span />
                          <span />
                          <span />

                        </div>

                        <span>
                          {thinkingMessage}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              )}

              <div
                ref={messagesEndRef}
              />

            </section>

          )}

          {error && (

            <div className="antimate-error">
              {error}
            </div>

          )}

        </main>

        {/* ====================================================
            RECORDED AUDIO PREVIEW
        ==================================================== */}

        {recordedAudioUrl && !isRecording && (

          <div className="antimate-recorded-preview">

            <span className="antimate-recorded-preview-label">
              Ijwi wafashe:
            </span>

            <audio
              ref={recordedAudioRef}
              src={recordedAudioUrl}
              controls
            />

          </div>

        )}

        {/* ====================================================
            RECORDING COUNTDOWN
        ==================================================== */}

        {isRecording && (

          <div className="antimate-recording-info">

            <span className="antimate-recording-dot" />

            <span className="antimate-recording-text">
              Vuga ubu...
            </span>

            <span className="antimate-recording-time">
              {formatTime(recordingTime)}s
            </span>

          </div>

        )}

        {/* ====================================================
            INPUT
        ==================================================== */}

        <div className="antimate-input-wrapper">

          <div className="antimate-input-area">

            <textarea
              className="antimate-textarea"
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
                  ? "Vuga mu microphone..."
                  : "Andika ubutumwa bwawe..."
              }
              disabled={
                isLoading ||
                isRecording
              }
              rows={1}
            />

            {/* ==================================================
                NEW VOICE ICON
            ================================================== */}

            <button
              type="button"
              className={
                `antimate-voice-button ${
                  isRecording
                    ? "recording"
                    : ""
                }`
              }
              onClick={
                isRecording
                  ? stopRecording
                  : startRecording
              }
              disabled={
                isLoading
              }
              aria-label={
                isRecording
                  ? "Hagarika recording"
                  : "Fata voice"
              }
              title={
                isRecording
                  ? "Hagarika recording"
                  : "Vuga"
              }
            >

              {isRecording && (
                <span className="antimate-recording-ring" />
              )}

              {isRecording ? (

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

                /*
                 * New waveform-style voice icon
                 */

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >

                  <path d="M5 10v4" />
                  <path d="M9 7v10" />
                  <path d="M13 4v16" />
                  <path d="M17 7v10" />
                  <path d="M21 10v4" />

                </svg>

              )}

            </button>

            {/* ==================================================
                SEND
            ================================================== */}

            <button
              type="button"
              className="antimate-send-button"
              onClick={
                sendTextMessage
              }
              disabled={
                !message.trim() ||
                isLoading ||
                isRecording
              }
              aria-label="Ohereza ubutumwa"
              title="Ohereza"
            >

              {isLoading ? (

                <span className="antimate-spinner" />

              ) : (

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >

                  <path d="M22 2L11 13" />

                  <path d="M22 2l-7 20-4-9-9-4z" />

                </svg>

              )}

            </button>

          </div>

        </div>

        {/* ====================================================
            HIDDEN ANSWER AUDIO
        ==================================================== */}

        <audio
          ref={answerAudioRef}
          src={voiceAnswerUrl || ""}
          preload="auto"
        />

      </div>
    </>
  );
}