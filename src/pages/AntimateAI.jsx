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
TEXT
- Text chat
- Send button
- Professional send sound

NORMAL VOICE
- Click microphone < 5 seconds
- Start recording
- Click again to stop
- 30 second maximum
- Professional 2s start/stop sounds

LIVE VOICE
- Hold microphone for >= 5 seconds
- Release after 5s
- Microphone remains active
- Automatic silence detection
- 1.8 seconds silence => automatic send
- AI answer plays automatically
- After AI answer finishes => microphone opens again
- Continuous live conversation

THINKING MESSAGES
- NO hard-coded thinking phrases
- Thinking messages come from backend
- Language-aware backend messages
- Separate text / voice messages
- Automatically rotates every 3 seconds
- Backend can update messages dynamically

UX
- Auto scroll after user sends
- Thinking animation around 1/3 from bottom
- AI voice replay
- Theme support
- Kinyarwanda / English
- Native CSS only
- O-shaped ANTIMATE logo
============================================================
*/

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const ANTIMATE_VOICE_ENDPOINT =
  `${API_BASE}/api/antimate/voice`;

const ANTIMATE_TEXT_ENDPOINT =
  `${API_BASE}/api/antimate/chat`;

/*
============================================================
BACKEND THINKING MESSAGES
============================================================

IMPORTANT:
These messages are NOT hard-coded anymore.

Expected backend endpoint:

GET /api/antimate/messages?language=rw&type=thinking

Example response:

{
  "success": true,
  "messages": [
    "Aah, reka ndebe neza iki kibazo...",
    "Ndimo kubisesengura...",
    "Reka nshake igisubizo cyiza...",
    "Mpa akanya gato..."
  ]
}

The parser below also accepts:

{
  "thinking_messages": [...]
}

or:

{
  "data": {
    "messages": [...]
  }
}

or:

{
  "data": {
    "thinking_messages": [...]
  }
}
============================================================
*/

const ANTIMATE_MESSAGES_ENDPOINT =
  `${API_BASE}/api/antimate/messages`;

const MAX_RECORDING_SECONDS = 30;

/*
============================================================
LIVE VOICE CONFIGURATION
============================================================
*/

const LIVE_HOLD_TRIGGER_MS = 5000;

const LIVE_SILENCE_MS = 1800;

/*
------------------------------------------------------------
Audio analysis settings
------------------------------------------------------------
*/

const SILENCE_RMS_THRESHOLD = 0.018;

const SPEECH_CONFIRM_MS = 180;

const AUDIO_ANALYSIS_INTERVAL_MS = 60;

/*
============================================================
PROFESSIONAL AUDIO ENGINE
============================================================
*/

let globalAudioContext = null;

const getAudioContext = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    if (!globalAudioContext) {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      globalAudioContext =
        new AudioContextClass();
    }

    return globalAudioContext;
  } catch (error) {
    console.warn(
      "AudioContext unavailable:",
      error
    );

    return null;
  }
};

/*
============================================================
PROFESSIONAL UI SOUND
============================================================
*/

