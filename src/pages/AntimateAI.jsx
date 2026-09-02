// ============================================================
// ANTIMATE AI — AGENTIC FRONTEND
// SOCKET.IO VOICE STREAMING + PERSONAL CONTEXT
// ============================================================
//
// FEATURES
//
// 1. Agentic ANTIMATE AI
// 2. Personal user context
// 3. Guest mode
// 4. Chicks age / type context
// 5. Brooder context
// 6. Live telemetry context
// 7. Conversation history
// 8. Socket.IO voice streaming
// 9. Kinyarwanda transcript
// 10. Kinyarwanda streaming answer
// 11. Audio response playback
// 12. Hold-to-record
// 13. Short click = ~1.8 sec recording
// 14. Socket reconnect
// 15. Screen Wake Lock
// 16. GPU / CPU processing mode
// 17. Prevent duplicate assistant messages
// 18. Text chat
// 19. Guest fallback
//
// BACKEND SOCKET EVENTS:
//
// CLIENT -> SERVER
//   antimate:voice:start
//   antimate:voice:chunk
//   antimate:voice:end
//   antimate:voice:cancel
//
// SERVER -> CLIENT
//   antimate:status
//   antimate:transcript
//   antimate:thinking
//   antimate:answer
//   antimate:answer:chunk
//   antimate:audio
//   antimate:complete
//   antimate:error
//
// ============================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";
import "./AntimateAI.css";

// ============================================================
// CONFIG
// ============================================================

const API_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_URL ||
  window.location.origin;

const CHAT_URL =
  `${API_URL}/api/antimate/chat`;

const HOLD_TO_RECORD_MS = 450;

const SHORT_CLICK_RECORDING_MS = 1800;

const MAX_RECORDING_MS =
  Number(
    import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

const CHUNK_INTERVAL_MS = 250;

const MAX_CONTEXT_MESSAGES = 12;

// ============================================================
// SAFE LOCAL STORAGE
// ============================================================

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function safeJSONParse(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ============================================================
// MIME TYPE
// ============================================================

function getSupportedMimeType() {
  if (
    typeof MediaRecorder === "undefined"
  ) {
    return "";
  }

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const type of types) {
    try {
      if (
        MediaRecorder.isTypeSupported(type)
      ) {
        return type;
      }
    } catch {}
  }

  return "";
}

// ============================================================
// MIME EXTENSION
// ============================================================

function extensionFromMimeType(
  mimeType
) {
  const mime =
    String(
      mimeType || ""
    ).toLowerCase();

  if (mime.includes("ogg")) {
    return ".ogg";
  }

  if (mime.includes("mp4")) {
    return ".mp4";
  }

  if (mime.includes("mpeg")) {
    return ".mp3";
  }

  return ".webm";
}

// ============================================================
// AUDIO URL
// ============================================================

function getAudioUrl(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      value.url ||
      value.audio_url ||
      value.audioUrl ||
      value.path ||
      null
    );
  }

  return null;
}

// ============================================================
// ABSOLUTE URL
// ============================================================

function makeAbsoluteUrl(url) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("file://")) {
    return null;
  }

  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return url;
}

// ============================================================
// GENERIC VALUE PICKER
// ============================================================

function firstDefined(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}

// ============================================================
// USER CONTEXT
// ============================================================

function getStoredUserContext() {
  const possibleKeys = [
    "user",
    "currentUser",
    "authUser",
    "antimateUser",
    "userData",
  ];

  for (const key of possibleKeys) {
    const raw =
      safeStorageGet(key);

    if (!raw) {
      continue;
    }

    const parsed =
      safeJSONParse(
        raw,
        null
      );

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return parsed.user || parsed;
    }
  }

  return null;
}

// ============================================================
// AUTH TOKEN
// ============================================================

function getAuthToken() {
  const possibleKeys = [
    "token",
    "authToken",
    "accessToken",
    "jwt",
    "antimateToken",
  ];

  for (const key of possibleKeys) {
    const value =
      safeStorageGet(key);

    if (value) {
      return value;
    }
  }

  return null;
}

// ============================================================
// SYSTEM CONTEXT
// ============================================================

function getStoredSystemContext() {
  const possibleKeys = [
    "system",
    "systemData",
    "brooderSystem",
    "selectedSystem",
    "antimateSystem",
    "brooder",
  ];

  for (const key of possibleKeys) {
    const raw =
      safeStorageGet(key);

    if (!raw) {
      continue;
    }

    const parsed =
      safeJSONParse(
        raw,
        null
      );

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return parsed.system || parsed;
    }
  }

  return null;
}

// ============================================================
// TELEMETRY CONTEXT
// ============================================================

function getStoredTelemetry() {
  const possibleKeys = [
    "telemetry",
    "latestTelemetry",
    "systemTelemetry",
    "brooderTelemetry",
    "antimateTelemetry",
  ];

  for (const key of possibleKeys) {
    const raw =
      safeStorageGet(key);

    if (!raw) {
      continue;
    }

    const parsed =
      safeJSONParse(
        raw,
        null
      );

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return (
        parsed.telemetry ||
        parsed.data ||
        parsed
      );
    }
  }

  return null;
}

// ============================================================
// AGE CALCULATION
// ============================================================

function calculateChicksAge(
  birthDate
) {
  if (!birthDate) {
    return null;
  }

  const birth =
    new Date(
      birthDate
    );

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return null;
  }

  const now =
    new Date();

  const diff =
    now.getTime() -
    birth.getTime();

  if (diff < 0) {
    return 0;
  }

  return Math.floor(
    diff /
      (1000 * 60 * 60 * 24)
  );
}

