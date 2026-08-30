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
- 30s countdown
- Voice transcript appears on USER side
- AI voice answer appears on AI side
- AI voice automatically plays once
- Replay button remains available
- Fixed bottom composer
- Voice icon when text is empty
- Send icon when user is typing
- Thinking/status messages
- ANTIMATE O-SHAPED animated logo
- AI text inside logo stays COMPLETELY STATIC
- Logo does NOT appear in center welcome area
- Fixed header
- Theme controlled by AppSettingsContext
- Language controlled by AppSettingsContext
- Native CSS only

NEW
------------------------------------------------------------
- Unique ANTIMATE UI sound system
- Send sound
- Recording start sound
- Recording stop sound
- No external audio files required
- Uses Web Audio API
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
    text,
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

  const audioRefs =
    useRef({});

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  /*
  ============================================================
  ANTIMATE UI SOUND ENGINE
  ============================================================
  
  IMPORTANT:
  ------------------------------------------------------------
  These sounds are generated locally by the browser.
  No .mp3 / .wav file is required.
  
  ANTIMATE has its own sound signature:
  
  START:
      low tone → rising harmonic → soft tail
  
  STOP:
      high tone → falling harmonic → soft tail
  
  SEND:
      short futuristic double chirp
  
  ============================================================
  */

  const audioContextRef =
    useRef(null);

  const getAudioContext = () => {
    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current =
          new AudioContext();
      }

      return audioContextRef.current;
    } catch (error) {
      console.warn(
        "ANTIMATE AudioContext error:",
        error
      );

      return null;
    }
  };

  /*
  ============================================================
  ANTIMATE SOUND
  ============================================================
  */

  const playAntimateSound = (
    type = "send"
  ) => {
    try {
      const ctx =
        getAudioContext();

      if (!ctx) {
        return;
      }

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now =
        ctx.currentTime;

      /*
      ========================================================
      MASTER GAIN
      ========================================================
      */

      const master =
        ctx.createGain();

      master.gain.setValueAtTime(
        0.0001,
        now
      );

      master.connect(
        ctx.destination
      );

      /*
      ========================================================
      HELPER
      ========================================================
      */

      const tone = ({
        frequency,
        start,
        duration,
        volume = 0.12,
        type = "sine",
        endFrequency = null,
      }) => {
        const oscillator =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        oscillator.type = type;

        oscillator.frequency.setValueAtTime(
          frequency,
          start
        );

        if (endFrequency) {
          oscillator.frequency.exponentialRampToValueAtTime(
            endFrequency,
            start + duration
          );
        }

        gain.gain.setValueAtTime(
          0.0001,
          start
        );

        gain.gain.exponentialRampToValueAtTime(
          volume,
          start + 0.008
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + duration
        );

        oscillator.connect(gain);
        gain.connect(master);

        oscillator.start(start);
        oscillator.stop(
          start + duration + 0.015
        );
      };

      /*
      ========================================================
      SEND SOUND
      ========================================================
      
      Futuristic ANTIMATE "transmit" signature:
      
          chirp 1
           ↓
        chirp 2
      
      ========================================================
      */

      if (type === "send") {
        tone({
          frequency: 620,
          start: now,
          duration: 0.075,
          volume: 0.075,
          type: "sine",
          endFrequency: 760,
        });

        tone({
          frequency: 860,
          start: now + 0.055,
          duration: 0.105,
          volume: 0.095,
          type: "sine",
          endFrequency: 1120,
        });

        tone({
          frequency: 1380,
          start: now + 0.105,
          duration: 0.055,
          volume: 0.035,
          type: "triangle",
          endFrequency: 1500,
        });

        master.gain.setValueAtTime(
          0.0001,
          now
        );

        master.gain.linearRampToValueAtTime(
          0.82,
          now + 0.01
        );

        master.gain.exponentialRampToValueAtTime(
          0.0001,
          now + 0.19
        );

        return;
      }

      /*
      ========================================================
      RECORD START
      ========================================================
      
      ANTIMATE activation:
      
      low → mid → high
      
      ========================================================
      */

      if (
        type === "record-start"
      ) {
        tone({
          frequency: 280,
          start: now,
          duration: 0.12,
          volume: 0.10,
          type: "sine",
          endFrequency: 390,
        });

        tone({
          frequency: 430,
          start: now + 0.075,
          duration: 0.12,
          volume: 0.085,
          type: "sine",
          endFrequency: 610,
        });

        tone({
          frequency: 720,
          start: now + 0.145,
          duration: 0.16,
          volume: 0.065,
          type: "triangle",
          endFrequency: 930,
        });

        master.gain.setValueAtTime(
          0.0001,
          now
        );

        master.gain.linearRampToValueAtTime(
          0.9,
          now + 0.015
        );

        master.gain.exponentialRampToValueAtTime(
          0.0001,
          now + 0.34
        );

        return;
      }

      /*
      ========================================================
      RECORD STOP
      ========================================================
      
      high → mid → low
      
      ========================================================
      */

      if (
        type === "record-stop"
      ) {
        tone({
          frequency: 760,
          start: now,
          duration: 0.11,
          volume: 0.085,
          type: "sine",
          endFrequency: 590,
        });

        tone({
          frequency: 520,
          start: now + 0.07,
          duration: 0.11,
          volume: 0.07,
          type: "sine",
          endFrequency: 390,
        });

        tone({
          frequency: 350,
          start: now + 0.135,
          duration: 0.14,
          volume: 0.055,
          type: "triangle",
          endFrequency: 250,
        });

        master.gain.setValueAtTime(
          0.0001,
          now
        );

        master.gain.linearRampToValueAtTime(
          0.85,
          now + 0.012
        );

        master.gain.exponentialRampToValueAtTime(
          0.0001,
          now + 0.32
        );

        return;
      }

      /*
      ========================================================
      DEFAULT ANTIMATE CLICK
      ========================================================
      */

      tone({
        frequency: 540,
        start: now,
        duration: 0.07,
        volume: 0.07,
        type: "sine",
        endFrequency: 650,
      });

      master.gain.setValueAtTime(
        0.0001,
        now
      );

      master.gain.linearRampToValueAtTime(
        0.7,
        now + 0.01
      );

      master.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.09
      );
    } catch (error) {
      console.warn(
        "ANTIMATE UI sound failed:",
        error
      );
    }
  };

  /*
  ============================================================
  AUTO SCROLL
  ============================================================
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
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

      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      Object.values(
        audioRefs.current
      ).forEach((audio) => {
        try {
          audio.pause();
          audio.src = "";
        } catch (_) {}
      });

      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
    };
  }, []);

  /*
  ============================================================
  THINKING
  ============================================================
  */

  const startThinking = (
    type = "text"
  ) => {
    if (type === "voice") {
      setThinkingText(
        language === "rw"
          ? "🎤 Ndumva ibyo uvuze..."
          : "🎤 Listening..."
      );

      return;
    }

    setThinkingText(
      language === "rw"
        ? "🧠 Ndigutekereza..."
        : "🧠 Thinking..."
    );
  };

  const stopThinking = () => {
    setThinkingText("");
  };

  /*
  ============================================================
  RECORDING TIMER
  ============================================================
  */

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
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
                stopVoiceRecording(
                  true
                );
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
  START VOICE RECORDING
  ============================================================
  */

  const startVoiceRecording =
    async () => {
      if (
        isSending ||
        isRecording
      ) {
        return;
      }

      /*
      --------------------------------------------------------
      PLAY SOUND IMMEDIATELY
      --------------------------------------------------------
      */

      playAntimateSound(
        "record-start"
      );

      setRecordingError("");

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

        startRecordingTimer();
      } catch (error) {
        console.error(
          "Microphone error:",
          error
        );

        /*
        --------------------------------------------------------
        If microphone failed, give a short stop/reset sound.
        --------------------------------------------------------
        */

        playAntimateSound(
          "record-stop"
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
  STOP RECORDING
  ============================================================
  */

  const stopVoiceRecording =
    (automatic = false) => {
      /*
      --------------------------------------------------------
      Do not play sound twice.
      
      This function can be called:
      - manually by user
      - automatically at 30 seconds
      --------------------------------------------------------
      */

      if (
        !mediaRecorderRef.current &&
        !isRecording
      ) {
        return;
      }

      playAntimateSound(
        "record-stop"
      );

      stopRecordingTimer();

      const recorder =
        mediaRecorderRef.current;

      if (!recorder) {
        setIsRecording(false);
        setRecordingSeconds(0);

        return;
      }

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
      }, 150);
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
      isRecording
    ) {
      return;
    }

    /*
    --------------------------------------------------------
    ANTIMATE SEND SOUND
    --------------------------------------------------------
    
    Sound happens BEFORE the network request.
    --------------------------------------------------------
    */

    playAntimateSound("send");

    setInputText("");

    if (inputRef.current) {
      inputRef.current.style.height =
        "auto";
    }

    addUserMessage({
      text: cleanText,
      voice: false,
    });

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
      } finally {
        stopThinking();
        setIsSending(false);
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
  THEME VARIABLES
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

          width: 100%;
          min-height: 100vh;
          height: 100%;

          background:
            var(--ai-bg);

          color:
            var(--ai-text);

          display: flex;
          flex-direction: column;

          position: relative;

          overflow: hidden;

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
          position: fixed;

          top: 0;
          left: 0;
          right: 0;

          height: 76px;
          min-height: 76px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 25px;

          border-bottom:
            1px solid
            var(--ai-border);

          background:
            ${isDark
              ? "rgba(9, 11, 16, 0.94)"
              : "rgba(247, 249, 252, 0.94)"};

          z-index: 100;

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
          display: flex;
          align-items: center;
          gap: 13px;
        }

        /* ====================================================
           O-SHAPED LOGO
        ==================================================== */

        .antimate-logo-o {
          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 50%;

          isolation: isolate;
        }

        .antimate-logo-o::before {
          content: "";

          position: absolute;

          inset: -5px;

          border-radius: 50%;

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
          width: 100%;
          height: 100%;

          padding: 3px;

          border-radius: 50%;

          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            transparent;

          isolation: isolate;

          overflow: hidden;
        }

        .antimate-logo-ring::before {
          content: "";

          position: absolute;

          inset: 0;

          border-radius: 50%;

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
          width: calc(100% - 6px);
          height: calc(100% - 6px);

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;

          z-index: 2;

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
          font-size: 17px;

          font-weight: 750;

          letter-spacing:
            -0.3px;

          color:
            var(--ai-text);
        }

        .antimate-subtitle {
          margin-top: 3px;

          font-size: 12px;

          color:
            var(--ai-muted);
        }

        /* ====================================================
           STATUS
        ==================================================== */

        .antimate-status {
          display: flex;
          align-items: center;
          gap: 7px;

          font-size: 12px;

          color:
            var(--ai-muted);
        }

        .antimate-status-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

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
          flex: 1;

          width: 100%;

          max-width: 980px;

          margin:
            0 auto;

          overflow-y: auto;

          padding:
            108px 24px 160px;

          scrollbar-width:
            thin;
        }

        .antimate-chat::-webkit-scrollbar {
          width: 6px;
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

          display: flex;

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
          width: 100%;

          display: flex;

          margin-bottom:
            25px;

          gap: 10px;
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
        ==================================================== */

        .antimate-thinking {
          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          color:
            var(--ai-muted);

          font-size:
            13px;

          margin:
            5px 0 22px 45px;
        }

        .antimate-thinking-dots {
          display:
            flex;

          gap:
            3px;
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

        .antimate-action-button:active {
          transform:
            scale(0.94);
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

          .antimate-recording-area {
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
            margin-left:
              40px;
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
          .antimate-thinking-dots span {
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
                          : language ===
                            "rw"
                          ? "ANTIMATE Voice"
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

          {/* ==================================================
              THINKING
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

          <div
            ref={messagesEndRef}
            className="antimate-empty-space"
          />

        </main>

        {/* ==================================================
            RECORDING STATUS
        ================================================== */}

        {isRecording && (
          <div className="antimate-recording-area">

            <span className="antimate-recording-dot" />

            <span>
              {language === "rw"
                ? "Ndakumva..."
                : "Listening..."}
            </span>

            <span className="antimate-countdown">
              {formatRecordingTime(
                recordingSeconds
              )}
            </span>

            <span className="antimate-recording-hint">
              {language === "rw"
                ? "kanda microphone guhagarika"
                : "press microphone to stop"}
            </span>

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
                isRecording
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
                    : ""
                }`}
                onClick={
                  isRecording
                    ? stopVoiceRecording
                    : startVoiceRecording
                }
                disabled={
                  isSending
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