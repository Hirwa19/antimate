import { useEffect, useRef, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const MAX_RECORDING_SECONDS = 30;

function AntimateAI() {
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
                  <span />
                  <span />
                  <span />
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

              <span>
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

                <small>
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
            <div style={styles.voiceMessage}>
              🎤
            </div>
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
// STYLES
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
    boxShadow:
      "0 12px 40px rgba(15,23,42,0.08)",
  },

  // =====================================================
  // HEADER
  // =====================================================

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

  // =====================================================
  // CHAT
  // =====================================================

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
    width: "30px",
    height: "30px",
    flexShrink: 0,
    borderRadius: "9px",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: 800,
  },

  userAvatar: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    borderRadius: "9px",
    background: "#eef2f7",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: 700,
  },

  messageContent: {
    maxWidth: "72%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },

  userContent: {
    alignItems: "flex-end",
  },

  bubble: {
    padding: "11px 14px",
    borderRadius: "14px",
    fontSize: "13px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  assistantBubble: {
    background: "#ffffff",
    border: "1px solid #e7ebf2",
    color: "#263246",
    borderBottomLeftRadius: "4px",
  },

  userBubble: {
    background: "#111827",
    color: "#ffffff",
    borderBottomRightRadius: "4px",
  },

  errorBubble: {
    background: "#fff5f5",
    border: "1px solid #fecaca",
    color: "#b91c1c",
  },

  voiceMessage: {
    marginBottom: "4px",
    fontSize: "14px",
  },

  messageTime: {
    marginTop: "4px",
    padding: "0 3px",
    color: "#9aa5b5",
    fontSize: "9px",
  },

  // =====================================================
  // TYPING
  // =====================================================

  typing: {
    display: "flex",
    gap: "4px",
    padding: "13px 14px",
    borderRadius: "13px",
    borderBottomLeftRadius: "4px",
    background: "#ffffff",
    border: "1px solid #e7ebf2",
  },

  // =====================================================
  // RESPONSE AUDIO
  // =====================================================

  responseAudio: {
    minHeight: "54px",
    padding: "8px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    borderTop: "1px solid #edf0f5",
    background: "#ffffff",
  },

  audioLabel: {
    color: "#667085",
    fontSize: "10px",
    fontWeight: 700,
  },

  audioPlayer: {
    height: "34px",
    maxWidth: "400px",
    width: "100%",
  },

  // =====================================================
  // ERROR
  // =====================================================

  error: {
    margin: "0 20px 8px",
    padding: "9px 12px",
    borderRadius: "8px",
    background: "#fff5f5",
    border: "1px solid #fee2e2",
    color: "#b91c1c",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
  },

  closeError: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#b91c1c",
    cursor: "pointer",
    fontSize: "16px",
  },

  // =====================================================
  // RECORDING
  // =====================================================

  recordingBar: {
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid #fee2e2",
    background: "#fffafa",
    color: "#b91c1c",
    fontSize: "11px",
  },

  recordingBar div: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  timer: {
    fontVariantNumeric: "tabular-nums",
    fontWeight: 800,
    fontSize: "14px",
  },

  // =====================================================
  // VOICE PREVIEW
  // =====================================================

  voicePreview: {
    padding: "10px 20px",
    borderTop: "1px solid #e6edf8",
    background: "#f8faff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  voiceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
  },

  voiceIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background: "#eef4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  voiceInfo strong: {
    display: "block",
    fontSize: "11px",
    color: "#344054",
  },

  voiceInfo small: {
    display: "block",
    maxWidth: "300px",
    marginTop: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#98a2b3",
    fontSize: "9px",
  },

  voiceActions: {
    display: "flex",
    gap: "6px",
  },

  secondaryButton: {
    border: "1px solid #dce2ea",
    background: "#ffffff",
    color: "#475467",
    borderRadius: "7px",
    padding: "7px 10px",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
  },

  primaryButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "7px",
    padding: "7px 12px",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  // =====================================================
  // FOOTER
  // =====================================================

  footer: {
    padding: "12px 20px 10px",
    borderTop: "1px solid #edf0f5",
    background: "#ffffff",
  },

  inputBox: {
    maxWidth: "760px",
    minHeight: "48px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 6px",
    border: "1px solid #dfe4eb",
    borderRadius: "12px",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  iconButton: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    border: "none",
    borderRadius: "8px",
    background: "#f4f6f8",
    color: "#667085",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "15px",
  },

  recordingButton: {
    background: "#fef2f2",
    color: "#dc2626",
  },

  disabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },

  hiddenInput: {
    display: "none",
  },

  textarea: {
    flex: 1,
    minWidth: 0,
    resize: "none",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#172033",
    fontFamily: "inherit",
    fontSize: "13px",
    lineHeight: 1.5,
    padding: "7px 3px",
    maxHeight: "100px",
  },

  sendButton: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    border: "none",
    borderRadius: "9px",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 700,
  },

  sendDisabled: {
    opacity: 0.3,
    cursor: "not-allowed",
  },

  footerHint: {
    maxWidth: "760px",
    margin: "6px auto 0",
    display: "flex",
    justifyContent: "space-between",
    color: "#98a2b3",
    fontSize: "9px",
  },
};

export default AntimateAI;