// ============================================================
// BUILD PERSONAL CONTEXT
// ============================================================

function buildAgentContext() {
  const user =
    getStoredUserContext();

  const system =
    getStoredSystemContext();

  const telemetry =
    getStoredTelemetry();

  const token =
    getAuthToken();

  const chicksBirthDate =
    firstDefined(
      system?.chicksBirthDate,
      system?.chicks_birth_date,
      system?.birthDate,
      system?.chicks?.birthDate,
      system?.chicks?.birth_date
    );

  const chicksType =
    firstDefined(
      system?.chicksType,
      system?.chicks_type,
      system?.type,
      system?.chicks?.type,
      system?.chicks?.breed
    );

  const roomArea =
    firstDefined(
      system?.roomArea,
      system?.broodingRoomArea,
      system?.brooderRoomArea,
      system?.area,
      system?.room?.area
    );

  const chicksAge =
    firstDefined(
      system?.chicksAge,
      system?.chicks_age,
      calculateChicksAge(
        chicksBirthDate
      )
    );

  const userId =
    firstDefined(
      user?.id,
      user?._id,
      user?.userId
    );

  const userName =
    firstDefined(
      user?.name,
      user?.fullName,
      user?.username,
      user?.firstName
    );

  const isAuthenticated =
    Boolean(
      token ||
      userId
    );

  return {
    mode:
      isAuthenticated
        ? "authenticated"
        : "guest",

    authenticated:
      isAuthenticated,

    user: isAuthenticated
      ? {
          id:
            userId || null,

          name:
            userName || null,

          email:
            user?.email || null,
        }
      : null,

    farm: isAuthenticated
      ? {
          name:
            firstDefined(
              system?.farmName,
              user?.farmName,
              user?.farm?.name
            ),

          location:
            firstDefined(
              system?.location,
              user?.location,
              user?.farm?.location
            ),
        }
      : null,

    chicks: {
      birthDate:
        chicksBirthDate ||
        null,

      ageDays:
        chicksAge !== null
          ? Number(
              chicksAge
            )
          : null,

      type:
        chicksType ||
        null,

      count:
        firstDefined(
          system?.chicksCount,
          system?.chickCount,
          system?.numberOfChicks,
          system?.chicks?.count
        ),
    },

    brooder: {
      roomArea:
        roomArea !== null
          ? Number(
              roomArea
            )
          : null,

      areaUnit:
        firstDefined(
          system?.areaUnit,
          system?.roomAreaUnit,
          "m²"
        ),

      systemName:
        firstDefined(
          system?.name,
          system?.systemName,
          system?.deviceName
        ),

      systemId:
        firstDefined(
          system?.id,
          system?._id,
          system?.systemId,
          system?.deviceId
        ),
    },

    telemetry:
      telemetry || null,

    timestamp:
      new Date().toISOString(),
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function AntimateAI() {
  // ==========================================================
  // SOCKET
  // ==========================================================

  const socketRef =
    useRef(null);

  // ==========================================================
  // MEDIA
  // ==========================================================

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const holdTimerRef =
    useRef(null);

  const autoStopTimerRef =
    useRef(null);

  const shortClickTimerRef =
    useRef(null);

  const isHoldingRef =
    useRef(false);

  const isRecordingRef =
    useRef(false);

  // ==========================================================
  // AUDIO
  // ==========================================================

  const audioRef =
    useRef(null);

  // ==========================================================
  // WAKE LOCK
  // ==========================================================

  const wakeLockRef =
    useRef(null);

  const voiceSessionActiveRef =
    useRef(false);

  // ==========================================================
  // LIVE ASSISTANT
  // ==========================================================

  const liveAssistantMessageIdRef =
    useRef(null);

  // ==========================================================
  // CONTEXT REF
  // ==========================================================

  const agentContextRef =
    useRef(
      buildAgentContext()
    );

  // ==========================================================
  // STATE
  // ==========================================================

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [status, setStatus] =
    useState("ready");

  const [statusMessage, setStatusMessage] =
    useState(
      "Kanda microphone utangire kuvuga."
    );

  const [processingMode, setProcessingMode] =
    useState(null);

  const [transcript, setTranscript] =
    useState("");

  const [thinkingText, setThinkingText] =
    useState("");

  const [currentAnswer, setCurrentAnswer] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [agentContext, setAgentContext] =
    useState(
      agentContextRef.current
    );

  // ==========================================================
  // REFRESH CONTEXT
  // ==========================================================

  const refreshAgentContext =
    useCallback(() => {
      const context =
        buildAgentContext();

      agentContextRef.current =
        context;

      setAgentContext(
        context
      );

      return context;
    }, []);

  // ==========================================================
  // CONTEXT SUMMARY
  // ==========================================================

  const contextSummary =
    useMemo(() => {
      const context =
        agentContext;

      return {
        guest:
          context.mode ===
          "guest",

        user:
          context.user?.name ||
          null,

        chicksAge:
          context.chicks?.ageDays,

        chicksType:
          context.chicks?.type,

        telemetry:
          Boolean(
            context.telemetry
          ),
      };
    }, [agentContext]);

  // ==========================================================
  // WAKE LOCK
  // ==========================================================

  const requestWakeLock =
    useCallback(
      async () => {
        if (
          !("wakeLock" in navigator)
        ) {
          return;
        }

        if (
          !voiceSessionActiveRef.current
        ) {
          return;
        }

        try {
          if (
            wakeLockRef.current &&
            !wakeLockRef.current.released
          ) {
            return;
          }

          const wakeLock =
            await navigator.wakeLock.request(
              "screen"
            );

          wakeLockRef.current =
            wakeLock;

          wakeLock.addEventListener(
            "release",
            () => {
              wakeLockRef.current =
                null;
            }
          );
        } catch (error) {
          console.warn(
            "Wake Lock failed:",
            error
          );
        }
      },
      []
    );

  // ==========================================================
  // RELEASE WAKE LOCK
  // ==========================================================

  const releaseWakeLock =
    useCallback(
      async () => {
        if (
          wakeLockRef.current
        ) {
          try {
            await wakeLockRef.current.release();
          } catch {}

          wakeLockRef.current =
            null;
        }
      },
      []
    );

  // ==========================================================
  // VISIBILITY
  // ==========================================================

  useEffect(() => {
    const handleVisibility =
      async () => {
        if (
          document.visibilityState ===
            "visible" &&
          voiceSessionActiveRef.current
        ) {
          await requestWakeLock();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [requestWakeLock]);

  // ==========================================================
  // STOP MEDIA
  // ==========================================================

  const stopMediaTracks =
    useCallback(() => {
      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) => {
              try {
                track.stop();
              } catch {}
            }
          );

        mediaStreamRef.current =
          null;
      }
    }, []);

  // ==========================================================
  // ADD USER MESSAGE
  // ==========================================================

  const addUserMessage =
    useCallback(
      (message) => {
        const clean =
          String(
            message || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => [
            ...previous,
            {
              id:
                `user-${Date.now()}-${Math.random()}`,

              role: "user",

              text: clean,

              createdAt:
                Date.now(),
            },
          ]
        );
      },
      []
    );

  // ==========================================================
  // UPDATE LIVE ASSISTANT
  // ==========================================================

  const updateLiveAssistantMessage =
    useCallback(
      (
        answer,
        mode = "gpu"
      ) => {
        const clean =
          String(
            answer || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => {
            const liveId =
              liveAssistantMessageIdRef.current;

            if (!liveId) {
              const id =
                `assistant-live-${Date.now()}-${Math.random()}`;

              liveAssistantMessageIdRef.current =
                id;

              return [
                ...previous,
                {
                  id,
                  role: "assistant",
                  text: clean,
                  mode,
                  live: true,
                  createdAt:
                    Date.now(),
                },
              ];
            }

            return previous.map(
              (message) =>
                message.id === liveId
                  ? {
                      ...message,
                      text: clean,
                      mode,
                      live: true,
                    }
                  : message
            );
          }
        );
      },
      []
    );

  // ==========================================================
  // FINALIZE LIVE ASSISTANT
  // ==========================================================

  const finalizeLiveAssistantMessage =
    useCallback(
      (
        answer,
        mode = "gpu"
      ) => {
        const clean =
          String(
            answer || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => {
            const liveId =
              liveAssistantMessageIdRef.current;

            if (liveId) {
              return previous.map(
                (message) =>
                  message.id === liveId
                    ? {
                        ...message,
                        text: clean,
                        mode,
                        live: false,
                      }
                    : message
              );
            }

            return [
              ...previous,
              {
                id:
                  `assistant-${Date.now()}-${Math.random()}`,

                role: "assistant",

                text: clean,

                mode,

                live: false,

                createdAt:
                  Date.now(),
              },
            ];
          }
        );

        liveAssistantMessageIdRef.current =
          null;
      },
      []
    );

  // ==========================================================
  // PLAY AUDIO
  // ==========================================================

  const playAudio =
    useCallback(
      async (audioUrl) => {
        if (!audioUrl) {
          return;
        }

        try {
          if (
            audioRef.current
          ) {
            try {
              audioRef.current.pause();
            } catch {}

            audioRef.current =
              null;
          }

          const audio =
            new Audio(
              audioUrl
            );

          audio.preload =
            "auto";

          audioRef.current =
            audio;

          audio.onplay =
            () => {
              setIsPlaying(
                true
              );

              setStatus(
                "speaking"
              );

              setStatusMessage(
                "ANTIMATE iri kuvuga..."
              );
            };

          audio.onended =
            () => {
              setIsPlaying(
                false
              );

              setStatus(
                "ready"
              );

              setStatusMessage(
                "ANTIMATE yiteguye kongera kumva."
              );

              audioRef.current =
                null;

              voiceSessionActiveRef.current =
                false;

              stopMediaTracks();

              releaseWakeLock();
            };

          audio.onerror =
            () => {
              setIsPlaying(
                false
              );

              setStatus(
                "ready"
              );

              setStatusMessage(
                "Igisubizo cyabonetse ariko audio ntiyakinze."
              );

              audioRef.current =
                null;

              voiceSessionActiveRef.current =
                false;

              releaseWakeLock();
            };

          await audio.play();
        } catch (error) {
          console.error(
            "Audio playback failed:",
            error
          );

          setIsPlaying(
            false
          );
        }
      },
      [
        stopMediaTracks,
        releaseWakeLock,
      ]
    );

  // ==========================================================
  // SOCKET CONNECTION
  // ==========================================================

  useEffect(() => {
    const socket =
      io(
        SOCKET_URL,
        {
          transports: [
            "websocket",
            "polling",
          ],

          reconnection: true,

          reconnectionAttempts:
            Infinity,

          reconnectionDelay:
            1000,

          reconnectionDelayMax:
            5000,

          timeout:
            20000,

          autoConnect:
            true,

          auth: {
            token:
              getAuthToken(),
          },
        }
      );

    socketRef.current =
      socket;

    // --------------------------------------------------------
    // CONNECT
    // --------------------------------------------------------

    socket.on(
      "connect",
      () => {
        setSocketConnected(
          true
        );

        setErrorMessage("");

        refreshAgentContext();

        if (
          !isRecordingRef.current &&
          !voiceSessionActiveRef.current
        ) {
          setStatus(
            "ready"
          );

          setStatusMessage(
            "ANTIMATE yiteguye kumva."
          );
        }

        if (
          voiceSessionActiveRef.current
        ) {
          requestWakeLock();
        }
      }
    );

    // --------------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------------

    socket.on(
      "disconnect",
      () => {
        setSocketConnected(
          false
        );

        if (
          !isRecordingRef.current
        ) {
          setStatus(
            "disconnected"
          );

          setStatusMessage(
            "Connection yacitse. Ngerageza kongera kuyihuza..."
          );
        }
      }
    );

    // --------------------------------------------------------
    // CONNECT ERROR
    // --------------------------------------------------------

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket error:",
          error
        );

        setSocketConnected(
          false
        );

        setErrorMessage(
          "ANTIMATE server ntabwo iri kuboneka."
        );
      }
    );

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    socket.on(
      "antimate:status",
      (data = {}) => {
        const nextStatus =
          data.status ||
          "ready";

        setStatus(
          nextStatus
        );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        if (
          data.message
        ) {
          setStatusMessage(
            data.message
          );
        }

        if (
          nextStatus ===
          "recording"
        ) {
          setIsRecording(
            true
          );

          isRecordingRef.current =
            true;

          voiceSessionActiveRef.current =
            true;

          requestWakeLock();
        }

        if (
          [
            "converting",
            "processing",
            "gpu_fallback",
            "uploaded",
            "receiving",
            "thinking",
          ].includes(
            nextStatus
          )
        ) {
          setIsProcessing(
            true
          );
        }

        if (
          nextStatus ===
          "cancelled"
        ) {
          setIsRecording(
            false
          );

          setIsProcessing(
            false
          );

          isRecordingRef.current =
            false;

          voiceSessionActiveRef.current =
            false;

          releaseWakeLock();
        }
      }
    );

    // --------------------------------------------------------
    // TRANSCRIPT
    // --------------------------------------------------------

    socket.on(
      "antimate:transcript",
      (data = {}) => {
        const value =
          data.transcript ||
          data.text ||
          data.message ||
          "";

        if (value) {
          setTranscript(
            value
          );

          setStatusMessage(
            "ANTIMATE yumvise ibyo wavuze..."
          );
        }
      }
    );

    // --------------------------------------------------------
    // THINKING
    // --------------------------------------------------------

    socket.on(
      "antimate:thinking",
      (data = {}) => {
        setIsProcessing(
          true
        );

        setThinkingText(
          data.text ||
            "ANTIMATE iri gutekereza..."
        );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        setStatus(
          "processing"
        );
      }
    );

    // --------------------------------------------------------
    // ANSWER
    // --------------------------------------------------------

    socket.on(
      "antimate:answer",
      (data = {}) => {
        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          data.message ||
          "";

        const mode =
          data.mode ||
          data.processing_mode ||
          "gpu";

        if (!answer) {
          return;
        }

        setProcessingMode(
          mode
        );

        setCurrentAnswer(
          answer
        );

        setThinkingText("");

        updateLiveAssistantMessage(
          answer,
          mode
        );
      }
    );

    // --------------------------------------------------------
    // ANSWER CHUNK
    // --------------------------------------------------------

    socket.on(
      "antimate:answer:chunk",
      (data = {}) => {
        const chunk =
          data.chunk ||
          data.text ||
          data.answer ||
          "";

        if (!chunk) {
          return;
        }

        const mode =
          data.mode ||
          data.processing_mode ||
          "gpu";

        setProcessingMode(
          mode
        );

        setIsProcessing(
          true
        );

        setThinkingText("");

        setCurrentAnswer(
          (previous) => {
            const next =
              data.done
                ? chunk
                : previous + chunk;

            updateLiveAssistantMessage(
              next,
              mode
            );

            return next;
          }
        );
      }
    );

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    socket.on(
      "antimate:audio",
      (data = {}) => {
        const rawUrl =
          getAudioUrl(
            data.audio_url ||
              data.audioUrl ||
              data.audio
          );

        const audioUrl =
          makeAbsoluteUrl(
            rawUrl
          );

        if (
          data.mode
        ) {
          setProcessingMode(
            data.mode
          );
        }

        if (audioUrl) {
          playAudio(
            audioUrl
          );
        }
      }
    );

    // --------------------------------------------------------
    // COMPLETE
    // --------------------------------------------------------

    socket.on(
      "antimate:complete",
      (data = {}) => {
        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          "";

        const mode =
          data.processing_mode ||
          data.mode ||
          "gpu";

        setProcessingMode(
          mode
        );

        if (answer) {
          setCurrentAnswer(
            answer
          );

          finalizeLiveAssistantMessage(
            answer,
            mode
          );
        }

        setIsProcessing(
          false
        );

        setIsRecording(
          false
        );

        isRecordingRef.current =
          false;

        setStatus(
          "complete"
        );

        setStatusMessage(
          "ANTIMATE yarangije gusubiza."
        );
      }
    );

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    socket.on(
      "antimate:error",
      (data = {}) => {
        console.error(
          "ANTIMATE error:",
          data
        );

        const message =
          data.message ||
          data.error ||
          "ANTIMATE AI habayemo ikibazo.";

        setErrorMessage(
          message
        );

        setIsRecording(
          false
        );

        setIsProcessing(
          false
        );

        isRecordingRef.current =
          false;

        voiceSessionActiveRef.current =
          false;

        setStatus(
          "error"
        );

        setStatusMessage(
          message
        );

        stopMediaTracks();

        releaseWakeLock();
      }
    );

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      socket.removeAllListeners();

      socket.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }
    };
  }, [
    finalizeLiveAssistantMessage,
    playAudio,
    refreshAgentContext,
    requestWakeLock,
    releaseWakeLock,
    stopMediaTracks,
    updateLiveAssistantMessage,
  ]);

  // ==========================================================
  // START RECORDING
  // ==========================================================

  const startRecording =
    useCallback(
      async () => {
        if (
          isRecordingRef.current
        ) {
          return;
        }

        if (
          isProcessing ||
          isPlaying
        ) {
          return;
        }

        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          setErrorMessage(
            "ANTIMATE server ntabwo ihujwe na Socket.IO."
          );

          setStatus(
            "error"
          );

          return;
        }

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          setErrorMessage(
            "Browser yawe ntabwo yemera microphone."
          );

          setStatus(
            "error"
          );

          return;
        }

        try {
          const context =
            refreshAgentContext();

          setErrorMessage("");

          setTranscript("");

          setThinkingText("");

          setCurrentAnswer("");

          liveAssistantMessageIdRef.current =
            null;

          audioChunksRef.current =
            [];

          voiceSessionActiveRef.current =
            true;

          await requestWakeLock();

          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                audio: {
                  channelCount: 1,

                  echoCancellation:
                    true,

                  noiseSuppression:
                    true,

                  autoGainControl:
                    true,
                },

                video: false,
              }
            );

          mediaStreamRef.current =
            stream;

          const mimeType =
            getSupportedMimeType();

          let recorder;

          try {
            recorder =
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
          } catch {
            recorder =
              new MediaRecorder(
                stream
              );
          }

          mediaRecorderRef.current =
            recorder;

          const actualMimeType =
            recorder.mimeType ||
            mimeType ||
            "audio/webm";

          const extension =
            extensionFromMimeType(
              actualMimeType
            );

          // --------------------------------------------------
          // START AGENTIC VOICE SESSION
          // --------------------------------------------------

          socket.emit(
            "antimate:voice:start",
            {
              mimeType:
                actualMimeType,

              extension,

              language:
                "rw",

              // Agentic context
              context,

              // Guest/auth state
              mode:
                context.mode,

              authenticated:
                context.authenticated,
            }
          );

          // --------------------------------------------------
          // AUDIO DATA
          // --------------------------------------------------

          recorder.ondataavailable =
            (event) => {
              if (
                !event.data ||
                event.data.size === 0
              ) {
                return;
              }

              audioChunksRef.current.push(
                event.data
              );

              if (
                socket.connected &&
                isRecordingRef.current
              ) {
                event.data
                  .arrayBuffer()
                  .then(
                    (
                      arrayBuffer
                    ) => {
                      if (
                        socket.connected &&
                        isRecordingRef.current
                      ) {
                        socket.emit(
                          "antimate:voice:chunk",
                          arrayBuffer
                        );
                      }
                    }
                  )
                  .catch(
                    console.error
                  );
              }
            };

          // --------------------------------------------------
          // ERROR
          // --------------------------------------------------

          recorder.onerror =
            () => {
              setErrorMessage(
                "Microphone recording habayemo ikibazo."
              );

              setStatus(
                "error"
              );

              isRecordingRef.current =
                false;

              setIsRecording(
                false
              );

              voiceSessionActiveRef.current =
                false;

              try {
                socket.emit(
                  "antimate:voice:cancel"
                );
              } catch {}

              stopMediaTracks();

              releaseWakeLock();
            };

          // --------------------------------------------------
          // START
          // --------------------------------------------------

          isRecordingRef.current =
            true;

          setIsRecording(
            true
          );

          setIsProcessing(
            false
          );

          setStatus(
            "recording"
          );

          setStatusMessage(
            "ANTIMATE iri kumva..."
          );

          recorder.start(
            CHUNK_INTERVAL_MS
          );

          // --------------------------------------------------
          // MAX RECORDING
          // --------------------------------------------------

          clearTimeout(
            autoStopTimerRef.current
          );

          autoStopTimerRef.current =
            setTimeout(
              () => {
                if (
                  isRecordingRef.current
                ) {
                  stopRecording();
                }
              },
              MAX_RECORDING_MS
            );
        } catch (error) {
          console.error(
            "Microphone error:",
            error
          );

          setErrorMessage(
            error?.message ||
              "Microphone ntiyashoboye gufunguka."
          );

          setStatus(
            "error"
          );

          isRecordingRef.current =
            false;

          setIsRecording(
            false
          );

          voiceSessionActiveRef.current =
            false;

          stopMediaTracks();

          releaseWakeLock();
        }
      },
      [
        isProcessing,
        isPlaying,
        refreshAgentContext,
        requestWakeLock,
        releaseWakeLock,
        stopMediaTracks,
      ]
    );

  // ==========================================================
  // STOP RECORDING
  // ==========================================================

  const stopRecording =
    useCallback(
      () => {
        clearTimeout(
          autoStopTimerRef.current
        );

        autoStopTimerRef.current =
          null;

        clearTimeout(
          shortClickTimerRef.current
        );

        shortClickTimerRef.current =
          null;

        const socket =
          socketRef.current;

        const recorder =
          mediaRecorderRef.current;

        if (
          !isRecordingRef.current
        ) {
          return;
        }

        isRecordingRef.current =
          false;

        setIsRecording(
          false
        );

        setIsProcessing(
          true
        );

        setStatus(
          "uploaded"
        );

        setStatusMessage(
          "Audio yakiriwe. ANTIMATE iri gutekereza..."
        );

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          recorder.onstop =
            () => {
              stopMediaTracks();

              if (
                socket &&
                socket.connected
              ) {
                socket.emit(
                  "antimate:voice:end",
                  {
                    context:
                      agentContextRef.current,
                  }
                );
              }
            };

          try {
            recorder.stop();
          } catch {
            stopMediaTracks();

            if (
              socket &&
              socket.connected
            ) {
              socket.emit(
                "antimate:voice:end",
                {
                  context:
                    agentContextRef.current,
                }
              );
            }
          }
        } else {
          stopMediaTracks();

          if (
            socket &&
            socket.connected
          ) {
            socket.emit(
              "antimate:voice:end",
              {
                context:
                  agentContextRef.current,
              }
            );
          }
        }

        mediaRecorderRef.current =
          null;
      },
      [stopMediaTracks]
    );

  // ==========================================================
  // CANCEL RECORDING
  // ==========================================================

  const cancelRecording =
    useCallback(
      () => {
        clearTimeout(
          autoStopTimerRef.current
        );

        clearTimeout(
          holdTimerRef.current
        );

        clearTimeout(
          shortClickTimerRef.current
        );

        autoStopTimerRef.current =
          null;

        holdTimerRef.current =
          null;

        shortClickTimerRef.current =
          null;

        isHoldingRef.current =
          false;

        isRecordingRef.current =
          false;

        setIsRecording(
          false
        );

        setIsProcessing(
          false
        );

        setStatus(
          "cancelled"
        );

        setStatusMessage(
          "Recording yahagaritswe."
        );

        const socket =
          socketRef.current;

        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "antimate:voice:cancel"
          );
        }

        const recorder =
          mediaRecorderRef.current;

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          try {
            recorder.stop();
          } catch {}
        }

        mediaRecorderRef.current =
          null;

        stopMediaTracks();

        voiceSessionActiveRef.current =
          false;

        releaseWakeLock();
      },
      [
        releaseWakeLock,
        stopMediaTracks,
      ]
    );

  // ==========================================================
  // POINTER DOWN
  // ==========================================================

  const handleRecordPointerDown =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          isRecordingRef.current ||
          isProcessing ||
          isPlaying
        ) {
          return;
        }

        try {
          event.currentTarget.setPointerCapture?.(
            event.pointerId
          );
        } catch {}

        isHoldingRef.current =
          true;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          setTimeout(
            () => {
              if (
                isHoldingRef.current
              ) {
                startRecording();
              }
            },
            HOLD_TO_RECORD_MS
          );
      },
      [
        isProcessing,
        isPlaying,
        startRecording,
      ]
    );

  // ==========================================================
  // POINTER UP
  // ==========================================================

  const handleRecordPointerUp =
    useCallback(
      (event) => {
        event.preventDefault();

        try {
          event.currentTarget.releasePointerCapture?.(
            event.pointerId
          );
        } catch {}

        const wasHolding =
          isHoldingRef.current;

        isHoldingRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        holdTimerRef.current =
          null;

        // ------------------------------------------------------
        // HOLD
        // ------------------------------------------------------

        if (
          isRecordingRef.current
        ) {
          stopRecording();
          return;
        }

        // ------------------------------------------------------
        // SHORT CLICK
        // ------------------------------------------------------

        if (wasHolding) {
          startRecording();

          clearTimeout(
            shortClickTimerRef.current
          );

          shortClickTimerRef.current =
            setTimeout(
              () => {
                if (
                  isRecordingRef.current
                ) {
                  stopRecording();
                }
              },
              SHORT_CLICK_RECORDING_MS
            );
        }
      },
      [
        startRecording,
        stopRecording,
      ]
    );

  // ==========================================================
  // POINTER CANCEL
  // ==========================================================

  const handleRecordPointerCancel =
    useCallback(
      (event) => {
        event.preventDefault();

        isHoldingRef.current =
          false;

        clearTimeout(
          holdTimerRef.current
        );

        clearTimeout(
          shortClickTimerRef.current
        );

        holdTimerRef.current =
          null;

        shortClickTimerRef.current =
          null;

        if (
          isRecordingRef.current
        ) {
          stopRecording();
        }
      },
      [stopRecording]
    );

  // ==========================================================
  // SEND TEXT
  // ==========================================================

  const sendTextMessage =
    useCallback(
      async () => {
        const cleanText =
          text.trim();

        if (!cleanText) {
          return;
        }

        if (
          isProcessing ||
          isRecording ||
          isPlaying
        ) {
          return;
        }

        const context =
          refreshAgentContext();

        setText("");

        setErrorMessage("");

        setStatus(
          "processing"
        );

        setIsProcessing(
          true
        );

        setThinkingText(
          "ANTIMATE iri gutekereza..."
        );

        setCurrentAnswer("");

        liveAssistantMessageIdRef.current =
          null;

        addUserMessage(
          cleanText
        );

        // ------------------------------------------------------
        // Conversation context
        // ------------------------------------------------------

        const recentMessages =
          messages
            .slice(
              -MAX_CONTEXT_MESSAGES
            )
            .map(
              (message) => ({
                role:
                  message.role,

                text:
                  message.text,
              })
            );

        try {
          const token =
            getAuthToken();

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
              CHAT_URL,
              {
                method:
                  "POST",

                headers,

                body:
                  JSON.stringify({
                    message:
                      cleanText,

                    language:
                      "rw",

                    // ------------------------------------------------
                    // AGENTIC CONTEXT
                    // ------------------------------------------------

                    context,

                    agent_context:
                      context,

                    user_context:
                      context.user,

                    system_context: {
                      chicks:
                        context.chicks,

                      brooder:
                        context.brooder,
                    },

                    telemetry:
                      context.telemetry,

                    conversation:
                      recentMessages,

                    guest:
                      context.mode ===
                      "guest",

                    authenticated:
                      context.authenticated,
                  }),
              }
            );

          let data = {};

          try {
            data =
              await response.json();
          } catch {}

          if (
            !response.ok
          ) {
            throw new Error(
              data.message ||
                data.error ||
                "ANTIMATE ntiyashoboye gusubiza."
            );
          }

          const answer =
            data.answer ||
            data.answer_rw ||
            data.answer_kinyarwanda ||
            data.message ||
            data.text ||
            "";

          if (!answer) {
            throw new Error(
              "ANTIMATE ntiyagaruye igisubizo."
            );
          }

          const mode =
            data.processing_mode ||
            data.mode ||
            "gpu";

          setProcessingMode(
            mode
          );

          setCurrentAnswer(
            answer
          );

          setThinkingText("");

          addAssistantMessage(
            answer,
            mode
          );

          const rawAudio =
            getAudioUrl(
              data.audio_url ||
                data.audioUrl ||
                data.audio
            );

          const audioUrl =
            makeAbsoluteUrl(
              rawAudio
            );

          if (audioUrl) {
            await playAudio(
              audioUrl
            );
          } else {
            setStatus(
              "complete"
            );

            setStatusMessage(
              "ANTIMATE yarangije gusubiza."
            );
          }
        } catch (error) {
          console.error(
            "Text chat error:",
            error
          );

          setErrorMessage(
            error?.message ||
              "ANTIMATE ntiyashoboye gusubiza."
          );

          setStatus(
            "error"
          );

          setStatusMessage(
            error?.message ||
              "Habaye ikibazo."
          );
        } finally {
          setIsProcessing(
            false
          );

          setThinkingText("");
        }
      },
      [
        text,
        isProcessing,
        isRecording,
        isPlaying,
        refreshAgentContext,
        messages,
        addUserMessage,
        playAudio,
      ]
    );

  // ==========================================================
  // ADD ASSISTANT MESSAGE
  // ==========================================================

  const addAssistantMessage =
    useCallback(
      (
        message,
        mode = "gpu"
      ) => {
        const clean =
          String(
            message || ""
          ).trim();

        if (!clean) {
          return;
        }

        setMessages(
          (previous) => {
            const last =
              previous[
                previous.length - 1
              ];

            if (
              last?.role ===
                "assistant" &&
              last?.text ===
                clean
            ) {
              return previous;
            }

            return [
              ...previous,
              {
                id:
                  `assistant-${Date.now()}-${Math.random()}`,

                role:
                  "assistant",

                text:
                  clean,

                mode,

                live:
                  false,

                createdAt:
                  Date.now(),
              },
            ];
          }
        );
      },
      []
    );

  // ==========================================================
  // ENTER
  // ==========================================================

  const handleTextKeyDown =
    useCallback(
      (event) => {
        if (
          event.key ===
            "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          sendTextMessage();
        }
      },
      [sendTextMessage]
    );

  // ==========================================================
  // CLEAR ERROR
  // ==========================================================

  const clearError =
    useCallback(() => {
      setErrorMessage("");

      if (
        !isRecording &&
        !isProcessing &&
        !isPlaying
      ) {
        setStatus(
          "ready"
        );

        setStatusMessage(
          "ANTIMATE yiteguye kumva."
        );
      }
    }, [
      isRecording,
      isProcessing,
      isPlaying,
    ]);

  // ==========================================================
  // REFRESH CONTEXT PERIODICALLY
  // ==========================================================

  useEffect(() => {
    const interval =
      setInterval(
        () => {
          refreshAgentContext();
        },
        15000
      );

    return () =>
      clearInterval(
        interval
      );
  }, [
    refreshAgentContext,
  ]);

  // ==========================================================
  // SAVE CONVERSATION LOCALLY
  // ==========================================================

  useEffect(() => {
    try {
      const limited =
        messages.slice(
          -50
        );

      safeStorageSet(
        "antimateConversation",
        JSON.stringify(
          limited
        )
      );
    } catch {}
  }, [messages]);

  // ==========================================================
  // LOAD CONVERSATION
  // ==========================================================

  useEffect(() => {
    const saved =
      safeJSONParse(
        safeStorageGet(
          "antimateConversation"
        ),
        []
      );

    if (
      Array.isArray(saved) &&
      saved.length
    ) {
      setMessages(
        saved
      );
    }
  }, []);

  // ==========================================================
  // FINAL CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      clearTimeout(
        holdTimerRef.current
      );

      clearTimeout(
        autoStopTimerRef.current
      );

      clearTimeout(
        shortClickTimerRef.current
      );

      const socket =
        socketRef.current;

      if (
        socket &&
        socket.connected &&
        isRecordingRef.current
      ) {
        socket.emit(
          "antimate:voice:cancel"
        );
      }

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        try {
          recorder.stop();
        } catch {}
      }

      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) => {
              try {
                track.stop();
              } catch {}
            }
          );
      }

      if (
        audioRef.current
      ) {
        try {
          audioRef.current.pause();
        } catch {}
      }

      voiceSessionActiveRef.current =
        false;

      if (
        wakeLockRef.current
      ) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, []);

  // ==========================================================
  // BUTTON CLASS
  // ==========================================================

  const recordButtonClass =
    [
      "antimate-record-button",

      isRecording
        ? "recording"
        : "",

      isProcessing
        ? "processing"
        : "",

      isPlaying
        ? "speaking"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="antimate-ai">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="antimate-header">

        <div className="antimate-brand">

          <div className="antimate-logo">
            <span />
          </div>

          <div>
            <h1>
              ANTIMATE AI
            </h1>

            <span className="antimate-subtitle">
              Kinyarwanda Agentic AI
            </span>
          </div>

        </div>

        <div
          className={[
            "antimate-connection",
            socketConnected
              ? "online"
              : "offline",
          ].join(" ")}
        >
          <span className="connection-dot" />

          {socketConnected
            ? "Online"
            : "Connecting..."}
        </div>

      </header>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="antimate-main">

        {/* ==================================================
            CHAT
        ================================================== */}

        <section className="antimate-chat">

          {messages.length === 0 && (
            <div className="antimate-empty">

              <div className="antimate-empty-logo">
                <span />
              </div>

              <h2>
                Muraho, ndi ANTIMATE
              </h2>

              <p>
                Vuga cyangwa wandike ubutumwa
                mu Kinyarwanda.
              </p>

              {contextSummary.guest ? (
                <small>
                  Uri gukoresha ANTIMATE nka Guest.
                </small>
              ) : (
                <small>
                  ANTIMATE iri gukoresha amakuru
                  yawe kugira ngo igusubize neza.
                </small>
              )}

            </div>
          )}

          <div className="antimate-messages">

            {messages.map(
              (message) => (
                <div
                  key={
                    message.id
                  }
                  className={[
                    "antimate-message",

                    message.role ===
                    "user"
                      ? "user"
                      : "assistant",
                  ].join(" ")}
                >

                  <div className="message-bubble">
                    {message.text}
                  </div>

                  {message.role ===
                    "assistant" &&
                    message.mode && (
                      <div className="message-mode">
                        {message.mode ===
                        "cpu"
                          ? "CPU"
                          : "GPU"}
                      </div>
                    )}

                </div>
              )
            )}

          </div>

          {/* ================================================
              LIVE TRANSCRIPT
          ================================================ */}

          {transcript && (
            <div className="antimate-live-transcript">

              <span>
                Wavuze:
              </span>

              <p>
                {transcript}
              </p>

            </div>
          )}

          {/* ================================================
              THINKING
          ================================================ */}

          {isProcessing &&
            thinkingText && (
              <div className="antimate-thinking">

                <div className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span>
                  {thinkingText}
                </span>

                {processingMode && (
                  <small>
                    {processingMode ===
                    "cpu"
                      ? "CPU"
                      : "GPU"}
                  </small>
                )}

              </div>
            )}

          {/* ================================================
              CURRENT ANSWER
          ================================================ */}

          {currentAnswer && (
            <div className="antimate-current-answer">
              {currentAnswer}
            </div>
          )}

        </section>

        {/* ==================================================
            STATUS
        ================================================== */}

        <div
          className={[
            "antimate-status",
            status,
          ].join(" ")}
        >

          <span className="status-indicator" />

          <span>
            {statusMessage}
          </span>

          {processingMode && (
            <span className="status-mode">
              {processingMode ===
              "cpu"
                ? "CPU"
                : "GPU"}
            </span>
          )}

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {errorMessage && (
          <div className="antimate-error">

            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={
                clearError
              }
              aria-label="Close error"
            >
              ×
            </button>

          </div>
        )}

        {/* ==================================================
            VOICE CONTROL
        ================================================== */}

        <section className="antimate-voice-control">

          <button
            type="button"

            className={
              recordButtonClass
            }

            onPointerDown={
              handleRecordPointerDown
            }

            onPointerUp={
              handleRecordPointerUp
            }

            onPointerCancel={
              handleRecordPointerCancel
            }

            onPointerLeave={
              isRecording
                ? undefined
                : handleRecordPointerCancel
            }

            disabled={
              isProcessing ||
              isPlaying ||
              !socketConnected
            }

            aria-label={
              isRecording
                ? "Reka gufata amajwi"
                : "Fata amajwi"
            }

          >

            <span className="record-button-ring" />

            <span className="record-icon">

              {isRecording
                ? "■"
                : isPlaying
                ? "🔊"
                : "🎙️"}

            </span>

          </button>

          <div className="voice-help">

            {isRecording
              ? "Reka button uhagarike recording"
              : "Kanda gato cyangwa uyifateho uvuge"}

          </div>

        </section>

        {/* ==================================================
            TEXT INPUT
        ================================================== */}

        <section className="antimate-input">

          <textarea
            value={text}

            onChange={(event) =>
              setText(
                event.target.value
              )
            }

            onKeyDown={
              handleTextKeyDown
            }

            placeholder="Andika ubutumwa mu Kinyarwanda..."

            rows={1}

            disabled={
              isProcessing ||
              isRecording ||
              isPlaying
            }
          />

          <button
            type="button"

            onClick={
              sendTextMessage
            }

            disabled={
              !text.trim() ||
              isProcessing ||
              isRecording ||
              isPlaying
            }

            className="antimate-send-button"

            aria-label="Send message"
          >
            ➤
          </button>

        </section>

      </main>

    </div>
  );
}