import React, { useRef, useState } from "react";
import "./AntimateAI.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

const ANTIMATE_AI_URL =
  import.meta.env.VITE_ANTIMATE_AI_URL ||
  "https://YOUR-ANTIMATE-SPACE.hf.space";

export default function AntimateAI() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingText, setLoadingText] = useState(false);

  const [recording, setRecording] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ============================================================
  // ADD MESSAGE
  // ============================================================

  const addMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        content,
      },
    ]);
  };

  // ============================================================
  // TEXT CHAT
  // ============================================================

  const sendText = async () => {
    const message = text.trim();

    if (!message || loadingText) return;

    addMessage("user", message);
    setText("");
    setLoadingText(true);

    try {
      const response = await fetch(
        `${ANTIMATE_AI_URL}/gradio_api/call/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: [message],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `ANTIMATE AI returned HTTP ${response.status}`
        );
      }

      const result = await response.json();

      // ----------------------------------------------------------
      // Gradio 5 API can return an event_id.
      // ----------------------------------------------------------

      let answer = null;

      if (result?.data) {
        answer = extractTextAnswer(result.data);
      }

      if (!answer && result?.event_id) {
        answer = await waitForGradioResult(result.event_id);
      }

      if (!answer) {
        throw new Error("ANTIMATE ntiyagaruye answer.");
      }

      addMessage("assistant", answer);
    } catch (error) {
      console.error("ANTIMATE TEXT ERROR:", error);

      addMessage(
        "assistant",
        "Mbabarira, ANTIMATE ntiyashoboye gusubiza ubu. Ongera ugerageze."
      );
    } finally {
      setLoadingText(false);
    }
  };

  // ============================================================
  // GRADIO RESULT
  // ============================================================

  const waitForGradioResult = async (eventId) => {
    const url = `${ANTIMATE_AI_URL}/gradio_api/call/chat/${eventId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Gradio result error: HTTP ${response.status}`
      );
    }

    const reader = response.body?.getReader();

    if (!reader) {
      const json = await response.json();
      return extractTextAnswer(json?.data || json);
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let finalAnswer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        const clean = line.trim();

        if (!clean) continue;

        let payload = clean;

        if (payload.startsWith("data:")) {
          payload = payload.substring(5).trim();
        }

        try {
          const parsed = JSON.parse(payload);

          const extracted = extractTextAnswer(
            parsed?.data || parsed
          );

          if (extracted) {
            finalAnswer = extracted;
          }
        } catch {
          // Ignore non-JSON streaming lines.
        }
      }
    }

    return finalAnswer;
  };

  // ============================================================
  // EXTRACT TEXT
  // ============================================================

  const extractTextAnswer = (data) => {
    if (!data) return "";

    if (typeof data === "string") {
      return data.trim();
    }

    if (Array.isArray(data)) {
      for (const item of data) {
        const result = extractTextAnswer(item);

        if (result) return result;
      }

      return "";
    }

    if (typeof data === "object") {
      const possibleKeys = [
        "answer_kinyarwanda",
        "answer",
        "response",
        "text",
        "output",
        "value",
      ];

      for (const key of possibleKeys) {
        if (
          typeof data[key] === "string" &&
          data[key].trim()
        ) {
          return data[key].trim();
        }
      }
    }

    return "";
  };

  // ============================================================
  // ENTER KEY
  // ============================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendText();
    }
  };

  // ============================================================
  // START RECORDING
  // ============================================================

  const startRecording = async () => {
    if (recording || loadingVoice) return;

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      audioChunksRef.current = [];

      let mimeType = "";

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        mimeType = "audio/webm;codecs=opus";
      } else if (
        MediaRecorder.isTypeSupported("audio/webm")
      ) {
        mimeType = "audio/webm";
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
        stream.getTracks().forEach((track) => {
          track.stop();
        });

        const blob = new Blob(
          audioChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        await sendVoice(blob);
      };

      recorder.start();

      setRecording(true);
    } catch (error) {
      console.error("MICROPHONE ERROR:", error);

      alert(
        "Microphone ntabwo yabonetse. Reba ko browser yemeye microphone permission."
      );

      setRecording(false);
    }
  };

  // ============================================================
  // STOP RECORDING
  // ============================================================

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) return;

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    setRecording(false);
  };

  // ============================================================
  // VOICE API
  // ============================================================

  const sendVoice = async (blob) => {
    if (!blob || blob.size === 0) {
      return;
    }

    setLoadingVoice(true);

    const userVoiceId =
      `${Date.now()}-voice`;

    addMessage(
      "user",
      "🎤 Ubutumwa bw'ijwi"
    );

    try {
      const formData = new FormData();

      /*
       * Backend / AntimateRoutes will handle:
       *
       * webm / opus
       *       ↓
       * ffmpeg
       *       ↓
       * WAV 16kHz mono
       *       ↓
       * ANTIMATE AI
       */

      formData.append(
        "audio",
        blob,
        "antimate_voice.webm"
      );

      const response = await fetch(
        `${API_BASE_URL}/api/antimate/voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        let errorMessage =
          `Voice request failed: HTTP ${response.status}`;

        try {
          const errorJson =
            await response.json();

          if (errorJson?.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // Ignore JSON parsing error.
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      console.log(
        "ANTIMATE VOICE RESPONSE:",
        result
      );

      const transcript =
        result?.transcription ||
        result?.text ||
        result?.input_kinyarwanda ||
        "";

      const answer =
        result?.answer_kinyarwanda ||
        result?.answer ||
        result?.response ||
        result?.output ||
        "";

      if (transcript) {
        setMessages((prev) => {
          const updated = [...prev];

          const index =
            updated.findIndex(
              (item) =>
                item.id === userVoiceId
            );

          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              content: `🎤 ${transcript}`,
            };
          }

          return updated;
        });
      }

      if (answer) {
        addMessage(
          "assistant",
          answer
        );
      } else {
        addMessage(
          "assistant",
          "ANTIMATE yakiriye ijwi ariko ntiyagaruye igisubizo."
        );
      }

      // ----------------------------------------------------------
      // Audio response
      // ----------------------------------------------------------

      if (result?.audio_url) {
        setAudioUrl(
          normalizeAudioUrl(
            result.audio_url
          )
        );
      } else if (result?.audio) {
        setAudioUrl(
          normalizeAudioUrl(
            result.audio
          )
        );
      }
    } catch (error) {
      console.error(
        "ANTIMATE VOICE ERROR:",
        error
      );

      addMessage(
        "assistant",
        "Mbabarira, ANTIMATE ntiyashoboye gutunganya ijwi ubu."
      );
    } finally {
      setLoadingVoice(false);
    }
  };

  // ============================================================
  // AUDIO URL
  // ============================================================

  const normalizeAudioUrl = (url) => {
    if (!url) return null;

    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:")
    ) {
      return url;
    }

    if (url.startsWith("/")) {
      return `${API_BASE_URL}${url}`;
    }

    return `${API_BASE_URL}/${url}`;
  };

  // ============================================================
  // CLEAR CHAT
  // ============================================================

  const clearChat = () => {
    setMessages([]);
    setAudioUrl(null);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="antimate-ai-page">
      <div className="antimate-ai-header">
        <div>
          <div className="antimate-ai-title-row">
            <div className="antimate-ai-logo">
              AI
            </div>

            <div>
              <h1>ANTIMATE AI</h1>

              <p>
                Intelligent Kinyarwanda
                Assistant
              </p>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            className="antimate-clear-btn"
            onClick={clearChat}
          >
            Clear
          </button>
        )}
      </div>

      <div className="antimate-ai-content">
        {/* ================================================== */}
        {/* CHAT */}
        {/* ================================================== */}

        <div className="antimate-chat">
          {messages.length === 0 ? (
            <div className="antimate-empty">
              <div className="antimate-empty-icon">
                ✦
              </div>

              <h2>
                Murakaza neza kuri ANTIMATE
              </h2>

              <p>
                Andika cyangwa uvuge mu
                Kinyarwanda. ANTIMATE
                izagufasha kubona igisubizo.
              </p>

              <div className="antimate-suggestions">
                <button
                  onClick={() =>
                    setText(
                      "ANTIMATE wamfasha iki?"
                    )
                  }
                >
                  Wamfasha iki?
                </button>

                <button
                  onClick={() =>
                    setText(
                      "Mpa amakuru mashya."
                    )
                  }
                >
                  Mpa amakuru
                </button>

                <button
                  onClick={() =>
                    setText(
                      "Sobanura uko wakora."
                    )
                  }
                >
                  Sobanura
                </button>
              </div>
            </div>
          ) : (
            <div className="antimate-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`antimate-message ${
                    message.role === "user"
                      ? "user-message"
                      : "assistant-message"
                  }`}
                >
                  <div className="antimate-message-avatar">
                    {message.role === "user"
                      ? "U"
                      : "AI"}
                  </div>

                  <div className="antimate-message-body">
                    <div className="antimate-message-name">
                      {message.role === "user"
                        ? "Wowe"
                        : "ANTIMATE"}
                    </div>

                    <div className="antimate-message-text">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}

              {(loadingText ||
                loadingVoice) && (
                <div className="antimate-message assistant-message">
                  <div className="antimate-message-avatar">
                    AI
                  </div>

                  <div className="antimate-message-body">
                    <div className="antimate-message-name">
                      ANTIMATE
                    </div>

                    <div className="antimate-thinking">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* AUDIO RESPONSE */}
        {/* ================================================== */}

        {audioUrl && (
          <div className="antimate-audio-response">
            <div>
              <span className="antimate-audio-label">
                ANTIMATE Voice
              </span>
            </div>

            <audio
              src={audioUrl}
              controls
              autoPlay
            />
          </div>
        )}

        {/* ================================================== */}
        {/* INPUT */}
        {/* ================================================== */}

        <div className="antimate-input-section">
          <div className="antimate-input-wrapper">
            <textarea
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Andika ubutumwa bwawe mu Kinyarwanda..."
              rows={1}
              disabled={
                loadingText ||
                loadingVoice
              }
            />

            <div className="antimate-input-actions">
              <button
                type="button"
                className={`antimate-mic-btn ${
                  recording
                    ? "recording"
                    : ""
                }`}
                onClick={
                  recording
                    ? stopRecording
                    : startRecording
                }
                disabled={
                  loadingText ||
                  loadingVoice
                }
                title={
                  recording
                    ? "Hagarika recording"
                    : "Vuga"
                }
              >
                {recording ? "■" : "🎤"}
              </button>

              <button
                type="button"
                className="antimate-send-btn"
                onClick={sendText}
                disabled={
                  !text.trim() ||
                  loadingText ||
                  loadingVoice
                }
              >
                {loadingText
                  ? "..."
                  : "↑"}
              </button>
            </div>
          </div>

          <div className="antimate-input-hint">
            <span>
              Enter → Ohereza
            </span>

            <span>
              🎤 → Vuga
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}