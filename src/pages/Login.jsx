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
  Check,
  Building2,
  Users,
  Headphones,
  Bot,
  Smartphone,
  ChevronDown,
  Star,
} from "lucide-react";
import "./Login.css";

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

  const [openPlan, setOpenPlan] = useState(null);

  // ============================================================
  // CONTENT
  // ============================================================

  const content = {
    rw: {
      navHome: "Ahabanza",
      navHow: "Uko ikora",
      navSystems: "Systems",
      navPlans: "Plans",
      navSupport: "Support",
      navTeam: "Ikipe",
      navVision: "Intego",

      knowledge: "Amakuru y’Ubworozi",
      trending: "TRENDING",

      login: "Injira",
      signup: "Tangira natwe",

      eyebrow: "UBWOROZI BW'IGIHE KIZAZA",

      title1: "Ubworozi bwiza",
      title2: "butangirira ku makuru meza.",

      description:
        "ANTIMATE ihuza ubworozi n’ikoranabuhanga kugira ngo ubashe kumenya uko ubworozi bwawe buhagaze, kubona amakuru y’ingenzi no gufata ibyemezo byiza ku gihe.",

      start: "Tangira natwe",
      learn: "Menya byinshi",

      live: "Amakuru y'igihe nyacyo",
      smart: "Ubworozi bw'ikoranabuhanga",

      featuresTitle:
        "Ikoranabuhanga rikora ku bworozi bwawe",

      feature1Title: "Kurikira ubworozi",
      feature1Text:
        "Reba uko ubushyuhe, ubuhehere n’ibindi bipimo by’ingenzi bihinduka mu gihe nyacyo.",

      feature2Title: "Menya ibibazo hakiri kare",
      feature2Text:
        "ANTIMATE igufasha kubona impinduka zishobora kugira ingaruka ku matungo yawe mbere y’uko ikibazo gikomera.",

      feature3Title: "Fata ibyemezo neza",
      feature3Text:
        "Amakuru asobanutse hamwe n’ubwenge buhangano bigufasha gukora igikwiye ku gihe.",

      systemsEyebrow: "ANTIMATE SYSTEMS",
      systemsTitle:
        "Ibikoresho na serivisi bigize ANTIMATE",

      systemsText:
        "ANTIMATE yubatswe kugira ngo igufashe kuva ku makuru y’ubworozi kugeza ku gufata ibyemezo, mu buryo bworoshye kandi bwumvikana.",

      system1Title: "ANTIMATE Smart Farm",
      system1Text:
        "Igufasha gukurikirana imikorere n’imiterere y’ubworozi bwawe ahantu hamwe.",

      system2Title: "ANTIMATE Connect",
      system2Text:
        "Ihuza ibikoresho byo mu bworozi n’urubuga rwa ANTIMATE kugira ngo amakuru agere aho uyakeneye.",

      system3Title: "ANTIMATE Cloud",
      system3Text:
        "Aho amakuru y’ubworozi abikwa kandi agatunganywa kugira ngo uyabone igihe uyakeneye.",

      system4Title: "ANTIMATE AI",
      system4Text:
        "Umufasha w’ubwenge ugufasha gusobanukirwa amakuru, kubaza ibibazo no kubona inama zijyanye n’ubworozi.",

      plansEyebrow: "ANTIMATE PLANS",
      plansTitle:
        "Hitamo gahunda ijyanye n’ubworozi bwawe",

      plansText:
        "Tangira ku buntu cyangwa uhitemo gahunda iguha ubushobozi bwisumbuyeho uko ubworozi bwawe bugenda bwaguka.",

      free: "Free",
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      perMonth: "/ ukwezi",

      freeDescription:
        "Ku muntu ushaka gutangira kumenya ANTIMATE.",

      basicDescription:
        "Ku bworozi buto cyangwa butangiye gukoresha ikoranabuhanga.",

      proDescription:
        "Ku mworozi ushaka gukurikirana ubworozi bwe ku rwego rwo hejuru.",

      premiumDescription:
        "Ku bworozi bunini n’abakoresha bakeneye ubushobozi bwagutse.",

      mostPopular: "IKUNZWE CYANE",
      choosePlan: "Hitamo iyi gahunda",
      contactUs: "Twandikire",

      supportEyebrow: "ANTIMATE SUPPORT",
      supportTitle:
        "Turi hano igihe cyose ukeneye ubufasha",

      supportText:
        "Niba ufite ikibazo, ushaka ibisobanuro cyangwa ushaka kumenya gahunda ikubereye, ushobora kutugeraho ukoresheje uburyo ubwo ari bwo bwose bugukwiriye.",

      aiSupport: "ANTIMATE AI",
      aiSupportText:
        "Baza ANTIMATE AI ibibazo byawe kandi ubone ubufasha ako kanya.",

      phoneSupport: "Telefone",
      phoneSupportText:
        "Tuvugishe kuri telefone ku bufasha cyangwa amakuru.",

      whatsappSupport: "WhatsApp",
      whatsappSupportText:
        "Twandikire kuri WhatsApp kandi tugufashe.",

      emailSupport: "Email",
      emailSupportText:
        "Ohereza ikibazo cyangwa ubutumwa kuri email yacu.",

      webChatSupport: "Web Chat Room",
      webChatSupportText:
        "Ganira n’ikipe ya ANTIMATE ukoresheje urubuga.",

      supportButton: "Vugana natwe",

      companyEyebrow: "ABOUT ANTIMATE",
      companyTitle:
        "Ikigo cyubaka ejo hazaza h’ubworozi",

      companyText:
        "ANTIMATE ni ikigo cy’ikoranabuhanga cyibanda ku gufasha aborozi kubona amakuru meza, gukoresha ikoranabuhanga mu buryo bworoshye no guteza imbere umusaruro w’ubworozi.",

      location: "Kigali, Rwanda",
      openDays: "Dufunguye iminsi yose",
      since: "Kuva ku wa 14 Mata 2026",

      teamEyebrow: "OUR TEAM",
      teamTitle:
        "Abantu bari inyuma ya ANTIMATE",

      teamText:
        "ANTIMATE yubatswe n’ikipe ifite inshingano zitandukanye, ihuriza hamwe ubuyobozi, ubwenge buhangano, ikoranabuhanga, amakuru, itumanaho n’iterambere ry’ubucuruzi.",

      ceo: "CEO — Chief Executive Officer",
      aiOfficer: "Chief AI Officer",
      dataOfficer: "Chief Data Officer",
      cio: "Chief Information Officer",
      cto: "Chief Technology Officer",
      cmo: "Chief Marketing Officer",
      cbo: "Chief Business Officer",

      visionTitle:
        "Duharanira ubworozi bwiza kandi bwunguka",

      visionText:
        "Duhuza ubworozi n’ikoranabuhanga kugira ngo umuhinzi cyangwa umworozi abashe gukora byinshi, mu buryo bworoshye, bwizewe kandi bushingiye ku makuru.",

      simpleTech: "Ikoranabuhanga ryoroshye",
      reliableInfo: "Amakuru yizewe",
      securePlatform: "Urubuga rufite umutekano",

      joinTitle: "Witeguye gutangira?",
      joinText:
        "Injira muri ANTIMATE maze utangire gukoresha ikoranabuhanga mu micungire y’ubworozi bwawe.",

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
        "ANTIMATE © 2026 • Ikoranabuhanga mu bworozi",
    },

    en: {
      navHome: "Home",
      navHow: "How it works",
      navSystems: "Systems",
      navPlans: "Plans",
      navSupport: "Support",
      navTeam: "Team",
      navVision: "Our vision",

      knowledge: "Poultry Knowledge",
      trending: "TRENDING",

      login: "Login",
      signup: "Join us",

      eyebrow: "THE FUTURE OF FARMING",

      title1: "Better farming",
      title2: "starts with better information.",

      description:
        "ANTIMATE connects farming with technology so you can understand your farm, access important information and make better decisions at the right time.",

      start: "Get started",
      learn: "Learn more",

      live: "Real-time insights",
      smart: "Smart farming",

      featuresTitle:
        "Technology that works for your farm",

      feature1Title: "Monitor your farm",
      feature1Text:
        "Track temperature, humidity and other important conditions in real time.",

      feature2Title: "Detect problems early",
      feature2Text:
        "ANTIMATE helps you notice changes that may affect your animals before problems become serious.",

      feature3Title: "Make better decisions",
      feature3Text:
        "Clear information and intelligent assistance help you take the right action at the right time.",

      systemsEyebrow: "ANTIMATE SYSTEMS",
      systemsTitle:
        "The systems and services behind ANTIMATE",

      systemsText:
        "ANTIMATE brings together the tools you need to move from farm information to better decisions in one simple experience.",

      system1Title: "ANTIMATE Smart Farm",
      system1Text:
        "A simple way to monitor your farm and understand what is happening.",

      system2Title: "ANTIMATE Connect",
      system2Text:
        "Connects your farm equipment with the ANTIMATE platform so information reaches you when you need it.",

      system3Title: "ANTIMATE Cloud",
      system3Text:
        "A secure place where your farm information is stored and organized for access when you need it.",

      system4Title: "ANTIMATE AI",
      system4Text:
        "An intelligent assistant that helps you understand information, ask questions and get farming guidance.",

      plansEyebrow: "ANTIMATE PLANS",
      plansTitle:
        "Choose a plan that fits your farm",

      plansText:
        "Start for free or choose a plan with more capabilities as your farming operation grows.",

      free: "Free",
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",

      perMonth: "/ month",

      freeDescription:
        "For anyone who wants to start exploring ANTIMATE.",

      basicDescription:
        "For small farms beginning their digital journey.",

      proDescription:
        "For farmers who want advanced farm monitoring and support.",

      premiumDescription:
        "For larger operations that need broader capabilities.",

      mostPopular: "MOST POPULAR",
      choosePlan: "Choose this plan",
      contactUs: "Contact us",

      supportEyebrow: "ANTIMATE SUPPORT",
      supportTitle:
        "We are here whenever you need help",

      supportText:
        "Whether you have a question, need assistance or want help choosing a plan, you can reach ANTIMATE through the channel that works best for you.",

      aiSupport: "ANTIMATE AI",
      aiSupportText:
        "Ask ANTIMATE AI questions and get intelligent assistance instantly.",

      phoneSupport: "Phone",
      phoneSupportText:
        "Call us directly for assistance or information.",

      whatsappSupport: "WhatsApp",
      whatsappSupportText:
        "Message us on WhatsApp and get support.",

      emailSupport: "Email",
      emailSupportText:
        "Send us your questions or requests by email.",

      webChatSupport: "Web Chat Room",
      webChatSupportText:
        "Talk to the ANTIMATE team directly through the web.",

      supportButton: "Talk to us",

      companyEyebrow: "ABOUT ANTIMATE",
      companyTitle:
        "Building the future of farming",

      companyText:
        "ANTIMATE is a technology company focused on helping farmers access better information, use technology more easily and improve farming productivity.",

      location: "Kigali, Rwanda",
      openDays: "Open all days",
      since: "Since 14 April 2026",

      teamEyebrow: "OUR TEAM",
      teamTitle:
        "The people behind ANTIMATE",

      teamText:
        "ANTIMATE is powered by a multidisciplinary team bringing together leadership, artificial intelligence, technology, data, communication, marketing and business development.",

      ceo: "CEO — Chief Executive Officer",
      aiOfficer: "Chief AI Officer",
      dataOfficer: "Chief Data Officer",
      cio: "Chief Information Officer",
      cto: "Chief Technology Officer",
      cmo: "Chief Marketing Officer",
      cbo: "Chief Business Officer",

      visionTitle:
        "Building better and more productive farms",

      visionText:
        "We connect farming with technology so farmers can do more with less complexity, greater confidence and better information.",

      simpleTech: "Simple technology",
      reliableInfo: "Reliable information",
      securePlatform: "Secure platform",

      joinTitle: "Ready to get started?",
      joinText:
        "Join ANTIMATE and start using technology to manage your farming operation.",

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
        "ANTIMATE © 2026 • Intelligent Farming Technology",
    },
  };

  const t = content[language];

  // ============================================================
  // LOGIN
  // ============================================================

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

  // ============================================================
  // NAV HELPERS
  // ============================================================

  const closeMobileMenu = () => {
    setMobileMenu(false);
  };

  const openKnowledgeCenter = () => {
    closeMobileMenu();
    navigate("/brooding-guide");
  };

  const openAI = () => {
    closeMobileMenu();
    navigate("/antimate-ai");
  };

  const scrollToSection = (id) => {
    closeMobileMenu();

    setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ============================================================
  // PLAN DATA
  // ============================================================

  const plans = [
    {
      name: t.free,
      price: "0",
      description: t.freeDescription,
      icon: <Sparkles size={22} />,
      features:
        language === "rw"
          ? [
              "Gutangira gukoresha ANTIMATE",
              "Amakuru y’ibanze",
              "Kugera kuri ANTIMATE AI",
              "Support y’ibanze",
            ]
          : [
              "Start using ANTIMATE",
              "Basic information",
              "Access to ANTIMATE AI",
              "Basic support",
            ],
    },
    {
      name: t.basic,
      price: "3,000",
      description: t.basicDescription,
      icon: <Leaf size={22} />,
      features:
        language === "rw"
          ? [
              "Kugenzura ubworozi",
              "Amakuru arambuye",
              "AI assistance",
              "Notifications",
              "Customer support",
            ]
          : [
              "Farm monitoring",
              "Detailed insights",
              "AI assistance",
              "Notifications",
              "Customer support",
            ],
    },
    {
      name: t.pro,
      price: "7,000",
      description: t.proDescription,
      popular: true,
      icon: <TrendingUp size={22} />,
      features:
        language === "rw"
          ? [
              "Ibintu byose bya Basic",
              "Advanced insights",
              "AI farming assistance",
              "Advanced notifications",
              "Priority support",
            ]
          : [
              "Everything in Basic",
              "Advanced insights",
              "AI farming assistance",
              "Advanced notifications",
              "Priority support",
            ],
    },
    {
      name: t.premium,
      price: "15,000",
      description: t.premiumDescription,
      icon: <Star size={22} />,
      features:
        language === "rw"
          ? [
              "Ibintu byose bya Pro",
              "Advanced farm capabilities",
              "Extended AI assistance",
              "Premium support",
              "Growing operation support",
            ]
          : [
              "Everything in Pro",
              "Advanced farm capabilities",
              "Extended AI assistance",
              "Premium support",
              "Growing operation support",
            ],
    },
  ];

  // ============================================================
  // TEAM DATA
  // ============================================================

  const team = [
    {
      name: "HIRWA Salem",
      role: t.ceo,
      icon: <Building2 size={22} />,
    },
    {
      name: "CYUSA Chrispin",
      role: t.aiOfficer,
      icon: <Brain size={22} />,
    },
    {
      name: "DJUMA David",
      role: t.dataOfficer,
      icon: <Cloud size={22} />,
    },
    {
      name: "Network & Communication",
      role: t.cio,
      icon: <Wifi size={22} />,
    },
    {
      name: "MUGISHA Prince",
      role: t.cto,
      icon: <LineChart size={22} />,
    },
    {
      name: "KWIZERA J. Bosco",
      role: t.cmo,
      icon: <TrendingUp size={22} />,
    },
    {
      name: "MUGISHA Steven",
      role: t.cbo,
      icon: <Users size={22} />,
    },
  ];

  return (
    <>
      <style>{`

        /* ======================================================
           ANTIMATE AI COLOR MOVEMENT
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

        @keyframes antimateShine {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(120%);
          }
        }

        @keyframes antimatePulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        /* ======================================================
           PUBLIC ANTIMATE AI BUTTON
        ====================================================== */

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

        /* ======================================================
           KNOWLEDGE CENTER
        ====================================================== */

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

        /* ======================================================
           COMPANY INFO
        ====================================================== */

        .company-section {
          padding:
            110px
            clamp(20px, 6vw, 90px);

          position: relative;
        }

        .company-grid {
          max-width: 1180px;
          margin: auto;

          display: grid;
          grid-template-columns:
            minmax(0, 1.15fr)
            minmax(320px, 0.85fr);

          gap: 60px;
          align-items: center;
        }

        .company-content h2 {
          font-size:
            clamp(32px, 4vw, 56px);

          line-height: 1.05;
          margin: 14px 0 20px;
        }

        .company-content p {
          max-width: 720px;
          font-size: 17px;
          line-height: 1.8;
          opacity: 0.78;
        }

        .company-meta {
          margin-top: 30px;

          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 14px;
        }

        .company-meta-card {
          padding: 20px;

          border-radius: 18px;

          border: 1px solid
            rgba(128, 128, 128, 0.16);

          background:
            rgba(128, 128, 128, 0.055);

          transition:
            transform 0.25s ease,
            border-color 0.25s ease;
        }

        .company-meta-card:hover {
          transform: translateY(-4px);
          border-color:
            rgba(0, 217, 255, 0.35);
        }

        .company-meta-card svg {
          color: #00bfe8;
          margin-bottom: 12px;
        }

        .company-meta-card strong {
          display: block;
          font-size: 14px;
        }

        .company-meta-card span {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          opacity: 0.62;
        }

        .company-symbol {
          min-height: 390px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 32px;

          background:
            radial-gradient(
              circle at 30% 25%,
              rgba(0, 217, 255, 0.18),
              transparent 35%
            ),
            radial-gradient(
              circle at 75% 75%,
              rgba(99, 102, 241, 0.20),
              transparent 38%
            ),
            rgba(128, 128, 128, 0.055);

          border:
            1px solid
            rgba(0, 217, 255, 0.15);

          position: relative;
          overflow: hidden;
        }

        .company-symbol::before {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;

          border-radius: 50%;

          border:
            1px solid
            rgba(0, 217, 255, 0.22);

          animation:
            antimateAIColorFlow
            14s
            linear
            infinite;
        }

        .company-symbol-inner {
          width: 170px;
          height: 170px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            rgba(7, 17, 31, 0.92);

          box-shadow:
            0 20px 70px
            rgba(0, 0, 0, 0.25);

          position: relative;
          z-index: 2;
        }

        /* ======================================================
           SYSTEMS
        ====================================================== */

        .systems-section {
          padding:
            100px
            clamp(20px, 6vw, 90px);
        }

        .systems-container {
          max-width: 1180px;
          margin: auto;
        }

        .systems-intro {
          max-width: 750px;
          margin-bottom: 50px;
        }

        .systems-intro h2 {
          font-size:
            clamp(32px, 4vw, 54px);

          line-height: 1.08;
          margin: 12px 0 18px;
        }

        .systems-intro p {
          font-size: 16px;
          line-height: 1.75;
          opacity: 0.72;
        }

        .systems-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 18px;
        }

        .system-card {
          position: relative;
          overflow: hidden;

          padding: 28px 24px;

          min-height: 270px;

          border-radius: 24px;

          border:
            1px solid
            rgba(128, 128, 128, 0.15);

          background:
            rgba(128, 128, 128, 0.055);

          transition:
            transform 0.28s ease,
            border-color 0.28s ease,
            box-shadow 0.28s ease;
        }

        .system-card::after {
          content: "";

          position: absolute;
          top: 0;
          left: -100%;

          width: 80%;
          height: 100%;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.08),
              transparent
            );

          transform: skewX(-18deg);
          transition: left 0.7s ease;
        }

        .system-card:hover::after {
          left: 140%;
        }

        .system-card:hover {
          transform: translateY(-7px);

          border-color:
            rgba(0, 217, 255, 0.32);

          box-shadow:
            0 20px 45px
            rgba(0, 0, 0, 0.12);
        }

        .system-icon {
          width: 52px;
          height: 52px;

          border-radius: 16px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #00c7ed;

          background:
            rgba(0, 217, 255, 0.08);

          margin-bottom: 22px;
        }

        .system-card h3 {
          font-size: 20px;
          margin-bottom: 12px;
        }

        .system-card p {
          font-size: 14px;
          line-height: 1.7;
          opacity: 0.68;
        }

        /* ======================================================
           PLANS
        ====================================================== */

        .plans-section {
          padding:
            100px
            clamp(20px, 6vw, 90px);

          background:
            rgba(128, 128, 128, 0.025);
        }

        .plans-container {
          max-width: 1180px;
          margin: auto;
        }

        .plans-heading {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 50px;
        }

        .plans-heading h2 {
          font-size:
            clamp(32px, 4vw, 52px);

          line-height: 1.08;
          margin: 12px 0 18px;
        }

        .plans-heading p {
          line-height: 1.7;
          opacity: 0.7;
        }

        .plans-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 18px;
        }

        .plan-card {
          position: relative;

          padding: 30px 25px;

          border-radius: 25px;

          border:
            1px solid
            rgba(128, 128, 128, 0.16);

          background:
            rgba(128, 128, 128, 0.055);

          transition:
            transform 0.28s ease,
            border-color 0.28s ease,
            box-shadow 0.28s ease;
        }

        .plan-card:hover {
          transform: translateY(-7px);
          border-color:
            rgba(0, 217, 255, 0.3);
        }

        .plan-card.popular {
          border-color:
            rgba(0, 217, 255, 0.5);

          box-shadow:
            0 20px 55px
            rgba(0, 217, 255, 0.09);
        }

        .popular-badge {
          position: absolute;

          top: 14px;
          right: 14px;

          padding: 5px 9px;

          border-radius: 999px;

          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.6px;

          color: #ffffff;

          background:
            linear-gradient(
              135deg,
              #00a9d1,
              #2563eb
            );
        }

        .plan-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 15px;

          color: #00c7ed;

          background:
            rgba(0, 217, 255, 0.08);

          margin-bottom: 18px;
        }

        .plan-card h3 {
          font-size: 23px;
          margin: 0 0 12px;
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-bottom: 15px;
        }

        .plan-price strong {
          font-size: 31px;
        }

        .plan-price span {
          font-size: 12px;
          opacity: 0.55;
        }

        .plan-description {
          min-height: 65px;

          font-size: 13px;
          line-height: 1.65;
          opacity: 0.68;
        }

        .plan-features {
          margin:
            20px
            0
            24px;

          padding: 0;
          list-style: none;
        }

        .plan-features li {
          display: flex;
          gap: 9px;
          align-items: flex-start;

          font-size: 13px;
          line-height: 1.5;

          margin-bottom: 11px;

          opacity: 0.8;
        }

        .plan-features svg {
          flex-shrink: 0;
          color: #00c7ed;
          margin-top: 2px;
        }

        .plan-button {
          width: 100%;

          padding: 12px 15px;

          border-radius: 13px;

          border:
            1px solid
            rgba(0, 217, 255, 0.25);

          background:
            rgba(0, 217, 255, 0.06);

          color: inherit;

          cursor: pointer;

          font-weight: 750;

          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .plan-button:hover {
          background:
            rgba(0, 217, 255, 0.13);

          transform: translateY(-1px);
        }

        /* ======================================================
           SUPPORT
        ====================================================== */

        .support-section {
          padding:
            105px
            clamp(20px, 6vw, 90px);
        }

        .support-container {
          max-width: 1180px;
          margin: auto;
        }

        .support-heading {
          max-width: 700px;
          margin-bottom: 48px;
        }

        .support-heading h2 {
          font-size:
            clamp(32px, 4vw, 52px);

          line-height: 1.08;
          margin: 12px 0 18px;
        }

        .support-heading p {
          line-height: 1.75;
          opacity: 0.7;
        }

        .support-grid {
          display: grid;
          grid-template-columns:
            repeat(5, minmax(0, 1fr));

          gap: 14px;
        }

        .support-card {
          padding: 24px 20px;

          min-height: 215px;

          border-radius: 21px;

          border:
            1px solid
            rgba(128, 128, 128, 0.15);

          background:
            rgba(128, 128, 128, 0.05);

          text-decoration: none;
          color: inherit;

          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            background 0.25s ease;
        }

        .support-card:hover {
          transform: translateY(-6px);

          border-color:
            rgba(0, 217, 255, 0.35);

          background:
            rgba(0, 217, 255, 0.055);
        }

        .support-card-icon {
          width: 45px;
          height: 45px;

          border-radius: 14px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #00c7ed;

          background:
            rgba(0, 217, 255, 0.08);

          margin-bottom: 18px;
        }

        .support-card h3 {
          font-size: 17px;
          margin-bottom: 9px;
        }

        .support-card p {
          font-size: 12px;
          line-height: 1.65;
          opacity: 0.64;
        }

        .support-card strong {
          display: block;
          margin-top: 12px;

          font-size: 12px;

          word-break: break-word;
        }

        /* ======================================================
           TEAM
        ====================================================== */

        .team-section {
          padding:
            100px
            clamp(20px, 6vw, 90px);

          background:
            rgba(128, 128, 128, 0.025);
        }

        .team-container {
          max-width: 1180px;
          margin: auto;
        }

        .team-heading {
          max-width: 730px;
          margin-bottom: 45px;
        }

        .team-heading h2 {
          font-size:
            clamp(32px, 4vw, 52px);

          line-height: 1.08;
          margin: 12px 0 18px;
        }

        .team-heading p {
          line-height: 1.7;
          opacity: 0.7;
        }

        .team-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 16px;
        }

        .team-card {
          padding: 24px;

          min-height: 160px;

          border-radius: 20px;

          border:
            1px solid
            rgba(128, 128, 128, 0.15);

          background:
            rgba(128, 128, 128, 0.05);

          transition:
            transform 0.25s ease,
            border-color 0.25s ease;
        }

        .team-card:hover {
          transform: translateY(-5px);

          border-color:
            rgba(0, 217, 255, 0.3);
        }

        .team-icon {
          width: 43px;
          height: 43px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 13px;

          color: #00c7ed;

          background:
            rgba(0, 217, 255, 0.08);

          margin-bottom: 18px;
        }

        .team-card h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }

        .team-card p {
          font-size: 11px;
          line-height: 1.5;
          opacity: 0.58;
        }

        /* ======================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 1100px) {
          .systems-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .plans-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .support-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .team-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
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
          }

          .knowledge-trending-badge {
            top: 3px;
            right: 12px;
          }

          .company-grid {
            grid-template-columns: 1fr;
          }

          .company-symbol {
            min-height: 300px;
          }

          .support-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .team-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .company-meta {
            grid-template-columns: 1fr;
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

          .systems-grid,
          .plans-grid,
          .support-grid,
          .team-grid {
            grid-template-columns: 1fr;
          }

          .company-section,
          .systems-section,
          .plans-section,
          .support-section,
          .team-section {
            padding-top: 75px;
            padding-bottom: 75px;
          }

          .plan-description {
            min-height: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .antimate-ai-float-login,
          .antimate-ai-float-login::before,
          .antimate-ai-ring-login::before,
          .knowledge-trending-badge,
          .company-symbol::before {
            animation: none;
          }
        }
      `}</style>

      {/* =========================================================
          PAGE
      ========================================================= */}

      <div
        className={`login-page ${
          darkMode ? "dark" : "light"
        }`}
      >
        <div className="background-orb orb-one" />
        <div className="background-orb orb-two" />

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="login-navbar">
          <div className="brand">
            <div className="brand-logo">
              <AntimateLogo size={39} />
            </div>

            <div>
              <strong>ANTIMATE</strong>
              <span>SMART FARMING</span>
            </div>
          </div>

          <nav
            className={
              mobileMenu
                ? "navigation mobile-open"
                : "navigation"
            }
          >
            <button
              type="button"
              className="nav-scroll-button"
              onClick={() =>
                scrollToSection("home")
              }
            >
              {t.navHome}
            </button>

            <button
              type="button"
              className="nav-scroll-button"
              onClick={() =>
                scrollToSection("features")
              }
            >
              {t.navHow}
            </button>

            <button
              type="button"
              className="nav-scroll-button"
              onClick={() =>
                scrollToSection("systems")
              }
            >
              {t.navSystems}
            </button>

            <button
              type="button"
              className="nav-scroll-button"
              onClick={() =>
                scrollToSection("plans")
              }
            >
              {t.navPlans}
            </button>

            <button
              type="button"
              className="nav-scroll-button"
              onClick={() =>
                scrollToSection("support")
              }
            >
              {t.navSupport}
            </button>

            <button
              type="button"
              className="nav-scroll-button"
              onClick={() =>
                scrollToSection("team")
              }
            >
              {t.navTeam}
            </button>

            <button
              type="button"
              className="nav-scroll-button"
              onClick={() =>
                scrollToSection("vision")
              }
            >
              {t.navVision}
            </button>

            <div className="knowledge-nav-wrapper">
              <button
                type="button"
                className="knowledge-nav-button"
                onClick={openKnowledgeCenter}
              >
                <BookOpen size={16} />
                <span>{t.knowledge}</span>
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
                closeMobileMenu();
              }}
              className="nav-login"
            >
              {t.login}
            </button>

            <Link
              to="/signup"
              className="nav-signup"
              onClick={closeMobileMenu}
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

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main>
          {/* ===================================================
              HERO
          =================================================== */}

          <section
            id="home"
            className="hero-section"
          >
            <div className="hero-content">
              <div className="hero-badge">
                <Sparkles size={15} />
                {t.eyebrow}
              </div>

              <h1>
                {t.title1}
                <br />
                <span>{t.title2}</span>
              </h1>

              <div className="animated-words">
                <span>Ubworozi bwiza.</span>
                <span>Ikoranabuhanga ryoroshye.</span>
                <span>Umusaruro mwiza.</span>
                <span>Ejo hazaza heza.</span>
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

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    scrollToSection("systems")
                  }
                >
                  {t.learn}
                </button>
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
                  <span>Farm conditions</span>
                  <strong>Healthy</strong>
                </div>
              </div>

              <div className="floating-card card-ai">
                <div className="ai-icon">
                  <Brain size={18} />
                </div>

                <div>
                  <span>ANTIMATE</span>
                  <strong>Smart insights</strong>
                </div>
              </div>

              <div className="floating-circle circle-one" />
              <div className="floating-circle circle-two" />
            </div>
          </section>

          {/* ===================================================
              FEATURES
          =================================================== */}

          <section
            id="features"
            className="features-section"
          >
            <div className="section-heading">
              <span>ANTIMATE</span>

              <h2>{t.featuresTitle}</h2>
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

          {/* ===================================================
              SYSTEMS
          =================================================== */}

          <section
            id="systems"
            className="systems-section"
          >
            <div className="systems-container">
              <div className="systems-intro">
                <div className="small-heading">
                  <Sparkles size={17} />
                  {t.systemsEyebrow}
                </div>

                <h2>{t.systemsTitle}</h2>

                <p>{t.systemsText}</p>
              </div>

              <div className="systems-grid">
                <SystemCard
                  icon={<Leaf />}
                  title={t.system1Title}
                  text={t.system1Text}
                />

                <SystemCard
                  icon={<Wifi />}
                  title={t.system2Title}
                  text={t.system2Text}
                />

                <SystemCard
                  icon={<Cloud />}
                  title={t.system3Title}
                  text={t.system3Text}
                />

                <SystemCard
                  icon={<Bot />}
                  title={t.system4Title}
                  text={t.system4Text}
                  onClick={openAI}
                />
              </div>
            </div>
          </section>

          {/* ===================================================
              PLANS
          =================================================== */}

          <section
            id="plans"
            className="plans-section"
          >
            <div className="plans-container">
              <div className="plans-heading">
                <div className="small-heading">
                  <TrendingUp size={17} />
                  {t.plansEyebrow}
                </div>

                <h2>{t.plansTitle}</h2>

                <p>{t.plansText}</p>
              </div>

              <div className="plans-grid">
                {plans.map((plan, index) => (
                  <div
                    key={plan.name}
                    className={`plan-card ${
                      plan.popular
                        ? "popular"
                        : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="popular-badge">
                        {t.mostPopular}
                      </div>
                    )}

                    <div className="plan-icon">
                      {plan.icon}
                    </div>

                    <h3>{plan.name}</h3>

                    <div className="plan-price">
                      <strong>
                        {plan.price}
                      </strong>

                      <span>
                        FRW {t.perMonth}
                      </span>
                    </div>

                    <p className="plan-description">
                      {plan.description}
                    </p>

                    <ul className="plan-features">
                      {plan.features.map(
                        (feature) => (
                          <li key={feature}>
                            <Check
                              size={15}
                              strokeWidth={2.5}
                            />
                            <span>
                              {feature}
                            </span>
                          </li>
                        )
                      )}
                    </ul>

                    <button
                      type="button"
                      className="plan-button"
                      onClick={() => {
                        setOpenPlan(index);

                        if (
                          plan.name ===
                          t.free
                        ) {
                          setShowLogin(true);
                        }
                      }}
                    >
                      {plan.name === t.free
                        ? t.start
                        : t.choosePlan}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===================================================
              SUPPORT
          =================================================== */}

          <section
            id="support"
            className="support-section"
          >
            <div className="support-container">
              <div className="support-heading">
                <div className="small-heading">
                  <Headphones size={17} />
                  {t.supportEyebrow}
                </div>

                <h2>{t.supportTitle}</h2>

                <p>{t.supportText}</p>
              </div>

              <div className="support-grid">
                <button
                  type="button"
                  className="support-card"
                  onClick={openAI}
                >
                  <div className="support-card-icon">
                    <Bot />
                  </div>

                  <h3>{t.aiSupport}</h3>

                  <p>
                    {t.aiSupportText}
                  </p>

                  <strong>
                    ANTIMATE AI
                  </strong>
                </button>

                <a
                  className="support-card"
                  href="tel:+250798698431"
                >
                  <div className="support-card-icon">
                    <Phone />
                  </div>

                  <h3>
                    {t.phoneSupport}
                  </h3>

                  <p>
                    {t.phoneSupportText}
                  </p>

                  <strong>
                    +250 798 698 431
                  </strong>
                </a>

                <a
                  className="support-card"
                  href="https://wa.me/250798698431"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="support-card-icon">
                    <MessageCircle />
                  </div>

                  <h3>
                    {t.whatsappSupport}
                  </h3>

                  <p>
                    {t.whatsappSupportText}
                  </p>

                  <strong>
                    +250 798 698 431
                  </strong>
                </a>

                <a
                  className="support-card"
                  href="mailto:antimate.inc@gmai.com"
                >
                  <div className="support-card-icon">
                    <Mail />
                  </div>

                  <h3>{t.emailSupport}</h3>

                  <p>
                    {t.emailSupportText}
                  </p>

                  <strong>
                    antimate.inc@gmai.com
                  </strong>
                </a>

                <button
                  type="button"
                  className="support-card"
                  onClick={() =>
                    navigate("/chat-room")
                  }
                >
                  <div className="support-card-icon">
                    <Globe />
                  </div>

                  <h3>
                    {t.webChatSupport}
                  </h3>

                  <p>
                    {t.webChatSupportText}
                  </p>

                  <strong>
                    {t.supportButton}
                  </strong>
                </button>
              </div>
            </div>
          </section>

          {/* ===================================================
              ABOUT ANTIMATE
          =================================================== */}

          <section className="company-section">
            <div className="company-grid">
              <div className="company-content">
                <div className="small-heading">
                  <Building2 size={17} />
                  {t.companyEyebrow}
                </div>

                <h2>{t.companyTitle}</h2>

                <p>{t.companyText}</p>

                <div className="company-meta">
                  <div className="company-meta-card">
                    <MapPin size={20} />
                    <strong>
                      {t.location}
                    </strong>
                    <span>Rwanda</span>
                  </div>

                  <div className="company-meta-card">
                    <CalendarDays size={20} />
                    <strong>
                      {t.since}
                    </strong>
                    <span>
                      ANTIMATE
                    </span>
                  </div>

                  <div className="company-meta-card">
                    <Headphones size={20} />
                    <strong>
                      {t.openDays}
                    </strong>
                    <span>
                      Support available
                    </span>
                  </div>
                </div>
              </div>

              <div className="company-symbol">
                <div className="company-symbol-inner">
                  <AntimateLogo size={95} />
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================
              TEAM
          =================================================== */}

          <section
            id="team"
            className="team-section"
          >
            <div className="team-container">
              <div className="team-heading">
                <div className="small-heading">
                  <Users size={17} />
                  {t.teamEyebrow}
                </div>

                <h2>{t.teamTitle}</h2>

                <p>{t.teamText}</p>
              </div>

              <div className="team-grid">
                {team.map((member) => (
                  <div
                    className="team-card"
                    key={member.name}
                  >
                    <div className="team-icon">
                      {member.icon}
                    </div>

                    <h3>
                      {member.name}
                    </h3>

                    <p>
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===================================================
              VISION
          =================================================== */}

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

              <h2>{t.visionTitle}</h2>

              <p>{t.visionText}</p>

              <div className="vision-points">
                <div>
                  <Cloud size={18} />
                  <span>
                    {t.simpleTech}
                  </span>
                </div>

                <div>
                  <ShieldCheck size={18} />
                  <span>
                    {t.reliableInfo}
                  </span>
                </div>

                <div>
                  <Lock size={18} />
                  <span>
                    {t.securePlatform}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================
              JOIN
          =================================================== */}

          <section className="join-section">
            <div className="join-content">
              <Sparkles size={28} />

              <h2>{t.joinTitle}</h2>

              <p>{t.joinText}</p>

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

        {/* =====================================================
            PUBLIC ANTIMATE AI
        ===================================================== */}

        <button
          type="button"
          className="antimate-ai-float-login"
          onClick={openAI}
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
        </button>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="login-footer">
          <div className="footer-brand">
            <AntimateLogo size={30} />
            <strong>ANTIMATE</strong>
          </div>

          <p>{t.footer}</p>

          <div className="footer-contact">
            <span>
              <MapPin size={13} />
              Kigali, Rwanda
            </span>

            <span>
              <Phone size={13} />
              +250 798 698 431
            </span>

            <span>
              <Mail size={13} />
              antimate.inc@gmai.com
            </span>
          </div>
        </footer>

        {/* =====================================================
            LOGIN MODAL
        ===================================================== */}

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

              <h2>{t.loginTitle}</h2>

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
                      <ArrowRight size={17} />
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

// ============================================================
// FEATURE
// ============================================================

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

// ============================================================
// SYSTEM CARD
// ============================================================

function SystemCard({
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <div
      className="system-card"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (
          onClick &&
          (e.key === "Enter" ||
            e.key === " ")
        ) {
          onClick();
        }
      }}
    >
      <div className="system-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>
    </div>
  );
}

export default Login;