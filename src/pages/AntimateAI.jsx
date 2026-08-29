import { useEffect, useRef, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const MAX_RECORDING_SECONDS = 30;

export default function AntimateAI() {
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] =
    useState(null);

  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [micChecking, setMicChecking] = useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(MAX_RECORDING_SECONDS);

  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const [micPermission, setMicPermission] =
    useState("unknown");

  const [isAudioPlaying, setIsAudioPlaying] =
    useState(false);

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

  // =====================================================
  // INITIAL MESSAGE
  // =====================================================

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text:
          "Muraho 👋 Ndi ANTIMATE AI. Nakumva kandi nkagufasha mu Kinyarwanda.",
        time: getTime(),
      },
    ]);
  }, []);

  // =====================================================
  // MICROPHONE PERMISSION
  // =====================================================

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.permissions?.query) {
        setMicPermission("unknown");
        return;
      }

      const permission =
        await navigator.permissions.query({
          name: "microphone",
        });

      setMicPermission(permission.state);

      permission.onchange = () => {
        setMicPermission(permission.state);
      };
    } catch {
      setMicPermission("unknown");
    }
  };

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      stopRecordingTimer();
      stopMicrophone();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      if (recordedAudioUrlRef.current) {
        URL.revokeObjectURL(
          recordedAudioUrlRef.current
        );
      }
    };
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const stopMicrophone = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
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
      URL.revokeObjectURL(
        recordedAudioUrlRef.current
      );

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

  // =====================================================
  // RECORDING TIMER
  // =====================================================

  const startRecordingTimer = () => {
    stopRecordingTimer();

    recordingStartTimeRef.current = Date.now();

    setRecordingSeconds(MAX_RECORDING_SECONDS);

    recordingTimerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() -
          recordingStartTimeRef.current) /
          1000
      );

      const remaining = Math.max(
        0,
        MAX_RECORDING_SECONDS - elapsed
      );

      setRecordingSeconds(remaining);

      if (remaining <= 0) {
        stopRecordingTimer();

        const recorder = mediaRecorderRef.current;

        if (
          recorder &&
          recorder.state !== "inactive"
        ) {
          recorder.stop();
        }
      }
    }, 250);
  };

  // =====================================================
  // MICROPHONE SUPPORT
  // =====================================================

  const ensureMicrophoneSupport = () => {
    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      throw new Error(
        "Browser yawe ntabwo ishyigikira microphone."
      );
    }

    if (window.isSecureContext === false) {
      throw new Error(
        "Microphone isaba HTTPS."
      );
    }

    if (typeof MediaRecorder === "undefined") {
      throw new Error(
        "Browser yawe ntabwo ishyigikira audio recording."
      );
    }
  };

  const getMicrophone = async () => {
    ensureMicrophoneSupport();

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

      const tracks = stream.getAudioTracks();

      if (!tracks.length) {
        stream.getTracks().forEach((track) =>
          track.stop()
        );

        throw new Error(
          "Browser ntiyabonye audio input."
        );
      }

      tracks[0].enabled = true;

      streamRef.current = stream;

      setMicPermission("granted");

      return stream;
    } catch (err) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setMicPermission("denied");

        throw new Error(
          "Microphone ntiyemerewe. Emera microphone kuri browser hanyuma wongere ugerageze."
        );
      }

      if (err.name === "NotFoundError") {
        throw new Error(
          "Browser ntiyabonye microphone. Reba Audio Input settings za device yawe."
        );
      }

      if (err.name === "NotReadableError") {
        throw new Error(
          "Microphone iri gukoreshwa n'indi application cyangwa ntiyashoboye gusomwa."
        );
      }

      throw new Error(
        err.message ||
          "Microphone ntiyashoboye gufunguka."
      );
    }
  };

  // =====================================================
  // START RECORDING
  // =====================================================

  const startRecording = async () => {
    if (loading || recording || micChecking) {
      return;
    }

    setError("");
    setMicChecking(true);

    try {
      clearRecordedAudio();
      setAudioFile(null);

      stopMicrophone();
      resetRecordingTimer();

      const stream = await getMicrophone();

      let mimeType = "";

      const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      for (const type of types) {
        try {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        } catch {}
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onerror = () => {
        stopRecordingTimer();
        stopMicrophone();

        setRecording(false);

        setError(
          "Habaye ikibazo mu gufata amajwi."
        );
      };

      recorder.onstop = () => {
        stopRecordingTimer();

        const actualType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        const blob = new Blob(
          audioChunksRef.current,
          {
            type: actualType,
          }
        );

        setRecording(false);
        stopMicrophone();

        mediaRecorderRef.current = null;

        if (!blob.size) {
          setError(
            "Nta majwi yafashwe. Ongera ugerageze."
          );

          audioChunksRef.current = [];

          resetRecordingTimer();

          return;
        }

        let extension = "webm";

        if (actualType.includes("ogg")) {
          extension = "ogg";
        }

        if (actualType.includes("mp4")) {
          extension = "mp4";
        }

        const file = new File(
          [blob],
          `antimate-voice-${Date.now()}.${extension}`,
          {
            type: actualType,
          }
        );

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

      setError(
        err?.message ||
          "Habaye ikibazo kuri microphone."
      );
    } finally {
      setMicChecking(false);
    }
  };

  // =====================================================
  // STOP RECORDING
  // =====================================================

  const stopRecording = () => {
    stopRecordingTimer();

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    } else {
      stopMicrophone();
      setRecording(false);
    }
  };

  // =====================================================
  // AUDIO PREVIEW
  // =====================================================

  const toggleRecordedAudio = async () => {
    const audio =
      recordedAudioElementRef.current;

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
      setError(
        "Audio ntiyashoboye gukinwa."
      );
    }
  };

  // =====================================================
  // CANCEL VOICE
  // =====================================================

  const cancelVoiceRecording = () => {
    if (loading) return;

    stopRecordingTimer();

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
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

  // =====================================================
  // FILE SELECT
  // =====================================================

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError(
        "Hitamo file y'amajwi gusa."
      );

      return;
    }

    setError("");

    clearRecordedAudio();

    setAudioFile(file);
    setRecordedPreview(file);

    event.target.value = "";
  };

  // =====================================================
  // TEXT MESSAGE
  // =====================================================

  const sendTextMessage = async () => {
    const text = textInput.trim();

    if (!text || loading || recording) {
      return;
    }

    setTextInput("");
    setError("");

    addMessage({
      role: "user",
      text,
    });

    await sendTextToAntimate(text);
  };

  // =====================================================
  // VOICE MESSAGE
  // =====================================================

  const sendVoiceMessage = async () => {
    if (!audioFile || loading) {
      return;
    }

    const file = audioFile;

    setError("");

    if (recordedAudioElementRef.current) {
      try {
        recordedAudioElementRef.current.pause();
        recordedAudioElementRef.current.currentTime = 0;
      } catch {}
    }

    setIsAudioPlaying(false);

    addMessage({
      role: "user",
      type: "voice",
      text: "🎤 Ubutumwa bw'amajwi",
    });

    clearRecordedAudio();
    setAudioFile(null);

    await sendAudioToAntimate(file);
  };

  // =====================================================
  // TEXT API
  // =====================================================

  const sendTextToAntimate = async (text) => {
    setLoading(true);

    try {
      const token =
        localStorage.getItem("token");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE}/api/antimate/chat`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: text,
            language: "rw",
          }),
        }
      );

      await processApiResponse(response);
    } catch (err) {
      addErrorMessage(
        err.message ||
          "ANTIMATE ntiyabashije gusubiza."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // AUDIO API
  // =====================================================

  const sendAudioToAntimate = async (file) => {
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("audio", file);
      formData.append("language", "rw");

      const token =
        localStorage.getItem("token");

      const headers = {};

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE}/api/antimate/voice`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      await processApiResponse(response);
    } catch (err) {
      addErrorMessage(
        err.message ||
          "ANTIMATE ntiyabashije kwakira amajwi."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // API RESPONSE
  // =====================================================

  const processApiResponse = async (
    response
  ) => {
    const contentType =
      response.headers.get("content-type") ||
      "";

    if (!response.ok) {
      let message =
        `ANTIMATE API error (${response.status})`;

      try {
        if (
          contentType.includes(
            "application/json"
          )
        ) {
          const data =
            await response.json();

          message =
            data.message ||
            data.error ||
            message;
        } else {
          const text =
            await response.text();

          if (text) {
            message = text;
          }
        }
      } catch {}

      throw new Error(message);
    }

    // JSON RESPONSE
    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const data =
        await response.json();

      if (data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            "ANTIMATE returned an error."
        );
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

      const returnedAudio =
        data.audio_url ||
        data.audio ||
        data.audioUrl ||
        data.voice_url;

      if (answer) {
        addMessage({
          role: "assistant",
          text: answer,
        });
      }

      if (returnedAudio) {
        setResponseAudio(returnedAudio);
      }

      if (!answer && !returnedAudio) {
        addMessage({
          role: "assistant",
          text:
            "ANTIMATE yakiriye ubutumwa bwawe, ariko nta gisubizo yabashije gutanga.",
        });
      }

      return;
    }

    // DIRECT AUDIO
    if (contentType.startsWith("audio/")) {
      const blob = await response.blob();

      const url =
        URL.createObjectURL(blob);

      replaceAudioUrl(url);

      addMessage({
        role: "assistant",
        text: "Ndagusubije mu ijwi 🔊",
      });

      return;
    }

    // TEXT
    const text = await response.text();

    addMessage({
      role: "assistant",
      text:
        text.trim() ||
        "ANTIMATE ntiyagaruye igisubizo.",
    });
  };

  // =====================================================
  // MESSAGES
  // =====================================================

  const addMessage = ({
    role,
    text,
    type,
  }) => {
    setMessages((previous) => [
      ...previous,
      {
        id:
          Date.now() +
          "-" +
          Math.random(),
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
      text:
        "Mbabarira, habaye ikibazo. Ongera ugerageze.",
    });
  };

  // =====================================================
  // RESPONSE AUDIO
  // =====================================================

  const replaceAudioUrl = (url) => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(
        audioUrlRef.current
      );
    }

    audioUrlRef.current = url;
    setAudioUrl(url);
  };

  const setResponseAudio = (url) => {
    if (typeof url !== "string") {
      return;
    }

    let finalUrl = url;

    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("blob:")
    ) {
      finalUrl =
        `${API_BASE}${
          url.startsWith("/")
            ? ""
            : "/"
        }${url}`;
    }

    replaceAudioUrl(finalUrl);
  };

  // =====================================================
  // KEYBOARD
  // =====================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendTextMessage();
    }
  };

  // =====================================================
  // NEW CHAT
  // =====================================================

  const clearConversation = () => {
    if (loading || recording) return;

    stopRecordingTimer();
    stopMicrophone();

    clearRecordedAudio();

    if (audioUrlRef.current) {
      URL.revokeObjectURL(
        audioUrlRef.current
      );

      audioUrlRef.current = null;
    }

    setAudioUrl(null);
    setAudioFile(null);
    setError("");

    setMessages([
      {
        id:
          Date.now() +
          "-welcome",
        role: "assistant",
        text:
          "Muraho 👋 Ndi ANTIMATE AI. Nakumva kandi nkagufasha mu Kinyarwanda.",
        time: getTime(),
      },
    ]);

    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.chatShell}>

        {/* HEADER */}

        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logo}>
              AI
            </div>

            <div>
              <div style={styles.title}>
                ANTIMATE AI
              </div>

              <div style={styles.status}>
                <span style={styles.onlineDot} />
                Online
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearConversation}
            disabled={
              loading || recording
            }
            style={styles.newChat}
          >
            + New chat
          </button>
        </header>

        {/* CHAT */}

        <main style={styles.chatArea}>
          <div style={styles.messages}>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
              />
            ))}

            {loading && (
              <div style={styles.assistantRow}>
                <div style={styles.avatar}>
                  AI
                </div>

                <div style={styles.typing}>
                  <span style={styles.dot} />
                  <span style={styles.dot} />
                  <span style={styles.dot} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* RESPONSE AUDIO */}

        {audioUrl && (
          <div style={styles.responseAudio}>
            <span style={styles.audioLabel}>
              🔊 ANTIMATE
            </span>

            <audio
              controls
              autoPlay
              src={audioUrl}
              style={styles.audioPlayer}
            />
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              style={styles.closeError}
            >
              ×
            </button>
          </div>
        )}

        {/* RECORDING */}

        {recording && (
          <div style={styles.recordingBar}>
            <div>
              <strong>
                ● Recording
              </strong>

              <span style={{ marginLeft: "8px" }}>
                Vuga ubu...
              </span>
            </div>

            <div style={styles.timer}>
              {recordingSeconds}s
            </div>
          </div>
        )}

        {/* VOICE PREVIEW */}

        {audioFile && !recording && (
          <div style={styles.voicePreview}>
            <div style={styles.voiceInfo}>
              <span style={styles.voiceIcon}>
                🎤
              </span>

              <div>
                <strong>
                  Audio ready
                </strong>
                <br />
                <small style={{ color: "#6b7280" }}>
                  {audioFile.name}
                </small>
              </div>
            </div>

            <audio
              ref={
                recordedAudioElementRef
              }
              src={
                recordedAudioUrl ||
                undefined
              }
              onEnded={() =>
                setIsAudioPlaying(false)
              }
              style={{
                display: "none",
              }}
            />

            <div style={styles.voiceActions}>
              <button
                onClick={
                  toggleRecordedAudio
                }
                disabled={loading}
                style={styles.secondaryButton}
              >
                {isAudioPlaying
                  ? "Pause"
                  : "Listen"}
              </button>

              <button
                onClick={
                  cancelVoiceRecording
                }
                disabled={loading}
                style={styles.secondaryButton}
              >
                Cancel
              </button>

              <button
                onClick={
                  sendVoiceMessage
                }
                disabled={loading}
                style={styles.primaryButton}
              >
                {loading
                  ? "Sending..."
                  : "Send"}
              </button>
            </div>
          </div>
        )}

        {/* INPUT */}

        <footer style={styles.footer}>
          <div style={styles.inputBox}>

            {/* ATTACH */}

            <label
              style={{
                ...styles.iconButton,
                ...(recording || loading
                  ? styles.disabled
                  : {}),
              }}
              title="Attach audio"
            >
              +

              <input
                type="file"
                accept="audio/*"
                onChange={
                  handleFileChange
                }
                disabled={
                  recording || loading
                }
                style={
                  styles.hiddenInput
                }
              />
            </label>

            {/* TEXT */}

            <textarea
              ref={textInputRef}
              value={textInput}
              onChange={(event) =>
                setTextInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={
                loading || recording
              }
              rows={1}
              placeholder={
                recording
                  ? "Recording..."
                  : "Andika ubutumwa..."
              }
              style={styles.textarea}
            />

            {/* MIC */}

            <button
              type="button"
              onClick={
                recording
                  ? stopRecording
                  : startRecording
              }
              disabled={
                loading ||
                micChecking
              }
              style={{
                ...styles.iconButton,
                ...(recording
                  ? styles.recordingButton
                  : {}),
              }}
              title={
                recording
                  ? "Stop recording"
                  : "Voice message"
              }
            >
              {micChecking
                ? "..."
                : recording
                ? "■"
                : "🎤"}
            </button>

            {/* SEND */}

            <button
              type="button"
              onClick={
                sendTextMessage
              }
              disabled={
                loading ||
                recording ||
                !textInput.trim()
              }
              style={{
                ...styles.sendButton,
                ...(!textInput.trim() ||
                loading ||
                recording
                  ? styles.sendDisabled
                  : {}),
              }}
            >
              ↑
            </button>
          </div>

          <div style={styles.footerHint}>
            <span>
              Kinyarwanda • Voice & Text
            </span>

            <span>
              {micPermission ===
              "granted"
                ? "Microphone ready"
                : "Enter to send"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// =======================================================
// CHAT MESSAGE
// =======================================================

function ChatMessage({ message }) {
  const isUser =
    message.role === "user";

  const isError =
    message.type === "error";

  return (
    <div
      style={{
        ...styles.messageRow,
        ...(isUser
          ? styles.userRow
          : styles.assistantRow),
      }}
    >
      {!isUser && (
        <div style={styles.avatar}>
          AI
        </div>
      )}

      <div
        style={{
          ...styles.messageContent,
          ...(isUser
            ? styles.userContent
            : {}),
        }}
      >
        <div
          style={{
            ...styles.bubble,
            ...(isUser
              ? styles.userBubble
              : styles.assistantBubble),
            ...(isError
              ? styles.errorBubble
              : {}),
          }}
        >
          {message.type ===
            "voice" && (
            <span style={styles.voiceMessage}>
              🎤{" "}
            </span>
          )}

          {message.text}
        </div>

        <span style={styles.messageTime}>
          {message.time}
        </span>
      </div>

      {isUser && (
        <div style={styles.userAvatar}>
          U
        </div>
      )}
    </div>
  );
}

// =======================================================
// INLINE STYLES (NO EXTERNAL .CSS NEEDED)
// =======================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    boxSizing: "border-box",
  },

  chatShell: {
    width: "100%",
    maxWidth: "980px",
    height: "calc(100vh - 32px)",
    minHeight: "600px",
    background: "#ffffff",
    border: "1px solid #e7ebf2",
    borderRadius: "18px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(15,23,42,0.08)",
  },

  header: {
    height: "68px",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #edf0f5",
    background: "#ffffff",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logo: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },

  title: {
    fontSize: "14px",
    fontWeight: 800,
    letterSpacing: "0.2px",
  },

  status: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "2px",
    color: "#7b8798",
    fontSize: "10px",
  },

  onlineDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#16a34a",
  },

  newChat: {
    border: "1px solid #e2e7ef",
    background: "#ffffff",
    color: "#4b5563",
    borderRadius: "8px",
    padding: "8px 11px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "30px 22px",
    background: "#fbfcfe",
  },

  messages: {
    maxWidth: "760px",
    margin: "0 auto",
  },

  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    marginBottom: "18px",
  },

  assistantRow: {
    justifyContent: "flex-start",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#1e293b",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 700,
    flexShrink: 0,
  },

  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 700,
    flexShrink: 0,
  },

  messageContent: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "70%",
  },

  userContent: {
    alignItems: "flex-end",
  },

  bubble: {
    padding: "12px 16px",
    borderRadius: "14px",
    fontSize: "13.5px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },

  assistantBubble: {
    background: "#ffffff",
    color: "#1e293b",
    border: "1px solid #e2e8f0",
    borderBottomLeftRadius: "2px",
  },

  userBubble: {
    background: "#2563eb",
    color: "#ffffff",
    borderBottomRightRadius: "2px",
  },

  errorBubble: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },

  messageTime: {
    fontSize: "10px",
    color: "#94a3b8",
    marginTop: "4px",
    padding: "0 2px",
  },

  voiceMessage: {
    marginRight: "4px",
  },

  typing: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "#ffffff",
    padding: "12px 16px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
  },

  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#94a3b8",
  },

  responseAudio: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 20px",
    background: "#f1f5f9",
    borderTop: "1px solid #e2e8f0",
  },

  audioLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#475569",
  },

  audioPlayer: {
    height: "32px",
    flex: 1,
  },

  error: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "12px",
    borderTop: "1px solid #fecaca",
  },

  closeError: {
    background: "transparent",
    border: "none",
    color: "#b91c1c",
    fontSize: "16px",
    cursor: "pointer",
  },

  recordingBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "12px",
    borderTop: "1px solid #fee2e2",
  },

  timer: {
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },

  voicePreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },

  voiceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "12px",
  },

  voiceIcon: {
    fontSize: "18px",
  },

  voiceActions: {
    display: "flex",
    gap: "8px",
  },

  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  secondaryButton: {
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
  },

  footer: {
    padding: "16px 20px",
    background: "#ffffff",
    borderTop: "1px solid #edf0f5",
  },

  inputBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "6px 10px",
  },

  textarea: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    resize: "none",
    fontSize: "13.5px",
    color: "#0f172a",
    fontFamily: "inherit",
    maxHeight: "100px",
    lineHeight: "1.4",
  },

  iconButton: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#64748b",
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
    width: "34px",
    height: "34px",
    borderRadius: "8px",
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
    background: "#e2e8f0",
    color: "#94a3b8",
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
    marginTop: "8px",
    fontSize: "10.5px",
    color: "#94a3b8",
    padding: "0 4px",
  },
};