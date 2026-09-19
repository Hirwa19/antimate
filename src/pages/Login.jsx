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
  Server,
  Network,
  Layers,
  Code2,
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
        "ANTIMATE Link ihuza devices, gateways n'ibikorwa bitandukanye ikoresheje communication yubakiye ku mutekano no kwizerwa.",

      feature2Title: "Understand",
      feature2Text:
        "ANTIMATE Cloud ikusanya kandi itunganya data kugira ngo ibe amakuru ashobora gusobanuka no gukoreshwa.",

      feature3Title: "Intelligence",
      feature3Text:
        "ANTIMATE AI ikoresha amakuru kugira ngo ifashe abantu kubona insights, guidance no gufata ibyemezo byiza.",

      visionTitle:
        "Kubaka ecosystem y'ikoranabuhanga ishobora gukorera ahantu hatandukanye",

      visionText:
        "ANTIMATE yubaka infrastructure ihuza Edge devices, communication, cloud services na Artificial Intelligence. Intego ni ugukora technology ishobora gukoreshwa mu bworozi, agriculture, smart home, monitoring, automation n'izindi domains.",

      systemsTitle: "ANTIMATE Ecosystem",
      systemsSubtitle:
        "Systems zubaka ANTIMATE n'uruhare rwa buri imwe.",

      systemEdge: "ANTIMATE Edge",
      systemEdgeText:
        "Layer ikorera kuri devices. Ifasha sensors, actuators na embedded systems gukusanya no kohereza data.",

      systemLink: "ANTIMATE Link",
      systemLinkText:
        "Communication layer ihuza devices na gateways. Yubakiye ku buryo data ishobora koherezwa hatitawe ku bwoko bwayo.",

      systemCloud: "ANTIMATE Cloud",
      systemCloudText:
        "Infrastructure ibika, itunganya kandi igatanga data na services za ANTIMATE ku buryo bwizewe.",

      systemAI: "ANTIMATE AI",
      systemAIText:
        "Intelligence layer ifasha gusobanura data, gutanga insights, guidance no gufasha abakoresha.",

      systemCare: "ANTIMATE Care",
      systemCareText:
        "Support layer ifasha abakoresha, developers n'abafatanyabikorwa gukoresha ANTIMATE neza.",

      systemKnowledge: "ANTIMATE Knowledge",
      systemKnowledgeText:
        "Knowledge center irimo documentation, guides n'amakuru afasha abakoresha n'abatekinisiye.",

      plansTitle: "Plans zijyanye n'ibyo ukeneye",
      plansSubtitle:
        "Tangira ukoresheje plan ikubereye kandi wiyongere uko ibikorwa byawe bikura.",

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
        "Ku muntu ushaka gutangira kumenya ecosystem ya ANTIMATE.",
      basicDescription:
        "Ku bakoresha batangiye gukoresha services za ANTIMATE.",
      proDescription:
        "Ku bakoresha bakeneye monitoring, data na intelligence byinshi.",
      premiumDescription:
        "Ku bakoresha bakeneye experience yagutse na support yihariye.",

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
      teamBertin: "Bertin",
      teamBertinRole: "Data Management",
      teamNetwork: "ANTIMATE Network & Communication",
      teamSystem: "MUGISHA Prince",
      teamMarketing: "KWIZERA J. Bosco",
      teamNoella: "Noella",
      teamNoellaRole: "Marketing",
      teamNoellaWorksWith: "Akorana na Kwizera",
      teamBusiness: "MUGISHA Steven",

      faqTitle: "Ibibazo bikunze kubazwa",

      faq1Q: "ANTIMATE ikora iki?",
      faq1A:
        "ANTIMATE ihuza devices, communication, cloud, data na AI kugira ngo ifashe abantu n'ibikorwa gukoresha technology neza.",

      faq2Q: "ANTIMATE ikoreshwa gusa mu bworozi?",
      faq2A:
        "Oya. Ubworozi ni imwe mu domains ANTIMATE ishobora gukoreramo. Architecture yayo ishobora gukoreshwa no muri agriculture, smart home, monitoring, automation n'izindi domains.",

      faq3Q: "Nshobora gutangira nta mafaranga?",
      faq3A:
        "Yego. Hariho Free plan igufasha gutangira kumenya services za ANTIMATE.",

      faq4Q: "ANTIMATE AI nayikoresha ntagize account?",
      faq4A:
        "ANTIMATE AI ishobora gutanga ubufasha rusange, ariko services zihariye zishobora gusaba ko winjira muri account.",

      faq5Q: "Ni gute ninjiye muri ANTIMATE?",
      faq5A:
        "Umaze gukora login, ANTIMATE izakubaza system ushaka gukoresha: ANTIMATE Edge cyangwa ANTIMATE Link.",

      joinTitle: "Witeguye gutangira?",
      joinText:
        "Injira muri ANTIMATE uhitemo system ijyanye n'ibyo ushaka gukora.",

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
        "ANTIMATE Link connects devices, gateways and different projects through reliable and secure communication.",

      feature2Title: "Understand",
      feature2Text:
        "ANTIMATE Cloud organizes and processes data so it becomes useful information that can be understood and acted upon.",

      feature3Title: "Intelligence",
      feature3Text:
        "ANTIMATE AI turns information into insights, guidance and intelligent assistance.",

      visionTitle:
        "Building a technology ecosystem that can work across different environments",

      visionText:
        "ANTIMATE connects Edge devices, communication, cloud services and Artificial Intelligence. The architecture is designed to expand across farming, agriculture, smart homes, monitoring, automation and other domains.",

      systemsTitle: "The ANTIMATE Ecosystem",
      systemsSubtitle:
        "The systems that make up ANTIMATE and what each one does.",

      systemEdge: "ANTIMATE Edge",
      systemEdgeText:
        "The device layer. It helps sensors, actuators and embedded systems collect and transmit information.",

      systemLink: "ANTIMATE Link",
      systemLinkText:
        "The communication layer connecting devices and gateways while allowing different types of data to move through the network.",

      systemCloud: "ANTIMATE Cloud",
      systemCloudText:
        "The infrastructure that stores, processes and provides ANTIMATE data and services securely.",

      systemAI: "ANTIMATE AI",
      systemAIText:
        "The intelligence layer that helps understand data, provide insights and assist users.",

      systemCare: "ANTIMATE Care",
      systemCareText:
        "The support layer helping users, developers and partners get the most from ANTIMATE.",

      systemKnowledge: "ANTIMATE Knowledge",
      systemKnowledgeText:
        "A knowledge center containing documentation, guides and useful information for users and developers.",

      plansTitle: "Plans for your needs",
      plansSubtitle:
        "Start with the plan that fits you and scale as your activities grow.",

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
        "For anyone who wants to start exploring the ANTIMATE ecosystem.",
      basicDescription:
        "For users beginning to use ANTIMATE services.",
      proDescription:
        "For users who need broader monitoring, data and intelligence.",
      premiumDescription:
        "For users who need expanded services and dedicated support.",

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
      teamBertin: "Bertin",
      teamBertinRole: "Data Management",
      teamNetwork: "ANTIMATE Network & Communication",
      teamSystem: "MUGISHA Prince",
      teamMarketing: "KWIZERA J. Bosco",
      teamNoella: "Noella",
      teamNoellaRole: "Marketing",
      teamNoellaWorksWith: "Akorana na Kwizera",
      teamBusiness: "MUGISHA Steven",

      faqTitle: "Frequently asked questions",

      faq1Q: "What does ANTIMATE do?",
      faq1A:
        "ANTIMATE connects devices, communication, cloud, data and AI to help people and businesses use technology more effectively.",

      faq2Q: "Is ANTIMATE only for farming?",
      faq2A:
        "No. Farming is one of the domains ANTIMATE can serve. The architecture can also support agriculture, smart homes, monitoring, automation and other domains.",

      faq3Q: "Can I start for free?",
      faq3A:
        "Yes. The Free plan lets you start exploring ANTIMATE services.",

      faq4Q: "Can I use ANTIMATE AI without an account?",
      faq4A:
        "ANTIMATE AI can provide general assistance, while specific account-based services may require you to sign in.",

      faq5Q: "What happens after I log in?",
      faq5A:
        "After login, ANTIMATE asks you which system you want to use: ANTIMATE Edge or ANTIMATE Link.",

      joinTitle: "Ready to get started?",
      joinText:
        "Sign in to ANTIMATE and choose the system that matches what you want to do.",

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
      setMessage("");
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
          ? "Amakuru rusange"
          : "General information",
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
          ? "Services zagutse"
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
      icon: Database,
      name: t.teamBertin,
      role: t.teamBertinRole,
      department: language === "rw" ? "Data Management" : "Data Management",
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
      icon: TrendingUp,
      name: t.teamNoella,
      role: t.teamNoellaRole,
      department: t.teamNoellaWorksWith,
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
          color: #111827;
          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(0,217,255,.07),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 20%,
              rgba(37,99,235,.06),
              transparent 28%
            ),
            #ffffff;
        }

        .login-page.dark {
          color: #f8fafc;
          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(0,217,255,.08),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 20%,
              rgba(99,102,241,.08),
              transparent 30%
            ),
            #07111f;
        }

        .background-orb {
          position: fixed;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
          opacity: .12;
          z-index: 0;
        }

        .orb-one {
          top: 90px;
          left: -120px;
          background: #00d9ff;
        }

        .orb-two {
          right: -130px;
          top: 420px;
          background: #6366f1;
        }

        /* ======================================================
           NAVBAR
        ====================================================== */

        .login-navbar {
          position: fixed;
          isolation: isolate;
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
            1px solid
            rgba(127,127,127,.14);

          background:
            rgba(255,255,255,.88);

          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .dark .login-navbar {
          background:
            rgba(7,17,31,.88);
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
          gap: 19px;
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
            rgba(127,127,127,.18);

          border-radius: 11px;

          background:
            rgba(127,127,127,.045);

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
          border-radius: 11px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .nav-login {
          color: #2563eb;
          background: transparent;
          border: 1px solid rgba(37,99,235,.25);
        }

        .nav-signup {
          color: #fff;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );
          border: 0;
        }

        /* ======================================================
           HERO
        ====================================================== */

        main {
          position: relative;
          z-index: 1;
          padding-top: 76px;
        }

        .hero-section {
          min-height: 720px;
          max-width: 1400px;
          margin: 0 auto;

          padding:
            100px 7% 90px;

          display: grid;
          grid-template-columns:
            1.05fr .95fr;

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
          padding: 8px 12px;

          border-radius: 999px;

          color: #008db6;

          background:
            rgba(0,217,255,.07);

          border:
            1px solid
            rgba(0,217,255,.17);

          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .antimate-company-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          margin-bottom: 25px;
          padding: 7px 11px;

          border-radius: 999px;

          background:
            rgba(127,127,127,.05);

          border:
            1px solid
            rgba(127,127,127,.13);

          font-size: 10px;
          font-weight: 800;
          opacity: .72;
        }

        .antimate-company-badge svg {
          color: #00bce7;
        }

        .hero-content h1 {
          margin: 0;

          font-size:
            clamp(42px, 6vw, 76px);

          line-height: 1.02;
          letter-spacing: -4px;
        }

        .hero-content h1 span {
          background:
            linear-gradient(
              135deg,
              #00bce7,
              #2563eb,
              #7c3aed
            );

          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .animated-words {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 23px;
        }

        .animated-words span {
          padding: 7px 10px;
          border-radius: 9px;

          background:
            rgba(127,127,127,.055);

          border:
            1px solid
            rgba(127,127,127,.12);

          font-size: 10px;
          font-weight: 750;
          opacity: .72;
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

          border-radius: 13px;

          font-size: 13px;
          font-weight: 850;
          text-decoration: none;
          cursor: pointer;
        }

        .primary-button {
          border: 0;
          color: #fff;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );

          box-shadow:
            0 12px 28px
            rgba(37,99,235,.18);
        }

        .secondary-button {
          color: inherit;

          border:
            1px solid
            rgba(127,127,127,.2);

          background:
            rgba(127,127,127,.045);
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

        .visual-glow {
          position: absolute;
          width: 390px;
          height: 390px;
          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(0,217,255,.22),
              rgba(37,99,235,.07),
              transparent 68%
            );

          filter: blur(10px);
        }

        .farm-image {
          position: relative;
          width: min(100%, 470px);
          height: 420px;

          overflow: hidden;
          border-radius: 32px;

          border:
            1px solid
            rgba(0,217,255,.18);

          box-shadow:
            0 35px 80px
            rgba(0,0,0,.16);

          transform: rotate(1.5deg);
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

          border-radius: 15px;

          background:
            rgba(255,255,255,.9);

          border:
            1px solid
            rgba(127,127,127,.14);

          box-shadow:
            0 15px 35px
            rgba(0,0,0,.12);

          backdrop-filter: blur(12px);
        }

        .dark .floating-card {
          background:
            rgba(15,23,42,.91);
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

          border-radius: 11px;

          color: #00bce7;
          background:
            rgba(0,217,255,.09);
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

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(0,217,255,.2);
        }

        .circle-one {
          width: 50px;
          height: 50px;
          top: 15px;
          right: 80px;
        }

        .circle-two {
          width: 24px;
          height: 24px;
          bottom: 25px;
          left: 80px;
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
          color: #00a8d6;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.7px;
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
          position: relative;
          padding: 28px;

          border-radius: 21px;

          border:
            1px solid
            rgba(127,127,127,.13);

          background:
            rgba(127,127,127,.045);
        }

        .feature-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 20px;

          border-radius: 14px;

          color: #00bce7;

          background:
            rgba(0,217,255,.08);
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
          width: 40px;
          height: 2px;
          margin-top: 22px;
          border-radius: 5px;
          background:
            linear-gradient(
              90deg,
              #00d9ff,
              #2563eb
            );
        }

        /* ======================================================
           PUBLIC SECTIONS
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
          position: relative;
          padding: 28px;
          border-radius: 22px;

          border:
            1px solid
            rgba(0,217,255,.12);

          background:
            linear-gradient(
              145deg,
              rgba(0,217,255,.06),
              rgba(37,99,235,.025)
            );

          transition:
            transform .25s ease,
            border-color .25s ease,
            box-shadow .25s ease;

          overflow: hidden;
        }

        .antimate-system-card:hover {
          transform: translateY(-7px);
          border-color: rgba(0,217,255,.32);
          box-shadow:
            0 18px 50px
            rgba(0,0,0,.12);
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
            rgba(0,217,255,.09);

          border:
            1px solid
            rgba(0,217,255,.15);
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
            3px solid #00d9ff;

          border-radius:
            0 16px 16px 0;

          background:
            rgba(0,217,255,.055);
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
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .antimate-about-mini {
          min-height: 150px;
          padding: 23px;

          border-radius: 20px;

          border:
            1px solid
            rgba(0,217,255,.12);

          background:
            rgba(127,127,127,.055);
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
          border-radius: 27px;
          box-shadow:
            0 25px 65px
            rgba(0,0,0,.13);
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

          color: #00a8d6;

          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
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
          color: #00bce7;
        }

        /* ======================================================
           PLANS
        ====================================================== */

        .antimate-plans-section {
          background:
            linear-gradient(
              180deg,
              transparent,
              rgba(0,217,255,.025),
              transparent
            );
        }

        .antimate-plan-card:hover {
          transform: translateY(-7px);
          border-color: rgba(0,217,255,.28);
          box-shadow:
            0 18px 50px
            rgba(0,0,0,.11);
        }

        .antimate-plan-card h3 {
          margin: 0;
          font-size: 21px;
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
        }

        /* ======================================================
           SUPPORT
        ====================================================== */

        .antimate-support-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
          grid-template-columns: repeat(3, 1fr);
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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

          background:
            linear-gradient(
              135deg,
              rgba(0,217,255,.08),
              rgba(37,99,235,.07),
              rgba(124,58,237,.06)
            );
        }

        .join-content {
          max-width: 720px;
          margin: 0 auto;
        }

        .join-content > svg {
          color: #00bce7;
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

        .antimate-ai-float-login {
          position: fixed;

          right: 20px;
          bottom: 22px;

          width: 64px;
          height: 64px;

          z-index: 99989;

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
          opacity: .6;

          z-index: -2;
        }

        .antimate-ai-ring-login {
          position: absolute;
          inset: 0;

          border-radius: 50%;
          overflow: hidden;

          background: #0b1220;

          box-shadow:
            0 10px 28px rgba(0,0,0,.28),
            0 0 22px rgba(0,217,255,.18);
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
              rgba(0,217,255,.16),
              transparent 45%
            ),
            #0f172a;
        }

        .antimate-ai-text-login {
          position: relative;
          z-index: 3;

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
            1px solid
            rgba(127,127,127,.13);

          background:
            rgba(127,127,127,.025);
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
            rgba(3,8,18,.66);

          backdrop-filter: blur(9px);
        }

        .login-modal {
          position: relative;

          width: min(100%, 430px);

          padding: 35px;

          border-radius: 25px;

          background: #fff;
          color: #111827;

          border:
            1px solid
            rgba(255,255,255,.22);

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
          border-radius: 10px;

          background:
            rgba(127,127,127,.08);

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
            rgba(0,0,0,.12);

          border-radius: 11px;

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
          border-radius: 9px;

          background: transparent;

          color: #64748b;
          cursor: pointer;
        }

        .login-error {
          margin-bottom: 14px;
          padding: 11px 12px;

          border-radius: 10px;

          color: #b91c1c;

          background:
            rgba(239,68,68,.08);

          border:
            1px solid
            rgba(239,68,68,.15);

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
          border-radius: 11px;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );

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

          font-size: 12px;
        }

        .modal-bottom a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 750;
        }

        /* ======================================================
           DARK MODAL SUPPORT
        ====================================================== */

        .dark .login-modal {
          color: #f8fafc;
          background: #0f172a;
          border:
            1px solid
            rgba(255,255,255,.09);
        }

        .dark .close-modal {
          color: #f8fafc;
          background:
            rgba(255,255,255,.07);
        }

        .dark .input-group input {
          color: #f8fafc;
          background: #111c2e;
          border:
            1px solid
            rgba(255,255,255,.1);
        }

        /* ======================================================
           THEME / READABILITY
        ====================================================== */

        .login-page.light {
          --text-main: #0f172a;
          --text-muted: #475569;
          --text-soft: #64748b;
          --surface: rgba(255,255,255,.82);
          --surface-soft: rgba(248,250,252,.92);
          --border: rgba(15,23,42,.12);
        }

        .login-page.dark {
          --text-main: #f8fafc;
          --text-muted: #cbd5e1;
          --text-soft: #94a3b8;
          --surface: rgba(15,23,42,.72);
          --surface-soft: rgba(15,23,42,.9);
          --border: rgba(255,255,255,.12);
        }

        .login-page .hero-description,
        .login-page .antimate-about-description,
        .login-page .vision-content > p,
        .login-page .antimate-section-subtitle,
        .login-page .feature-card p,
        .login-page .antimate-system-card p,
        .login-page .antimate-about-mini p,
        .login-page .antimate-support-card p,
        .login-page .join-content p {
          color: var(--text-muted);
          opacity: 1;
        }

        .login-page .antimate-team-department,
        .login-page .antimate-contact-item span,
        .login-page .footer-info,
        .login-page .login-footer p,
        .login-page .modal-subtitle,
        .login-page .antimate-faq-answer p {
          color: var(--text-soft);
          opacity: 1;
        }

        .login-page .navigation > a,
        .login-page .brand span,
        .login-page .animated-words span,
        .login-page .hero-trust div {
          color: var(--text-muted);
          opacity: 1;
        }

        .login-page .feature-card,
        .login-page .antimate-system-card,
        .login-page .antimate-about-mini,
        .login-page .antimate-team-card,
        .login-page .antimate-faq-item,
        .login-page .antimate-contact-strip,
        .login-page .animated-words span,
        .login-page .antimate-company-badge {
          border-color: var(--border);
        }

        .login-page.dark .nav-login {
          color: #60a5fa;
          border-color: rgba(96,165,250,.3);
        }

        .login-page.dark .secondary-button,
        .login-page.dark .language-button,
        .login-page.dark .theme-button,
        .login-page.dark .mobile-menu-button {
          color: #e2e8f0;
        }

        .login-page.light .nav-login {
          color: #1d4ed8;
        }

        .login-page.light .section-heading h2,
        .login-page.light .antimate-section-title,
        .login-page.light .vision-content h2,
        .login-page.light .join-content h2,
        .login-page.light .feature-card h3,
        .login-page.light .antimate-system-card h3,
        .login-page.light .antimate-team-card h3,
        .login-page.light .antimate-faq-question {
          color: #0f172a;
        }

        .login-page.dark .section-heading h2,
        .login-page.dark .antimate-section-title,
        .login-page.dark .vision-content h2,
        .login-page.dark .join-content h2,
        .login-page.dark .feature-card h3,
        .login-page.dark .antimate-system-card h3,
        .login-page.dark .antimate-team-card h3,
        .login-page.dark .antimate-faq-question {
          color: #f8fafc;
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

          .antimate-system-grid {
            grid-template-columns: repeat(2, 1fr);
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

            border-radius: 17px;

            background:
              rgba(255,255,255,.97);

            border:
              1px solid
              rgba(127,127,127,.16);

            box-shadow:
              0 20px 50px
              rgba(0,0,0,.13);
          }

          .dark .navigation {
            background:
              rgba(7,17,31,.98);
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
            border-radius: 23px;
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

          .antimate-contact-strip {
            grid-template-columns: 1fr;
          }

          .vision-image {
            height: 300px;
          }

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

          .login-modal {
            padding: 28px 21px;
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
        <div className="background-orb orb-one" />
        <div className="background-orb orb-two" />

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

            <div className="knowledge-nav-wrapper">
              <button
                type="button"
                className="nav-login"
                onClick={openKnowledgeCenter}
              >
                <BookOpen size={14} />
                {t.knowledge}
              </button>
            </div>

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
                <span>
                  Connect.
                </span>

                <span>
                  Understand.
                </span>

                <span>
                  Automate.
                </span>

                <span>
                  Build the future.
                </span>
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
              <div className="visual-glow" />

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
                  <span>ANTIMATE Link</span>
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
            <div className="antimate-public-container">
              <div className="antimate-section-label">
                <Layers size={16} />
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
                  <Cloud size={18} />
                  <span>
                    Reliable cloud services
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