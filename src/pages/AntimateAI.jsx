import React, { useEffect, useRef, useState } from "react";

/*
============================================================
 ANTIMATE AI
------------------------------------------------------------
 Native CSS only
 No Tailwind
 Text + Voice
 30s voice countdown
 Auto-play voice response
 Replay voice response
 Fixed composer
 Sound-wave voice icon
 Send icon while typing
============================================================
*/

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const ANTIMATE_AI_URL =
  import.meta.env.VITE_ANTIMATE_AI_URL ||
  "https://antimate-ai.hf.space";

/* ============================================================
   ICONS
============================================================ */

function SoundWaveIcon({ size = 23 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 10V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 7V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 4V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 7V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 10V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21 3L10.8 13.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3L14.5 21L10.8 13.2L3 9.5L21 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function ReplayIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 11A8 8 0 0 0 6.4 5.3L4 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4V8H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13A8 8 0 0 0 17.6 18.7L20 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 20V16H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BotIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="7"
        width="16"
        height="13"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 3V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
      <path
        d="M8.5 17H15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 21C5.4 16.9 8 15 12 15C16 15 18.6 16.9 19.5 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function AntimateAI() {
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [recording, setRecording] = useState(false);

  const [recordingTime, setRecordingTime] = useState(30);

  const [voiceUrl, setVoiceUrl] = useState(null);

  const [voiceMimeType, setVoiceMimeType] = useState("");

  const [error, setError] = useState("");

  const [waitingText, setWaitingText] = useState(
    "Aah, reka ntekereze..."
  );

  const messagesEndRef = useRef(null);

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const audioChunksRef = useRef([]);

  const countdownRef = useRef(null);

  const audioRef = useRef(null);

  const waitingTimerRef = useRef(null);

  /* ==========================================================
     AUTO SCROLL
  ========================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* ==========================================================
     WAITING PHRASES
  ========================================================== */

  const waitingMessages = [
    "Aah, reka ntekereze...",
    "Ndimo kureba amakuru ya system...",
    "Ndimo gutegura igisubizo...",
    "Reka ndebe uko nakugirira inama...",
    "ANTIMATE iracyatekereza...",
  ];

  const startWaitingMessages = () => {
    let index = 0;

    setWaitingText(waitingMessages[0]);

    waitingTimerRef.current = setInterval(() => {
      index = (index + 1) % waitingMessages.length;

      setWaitingText(waitingMessages[index]);
    }, 2300);
  };

  const stopWaitingMessages = () => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
  };

  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      stopWaitingMessages();

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  /* ==========================================================
     ADD MESSAGE
  ========================================================== */

  const addMessage = (message) => {
    setMessages((previous) => [
      ...previous,
      {
        id:
          Date.now() +
          Math.random().toString(36).substring(2, 8),
        ...message,
      },
    ]);
  };

  /* ==========================================================
     TEXT API
  ========================================================== */

  const sendText = async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    setError("");

    addMessage({
      role: "user",
      type: "text",
      text,
    });

    setInput("");

    setLoading(true);

    startWaitingMessages();

    try {
      /*
       * ANTIMATE AI TEXT ENDPOINT
       *
       * We use the Gradio /chat endpoint exposed by app.py.
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
          `ANTIMATE text request failed: ${response.status}`
        );
      }

      const result = await response.json();

      /*
       * Gradio 5 API normally returns:
       *
       * {
       *   event_id: "..."
       * }
       */

      if (!result.event_id) {
        throw new Error(
          "ANTIMATE ntiyagarutseho event_id."
        );
      }

      const eventResponse = await fetch(
        `${ANTIMATE_AI_URL}/gradio_api/call/chat/${result.event_id}`
      );

      if (!eventResponse.ok) {
        throw new Error(
          `ANTIMATE event failed: ${eventResponse.status}`
        );
      }

      const eventText = await eventResponse.text();

      /*
       * Gradio SSE:
       *
       * event: complete
       * data: {...}
       */

      const lines = eventText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      let finalData = null;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("data:")) {
          const raw = lines[i].substring(5).trim();

          try {
            finalData = JSON.parse(raw);
          } catch {
            /*
             * Ignore non-JSON SSE chunks.
             */
          }
        }
      }

      if (!finalData) {
        throw new Error(
          "ANTIMATE ntiyatanze response yuzuye."
        );
      }

      /*
       * antimate_text_api returns:
       *
       * {
       *   success,
       *   answer_kinyarwanda,
       *   answer_english,
       *   mode
       * }
       */

      const data =
        Array.isArray(finalData)
          ? finalData[0]
          : finalData;

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "ANTIMATE text response failed."
        );
      }

      const answer =
        data.answer_kinyarwanda ||
        data.answer ||
        "";

      if (!answer) {
        throw new Error(
          "ANTIMATE yagarutse nta gisubizo kirimo."
        );
      }

      addMessage({
        role: "assistant",
        type: "text",
        text: answer,
      });
    } catch (err) {
      console.error(
        "ANTIMATE TEXT ERROR:",
        err
      );

      setError(
        err?.message ||
          "Habaye ikibazo mu kohereza ubutumwa."
      );

      addMessage({
        role: "assistant",
        type: "error",
        text:
          "Mbabarira, habaye ikibazo mu kubona igisubizo. Ongera ugerageze.",
      });
    } finally {
      stopWaitingMessages();

      setLoading(false);
    }
  };

  /* ==========================================================
     ENTER KEY
  ========================================================== */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendText();
    }
  };

  /* ==========================================================
     AUDIO CONVERSION
  ========================================================== */

  const convertBlobToWav = async (blob) => {
    /*
     * The backend currently accepts audio files and converts
     * them to WAV 16kHz mono before STT.
     *
     * Therefore we keep the browser recording simple and
     * let ANTIMATE handle final normalization.
     */

    return blob;
  };

  /* ==========================================================
     START RECORDING
  ========================================================== */

  const startRecording = async () => {
    if (recording || loading) {
      return;
    }

    setError("");

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      mediaStreamRef.current = stream;

      audioChunksRef.current = [];

      let mimeType = "";

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      for (const type of supportedTypes) {
        if (
          window.MediaRecorder &&
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

      setVoiceMimeType(
        recorder.mimeType || mimeType
      );

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
        try {
          const blob = new Blob(
            audioChunksRef.current,
            {
              type:
                recorder.mimeType ||
                mimeType ||
                "audio/webm",
            }
          );

          if (blob.size === 0) {
            throw new Error(
              "Nta audio yafashwe."
            );
          }

          const normalizedBlob =
            await convertBlobToWav(blob);

          await sendVoice(normalizedBlob);
        } catch (err) {
          console.error(
            "VOICE PROCESS ERROR:",
            err
          );

          setError(
            err?.message ||
              "Audio ntiyoherejwe."
          );

          setLoading(false);

          stopWaitingMessages();
        }
      };

      recorder.start(250);

      setRecording(true);

      setRecordingTime(30);

      /*
       * 30 second countdown
       */

      countdownRef.current = setInterval(() => {
        setRecordingTime((previous) => {
          if (previous <= 1) {
            clearInterval(
              countdownRef.current
            );

            countdownRef.current = null;

            stopRecording();

            return 0;
          }

          return previous - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(
        "MICROPHONE ERROR:",
        err
      );

      setError(
        "Microphone ntiyemerewe. Reba microphone permission ya browser."
      );
    }
  };

  /* ==========================================================
     STOP RECORDING
  ========================================================== */

  const stopRecording = () => {
    if (
      countdownRef.current
    ) {
      clearInterval(
        countdownRef.current
      );

      countdownRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      mediaStreamRef.current = null;
    }

    setRecording(false);

    setLoading(true);

    startWaitingMessages();
  };

  /* ==========================================================
     VOICE API
  ========================================================== */

  const sendVoice = async (audioBlob) => {
    try {
      addMessage({
        role: "user",
        type: "voice",
        text: "🎙️ Voice message",
      });

      /*
       * Backend route:
       *
       * POST /api/antimate/voice
       *
       * It should:
       *
       * browser audio
       *      ↓
       * ffmpeg
       *      ↓
       * WAV 16kHz mono
       *      ↓
       * ANTIMATE AI
       */

      const formData = new FormData();

      const extension =
        audioBlob.type.includes("ogg")
          ? "ogg"
          : audioBlob.type.includes("mp4")
          ? "mp4"
          : "webm";

      formData.append(
        "audio",
        audioBlob,
        `antimate_voice.${extension}`
      );

      const response = await fetch(
        `${API_BASE}/api/antimate/voice`,
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
            `Voice API failed: ${response.status}`
        );
      }

      /*
       * The backend may return JSON.
       */

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        const data =
          await response.json();

        await handleVoiceJsonResponse(
          data
        );

        return;
      }

      /*
       * If backend returns raw audio,
       * play it directly.
       */

      const resultBlob =
        await response.blob();

      const resultUrl =
        URL.createObjectURL(
          resultBlob
        );

      addMessage({
        role: "assistant",
        type: "voice",
        text:
          "Igisubizo cya ANTIMATE",
        audioUrl: resultUrl,
      });

      setVoiceUrl(resultUrl);

      /*
       * Auto-play
       */

      setTimeout(() => {
        playAudio(resultUrl);
      }, 150);
    } catch (err) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Habaye ikibazo kuri voice."
      );

      addMessage({
        role: "assistant",
        type: "error",
        text:
          "Mbabarira, sinabashije gutunganya voice yawe.",
      });
    } finally {
      stopWaitingMessages();

      setLoading(false);
    }
  };

  /* ==========================================================
     HANDLE VOICE JSON
  ========================================================== */

  const handleVoiceJsonResponse =
    async (data) => {
      if (
        data?.success === false
      ) {
        throw new Error(
          data?.error ||
            "ANTIMATE voice failed."
        );
      }

      /*
       * Possible response names supported:
       */

      const transcript =
        data?.transcript ||
        data?.input_kinyarwanda ||
        data?.kinyarwanda_text ||
        "";

      const answer =
        data?.answer_kinyarwanda ||
        data?.answer ||
        data?.response ||
        "";

      const returnedAudio =
        data?.audio_url ||
        data?.audio ||
        data?.voice_url ||
        null;

      /*
       * If backend sends transcript,
       * show it as the user's message.
       */

      if (transcript) {
        setMessages((previous) => {
          const copy = [...previous];

          const last =
            copy[copy.length - 1];

          if (
            last &&
            last.role === "user" &&
            last.type === "voice"
          ) {
            copy[copy.length - 1] = {
              ...last,
              text: transcript,
              transcript,
            };
          }

          return copy;
        });
      }

      /*
       * Audio returned as URL
       */

      if (returnedAudio) {
        let resolvedUrl =
          returnedAudio;

        if (
          returnedAudio.startsWith("/")
        ) {
          resolvedUrl =
            `${ANTIMATE_AI_URL}${returnedAudio}`;
        }

        addMessage({
          role: "assistant",
          type: "voice",
          text:
            answer ||
            "Igisubizo cya ANTIMATE",
          audioUrl: resolvedUrl,
        });

        setVoiceUrl(resolvedUrl);

        setTimeout(() => {
          playAudio(resolvedUrl);
        }, 200);

        return;
      }

      /*
       * Some backends return base64 audio.
       */

      if (
        data?.audio_base64
      ) {
        const audioUrl =
          `data:audio/wav;base64,${data.audio_base64}`;

        addMessage({
          role: "assistant",
          type: "voice",
          text:
            answer ||
            "Igisubizo cya ANTIMATE",
          audioUrl,
        });

        setVoiceUrl(audioUrl);

        setTimeout(() => {
          playAudio(audioUrl);
        }, 200);

        return;
      }

      /*
       * If no audio came back but text did,
       * still show the answer.
       */

      if (answer) {
        addMessage({
          role: "assistant",
          type: "text",
          text: answer,
        });

        return;
      }

      throw new Error(
        "ANTIMATE voice response nta gisubizo kirimo."
      );
    };

  /* ==========================================================
     PLAY AUDIO
  ========================================================== */

  const playAudio = (url) => {
    if (!url) {
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();

        audioRef.current.currentTime = 0;
      }

      const audio =
        new Audio(url);

      audioRef.current = audio;

      audio.play().catch((error) => {
        /*
         * Browser autoplay policy can block
         * playback. The replay button still
         * allows the user to start it.
         */

        console.warn(
          "Autoplay blocked:",
          error
        );
      });
    } catch (err) {
      console.error(
        "AUDIO PLAY ERROR:",
        err
      );
    }
  };

  /* ==========================================================
     REPLAY
  ========================================================== */

  const replayVoice = (url) => {
    if (!url) {
      return;
    }

    playAudio(url);
  };

  /* ==========================================================
     RENDER MESSAGE
  ========================================================== */

  const renderMessage = (
    message
  ) => {
    const isUser =
      message.role === "user";

    return (
      <div
        key={message.id}
        className={`antimate-message-row ${
          isUser
            ? "user-message-row"
            : "assistant-message-row"
        }`}
      >
        <div
          className={`antimate-avatar ${
            isUser
              ? "user-avatar"
              : "assistant-avatar"
          }`}
        >
          {isUser ? (
            <UserIcon />
          ) : (
            <BotIcon />
          )}
        </div>

        <div
          className={`antimate-message ${
            isUser
              ? "user-message"
              : "assistant-message"
          } ${
            message.type === "error"
              ? "error-message"
              : ""
          }`}
        >
          {message.type === "voice" &&
          message.audioUrl ? (
            <>
              {message.text && (
                <div className="voice-answer-text">
                  {message.text}
                </div>
              )}

              <div className="voice-player">
                <button
                  type="button"
                  className="replay-button"
                  onClick={() =>
                    replayVoice(
                      message.audioUrl
                    )
                  }
                >
                  <ReplayIcon />

                  <span>
                    Replay
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="message-text">
              {message.text}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ==========================================================
     MAIN UI
  ========================================================== */

  return (
    <div className="antimate-page">
      <style>{`
        /* =====================================================
           ANTIMATE AI
           Native CSS
        ===================================================== */

        .antimate-page {
          min-height: 100vh;
          width: 100%;
          background: var(--background, #f7f8fa);
          color: var(--text, #17202a);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
        }

        .antimate-page *,
        .antimate-page *::before,
        .antimate-page *::after {
          box-sizing: border-box;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .antimate-header {
          height: 68px;
          min-height: 68px;
          border-bottom: 1px solid
            var(--border, #e6e9ed);
          background: var(--surface, #ffffff);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 10;
        }

        .antimate-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .antimate-logo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111827;
          color: #ffffff;
        }

        .antimate-title-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .antimate-title {
          font-size: 17px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.2px;
        }

        .antimate-subtitle {
          font-size: 12px;
          color: var(--muted, #727b87);
        }

        .antimate-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #68717d;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px
            rgba(34, 197, 94, 0.10);
        }

        /* =====================================================
           CHAT AREA
        ===================================================== */

        .antimate-chat {
          flex: 1;
          width: 100%;
          overflow-y: auto;
          padding: 30px 20px 150px;
          scroll-behavior: smooth;
        }

        .antimate-chat-inner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        /* =====================================================
           WELCOME
        ===================================================== */

        .antimate-welcome {
          min-height: calc(100vh - 250px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px 20px;
        }

        .welcome-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: #111827;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .welcome-title {
          margin: 0;
          font-size: 29px;
          font-weight: 750;
          letter-spacing: -0.7px;
        }

        .welcome-text {
          max-width: 520px;
          margin: 10px auto 0;
          font-size: 14px;
          line-height: 1.65;
          color: var(--muted, #737b87);
        }

        .welcome-language {
          margin-top: 17px;
          font-size: 12px;
          color: #737b87;
        }

        /* =====================================================
           MESSAGES
        ===================================================== */

        .antimate-message-row {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-bottom: 23px;
          width: 100%;
        }

        .user-message-row {
          flex-direction: row-reverse;
        }

        .antimate-avatar {
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .assistant-avatar {
          background: #111827;
          color: #ffffff;
        }

        .user-avatar {
          background: #e9edf2;
          color: #4c5662;
        }

        .antimate-message {
          max-width: min(75%, 680px);
          padding: 11px 14px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.65;
          word-break: break-word;
        }

        .assistant-message {
          background: var(--surface, #ffffff);
          border: 1px solid
            var(--border, #e5e8ec);
          color: var(--text, #1f2937);
          border-top-left-radius: 5px;
        }

        .user-message {
          background: #111827;
          color: #ffffff;
          border-top-right-radius: 5px;
        }

        .error-message {
          border-color: #f0caca;
          color: #a53c3c;
          background: #fff8f8;
        }

        .message-text {
          white-space: pre-wrap;
        }

        /* =====================================================
           VOICE RESPONSE
        ===================================================== */

        .voice-answer-text {
          margin-bottom: 10px;
        }

        .voice-player {
          display: flex;
          align-items: center;
          padding-top: 2px;
        }

        .replay-button {
          border: 1px solid
            var(--border, #e1e5e9);
          background: #f7f8fa;
          color: #303944;
          border-radius: 9px;
          height: 34px;
          padding: 0 11px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition:
            background 0.15s ease,
            transform 0.15s ease;
        }

        .replay-button:hover {
          background: #eceff2;
        }

        .replay-button:active {
          transform: scale(0.97);
        }

        /* =====================================================
           THINKING
        ===================================================== */

        .thinking-row {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 20px;
        }

        .thinking-message {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #727b87;
          font-size: 13px;
          padding: 9px 0;
        }

        .thinking-dots {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .thinking-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #89919b;
          animation: antimateThinking 1.2s
            infinite ease-in-out;
        }

        .thinking-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes antimateThinking {
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

        /* =====================================================
           FIXED COMPOSER
        ===================================================== */

        .antimate-composer-wrapper {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 20;
          padding: 12px 18px 18px;
          background: linear-gradient(
            to top,
            var(--background, #f7f8fa) 70%,
            rgba(247, 248, 250, 0)
          );
          pointer-events: none;
        }

        .antimate-composer {
          pointer-events: auto;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          background: var(--surface, #ffffff);
          border: 1px solid
            var(--border, #dfe3e8);
          border-radius: 16px;
          min-height: 54px;
          display: flex;
          align-items: flex-end;
          padding: 7px 8px 7px 15px;
          box-shadow:
            0 8px 28px rgba(15, 23, 42, 0.07);
        }

        .antimate-textarea {
          flex: 1;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          color: var(--text, #1f2937);
          font-family: inherit;
          font-size: 14px;
          line-height: 1.45;
          max-height: 120px;
          min-height: 38px;
          padding: 9px 4px 7px;
        }

        .antimate-textarea::placeholder {
          color: #9aa1aa;
        }

        .composer-button {
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            background 0.15s ease,
            transform 0.15s ease;
          margin-left: 7px;
        }

        .composer-button:active {
          transform: scale(0.95);
        }

        .voice-button {
          background: #111827;
          color: #ffffff;
        }

        .voice-button:hover {
          background: #242c38;
        }

        .send-button {
          background: #111827;
          color: #ffffff;
        }

        .send-button:hover {
          background: #242c38;
        }

        .composer-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* =====================================================
           RECORDING STATE
        ===================================================== */

        .recording-bar {
          pointer-events: auto;
          width: 100%;
          max-width: 900px;
          margin: 0 auto 8px;
          background: #111827;
          color: #ffffff;
          border-radius: 13px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px 0 14px;
          box-shadow:
            0 8px 24px rgba(15, 23, 42, 0.15);
        }

        .recording-left {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 600;
        }

        .recording-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ffffff;
          animation: recordingPulse 1s
            infinite ease-in-out;
        }

        @keyframes recordingPulse {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 1;
          }
        }

        .recording-countdown {
          min-width: 36px;
          text-align: center;
          font-variant-numeric: tabular-nums;
          font-weight: 700;
        }

        .recording-stop {
          width: 31px;
          height: 31px;
          border: 0;
          border-radius: 8px;
          background: rgba(
            255,
            255,
            255,
            0.13
          );
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .recording-stop:hover {
          background: rgba(
            255,
            255,
            255,
            0.2
          );
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .antimate-error {
          width: 100%;
          max-width: 900px;
          margin: 0 auto 8px;
          padding: 9px 12px;
          border-radius: 9px;
          background: #fff5f5;
          border: 1px solid #f2d1d1;
          color: #a34141;
          font-size: 12px;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 700px) {
          .antimate-header {
            height: 62px;
            min-height: 62px;
            padding: 0 15px;
          }

          .antimate-logo {
            width: 36px;
            height: 36px;
            border-radius: 10px;
          }

          .antimate-title {
            font-size: 15px;
          }

          .antimate-subtitle {
            font-size: 11px;
          }

          .antimate-status {
            display: none;
          }

          .antimate-chat {
            padding:
              20px
              12px
              145px;
          }

          .antimate-welcome {
            min-height:
              calc(100vh - 190px);
          }

          .welcome-title {
            font-size: 25px;
          }

          .welcome-text {
            font-size: 13px;
          }

          .antimate-message {
            max-width: 82%;
            font-size: 13.5px;
          }

          .antimate-avatar {
            width: 31px;
            height: 31px;
            border-radius: 9px;
          }

          .antimate-composer-wrapper {
            padding:
              9px
              10px
              12px;
          }

          .antimate-composer {
            border-radius: 14px;
          }

          .recording-bar {
            border-radius: 12px;
          }
        }

        /* =====================================================
           DARK THEME SUPPORT
        ===================================================== */

        @media (prefers-color-scheme: dark) {
          .antimate-page {
            --background: #0d1117;
            --surface: #151a21;
            --text: #edf1f5;
            --muted: #8d96a2;
            --border: #29313b;
          }

          .antimate-logo,
          .assistant-avatar,
          .voice-button,
          .send-button {
            background: #f1f3f5;
            color: #111827;
          }

          .user-avatar {
            background: #252c35;
            color: #c8ced6;
          }

          .assistant-message {
            background: #151a21;
            border-color: #29313b;
          }

          .user-message {
            background: #f1f3f5;
            color: #111827;
          }

          .replay-button {
            background: #202731;
            color: #d9dee4;
            border-color: #313a45;
          }

          .replay-button:hover {
            background: #29323d;
          }

          .antimate-composer {
            background: #151a21;
            border-color: #303844;
          }

          .antimate-textarea {
            color: #edf1f5;
          }

          .antimate-textarea::placeholder {
            color: #737d89;
          }

          .antimate-error {
            background: #27191b;
            border-color: #4a272b;
            color: #f0a7aa;
          }
        }
      `}</style>

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="antimate-header">
        <div className="antimate-header-left">
          <div className="antimate-logo">
            <BotIcon size={22} />
          </div>

          <div className="antimate-title-wrapper">
            <div className="antimate-title">
              ANTIMATE AI
            </div>

            <div className="antimate-subtitle">
              Kinyarwanda intelligent assistant
            </div>
          </div>
        </div>

        <div className="antimate-status">
          <span className="status-dot" />

          <span>
            AI Online
          </span>
        </div>
      </header>

      {/* ========================================================
          CHAT
      ======================================================== */}

      <main className="antimate-chat">
        <div className="antimate-chat-inner">
          {messages.length === 0 &&
          !loading ? (
            <div className="antimate-welcome">
              <div className="welcome-icon">
                <BotIcon size={31} />
              </div>

              <h1 className="welcome-title">
                Muraho, ndi ANTIMATE
              </h1>

              <p className="welcome-text">
                Vugana nanjye mu Kinyarwanda.
                Ushobora kwandika ubutumwa cyangwa
                gukoresha ijwi.
              </p>

              <div className="welcome-language">
                🇷🇼 Kinyarwanda • Text + Voice
              </div>
            </div>
          ) : (
            <>
              {messages.map(
                renderMessage
              )}

              {loading && (
                <div className="thinking-row">
                  <div className="antimate-avatar assistant-avatar">
                    <BotIcon />
                  </div>

                  <div className="thinking-message">
                    <span>
                      {waitingText}
                    </span>

                    <div className="thinking-dots">
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ========================================================
          FIXED COMPOSER
      ======================================================== */}

      <div className="antimate-composer-wrapper">
        {recording && (
          <div className="recording-bar">
            <div className="recording-left">
              <span className="recording-indicator" />

              <span>
                Ndumva...
              </span>

              <span className="recording-countdown">
                {recordingTime}s
              </span>
            </div>

            <button
              type="button"
              className="recording-stop"
              onClick={stopRecording}
              aria-label="Stop recording"
            >
              <StopIcon size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="antimate-error">
            {error}
          </div>
        )}

        {!recording && (
          <div className="antimate-composer">
            <textarea
              className="antimate-textarea"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Andika ubutumwa..."
              rows={1}
              disabled={loading}
            />

            {input.trim() ? (
              <button
                type="button"
                className="composer-button send-button"
                onClick={sendText}
                disabled={
                  loading ||
                  !input.trim()
                }
                aria-label="Send message"
                title="Ohereza"
              >
                <SendIcon />
              </button>
            ) : (
              <button
                type="button"
                className="composer-button voice-button"
                onClick={startRecording}
                disabled={loading}
                aria-label="Record voice"
                title="Vuga"
              >
                <SoundWaveIcon />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}