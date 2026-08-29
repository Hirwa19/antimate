import React, { useEffect, useRef, useState } from "react";

/*
============================================================
 ANTIMATE AI
 Voice + Text Chat Interface
 Native CSS only — no Tailwind
============================================================

 BACKEND EXPECTED:

 TEXT:
 POST /api/antimate/chat
 body:
 {
   text: "..."
 }

 VOICE:
 POST /api/antimate/voice
 multipart/form-data:
 {
   audio: File
 }

 The component is intentionally tolerant of different
 backend response field names.
============================================================
*/

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const TEXT_ENDPOINT = `${API_BASE_URL}/api/antimate/chat`;
const VOICE_ENDPOINT = `${API_BASE_URL}/api/antimate/voice`;

const MAX_RECORDING_SECONDS = 30;

// ============================================================
// HELPERS
// ============================================================

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function extractTextFromResponse(data) {
  if (!data) return "";

  if (typeof data === "string") {
    return data.trim();
  }

  return (
    data.answer_kinyarwanda ||
    data.answerKinyarwanda ||
    data.answer_rw ||
    data.answerRw ||
    data.answer ||
    data.response ||
    data.message ||
    data.text ||
    data.output ||
    data.result?.answer_kinyarwanda ||
    data.result?.answer ||
    data.data?.answer_kinyarwanda ||
    data.data?.answer ||
    data.data?.response ||
    ""
  );
}

function extractAudioFromResponse(data) {
  if (!data || typeof data === "string") {
    return null;
  }

  return (
    data.audio_output ||
    data.audioOutput ||
    data.audio_url ||
    data.audioUrl ||
    data.audio ||
    data.result?.audio_output ||
    data.result?.audio_url ||
    data.data?.audio_output ||
    data.data?.audio_url ||
    null
  );
}

function formatTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);

  const minutes = Math.floor(value / 60);
  const secs = value % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;
}

// ============================================================
// ICONS
// ============================================================

