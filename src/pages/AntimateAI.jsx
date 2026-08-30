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

FEATURES
------------------------------------------------------------
- Text chat
- Voice recording max 30 seconds
- Professional start recording sound - 2 seconds
- Professional stop recording sound - 2 seconds
- Professional send sound
- Recording starts AFTER start sound finishes
- Recording stops BEFORE stop sound plays
- 30s countdown
- Voice transcript appears on USER side
- AI voice answer appears on AI side
- AI voice automatically plays once
- Replay button remains available
- Fixed bottom composer
- Voice icon when text is empty
- Send icon when user is typing
- Thinking/status messages rotate every 3 seconds
- Auto-scroll immediately after sending
- Thinking indicator positioned around 1/3 from bottom
- ANTIMATE O-SHAPED animated logo
- AI text inside logo stays COMPLETELY STATIC
- Logo does NOT appear in center welcome area
- Fixed header
- Theme controlled by AppSettingsContext
- Language controlled by AppSettingsContext
- Native CSS only
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
SOUND CONFIGURATION
============================================================
*/

const SOUND_DURATION = 2000;

/*
============================================================
ANTIMATE O-SHAPED LOGO
============================================================
*/

function AntimateLogo({
  size = 58,
  className = "",
}) {
  return (
    <div
      className={`antimate-logo-o ${className}`}
      style={{
        width: size,
        height: size,
      }}
      aria-label="ANTIMATE AI"
    >
      <div className="antimate-logo-ring">
        <div className="antimate-logo-core">
          <span>AI</span>
        </div>
      </div>
    </div>
  );
}

/*
============================================================
VOICE WAVE
============================================================
*/

