import { useEffect, useRef, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

function AntimateAI() {
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const messagesEndRef = useRef(null);
  const textInputRef = useRef(null);
  const audioUrlRef = useRef(null);

  // =====================================================
  // INITIAL MESSAGE
  // =====================================================

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text:
          "Muraho 👋 Ndi ANTIMATE AI. Ndi hano kugira ngo tuganire, nkwumve kandi ngufashe. Ushobora kuvuga cyangwa ukandika ubutumwa bwawe mu Kinyarwanda.",
        time: getTime(),
      },
    ]);
  }, []);

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
      stopMicrophoneTracks();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // =====================================================
  // TIME
  // =====================================================

  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // =====================================================
  // STOP MICROPHONE TRACKS
  // =====================================================

  const stopMicrophoneTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn(
            "Could not stop microphone track:",
            e
          );
        }
      });

      streamRef.current = null;
    }
  };

  // =====================================================
  // CHECK MICROPHONE PERMISSION
  // =====================================================

  const getMicrophonePermissionState = async () => {
    /*
     * Browser zimwe ntizishyigikira Permissions API kuri
     * microphone. Ni yo mpamvu tutagomba gufata failure
     * hano nk'uko microphone yanze.
     */

    if (!navigator.permissions?.query) {
      return "unknown";
    }

    try {
      const permission =
        await navigator.permissions.query({
          name: "microphone",
        });

      console.log(
        "🎤 Microphone permission:",
        permission.state
      );

      return permission.state;
    } catch (err) {
      console.warn(
        "⚠️ Microphone permission query unsupported:",
        err
      );

      return "unknown";
    }
  };

  // =====================================================
  // REQUEST MICROPHONE
  // =====================================================

  const requestMicrophoneAccess = async () => {
    /*
     * Iyi ni yo nzira nyayo ituma browser yerekana:
     *
     * "Allow this site to use your microphone?"
     *
     * Iyo permission itaraba granted.
     */

    try {
      console.log(
        "🎤 Requesting microphone permission..."
      );

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      console.log(
        "✅ Microphone permission granted."
      );

      return stream;
    } catch (err) {
      console.error(
        "❌ Microphone permission request failed:",
        err
      );

      throw err;
    }
  };

  // =====================================================
  // START RECORDING
  // =====================================================

  const startRecording = async () => {
    if (loading || recording) {
      return;
    }

    try {
      setError("");

      // -------------------------------------------------
      // BROWSER SUPPORT
      // -------------------------------------------------

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setError(
          "Browser yawe ntabwo ishigikira gufata amajwi. Gerageza Chrome cyangwa Edge."
        );

        return;
      }

      if (
        typeof MediaRecorder === "undefined"
      ) {
        setError(
          "Browser yawe ntabwo ishigikira audio recording."
        );

        return;
      }

      // -------------------------------------------------
      // CHECK PERMISSION
      // -------------------------------------------------

      const permissionState =
        await getMicrophonePermissionState();

      console.log(
        "🎤 Current microphone permission:",
        permissionState
      );

      // -------------------------------------------------
      // DENIED
      // -------------------------------------------------

      if (permissionState === "denied") {
        setError(
          "Microphone yanze. Jya muri browser settings yemere microphone kuri uru rubuga, hanyuma wongere ukande 🎤."
        );

        return;
      }

      // -------------------------------------------------
      // GET MICROPHONE
      //
      // If permission is:
      // granted  -> starts immediately
      // prompt    -> browser asks Allow
      // unknown   -> getUserMedia decides
      // -------------------------------------------------

      const stream =
        await requestMicrophoneAccess();

      // -------------------------------------------------
      // SAVE STREAM
      // -------------------------------------------------

      streamRef.current = stream;

      // -------------------------------------------------
      // CHECK AUDIO TRACK
      // -------------------------------------------------

      const audioTracks =
        stream.getAudioTracks();

      if (!audioTracks.length) {
        stopMicrophoneTracks();

        setError(
          "Microphone yabonetse ariko nta audio input yabonetse kuri device."
        );

        return;
      }

      console.log(
        "🎤 Microphone:",
        audioTracks[0].label
      );

      // -------------------------------------------------
      // FIND SUPPORTED MIME TYPE
      // -------------------------------------------------

      let mimeType = "";

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ];

      for (const type of supportedTypes) {
        try {
          if (
            MediaRecorder.isTypeSupported(type)
          ) {
            mimeType = type;
            break;
          }
        } catch {
          // Ignore unsupported MIME checks
        }
      }

      console.log(
        "🎧 Selected MIME:",
        mimeType || "browser default"
      );

      // -------------------------------------------------
      // CREATE RECORDER
      // -------------------------------------------------

      let recorder;

      try {
        recorder = mimeType
          ? new MediaRecorder(stream, {
              mimeType,
            })
          : new MediaRecorder(stream);
      } catch (recorderError) {
        console.error(
          "❌ MediaRecorder creation failed:",
          recorderError
        );

        stopMicrophoneTracks();

        setError(
          "Browser yananiwe gutegura gufata amajwi. Gerageza Chrome cyangwa Edge."
        );

        return;
      }

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      // -------------------------------------------------
      // DATA AVAILABLE
      // -------------------------------------------------

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

      // -------------------------------------------------
      // ERROR
      // -------------------------------------------------

      recorder.onerror = (event) => {
        console.error(
          "❌ MediaRecorder error:",
          event
        );

        setError(
          "Habaye ikibazo mu gufata amajwi."
        );

        setRecording(false);

        stopMicrophoneTracks();
      };

      // -------------------------------------------------
      // STOP
      // -------------------------------------------------

      recorder.onstop = () => {
        try {
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

          console.log(
            "🎧 Recorded audio size:",
            blob.size,
            "bytes"
          );

          if (!blob.size) {
            setError(
              "Nta majwi yafashwe. Ongera ugerageze."
            );

            stopMicrophoneTracks();

            return;
          }

          // -------------------------------------------------
          // FILE EXTENSION
          // -------------------------------------------------

          let extension = "webm";

          if (
            actualType.includes("ogg")
          ) {
            extension = "ogg";
          } else if (
            actualType.includes("mp4")
          ) {
            extension = "mp4";
          }

          // -------------------------------------------------
          // CREATE FILE
          // -------------------------------------------------

          const file = new File(
            [blob],
            `antimate-voice-${Date.now()}.${extension}`,
            {
              type: actualType,
            }
          );

          console.log(
            "✅ Audio file created:",
            file.name,
            file.type,
            file.size
          );

          setAudioFile(file);

          // -------------------------------------------------
          // ADD USER VOICE MESSAGE
          // -------------------------------------------------

          setMessages((previous) => [
            ...previous,
            {
              id:
                Date.now() +
                "-voice",
              role: "user",
              type: "voice",
              text:
                "🎤 Ubutumwa bw'amajwi",
              time: getTime(),
            },
          ]);

          // -------------------------------------------------
          // RELEASE MICROPHONE
          // -------------------------------------------------

          stopMicrophoneTracks();

          mediaRecorderRef.current = null;
        } catch (stopError) {
          console.error(
            "❌ Recording stop processing error:",
            stopError
          );

          setError(
            "Habaye ikibazo mu gutunganya audio wafashe."
          );

          stopMicrophoneTracks();
        }
      };

      // -------------------------------------------------
      // START
      // -------------------------------------------------

      recorder.start(250);

      setRecording(true);

      console.log(
        "🎙️ ANTIMATE recording started."
      );
    } catch (err) {
      console.error(
        "❌ Microphone error:",
        err
      );

      setRecording(false);

      stopMicrophoneTracks();

      // =================================================
      // PERMISSION DENIED
      // =================================================

      if (
        err?.name ===
        "NotAllowedError"
      ) {
        setError(
          "Microphone ntiyemerewe. Browser igusaba gukanda Allow/Permitir kuri microphone. Niba wayanze mbere, jya muri browser settings uyemere kuri uru rubuga."
        );

        return;
      }

      // =================================================
      // NO MICROPHONE
      // =================================================

      if (
        err?.name ===
        "NotFoundError"
      ) {
        setError(
          "Nta microphone yabonetse kuri device yawe. Huza microphone cyangwa urebe niba device yawe ifite microphone ikora."
        );

        return;
      }

      // =================================================
      // DEVICE BUSY
      // =================================================

      if (
        err?.name ===
        "NotReadableError"
      ) {
        setError(
          "Microphone ntiyashoboye gukoreshwa. Ishobora kuba iri gukoreshwa n'indi application cyangwa browser tab."
        );

        return;
      }

      // =================================================
      // SECURITY / HTTPS
      // =================================================

      if (
        err?.name ===
        "SecurityError"
      ) {
        setError(
          "Browser yabujije microphone kubera security. Fungura uru rubuga kuri HTTPS hanyuma wongere ugerageze."
        );

        return;
      }

      // =================================================
      // GENERIC ERROR
      // =================================================

      setError(
        err?.message ||
          "Habaye ikibazo kuri microphone. Ongera ugerageze."
      );
    }
  };

  // =====================================================
  // STOP RECORDING
  // =====================================================

  const stopRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      console.log(
        "⏹️ Stopping recording..."
      );

      recorder.stop();
    } else {
      stopMicrophoneTracks();
      setRecording(false);
    }
  };

  // =====================================================
  // FILE SELECT
  // =====================================================

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("audio/")
    ) {
      setError(
        "Hitamo file y'amajwi gusa."
      );

      return;
    }

    setError("");
    setAudioFile(file);

    setMessages((previous) => [
      ...previous,
      {
        id:
          Date.now() +
          "-file",
        role: "user",
        type: "voice",
        text:
          "🎧 Audio yatoranyijwe",
        time: getTime(),
      },
    ]);

    event.target.value = "";
  };

  // =====================================================
  // SEND TEXT
  // =====================================================

  const sendTextMessage = async () => {
    const cleanText =
      textInput.trim();

    if (!cleanText || loading) {
      return;
    }

    setTextInput("");
    setError("");

    setMessages((previous) => [
      ...previous,
      {
        id:
          Date.now() +
          "-user",
        role: "user",
        text: cleanText,
        time: getTime(),
      },
    ]);

    await sendTextToAntimate(
      cleanText
    );
  };

  // =====================================================
  // SEND AUDIO
  // =====================================================

  const sendVoiceMessage = async () => {
    if (!audioFile || loading) {
      return;
    }

    setError("");

    await sendAudioToAntimate(
      audioFile
    );

    setAudioFile(null);
  };

  // =====================================================
  // TEXT API
  // =====================================================

  const sendTextToAntimate = async (
    text
  ) => {
    setLoading(true);

    try {
      const token =
        localStorage.getItem(
          "token"
        );

      const headers = {
        "Content-Type":
          "application/json",
      };

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      const response =
        await fetch(
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

      await processApiResponse(
        response
      );
    } catch (err) {
      console.error(
        "ANTIMATE text error:",
        err
      );

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

  const sendAudioToAntimate = async (
    file
  ) => {
    setLoading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "audio",
        file
      );

      const token =
        localStorage.getItem(
          "token"
        );

      const headers = {};

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      const response =
        await fetch(
          `${API_BASE}/api/antimate/voice`,
          {
            method: "POST",
            headers,
            body: formData,
          }
        );

      await processApiResponse(
        response
      );
    } catch (err) {
      console.error(
        "ANTIMATE voice error:",
        err
      );

      addErrorMessage(
        err.message ||
          "ANTIMATE ntiyabashije kwakira ubutumwa bw'amajwi."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PROCESS API RESPONSE
  // =====================================================

  const processApiResponse = async (
    response
  ) => {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

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
      } catch {
        // Keep default
      }

      throw new Error(message);
    }

    // ===================================================
    // JSON
    // ===================================================

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const data =
        await response.json();

      console.log(
        "📦 ANTIMATE API response:",
        data
      );

      if (
        data.success === false
      ) {
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

      if (answer) {
        addAssistantMessage(
          answer
        );
      }

      const returnedAudio =
        data.audio_url ||
        data.audio ||
        data.audioUrl ||
        data.voice_url;

      if (returnedAudio) {
        setResponseAudio(
          returnedAudio
        );
      }

      if (!answer && !returnedAudio) {
        addAssistantMessage(
          "ANTIMATE yakiriye ubutumwa bwawe, ariko nta gisubizo yabashije gutanga."
        );
      }

      return;
    }

    // ===================================================
    // DIRECT AUDIO
    // ===================================================

    if (
      contentType.startsWith(
        "audio/"
      )
    ) {
      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(
          blob
        );

      replaceAudioUrl(url);

      addAssistantMessage(
        "Ndagusubije mu ijwi 🔊"
      );

      return;
    }

    // ===================================================
    // TEXT
    // ===================================================

    const text =
      await response.text();

    if (text.trim()) {
      addAssistantMessage(
        text.trim()
      );
    } else {
      addAssistantMessage(
        "ANTIMATE ntiyagaruye igisubizo."
      );
    }
  };

  // =====================================================
  // ADD ASSISTANT MESSAGE
  // =====================================================

  const addAssistantMessage = (
    text
  ) => {
    setMessages((previous) => [
      ...previous,
      {
        id:
          Date.now() +
          "-assistant-" +
          Math.random(),
        role: "assistant",
        text: String(text),
        time: getTime(),
      },
    ]);
  };

  // =====================================================
  // ERROR MESSAGE
  // =====================================================

  const addErrorMessage = (
    message
  ) => {
    const cleanMessage =
      String(message);

    setError(cleanMessage);

    setMessages((previous) => [
      ...previous,
      {
        id:
          Date.now() +
          "-error-" +
          Math.random(),
        role: "assistant",
        type: "error",
        text:
          "Mbabarira, habaye ikibazo. Ongera ugerageze.",
        time: getTime(),
      },
    ]);
  };

  // =====================================================
  // AUDIO RESPONSE
  // =====================================================

  const replaceAudioUrl = (
    url
  ) => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(
        audioUrlRef.current
      );
    }

    audioUrlRef.current = url;

    setAudioUrl(url);
  };

  const setResponseAudio = (
    returnedUrl
  ) => {
    if (
      typeof returnedUrl !==
      "string"
    ) {
      return;
    }

    let finalUrl =
      returnedUrl;

    if (
      !returnedUrl.startsWith(
        "http://"
      ) &&
      !returnedUrl.startsWith(
        "https://"
      ) &&
      !returnedUrl.startsWith(
        "blob:"
      )
    ) {
      finalUrl =
        `${API_BASE}${
          returnedUrl.startsWith(
            "/"
          )
            ? ""
            : "/"
        }${returnedUrl}`;
    }

    replaceAudioUrl(
      finalUrl
    );
  };

  // =====================================================
  // KEYBOARD
  // =====================================================

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendTextMessage();
    }
  };

  // =====================================================
  // CLEAR CHAT
  // =====================================================

  const clearConversation = () => {
    if (loading) return;

    if (recording) {
      stopRecording();
    }

    stopMicrophoneTracks();

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
          "Tangira Ikiganiro ginshya 👋. Ndi hano kugira ngo ngufashe.",
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
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

      <div style={styles.chatShell}>

        {/* =================================================
            HEADER
        ================================================= */}

        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logo}>
              🤖
            </div>

            <div>
              <h1 style={styles.title}>
                ANTIMATE AI
              </h1>

              <div style={styles.statusRow}>
                <span
                  style={
                    styles.onlineDot
                  }
                />

                <span>
                  Online
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={
              clearConversation
            }
            disabled={loading}
            style={
              styles.newChatButton
            }
          >
            <span>
              ＋
            </span>

            <span>
              Ikiganiro ginshya
            </span>
          </button>
        </header>

        {/* =================================================
            CHAT
        ================================================= */}

        <main style={styles.chatArea}>
          {messages.length === 1 && (
            <div
              style={
                styles.welcomePanel
              }
            >
              <div
                style={
                  styles.welcomeIcon
                }
              >
                ✨
              </div>

              <h2
                style={
                  styles.welcomeTitle
                }
              >
                Muraho, nagufasha iki?
              </h2>

              <p
                style={
                  styles.welcomeText
                }
              >
                Vugana nanjye mu
                Kinyarwanda cyangwa
                wandike ubutumwa bwawe.
              </p>

              <div
                style={
                  styles.quickActions
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setTextInput(
                      "Mpa amakuru ajyanye na system yanjye."
                    )
                  }
                  style={
                    styles.quickButton
                  }
                >
                  💡 Mpa inama
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTextInput(
                      "Mfasha kumenya ikibazo kiri kuri system yanjye."
                    )
                  }
                  style={
                    styles.quickButton
                  }
                >
                  🔧 Mfasha
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTextInput(
                      "Ni iki nakora kugira ngo system ikore neza?"
                    )
                  }
                  style={
                    styles.quickButton
                  }
                >
                  🧠 Mbaza ANTIMATE
                </button>
              </div>
            </div>
          )}

          <div
            style={
              styles.messagesContainer
            }
          >
            {messages.map(
              (message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              )
            )}

            {loading && (
              <div
                style={
                  styles.assistantRow
                }
              >
                <div
                  style={
                    styles.assistantAvatar
                  }
                >
                  🤖
                </div>

                <div
                  style={
                    styles.typingBubble
                  }
                >
                  <span
                    style={
                      styles.typingDot
                    }
                  />
                  <span
                    style={
                      styles.typingDot
                    }
                  />
                  <span
                    style={
                      styles.typingDot
                    }
                  />
                </div>
              </div>
            )}

            <div
              ref={messagesEndRef}
            />
          </div>
        </main>

        {/* =================================================
            AUDIO RESPONSE
        ================================================= */}

        {audioUrl && (
          <div
            style={
              styles.audioResponse
            }
          >
            <div
              style={
                styles.audioResponseLeft
              }
            >
              <div
                style={
                  styles.audioResponseIcon
                }
              >
                🔊
              </div>

              <div>
                <strong
                  style={
                    styles.audioResponseTitle
                  }
                >
                  ANTIMATE
                </strong>

                <div
                  style={
                    styles.audioResponseSubtitle
                  }
                >
                  Igisubizo mu ijwi
                </div>
              </div>
            </div>

            <audio
              controls
              autoPlay
              src={audioUrl}
              style={
                styles.audioPlayer
              }
            />
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={
              styles.errorBar
            }
          >
            <span>⚠️</span>

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              style={
                styles.errorClose
              }
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            VOICE READY
        ================================================= */}

        {audioFile && !recording && (
          <div
            style={
              styles.voiceReady
            }
          >
            <div>
              <span>
                🎧
              </span>

              <span>
                Audio yiteguye
              </span>
            </div>

            <div
              style={
                styles.voiceReadyActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  setAudioFile(null)
                }
                disabled={loading}
                style={
                  styles.cancelVoice
                }
              >
                Kuraho
              </button>

              <button
                type="button"
                onClick={
                  sendVoiceMessage
                }
                disabled={loading}
                style={
                  styles.sendVoiceButton
                }
              >
                {loading
                  ? "Irategereza..."
                  : "Ohereza 🎤"}
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            INPUT
        ================================================= */}

        <footer
          style={
            styles.inputArea
          }
        >
          <div
            style={
              styles.inputWrapper
            }
          >

            {/* FILE */}

            <label
              style={
                styles.attachButton
              }
              title="Hitamo audio"
            >
              ＋

              <input
                type="file"
                accept="audio/*"
                onChange={
                  handleFileChange
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
              placeholder="Andika ubutumwa bwawe..."
              rows={1}
              disabled={loading}
              style={
                styles.textInput
              }
            />

            {/* MICROPHONE */}

            <button
              type="button"
              onClick={
                recording
                  ? stopRecording
                  : startRecording
              }
              disabled={loading}
              title={
                recording
                  ? "Hagarika gufata amajwi"
                  : "Vuga"
              }
              aria-label={
                recording
                  ? "Hagarika gufata amajwi"
                  : "Tangira gufata amajwi"
              }
              style={{
                ...styles.micButton,
                ...(recording
                  ? styles.micButtonActive
                  : {}),
              }}
            >
              {recording
                ? "⏹"
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
                !textInput.trim()
              }
              style={{
                ...styles.sendButton,
                ...(loading ||
                !textInput.trim()
                  ? styles.sendButtonDisabled
                  : {}),
              }}
            >
              {loading
                ? "..."
                : "➤"}
            </button>
          </div>

          <div
            style={
              styles.inputHint
            }
          >
            <span>
              Vuga cyangwa wandike mu
              Kinyarwanda
            </span>

            <span>
              Enter = Ohereza
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

function ChatMessage({
  message,
}) {
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
        <div
          style={
            styles.assistantAvatar
          }
        >
          🤖
        </div>
      )}

      <div
        style={{
          ...styles.messageColumn,
          ...(isUser
            ? styles.userColumn
            : {}),
        }}
      >
        <div
          style={{
            ...styles.messageBubble,
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
            <div
              style={
                styles.voiceMessageIcon
              }
            >
              🎤
            </div>
          )}

          <div
            style={
              styles.messageText
            }
          >
            {message.text}
          </div>
        </div>

        <div
          style={{
            ...styles.messageTime,
            ...(isUser
              ? styles.userTime
              : {}),
          }}
        >
          {message.time}
        </div>
      </div>

      {isUser && (
        <div
          style={
            styles.userAvatar
          }
        >
          👤
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
    background:
      "radial-gradient(circle at 10% 0%, rgba(37,99,235,0.15), transparent 32%), radial-gradient(circle at 90% 100%, rgba(6,182,212,0.10), transparent 30%), #07111f",
    color: "#ffffff",
    padding: "20px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  glowOne: {
    position: "fixed",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background:
      "rgba(37,99,235,0.08)",
    filter: "blur(100px)",
    top: "-220px",
    left: "-180px",
    pointerEvents: "none",
  },

  glowTwo: {
    position: "fixed",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background:
      "rgba(6,182,212,0.06)",
    filter: "blur(100px)",
    bottom: "-180px",
    right: "-150px",
    pointerEvents: "none",
  },

  chatShell: {
    maxWidth: "1050px",
    height:
      "calc(100vh - 40px)",
    minHeight: "650px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 1,
    background:
      "rgba(7,18,32,0.90)",
    border:
      "1px solid rgba(255,255,255,0.07)",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow:
      "0 30px 100px rgba(0,0,0,0.35)",
    backdropFilter:
      "blur(20px)",
  },

  header: {
    minHeight: "76px",
    padding: "14px 20px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "15px",
    borderBottom:
      "1px solid rgba(255,255,255,0.06)",
    background:
      "rgba(10,25,43,0.85)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg,#2563eb,#06b6d4)",
    fontSize: "23px",
    boxShadow:
      "0 8px 25px rgba(37,99,235,0.25)",
  },

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "0.4px",
  },

  statusRow: {
    marginTop: "3px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#71859c",
    fontSize: "11px",
  },

  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#10b981",
    boxShadow:
      "0 0 10px rgba(16,185,129,0.8)",
  },

  newChatButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background:
      "rgba(255,255,255,0.035)",
    color: "#a9bbcf",
    padding: "9px 13px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 700,
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "30px 25px 20px",
    scrollBehavior: "smooth",
  },

  welcomePanel: {
    maxWidth: "600px",
    margin: "15px auto 35px",
    textAlign: "center",
  },

  welcomeIcon: {
    width: "58px",
    height: "58px",
    margin: "0 auto 15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "18px",
    background:
      "rgba(37,99,235,0.10)",
    border:
      "1px solid rgba(37,99,235,0.15)",
    fontSize: "27px",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "25px",
    letterSpacing: "-0.5px",
  },

  welcomeText: {
    margin: "10px auto 20px",
    maxWidth: "500px",
    color: "#8296ad",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  quickActions: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "8px",
  },

  quickButton: {
    border:
      "1px solid rgba(255,255,255,0.07)",
    background:
      "rgba(255,255,255,0.035)",
    color: "#9fb2c8",
    padding: "9px 12px",
    borderRadius: "10px",
    fontSize: "11px",
    cursor: "pointer",
  },

  messagesContainer: {
    maxWidth: "800px",
    margin: "0 auto",
  },

  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "9px",
    marginBottom: "19px",
  },

  assistantRow: {
    justifyContent:
      "flex-start",
  },

  userRow: {
    justifyContent:
      "flex-end",
  },

  assistantAvatar: {
    flexShrink: 0,
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg,#2563eb,#06b6d4)",
    fontSize: "15px",
  },

  userAvatar: {
    flexShrink: 0,
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.08)",
    border:
      "1px solid rgba(255,255,255,0.07)",
    fontSize: "14px",
  },

  messageColumn: {
    maxWidth: "75%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },

  userColumn: {
    alignItems: "flex-end",
  },

  messageBubble: {
    padding: "12px 15px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  assistantBubble: {
    background:
      "rgba(255,255,255,0.045)",
    border:
      "1px solid rgba(255,255,255,0.065)",
    color: "#dbe7f4",
    borderBottomLeftRadius:
      "5px",
  },

  userBubble: {
    background:
      "linear-gradient(135deg,#2563eb,#0e7490)",
    color: "#ffffff",
    borderBottomRightRadius:
      "5px",
    boxShadow:
      "0 8px 22px rgba(37,99,235,0.16)",
  },

  errorBubble: {
    background:
      "rgba(239,68,68,0.08)",
    border:
      "1px solid rgba(239,68,68,0.15)",
    color: "#fca5a5",
  },

  messageText: {
    minWidth: 0,
  },

  voiceMessageIcon: {
    marginBottom: "3px",
    fontSize: "15px",
  },

  messageTime: {
    marginTop: "5px",
    paddingLeft: "3px",
    color: "#4f647c",
    fontSize: "9px",
  },

  userTime: {
    paddingLeft: 0,
    paddingRight: "3px",
  },

  typingBubble: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "13px 15px",
    borderRadius: "15px",
    borderBottomLeftRadius:
      "5px",
    background:
      "rgba(255,255,255,0.045)",
    border:
      "1px solid rgba(255,255,255,0.06)",
  },

  typingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#6d8299",
  },

  audioResponse: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "15px",
    padding: "12px 18px",
    borderTop:
      "1px solid rgba(255,255,255,0.05)",
    background:
      "rgba(16,185,129,0.035)",
  },

  audioResponseLeft: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
  },

  audioResponseIcon: {
    width: "35px",
    height: "35px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(16,185,129,0.10)",
    fontSize: "17px",
  },

  audioResponseTitle: {
    display: "block",
    fontSize: "11px",
  },

  audioResponseSubtitle: {
    marginTop: "2px",
    color: "#62788f",
    fontSize: "9px",
  },

  audioPlayer: {
    maxWidth: "360px",
    width: "100%",
    height: "35px",
  },

  errorBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "0 20px 10px",
    padding: "9px 12px",
    borderRadius: "9px",
    background:
      "rgba(239,68,68,0.07)",
    border:
      "1px solid rgba(239,68,68,0.13)",
    color: "#fca5a5",
    fontSize: "11px",
  },

  errorClose: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#fca5a5",
    fontSize: "17px",
    cursor: "pointer",
  },

  voiceReady: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "10px",
    padding: "9px 15px",
    borderTop:
      "1px solid rgba(255,255,255,0.05)",
    background:
      "rgba(37,99,235,0.05)",
    color: "#9fb4ca",
    fontSize: "11px",
  },

  voiceReadyActions: {
    display: "flex",
    gap: "7px",
  },

  cancelVoice: {
    border:
      "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#778ba2",
    borderRadius: "8px",
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: "10px",
  },

  sendVoiceButton: {
    border: "none",
    background:
      "linear-gradient(135deg,#2563eb,#06b6d4)",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "7px 12px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 700,
  },

  inputArea: {
    padding: "13px 20px 15px",
    borderTop:
      "1px solid rgba(255,255,255,0.06)",
    background:
      "rgba(7,18,32,0.96)",
  },

  inputWrapper: {
    maxWidth: "800px",
    margin: "0 auto",
    minHeight: "50px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "6px 7px",
    borderRadius: "15px",
    background:
      "rgba(255,255,255,0.045)",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  attachButton: {
    flexShrink: 0,
    width: "35px",
    height: "35px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "transparent",
    color: "#71869d",
    fontSize: "21px",
    cursor: "pointer",
  },

  hiddenInput: {
    display: "none",
  },

  textInput: {
    flex: 1,
    minWidth: 0,
    resize: "none",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#e6eef7",
    fontFamily: "inherit",
    fontSize: "13px",
    lineHeight: 1.5,
    padding: "8px 4px",
    maxHeight: "120px",
  },

  micButton: {
    flexShrink: 0,
    width: "37px",
    height: "37px",
    border: "none",
    borderRadius: "11px",
    background:
      "rgba(255,255,255,0.05)",
    color: "#a6b8cb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px",
  },

  micButtonActive: {
    background:
      "rgba(239,68,68,0.15)",
    color: "#f87171",
    boxShadow:
      "0 0 0 4px rgba(239,68,68,0.05)",
  },

  sendButton: {
    flexShrink: 0,
    width: "39px",
    height: "39px",
    border: "none",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg,#2563eb,#06b6d4)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 700,
  },

  sendButtonDisabled: {
    opacity: 0.3,
    cursor: "not-allowed",
  },

  inputHint: {
    maxWidth: "800px",
    margin: "7px auto 0",
    display: "flex",
    justifyContent:
      "space-between",
    gap: "10px",
    color: "#4f647b",
    fontSize: "9px",
  },
};

// =======================================================
// EXPORT
// =======================================================

export default AntimateAI;