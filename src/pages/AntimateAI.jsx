import React, { useEffect, useRef, useState } from "react";

/*
============================================================
 ANTIMATE AI CHAT
============================================================

 Features:
 - Text chat
 - Voice chat
 - 30 second recording countdown
 - Sound-wave voice button
 - Automatic voice playback
 - Replay audio
 - Fixed composer at bottom
 - Thinking/status messages
 - Native CSS only
 - No Tailwind
============================================================
*/

// ============================================================
// CONFIG
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const ANTIMATE_AI_URL =
  import.meta.env.VITE_ANTIMATE_AI_URL ||
  "https://antimate-ai.hf.space";

const MAX_RECORDING_SECONDS = 30;

// ============================================================
// HELPERS
// ============================================================

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ============================================================
// SOUND WAVE ICON
// ============================================================

function SoundWaveIcon({ active = false }) {
  return (
    <span
      className={`sound-wave-icon ${active ? "sound-wave-active" : ""}`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

// ============================================================
// SEND ICON
// ============================================================

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
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
}

// ============================================================
// STOP ICON
// ============================================================

function StopIcon() {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: 3,
        background: "currentColor",
        display: "block",
      }}
    />
  );
}

// ============================================================
// THINKING INDICATOR
// ============================================================

function ThinkingIndicator({ text }) {
  return (
    <div className="thinking-row">
      <div className="thinking-avatar">A</div>

      <div className="thinking-content">
        <div className="thinking-text">{text}</div>

        <div className="thinking-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AUDIO MESSAGE
// ============================================================

function VoiceMessage({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!src) return;

    const audio = audioRef.current;

    if (!audio) return;

    const playAudio = async () => {
      try {
        audio.currentTime = 0;
        await audio.play();
        setPlaying(true);
      } catch (error) {
        /*
         Browser may block autoplay in some cases.
         The audio element remains visible so the user
         can press play manually.
        */
        console.warn("Autoplay blocked:", error);
      }
    };

    playAudio();
  }, [src]);

  const handlePlay = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  return (
    <div className="voice-response">
      <button
        type="button"
        className={`voice-play-button ${playing ? "playing" : ""}`}
        onClick={handlePlay}
        aria-label={playing ? "Pause voice response" : "Replay voice response"}
      >
        {playing ? (
          <span className="pause-icon">
            <span />
            <span />
          </span>
        ) : (
          <SoundWaveIcon />
        )}
      </button>

      <div className="voice-response-info">
        <div className="voice-response-title">
          ANTIMATE Voice
        </div>

        <div className="voice-response-subtitle">
          {playing ? "Playing..." : "Tap to replay"}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        controls
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`message-row ${
        isUser ? "message-row-user" : "message-row-ai"
      }`}
    >
      {!isUser && (
        <div className="message-avatar">
          A
        </div>
      )}

      <div
        className={`message-bubble ${
          isUser ? "user-bubble" : "ai-bubble"
        }`}
      >
        {message.text && (
          <div className="message-text">
            {message.text}
          </div>
        )}

        {message.audio && (
          <VoiceMessage src={message.audio} />
        )}

        {message.time && (
          <div className="message-time">
            {message.time}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AntimateAI() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [thinkingText, setThinkingText] = useState("");

  const [isRecording, setIsRecording] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(
    MAX_RECORDING_SECONDS
  );

  const [audioUrl, setAudioUrl] = useState(null);

  const [error, setError] = useState("");

  // ==========================================================
  // REFS
  // ==========================================================

  const messagesEndRef = useRef(null);

  const mediaRecorderRef = useRef(null);

  const recordingTimerRef = useRef(null);

  const audioChunksRef = useRef([]);

  const recordingStreamRef = useRef(null);

  const fileInputRef = useRef(null);

  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (recordingStreamRef.current) {
        recordingStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // ==========================================================
  // THINKING PHRASES
  // ==========================================================

  const startThinking = () => {
    const phrases = [
      "Ndigutekereza...",
      "Ndimo kureba amakuru ya system...",
      "Reka ndebe uko nagufasha...",
      "Ndimo gutegura igisubizo...",
      "Ndimo gusesengura ikibazo cyawe...",
    ];

    let index = 0;

    setThinkingText(phrases[index]);

    const interval = setInterval(() => {
      index = (index + 1) % phrases.length;

      setThinkingText(phrases[index]);
    }, 2200);

    return interval;
  };

  // ==========================================================
  // TIME
  // ==========================================================

  const getTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================================
  // TEXT API
  // ==========================================================

  const sendTextMessage = async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    setError("");

    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: "user",
        text,
        time: getTime(),
      },
    ]);

    setInput("");

    setLoading(true);

    const thinkingInterval = startThinking();

    try {
      /*
      ----------------------------------------------------------
      ANTIMATE AI TEXT ENDPOINT
      ----------------------------------------------------------

      Gradio endpoint:

      /gradio_api/call/chat

      We use the Gradio API directly.
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
          `ANTIMATE AI error: ${response.status}`
        );
      }

      const result = await response.json();

      /*
      Gradio API returns an event_id.
      */

      const eventId =
        result?.event_id ||
        result?.eventId;

      if (!eventId) {
        throw new Error(
          "ANTIMATE AI ntiyagaruye event_id."
        );
      }

      /*
      ----------------------------------------------------------
      WAIT FOR GRADIO RESULT
      ----------------------------------------------------------
      */

      const resultResponse = await fetch(
        `${ANTIMATE_AI_URL}/gradio_api/call/chat/${eventId}`
      );

      if (!resultResponse.ok) {
        throw new Error(
          `ANTIMATE AI result error: ${resultResponse.status}`
        );
      }

      const resultText =
        await resultResponse.text();

      /*
      Gradio may return SSE lines.
      */

      let answer = "";

      const lines = resultText.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data:")) {
          continue;
        }

        const payload = line
          .replace(/^data:\s*/, "")
          .trim();

        if (!payload) {
          continue;
        }

        try {
          const parsed = JSON.parse(payload);

          /*
          Expected structure:

          [
            {
              success: true,
              answer_kinyarwanda: "..."
            }
          ]

          or directly an object.
          */

          const item = Array.isArray(parsed)
            ? parsed[0]
            : parsed;

          answer =
            item?.answer_kinyarwanda ||
            item?.answer ||
            item?.text ||
            "";

          if (
            !answer &&
            typeof item === "string"
          ) {
            answer = item;
          }
        } catch {
          /*
          Some Gradio responses may contain
          plain text.
          */
          if (
            payload !== "[DONE]" &&
            payload !== "complete"
          ) {
            answer = payload;
          }
        }
      }

      if (!answer) {
        throw new Error(
          "ANTIMATE AI ntiyagaruye igisubizo."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          text: answer,
          time: getTime(),
        },
      ]);
    } catch (err) {
      console.error("ANTIMATE TEXT ERROR:", err);

      setError(
        err?.message ||
          "Habaye ikibazo mu kuvugana na ANTIMATE AI."
      );
    } finally {
      clearInterval(thinkingInterval);

      setThinkingText("");

      setLoading(false);
    }
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendTextMessage();
    }
  };

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording = async () => {
    if (loading || isRecording) {
      return;
    }

    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser yawe ntabwo yemera microphone."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      recordingStreamRef.current = stream;

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];

      let selectedMimeType = "";

      for (const mimeType of mimeTypes) {
        if (
          window.MediaRecorder &&
          MediaRecorder.isTypeSupported(mimeType)
        ) {
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

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
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
                "audio/webm",
            }
          );

          stream
            .getTracks()
            .forEach((track) => track.stop());

          recordingStreamRef.current = null;

          if (!blob.size) {
            throw new Error(
              "Nta audio yafashwe."
            );
          }

          const localUrl =
            URL.createObjectURL(blob);

          setAudioUrl(localUrl);

          await sendVoiceMessage(blob);
        } catch (err) {
          console.error(
            "Recording processing error:",
            err
          );

          setError(
            err?.message ||
              "Audio ntiyashoboye gutunganywa."
          );

          setLoading(false);
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

      recorder.start(250);

      setIsRecording(true);

      setRecordingSeconds(
        MAX_RECORDING_SECONDS
      );

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingSeconds((previous) => {
            if (previous <= 1) {
              clearInterval(
                recordingTimerRef.current
              );

              setTimeout(() => {
                stopRecording();
              }, 50);

              return 0;
            }

            return previous - 1;
          });
        }, 1000);
    } catch (err) {
      console.error(
        "Microphone permission error:",
        err
      );

      setError(
        "Microphone ntiyabonetse cyangwa permission ntiyatanzwe."
      );

      setIsRecording(false);
    }
  };

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current = null;
    }

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }

    setIsRecording(false);

    /*
    Do not stop stream here.
    recorder.onstop handles it after data
    has been collected.
    */
  };

  // ==========================================================
  // VOICE API
  // ==========================================================

  const sendVoiceMessage = async (blob) => {
    if (!blob) {
      return;
    }

    setLoading(true);

    const thinkingInterval =
      startThinking();

    /*
    We display a user voice message.
    */

    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: "user",
        text: "🎙️ Voice message",
        time: getTime(),
      },
    ]);

    try {
      /*
      ----------------------------------------------------------
      STEP 1
      Convert browser recording to File
      ----------------------------------------------------------
      */

      const extension =
        blob.type.includes("ogg")
          ? "ogg"
          : "webm";

      const file = new File(
        [blob],
        `antimate_voice.${extension}`,
        {
          type: blob.type,
        }
      );

      /*
      ----------------------------------------------------------
      STEP 2
      Upload to backend
      ----------------------------------------------------------

      IMPORTANT:

      Backend route should convert the audio
      to WAV 16kHz mono before sending it
      to ANTIMATE AI.
      */

      const formData = new FormData();

      formData.append(
        "audio",
        file,
        file.name
      );

      /*
      ----------------------------------------------------------
      BACKEND VOICE ROUTE
      ----------------------------------------------------------
      */

      const response = await fetch(
        `${API_BASE_URL}/api/antimate/voice`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        let errorMessage =
          `Voice request failed: ${response.status}`;

        try {
          const errorJson =
            await response.json();

          errorMessage =
            errorJson?.error ||
            errorJson?.message ||
            errorMessage;
        } catch {
          // ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      /*
      ----------------------------------------------------------
      RESPONSE
      ----------------------------------------------------------

      Expected backend response:

      {
        success: true,
        text: "...",
        answer: "...",
        audio_url: "..."
      }

      */

      const data =
        await response.json();

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "ANTIMATE voice request failed."
        );
      }

      const answer =
        data.answer_kinyarwanda ||
        data.answer ||
        data.text ||
        "";

      if (answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            text: answer,
            time: getTime(),
          },
        ]);
      }

      /*
      ----------------------------------------------------------
      VOICE RESPONSE
      ----------------------------------------------------------
      */

      let responseAudio =
        data.audio_url ||
        data.audio ||
        data.voice_url ||
        null;

      /*
      If backend returns a relative path,
      attach API_BASE_URL.
      */

      if (
        responseAudio &&
        responseAudio.startsWith("/")
      ) {
        responseAudio =
          `${API_BASE_URL}${responseAudio}`;
      }

      /*
      If audio exists, keep it visible and
      autoplay through VoiceMessage.
      */

      if (responseAudio) {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            audio: responseAudio,
            time: getTime(),
          },
        ]);

        setAudioUrl(responseAudio);
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
      clearInterval(thinkingInterval);

      setThinkingText("");

      setLoading(false);
    }
  };

  // ==========================================================
  // CLEAR ERROR
  // ==========================================================

  const clearError = () => {
    setError("");
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="antimate-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="antimate-header">
        <div className="antimate-header-left">
          <div className="antimate-logo">
            A
          </div>

          <div>
            <div className="antimate-title">
              ANTIMATE AI
            </div>

            <div className="antimate-status">
              <span className="status-dot" />
              AI Assistant
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          CHAT AREA
      ====================================================== */}

      <main className="antimate-chat">
        {messages.length === 0 && (
          <div className="welcome-section">
            <div className="welcome-logo">
              A
            </div>

            <h1>
              Muraho, ndi ANTIMATE
            </h1>

            <p>
              Mbwira icyo ushaka kumenya cyangwa
              ukoreshe voice kugira ngo tuganire.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}

        {loading && (
          <ThinkingIndicator
            text={
              thinkingText ||
              "Ndigutekereza..."
            }
          />
        )}

        {error && (
          <div className="error-message">
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
            >
              ×
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ======================================================
          FIXED COMPOSER
      ====================================================== */}

      <div className="composer-wrapper">
        {/* ----------------------------------------------------
             RECORDING STATUS
        ---------------------------------------------------- */}

        {isRecording && (
          <div className="recording-panel">
            <div className="recording-indicator">
              <span className="recording-dot" />
              Recording
            </div>

            <div className="recording-countdown">
              00:
              {String(
                recordingSeconds
              ).padStart(2, "0")}
            </div>

            <div className="recording-bar">
              <div
                className="recording-progress"
                style={{
                  width: `${
                    ((MAX_RECORDING_SECONDS -
                      recordingSeconds) /
                      MAX_RECORDING_SECONDS) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
             COMPOSER
        ---------------------------------------------------- */}

        <div className="composer">
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Ndimo gufata amajwi..."
                : "Andika ubutumwa..."
            }
            disabled={
              loading || isRecording
            }
            rows={1}
          />

          {/* SEND */}

          {input.trim() && !isRecording ? (
            <button
              type="button"
              className="composer-button send-button"
              onClick={sendTextMessage}
              disabled={loading}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          ) : (
            /* VOICE */

            <button
              type="button"
              className={`composer-button voice-button ${
                isRecording
                  ? "voice-recording"
                  : ""
              }`}
              onClick={
                isRecording
                  ? stopRecording
                  : startRecording
              }
              disabled={loading && !isRecording}
              aria-label={
                isRecording
                  ? "Stop recording"
                  : "Record voice"
              }
            >
              {isRecording ? (
                <StopIcon />
              ) : (
                <SoundWaveIcon />
              )}
            </button>
          )}
        </div>

        <div className="composer-note">
          ANTIMATE peut faire des erreurs.
          Vérifiez les informations importantes.
        </div>
      </div>

      {/* ======================================================
          NATIVE CSS
      ====================================================== */}

      <style>{`

        /* =====================================================
           ROOT
        ===================================================== */

        .antimate-page {
          min-height: 100vh;
          width: 100%;
          background: var(--background, #f7f8fa);
          color: var(--text-primary, #15171a);

          display: flex;
          flex-direction: column;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          box-sizing: border-box;
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
          height: 66px;

          display: flex;
          align-items: center;

          padding: 0 24px;

          border-bottom: 1px solid
            var(--border-color, #e5e7eb);

          background:
            var(--surface, #ffffff);

          position: sticky;
          top: 0;
          z-index: 20;
        }

        .antimate-header-left {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .antimate-logo {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background:
            var(--primary, #111827);

          color: #ffffff;

          font-size: 17px;
          font-weight: 800;
        }

        .antimate-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        .antimate-status {
          margin-top: 2px;

          display: flex;
          align-items: center;
          gap: 5px;

          font-size: 11px;

          color:
            var(--text-secondary, #6b7280);
        }

        .status-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #22c55e;
        }

        /* =====================================================
           CHAT
        ===================================================== */

        .antimate-chat {
          flex: 1;

          width: 100%;
          max-width: 900px;

          margin: 0 auto;

          padding:
            32px 24px
            150px;

          overflow-y: auto;
        }

        /* =====================================================
           WELCOME
        ===================================================== */

        .welcome-section {
          min-height: 55vh;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;

          padding: 40px 20px;
        }

        .welcome-logo {
          width: 62px;
          height: 62px;

          border-radius: 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            var(--primary, #111827);

          color: #ffffff;

          font-size: 27px;
          font-weight: 800;

          margin-bottom: 20px;
        }

        .welcome-section h1 {
          margin: 0;

          font-size: 27px;

          letter-spacing: -0.7px;
        }

        .welcome-section p {
          max-width: 500px;

          margin: 10px 0 0;

          color:
            var(--text-secondary, #6b7280);

          line-height: 1.6;

          font-size: 14px;
        }

        /* =====================================================
           MESSAGE ROW
        ===================================================== */

        .message-row {
          display: flex;

          width: 100%;

          margin-bottom: 24px;
        }

        .message-row-user {
          justify-content: flex-end;
        }

        .message-row-ai {
          justify-content: flex-start;

          align-items: flex-start;

          gap: 10px;
        }

        .message-avatar {
          flex: 0 0 auto;

          width: 30px;
          height: 30px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background:
            var(--primary, #111827);

          color: #ffffff;

          font-size: 12px;
          font-weight: 700;
        }

        .message-bubble {
          max-width: min(720px, 82%);

          padding: 12px 15px;

          line-height: 1.55;

          font-size: 14px;
        }

        .user-bubble {
          background:
            var(--primary, #111827);

          color: #ffffff;

          border-radius:
            16px
            16px
            4px
            16px;
        }

        .ai-bubble {
          background:
            var(--surface, #ffffff);

          border:
            1px solid
            var(--border-color, #e5e7eb);

          border-radius:
            4px
            16px
            16px
            16px;
        }

        .message-text {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-time {
          margin-top: 6px;

          font-size: 10px;

          opacity: 0.55;

          text-align: right;
        }

        /* =====================================================
           THINKING
        ===================================================== */

        .thinking-row {
          display: flex;
          align-items: flex-start;

          gap: 10px;

          margin-bottom: 24px;
        }

        .thinking-avatar {
          width: 30px;
          height: 30px;

          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            var(--primary, #111827);

          color: #ffffff;

          font-size: 12px;
          font-weight: 700;
        }

        .thinking-content {
          min-width: 180px;

          padding: 9px 13px;

          border-radius: 12px;

          background:
            var(--surface, #ffffff);

          border:
            1px solid
            var(--border-color, #e5e7eb);
        }

        .thinking-text {
          color:
            var(--text-secondary, #6b7280);

          font-size: 13px;
        }

        .thinking-dots {
          display: flex;
          gap: 3px;

          margin-top: 6px;
        }

        .thinking-dots span {
          width: 4px;
          height: 4px;

          border-radius: 50%;

          background:
            var(--text-secondary, #9ca3af);

          animation:
            thinkingDot 1.2s infinite;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes thinkingDot {
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

        /* =====================================================
           ERROR
        ===================================================== */

        .error-message {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 12px;

          margin: 0 auto 20px;

          padding: 10px 13px;

          max-width: 720px;

          border:
            1px solid #fecaca;

          background: #fef2f2;

          color: #991b1b;

          border-radius: 10px;

          font-size: 12px;
        }

        .error-message button {
          border: 0;

          background: transparent;

          color: inherit;

          font-size: 20px;

          cursor: pointer;
        }

        /* =====================================================
           VOICE RESPONSE
        ===================================================== */

        .voice-response {
          min-width: 280px;

          display: flex;
          align-items: center;

          gap: 10px;

          margin-top: 4px;
        }

        .voice-play-button {
          width: 38px;
          height: 38px;

          border: 0;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            var(--primary, #111827);

          color: #ffffff;

          cursor: pointer;

          flex: 0 0 auto;
        }

        .voice-play-button:hover {
          opacity: 0.88;
        }

        .voice-response-info {
          flex: 1;

          min-width: 90px;
        }

        .voice-response-title {
          font-size: 12px;
          font-weight: 700;
        }

        .voice-response-subtitle {
          margin-top: 2px;

          font-size: 10px;

          color:
            var(--text-secondary, #6b7280);
        }

        .voice-response audio {
          width: 170px;
          height: 34px;
        }

        /* =====================================================
           SOUND WAVE
        ===================================================== */

        .sound-wave-icon {
          width: 20px;
          height: 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 2px;
        }

        .sound-wave-icon span {
          width: 2px;

          border-radius: 4px;

          background: currentColor;

          height: 7px;

          transition:
            height 0.15s ease;
        }

        .sound-wave-icon span:nth-child(1) {
          height: 6px;
        }

        .sound-wave-icon span:nth-child(2) {
          height: 12px;
        }

        .sound-wave-icon span:nth-child(3) {
          height: 17px;
        }

        .sound-wave-icon span:nth-child(4) {
          height: 11px;
        }

        .sound-wave-icon span:nth-child(5) {
          height: 6px;
        }

        .sound-wave-active span {
          animation:
            waveAnimation 0.7s ease-in-out infinite
            alternate;
        }

        .sound-wave-active span:nth-child(2) {
          animation-delay: 0.1s;
        }

        .sound-wave-active span:nth-child(3) {
          animation-delay: 0.2s;
        }

        .sound-wave-active span:nth-child(4) {
          animation-delay: 0.3s;
        }

        .sound-wave-active span:nth-child(5) {
          animation-delay: 0.4s;
        }

        @keyframes waveAnimation {
          from {
            transform: scaleY(0.45);
          }

          to {
            transform: scaleY(1.15);
          }
        }

        /* =====================================================
           PAUSE
        ===================================================== */

        .pause-icon {
          display: flex;

          gap: 3px;
        }

        .pause-icon span {
          width: 3px;
          height: 13px;

          border-radius: 2px;

          background: currentColor;
        }

        /* =====================================================
           FIXED COMPOSER
        ===================================================== */

        .composer-wrapper {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 30;

          padding:
            10px 20px
            14px;

          background:
            linear-gradient(
              to top,
              var(--background, #f7f8fa) 72%,
              transparent
            );
        }

        .composer {
          width: 100%;
          max-width: 900px;

          margin: 0 auto;

          min-height: 54px;

          display: flex;

          align-items: flex-end;

          gap: 8px;

          padding: 7px 7px 7px 15px;

          border:
            1px solid
            var(--border-color, #dfe3e8);

          background:
            var(--surface, #ffffff);

          border-radius: 16px;

          box-shadow:
            0 8px 30px
            rgba(0, 0, 0, 0.07);
        }

        .composer textarea {
          flex: 1;

          min-width: 0;

          max-height: 130px;

          resize: none;

          border: 0;

          outline: 0;

          background: transparent;

          color:
            var(--text-primary, #15171a);

          font-family: inherit;

          font-size: 14px;

          line-height: 1.5;

          padding: 8px 0;
        }

        .composer textarea::placeholder {
          color:
            var(--text-secondary, #9ca3af);
        }

        .composer textarea:disabled {
          opacity: 0.55;
        }

        .composer-button {
          width: 40px;
          height: 40px;

          flex: 0 0 auto;

          border: 0;

          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            transform 0.15s ease,
            opacity 0.15s ease,
            background 0.15s ease;
        }

        .composer-button:hover {
          transform: translateY(-1px);
        }

        .composer-button:disabled {
          opacity: 0.4;

          cursor: not-allowed;

          transform: none;
        }

        .send-button {
          background:
            var(--primary, #111827);

          color: #ffffff;
        }

        .voice-button {
          background:
            #eef0f3;

          color:
            #111827;
        }

        .voice-button:hover {
          background:
            #e4e7eb;
        }

        .voice-recording {
          background:
            #fee2e2;

          color:
            #dc2626;

          animation:
            recordingPulse 1.2s infinite;
        }

        @keyframes recordingPulse {
          0% {
            box-shadow:
              0 0 0 0
              rgba(220, 38, 38, 0.18);
          }

          70% {
            box-shadow:
              0 0 0 8px
              rgba(220, 38, 38, 0);
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(220, 38, 38, 0);
          }
        }

        /* =====================================================
           RECORDING PANEL
        ===================================================== */

        .recording-panel {
          width: 100%;
          max-width: 900px;

          margin:
            0 auto 8px;

          padding: 9px 12px;

          display: flex;
          align-items: center;

          gap: 12px;

          border:
            1px solid #fecaca;

          background:
            rgba(255, 255, 255, 0.97);

          border-radius: 12px;

          box-shadow:
            0 5px 20px
            rgba(0, 0, 0, 0.06);
        }

        .recording-indicator {
          display: flex;
          align-items: center;

          gap: 6px;

          font-size: 12px;
          font-weight: 600;

          color: #dc2626;
        }

        .recording-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #dc2626;

          animation:
            recordingDot 1s infinite;
        }

        @keyframes recordingDot {
          50% {
            opacity: 0.35;
          }
        }

        .recording-countdown {
          min-width: 45px;

          font-size: 13px;

          font-weight: 700;

          font-variant-numeric:
            tabular-nums;

          color:
            var(--text-primary, #111827);
        }

        .recording-bar {
          flex: 1;

          height: 4px;

          overflow: hidden;

          background: #f1f5f9;

          border-radius: 10px;
        }

        .recording-progress {
          height: 100%;

          background: #dc2626;

          border-radius: inherit;

          transition: width 1s linear;
        }

        /* =====================================================
           NOTE
        ===================================================== */

        .composer-note {
          width: 100%;
          max-width: 900px;

          margin: 6px auto 0;

          text-align: center;

          font-size: 9px;

          color:
            var(--text-secondary, #9ca3af);
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 700px) {

          .antimate-header {
            height: 58px;

            padding: 0 15px;
          }

          .antimate-logo {
            width: 34px;
            height: 34px;

            border-radius: 10px;
          }

          .antimate-chat {
            padding:
              22px 14px
              145px;
          }

          .welcome-section {
            min-height: 52vh;
          }

          .welcome-section h1 {
            font-size: 23px;
          }

          .message-bubble {
            max-width: 88%;

            font-size: 13px;
          }

          .voice-response {
            min-width: 0;

            flex-wrap: wrap;
          }

          .voice-response audio {
            width: 100%;
          }

          .composer-wrapper {
            padding:
              8px 10px
              12px;
          }

          .composer {
            border-radius: 14px;
          }

          .composer-button {
            width: 39px;
            height: 39px;
          }

          .recording-panel {
            padding: 8px 10px;
          }
        }

        /* =====================================================
           DARK THEME SUPPORT
        ===================================================== */

        @media (prefers-color-scheme: dark) {

          .antimate-page {
            --background: #0f1115;
            --surface: #171a20;
            --primary: #f3f4f6;
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --border-color: #292e37;
          }

          .user-bubble {
            color: #111827;
          }

          .voice-button {
            background: #252a32;
            color: #f3f4f6;
          }

          .recording-panel {
            background: #171a20;
          }

          .recording-bar {
            background: #272c34;
          }
        }

      `}</style>
    </div>
  );
}