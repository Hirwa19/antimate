import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import {
  ArrowRight,
  Brain,
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
  Smartphone,
  Bot,
  ArrowUpRight,
  Database,
  Network,
  Layers,
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
        "ANTIMATE ihuza systems, devices n'abakoresha kugira ngo amakuru abashe kugenda neza kandi yizewe.",

      feature2Title: "Understand",
      feature2Text:
        "Data ikusanywa kandi igatunganywa kugira ngo ibe amakuru ashobora gusobanuka no gukoreshwa.",

      feature3Title: "Intelligence",
      feature3Text:
        "Artificial Intelligence ifasha gusobanura data, gutanga recommendations no gufasha abakoresha.",

      visionTitle:
        "Kubaka ikoranabuhanga rishobora gukorera ahantu hatandukanye",

      visionText:
        "ANTIMATE yubaka solutions zihuza devices, communication, data na Artificial Intelligence. Technology yayo ishobora gukoreshwa mu bworozi, agriculture, monitoring, automation n'izindi domains.",

      systemsTitle: "ANTIMATE Systems",
      systemsSubtitle:
        "BR Systems zacu zagenewe gukemura ibibazo bitandukanye by'abakoresha.",

      system300: "BR System 300",
      system300Text:
        "Solution yagenewe ibikorwa bito n'ibiciriritse bifite capacity igera ku nkoko 300.",

      system750: "BR System 750",
      system750Text:
        "Solution yagenewe ibikorwa bifite capacity igera ku nkoko 750 kandi bikenera control n'imicungire yagutse.",

      system1000: "BR System 1000",
      system1000Text:
        "Solution yagenewe ibikorwa binini bigera ku nkoko 1,000 kandi bikenera monitoring n'ubushobozi bwagutse.",

      plansTitle: "Systems & Pricing",
      plansSubtitle:
        "Hitamo BR System ijyanye n'ubushobozi bw'igikorwa cyawe, hanyuma uhitemo plan ijyanye n'imikoreshereze yawe.",

      free: "Free",
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      month: "/ ukwezi",

      freeDescription:
        "System ikora standalone hamwe na Phone App ifite Local AI.",
      basicDescription:
        "Features za Free hamwe na notifications na dashboards.",
      proDescription:
        "Monitoring, analysis, SMS na AI assistance byagutse.",
      premiumDescription:
        "Experience yuzuye irimo analysis, history, AI na reports zihariye.",

      choosePlan: "Hitamo iyi plan",

      freeFeatures: [
        "Full system standalone features",
        "Phone App",
        "Local AI",
      ],

      basicFeatures: [
        "All Free features",
        "APP notification",
        "Dashboard",
        "Weekly Analysis",
        "Weekly History",
      ],

      proFeatures: [
        "All Free features",
        "APP notification",
        "Dashboard",
        "Monthly Analysis",
        "Monthly History",
        "Phone SMS notification",
        "Full modular AI Features",
        "AI recommendations",
        "AI Assistance",
        "Monthly Report",
      ],

      premiumFeatures: [
        "All Free features",
        "APP notification",
        "Dashboard",
        "Full Analysis",
        "Full History",
        "Phone SMS notification",
        "Customized Report",
        "Full AI Features",
        "AI recommendations",
        "AI Assistance",
      ],

      installation:
        "Installation & Delivery: Ubuntu / Free",

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
      teamData: "BERTIN",
      teamNetwork: "ANTIMATE Network & Communication",
      teamSystem: "MUGISHA Prince",
      teamNoella: "NOELLA",
      teamKwizera: "KWIZERA J. Bosco",
      teamBusiness: "MUGISHA Steven",

      dataDepartment: "Data Management",
      marketingDepartment: "Marketing",
      networkDepartment: "Network & Communication",
      systemDepartment: "System Development",

      faqTitle: "Ibibazo bikunze kubazwa",

      faq1Q: "ANTIMATE ikora iki?",
      faq1A:
        "ANTIMATE yubaka technology solutions zihuza systems, devices, communication, data na AI kugira ngo ifashe abantu n'ibikorwa gukoresha technology neza.",

      faq2Q: "BR System ni iki?",
      faq2A:
        "BR System ni solution ya ANTIMATE igenewe ibikorwa by'ubworozi bw'inkoko. Hari BR System 300, BR System 750 na BR System 1000 bitewe na capacity y'igikorwa.",

      faq3Q: "Nshobora gutangira nta mafaranga?",
      faq3A:
        "Yego. Free plan itanga full system standalone features hamwe na Phone App ifite Local AI.",

      faq4Q: "Installation na delivery birishyurwa?",
      faq4A:
        "Oya. Installation na delivery bya BR System ni Ubuntu / Free.",

      faq5Q: "Ni gute ninjiye muri ANTIMATE?",
      faq5A:
        "Umaze gukora login, ANTIMATE izakujyana mu environment ijyanye na account yawe n'ibikorwa ukoresha.",

      joinTitle: "Witeguye gutangira?",
      joinText:
        "Injira muri ANTIMATE uhitemo solution ijyanye n'ibyo ushaka gukora.",

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

      selectionTitle: "Hitamo ANTIMATE System",
      selectionSubtitle:
        "Ni hehe ushaka kujya nyuma yo kwinjira?",

      edgeTitle: "ANTIMATE Home",
      edgeDescription:
        "Jya muri environment ya ANTIMATE aho ucunga systems, devices na monitoring.",

      edgeButton: "Jya kuri Home",

      linkTitle: "ANTIMATE Link",
      linkDescription:
        "Jya muri Link environment aho ucunga communication na developer services.",

      linkButton: "Jya kuri Link",

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
        "ANTIMATE connects systems, devices and users so information can move reliably between them.",

      feature2Title: "Understand",
      feature2Text:
        "Data is collected and processed into useful information that can be understood and acted upon.",

      feature3Title: "Intelligence",
      feature3Text:
        "Artificial Intelligence helps interpret data, provide recommendations and assist users.",

      visionTitle:
        "Building technology that can work across different environments",

      visionText:
        "ANTIMATE builds solutions connecting devices, communication, data and Artificial Intelligence. Its technology can support farming, agriculture, monitoring, automation and other domains.",

      systemsTitle: "ANTIMATE Systems",
      systemsSubtitle:
        "Our BR Systems are designed for different operational capacities.",

      system300: "BR System 300",
      system300Text:
        "A solution designed for small and medium poultry operations with a capacity of up to 300 chicks.",

      system750: "BR System 750",
      system750Text:
        "A solution designed for poultry operations with a capacity of up to 750 chicks and broader control requirements.",

      system1000: "BR System 1000",
      system1000Text:
        "A solution designed for larger poultry operations with a capacity of up to 1,000 chicks and expanded monitoring.",

      plansTitle: "Systems & Pricing",
      plansSubtitle:
        "Choose the BR System that fits your operation, then select the plan that matches your service requirements.",

      free: "Free",
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      month: "/ month",

      freeDescription:
        "Standalone system features with a Phone App and Local AI.",
      basicDescription:
        "Everything in Free with notifications, dashboard and weekly insights.",
      proDescription:
        "Broader monitoring, SMS, AI assistance, analysis and reports.",
      premiumDescription:
        "Full analysis, history, AI capabilities and customized reports.",

      choosePlan: "Choose this plan",

      freeFeatures: [
        "Full system standalone features",
        "Phone App",
        "Local AI",
      ],

      basicFeatures: [
        "All Free features",
        "APP notification",
        "Dashboard",
        "Weekly Analysis",
        "Weekly History",
      ],

      proFeatures: [
        "All Free features",
        "APP notification",
        "Dashboard",
        "Monthly Analysis",
        "Monthly History",
        "Phone SMS notification",
        "Full modular AI Features",
        "AI recommendations",
        "AI Assistance",
        "Monthly Report",
      ],

      premiumFeatures: [
        "All Free features",
        "APP notification",
        "Dashboard",
        "Full Analysis",
        "Full History",
        "Phone SMS notification",
        "Customized Report",
        "Full AI Features",
        "AI recommendations",
        "AI Assistance",
      ],

      installation:
        "Installation & Delivery: Free",

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
      teamData: "BERTIN",
      teamNetwork: "ANTIMATE Network & Communication",
      teamSystem: "MUGISHA Prince",
      teamNoella: "NOELLA",
      teamKwizera: "KWIZERA J. Bosco",
      teamBusiness: "MUGISHA Steven",

      dataDepartment: "Data Management",
      marketingDepartment: "Marketing",
      networkDepartment: "Network & Communication",
      systemDepartment: "System Development",

      faqTitle: "Frequently asked questions",

      faq1Q: "What does ANTIMATE do?",
      faq1A:
        "ANTIMATE builds technology solutions connecting systems, devices, communication, data and AI to help people and businesses use technology effectively.",

      faq2Q: "What is a BR System?",
      faq2A:
        "A BR System is an ANTIMATE solution designed for poultry operations. The available systems are BR System 300, BR System 750 and BR System 1000.",

      faq3Q: "Can I start for free?",
      faq3A:
        "Yes. The Free plan provides full standalone system features together with a Phone App and Local AI.",

      faq4Q: "Is installation and delivery charged?",
      faq4A:
        "No. Installation and delivery for BR Systems are free.",

      faq5Q: "What happens after I log in?",
      faq5A:
        "After login, ANTIMATE takes you to the environment associated with your account and the services you use.",

      joinTitle: "Ready to get started?",
      joinText:
        "Sign in to ANTIMATE and choose the solution that matches your needs.",

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

      selectionTitle: "Choose an ANTIMATE System",
      selectionSubtitle:
        "Where would you like to go after signing in?",

      edgeTitle: "ANTIMATE Home",
      edgeDescription:
        "Go to the ANTIMATE environment to manage systems, devices and monitoring.",

      edgeButton: "Go to Home",

      linkTitle: "ANTIMATE Link",
      linkDescription:
        "Go to the Link environment to manage communication and developer services.",

      linkButton: "Go to Link",

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

  const goToEdge = () => {
    setShowSystemSelection(false);
    navigate("/home");
  };

  const goToLink = () => {
    setShowSystemSelection(false);
    navigate("/link/projects");
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
     BR SYSTEMS
  ========================================================== */

  const systems = [
    {
      icon: Cpu,
      name: t.system300,
      text: t.system300Text,
    },
    {
      icon: Activity,
      name: t.system750,
      text: t.system750Text,
    },
    {
      icon: BarChart3,
      name: t.system1000,
      text: t.system1000Text,
    },
  ];

  /* ==========================================================
     PRICING
  ========================================================== */

  const planFeatures = {
    [t.free]: t.freeFeatures,
    [t.basic]: t.basicFeatures,
    [t.pro]: t.proFeatures,
    [t.premium]: t.premiumFeatures,
  };

  const systemPlans = [
    {
      system: t.system300,
      capacity:
        language === "rw"
          ? "Kugeza ku nkoko 300"
          : "Up to 300 chicks",
      plans: [
        {
          name: t.free,
          price: "0 FRW",
          description: t.freeDescription,
        },
        {
          name: t.basic,
          price: "3,000 FRW",
          description: t.basicDescription,
        },
        {
          name: t.pro,
          price: "5,000 FRW",
          description: t.proDescription,
        },
        {
          name: t.premium,
          price: "7,000 FRW",
          description: t.premiumDescription,
        },
      ],
    },
    {
      system: t.system750,
      capacity:
        language === "rw"
          ? "Kugeza ku nkoko 750"
          : "Up to 750 chicks",
      plans: [
        {
          name: t.free,
          price: "0 FRW",
          description: t.freeDescription,
        },
        {
          name: t.basic,
          price: "5,000 FRW",
          description: t.basicDescription,
        },
        {
          name: t.pro,
          price: "8,000 FRW",
          description: t.proDescription,
        },
        {
          name: t.premium,
          price: "11,000 FRW",
          description: t.premiumDescription,
        },
      ],
    },
    {
      system: t.system1000,
      capacity:
        language === "rw"
          ? "Kugeza ku nkoko 1,000"
          : "Up to 1,000 chicks",
      plans: [
        {
          name: t.free,
          price: "0 FRW",
          description: t.freeDescription,
        },
        {
          name: t.basic,
          price: "8,000 FRW",
          description: t.basicDescription,
        },
        {
          name: t.pro,
          price: "12,000 FRW",
          description: t.proDescription,
        },
        {
          name: t.premium,
          price: "15,000 FRW",
          description: t.premiumDescription,
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
      department: t.dataDepartment,
    },
    {
      icon: Wifi,
      name: t.teamNetwork,
      role: t.cio,
      department: t.networkDepartment,
    },
    {
      icon: Cpu,
      name: t.teamSystem,
      role: t.cto,
      department: t.systemDepartment,
    },
    {
      icon: TrendingUp,
      name: t.teamNoella,
      role: t.cmo,
      department: t.marketingDepartment,
    },
    {
      icon: TrendingUp,
      name: t.teamKwizera,
      role: t.cmo,
      department: t.marketingDepartment,
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
          color: #111827;
          background: #ffffff;
          overflow-x: hidden;
        }

        .login-page.dark {
          color: #f1f5f9;
          background: #080d16;
        }

        /* ======================================================
           GLOBAL TEXT CONTRAST
        ====================================================== */

        .login-page h1,
        .login-page h2,
        .login-page h3,
        .login-page h4,
        .login-page p,
        .login-page span,
        .login-page strong {
          text-rendering: optimizeLegibility;
        }

        .dark .hero-content h1,
        .dark .hero-content h1 span,
        .dark .antimate-section-title,
        .dark .section-heading h2,
        .dark .vision-content h2,
        .dark .join-content h2 {
          color: #f8fafc;
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

          border-bottom: 1px solid #e5e7eb;

          background: #ffffff;
        }

        .dark .login-navbar {
          background: #080d16;
          border-color: #1e293b;
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

          border: 1px solid #dbe1e8;
          border-radius: 10px;

          background: #f8fafc;
          color: inherit;

          cursor: pointer;
        }

        .dark .language-button,
        .dark .theme-button,
        .dark .mobile-menu-button {
          border-color: #273449;
          background: #101827;
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
          color: #1d4ed8;
          background: transparent;
          border: 1px solid #bfdbfe;
        }

        .dark .nav-login {
          color: #60a5fa;
          border-color: #29456d;
        }

        .nav-signup {
          color: #ffffff;
          background: #2563eb;
          border: 1px solid #2563eb;
        }

        /* ======================================================
           MAIN
        ====================================================== */

        main {
          position: relative;
          z-index: 1;
          padding-top: 74px;
        }

        /* ======================================================
           HERO
        ====================================================== */

        .hero-section {
          min-height: 700px;
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
          padding: 8px 12px;

          border-radius: 8px;

          color: #0369a1;
          background: #effbff;
          border: 1px solid #c9f2fb;

          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .dark .hero-badge {
          color: #67e8f9;
          background: #0b2029;
          border-color: #164653;
        }

        .antimate-company-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          margin-bottom: 24px;
          padding: 7px 11px;

          border-radius: 8px;

          background: #f8fafc;
          border: 1px solid #e2e8f0;

          font-size: 10px;
          font-weight: 800;
          opacity: .78;
        }

        .dark .antimate-company-badge {
          background: #101827;
          border-color: #243247;
        }

        .antimate-company-badge svg {
          color: #0891b2;
        }

        .hero-content h1 {
          margin: 0;

          max-width: 750px;

          color: #0f172a;

          font-size: clamp(42px, 6vw, 76px);
          line-height: 1.02;
          letter-spacing: -4px;
        }

        .hero-content h1 span {
          display: inline;
          color: #1d4ed8;
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

          border-radius: 7px;

          background: #f8fafc;
          border: 1px solid #e2e8f0;

          color: #475569;

          font-size: 10px;
          font-weight: 750;
        }

        .dark .animated-words span {
          background: #101827;
          border-color: #263449;
          color: #cbd5e1;
        }

        .hero-description {
          max-width: 650px;
          margin: 24px 0 0;

          color: #475569;

          font-size: 17px;
          line-height: 1.8;
        }

        .dark .hero-description {
          color: #cbd5e1;
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

          border-radius: 10px;

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

        .primary-button:hover {
          background: #1d4ed8;
        }

        .secondary-button {
          color: inherit;

          border: 1px solid #d1d9e2;
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

          color: #64748b;

          font-size: 11px;
          font-weight: 700;
        }

        .dark .hero-trust div {
          color: #94a3b8;
        }

        .hero-trust svg {
          color: #0891b2;
        }

        /* ======================================================
           HERO VISUAL
        ====================================================== */

        .hero-visual {
          position: relative;

          min-height: 500px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .visual-glow {
          display: none;
        }

        .farm-image {
          position: relative;

          width: min(100%, 470px);
          height: 420px;

          overflow: hidden;

          border-radius: 20px;
          border: 1px solid #dbe4ec;

          box-shadow: 0 20px 55px rgba(15, 23, 42, .12);

          transform: rotate(1deg);
        }

        .dark .farm-image {
          border-color: #273449;
          box-shadow: 0 20px 55px rgba(0, 0, 0, .35);
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

          border-radius: 11px;

          background: #ffffff;
          border: 1px solid #dbe4ec;

          box-shadow: 0 12px 30px rgba(15, 23, 42, .14);
        }

        .dark .floating-card {
          background: #101827;
          border-color: #2a394d;
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

          border-radius: 9px;

          color: #0891b2;
          background: #ecfeff;
        }

        .dark .floating-icon,
        .dark .ai-icon {
          background: #0d2830;
          color: #67e8f9;
        }

        .floating-card span {
          display: block;

          color: #64748b;

          font-size: 9px;
        }

        .dark .floating-card span {
          color: #94a3b8;
        }

        .floating-card strong {
          display: block;
          margin-top: 3px;

          font-size: 12px;
        }

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid #cbd5e1;
        }

        .dark .floating-circle {
          border-color: #334155;
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
           GENERAL SECTIONS
        ====================================================== */

        .features-section,
        .antimate-public-section {
          max-width: 1250px;
          margin: 0 auto;
          padding: 100px 7%;
        }

        .section-heading {
          max-width: 700px;
          margin-bottom: 40px;
        }

        .section-heading span,
        .antimate-section-label,
        .small-heading {
          color: #0369a1;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .dark .section-heading span,
        .dark .antimate-section-label,
        .dark .small-heading {
          color: #67e8f9;
        }

        .section-heading h2 {
          margin: 10px 0 0;

          color: #0f172a;

          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.1;
          letter-spacing: -1.8px;
        }

        .dark .section-heading h2 {
          color: #f8fafc;
        }

        /* ======================================================
           FEATURES
        ====================================================== */

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .feature-card {
          padding: 28px;

          border: 1px solid #e2e8f0;
          border-radius: 16px;

          background: #ffffff;
        }

        .dark .feature-card {
          background: #0d1420;
          border-color: #253246;
        }

        .feature-icon {
          width: 46px;
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 20px;

          border-radius: 10px;

          color: #0369a1;
          background: #ecfeff;
        }

        .dark .feature-icon {
          color: #67e8f9;
          background: #0c2932;
        }

        .feature-card h3 {
          margin: 0 0 10px;
          font-size: 19px;
        }

        .feature-card p {
          margin: 0;

          color: #64748b;

          font-size: 14px;
          line-height: 1.7;
        }

        .dark .feature-card p {
          color: #aebdce;
        }

        .feature-line {
          width: 34px;
          height: 2px;

          margin-top: 22px;

          background: #0ea5e9;
        }

        /* ======================================================
           SECTION HEADINGS
        ====================================================== */

        .antimate-section-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
        }

        .antimate-section-title {
          max-width: 760px;
          margin: 0;

          color: #0f172a;

          font-size: clamp(30px, 4vw, 52px);
          line-height: 1.08;
          letter-spacing: -1.8px;
        }

        .antimate-section-subtitle {
          max-width: 720px;
          margin: 18px 0 0;

          color: #64748b;

          font-size: 16px;
          line-height: 1.75;
        }

        .dark .antimate-section-title {
          color: #f8fafc;
        }

        .dark .antimate-section-subtitle {
          color: #aebdce;
        }

        /* ======================================================
           BR SYSTEMS
        ====================================================== */

        .antimate-system-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));

          gap: 18px;

          margin-top: 45px;
        }

        .antimate-system-card {
          padding: 30px;

          border: 1px solid #dfe7ef;
          border-radius: 16px;

          background: #ffffff;

          transition:
            transform .2s ease,
            border-color .2s ease;
        }

        .dark .antimate-system-card {
          background: #0d1420;
          border-color: #273449;
        }

        .antimate-system-card:hover {
          transform: translateY(-4px);
          border-color: #93c5fd;
        }

        .dark .antimate-system-card:hover {
          border-color: #3b82f6;
        }

        .antimate-system-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 20px;

          border-radius: 10px;

          color: #2563eb;
          background: #eff6ff;
        }

        .dark .antimate-system-icon {
          color: #60a5fa;
          background: #12243c;
        }

        .antimate-system-card h3 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .antimate-system-card p {
          margin: 0;

          color: #64748b;

          line-height: 1.7;
          font-size: 14px;
        }

        .dark .antimate-system-card p {
          color: #aebdce;
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
          margin-top: 25px;

          color: #475569;

          font-size: 18px;
          line-height: 1.85;
        }

        .dark .antimate-about-description {
          color: #c3cfdd;
        }

        .antimate-definition {
          margin-top: 27px;
          padding: 22px 24px;

          border-left: 3px solid #0ea5e9;

          background: #f8fafc;
        }

        .dark .antimate-definition {
          background: #101827;
        }

        .antimate-definition strong {
          display: block;
          margin-bottom: 8px;

          font-size: 14px;
          color: #0369a1;
        }

        .dark .antimate-definition strong {
          color: #67e8f9;
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

          border: 1px solid #e2e8f0;
          border-radius: 14px;

          background: #ffffff;
        }

        .dark .antimate-about-mini {
          background: #0d1420;
          border-color: #263449;
        }

        .antimate-about-mini svg {
          color: #0891b2;
          margin-bottom: 15px;
        }

        .antimate-about-mini h4 {
          margin: 0 0 7px;
          font-size: 16px;
        }

        .antimate-about-mini p {
          margin: 0;

          color: #64748b;

          font-size: 13px;
          line-height: 1.6;
        }

        .dark .antimate-about-mini p {
          color: #aebdce;
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

          border: 1px solid #e2e8f0;

          box-shadow: 0 20px 50px rgba(15, 23, 42, .10);
        }

        .dark .vision-image {
          border-color: #273449;
          box-shadow: 0 20px 50px rgba(0, 0, 0, .35);
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

          color: #0f172a;

          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.08;
          letter-spacing: -1.7px;
        }

        .vision-content > p {
          margin: 0;

          color: #64748b;

          font-size: 16px;
          line-height: 1.8;
        }

        .dark .vision-content > p {
          color: #aebdce;
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
          color: #0891b2;
        }

        /* ======================================================
           PRICING
        ====================================================== */

        .antimate-plans-section {
          border-top: 1px solid #eef2f7;
          border-bottom: 1px solid #eef2f7;
        }

        .dark .antimate-plans-section {
          border-color: #1b2738;
        }

        .system-pricing-block {
          margin-top: 52px;
        }

        .system-pricing-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 20px;

          padding-bottom: 17px;

          border-bottom: 1px solid #dfe7ef;
        }

        .dark .system-pricing-header {
          border-color: #273449;
        }

        .system-pricing-header h3 {
          margin: 0;

          color: #0f172a;

          font-size: 24px;
          letter-spacing: -.5px;
        }

        .dark .system-pricing-header h3 {
          color: #f8fafc;
        }

        .system-capacity {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }

        .dark .system-capacity {
          color: #94a3b8;
        }

        .system-pricing-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;

          margin-top: 18px;
        }

        .antimate-plan-card {
          position: relative;

          padding: 24px 21px;

          border: 1px solid #dfe7ef;
          border-radius: 14px;

          background: #ffffff;
        }

        .dark .antimate-plan-card {
          background: #0d1420;
          border-color: #273449;
        }

        .antimate-plan-card.pro-plan {
          border-color: #60a5fa;
        }

        .antimate-plan-card.premium-plan {
          border-color: #64748b;
        }

        .antimate-plan-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .antimate-plan-card h4 {
          margin: 0;
          font-size: 18px;
        }

        .plan-status {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .8px;
          color: #2563eb;
        }

        .dark .plan-status {
          color: #60a5fa;
        }

        .antimate-plan-price {
          margin-top: 14px;

          color: #0f172a;

          font-size: 28px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .dark .antimate-plan-price {
          color: #f8fafc;
        }

        .antimate-plan-month {
          display: block;
          margin-top: 2px;

          color: #64748b;

          font-size: 11px;
        }

        .dark .antimate-plan-month {
          color: #94a3b8;
        }

        .antimate-plan-description {
          min-height: 55px;
          margin: 15px 0 19px;

          color: #64748b;

          font-size: 12px;
          line-height: 1.6;
        }

        .dark .antimate-plan-description {
          color: #aebdce;
        }

        .antimate-plan-features {
          list-style: none;

          padding: 0;
          margin: 0 0 20px;

          display: grid;
          gap: 9px;
        }

        .antimate-plan-features li {
          display: flex;
          gap: 8px;
          align-items: flex-start;

          color: #475569;

          font-size: 11px;
          line-height: 1.45;
        }

        .dark .antimate-plan-features li {
          color: #cbd5e1;
        }

        .antimate-plan-features svg {
          flex-shrink: 0;
          margin-top: 1px;

          color: #0891b2;
        }

        .antimate-plan-button {
          width: 100%;
          min-height: 40px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          border: 1px solid #2563eb;
          border-radius: 9px;

          cursor: pointer;

          color: #ffffff;
          background: #2563eb;

          font-weight: 800;
          font-size: 11px;
        }

        .antimate-plan-button:hover {
          background: #1d4ed8;
        }

        .installation-note {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-top: 15px;

          color: #047857;

          font-size: 11px;
          font-weight: 800;
        }

        .dark .installation-note {
          color: #6ee7b7;
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

          border: 1px solid #e2e8f0;
          border-radius: 14px;

          background: #ffffff;
        }

        .dark .antimate-support-card {
          background: #0d1420;
          border-color: #263449;
        }

        .antimate-support-icon {
          width: 46px;
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          color: #0891b2;
          background: #ecfeff;

          margin-bottom: 17px;
        }

        .dark .antimate-support-icon {
          color: #67e8f9;
          background: #0c2932;
        }

        .antimate-support-card h3 {
          margin: 0 0 9px;
          font-size: 17px;
        }

        .antimate-support-card p {
          min-height: 55px;
          margin: 0 0 17px;

          color: #64748b;

          font-size: 13px;
          line-height: 1.65;
        }

        .dark .antimate-support-card p {
          color: #aebdce;
        }

        .antimate-support-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          border: 0;
          background: transparent;

          color: #0369a1;

          font-size: 12px;
          font-weight: 850;

          cursor: pointer;
          padding: 0;
        }

        .dark .antimate-support-button {
          color: #67e8f9;
        }

        /* ======================================================
           CONTACT
        ====================================================== */

        .antimate-contact-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);

          gap: 15px;

          margin-top: 18px;
        }

        .antimate-contact-item {
          display: flex;
          align-items: center;
          gap: 14px;

          padding: 18px;

          border: 1px solid #e2e8f0;
          border-radius: 12px;

          background: #ffffff;
        }

        .dark .antimate-contact-item {
          background: #0d1420;
          border-color: #263449;
        }

        .antimate-contact-item svg {
          flex-shrink: 0;
          color: #0891b2;
        }

        .antimate-contact-item strong {
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
        }

        .antimate-contact-item span {
          color: #64748b;
          font-size: 12px;
        }

        .dark .antimate-contact-item span {
          color: #94a3b8;
        }

        /* ======================================================
           TEAM
        ====================================================== */

        .antimate-team-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));

          gap: 15px;

          margin-top: 42px;
        }

        .antimate-team-card {
          padding: 23px 19px;

          border: 1px solid #e2e8f0;
          border-radius: 14px;

          background: #ffffff;
        }

        .dark .antimate-team-card {
          background: #0d1420;
          border-color: #263449;
        }

        .antimate-team-avatar {
          width: 45px;
          height: 45px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          color: #0891b2;
          background: #ecfeff;

          margin-bottom: 15px;
        }

        .dark .antimate-team-avatar {
          color: #67e8f9;
          background: #0c2932;
        }

        .antimate-team-card h3 {
          margin: 0 0 5px;
          font-size: 15px;
        }

        .antimate-team-role {
          display: block;

          color: #0369a1;

          font-size: 11px;
          font-weight: 800;
          line-height: 1.4;
        }

        .dark .antimate-team-role {
          color: #60a5fa;
        }

        .antimate-team-department {
          display: block;
          margin-top: 8px;

          color: #64748b;

          font-size: 10px;
          line-height: 1.5;
        }

        .dark .antimate-team-department {
          color: #94a3b8;
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
          border: 1px solid #e2e8f0;
          border-radius: 12px;

          overflow: hidden;

          background: #ffffff;
        }

        .dark .antimate-faq-item {
          background: #0d1420;
          border-color: #263449;
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

          transition: max-height .3s ease;
        }

        .antimate-faq-item.open
        .antimate-faq-answer {
          max-height: 250px;
        }

        .antimate-faq-answer p {
          margin: 0;
          padding: 0 20px 20px;

          color: #64748b;

          font-size: 13px;
          line-height: 1.75;
        }

        .dark .antimate-faq-answer p {
          color: #aebdce;
        }

        /* ======================================================
           JOIN
        ====================================================== */

        .join-section {
          padding: 100px 7%;

          text-align: center;

          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;

          background: #f8fafc;
        }

        .dark .join-section {
          border-color: #1e293b;
          background: #0b111b;
        }

        .join-content {
          max-width: 720px;
          margin: 0 auto;
        }

        .join-content > svg {
          color: #0891b2;
        }

        .join-content h2 {
          margin: 15px 0 10px;

          color: #0f172a;

          font-size: clamp(32px, 4vw, 52px);
          letter-spacing: -2px;
        }

        .dark .join-content h2 {
          color: #f8fafc;
        }

        .join-content p {
          margin: 0 auto 25px;

          max-width: 600px;

          color: #64748b;

          line-height: 1.75;
        }

        .dark .join-content p {
          color: #aebdce;
        }

        /* ======================================================
           AI FLOAT
        ====================================================== */

        .antimate-ai-float-login {
          position: fixed;

          right: 20px;
          bottom: 22px;

          width: 62px;
          height: 62px;

          z-index: 99989;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          text-decoration: none;

          background: #0b1220;

          border: 2px solid #2563eb;

          box-shadow:
            0 10px 28px rgba(0, 0, 0, .25);
        }

        .antimate-ai-ring-login {
          position: absolute;
          inset: 0;

          border-radius: 50%;
        }

        .antimate-ai-inner-login {
          position: absolute;
          inset: 5px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #111827;
        }

        .antimate-ai-text-login {
          position: relative;
          z-index: 3;

          color: #ffffff;

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

          border-top: 1px solid #e2e8f0;

          background: #ffffff;
        }

        .dark .login-footer {
          border-color: #1e293b;
          background: #080d16;
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

          color: #64748b;

          font-size: 10px;
          line-height: 1.6;
        }

        .dark .login-footer p {
          color: #94a3b8;
        }

        .footer-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;

          margin-top: 12px;

          color: #64748b;

          font-size: 11px;
        }

        .dark .footer-info {
          color: #94a3b8;
        }

        /* ======================================================
           LOGIN MODAL
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

          background: rgba(3, 8, 18, .72);

          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .login-modal {
          position: relative;

          width: min(100%, 430px);

          padding: 35px;

          border-radius: 18px;

          background: #ffffff;
          color: #111827;

          border: 1px solid #dbe4ec;

          box-shadow: 0 30px 90px rgba(0, 0, 0, .28);
        }

        .dark .login-modal {
          background: #0f172a;
          color: #f8fafc;
          border-color: #29384c;
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

        .dark .close-modal {
          color: #f8fafc;
          background: #182334;
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

        .dark .modal-subtitle {
          color: #94a3b8;
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

          border: 1px solid #cbd5e1;
          border-radius: 9px;

          outline: none;

          color: #111827;
          background: #ffffff;
        }

        .dark .input-group input {
          color: #f8fafc;
          background: #111c2e;
          border-color: #334155;
        }

        .input-group input:focus {
          border-color: #2563eb;

          box-shadow:
            0 0 0 3px rgba(37, 99, 235, .09);
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
          border: 1px solid #fecaca;

          font-size: 12px;
          line-height: 1.5;
        }

        .dark .login-error {
          color: #fca5a5;
          background: #2b1519;
          border-color: #57232a;
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

          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;

          border-radius: 50%;

          animation: spin .7s linear infinite;
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

        .dark .modal-bottom {
          color: #94a3b8;
        }

        .modal-bottom a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 750;
        }

        /* ======================================================
           SYSTEM SELECTION
        ====================================================== */

        .system-selection-overlay {
          z-index: 100001;
        }

        .system-selection {
          width: min(100%, 760px);

          padding: 34px;

          border-radius: 18px;

          color: #111827;
          background: #ffffff;

          border: 1px solid #dbe4ec;

          box-shadow: 0 35px 100px rgba(0,0,0,.32);
        }

        .dark .system-selection {
          color: #f8fafc;
          background: #0f172a;
          border-color: #29384c;
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

          border-radius: 12px;

          background: #ecfeff;
        }

        .dark .system-selection-logo {
          background: #0c2932;
        }

        .system-selection-header h2 {
          margin: 0;

          font-size: 28px;
          letter-spacing: -1px;
        }

        .system-selection-header p {
          margin: 9px auto 0;

          max-width: 520px;

          color: #64748b;

          font-size: 13px;
          line-height: 1.65;
        }

        .dark .system-selection-header p {
          color: #94a3b8;
        }

        .system-selection-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .system-selection-card {
          position: relative;

          padding: 25px;

          border-radius: 14px;

          border: 1px solid #dbe4ec;

          background: #ffffff;

          text-align: left;

          cursor: pointer;

          transition:
            transform .2s ease,
            border-color .2s ease;
        }

        .dark .system-selection-card {
          border-color: #2a394d;
          background: #101827;
        }

        .system-selection-card:hover {
          transform: translateY(-4px);
          border-color: #60a5fa;
        }

        .system-selection-icon {
          width: 50px;
          height: 50px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 18px;

          border-radius: 11px;

          color: #2563eb;
          background: #eff6ff;
        }

        .dark .system-selection-icon {
          color: #60a5fa;
          background: #12243c;
        }

        .system-selection-card.link-card
        .system-selection-icon {
          color: #0891b2;
          background: #ecfeff;
        }

        .dark .system-selection-card.link-card
        .system-selection-icon {
          color: #67e8f9;
          background: #0c2932;
        }

        .system-selection-card h3 {
          margin: 0 0 9px;
          font-size: 20px;
        }

        .system-selection-card p {
          min-height: 68px;

          margin: 0 0 20px;

          color: #64748b;

          font-size: 13px;
          line-height: 1.65;
        }

        .dark .system-selection-card p {
          color: #aebdce;
        }

        .system-selection-action {
          display: flex;
          align-items: center;
          justify-content: space-between;

          color: #2563eb;

          font-size: 12px;
          font-weight: 850;
        }

        .link-card .system-selection-action {
          color: #0891b2;
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
           MOBILE
        ====================================================== */

        @media (max-width: 1100px) {
          .navigation {
            gap: 12px;
          }

          .navigation > a {
            font-size: 11px;
          }

          .system-pricing-grid {
            grid-template-columns: repeat(2, 1fr);
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

            border-radius: 14px;

            background: #ffffff;

            border: 1px solid #dbe4ec;

            box-shadow: 0 20px 50px rgba(0,0,0,.13);
          }

          .dark .navigation {
            background: #0d1420;
            border-color: #29384c;
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
            grid-template-columns: repeat(2, 1fr);
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
            border-radius: 17px;
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
            padding: 68px 5%;
          }

          .feature-grid,
          .antimate-system-grid,
          .system-pricing-grid,
          .antimate-support-grid,
          .antimate-team-grid {
            grid-template-columns: 1fr;
          }

          .antimate-about-panel {
            grid-template-columns: 1fr;
          }

          .system-pricing-header {
            align-items: flex-start;
            flex-direction: column;
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
            inset: 5px;
          }

          .antimate-ai-text-login {
            font-size: 16px;
          }

          .login-modal {
            padding: 28px 21px;
          }

          .system-selection {
            padding: 25px 18px;
            border-radius: 16px;
          }

          .system-selection-grid {
            grid-template-columns: 1fr;
          }

          .system-selection-card p {
            min-height: auto;
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
                  src="https://imgs.search.brave.com/oFIOI8B3e3CiRahWFss1Rmk_GoIHdQYRQDe0VzXRfFo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2U2Lzdi/LzI3L2U2N2IyNzcz/MDAwZDRiNWEwYmZj/ODU0NTI3OWEzMTk2/LmpwZw"
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
              BR SYSTEMS
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
          </section>

          {/* ====================================================
              VISION
          ==================================================== */}

          <section className="vision-section">
            <div className="vision-image">
              <img
                src="https://imgs.search.brave.com/to0ORuZPksH3kV3txoDiHk_wW9OGbUAIL2Nce0x5394/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvNTM2/MjAxMzgwL3Bob3Rv/L2EtYnJvb2Rlci1v/Zi15b3VuZy1iYWJ5/LWNoaWNrcy1pbnNp/ZGUtdGhlLXRoaWth/LXdvbWVuLXByaXNv/bi10aGUtcHJpc29u/LXByb2R1Y2VzLWdv/b2RzLWFuZC5qcGc_/cz02MTJ4NjEyJnc9/MCZrPTIwJmM9eG4w/cktsMEZLWm1yaTQ2/RlQ5NVBXeHpGN3E0/VzNqdTZHQ29Hdm9q/cVJpcz0"
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
                  <Network size={18} />
                  <span>
                    Connected systems
                  </span>
                </div>

                <div>
                  <Database size={18} />
                  <span>
                    Reliable data
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
              PLANS & PRICING
          ==================================================== */}

          <section
            id="plans"
            className="antimate-public-section antimate-plans-section"
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

            {systemPlans.map(
              (system, systemIndex) => (
                <div
                  className="system-pricing-block"
                  key={systemIndex}
                >
                  <div className="system-pricing-header">
                    <h3>
                      {system.system}
                    </h3>

                    <span className="system-capacity">
                      {system.capacity}
                    </span>
                  </div>

                  <div className="system-pricing-grid">
                    {system.plans.map(
                      (plan, planIndex) => {
                        const features =
                          planFeatures[
                            plan.name
                          ];

                        const isPro =
                          plan.name ===
                          t.pro;

                        const isPremium =
                          plan.name ===
                          t.premium;

                        return (
                          <div
                            key={planIndex}
                            className={`antimate-plan-card ${
                              isPro
                                ? "pro-plan"
                                : ""
                            } ${
                              isPremium
                                ? "premium-plan"
                                : ""
                            }`}
                          >
                            <div className="antimate-plan-top">
                              <h4>
                                {plan.name}
                              </h4>

                              {isPro && (
                                <span className="plan-status">
                                  PRO
                                </span>
                              )}

                              {isPremium && (
                                <span className="plan-status">
                                  FULL
                                </span>
                              )}
                            </div>

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
                              {
                                plan.description
                              }
                            </p>

                            <ul className="antimate-plan-features">
                              {features.map(
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
                                      {
                                        feature
                                      }
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

                  <div className="installation-note">
                    <Check size={14} />
                    {t.installation}
                  </div>
                </div>
              )
            )}
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
            SYSTEM SELECTION
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
                  onClick={goToEdge}
                >
                  <div className="system-selection-icon">
                    <Smartphone size={25} />
                  </div>

                  <h3>
                    {t.edgeTitle}
                  </h3>

                  <p>
                    {t.edgeDescription}
                  </p>

                  <div className="system-selection-action">
                    <span>
                      {t.edgeButton}
                    </span>

                    <ArrowRight size={17} />
                  </div>
                </button>

                <button
                  type="button"
                  className="system-selection-card link-card"
                  onClick={goToLink}
                >
                  <div className="system-selection-icon">
                    <Network size={25} />
                  </div>

                  <h3>
                    {t.linkTitle}
                  </h3>

                  <p>
                    {t.linkDescription}
                  </p>

                  <div className="system-selection-action">
                    <span>
                      {t.linkButton}
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