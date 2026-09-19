import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import {
  ArrowRight,
  Brain,
  Eye,
  EyeOff,
  Leaf,
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
  Database,
  Bot,
  ArrowUpRight,
  Layers,
  Network,
  Radio,
} from "lucide-react";

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
   LOGIN / PUBLIC ANTIMATE LANDING
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

  const [showSystemSelection, setShowSystemSelection] =
    useState(false);

  /* ==========================================================
     CONTENT
  ========================================================== */

  const content = {
    rw: {
      navHome: "Ahabanza",
      navHow: "Uko ikora",
      navSystems: "Systems",
      navPlans: "Pricing",
      navAbout: "ANTIMATE",
      navSupport: "Support",

      knowledge: "ANTIMATE Knowledge",
      trending: "NEW",

      login: "Injira",
      signup: "Tangira natwe",

      eyebrow: "INTELLIGENT TECHNOLOGY ECOSYSTEM",

      title1: "Ikoranabuhanga",
      title2: "rihuza abantu, data n'ubwenge.",

      description:
        "ANTIMATE ni ecosystem y'ikoranabuhanga ihuza devices, communication, cloud, data na Artificial Intelligence kugira ngo abantu n'ibikorwa babashe gukoresha amakuru neza, gukora automation no gufata ibyemezo bifite ishingiro.",

      start: "Tangira natwe",
      learn: "Menya ANTIMATE",

      live: "Real-time data",
      smart: "Intelligent technology",

      featuresTitle:
        "Ikoranabuhanga ryubakiye ku buryo bwuzuye",

      feature1Title: "Connect",
      feature1Text:
        "ANTIMATE ihuza devices, communication n'ibikorwa bitandukanye kugira ngo amakuru ashobore kugenda neza kandi mu buryo bwizewe.",

      feature2Title: "Understand",
      feature2Text:
        "Data ikusanywa kandi igatunganywa kugira ngo ibe amakuru ashobora gusobanuka no gukoreshwa mu gufata ibyemezo.",

      feature3Title: "Intelligence",
      feature3Text:
        "Artificial Intelligence ifasha guhindura amakuru mo insights, guidance n'ubufasha bufatika.",

      visionTitle:
        "Kubaka ecosystem y'ikoranabuhanga ishobora gukorera ahantu hatandukanye",

      visionText:
        "ANTIMATE yubaka infrastructure ihuza devices, communication, cloud services, data na Artificial Intelligence. Intego ni ugukora technology ishobora gukoreshwa mu bworozi, agriculture, smart home, monitoring, automation n'izindi domains.",

      systemsTitle: "ANTIMATE Systems",
      systemsSubtitle:
        "Systems zacu z'ingenzi zagenewe guhuza ubushobozi bwa system n'umubare w'ibikorwa bikenewe.",

      system300: "BR System 300",
      system300Text:
        "System yagenewe ibikorwa bito kandi biciriritse bigera kuri 300 chicks.",

      system750: "BR System 750",
      system750Text:
        "System yagenewe ibikorwa bigera kuri 750 chicks kandi ikenera ubushobozi bwagutse.",

      system1000: "BR System 1000",
      system1000Text:
        "System yagenewe ibikorwa binini bigera kuri 1,000 chicks kandi ikora ku rwego rwagutse.",

      capacity: "Capacity",
      chicks: "chicks",

      plansTitle: "Pricing ijyanye na System yawe",
      plansSubtitle:
        "Hitamo BR System ijyanye n'ubushobozi bw'igikorwa cyawe. Installation na delivery ni ubuntu.",

      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      month: "/ ukwezi",

      installation: "Installation & delivery",
      freeInstallation: "Ubuntu",

      choosePlan: "Hitamo iyi plan",

      aboutTitle: "ANTIMATE ni iki?",
      aboutText:
        "ANTIMATE ni Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem. Ni ecosystem ihuza hardware, networks, cloud, data na AI kugira ngo technology ibe yoroshye gukoresha kandi ibe useful mu bikorwa bitandukanye.",

      purposeTitle: "Intego yacu",
      purposeText:
        "Kubaka technology yizewe, yoroshye kandi ishobora guhuza devices, data n'abantu.",

      visionShortTitle: "Icyerekezo",
      visionShortText:
        "Kuba ecosystem y'ikoranabuhanga ihuza communication, intelligence na automation mu buryo bushobora kwaguka.",

      valuesTitle: "Ibyo twemera",
      value1: "Ubwizerwe",
      value2: "Udushya",
      value3: "Ubworoherane",
      value4: "Umutekano w'amakuru",

      supportTitle: "Ukeneye ubufasha?",
      supportSubtitle:
        "ANTIMATE iguha uburyo bwinshi bwo kubona ubufasha n'amakuru.",

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
        "Soma documentation, guides n'amakuru ya ANTIMATE.",

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
      teamNoella: "NOELLA",

      faqTitle: "Ibibazo bikunze kubazwa",

      faq1Q: "ANTIMATE ikora iki?",
      faq1A:
        "ANTIMATE ihuza devices, communication, cloud, data na AI kugira ngo ifashe abantu n'ibikorwa gukoresha technology neza.",

      faq2Q: "BR System ni iki?",
      faq2A:
        "BR System ni systems za ANTIMATE zagenewe gukoresha technology mu micungire no gukurikirana ibikorwa by'ubworozi bw'inkoko, hakurikijwe ubushobozi bw'umubare w'inkoko.",

      faq3Q: "Ni izihe BR Systems zihari?",
      faq3A:
        "Hari BR System 300, BR System 750 na BR System 1000.",

      faq4Q: "Installation na delivery birishyurwa?",
      faq4A:
        "Oya. Installation na delivery ni ubuntu.",

      faq5Q: "Ni gute ninjiye muri ANTIMATE?",
      faq5A:
        "Umaze gukora login, ANTIMATE izakubaza BR System ushaka gukoresha.",

      joinTitle: "Witeguye gutangira?",
      joinText:
        "Injira muri ANTIMATE uhitemo BR System ijyanye n'ibyo ushaka gukora.",

      loginTitle: "Murakaza neza",
      loginSubtitle:
        "Injira muri konti yawe ya ANTIMATE",

      identifier: "Email, Username cyangwa Telefoni",
      identifierPlaceholder:
        "Andika email, username cyangwa telefoni",

      password: "Ijambobanga",
      passwordPlaceholder:
        "Andika ijambobanga",

      signIn: "Injira",
      forgot: "Wibagiwe ijambobanga?",

      noAccount: "Nta konti ufite?",
      create: "Fungura konti",

      selectionTitle: "Hitamo BR System",
      selectionSubtitle:
        "Ni iyihe system ushaka gukoresha nyuma yo kwinjira?",

      system300Button: "Jya kuri BR System 300",
      system750Button: "Jya kuri BR System 750",
      system1000Button: "Jya kuri BR System 1000",

      cancel: "Subira",

      footer:
        "ANTIMATE © 2026 • Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem",
    },

    en: {
      navHome: "Home",
      navHow: "How it works",
      navSystems: "Systems",
      navPlans: "Pricing",
      navAbout: "About",
      navSupport: "Support",

      knowledge: "ANTIMATE Knowledge",
      trending: "NEW",

      login: "Login",
      signup: "Join us",

      eyebrow: "INTELLIGENT TECHNOLOGY ECOSYSTEM",

      title1: "Technology",
      title2: "that connects people, data and intelligence.",

      description:
        "ANTIMATE is an intelligent technology ecosystem connecting devices, communication, cloud, data and Artificial Intelligence to help people and businesses use information, automation and intelligence more effectively.",

      start: "Get started",
      learn: "Explore ANTIMATE",

      live: "Real-time data",
      smart: "Intelligent technology",

      featuresTitle:
        "A complete technology ecosystem",

      feature1Title: "Connect",
      feature1Text:
        "ANTIMATE connects devices, communication and different operations so information can move reliably.",

      feature2Title: "Understand",
      feature2Text:
        "Data is collected and processed so it becomes useful information that can support better decisions.",

      feature3Title: "Intelligence",
      feature3Text:
        "Artificial Intelligence turns information into insights, guidance and practical assistance.",

      visionTitle:
        "Building a technology ecosystem that can work across different environments",

      visionText:
        "ANTIMATE connects devices, communication, cloud services, data and Artificial Intelligence. The architecture is designed to expand across farming, agriculture, smart homes, monitoring, automation and other domains.",

      systemsTitle: "ANTIMATE Systems",
      systemsSubtitle:
        "Our core systems are designed around the operational capacity required by each project.",

      system300: "BR System 300",
      system300Text:
        "A system designed for small and medium operations of up to 300 chicks.",

      system750: "BR System 750",
      system750Text:
        "A system designed for operations of up to 750 chicks with expanded capacity.",

      system1000: "BR System 1000",
      system1000Text:
        "A system designed for larger operations of up to 1,000 chicks.",

      capacity: "Capacity",
      chicks: "chicks",

      plansTitle: "Pricing for your System",
      plansSubtitle:
        "Choose the BR System that matches your operation. Installation and delivery are free.",

      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      month: "/ month",

      installation: "Installation & delivery",
      freeInstallation: "Free",

      choosePlan: "Choose this plan",

      aboutTitle: "What is ANTIMATE?",
      aboutText:
        "ANTIMATE stands for Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem. It is an ecosystem connecting hardware, networks, cloud, data and AI to make technology easier to use across different environments.",

      purposeTitle: "Our purpose",
      purposeText:
        "To build reliable, simple and useful technology that connects devices, data and people.",

      visionShortTitle: "Our vision",
      visionShortText:
        "To become an expandable technology ecosystem connecting communication, intelligence and automation.",

      valuesTitle: "What we value",
      value1: "Reliability",
      value2: "Innovation",
      value3: "Simplicity",
      value4: "Data security",

      supportTitle: "Need support?",
      supportSubtitle:
        "ANTIMATE provides several ways to get help and information.",

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
        "Explore ANTIMATE documentation, guides and information.",

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
      teamNoella: "NOELLA",

      faqTitle: "Frequently asked questions",

      faq1Q: "What does ANTIMATE do?",
      faq1A:
        "ANTIMATE connects devices, communication, cloud, data and AI to help people and businesses use technology more effectively.",

      faq2Q: "What is a BR System?",
      faq2A:
        "A BR System is an ANTIMATE system designed for poultry operations according to the required flock capacity.",

      faq3Q: "Which BR Systems are available?",
      faq3A:
        "The available systems are BR System 300, BR System 750 and BR System 1000.",

      faq4Q: "Is installation and delivery charged?",
      faq4A:
        "No. Installation and delivery are free.",

      faq5Q: "What happens after I log in?",
      faq5A:
        "After login, ANTIMATE asks you which BR System you want to use.",

      joinTitle: "Ready to get started?",
      joinText:
        "Sign in to ANTIMATE and choose the BR System that matches your operation.",

      loginTitle: "Welcome back",
      loginSubtitle:
        "Sign in to your ANTIMATE account",

      identifier: "Email, Username or Phone",
      identifierPlaceholder:
        "Enter email, username or phone",

      password: "Password",
      passwordPlaceholder:
        "Enter your password",

      signIn: "Sign in",
      forgot: "Forgot password?",

      noAccount: "Don't have an account?",
      create: "Create account",

      selectionTitle: "Choose a BR System",
      selectionSubtitle:
        "Which system would you like to use after signing in?",

      system300Button: "Go to BR System 300",
      system750Button: "Go to BR System 750",
      system1000Button: "Go to BR System 1000",

      cancel: "Back",

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

      setShowLogin(false);
      setShowSystemSelection(true);
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
     SYSTEM SELECTION
  ========================================================== */

  const selectBRSystem = (system) => {
    localStorage.setItem(
      "selectedBRSystem",
      system
    );

    setShowSystemSelection(false);

    /*
     * Existing application route is preserved.
     * The selected BR System is available through:
     *
     * localStorage.getItem("selectedBRSystem")
     */
    navigate("/home");
  };

  /* ==========================================================
     KNOWLEDGE
  ========================================================== */

  const openKnowledgeCenter = () => {
    setMobileMenu(false);
    navigate("/brooding-guide");
  };

  /* ==========================================================
     SUPPORT
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
    window.location.href =
      "tel:+250798698431";
  };

  const openEmail = () => {
    window.location.href =
      "mailto:antimate.inc@gmai.com";
  };

  /* ==========================================================
     SYSTEMS
  ========================================================== */

  const systems = [
    {
      icon: Cpu,
      name: t.system300,
      text: t.system300Text,
      capacity: "300",
    },
    {
      icon: Activity,
      name: t.system750,
      text: t.system750Text,
      capacity: "750",
    },
    {
      icon: BarChart3,
      name: t.system1000,
      text: t.system1000Text,
      capacity: "1,000",
    },
  ];

  /* ==========================================================
     PRICING
  ========================================================== */

  const pricingSystems = [
    {
      name: t.system300,
      capacity: "300",
      plans: [
        {
          name: t.basic,
          price: "3,000 FRW",
          description:
            language === "rw"
              ? "Plan y'ibanze ya BR System 300."
              : "Entry plan for BR System 300.",
        },
        {
          name: t.pro,
          price: "5,000 FRW",
          description:
            language === "rw"
              ? "Plan yagenewe gukoresha ubushobozi bwagutse."
              : "Plan for expanded system usage.",
        },
        {
          name: t.premium,
          price: "7,000 FRW",
          description:
            language === "rw"
              ? "Plan ifite services n'ubufasha bwagutse."
              : "Plan with expanded services and support.",
        },
      ],
    },
    {
      name: t.system750,
      capacity: "750",
      plans: [
        {
          name: t.basic,
          price: "5,000 FRW",
          description:
            language === "rw"
              ? "Plan y'ibanze ya BR System 750."
              : "Entry plan for BR System 750.",
        },
        {
          name: t.pro,
          price: "8,000 FRW",
          description:
            language === "rw"
              ? "Plan yagenewe ibikorwa bikenera ubushobozi bwagutse."
              : "Plan for operations needing expanded capacity.",
        },
        {
          name: t.premium,
          price: "11,000 FRW",
          description:
            language === "rw"
              ? "Plan ifite services n'ubufasha bwagutse."
              : "Plan with expanded services and support.",
        },
      ],
    },
    {
      name: t.system1000,
      capacity: "1,000",
      plans: [
        {
          name: t.basic,
          price: "8,000 FRW",
          description:
            language === "rw"
              ? "Plan y'ibanze ya BR System 1000."
              : "Entry plan for BR System 1000.",
        },
        {
          name: t.pro,
          price: "12,000 FRW",
          description:
            language === "rw"
              ? "Plan yagenewe ibikorwa binini."
              : "Plan for larger operations.",
        },
        {
          name: t.premium,
          price: "15,000 FRW",
          description:
            language === "rw"
              ? "Plan yuzuye ifite services n'ubufasha bwagutse."
              : "Full plan with expanded services and support.",
        },
      ],
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
      department: "Executive Leadership",
    },
    {
      icon: Brain,
      name: t.teamAI,
      role: t.aiOfficer,
      department: "AI Division",
    },
    {
      icon: Database,
      name: t.teamData,
      role: t.dataOfficer,
      department: "Data & Cloud",
    },
    {
      icon: Wifi,
      name: t.teamNetwork,
      role: t.cio,
      department: "Network & Communication",
    },
    {
      icon: Cpu,
      name: t.teamSystem,
      role: t.cto,
      department: "System Development",
    },
    {
      icon: TrendingUp,
      name: t.teamMarketing,
      role: t.cmo,
      department: "Marketing & Brand",
    },
    {
      icon: Target,
      name: t.teamBusiness,
      role: t.cbo,
      department: "Business Development",
    },
    {
      icon: Users,
      name: t.teamNoella,
      role:
        language === "rw"
          ? "ANTIMATE Team"
          : "ANTIMATE Team",
      department:
        language === "rw"
          ? "ANTIMATE Team"
          : "ANTIMATE Team",
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
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
        }

        button,
        input {
          font: inherit;
        }

        .login-page {
          --text: #111827;
          --muted: #64748b;
          --soft-text: #475569;
          --border: #e2e8f0;
          --surface: #f8fafc;
          --surface-strong: #ffffff;
          --accent: #2563eb;
          --accent-light: #00a8d6;

          min-height: 100vh;
          position: relative;
          overflow-x: hidden;

          color: var(--text);
          background: #ffffff;
        }

        .login-page.dark {
          --text: #f8fafc;
          --muted: #94a3b8;
          --soft-text: #cbd5e1;
          --border: #263449;
          --surface: #101b2d;
          --surface-strong: #0b1424;
          --accent: #60a5fa;
          --accent-light: #22d3ee;

          color: var(--text);
          background: #07111f;
        }

        /* ======================================================
           NAVBAR
        ====================================================== */

        .login-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 99990;

          height: 76px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 5.5%;

          border-bottom:
            1px solid var(--border);

          background:
            rgba(255,255,255,.96);

          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .dark .login-navbar {
          background:
            rgba(7,17,31,.96);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .brand-logo {
          width: 42px;
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand strong {
          display: block;
          font-size: 17px;
          letter-spacing: .5px;
        }

        .brand span {
          display: block;
          margin-top: 1px;
          font-size: 8px;
          letter-spacing: 1.7px;
          font-weight: 800;
          opacity: .55;
        }

        .navigation {
          display: flex;
          align-items: center;
          gap: 17px;
        }

        .navigation > a {
          color: inherit;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          opacity: .75;
          transition: opacity .2s ease;
        }

        .navigation > a:hover {
          opacity: 1;
        }

        .navbar-tools {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 15px;
        }

        .language-button,
        .theme-button,
        .mobile-menu-button {
          width: 36px;
          height: 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid var(--border);

          border-radius: 10px;

          background:
            var(--surface);

          color: inherit;
          cursor: pointer;
        }

        .language-button {
          font-size: 10px;
          font-weight: 900;
        }

        .mobile-menu-button {
          display: none;
        }

        .nav-login,
        .nav-signup {
          min-height: 38px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          padding: 0 14px;

          border-radius: 10px;

          cursor: pointer;

          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .nav-login {
          color: var(--accent);
          background: transparent;
          border:
            1px solid
            rgba(37,99,235,.28);
        }

        .nav-signup {
          color: #fff;
          background: #2563eb;
          border: 0;
        }

        /* ======================================================
           MAIN
        ====================================================== */

        main {
          position: relative;
          z-index: 1;
          padding-top: 76px;
        }

        /* ======================================================
           HERO
        ====================================================== */

        .hero-section {
          min-height: 720px;
          max-width: 1400px;
          margin: 0 auto;

          padding: 100px 7% 90px;

          display: grid;
          grid-template-columns: 1.05fr .95fr;

          gap: 65px;
          align-items: center;
        }

        .hero-content {
          max-width: 680px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 15px;
          padding: 7px 11px;

          color: var(--accent-light);

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius: 8px;

          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .antimate-company-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          margin-bottom: 25px;
          padding: 6px 10px;

          background: transparent;

          border:
            1px solid var(--border);

          border-radius: 8px;

          font-size: 10px;
          font-weight: 800;
          opacity: .75;
        }

        .antimate-company-badge svg {
          color: var(--accent-light);
        }

        .hero-content h1 {
          margin: 0;

          font-size:
            clamp(42px, 6vw, 76px);

          line-height: 1.03;
          letter-spacing: -4px;
          color: var(--text);
        }

        .hero-content h1 span {
          color: var(--accent);
        }

        .animated-words {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 23px;
        }

        .animated-words span {
          padding: 7px 10px;

          border:
            1px solid var(--border);

          border-radius: 8px;

          background: var(--surface);

          color: var(--soft-text);

          font-size: 10px;
          font-weight: 750;
        }

        .hero-description {
          max-width: 650px;
          margin: 24px 0 0;

          color: var(--soft-text);

          font-size: 17px;
          line-height: 1.8;
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
          margin-top: 30px;
        }

        .primary-button,
        .secondary-button {
          min-height: 48px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          padding: 0 19px;

          border-radius: 11px;

          font-size: 13px;
          font-weight: 850;
          text-decoration: none;
          cursor: pointer;
        }

        .primary-button {
          border: 0;
          color: #fff;
          background: #2563eb;
        }

        .secondary-button {
          color: var(--text);

          border:
            1px solid var(--border);

          background: var(--surface);
        }

        .hero-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 28px;
        }

        .hero-trust div {
          display: flex;
          align-items: center;
          gap: 7px;

          color: var(--soft-text);

          font-size: 11px;
          font-weight: 700;
        }

        .hero-trust svg {
          color: var(--accent-light);
        }

        .hero-visual {
          position: relative;
          min-height: 500px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .farm-image {
          position: relative;

          width: min(100%, 470px);
          height: 420px;

          overflow: hidden;

          border-radius: 18px;

          border:
            1px solid var(--border);

          box-shadow:
            0 24px 55px
            rgba(0,0,0,.12);

          transform: rotate(1deg);
        }

        .farm-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .floating-card {
          position: absolute;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 12px 14px;

          border:
            1px solid var(--border);

          border-radius: 11px;

          background:
            var(--surface-strong);

          box-shadow:
            0 14px 32px
            rgba(0,0,0,.13);
        }

        .card-temperature {
          left: 0;
          top: 80px;
        }

        .card-ai {
          right: -5px;
          bottom: 70px;
        }

        .floating-icon,
        .ai-icon {
          width: 36px;
          height: 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          color: var(--accent-light);

          background: var(--surface);
        }

        .floating-card span {
          display: block;
          font-size: 9px;
          color: var(--muted);
        }

        .floating-card strong {
          display: block;
          margin-top: 3px;
          font-size: 12px;
        }

        /* ======================================================
           SHARED SECTIONS
        ====================================================== */

        .features-section,
        .antimate-public-section,
        .vision-section {
          max-width: 1250px;
          margin: 0 auto;
          padding: 100px 7%;
        }

        .section-heading {
          max-width: 700px;
          margin-bottom: 42px;
        }

        .section-heading span,
        .antimate-section-label,
        .small-heading {
          color: var(--accent-light);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .section-heading h2,
        .antimate-section-title,
        .vision-content h2 {
          color: var(--text);
        }

        .section-heading h2 {
          margin: 10px 0 0;

          font-size:
            clamp(30px, 4vw, 48px);

          line-height: 1.1;
          letter-spacing: -1.8px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        .feature-card {
          padding: 12px 8px 25px;

          border-bottom:
            1px solid var(--border);
        }

        .feature-icon {
          width: 44px;
          height: 44px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 18px;

          border-radius: 10px;

          color: var(--accent-light);
          background: var(--surface);
        }

        .feature-card h3 {
          margin: 0 0 10px;
          font-size: 19px;
        }

        .feature-card p {
          margin: 0;

          color: var(--soft-text);

          font-size: 14px;
          line-height: 1.7;
        }

        .feature-line {
          width: 35px;
          height: 2px;
          margin-top: 20px;
          background: var(--accent);
        }

        .antimate-section-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
        }

        .antimate-section-title {
          max-width: 760px;
          margin: 0;

          font-size:
            clamp(30px, 4vw, 52px);

          line-height: 1.08;
          letter-spacing: -1.8px;
        }

        .antimate-section-subtitle {
          max-width: 720px;
          margin: 18px 0 0;

          color: var(--soft-text);

          font-size: 16px;
          line-height: 1.75;
        }

        /* ======================================================
           SYSTEMS
        ====================================================== */

        .antimate-system-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;

          margin-top: 48px;

          border-top:
            1px solid var(--border);
          border-bottom:
            1px solid var(--border);
        }

        .antimate-system-card {
          padding: 30px 28px;

          border-right:
            1px solid var(--border);

          background: transparent;

          transition:
            background .2s ease;
        }

        .antimate-system-card:last-child {
          border-right: 0;
        }

        .antimate-system-card:hover {
          background: var(--surface);
        }

        .antimate-system-icon {
          width: 46px;
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 20px;

          border-radius: 9px;

          color: var(--accent-light);
          background: var(--surface);
        }

        .antimate-system-card h3 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .antimate-system-card p {
          margin: 0;

          color: var(--soft-text);

          font-size: 14px;
          line-height: 1.7;
        }

        .system-capacity {
          display: flex;
          align-items: baseline;
          gap: 6px;

          margin-top: 20px;

          color: var(--accent);
          font-weight: 900;
        }

        .system-capacity strong {
          font-size: 24px;
        }

        .system-capacity span {
          color: var(--muted);
          font-size: 11px;
          font-weight: 700;
        }

        /* ======================================================
           ABOUT
        ====================================================== */

        .antimate-about-layout {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 65px;
          align-items: center;
        }

        .antimate-about-description {
          color: var(--soft-text);

          font-size: 18px;
          line-height: 1.85;

          margin-top: 25px;
        }

        .antimate-definition {
          margin-top: 27px;
          padding: 20px 0 20px 20px;

          border-left:
            3px solid var(--accent);

          background: var(--surface);
        }

        .antimate-definition strong {
          display: block;
          margin-bottom: 8px;

          font-size: 14px;
          color: var(--accent-light);
        }

        .antimate-definition span {
          color: var(--soft-text);

          font-size: 16px;
          line-height: 1.7;
        }

        .antimate-about-panel {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;

          border-top:
            1px solid var(--border);
          border-left:
            1px solid var(--border);
        }

        .antimate-about-mini {
          min-height: 150px;
          padding: 23px;

          border-right:
            1px solid var(--border);
          border-bottom:
            1px solid var(--border);

          background: transparent;
        }

        .antimate-about-mini svg {
          color: var(--accent-light);
          margin-bottom: 15px;
        }

        .antimate-about-mini h4 {
          margin: 0 0 7px;
          font-size: 16px;
        }

        .antimate-about-mini p {
          margin: 0;

          color: var(--soft-text);

          font-size: 13px;
          line-height: 1.6;
        }

        /* ======================================================
           VISION
        ====================================================== */

        .vision-section {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 65px;
          align-items: center;
        }

        .vision-image {
          height: 390px;
          overflow: hidden;

          border-radius: 18px;

          border:
            1px solid var(--border);

          box-shadow:
            0 22px 50px
            rgba(0,0,0,.12);
        }

        .vision-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .small-heading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vision-content h2 {
          margin: 14px 0 18px;

          font-size:
            clamp(30px, 4vw, 48px);

          line-height: 1.08;
          letter-spacing: -1.7px;
        }

        .vision-content > p {
          margin: 0;

          color: var(--soft-text);

          font-size: 16px;
          line-height: 1.8;
        }

        .vision-points {
          display: grid;
          gap: 13px;
          margin-top: 25px;
        }

        .vision-points div {
          display: flex;
          align-items: center;
          gap: 9px;

          color: var(--soft-text);

          font-size: 13px;
          font-weight: 750;
        }

        .vision-points svg {
          color: var(--accent-light);
        }

        /* ======================================================
           PRICING
        ====================================================== */

        .pricing-block {
          margin-top: 48px;

          border-top:
            1px solid var(--border);
        }

        .pricing-system {
          padding: 34px 0;

          border-bottom:
            1px solid var(--border);
        }

        .pricing-system-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;

          margin-bottom: 25px;
        }

        .pricing-system-header h3 {
          margin: 0;
          font-size: 23px;
        }

        .pricing-capacity {
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .pricing-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;

          border:
            1px solid var(--border);
        }

        .pricing-option {
          min-height: 225px;
          padding: 25px;

          border-right:
            1px solid var(--border);
        }

        .pricing-option:last-child {
          border-right: 0;
        }

        .pricing-option.featured {
          background: var(--surface);
        }

        .pricing-option h4 {
          margin: 0;

          color: var(--text);

          font-size: 15px;
        }

        .pricing-price {
          margin-top: 13px;

          color: var(--text);

          font-size: 27px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .pricing-month {
          display: block;
          margin-top: 2px;

          color: var(--muted);

          font-size: 11px;
        }

        .pricing-description {
          min-height: 48px;
          margin: 16px 0;

          color: var(--soft-text);

          font-size: 12px;
          line-height: 1.6;
        }

        .pricing-features {
          display: grid;
          gap: 8px;

          list-style: none;
          padding: 0;
          margin: 0;
        }

        .pricing-features li {
          display: flex;
          align-items: center;
          gap: 7px;

          color: var(--soft-text);

          font-size: 11px;
        }

        .pricing-features svg {
          color: var(--accent-light);
          flex-shrink: 0;
        }

        .pricing-button {
          width: 100%;
          min-height: 40px;

          margin-top: 17px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          border: 0;
          border-radius: 8px;

          color: #fff;
          background: #2563eb;

          cursor: pointer;

          font-size: 11px;
          font-weight: 850;
        }

        .installation-banner {
          margin-top: 18px;
          padding: 15px 17px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;

          border:
            1px solid var(--border);

          background: var(--surface);
        }

        .installation-banner span {
          color: var(--soft-text);
          font-size: 12px;
          font-weight: 700;
        }

        .installation-banner strong {
          color: #16a34a;
          font-size: 12px;
        }

        /* ======================================================
           SUPPORT
        ====================================================== */

        .antimate-support-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;

          margin-top: 42px;

          border-top:
            1px solid var(--border);
          border-left:
            1px solid var(--border);
        }

        .antimate-support-card {
          padding: 25px;

          border-right:
            1px solid var(--border);
          border-bottom:
            1px solid var(--border);
        }

        .antimate-support-icon {
          width: 43px;
          height: 43px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          color: var(--accent-light);
          background: var(--surface);

          margin-bottom: 17px;
        }

        .antimate-support-card h3 {
          margin: 0 0 9px;
          font-size: 17px;
        }

        .antimate-support-card p {
          min-height: 55px;
          margin: 0 0 17px;

          color: var(--soft-text);

          font-size: 13px;
          line-height: 1.65;
        }

        .antimate-support-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          border: 0;
          background: transparent;

          color: var(--accent);

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
          grid-template-columns: repeat(3, 1fr);
          gap: 0;

          margin-top: 25px;

          border-top:
            1px solid var(--border);
          border-left:
            1px solid var(--border);
        }

        .antimate-contact-item {
          display: flex;
          align-items: center;
          gap: 14px;

          padding: 19px;

          border-right:
            1px solid var(--border);
          border-bottom:
            1px solid var(--border);
        }

        .antimate-contact-item svg {
          flex-shrink: 0;
          color: var(--accent-light);
        }

        .antimate-contact-item strong {
          display: block;
          font-size: 13px;
          margin-bottom: 3px;
        }

        .antimate-contact-item span {
          color: var(--muted);
          font-size: 12px;
        }

        /* ======================================================
           TEAM
        ====================================================== */

        .antimate-team-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;

          margin-top: 42px;

          border-top:
            1px solid var(--border);
          border-left:
            1px solid var(--border);
        }

        .antimate-team-card {
          padding: 23px 19px;

          border-right:
            1px solid var(--border);
          border-bottom:
            1px solid var(--border);
        }

        .antimate-team-avatar {
          width: 42px;
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          color: var(--accent-light);
          background: var(--surface);

          margin-bottom: 15px;
        }

        .antimate-team-card h3 {
          margin: 0 0 5px;
          font-size: 15px;
        }

        .antimate-team-role {
          display: block;

          color: var(--accent);

          font-size: 11px;
          font-weight: 800;
          line-height: 1.4;
        }

        .antimate-team-department {
          display: block;
          margin-top: 8px;

          color: var(--muted);

          font-size: 10px;
          line-height: 1.5;
        }

        /* ======================================================
           FAQ
        ====================================================== */

        .antimate-faq-list {
          max-width: 900px;
          margin: 42px auto 0;

          display: grid;
          gap: 0;

          border-top:
            1px solid var(--border);
        }

        .antimate-faq-item {
          border-bottom:
            1px solid var(--border);
        }

        .antimate-faq-question {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          padding: 19px 4px;

          border: 0;
          background: transparent;

          color: var(--text);

          text-align: left;
          cursor: pointer;

          font-size: 14px;
          font-weight: 800;
        }

        .antimate-faq-question svg {
          flex-shrink: 0;
          transition: transform .25s ease;
          color: var(--muted);
        }

        .antimate-faq-item.open
        .antimate-faq-question svg {
          transform: rotate(180deg);
        }

        .antimate-faq-answer {
          max-height: 0;
          overflow: hidden;

          transition:
            max-height .3s ease;
        }

        .antimate-faq-item.open
        .antimate-faq-answer {
          max-height: 250px;
        }

        .antimate-faq-answer p {
          margin: 0;
          padding: 0 4px 20px;

          color: var(--soft-text);

          font-size: 13px;
          line-height: 1.75;
        }

        /* ======================================================
           JOIN
        ====================================================== */

        .join-section {
          padding: 100px 7%;

          text-align: center;

          border-top:
            1px solid var(--border);
          border-bottom:
            1px solid var(--border);

          background: var(--surface);
        }

        .join-content {
          max-width: 720px;
          margin: 0 auto;
        }

        .join-content > svg {
          color: var(--accent-light);
        }

        .join-content h2 {
          margin: 15px 0 10px;

          color: var(--text);

          font-size:
            clamp(32px, 4vw, 52px);

          letter-spacing: -2px;
        }

        .join-content p {
          margin: 0 auto 25px;
          max-width: 600px;

          color: var(--soft-text);

          line-height: 1.75;
        }

        /* ======================================================
           AI FLOAT
        ====================================================== */

        .antimate-ai-float-login {
          position: fixed;

          right: 20px;
          bottom: 22px;

          width: 60px;
          height: 60px;

          z-index: 99989;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          text-decoration: none;

          background: #0b1220;

          border:
            2px solid #2563eb;

          box-shadow:
            0 10px 28px
            rgba(0,0,0,.22);
        }

        .antimate-ai-ring-login {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;
        }

        .antimate-ai-inner-login {
          position: absolute;
          inset: 4px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #0f172a;
        }

        .antimate-ai-text-login {
          color: #fff;

          font-size: 17px;
          font-weight: 900;
          letter-spacing: -.5px;
        }

        /* ======================================================
           FOOTER
        ====================================================== */

        .login-footer {
          position: relative;
          z-index: 2;

          padding: 45px 7% 80px;

          text-align: center;

          border-top:
            1px solid var(--border);

          background: var(--surface);
        }

        .footer-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .footer-brand strong {
          font-size: 16px;
          letter-spacing: .5px;
        }

        .login-footer p {
          max-width: 850px;
          margin: 15px auto 0;

          color: var(--muted);

          font-size: 10px;
          line-height: 1.6;
        }

        .footer-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;

          margin-top: 12px;

          color: var(--muted);

          font-size: 11px;
        }

        /* ======================================================
           MODAL
        ====================================================== */

        .modal-overlay,
        .system-selection-overlay {
          position: fixed;
          inset: 0;

          z-index: 100000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(3,8,18,.72);

          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
        }

        .login-modal {
          position: relative;

          width: min(100%, 430px);

          padding: 35px;

          border-radius: 18px;

          background: #fff;
          color: #111827;

          border:
            1px solid #e2e8f0;

          box-shadow:
            0 30px 90px
            rgba(0,0,0,.28);
        }

        .close-modal {
          position: absolute;

          top: 15px;
          right: 15px;

          width: 34px;
          height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 0;
          border-radius: 8px;

          background: #f1f5f9;

          color: #111827;
          cursor: pointer;
        }

        .modal-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .login-modal h2 {
          margin: 0;

          text-align: center;

          font-size: 27px;
          letter-spacing: -.8px;
        }

        .modal-subtitle {
          margin: 8px 0 25px;

          text-align: center;

          color: #64748b;

          font-size: 13px;
        }

        .input-group {
          margin-bottom: 17px;
        }

        .input-group label {
          display: block;
          margin-bottom: 7px;

          font-size: 11px;
          font-weight: 800;
        }

        .input-group input {
          width: 100%;
          height: 47px;

          padding: 0 13px;

          border:
            1px solid #cbd5e1;

          border-radius: 9px;

          outline: none;

          color: #111827;
          background: #fff;
        }

        .input-group input:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px
            rgba(37,99,235,.09);
        }

        .password-input {
          position: relative;
        }

        .password-input input {
          padding-right: 48px;
        }

        .password-input button {
          position: absolute;

          right: 6px;
          top: 6px;

          width: 35px;
          height: 35px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 0;
          border-radius: 8px;

          background: transparent;

          color: #64748b;
          cursor: pointer;
        }

        .login-error {
          margin-bottom: 14px;
          padding: 11px 12px;

          border-radius: 8px;

          color: #b91c1c;
          background: #fef2f2;

          border:
            1px solid #fecaca;

          font-size: 12px;
          line-height: 1.5;
        }

        .modal-login-button {
          width: 100%;
          min-height: 47px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          border: 0;
          border-radius: 9px;

          color: #fff;

          background: #2563eb;

          font-size: 13px;
          font-weight: 850;

          cursor: pointer;
        }

        .modal-login-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .loader {
          width: 18px;
          height: 18px;

          border:
            2px solid
            rgba(255,255,255,.35);

          border-top-color: #fff;

          border-radius: 50%;

          animation:
            spin .7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .modal-bottom {
          margin-top: 20px;

          display: flex;
          flex-direction: column;
          gap: 12px;

          text-align: center;

          color: #64748b;

          font-size: 12px;
        }

        .modal-bottom a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 750;
        }

        /* ======================================================
           SYSTEM SELECTION
        ====================================================== */

        .system-selection {
          width: min(100%, 850px);

          padding: 34px;

          border-radius: 18px;

          color: var(--text);
          background: var(--surface-strong);

          border:
            1px solid var(--border);

          box-shadow:
            0 35px 100px
            rgba(0,0,0,.32);
        }

        .system-selection-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .system-selection-logo {
          width: 54px;
          height: 54px;

          margin: 0 auto 15px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 12px;

          background: var(--surface);
        }

        .system-selection-header h2 {
          margin: 0;

          font-size: 28px;
          letter-spacing: -1px;
        }

        .system-selection-header p {
          margin: 9px auto 0;

          max-width: 520px;

          color: var(--muted);

          font-size: 13px;
          line-height: 1.65;
        }

        .system-selection-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;

          border-top:
            1px solid var(--border);
          border-left:
            1px solid var(--border);
        }

        .system-selection-card {
          position: relative;

          padding: 25px;

          border: 0;
          border-right:
            1px solid var(--border);
          border-bottom:
            1px solid var(--border);

          background: transparent;

          color: var(--text);

          text-align: left;

          cursor: pointer;

          transition:
            background .2s ease;
        }

        .system-selection-card:hover {
          background: var(--surface);
        }

        .system-selection-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 18px;

          border-radius: 9px;

          color: var(--accent-light);
          background: var(--surface);
        }

        .system-selection-card h3 {
          margin: 0 0 9px;

          font-size: 18px;
        }

        .system-selection-card p {
          min-height: 68px;

          margin: 0 0 20px;

          color: var(--muted);

          font-size: 12px;
          line-height: 1.65;
        }

        .system-selection-action {
          display: flex;
          align-items: center;
          justify-content: space-between;

          color: var(--accent);

          font-size: 11px;
          font-weight: 850;
        }

        .system-selection-cancel {
          display: flex;
          align-items: center;
          justify-content: center;

          margin: 22px auto 0;

          border: 0;
          background: transparent;

          color: var(--muted);

          font-size: 12px;
          font-weight: 750;

          cursor: pointer;
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 1100px) {
          .navigation {
            gap: 11px;
          }

          .navigation > a {
            font-size: 11px;
          }

          .antimate-team-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
          .navigation {
            position: fixed;

            top: 76px;
            left: 12px;
            right: 12px;

            display: none;

            flex-direction: column;
            align-items: stretch;

            padding: 15px;

            border-radius: 12px;

            background:
              var(--surface-strong);

            border:
              1px solid var(--border);

            box-shadow:
              0 20px 50px
              rgba(0,0,0,.13);
          }

          .navigation.mobile-open {
            display: flex;
          }

          .navigation > a {
            padding: 10px 8px;
            font-size: 13px;
          }

          .nav-login,
          .nav-signup {
            width: 100%;
          }

          .navbar-tools {
            margin-left: auto;
          }

          .mobile-menu-button {
            display: flex;
          }

          .hero-section {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .hero-content {
            max-width: none;
          }

          .hero-visual {
            min-height: 430px;
          }

          .antimate-about-layout,
          .vision-section {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .antimate-system-grid {
            grid-template-columns: 1fr;
          }

          .antimate-system-card {
            border-right: 0;
            border-bottom:
              1px solid var(--border);
          }

          .antimate-system-card:last-child {
            border-bottom: 0;
          }

          .antimate-support-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .antimate-contact-strip {
            grid-template-columns: 1fr;
          }

          .antimate-team-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .pricing-options {
            grid-template-columns: 1fr;
          }

          .pricing-option {
            border-right: 0;
            border-bottom:
              1px solid var(--border);
          }

          .pricing-option:last-child {
            border-bottom: 0;
          }

          .system-selection-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .login-navbar {
            height: 68px;
            padding: 0 16px;
          }

          main {
            padding-top: 68px;
          }

          .navigation {
            top: 68px;
          }

          .brand strong {
            font-size: 15px;
          }

          .brand span {
            font-size: 7px;
          }

          .theme-button {
            display: none;
          }

          .hero-section {
            min-height: auto;
            padding: 65px 5% 65px;
          }

          .hero-content h1 {
            font-size: 43px;
            letter-spacing: -2.5px;
          }

          .hero-description {
            font-size: 15px;
          }

          .hero-visual {
            min-height: 350px;
          }

          .farm-image {
            width: 100%;
            height: 330px;
            border-radius: 15px;
          }

          .card-temperature {
            left: -4px;
            top: 40px;
          }

          .card-ai {
            right: -4px;
            bottom: 35px;
          }

          .features-section,
          .antimate-public-section,
          .vision-section {
            padding:
              68px 5%;
          }

          .feature-grid,
          .antimate-support-grid,
          .antimate-team-grid {
            grid-template-columns: 1fr;
          }

          .antimate-about-panel {
            grid-template-columns: 1fr;
          }

          .vision-image {
            height: 300px;
          }

          .pricing-system-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .installation-banner {
            align-items: flex-start;
            flex-direction: column;
          }

          .antimate-ai-float-login {
            right: 16px;
            bottom: 18px;

            width: 56px;
            height: 56px;
          }

          .login-modal {
            padding: 28px 21px;
          }

          .system-selection {
            padding: 25px 18px;
            border-radius: 15px;
          }

          .system-selection-card p {
            min-height: auto;
          }

          .system-selection-header h2 {
            font-size: 24px;
          }

          .join-section {
            padding:
              75px 5%;
          }

          .login-footer {
            padding-bottom: 90px;
          }

          .footer-info {
            flex-direction: column;
            gap: 7px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div
        className={`login-page ${
          darkMode ? "dark" : "light"
        }`}
      >
        {/* ======================================================
            FIXED NAVBAR
        ====================================================== */}

        <header className="login-navbar">
          <div className="brand">
            <div className="brand-logo">
              <AntimateLogo size={39} />
            </div>

            <div>
              <strong>ANTIMATE</strong>
              <span>INTELLIGENT ECOSYSTEM</span>
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
              onClick={() => setMobileMenu(false)}
            >
              {t.navHome}
            </a>

            <a
              href="#features"
              onClick={() => setMobileMenu(false)}
            >
              {t.navHow}
            </a>

            <a
              href="#systems"
              onClick={() => setMobileMenu(false)}
            >
              {t.navSystems}
            </a>

            <a
              href="#plans"
              onClick={() => setMobileMenu(false)}
            >
              {t.navPlans}
            </a>

            <a
              href="#about"
              onClick={() => setMobileMenu(false)}
            >
              {t.navAbout}
            </a>

            <a
              href="#support"
              onClick={() => setMobileMenu(false)}
            >
              {t.navSupport}
            </a>

            <button
              type="button"
              className="nav-login"
              onClick={openKnowledgeCenter}
            >
              <BookOpen size={14} />
              {t.knowledge}
            </button>

            <button
              onClick={() => {
                setShowLogin(true);
                setMobileMenu(false);
                setMessage("");
              }}
              className="nav-login"
            >
              {t.login}
            </button>

            <Link
              to="/signup"
              className="nav-signup"
              onClick={() => setMobileMenu(false)}
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
                setDarkMode(!darkMode)
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
                setMobileMenu(!mobileMenu)
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
                <span>{t.title2}</span>
              </h1>

              <div className="animated-words">
                <span>Connect.</span>
                <span>Understand.</span>
                <span>Automate.</span>
                <span>Build the future.</span>
              </div>

              <p className="hero-description">
                {t.description}
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-button"
                  onClick={() => {
                    setShowLogin(true);
                    setMessage("");
                  }}
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
                  <Layers size={17} />
                  <span>{t.smart}</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="farm-image">
                <img
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=85"
                  alt="ANTIMATE technology"
                />
              </div>

              <div className="floating-card card-temperature">
                <div className="floating-icon">
                  <Network size={17} />
                </div>

                <div>
                  <span>BR System</span>
                  <strong>Connected</strong>
                </div>
              </div>

              <div className="floating-card card-ai">
                <div className="ai-icon">
                  <Brain size={18} />
                </div>

                <div>
                  <span>ANTIMATE AI</span>
                  <strong>Intelligence</strong>
                </div>
              </div>
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
              <span>ANTIMATE PLATFORM</span>

              <h2>
                {t.featuresTitle}
              </h2>
            </div>

            <div className="feature-grid">
              <Feature
                icon={<Network />}
                title={t.feature1Title}
                text={t.feature1Text}
              />

              <Feature
                icon={<Database />}
                title={t.feature2Title}
                text={t.feature2Text}
              />

              <Feature
                icon={<Brain />}
                title={t.feature3Title}
                text={t.feature3Text}
              />
            </div>
          </section>

          {/* ====================================================
              SYSTEMS
          ==================================================== */}

          <section
            id="systems"
            className="antimate-public-section"
          >
            <div className="antimate-section-label">
              <Layers size={16} />
              ANTIMATE SYSTEMS
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
                  const Icon = system.icon;

                  return (
                    <div
                      className="antimate-system-card"
                      key={index}
                    >
                      <div className="antimate-system-icon">
                        <Icon size={22} />
                      </div>

                      <h3>
                        {system.name}
                      </h3>

                      <p>
                        {system.text}
                      </p>

                      <div className="system-capacity">
                        <strong>
                          {system.capacity}
                        </strong>

                        <span>
                          {t.chicks}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          {/* ====================================================
              ABOUT
          ==================================================== */}

          <section
            id="about"
            className="antimate-public-section"
          >
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
                    {t.valuesTitle}
                  </h4>

                  <p>
                    {t.value1} • {t.value2}
                  </p>
                </div>

                <div className="antimate-about-mini">
                  <ShieldCheck size={21} />

                  <h4>
                    {t.value4}
                  </h4>

                  <p>
                    {t.value3}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================
              VISION
          ==================================================== */}

          <section className="vision-section">
            <div className="vision-image">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85"
                alt="ANTIMATE technology ecosystem"
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
                  <Radio size={18} />
                  <span>
                    Connected infrastructure
                  </span>
                </div>

                <div>
                  <ShieldCheck size={18} />
                  <span>
                    Secure technology
                  </span>
                </div>

                <div>
                  <Database size={18} />
                  <span>
                    Reliable data services
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================
              PRICING
          ==================================================== */}

          <section
            id="plans"
            className="antimate-public-section"
          >
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

            <div className="pricing-block">
              {pricingSystems.map(
                (system, systemIndex) => (
                  <div
                    className="pricing-system"
                    key={systemIndex}
                  >
                    <div className="pricing-system-header">
                      <h3>
                        {system.name}
                      </h3>

                      <span className="pricing-capacity">
                        {t.capacity}:{" "}
                        {system.capacity}{" "}
                        {t.chicks}
                      </span>
                    </div>

                    <div className="pricing-options">
                      {system.plans.map(
                        (plan, planIndex) => (
                          <div
                            key={planIndex}
                            className={`pricing-option ${
                              planIndex === 1
                                ? "featured"
                                : ""
                            }`}
                          >
                            <h4>
                              {plan.name}
                            </h4>

                            <div className="pricing-price">
                              {plan.price}
                            </div>

                            <span className="pricing-month">
                              {t.month}
                            </span>

                            <p className="pricing-description">
                              {plan.description}
                            </p>

                            <ul className="pricing-features">
                              <li>
                                <Check size={13} />
                                <span>
                                  {t.installation}
                                </span>
                              </li>

                              <li>
                                <Check size={13} />
                                <span>
                                  {t.freeInstallation}
                                </span>
                              </li>
                            </ul>

                            <button
                              className="pricing-button"
                              onClick={() =>
                                navigate(
                                  "/signup"
                                )
                              }
                            >
                              {t.choosePlan}

                              <ArrowRight
                                size={13}
                              />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="installation-banner">
              <span>
                {t.installation}
              </span>

              <strong>
                ✓ {t.freeInstallation}
              </strong>
            </div>
          </section>

          {/* ====================================================
              SUPPORT
          ==================================================== */}

          <section
            id="support"
            className="antimate-public-section"
          >
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
                  const Icon = item.icon;

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
                <MessageCircle size={20} />

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
                <CalendarDays size={20} />

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
          </section>

          {/* ====================================================
              TEAM
          ==================================================== */}

          <section className="antimate-public-section">
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
                  const Icon = member.icon;

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
          </section>

          {/* ====================================================
              FAQ
          ==================================================== */}

          <section className="antimate-public-section">
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
                  margin: "0 auto",
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
                          openFaq === index
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

              <button
                className="primary-button"
                onClick={() => {
                  setShowLogin(true);
                  setMessage("");
                }}
              >
                {t.login}

                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        </main>

        {/* ======================================================
            ANTIMATE AI FLOATING BUTTON
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

          <div className="footer-info">
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

              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label>
                    {t.identifier}
                  </label>

                  <input
                    type="text"
                    placeholder={
                      t.identifierPlaceholder
                    }
                    value={identifier}
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
                      value={password}
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
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
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
                    setShowLogin(false)
                  }
                >
                  {t.forgot}
                </Link>

                <span>
                  {t.noAccount}{" "}

                  <Link
                    to="/signup"
                    onClick={() =>
                      setShowLogin(false)
                    }
                  >
                    {t.create}
                  </Link>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            BR SYSTEM SELECTION
        ====================================================== */}

        {showSystemSelection && (
          <div className="system-selection-overlay">
            <div className="system-selection">
              <div className="system-selection-header">
                <div className="system-selection-logo">
                  <AntimateLogo size={42} />
                </div>

                <h2>
                  {t.selectionTitle}
                </h2>

                <p>
                  {t.selectionSubtitle}
                </p>
              </div>

              <div className="system-selection-grid">
                <button
                  type="button"
                  className="system-selection-card"
                  onClick={() =>
                    selectBRSystem(
                      "BR System 300"
                    )
                  }
                >
                  <div className="system-selection-icon">
                    <Cpu size={24} />
                  </div>

                  <h3>
                    BR System 300
                  </h3>

                  <p>
                    {t.system300Text}
                  </p>

                  <div className="system-selection-action">
                    <span>
                      {t.system300Button}
                    </span>

                    <ArrowRight size={17} />
                  </div>
                </button>

                <button
                  type="button"
                  className="system-selection-card"
                  onClick={() =>
                    selectBRSystem(
                      "BR System 750"
                    )
                  }
                >
                  <div className="system-selection-icon">
                    <Activity size={24} />
                  </div>

                  <h3>
                    BR System 750
                  </h3>

                  <p>
                    {t.system750Text}
                  </p>

                  <div className="system-selection-action">
                    <span>
                      {t.system750Button}
                    </span>

                    <ArrowRight size={17} />
                  </div>
                </button>

                <button
                  type="button"
                  className="system-selection-card"
                  onClick={() =>
                    selectBRSystem(
                      "BR System 1000"
                    )
                  }
                >
                  <div className="system-selection-icon">
                    <BarChart3 size={24} />
                  </div>

                  <h3>
                    BR System 1000
                  </h3>

                  <p>
                    {t.system1000Text}
                  </p>

                  <div className="system-selection-action">
                    <span>
                      {t.system1000Button}
                    </span>

                    <ArrowRight size={17} />
                  </div>
                </button>
              </div>

              <button
                type="button"
                className="system-selection-cancel"
                onClick={() =>
                  setShowSystemSelection(false)
                }
              >
                <X
                  size={14}
                  style={{
                    marginRight: 5,
                  }}
                />

                {t.cancel}
              </button>
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

      <h3>{title}</h3>

      <p>{text}</p>

      <div className="feature-line" />
    </div>
  );
}

export default Login;