function WaveIcon({ active = false }) {
  return (
    <svg
      className={`wave-icon ${active ? "wave-icon-active" : ""}`}
      viewBox="0 0 64 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 16C6 16 6 8 10 8C14 8 14 24 18 24C22 24 22 4 26 4C30 4 30 28 34 28C38 28 38 6 42 6C46 6 46 22 50 22C54 22 54 12 58 12C60 12 61 16 62 16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21.5 3.5L10.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M21.5 3.5L14.5 21L10.5 14.5L3 10.5L21.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 11A8 8 0 1 0 18 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 5V11H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RobotIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="7"
        width="16"
        height="12"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 3V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle cx="12" cy="3" r="1" fill="currentColor" />

      <circle cx="9" cy="13" r="1.2" fill="currentColor" />
      <circle cx="15" cy="13" r="1.2" fill="currentColor" />

      <path
        d="M9 16H15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {
  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [loadingStage, setLoadingStage] = useState("");

  const [isRecording, setIsRecording] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(
    MAX_RECORDING_SECONDS
  );

  const [audioUrl, setAudioUrl] = useState(null);

  const [audioBlob, setAudioBlob] = useState(null);

  const [audioPlaying, setAudioPlaying] = useState(false);

  const [error, setError] = useState("");

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const mediaRecorderRef = useRef(null);

  const mediaStreamRef = useRef(null);

  const recordingTimerRef = useRef(null);

  const audioRef = useRef(null);

  const messagesEndRef = useRef(null);

  const audioChunksRef = useRef([]);

  const isMountedRef = useRef(true);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (mediaRecorderRef.current) {
        try {
          if (
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
          // ignore cleanup error
        }
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, loading]);

  // ==========================================================
  // AUDIO EVENTS
  // ==========================================================

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    const handlePlay = () => {
      if (isMountedRef.current) {
        setAudioPlaying(true);
      }
    };

    const handlePause = () => {
      if (isMountedRef.current) {
        setAudioPlaying(false);
      }
    };

    const handleEnded = () => {
      if (isMountedRef.current) {
        setAudioPlaying(false);
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  // ==========================================================
  // START RECORDING
  // ==========================================================

  async function startRecording() {
    if (loading) return;

    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser yawe ntabwo ishyigikira microphone."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      mediaStreamRef.current = stream;

      audioChunksRef.current = [];

      let mimeType = "";

      const possibleTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      for (const type of possibleTypes) {
        if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported(type)
        ) {
          mimeType = type;
          break;
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const chunks = audioChunksRef.current;

        const finalMime =
          recorder.mimeType || mimeType || "audio/webm";

        const blob = new Blob(chunks, {
          type: finalMime,
        });

        audioChunksRef.current = [];

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          mediaStreamRef.current = null;
        }

        if (isMountedRef.current) {
          setIsRecording(false);
          setRecordingSeconds(MAX_RECORDING_SECONDS);
        }

        if (blob.size > 0) {
          await processVoice(blob);
        }
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event.error
        );

        if (isMountedRef.current) {
          setError(
            "Habaye ikibazo mu gufata amajwi. Ongera ugerageze."
          );
          setIsRecording(false);
        }
      };

      recorder.start(250);

      setIsRecording(true);

      setRecordingSeconds(MAX_RECORDING_SECONDS);

      // ------------------------------------------------------
      // 30 SECOND COUNTDOWN
      // ------------------------------------------------------

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((previous) => {
          if (previous <= 1) {
            clearInterval(recordingTimerRef.current);

            recordingTimerRef.current = null;

            setTimeout(() => {
              stopRecording();
            }, 0);

            return 0;
          }

          return previous - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }

      setIsRecording(false);

      setRecordingSeconds(MAX_RECORDING_SECONDS);

      if (
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError"
      ) {
        setError(
          "Microphone permission yanze. Emera browser yemere microphone yawe."
        );
      } else {
        setError(
          err?.message ||
            "Microphone ntiyashoboye gutangira."
        );
      }
    }
  }

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  function stopRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);

      recordingTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      setIsRecording(false);
      return;
    }

    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch (err) {
      console.error("Stop recording error:", err);

      setIsRecording(false);

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStreamRef.current = null;
      }
    }
  }

  // ==========================================================
  // PROCESS VOICE
  // ==========================================================

  async function processVoice(blob) {
    if (!blob || blob.size === 0) {
      setError("Audio nta data irimo.");
      return;
    }

    setLoading(true);

    setError("");

    setLoadingStage(
      "Ndimo kumva ibyo wavuze..."
    );

    setAudioBlob(blob);

    // --------------------------------------------------------
    // LOCAL PREVIEW
    // --------------------------------------------------------

    try {
      const localUrl = URL.createObjectURL(blob);

      setAudioUrl((oldUrl) => {
        if (oldUrl) {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch (e) {}
        }

        return localUrl;
      });
    } catch (e) {
      console.warn(
        "Could not create local audio preview:",
        e
      );
    }

    // --------------------------------------------------------
    // ADD USER VOICE MESSAGE
    // --------------------------------------------------------

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        type: "voice",
        text: "🎙️ Voice message",
        createdAt: new Date(),
      },
    ]);

    try {
      const formData = new FormData();

      /*
       * Backend will receive "audio".
       *
       * The backend is responsible for converting the
       * incoming browser audio to:
       *
       * WAV
       * 16 kHz
       * mono
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

      const token = getStoredToken();

      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      setLoadingStage(
        "Ndimo kohereza ijwi kuri ANTIMATE..."
      );

      const response = await fetch(
        VOICE_ENDPOINT,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      const rawText = await response.text();

      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {
          message: rawText,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Voice request failed (${response.status})`
        );
      }

      // ------------------------------------------------------
      // PROCESS RESPONSE
      // ------------------------------------------------------

      setLoadingStage(
        "Ndimo gutegura igisubizo..."
      );

      const answer = extractTextFromResponse(data);

      const returnedAudio = extractAudioFromResponse(data);

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo cya text."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          type: "voice",
          text: answer,
          createdAt: new Date(),
        },
      ]);

      // ------------------------------------------------------
      // HANDLE RETURNED TTS AUDIO
      // ------------------------------------------------------

      if (returnedAudio) {
        setLoadingStage(
          "Ndimo kugutegurira ijwi..."
        );

        await handleReturnedAudio(returnedAudio);
      }

      setLoading(false);
      setLoadingStage("");
    } catch (err) {
      console.error("Voice API error:", err);

      if (isMountedRef.current) {
        setLoading(false);
        setLoadingStage("");

        setError(
          err?.message ||
            "Habaye ikibazo mu kohereza voice kuri ANTIMATE."
        );
      }
    }
  }

  // ==========================================================
  // HANDLE RETURNED AUDIO
  // ==========================================================

  async function handleReturnedAudio(returnedAudio) {
    try {
      let finalAudioUrl = returnedAudio;

      // ------------------------------------------------------
      // DATA URL / URL
      // ------------------------------------------------------

      if (
        typeof returnedAudio === "string" &&
        returnedAudio.startsWith("data:audio")
      ) {
        finalAudioUrl = returnedAudio;
      }

      // ------------------------------------------------------
      // BASE64 AUDIO
      // ------------------------------------------------------

      else if (
        typeof returnedAudio === "string" &&
        !returnedAudio.startsWith("http")
      ) {
        const cleanBase64 =
          returnedAudio.includes(",")
            ? returnedAudio.split(",")[1]
            : returnedAudio;

        try {
          const binary = atob(cleanBase64);

          const bytes = new Uint8Array(
            binary.length
          );

          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          const audioBlob = new Blob(
            [bytes],
            {
              type: "audio/wav",
            }
          );

          finalAudioUrl =
            URL.createObjectURL(audioBlob);
        } catch (base64Error) {
          console.warn(
            "Base64 audio conversion failed:",
            base64Error
          );
        }
      }

      // ------------------------------------------------------
      // RELATIVE BACKEND URL
      // ------------------------------------------------------

      else if (
        typeof returnedAudio === "string" &&
        returnedAudio.startsWith("/")
      ) {
        finalAudioUrl = `${API_BASE_URL}${returnedAudio}`;
      }

      // ------------------------------------------------------
      // SAVE AUDIO
      // ------------------------------------------------------

      if (finalAudioUrl) {
        setAudioUrl((oldUrl) => {
          if (
            oldUrl &&
            oldUrl.startsWith("blob:")
          ) {
            try {
              URL.revokeObjectURL(oldUrl);
            } catch (e) {}
          }

          return finalAudioUrl;
        });

        // ----------------------------------------------------
        // AUTOPLAY
        // ----------------------------------------------------

        setTimeout(() => {
          if (!audioRef.current) return;

          const audio = audioRef.current;

          audio.currentTime = 0;

          const playPromise = audio.play();

          if (playPromise?.catch) {
            playPromise.catch((playError) => {
              /*
               * Some browsers block autoplay.
               * The audio remains visible and the Replay
               * button can still be used.
               */

              console.warn(
                "Autoplay blocked:",
                playError
              );

              setAudioPlaying(false);
            });
          }
        }, 150);
      }
    } catch (err) {
      console.error(
        "Returned audio handling error:",
        err
      );
    }
  }

  // ==========================================================
  // SEND TEXT
  // ==========================================================

  async function sendText(event) {
    if (event) {
      event.preventDefault();
    }

    const text = input.trim();

    if (!text || loading || isRecording) {
      return;
    }

    setError("");

    setInput("");

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        type: "text",
        text,
        createdAt: new Date(),
      },
    ]);

    setLoading(true);

    setLoadingStage("Ndigutekereza...");

    try {
      const token = getStoredToken();

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // ------------------------------------------------------
      // SMALL STATUS ROTATION
      // ------------------------------------------------------

      const stageTimer1 = setTimeout(() => {
        if (isMountedRef.current && loading) {
          setLoadingStage(
            "Ndimo kureba amakuru ya system..."
          );
        }
      }, 1800);

      const stageTimer2 = setTimeout(() => {
        if (isMountedRef.current && loading) {
          setLoadingStage(
            "Ndimo gutegura igisubizo..."
          );
        }
      }, 4000);

      const response = await fetch(
        TEXT_ENDPOINT,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            text,
          }),
        }
      );

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      const rawText = await response.text();

      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {
          message: rawText,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Text request failed (${response.status})`
        );
      }

      const answer = extractTextFromResponse(data);

      if (!answer) {
        throw new Error(
          "ANTIMATE ntiyagaruye igisubizo."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          type: "text",
          text: answer,
          createdAt: new Date(),
        },
      ]);

      // ------------------------------------------------------
      // OPTIONAL AUDIO FROM TEXT RESPONSE
      // ------------------------------------------------------

      const returnedAudio = extractAudioFromResponse(data);

      if (returnedAudio) {
        setLoadingStage(
          "Ndimo kugutegurira ijwi..."
        );

        await handleReturnedAudio(returnedAudio);
      }

      setLoading(false);

      setLoadingStage("");
    } catch (err) {
      console.error("Text API error:", err);

      setLoading(false);

      setLoadingStage("");

      setError(
        err?.message ||
          "Habaye ikibazo mu kuvugana na ANTIMATE."
      );
    }
  }

  // ==========================================================
  // REPLAY
  // ==========================================================

  function replayAudio() {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      audio.currentTime = 0;

      const playPromise = audio.play();

      if (playPromise?.catch) {
        playPromise.catch((err) => {
          console.warn(
            "Replay failed:",
            err
          );
        });
      }
    } catch (err) {
      console.error(
        "Replay error:",
        err
      );
    }
  }

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  function handleInputKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendText(event);
    }
  }

  // ==========================================================
  // RECORDING BUTTON
  // ==========================================================

  function handleVoiceButton() {
    if (loading) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="antimate-page">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <header className="antimate-header">
        <div className="antimate-header-left">
          <div className="antimate-logo">
            <RobotIcon />
          </div>

          <div>
            <h1>ANTIMATE AI</h1>

            <div className="antimate-online">
              <span className="online-dot" />
              <span>Online</span>
            </div>
          </div>
        </div>

        <div className="antimate-header-status">
          <span>🇷🇼 Kinyarwanda</span>
        </div>
      </header>

      {/* ================================================== */}
      {/* CHAT AREA */}
      {/* ================================================== */}

      <main className="antimate-chat">
        {/* ---------------------------------------------- */}
        {/* EMPTY STATE */}
        {/* ---------------------------------------------- */}

        {messages.length === 0 && !loading && (
          <div className="antimate-empty">
            <div className="empty-logo">
              <RobotIcon />
            </div>

            <h2>Muraho 👋</h2>

            <p>
              Ndi <strong>ANTIMATE AI</strong>.
              <br />
              Andika cyangwa uvuge icyo ushaka
              kumbaza.
            </p>
          </div>
        )}

        {/* ---------------------------------------------- */}
        {/* MESSAGES */}
        {/* ---------------------------------------------- */}

        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-row ${
                message.role === "user"
                  ? "message-user"
                  : "message-assistant"
              }`}
            >
              <div
                className={`message-bubble ${
                  message.role === "user"
                    ? "bubble-user"
                    : "bubble-assistant"
                }`}
              >
                {message.type === "voice" &&
                  message.role === "user" && (
                    <div className="voice-message-label">
                      <WaveIcon />
                      <span>Voice message</span>
                    </div>
                  )}

                {message.role ===
                  "assistant" && (
                  <div className="assistant-label">
                    <span className="assistant-small-dot" />
                    ANTIMATE
                  </div>
                )}

                <div className="message-text">
                  {message.text}
                </div>
              </div>
            </div>
          ))}

          {/* -------------------------------------------- */}
          {/* THINKING */}
          {/* -------------------------------------------- */}

          {loading && (
            <div className="message-row message-assistant">
              <div className="thinking-area">
                <div className="thinking-header">
                  <span className="thinking-dot" />

                  <span>
                    ANTIMATE
                  </span>
                </div>

                <div className="thinking-text">
                  {loadingStage ||
                    "Ndigutekereza..."}
                </div>

                <div className="thinking-animation">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ================================================== */}
      {/* AUDIO RESPONSE */}
      {/* ================================================== */}

      {audioUrl && (
        <div className="audio-response-bar">
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="auto"
          />

          <div className="audio-response-left">
            <div
              className={`audio-wave ${
                audioPlaying
                  ? "audio-wave-playing"
                  : ""
              }`}
            >
              <WaveIcon
                active={audioPlaying}
              />
            </div>

            <div className="audio-response-info">
              <strong>
                ANTIMATE Voice
              </strong>

              <span>
                {audioPlaying
                  ? "Irimo gukina..."
                  : "Voice response ready"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="replay-button"
            onClick={replayAudio}
            disabled={!audioUrl}
            title="Replay ANTIMATE voice"
          >
            <ReplayIcon />
            <span>Replay</span>
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="antimate-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* RECORDING OVERLAY / STATUS */}
      {/* ================================================== */}

      {isRecording && (
        <div className="recording-status">
          <div className="recording-live">
            <span className="recording-pulse" />

            <span>
              Ndumva...
            </span>
          </div>

          <div className="recording-countdown">
            {formatTime(recordingSeconds)}
          </div>

          <div className="recording-progress">
            <div
              className="recording-progress-fill"
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

          <span className="recording-limit">
            Maximum 30 seconds
          </span>
        </div>
      )}

      {/* ================================================== */}
      {/* FIXED INPUT AREA */}
      {/* ================================================== */}

      <div className="antimate-input-fixed">
        <form
          className="antimate-input-area"
          onSubmit={sendText}
        >
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleInputKeyDown}
            placeholder={
              isRecording
                ? "Ndumva ijwi ryawe..."
                : "Andika ubutumwa..."
            }
            rows={1}
            disabled={
              loading || isRecording
            }
          />

          {/* ------------------------------------------ */}
          {/* VOICE WAVE BUTTON */}
          {/* ------------------------------------------ */}

          <button
            type="button"
            className={`voice-wave-button ${
              isRecording
                ? "voice-recording"
                : ""
            }`}
            onClick={handleVoiceButton}
            disabled={loading}
            title={
              isRecording
                ? "Stop recording"
                : "Vuga na ANTIMATE"
            }
          >
            {isRecording ? (
              <StopIcon />
            ) : (
              <WaveIcon />
            )}
          </button>

          {/* ------------------------------------------ */}
          {/* SEND */}
          {/* ------------------------------------------ */}

          <button
            type="submit"
            className="send-button"
            disabled={
              !input.trim() ||
              loading ||
              isRecording
            }
            title="Send"
          >
            <SendIcon />
          </button>
        </form>

        <div className="input-hint">
          <span>
            Enter = kohereza
          </span>

          <span>
            •
          </span>

          <span>
            Shift + Enter = umurongo mushya
          </span>

          <span className="input-powered">
            ANTIMATE AI
          </span>
        </div>
      </div>

      {/* ================================================== */}
      {/* NATIVE CSS */}
      {/* ================================================== */}

      <style>{`
        /* ====================================================
           ROOT
        ==================================================== */

        .antimate-page {
          --antimate-primary: var(--primary-color, #2563eb);
          --antimate-primary-dark: var(--primary-dark, #1d4ed8);

          --antimate-bg: var(
            --background-color,
            #f8fafc
          );

          --antimate-surface: var(
            --card-background,
            #ffffff
          );

          --antimate-border: var(
            --border-color,
            #e2e8f0
          );

          --antimate-text: var(
            --text-color,
            #0f172a
          );

          --antimate-muted: var(
            --muted-text,
            #64748b
          );

          min-height: 100vh;

          background:
            var(--antimate-bg);

          color:
            var(--antimate-text);

          display: flex;

          flex-direction: column;

          position: relative;

          overflow: hidden;
        }

        /* ====================================================
           HEADER
        ==================================================== */

        .antimate-header {
          height: 68px;

          flex-shrink: 0;

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 0 28px;

          border-bottom:
            1px solid var(--antimate-border);

          background:
            var(--antimate-surface);

          z-index: 10;
        }

        .antimate-header-left {
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

          color: white;

          background:
            var(--antimate-primary);
        }

        .antimate-logo svg {
          width: 22px;

          height: 22px;
        }

        .antimate-header h1 {
          margin: 0;

          font-size: 15px;

          font-weight: 700;

          letter-spacing: 0.2px;
        }

        .antimate-online {
          display: flex;

          align-items: center;

          gap: 6px;

          margin-top: 2px;

          font-size: 11px;

          color:
            var(--antimate-muted);
        }

        .online-dot {
          width: 6px;

          height: 6px;

          border-radius: 50%;

          background: #22c55e;

          box-shadow:
            0 0 0 3px
            rgba(34, 197, 94, 0.1);
        }

        .antimate-header-status {
          font-size: 12px;

          color:
            var(--antimate-muted);

          padding: 7px 11px;

          border: 1px solid
            var(--antimate-border);

          border-radius: 20px;

          background:
            var(--antimate-bg);
        }

        /* ====================================================
           CHAT
        ==================================================== */

        .antimate-chat {
          flex: 1;

          overflow-y: auto;

          padding:
            30px
            24px
            190px;

          scroll-behavior: smooth;
        }

        .messages-list {
          width: min(
            850px,
            100%
          );

          margin: 0 auto;

          display: flex;

          flex-direction: column;

          gap: 15px;
        }

        /* ====================================================
           EMPTY
        ==================================================== */

        .antimate-empty {
          min-height: 55vh;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          text-align: center;
        }

        .empty-logo {
          width: 64px;

          height: 64px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 18px;

          color:
            var(--antimate-primary);

          background:
            rgba(37, 99, 235, 0.08);

          margin-bottom: 16px;
        }

        .empty-logo svg {
          width: 34px;

          height: 34px;
        }

        .antimate-empty h2 {
          margin: 0 0 8px;

          font-size: 25px;

          font-weight: 700;
        }

        .antimate-empty p {
          margin: 0;

          line-height: 1.7;

          font-size: 14px;

          color:
            var(--antimate-muted);
        }

        .antimate-empty strong {
          color:
            var(--antimate-text);
        }

        /* ====================================================
           MESSAGES
        ==================================================== */

        .message-row {
          width: 100%;

          display: flex;
        }

        .message-user {
          justify-content: flex-end;
        }

        .message-assistant {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: min(
            75%,
            650px
          );

          padding: 13px 16px;

          border-radius: 16px;

          font-size: 14px;

          line-height: 1.65;

          word-break: break-word;
        }

        .bubble-user {
          color: white;

          background:
            var(--antimate-primary);

          border-bottom-right-radius: 5px;
        }

        .bubble-assistant {
          color:
            var(--antimate-text);

          background:
            var(--antimate-surface);

          border: 1px solid
            var(--antimate-border);

          border-bottom-left-radius: 5px;
        }

        .assistant-label {
          display: flex;

          align-items: center;

          gap: 6px;

          margin-bottom: 6px;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 0.5px;

          color:
            var(--antimate-primary);
        }

        .assistant-small-dot {
          width: 5px;

          height: 5px;

          border-radius: 50%;

          background:
            var(--antimate-primary);
        }

        .voice-message-label {
          display: flex;

          align-items: center;

          gap: 8px;

          margin-bottom: 3px;
        }

        .voice-message-label .wave-icon {
          width: 40px;

          height: 20px;
        }

        /* ====================================================
           THINKING
        ==================================================== */

        .thinking-area {
          max-width: 420px;

          padding: 10px 2px;
        }

        .thinking-header {
          display: flex;

          align-items: center;

          gap: 7px;

          margin-bottom: 7px;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 0.5px;

          color:
            var(--antimate-primary);
        }

        .thinking-dot {
          width: 6px;

          height: 6px;

          border-radius: 50%;

          background:
            var(--antimate-primary);

          animation:
            thinkingPulse 1.2s
            infinite ease-in-out;
        }

        .thinking-text {
          font-size: 13px;

          color:
            var(--antimate-muted);
        }

        .thinking-animation {
          display: flex;

          gap: 4px;

          margin-top: 8px;
        }

        .thinking-animation span {
          width: 5px;

          height: 5px;

          border-radius: 50%;

          background:
            var(--antimate-primary);

          animation:
            thinkingDots 1.3s
            infinite ease-in-out;
        }

        .thinking-animation span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .thinking-animation span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes thinkingPulse {
          0%,
          100% {
            opacity: 0.3;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes thinkingDots {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }

          50% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        /* ====================================================
           AUDIO RESPONSE
        ==================================================== */

        .audio-response-bar {
          position: fixed;

          bottom: 105px;

          left: 50%;

          transform:
            translateX(-50%);

          width: min(
            850px,
            calc(100% - 32px)
          );

          min-height: 62px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          padding: 9px 12px;

          border:
            1px solid
            var(--antimate-border);

          border-radius: 14px;

          background:
            var(--antimate-surface);

          box-shadow:
            0 8px 30px
            rgba(15, 23, 42, 0.08);

          z-index: 25;
        }

        .audio-response-left {
          display: flex;

          align-items: center;

          gap: 11px;

          min-width: 0;
        }

        .audio-wave {
          width: 40px;

          height: 40px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 10px;

          color:
            var(--antimate-primary);

          background:
            rgba(37, 99, 235, 0.08);
        }

        .audio-wave .wave-icon {
          width: 30px;

          height: 22px;
        }

        .audio-wave-playing .wave-icon {
          animation:
            waveBounce 0.8s
            infinite alternate;
        }

        @keyframes waveBounce {
          from {
            transform: scaleY(0.75);
          }

          to {
            transform: scaleY(1.15);
          }
        }

        .audio-response-info {
          display: flex;

          flex-direction: column;

          min-width: 0;
        }

        .audio-response-info strong {
          font-size: 12px;
        }

        .audio-response-info span {
          margin-top: 2px;

          font-size: 11px;

          color:
            var(--antimate-muted);
        }

        .replay-button {
          height: 38px;

          padding: 0 13px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          border: 1px solid
            var(--antimate-border);

          border-radius: 9px;

          background:
            var(--antimate-bg);

          color:
            var(--antimate-text);

          cursor: pointer;

          font-size: 12px;

          font-weight: 600;

          transition:
            background 0.15s,
            border 0.15s,
            transform 0.15s;
        }

        .replay-button svg {
          width: 17px;

          height: 17px;
        }

        .replay-button:hover {
          border-color:
            var(--antimate-primary);

          color:
            var(--antimate-primary);
        }

        .replay-button:active {
          transform: scale(0.97);
        }

        /* ====================================================
           ERROR
        ==================================================== */

        .antimate-error {
          position: fixed;

          bottom: 174px;

          left: 50%;

          transform:
            translateX(-50%);

          width: min(
            700px,
            calc(100% - 32px)
          );

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 10px;

          padding: 10px 13px;

          border:
            1px solid
            rgba(239, 68, 68, 0.2);

          border-radius: 10px;

          background:
            rgba(254, 242, 242, 0.97);

          color:
            #b91c1c;

          font-size: 12px;

          z-index: 40;
        }

        .antimate-error button {
          border: none;

          background: transparent;

          color: inherit;

          font-size: 20px;

          line-height: 1;

          cursor: pointer;
        }

        /* ====================================================
           RECORDING STATUS
        ==================================================== */

        .recording-status {
          position: fixed;

          left: 50%;

          bottom: 175px;

          transform:
            translateX(-50%);

          width: min(
            360px,
            calc(100% - 32px)
          );

          padding: 14px 16px;

          border:
            1px solid
            var(--antimate-border);

          border-radius: 14px;

          background:
            var(--antimate-surface);

          box-shadow:
            0 10px 35px
            rgba(15, 23, 42, 0.12);

          z-index: 50;
        }

        .recording-live {
          display: flex;

          align-items: center;

          gap: 7px;

          font-size: 12px;

          color:
            var(--antimate-text);

          font-weight: 600;
        }

        .recording-pulse {
          width: 8px;

          height: 8px;

          border-radius: 50%;

          background:
            #ef4444;

          animation:
            recordingPulse 1s
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

        .recording-countdown {
          margin-top: 5px;

          font-size: 25px;

          line-height: 1;

          font-weight: 700;

          letter-spacing: 1px;

          color:
            var(--antimate-text);
        }

        .recording-progress {
          width: 100%;

          height: 4px;

          overflow: hidden;

          margin-top: 12px;

          border-radius: 10px;

          background:
            var(--antimate-border);
        }

        .recording-progress-fill {
          height: 100%;

          border-radius: inherit;

          background:
            var(--antimate-primary);

          transition:
            width 1s linear;
        }

        .recording-limit {
          display: block;

          margin-top: 7px;

          font-size: 10px;

          color:
            var(--antimate-muted);
        }

        /* ====================================================
           FIXED INPUT
        ==================================================== */

        .antimate-input-fixed {
          position: fixed;

          left: 0;

          right: 0;

          bottom: 0;

          z-index: 30;

          padding:
            10px
            20px
            12px;

          background:
            linear-gradient(
              to top,
              var(--antimate-bg) 70%,
              transparent
            );
        }

        .antimate-input-area {
          width: min(
            850px,
            100%
          );

          margin: 0 auto;

          min-height: 52px;

          display: flex;

          align-items: center;

          gap: 8px;

          padding: 6px 7px 6px 15px;

          border:
            1px solid
            var(--antimate-border);

          border-radius: 15px;

          background:
            var(--antimate-surface);

          box-shadow:
            0 5px 25px
            rgba(15, 23, 42, 0.07);
        }

        .antimate-input-area textarea {
          flex: 1;

          min-width: 0;

          resize: none;

          max-height: 110px;

          border: none;

          outline: none;

          background: transparent;

          color:
            var(--antimate-text);

          font-family: inherit;

          font-size: 14px;

          line-height: 20px;

          padding:
            9px
            0;
        }

        .antimate-input-area textarea::placeholder {
          color:
            var(--antimate-muted);
        }

        .antimate-input-area textarea:disabled {
          opacity: 0.6;
        }

        /* ====================================================
           WAVE BUTTON
        ==================================================== */

        .voice-wave-button {
          flex-shrink: 0;

          width: 39px;

          height: 39px;

          border: none;

          border-radius: 11px;

          display: flex;

          align-items: center;

          justify-content: center;

          color:
            var(--antimate-primary);

          background:
            rgba(37, 99, 235, 0.08);

          cursor: pointer;

          transition:
            transform 0.15s,
            background 0.15s,
            color 0.15s;
        }

        .voice-wave-button .wave-icon {
          width: 27px;

          height: 20px;
        }

        .voice-wave-button:hover:not(:disabled) {
          background:
            rgba(37, 99, 235, 0.14);

          transform:
            translateY(-1px);
        }

        .voice-wave-button:active:not(:disabled) {
          transform: scale(0.94);
        }

        .voice-wave-button:disabled {
          opacity: 0.4;

          cursor: not-allowed;
        }

        .voice-wave-button.voice-recording {
          color: white;

          background:
            #ef4444;
        }

        .voice-wave-button.voice-recording:hover {
          background:
            #dc2626;
        }

        .voice-wave-button svg {
          width: 19px;

          height: 19px;
        }

        /* ====================================================
           SEND BUTTON
        ==================================================== */

        .send-button {
          flex-shrink: 0;

          width: 39px;

          height: 39px;

          border: none;

          border-radius: 11px;

          display: flex;

          align-items: center;

          justify-content: center;

          color: white;

          background:
            var(--antimate-primary);

          cursor: pointer;

          transition:
            transform 0.15s,
            opacity 0.15s,
            background 0.15s;
        }

        .send-button svg {
          width: 18px;

          height: 18px;
        }

        .send-button:hover:not(:disabled) {
          background:
            var(--antimate-primary-dark);

          transform:
            translateY(-1px);
        }

        .send-button:active:not(:disabled) {
          transform: scale(0.94);
        }

        .send-button:disabled {
          opacity: 0.35;

          cursor: not-allowed;
        }

        /* ====================================================
           INPUT HINT
        ==================================================== */

        .input-hint {
          width: min(
            850px,
            100%
          );

          margin:
            6px
            auto
            0;

          display: flex;

          align-items: center;

          gap: 6px;

          padding: 0 5px;

          font-size: 9px;

          color:
            var(--antimate-muted);
        }

        .input-powered {
          margin-left: auto;

          font-weight: 600;

          opacity: 0.7;
        }

        /* ====================================================
           MOBILE
        ==================================================== */

        @media (max-width: 700px) {
          .antimate-header {
            height: 60px;

            padding:
              0 15px;
          }

          .antimate-header-status {
            display: none;
          }

          .antimate-chat {
            padding:
              20px
              13px
              180px;
          }

          .message-bubble {
            max-width: 88%;

            font-size: 13.5px;
          }

          .antimate-input-fixed {
            padding:
              8px
              10px
              10px;
          }

          .antimate-input-area {
            min-height: 50px;

            border-radius: 14px;
          }

          .input-hint {
            display: none;
          }

          .audio-response-bar {
            bottom: 76px;

            width:
              calc(100% - 20px);

            min-height: 57px;
          }

          .replay-button {
            padding:
              0 10px;
          }

          .replay-button span {
            display: none;
          }

          .antimate-error {
            bottom: 140px;
          }

          .recording-status {
            bottom: 140px;
          }

          .antimate-empty {
            min-height: 52vh;
          }

          .antimate-empty h2 {
            font-size: 22px;
          }
        }

        /* ====================================================
           DARK THEME SUPPORT
        ==================================================== */

        [data-theme="dark"]
          .antimate-page,
        .dark
          .antimate-page {
          --antimate-bg:
            #0f172a;

          --antimate-surface:
            #111827;

          --antimate-border:
            #263244;

          --antimate-text:
            #f1f5f9;

          --antimate-muted:
            #94a3b8;
        }

        [data-theme="dark"]
          .antimate-error,
        .dark
          .antimate-error {
          background:
            rgba(69, 10, 10, 0.96);

          color:
            #fca5a5;
        }
      `}</style>
    </div>
  );
}