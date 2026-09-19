import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Menu,
  ShieldCheck,
  Sparkles,
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
  Smartphone,
  Bot,
  ArrowUpRight,
  Layers,
  Thermometer,
  Fan,
  Bell,
  History,
  FileText,
  Brain,
  Wifi,
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
      navPlans: "Plans",
      navAbout: "ANTIMATE",
      navSupport: "Support",

      knowledge: "ANTIMATE Knowledge",

      login: "Injira",
      signup: "Tangira natwe",

      eyebrow: "INTELLIGENT TECHNOLOGY ECOSYSTEM",

      title1: "Ikoranabuhanga",
      title2: "rihuza abantu, data n'ubwenge.",

      description:
        "ANTIMATE ni ecosystem y'ikoranabuhanga ihuza abantu, data, automation na Artificial Intelligence kugira ngo ibikorwa bikorwe neza kandi hafatwe ibyemezo bishingiye ku makuru.",

      start: "Tangira natwe",
      learn: "Menya ANTIMATE",

      live: "Real-time monitoring",
      smart: "Intelligent assistance",

      featuresTitle:
        "Ikoranabuhanga ryubakiye ku buryo bwuzuye",

      feature1Title: "Monitor",
      feature1Text:
        "BR System ikusanya amakuru y'ingenzi kandi igafasha gukurikirana imikorere y'ibikorwa byawe mu buryo bworoshye.",

      feature2Title: "Understand",
      feature2Text:
        "Data ikusanywa ihinduka amakuru afasha umukoresha kumenya uko system imeze no gufata ibyemezo bifite ishingiro.",

      feature3Title: "Assist",
      feature3Text:
        "ANTIMATE AI itanga recommendations, assistance n'ubufasha bushingiye ku makuru aboneka muri system.",

      systemsTitle: "BR Systems",
      systemsSubtitle:
        "Hitamo system ijyanye n'ubushobozi bw'ibikorwa byawe.",

      system300: "BR System 300",
      system300Text:
        "Yagenewe ibikorwa bito kandi icunga kugeza kuri 300 chicks.",

      system750: "BR System 750",
      system750Text:
        "Yagenewe ibikorwa biciriritse kandi icunga kugeza kuri 750 chicks.",

      system1000: "BR System 1000",
      system1000Text:
        "Yagenewe ibikorwa binini kandi icunga kugeza kuri 1,000 chicks.",

      capacity: "Ubushobozi",

      plansTitle: "Plans & Pricing",
      plansSubtitle:
        "Buri BR System ifite Free, Basic, Pro na Premium. Installation na delivery ni ubuntu.",

      free: "Free",
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      monthly: "/ ukwezi",

      freeDescription:
        "Ku muntu ushaka gukoresha system mu buryo bwigenga.",

      basicDescription:
        "Ku muntu ushaka kongera monitoring n'amakuru aboneka kuri telefone.",

      proDescription:
        "Ku muntu ushaka monitoring yagutse, AI, SMS na reports.",

      premiumDescription:
        "Ku muntu ushaka full intelligence, history na reports zihariye.",

      installation: "Installation",
      delivery: "Delivery",
      freeService: "Ubuntu",

      choosePlan: "Hitamo iyi plan",

      aboutTitle: "ANTIMATE ni iki?",
      aboutText:
        "ANTIMATE ni Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem. Ni ecosystem yubaka technology ihuza devices, communication, data, automation na Artificial Intelligence kugira ngo ibikorwa bishobore gukoresha amakuru neza.",

      purposeTitle: "Intego yacu",
      purposeText:
        "Kubaka technology yizewe, yoroshye kandi ifasha abantu gukoresha data n'automation mu bikorwa byabo.",

      visionShortTitle: "Icyerekezo",
      visionShortText:
        "Kubaka ecosystem y'ikoranabuhanga ishobora kwaguka mu nzego zitandukanye.",

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
        "Baza AI ibibazo byawe kandi ubone assistance igihe cyose.",

      supportPhone: "Telefone",
      supportPhoneText:
        "Hamagara ANTIMATE ku bibazo cyangwa ubufasha bwihuse.",

      supportWhatsapp: "WhatsApp",
      supportWhatsappText:
        "Twandikire kuri WhatsApp ubone ubufasha.",

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
      teamNoella: "NOELLA",
      teamMarketing: "KWIZERA J. Bosco",
      teamBusiness: "MUGISHA Steven",

      marketingDepartment: "Marketing",

      faqTitle: "Ibibazo bikunze kubazwa",

      faq1Q: "ANTIMATE ikora iki?",
      faq1A:
        "ANTIMATE yubaka technology ihuza devices, data, automation na Artificial Intelligence kugira ngo ibikorwa bikoreshe amakuru neza.",

      faq2Q: "BR System ni iki?",
      faq2A:
        "BR System ni solution ya ANTIMATE yagenewe monitoring no gucunga ibikorwa by'ubworozi bw'inkoko, cyane cyane mu gukurikirana ibidukikije n'imikorere ya system.",

      faq3Q: "Ni izihe BR Systems zihari?",
      faq3A:
        "Hari BR System 300, BR System 750 na BR System 1000, buri imwe ikagira Free, Basic, Pro na Premium.",

      faq4Q: "Installation na delivery birishyurwa?",
      faq4A:
        "Oya. Installation na delivery bitangwa ku buntu.",

      faq5Q: "Nshobora gutangira ntaguze plan ihenze?",
      faq5A:
        "Yego. Free plan itanga full standalone system features hamwe na Phone App ifite local AI.",

      joinTitle: "Witeguye gutangira?",
      joinText:
        "Hitamo BR System ijyanye n'ubushobozi bw'ibikorwa byawe hanyuma utangire gukoresha ANTIMATE.",

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
        "Ni iyihe BR System ushaka gukoresha?",

      system300Button: "BR System 300",
      system750Button: "BR System 750",
      system1000Button: "BR System 1000",

      selection300:
        "System yagenewe ibikorwa bigera kuri 300 chicks.",

      selection750:
        "System yagenewe ibikorwa bigera kuri 750 chicks.",

      selection1000:
        "System yagenewe ibikorwa bigera kuri 1,000 chicks.",

      cancel: "Subira",

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

      knowledge: "ANTIMATE Knowledge",

      login: "Login",
      signup: "Join us",

      eyebrow: "INTELLIGENT TECHNOLOGY ECOSYSTEM",

      title1: "Technology",
      title2: "that connects people, data and intelligence.",

      description:
        "ANTIMATE is an intelligent technology ecosystem connecting people, data, automation and Artificial Intelligence to help businesses operate efficiently and make informed decisions.",

      start: "Get started",
      learn: "Explore ANTIMATE",

      live: "Real-time monitoring",
      smart: "Intelligent assistance",

      featuresTitle:
        "A complete technology ecosystem",

      feature1Title: "Monitor",
      feature1Text:
        "BR System collects important information and helps users monitor their operations in a simple and reliable way.",

      feature2Title: "Understand",
      feature2Text:
        "Collected data becomes useful information that helps users understand system conditions and make informed decisions.",

      feature3Title: "Assist",
      feature3Text:
        "ANTIMATE AI provides recommendations, assistance and guidance based on available system information.",

      systemsTitle: "BR Systems",
      systemsSubtitle:
        "Choose the system that matches the capacity of your operation.",

      system300: "BR System 300",
      system300Text:
        "Designed for smaller operations and supports up to 300 chicks.",

      system750: "BR System 750",
      system750Text:
        "Designed for medium operations and supports up to 750 chicks.",

      system1000: "BR System 1000",
      system1000Text:
        "Designed for larger operations and supports up to 1,000 chicks.",

      capacity: "Capacity",

      plansTitle: "Plans & Pricing",
      plansSubtitle:
        "Every BR System has Free, Basic, Pro and Premium plans. Installation and delivery are free.",

      free: "Free",
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      monthly: "/ month",

      freeDescription:
        "For users who want a fully independent standalone system.",

      basicDescription:
        "For users who want additional monitoring and information through the phone app.",

      proDescription:
        "For users who need broader monitoring, AI, SMS and reports.",

      premiumDescription:
        "For users who need full intelligence, history and customized reports.",

      installation: "Installation",
      delivery: "Delivery",
      freeService: "Free",

      choosePlan: "Choose this plan",

      aboutTitle: "What is ANTIMATE?",
      aboutText:
        "ANTIMATE stands for Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem. It is an ecosystem that connects devices, communication, data, automation and Artificial Intelligence to make technology useful across different operations.",

      purposeTitle: "Our purpose",
      purposeText:
        "To build reliable, simple and useful technology that helps people use data and automation in their operations.",

      visionShortTitle: "Our vision",
      visionShortText:
        "To build an expandable technology ecosystem that can serve different domains.",

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
        "Ask AI questions and receive assistance whenever you need it.",

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
      teamNoella: "NOELLA",
      teamMarketing: "KWIZERA J. Bosco",
      teamBusiness: "MUGISHA Steven",

      marketingDepartment: "Marketing",

      faqTitle: "Frequently asked questions",

      faq1Q: "What does ANTIMATE do?",
      faq1A:
        "ANTIMATE builds technology connecting devices, data, automation and Artificial Intelligence to help operations use information more effectively.",

      faq2Q: "What is BR System?",
      faq2A:
        "BR System is an ANTIMATE solution designed for poultry operations, especially for environmental monitoring and system management.",

      faq3Q: "Which BR Systems are available?",
      faq3A:
        "ANTIMATE provides BR System 300, BR System 750 and BR System 1000, each with Free, Basic, Pro and Premium plans.",

      faq4Q: "Are installation and delivery charged?",
      faq4A:
        "No. Installation and delivery are provided free of charge.",

      faq5Q: "Can I start without buying an expensive plan?",
      faq5A:
        "Yes. The Free plan provides full standalone system features together with a Phone App and local AI.",

      joinTitle: "Ready to get started?",
      joinText:
        "Choose the BR System that matches your operation and start using ANTIMATE.",

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
        "Which BR System would you like to use?",

      system300Button: "BR System 300",
      system750Button: "BR System 750",
      system1000Button: "BR System 1000",

      selection300:
        "Designed for operations supporting up to 300 chicks.",

      selection750:
        "Designed for operations supporting up to 750 chicks.",

      selection1000:
        "Designed for operations supporting up to 1,000 chicks.",

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
     BR SYSTEM SELECTION
  ========================================================== */

  const selectBRSystem = (system) => {
    localStorage.setItem(
      "selectedBRSystem",
      system
    );

    setShowSystemSelection(false);
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
    window.location.href = "tel:+250798698431";
  };

  const openEmail = () => {
    window.location.href =
      "mailto:antimate.inc@gmai.com";
  };

  /* ==========================================================
     PLAN FEATURES
  ========================================================== */

  const featureText = {
    free:
      language === "rw"
        ? [
            "Full system standalone features",
            "Phone App",
            "Local AI",
          ]
        : [
            "Full system standalone features",
            "Phone App",
            "Local AI",
          ],

    basic:
      language === "rw"
        ? [
            "All Free features",
            "App notifications",
            "Dashboard",
            "Weekly analysis",
            "Weekly history",
          ]
        : [
            "All Free features",
            "App notifications",
            "Dashboard",
            "Weekly analysis",
            "Weekly history",
          ],

    pro:
      language === "rw"
        ? [
            "All Free features",
            "App notifications",
            "Dashboard",
            "2 monthly analyses",
            "Monthly history",
            "Phone SMS notifications",
            "Full modular AI features",
            "AI recommendations",
            "AI assistance",
            "Monthly report",
          ]
        : [
            "All Free features",
            "App notifications",
            "Dashboard",
            "2 monthly analyses",
            "Monthly history",
            "Phone SMS notifications",
            "Full modular AI features",
            "AI recommendations",
            "AI assistance",
            "Monthly report",
          ],

    premium:
      language === "rw"
        ? [
            "All Free features",
            "App notifications",
            "Dashboard",
            "Full analysis",
            "Full history",
            "Phone SMS notifications",
            "Customized reports",
            "Full AI features",
            "AI recommendations",
            "AI assistance",
          ]
        : [
            "All Free features",
            "App notifications",
            "Dashboard",
            "Full analysis",
            "Full history",
            "Phone SMS notifications",
            "Customized reports",
            "Full AI features",
            "AI recommendations",
            "AI assistance",
          ],
  };

  const systems = [
    {
      name: t.system300,
      text: t.system300Text,
      capacity: "Up to 300 chicks",
      icon: Cpu,
      prices: {
        Free: "0 FRW",
        Basic: "3,000 FRW",
        Pro: "5,000 FRW",
        Premium: "7,000 FRW",
      },
    },
    {
      name: t.system750,
      text: t.system750Text,
      capacity: "Up to 750 chicks",
      icon: Activity,
      prices: {
        Free: "0 FRW",
        Basic: "5,000 FRW",
        Pro: "8,000 FRW",
        Premium: "11,000 FRW",
      },
    },
    {
      name: t.system1000,
      text: t.system1000Text,
      capacity: "Up to 1,000 chicks",
      icon: Layers,
      prices: {
        Free: "0 FRW",
        Basic: "8,000 FRW",
        Pro: "12,000 FRW",
        Premium: "15,000 FRW",
      },
    },
  ];

  const plans = [
    {
      key: "free",
      name: t.free,
      description: t.freeDescription,
      icon: Smartphone,
    },
    {
      key: "basic",
      name: t.basic,
      description: t.basicDescription,
      icon: Bell,
    },
    {
      key: "pro",
      name: t.pro,
      description: t.proDescription,
      icon: Brain,
    },
    {
      key: "premium",
      name: t.premium,
      description: t.premiumDescription,
      icon: Sparkles,
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
      icon: DatabaseIcon,
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
      icon: Users,
      name: t.teamNoella,
      role: t.cmo,
      department: t.marketingDepartment,
      marketing: true,
    },
    {
      icon: TrendingUp,
      name: t.teamMarketing,
      role: t.cmo,
      department: t.marketingDepartment,
      marketing: true,
    },
    {
      icon: Target,
      name: t.teamBusiness,
      role: t.cbo,
      department: "Business Development",
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
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          color: #172033;
          background: #ffffff;
        }

        .login-page.dark {
          color: #edf2f7;
          background: #08111d;
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

          height: 74px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 5.5%;

          border-bottom:
            1px solid
            #e6e9ee;

          background: #ffffff;
        }

        .dark .login-navbar {
          background: #08111d;
          border-bottom-color: #1d2938;
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
          gap: 18px;
        }

        .navigation > a {
          color: inherit;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          opacity: .72;
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
            1px solid
            #dfe4ea;

          border-radius: 10px;

          background: #f7f8fa;
          color: inherit;
          cursor: pointer;
        }

        .dark .language-button,
        .dark .theme-button,
        .dark .mobile-menu-button {
          border-color: #273547;
          background: #101b2a;
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
          color: #2563eb;
          background: transparent;
          border: 1px solid #cbd8ec;
        }

        .nav-signup {
          color: #ffffff;
          background: #2563eb;
          border: 1px solid #2563eb;
        }

        .nav-signup:hover,
        .primary-button:hover,
        .antimate-plan-button:hover,
        .modal-login-button:hover {
          background: #1d4ed8;
        }

        /* ======================================================
           HERO
        ====================================================== */

        main {
          position: relative;
          z-index: 1;
          padding-top: 74px;
        }

        .hero-section {
          min-height: 700px;
          max-width: 1400px;
          margin: 0 auto;

          padding: 95px 7% 85px;

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

          border-radius: 8px;

          color: #007fa8;
          background: #f0fbfe;
          border: 1px solid #c9edf5;

          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .dark .hero-badge {
          color: #63d8f5;
          background: #0d2530;
          border-color: #1d4655;
        }

        .antimate-company-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          margin-bottom: 25px;
          padding: 7px 11px;

          border-radius: 8px;

          background: #f7f8fa;
          border: 1px solid #e5e8ed;

          font-size: 10px;
          font-weight: 800;
          opacity: .75;
        }

        .dark .antimate-company-badge {
          background: #101a28;
          border-color: #253346;
        }

        .antimate-company-badge svg {
          color: #00a8d6;
        }

        .hero-content h1 {
          margin: 0;

          font-size:
            clamp(42px, 6vw, 76px);

          line-height: 1.02;
          letter-spacing: -4px;
          color: inherit;
        }

        .hero-content h1 span {
          color: #2563eb;
        }

        .dark .hero-content h1 span {
          color: #60a5fa;
        }

        .animated-words {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 23px;
        }

        .animated-words span {
          padding: 7px 10px;

          border-radius: 8px;

          background: #f7f8fa;
          border: 1px solid #e5e8ed;

          font-size: 10px;
          font-weight: 750;
          opacity: .72;
        }

        .dark .animated-words span {
          background: #101a28;
          border-color: #253346;
        }

        .hero-description {
          max-width: 650px;
          margin: 24px 0 0;

          font-size: 17px;
          line-height: 1.8;
          opacity: .68;
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
          border: 1px solid #2563eb;
          color: #ffffff;
          background: #2563eb;
        }

        .secondary-button {
          color: inherit;
          border: 1px solid #d7dce3;
          background: transparent;
        }

        .dark .secondary-button {
          border-color: #334155;
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

          font-size: 11px;
          font-weight: 700;
          opacity: .62;
        }

        .hero-trust svg {
          color: #00a8d6;
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

          border-radius: 22px;

          border:
            1px solid
            #dce2e8;

          box-shadow:
            0 25px 55px
            rgba(0,0,0,.12);
        }

        .dark .farm-image {
          border-color: #263648;
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

          padding: 13px 15px;

          border-radius: 12px;

          background: #ffffff;

          border:
            1px solid
            #dfe4ea;

          box-shadow:
            0 12px 30px
            rgba(0,0,0,.12);
        }

        .dark .floating-card {
          background: #101b2a;
          border-color: #29394b;
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
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          color: #008fb7;
          background: #eefafd;
        }

        .dark .floating-icon,
        .dark .ai-icon {
          color: #5dd8f5;
          background: #0c2934;
        }

        .floating-card span {
          display: block;
          font-size: 9px;
          opacity: .55;
        }

        .floating-card strong {
          display: block;
          margin-top: 3px;
          font-size: 12px;
        }

        /* ======================================================
           FEATURES
        ====================================================== */

        .features-section {
          max-width: 1250px;
          margin: 0 auto;
          padding: 90px 7%;
        }

        .section-heading {
          max-width: 700px;
          margin-bottom: 40px;
        }

        .section-heading span {
          color: #008fb7;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .dark .section-heading span {
          color: #5dd8f5;
        }

        .section-heading h2 {
          margin: 10px 0 0;

          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.1;
          letter-spacing: -1.8px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .feature-card {
          padding: 28px;

          border:
            1px solid
            #e1e5ea;

          background: #fafbfc;
        }

        .dark .feature-card {
          background: #0d1724;
          border-color: #263548;
        }

        .feature-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 20px;

          border-radius: 12px;

          color: #008fb7;
          background: #edfafd;
        }

        .dark .feature-icon {
          color: #5dd8f5;
          background: #0d2a35;
        }

        .feature-card h3 {
          margin: 0 0 10px;
          font-size: 19px;
        }

        .feature-card p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          opacity: .65;
        }

        .feature-line {
          width: 36px;
          height: 2px;

          margin-top: 22px;

          background: #2563eb;
        }

        /* ======================================================
           GENERAL SECTIONS
        ====================================================== */

        .antimate-public-section {
          position: relative;
          padding: 100px 7%;
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

          color: #008fb7;

          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .dark .antimate-section-label {
          color: #5dd8f5;
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
          opacity: .72;
        }

        /* ======================================================
           SYSTEMS
        ====================================================== */

        .antimate-system-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));

          gap: 18px;
          margin-top: 45px;
        }

        .antimate-system-card {
          padding: 27px;

          border:
            1px solid
            #dfe4ea;

          background: #ffffff;
        }

        .dark .antimate-system-card {
          background: #0d1724;
          border-color: #2a3a4d;
        }

        .antimate-system-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;
          margin-bottom: 20px;

          color: #2563eb;
          background: #eff4ff;
        }

        .dark .antimate-system-icon {
          color: #72a4ff;
          background: #13243c;
        }

        .antimate-system-card h3 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .antimate-system-card p {
          margin: 0;

          line-height: 1.7;
          opacity: .68;
          font-size: 14px;
        }

        .system-capacity {
          display: flex;
          align-items: center;
          gap: 7px;

          margin-top: 20px;
          padding-top: 16px;

          border-top:
            1px solid
            #e7eaee;

          color: #008fb7;

          font-size: 11px;
          font-weight: 800;
        }

        .dark .system-capacity {
          border-top-color: #263548;
          color: #5dd8f5;
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
          font-size: 18px;
          line-height: 1.85;
          opacity: .76;
          margin-top: 25px;
        }

        .antimate-definition {
          margin-top: 27px;
          padding: 24px;

          border-left:
            3px solid
            #2563eb;

          background:
            #f6f8fb;
        }

        .dark .antimate-definition {
          background: #0d1724;
        }

        .antimate-definition strong {
          display: block;
          margin-bottom: 8px;

          font-size: 14px;
          color: #2563eb;
        }

        .dark .antimate-definition strong {
          color: #72a4ff;
        }

        .antimate-definition span {
          font-size: 16px;
          line-height: 1.7;
        }

        .antimate-about-panel {
          display: grid;

          grid-template-columns: repeat(2, 1fr);

          gap: 14px;
        }

        .antimate-about-mini {
          min-height: 150px;

          padding: 23px;

          border:
            1px solid
            #e1e5ea;

          background: #fafbfc;
        }

        .dark .antimate-about-mini {
          background: #0d1724;
          border-color: #263548;
        }

        .antimate-about-mini svg {
          color: #008fb7;
          margin-bottom: 15px;
        }

        .dark .antimate-about-mini svg {
          color: #5dd8f5;
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
           VISION
        ====================================================== */

        .vision-section {
          max-width: 1250px;
          margin: 0 auto;

          padding: 80px 7%;

          display: grid;
          grid-template-columns: .9fr 1.1fr;

          gap: 65px;
          align-items: center;
        }

        .vision-image {
          height: 390px;

          overflow: hidden;

          border-radius: 20px;

          box-shadow:
            0 20px 55px
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

          color: #008fb7;

          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .dark .small-heading {
          color: #5dd8f5;
        }

        .vision-content h2 {
          margin: 14px 0 18px;

          font-size: clamp(30px, 4vw, 48px);

          line-height: 1.08;
          letter-spacing: -1.7px;
        }

        .vision-content > p {
          margin: 0;

          font-size: 16px;
          line-height: 1.8;
          opacity: .68;
        }

        .vision-points {
          display: grid;
          gap: 11px;
          margin-top: 25px;
        }

        .vision-points div {
          display: flex;
          align-items: center;
          gap: 9px;

          font-size: 13px;
          font-weight: 750;
        }

        .vision-points svg {
          color: #008fb7;
        }

        .dark .vision-points svg {
          color: #5dd8f5;
        }

        /* ======================================================
           PLANS
        ====================================================== */

        .plans-intro {
          margin-top: 40px;

          padding: 17px 20px;

          border:
            1px solid
            #dce3eb;

          background: #f7f9fb;

          display: flex;
          align-items: center;
          gap: 10px;

          font-size: 12px;
          font-weight: 750;
        }

        .dark .plans-intro {
          background: #0d1724;
          border-color: #2a3a4d;
        }

        .plans-intro svg {
          color: #16a34a;
          flex-shrink: 0;
        }

        .plan-overview {
          margin-top: 28px;

          overflow-x: auto;

          border:
            1px solid
            #dfe4ea;

          background: #ffffff;
        }

        .dark .plan-overview {
          background: #0d1724;
          border-color: #293a4d;
        }

        .plan-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .plan-table th,
        .plan-table td {
          padding: 17px 16px;

          border-bottom:
            1px solid
            #e8ebef;

          text-align: left;
          vertical-align: top;
        }

        .dark .plan-table th,
        .dark .plan-table td {
          border-bottom-color: #263548;
        }

        .plan-table th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .8px;
          color: #64748b;
          background: #f8fafc;
        }

        .dark .plan-table th {
          background: #101c2b;
          color: #94a3b8;
        }

        .plan-table th:first-child {
          width: 27%;
        }

        .plan-table td {
          font-size: 12px;
          line-height: 1.6;
        }

        .plan-name {
          display: flex;
          align-items: center;
          gap: 9px;

          font-weight: 850;
          color: #172033;
        }

        .dark .plan-name {
          color: #f1f5f9;
        }

        .plan-name svg {
          color: #2563eb;
        }

        .dark .plan-name svg {
          color: #72a4ff;
        }

        .plan-price {
          margin-top: 5px;

          font-size: 19px;
          font-weight: 900;

          color: #2563eb;
        }

        .dark .plan-price {
          color: #72a4ff;
        }

        .plan-month {
          display: block;

          margin-top: 2px;

          font-size: 9px;
          opacity: .55;
        }

        .plan-description {
          max-width: 230px;
          opacity: .63;
        }

        .plan-feature-list {
          list-style: none;

          padding: 0;
          margin: 0;

          display: grid;
          gap: 7px;
        }

        .plan-feature-list li {
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }

        .plan-feature-list svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: #16a34a;
        }

        .plan-action {
          width: 100%;

          min-height: 38px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;

          border:
            1px solid
            #2563eb;

          background: #2563eb;
          color: #ffffff;

          border-radius: 9px;

          cursor: pointer;

          font-size: 11px;
          font-weight: 800;
        }

        .plan-action:hover {
          background: #1d4ed8;
        }

        .system-pricing {
          margin-top: 38px;
        }

        .system-pricing-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;

          margin-bottom: 12px;
        }

        .system-pricing-title {
          margin: 0;

          font-size: 21px;
          letter-spacing: -.5px;
        }

        .system-pricing-capacity {
          font-size: 11px;
          color: #64748b;
        }

        .dark .system-pricing-capacity {
          color: #94a3b8;
        }

        .system-pricing-table {
          width: 100%;

          border-collapse: collapse;

          border:
            1px solid
            #dfe4ea;

          background: #ffffff;
        }

        .dark .system-pricing-table {
          background: #0d1724;
          border-color: #293a4d;
        }

        .system-pricing-table th,
        .system-pricing-table td {
          padding: 15px;

          border-bottom:
            1px solid
            #e8ebef;

          text-align: left;
        }

        .dark .system-pricing-table th,
        .dark .system-pricing-table td {
          border-bottom-color: #263548;
        }

        .system-pricing-table th {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .7px;

          color: #64748b;

          background: #f8fafc;
        }

        .dark .system-pricing-table th {
          color: #94a3b8;
          background: #101c2b;
        }

        .system-pricing-table td {
          font-size: 13px;
        }

        .system-pricing-table td:not(:first-child) {
          font-weight: 850;
          color: #2563eb;
        }

        .dark .system-pricing-table td:not(:first-child) {
          color: #72a4ff;
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

          border:
            1px solid
            #e1e5ea;

          background: #fafbfc;
        }

        .dark .antimate-support-card {
          background: #0d1724;
          border-color: #263548;
        }

        .antimate-support-icon {
          width: 46px;
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          color: #008fb7;
          background: #edfafd;

          margin-bottom: 17px;
        }

        .dark .antimate-support-icon {
          color: #5dd8f5;
          background: #0d2a35;
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

          color: #2563eb;

          font-size: 12px;
          font-weight: 850;

          cursor: pointer;
          padding: 0;
        }

        .dark .antimate-support-button {
          color: #72a4ff;
        }

        /* ======================================================
           CONTACT
        ====================================================== */

        .antimate-contact-strip {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 15px;

          margin-top: 15px;
        }

        .antimate-contact-item {
          display: flex;
          align-items: center;
          gap: 14px;

          padding: 18px;

          border:
            1px solid
            #e1e5ea;

          background: #fafbfc;
        }

        .dark .antimate-contact-item {
          background: #0d1724;
          border-color: #263548;
        }

        .antimate-contact-item svg {
          flex-shrink: 0;
          color: #008fb7;
        }

        .dark .antimate-contact-item svg {
          color: #5dd8f5;
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

          border:
            1px solid
            #e1e5ea;

          background: #fafbfc;
        }

        .dark .antimate-team-card {
          background: #0d1724;
          border-color: #263548;
        }

        .antimate-team-card.marketing-member {
          border-top:
            2px solid
            #2563eb;
        }

        .antimate-team-avatar {
          width: 45px;
          height: 45px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          color: #008fb7;
          background: #edfafd;

          margin-bottom: 15px;
        }

        .dark .antimate-team-avatar {
          color: #5dd8f5;
          background: #0d2a35;
        }

        .antimate-team-card h3 {
          margin: 0 0 5px;
          font-size: 15px;
        }

        .antimate-team-role {
          display: block;

          color: #2563eb;

          font-size: 11px;
          font-weight: 800;
          line-height: 1.4;
        }

        .dark .antimate-team-role {
          color: #72a4ff;
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
            #e1e5ea;

          overflow: hidden;

          background: #fafbfc;
        }

        .dark .antimate-faq-item {
          background: #0d1724;
          border-color: #263548;
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
          transition: transform .25s ease;
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

          padding: 0 20px 20px;

          font-size: 13px;
          line-height: 1.75;
          opacity: .65;
        }

        /* ======================================================
           JOIN
        ====================================================== */

        .join-section {
          padding: 100px 7%;

          text-align: center;

          border-top:
            1px solid
            #e1e5ea;

          border-bottom:
            1px solid
            #e1e5ea;

          background: #f7f9fb;
        }

        .dark .join-section {
          background: #0d1724;
          border-color: #263548;
        }

        .join-content {
          max-width: 720px;
          margin: 0 auto;
        }

        .join-content > svg {
          color: #2563eb;
        }

        .join-content h2 {
          margin: 15px 0 10px;

          font-size: clamp(32px, 4vw, 52px);

          letter-spacing: -2px;
        }

        .join-content p {
          margin: 0 auto 25px;

          max-width: 600px;

          line-height: 1.75;
          opacity: .68;
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

          background: #2563eb;

          box-shadow:
            0 10px 25px
            rgba(37,99,235,.28);
        }

        .antimate-ai-ring-login {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #0b1220;
        }

        .antimate-ai-inner-login {
          position: absolute;
          inset: 3px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #101b2a;
        }

        .antimate-ai-text-login {
          color: #ffffff;

          font-size: 16px;
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
            1px solid
            #e1e5ea;

          background: #ffffff;
        }

        .dark .login-footer {
          background: #08111d;
          border-color: #263548;
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

          font-size: 10px;
          line-height: 1.6;
          opacity: .5;
        }

        .footer-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;

          margin-top: 12px;

          font-size: 11px;
          opacity: .6;
        }

        /* ======================================================
           LOGIN MODAL
        ====================================================== */

        .modal-overlay {
          position: fixed;
          inset: 0;

          z-index: 100000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(3,8,18,.68);

          backdrop-filter: blur(7px);
        }

        .login-modal {
          position: relative;

          width: min(100%, 430px);

          padding: 35px;

          border-radius: 18px;

          background: #ffffff;
          color: #111827;

          border:
            1px solid
            #dfe4ea;

          box-shadow:
            0 30px 80px
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
          border-radius: 9px;

          background: #f1f3f5;

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

          font-size: 13px;
          opacity: .58;
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
            1px solid
            #d7dce3;

          border-radius: 9px;

          outline: none;

          color: #111827;
          background: #ffffff;
        }

        .input-group input:focus {
          border-color: #2563eb;

          box-shadow:
            0 0 0 3px
            rgba(37,99,235,.08);
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

          background: #fff1f2;

          border:
            1px solid
            #fecdd3;

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

          border: 1px solid #2563eb;
          border-radius: 9px;

          color: #ffffff;

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

          border-top-color: #ffffff;

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

          font-size: 12px;
        }

        .modal-bottom a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 750;
        }

        /* ======================================================
           BR SYSTEM SELECTION
        ====================================================== */

        .system-selection-overlay {
          position: fixed;
          inset: 0;

          z-index: 100001;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(3,8,18,.72);

          backdrop-filter: blur(8px);
        }

        .system-selection {
          width: min(100%, 900px);

          padding: 34px;

          border-radius: 18px;

          color: #111827;
          background: #ffffff;

          border:
            1px solid
            #dfe4ea;

          box-shadow:
            0 35px 90px
            rgba(0,0,0,.32);
        }

        .system-selection-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .system-selection-logo {
          width: 54px;
          height: 54px;

          margin: 0 auto 15px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 13px;

          background: #f1f8fa;
        }

        .system-selection-header h2 {
          margin: 0;

          font-size: 28px;
          letter-spacing: -1px;
        }

        .system-selection-header p {
          margin: 9px auto 0;

          max-width: 520px;

          font-size: 13px;
          line-height: 1.65;

          opacity: .58;
        }

        .system-selection-grid {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 14px;
        }

        .system-selection-card {
          padding: 23px;

          border-radius: 13px;

          border:
            1px solid
            #dce2e8;

          background: #fafbfc;

          text-align: left;

          cursor: pointer;

          color: #111827;

          transition:
            border-color .2s ease,
            background .2s ease;
        }

        .system-selection-card:hover {
          border-color: #2563eb;
          background: #f6f9ff;
        }

        .system-selection-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 18px;

          border-radius: 11px;

          color: #2563eb;

          background: #eff4ff;
        }

        .system-selection-card h3 {
          margin: 0 0 9px;

          font-size: 19px;
        }

        .system-selection-card p {
          min-height: 65px;

          margin: 0 0 20px;

          font-size: 12px;
          line-height: 1.65;

          opacity: .62;
        }

        .system-selection-action {
          display: flex;

          align-items: center;
          justify-content: space-between;

          color: #2563eb;

          font-size: 12px;
          font-weight: 850;
        }

        .system-selection-cancel {
          display: flex;
          align-items: center;
          justify-content: center;

          margin: 22px auto 0;

          border: 0;
          background: transparent;

          color: #64748b;

          font-size: 12px;
          font-weight: 750;

          cursor: pointer;
        }

        /* ======================================================
           DARK MODALS
        ====================================================== */

        .dark .login-modal,
        .dark .system-selection {
          color: #f8fafc;
          background: #0f172a;
          border-color: #293a4d;
        }

        .dark .close-modal {
          color: #f8fafc;
          background: #172234;
        }

        .dark .input-group input {
          color: #f8fafc;
          background: #111c2e;
          border-color: #2a3a4d;
        }

        .dark .system-selection-card {
          color: #f8fafc;
          background: #101b2a;
          border-color: #293a4d;
        }

        .dark .system-selection-card:hover {
          border-color: #4d7ed8;
          background: #132238;
        }

        .dark .system-selection-icon {
          color: #72a4ff;
          background: #13243c;
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 1100px) {
          .navigation {
            gap: 12px;
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

            top: 74px;
            left: 12px;
            right: 12px;

            display: none;

            flex-direction: column;
            align-items: stretch;

            padding: 15px;

            border-radius: 13px;

            background: #ffffff;

            border:
              1px solid
              #dfe4ea;

            box-shadow:
              0 20px 50px
              rgba(0,0,0,.13);
          }

          .dark .navigation {
            background: #08111d;
            border-color: #293a4d;
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

          .antimate-about-layout {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .vision-section {
            grid-template-columns: 1fr;
            gap: 35px;
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
            padding:
              65px 5% 65px;
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
            border-radius: 18px;
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
          .antimate-system-grid,
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
            border-radius: 16px;
          }

          .system-selection-header h2 {
            font-size: 24px;
          }

          .login-footer {
            padding-bottom: 90px;
          }

          .footer-info {
            flex-direction: column;
            gap: 7px;
          }

          .system-pricing {
            overflow-x: auto;
          }

          .system-pricing-table {
            min-width: 600px;
          }

          .system-pricing-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
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
            NAVBAR
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
                <span>Monitor.</span>
                <span>Understand.</span>
                <span>Assist.</span>
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
                  <Thermometer size={17} />
                </div>

                <div>
                  <span>BR System</span>
                  <strong>Monitoring</strong>
                </div>
              </div>

              <div className="floating-card card-ai">
                <div className="ai-icon">
                  <Brain size={18} />
                </div>

                <div>
                  <span>ANTIMATE AI</span>
                  <strong>Assistance</strong>
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
                icon={<Activity />}
                title={t.feature1Title}
                text={t.feature1Text}
              />

              <Feature
                icon={<BarChart3 />}
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
            <div className="antimate-public-container">
              <div className="antimate-section-label">
                <Layers size={16} />
                BR SYSTEMS
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

                        <div className="system-capacity">
                          <Users size={15} />
                          <span>
                            {t.capacity}:{" "}
                            {system.capacity}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* ====================================================
              ABOUT
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
                {t.visionShortText}
              </h2>

              <p>
                {t.aboutText}
              </p>

              <div className="vision-points">
                <div>
                  <Activity size={18} />
                  <span>
                    Real-time monitoring
                  </span>
                </div>

                <div>
                  <BarChart3 size={18} />
                  <span>
                    Data-driven insights
                  </span>
                </div>

                <div>
                  <ShieldCheck size={18} />
                  <span>
                    Secure technology
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
            className="antimate-public-section"
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

              <div className="plans-intro">
                <Check size={17} />

                <span>
                  {t.installation}:{" "}
                  {t.freeService}
                  {" • "}
                  {t.delivery}:{" "}
                  {t.freeService}
                </span>
              </div>

              {/* ==================================================
                  PLAN FEATURE OVERVIEW
              ================================================== */}

              <div className="plan-overview">
                <table className="plan-table">
                  <thead>
                    <tr>
                      <th>
                        Plan
                      </th>

                      <th>
                        Features
                      </th>

                      <th>
                        Description
                      </th>

                      <th>
                        Service
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {plans.map(
                      (plan) => {
                        const Icon =
                          plan.icon;

                        return (
                          <tr
                            key={plan.key}
                          >
                            <td>
                              <div className="plan-name">
                                <Icon
                                  size={16}
                                />

                                <span>
                                  {plan.name}
                                </span>
                              </div>
                            </td>

                            <td>
                              <ul className="plan-feature-list">
                                {featureText[
                                  plan.key
                                ].map(
                                  (
                                    feature,
                                    index
                                  ) => (
                                    <li
                                      key={
                                        index
                                      }
                                    >
                                      <Check
                                        size={
                                          13
                                        }
                                      />

                                      <span>
                                        {
                                          feature
                                        }
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </td>

                            <td>
                              <div className="plan-description">
                                {
                                  plan.description
                                }
                              </div>
                            </td>

                            <td>
                              <span>
                                Installation:
                              </span>
                              <br />
                              <strong>
                                {
                                  t.freeService
                                }
                              </strong>

                              <br />

                              <span>
                                Delivery:
                              </span>
                              <br />
                              <strong>
                                {
                                  t.freeService
                                }
                              </strong>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* ==================================================
                  SYSTEM 300 PRICING
              ================================================== */}

              <SystemPricing
                system={systems[0]}
                t={t}
                navigate={navigate}
              />

              {/* ==================================================
                  SYSTEM 750 PRICING
              ================================================== */}

              <SystemPricing
                system={systems[1]}
                t={t}
                navigate={navigate}
              />

              {/* ==================================================
                  SYSTEM 1000 PRICING
              ================================================== */}

              <SystemPricing
                system={systems[2]}
                t={t}
                navigate={navigate}
              />
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
            </div>
          </section>

          {/* ====================================================
              TEAM
          ==================================================== */}

          <section className="antimate-public-section">
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
                        className={`antimate-team-card ${
                          member.marketing
                            ? "marketing-member"
                            : ""
                        }`}
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

          <section className="antimate-public-section">
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
            ANTIMATE AI
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
                    <Cpu size={25} />
                  </div>

                  <h3>
                    {t.system300Button}
                  </h3>

                  <p>
                    {t.selection300}
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
                    <Activity size={25} />
                  </div>

                  <h3>
                    {t.system750Button}
                  </h3>

                  <p>
                    {t.selection750}
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
                    <Layers size={25} />
                  </div>

                  <h3>
                    {t.system1000Button}
                  </h3>

                  <p>
                    {t.selection1000}
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

/* ============================================================
   DATABASE ICON
============================================================ */

function DatabaseIcon(props) {
  return (
    <svg
      {...props}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse
        cx="12"
        cy="5"
        rx="8"
        ry="3"
      />
      <path
        d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"
      />
      <path
        d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"
      />
    </svg>
  );
}

/* ============================================================
   SYSTEM PRICING
============================================================ */

function SystemPricing({
  system,
  t,
  navigate,
}) {
  return (
    <div className="system-pricing">
      <div className="system-pricing-header">
        <h3 className="system-pricing-title">
          {system.name}
        </h3>

        <span className="system-pricing-capacity">
          {system.capacity}
        </span>
      </div>

      <table className="system-pricing-table">
        <thead>
          <tr>
            <th>
              {t.free}
            </th>

            <th>
              {t.basic}
            </th>

            <th>
              {t.pro}
            </th>

            <th>
              {t.premium}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              {system.prices.Free}
            </td>

            <td>
              {system.prices.Basic}
              <span className="plan-month">
                {t.monthly}
              </span>
            </td>

            <td>
              {system.prices.Pro}
              <span className="plan-month">
                {t.monthly}
              </span>
            </td>

            <td>
              {system.prices.Premium}
              <span className="plan-month">
                {t.monthly}
              </span>
            </td>
          </tr>

          <tr>
            <td>
              <button
                className="plan-action"
                onClick={() =>
                  navigate("/signup")
                }
              >
                {t.choosePlan}
                <ArrowRight size={13} />
              </button>
            </td>

            <td>
              <button
                className="plan-action"
                onClick={() =>
                  navigate("/signup")
                }
              >
                {t.choosePlan}
                <ArrowRight size={13} />
              </button>
            </td>

            <td>
              <button
                className="plan-action"
                onClick={() =>
                  navigate("/signup")
                }
              >
                {t.choosePlan}
                <ArrowRight size={13} />
              </button>
            </td>

            <td>
              <button
                className="plan-action"
                onClick={() =>
                  navigate("/signup")
                }
              >
                {t.choosePlan}
                <ArrowRight size={13} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Login;