function VoiceWave() {
  return (
    <span className="antimate-wave-mini">
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

/*
============================================================
MAIN COMPONENT
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

  const [isStartingRecording, setIsStartingRecording] =
    useState(false);

  const [isStoppingRecording, setIsStoppingRecording] =
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

  const thinkingTimerRef =
    useRef(null);

  const audioRefs =
    useRef({});

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const recordingStopRequestedRef =
    useRef(false);

  /*
  ============================================================
  PROFESSIONAL AUDIO ENGINE
  ============================================================
  */

  const getAudioContext = () => {
    if (
      typeof window === "undefined"
    ) {
      return null;
    }

    if (
      !audioContextRef.current
    ) {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return null;
      }

      audioContextRef.current =
        new AudioContext();
    }

    return audioContextRef.current;
  };

  /*
  ============================================================
  MASTER AUDIO UNLOCK
  ============================================================
  */

  const unlockAudio = async () => {
    try {
      const context =
        getAudioContext();

      if (!context) {
        return null;
      }

      if (
        context.state ===
        "suspended"
      ) {
        await context.resume();
      }

      return context;
    } catch (error) {
      console.warn(
        "Audio context unlock failed:",
        error
      );

      return null;
    }
  };

  /*
  ============================================================
  PROFESSIONAL TONE GENERATOR
  ============================================================
  */

  const playProfessionalSound =
    async (type = "send") => {
      const context =
        await unlockAudio();

      if (!context) {
        return;
      }

      try {
        const now =
          context.currentTime;

        /*
        --------------------------------------------------------
        SEND SOUND
        --------------------------------------------------------
        Short, clean UI confirmation.
        --------------------------------------------------------
        */

        if (type === "send") {
          const master =
            context.createGain();

          master.gain.setValueAtTime(
            0.0001,
            now
          );

          master.gain.exponentialRampToValueAtTime(
            0.055,
            now + 0.018
          );

          master.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.18
          );

          master.connect(
            context.destination
          );

          const oscillator =
            context.createOscillator();

          oscillator.type =
            "sine";

          oscillator.frequency.setValueAtTime(
            720,
            now
          );

          oscillator.frequency.exponentialRampToValueAtTime(
            980,
            now + 0.11
          );

          oscillator.connect(
            master
          );

          oscillator.start(now);
          oscillator.stop(
            now + 0.2
          );

          return;
        }

        /*
        --------------------------------------------------------
        START RECORDING SOUND
        --------------------------------------------------------
        Exactly 2 seconds.
        
        Professional rising harmonic tone.
        --------------------------------------------------------
        */

        if (type === "record-start") {
          const master =
            context.createGain();

          master.gain.setValueAtTime(
            0.0001,
            now
          );

          master.gain.exponentialRampToValueAtTime(
            0.045,
            now + 0.12
          );

          master.gain.setValueAtTime(
            0.045,
            now + 0.8
          );

          master.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 2.0
          );

          master.connect(
            context.destination
          );

          const frequencies = [
            392,
            523.25,
            659.25,
          ];

          frequencies.forEach(
            (
              frequency,
              index
            ) => {
              const oscillator =
                context.createOscillator();

              const gain =
                context.createGain();

              const startTime =
                now +
                index * 0.18;

              oscillator.type =
                "sine";

              oscillator.frequency.setValueAtTime(
                frequency,
                startTime
              );

              oscillator.frequency.exponentialRampToValueAtTime(
                frequency * 1.04,
                startTime + 1.4
              );

              gain.gain.setValueAtTime(
                0.0001,
                startTime
              );

              gain.gain.exponentialRampToValueAtTime(
                0.35 / frequencies.length,
                startTime + 0.18
              );

              gain.gain.exponentialRampToValueAtTime(
                0.0001,
                now + 2.0
              );

              oscillator.connect(
                gain
              );

              gain.connect(
                master
              );

              oscillator.start(
                startTime
              );

              oscillator.stop(
                now + 2.02
              );
            }
          );

          return;
        }

        /*
        --------------------------------------------------------
        STOP RECORDING SOUND
        --------------------------------------------------------
        Exactly 2 seconds.
        
        Smooth descending confirmation.
        --------------------------------------------------------
        */

        if (type === "record-stop") {
          const master =
            context.createGain();

          master.gain.setValueAtTime(
            0.0001,
            now
          );

          master.gain.exponentialRampToValueAtTime(
            0.05,
            now + 0.08
          );

          master.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 2.0
          );

          master.connect(
            context.destination
          );

          const frequencies = [
            659.25,
            523.25,
            392,
          ];

          frequencies.forEach(
            (
              frequency,
              index
            ) => {
              const oscillator =
                context.createOscillator();

              const gain =
                context.createGain();

              const startTime =
                now +
                index * 0.18;

              oscillator.type =
                "sine";

              oscillator.frequency.setValueAtTime(
                frequency,
                startTime
              );

              oscillator.frequency.exponentialRampToValueAtTime(
                frequency * 0.96,
                startTime + 1.2
              );

              gain.gain.setValueAtTime(
                0.0001,
                startTime
              );

              gain.gain.exponentialRampToValueAtTime(
                0.32 / frequencies.length,
                startTime + 0.12
              );

              gain.gain.exponentialRampToValueAtTime(
                0.0001,
                now + 2.0
              );

              oscillator.connect(
                gain
              );

              gain.connect(
                master
              );

              oscillator.start(
                startTime
              );

              oscillator.stop(
                now + 2.02
              );
            }
          );
        }
      } catch (error) {
        console.warn(
          "Professional sound failed:",
          error
        );
      }
    };

  /*
  ============================================================
  WAIT
  ============================================================
  */

  const wait = (ms) =>
    new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          ms
        )
    );

  /*
  ============================================================
  AUTO SCROLL
  ============================================================
  */

  const scrollToBottom = (
    behavior = "smooth"
  ) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView(
          {
            behavior,
            block: "end",
          }
        );
      });
    });
  };

  /*
  ============================================================
  AUTO SCROLL WHEN MESSAGES / THINKING CHANGE
  ============================================================
  */

  useEffect(() => {
    if (
      messages.length > 0 ||
      thinkingText
    ) {
      scrollToBottom("smooth");
    }
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

      if (
        thinkingTimerRef.current
      ) {
        clearInterval(
          thinkingTimerRef.current
        );

        thinkingTimerRef.current =
          null;
      }

      if (
        mediaRecorderRef.current
      ) {
        try {
          if (
            mediaRecorderRef.current
              .state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch (_) {}
      }

      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            }
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

      if (
        audioContextRef.current
      ) {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
    };
  }, []);

  /*
  ============================================================
  THINKING MESSAGES
  ============================================================
  */

  const getThinkingMessages = (
    type
  ) => {
    if (language === "rw") {
      if (type === "voice") {
        return [
          "🎤 Ndimo gutunganya ibyo uvuze...",
          "🔎 Ndimo gusesengura ijwi ryawe...",
          "🧠 Ndimo kumva neza icyo ushaka...",
          "⚙️ Ndimo gutegura igisubizo...",
          "💡 Hasigaye akanya gato...",
        ];
      }

      return [
        "🧠 Ndatekereza...",
        "🔎 Ndimo gusesengura ikibazo...",
        "⚙️ Ndimo gutegura igisubizo...",
        "💡 Ndimo gushaka igisubizo cyiza...",
        "✨ Hasigaye akanya gato...",
      ];
    }

    if (type === "voice") {
      return [
        "🎤 Processing your voice...",
        "🔎 Analyzing what you said...",
        "🧠 Understanding your request...",
        "⚙️ Preparing a response...",
        "💡 Almost ready...",
      ];
    }

    return [
      "🧠 Thinking...",
      "🔎 Analyzing your request...",
      "⚙️ Preparing a response...",
      "💡 Finding the best answer...",
      "✨ Almost ready...",
    ];
  };

  const startThinking = (
    type = "text"
  ) => {
    if (
      thinkingTimerRef.current
    ) {
      clearInterval(
        thinkingTimerRef.current
      );

      thinkingTimerRef.current =
        null;
    }

    const phrases =
      getThinkingMessages(
        type
      );

    let index = 0;

    setThinkingText(
      phrases[index]
    );

    scrollToBottom("smooth");

    thinkingTimerRef.current =
      setInterval(() => {
        index =
          (index + 1) %
          phrases.length;

        setThinkingText(
          phrases[index]
        );

        scrollToBottom(
          "smooth"
        );
      }, 3000);
  };

  const stopThinking = () => {
    if (
      thinkingTimerRef.current
    ) {
      clearInterval(
        thinkingTimerRef.current
      );

      thinkingTimerRef.current =
        null;
    }

    setThinkingText("");
  };

  /*
  ============================================================
  RECORDING TIMER
  ============================================================
  */

  const stopRecordingTimer = () => {
    if (
      recordingTimerRef.current
    ) {
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

  const getSupportedMimeType =
    () => {
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

      for (
        const type of types
      ) {
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
  START ACTUAL RECORDER
  ============================================================
  */

  const beginRecording = async () => {
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
            .forEach(
              (track) => {
                track.stop();
              }
            );

          mediaStreamRef.current =
            null;

          mediaRecorderRef.current =
            null;

          setIsRecording(false);
          setIsStoppingRecording(
            false
          );
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
            new Blob(chunks, {
              type: finalType,
            });

          /*
          --------------------------------------------------------
          PLAY STOP SOUND FIRST
          --------------------------------------------------------
          */

          await playProfessionalSound(
            "record-stop"
          );

          /*
          --------------------------------------------------------
          THEN SEND VOICE
          --------------------------------------------------------
          */

          await sendVoice(blob);
        };

      recorder.onerror =
        () => {
          stopRecordingTimer();

          stream
            .getTracks()
            .forEach(
              (track) => {
                track.stop();
              }
            );

          mediaStreamRef.current =
            null;

          mediaRecorderRef.current =
            null;

          setIsRecording(false);
          setIsStoppingRecording(
            false
          );
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
      setIsStartingRecording(
        false
      );

      startRecordingTimer();

      scrollToBottom("smooth");
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      setIsStartingRecording(
        false
      );

      setIsRecording(false);
      setRecordingSeconds(0);

      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            }
          );

        mediaStreamRef.current =
          null;
      }

      setRecordingError(
        error?.message ||
          (language === "rw"
            ? "Microphone ntiyabashije gufunguka."
            : "Microphone could not be opened.")
      );
    }
  };

  /*
  ============================================================
  START VOICE RECORDING
  ============================================================
  */

  const startVoiceRecording =
    async () => {
      if (
        isSending ||
        isRecording ||
        isStartingRecording ||
        isStoppingRecording
      ) {
        return;
      }

      setRecordingError("");
      setIsStartingRecording(
        true
      );

      /*
      ----------------------------------------------------------
      Unlock audio immediately from click gesture.
      ----------------------------------------------------------
      */

      await unlockAudio();

      /*
      ----------------------------------------------------------
      PLAY 2 SECOND START SOUND
      ----------------------------------------------------------
      */

      await playProfessionalSound(
        "record-start"
      );

      /*
      ----------------------------------------------------------
      ONLY AFTER SOUND FINISHES:
      START MICROPHONE
      ----------------------------------------------------------
      */

      if (
        !isStartingRecording
      ) {
        return;
      }

      await beginRecording();
    };

  /*
  ============================================================
  STOP VOICE RECORDING
  ============================================================
  */

  const stopVoiceRecording =
    async () => {
      if (
        !isRecording ||
        isStoppingRecording
      ) {
        return;
      }

      setIsStoppingRecording(
        true
      );

      stopRecordingTimer();

      const recorder =
        mediaRecorderRef.current;

      if (!recorder) {
        setIsRecording(false);
        setIsStoppingRecording(
          false
        );
        setRecordingSeconds(0);

        return;
      }

      /*
      ----------------------------------------------------------
      Stop recorder FIRST.
      onstop will then play the 2-second stop sound and send.
      ----------------------------------------------------------
      */

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

          setIsRecording(false);
          setIsStoppingRecording(
            false
          );
        }
      }
    };

  /*
  ============================================================
  RESPONSE PARSER
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

    /*
    ----------------------------------------------------------
    IMMEDIATE AUTO SCROLL
    ----------------------------------------------------------
    */

    setTimeout(() => {
      scrollToBottom("smooth");
    }, 30);

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
      }, 180);
    }

    return message;
  };

  /*
  ============================================================
  TEXT SEND
  ============================================================
  */

  const sendText = async () => {
    const cleanText =
      inputText.trim();

    if (
      !cleanText ||
      isSending ||
      isRecording ||
      isStartingRecording ||
      isStoppingRecording
    ) {
      return;
    }

    /*
    ----------------------------------------------------------
    SEND SOUND
    ----------------------------------------------------------
    */

    await playProfessionalSound(
      "send"
    );

    setInputText("");

    if (inputRef.current) {
      inputRef.current.style.height =
        "auto";
    }

    /*
    ----------------------------------------------------------
    USER MESSAGE
    ----------------------------------------------------------
    */

    addUserMessage({
      text: cleanText,
      voice: false,
    });

    /*
    ----------------------------------------------------------
    AUTO SCROLL IMMEDIATELY
    ----------------------------------------------------------
    */

    scrollToBottom("smooth");

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
          "ANTIMATE ntiyagaruye igisubizo."
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
            : "Sorry, there was a problem getting a response. Please try again.",
      });
    } finally {
      stopThinking();

      setIsSending(false);

      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom(
          "smooth"
        );
      }, 100);
    }
  };

  /*
  ============================================================
  VOICE SEND
  ============================================================
  */

  const sendVoice =
    async (blob) => {
      setIsSending(true);

      startThinking("voice");

      /*
      ----------------------------------------------------------
      AUTO SCROLL AS SOON AS VOICE IS SENT
      ----------------------------------------------------------
      */

      scrollToBottom("smooth");

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

        /*
        ========================================================
        USER TRANSCRIPT
        ========================================================
        */

        const transcript =
          data.input_kinyarwanda ||
          data.transcript ||
          data.transcription ||
          data.text ||
          "";

        /*
        ========================================================
        AI ANSWER
        ========================================================
        */

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

        /*
        --------------------------------------------------------
        AUTO SCROLL AFTER TRANSCRIPT
        --------------------------------------------------------
        */

        scrollToBottom("smooth");

        if (!answer) {
          throw new Error(
            "ANTIMATE ntiyagaruye voice answer."
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
          autoPlay:
            Boolean(audioUrl),
        });

        /*
        --------------------------------------------------------
        AUTO SCROLL AFTER AI RESPONSE
        --------------------------------------------------------
        */

        scrollToBottom("smooth");
      } catch (error) {
        console.error(
          "Voice request error:",
          error
        );

        addAIMessage({
          text:
            language === "rw"
              ? "Mbabarira, sinabashije kumva neza cyangwa kubona igisubizo. Ongera uvuge."
              : "Sorry, I could not understand you or get a response. Please try again.",
        });

        scrollToBottom(
          "smooth"
        );
      } finally {
        stopThinking();
        setIsSending(false);
        setIsStoppingRecording(
          false
        );

        setTimeout(() => {
          scrollToBottom(
            "smooth"
          );
        }, 100);
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

        audio.preload = "auto";

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

  const replayVoice =
    (message) => {
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
  INPUT CHANGE
  ============================================================
  */

  const handleInputChange =
    (event) => {
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

  /*
  ============================================================
  KEY DOWN
  ============================================================
  */

  const handleKeyDown =
    (event) => {
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
  RECORDING ERROR
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
  THEME
  ============================================================
  */

  const themeClass =
    theme === "light"
      ? "theme-light"
      : "theme-dark";

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <>
      <style>{`

        /* ====================================================
           GLOBAL
        ==================================================== */

        .antimate-page,
        .antimate-page * {
          box-sizing: border-box;
        }

        .antimate-page {
          --ai-bg:
            ${isDark ? "#090b10" : "#f7f9fc"};

          --ai-surface:
            ${isDark ? "#12161d" : "#ffffff"};

          --ai-surface-2:
            ${isDark ? "#181d25" : "#f1f4f8"};

          --ai-text:
            ${isDark ? "#f5f7fa" : "#101828"};

          --ai-text-soft:
            ${isDark ? "#c8ced8" : "#344054"};

          --ai-muted:
            ${isDark ? "#8d96a5" : "#667085"};

          --ai-border:
            ${isDark ? "#29313d" : "#e4e7ec"};

          --ai-input-bg:
            ${isDark ? "#10141a" : "#ffffff"};

          --ai-user-bg:
            ${isDark ? "#273142" : "#111827"};

          --ai-user-text:
            #ffffff;

          --ai-danger:
            #ef4444;

          --ai-success:
            #35c77a;

          width:
            100%;

          min-height:
            100vh;

          height:
            100%;

          background:
            var(--ai-bg);

          color:
            var(--ai-text);

          display:
            flex;

          flex-direction:
            column;

          position:
            relative;

          overflow:
            hidden;

          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          transition:
            background 0.25s ease,
            color 0.25s ease;
        }

        /* ====================================================
           FIXED HEADER
        ==================================================== */

        .antimate-header {
          position:
            fixed;

          top:
            0;

          left:
            0;

          right:
            0;

          height:
            76px;

          min-height:
            76px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          padding:
            0 25px;

          border-bottom:
            1px solid
            var(--ai-border);

          background:
            ${isDark
              ? "rgba(9, 11, 16, 0.94)"
              : "rgba(247, 249, 252, 0.94)"};

          z-index:
            100;

          backdrop-filter:
            blur(16px);

          -webkit-backdrop-filter:
            blur(16px);

          box-shadow:
            0 4px 18px
            ${isDark
              ? "rgba(0,0,0,0.18)"
              : "rgba(15,23,42,0.04)"};
        }

        .antimate-title-area {
          display:
            flex;

          align-items:
            center;

          gap:
            13px;
        }

        /* ====================================================
           O-SHAPED LOGO
        ==================================================== */

        .antimate-logo-o {
          position:
            relative;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-shrink:
            0;

          border-radius:
            50%;

          isolation:
            isolate;
        }

        .antimate-logo-o::before {
          content:
            "";

          position:
            absolute;

          inset:
            -5px;

          border-radius:
            50%;

          background:
            conic-gradient(
              from 0deg,
              #00c896,
              #00e5ff,
              #6366f1,
              #a855f7,
              #ec4899,
              #00c896
            );

          animation:
            antimateAIColorFlow
            3.5s linear infinite;

          filter:
            blur(8px);

          opacity:
            0.55;

          z-index:
            -2;
        }

        .antimate-logo-ring {
          width:
            100%;

          height:
            100%;

          padding:
            3px;

          border-radius:
            50%;

          position:
            relative;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            transparent;

          isolation:
            isolate;

          overflow:
            hidden;
        }

        .antimate-logo-ring::before {
          content:
            "";

          position:
            absolute;

          inset:
            0;

          border-radius:
            50%;

          background:
            conic-gradient(
              from 0deg,
              #00c896,
              #00e5ff,
              #6366f1,
              #a855f7,
              #ec4899,
              #00c896
            );

          animation:
            antimateAIColorFlow
            3.5s linear infinite;

          z-index:
            -1;
        }

        .antimate-logo-core {
          width:
            calc(100% - 6px);

          height:
            calc(100% - 6px);

          border-radius:
            50%;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          position:
            relative;

          z-index:
            2;

          box-shadow:
            inset
            0 0 0 1px
            rgba(255,255,255,0.08);

          transition:
            background 0.25s ease,
            color 0.25s ease;

          transform:
            none !important;
        }

        .theme-dark
        .antimate-logo-core {
          background:
            #f8fafc;

          color:
            #111827;
        }

        .theme-light
        .antimate-logo-core {
          background:
            #101828;

          color:
            #ffffff;
        }

        .antimate-logo-core span {
          display:
            block;

          font-size:
            38%;

          font-weight:
            800;

          line-height:
            1;

          letter-spacing:
            -0.5px;

          transform:
            none !important;

          animation:
            none !important;
        }

        @keyframes antimateAIColorFlow {
          from {
            transform:
              rotate(0deg);
          }

          to {
            transform:
              rotate(360deg);
          }
        }

        /* ====================================================
           TITLE
        ==================================================== */

        .antimate-title {
          font-size:
            17px;

          font-weight:
            750;

          letter-spacing:
            -0.3px;

          color:
            var(--ai-text);
        }

        .antimate-subtitle {
          margin-top:
            3px;

          font-size:
            12px;

          color:
            var(--ai-muted);
        }

        /* ====================================================
           STATUS
        ==================================================== */

        .antimate-status {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;

          font-size:
            12px;

          color:
            var(--ai-muted);
        }

        .antimate-status-dot {
          width:
            8px;

          height:
            8px;

          border-radius:
            50%;

          background:
            var(--ai-success);

          box-shadow:
            0 0 0 4px
            ${isDark
              ? "rgba(53,199,122,0.10)"
              : "rgba(53,199,122,0.12)"};
        }

        /* ====================================================
           CHAT
        ==================================================== */

        .antimate-chat {
          flex:
            1;

          width:
            100%;

          max-width:
            980px;

          margin:
            0 auto;

          overflow-y:
            auto;

          padding:
            108px 24px 180px;

          scrollbar-width:
            thin;
        }

        .antimate-chat::-webkit-scrollbar {
          width:
            6px;
        }

        .antimate-chat::-webkit-scrollbar-thumb {
          background:
            var(--ai-border);

          border-radius:
            20px;
        }

        /* ====================================================
           WELCOME
        ==================================================== */

        .antimate-welcome {
          min-height:
            calc(100vh - 250px);

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          text-align:
            center;

          padding:
            35px 20px;
        }

        .antimate-welcome h1 {
          margin:
            0;

          font-size:
            29px;

          font-weight:
            760;

          letter-spacing:
            -0.8px;

          color:
            var(--ai-text);
        }

        .antimate-welcome p {
          max-width:
            540px;

          margin:
            12px 0 0;

          color:
            var(--ai-muted);

          line-height:
            1.7;

          font-size:
            14px;
        }

        /* ====================================================
           MESSAGE
        ==================================================== */

        .antimate-message {
          width:
            100%;

          display:
            flex;

          margin-bottom:
            25px;

          gap:
            10px;
        }

        .antimate-message.user {
          justify-content:
            flex-end;
        }

        .antimate-message.assistant {
          justify-content:
            flex-start;
        }

        /* ====================================================
           AVATARS
        ==================================================== */

        .antimate-avatar {
          width:
            34px;

          height:
            34px;

          min-width:
            34px;

          border-radius:
            50%;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          margin-top:
            21px;

          overflow:
            hidden;
        }

        .antimate-avatar-user {
          background:
            var(--ai-user-bg);

          color:
            white;

          font-size:
            11px;

          font-weight:
            750;

          border:
            1px solid
            ${isDark
              ? "#3b4656"
              : "#1f2937"};
        }

        .antimate-avatar-ai {
          background:
            transparent;
        }

        .antimate-avatar-ai
        .antimate-logo-o {
          width:
            34px !important;

          height:
            34px !important;
        }

        /* ====================================================
           MESSAGE CONTENT
        ==================================================== */

        .antimate-message-content {
          max-width:
            min(75%, 700px);

          display:
            flex;

          flex-direction:
            column;
        }

        .antimate-message.user
        .antimate-message-content {
          align-items:
            flex-end;
        }

        .antimate-message.assistant
        .antimate-message-content {
          align-items:
            flex-start;
        }

        .antimate-message-label {
          font-size:
            11px;

          font-weight:
            650;

          color:
            var(--ai-muted);

          margin:
            0 8px 7px;
        }

        /* ====================================================
           BUBBLE
        ==================================================== */

        .antimate-bubble {
          padding:
            13px 16px;

          border-radius:
            18px;

          font-size:
            14px;

          line-height:
            1.65;

          white-space:
            pre-wrap;

          overflow-wrap:
            anywhere;
        }

        .antimate-message.user
        .antimate-bubble {
          background:
            var(--ai-user-bg);

          color:
            var(--ai-user-text);

          border-bottom-right-radius:
            5px;

          box-shadow:
            0 5px 18px
            ${isDark
              ? "rgba(0,0,0,0.16)"
              : "rgba(15,23,42,0.08)"};
        }

        .antimate-message.assistant
        .antimate-bubble {
          background:
            var(--ai-surface);

          border:
            1px solid
            var(--ai-border);

          color:
            var(--ai-text);

          border-bottom-left-radius:
            5px;

          box-shadow:
            0 4px 18px
            ${isDark
              ? "rgba(0,0,0,0.12)"
              : "rgba(15,23,42,0.04)"};
        }

        /* ====================================================
           VOICE MARK
        ==================================================== */

        .antimate-voice-mark {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          font-size:
            11px;

          margin-bottom:
            8px;

          opacity:
            0.82;
        }

        .antimate-wave-mini {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            2px;

          height:
            14px;
        }

        .antimate-wave-mini span {
          width:
            2px;

          border-radius:
            4px;

          background:
            currentColor;
        }

        .antimate-wave-mini
        span:nth-child(1) {
          height:
            5px;
        }

        .antimate-wave-mini
        span:nth-child(2) {
          height:
            10px;
        }

        .antimate-wave-mini
        span:nth-child(3) {
          height:
            7px;
        }

        .antimate-wave-mini
        span:nth-child(4) {
          height:
            13px;
        }

        .antimate-wave-mini
        span:nth-child(5) {
          height:
            6px;
        }

        /* ====================================================
           AI VOICE CONTROLS
        ==================================================== */

        .antimate-voice-controls {
          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          margin-top:
            9px;

          padding:
            7px 10px;

          border:
            1px solid
            var(--ai-border);

          border-radius:
            13px;

          background:
            var(--ai-surface);

          width:
            fit-content;
        }

        .antimate-replay {
          width:
            32px;

          height:
            32px;

          border:
            none;

          border-radius:
            50%;

          background:
            linear-gradient(
              135deg,
              #6366f1,
              #a855f7
            );

          color:
            #ffffff;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          cursor:
            pointer;

          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .antimate-replay:hover {
          transform:
            scale(1.06);
        }

        .antimate-replay:disabled {
          opacity:
            0.55;

          cursor:
            default;

          transform:
            none;
        }

        .antimate-voice-status {
          font-size:
            11px;

          color:
            var(--ai-muted);

          min-width:
            42px;
        }

        /* ====================================================
           THINKING
           
           Positioned approximately 1/3 from bottom.
        ==================================================== */

        .antimate-thinking {
          position:
            fixed;

          left:
            50%;

          bottom:
            33vh;

          transform:
            translateX(-50%);

          z-index:
            90;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            10px;

          min-width:
            min(340px, calc(100vw - 30px));

          max-width:
            calc(100vw - 30px);

          padding:
            11px 16px;

          border-radius:
            14px;

          color:
            var(--ai-muted);

          background:
            ${isDark
              ? "rgba(18,22,29,0.92)"
              : "rgba(255,255,255,0.94)"};

          border:
            1px solid
            var(--ai-border);

          box-shadow:
            0 12px 35px
            ${isDark
              ? "rgba(0,0,0,0.30)"
              : "rgba(15,23,42,0.10)"};

          backdrop-filter:
            blur(14px);

          -webkit-backdrop-filter:
            blur(14px);

          font-size:
            13px;

          animation:
            antimate-thinking-in
            0.25s ease;
        }

        @keyframes antimate-thinking-in {
          from {
            opacity:
              0;

            transform:
              translateX(-50%)
              translateY(8px);
          }

          to {
            opacity:
              1;

            transform:
              translateX(-50%)
              translateY(0);
          }
        }

        .antimate-thinking-dots {
          display:
            flex;

          gap:
            4px;

          flex-shrink:
            0;
        }

        .antimate-thinking-dots span {
          width:
            5px;

          height:
            5px;

          border-radius:
            50%;

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
            opacity:
              0.25;

            transform:
              translateY(0);
          }

          30% {
            opacity:
              1;

            transform:
              translateY(-3px);
          }
        }

        /* ====================================================
           COMPOSER WRAPPER
        ==================================================== */

        .antimate-composer-wrapper {
          position:
            fixed;

          left:
            0;

          right:
            0;

          bottom:
            0;

          z-index:
            110;

          padding:
            16px 18px 19px;

          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--ai-bg) 28%
            );

          pointer-events:
            none;
        }

        /* ====================================================
           COMPOSER
        ==================================================== */

        .antimate-composer {
          pointer-events:
            auto;

          width:
            100%;

          max-width:
            920px;

          margin:
            0 auto;

          display:
            flex;

          align-items:
            flex-end;

          gap:
            9px;

          padding:
            8px 9px 8px 15px;

          background:
            var(--ai-input-bg);

          border:
            1px solid
            var(--ai-border);

          border-radius:
            20px;

          box-shadow:
            0 12px 35px
            ${isDark
              ? "rgba(0,0,0,0.35)"
              : "rgba(15,23,42,0.10)"};

          transition:
            background 0.25s ease,
            border-color 0.25s ease;
        }

        .antimate-input {
          flex:
            1;

          resize:
            none;

          border:
            none;

          outline:
            none;

          background:
            transparent;

          color:
            var(--ai-text);

          font-family:
            inherit;

          font-size:
            14px;

          line-height:
            1.5;

          min-height:
            38px;

          max-height:
            120px;

          padding:
            9px 2px;

          overflow-y:
            auto;
        }

        .antimate-input::placeholder {
          color:
            var(--ai-muted);
        }

        /* ====================================================
           ACTION BUTTON
        ==================================================== */

        .antimate-action-button {
          width:
            43px;

          height:
            43px;

          min-width:
            43px;

          border:
            none;

          border-radius:
            50%;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          cursor:
            pointer;

          background:
            linear-gradient(
              135deg,
              #6366f1,
              #a855f7
            );

          color:
            #ffffff;

          box-shadow:
            0 5px 16px
            rgba(99,102,241,0.24);

          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .antimate-action-button:hover {
          transform:
            scale(1.05);
        }

        .antimate-action-button:disabled {
          opacity:
            0.45;

          cursor:
            default;

          transform:
            none;
        }

        /* ====================================================
           RECORDING BUTTON
        ==================================================== */

        .antimate-action-button.recording {
          background:
            linear-gradient(
              135deg,
              #ef4444,
              #dc2626
            );

          animation:
            antimate-record-pulse
            1.4s infinite;
        }

        @keyframes antimate-record-pulse {
          0% {
            box-shadow:
              0 0 0 0
              rgba(239,68,68,0.35);
          }

          70% {
            box-shadow:
              0 0 0 11px
              rgba(239,68,68,0);
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(239,68,68,0);
          }
        }

        /* ====================================================
           RECORDING BUTTON WHILE STARTING / STOPPING
        ==================================================== */

        .antimate-action-button.recording-loading {
          background:
            linear-gradient(
              135deg,
              #475569,
              #64748b
            );

          cursor:
            wait;
        }

        /* ====================================================
           RECORDING STATUS
        ==================================================== */

        .antimate-recording-area {
          position:
            fixed;

          left:
            50%;

          bottom:
            91px;

          transform:
            translateX(-50%);

          z-index:
            120;

          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          padding:
            10px 15px;

          border-radius:
            14px;

          background:
            var(--ai-surface);

          border:
            1px solid
            var(--ai-border);

          box-shadow:
            0 10px 30px
            ${isDark
              ? "rgba(0,0,0,0.35)"
              : "rgba(15,23,42,0.12)"};

          font-size:
            12px;
        }

        .antimate-recording-dot {
          width:
            8px;

          height:
            8px;

          border-radius:
            50%;

          background:
            #ef4444;

          animation:
            antimate-recording-blink
            1s infinite;
        }

        @keyframes antimate-recording-blink {
          0%,
          100% {
            opacity:
              1;
          }

          50% {
            opacity:
              0.3;
          }
        }

        .antimate-countdown {
          font-weight:
            750;

          font-variant-numeric:
            tabular-nums;

          min-width:
            38px;

          color:
            var(--ai-text);
        }

        .antimate-recording-hint {
          color:
            var(--ai-muted);
        }

        /* ====================================================
           PRE-RECORDING STATUS
        ==================================================== */

        .antimate-starting-recording {
          position:
            fixed;

          left:
            50%;

          bottom:
            91px;

          transform:
            translateX(-50%);

          z-index:
            120;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          padding:
            10px 15px;

          border-radius:
            14px;

          background:
            var(--ai-surface);

          border:
            1px solid
            var(--ai-border);

          box-shadow:
            0 10px 30px
            ${isDark
              ? "rgba(0,0,0,0.35)"
              : "rgba(15,23,42,0.12)"};

          font-size:
            12px;

          color:
            var(--ai-muted);
        }

        .antimate-starting-spinner {
          width:
            13px;

          height:
            13px;

          border:
            2px solid
            var(--ai-border);

          border-top-color:
            #6366f1;

          border-radius:
            50%;

          animation:
            antimate-spin
            0.8s linear infinite;
        }

        @keyframes antimate-spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        /* ====================================================
           ERROR
        ==================================================== */

        .antimate-error {
          position:
            fixed;

          left:
            50%;

          bottom:
            150px;

          transform:
            translateX(-50%);

          z-index:
            130;

          max-width:
            calc(100% - 30px);

          padding:
            10px 14px;

          border-radius:
            11px;

          background:
            ${isDark
              ? "#351719"
              : "#fff1f2"};

          color:
            ${isDark
              ? "#fecaca"
              : "#b42318"};

          border:
            1px solid
            ${isDark
              ? "#68282d"
              : "#fecdca"};

          font-size:
            12px;

          box-shadow:
            0 8px 25px
            ${isDark
              ? "rgba(0,0,0,0.25)"
              : "rgba(15,23,42,0.08)"};
        }

        .antimate-empty-space {
          height:
            10px;
        }

        /* ====================================================
           MOBILE
        ==================================================== */

        @media (max-width: 700px) {

          .antimate-header {
            height:
              64px;

            min-height:
              64px;

            padding:
              0 15px;
          }

          .antimate-title {
            font-size:
              15px;
          }

          .antimate-subtitle {
            font-size:
              11px;
          }

          .antimate-status {
            display:
              none;
          }

          .antimate-chat {
            padding:
              88px 12px 145px;
          }

          .antimate-message-content {
            max-width:
              82%;
          }

          .antimate-avatar {
            width:
              30px;

            height:
              30px;

            min-width:
              30px;
          }

          .antimate-avatar-ai
          .antimate-logo-o {
            width:
              30px !important;

            height:
              30px !important;
          }

          .antimate-bubble {
            font-size:
              13.5px;

            padding:
              11px 13px;
          }

          .antimate-welcome {
            min-height:
              calc(100vh - 230px);

            padding:
              25px 12px;
          }

          .antimate-welcome h1 {
            font-size:
              23px;
          }

          .antimate-welcome p {
            font-size:
              13px;

            line-height:
              1.6;
          }

          .antimate-composer-wrapper {
            padding:
              10px 10px
              calc(
                10px +
                env(safe-area-inset-bottom)
              );
          }

          .antimate-composer {
            border-radius:
              17px;

            padding-left:
              13px;
          }

          .antimate-action-button {
            width:
              41px;

            height:
              41px;

            min-width:
              41px;
          }

          .antimate-recording-area,
          .antimate-starting-recording {
            bottom:
              79px;

            max-width:
              calc(100% - 24px);

            white-space:
              nowrap;
          }

          .antimate-recording-hint {
            display:
              none;
          }

          .antimate-thinking {
            bottom:
              33vh;

            min-width:
              auto;

            width:
              max-content;

            max-width:
              calc(100vw - 24px);

            font-size:
              12px;
          }

          .antimate-error {
            bottom:
              135px;
          }
        }

        /* ====================================================
           SMALL MOBILE
        ==================================================== */

        @media (max-width: 420px) {

          .antimate-message-content {
            max-width:
              86%;
          }

          .antimate-header {
            padding:
              0 12px;
          }

          .antimate-chat {
            padding-left:
              9px;

            padding-right:
              9px;
          }
        }

        /* ====================================================
           REDUCED MOTION
        ==================================================== */

        @media (prefers-reduced-motion: reduce) {

          .antimate-logo-o::before,
          .antimate-logo-ring::before,
          .antimate-action-button.recording,
          .antimate-recording-dot,
          .antimate-thinking-dots span,
          .antimate-starting-spinner {
            animation:
              none !important;
          }

          .antimate-logo-core,
          .antimate-logo-core span {
            transform:
              none !important;
          }
        }

      `}</style>

      <div
        className={`antimate-page ${themeClass}`}
        data-theme={theme}
        data-language={language}
      >

        {/* ==================================================
            FIXED HEADER
        ================================================== */}

        <header className="antimate-header">

          <div className="antimate-title-area">

            <AntimateLogo
              size={42}
            />

            <div>

              <div className="antimate-title">
                ANTIMATE AI
              </div>

              <div className="antimate-subtitle">
                {language === "rw"
                  ? "Umufasha w'ubwenge"
                  : "Intelligent Assistant"}
              </div>

            </div>

          </div>

          <div className="antimate-status">

            <span className="antimate-status-dot" />

            {language === "rw"
              ? "Iri gukora"
              : "Online"}

          </div>

        </header>

        {/* ==================================================
            CHAT
        ================================================== */}

        <main className="antimate-chat">

          {messages.length === 0 &&
            !thinkingText && (
              <div className="antimate-welcome">

                <h1>
                  {language === "rw"
                    ? "Muraho, ndi ANTIMATE AI"
                    : "Hello, I'm ANTIMATE AI"}
                </h1>

                <p>
                  {language === "rw"
                    ? "Andika ubutumwa cyangwa ukoreshe microphone uvuge mu Kinyarwanda. Niteguye kugufasha."
                    : "Write a message or use the microphone to speak. I'm here to help you."}
                </p>

              </div>
            )}

          {messages.map(
            (message) => (
              <div
                key={message.id}
                className={`antimate-message ${
                  message.role ===
                  "user"
                    ? "user"
                    : "assistant"
                }`}
              >

                {/* ==================================================
                    AI AVATAR
                ================================================== */}

                {message.role ===
                  "assistant" && (
                  <div className="antimate-avatar antimate-avatar-ai">

                    <AntimateLogo
                      size={34}
                    />

                  </div>
                )}

                <div className="antimate-message-content">

                  <div className="antimate-message-label">

                    {message.role ===
                    "user"
                      ? language ===
                        "rw"
                        ? "Wowe"
                        : "You"
                      : "ANTIMATE"}

                  </div>

                  <div className="antimate-bubble">

                    {message.voice && (
                      <div className="antimate-voice-mark">

                        <VoiceWave />

                        {message.role ===
                        "user"
                          ? language ===
                            "rw"
                            ? "Ubutumwa bw'amajwi"
                            : "Voice message"
                          : "ANTIMATE Voice"}

                      </div>
                    )}

                    {message.text}

                  </div>

                  {/* ==================================================
                      AI VOICE CONTROLS
                  ================================================== */}

                  {message.role ===
                    "assistant" &&
                    message.audioUrl && (
                      <div className="antimate-voice-controls">

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
                            language ===
                            "rw"
                              ? "Subiramo ijwi"
                              : "Replay voice"
                          }
                          title={
                            language ===
                            "rw"
                              ? "Subiramo"
                              : "Replay"
                          }
                        >

                          {audioPlayingId ===
                          message.id ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="6"
                                y="5"
                                width="4"
                                height="14"
                                rx="1"
                              />

                              <rect
                                x="14"
                                y="5"
                                width="4"
                                height="14"
                                rx="1"
                              />
                            </svg>
                          ) : (
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          )}

                        </button>

                        <span className="antimate-voice-status">

                          {audioPlayingId ===
                          message.id
                            ? language ===
                              "rw"
                              ? "Irimo..."
                              : "Playing"
                            : language ===
                              "rw"
                            ? "Subiramo"
                            : "Replay"}

                        </span>

                      </div>
                    )}

                </div>

                {/* ==================================================
                    USER AVATAR
                ================================================== */}

                {message.role ===
                  "user" && (
                  <div className="antimate-avatar antimate-avatar-user">
                    YOU
                  </div>
                )}

              </div>
            )
          )}

          <div
            ref={messagesEndRef}
            className="antimate-empty-space"
          />

        </main>

        {/* ==================================================
            THINKING
            Positioned ~1/3 from bottom
        ================================================== */}

        {thinkingText && (
          <div className="antimate-thinking">

            <div className="antimate-thinking-dots">
              <span />
              <span />
              <span />
            </div>

            <span>
              {thinkingText}
            </span>

          </div>
        )}

        {/* ==================================================
            STARTING RECORDING
        ================================================== */}

        {isStartingRecording && (
          <div className="antimate-starting-recording">

            <span className="antimate-starting-spinner" />

            <span>
              {language === "rw"
                ? "Tegereza gato..."
                : "Get ready..."}
            </span>

          </div>
        )}

        {/* ==================================================
            RECORDING STATUS
        ================================================== */}

        {isRecording && (
          <div className="antimate-recording-area">

            <span className="antimate-recording-dot" />

            <span>
              {isStoppingRecording
                ? language === "rw"
                  ? "Ndahagarika..."
                  : "Stopping..."
                : language === "rw"
                ? "Ndakumva..."
                : "Listening..."}
            </span>

            <span className="antimate-countdown">
              {formatRecordingTime(
                recordingSeconds
              )}
            </span>

            {!isStoppingRecording && (
              <span className="antimate-recording-hint">
                {language === "rw"
                  ? "kanda microphone guhagarika"
                  : "press microphone to stop"}
              </span>
            )}

          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {recordingError && (
          <div className="antimate-error">
            {recordingError}
          </div>
        )}

        {/* ==================================================
            FIXED COMPOSER
        ================================================== */}

        <div className="antimate-composer-wrapper">

          <div className="antimate-composer">

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
                language === "rw"
                  ? "Andika ubutumwa..."
                  : "Write a message..."
              }
              rows={1}
              disabled={
                isSending ||
                isRecording ||
                isStartingRecording ||
                isStoppingRecording
              }
              aria-label={
                language === "rw"
                  ? "Ubutumwa"
                  : "Message"
              }
            />

            {/* ==================================================
                EMPTY = VOICE
            ================================================== */}

            {!inputText.trim() ? (
              <button
                type="button"
                className={`antimate-action-button ${
                  isRecording
                    ? "recording"
                    : isStartingRecording ||
                      isStoppingRecording
                    ? "recording-loading"
                    : ""
                }`}
                onClick={
                  isRecording
                    ? stopVoiceRecording
                    : startVoiceRecording
                }
                disabled={
                  isSending ||
                  isStartingRecording ||
                  isStoppingRecording
                }
                aria-label={
                  isRecording
                    ? "Stop recording"
                    : "Start voice recording"
                }
                title={
                  isRecording
                    ? "Stop"
                    : language ===
                      "rw"
                    ? "Vuga"
                    : "Speak"
                }
              >

                {isRecording ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="7"
                      y="7"
                      width="10"
                      height="10"
                      rx="2"
                    />
                  </svg>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M4 10v4" />
                    <path d="M8 7v10" />
                    <path d="M12 4v16" />
                    <path d="M16 7v10" />
                    <path d="M20 10v4" />
                  </svg>
                )}

              </button>
            ) : (
              /* ==================================================
                 TEXT = SEND
              ================================================== */

              <button
                type="button"
                className="antimate-action-button"
                onClick={
                  sendText
                }
                disabled={
                  isSending ||
                  isRecording ||
                  isStartingRecording ||
                  isStoppingRecording ||
                  !inputText.trim()
                }
                aria-label="Send message"
                title={
                  language === "rw"
                    ? "Ohereza"
                    : "Send"
                }
              >

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>

              </button>
            )}

          </div>

        </div>

      </div>
    </>
  );
}