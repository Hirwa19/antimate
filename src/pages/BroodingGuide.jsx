import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

/*
============================================================
ANTIMATE — BROODING KNOWLEDGE CENTER
============================================================

PUBLIC PAGE
Route:
  /brooding-guide

FEATURES
- Kinyarwanda / English
- Light / Dark theme
- Searchable knowledge center
- Brooding conditions
- Feeding guide
- Disease quick reference
- Rwanda poultry data
- Profitability calculator
- Traditional vs ANTIMATE BR System
- Farmer problems
- Kinyarwanda videos
- Chicks brooding image
- Floating ANTIMATE AI assistant
- Text chat
- Socket.IO voice chat
- Click / hold voice recording
- Scrolling AI conversation
- No Tailwind
- No external CSS file
============================================================
*/

/* =========================================================
   CONFIG
========================================================= */

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
const SHORT_RECORDING_MS = 1800;
const CHUNK_INTERVAL_MS = 250;
const MAX_RECORDING_MS =
  Number(
    import.meta.env.VITE_ANTIMATE_MAX_RECORDING_MS
  ) || 120000;

/* =========================================================
   IMAGE
========================================================= */

/*
  Wikimedia Commons:
  "Brooder Cage.jpg"
  Baby chicks in a brooder.
*/
const BROODER_IMAGE =
  "https://imgs.search.brave.com/ImG1osAd3QEKhrfy6aD1UmapElyvTEn1OOOJwq02wNs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/bGl2ZXN0b2NraW5n/Lm5ldC93cC1jb250/ZW50L3VwbG9hZHMv/MjAxNS8wNy9BLXR5/cGljYWwtYnJvb2Rl/ci1ob3VzZS0xMDI0/eDUzOC5qcGc";

/* =========================================================
   VIDEOS
   Rwanda Agri / Kinyarwanda
========================================================= */

const VIDEOS = [
  {
    id: "9N9fQMoD9BU",
    titleRW:
      "Ubworozi bw'inkoko — Inama ku mworozi",
    titleEN:
      "Poultry farming — Advice for poultry farmers",
    descriptionRW:
      "Video ya Rwanda Agri itanga inama ku bworozi bw'inkoko za kijyambere.",
    descriptionEN:
      "A Rwanda Agri video with practical advice for modern poultry farming.",
  },
  {
    id: "y0lbrNEbwAE",
    titleRW:
      "Ubworozi bw'inkoko — Amahirwe ku rubyiruko",
    titleEN:
      "Poultry farming — An opportunity for youth",
    descriptionRW:
      "Reba uko ubworozi bw'inkoko bushobora kuba umushinga w'iterambere.",
    descriptionEN:
      "Learn how poultry farming can become a business opportunity.",
  },
];

/* =========================================================
   KNOWLEDGE DATA
========================================================= */

const FEEDING_DATA = [
  {
    ageRW: "0–7 iminsi",
    ageEN: "0–7 days",
    feedRW: "Starter",
    feedEN: "Starter",
    goalRW:
      "Gutanga intungamubiri nyinshi no gufasha igogora ritangire neza.",
    goalEN:
      "Provide concentrated nutrients for early development.",
    noteRW:
      "Amazi meza agomba kuboneka igihe cyose.",
    noteEN:
      "Clean water should be available at all times.",
  },
  {
    ageRW: "8–14 iminsi",
    ageEN: "8–14 days",
    feedRW: "Starter",
    feedEN: "Starter",
    goalRW:
      "Gukomeza gukura vuba no kubaka amagufwa n'imitsi.",
    goalEN:
      "Support rapid growth, bone and muscle development.",
    noteRW:
      "Reba ko imishwi yose ibona aho irira.",
    noteEN:
      "Ensure all chicks can access the feeder.",
  },
  {
    ageRW: "15–21 iminsi",
    ageEN: "15–21 days",
    feedRW:
      "Starter / Grower transition",
    feedEN:
      "Starter / Grower transition",
    goalRW:
      "Gutegura imishwi kujya mu cyiciro gikurikira.",
    goalEN:
      "Prepare chicks for the next feeding phase.",
    noteRW:
      "Hindura ibiryo buhoro ukurikije gahunda y'ibiryo ukoresha.",
    noteEN:
      "Transition gradually according to your feed program.",
  },
  {
    ageRW: "22–28 iminsi",
    ageEN: "22–28 days",
    feedRW: "Grower",
    feedEN: "Grower",
    goalRW:
      "Gushyigikira gukura kw'umubiri no gukoresha neza ibiryo.",
    goalEN:
      "Support body growth and feed efficiency.",
    noteRW:
      "Komeza gukurikirana amazi, isuku n'uburemere.",
    noteEN:
      "Continue monitoring water, hygiene and body weight.",
  },
];

const CONDITION_DATA = [
  {
    ageRW: "0–7",
    ageEN: "0–7",
    temp: "32–35°C",
    humidity: "≈ 50–70%",
    behaviorRW:
      "Imishwi ikwirakwiye neza, ikarya kandi ikanywa.",
    behaviorEN:
      "Chicks are evenly distributed, eating and drinking.",
  },
  {
    ageRW: "8–14",
    ageEN: "8–14",
    temp: "29–32°C",
    humidity: "≈ 50–70%",
    behaviorRW:
      "Igabanya ubushyuhe buhoro; imishwi ntigomba kwirundanyiriza hamwe.",
    behaviorEN:
      "Reduce heat gradually; chicks should not huddle tightly.",
  },
  {
    ageRW: "15–21",
    ageEN: "15–21",
    temp: "27–29°C",
    humidity: "≈ 50–70%",
    behaviorRW:
      "Komeza guha umwuka mwiza no kugenzura litter.",
    behaviorEN:
      "Maintain ventilation and monitor litter condition.",
  },
  {
    ageRW: "22–28",
    ageEN: "22–28",
    temp: "≈ 21–27°C",
    humidity: "≈ 50–70%",
    behaviorRW:
      "Imishwi iba yatangiye kwihanganira ubushyuhe bwo mu kiraro.",
    behaviorEN:
      "Chicks increasingly tolerate normal house temperatures.",
  },
];

const DISEASE_DATA = [
  {
    nameRW: "Coccidiosis",
    nameEN: "Coccidiosis",
    symptomsRW:
      "Impiswi, intege nke, kugabanuka kurya; rimwe na rimwe amaraso mu musarani.",
    symptomsEN:
      "Diarrhea, weakness, reduced appetite; sometimes blood in droppings.",
    causeRW:
      "Parasites za Eimeria, cyane cyane ahantu hari litter itose kandi yanduye.",
    causeEN:
      "Eimeria parasites, especially where litter is wet and contaminated.",
    actionRW:
      "Tandukanya ikibazo, sukura litter, hamagara veterineri kugira ngo hemezwe indwara.",
    actionEN:
      "Control contamination and seek veterinary confirmation and treatment.",
  },
  {
    nameRW: "Newcastle",
    nameEN: "Newcastle disease",
    symptomsRW:
      "Guhumeka nabi, inkorora, kugwa intege, ibimenyetso by'imitsi cyangwa impfu zitunguranye.",
    symptomsEN:
      "Respiratory signs, weakness, neurological signs or sudden deaths.",
    causeRW:
      "Virus ikwirakwira vuba hagati y'inkoko.",
    causeEN:
      "A highly contagious viral disease.",
    actionRW:
      "Tandukanya izirwaye kandi hamagara veterineri. Gahunda yo gukingira ni ingenzi.",
    actionEN:
      "Isolate affected birds and contact a veterinarian. Vaccination planning is essential.",
  },
  {
    nameRW: "Fowl pox",
    nameEN: "Fowl pox",
    symptomsRW:
      "Ibibyimba cyangwa utubyimba ku ruhu, cyane cyane hafi y'umutwe n'ahandi hatagira amababa menshi.",
    symptomsEN:
      "Scabs or lesions on the skin, especially around the head and exposed areas.",
    causeRW:
      "Virus ya fowl pox; imibu n'ibindi byanduza bishobora kugira uruhare.",
    causeEN:
      "Fowl pox virus; mosquitoes and other vectors can contribute.",
    actionRW:
      "Isuku, kugenzura imibu no gukurikiza gahunda yo gukingira.",
    actionEN:
      "Improve hygiene, vector control and follow a vaccination program.",
  },
  {
    nameRW: "Omphalitis",
    nameEN: "Omphalitis / early chick infection",
    symptomsRW:
      "Imishwi idafite imbaraga, inda cyangwa umubyimba w'umukondo wabyimbye, impfu mu minsi ya mbere.",
    symptomsEN:
      "Weak chicks, swollen/infected navels and early mortality.",
    causeRW:
      "Isuku nke mu gihe cyo kuvuka, hatchery cyangwa brooding environment.",
    causeEN:
      "Poor hygiene around hatching, hatchery or brooding conditions.",
    actionRW:
      "Kunoza isuku no gushaka inama ya veterineri niba impfu zikomeje.",
    actionEN:
      "Improve hygiene and seek veterinary help if mortality continues.",
  },
  {
    nameRW: "Indwara z'ubuhumekero",
    nameEN: "Respiratory problems",
    symptomsRW:
      "Inkorora, guhumeka cyane, gusohora amazi mu mazuru cyangwa kugabanyuka kw'ibiryo.",
    symptomsEN:
      "Coughing, difficult breathing, nasal discharge or reduced feeding.",
    causeRW:
      "Umwuka mubi, umukungugu, ammonia nyinshi, ubukonje cyangwa infection.",
    causeEN:
      "Poor ventilation, dust, high ammonia, cold stress or infection.",
    actionRW:
      "Reba ventilation, litter na ammonia; niba bikomeje hamagara veterineri.",
    actionEN:
      "Check ventilation, litter and ammonia; seek veterinary help if persistent.",
  },
];

const FARMER_PROBLEMS = [
  {
    icon: "❄",
    titleRW: "Imishwi irundanyije hamwe",
    titleEN: "Chicks are huddling",
    textRW:
      "Akenshi bishobora kwerekana ubukonje cyangwa ahantu hashyushye hadahagije. Reba temperature ku rwego rw'imishwi.",
    textEN:
      "This can indicate cold stress or insufficient warmth. Check temperature at chick level.",
  },
  {
    icon: "☀",
    titleRW: "Imishwi irasandara kandi igahumeka cyane",
    titleEN: "Chicks are spreading and panting",
    textRW:
      "Bishobora kwerekana ubushyuhe bukabije. Reba ubushyuhe, ventilation n'aho heat source iri.",
    textEN:
      "This can indicate overheating. Check temperature, ventilation and heat-source position.",
  },
  {
    icon: "💧",
    titleRW: "Litter iratose",
    titleEN: "Wet litter",
    textRW:
      "Reba waterer, ventilation, ubwinshi bw'amazi n'ubucucike bw'imishwi.",
    textEN:
      "Check the drinker, ventilation, water spillage and stocking density.",
  },
  {
    icon: "🌬",
    titleRW: "Umwuka mubi",
    titleEN: "Poor air quality",
    textRW:
      "Fungura ventilation mu buryo budatera draft ikomeye ku mishwi kandi ukureho litter yanduye.",
    textEN:
      "Improve ventilation without creating strong drafts and remove contaminated litter.",
  },
  {
    icon: "🥣",
    titleRW: "Imishwi ntirya neza",
    titleEN: "Poor feeding",
    textRW:
      "Reba feeder access, ubwoko bw'ibiryo, amazi, ubushyuhe n'ibimenyetso by'indwara.",
    textEN:
      "Check feeder access, feed quality, water, temperature and signs of disease.",
  },
  {
    icon: "⚠",
    titleRW: "Imfu zitunguranye",
    titleEN: "Sudden mortality",
    textRW:
      "Tandukanya ibibazo, ntukihutire gutanga imiti utazi indwara; hamagara veterineri.",
    textEN:
      "Investigate quickly, avoid blind medication and contact a veterinarian.",
  },
];

