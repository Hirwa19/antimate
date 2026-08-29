import React, { useEffect, useRef, useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";

/*
============================================================
ANTIMATE AI
============================================================

Features:
- Text chat
- Voice recording max 30 seconds
- 30s countdown
- Voice transcript appears on USER side
- AI voice answer appears on AI side
- AI voice automatically plays once
- Replay button
- Fixed bottom composer
- Voice icon when text is empty
- Send icon when user is typing
- Thinking/status messages
- Native CSS only
- Theme controlled by AppSettingsContext
- Language controlled by AppSettingsContext
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

  /*
  ============================================================
  APP SETTINGS CONTEXT
  ============================================================
  */

  const {
    language,
    theme,
    isDark,
    text: t,
  } = useAppSettings();

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [isSending, setIsSending] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [thinkingText, setThinkingText] = useState("");

  const [audioPlayingId, setAudioPlayingId] =
    useState(null);

  const [recordingError, setRecordingError] =
    useState("");

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const recordingTimerRef = useRef(null);

  const audioRefs = useRef({});

  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);

  /*
  ============================================================
  THEME
  ============================================================
  */

  const themeLabel = isDark ? "Dark" : "Light";

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
  THINKING MESSAGES
  ============================================================
  */

  const startThinking = (type = "text") => {

    if (type === "voice") {

      setThinkingText(
        language === "rw"
          ? "🎤 Ndumva ibyo uvuze..."
          : "🎤 Listening to you..."
      );

      return;
    }

    setThinkingText(
      language === "rw"
        ? "🧠 Ndigutekereza..."
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

      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current = null;
    }
  };

  const startRecordingTimer = () => {

    stopRecordingTimer();

    setRecordingSeconds(0);

    recordingTimerRef.current =
      setInterval(() => {

        setRecordingSeconds((previous) => {

          const next = previous + 1;

          if (
            next >=
            MAX_RECORDING_SECONDS
          ) {

            clearInterval(
              recordingTimerRef.current
            );

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

  const formatRecordingTime = (
    seconds
  ) => {

    const remaining = Math.max(
      0,
      MAX_RECORDING_SECONDS - seconds
    );

    const mins = Math.floor(
      remaining / 60
    );

    const secs = remaining % 60;

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  /*
  ============================================================
  SUPPORTED MIME TYPE
  ============================================================
  */

  const getSupportedMimeType = () => {

    if (
      typeof MediaRecorder ===
        "undefined" ||
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

      if (
        MediaRecorder.isTypeSupported(
          type
        )
      ) {
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

  const startVoiceRecording =
    async () => {

      if (
        isSending ||
        isRecording
      ) {
        return;
      }

      setRecordingError("");

      try {

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {

          throw new Error(
            language === "rw"
              ? "Browser ntabwo ishyigikira microphone."
              : "This browser does not support the microphone."
          );
        }

        const stream =
          await navigator.mediaDevices
            .getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });

        mediaStreamRef.current =
          stream;

        const mimeType =
          getSupportedMimeType();

        const recorder = mimeType
          ? new MediaRecorder(stream, {
              mimeType,
            })
          : new MediaRecorder(stream);

        const chunks = [];

        recorder.ondataavailable =
          (event) => {

            if (
              event.data &&
              event.data.size > 0
            ) {
              chunks.push(event.data);
            }
          };

        recorder.onstop =
          async () => {

            stopRecordingTimer();

            stream
              .getTracks()
              .forEach((track) =>
                track.stop()
              );

            mediaStreamRef.current =
              null;

            mediaRecorderRef.current =
              null;

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

            const blob = new Blob(
              chunks,
              {
                type: finalType,
              }
            );

            await sendVoice(blob);
          };

        recorder.onerror = () => {

          stopRecordingTimer();

          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          mediaStreamRef.current =
            null;

          mediaRecorderRef.current =
            null;

          setIsRecording(false);

          setRecordingSeconds(0);

          setRecordingError(
            language === "rw"
              ? "Habaye ikibazo mu gufata amajwi."
              : "There was a problem recording audio."
          );
        };

        mediaRecorderRef.current =
          recorder;

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

        if (
          mediaStreamRef.current
        ) {

          mediaStreamRef.current
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          mediaStreamRef.current =
            null;
        }

        setRecordingError(
          error?.message ||
            (
              language === "rw"
                ? "Microphone ntiyabashije gufunguka."
                : "Microphone could not be accessed."
            )
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

    const recorder =
      mediaRecorderRef.current;

    if (!recorder) {

      setIsRecording(false);

      setRecordingSeconds(0);

      return;
    }

    if (
      recorder.state !==
      "inactive"
    ) {

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
  PARSE RESPONSE
  ============================================================
  */

  const parseResponse =
    async (response) => {

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

      const raw =
        await response.text();

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
  EXTRACT ANSWER
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

    if (
      audioUrl &&
      autoPlay
    ) {

      setTimeout(() => {

        playVoice(
          id,
          audioUrl
        );

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

    const cleanText =
      text.trim();

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

      const response =
        await fetch(
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
        await parseResponse(
          response
        );

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
            : "Sorry, there was a problem getting the answer. Please try again.",
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

  const sendVoice = async (
    blob
  ) => {

    setIsSending(true);

    startThinking("voice");

    try {

      const formData =
        new FormData();

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

      const response =
        await fetch(
          ANTIMATE_VOICE_ENDPOINT,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await parseResponse(
          response
        );

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
        autoPlay:
          Boolean(audioUrl),
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
            : "Sorry, I couldn't understand you or get an answer. Please try again.",
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
      ).forEach(
        ([id, audio]) => {

          if (id !== messageId) {

            try {

              audio.pause();

              audio.currentTime =
                0;

            } catch (_) {}
          }
        }
      );

      let audio =
        audioRefs.current[
          messageId
        ];

      if (!audio) {

        audio =
          new Audio(url);

        audio.preload =
          "auto";

        audio.onplay = () => {

          setAudioPlayingId(
            messageId
          );
        };

        audio.onended = () => {

          setAudioPlayingId(
            null
          );
        };

        audio.onerror = () => {

          setAudioPlayingId(
            null
          );
        };

        audioRefs.current[
          messageId
        ] = audio;
      }

      setAudioPlayingId(
        messageId
      );

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

  const replayVoice = (
    message
  ) => {

    if (
      !message?.audioUrl
    ) {
      return;
    }

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

  const handleInputChange =
    (event) => {

      const value =
        event.target.value;

      setText(value);

      const input =
        event.target;

      input.style.height =
        "auto";

      input.style.height =
        `${Math.min(
          input.scrollHeight,
          120
        )}px`;
    };

  const handleKeyDown =
    (event) => {

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
  RECORDING ERROR AUTO HIDE
  ============================================================
  */

  useEffect(() => {

    if (!recordingError)
      return;

    const timer =
      setTimeout(() => {

        setRecordingError("");

      }, 5000);

    return () =>
      clearTimeout(timer);

  }, [recordingError]);

  /*
  ============================================================
  UI
  ============================================================
  */

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        .antimate-page {
          --ai-bg: var(--bg-color);
          --ai-card: var(--card-bg);
          --ai-text: var(--text-color);
          --ai-muted: var(--secondary-text);
          --ai-border: var(--border-color);
          --ai-primary: var(--primary-color);

          width: 100%;
          height: 100%;
          min-height: 100vh;

          background: var(--ai-bg);
          color: var(--ai-text);

          display: flex;
          flex-direction: column;

          position: relative;
          overflow: hidden;

          transition:
            background 0.25s ease,
            color 0.25s ease;
        }

        /* ==================================================
           HEADER
        ================================================== */

        .antimate-header {
          height: 72px;
          min-height: 72px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 26px;

          border-bottom:
            1px solid var(--ai-border);

          background:
            color-mix(
              in srgb,
              var(--ai-bg) 94%,
              var(--ai-card)
            );

          position: relative;
          z-index: 10;
        }

        .antimate-title-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* ==================================================
           ANTIMATE ICON
        ================================================== */

        .antimate-logo {
          width: 42px;
          height: 42px;

          border-radius: 13px;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;

          background:
            linear-gradient(
              145deg,
              var(--ai-primary),
              color-mix(
                in srgb,
                var(--ai-primary) 72%,
                var(--ai-text)
              )
            );

          color: white;

          box-shadow:
            0 7px 20px
            color-mix(
              in srgb,
              var(--ai-primary) 22%,
              transparent
            );

          overflow: hidden;
        }

        .antimate-logo::before {
          content: "";

          position: absolute;

          width: 18px;
          height: 18px;

          border: 2px solid
            rgba(255,255,255,0.92);

          border-radius: 50%;

          opacity: 0.9;
        }

        .antimate-logo::after {
          content: "";

          position: absolute;

          width: 6px;
          height: 6px;

          background: white;

          border-radius: 50%;

          box-shadow:
            -9px 0 0
              rgba(255,255,255,0.85),
             9px 0 0
              rgba(255,255,255,0.85);
        }

        .antimate-brand {
          display: flex;
          flex-direction: column;
        }

        .antimate-title {
          font-size: 17px;
          font-weight: 750;

          letter-spacing:
            -0.35px;
        }

        .antimate-subtitle {
          font-size: 11px;

          color: var(--ai-muted);

          margin-top: 2px;

          letter-spacing:
            0.1px;
        }

        .antimate-status {
          display: flex;
          align-items: center;

          gap: 7px;

          font-size: 12px;

          color: var(--ai-muted);
        }

        .antimate-status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #35a86b;

          box-shadow:
            0 0 0 4px
            color-mix(
              in srgb,
              #35a86b 12%,
              transparent
            );
        }

        /* ==================================================
           CHAT
        ================================================== */

        .antimate-chat {
          flex: 1;

          width: 100%;
          max-width: 940px;

          margin: 0 auto;

          overflow-y: auto;

          padding:
            30px
            22px
            165px;

          scrollbar-width: thin;
        }

        .antimate-chat::-webkit-scrollbar {
          width: 5px;
        }

        .antimate-chat::-webkit-scrollbar-thumb {
          background:
            var(--ai-border);

          border-radius: 10px;
        }

        /* ==================================================
           WELCOME
        ================================================== */

        .antimate-welcome {
          min-height: 57vh;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 30px 20px;
        }

        .antimate-welcome-icon {
          width: 76px;
          height: 76px;

          border-radius: 23px;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;

          margin-bottom: 22px;

          background:
            linear-gradient(
              145deg,
              var(--ai-primary),
              color-mix(
                in srgb,
                var(--ai-primary) 72%,
                var(--ai-text)
              )
            );

          box-shadow:
            0 14px 38px
            color-mix(
              in srgb,
              var(--ai-primary) 24%,
              transparent
            );
        }

        .antimate-welcome-icon::before {
          content: "";

          width: 31px;
          height: 31px;

          border:
            3px solid
            rgba(255,255,255,0.95);

          border-radius: 50%;
        }

        .antimate-welcome-icon::after {
          content: "";

          position: absolute;

          width: 8px;
          height: 8px;

          border-radius: 50%;

          background: white;

          box-shadow:
            -14px 0 0
              rgba(255,255,255,0.9),
             14px 0 0
              rgba(255,255,255,0.9);
        }

        .antimate-welcome h1 {
          margin: 0;

          font-size: 28px;

          letter-spacing:
            -0.9px;
        }

        .antimate-welcome p {
          max-width: 540px;

          margin: 11px 0 0;

          color: var(--ai-muted);

          line-height: 1.65;

          font-size: 14px;
        }

        .antimate-language-badge {
          margin-top: 18px;

          padding: 6px 11px;

          border-radius: 20px;

          border:
            1px solid
            var(--ai-border);

          background:
            var(--ai-card);

          font-size: 11px;

          color: var(--ai-muted);
        }

        /* ==================================================
           MESSAGES
        ================================================== */

        .antimate-message {
          width: 100%;

          display: flex;

          margin-bottom: 21px;
        }

        .antimate-message.user {
          justify-content: flex-end;
        }

        .antimate-message.assistant {
          justify-content: flex-start;
        }

        .antimate-message-content {
          max-width:
            min(76%, 690px);

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
          font-size: 10px;

          font-weight: 700;

          color: var(--ai-muted);

          margin:
            0 9px
            6px;
        }

        .antimate-message.user
        .antimate-message-label {
          color:
            color-mix(
              in srgb,
              var(--ai-primary) 70%,
              var(--ai-muted)
            );
        }

        .antimate-bubble {
          padding:
            13px 16px;

          border-radius: 18px;

          font-size: 14px;

          line-height: 1.6;

          white-space: pre-wrap;

          overflow-wrap: anywhere;

          transition:
            background 0.2s ease,
            border 0.2s ease;
        }

        .antimate-message.user
        .antimate-bubble {
          background:
            var(--ai-primary);

          color: white;

          border-bottom-right-radius:
            6px;

          box-shadow:
            0 5px 16px
            color-mix(
              in srgb,
              var(--ai-primary) 14%,
              transparent
            );
        }

        .antimate-message.assistant
        .antimate-bubble {
          background:
            var(--ai-card);

          border:
            1px solid
            var(--ai-border);

          color:
            var(--ai-text);

          border-bottom-left-radius:
            6px;
        }

        /* ==================================================
           VOICE MARK
        ================================================== */

        .antimate-voice-mark {
          display: flex;
          align-items: center;

          gap: 8px;

          font-size: 10px;

          margin-bottom: 7px;

          opacity: 0.72;
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

          background:
            currentColor;
        }

        .antimate-wave-mini
        span:nth-child(1) {
          height: 5px;
        }

        .antimate-wave-mini
        span:nth-child(2) {
          height: 10px;
        }

        .antimate-wave-mini
        span:nth-child(3) {
          height: 7px;
        }

        .antimate-wave-mini
        span:nth-child(4) {
          height: 12px;
        }

        .antimate-wave-mini
        span:nth-child(5) {
          height: 6px;
        }

        /* ==================================================
           VOICE CONTROLS
        ================================================== */

        .antimate-voice-controls {
          display: flex;

          align-items: center;

          gap: 9px;

          margin-top: 8px;

          padding:
            7px 10px;

          border:
            1px solid
            var(--ai-border);

          border-radius: 13px;

          background:
            var(--ai-card);

          width: fit-content;
        }

        .antimate-replay {
          width: 32px;
          height: 32px;

          border: none;

          border-radius: 50%;

          background:
            var(--ai-primary);

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
          transform:
            scale(1.06);
        }

        .antimate-replay:disabled {
          opacity: 0.55;

          cursor: default;
        }

        .antimate-voice-status {
          font-size: 11px;

          color:
            var(--ai-muted);

          min-width: 42px;
        }

        /* ==================================================
           THINKING
        ================================================== */

        .antimate-thinking {
          display: flex;

          align-items: center;

          gap: 9px;

          color:
            var(--ai-muted);

          font-size: 12px;

          margin:
            5px 0 20px 8px;
        }

        .antimate-thinking-dots {
          display: flex;

          gap: 3px;
        }

        .antimate-thinking-dots span {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background:
            currentColor;

          animation:
            antimate-dot
            1.2s infinite;
        }

        .antimate-thinking-dots
        span:nth-child(2) {
          animation-delay:
            0.15s;
        }

        .antimate-thinking-dots
        span:nth-child(3) {
          animation-delay:
            0.3s;
        }

        @keyframes antimate-dot {

          0%,
          60%,
          100% {
            opacity: 0.25;

            transform:
              translateY(0);
          }

          30% {
            opacity: 1;

            transform:
              translateY(-3px);
          }
        }

        /* ==================================================
           COMPOSER
        ================================================== */

        .antimate-composer-wrapper {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding:
            14px
            18px
            19px;

          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--ai-bg) 28%
            );

          pointer-events: none;
        }

        .antimate-composer {
          pointer-events: auto;

          width: 100%;
          max-width: 940px;

          margin: 0 auto;

          display: flex;

          align-items: flex-end;

          gap: 9px;

          padding:
            8px 9px 8px 15px;

          background:
            var(--ai-card);

          border:
            1px solid
            var(--ai-border);

          border-radius: 19px;

          box-shadow:
            0 10px 35px
            rgba(0,0,0,0.10);
        }

        .antimate-input {
          flex: 1;

          resize: none;

          border: none;

          outline: none;

          background:
            transparent;

          color:
            var(--ai-text);

          font-family:
            inherit;

          font-size: 14px;

          line-height: 1.5;

          min-height: 40px;

          max-height: 120px;

          padding:
            9px 2px;

          overflow-y: auto;
        }

        .antimate-input::placeholder {
          color:
            var(--ai-muted);

          opacity: 0.85;
        }

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
            var(--ai-primary);

          color: white;

          transition:
            transform 0.15s ease,
            opacity 0.15s ease,
            box-shadow 0.15s ease;
        }

        .antimate-action-button:hover {
          transform:
            scale(1.045);

          box-shadow:
            0 5px 16px
            color-mix(
              in srgb,
              var(--ai-primary) 20%,
              transparent
            );
        }

        .antimate-action-button:disabled {
          opacity: 0.45;

          cursor: default;

          transform: none;

          box-shadow: none;
        }

        .antimate-action-button.recording {
          background:
            #d63b3b;

          animation:
            antimate-record-pulse
            1.4s infinite;
        }

        @keyframes antimate-record-pulse {

          0% {
            box-shadow:
              0 0 0 0
              rgba(214,59,59,0.35);
          }

          70% {
            box-shadow:
              0 0 0 11px
              rgba(214,59,59,0);
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(214,59,59,0);
          }
        }

        /* ==================================================
           RECORDING STATUS
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
            10px 14px;

          border-radius: 14px;

          background:
            var(--ai-card);

          border:
            1px solid
            var(--ai-border);

          box-shadow:
            0 10px 28px
            rgba(0,0,0,0.14);

          font-size: 11px;

          white-space: nowrap;
        }

        .antimate-recording-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            #d63b3b;

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
            opacity: 0.3;
          }
        }

        .antimate-countdown {
          font-weight: 750;

          font-variant-numeric:
            tabular-nums;

          min-width: 38px;
        }

        .antimate-recording-hint {
          color:
            var(--ai-muted);
        }

        /* ==================================================
           ERROR
        ================================================== */

        .antimate-error {
          position: fixed;

          left: 50%;

          bottom: 148px;

          transform:
            translateX(-50%);

          z-index: 50;

          max-width:
            calc(100% - 30px);

          padding:
            9px 13px;

          border-radius: 11px;

          background:
            color-mix(
              in srgb,
              #d63b3b 10%,
              var(--ai-card)
            );

          color:
            #e45b5b;

          border:
            1px solid
            color-mix(
              in srgb,
              #d63b3b 25%,
              var(--ai-border)
            );

          font-size: 11px;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 700px) {

          .antimate-header {
            height: 62px;

            min-height: 62px;

            padding:
              0 15px;
          }

          .antimate-logo {
            width: 36px;
            height: 36px;

            border-radius: 11px;
          }

          .antimate-title {
            font-size: 15px;
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
              13px
              145px;
          }

          .antimate-message-content {
            max-width: 89%;
          }

          .antimate-bubble {
            font-size: 13.5px;
          }

          .antimate-welcome {
            min-height: 55vh;
          }

          .antimate-welcome-icon {
            width: 66px;
            height: 66px;

            border-radius: 20px;
          }

          .antimate-welcome h1 {
            font-size: 23px;
          }

          .antimate-welcome p {
            font-size: 13px;
          }

          .antimate-composer-wrapper {
            padding:
              9px
              10px
              calc(
                10px +
                env(safe-area-inset-bottom)
              );
          }

          .antimate-composer {
            border-radius: 17px;

            padding-left: 13px;
          }

          .antimate-action-button {
            width: 41px;
            height: 41px;

            min-width: 41px;
          }

          .antimate-recording-area {
            bottom: 78px;

            max-width:
              calc(100% - 20px);

            overflow: hidden;
          }

          .antimate-recording-hint {
            display: none;
          }

          .antimate-error {
            bottom: 132px;
          }
        }

      `}</style>

      <div
        className="antimate-page"
        data-theme={theme}
        data-language={language}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="antimate-header">

          <div className="antimate-title-area">

            <div
              className="antimate-logo"
              aria-label="ANTIMATE AI"
            />

            <div className="antimate-brand">

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

              <div
                className="antimate-welcome"
              >

                <div
                  className="antimate-welcome-icon"
                />

                <h1>

                  {language === "rw"
                    ? "Muraho, ndi ANTIMATE"
                    : "Hello, I'm ANTIMATE"}

                </h1>

                <p>

                  {language === "rw"
                    ? "Andika ubutumwa cyangwa ukoreshe microphone uvuge mu Kinyarwanda. Ndi hano kugufasha."
                    : "Type a message or use your microphone to speak. I'm here to help you."}

                </p>

                <div
                  className="antimate-language-badge"
                >

                  {language === "rw"
                    ? "🇷🇼 Kinyarwanda"
                    : "🇬🇧 English"}

                  {" • "}

                  {themeLabel}

                </div>

              </div>
            )}

          {messages.map(
            (message) => (

              <div
                key={message.id}
                className={`antimate-message ${
                  message.role ===
                  "user"
                    ? "user"
                    : "assistant"
                }`}
              >

                <div
                  className="antimate-message-content"
                >

                  <div
                    className="antimate-message-label"
                  >

                    {message.role ===
                    "user"
                      ? language === "rw"
                        ? "Wowe"
                        : "You"
                      : "ANTIMATE"}

                  </div>

                  <div
                    className="antimate-bubble"
                  >

                    {message.voice && (

                      <div
                        className="antimate-voice-mark"
                      >

                        <span
                          className="antimate-wave-mini"
                        >
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                        </span>

                        {message.role ===
                        "user"
                          ? language === "rw"
                            ? "Ubutumwa bw'amajwi"
                            : "Voice message"
                          : language === "rw"
                          ? "ANTIMATE Voice"
                          : "ANTIMATE Voice"}

                      </div>
                    )}

                    {message.text}

                  </div>

                  {/* =================================================
                      AI VOICE CONTROLS
                  ================================================= */}

                  {message.role ===
                    "assistant" &&
                    message.audioUrl && (

                      <div
                        className="antimate-voice-controls"
                      >

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

                              <polygon
                                points="5 3 19 12 5 21 5 3"
                              />

                            </svg>
                          )}

                        </button>

                        <span
                          className="antimate-voice-status"
                        >

                          {audioPlayingId ===
                          message.id
                            ? language ===
                              "rw"
                              ? "Irimo..."
                              : "Playing"
                            : language ===
                              "rw"
                            ? "Subiramo"
                            : "Replay"}

                        </span>

                      </div>
                    )}

                </div>

              </div>
            )
          )}

          {/* ==================================================
              THINKING
          ================================================== */}

          {thinkingText && (

            <div
              className="antimate-thinking"
            >

              <div
                className="antimate-thinking-dots"
              >

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
          />

        </main>

        {/* ==================================================
            RECORDING STATUS
        ================================================== */}

        {isRecording && (

          <div
            className="antimate-recording-area"
          >

            <span
              className="antimate-recording-dot"
            />

            <span>

              {language === "rw"
                ? "Ndakumva..."
                : "Listening..."}

            </span>

            <span
              className="antimate-countdown"
            >
              {formatRecordingTime(
                recordingSeconds
              )}
            </span>

            <span
              className="antimate-recording-hint"
            >

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

          <div
            className="antimate-error"
          >
            {recordingError}
          </div>
        )}

        {/* ==================================================
            FIXED COMPOSER
        ================================================== */}

        <div
          className="antimate-composer-wrapper"
        >

          <div
            className="antimate-composer"
          >

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
              aria-label="Message"
            />

            {/* =================================================
                EMPTY = VOICE
            ================================================= */}

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

              /* =================================================
                 TEXT = SEND
              ================================================= */

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