const playProfessionalTone = ({
  type = "send",
}) => {
  try {
    const ctx = getAudioContext();

    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now =
      ctx.currentTime;

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
    ==========================================================
    SEND SOUND
    ==========================================================
    */

    if (type === "send") {
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
            ctx.createOscillator();

          const gain =
            ctx.createGain();

          oscillator.type =
            "sine";

          oscillator.frequency.setValueAtTime(
            frequency,
            now + index * 0.055
          );

          oscillator.frequency.exponentialRampToValueAtTime(
            frequency * 1.015,
            now +
              0.42 +
              index * 0.055
          );

          gain.gain.setValueAtTime(
            0.0001,
            now + index * 0.055
          );

          gain.gain.exponentialRampToValueAtTime(
            0.055,
            now +
              0.045 +
              index * 0.055
          );

          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now +
              0.58 +
              index * 0.055
          );

          oscillator.connect(gain);
          gain.connect(master);

          oscillator.start(
            now + index * 0.055
          );

          oscillator.stop(
            now +
              0.65 +
              index * 0.055
          );
        }
      );

      master.gain.exponentialRampToValueAtTime(
        0.75,
        now + 0.02
      );

      master.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.85
      );

      return;
    }

    /*
    ==========================================================
    RECORD START
    ==========================================================
    */

    if (type === "record-start") {
      const notes = [
        {
          frequency: 220,
          start: 0.00,
          duration: 0.55,
        },
        {
          frequency: 293.66,
          start: 0.22,
          duration: 0.65,
        },
        {
          frequency: 392,
          start: 0.48,
          duration: 0.85,
        },
        {
          frequency: 523.25,
          start: 0.78,
          duration: 1.05,
        },
      ];

      notes.forEach(
        ({
          frequency,
          start,
          duration,
        }) => {
          const oscillator =
            ctx.createOscillator();

          const gain =
            ctx.createGain();

          oscillator.type =
            "sine";

          oscillator.frequency.setValueAtTime(
            frequency,
            now + start
          );

          gain.gain.setValueAtTime(
            0.0001,
            now + start
          );

          gain.gain.exponentialRampToValueAtTime(
            0.045,
            now +
              start +
              0.10
          );

          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now +
              start +
              duration
          );

          oscillator.connect(gain);
          gain.connect(master);

          oscillator.start(
            now + start
          );

          oscillator.stop(
            now +
              start +
              duration +
              0.05
          );
        }
      );

      master.gain.exponentialRampToValueAtTime(
        0.85,
        now + 0.03
      );

      master.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 2.0
      );

      return;
    }

    /*
    ==========================================================
    RECORD STOP
    ==========================================================
    */

    if (type === "record-stop") {
      const notes = [
        {
          frequency: 523.25,
          start: 0.00,
          duration: 0.55,
        },
        {
          frequency: 392,
          start: 0.25,
          duration: 0.62,
        },
        {
          frequency: 293.66,
          start: 0.52,
          duration: 0.72,
        },
        {
          frequency: 220,
          start: 0.82,
          duration: 1.05,
        },
      ];

      notes.forEach(
        ({
          frequency,
          start,
          duration,
        }) => {
          const oscillator =
            ctx.createOscillator();

          const gain =
            ctx.createGain();

          oscillator.type =
            "sine";

          oscillator.frequency.setValueAtTime(
            frequency,
            now + start
          );

          oscillator.frequency.exponentialRampToValueAtTime(
            frequency * 0.98,
            now +
              start +
              duration
          );

          gain.gain.setValueAtTime(
            0.0001,
            now + start
          );

          gain.gain.exponentialRampToValueAtTime(
            0.045,
            now +
              start +
              0.09
          );

          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now +
              start +
              duration
          );

          oscillator.connect(gain);
          gain.connect(master);

          oscillator.start(
            now + start
          );

          oscillator.stop(
            now +
              start +
              duration +
              0.05
          );
        }
      );

      master.gain.exponentialRampToValueAtTime(
        0.82,
        now + 0.03
      );

      master.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 2.0
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

  const [messages, setMessages] =
    useState([]);

  const [inputText, setInputText] =
    useState("");

  const [isSending, setIsSending] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [isLiveVoice, setIsLiveVoice] =
    useState(false);

  const [liveListening, setLiveListening] =
    useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [holdSeconds, setHoldSeconds] =
    useState(0);

  const [thinkingText, setThinkingText] =
    useState("");

  const [audioPlayingId, setAudioPlayingId] =
    useState(null);

  const [recordingError, setRecordingError] =
    useState("");

  /*
  ============================================================
  BACKEND THINKING MESSAGES
  ============================================================
  */

  const [
    backendThinkingMessages,
    setBackendThinkingMessages,
  ] = useState([]);

  const [
    thinkingMessagesLoading,
    setThinkingMessagesLoading,
  ] = useState(false);

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

  const holdTimerRef =
    useRef(null);

  const holdStartRef =
    useRef(null);

  const holdActivatedRef =
    useRef(false);

  const pointerDownRef =
    useRef(false);

  const audioRefs =
    useRef({});

  const messagesEndRef =
    useRef(null);

  const chatRef =
    useRef(null);

  const inputRef =
    useRef(null);

  /*
  ============================================================
  THINKING REF
  ============================================================
  */

  const thinkingIntervalRef =
    useRef(null);

  /*
  ============================================================
  LIVE VOICE ANALYSIS REFS
  ============================================================
  */

  const audioContextRef =
    useRef(null);

  const analyserRef =
    useRef(null);

  const sourceNodeRef =
    useRef(null);

  const silenceCheckTimerRef =
    useRef(null);

  const silenceStartedAtRef =
    useRef(null);

  const speechStartedAtRef =
    useRef(null);

  const hasDetectedSpeechRef =
    useRef(false);

  const liveModeRef =
    useRef(false);

  const isRecordingRef =
    useRef(false);

  const isSendingRef =
    useRef(false);

  /*
  ============================================================
  KEEP REFS SYNCHRONIZED
  ============================================================
  */

  useEffect(() => {
    liveModeRef.current =
      isLiveVoice;
  }, [isLiveVoice]);

  useEffect(() => {
    isRecordingRef.current =
      isRecording;
  }, [isRecording]);

  useEffect(() => {
    isSendingRef.current =
      isSending;
  }, [isSending]);

  /*
  ============================================================
  LOAD THINKING MESSAGES FROM BACKEND
  ============================================================
  */

  useEffect(() => {
    let cancelled = false;

    const loadBackendThinkingMessages =
      async () => {
        setThinkingMessagesLoading(
          true
        );

        try {
          const url =
            `${ANTIMATE_MESSAGES_ENDPOINT}` +
            `?language=${encodeURIComponent(
              language || "rw"
            )}` +
            `&type=thinking`;

          const response =
            await fetch(url, {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
            });

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
                `Messages request failed (${response.status})`
            );
          }

          /*
          ======================================================
          ACCEPT MULTIPLE BACKEND RESPONSE FORMATS
          ======================================================
          */

          const candidates = [
            data?.messages,
            data?.thinking_messages,
            data?.data?.messages,
            data?.data?.thinking_messages,
          ];

          let foundMessages = [];

          for (
            const candidate of candidates
          ) {
            if (
              Array.isArray(candidate)
            ) {
              foundMessages =
                candidate;
              break;
            }
          }

          /*
          ------------------------------------------------------
          Backend may return objects:

          [
            { "text": "Aah..." },
            { "message": "Ndimo..." }
          ]
          ------------------------------------------------------
          */

          foundMessages =
            foundMessages
              .map((item) => {
                if (
                  typeof item ===
                  "string"
                ) {
                  return item.trim();
                }

                if (
                  item &&
                  typeof item ===
                    "object"
                ) {
                  return (
                    item.text ||
                    item.message ||
                    item.content ||
                    ""
                  ).trim();
                }

                return "";
              })
              .filter(Boolean);

          if (
            !cancelled
          ) {
            setBackendThinkingMessages(
              foundMessages
            );
          }
        } catch (error) {
          console.warn(
            "Could not load backend thinking messages:",
            error
          );

          if (
            !cancelled
          ) {
            /*
            ----------------------------------------------------
            IMPORTANT:
            
            We intentionally DO NOT insert the old hard-coded
            phrases here.
            
            If backend is unavailable, thinking area remains
            minimal instead of pretending that backend generated
            those messages.
            ----------------------------------------------------
            */

            setBackendThinkingMessages(
              []
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setThinkingMessagesLoading(
              false
            );
          }
        }
      };

    loadBackendThinkingMessages();

    return () => {
      cancelled = true;
    };
  }, [language]);

  /*
  ============================================================
  AUTO SCROLL
  ============================================================
  */

  const scrollToBottom =
    (behavior = "smooth") => {
      requestAnimationFrame(() => {
        const chat =
          chatRef.current;

        if (chat) {
          chat.scrollTo({
            top:
              chat.scrollHeight,
            behavior,
          });
        }

        messagesEndRef.current?.scrollIntoView(
          {
            behavior,
            block: "end",
          }
        );
      });
    };

  useEffect(() => {
    scrollToBottom("smooth");
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

      stopHoldTimer();

      stopSilenceDetection();

      stopThinking();

      if (
        mediaRecorderRef.current
      ) {
        try {
          if (
            mediaRecorderRef.current
              .state !==
            "inactive"
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

      if (
        sourceNodeRef.current
      ) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (_) {}
      }

      if (
        audioContextRef.current
      ) {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }

      Object.values(
        audioRefs.current
      ).forEach((audio) => {
        try {
          audio.pause();
          audio.src = "";
        } catch (_) {}
      });
    };
  }, []);

  /*
  ============================================================
  THINKING MESSAGES
  ============================================================
  */

  const getThinkingPhrases =
    () => {
      /*
      ----------------------------------------------------------
      ONLY BACKEND MESSAGES ARE USED.
      ----------------------------------------------------------
      */

      if (
        Array.isArray(
          backendThinkingMessages
        ) &&
        backendThinkingMessages.length >
          0
      ) {
        return backendThinkingMessages;
      }

      return [];
    };

  /*
  ============================================================
  START THINKING
  ============================================================
  */

  const startThinking =
    (type = "text") => {
      stopThinking();

      const phrases =
        getThinkingPhrases();

      /*
      ----------------------------------------------------------
      Backend has not supplied messages yet.
      ----------------------------------------------------------
      */

      if (
        !phrases.length
      ) {
        /*
        --------------------------------------------------------
        Do not display old frontend-generated phrases.
        
        Just display a minimal backend-state indicator.
        --------------------------------------------------------
        */

        setThinkingText(
          thinkingMessagesLoading
            ? "..."
            : "..."
        );

        return null;
      }

      let index = 0;

      setThinkingText(
        phrases[0]
      );

      thinkingIntervalRef.current =
        setInterval(() => {
          index =
            (index + 1) %
            phrases.length;

          setThinkingText(
            phrases[index]
          );
        }, 3000);

      return thinkingIntervalRef.current;
    };

  /*
  ============================================================
  STOP THINKING
  ============================================================
  */

  const stopThinking =
    (interval = null) => {
      if (
        interval
      ) {
        clearInterval(
          interval
        );
      }

      if (
        thinkingIntervalRef.current
      ) {
        clearInterval(
          thinkingIntervalRef.current
        );

        thinkingIntervalRef.current =
          null;
      }

      setThinkingText("");
    };

  /*
  ============================================================
  RECORDING TIMER
  ============================================================
  */

  const stopRecordingTimer =
    () => {
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

  const startRecordingTimer =
    () => {
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
                  stopVoiceRecording({
                    reason:
                      "max-time",
                  });
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
  HOLD TIMER
  ============================================================
  */

  const stopHoldTimer =
    () => {
      if (
        holdTimerRef.current
      ) {
        clearInterval(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;
      }
    };

  const startHoldTimer =
    () => {
      stopHoldTimer();

      holdStartRef.current =
        Date.now();

      holdActivatedRef.current =
        false;

      setHoldSeconds(0);

      holdTimerRef.current =
        setInterval(() => {
          if (
            !pointerDownRef.current
          ) {
            stopHoldTimer();
            return;
          }

          const elapsed =
            Date.now() -
            holdStartRef.current;

          const seconds =
            Math.min(
              5,
              Math.floor(
                elapsed / 1000
              )
            );

          setHoldSeconds(
            seconds
          );

          if (
            elapsed >=
            LIVE_HOLD_TRIGGER_MS
          ) {
            holdActivatedRef.current =
              true;

            stopHoldTimer();

            if (
              !isRecordingRef.current &&
              !isSendingRef.current
            ) {
              startVoiceRecording({
                liveMode: true,
              });
            }

            setIsLiveVoice(true);
          }
        }, 50);
    };

  /*
  ============================================================
  FORMAT TIME
  ============================================================
  */

  const formatRecordingTime =
    (seconds) => {
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

      return `${String(
        mins
      ).padStart(
        2,
        "0"
      )}:${String(
        secs
      ).padStart(
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
  SILENCE DETECTION
  ============================================================
  */

  const stopSilenceDetection =
    () => {
      if (
        silenceCheckTimerRef.current
      ) {
        clearInterval(
          silenceCheckTimerRef.current
        );

        silenceCheckTimerRef.current =
          null;
      }

      silenceStartedAtRef.current =
        null;

      speechStartedAtRef.current =
        null;
    };

  const startSilenceDetection =
    (stream) => {
      stopSilenceDetection();

      try {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (
          !AudioContextClass
        ) {
          console.warn(
            "Web Audio API not supported."
          );

          return;
        }

        const ctx =
          audioContextRef.current ||
          new AudioContextClass();

        audioContextRef.current =
          ctx;

        if (
          ctx.state ===
          "suspended"
        ) {
          ctx.resume().catch(
            () => {}
          );
        }

        const source =
          ctx.createMediaStreamSource(
            stream
          );

        const analyser =
          ctx.createAnalyser();

        analyser.fftSize =
          2048;

        analyser.smoothingTimeConstant =
          0.82;

        source.connect(
          analyser
        );

        sourceNodeRef.current =
          source;

        analyserRef.current =
          analyser;

        const data =
          new Uint8Array(
            analyser.fftSize
          );

        silenceCheckTimerRef.current =
          setInterval(() => {
            if (
              !isRecordingRef.current ||
              !liveModeRef.current
            ) {
              return;
            }

            analyser.getByteTimeDomainData(
              data
            );

            let sum = 0;

            for (
              let i = 0;
              i < data.length;
              i++
            ) {
              const normalized =
                (data[i] -
                  128) /
                128;

              sum +=
                normalized *
                normalized;
            }

            const rms =
              Math.sqrt(
                sum /
                  data.length
              );

            const now =
              Date.now();

            const speaking =
              rms >
              SILENCE_RMS_THRESHOLD;

            if (speaking) {
              if (
                !speechStartedAtRef.current
              ) {
                speechStartedAtRef.current =
                  now;
              }

              silenceStartedAtRef.current =
                null;

              if (
                now -
                  speechStartedAtRef.current >=
                SPEECH_CONFIRM_MS
              ) {
                hasDetectedSpeechRef.current =
                  true;

                setLiveListening(
                  true
                );
              }
            } else {
              speechStartedAtRef.current =
                null;

              if (
                !hasDetectedSpeechRef.current
              ) {
                return;
              }

              if (
                !silenceStartedAtRef.current
              ) {
                silenceStartedAtRef.current =
                  now;

                setLiveListening(
                  false
                );

                return;
              }

              const silentFor =
                now -
                silenceStartedAtRef.current;

              if (
                silentFor >=
                LIVE_SILENCE_MS
              ) {
                silenceStartedAtRef.current =
                  null;

                hasDetectedSpeechRef.current =
                  false;

                stopVoiceRecording({
                  reason:
                    "live-silence",
                });
              }
            }
          }, AUDIO_ANALYSIS_INTERVAL_MS);
      } catch (error) {
        console.warn(
          "Silence detection failed:",
          error
        );
      }
    };

  /*
  ============================================================
  START VOICE RECORDING
  ============================================================
  */

  const startVoiceRecording =
    async ({
      liveMode = false,
      autoSound = true,
    } = {}) => {
      if (
        isSendingRef.current ||
        isRecordingRef.current
      ) {
        return false;
      }

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

        const recorder =
          mimeType
            ? new MediaRecorder(
                stream,
                {
                  mimeType,
                }
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

            stopSilenceDetection();

            if (
              sourceNodeRef.current
            ) {
              try {
                sourceNodeRef.current.disconnect();
              } catch (_) {}
            }

            sourceNodeRef.current =
              null;

            analyserRef.current =
              null;

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
            } else {
              stream
                .getTracks()
                .forEach(
                  (track) => {
                    track.stop();
                  }
                );
            }

            mediaRecorderRef.current =
              null;

            isRecordingRef.current =
              false;

            setIsRecording(
              false
            );

            setRecordingSeconds(
              0
            );

            setLiveListening(
              false
            );

            const shouldSend =
              chunks.length > 0;

            if (!shouldSend) {
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
              new Blob(
                chunks,
                {
                  type:
                    finalType,
                }
              );

            if (
              autoSound
            ) {
              playProfessionalTone({
                type:
                  "record-stop",
              });
            }

            await sendVoice(
              blob,
              {
                liveMode:
                  liveMode ||
                  liveModeRef.current,
              }
            );
          };

        recorder.onerror =
          () => {
            stopRecordingTimer();

            stopSilenceDetection();

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

            isRecordingRef.current =
              false;

            setIsRecording(
              false
            );

            setRecordingSeconds(
              0
            );

            setLiveListening(
              false
            );

            setRecordingError(
              language === "rw"
                ? "Habaye ikibazo mu gufata amajwi."
                : "There was a problem recording audio."
            );
          };

        mediaRecorderRef.current =
          recorder;

        recorder.start();

        isRecordingRef.current =
          true;

        setIsRecording(
          true
        );

        setRecordingSeconds(
          0
        );

        if (
          liveMode
        ) {
          setIsLiveVoice(
            true
          );

          hasDetectedSpeechRef.current =
            false;

          silenceStartedAtRef.current =
            null;

          speechStartedAtRef.current =
            null;

          startSilenceDetection(
            stream
          );
        }

        startRecordingTimer();

        if (
          autoSound
        ) {
          playProfessionalTone({
            type:
              "record-start",
          });
        }

        return true;
      } catch (error) {
        console.error(
          "Microphone error:",
          error
        );

        setIsRecording(
          false
        );

        isRecordingRef.current =
          false;

        setRecordingSeconds(
          0
        );

        setLiveListening(
          false
        );

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

        let message =
          error?.message;

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          message =
            language === "rw"
              ? "Microphone yanze gukoreshwa. Emerera browser gukoresha microphone."
              : "Microphone permission was denied. Please allow microphone access.";
        }

        if (
          error?.name ===
          "NotFoundError"
        ) {
          message =
            language === "rw"
              ? "Nta microphone yabonetse."
              : "No microphone was found.";
        }

        setRecordingError(
          message ||
            (language === "rw"
              ? "Microphone ntiyabashije gufunguka."
              : "Microphone could not be opened.")
        );

        return false;
      }
    };

  /*
  ============================================================
  STOP RECORDING
  ============================================================
  */

  const stopVoiceRecording =
    ({
      reason = "manual",
    } = {}) => {
      stopRecordingTimer();

      stopSilenceDetection();

      const recorder =
        mediaRecorderRef.current;

      if (!recorder) {
        setIsRecording(
          false
        );

        isRecordingRef.current =
          false;

        setRecordingSeconds(
          0
        );

        setLiveListening(
          false
        );

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

      if (
        reason !==
        "live-silence"
      ) {
        setLiveListening(
          false
        );
      }
    };

  /*
  ============================================================
  POINTER DOWN
  ============================================================
  */

  const handleRecordPointerDown =
    async (event) => {
      event.preventDefault();

      if (
        isSendingRef.current
      ) {
        return;
      }

      if (
        pointerDownRef.current
      ) {
        return;
      }

      pointerDownRef.current =
        true;

      if (
        isRecordingRef.current
      ) {
        if (
          !liveModeRef.current
        ) {
          stopVoiceRecording({
            reason:
              "manual",
          });
        }

        return;
      }

      startHoldTimer();
    };

  /*
  ============================================================
  POINTER UP
  ============================================================
  */

  const handleRecordPointerUp =
    async (event) => {
      event.preventDefault();

      if (
        !pointerDownRef.current
      ) {
        return;
      }

      pointerDownRef.current =
        false;

      stopHoldTimer();

      const wasLiveActivated =
        holdActivatedRef.current;

      const heldFor =
        holdStartRef.current
          ? Date.now() -
            holdStartRef.current
          : 0;

      holdStartRef.current =
        null;

      if (
        wasLiveActivated ||
        heldFor >=
          LIVE_HOLD_TRIGGER_MS
      ) {
        holdActivatedRef.current =
          false;

        setHoldSeconds(
          0
        );

        setIsLiveVoice(
          true
        );

        return;
      }

      holdActivatedRef.current =
        false;

      setHoldSeconds(
        0
      );

      if (
        isRecordingRef.current
      ) {
        if (
          !liveModeRef.current
        ) {
          stopVoiceRecording({
            reason:
              "manual",
          });
        }

        return;
      }

      await startVoiceRecording({
        liveMode: false,
        autoSound: true,
      });
    };

  /*
  ============================================================
  POINTER CANCEL
  ============================================================
  */

  const handleRecordPointerCancel =
    () => {
      pointerDownRef.current =
        false;

      stopHoldTimer();

      holdStartRef.current =
        null;

      holdActivatedRef.current =
        false;

      setHoldSeconds(
        0
      );
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
        return JSON.parse(
          raw
        );
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

  const extractAnswer =
    (data) => {
      if (!data) {
        return "";
      }

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

  const addUserMessage =
    ({
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
        timestamp:
          new Date(),
      };

      setMessages(
        (previous) => [
          ...previous,
          message,
        ]
      );

      setTimeout(() => {
        scrollToBottom(
          "smooth"
        );
      }, 20);

      return message;
    };

  /*
  ============================================================
  ADD AI MESSAGE
  ============================================================
  */

  const addAIMessage =
    ({
      text: messageText,
      audioUrl = null,
      autoPlay = false,
      liveMode = false,
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
        voice: Boolean(
          audioUrl
        ),
        timestamp:
          new Date(),
      };

      setMessages(
        (previous) => [
          ...previous,
          message,
        ]
      );

      setTimeout(() => {
        scrollToBottom(
          "smooth"
        );
      }, 20);

      if (
        audioUrl &&
        autoPlay
      ) {
        setTimeout(() => {
          playVoice(
            id,
            audioUrl,
            {
              liveMode,
            }
          );
        }, 180);
      } else if (
        liveMode
      ) {
        setTimeout(() => {
          startNextLiveTurn();
        }, 500);
      }

      return message;
    };

  /*
  ============================================================
  TEXT SEND
  ============================================================
  */

  const sendText =
    async () => {
      const cleanText =
        inputText.trim();

      if (
        !cleanText ||
        isSendingRef.current ||
        isRecordingRef.current
      ) {
        return;
      }

      setInputText("");

      if (
        inputRef.current
      ) {
        inputRef.current.style.height =
          "auto";
      }

      addUserMessage({
        text:
          cleanText,
        voice: false,
      });

      playProfessionalTone({
        type: "send",
      });

      setIsSending(
        true
      );

      isSendingRef.current =
        true;

      const thinkingInterval =
        startThinking(
          "text"
        );

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
              body: JSON.stringify(
                {
                  text:
                    cleanText,
                  message:
                    cleanText,
                  language:
                    language || "rw",
                }
              ),
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          data?.success ===
            false
        ) {
          throw new Error(
            data?.error ||
              `Request failed (${response.status})`
          );
        }

        /*
        --------------------------------------------------------
        Backend can optionally send updated thinking messages
        together with the response.
        --------------------------------------------------------
        */

        const responseThinkingMessages =
          extractThinkingMessages(
            data
          );

        if (
          responseThinkingMessages.length
        ) {
          setBackendThinkingMessages(
            responseThinkingMessages
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
          text:
            answer,
          audioUrl:
            data.audio_url ||
            data.audio ||
            null,
          autoPlay:
            false,
        });
      } catch (error) {
        console.error(
          "Text request error:",
          error
        );

        addAIMessage({
          text:
            language ===
            "rw"
              ? "Mbabarira, habaye ikibazo mu kubona igisubizo. Ongera ugerageze."
              : "Sorry, there was a problem getting a response. Please try again.",
        });
      } finally {
        stopThinking(
          thinkingInterval
        );

        setIsSending(
          false
        );

        isSendingRef.current =
          false;

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
  EXTRACT THINKING MESSAGES FROM BACKEND RESPONSE
  ============================================================
  */

  const extractThinkingMessages =
    (data) => {
      if (!data) {
        return [];
      }

      const candidates = [
        data.thinking_messages,
        data.thinkingMessages,
        data.messages,
        data.data?.thinking_messages,
        data.data?.thinkingMessages,
        data.data?.messages,
      ];

      let found = [];

      for (
        const candidate of candidates
      ) {
        if (
          Array.isArray(candidate)
        ) {
          found =
            candidate;
          break;
        }
      }

      return found
        .map((item) => {
          if (
            typeof item ===
            "string"
          ) {
            return item.trim();
          }

          if (
            item &&
            typeof item ===
              "object"
          ) {
            return (
              item.text ||
              item.message ||
              item.content ||
              ""
            ).trim();
          }

          return "";
        })
        .filter(Boolean);
    };

  /*
  ============================================================
  VOICE SEND
  ============================================================
  */

  const sendVoice =
    async (
      blob,
      {
        liveMode = false,
      } = {}
    ) => {
      setIsSending(
        true
      );

      isSendingRef.current =
        true;

      setLiveListening(
        false
      );

      if (
        liveMode
      ) {
        setIsLiveVoice(
          true
        );
      }

      const thinkingInterval =
        startThinking(
          "voice"
        );

      scrollToBottom(
        "smooth"
      );

      try {
        const formData =
          new FormData();

        const extension =
          blob.type.includes(
            "ogg"
          )
            ? "ogg"
            : blob.type.includes(
                "mp4"
              )
            ? "mp4"
            : "webm";

        formData.append(
          "audio",
          blob,
          `antimate_voice.${extension}`
        );

        /*
        --------------------------------------------------------
        Language is also sent to backend.
        --------------------------------------------------------
        */

        formData.append(
          "language",
          language || "rw"
        );

        const response =
          await fetch(
            ANTIMATE_VOICE_ENDPOINT,
            {
              method: "POST",
              body:
                formData,
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          data?.success ===
            false
        ) {
          throw new Error(
            data?.error ||
              `Voice request failed (${response.status})`
          );
        }

        /*
        ========================================================
        UPDATE THINKING MESSAGES FROM BACKEND
        ========================================================
        */

        const responseThinkingMessages =
          extractThinkingMessages(
            data
          );

        if (
          responseThinkingMessages.length
        ) {
          setBackendThinkingMessages(
            responseThinkingMessages
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

        if (
          transcript
        ) {
          addUserMessage({
            text:
              transcript,
            voice:
              true,
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
          text:
            answer,
          audioUrl,
          autoPlay:
            Boolean(
              audioUrl
            ),
          liveMode,
        });
      } catch (error) {
        console.error(
          "Voice request error:",
          error
        );

        addAIMessage({
          text:
            language ===
            "rw"
              ? "Mbabarira, sinabashije kumva neza cyangwa kubona igisubizo. Ongera uvuge."
              : "Sorry, I could not understand you or get a response. Please try again.",
        });

        if (
          liveMode
        ) {
          setTimeout(() => {
            startNextLiveTurn();
          }, 1200);
        }
      } finally {
        stopThinking(
          thinkingInterval
        );

        setIsSending(
          false
        );

        isSendingRef.current =
          false;

        setTimeout(() => {
          scrollToBottom(
            "smooth"
          );
        }, 80);
      }
    };

  /*
  ============================================================
  START NEXT LIVE TURN
  ============================================================
  */

  const startNextLiveTurn =
    async () => {
      if (
        !liveModeRef.current
      ) {
        return;
      }

      if (
        isSendingRef.current ||
        isRecordingRef.current
      ) {
        return;
      }

      setLiveListening(
        false
      );

      hasDetectedSpeechRef.current =
        false;

      silenceStartedAtRef.current =
        null;

      speechStartedAtRef.current =
        null;

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            450
          )
      );

      if (
        !liveModeRef.current ||
        isSendingRef.current ||
        isRecordingRef.current
      ) {
        return;
      }

      await startVoiceRecording({
        liveMode:
          true,
        autoSound:
          true,
      });
    };

  /*
  ============================================================
  PLAY VOICE
  ============================================================
  */

  const playVoice =
    async (
      messageId,
      url,
      {
        liveMode = false,
      } = {}
    ) => {
      if (!url) {
        if (
          liveMode
        ) {
          startNextLiveTurn();
        }

        return;
      }

      try {
        Object.entries(
          audioRefs.current
        ).forEach(
          ([id, audio]) => {
            if (
              id !==
              messageId
            ) {
              try {
                audio.pause();

                audio.currentTime =
                  0;
              } catch (_) {}
            }
          }
        );

        if (
          isRecordingRef.current
        ) {
          stopVoiceRecording({
            reason:
              "ai-playback",
          });
        }

        let audio =
          audioRefs.current[
            messageId
          ];

        if (!audio) {
          audio =
            new Audio(
              url
            );

          audio.preload =
            "auto";

          audio.onplay =
            () => {
              setAudioPlayingId(
                messageId
              );
            };

          audio.onended =
            () => {
              setAudioPlayingId(
                null
              );

              if (
                liveMode
              ) {
                setTimeout(() => {
                  startNextLiveTurn();
                }, 350);
              }
            };

          audio.onerror =
            () => {
              setAudioPlayingId(
                null
              );

              if (
                liveMode
              ) {
                setTimeout(() => {
                  startNextLiveTurn();
                }, 700);
              }
            };

          audioRefs.current[
            messageId
          ] = audio;
        }

        setAudioPlayingId(
          messageId
        );

        audio.currentTime =
          0;

        await audio.play();
      } catch (error) {
        console.error(
          "Audio playback error:",
          error
        );

        setAudioPlayingId(
          null
        );

        if (
          liveMode
        ) {
          setTimeout(() => {
            startNextLiveTurn();
          }, 700);
        }
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
        message.audioUrl,
        {
          liveMode:
            false,
        }
      );
    };

  /*
  ============================================================
  EXIT LIVE MODE
  ============================================================
  */

  const stopLiveVoice =
    () => {
      setIsLiveVoice(
        false
      );

      liveModeRef.current =
        false;

      hasDetectedSpeechRef.current =
        false;

      stopSilenceDetection();

      if (
        isRecordingRef.current
      ) {
        stopVoiceRecording({
          reason:
            "live-exit",
        });
      }

      setLiveListening(
        false
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

      setInputText(
        value
      );

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
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        sendText();
      }
    };

  /*
  ============================================================
  RECORDING ERROR AUTO CLEAR
  ============================================================
  */

  useEffect(() => {
    if (
      !recordingError
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        setRecordingError(
          ""
        );
      }, 5000);

    return () =>
      clearTimeout(
        timer
      );
  }, [
    recordingError,
  ]);

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

        .antimate-page,
        .antimate-page * {
          box-sizing: border-box;
        }

        .antimate-page {
          --ai-bg:
            ${isDark
              ? "#090b10"
              : "#f7f9fc"};

          --ai-surface:
            ${isDark
              ? "#12161d"
              : "#ffffff"};

          --ai-surface-2:
            ${isDark
              ? "#181d25"
              : "#f1f4f8"};

          --ai-text:
            ${isDark
              ? "#f5f7fa"
              : "#101828"};

          --ai-text-soft:
            ${isDark
              ? "#c8ced8"
              : "#344054"};

          --ai-muted:
            ${isDark
              ? "#8d96a5"
              : "#667085"};

          --ai-border:
            ${isDark
              ? "#29313d"
              : "#e4e7ec"};

          --ai-input-bg:
            ${isDark
              ? "#10141a"
              : "#ffffff"};

          --ai-user-bg:
            ${isDark
              ? "#273142"
              : "#111827"};

          --ai-user-text:
            #ffffff;

          --ai-danger:
            #ef4444;

          --ai-success:
            #35c77a;

          width: 100%;
          min-height: 100vh;
          height: 100%;
          background: var(--ai-bg);
          color: var(--ai-text);
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
          padding: 0 25px;
          border-bottom: 1px solid var(--ai-border);
          background:
            ${isDark
              ? "rgba(9,11,16,0.94)"
              : "rgba(247,249,252,0.94)"};
          z-index: 100;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
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
          filter: blur(8px);
          opacity: 0.55;
          z-index: -2;
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
          background: transparent;
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
          z-index: -1;
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
          transform: none !important;
        }

        .theme-dark
        .antimate-logo-core {
          background: #f8fafc;
          color: #111827;
        }

        .theme-light
        .antimate-logo-core {
          background: #101828;
          color: #ffffff;
        }

        .antimate-logo-core span {
          display: block;
          font-size: 38%;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.5px;
          transform: none !important;
          animation: none !important;
        }

        @keyframes antimateAIColorFlow {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .antimate-title {
          font-size: 17px;
          font-weight: 750;
          letter-spacing: -0.3px;
          color: var(--ai-text);
        }

        .antimate-subtitle {
          margin-top: 3px;
          font-size: 12px;
          color: var(--ai-muted);
        }

        .antimate-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--ai-muted);
        }

        .antimate-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ai-success);
          box-shadow:
            0 0 0 4px
            ${isDark
              ? "rgba(53,199,122,0.10)"
              : "rgba(53,199,122,0.12)"};
        }

        .antimate-chat {
          flex: 1;
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          overflow-y: auto;
          padding: 108px 24px 160px;
          scrollbar-width: thin;
          scroll-behavior: smooth;
        }

        .antimate-chat::-webkit-scrollbar {
          width: 6px;
        }

        .antimate-chat::-webkit-scrollbar-thumb {
          background: var(--ai-border);
          border-radius: 20px;
        }

        .antimate-welcome {
          min-height:
            calc(100vh - 250px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 35px 20px;
        }

        .antimate-welcome h1 {
          margin: 0;
          font-size: 29px;
          font-weight: 760;
          letter-spacing: -0.8px;
          color: var(--ai-text);
        }

        .antimate-welcome p {
          max-width: 540px;
          margin: 12px 0 0;
          color: var(--ai-muted);
          line-height: 1.7;
          font-size: 14px;
        }

        .antimate-message {
          width: 100%;
          display: flex;
          margin-bottom: 25px;
          gap: 10px;
        }

        .antimate-message.user {
          justify-content: flex-end;
        }

        .antimate-message.assistant {
          justify-content: flex-start;
        }

        .antimate-avatar {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 21px;
          overflow: hidden;
        }

        .antimate-avatar-user {
          background: var(--ai-user-bg);
          color: white;
          font-size: 11px;
          font-weight: 750;
          border:
            1px solid
            ${isDark
              ? "#3b4656"
              : "#1f2937"};
        }

        .antimate-avatar-ai {
          background: transparent;
        }

        .antimate-avatar-ai
        .antimate-logo-o {
          width: 34px !important;
          height: 34px !important;
        }

        .antimate-message-content {
          max-width: min(75%, 700px);
          display: flex;
          flex-direction: column;
        }

        .antimate-message.user
        .antimate-message-content {
          align-items: flex-end;
        }

        .antimate-message.assistant
        .antimate-message-content {
          align-items: flex-start;
        }

        .antimate-message-label {
          font-size: 11px;
          font-weight: 650;
          color: var(--ai-muted);
          margin: 0 8px 7px;
        }

        .antimate-bubble {
          padding: 13px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .antimate-message.user
        .antimate-bubble {
          background: var(--ai-user-bg);
          color: var(--ai-user-text);
          border-bottom-right-radius: 5px;
          box-shadow:
            0 5px 18px
            ${isDark
              ? "rgba(0,0,0,0.16)"
              : "rgba(15,23,42,0.08)"};
        }

        .antimate-message.assistant
        .antimate-bubble {
          background: var(--ai-surface);
          border:
            1px solid
            var(--ai-border);
          color: var(--ai-text);
          border-bottom-left-radius: 5px;
          box-shadow:
            0 4px 18px
            ${isDark
              ? "rgba(0,0,0,0.12)"
              : "rgba(15,23,42,0.04)"};
        }

        .antimate-voice-mark {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          margin-bottom: 8px;
          opacity: 0.82;
        }

        .antimate-wave-mini {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          height: 14px;
        }

        .antimate-wave-mini span {
          width: 2px;
          border-radius: 4px;
          background: currentColor;
        }

        .antimate-wave-mini
        span:nth-child(1) {
          height: 5px;
        }

        .antimate-wave-mini
        span:nth-child(2) {
          height: 10px;
        }

        .antimate-wave-mini
        span:nth-child(3) {
          height: 7px;
        }

        .antimate-wave-mini
        span:nth-child(4) {
          height: 13px;
        }

        .antimate-wave-mini
        span:nth-child(5) {
          height: 6px;
        }

        .antimate-voice-controls {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 9px;
          padding: 7px 10px;
          border:
            1px solid
            var(--ai-border);
          border-radius: 13px;
          background: var(--ai-surface);
          width: fit-content;
        }

        .antimate-replay {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #6366f1,
              #a855f7
            );
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .antimate-replay:hover {
          transform: scale(1.06);
        }

        .antimate-replay:disabled {
          opacity: 0.55;
          cursor: default;
          transform: none;
        }

        .antimate-voice-status {
          font-size: 11px;
          color: var(--ai-muted);
          min-width: 42px;
        }

        /*
        ========================================================
        THINKING
        ========================================================
        */

        .antimate-thinking {
          position: relative;
          min-height: 45px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--ai-muted);
          font-size: 13px;
          margin: 5px 0 22px 45px;
          transform: translateY(-8vh);
        }

        .antimate-thinking-dots {
          display: flex;
          gap: 3px;
        }

        .antimate-thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          animation:
            antimate-dot
            1.2s infinite;
        }

        .antimate-thinking-dots
        span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .antimate-thinking-dots
        span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes antimate-dot {
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

        .antimate-composer-wrapper {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 110;
          padding: 16px 18px 19px;
          background:
            linear-gradient(
              to bottom,
              transparent,
              var(--ai-bg) 28%
            );
          pointer-events: none;
        }

        .antimate-composer {
          pointer-events: auto;
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 8px 9px 8px 15px;
          background: var(--ai-input-bg);
          border:
            1px solid
            var(--ai-border);
          border-radius: 20px;
          box-shadow:
            0 12px 35px
            ${isDark
              ? "rgba(0,0,0,0.35)"
              : "rgba(15,23,42,0.10)"};
        }

        .antimate-input {
          flex: 1;
          resize: none;
          border: none;
          outline: none;
          background: transparent;
          color: var(--ai-text);
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          min-height: 38px;
          max-height: 120px;
          padding: 9px 2px;
          overflow-y: auto;
        }

        .antimate-input::placeholder {
          color: var(--ai-muted);
        }

        .antimate-action-button {
          width: 43px;
          height: 43px;
          min-width: 43px;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background:
            linear-gradient(
              135deg,
              #6366f1,
              #a855f7
            );
          color: #ffffff;
          box-shadow:
            0 5px 16px
            rgba(
              99,
              102,
              241,
              0.24
            );
          transition:
            transform 0.15s ease,
            opacity 0.15s ease,
            box-shadow 0.2s ease;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .antimate-action-button:hover {
          transform: scale(1.05);
        }

        .antimate-action-button:disabled {
          opacity: 0.45;
          cursor: default;
          transform: none;
        }

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
              rgba(
                239,
                68,
                68,
                0.35
              );
          }

          70% {
            box-shadow:
              0 0 0 11px
              rgba(
                239,
                68,
                68,
                0
              );
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(
                239,
                68,
                68,
                0
              );
          }
        }

        .antimate-action-button.live-mode {
          background:
            linear-gradient(
              135deg,
              #00a878,
              #00c896
            );
          box-shadow:
            0 5px 20px
            rgba(
              0,
              200,
              150,
              0.28
            );
          animation:
            antimate-live-pulse
            1.8s infinite;
        }

        @keyframes antimate-live-pulse {
          0% {
            box-shadow:
              0 0 0 0
              rgba(
                0,
                200,
                150,
                0.30
              );
          }

          70% {
            box-shadow:
              0 0 0 10px
              rgba(
                0,
                200,
                150,
                0
              );
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(
                0,
                200,
                150,
                0
              );
          }
        }

        .antimate-hold-progress {
          position: absolute;
          left: 50%;
          bottom: 78px;
          transform: translateX(-50%);
          z-index: 125;
          width:
            min(
              310px,
              calc(100% - 30px)
            );
          padding: 10px 14px;
          border:
            1px solid
            var(--ai-border);
          border-radius: 14px;
          background: var(--ai-surface);
          box-shadow:
            0 10px 30px
            ${isDark
              ? "rgba(0,0,0,0.35)"
              : "rgba(15,23,42,0.12)"};
          text-align: center;
          pointer-events: none;
        }

        .antimate-hold-text {
          font-size: 11px;
          color: var(--ai-muted);
          margin-bottom: 7px;
        }

        .antimate-hold-bar {
          width: 100%;
          height: 4px;
          border-radius: 10px;
          overflow: hidden;
          background: var(--ai-border);
        }

        .antimate-hold-bar-fill {
          height: 100%;
          width:
            ${Math.min(
              100,
              (holdSeconds /
                5) *
                100
            )}%;
          background:
            linear-gradient(
              90deg,
              #6366f1,
              #a855f7,
              #ec4899
            );
          transition:
            width 0.08s linear;
        }

        .antimate-recording-area {
          position: fixed;
          left: 50%;
          bottom: 91px;
          transform: translateX(-50%);
          z-index: 120;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          border-radius: 14px;
          background: var(--ai-surface);
          border:
            1px solid
            var(--ai-border);
          box-shadow:
            0 10px 30px
            ${isDark
              ? "rgba(0,0,0,0.35)"
              : "rgba(15,23,42,0.12)"};
          font-size: 12px;
        }

        .antimate-recording-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation:
            antimate-recording-blink
            1s infinite;
        }

        @keyframes antimate-recording-blink {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.3;
          }
        }

        .antimate-countdown {
          font-weight: 750;
          font-variant-numeric: tabular-nums;
          min-width: 38px;
          color: var(--ai-text);
        }

        .antimate-recording-hint {
          color: var(--ai-muted);
        }

        .antimate-live-label {
          color: #00b887;
          font-weight: 700;
        }

        .antimate-error {
          position: fixed;
          left: 50%;
          bottom: 150px;
          transform: translateX(-50%);
          z-index: 130;
          max-width:
            calc(100% - 30px);
          padding: 10px 14px;
          border-radius: 11px;
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
          font-size: 12px;
          box-shadow:
            0 8px 25px
            ${isDark
              ? "rgba(0,0,0,0.25)"
              : "rgba(15,23,42,0.08)"};
        }

        .antimate-live-exit {
          position: fixed;
          right: 20px;
          bottom: 90px;
          z-index: 140;
          border:
            1px solid
            var(--ai-border);
          background: var(--ai-surface);
          color: var(--ai-muted);
          border-radius: 10px;
          padding: 7px 10px;
          font-size: 11px;
          cursor: pointer;
          box-shadow:
            0 8px 22px
            ${isDark
              ? "rgba(0,0,0,0.25)"
              : "rgba(15,23,42,0.08)"};
        }

        .antimate-live-exit:hover {
          color: var(--ai-text);
          border-color: var(--ai-text-soft);
        }

        .antimate-empty-space {
          height: 10px;
        }

        @media (max-width: 700px) {

          .antimate-header {
            height: 64px;
            min-height: 64px;
            padding: 0 15px;
          }

          .antimate-title {
            font-size: 15px;
          }

          .antimate-subtitle {
            font-size: 11px;
          }

          .antimate-status {
            display: none;
          }

          .antimate-chat {
            padding: 88px 12px 145px;
          }

          .antimate-message-content {
            max-width: 82%;
          }

          .antimate-avatar {
            width: 30px;
            height: 30px;
            min-width: 30px;
          }

          .antimate-avatar-ai
          .antimate-logo-o {
            width: 30px !important;
            height: 30px !important;
          }

          .antimate-bubble {
            font-size: 13.5px;
            padding: 11px 13px;
          }

          .antimate-welcome {
            min-height:
              calc(
                100vh -
                230px
              );
            padding: 25px 12px;
          }

          .antimate-welcome h1 {
            font-size: 23px;
          }

          .antimate-welcome p {
            font-size: 13px;
            line-height: 1.6;
          }

          .antimate-composer-wrapper {
            padding:
              10px 10px
              calc(
                10px +
                env(
                  safe-area-inset-bottom
                )
              );
          }

          .antimate-composer {
            border-radius: 17px;
            padding-left: 13px;
          }

          .antimate-action-button {
            width: 41px;
            height: 41px;
            min-width: 41px;
          }

          .antimate-recording-area {
            bottom: 79px;
            max-width:
              calc(
                100% -
                24px
              );
            white-space: nowrap;
          }

          .antimate-recording-hint {
            display: none;
          }

          .antimate-thinking {
            margin-left: 40px;
            transform:
              translateY(
                -5vh
              );
          }

          .antimate-error {
            bottom: 135px;
          }

          .antimate-live-exit {
            right: 12px;
            bottom: 74px;
          }

          .antimate-hold-progress {
            bottom: 72px;
          }
        }

        @media (max-width: 420px) {

          .antimate-message-content {
            max-width: 86%;
          }

          .antimate-header {
            padding: 0 12px;
          }

          .antimate-chat {
            padding-left: 9px;
            padding-right: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {

          .antimate-logo-o::before,
          .antimate-logo-ring::before,
          .antimate-action-button.recording,
          .antimate-action-button.live-mode,
          .antimate-recording-dot,
          .antimate-thinking-dots span {
            animation: none !important;
          }

          .antimate-logo-core,
          .antimate-logo-core span {
            transform: none !important;
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
                {isLiveVoice
                  ? "Live Voice"
                  : language ===
                    "rw"
                  ? "Umufasha w'ubwenge"
                  : "Intelligent Assistant"}
              </div>

            </div>

          </div>

          <div className="antimate-status">

            <span
              className="antimate-status-dot"
            />

            {isLiveVoice
              ? "Live"
              : language ===
                "rw"
              ? "Iri gukora"
              : "Online"}

          </div>

        </header>

        {/* ==================================================
            CHAT
        ================================================== */}

        <main
          ref={chatRef}
          className="antimate-chat"
        >

          {messages.length === 0 &&
            !thinkingText && (
              <div className="antimate-welcome">

                <h1>
                  {language ===
                  "rw"
                    ? "Muraho, ndi ANTIMATE AI"
                    : "Hello, I'm ANTIMATE AI"}
                </h1>

                <p>
                  {language ===
                  "rw"
                    ? "Andika ubutumwa cyangwa ukoreshe microphone uvuge mu Kinyarwanda. Kanda microphone cyangwa uyifate amasegonda 5 kugira ngo utangire Live Voice."
                    : "Write a message or use the microphone to speak. Click the microphone normally, or hold it for 5 seconds to start Live Voice."}
                </p>

              </div>
            )}

          {messages.map(
            (message) => (
              <div
                key={
                  message.id
                }
                className={`antimate-message ${
                  message.role ===
                  "user"
                    ? "user"
                    : "assistant"
                }`}
              >

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
            ref={
              messagesEndRef
            }
            className="antimate-empty-space"
          />

        </main>

        {/* ==================================================
            LIVE MODE EXIT
        ================================================== */}

        {isLiveVoice &&
          !isRecording &&
          !isSending && (
            <button
              type="button"
              className="antimate-live-exit"
              onClick={
                stopLiveVoice
              }
            >
              {language ===
              "rw"
                ? "Hagarika Live"
                : "Stop Live"}
            </button>
          )}

        {/* ==================================================
            HOLD PROGRESS
        ================================================== */}

        {pointerDownRef.current &&
          !isRecording &&
          !isSending &&
          holdSeconds <
            5 && (
            <div className="antimate-hold-progress">

              <div className="antimate-hold-text">

                {language ===
                "rw"
                  ? `Fata microphone... ${holdSeconds}s / 5s`
                  : `Hold microphone... ${holdSeconds}s / 5s`}

              </div>

              <div className="antimate-hold-bar">

                <div className="antimate-hold-bar-fill" />

              </div>

            </div>
          )}

        {/* ==================================================
            RECORDING STATUS
        ================================================== */}

        {isRecording && (
          <div className="antimate-recording-area">

            <span className="antimate-recording-dot" />

            <span>

              {isLiveVoice
                ? (
                  liveListening
                    ? language ===
                      "rw"
                      ? "Ndakumva..."
                      : "Listening..."
                    : language ===
                      "rw"
                    ? "Vuga..."
                    : "Speak..."
                )
                : language ===
                  "rw"
                ? "Ndakumva..."
                : "Listening..."}

            </span>

            {isLiveVoice && (
              <span className="antimate-live-label">
                LIVE
              </span>
            )}

            <span className="antimate-countdown">
              {formatRecordingTime(
                recordingSeconds
              )}
            </span>

            <span className="antimate-recording-hint">

              {isLiveVoice
                ? language ===
                  "rw"
                  ? "1.8s utavuga → ohereza"
                  : "1.8s silence → send"
                : language ===
                  "rw"
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
              ref={
                inputRef
              }
              className="antimate-input"
              value={
                inputText
              }
              onChange={
                handleInputChange
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder={
                language ===
                "rw"
                  ? "Andika ubutumwa..."
                  : "Write a message..."
              }
              rows={1}
              disabled={
                isSending ||
                isRecording ||
                isLiveVoice
              }
              aria-label={
                language ===
                "rw"
                  ? "Ubutumwa"
                  : "Message"
              }
            />

            {!inputText.trim() ? (

              <button
                type="button"
                className={`antimate-action-button ${
                  isRecording
                    ? "recording"
                    : ""
                } ${
                  isLiveVoice
                    ? "live-mode"
                    : ""
                }`}
                onPointerDown={
                  handleRecordPointerDown
                }
                onPointerUp={
                  handleRecordPointerUp
                }
                onPointerCancel={
                  handleRecordPointerCancel
                }
                onPointerLeave={() => {}}
                onContextMenu={(
                  event
                ) =>
                  event.preventDefault()
                }
                disabled={
                  isSending
                }
                aria-label={
                  isLiveVoice
                    ? "Live voice microphone"
                    : isRecording
                    ? "Stop recording"
                    : "Start voice recording"
                }
                title={
                  isLiveVoice
                    ? "Live Voice"
                    : isRecording
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
                ) : isLiveVoice ? (
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
                  language ===
                  "rw"
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