/* =========================================================
   TRANSLATIONS
========================================================= */

const T = {
  rw: {
    search: "Shakisha mu makuru...",
    knowledgeCenter: "Ikigo cy’Amakuru y’Ubworozi",
    subtitle:
      "Aho umworozi abona amakuru, ibipimo, inama n'ibikoresho byo gufata ibyemezo neza.",
    overview: "Incamake",
    feeding: "Kugaburira",
    conditions: "Ubushyuhe & Ubushuhe",
    diseases: "Indwara",
    rwandaData: "Rwanda",
    profit: "Inyungu",
    comparison: "ANTIMATE BR",
    problems: "Ibibazo bikunze kubaho",
    videos: "Video zo kwiga",
    help: "Ubufasha",
    askAI: "Baza ANTIMATE AI",
    readMore: "Soma byinshi",
    approximate:
      "Ibi ni ibipimo rusange; ubwoko bw'inkoko, ikiraro, ventilation n'ikirere bishobora kubihindura.",
    feedingTitle:
      "Imbonerahamwe yo kugaburira imishwi",
    feedingText:
      "Koresha iyi table nk'ikiguzi cy'amakuru rusange. Gahunda y'ibiryo y'uruganda ukoresha ni yo igomba kuza imbere.",
    conditionTitle:
      "Ibidukikije by'imishwi",
    conditionText:
      "Temperature igomba gupimwa hafi y'imishwi, ntabwo ari kure ya brooder.",
    diseaseTitle:
      "Indwara: ibimenyetso, impamvu n'icyo gukora",
    diseaseText:
      "Iyi ni reference y'ibanze; indwara nyinshi zisaba kwemezwa na veterineri cyangwa laboratoire.",
    rwandaTitle:
      "Ubworozi bw'inkoko mu Rwanda",
    rwandaText:
      "Imibare ishobora gutandukana bitewe n'uburyo n'umwaka by'ibarura.",
    profitTitle:
      "Kabara niba umushinga ushobora kunguka",
    profitText:
      "Hindura imibare iri hasi ukurikije igiciro cyawe nyacyo.",
    chicks: "Umubare w'imishwi",
    chickPrice: "Igiciro cy'umushwi",
    feedCost: "Ibiryo / umushwi",
    healthCost: "Ubuzima / imishwi",
    heatingCost: "Ubushyuhe n'amashanyarazi",
    otherCost: "Ibindi",
    mortality: "Imfu (%)",
    salePrice: "Igiciro cyo kugurisha",
    revenue: "Amafaranga winjiza",
    totalCost: "Igiteranyo cy'ibyakoreshejwe",
    profit: "Inyungu",
    margin: "Profit margin",
    breakEven: "Break-even / umushwi",
    traditional: "Uburyo busanzwe",
    antimateBR: "ANTIMATE BR System",
    oldHeating:
      "Umworozi agenzura ubushyuhe kenshi cyangwa agakoresha timer/heat source idafite feedback ihoraho.",
    newHeating:
      "Sensors zikurikirana ibidukikije, system ikohereza telemetry kandi ishobora gukoresha control ya heater/fan bitewe n'ibiri mu system.",
    oldManual: "Manual monitoring",
    newAutomatic: "Sensor-based monitoring",
    oldHistory: "Amakuru make y'ibyabaye",
    newHistory: "Telemetry & history",
    oldAlert: "Umworozi amenya ikibazo atinze",
    newAlert: "Alerts zishobora kumufasha kumenya ikibazo vuba",
    videoTitle:
      "Kwiga uko abandi borozi babikora",
    videoText:
      "Izi video zatoranyijwe mu Kinyarwanda kugira ngo amakuru yumvikane neza.",
    helpTitle:
      "Hari ikibazo utabonye igisubizo?",
    helpText:
      "Baza ANTIMATE AI uri kuri uru rupapuro, cyangwa ujye ku rupapuro rw'ubufasha.",
    openAI: "Fungura ANTIMATE AI",
    helpPage: "Ubufasha",
    imageCaption:
      "Urugero rwa brooder irimo imishwi — reba uko ikwirakwira hafi y'ubushyuhe, amazi n'ibiryo.",
    aiReady: "ANTIMATE AI yiteguye kugufasha",
    aiPlaceholder:
      "Baza ikibazo cy'ubworozi...",
    aiOpen:
      "Ganira na ANTIMATE",
    aiClose:
      "Funga ANTIMATE",
    aiWelcome:
      "Muraho! Ndi ANTIMATE AI. Ushobora kumbaza ikibazo kijyanye n'ubworozi, brooding, ibiryo cyangwa ibimenyetso by'indwara.",
    online: "Online",
    offline: "Connecting...",
    recording: "ANTIMATE iri kumva...",
    thinking: "ANTIMATE iri gutekereza...",
    send: "Ohereza",
    voice:
      "Kanda gato cyangwa ufateho uvuge",
    stopVoice:
      "Reka button uhagarike recording",
    sources: "Aho amakuru yaturutse",
    sourceNote:
      "Imibare ya Rwanda ikoresha amasoko ya NISR na MINAGRI; ntukavange imibare y'uburyo butandukanye bw'ibarura nk'aho ari dataset imwe.",
  },

  en: {
    search: "Search the knowledge base...",
    knowledgeCenter: "Livestock Knowledge Center",
    subtitle:
      "A practical place for farmers to find information, measurements, recommendations and decision-support tools.",
    overview: "Overview",
    feeding: "Feeding",
    conditions: "Temperature & Humidity",
    diseases: "Diseases",
    rwandaData: "Rwanda",
    profit: "Profitability",
    comparison: "ANTIMATE BR",
    problems: "Common problems",
    videos: "Learning videos",
    help: "Help",
    askAI: "Ask ANTIMATE AI",
    readMore: "Read more",
    approximate:
      "These are general reference ranges; breed, housing, ventilation and climate can change requirements.",
    feedingTitle:
      "Chick feeding guide",
    feedingText:
      "Use this as a general reference. The feeding program from your feed manufacturer should take priority.",
    conditionTitle:
      "Brooding environment",
    conditionText:
      "Temperature should be measured at chick level, not far away from the brooder.",
    diseaseTitle:
      "Disease: symptoms, causes and actions",
    diseaseText:
      "This is a first-reference guide; many diseases require veterinary or laboratory confirmation.",
    rwandaTitle:
      "Poultry farming in Rwanda",
    rwandaText:
      "Numbers can differ depending on the survey method and year.",
    profitTitle:
      "Estimate whether your project can be profitable",
    profitText:
      "Adjust the values below to match your real costs and selling price.",
    chicks: "Number of chicks",
    chickPrice: "Price per chick",
    feedCost: "Feed / chick",
    healthCost: "Health / chicks",
    heatingCost: "Heating & electricity",
    otherCost: "Other costs",
    mortality: "Mortality (%)",
    salePrice: "Selling price",
    revenue: "Revenue",
    totalCost: "Total cost",
    profit: "Profit",
    margin: "Profit margin",
    breakEven: "Break-even / chick",
    traditional: "Traditional method",
    antimateBR: "ANTIMATE BR System",
    oldHeating:
      "The farmer manually checks temperature or uses a timer/heat source without continuous environmental feedback.",
    newHeating:
      "Sensors monitor the environment, telemetry is available and the system can control heater/fan depending on the implemented system.",
    oldManual: "Manual monitoring",
    newAutomatic: "Sensor-based monitoring",
    oldHistory: "Limited event history",
    newHistory: "Telemetry & history",
    oldAlert: "Problems may be noticed late",
    newAlert: "Alerts can help identify problems earlier",
    videoTitle:
      "Learn from poultry farmers",
    videoText:
      "These videos were selected in Kinyarwanda for easier understanding.",
    helpTitle:
      "Didn't find your answer?",
    helpText:
      "Ask ANTIMATE AI directly on this page or open the help page.",
    openAI: "Open ANTIMATE AI",
    helpPage: "Help",
    imageCaption:
      "Example brooder with chicks — observe chick distribution around heat, water and feed.",
    aiReady:
      "ANTIMATE AI is ready to help",
    aiPlaceholder:
      "Ask a poultry question...",
    aiOpen:
      "Chat with ANTIMATE",
    aiClose:
      "Close ANTIMATE",
    aiWelcome:
      "Hello! I am ANTIMATE AI. Ask me about poultry farming, brooding, feeding or disease symptoms.",
    online: "Online",
    offline: "Connecting...",
    recording: "ANTIMATE is listening...",
    thinking: "ANTIMATE is thinking...",
    send: "Send",
    voice:
      "Click or hold to speak",
    stopVoice:
      "Release to stop recording",
    sources: "Sources",
    sourceNote:
      "Rwanda figures use NISR and MINAGRI sources; do not treat figures from different survey methodologies as one identical dataset.",
  },
};

/* =========================================================
   SMALL HELPERS
========================================================= */

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") {
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
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {}
  }

  return "";
}

function extensionFromMimeType(mimeType) {
  const mime = String(mimeType || "").toLowerCase();

  if (mime.includes("ogg")) return ".ogg";
  if (mime.includes("mp4")) return ".mp4";
  if (mime.includes("mpeg")) return ".mp3";

  return ".webm";
}

