
import React, { useEffect, useRef, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com"
).replace(/\/+$/, "");

const CHAT_ENDPOINT = `${API_BASE}/api/antimate/chat`;
const VOICE_ENDPOINT = `${API_BASE}/api/antimate/voice`;
const MAX_RECORDING_SECONDS = 30;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "AUTH_REQUIRED: Nta token ibonetse. Injira muri ANTIMATE LINK wongere ugerageze."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text };
  }

  if (response.status === 401) {
    throw new Error(
      "AUTH_REQUIRED: Login yawe yarangiye cyangwa token si yo. Ongera winjire muri ANTIMATE LINK."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "ACCESS_DENIED: Ntabwo wemerewe gukoresha iyi serivisi."
    );
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request yanze (HTTP ${response.status}).`
    );
  }

  return data;
}

function getAIText(data) {
  if (typeof data === "string") return data;

  return (
    data?.reply ||
    data?.response ||
    data?.answer ||
    data?.text ||
    data?.message ||
    data?.result?.reply ||
    data?.result?.answer ||
    ""
  );
}

function getVoiceTranscript(data) {
  return (
    data?.transcript ||
    data?.transcription ||
    data?.userText ||
    data?.inputText ||
    ""
  );
}

function getAudioUrl(data) {
  return (
    data?.audioUrl ||
    data?.audio_url ||
    data?.audio?.url ||
    data?.result?.audioUrl ||
    ""
  );
}

export default function AntimateAI() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Muraho! Ndi ANTIMATE AI. Nakugirira iki uyu munsi?",
      time: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    MAX_RECORDING_SECONDS
  );
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("antimate-theme") === "dark";
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const mountedRef = useRef(true);
  const recordingStartedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (
        recorderRef.current &&
        recorderRef.current.state !== "inactive"
      ) {
        recorderRef.current.ondataavailable = null;
        recorderRef.current.onstop = null;

        try {
          recorderRef.current.stop();
        } catch {
          // Recorder ishobora kuba yamaze guhagarara.
        }
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, status]);

  useEffect(() => {
    localStorage.setItem(
      "antimate-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const addMessage = (role, text, extra = {}) => {
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      text,
      time: new Date(),
      ...extra,
    };

    setMessages((previous) => [...previous, message]);

    return message;
  };

  const updateMessage = (id, updates) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id
          ? { ...message, ...updates }
          : message
      )
    );
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setPlayingId(null);
  };

  const playAudio = async (url, messageId) => {
    if (!url) return;

    try {
      stopAudio();

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        if (mountedRef.current) {
          setPlayingId(null);
        }
        audioRef.current = null;
      };

      audio.onerror = () => {
        if (mountedRef.current) {
          setPlayingId(null);
          setError("Audio ntiyashoboye gucurangwa.");
        }
        audioRef.current = null;
      };

      setPlayingId(messageId);
      await audio.play();
    } catch (err) {
      setPlayingId(null);
      setError(
        err?.message || "Ntibyashobotse gucuranga audio."
      );
    }
  };

  const sendText = async (event) => {
    event?.preventDefault();

    const message = input.trim();

    if (!message || sending || recording) return;

    setError("");
    setInput("");
    addMessage("user", message);
    setSending(true);
    setStatus("ANTIMATE AI iratekereza...");

    try {
      const headers = getAuthHeaders();

      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          message,
          text: message,
        }),
      });

      const data = await parseResponse(response);
      const answer = getAIText(data);

      if (!answer) {
        throw new Error(
          "Backend yasubije igisubizo kitagaragaza text. Reba response ya /api/antimate/chat."
        );
      }

      addMessage("assistant", answer, {
        audioUrl: getAudioUrl(data),
      });
    } catch (err) {
      const errorMessage =
        err?.message || "Habaye ikibazo mu kohereza ubutumwa.";

      setError(errorMessage);

      addMessage(
        "system",
        errorMessage.startsWith("AUTH_REQUIRED:")
          ? errorMessage.replace("AUTH_REQUIRED: ", "")
          : errorMessage
      );
    } finally {
      setSending(false);
      setStatus("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const uploadVoice = async (audioBlob) => {
    if (!audioBlob || audioBlob.size === 0) {
      setError("Nta majwi yafashwe. Ongera ugerageze.");
      return;
    }

    setError("");
    setSending(true);
    setStatus("ANTIMATE AI iri gusesengura amajwi...");

    try {
      const headers = getAuthHeaders();
      const formData = new FormData();

      const extension =
        audioBlob.type.includes("mp4") ||
        audioBlob.type.includes("m4a")
          ? "m4a"
          : audioBlob.type.includes("ogg")
            ? "ogg"
            : "webm";

      formData.append("audio", audioBlob, `voice.${extension}`);

      const response = await fetch(VOICE_ENDPOINT, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await parseResponse(response);
      const transcript = getVoiceTranscript(data);
      const answer = getAIText(data);
      const audioUrl = getAudioUrl(data);

      if (transcript) {
        addMessage("user", transcript, {
          source: "voice",
        });
      } else {
        addMessage(
          "user",
          "Ubutumwa bw'amajwi bwoherejwe.",
          { source: "voice" }
        );
      }

      if (answer) {
        const aiMessage = addMessage("assistant", answer, {
          audioUrl,
        });

        if (audioUrl) {
          await playAudio(audioUrl, aiMessage.id);
        }
      } else {
        throw new Error(
          "Audio yoherejwe, ariko backend ntiyagaruye igisubizo cya AI. Reba response ya /api/antimate/voice."
        );
      }
    } catch (err) {
      const errorMessage =
        err?.message || "Ntibyashobotse kohereza amajwi.";

      setError(errorMessage);
      addMessage("system", errorMessage);
    } finally {
      setSending(false);
      setStatus("");
    }
  };

  const startRecording = async () => {
    if (recording || sending) return;

    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Browser yawe ntishyigikira gufata amajwi. Koresha HTTPS cyangwa localhost."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      let mimeType = "";

      if (window.MediaRecorder?.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (
        window.MediaRecorder?.isTypeSupported("audio/webm")
      ) {
        mimeType = "audio/webm";
      } else if (
        window.MediaRecorder?.isTypeSupported("audio/mp4")
      ) {
        mimeType = "audio/mp4";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];
      recordingStartedRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("Habaye ikibazo mu gufata amajwi.");
      };

      recorder.onstop = async () => {
        const blobType =
          recorder.mimeType || mimeType || "audio/webm";

        const audioBlob = new Blob(chunksRef.current, {
          type: blobType,
        });

        chunksRef.current = [];

        streamRef.current?.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
        recorderRef.current = null;

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (recordingStartedRef.current && audioBlob.size > 0) {
          recordingStartedRef.current = false;
          await uploadVoice(audioBlob);
        }
      };

      recorder.start(250);

      setRecording(true);
      setSecondsLeft(MAX_RECORDING_SECONDS);
      setStatus("Ndakumva... Vuga ubutumwa bwawe.");

      let remaining = MAX_RECORDING_SECONDS;

      timerRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(Math.max(remaining, 0));

        if (remaining <= 0) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;

      setRecording(false);
      setError(
        err?.name === "NotAllowedError"
          ? "Wanze ko browser ikoresha microphone. Yemerere microphone muri browser settings."
          : err?.message ||
              "Microphone ntiyashoboye gufunguka."
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRecording(false);
    setSecondsLeft(MAX_RECORDING_SECONDS);
    setStatus("Ndimo kohereza amajwi...");

    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
      recorderRef.current = null;
      setStatus("");
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearConversation = () => {
    if (sending || recording) return;

    stopAudio();

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        text: "Ikiganiro gishya gitangiye. Nagufasha iki?",
        time: new Date(),
      },
    ]);

    setError("");
    setStatus("");
  };

  const formatTime = (date) => {
    try {
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <main
      className={`antimate-page ${darkMode ? "antimate-dark" : "antimate-light"}`}
    >
      <style>{`
        .antimate-page {
          --ai-bg: var(--bg-color, #f5f7fb);
          --ai-card: var(--card-bg, #ffffff);
          --ai-text: var(--text-color, #172033);
          --ai-muted: var(--secondary-text, #687386);
          --ai-border: var(--border-color, #e2e7ef);
          --ai-primary: var(--primary-color, #536dfe);
          min-height: 100vh;
          height: 100dvh;
          background: var(--ai-bg);
          color: var(--ai-text);
          display: flex;
          flex-direction: column;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          overflow: hidden;
        }

        .antimate-dark {
          --ai-bg: #10131b;
          --ai-card: #191e29;
          --ai-text: #f1f4fb;
          --ai-muted: #a5afc1;
          --ai-border: #303848;
          --ai-primary: #8395ff;
        }

        .antimate-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--ai-border);
          background: var(--ai-card);
          flex-shrink: 0;
        }

        .antimate-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .antimate-logo {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #5e6bff,
            #00d5c0,
            #b35cff,
            #ff8c66,
            #5e6bff
          );
          display: grid;
          place-items: center;
          animation: antimate-spin 8s linear infinite;
          box-shadow: 0 0 22px #536dfe35;
        }

        .antimate-logo-inner {
          width: 29px;
          height: 29px;
          border: 4px solid var(--ai-card);
          border-radius: 50%;
          background: transparent;
        }

        @keyframes antimate-spin {
          to { transform: rotate(360deg); }
        }

        .antimate-brand h1 {
          font-size: 17px;
          line-height: 1.3;
          margin: 0;
          font-weight: 750;
        }

        .antimate-brand p {
          font-size: 12px;
          margin: 3px 0 0;
          color: var(--ai-muted);
        }

        .antimate-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .antimate-icon-button {
          width: 40px;
          height: 40px;
          border: 1px solid var(--ai-border);
          border-radius: 12px;
          background: var(--ai-card);
          color: var(--ai-text);
          font-size: 17px;
          cursor: pointer;
        }

        .antimate-icon-button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .antimate-chat {
          flex: 1;
          overflow-y: auto;
          padding: 24px max(16px, calc((100% - 850px) / 2));
          scroll-behavior: smooth;
        }

        .antimate-message-row {
          display: flex;
          margin-bottom: 20px;
          gap: 10px;
          align-items: flex-end;
        }

        .antimate-message-row.user {
          justify-content: flex-end;
        }

        .antimate-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          background: var(--ai-card);
          border: 1px solid var(--ai-border);
          font-size: 12px;
          font-weight: 800;
        }

        .antimate-bubble-wrap {
          max-width: min(82%, 680px);
          min-width: 0;
        }

        .antimate-bubble {
          padding: 12px 15px;
          border: 1px solid var(--ai-border);
          background: var(--ai-card);
          border-radius: 17px 17px 17px 5px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.65;
          font-size: 14px;
        }

        .antimate-message-row.user .antimate-bubble {
          background: var(--ai-primary);
          color: #fff;
          border-color: transparent;
          border-radius: 17px 17px 5px 17px;
        }

        .antimate-message-row.system .antimate-bubble {
          border-color: #e7a04b;
          color: var(--ai-text);
        }

        .antimate-time {
          color: var(--ai-muted);
          font-size: 10px;
          margin: 5px 4px 0;
        }

        .antimate-message-row.user .antimate-time {
          text-align: right;
        }

        .antimate-audio-button {
          margin-top: 8px;
          border: 1px solid var(--ai-border);
          border-radius: 9px;
          background: var(--ai-card);
          color: var(--ai-text);
          padding: 7px 10px;
          cursor: pointer;
          font-size: 12px;
        }

        .antimate-thinking {
          color: var(--ai-muted);
          font-size: 13px;
          margin: 6px 0 18px 40px;
          animation: antimate-pulse 1.4s ease-in-out infinite;
        }

        @keyframes antimate-pulse {
          50% { opacity: .45; }
        }

        .antimate-footer {
          flex-shrink: 0;
          padding: 14px 16px max(14px, env(safe-area-inset-bottom));
          border-top: 1px solid var(--ai-border);
          background: var(--ai-card);
        }

        .antimate-composer {
          max-width: 850px;
          margin: 0 auto;
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 8px;
          border: 1px solid var(--ai-border);
          border-radius: 18px;
          background: var(--ai-bg);
        }

        .antimate-input {
          flex: 1;
          min-width: 0;
          max-height: 140px;
          resize: vertical;
          border: 0;
          outline: 0;
          padding: 10px 5px;
          background: transparent;
          color: var(--ai-text);
          font: inherit;
          font-size: 14px;
        }

        .antimate-input::placeholder {
          color: var(--ai-muted);
        }

        .antimate-send,
        .antimate-mic {
          min-width: 42px;
          height: 42px;
          border: 0;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 18px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .antimate-send {
          background: var(--ai-primary);
          color: #fff;
        }

        .antimate-mic {
          background: var(--ai-card);
          color: var(--ai-text);
          border: 1px solid var(--ai-border);
        }

        .antimate-send:disabled,
        .antimate-mic:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .antimate-mic.recording {
          color: white;
          background: #e5484d;
          border-color: #e5484d;
          animation: antimate-pulse 1s infinite;
        }

        .antimate-status {
          max-width: 850px;
          margin: 0 auto 9px;
          color: var(--ai-muted);
          font-size: 12px;
        }

        .antimate-error {
          max-width: 850px;
          margin: 0 auto 10px;
          color: #dc4545;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .antimate-hint {
          text-align: center;
          color: var(--ai-muted);
          font-size: 10px;
          margin-top: 9px;
        }

        @media (max-width: 600px) {
          .antimate-header { padding: 12px; }
          .antimate-brand h1 { font-size: 15px; }
          .antimate-chat { padding: 18px 12px; }
          .antimate-bubble-wrap { max-width: 88%; }
          .antimate-footer { padding-left: 10px; padding-right: 10px; }
          .antimate-logo { width: 40px; height: 40px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .antimate-logo,
          .antimate-thinking,
          .antimate-mic.recording {
            animation: none;
          }
        }
      `}</style>

      <header className="antimate-header">
        <div className="antimate-brand">
          <div className="antimate-logo" aria-label="ANTIMATE AI">
            <div className="antimate-logo-inner" />
          </div>

          <div>
            <h1>ANTIMATE AI</h1>
            <p>
              {recording
                ? `Ndakumva • ${secondsLeft}s`
                : sending
                  ? "Ndimo gukora..."
                  : "AI assistant"}
            </p>
          </div>
        </div>

        <div className="antimate-actions">
          <button
            type="button"
            className="antimate-icon-button"
            title="Ikiganiro gishya"
            aria-label="Ikiganiro gishya"
            onClick={clearConversation}
            disabled={sending || recording}
          >
            ↺
          </button>

          <button
            type="button"
            className="antimate-icon-button"
            title="Hindura theme"
            aria-label="Hindura theme"
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <section
        className="antimate-chat"
        aria-live="polite"
        aria-label="ANTIMATE AI conversation"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`antimate-message-row ${message.role}`}
          >
            {message.role !== "user" && (
              <div className="antimate-avatar">
                {message.role === "system" ? "!" : "A"}
              </div>
            )}

            <div className="antimate-bubble-wrap">
              <div className="antimate-bubble">
                {message.text}
              </div>

              {message.role === "assistant" && message.audioUrl && (
                <button
                  type="button"
                  className="antimate-audio-button"
                  onClick={() => {
                    if (playingId === message.id) {
                      stopAudio();
                    } else {
                      playAudio(message.audioUrl, message.id);
                    }
                  }}
                >
                  {playingId === message.id
                    ? "■ Hagarika audio"
                    : "▶ Ongera wumve"}
                </button>
              )}

              <div className="antimate-time">
                {formatTime(message.time)}
                {message.source === "voice" ? " · Voice" : ""}
              </div>
            </div>

            {message.role === "user" && (
              <div className="antimate-avatar">W</div>
            )}
          </div>
        ))}

        {status && (
          <div className="antimate-thinking">
            ◌ {status}
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      <footer className="antimate-footer">
        {error && (
          <div className="antimate-error" role="alert">
            {error}
          </div>
        )}

        {status && (
          <div className="antimate-status">
            {status}
          </div>
        )}

        <form className="antimate-composer" onSubmit={sendText}>
          <button
            type="button"
            className={`antimate-mic ${recording ? "recording" : ""}`}
            title={
              recording
                ? "Hagarika gufata amajwi no kohereza"
                : "Vuga ubutumwa"
            }
            aria-label={
              recording ? "Hagarika gufata amajwi" : "Fata amajwi"
            }
            onClick={toggleRecording}
            disabled={sending}
          >
            {recording ? "■" : "🎙"}
          </button>

          <textarea
            ref={inputRef}
            className="antimate-input"
            rows={1}
            placeholder={
              recording
                ? `Vuga... ${secondsLeft}s zisigaye`
                : "Andika ubutumwa bwawe..."
            }
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                sendText();
              }
            }}
            disabled={sending || recording}
          />

          <button
            type="submit"
            className="antimate-send"
            aria-label="Ohereza ubutumwa"
            title="Ohereza"
            disabled={!input.trim() || sending || recording}
          >
            {sending ? "…" : "➤"}
          </button>
        </form>

        <div className="antimate-hint">
          Enter = ohereza · Shift + Enter = umurongo mushya ·
          Audio ntirenza amasegonda 30
        </div>
      </footer>
    </main>
  );
}