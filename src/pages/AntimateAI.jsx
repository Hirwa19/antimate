import { useEffect, useRef, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const MAX_RECORDING_SECONDS = 30;

export default function AntimateAI() {
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);

  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [micChecking, setMicChecking] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(MAX_RECORDING_SECONDS);

  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const [micPermission, setMicPermission] = useState("unknown");

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const recordingTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  const messagesEndRef = useRef(null);
  const textInputRef = useRef(null);

  const recordedAudioElementRef = useRef(null);

  const audioUrlRef = useRef(null);
  const recordedAudioUrlRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: "Muraho 👋 Ndi ANTIMATE AI. Nakumva kandi nkagufasha mu Kinyarwanda.",
        time: getTime(),
      },
    ]);
  }, []);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.permissions?.query) {
        setMicPermission("unknown");
        return;
      }
      const permission = await navigator.permissions.query({ name: "microphone" });
      setMicPermission(permission.state);
      permission.onchange = () => {
        setMicPermission(permission.state);
      };
    } catch {
      setMicPermission("unknown");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      stopRecordingTimer();
      stopMicrophone();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (recordedAudioUrlRef.current) URL.revokeObjectURL(recordedAudioUrlRef.current);
    };
  }, []);

  function getTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const stopMicrophone = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
      streamRef.current = null;
    }
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const resetRecordingTimer = () => {
    stopRecordingTimer();
    setRecordingSeconds(MAX_RECORDING_SECONDS);
    recordingStartTimeRef.current = null;
  };

  const clearRecordedAudio = () => {
    if (recordedAudioElementRef.current) {
      try {
        recordedAudioElementRef.current.pause();
        recordedAudioElementRef.current.currentTime = 0;
      } catch {}
    }
    setIsAudioPlaying(false);
    if (recordedAudioUrlRef.current) {
      URL.revokeObjectURL(recordedAudioUrlRef.current);
      recordedAudioUrlRef.current = null;
    }
    setRecordedAudioUrl(null);
  };

  const setRecordedPreview = (file) => {
    clearRecordedAudio();
    const url = URL.createObjectURL(file);
    recordedAudioUrlRef.current = url;
    setRecordedAudioUrl(url);
  };

  const startRecordingTimer = () => {
    stopRecordingTimer();
    recordingStartTimeRef.current = Date.now();
    setRecordingSeconds(MAX_RECORDING_SECONDS);

    recordingTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      const remaining = Math.max(0, MAX_RECORDING_SECONDS - elapsed);
      setRecordingSeconds(remaining);

      if (remaining <= 0) {
        stopRecordingTimer();
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
          recorder.stop();
        }
      }
    }, 250);
  };

  const ensureMicrophoneSupport = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Browser yawe ntabwo ishyigikira microphone.");
    }
    if (window.isSecureContext === false) {
      throw new Error("Microphone isaba HTTPS.");
    }
    if (typeof MediaRecorder === "undefined") {
      throw new Error("Browser yawe ntabwo ishyigikira audio recording.");
    }
  };

  const getMicrophone = async () => {
    ensureMicrophoneSupport();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const tracks = stream.getAudioTracks();
      if (!tracks.length) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Browser ntiyabonye audio input.");
      }
      tracks[0].enabled = true;
      streamRef.current = stream;
      setMicPermission("granted");
      return stream;
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermission("denied");
        throw new Error("Microphone ntiyemerewe. Emera microphone kuri browser hanyuma wongere ugerageze.");
      }
      if (err.name === "NotFoundError") {
        throw new Error("Browser ntiyabonye microphone. Reba Audio Input settings za device yawe.");
      }
      if (err.name === "NotReadableError") {
        throw new Error("Microphone iri gukoreshwa n'indi application cyangwa ntiyashoboye gusomwa.");
      }
      throw new Error(err.message || "Microphone ntiyashoboye gufunguka.");
    }
  };

  const startRecording = async () => {
    if (loading || recording || micChecking) return;
    setError("");
    setMicChecking(true);

    try {
      clearRecordedAudio();
      setAudioFile(null);
      stopMicrophone();
      resetRecordingTimer();

      const stream = await getMicrophone();
      let mimeType = "";
      const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];

      for (const type of types) {
        try {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        } catch {}
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        stopRecordingTimer();
        stopMicrophone();
        setRecording(false);
        setError("Habaye ikibazo mu gufata amajwi.");
      };

      recorder.onstop = () => {
        stopRecordingTimer();
        const actualType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: actualType });
        setRecording(false);
        stopMicrophone();
        mediaRecorderRef.current = null;

        if (!blob.size) {
          setError("Nta majwi yafashwe. Ongera ugerageze.");
          audioChunksRef.current = [];
          resetRecordingTimer();
          return;
        }

        let extension = "webm";
        if (actualType.includes("ogg")) extension = "ogg";
        if (actualType.includes("mp4")) extension = "mp4";

        const file = new File([blob], `antimate-voice-${Date.now()}.${extension}`, { type: actualType });
        setAudioFile(file);
        setRecordedPreview(file);
        audioChunksRef.current = [];
      };

      recorder.start(250);
      setRecording(true);
      startRecordingTimer();
    } catch (err) {
      stopRecordingTimer();
      stopMicrophone();
      setRecording(false);
      await checkMicrophonePermission();
      setError(err?.message || "Habaye ikibazo kuri microphone.");
    } finally {
      setMicChecking(false);
    }
  };

  const stopRecording = () => {
    stopRecordingTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopMicrophone();
      setRecording(false);
    }
  };

  const toggleRecordedAudio = async () => {
    const audio = recordedAudioElementRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        await audio.play();
        setIsAudioPlaying(true);
      } else {
        audio.pause();
        setIsAudioPlaying(false);
      }
    } catch {
      setError("Audio ntiyashoboye gukinwa.");
    }
  };

  const cancelVoiceRecording = () => {
    if (loading) return;
    stopRecordingTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    stopMicrophone();
    clearRecordedAudio();
    setAudioFile(null);
    setRecording(false);
    setError("");
    resetRecordingTimer();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("Hitamo file y'amajwi gusa.");
      return;
    }
    setError("");
    clearRecordedAudio();
    setAudioFile(file);
    setRecordedPreview(file);
    event.target.value = "";
  };

  const sendTextMessage = async () => {
    const text = textInput.trim();
    if (!text || loading || recording) return;
    setTextInput("");
    setError("");
    addMessage({ role: "user", text });
    await sendTextToAntimate(text);
  };

  const sendVoiceMessage = async () => {
    if (!audioFile || loading) return;
    const file = audioFile;
    setError("");

    if (recordedAudioElementRef.current) {
      try {
        recordedAudioElementRef.current.pause();
        recordedAudioElementRef.current.currentTime = 0;
      } catch {}
    }
    setIsAudioPlaying(false);
    addMessage({ role: "user", type: "voice", text: "🎤 Ubutumwa bw'amajwi" });
    clearRecordedAudio();
    setAudioFile(null);
    await sendAudioToAntimate(file);
  };

  const sendTextToAntimate = async (text) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/antimate/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text, language: "rw" }),
      });
      await processApiResponse(response);
    } catch (err) {
      addErrorMessage(err.message || "ANTIMATE ntiyabashije gusubiza.");
    } finally {
      setLoading(false);
    }
  };

  const sendAudioToAntimate = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("language", "rw");

      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/antimate/voice`, {
        method: "POST",
        headers,
        body: formData,
      });
      await processApiResponse(response);
    } catch (err) {
      addErrorMessage(err.message || "ANTIMATE ntiyabashije kwakira amajwi.");
    } finally {
      setLoading(false);
    }
  };

  const processApiResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      let message = `ANTIMATE API error (${response.status})`;
      try {
        if (contentType.includes("application/json")) {
          const data = await response.json();
          message = data.message || data.error || message;
        } else {
          const text = await response.text();
          if (text) message = text;
        }
      } catch {}
      throw new Error(message);
    }

    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (data.success === false) {
        throw new Error(data.message || data.error || "ANTIMATE returned an error.");
      }
      const answer =
        data.answer_rw ||
        data.answer_kinyarwanda ||
        data.answer ||
        data.response ||
        data.reply ||
        data.text ||
        data.message ||
        data.kinyarwanda ||
        "";
      const returnedAudio = data.audio_url || data.audio || data.audioUrl || data.voice_url;

      if (answer) addMessage({ role: "assistant", text: answer });
      if (returnedAudio) setResponseAudio(returnedAudio);
      if (!answer && !returnedAudio) {
        addMessage({
          role: "assistant",
          text: "ANTIMATE yakiriye ubutumwa bwawe, ariko nta gisubizo yabashije gutanga.",
        });
      }
      return;
    }

    if (contentType.startsWith("audio/")) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      replaceAudioUrl(url);
      addMessage({ role: "assistant", text: "Ndagusubije mu ijwi 🔊" });
      return;
    }

    const text = await response.text();
    addMessage({ role: "assistant", text: text.trim() || "ANTIMATE ntiyagaruye igisubizo." });
  };

  const addMessage = ({ role, text, type }) => {
    setMessages((previous) => [
      ...previous,
      {
        id: Date.now() + "-" + Math.random(),
        role,
        type,
        text: String(text),
        time: getTime(),
      },
    ]);
  };

  const addErrorMessage = (message) => {
    setError(String(message));
    addMessage({
      role: "assistant",
      type: "error",
      text: "Mbabarira, habaye ikibazo. Ongera ugerageze.",
    });
  };

  const replaceAudioUrl = (url) => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = url;
    setAudioUrl(url);
  };

  const setResponseAudio = (url) => {
    if (typeof url !== "string") return;
    let finalUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("blob:")) {
      finalUrl = `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    replaceAudioUrl(finalUrl);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendTextMessage();
    }
  };

  const clearConversation = () => {
    if (loading || recording) return;
    stopRecordingTimer();
    stopMicrophone();
    clearRecordedAudio();

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setAudioUrl(null);
    setAudioFile(null);
    setError("");

    setMessages([
      {
        id: Date.now() + "-welcome",
        role: "assistant",
        text: "Muraho 👋 Ndi ANTIMATE AI. Nakumva kandi nkagufasha mu Kinyarwanda.",
        time: getTime(),
      },
    ]);

    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  return (
    <div style={styles.page}>
      <div style={styles.chatShell}>
        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logo}>⚡</div>
            <div>
              <div style={styles.title}>ANTIMATE AI</div>
              <div style={styles.status}>
                <span style={styles.onlineDot} />
                <span style={{ color: "#10b981", fontWeight: 600 }}>Active Node</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearConversation}
            disabled={loading || recording}
            style={styles.newChat}
          >
            + New Chat
          </button>
        </header>

        {/* CHAT AREA */}
        <main style={styles.chatArea}>
          <div style={styles.messages}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {loading && (
              <div style={styles.assistantRow}>
                <div style={styles.avatar}>AI</div>
                <div style={styles.typingContainer}>
                  <div style={styles.pulseDot} />
                  <span style={styles.typingText}>ANTIMATE iri gutekereza...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* RESPONSE AUDIO PLAYER */}
        {audioUrl && (
          <div style={styles.responseAudio}>
            <span style={styles.audioLabel}>🔊 ANTIMATE Voice Response</span>
            <audio controls autoPlay src={audioUrl} style={styles.audioPlayer} />
          </div>
        )}

        {/* ERROR DISPLAY */}
        {error && (
          <div style={styles.error}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} style={styles.closeError}>
              ✕
            </button>
          </div>
        )}

        {/* RECORDING STATE */}
        {recording && (
          <div style={styles.recordingBar}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={styles.redPulseDot} />
              <strong>Recording...</strong>
              <span style={{ color: "#94a3b8" }}>Vuga ubutumwa bwabo</span>
            </div>
            <div style={styles.timer}>{recordingSeconds}s</div>
          </div>
        )}

        {/* VOICE PREVIEW */}
        {audioFile && !recording && (
          <div style={styles.voicePreview}>
            <div style={styles.voiceInfo}>
              <span style={styles.voiceIcon}>🎙️</span>
              <div>
                <strong style={{ color: "#f8fafc" }}>Audio Recording Ready</strong>
                <br />
                <small style={{ color: "#64748b" }}>{audioFile.name}</small>
              </div>
            </div>

            <audio
              ref={recordedAudioElementRef}
              src={recordedAudioUrl || undefined}
              onEnded={() => setIsAudioPlaying(false)}
              style={{ display: "none" }}
            />

            <div style={styles.voiceActions}>
              <button
                onClick={toggleRecordedAudio}
                disabled={loading}
                style={styles.secondaryButton}
              >
                {isAudioPlaying ? "Pause" : "Listen"}
              </button>

              <button
                onClick={cancelVoiceRecording}
                disabled={loading}
                style={styles.secondaryButton}
              >
                Discard
              </button>

              <button
                onClick={sendVoiceMessage}
                disabled={loading}
                style={styles.primaryButton}
              >
                {loading ? "Sending..." : "Send Voice"}
              </button>
            </div>
          </div>
        )}

        {/* INPUT CONTAINER */}
        <footer style={styles.footer}>
          <div style={styles.inputBox}>
            <label
              style={{
                ...styles.iconButton,
                ...(recording || loading ? styles.disabled : {}),
              }}
              title="Attach Audio File"
            >
              📎
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={recording || loading}
                style={styles.hiddenInput}
              />
            </label>

            <textarea
              ref={textInputRef}
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || recording}
              rows={1}
              placeholder={recording ? "Listening..." : "Baza ANTIMATE ikintu cyose..."}
              style={styles.textarea}
            />

            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={loading || micChecking}
              style={{
                ...styles.iconButton,
                ...(recording ? styles.recordingButton : {}),
              }}
              title={recording ? "Stop Recording" : "Record Voice"}
            >
              {micChecking ? "..." : recording ? "⏹" : "🎙️"}
            </button>

            <button
              type="button"
              onClick={sendTextMessage}
              disabled={loading || recording || !textInput.trim()}
              style={{
                ...styles.sendButton,
                ...(!textInput.trim() || loading || recording ? styles.sendDisabled : {}),
              }}
            >
              ➔
            </button>
          </div>

          <div style={styles.footerHint}>
            <span>⚡ ANTIMATE Engine v1.0 • Kinyarwanda AI</span>
            <span>{micPermission === "granted" ? "Microphone Active" : "Press Enter to send"}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const isError = message.type === "error";

  return (
    <div
      style={{
        ...styles.messageRow,
        ...(isUser ? styles.userRow : styles.assistantRow),
      }}
    >
      {!isUser && <div style={styles.avatar}>AI</div>}

      <div style={{ ...styles.messageContent, ...(isUser ? styles.userContent : {}) }}>
        <div
          style={{
            ...styles.bubble,
            ...(isUser ? styles.userBubble : styles.assistantBubble),
            ...(isError ? styles.errorBubble : {}),
          }}
        >
          {message.type === "voice" && <span style={styles.voiceMessage}>🎤 </span>}
          {message.text}
        </div>
        <span style={styles.messageTime}>{message.time}</span>
      </div>

      {isUser && <div style={styles.userAvatar}>YOU</div>}
    </div>
  );
}

