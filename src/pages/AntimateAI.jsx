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
- Voice icon when text is empty
- Send icon when user is typing
- Thinking/status messages
- Native CSS only
- Uses AppSettingsContext
- Fully compatible with Dark / Light theme
- ANTIMATE O-shaped icon
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
ANTIMATE O ICON
============================================================
*/

function AntimateIcon({
  size = 22,
  strokeWidth = 2.2,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="20"
        stroke="currentColor"
        strokeWidth={strokeWidth * 2.1}
      />

      <circle
        cx="32"
        cy="32"
        r="7"
        fill="currentColor"
      />
    </svg>
  );
}


/*
============================================================
PLAY ICON
============================================================
*/

function PlayIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}


/*
============================================================
PAUSE ICON
============================================================
*/

function PauseIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}


/*
============================================================
MIC / SOUND WAVE ICON
============================================================
*/

function VoiceIcon({ size = 22 }) {
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
STOP RECORDING ICON
============================================================
*/

function StopIcon({ size = 20 }) {
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
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="2"
      />
    </svg>
  );
}


/*
============================================================
SEND ICON
============================================================
*/

function SendIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}


/*
============================================================
ANTIMATE AI COMPONENT
============================================================
*/

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
    text,
  } = useAppSettings();


  /*
  ============================================================
  STATE
  ============================================================
  */

  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState("");

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
  AUTO SCROLL
  ============================================================
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    messages,
    thinkingText,
  ]);


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
          .forEach((track) =>
            track.stop()
          );
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

  const startThinking = (
    type = "text"
  ) => {
    if (type === "voice") {
      setThinkingText(
        language === "rw"
          ? "Ndumva ibyo uvuze..."
          : "I'm listening..."
      );

      return;
    }

    setThinkingText(
      language === "rw"
        ? "Ndigutekereza..."
        : "Thinking..."
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

      recordingTimerRef.current =
        null;
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

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };


  /*
  ============================================================
  MIME TYPE
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
  START RECORDING
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
              : "This browser does not support microphone access."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            }
          );

        mediaStreamRef.current =
          stream;

        const mimeType =
          getSupportedMimeType();

        const recorder = mimeType
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

            const blob =
              new Blob(
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
                : "Microphone could not be opened."
            )
        );
      }
    };


  /*
  ============================================================
  STOP RECORDING
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

  const extractAnswer = (
    data
  ) => {
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
      inputText.trim();

    if (
      !cleanText ||
      isSending ||
      isRecording
    ) {
      return;
    }

    setInputText("");

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
  SEND VOICE
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
        autoPlay: Boolean(
          audioUrl
        ),
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
            : "Sorry, I could not understand you or get an answer. Please try again.",
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
          if (
            id !== messageId
          ) {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (_) {}
          }
        }
      );

      let audio =
        audioRefs.current[
          messageId
        ];

      if (!audio) {
        audio = new Audio(url);

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

  const handleInputChange = (
    event
  ) => {
    const value =
      event.target.value;

    setInputText(value);

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


  const handleKeyDown = (
    event
  ) => {
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
  ERROR AUTO HIDE
  ============================================================
  */

  useEffect(() => {
    if (!recordingError) {
      return;
    }

    const timer =
      setTimeout(() => {
        setRecordingError("");
      }, 5000);

    return () =>
      clearTimeout(timer);
  }, [recordingError]);


  /*
  ============================================================
  TRANSLATED UI
  ============================================================
  */

  const isRW =
    language === "rw";

  const appTitle =
    "ANTIMATE AI";

  const subtitle =
    isRW
      ? "Umufasha w'ubwenge"
      : "Intelligent Assistant";

  const welcomeTitle =
    isRW
      ? "Muraho, ndi ANTIMATE"
      : "Hello, I'm ANTIMATE";

  const welcomeText =
    isRW
      ? "Andika ubutumwa cyangwa ukoreshe microphone uvuge mu Kinyarwanda. Ndi hano kugufasha."
      : "Type a message or use your microphone to speak. I'm here to help.";

  const placeholder =
    isRW
      ? "Andika ubutumwa..."
      : "Message ANTIMATE...";

  const onlineText =
    isRW
      ? "Iri gukora"
      : "Online";

  const youLabel =
    isRW
      ? "Wowe"
      : "You";

  const voiceMessageLabel =
    isRW
      ? "Ubutumwa bw'amajwi"
      : "Voice message";

  const antimateVoiceLabel =
    isRW
      ? "ANTIMATE Voice"
      : "ANTIMATE Voice";

  const replayText =
    isRW
      ? "Subiramo"
      : "Replay";

  const recordingText =
    isRW
      ? "Ndakumva..."
      : "Listening...";

  const recordingHint =
    isRW
      ? "kanda microphone guhagarika"
      : "tap microphone to stop";


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


        /*
        ======================================================
        ROOT
        ======================================================
        */

        .antimate-page {
          --antimate-bg:
            ${isDark
              ? "#0b0f14"
              : "#f7f9fc"};

          --antimate-surface:
            ${isDark
              ? "#141a21"
              : "#ffffff"};

          --antimate-surface-2:
            ${isDark
              ? "#1a212a"
              : "#f1f4f8"};

          --antimate-text:
            ${isDark
              ? "#f4f7fb"
              : "#111827"};

          --antimate-muted:
            ${isDark
              ? "#9aa5b1"
              : "#6b7280"};

          --antimate-border:
            ${isDark
              ? "#29313b"
              : "#e1e6ec"};

          --antimate-primary:
            ${isDark
              ? "#f4f7fb"
              : "#111827"};

          --antimate-primary-text:
            ${isDark
              ? "#0b0f14"
              : "#ffffff"};

          --antimate-user-bg:
            ${isDark
              ? "#e8edf3"
              : "#111827"};

          --antimate-user-text:
            ${isDark
              ? "#0b0f14"
              : "#ffffff"};

          --antimate-ai-bg:
            ${isDark
              ? "#151c24"
              : "#ffffff"};

          --antimate-ai-text:
            ${isDark
              ? "#f4f7fb"
              : "#111827"};

          --antimate-icon-bg:
            ${isDark
              ? "#f4f7fb"
              : "#111827"};

          --antimate-icon-color:
            ${isDark
              ? "#0b0f14"
              : "#ffffff"};

          --antimate-danger:
            #ef4444;

          width: 100%;
          height: 100%;
          min-height: 100vh;

          background:
            var(--antimate-bg);

          color:
            var(--antimate-text);

          display: flex;
          flex-direction: column;

          position: relative;
          overflow: hidden;

          transition:
            background-color 0.2s ease,
            color 0.2s ease;
        }


        /*
        ======================================================
        HEADER
        ======================================================
        */

        .antimate-header {
          height: 70px;
          min-height: 70px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 24px;

          border-bottom:
            1px solid
            var(--antimate-border);

          background:
            var(--antimate-bg);

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
        O-SHAPED LOGO
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
            var(--antimate-icon-bg);

          color:
            var(--antimate-icon-color);

          flex-shrink: 0;

          box-shadow:
            0 5px 18px
            rgba(0, 0, 0, 0.12);
        }


        .antimate-title {
          font-size: 17px;
          font-weight: 750;

          letter-spacing:
            -0.25px;
        }


        .antimate-subtitle {
          font-size: 12px;

          color:
            var(--antimate-muted);

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
            var(--antimate-muted);
        }


        .antimate-status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            #22c55e;

          box-shadow:
            0 0 0 3px
            ${isDark
              ? "rgba(34,197,94,0.10)"
              : "rgba(34,197,94,0.12)"};
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
            32px
            22px
            155px;

          scrollbar-width: thin;
        }


        .antimate-chat::-webkit-scrollbar {
          width: 6px;
        }


        .antimate-chat::-webkit-scrollbar-thumb {
          background:
            var(--antimate-border);

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
            var(--antimate-icon-bg);

          color:
            var(--antimate-icon-color);

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 22px;

          box-shadow:
            0 12px 35px
            rgba(0, 0, 0, 0.14);
        }


        .antimate-welcome h1 {
          margin: 0;

          font-size: 28px;

          letter-spacing:
            -0.8px;
        }


        .antimate-welcome p {
          max-width: 540px;

          margin: 11px 0 0;

          color:
            var(--antimate-muted);

          line-height: 1.65;

          font-size: 14px;
        }


        /*
        ======================================================
        MESSAGE
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

          font-weight: 650;

          color:
            var(--antimate-muted);

          margin:
            0 8px 6px;
        }


        /*
        ======================================================
        BUBBLE
        ======================================================
        */

        .antimate-bubble {
          padding:
            12px 16px;

          border-radius:
            17px;

          font-size: 14px;

          line-height: 1.58;

          white-space: pre-wrap;

          overflow-wrap: anywhere;

          transition:
            background-color 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
        }


        .antimate-message.user
        .antimate-bubble {
          background:
            var(--antimate-user-bg);

          color:
            var(--antimate-user-text);

          border-bottom-right-radius:
            5px;
        }


        .antimate-message.assistant
        .antimate-bubble {
          background:
            var(--antimate-ai-bg);

          color:
            var(--antimate-ai-text);

          border:
            1px solid
            var(--antimate-border);

          border-bottom-left-radius:
            5px;

          box-shadow:
            ${isDark
              ? "0 4px 15px rgba(0,0,0,0.12)"
              : "0 4px 15px rgba(15,23,42,0.035)"};
        }


        /*
        ======================================================
        VOICE MARK
        ======================================================
        */

        .antimate-voice-mark {
          display: flex;
          align-items: center;
          gap: 7px;

          font-size: 11px;

          margin-bottom: 7px;

          opacity: 0.75;
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


        /*
        ======================================================
        VOICE CONTROLS
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
            var(--antimate-border);

          border-radius: 12px;

          background:
            var(--antimate-surface);

          width: fit-content;

          box-shadow:
            ${isDark
              ? "0 4px 14px rgba(0,0,0,0.14)"
              : "0 4px 14px rgba(15,23,42,0.035)"};
        }


        .antimate-replay {
          width: 32px;
          height: 32px;

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
            transform 0.15s ease,
            opacity 0.15s ease;
        }


        .antimate-replay:hover {
          transform:
            scale(1.06);
        }


        .antimate-replay:disabled {
          opacity: 0.5;

          cursor: default;
        }


        .antimate-voice-status {
          font-size: 11px;

          color:
            var(--antimate-muted);

          min-width: 42px;
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
            var(--antimate-muted);

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
            14px
            18px
            18px;

          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--antimate-bg) 25%
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
            var(--antimate-surface);

          border:
            1px solid
            var(--antimate-border);

          border-radius:
            18px;

          box-shadow:
            ${isDark
              ? "0 10px 35px rgba(0,0,0,0.28)"
              : "0 10px 35px rgba(15,23,42,0.10)"};
        }


        .antimate-input {
          flex: 1;

          resize: none;

          border: none;

          outline: none;

          background:
            transparent;

          color:
            var(--antimate-text);

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
            var(--antimate-muted);
        }


        .antimate-input:disabled {
          opacity: 0.6;
        }


        /*
        ======================================================
        ACTION BUTTON
        ======================================================
        */

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

          background:
            var(--antimate-primary);

          color:
            var(--antimate-primary-text);

          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }


        .antimate-action-button:hover {
          transform:
            scale(1.04);
        }


        .antimate-action-button:disabled {
          opacity: 0.45;

          cursor: default;

          transform: none;
        }


        .antimate-action-button.recording {
          background:
            var(--antimate-danger);

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
                239,
                68,
                68,
                0.35
              );
          }

          70% {
            box-shadow:
              0 0 0 10px
              rgba(
                239,
                68,
                68,
                0
              );
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(
                239,
                68,
                68,
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
            9px 14px;

          border-radius:
            13px;

          background:
            var(--antimate-surface);

          border:
            1px solid
            var(--antimate-border);

          box-shadow:
            ${isDark
              ? "0 8px 25px rgba(0,0,0,0.28)"
              : "0 8px 25px rgba(15,23,42,0.12)"};

          font-size: 12px;
        }


        .antimate-recording-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            var(--antimate-danger);

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
          font-weight: 700;

          font-variant-numeric:
            tabular-nums;

          min-width: 38px;
        }


        .antimate-recording-hint {
          color:
            var(--antimate-muted);
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
            9px 13px;

          border-radius:
            10px;

          background:
            ${isDark
              ? "#35191b"
              : "#fff1f2"};

          color:
            ${isDark
              ? "#fda4af"
              : "#be123c"};

          border:
            1px solid
            ${isDark
              ? "#65252a"
              : "#fecdd3"};

          font-size: 12px;
        }


        /*
        ======================================================
        RESPONSIVE
        ======================================================
        */

        @media (max-width: 700px) {

          .antimate-header {
            height: 62px;
            min-height: 62px;

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
            min-height: 58vh;
          }


          .antimate-welcome-icon {
            width: 66px;
            height: 66px;

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
            border-radius:
              16px;
          }


          .antimate-recording-area {
            bottom: 78px;

            max-width:
              calc(100% - 24px);

            white-space:
              nowrap;
          }


          .antimate-recording-hint {
            display: none;
          }
        }

      `}</style>


      <div
        className="antimate-page"
        data-theme={theme}
      >


        {/* ==================================================
            HEADER
        ================================================== */}

        <header
          className="antimate-header"
        >

          <div
            className="antimate-title-area"
          >

            <div
              className="antimate-logo"
              aria-label="ANTIMATE"
            >
              <AntimateIcon
                size={24}
                strokeWidth={2}
              />
            </div>


            <div>

              <div
                className="antimate-title"
              >
                {appTitle}
              </div>


              <div
                className="antimate-subtitle"
              >
                {subtitle}
              </div>

            </div>

          </div>


          <div
            className="antimate-status"
          >

            <span
              className="antimate-status-dot"
            />

            {onlineText}

          </div>

        </header>


        {/* ==================================================
            CHAT
        ================================================== */}

        <main
          className="antimate-chat"
        >

          {messages.length === 0 &&
            !thinkingText && (

              <div
                className="antimate-welcome"
              >

                <div
                  className="antimate-welcome-icon"
                >
                  <AntimateIcon
                    size={43}
                    strokeWidth={2}
                  />
                </div>


                <h1>
                  {welcomeTitle}
                </h1>


                <p>
                  {welcomeText}
                </p>

              </div>

            )}


          {messages.map(
            (message) => (

              <div
                key={message.id}
                className={
                  `antimate-message ${
                    message.role ===
                    "user"
                      ? "user"
                      : "assistant"
                  }`
                }
              >

                <div
                  className="antimate-message-content"
                >

                  <div
                    className="antimate-message-label"
                  >
                    {message.role ===
                    "user"
                      ? youLabel
                      : appTitle}
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
                          ? voiceMessageLabel
                          : antimateVoiceLabel}

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
                          aria-label={
                            replayText
                          }
                          title={
                            replayText
                          }
                        >

                          {audioPlayingId ===
                          message.id ? (
                            <PauseIcon />
                          ) : (
                            <PlayIcon />
                          )}

                        </button>


                        <span
                          className="antimate-voice-status"
                        >
                          {audioPlayingId ===
                          message.id
                            ? "Playing"
                            : replayText}
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
            style={{
              height: 10,
            }}
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
              {recordingText}
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
              {recordingHint}
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
              value={inputText}
              onChange={
                handleInputChange
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder={
                placeholder
              }
              rows={1}
              disabled={
                isSending ||
                isRecording
              }
              aria-label={
                placeholder
              }
            />


            {/* =============================================
                EMPTY = VOICE
            ============================================= */}

            {!inputText.trim() ? (

              <button
                type="button"
                className={
                  `antimate-action-button ${
                    isRecording
                      ? "recording"
                      : ""
                  }`
                }
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
                    ? "Stop recording"
                    : "Vuga"
                }
              >

                {isRecording ? (
                  <StopIcon />
                ) : (
                  <VoiceIcon />
                )}

              </button>

            ) : (

              /* =========================================
                 TEXT = SEND
              ========================================= */

              <button
                type="button"
                className="antimate-action-button"
                onClick={
                  sendText
                }
                disabled={
                  isSending ||
                  !inputText.trim()
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