import React, {
  useEffect,
  useRef,
  useState,
} from "react";

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
- Replay button remains available
- Fixed bottom composer
- Sound-wave icon when text is empty
- Send icon when user is typing
- Thinking/status messages
- Theme comes from AppSettingsContext
- Language comes from AppSettingsContext
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
  /*
  ============================================================
  APP SETTINGS
  ============================================================
  */

  const {
    language,
    theme,
    isDark,
  } = useAppSettings();

  /*
  ============================================================
  STATE
  ============================================================
  */

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [isSending, setIsSending] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [thinkingText, setThinkingText] =
    useState("");

  const [audioPlayingId, setAudioPlayingId] =
    useState(null);

  const [recordingError, setRecordingError] =
    useState("");

  /*
  ============================================================
  REFS
  ============================================================
  */

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const recordingTimerRef =
    useRef(null);

  const audioRefs =
    useRef({});

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  /*
  ============================================================
  TRANSLATIONS
  ============================================================
  */

  const ui = {
    en: {
      title: "ANTIMATE AI",
      subtitle: "Intelligent Assistant",

      online: "Online",

      welcomeTitle:
        "Hello, I am ANTIMATE",

      welcomeText:
        "Type a message or use the microphone to speak. I am here to help you.",

      user: "You",

      antimate: "ANTIMATE",

      voiceMessage: "Voice message",

      antimateVoice:
        "ANTIMATE Voice",

      replay: "Replay",

      playing: "Playing",

      thinking:
        "I am thinking...",

      listening:
        "Listening...",

      recordingHint:
        "tap microphone to stop",

      placeholder:
        "Write a message...",

      microphone:
        "Start voice recording",

      stopRecording:
        "Stop voice recording",

      send:
        "Send message",

      microphoneError:
        "Microphone could not be opened.",

      noAudio:
        "No audio was recorded. Please try again.",

      recordingFailed:
        "There was a problem recording your voice.",

      responseError:
        "Sorry, there was a problem getting the answer. Please try again.",

      voiceResponseError:
        "Sorry, I could not understand the voice or get an answer. Please try again.",
    },

    rw: {
      title: "ANTIMATE AI",
      subtitle: "Umufasha w'Ubwenge",

      online: "Iri gukora",

      welcomeTitle:
        "Muraho, ndi ANTIMATE",

      welcomeText:
        "Andika ubutumwa cyangwa ukoreshe microphone uvuge. Ndi hano kugufasha.",

      user: "Wowe",

      antimate: "ANTIMATE",

      voiceMessage:
        "Ubutumwa bw'amajwi",

      antimateVoice:
        "Ijwi rya ANTIMATE",

      replay: "Subiramo",

      playing: "Irimo kuvuga",

      thinking:
        "Ndigutekereza...",

      listening:
        "Ndumva ibyo uvuze...",

      recordingHint:
        "kanda microphone guhagarika",

      placeholder:
        "Andika ubutumwa...",

      microphone:
        "Tangira gufata amajwi",

      stopRecording:
        "Hagarika gufata amajwi",

      send:
        "Ohereza ubutumwa",

      microphoneError:
        "Microphone ntiyabashije gufunguka.",

      noAudio:
        "Nta majwi yafashwe. Ongera ugerageze.",

      recordingFailed:
        "Habaye ikibazo mu gufata amajwi.",

      responseError:
        "Mbabarira, habaye ikibazo mu kubona igisubizo. Ongera ugerageze.",

      voiceResponseError:
        "Mbabarira, sinabashije kumva neza cyangwa kubona igisubizo. Ongera uvuge.",
    },
  };

  const t =
    ui[language] || ui.rw;

  /*
  ============================================================
  THEME
  ============================================================

  IMPORTANT:
  We intentionally do NOT use prefers-color-scheme.

  The application's AppSettingsContext is the single
  source of truth.
  */

  const themeClass =
    isDark || theme === "dark"
      ? "theme-dark"
      : "theme-light";

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

      Object.values(
        audioRefs.current
      ).forEach((audio) => {
        try {
          audio.pause();
          audio.src = "";
        } catch (_) {}
      });
    };
  }, []);

  /*
  ============================================================
  THINKING
  ============================================================
  */

  const startThinking = (type = "text") => {
    if (type === "voice") {
      setThinkingText(
        `🎤 ${t.listening}`
      );

      return;
    }

    setThinkingText(
      `🧠 ${t.thinking}`
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
        setRecordingSeconds(
          (previous) => {
            const next =
              previous + 1;

            if (
              next >=
              MAX_RECORDING_SECONDS
            ) {
              clearInterval(
                recordingTimerRef.current
              );

              recordingTimerRef.current =
                null;

              setTimeout(() => {
                stopVoiceRecording();
              }, 50);

              return MAX_RECORDING_SECONDS;
            }

            return next;
          }
        );
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
    const remaining =
      Math.max(
        0,
        MAX_RECORDING_SECONDS -
          seconds
      );

    const mins =
      Math.floor(
        remaining / 60
      );

    const secs =
      remaining % 60;

    return `${String(
      mins
    ).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  /*
  ============================================================
  GET RECORDER MIME TYPE
  ============================================================
  */

  const getSupportedMimeType =
    () => {
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

      for (
        const type of types
      ) {
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
            t.microphoneError
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                echoCancellation:
                  true,
                noiseSuppression:
                  true,
                autoGainControl:
                  true,
              },
            }
          );

        mediaStreamRef.current =
          stream;

        const mimeType =
          getSupportedMimeType();

        const recorder =
          mimeType
            ? new MediaRecorder(
                stream,
                { mimeType }
              )
            : new MediaRecorder(
                stream
              );

        const chunks = [];

        recorder.ondataavailable =
          (event) => {
            if (
              event.data &&
              event.data.size > 0
            ) {
              chunks.push(
                event.data
              );
            }
          };

        recorder.onstop =
          async () => {
            stopRecordingTimer();

            stream
              .getTracks()
              .forEach(
                (track) =>
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
                t.noAudio
              );

              return;
            }

            const finalType =
              recorder.mimeType ||
              "audio/webm";

            const blob =
              new Blob(
                chunks,
                {
                  type: finalType,
                }
              );

            await sendVoice(
              blob
            );
          };

        recorder.onerror =
          () => {
            stopRecordingTimer();

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            mediaStreamRef.current =
              null;

            mediaRecorderRef.current =
              null;

            setIsRecording(false);

            setRecordingSeconds(0);

            setRecordingError(
              t.recordingFailed
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
            .forEach(
              (track) =>
                track.stop()
            );

          mediaStreamRef.current =
            null;
        }

        setRecordingError(
          error?.message ||
            t.microphoneError
        );
      }
    };

  /*
  ============================================================
  STOP VOICE RECORDING
  ============================================================
  */

  const stopVoiceRecording =
    () => {
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

  const extractAnswer =
    (data) => {
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

  const addUserMessage =
    ({
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
        timestamp:
          new Date(),
      };

      setMessages(
        (previous) => [
          ...previous,
          message,
        ]
      );

      return message;
    };

  /*
  ============================================================
  ADD AI MESSAGE
  ============================================================
  */

  const addAIMessage =
    ({
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
        voice: Boolean(
          audioUrl
        ),
        timestamp:
          new Date(),
      };

      setMessages(
        (previous) => [
          ...previous,
          message,
        ]
      );

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
  SEND TEXT
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
      console.error(
        "Text request error:",
        error
      );

      addAIMessage({
        text: t.responseError,
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
  SEND VOICE
  ============================================================
  */

  const sendVoice =
    async (blob) => {
      setIsSending(true);

      startThinking("voice");

      try {
        const formData =
          new FormData();

        /*
         * Backend converts incoming audio
         * to WAV 16kHz mono.
         */

        const extension =
          blob.type.includes("ogg")
            ? "ogg"
            : blob.type.includes(
                "mp4"
              )
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

        /*
         * USER TRANSCRIPT
         */

        const transcript =
          data.input_kinyarwanda ||
          data.transcript ||
          data.transcription ||
          data.text ||
          "";

        /*
         * AI ANSWER
         */

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
            t.voiceResponseError,
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

  const playVoice =
    async (
      messageId,
      url
    ) => {
      if (!url) return;

      try {
        Object.entries(
          audioRefs.current
        ).forEach(
          ([id, audio]) => {
            if (
              id !== messageId
            ) {
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

          audio.onplay =
            () => {
              setAudioPlayingId(
                messageId
              );
            };

          audio.onended =
            () => {
              setAudioPlayingId(
                null
              );
            };

          audio.onerror =
            () => {
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

        setAudioPlayingId(
          null
        );
      }
    };

  /*
  ============================================================
  REPLAY
  ============================================================
  */

  const replayVoice =
    (message) => {
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
  ERROR AUTO CLEAR
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
  RENDER
  ============================================================
  */

  return (
    <>
      <style>{`

        /* ==================================================
           ANTIMATE AI THEME SYSTEM
           Theme is controlled ONLY by AppSettingsContext.
        ================================================== */

        .antimate-page {
          --ai-bg: #f8fafc;
          --ai-surface: #ffffff;
          --ai-surface-2: #f1f5f9;

          --ai-text: #0f172a;
          --ai-text-soft: #475569;
          --ai-text-muted: #64748b;

          --ai-border: #dbe2ea;
          --ai-border-strong: #cbd5e1;

          --ai-primary: #0f172a;
          --ai-primary-hover: #1e293b;

          --ai-primary-text: #ffffff;

          --ai-user-bubble: #0f172a;
          --ai-user-text: #ffffff;

          --ai-assistant-bubble: #ffffff;
          --ai-assistant-text: #0f172a;

          --ai-icon-bg: #0f172a;
          --ai-icon-color: #ffffff;

          --ai-success: #16a34a;
          --ai-danger: #dc2626;

          --ai-error-bg: #fef2f2;
          --ai-error-border: #fecaca;
          --ai-error-text: #b91c1c;

          --ai-shadow:
            0 10px 35px rgba(
              15,
              23,
              42,
              0.08
            );

          width: 100%;
          height: 100%;
          min-height: 100vh;

          display: flex;
          flex-direction: column;

          background: var(--ai-bg);
          color: var(--ai-text);

          position: relative;
          overflow: hidden;

          transition:
            background-color 0.2s ease,
            color 0.2s ease;
        }

        /*
        ======================================================
        DARK THEME
        ======================================================
        */

        .antimate-page.theme-dark {
          --ai-bg: #0f172a;
          --ai-surface: #172033;
          --ai-surface-2: #1e293b;

          --ai-text: #f8fafc;
          --ai-text-soft: #cbd5e1;
          --ai-text-muted: #94a3b8;

          --ai-border: #334155;
          --ai-border-strong: #475569;

          /*
           * IMPORTANT:
           * Never use black on this dark background.
           */

          --ai-primary: #f8fafc;
          --ai-primary-hover: #ffffff;

          --ai-primary-text: #0f172a;

          --ai-user-bubble: #e2e8f0;
          --ai-user-text: #0f172a;

          --ai-assistant-bubble: #172033;
          --ai-assistant-text: #f8fafc;

          --ai-icon-bg: #f8fafc;
          --ai-icon-color: #0f172a;

          --ai-success: #4ade80;
          --ai-danger: #f87171;

          --ai-error-bg: #3b1d24;
          --ai-error-border: #7f1d1d;
          --ai-error-text: #fecaca;

          --ai-shadow:
            0 12px 35px rgba(
              0,
              0,
              0,
              0.28
            );
        }

        /*
        ======================================================
        RESET
        ======================================================
        */

        .antimate-page *,
        .antimate-page *::before,
        .antimate-page *::after {
          box-sizing: border-box;
        }

        /*
        ======================================================
        HEADER
        ======================================================
        */

        .antimate-header {
          height: 68px;
          min-height: 68px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 24px;

          border-bottom:
            1px solid var(--ai-border);

          background: var(--ai-bg);

          position: relative;
          z-index: 10;
        }

        .antimate-title-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /*
        ======================================================
        ANTIMATE ICON
        ======================================================

        We keep the ANTIMATE A icon.

        The icon automatically changes contrast with theme.
        ======================================================
        */

        .antimate-logo {
          width: 40px;
          height: 40px;

          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            var(--ai-icon-bg);

          color:
            var(--ai-icon-color);

          font-size: 17px;
          font-weight: 800;

          flex-shrink: 0;

          border:
            1px solid
            var(--ai-border-strong);

          box-shadow:
            0 5px 15px
            rgba(0, 0, 0, 0.08);
        }

        .antimate-title {
          font-size: 17px;
          font-weight: 750;

          letter-spacing:
            -0.25px;

          color:
            var(--ai-text);
        }

        .antimate-subtitle {
          font-size: 12px;

          color:
            var(--ai-text-muted);

          margin-top: 2px;
        }

        /*
        ======================================================
        STATUS
        ======================================================
        */

        .antimate-status {
          display: flex;
          align-items: center;

          gap: 7px;

          font-size: 12px;

          color:
            var(--ai-text-soft);
        }

        .antimate-status-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            var(--ai-success);

          box-shadow:
            0 0 0 3px
            color-mix(
              in srgb,
              var(--ai-success) 15%,
              transparent
            );
        }

        /*
        ======================================================
        CHAT
        ======================================================
        */

        .antimate-chat {
          flex: 1;

          width: 100%;
          max-width: 920px;

          margin: 0 auto;

          overflow-y: auto;

          padding:
            30px
            22px
            155px;

          scrollbar-width: thin;

          scrollbar-color:
            var(--ai-border-strong)
            transparent;
        }

        .antimate-chat::-webkit-scrollbar {
          width: 6px;
        }

        .antimate-chat::-webkit-scrollbar-thumb {
          background:
            var(--ai-border-strong);

          border-radius: 10px;
        }

        /*
        ======================================================
        WELCOME
        ======================================================
        */

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
          width: 76px;
          height: 76px;

          border-radius: 22px;

          background:
            var(--ai-icon-bg);

          color:
            var(--ai-icon-color);

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 29px;
          font-weight: 800;

          margin-bottom: 20px;

          border:
            1px solid
            var(--ai-border-strong);

          box-shadow:
            var(--ai-shadow);
        }

        .antimate-welcome h1 {
          margin: 0;

          font-size: 28px;

          letter-spacing:
            -0.8px;

          color:
            var(--ai-text);
        }

        .antimate-welcome p {
          max-width: 520px;

          margin: 10px 0 0;

          color:
            var(--ai-text-muted);

          line-height: 1.65;

          font-size: 14px;
        }

        /*
        ======================================================
        MESSAGES
        ======================================================
        */

        .antimate-message {
          width: 100%;

          display: flex;

          margin-bottom: 22px;
        }

        .antimate-message.user {
          justify-content: flex-end;
        }

        .antimate-message.assistant {
          justify-content: flex-start;
        }

        .antimate-message-content {
          max-width:
            min(75%, 680px);

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

          font-weight: 700;

          color:
            var(--ai-text-muted);

          margin:
            0 8px 6px;
        }

        /*
        ======================================================
        BUBBLES
        ======================================================
        */

        .antimate-bubble {
          padding:
            13px 16px;

          border-radius: 18px;

          font-size: 14px;

          line-height: 1.6;

          white-space: pre-wrap;

          overflow-wrap:
            anywhere;

          transition:
            background-color 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
        }

        /*
        LIGHT:
        dark user bubble + white text
        white AI bubble + dark text
        */

        .antimate-message.user
        .antimate-bubble {
          background:
            var(--ai-user-bubble);

          color:
            var(--ai-user-text);

          border-bottom-right-radius:
            6px;
        }

        .antimate-message.assistant
        .antimate-bubble {
          background:
            var(--ai-assistant-bubble);

          color:
            var(--ai-assistant-text);

          border:
            1px solid
            var(--ai-border);

          border-bottom-left-radius:
            6px;

          box-shadow:
            0 2px 10px
            rgba(0, 0, 0, 0.025);
        }

        /*
        ======================================================
        VOICE MARK
        ======================================================
        */

        .antimate-voice-mark {
          display: flex;
          align-items: center;

          gap: 8px;

          font-size: 11px;

          margin-bottom: 8px;

          opacity: 0.82;
        }

        .antimate-message.user
        .antimate-voice-mark {
          justify-content: flex-end;
        }

        .antimate-wave-mini {
          display: inline-flex;

          align-items: center;

          gap: 2px;

          height: 14px;
        }

        .antimate-wave-mini span {
          width: 2px;

          border-radius: 3px;

          background:
            currentColor;
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

        /*
        ======================================================
        AI VOICE CONTROLS
        ======================================================
        */

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

          border-radius: 12px;

          background:
            var(--ai-surface);

          width: fit-content;

          box-shadow:
            0 3px 12px
            rgba(0, 0, 0, 0.04);
        }

        .antimate-replay {
          width: 32px;
          height: 32px;

          border: none;

          border-radius: 50%;

          background:
            var(--ai-primary);

          color:
            var(--ai-primary-text);

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
            var(--ai-text-muted);

          min-width: 48px;
        }

        /*
        ======================================================
        THINKING
        ======================================================
        */

        .antimate-thinking {
          display: flex;

          align-items: center;

          gap: 9px;

          color:
            var(--ai-text-muted);

          font-size: 13px;

          margin:
            6px 0 20px 8px;
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
            antimate-dot 1.2s
            infinite;
        }

        .antimate-thinking-dots span:nth-child(2) {
          animation-delay:
            0.15s;
        }

        .antimate-thinking-dots span:nth-child(3) {
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

        /*
        ======================================================
        COMPOSER
        ======================================================
        */

        .antimate-composer-wrapper {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding:
            14px 18px
            18px;

          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--ai-bg) 24%
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

          padding:
            8px 9px
            8px 14px;

          background:
            var(--ai-surface);

          border:
            1px solid
            var(--ai-border);

          border-radius: 19px;

          box-shadow:
            var(--ai-shadow);
        }

        /*
        ======================================================
        INPUT
        ======================================================
        */

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

          min-height: 38px;
          max-height: 120px;

          padding:
            9px 2px;

          overflow-y: auto;
        }

        .antimate-input::placeholder {
          color:
            var(--ai-text-muted);
        }

        /*
        ======================================================
        ACTION BUTTON
        ======================================================
        */

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

          color:
            var(--ai-primary-text);

          transition:
            transform 0.15s ease,
            opacity 0.15s ease,
            box-shadow 0.15s ease;
        }

        .antimate-action-button:hover {
          transform:
            scale(1.05);
        }

        .antimate-action-button:disabled {
          opacity: 0.45;

          cursor: default;

          transform: none;
        }

        /*
        ======================================================
        RECORDING BUTTON
        ======================================================
        */

        .antimate-action-button.recording {
          background:
            var(--ai-danger);

          color:
            #ffffff;

          animation:
            antimate-record-pulse
            1.4s infinite;
        }

        @keyframes antimate-record-pulse {
          0% {
            box-shadow:
              0 0 0 0
              rgba(
                220,
                38,
                38,
                0.35
              );
          }

          70% {
            box-shadow:
              0 0 0 10px
              rgba(
                220,
                38,
                38,
                0
              );
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(
                220,
                38,
                38,
                0
              );
          }
        }

        /*
        ======================================================
        RECORDING STATUS
        ======================================================
        */

        .antimate-recording-area {
          position: fixed;

          left: 50%;
          bottom: 88px;

          transform:
            translateX(-50%);

          z-index: 40;

          display: flex;

          align-items: center;

          gap: 10px;

          padding:
            10px 14px;

          border-radius: 13px;

          background:
            var(--ai-surface);

          border:
            1px solid
            var(--ai-border);

          box-shadow:
            var(--ai-shadow);

          font-size: 12px;

          color:
            var(--ai-text);
        }

        .antimate-recording-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            var(--ai-danger);

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
          font-weight: 800;

          font-variant-numeric:
            tabular-nums;

          min-width: 38px;

          color:
            var(--ai-text);
        }

        .antimate-recording-hint {
          color:
            var(--ai-text-muted);
        }

        /*
        ======================================================
        ERROR
        ======================================================
        */

        .antimate-error {
          position: fixed;

          left: 50%;
          bottom: 145px;

          transform:
            translateX(-50%);

          z-index: 50;

          max-width:
            calc(100% - 30px);

          padding:
            10px 14px;

          border-radius: 10px;

          background:
            var(--ai-error-bg);

          color:
            var(--ai-error-text);

          border:
            1px solid
            var(--ai-error-border);

          font-size: 12px;

          box-shadow:
            var(--ai-shadow);
        }

        .antimate-empty-space {
          height: 10px;
        }

        /*
        ======================================================
        MOBILE
        ======================================================
        */

        @media (max-width: 700px) {

          .antimate-header {
            height: 60px;
            min-height: 60px;

            padding:
              0 15px;
          }

          .antimate-logo {
            width: 35px;
            height: 35px;

            border-radius: 10px;
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
              140px;
          }

          .antimate-message-content {
            max-width: 88%;
          }

          .antimate-bubble {
            font-size: 13.5px;
          }

          .antimate-welcome {
            min-height: 60vh;
          }

          .antimate-welcome-icon {
            width: 68px;
            height: 68px;

            border-radius: 19px;
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
                env(
                  safe-area-inset-bottom
                )
              );
          }

          .antimate-composer {
            border-radius: 17px;
          }

          .antimate-recording-area {
            bottom: 80px;

            max-width:
              calc(100% - 20px);

            white-space:
              nowrap;
          }

          .antimate-recording-hint {
            display: none;
          }
        }

        /*
        ======================================================
        ACCESSIBILITY
        ======================================================
        */

        .antimate-action-button:focus-visible,
        .antimate-replay:focus-visible,
        .antimate-input:focus-visible {
          outline:
            2px solid
            var(--ai-primary);

          outline-offset: 2px;
        }

      `}</style>

      <div
        className={`antimate-page ${themeClass}`}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="antimate-header">

          <div className="antimate-title-area">

            <div
              className="antimate-logo"
              aria-label="ANTIMATE AI"
            >
              A
            </div>

            <div>

              <div className="antimate-title">
                {t.title}
              </div>

              <div className="antimate-subtitle">
                {t.subtitle}
              </div>

            </div>

          </div>

          <div className="antimate-status">

            <span
              className="antimate-status-dot"
            />

            {t.online}

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
                  {t.welcomeTitle}
                </h1>

                <p>
                  {t.welcomeText}
                </p>

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

                <div className="antimate-message-content">

                  <div className="antimate-message-label">

                    {message.role ===
                    "user"
                      ? t.user
                      : t.antimate}

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

                        {message.role ===
                        "user"
                          ? t.voiceMessage
                          : t.antimateVoice}

                      </div>

                    )}

                    {message.text}

                  </div>

                  {/* =====================================
                      AI VOICE CONTROLS
                  ===================================== */}

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
                            audioPlayingId ===
                            message.id
                              ? t.playing
                              : t.replay
                          }
                          title={
                            audioPlayingId ===
                            message.id
                              ? t.playing
                              : t.replay
                          }
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
                              aria-hidden="true"
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
                              aria-hidden="true"
                            >

                              <polygon
                                points="
                                  5 3
                                  19 12
                                  5 21
                                  5 3
                                "
                              />

                            </svg>

                          )}

                        </button>

                        <span className="antimate-voice-status">

                          {audioPlayingId ===
                          message.id
                            ? t.playing
                            : t.replay}

                        </span>

                      </div>

                    )}

                </div>

              </div>

            )
          )}

          {/* =================================================
              THINKING
          ================================================= */}

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
              {t.listening}
            </span>

            <span className="antimate-countdown">
              {formatRecordingTime(
                recordingSeconds
              )}
            </span>

            <span className="antimate-recording-hint">
              {t.recordingHint}
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
                t.placeholder
              }
              rows={1}
              disabled={
                isSending ||
                isRecording
              }
              aria-label={
                t.placeholder
              }
            />

            {/* =============================================
                EMPTY INPUT
                SOUND WAVE ICON
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
                    ? t.stopRecording
                    : t.microphone
                }
                title={
                  isRecording
                    ? t.stopRecording
                    : t.microphone
                }
              >

                {isRecording ? (

                  /*
                   * STOP ICON
                   */

                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
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
                   * SAME SOUND-WAVE ICON
                   * USER REQUESTED TO KEEP THIS ICON
                   */

                  <svg
                    width="22"
                    height="22"
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

                )}

              </button>

            ) : (

              /*
              =============================================
              TEXT EXISTS
              SEND ICON
              =============================================
              */

              <button
                type="button"
                className="antimate-action-button"
                onClick={sendText}
                disabled={
                  isSending ||
                  !text.trim()
                }
                aria-label={
                  t.send
                }
                title={
                  t.send
                }
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
                  aria-hidden="true"
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