function getAudioUrl(value) {
  if (!value) return null;

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

function makeAbsoluteUrl(url) {
  if (!url) return null;

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

/* =========================================================
   ANTIMATE FLOATING AI
========================================================= */

function AntimateFloatingAssistant({
  language,
  theme,
}) {
  const t = T[language];

  const socketRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const holdTimerRef = useRef(null);
  const shortTimerRef = useRef(null);
  const maxTimerRef = useRef(null);

  const audioRef = useRef(null);

  const recordingRef = useRef(false);
  const holdingRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: t.aiWelcome,
    },
  ]);

  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);

  /* ---------------------------------------------------------
     SCROLL CHAT
  --------------------------------------------------------- */

  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTop =
      scrollRef.current.scrollHeight;
  }, [messages, processing]);

  /* ---------------------------------------------------------
     ADD MESSAGE
  --------------------------------------------------------- */

  const addMessage = useCallback(
    (role, message) => {
      if (!message || !message.trim()) return;

      setMessages((prev) => [
        ...prev,
        {
          id:
            `${role}-${Date.now()}-${Math.random()}`,
          role,
          text: message.trim(),
        },
      ]);
    },
    []
  );

  /* ---------------------------------------------------------
     AUDIO
  --------------------------------------------------------- */

  const playAudio = useCallback(
    async (url) => {
      if (!url) return;

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = new Audio(url);

        audioRef.current = audio;

        audio.onplay = () => {
          setPlaying(true);
        };

        audio.onended = () => {
          setPlaying(false);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setPlaying(false);
          audioRef.current = null;
        };

        await audio.play();
      } catch {
        setPlaying(false);
      }
    },
    []
  );

  /* ---------------------------------------------------------
     SOCKET.IO
  --------------------------------------------------------- */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError("");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", () => {
      setConnected(false);
    });

    socket.on(
      "antimate:status",
      (data = {}) => {
        const status = data.status || "";

        if (
          [
            "converting",
            "processing",
            "gpu_fallback",
            "uploaded",
            "receiving",
          ].includes(status)
        ) {
          setProcessing(true);
        }

        if (status === "recording") {
          setRecording(true);
          recordingRef.current = true;
        }

        if (status === "cancelled") {
          setRecording(false);
          recordingRef.current = false;
          setProcessing(false);
        }
      }
    );

    socket.on(
      "antimate:transcript",
      (data = {}) => {
        const value =
          data.transcript ||
          data.text ||
          data.message ||
          "";

        if (value) {
          setMessages((prev) => [
            ...prev,
            {
              id:
                `transcript-${Date.now()}`,
              role: "user",
              text: value,
            },
          ]);
        }
      }
    );

    socket.on(
      "antimate:thinking",
      () => {
        setProcessing(true);
      }
    );

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

        if (answer) {
          setMessages((prev) => [
            ...prev,
            {
              id:
                `answer-${Date.now()}`,
              role: "assistant",
              text: answer,
            },
          ]);
        }
      }
    );

    socket.on(
      "antimate:answer:chunk",
      (data = {}) => {
        const chunk =
          data.chunk ||
          data.text ||
          data.answer ||
          "";

        if (!chunk) return;

        setMessages((prev) => {
          const last = prev[prev.length - 1];

          if (
            last &&
            last.role === "assistant"
          ) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                text:
                  data.done
                    ? chunk
                    : `${last.text}${chunk}`,
              },
            ];
          }

          return [
            ...prev,
            {
              id:
                `stream-${Date.now()}`,
              role: "assistant",
              text: chunk,
            },
          ];
        });

        setProcessing(true);
      }
    );

    socket.on(
      "antimate:audio",
      async (data = {}) => {
        const raw =
          getAudioUrl(
            data.audio_url ||
              data.audioUrl ||
              data.audio
          );

        const url = makeAbsoluteUrl(raw);

        if (url) {
          await playAudio(url);
        }
      }
    );

    socket.on(
      "antimate:complete",
      (data = {}) => {
        const answer =
          data.answer ||
          data.answer_rw ||
          data.answer_kinyarwanda ||
          data.text ||
          "";

        if (answer) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];

            if (
              last &&
              last.role === "assistant"
            ) {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  text: answer,
                },
              ];
            }

            return [
              ...prev,
              {
                id:
                  `complete-${Date.now()}`,
                role: "assistant",
                text: answer,
              },
            ];
          });
        }

        setProcessing(false);
        setRecording(false);
        recordingRef.current = false;
      }
    );

    socket.on(
      "antimate:error",
      (data = {}) => {
        setError(
          data.message ||
            data.error ||
            "ANTIMATE AI habayemo ikibazo."
        );

        setProcessing(false);
        setRecording(false);
        recordingRef.current = false;
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [playAudio]);

  /* ---------------------------------------------------------
     SEND TEXT
  --------------------------------------------------------- */

  const sendText = useCallback(
    async () => {
      const clean = text.trim();

      if (
        !clean ||
        processing ||
        recording
      ) {
        return;
      }

      setText("");
      setError("");

      addMessage("user", clean);
      setProcessing(true);

      try {
        const response = await fetch(
          CHAT_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message: clean,
              language: "rw",
            }),
          }
        );

        let data = {};

        try {
          data = await response.json();
        } catch {}

        if (!response.ok) {
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

        addMessage("assistant", answer);

        const rawAudio =
          getAudioUrl(
            data.audio_url ||
              data.audioUrl ||
              data.audio
          );

        const audioUrl =
          makeAbsoluteUrl(rawAudio);

        if (audioUrl) {
          await playAudio(audioUrl);
        }
      } catch (err) {
        setError(
          err?.message ||
            "ANTIMATE ntiyashoboye gusubiza."
        );
      } finally {
        setProcessing(false);
      }
    },
    [
      text,
      processing,
      recording,
      addMessage,
      playAudio,
    ]
  );

  /* ---------------------------------------------------------
     START VOICE
  --------------------------------------------------------- */

  const startRecording = useCallback(
    async () => {
      if (
        recordingRef.current ||
        processing ||
        playing
      ) {
        return;
      }

      const socket = socketRef.current;

      if (
        !socket ||
        !socket.connected
      ) {
        setError(
          "ANTIMATE server ntabwo ihujwe."
        );
        return;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setError(
          "Browser ntabwo yemera microphone."
        );
        return;
      }

      try {
        setError("");

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: false,
            }
          );

        mediaStreamRef.current = stream;

        const mimeType =
          getSupportedMimeType();

        let recorder;

        try {
          recorder = mimeType
            ? new MediaRecorder(stream, {
                mimeType,
              })
            : new MediaRecorder(stream);
        } catch {
          recorder =
            new MediaRecorder(stream);
        }

        mediaRecorderRef.current =
          recorder;

        const actualMimeType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        socket.emit(
          "antimate:voice:start",
          {
            mimeType:
              actualMimeType,
            extension:
              extensionFromMimeType(
                actualMimeType
              ),
            language: "rw",
          }
        );

        recorder.ondataavailable =
          (event) => {
            if (
              !event.data ||
              event.data.size === 0
            ) {
              return;
            }

            event.data
              .arrayBuffer()
              .then((buffer) => {
                if (
                  socket.connected &&
                  recordingRef.current
                ) {
                  socket.emit(
                    "antimate:voice:chunk",
                    buffer
                  );
                }
              })
              .catch(() => {});
          };

        recorder.onerror = () => {
          setError(
            "Microphone recording habayemo ikibazo."
          );

          stopRecording();
        };

        recordingRef.current = true;
        setRecording(true);
        setProcessing(false);

        recorder.start(
          CHUNK_INTERVAL_MS
        );

        clearTimeout(maxTimerRef.current);

        maxTimerRef.current =
          setTimeout(() => {
            if (
              recordingRef.current
            ) {
              stopRecording();
            }
          }, MAX_RECORDING_MS);
      } catch (err) {
        setError(
          err?.message ||
            "Microphone ntiyashoboye gufunguka."
        );
      }
    },
    [
      processing,
      playing,
    ]
  );

  /* ---------------------------------------------------------
     STOP VOICE
  --------------------------------------------------------- */

  const stopRecording = useCallback(() => {
    clearTimeout(maxTimerRef.current);

    const socket = socketRef.current;
    const recorder =
      mediaRecorderRef.current;

    if (!recordingRef.current) {
      return;
    }

    recordingRef.current = false;
    setRecording(false);
    setProcessing(true);

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.onstop = () => {
        if (
          mediaStreamRef.current
        ) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => {
              try {
                track.stop();
              } catch {}
            });

          mediaStreamRef.current =
            null;
        }

        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "antimate:voice:end"
          );
        }
      };

      try {
        recorder.stop();
      } catch {
        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "antimate:voice:end"
          );
        }
      }
    } else if (
      socket &&
      socket.connected
    ) {
      socket.emit(
        "antimate:voice:end"
      );
    }

    mediaRecorderRef.current =
      null;
  }, []);

  /* ---------------------------------------------------------
     CANCEL
  --------------------------------------------------------- */

  const cancelRecording = useCallback(() => {
    clearTimeout(holdTimerRef.current);
    clearTimeout(shortTimerRef.current);
    clearTimeout(maxTimerRef.current);

    holdingRef.current = false;
    recordingRef.current = false;

    setRecording(false);
    setProcessing(false);

    const socket = socketRef.current;

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
      recorder.state !== "inactive"
    ) {
      try {
        recorder.stop();
      } catch {}
    }

    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => {
          try {
            track.stop();
          } catch {}
        });

      mediaStreamRef.current = null;
    }
  }, []);

  /* ---------------------------------------------------------
     POINTER DOWN
  --------------------------------------------------------- */

  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();

      if (
        recordingRef.current ||
        processing ||
        playing
      ) {
        return;
      }

      holdingRef.current = true;

      clearTimeout(
        holdTimerRef.current
      );

      holdTimerRef.current =
        setTimeout(() => {
          if (holdingRef.current) {
            startRecording();
          }
        }, HOLD_TO_RECORD_MS);
    },
    [
      processing,
      playing,
      startRecording,
    ]
  );

  /* ---------------------------------------------------------
     POINTER UP
  --------------------------------------------------------- */

  const handlePointerUp = useCallback(
    (event) => {
      event.preventDefault();

      const wasHolding =
        holdingRef.current;

      holdingRef.current = false;

      clearTimeout(
        holdTimerRef.current
      );

      if (recordingRef.current) {
        stopRecording();
        return;
      }

      if (wasHolding) {
        startRecording();

        clearTimeout(
          shortTimerRef.current
        );

        shortTimerRef.current =
          setTimeout(() => {
            if (
              recordingRef.current
            ) {
              stopRecording();
            }
          }, SHORT_RECORDING_MS);
      }
    },
    [
      startRecording,
      stopRecording,
    ]
  );

  /* ---------------------------------------------------------
     KEYBOARD
  --------------------------------------------------------- */

  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendText();
      }
    },
    [sendText]
  );

  /* ---------------------------------------------------------
     CLEANUP
  --------------------------------------------------------- */

  useEffect(() => {
    return () => {
      cancelRecording();

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
  }, [cancelRecording]);

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */

  return (
    <>
      {/* =====================================================
          FLOATING OVAL
      ===================================================== */}

      <button
        type="button"
        className={`ai-floating-trigger ${
          open ? "opened" : ""
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-label={
          open
            ? t.aiClose
            : t.aiOpen
        }
      >
        <span className="ai-trigger-orbit">
          <span />
        </span>

        <span className="ai-trigger-text">
          {open
            ? "×"
            : "ANTIMATE"}
        </span>
      </button>

      {/* =====================================================
          CHAT PANEL
      ===================================================== */}

      {open && (
        <aside
          className={`ai-floating-panel ${
            theme === "dark"
              ? "panel-dark"
              : "panel-light"
          }`}
        >
          {/* Header */}

          <div className="ai-panel-header">
            <div className="ai-panel-brand">
              <div className="ai-logo">
                <span />
              </div>

              <div>
                <strong>
                  ANTIMATE AI
                </strong>

                <small>
                  {connected
                    ? t.online
                    : t.offline}
                </small>
              </div>
            </div>

            <a
              href="https://antimate.vercel.app/antimate-ai"
              target="_blank"
              rel="noreferrer"
              className="ai-full-link"
            >
              ↗
            </a>
          </div>

          {/* Messages */}

          <div
            className="ai-panel-messages"
            ref={scrollRef}
          >
            {messages.map(
              (message) => (
                <div
                  key={message.id}
                  className={`ai-msg ${
                    message.role
                  }`}
                >
                  <div className="ai-msg-bubble">
                    {message.text}
                  </div>
                </div>
              )
            )}

            {processing && (
              <div className="ai-msg assistant">
                <div className="ai-msg-bubble ai-thinking">
                  <span />
                  <span />
                  <span />
                  <em>
                    {t.thinking}
                  </em>
                </div>
              </div>
            )}
          </div>

          {/* Error */}

          {error && (
            <div className="ai-error">
              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>
            </div>
          )}

          {/* Input */}

          <div className="ai-panel-input">
            <textarea
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder={
                t.aiPlaceholder
              }
              rows={1}
              disabled={
                processing ||
                recording
              }
            />

            <button
              type="button"
              className={`ai-send ${
                !text.trim()
                  ? "disabled"
                  : ""
              }`}
              disabled={
                !text.trim() ||
                processing ||
                recording
              }
              onClick={sendText}
            >
              ➤
            </button>
          </div>

          {/* Voice */}

          <div className="ai-voice-row">
            <button
              type="button"
              className={`ai-voice ${
                recording
                  ? "recording"
                  : ""
              } ${
                processing || playing
                  ? "blocked"
                  : ""
              }`}
              onPointerDown={
                handlePointerDown
              }
              onPointerUp={
                handlePointerUp
              }
              onPointerCancel={
                cancelRecording
              }
              onPointerLeave={
                recording
                  ? undefined
                  : cancelRecording
              }
              disabled={
                processing ||
                playing
              }
            >
              <span className="ai-voice-ring" />

              <span>
                {recording
                  ? "■"
                  : playing
                  ? "🔊"
                  : "🎙"}
              </span>
            </button>

            <div>
              <strong>
                {recording
                  ? t.recording
                  : t.aiReady}
              </strong>

              <small>
                {recording
                  ? t.stopVoice
                  : t.voice}
              </small>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function BroodingGuide() {
  const [language, setLanguage] =
    useState("rw");

  const [theme, setTheme] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            "antimate-theme"
          ) || "dark"
        );
      } catch {
        return "dark";
      }
    });

  const [search, setSearch] =
    useState("");

  const [profitInputs, setProfitInputs] =
    useState({
      chicks: 100,
      chickPrice: 1200,
      feedCost: 3500,
      healthCost: 400,
      heatingCost: 50000,
      otherCost: 30000,
      mortality: 5,
      salePrice: 6500,
    });

  const t = T[language];

  /* =======================================================
     THEME
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "antimate-theme",
        theme
      );
    } catch {}

    document.documentElement.dataset.theme =
      theme;
  }, [theme]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const normalizedSearch =
    search.trim().toLowerCase();

  const matchesSearch = useCallback(
    (...values) => {
      if (!normalizedSearch) {
        return true;
      }

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    },
    [normalizedSearch]
  );

  const filteredFeeding =
    useMemo(
      () =>
        FEEDING_DATA.filter((row) =>
          matchesSearch(
            row.ageRW,
            row.ageEN,
            row.feedRW,
            row.feedEN,
            row.goalRW,
            row.goalEN,
            row.noteRW,
            row.noteEN
          )
        ),
      [matchesSearch]
    );

  const filteredConditions =
    useMemo(
      () =>
        CONDITION_DATA.filter((row) =>
          matchesSearch(
            row.ageRW,
            row.ageEN,
            row.temp,
            row.humidity,
            row.behaviorRW,
            row.behaviorEN
          )
        ),
      [matchesSearch]
    );

  const filteredDiseases =
    useMemo(
      () =>
        DISEASE_DATA.filter((row) =>
          matchesSearch(
            row.nameRW,
            row.nameEN,
            row.symptomsRW,
            row.symptomsEN,
            row.causeRW,
            row.causeEN,
            row.actionRW,
            row.actionEN
          )
        ),
      [matchesSearch]
    );

  const filteredProblems =
    useMemo(
      () =>
        FARMER_PROBLEMS.filter((item) =>
          matchesSearch(
            item.titleRW,
            item.titleEN,
            item.textRW,
            item.textEN
          )
        ),
      [matchesSearch]
    );

  /* =======================================================
     PROFIT CALCULATOR
  ======================================================= */

  const profitResult =
    useMemo(() => {
      const chicks =
        Math.max(
          0,
          clampNumber(
            profitInputs.chicks
          )
        );

      const chickPrice =
        Math.max(
          0,
          clampNumber(
            profitInputs.chickPrice
          )
        );

      const feedCost =
        Math.max(
          0,
          clampNumber(
            profitInputs.feedCost
          )
        );

      const healthCost =
        Math.max(
          0,
          clampNumber(
            profitInputs.healthCost
          )
        );

      const heatingCost =
        Math.max(
          0,
          clampNumber(
            profitInputs.heatingCost
          )
        );

      const otherCost =
        Math.max(
          0,
          clampNumber(
            profitInputs.otherCost
          )
        );

      const mortality =
        Math.min(
          100,
          Math.max(
            0,
            clampNumber(
              profitInputs.mortality
            )
          )
        );

      const salePrice =
        Math.max(
          0,
          clampNumber(
            profitInputs.salePrice
          )
        );

      const surviving =
        chicks *
        (1 - mortality / 100);

      const chickPurchase =
        chicks * chickPrice;

      const feedTotal =
        chicks * feedCost;

      const healthTotal =
        chicks * healthCost;

      const totalCost =
        chickPurchase +
        feedTotal +
        healthTotal +
        heatingCost +
        otherCost;

      const revenue =
        surviving * salePrice;

      const profit =
        revenue - totalCost;

      const margin =
        revenue > 0
          ? (profit / revenue) * 100
          : 0;

      const breakEven =
        surviving > 0
          ? totalCost / surviving
          : 0;

      return {
        surviving,
        totalCost,
        revenue,
        profit,
        margin,
        breakEven,
      };
    }, [profitInputs]);

  const updateProfit =
    useCallback(
      (key, value) => {
        setProfitInputs((prev) => ({
          ...prev,
          [key]: value,
        }));
      },
      []
    );

  const money = useCallback(
    (value) =>
      new Intl.NumberFormat(
        "rw-RW"
      ).format(
        Math.round(
          clampNumber(value)
        )
      ) + " FRW",
    []
  );

  /* =======================================================
     SCROLL
  ======================================================= */

  const goTo = useCallback(
    (id) => {
      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    },
    []
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className={`brooding-page ${
        theme === "dark"
          ? "theme-dark"
          : "theme-light"
      }`}
    >
      {/* ===================================================
          STYLE
      =================================================== */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #07090d;
        }

        button,
        input,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .brooding-page {
          --bg: #f4f6fa;
          --surface: #ffffff;
          --surface-2: #eef1f6;
          --surface-3: #e6eaf1;
          --text: #10131a;
          --muted: #596273;
          --border: #d9dee8;

          --primary: #6d4aff;
          --primary-2: #3aa7ff;
          --orange: #ff9f43;

          --danger: #e05252;
          --shadow:
            0 20px 60px rgba(20, 25, 40, 0.10);

          min-height: 100vh;
          background:
            radial-gradient(
              circle at 85% 0%,
              rgba(109, 74, 255, 0.10),
              transparent 30%
            ),
            var(--bg);
          color: var(--text);

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          transition:
            background 0.25s ease,
            color 0.25s ease;
        }

        .brooding-page.theme-dark {
          --bg: #07090d;
          --surface: #0e1219;
          --surface-2: #151a23;
          --surface-3: #1b222d;
          --text: #f5f7fb;
          --muted: #a7afbd;
          --border: #28303d;

          --primary: #9b7cff;
          --primary-2: #58b8ff;
          --orange: #ffad55;

          --danger: #ff7070;

          --shadow:
            0 25px 80px rgba(0, 0, 0, 0.38);
        }

        /* ==================================================
           TOP BAR
        ================================================== */

        .knowledge-topbar {
          position: sticky;
          top: 0;
          z-index: 80;

          min-height: 64px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          padding:
            10px
            clamp(16px, 4vw, 56px);

          background:
            color-mix(
              in srgb,
              var(--bg) 92%,
              transparent
            );

          border-bottom:
            1px solid var(--border);

          backdrop-filter:
            blur(18px);
        }

        .brand-word {
          color: var(--text);
          text-decoration: none;

          font-size: 19px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .brand-word span {
          color: var(--primary-2);
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .top-control {
          min-height: 38px;
          padding:
            0 12px;

          border:
            1px solid var(--border);

          background:
            var(--surface);

          color:
            var(--text);

          border-radius:
            10px;

          font-size: 12px;
          font-weight: 800;
        }

        .top-control:hover {
          border-color:
            var(--primary);
        }

        /* ==================================================
           SEARCH
        ================================================== */

        .search-wrap {
          width:
            min(620px, 55vw);

          position: relative;
        }

        .search-wrap input {
          width: 100%;
          height: 42px;

          padding:
            0 15px
            0 42px;

          border:
            1px solid var(--border);

          border-radius:
            12px;

          background:
            var(--surface);

          color:
            var(--text);

          outline: none;
        }

        .search-wrap input::placeholder {
          color: var(--muted);
        }

        .search-wrap input:focus {
          border-color:
            var(--primary);
          box-shadow:
            0 0 0 3px
            color-mix(
              in srgb,
              var(--primary) 15%,
              transparent
            );
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform:
            translateY(-50%);

          color:
            var(--muted);
        }

        /* ==================================================
           EDITORIAL HEADER
        ================================================== */

        .knowledge-header {
          max-width: 1380px;
          margin: 0 auto;

          padding:
            62px
            clamp(18px, 4vw, 56px)
            30px;
        }

        .breadcrumb {
          display: flex;
          gap: 8px;
          align-items: center;

          color: var(--muted);

          font-size: 12px;
          font-weight: 700;

          margin-bottom: 18px;
        }

        .breadcrumb span:last-child {
          color: var(--primary-2);
        }

        .header-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1.3fr)
            minmax(300px, 0.7fr);

          gap: 38px;

          align-items: end;
        }

        .header-copy h1 {
          margin: 0;

          max-width: 900px;

          font-size:
            clamp(38px, 6vw, 78px);

          line-height: 0.98;

          letter-spacing:
            -0.055em;

          color:
            var(--text);
        }

        .header-copy h1 strong {
          display: block;

          color:
            var(--primary-2);

          font-weight: 900;
        }

        .header-copy p {
          max-width: 760px;

          margin:
            24px 0 0;

          color:
            var(--muted);

          font-size:
            clamp(15px, 2vw, 19px);

          line-height: 1.75;
        }

        .header-note {
          border-left:
            3px solid var(--primary);

          padding:
            8px 0 8px 20px;
        }

        .header-note strong {
          display: block;

          color:
            var(--text);

          font-size: 15px;
        }

        .header-note p {
          margin:
            8px 0 0;

          color:
            var(--muted);

          font-size: 13px;
          line-height: 1.65;
        }

        /* ==================================================
           MOVING TOPICS
        ================================================== */

        .topic-strip {
          overflow: hidden;

          border-top:
            1px solid var(--border);

          border-bottom:
            1px solid var(--border);

          background:
            var(--surface);
        }

        .topic-track {
          display: flex;
          width: max-content;

          animation:
            knowledgeTicker
            28s
            linear
            infinite;
        }

        .topic-item {
          display: flex;
          align-items: center;
          gap: 14px;

          padding:
            14px 22px;

          color:
            var(--muted);

          font-size: 11px;
          font-weight: 900;

          text-transform:
            uppercase;

          letter-spacing:
            0.08em;
        }

        .topic-item b {
          color:
            var(--primary-2);
        }

        @keyframes knowledgeTicker {
          from {
            transform:
              translateX(0);
          }

          to {
            transform:
              translateX(-50%);
          }
        }

        /* ==================================================
           CATEGORY NAV
        ================================================== */

        .category-nav {
          max-width: 1380px;
          margin: 0 auto;

          padding:
            18px
            clamp(18px, 4vw, 56px);

          display: flex;
          gap: 8px;

          overflow-x: auto;

          scrollbar-width:
            thin;
        }

        .category-nav button {
          flex:
            0 0 auto;

          padding:
            9px 13px;

          border:
            1px solid var(--border);

          background:
            var(--surface);

          color:
            var(--muted);

          border-radius:
            999px;

          font-size: 12px;
          font-weight: 800;

          transition:
            0.2s ease;
        }

        .category-nav button:hover {
          color:
            var(--text);

          border-color:
            var(--primary);
        }

        /* ==================================================
           MAIN LAYOUT
        ================================================== */

        .knowledge-main {
          max-width: 1380px;
          margin: 0 auto;

          padding:
            0
            clamp(18px, 4vw, 56px)
            120px;
        }

        .section {
          scroll-margin-top:
            100px;

          margin-top:
            56px;
        }

        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;

          gap: 25px;

          margin-bottom: 20px;
        }

        .section-kicker {
          margin-bottom: 7px;

          color:
            var(--primary-2);

          font-size: 11px;
          font-weight: 900;

          text-transform:
            uppercase;

          letter-spacing:
            0.12em;
        }

        .section-heading h2 {
          margin: 0;

          color:
            var(--text);

          font-size:
            clamp(24px, 3vw, 38px);

          letter-spacing:
            -0.04em;
        }

        .section-heading p {
          max-width: 650px;

          margin: 0;

          color:
            var(--muted);

          font-size: 13px;
          line-height: 1.7;
        }

        /* ==================================================
           OVERVIEW
        ================================================== */

        .overview-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 12px;
        }

        .overview-card {
          min-height: 150px;

          padding: 20px;

          border:
            1px solid var(--border);

          background:
            var(--surface);

          box-shadow:
            var(--shadow);

          border-radius:
            14px;

          position: relative;
          overflow: hidden;
        }

        .overview-card::after {
          content: "";

          position: absolute;

          width: 100px;
          height: 100px;

          right: -40px;
          bottom: -40px;

          border-radius:
            50%;

          background:
            var(--primary);

          opacity: 0.08;
        }

        .overview-card small {
          color:
            var(--muted);

          font-size: 11px;
          font-weight: 800;
        }

        .overview-card strong {
          display: block;

          margin-top: 16px;

          color:
            var(--text);

          font-size: 26px;

          letter-spacing:
            -0.04em;
        }

        .overview-card span {
          display: block;

          margin-top: 7px;

          color:
            var(--muted);

          font-size: 12px;
          line-height: 1.5;
        }

        /* ==================================================
           IMAGE + TEXT
        ================================================== */

        .feature-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1.1fr)
            minmax(0, 0.9fr);

          gap: 18px;
        }

        .feature-image {
          min-height: 430px;

          position: relative;

          overflow: hidden;

          border-radius:
            18px;

          border:
            1px solid var(--border);

          background:
            var(--surface-2);
        }

        .feature-image img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;

          min-height: 430px;
        }

        .image-overlay {
          position: absolute;

          left: 18px;
          right: 18px;
          bottom: 18px;

          padding: 16px;

          border:
            1px solid
            rgba(255,255,255,0.18);

          background:
            rgba(7,9,13,0.78);

          color: white;

          border-radius:
            13px;

          backdrop-filter:
            blur(12px);
        }

        .image-overlay strong {
          display: block;
          font-size: 13px;
        }

        .image-overlay p {
          margin:
            6px 0 0;

          font-size: 12px;
          line-height: 1.55;

          color:
            rgba(255,255,255,0.78);
        }

        .feature-copy {
          border:
            1px solid var(--border);

          background:
            var(--surface);

          border-radius:
            18px;

          padding:
            clamp(22px, 4vw, 38px);
        }

        .feature-copy h3 {
          margin:
            0 0 15px;

          font-size:
            clamp(24px, 3vw, 38px);

          letter-spacing:
            -0.04em;
        }

        .feature-copy p {
          color:
            var(--muted);

          line-height:
            1.8;

          font-size:
            14px;
        }

        .signal-list {
          display: grid;
          gap: 10px;

          margin-top: 25px;
        }

        .signal {
          display: grid;

          grid-template-columns:
            42px 1fr;

          gap: 12px;

          padding:
            12px;

          border:
            1px solid var(--border);

          border-radius:
            12px;

          background:
            var(--surface-2);
        }

        .signal-icon {
          width: 42px;
          height: 42px;

          display: grid;
          place-items: center;

          border-radius:
            11px;

          background:
            color-mix(
              in srgb,
              var(--primary) 15%,
              var(--surface)
            );

          color:
            var(--primary);
        }

        .signal strong {
          display: block;

          color:
            var(--text);

          font-size: 13px;
        }

        .signal span {
          display: block;

          margin-top: 4px;

          color:
            var(--muted);

          font-size: 12px;
          line-height: 1.5;
        }

        /* ==================================================
           TABLE
        ================================================== */

        .table-shell {
          overflow-x: auto;

          border:
            1px solid var(--border);

          border-radius:
            15px;

          background:
            var(--surface);

          box-shadow:
            var(--shadow);
        }

        table {
          width: 100%;

          min-width:
            760px;

          border-collapse:
            collapse;
        }

        th,
        td {
          padding:
            14px 16px;

          text-align: left;

          vertical-align:
            top;

          border-bottom:
            1px solid var(--border);
        }

        th {
          background:
            var(--surface-2);

          color:
            var(--text);

          font-size: 11px;

          text-transform:
            uppercase;

          letter-spacing:
            0.06em;
        }

        td {
          color:
            var(--muted);

          font-size:
            12px;

          line-height:
            1.6;
        }

        td strong {
          color:
            var(--text);
        }

        tbody tr:last-child td {
          border-bottom:
            0;
        }

        tbody tr:hover td {
          background:
            color-mix(
              in srgb,
              var(--primary) 4%,
              var(--surface)
            );
        }

        /* ==================================================
           DISEASE
        ================================================== */

        .disease-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 12px;
        }

        .disease-card {
          padding:
            20px;

          border:
            1px solid var(--border);

          border-radius:
            15px;

          background:
            var(--surface);
        }

        .disease-title {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          margin-bottom:
            15px;
        }

        .disease-title strong {
          color:
            var(--text);

          font-size: 16px;
        }

        .disease-tag {
          padding:
            5px 8px;

          border-radius:
            999px;

          background:
            color-mix(
              in srgb,
              var(--orange) 14%,
              var(--surface)
            );

          color:
            var(--orange);

          font-size:
            10px;

          font-weight:
            900;
        }

        .disease-line {
          margin-top:
            11px;
        }

        .disease-line b {
          display: block;

          margin-bottom:
            3px;

          color:
            var(--text);

          font-size:
            11px;
        }

        .disease-line span {
          color:
            var(--muted);

          font-size:
            12px;

          line-height:
            1.55;
        }

        /* ==================================================
           RWANDA DATA
        ================================================== */

        .rwanda-panel {
          display: grid;

          grid-template-columns:
            0.9fr 1.1fr;

          gap: 20px;
        }

        .rwanda-main {
          padding:
            clamp(22px, 4vw, 38px);

          border:
            1px solid var(--border);

          border-radius:
            18px;

          background:
            var(--surface);
        }

        .rwanda-main h3 {
          margin: 0;

          font-size:
            34px;

          letter-spacing:
            -0.05em;
        }

        .rwanda-main p {
          color:
            var(--muted);

          font-size:
            13px;

          line-height:
            1.7;
        }

        .rwanda-number {
          margin-top:
            25px;

          color:
            var(--primary-2);

          font-size:
            clamp(40px, 6vw, 72px);

          font-weight:
            900;

          letter-spacing:
            -0.06em;
        }

        .rwanda-label {
          color:
            var(--muted);

          font-size:
            12px;
        }

        .rwanda-trend {
          display: flex;

          align-items:
            end;

          gap: 12px;

          min-height:
            330px;

          padding:
            25px;

          border:
            1px solid var(--border);

          border-radius:
            18px;

          background:
            var(--surface);
        }

        .trend-bar-wrap {
          flex:
            1;

          height:
            270px;

          display: flex;

          flex-direction:
            column;

          justify-content:
            end;

          gap: 8px;
        }

        .trend-bar {
          width: 100%;

          min-height: 6px;

          border-radius:
            7px 7px 3px 3px;

          background:
            linear-gradient(
              180deg,
              var(--primary-2),
              var(--primary)
            );
        }

        .trend-year {
          color:
            var(--muted);

          font-size:
            10px;

          text-align:
            center;
        }

        .trend-value {
          color:
            var(--text);

          font-size:
            9px;

          text-align:
            center;
        }

        /* ==================================================
           COMPARISON
        ================================================== */

        .comparison {
          overflow:
            hidden;

          border:
            1px solid var(--border);

          border-radius:
            18px;

          background:
            var(--surface);
        }

        .comparison-head {
          display: grid;

          grid-template-columns:
            1fr 1fr 1fr;

          border-bottom:
            1px solid var(--border);
        }

        .comparison-head div {
          padding:
            17px;

          font-size:
            12px;

          font-weight:
            900;

          color:
            var(--text);
        }

        .comparison-head div:nth-child(2) {
          background:
            var(--surface-2);
        }

        .comparison-row {
          display: grid;

          grid-template-columns:
            1fr 1fr 1fr;

          border-bottom:
            1px solid var(--border);
        }

        .comparison-row:last-child {
          border-bottom:
            0;
        }

        .comparison-row > div {
          padding:
            16px;

          color:
            var(--muted);

          font-size:
            12px;

          line-height:
            1.6;
        }

        .comparison-row > div:first-child {
          color:
            var(--text);

          font-weight:
            800;
        }

        .comparison-row > div:nth-child(3) {
          background:
            color-mix(
              in srgb,
              var(--primary) 5%,
              var(--surface)
            );
        }

        /* ==================================================
           PROFIT
        ================================================== */

        .profit-layout {
          display: grid;

          grid-template-columns:
            0.9fr 1.1fr;

          gap: 18px;
        }

        .profit-form {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 12px;

          padding:
            22px;

          border:
            1px solid var(--border);

          border-radius:
            17px;

          background:
            var(--surface);
        }

        .field {
          display: flex;

          flex-direction:
            column;

          gap: 7px;
        }

        .field.full {
          grid-column:
            1 / -1;
        }

        .field label {
          color:
            var(--muted);

          font-size:
            11px;

          font-weight:
            800;
        }

        .field input {
          width: 100%;

          height:
            43px;

          padding:
            0 12px;

          border:
            1px solid var(--border);

          border-radius:
            10px;

          background:
            var(--surface-2);

          color:
            var(--text);

          outline:
            none;
        }

        .field input:focus {
          border-color:
            var(--primary);
        }

        .profit-result {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 10px;
        }

        .profit-card {
          min-height:
            125px;

          padding:
            18px;

          border:
            1px solid var(--border);

          border-radius:
            15px;

          background:
            var(--surface);
        }

        .profit-card.primary {
          grid-column:
            1 / -1;

          background:
            linear-gradient(
              135deg,
              color-mix(
                in srgb,
                var(--primary) 18%,
                var(--surface)
              ),
              var(--surface)
            );
        }

        .profit-card small {
          color:
            var(--muted);

          font-size:
            10px;

          font-weight:
            800;
        }

        .profit-card strong {
          display:
            block;

          margin-top:
            12px;

          color:
            var(--text);

          font-size:
            25px;

          letter-spacing:
            -0.04em;
        }

        /* ==================================================
           PROBLEMS
        ================================================== */

        .problem-grid {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 12px;
        }

        .problem-card {
          padding:
            20px;

          border:
            1px solid var(--border);

          border-radius:
            15px;

          background:
            var(--surface);
        }

        .problem-icon {
          width:
            44px;

          height:
            44px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            12px;

          background:
            var(--surface-2);

          font-size:
            20px;
        }

        .problem-card h3 {
          margin:
            16px 0 7px;

          color:
            var(--text);

          font-size:
            15px;
        }

        .problem-card p {
          margin:
            0;

          color:
            var(--muted);

          font-size:
            12px;

          line-height:
            1.65;
        }

        /* ==================================================
           VIDEOS
        ================================================== */

        .video-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 18px;
        }

        .video-card {
          overflow:
            hidden;

          border:
            1px solid var(--border);

          border-radius:
            17px;

          background:
            var(--surface);
        }

        .video-frame {
          aspect-ratio:
            16 / 9;

          background:
            #05070a;
        }

        .video-frame iframe {
          width:
            100%;

          height:
            100%;

          display:
            block;

          border:
            0;
        }

        .video-copy {
          padding:
            18px;
        }

        .video-copy h3 {
          margin:
            0;

          color:
            var(--text);

          font-size:
            15px;
        }

        .video-copy p {
          margin:
            8px 0 0;

          color:
            var(--muted);

          font-size:
            12px;

          line-height:
            1.6;
        }

        /* ==================================================
           HELP
        ================================================== */

        .help-panel {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            25px;

          padding:
            clamp(22px, 4vw, 40px);

          border:
            1px solid var(--border);

          border-radius:
            18px;

          background:
            linear-gradient(
              120deg,
              color-mix(
                in srgb,
                var(--primary) 10%,
                var(--surface)
              ),
              var(--surface)
            );
        }

        .help-panel h2 {
          margin:
            0;

          color:
            var(--text);

          font-size:
            28px;

          letter-spacing:
            -0.04em;
        }

        .help-panel p {
          max-width:
            750px;

          margin:
            9px 0 0;

          color:
            var(--muted);

          line-height:
            1.7;

          font-size:
            13px;
        }

        .help-actions {
          display:
            flex;

          flex-wrap:
            wrap;

          gap:
            9px;
        }

        .primary-button,
        .secondary-button {
          min-height:
            42px;

          padding:
            0 15px;

          border-radius:
            10px;

          text-decoration:
            none;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          font-size:
            12px;

          font-weight:
            900;
        }

        .primary-button {
          background:
            var(--primary);

          color:
            white;

          border:
            1px solid
            var(--primary);
        }

        .secondary-button {
          background:
            var(--surface);

          color:
            var(--text);

          border:
            1px solid var(--border);
        }

        /* ==================================================
           FOOTER
        ================================================== */

        .knowledge-footer {
          max-width:
            1380px;

          margin:
            0 auto;

          padding:
            35px
            clamp(18px, 4vw, 56px)
            100px;

          border-top:
            1px solid var(--border);

          color:
            var(--muted);

          font-size:
            11px;

          line-height:
            1.7;
        }

        /* ==================================================
           FLOATING AI
        ================================================== */

        .ai-floating-trigger {
          position:
            fixed;

          right:
            22px;

          bottom:
            22px;

          z-index:
            200;

          min-width:
            88px;

          height:
            46px;

          padding:
            0 15px;

          border:
            1px solid
            rgba(255,255,255,0.16);

          border-radius:
            999px;

          background:
            #090c12;

          color:
            white;

          box-shadow:
            0 15px 45px
            rgba(0,0,0,0.35);

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          overflow:
            hidden;
        }

        .ai-floating-trigger::before {
          content:
            "";

          position:
            absolute;

          inset:
            -2px;

          background:
            conic-gradient(
              from 0deg,
              #6d4aff,
              #39b7ff,
              #ff9f43,
              #ff4fd8,
              #6d4aff
            );

          animation:
            aiOrbit
            4s
            linear
            infinite;

          z-index:
            -1;
        }

        .ai-floating-trigger::after {
          content:
            "";

          position:
            absolute;

          inset:
            2px;

          background:
            #090c12;

          border-radius:
            999px;

          z-index:
            -1;
        }

        .ai-floating-trigger.opened {
          min-width:
            46px;
          width:
            46px;
          padding:
            0;
        }

        .ai-trigger-text {
          position:
            relative;

          z-index:
            2;

          font-size:
            11px;

          font-weight:
            900;

          letter-spacing:
            0.03em;
        }

        .ai-trigger-orbit {
          width:
            17px;

          height:
            17px;

          border-radius:
            50%;

          border:
            2px solid
            rgba(255,255,255,0.88);

          position:
            relative;

          animation:
            aiSpin
            2.8s
            linear
            infinite;
        }

        .ai-trigger-orbit span {
          position:
            absolute;

          width:
            5px;

          height:
            5px;

          top:
            -4px;

          left:
            50%;

          transform:
            translateX(-50%);

          border-radius:
            50%;

          background:
            #58b8ff;

          box-shadow:
            0 0 12px #58b8ff;
        }

        @keyframes aiOrbit {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes aiSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .ai-floating-panel {
          position:
            fixed;

          right:
            22px;

          bottom:
            78px;

          z-index:
            190;

          width:
            min(390px, calc(100vw - 28px));

          height:
            min(620px, calc(100vh - 105px));

          border:
            1px solid var(--border);

          border-radius:
            20px;

          overflow:
            hidden;

          box-shadow:
            0 30px 100px
            rgba(0,0,0,0.35);

          display:
            flex;

          flex-direction:
            column;

          backdrop-filter:
            blur(20px);
        }

        .panel-dark {
          background:
            #0a0d13;

          color:
            #f5f7fb;
        }

        .panel-light {
          background:
            #ffffff;

          color:
            #10131a;
        }

        .ai-panel-header {
          min-height:
            62px;

          padding:
            10px 13px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          border-bottom:
            1px solid var(--border);
        }

        .ai-panel-brand {
          display:
            flex;

          align-items:
            center;

          gap:
            10px;
        }

        .ai-logo {
          width:
            35px;

          height:
            35px;

          border-radius:
            50%;

          position:
            relative;

          display:
            grid;

          place-items:
            center;

          overflow:
            hidden;
        }

        .ai-logo::before {
          content:
            "";

          position:
            absolute;

          inset:
            0;

          background:
            conic-gradient(
              #6d4aff,
              #39b7ff,
              #ff9f43,
              #ff4fd8,
              #6d4aff
            );

          animation:
            aiOrbit
            3s
            linear
            infinite;
        }

        .ai-logo span {
          position:
            relative;

          width:
            17px;

          height:
            17px;

          border:
            3px solid
            #0a0d13;

          border-radius:
            50%;

          z-index:
            2;
        }

        .ai-panel-brand strong {
          display:
            block;

          font-size:
            12px;

          letter-spacing:
            0.02em;
        }

        .ai-panel-brand small {
          display:
            block;

          margin-top:
            2px;

          color:
            var(--muted);

          font-size:
            9px;
        }

        .ai-full-link {
          width:
            32px;

          height:
            32px;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid var(--border);

          border-radius:
            9px;

          color:
            var(--text);

          text-decoration:
            none;

          font-weight:
            900;
        }

        .ai-panel-messages {
          flex:
            1;

          overflow-y:
            auto;

          padding:
            15px;

          display:
            flex;

          flex-direction:
            column;

          gap:
            10px;

          scrollbar-width:
            thin;
        }

        .ai-msg {
          display:
            flex;
        }

        .ai-msg.user {
          justify-content:
            flex-end;
        }

        .ai-msg.assistant {
          justify-content:
            flex-start;
        }

        .ai-msg-bubble {
          max-width:
            88%;

          padding:
            10px 12px;

          border-radius:
            13px;

          font-size:
            12px;

          line-height:
            1.6;

          white-space:
            pre-wrap;
        }

        .ai-msg.user
        .ai-msg-bubble {
          background:
            var(--primary);

          color:
            white;

          border-bottom-right-radius:
            4px;
        }

        .ai-msg.assistant
        .ai-msg-bubble {
          background:
            var(--surface-2);

          color:
            var(--text);

          border-bottom-left-radius:
            4px;
        }

        .ai-thinking {
          display:
            flex;

          align-items:
            center;

          gap:
            5px;
        }

        .ai-thinking span {
          width:
            5px;

          height:
            5px;

          border-radius:
            50%;

          background:
            var(--primary-2);

          animation:
            aiDots
            1s
            infinite
            ease-in-out;
        }

        .ai-thinking span:nth-child(2) {
          animation-delay:
            0.15s;
        }

        .ai-thinking span:nth-child(3) {
          animation-delay:
            0.3s;
        }

        .ai-thinking em {
          margin-left:
            4px;

          color:
            var(--muted);

          font-style:
            normal;

          font-size:
            10px;
        }

        @keyframes aiDots {
          0%,
          100% {
            opacity:
              0.25;
            transform:
              translateY(0);
          }

          50% {
            opacity:
              1;
            transform:
              translateY(-2px);
          }
        }

        .ai-error {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          margin:
            0 12px 8px;

          padding:
            8px 10px;

          border:
            1px solid
            color-mix(
              in srgb,
              var(--danger) 40%,
              var(--border)
            );

          background:
            color-mix(
              in srgb,
              var(--danger) 8%,
              var(--surface)
            );

          color:
            var(--danger);

          border-radius:
            9px;

          font-size:
            10px;
        }

        .ai-error button {
          border:
            0;

          background:
            transparent;

          color:
            inherit;

          font-size:
            17px;
        }

        .ai-panel-input {
          display:
            flex;

          gap:
            7px;

          padding:
            9px 10px;

          border-top:
            1px solid var(--border);
        }

        .ai-panel-input textarea {
          flex:
            1;

          min-height:
            40px;

          max-height:
            90px;

          resize:
            none;

          padding:
            10px;

          border:
            1px solid var(--border);

          border-radius:
            10px;

          background:
            var(--surface-2);

          color:
            var(--text);

          outline:
            none;

          font-size:
            11px;
        }

        .ai-panel-input textarea::placeholder {
          color:
            var(--muted);
        }

        .ai-send {
          width:
            40px;

          height:
            40px;

          border:
            0;

          border-radius:
            10px;

          background:
            var(--primary);

          color:
            white;

          font-weight:
            900;
        }

        .ai-send.disabled {
          opacity:
            0.35;
        }

        .ai-voice-row {
          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          padding:
            8px 12px 13px;
        }

        .ai-voice {
          width:
            42px;

          height:
            42px;

          flex:
            0 0 42px;

          position:
            relative;

          border:
            0;

          border-radius:
            50%;

          background:
            #090c12;

          color:
            white;

          display:
            grid;

          place-items:
            center;

          overflow:
            hidden;
        }

        .ai-voice::before {
          content:
            "";

          position:
            absolute;

          inset:
            -3px;

          background:
            conic-gradient(
              #6d4aff,
              #39b7ff,
              #ff9f43,
              #ff4fd8,
              #6d4aff
            );

          animation:
            aiOrbit
            3s
            linear
            infinite;
        }

        .ai-voice::after {
          content:
            "";

          position:
            absolute;

          inset:
            3px;

          border-radius:
            50%;

          background:
            #090c12;
        }

        .ai-voice > span:last-child {
          position:
            relative;

          z-index:
            2;
        }

        .ai-voice.recording {
          transform:
            scale(1.05);

          box-shadow:
            0 0 0 6px
            rgba(109,74,255,0.12);
        }

        .ai-voice.blocked {
          opacity:
            0.45;
        }

        .ai-voice-row strong {
          display:
            block;

          color:
            var(--text);

          font-size:
            10px;
        }

        .ai-voice-row small {
          display:
            block;

          margin-top:
            2px;

          color:
            var(--muted);

          font-size:
            9px;
        }

        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 1050px) {
          .header-grid {
            grid-template-columns:
              1fr;
          }

          .overview-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .feature-grid,
          .rwanda-panel,
          .profit-layout {
            grid-template-columns:
              1fr;
          }

          .problem-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 760px) {
          .knowledge-topbar {
            flex-wrap:
              wrap;

            padding:
              10px 14px;
          }

          .search-wrap {
            order:
              3;

            width:
              100%;
          }

          .knowledge-header {
            padding-top:
              38px;
          }

          .overview-grid,
          .disease-grid,
          .problem-grid,
          .video-grid {
            grid-template-columns:
              1fr;
          }

          .feature-image,
          .feature-image img {
            min-height:
              310px;
          }

          .comparison-head,
          .comparison-row {
            grid-template-columns:
              0.7fr 1fr 1fr;
          }

          .profit-form {
            grid-template-columns:
              1fr;
          }

          .field.full {
            grid-column:
              auto;
          }

          .help-panel {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .ai-floating-panel {
            right:
              10px;

            bottom:
              70px;

            width:
              calc(100vw - 20px);

            height:
              min(650px, calc(100vh - 90px));
          }

          .ai-floating-trigger {
            right:
              12px;

            bottom:
              12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration:
              0.001ms !important;

            animation-iteration-count:
              1 !important;

            scroll-behavior:
              auto !important;
          }
        }
      `}</style>

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <header className="knowledge-topbar">
        <a
          href="/home"
          className="brand-word"
        >
          Antimate<span>.</span>
        </a>

        <div className="search-wrap">
          <span className="search-icon">
            ⌕
          </span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder={t.search}
          />
        </div>

        <div className="top-actions">
          <button
            type="button"
            className="top-control"
            onClick={() =>
              setLanguage((prev) =>
                prev === "rw"
                  ? "en"
                  : "rw"
              )
            }
          >
            {language === "rw"
              ? "RW"
              : "EN"}
          </button>

          <button
            type="button"
            className="top-control"
            onClick={() =>
              setTheme((prev) =>
                prev === "dark"
                  ? "light"
                  : "dark"
              )
            }
            aria-label="Toggle theme"
          >
            {theme === "dark"
              ? "☀"
              : "☾"}
          </button>
        </div>
      </header>

      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="knowledge-header">
        <div className="breadcrumb">
          <span>ANTIMATE</span>
          <span>/</span>
          <span>
            {language === "rw"
              ? "Ubworozi"
              : "Poultry"}
          </span>
        </div>

        <div className="header-grid">
          <div className="header-copy">
            <h1>
              {language === "rw"
                ? "Ikigo cy’Amakuru"
                : "Livestock"}
              <strong>
                {language === "rw"
                  ? "y’Ubworozi"
                  : "Knowledge Center"}
              </strong>
            </h1>

            <p>
              {t.subtitle}
            </p>
          </div>

          <div className="header-note">
            <strong>
              {language === "rw"
                ? "Shakisha. Sobanukirwa. Fata icyemezo."
                : "Search. Understand. Decide."}
            </strong>

            <p>
              {language === "rw"
                ? "Amakuru yose ari kuri page imwe kugira ngo utazajya ushakisha ahantu henshi."
                : "Relevant knowledge is organized in one place so you can find what you need faster."}
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          MOVING TOPICS
      =================================================== */}

      <div className="topic-strip">
        <div className="topic-track">
          {[
            "BROODING",
            "TEMPERATURE",
            "HUMIDITY",
            "FEEDING",
            "DISEASE",
            "RWANDA POULTRY",
            "PROFITABILITY",
            "ANTIMATE BR",
            "BROODING",
            "TEMPERATURE",
            "HUMIDITY",
            "FEEDING",
            "DISEASE",
            "RWANDA POULTRY",
            "PROFITABILITY",
            "ANTIMATE BR",
          ].map(
            (item, index) => (
              <div
                className="topic-item"
                key={`${item}-${index}`}
              >
                <b>●</b>
                {item}
              </div>
            )
          )}
        </div>
      </div>

      {/* ===================================================
          CATEGORY NAV
      =================================================== */}

      <nav className="category-nav">
        <button
          onClick={() =>
            goTo("overview")
          }
        >
          {t.overview}
        </button>

        <button
          onClick={() =>
            goTo("feeding")
          }
        >
          {t.feeding}
        </button>

        <button
          onClick={() =>
            goTo("conditions")
          }
        >
          {t.conditions}
        </button>

        <button
          onClick={() =>
            goTo("diseases")
          }
        >
          {t.diseases}
        </button>

        <button
          onClick={() =>
            goTo("rwanda")
          }
        >
          {t.rwandaData}
        </button>

        <button
          onClick={() =>
            goTo("profit")
          }
        >
          {t.profit}
        </button>

        <button
          onClick={() =>
            goTo("comparison")
          }
        >
          {t.comparison}
        </button>

        <button
          onClick={() =>
            goTo("videos")
          }
        >
          {t.videos}
        </button>

        <button
          onClick={() =>
            goTo("help")
          }
        >
          {t.help}
        </button>
      </nav>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="knowledge-main">

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <section
          className="section"
          id="overview"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                01 / {t.overview}
              </div>

              <h2>
                {language === "rw"
                  ? "Iby'ingenzi ubanza kumenya"
                  : "The essentials first"}
              </h2>
            </div>

            <p>
              {language === "rw"
                ? "Brooding nziza itangirira ku bushyuhe bukwiye, amazi meza, ibiryo, umwuka mwiza n'isuku."
                : "Successful brooding starts with the right temperature, clean water, feed, ventilation and hygiene."}
            </p>
          </div>

          <div className="overview-grid">
            <div className="overview-card">
              <small>
                {language === "rw"
                  ? "ICYUMWERU CYA MBERE"
                  : "FIRST WEEK"}
              </small>

              <strong>
                32–35°C
              </strong>

              <span>
                {language === "rw"
                  ? "Hafi y'imishwi"
                  : "At chick level"}
              </span>
            </div>

            <div className="overview-card">
              <small>
                {language === "rw"
                  ? "HUMIDITY"
                  : "HUMIDITY"}
              </small>

              <strong>
                50–70%
              </strong>

              <span>
                {language === "rw"
                  ? "Reference rusange"
                  : "General reference"}
              </span>
            </div>

            <div className="overview-card">
              <small>
                {language === "rw"
                  ? "IGIKORWA"
                  : "ACTION"}
              </small>

              <strong>
                24/7
              </strong>

              <span>
                {language === "rw"
                  ? "Amazi meza n'ibyo kurya bigomba kuboneka"
                  : "Clean water and feed access"}
              </span>
            </div>

            <div className="overview-card">
              <small>
                {language === "rw"
                  ? "KUBONA IKIBAZO"
                  : "EARLY SIGNAL"}
              </small>

              <strong>
                👀
              </strong>

              <span>
                {language === "rw"
                  ? "Imyitwarire y'imishwi ni sensor ya mbere"
                  : "Chick behavior is your first signal"}
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            IMAGE FEATURE
        ================================================= */}

        <section className="section">
          <div className="feature-grid">
            <div className="feature-image">
              <img
                src={BROODER_IMAGE}
                alt="Baby chicks inside a brooder"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />

              <div className="image-overlay">
                <strong>
                  {language === "rw"
                    ? "Brooding y'imishwi"
                    : "Chick brooding"}
                </strong>

                <p>
                  {t.imageCaption}
                </p>
              </div>
            </div>

            <div className="feature-copy">
              <div className="section-kicker">
                {language === "rw"
                  ? "BROODING"
                  : "BROODING"}
              </div>

              <h3>
                {language === "rw"
                  ? "Imishwi ikubwira byinshi ukoresheje imyitwarire yayo."
                  : "Chicks tell you a lot through their behavior."}
              </h3>

              <p>
                {language === "rw"
                  ? "Nubwo thermometer ari ingenzi, reba n'uko imishwi ikwirakwira. Iyo yegeranye cyane munsi y'ubushyuhe bishobora kuba ubukonje; iyo yagiye kure cyane kandi igahumeka cyane bishobora kuba ubushyuhe bukabije."
                  : "Although a thermometer is essential, observe chick distribution. Tight huddling can indicate cold stress; chicks moving far from heat and panting can indicate excessive heat."}
              </p>

              <div className="signal-list">
                <div className="signal">
                  <div className="signal-icon">
                    ❄
                  </div>

                  <div>
                    <strong>
                      {language === "rw"
                        ? "Begeranye cyane"
                        : "Tightly huddled"}
                    </strong>

                    <span>
                      {language === "rw"
                        ? "Reba ubushyuhe n'aho heat source iri."
                        : "Check temperature and heat-source position."}
                    </span>
                  </div>
                </div>

                <div className="signal">
                  <div className="signal-icon">
                    ☀
                  </div>

                  <div>
                    <strong>
                      {language === "rw"
                        ? "Bagiye ku nkengero"
                        : "At the edges"}
                    </strong>

                    <span>
                      {language === "rw"
                        ? "Reba niba ubushyuhe bukabije."
                        : "Check for overheating."}
                    </span>
                  </div>
                </div>

                <div className="signal">
                  <div className="signal-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      {language === "rw"
                        ? "Bakwirakwiye neza"
                        : "Evenly distributed"}
                    </strong>

                    <span>
                      {language === "rw"
                        ? "Akenshi ni ikimenyetso cy'ahantu heza."
                        : "Usually a good sign of comfortable conditions."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FEEDING
        ================================================= */}

        <section
          className="section"
          id="feeding"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                02 / {t.feeding}
              </div>

              <h2>
                {t.feedingTitle}
              </h2>
            </div>

            <p>
              {t.feedingText}
            </p>
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>
                    {language === "rw"
                      ? "Imyaka"
                      : "Age"}
                  </th>

                  <th>
                    {language === "rw"
                      ? "Ibiryo"
                      : "Feed phase"}
                  </th>

                  <th>
                    {language === "rw"
                      ? "Intego"
                      : "Goal"}
                  </th>

                  <th>
                    {language === "rw"
                      ? "Icyitonderwa"
                      : "Note"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredFeeding.map(
                  (row) => (
                    <tr
                      key={
                        row.ageRW
                      }
                    >
                      <td>
                        <strong>
                          {language === "rw"
                            ? row.ageRW
                            : row.ageEN}
                        </strong>
                      </td>

                      <td>
                        {language === "rw"
                          ? row.feedRW
                          : row.feedEN}
                      </td>

                      <td>
                        {language === "rw"
                          ? row.goalRW
                          : row.goalEN}
                      </td>

                      <td>
                        {language === "rw"
                          ? row.noteRW
                          : row.noteEN}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* =================================================
            CONDITIONS
        ================================================= */}

        <section
          className="section"
          id="conditions"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                03 / {t.conditions}
              </div>

              <h2>
                {t.conditionTitle}
              </h2>
            </div>

            <p>
              {t.conditionText}
            </p>
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>
                    {language === "rw"
                      ? "Iminsi"
                      : "Days"}
                  </th>

                  <th>
                    Temperature
                  </th>

                  <th>
                    Humidity
                  </th>

                  <th>
                    {language === "rw"
                      ? "Imyitwarire"
                      : "Behavior"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredConditions.map(
                  (row) => (
                    <tr
                      key={
                        row.ageRW
                      }
                    >
                      <td>
                        <strong>
                          {language === "rw"
                            ? row.ageRW
                            : row.ageEN}
                        </strong>
                      </td>

                      <td>
                        {row.temp}
                      </td>

                      <td>
                        {row.humidity}
                      </td>

                      <td>
                        {language === "rw"
                          ? row.behaviorRW
                          : row.behaviorEN}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: "14px 16px",
              border:
                "1px solid var(--border)",
              borderRadius: 12,
              background:
                "var(--surface)",
              color:
                "var(--muted)",
              fontSize: 12,
              lineHeight: 1.65,
            }}
          >
            ⚠ {t.approximate}
          </div>
        </section>

        {/* =================================================
            DISEASES
        ================================================= */}

        <section
          className="section"
          id="diseases"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                04 / {t.diseases}
              </div>

              <h2>
                {t.diseaseTitle}
              </h2>
            </div>

            <p>
              {t.diseaseText}
            </p>
          </div>

          <div className="disease-grid">
            {filteredDiseases.map(
              (disease) => (
                <article
                  className="disease-card"
                  key={
                    disease.nameEN
                  }
                >
                  <div className="disease-title">
                    <strong>
                      {language === "rw"
                        ? disease.nameRW
                        : disease.nameEN}
                    </strong>

                    <span className="disease-tag">
                      {language === "rw"
                        ? "REFERENCE"
                        : "REFERENCE"}
                    </span>
                  </div>

                  <div className="disease-line">
                    <b>
                      {language === "rw"
                        ? "Ibimenyetso"
                        : "Symptoms"}
                    </b>

                    <span>
                      {language === "rw"
                        ? disease.symptomsRW
                        : disease.symptomsEN}
                    </span>
                  </div>

                  <div className="disease-line">
                    <b>
                      {language === "rw"
                        ? "Impamvu / Risk"
                        : "Cause / Risk"}
                    </b>

                    <span>
                      {language === "rw"
                        ? disease.causeRW
                        : disease.causeEN}
                    </span>
                  </div>

                  <div className="disease-line">
                    <b>
                      {language === "rw"
                        ? "Icyo gukora"
                        : "What to do"}
                    </b>

                    <span>
                      {language === "rw"
                        ? disease.actionRW
                        : disease.actionEN}
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        {/* =================================================
            RWANDA DATA
        ================================================= */}

        <section
          className="section"
          id="rwanda"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                05 / RWANDA
              </div>

              <h2>
                {t.rwandaTitle}
              </h2>
            </div>

            <p>
              {t.rwandaText}
            </p>
          </div>

          <div className="rwanda-panel">
            <div className="rwanda-main">
              <div className="section-kicker">
                NISR AHS 2024
              </div>

              <div className="rwanda-number">
                3.8M
              </div>

              <div className="rwanda-label">
                {language === "rw"
                  ? "inkoko zagereranijwe muri AHS 2024"
                  : "chickens estimated in AHS 2024"}
              </div>

              <p>
                {language === "rw"
                  ? "NISR yagaragaje kandi ko 45.7% by'imiryango yorora amatungo yorora inkoko."
                  : "NISR also reported that 45.7% of livestock-keeping households keep chickens."}
              </p>

              <div
                style={{
                  marginTop: 22,
                  paddingTop: 18,
                  borderTop:
                    "1px solid var(--border)",
                }}
              >
                <strong
                  style={{
                    color:
                      "var(--text)",
                    fontSize: 13,
                  }}
                >
                  MINAGRI 2025
                </strong>

                <div
                  style={{
                    marginTop: 8,
                    color:
                      "var(--primary-2)",
                    fontSize: 25,
                    fontWeight: 900,
                  }}
                >
                  12.95M
                </div>

                <div
                  style={{
                    color:
                      "var(--muted)",
                    fontSize: 11,
                  }}
                >
                  {language === "rw"
                    ? "poultry population estimate"
                    : "estimated poultry population"}
                </div>
              </div>
            </div>

            <div className="rwanda-trend">
              {[
                ["2020", 5.31],
                ["2021", 5.44],
                ["2022", 5.50],
                ["2023", 6.05],
                ["2024", 6.29],
                ["2025", 12.95],
              ].map(
                ([year, value]) => {
                  const max = 12.95;

                  const height =
                    Math.max(
                      7,
                      (value / max) *
                        100
                    );

                  return (
                    <div
                      className="trend-bar-wrap"
                      key={year}
                    >
                      <div className="trend-value">
                        {value}M
                      </div>

                      <div
                        className="trend-bar"
                        style={{
                          height:
                            `${height}%`,
                        }}
                      />

                      <div className="trend-year">
                        {year}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            PROFIT CALCULATOR
        ================================================= */}

        <section
          className="section"
          id="profit"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                06 / {t.profit}
              </div>

              <h2>
                {t.profitTitle}
              </h2>
            </div>

            <p>
              {t.profitText}
            </p>
          </div>

          <div className="profit-layout">
            <div className="profit-form">
              <div className="field">
                <label>
                  {t.chicks}
                </label>

                <input
                  type="number"
                  value={
                    profitInputs.chicks
                  }
                  onChange={(e) =>
                    updateProfit(
                      "chicks",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  {t.chickPrice}
                </label>

                <input
                  type="number"
                  value={
                    profitInputs.chickPrice
                  }
                  onChange={(e) =>
                    updateProfit(
                      "chickPrice",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  {t.feedCost}
                </label>

                <input
                  type="number"
                  value={
                    profitInputs.feedCost
                  }
                  onChange={(e) =>
                    updateProfit(
                      "feedCost",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  {t.healthCost}
                </label>

                <input
                  type="number"
                  value={
                    profitInputs.healthCost
                  }
                  onChange={(e) =>
                    updateProfit(
                      "healthCost",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  {t.heatingCost}
                </label>

                <input
                  type="number"
                  value={
                    profitInputs.heatingCost
                  }
                  onChange={(e) =>
                    updateProfit(
                      "heatingCost",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  {t.otherCost}
                </label>

                <input
                  type="number"
                  value={
                    profitInputs.otherCost
                  }
                  onChange={(e) =>
                    updateProfit(
                      "otherCost",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  {t.mortality}
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={
                    profitInputs.mortality
                  }
                  onChange={(e) =>
                    updateProfit(
                      "mortality",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  {t.salePrice}
                </label>

                <input
                  type="number"
                  value={
                    profitInputs.salePrice
                  }
                  onChange={(e) =>
                    updateProfit(
                      "salePrice",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="profit-result">
              <div className="profit-card primary">
                <small>
                  {t.profit}
                </small>

                <strong>
                  {money(
                    profitResult.profit
                  )}
                </strong>
              </div>

              <div className="profit-card">
                <small>
                  {t.revenue}
                </small>

                <strong>
                  {money(
                    profitResult.revenue
                  )}
                </strong>
              </div>

              <div className="profit-card">
                <small>
                  {t.totalCost}
                </small>

                <strong>
                  {money(
                    profitResult.totalCost
                  )}
                </strong>
              </div>

              <div className="profit-card">
                <small>
                  {t.margin}
                </small>

                <strong>
                  {profitResult.margin.toFixed(
                    1
                  )}
                  %
                </strong>
              </div>

              <div className="profit-card">
                <small>
                  {t.breakEven}
                </small>

                <strong>
                  {money(
                    profitResult.breakEven
                  )}
                </strong>
              </div>

              <div className="profit-card">
                <small>
                  {language === "rw"
                    ? "Imishwi izarokoka"
                    : "Expected survivors"}
                </small>

                <strong>
                  {Math.round(
                    profitResult.surviving
                  )}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            TRADITIONAL VS ANTIMATE
        ================================================= */}

        <section
          className="section"
          id="comparison"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                07 / ANTIMATE BR
              </div>

              <h2>
                {language === "rw"
                  ? "Uburyo busanzwe vs ANTIMATE BR"
                  : "Traditional brooding vs ANTIMATE BR"}
              </h2>
            </div>

            <p>
              {language === "rw"
                ? "Intego ntabwo ari gusimbuza umworozi; ni kumuha amakuru menshi no kugabanya monitoring ikorwa n'amaboko."
                : "The goal is not to replace the farmer, but to provide better information and reduce manual monitoring."}
            </p>
          </div>

          <div className="comparison">
            <div className="comparison-head">
              <div>
                {language === "rw"
                  ? "Igice"
                  : "Area"}
              </div>

              <div>
                {t.traditional}
              </div>

              <div>
                {t.antimateBR}
              </div>
            </div>

            <div className="comparison-row">
              <div>
                {language === "rw"
                  ? "Monitoring"
                  : "Monitoring"}
              </div>

              <div>
                {t.oldHeating}
              </div>

              <div>
                {t.newHeating}
              </div>
            </div>

            <div className="comparison-row">
              <div>
                {language === "rw"
                  ? "Gukurikirana"
                  : "Monitoring model"}
              </div>

              <div>
                {t.oldManual}
              </div>

              <div>
                {t.newAutomatic}
              </div>
            </div>

            <div className="comparison-row">
              <div>
                {language === "rw"
                  ? "Amateka"
                  : "History"}
              </div>

              <div>
                {t.oldHistory}
              </div>

              <div>
                {t.newHistory}
              </div>
            </div>

            <div className="comparison-row">
              <div>
                {language === "rw"
                  ? "Alerts"
                  : "Alerts"}
              </div>

              <div>
                {t.oldAlert}
              </div>

              <div>
                {t.newAlert}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            COMMON PROBLEMS
        ================================================= */}

        <section
          className="section"
          id="problems"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                08 / {t.problems}
              </div>

              <h2>
                {language === "rw"
                  ? "Ikibazo → icyo ubanza kugenzura"
                  : "Problem → what to check first"}
              </h2>
            </div>

            <p>
              {language === "rw"
                ? "Ibi bigufasha gutangira investigation mbere yo gufata icyemezo gikomeye."
                : "Use these checks as a first troubleshooting step before taking major action."}
            </p>
          </div>

          <div className="problem-grid">
            {filteredProblems.map(
              (problem) => (
                <article
                  className="problem-card"
                  key={
                    problem.titleEN
                  }
                >
                  <div className="problem-icon">
                    {problem.icon}
                  </div>

                  <h3>
                    {language === "rw"
                      ? problem.titleRW
                      : problem.titleEN}
                  </h3>

                  <p>
                    {language === "rw"
                      ? problem.textRW
                      : problem.textEN}
                  </p>
                </article>
              )
            )}
          </div>
        </section>

        {/* =================================================
            VIDEOS
        ================================================= */}

        <section
          className="section"
          id="videos"
        >
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                09 / {t.videos}
              </div>

              <h2>
                {t.videoTitle}
              </h2>
            </div>

            <p>
              {t.videoText}
            </p>
          </div>

          <div className="video-grid">
            {VIDEOS.map(
              (video) => (
                <article
                  className="video-card"
                  key={video.id}
                >
                  <div className="video-frame">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                      title={
                        language === "rw"
                          ? video.titleRW
                          : video.titleEN
                      }
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>

                  <div className="video-copy">
                    <h3>
                      {language === "rw"
                        ? video.titleRW
                        : video.titleEN}
                    </h3>

                    <p>
                      {language === "rw"
                        ? video.descriptionRW
                        : video.descriptionEN}
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        {/* =================================================
            HELP
        ================================================= */}

        <section
          className="section"
          id="help"
        >
          <div className="help-panel">
            <div>
              <div className="section-kicker">
                10 / {t.help}
              </div>

              <h2>
                {t.helpTitle}
              </h2>

              <p>
                {t.helpText}
              </p>
            </div>

            <div className="help-actions">
              <a
                href="https://antimate.vercel.app/antimate-ai"
                target="_blank"
                rel="noreferrer"
                className="primary-button"
              >
                {t.openAI}
              </a>

              <a
                href="/help"
                className="secondary-button"
              >
                {t.helpPage}
              </a>
            </div>
          </div>
        </section>

        {/* =================================================
            SOURCES
        ================================================= */}

        <footer className="knowledge-footer">
          <strong
            style={{
              color:
                "var(--text)",
            }}
          >
            {t.sources}
          </strong>

          <br />

          {t.sourceNote}

          <br />

          Rwanda poultry statistics:
          NISR Agriculture Household Survey
          2024 and MINAGRI Annual Report
          2024–2025.

          <br />

          Videos:
          Rwanda Agri YouTube.

          <br />

          Brooder image:
          Wikimedia Commons,
          "Brooder Cage.jpg",
          Creative Commons
          Attribution-ShareAlike 4.0.
        </footer>
      </main>

      {/* ===================================================
          FLOATING ANTIMATE AI
      =================================================== */}

      <AntimateFloatingAssistant
        language={language}
        theme={theme}
      />
    </div>
  );
}