// MODERN DARK THEME STYLES (PURE INLINE OBJECT)
const styles = {
  page: {
    minHeight: "100vh",
    background: "#090d16",
    color: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    boxSizing: "border-box",
  },

  chatShell: {
    width: "100%",
    maxWidth: "920px",
    height: "calc(100vh - 32px)",
    minHeight: "600px",
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
  },

  header: {
    height: "72px",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1f2937",
    background: "#111827",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
  },

  title: {
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    color: "#f8fafc",
  },

  status: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "2px",
    fontSize: "11px",
  },

  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },

  newChat: {
    border: "1px solid #374151",
    background: "#1f2937",
    color: "#e5e7eb",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    background: "#0b0f19",
  },

  messages: {
    maxWidth: "800px",
    margin: "0 auto",
  },

  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    marginBottom: "20px",
  },

  assistantRow: {
    justifyContent: "flex-start",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "#1e293b",
    color: "#38bdf8",
    border: "1px solid #334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
    flexShrink: 0,
  },

  userAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 800,
    flexShrink: 0,
  },

  messageContent: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "75%",
  },

  userContent: {
    alignItems: "flex-end",
  },

  bubble: {
    padding: "14px 18px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: "1.6",
    wordBreak: "break-word",
  },

  assistantBubble: {
    background: "#1e293b",
    color: "#f1f5f9",
    border: "1px solid #334155",
    borderBottomLeftRadius: "4px",
  },

  userBubble: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    borderBottomRightRadius: "4px",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.2)",
  },

  errorBubble: {
    background: "#450a0a",
    color: "#fca5a5",
    border: "1px solid #7f1d1d",
  },

  messageTime: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "6px",
    padding: "0 4px",
  },

  voiceMessage: {
    marginRight: "6px",
  },

  typingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#1e293b",
    padding: "12px 18px",
    borderRadius: "16px",
    border: "1px solid #334155",
  },

  pulseDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#38bdf8",
  },

  typingText: {
    fontSize: "13px",
    color: "#94a3b8",
  },

  responseAudio: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 24px",
    background: "#161e2e",
    borderTop: "1px solid #1f2937",
  },

  audioLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#38bdf8",
  },

  audioPlayer: {
    height: "36px",
    flex: 1,
  },

  error: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    background: "#450a0a",
    color: "#f87171",
    fontSize: "13px",
    borderTop: "1px solid #7f1d1d",
  },

  closeError: {
    background: "transparent",
    border: "none",
    color: "#f87171",
    fontSize: "16px",
    cursor: "pointer",
  },

  recordingBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    background: "#2a0808",
    color: "#ef4444",
    fontSize: "13px",
    borderTop: "1px solid #7f1d1d",
  },

  redPulseDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#ef4444",
  },

  timer: {
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    background: "#450a0a",
    padding: "2px 8px",
    borderRadius: "6px",
  },

  voicePreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
    background: "#161e2e",
    borderTop: "1px solid #1f2937",
  },

  voiceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "13px",
  },

  voiceIcon: {
    fontSize: "20px",
  },

  voiceActions: {
    display: "flex",
    gap: "10px",
  },

  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  secondaryButton: {
    background: "#1f2937",
    color: "#cbd5e1",
    border: "1px solid #374151",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
  },

  footer: {
    padding: "20px 24px",
    background: "#111827",
    borderTop: "1px solid #1f2937",
  },

  inputBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "16px",
    padding: "8px 14px",
  },

  textarea: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    resize: "none",
    fontSize: "14px",
    color: "#f8fafc",
    fontFamily: "inherit",
    maxHeight: "100px",
    lineHeight: "1.5",
  },

  iconButton: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px",
  },

  recordingButton: {
    background: "#ef4444",
    color: "#ffffff",
  },

  sendButton: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
  },

  sendDisabled: {
    background: "#374151",
    color: "#64748b",
    cursor: "not-allowed",
  },

  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  hiddenInput: {
    display: "none",
  },

  footerHint: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
    fontSize: "11px",
    color: "#64748b",
    padding: "0 4px",
  },
};