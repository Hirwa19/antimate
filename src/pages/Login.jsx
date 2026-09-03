import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import {
  ArrowRight,
  Brain,
  Cloud,
  Eye,
  EyeOff,
  Leaf,
  LineChart,
  Lock,
  Menu,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
  Sun,
  Moon,
  HeartHandshake,
  BookOpen,
  TrendingUp,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  MapPin,
  CalendarDays,
  Headphones,
  Check,
  ChevronDown,
  Building2,
  Users,
  Target,
  Lightbulb,
  Activity,
  BarChart3,
  Cpu,
  Radio,
  Database,
  Smartphone,
  Bot,
  ArrowUpRight,
} from "lucide-react";
import "./Login.css";

/* ============================================================
   ANTIMATE LOGO
   DO NOT CHANGE
============================================================ */

const AntimateLogo = ({ size = 38 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="antimate-logo"
  >
    <defs>
      <linearGradient
        id="logoGradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#00d9ff" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>

    <path
      d="M50 10 L85 85 L65 85 L50 50 L35 85 L15 85 Z"
      fill="url(#logoGradient)"
    />

    <path
      d="M50 35 L62 60 L50 60 Z"
      fill="#07111f"
    />
  </svg>
);

/* ============================================================
   LOGIN
============================================================ */

function Login() {
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [language, setLanguage] = useState("rw");
  const [darkMode, setDarkMode] = useState(false);

  const [openFaq, setOpenFaq] = useState(null);

  /* ==========================================================
     CONTENT
  ========================================================== */

  const content = {
    rw: {
      navHome: "Ahabanza",
      navHow: "Uko ikora",
      navSystems: "Systems",
      navPlans: "Plans",
      navAbout: "ANTIMATE",
      navSupport: "Support",

      knowledge: "Amakuru y’Ubworozi",
      trending: "TRENDING",

      login: "Injira",
      signup: "Tangira natwe",

      eyebrow: "UBWOROZI BW'IGIHE KIZAZA",

      title1: "Ubworozi bwiza",
      title2: "butangirira ku makuru meza.",

      description:
        "ANTIMATE ni ecosystem y'ikoranabuhanga ihuza ubworozi, amakuru, automation na Artificial Intelligence kugira ngo worore neza, ufate ibyemezo byiza kandi wongere umusaruro.",

      start: "Tangira natwe",
      learn: "Menya byinshi",

      live: "Amakuru y'igihe nyacyo",
      smart: "Ubworozi bw'ikoranabuhanga",

      featuresTitle:
        "Ikoranabuhanga rikora ku bworozi bwawe",

      feature1Title: "Kurikira ubworozi",
      feature1Text:
        "Reba uko ibidukikije n'imikorere y'ubworozi bwawe bihinduka kandi ubone amakuru akugirira akamaro.",

      feature2Title: "Menya ibibazo hakiri kare",
      feature2Text:
        "ANTIMATE igufasha kubona impinduka zishobora kugira ingaruka ku matungo yawe mbere y'uko ikibazo gikomera.",

      feature3Title: "Fata ibyemezo neza",
      feature3Text:
        "Amakuru asobanutse n'ubwenge bwa AI bigufasha kumenya icyo gukora n'igihe cyo kugikorera.",

      visionTitle:
        "Duharanira ubworozi bwiza kandi bwunguka",

      visionText:
        "ANTIMATE yubakiye ku gitekerezo cyo guhuza abantu, ubworozi n'ikoranabuhanga kugira ngo buri mworozi abashe kubona amakuru amufasha gukora neza.",

      systemsTitle: "ANTIMATE Ecosystem",
      systemsSubtitle:
        "Ibikoresho na services bigize ANTIMATE",

      systemEdge: "ANTIMATE Edge",
      systemEdgeText:
        "Igice gifasha gukurikirana no kugenzura ibikorwa byo mu bworozi bwawe.",

      systemLink: "ANTIMATE Link",
      systemLinkText:
        "Igice gifasha guhuza amakuru yo mu bworozi bwawe n'ibindi bikorwa bya ANTIMATE.",

      systemCloud: "ANTIMATE Cloud",
      systemCloudText:
        "Ahantu amakuru yawe abikwa, akategurwa kandi ukayabona igihe uyakeneye.",

      systemAI: "ANTIMATE AI",
      systemAIText:
        "Umufasha w'ubwenge ugufasha gusobanukirwa amakuru no kubona inama zijyanye n'ubworozi.",

      systemCare: "ANTIMATE Care",
      systemCareText:
        "Ubufasha n'ubujyanama bigufasha gukoresha ANTIMATE neza.",

      systemKnowledge: "ANTIMATE Knowledge",
      systemKnowledgeText:
        "Ahantu h'amakuru n'inyigisho bifasha aborozi kwiga no kunoza imikorere yabo.",

      plansTitle: "Plans zijyanye n'ubushobozi bwawe",
      plansSubtitle:
        "Tangira ku buntu cyangwa uhitemo plan ijyanye n'ibyo ukeneye.",

      free: "Free",
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      freePrice: "0 FRW",
      basicPrice: "3,000 FRW",
      proPrice: "7,000 FRW",
      premiumPrice: "15,000 FRW",

      month: "/ ukwezi",

      freeDescription:
        "Ku muntu ushaka gutangira kumenya ANTIMATE.",
      basicDescription:
        "Ku mworozi utangiye gukoresha services za ANTIMATE.",
      proDescription:
        "Ku mworozi ushaka gukurikirana ubworozi bwe mu buryo bwagutse.",
      premiumDescription:
        "Ku bakoresha ANTIMATE bakeneye services nyinshi n'ubufasha bwagutse.",

      choosePlan: "Hitamo iyi plan",

      aboutTitle: "ANTIMATE ni iki?",
      aboutText:
        "ANTIMATE ni Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem. Ni ecosystem yubakiwe gufasha abantu gukoresha ikoranabuhanga mu buryo bworoshye, cyane cyane mu bworozi no mu micungire y'amakuru.",

      purposeTitle: "Intego yacu",
      purposeText:
        "Gukora ikoranabuhanga ryoroshye, ryizewe kandi rifasha abantu gufata ibyemezo bishingiye ku makuru.",

      visionShortTitle: "Icyerekezo",
      visionShortText:
        "Kuba ecosystem y'ikoranabuhanga ifasha abantu n'ibikorwa byabo gukura hifashishijwe amakuru n'ubwenge.",

      valuesTitle: "Ibyo twemera",
      value1: "Ubwizerwe",
      value2: "Udushya",
      value3: "Ubworoherane",
      value4: "Umutekano w'amakuru",

      supportTitle: "Ukeneye ubufasha?",
      supportSubtitle:
        "ANTIMATE ifite uburyo bwinshi bwo kugufasha kubona igisubizo.",

      supportAI: "ANTIMATE AI",
      supportAIText:
        "Baza AI ibibazo byawe kandi ubone ubufasha igihe cyose.",

      supportPhone: "Telefone",
      supportPhoneText:
        "Hamagara ANTIMATE ku bibazo cyangwa ubufasha bwihuse.",

      supportWhatsapp: "WhatsApp",
      supportWhatsappText:
        "Twandikire kuri WhatsApp ubone ubufasha bworoshye.",

      supportEmail: "Email",
      supportEmailText:
        "Ohereza ikibazo cyawe kuri email yacu.",

      supportWeb: "Web Chat Room",
      supportWebText:
        "Ganira n'itsinda rya ANTIMATE ukoresheje web chat.",

      supportKnowledge: "Knowledge Center",
      supportKnowledgeText:
        "Soma inyigisho n'amakuru agufasha gukoresha ANTIMATE.",

      contactTitle: "Twandikire",
      contactLocation: "Kigali, Rwanda",
      contactOpen: "Open all days",
      contactSince: "Since 14 April 2026",

      teamTitle: "ANTIMATE Leadership",
      teamSubtitle:
        "Itsinda riyobora kandi ryubaka icyerekezo cya ANTIMATE.",

      ceo: "CEO",
      aiOfficer: "Chief AI Officer",
      dataOfficer: "Chief Data Officer",
      cio: "Chief Information Officer",
      cto: "Chief Technology Officer",
      cmo: "Chief Marketing Officer",
      cbo: "Chief Business Officer",

      teamCEO: "HIRWA Salem",
      teamAI: "CYUSA Chrispin",
      teamData: "DJUMA David",
      teamNetwork: "ANTIMATE Network & Communication",
      teamSystem: "MUGISHA Prince",
      teamMarketing: "KWIZERA J. Bosco",
      teamBusiness: "MUGISHA Steven",

      faqTitle: "Ibibazo bikunze kubazwa",

      faq1Q: "ANTIMATE ikora iki?",
      faq1A:
        "ANTIMATE ihuza ikoranabuhanga, amakuru na AI kugira ngo ifashe abantu gukurikirana ibikorwa byabo, gusobanukirwa amakuru no gufata ibyemezo byiza.",

      faq2Q: "ANTIMATE ikoreshwa gusa mu bworozi?",
      faq2A:
        "Ubworozi ni kimwe mu bice by'ingenzi bya ANTIMATE, ariko ecosystem yubakiwe kugira ngo ishobore kwaguka no gufasha mu bindi bikorwa bikenera amakuru, automation na intelligence.",

      faq3Q: "Nshobora gutangira nta mafaranga?",
      faq3A:
        "Yego. Hariho Free plan igufasha gutangira no kumenya serivisi za ANTIMATE.",

      faq4Q: "ANTIMATE AI nayikoresha ntagize account?",
      faq4A:
        "ANTIMATE ishobora gutanga ubufasha rusange ku bantu batari bafite account, mu gihe services zijyanye na account zishobora gusaba ko winjira cyangwa ufungura konti.",

      faq5Q: "Nabona he ubufasha?",
      faq5A:
        "Ushobora gukoresha ANTIMATE AI, telefone, WhatsApp, email, Web Chat Room cyangwa Knowledge Center.",

      joinTitle: "Witeguye gutangira?",
      joinText:
        "Injira muri ANTIMATE maze uhindure uburyo ukurikiranamo ibikorwa byawe.",

      loginTitle: "Murakaza neza",
      loginSubtitle:
        "Injira muri konti yawe ya ANTIMATE",

      identifier: "Email, Username cyangwa Telefoni",
      identifierPlaceholder:
        "Andika email cyangwa username",

      password: "Ijambobanga",
      passwordPlaceholder:
        "Andika ijambobanga",

      signIn: "Injira muri Dashboard",
      forgot: "Wibagiwe ijambobanga?",

      noAccount: "Nta konti ufite?",
      create: "Fungura konti",

      footer:
        "ANTIMATE © 2026 • Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem",
    },

    en: {
      navHome: "Home",
      navHow: "How it works",
      navSystems: "Systems",
      navPlans: "Plans",
      navAbout: "About",
      navSupport: "Support",

      knowledge: "Poultry Knowledge",
      trending: "TRENDING",

      login: "Login",
      signup: "Join us",

      eyebrow: "THE FUTURE OF FARMING",

      title1: "Better farming",
      title2: "starts with better information.",

      description:
        "ANTIMATE is an intelligent technology ecosystem connecting farming, information, automation and Artificial Intelligence to help you make better decisions and improve productivity.",

      start: "Get started",
      learn: "Learn more",

      live: "Real-time insights",
      smart: "Smart farming",

      featuresTitle:
        "Technology that works for your farm",

      feature1Title: "Monitor your farm",
      feature1Text:
        "Understand important conditions and changes around your farming activities.",

      feature2Title: "Detect problems early",
      feature2Text:
        "ANTIMATE helps you notice changes that may affect your animals before problems become serious.",

      feature3Title: "Make better decisions",
      feature3Text:
        "Clear information and AI-powered insights help you know what to do and when to do it.",

      visionTitle:
        "Building better and more productive farms",

      visionText:
        "ANTIMATE connects people, farming and technology so farmers can access useful information and make better decisions with confidence.",

      systemsTitle: "The ANTIMATE Ecosystem",
      systemsSubtitle:
        "The products and services that make ANTIMATE",

      systemEdge: "ANTIMATE Edge",
      systemEdgeText:
        "The part of ANTIMATE that helps monitor and manage activities around your farm.",

      systemLink: "ANTIMATE Link",
      systemLinkText:
        "Helps connect information from your farming environment with the wider ANTIMATE ecosystem.",

      systemCloud: "ANTIMATE Cloud",
      systemCloudText:
        "A secure place where your information is organized and available when you need it.",

      systemAI: "ANTIMATE AI",
      systemAIText:
        "Your intelligent assistant for understanding information and getting useful farming guidance.",

      systemCare: "ANTIMATE Care",
      systemCareText:
        "Support and guidance to help you get the most from ANTIMATE.",

      systemKnowledge: "ANTIMATE Knowledge",
      systemKnowledgeText:
        "A knowledge center with useful guides and information for farmers.",

      plansTitle: "Plans for your needs",
      plansSubtitle:
        "Start free or choose the plan that fits your needs.",

      free: "Free",
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      freePrice: "0 FRW",
      basicPrice: "3,000 FRW",
      proPrice: "7,000 FRW",
      premiumPrice: "15,000 FRW",

      month: "/ month",

      freeDescription:
        "For anyone who wants to start exploring ANTIMATE.",
      basicDescription:
        "For farmers starting to use ANTIMATE services.",
      proDescription:
        "For farmers who want broader monitoring and support.",
      premiumDescription:
        "For users who need expanded services and support.",

      choosePlan: "Choose this plan",

      aboutTitle: "What is ANTIMATE?",
      aboutText:
        "ANTIMATE stands for Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem. It is an ecosystem designed to make technology easier to use, especially for farming and information management.",

      purposeTitle: "Our purpose",
      purposeText:
        "To build simple, reliable and useful technology that helps people make decisions based on information.",

      visionShortTitle: "Our vision",
      visionShortText:
        "To become an intelligent technology ecosystem that helps people and businesses grow through information and intelligence.",

      valuesTitle: "What we value",
      value1: "Reliability",
      value2: "Innovation",
      value3: "Simplicity",
      value4: "Data security",

      supportTitle: "Need support?",
      supportSubtitle:
        "ANTIMATE gives you several ways to get help.",

      supportAI: "ANTIMATE AI",
      supportAIText:
        "Ask AI questions and get assistance whenever you need it.",

      supportPhone: "Phone",
      supportPhoneText:
        "Call ANTIMATE for questions or direct support.",

      supportWhatsapp: "WhatsApp",
      supportWhatsappText:
        "Contact us on WhatsApp for convenient support.",

      supportEmail: "Email",
      supportEmailText:
        "Send your questions to our email team.",

      supportWeb: "Web Chat Room",
      supportWebText:
        "Chat with the ANTIMATE team through the web.",

      supportKnowledge: "Knowledge Center",
      supportKnowledgeText:
        "Explore guides and information to help you use ANTIMATE.",

      contactTitle: "Contact ANTIMATE",
      contactLocation: "Kigali, Rwanda",
      contactOpen: "Open all days",
      contactSince: "Since 14 April 2026",

      teamTitle: "ANTIMATE Leadership",
      teamSubtitle:
        "The people helping build and lead the ANTIMATE vision.",

      ceo: "CEO",
      aiOfficer: "Chief AI Officer",
      dataOfficer: "Chief Data Officer",
      cio: "Chief Information Officer",
      cto: "Chief Technology Officer",
      cmo: "Chief Marketing Officer",
      cbo: "Chief Business Officer",

      teamCEO: "HIRWA Salem",
      teamAI: "CYUSA Chrispin",
      teamData: "DJUMA David",
      teamNetwork: "ANTIMATE Network & Communication",
      teamSystem: "MUGISHA Prince",
      teamMarketing: "KWIZERA J. Bosco",
      teamBusiness: "MUGISHA Steven",

      faqTitle: "Frequently asked questions",

      faq1Q: "What does ANTIMATE do?",
      faq1A:
        "ANTIMATE combines technology, information and AI to help people monitor activities, understand information and make better decisions.",

      faq2Q: "Is ANTIMATE only for farming?",
      faq2A:
        "Farming is one of ANTIMATE's main areas, but the ecosystem is designed to expand into other areas that benefit from information, automation and intelligence.",

      faq3Q: "Can I start for free?",
      faq3A:
        "Yes. The Free plan lets you start exploring ANTIMATE services.",

      faq4Q: "Can I use ANTIMATE AI without an account?",
      faq4A:
        "ANTIMATE can provide general assistance to people without accounts, while account-based services may require you to sign in or create an account.",

      faq5Q: "Where can I get support?",
      faq5A:
        "You can use ANTIMATE AI, phone, WhatsApp, email, Web Chat Room or the Knowledge Center.",

      joinTitle: "Ready to get started?",
      joinText:
        "Join ANTIMATE and transform the way you manage your activities.",

      loginTitle: "Welcome back",
      loginSubtitle:
        "Sign in to your ANTIMATE account",

      identifier: "Email, Username or Phone",
      identifierPlaceholder:
        "Enter your email or username",

      password: "Password",
      passwordPlaceholder:
        "Enter your password",

      signIn: "Sign in to Dashboard",
      forgot: "Forgot password?",

      noAccount: "Don't have an account?",
      create: "Create account",

      footer:
        "ANTIMATE © 2026 • Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem",
    },
  };

  const t = content[language];

  /* ==========================================================
     LOGIN
  ========================================================== */

  async function handleLogin(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const res = await loginUser({
        identifier,
        password,
      });

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      navigate("/home");
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     KNOWLEDGE CENTER
  ========================================================== */

  const openKnowledgeCenter = () => {
    setMobileMenu(false);
    navigate("/brooding-guide");
  };

  /* ==========================================================
     SUPPORT ACTIONS
  ========================================================== */

  const openAI = () => {
    navigate("/antimate-ai");
  };

  const openWebChat = () => {
    navigate("/chat-room");
  };

  const openWhatsapp = () => {
    window.open(
      "https://wa.me/250798698431",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openPhone = () => {
    window.location.href = "tel:+250798698431";
  };

  const openEmail = () => {
    window.location.href =
      "mailto:antimate.inc@gmai.com";
  };

  /* ==========================================================
     PLANS
  ========================================================== */

  const plans = [
    {
      name: t.free,
      price: t.freePrice,
      description: t.freeDescription,
      icon: Leaf,
      popular: false,
      features: [
        language === "rw"
          ? "Gutangira gukoresha ANTIMATE"
          : "Start exploring ANTIMATE",
        language === "rw"
          ? "Ubufasha rusange"
          : "General assistance",
        language === "rw"
          ? "Kugera ku makuru rusange"
          : "Access to general information",
      ],
    },
    {
      name: t.basic,
      price: t.basicPrice,
      description: t.basicDescription,
      icon: Activity,
      popular: false,
      features: [
        language === "rw"
          ? "Services z'ingenzi"
          : "Core services",
        language === "rw"
          ? "Amakuru y'ingenzi"
          : "Important insights",
        language === "rw"
          ? "Ubufasha bwagutse"
          : "Extended support",
      ],
    },
    {
      name: t.pro,
      price: t.proPrice,
      description: t.proDescription,
      icon: BarChart3,
      popular: true,
      features: [
        language === "rw"
          ? "Monitoring yagutse"
          : "Advanced monitoring",
        language === "rw"
          ? "AI insights"
          : "AI insights",
        language === "rw"
          ? "Amakuru arambuye"
          : "Detailed information",
        language === "rw"
          ? "Ubufasha bwihariye"
          : "Priority support",
      ],
    },
    {
      name: t.premium,
      price: t.premiumPrice,
      description: t.premiumDescription,
      icon: Sparkles,
      popular: false,
      features: [
        language === "rw"
          ? "Services zose z'ingenzi"
          : "Expanded services",
        language === "rw"
          ? "AI assistance"
          : "AI assistance",
        language === "rw"
          ? "Support yihariye"
          : "Priority support",
        language === "rw"
          ? "Experience yuzuye"
          : "Full experience",
      ],
    },
  ];

  /* ==========================================================
     SYSTEMS
  ========================================================== */

  const systems = [
    {
      icon: Cpu,
      name: t.systemEdge,
      text: t.systemEdgeText,
    },
    {
      icon: Radio,
      name: t.systemLink,
      text: t.systemLinkText,
    },
    {
      icon: Cloud,
      name: t.systemCloud,
      text: t.systemCloudText,
    },
    {
      icon: Brain,
      name: t.systemAI,
      text: t.systemAIText,
    },
    {
      icon: Headphones,
      name: t.systemCare,
      text: t.systemCareText,
    },
    {
      icon: BookOpen,
      name: t.systemKnowledge,
      text: t.systemKnowledgeText,
    },
  ];

  /* ==========================================================
     SUPPORT
  ========================================================== */

  const supportItems = [
    {
      icon: Bot,
      title: t.supportAI,
      text: t.supportAIText,
      action: openAI,
      button:
        language === "rw"
          ? "Ganira na AI"
          : "Talk to AI",
    },
    {
      icon: Phone,
      title: t.supportPhone,
      text: t.supportPhoneText,
      action: openPhone,
      button:
        language === "rw"
          ? "Hamagara"
          : "Call",
    },
    {
      icon: MessageCircle,
      title: t.supportWhatsapp,
      text: t.supportWhatsappText,
      action: openWhatsapp,
      button: "WhatsApp",
    },
    {
      icon: Mail,
      title: t.supportEmail,
      text: t.supportEmailText,
      action: openEmail,
      button:
        language === "rw"
          ? "Ohereza Email"
          : "Send Email",
    },
    {
      icon: Globe,
      title: t.supportWeb,
      text: t.supportWebText,
      action: openWebChat,
      button:
        language === "rw"
          ? "Fungura Chat"
          : "Open Chat",
    },
    {
      icon: BookOpen,
      title: t.supportKnowledge,
      text: t.supportKnowledgeText,
      action: openKnowledgeCenter,
      button:
        language === "rw"
          ? "Soma byinshi"
          : "Learn more",
    },
  ];

  /* ==========================================================
     TEAM
  ========================================================== */

  const team = [
    {
      icon: Building2,
      name: t.teamCEO,
      role: t.ceo,
      department:
        "Executive Leadership",
    },
    {
      icon: Brain,
      name: t.teamAI,
      role: t.aiOfficer,
      department:
        "AI Division",
    },
    {
      icon: Database,
      name: t.teamData,
      role: t.dataOfficer,
      department:
        "Data & Cloud",
    },
    {
      icon: Wifi,
      name: t.teamNetwork,
      role: t.cio,
      department:
        "Network & Communication",
    },
    {
      icon: Cpu,
      name: t.teamSystem,
      role: t.cto,
      department:
        "System Development",
    },
    {
      icon: TrendingUp,
      name: t.teamMarketing,
      role: t.cmo,
      department:
        "Marketing & Brand",
    },
    {
      icon: Target,
      name: t.teamBusiness,
      role: t.cbo,
      department:
        "Business Development",
    },
  ];

  /* ==========================================================
     FAQ
  ========================================================== */

  const faqs = [
    {
      q: t.faq1Q,
      a: t.faq1A,
    },
    {
      q: t.faq2Q,
      a: t.faq2A,
    },
    {
      q: t.faq3Q,
      a: t.faq3A,
    },
    {
      q: t.faq4Q,
      a: t.faq4A,
    },
    {
      q: t.faq5Q,
      a: t.faq5A,
    },
  ];

  return (
    <>
      {/* ========================================================
          ANTIMATE AI FLOATING ICON
          KEEPING ORIGINAL DESIGN
      ======================================================== */}

      <style>{`

        @keyframes antimateAIColorFlow {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes antimateAIFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes knowledgePulse {
          0%,
          100% {
            opacity: 0.65;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.06);
          }
        }

        @keyframes trendingGlow {
          0%,
          100% {
            box-shadow:
              0 0 0 rgba(0, 217, 255, 0);
          }

          50% {
            box-shadow:
              0 0 14px rgba(0, 217, 255, 0.18);
          }
        }

        @keyframes antimateInfoFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        .antimate-ai-float-login {
          position: fixed;
          right: 20px;
          bottom: 22px;
          width: 64px;
          height: 64px;
          z-index: 99999;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;
          text-decoration: none;

          animation:
            antimateAIFloat
            4s
            ease-in-out
            infinite;

          -webkit-tap-highlight-color: transparent;
        }

        .antimate-ai-float-login::before {
          content: "";
          position: absolute;
          inset: -6px;

          border-radius: 50%;

          background:
            conic-gradient(
              from 0deg,
              #00d9ff,
              #2563eb,
              #6366f1,
              #a855f7,
              #ec4899,
              #00d9ff
            );

          animation:
            antimateAIColorFlow
            3.5s
            linear
            infinite;

          filter: blur(7px);
          opacity: 0.60;

          z-index: -2;
        }

        .antimate-ai-ring-login {
          position: absolute;
          inset: 0;

          border-radius: 50%;
          overflow: hidden;

          background: #0b1220;

          box-shadow:
            0 10px 28px rgba(0, 0, 0, 0.28),
            0 0 22px rgba(0, 217, 255, 0.18);
        }

        .antimate-ai-ring-login::before {
          content: "";

          position: absolute;
          inset: 0;

          border-radius: 50%;
          padding: 3px;

          background:
            conic-gradient(
              from 0deg,
              #00d9ff,
              #2563eb,
              #6366f1,
              #a855f7,
              #ec4899,
              #00d9ff
            );

          animation:
            antimateAIColorFlow
            3.5s
            linear
            infinite;

          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);

          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .antimate-ai-inner-login {
          position: absolute;
          inset: 7px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            radial-gradient(
              circle at 35% 30%,
              rgba(0, 217, 255, 0.16),
              transparent 45%
            ),
            #0f172a;
        }

        .antimate-ai-text-login {
          position: relative;
          z-index: 3;

          color: #ffffff;

          font-size: 17px;
          font-weight: 900;
          letter-spacing: -0.5px;
          line-height: 1;

          font-family:
            Inter,
            Arial,
            sans-serif;

          user-select: none;
        }

        .antimate-ai-float-login:hover {
          animation-play-state: paused;
          transform: scale(1.08);
        }

        .antimate-ai-float-login:hover::before {
          animation-duration: 1.8s;
          opacity: 0.90;
        }

        .antimate-ai-float-login:active {
          transform: scale(0.94);
        }

        .antimate-ai-float-login:focus-visible {
          outline:
            3px solid
            rgba(0, 217, 255, 0.45);

          outline-offset: 4px;
        }

        .knowledge-nav-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .knowledge-nav-button {
          position: relative;

          display: inline-flex;
          align-items: center;
          gap: 8px;

          min-height: 38px;
          padding: 8px 13px;

          border-radius: 12px;

          border: 1px solid
            rgba(0, 217, 255, 0.28);

          background:
            rgba(0, 217, 255, 0.055);

          color: inherit;

          font-family:
            Inter,
            Arial,
            sans-serif;

          font-size: 13px;
          font-weight: 750;

          cursor: pointer;

          transition:
            transform 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease,
            box-shadow 0.22s ease;
        }

        .knowledge-nav-button svg {
          flex-shrink: 0;
          color: #00d9ff;
        }

        .knowledge-nav-button:hover {
          transform: translateY(-1px);

          border-color:
            rgba(0, 217, 255, 0.65);

          background:
            rgba(0, 217, 255, 0.10);

          box-shadow:
            0 7px 24px
            rgba(0, 217, 255, 0.10);
        }

        .knowledge-nav-button:active {
          transform: translateY(0) scale(0.98);
        }

        .knowledge-nav-button:focus-visible {
          outline:
            3px solid
            rgba(0, 217, 255, 0.25);

          outline-offset: 3px;
        }

        .knowledge-trending-badge {
          position: absolute;

          top: -9px;
          right: -9px;

          display: inline-flex;
          align-items: center;
          gap: 3px;

          padding: 3px 7px;

          border-radius: 999px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #6366f1
            );

          border:
            1px solid
            rgba(255, 255, 255, 0.22);

          color: #ffffff;

          font-size: 8px;
          font-weight: 900;

          letter-spacing: 0.7px;

          line-height: 1;

          white-space: nowrap;

          animation:
            trendingGlow
            2.5s
            ease-in-out
            infinite;

          pointer-events: none;
        }

        .knowledge-trending-badge svg {
          width: 9px;
          height: 9px;

          color: #ffffff;
        }

        /* ======================================================
           NEW ANTIMATE PUBLIC INFORMATION STYLES
        ====================================================== */

        .antimate-public-section {
          position: relative;
          padding: 105px 7%;
          overflow: hidden;
        }

        .antimate-public-container {
          position: relative;
          max-width: 1250px;
          margin: 0 auto;
        }

        .antimate-section-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
          color: #00a8d6;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }

        .antimate-section-label svg {
          width: 16px;
          height: 16px;
        }

        .antimate-section-title {
          max-width: 760px;
          margin: 0;
          font-size: clamp(30px, 4vw, 52px);
          line-height: 1.08;
          letter-spacing: -1.8px;
        }

        .antimate-section-subtitle {
          max-width: 720px;
          margin: 18px 0 0;
          font-size: 16px;
          line-height: 1.75;
          opacity: 0.72;
        }

        /* ======================================================
           ECOSYSTEM
        ====================================================== */

        .antimate-system-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 45px;
        }

        .antimate-system-card {
          position: relative;
          padding: 28px;
          border-radius: 22px;

          border: 1px solid
            rgba(0, 217, 255, 0.12);

          background:
            linear-gradient(
              145deg,
              rgba(0, 217, 255, 0.06),
              rgba(37, 99, 235, 0.025)
            );

          transition:
            transform .25s ease,
            border-color .25s ease,
            box-shadow .25s ease;

          overflow: hidden;
        }

        .antimate-system-card::after {
          content: "";
          position: absolute;
          width: 100px;
          height: 100px;
          right: -50px;
          bottom: -50px;
          border-radius: 50%;
          background:
            rgba(0, 217, 255, 0.08);
          filter: blur(20px);
        }

        .antimate-system-card:hover {
          transform: translateY(-7px);
          border-color:
            rgba(0, 217, 255, 0.32);
          box-shadow:
            0 18px 50px
            rgba(0, 0, 0, 0.12);
        }

        .antimate-system-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          margin-bottom: 20px;
          color: #00d9ff;
          background:
            rgba(0, 217, 255, 0.09);
          border:
            1px solid
            rgba(0, 217, 255, 0.15);
        }

        .antimate-system-card h3 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .antimate-system-card p {
          margin: 0;
          line-height: 1.7;
          opacity: 0.68;
          font-size: 14px;
        }

        /* ======================================================
           ABOUT
        ====================================================== */

        .antimate-about-layout {
          display: grid;
          grid-template-columns:
            1.1fr .9fr;
          gap: 65px;
          align-items: center;
        }

        .antimate-about-description {
          font-size: 18px;
          line-height: 1.85;
          opacity: .76;
          margin-top: 25px;
        }

        .antimate-definition {
          margin-top: 27px;
          padding: 24px;
          border-left:
            3px solid #00d9ff;
          border-radius: 0 16px 16px 0;
          background:
            rgba(0, 217, 255, 0.055);
        }

        .antimate-definition strong {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #00bce7;
        }

        .antimate-definition span {
          font-size: 16px;
          line-height: 1.7;
        }

        .antimate-about-panel {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 14px;
        }

        .antimate-about-mini {
          min-height: 150px;
          padding: 23px;
          border-radius: 20px;
          border:
            1px solid
            rgba(0, 217, 255, .12);
          background:
            rgba(127, 127, 127, .055);
        }

        .antimate-about-mini svg {
          color: #00bce7;
          margin-bottom: 15px;
        }

        .antimate-about-mini h4 {
          margin: 0 0 7px;
          font-size: 16px;
        }

        .antimate-about-mini p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          opacity: .66;
        }

        /* ======================================================
           PLANS
        ====================================================== */

        .antimate-plans-section {
          background:
            linear-gradient(
              180deg,
              transparent,
              rgba(0, 217, 255, .025),
              transparent
            );
        }

        .antimate-plans-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-top: 45px;
        }

        .antimate-plan-card {
          position: relative;
          padding: 29px 25px;
          border-radius: 23px;
          border:
            1px solid
            rgba(127,127,127,.14);
          background:
            rgba(127,127,127,.045);
          transition:
            transform .25s ease,
            border-color .25s ease,
            box-shadow .25s ease;
        }

        .antimate-plan-card:hover {
          transform: translateY(-7px);
          border-color:
            rgba(0, 217, 255, .28);
          box-shadow:
            0 18px 50px
            rgba(0,0,0,.11);
        }

        .antimate-plan-card.popular {
          border:
            1px solid
            rgba(0, 217, 255, .45);
          background:
            linear-gradient(
              150deg,
              rgba(0,217,255,.11),
              rgba(37,99,235,.055)
            );
          transform: translateY(-8px);
        }

        .antimate-plan-card.popular:hover {
          transform: translateY(-13px);
        }

        .antimate-popular-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          padding: 5px 9px;
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              #00bce7,
              #2563eb
            );
          color: #fff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .antimate-plan-icon {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          color: #00bce7;
          background:
            rgba(0,217,255,.08);
          margin-bottom: 19px;
        }

        .antimate-plan-card h3 {
          margin: 0;
          font-size: 21px;
        }

        .antimate-plan-price {
          margin: 13px 0 3px;
          font-size: 27px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .antimate-plan-month {
          font-size: 11px;
          opacity: .55;
        }

        .antimate-plan-description {
          min-height: 65px;
          margin: 18px 0;
          font-size: 13px;
          line-height: 1.65;
          opacity: .66;
        }

        .antimate-plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 23px;
          display: grid;
          gap: 11px;
        }

        .antimate-plan-features li {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-size: 12px;
          line-height: 1.45;
        }

        .antimate-plan-features svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #00bce7;
        }

        .antimate-plan-button {
          width: 100%;
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          color: #fff;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );
          font-weight: 800;
          font-size: 12px;
          transition: transform .2s ease;
        }

        .antimate-plan-button:hover {
          transform: translateY(-2px);
        }

        /* ======================================================
           SUPPORT
        ====================================================== */

        .antimate-support-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 17px;
          margin-top: 42px;
        }

        .antimate-support-card {
          padding: 25px;
          border-radius: 20px;
          border:
            1px solid
            rgba(127,127,127,.13);
          background:
            rgba(127,127,127,.045);
        }

        .antimate-support-icon {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          color: #00bce7;
          background:
            rgba(0,217,255,.08);
          margin-bottom: 17px;
        }

        .antimate-support-card h3 {
          margin: 0 0 9px;
          font-size: 17px;
        }

        .antimate-support-card p {
          min-height: 55px;
          margin: 0 0 17px;
          font-size: 13px;
          line-height: 1.65;
          opacity: .65;
        }

        .antimate-support-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 0;
          background: transparent;
          color: #00a8d6;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          padding: 0;
        }

        /* ======================================================
           CONTACT
        ====================================================== */

        .antimate-contact-strip {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 15px;
          margin-top: 38px;
        }

        .antimate-contact-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 19px;
          border-radius: 16px;
          background:
            rgba(127,127,127,.05);
          border:
            1px solid
            rgba(127,127,127,.11);
        }

        .antimate-contact-item svg {
          flex-shrink: 0;
          color: #00bce7;
        }

        .antimate-contact-item strong {
          display: block;
          font-size: 13px;
          margin-bottom: 3px;
        }

        .antimate-contact-item span {
          font-size: 12px;
          opacity: .62;
        }

        /* ======================================================
           TEAM
        ====================================================== */

        .antimate-team-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-top: 42px;
        }

        .antimate-team-card {
          padding: 23px 19px;
          border-radius: 18px;
          border:
            1px solid
            rgba(127,127,127,.12);
          background:
            rgba(127,127,127,.045);
        }

        .antimate-team-avatar {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #00bce7;
          background:
            rgba(0,217,255,.08);
          margin-bottom: 15px;
        }

        .antimate-team-card h3 {
          margin: 0 0 5px;
          font-size: 15px;
        }

        .antimate-team-role {
          display: block;
          color: #00a8d6;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.4;
        }

        .antimate-team-department {
          display: block;
          margin-top: 8px;
          font-size: 10px;
          opacity: .52;
          line-height: 1.5;
        }

        /* ======================================================
           FAQ
        ====================================================== */

        .antimate-faq-list {
          max-width: 900px;
          margin: 42px auto 0;
          display: grid;
          gap: 10px;
        }

        .antimate-faq-item {
          border:
            1px solid
            rgba(127,127,127,.13);
          border-radius: 16px;
          overflow: hidden;
          background:
            rgba(127,127,127,.04);
        }

        .antimate-faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 19px 20px;
          border: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
        }

        .antimate-faq-question svg {
          flex-shrink: 0;
          transition:
            transform .25s ease;
        }

        .antimate-faq-item.open
        .antimate-faq-question svg {
          transform: rotate(180deg);
        }

        .antimate-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition:
            max-height .3s ease,
            padding .3s ease;
        }

        .antimate-faq-item.open
        .antimate-faq-answer {
          max-height: 250px;
        }

        .antimate-faq-answer p {
          margin: 0;
          padding: 0 20px 20px;
          font-size: 13px;
          line-height: 1.75;
          opacity: .65;
        }

        /* ======================================================
           COMPANY BADGE
        ====================================================== */

        .antimate-company-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border:
            1px solid
            rgba(0,217,255,.17);
          background:
            rgba(0,217,255,.05);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .7px;
        }

        .antimate-company-badge svg {
          color: #00bce7;
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 1100px) {
          .antimate-plans-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .antimate-team-grid {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .antimate-system-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .knowledge-nav-wrapper {
            width: 100%;
          }

          .knowledge-nav-button {
            width: 100%;
            justify-content: center;
            min-height: 44px;
            padding: 10px 14px;
          }

          .knowledge-trending-badge {
            top: 3px;
            right: 12px;
          }

          .antimate-public-section {
            padding: 80px 6%;
          }

          .antimate-about-layout {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .antimate-support-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .antimate-contact-strip {
            grid-template-columns: 1fr;
          }

          .antimate-team-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .antimate-ai-float-login {
            right: 16px;
            bottom: 18px;
            width: 58px;
            height: 58px;
          }

          .antimate-ai-inner-login {
            inset: 6px;
          }

          .antimate-ai-text-login {
            font-size: 16px;
          }

          .antimate-public-section {
            padding: 68px 5%;
          }

          .antimate-system-grid,
          .antimate-plans-grid,
          .antimate-support-grid,
          .antimate-team-grid {
            grid-template-columns: 1fr;
          }

          .antimate-plan-card.popular {
            transform: none;
          }

          .antimate-plan-card.popular:hover {
            transform: translateY(-7px);
          }

          .antimate-about-panel {
            grid-template-columns: 1fr;
          }

          .antimate-contact-strip {
            grid-template-columns: 1fr;
          }

          .antimate-section-title {
            font-size: 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .antimate-ai-float-login,
          .antimate-ai-float-login::before,
          .antimate-ai-ring-login::before,
          .knowledge-trending-badge,
          .antimate-system-card,
          .antimate-plan-card {
            animation: none;
            transition: none;
          }
        }

      `}</style>

      {/* ========================================================
          PAGE
      ======================================================== */}

      <div
        className={`login-page ${
          darkMode ? "dark" : "light"
        }`}
      >
        <div className="background-orb orb-one" />
        <div className="background-orb orb-two" />

        {/* ======================================================
            NAVBAR
        ====================================================== */}

        <header className="login-navbar">
          <div className="brand">
            <div className="brand-logo">
              <AntimateLogo size={39} />
            </div>

            <div>
              <strong>ANTIMATE</strong>

              <span>
                SMART FARMING
              </span>
            </div>
          </div>

          <nav
            className={
              mobileMenu
                ? "navigation mobile-open"
                : "navigation"
            }
          >
            <a
              href="#home"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.navHome}
            </a>

            <a
              href="#features"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.navHow}
            </a>

            <a
              href="#systems"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.navSystems}
            </a>

            <a
              href="#plans"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.navPlans}
            </a>

            <a
              href="#about"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.navAbout}
            </a>

            <a
              href="#support"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.navSupport}
            </a>

            <div className="knowledge-nav-wrapper">
              <button
                type="button"
                className="knowledge-nav-button"
                onClick={
                  openKnowledgeCenter
                }
              >
                <BookOpen
                  size={16}
                  strokeWidth={2.2}
                />

                <span>
                  {t.knowledge}
                </span>
              </button>

              <span className="knowledge-trending-badge">
                <TrendingUp
                  size={9}
                  strokeWidth={3}
                />

                {t.trending}
              </span>
            </div>

            <button
              onClick={() => {
                setShowLogin(true);
                setMobileMenu(false);
              }}
              className="nav-login"
            >
              {t.login}
            </button>

            <Link
              to="/signup"
              className="nav-signup"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.signup}

              <ArrowRight size={15} />
            </Link>
          </nav>

          <div className="navbar-tools">
            <button
              className="language-button"
              onClick={() =>
                setLanguage(
                  language === "rw"
                    ? "en"
                    : "rw"
                )
              }
              aria-label="Change language"
            >
              {language === "rw"
                ? "RW"
                : "EN"}
            </button>

            <button
              className="theme-button"
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>

            <button
              className="mobile-menu-button"
              onClick={() =>
                setMobileMenu(
                  !mobileMenu
                )
              }
              aria-label="Toggle menu"
            >
              {mobileMenu ? (
                <X />
              ) : (
                <Menu />
              )}
            </button>
          </div>
        </header>

        {/* ======================================================
            MAIN
        ====================================================== */}

        <main>

          {/* ====================================================
              HERO
          ==================================================== */}

          <section
            id="home"
            className="hero-section"
          >
            <div className="hero-content">

              <div className="hero-badge">
                <Sparkles size={15} />
                {t.eyebrow}
              </div>

              <div className="antimate-company-badge">
                <Building2 size={13} />
                Kigali, Rwanda
              </div>

              <h1>
                {t.title1}

                <br />

                <span>
                  {t.title2}
                </span>
              </h1>

              <div className="animated-words">
                <span>
                  Ubworozi bwiza.
                </span>

                <span>
                  Ikoranabuhanga ryoroshye.
                </span>

                <span>
                  Umusaruro mwiza.
                </span>

                <span>
                  Ejo hazaza heza.
                </span>
              </div>

              <p className="hero-description">
                {t.description}
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-button"
                  onClick={() =>
                    setShowLogin(true)
                  }
                >
                  {t.start}
                  <ArrowRight size={18} />
                </button>

                <a
                  href="#about"
                  className="secondary-button"
                >
                  {t.learn}
                </a>
              </div>

              <div className="hero-trust">
                <div>
                  <ShieldCheck size={17} />
                  <span>{t.live}</span>
                </div>

                <div>
                  <Leaf size={17} />
                  <span>{t.smart}</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-glow" />

              <div className="farm-image">
                <img
                  src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=900&q=85"
                  alt="Chickens on a farm"
                />
              </div>

              <div className="floating-card card-temperature">
                <div className="floating-icon">
                  <Leaf size={17} />
                </div>

                <div>
                  <span>
                    Farm conditions
                  </span>

                  <strong>
                    Healthy
                  </strong>
                </div>
              </div>

              <div className="floating-card card-ai">
                <div className="ai-icon">
                  <Brain size={18} />
                </div>

                <div>
                  <span>
                    ANTIMATE
                  </span>

                  <strong>
                    Smart insights
                  </strong>
                </div>
              </div>

              <div className="floating-circle circle-one" />
              <div className="floating-circle circle-two" />
            </div>
          </section>

          {/* ====================================================
              FEATURES
          ==================================================== */}

          <section
            id="features"
            className="features-section"
          >
            <div className="section-heading">
              <span>ANTIMATE</span>

              <h2>
                {t.featuresTitle}
              </h2>
            </div>

            <div className="feature-grid">
              <Feature
                icon={<Wifi />}
                title={t.feature1Title}
                text={t.feature1Text}
              />

              <Feature
                icon={<Brain />}
                title={t.feature2Title}
                text={t.feature2Text}
              />

              <Feature
                icon={<LineChart />}
                title={t.feature3Title}
                text={t.feature3Text}
              />
            </div>
          </section>

          {/* ====================================================
              ECOSYSTEM
          ==================================================== */}

          <section
            id="systems"
            className="antimate-public-section"
          >
            <div className="antimate-public-container">

              <div className="antimate-section-label">
                <Sparkles size={16} />
                ANTIMATE ECOSYSTEM
              </div>

              <h2 className="antimate-section-title">
                {t.systemsTitle}
              </h2>

              <p className="antimate-section-subtitle">
                {t.systemsSubtitle}
              </p>

              <div className="antimate-system-grid">
                {systems.map(
                  (system, index) => {
                    const Icon =
                      system.icon;

                    return (
                      <div
                        className="antimate-system-card"
                        key={index}
                      >
                        <div className="antimate-system-icon">
                          <Icon size={23} />
                        </div>

                        <h3>
                          {system.name}
                        </h3>

                        <p>
                          {system.text}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* ====================================================
              ABOUT ANTIMATE
          ==================================================== */}

          <section
            id="about"
            className="antimate-public-section"
          >
            <div className="antimate-public-container">

              <div className="antimate-about-layout">

                <div>
                  <div className="antimate-section-label">
                    <Building2 size={16} />
                    ABOUT ANTIMATE
                  </div>

                  <h2 className="antimate-section-title">
                    {t.aboutTitle}
                  </h2>

                  <p className="antimate-about-description">
                    {t.aboutText}
                  </p>

                  <div className="antimate-definition">
                    <strong>
                      ANTIMATE
                    </strong>

                    <span>
                      Advanced Networked
                      Technology With
                      Intelligent Machines
                      And Telemetry
                      Ecosystem.
                    </span>
                  </div>
                </div>

                <div className="antimate-about-panel">

                  <div className="antimate-about-mini">
                    <Target size={21} />

                    <h4>
                      {t.purposeTitle}
                    </h4>

                    <p>
                      {t.purposeText}
                    </p>
                  </div>

                  <div className="antimate-about-mini">
                    <Eye size={21} />

                    <h4>
                      {t.visionShortTitle}
                    </h4>

                    <p>
                      {t.visionShortText}
                    </p>
                  </div>

                  <div className="antimate-about-mini">
                    <Lightbulb size={21} />

                    <h4>
                      {t.value1}
                    </h4>

                    <p>
                      {t.value2}
                    </p>
                  </div>

                  <div className="antimate-about-mini">
                    <Lock size={21} />

                    <h4>
                      {t.value4}
                    </h4>

                    <p>
                      {t.value3}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* ====================================================
              VISION
          ==================================================== */}

          <section
            id="vision"
            className="vision-section"
          >
            <div className="vision-image">
              <img
                src="https://a-z-animals.com/media/2022/01/group-of-funny-baby-chicks-on-the-farm-picture-id1243389108.jpg"
                alt="Modern poultry farming"
              />
            </div>

            <div className="vision-content">

              <div className="small-heading">
                <HeartHandshake size={17} />
                OUR PURPOSE
              </div>

              <h2>
                {t.visionTitle}
              </h2>

              <p>
                {t.visionText}
              </p>

              <div className="vision-points">

                <div>
                  <Cloud size={18} />
                  <span>
                    Simple technology
                  </span>
                </div>

                <div>
                  <ShieldCheck size={18} />
                  <span>
                    Reliable information
                  </span>
                </div>

                <div>
                  <Lock size={18} />
                  <span>
                    Secure platform
                  </span>
                </div>

              </div>
            </div>
          </section>

          {/* ====================================================
              PLANS
          ==================================================== */}

          <section
            id="plans"
            className="antimate-public-section antimate-plans-section"
          >
            <div className="antimate-public-container">

              <div className="antimate-section-label">
                <BarChart3 size={16} />
                PLANS & PRICING
              </div>

              <h2 className="antimate-section-title">
                {t.plansTitle}
              </h2>

              <p className="antimate-section-subtitle">
                {t.plansSubtitle}
              </p>

              <div className="antimate-plans-grid">
                {plans.map(
                  (plan, index) => {
                    const Icon =
                      plan.icon;

                    return (
                      <div
                        key={index}
                        className={`antimate-plan-card ${
                          plan.popular
                            ? "popular"
                            : ""
                        }`}
                      >

                        {plan.popular && (
                          <div className="antimate-popular-badge">
                            POPULAR
                          </div>
                        )}

                        <div className="antimate-plan-icon">
                          <Icon size={21} />
                        </div>

                        <h3>
                          {plan.name}
                        </h3>

                        <div className="antimate-plan-price">
                          {plan.price}
                        </div>

                        {plan.name !==
                          t.free && (
                          <span className="antimate-plan-month">
                            {t.month}
                          </span>
                        )}

                        <p className="antimate-plan-description">
                          {plan.description}
                        </p>

                        <ul className="antimate-plan-features">
                          {plan.features.map(
                            (
                              feature,
                              featureIndex
                            ) => (
                              <li
                                key={
                                  featureIndex
                                }
                              >
                                <Check
                                  size={14}
                                />

                                <span>
                                  {feature}
                                </span>
                              </li>
                            )
                          )}
                        </ul>

                        <button
                          className="antimate-plan-button"
                          onClick={() =>
                            navigate(
                              "/signup"
                            )
                          }
                        >
                          {t.choosePlan}

                          <ArrowRight
                            size={14}
                          />
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* ====================================================
              SUPPORT
          ==================================================== */}

          <section
            id="support"
            className="antimate-public-section"
          >
            <div className="antimate-public-container">

              <div className="antimate-section-label">
                <Headphones size={16} />
                ANTIMATE SUPPORT
              </div>

              <h2 className="antimate-section-title">
                {t.supportTitle}
              </h2>

              <p className="antimate-section-subtitle">
                {t.supportSubtitle}
              </p>

              <div className="antimate-support-grid">
                {supportItems.map(
                  (item, index) => {
                    const Icon =
                      item.icon;

                    return (
                      <div
                        className="antimate-support-card"
                        key={index}
                      >
                        <div className="antimate-support-icon">
                          <Icon size={21} />
                        </div>

                        <h3>
                          {item.title}
                        </h3>

                        <p>
                          {item.text}
                        </p>

                        <button
                          className="antimate-support-button"
                          onClick={
                            item.action
                          }
                        >
                          {item.button}

                          <ArrowUpRight
                            size={14}
                          />
                        </button>
                      </div>
                    );
                  }
                )}
              </div>

              {/* CONTACT INFORMATION */}

              <div className="antimate-contact-strip">

                <div className="antimate-contact-item">
                  <Phone size={20} />

                  <div>
                    <strong>
                      +250 798 698 431
                    </strong>

                    <span>
                      {t.supportPhone}
                    </span>
                  </div>
                </div>

                <div className="antimate-contact-item">
                  <Mail size={20} />

                  <div>
                    <strong>
                      antimate.inc@gmai.com
                    </strong>

                    <span>
                      {t.supportEmail}
                    </span>
                  </div>
                </div>

                <div className="antimate-contact-item">
                  <MapPin size={20} />

                  <div>
                    <strong>
                      {t.contactLocation}
                    </strong>

                    <span>
                      {t.contactOpen}
                    </span>
                  </div>
                </div>

              </div>

              <div className="antimate-contact-strip">

                <div className="antimate-contact-item">
                  <MessageCircle
                    size={20}
                  />

                  <div>
                    <strong>
                      +250 798 698 431
                    </strong>

                    <span>
                      WhatsApp
                    </span>
                  </div>
                </div>

                <div className="antimate-contact-item">
                  <Globe size={20} />

                  <div>
                    <strong>
                      Web Chat Room
                    </strong>

                    <span>
                      ANTIMATE online support
                    </span>
                  </div>
                </div>

                <div className="antimate-contact-item">
                  <CalendarDays
                    size={20}
                  />

                  <div>
                    <strong>
                      14 April 2026
                    </strong>

                    <span>
                      {t.contactSince}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ====================================================
              TEAM
          ==================================================== */}

          <section
            className="antimate-public-section"
          >
            <div className="antimate-public-container">

              <div className="antimate-section-label">
                <Users size={16} />
                OUR TEAM
              </div>

              <h2 className="antimate-section-title">
                {t.teamTitle}
              </h2>

              <p className="antimate-section-subtitle">
                {t.teamSubtitle}
              </p>

              <div className="antimate-team-grid">
                {team.map(
                  (member, index) => {
                    const Icon =
                      member.icon;

                    return (
                      <div
                        className="antimate-team-card"
                        key={index}
                      >
                        <div className="antimate-team-avatar">
                          <Icon size={20} />
                        </div>

                        <h3>
                          {member.name}
                        </h3>

                        <span className="antimate-team-role">
                          {member.role}
                        </span>

                        <span className="antimate-team-department">
                          {member.department}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* ====================================================
              FAQ
          ==================================================== */}

          <section
            className="antimate-public-section"
          >
            <div className="antimate-public-container">

              <div
                style={{
                  textAlign: "center",
                }}
              >
                <div className="antimate-section-label">
                  <BookOpen size={16} />
                  FAQ
                </div>

                <h2
                  className="antimate-section-title"
                  style={{
                    margin:
                      "0 auto",
                  }}
                >
                  {t.faqTitle}
                </h2>
              </div>

              <div className="antimate-faq-list">

                {faqs.map(
                  (faq, index) => (
                    <div
                      key={index}
                      className={`antimate-faq-item ${
                        openFaq === index
                          ? "open"
                          : ""
                      }`}
                    >
                      <button
                        className="antimate-faq-question"
                        onClick={() =>
                          setOpenFaq(
                            openFaq ===
                              index
                              ? null
                              : index
                          )
                        }
                      >
                        <span>
                          {faq.q}
                        </span>

                        <ChevronDown
                          size={18}
                        />
                      </button>

                      <div className="antimate-faq-answer">
                        <p>
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  )
                )}

              </div>
            </div>
          </section>

          {/* ====================================================
              JOIN
          ==================================================== */}

          <section className="join-section">
            <div className="join-content">

              <Sparkles size={28} />

              <h2>
                {t.joinTitle}
              </h2>

              <p>
                {t.joinText}
              </p>

              <Link
                to="/signup"
                className="primary-button"
              >
                {t.signup}

                <ArrowRight size={18} />
              </Link>

            </div>
          </section>

        </main>

        {/* ======================================================
            ORIGINAL ANTIMATE AI BUTTON
        ====================================================== */}

        <Link
          to="/antimate-ai"
          className="antimate-ai-float-login"
          aria-label="Open ANTIMATE AI"
          title="ANTIMATE AI"
        >
          <div className="antimate-ai-ring-login">
            <div className="antimate-ai-inner-login">
              <span className="antimate-ai-text-login">
                AI
              </span>
            </div>
          </div>
        </Link>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="login-footer">

          <div className="footer-brand">
            <AntimateLogo size={30} />

            <strong>
              ANTIMATE
            </strong>
          </div>

          <p>
            {t.footer}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
              marginTop: "12px",
              fontSize: "11px",
              opacity: 0.65,
            }}
          >
            <span>
              📍 Kigali, Rwanda
            </span>

            <span>
              📞 +250 798 698 431
            </span>

            <span>
              ✉️ antimate.inc@gmai.com
            </span>

            <span>
              🗓️ Since 14 April 2026
            </span>
          </div>

        </footer>

        {/* ======================================================
            LOGIN MODAL
        ====================================================== */}

        {showLogin && (
          <div
            className="modal-overlay"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                setShowLogin(false);
              }
            }}
          >
            <div className="login-modal">

              <button
                className="close-modal"
                onClick={() =>
                  setShowLogin(false)
                }
                aria-label="Close login"
              >
                <X size={19} />
              </button>

              <div className="modal-logo">
                <AntimateLogo size={42} />
              </div>

              <h2>
                {t.loginTitle}
              </h2>

              <p className="modal-subtitle">
                {t.loginSubtitle}
              </p>

              <form
                onSubmit={
                  handleLogin
                }
              >

                <div className="input-group">
                  <label>
                    {t.identifier}
                  </label>

                  <input
                    type="text"
                    placeholder={
                      t.identifierPlaceholder
                    }
                    value={
                      identifier
                    }
                    onChange={(e) =>
                      setIdentifier(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    {t.password}
                  </label>

                  <div className="password-input">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder={
                        t.passwordPlaceholder
                      }
                      value={
                        password
                      }
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          size={18}
                        />
                      ) : (
                        <Eye
                          size={18}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className="login-error">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="modal-login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loader" />
                  ) : (
                    <>
                      {t.signIn}

                      <ArrowRight
                        size={17}
                      />
                    </>
                  )}
                </button>

              </form>

              <div className="modal-bottom">

                <Link
                  to="/forgot-password"
                  onClick={() =>
                    setShowLogin(
                      false
                    )
                  }
                >
                  {t.forgot}
                </Link>

                <span>
                  {t.noAccount}{" "}

                  <Link
                    to="/signup"
                    onClick={() =>
                      setShowLogin(
                        false
                      )
                    }
                  >
                    {t.create}
                  </Link>
                </span>

              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ============================================================
   FEATURE COMPONENT
============================================================ */

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div className="feature-card">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

      <div className="feature-line" />
    </div>
  );
}

export default Login;