import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Globe2,
  Headphones,
  Leaf,
  LineChart,
  Lock,
  Mail,
  Menu,
  MessageCircle,
  Network,
  Phone,
  Play,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Users,
  X,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";

import { loginUser } from "../services/authService";
import "./Login.css";

/* ============================================================
   ANTIMATE LOGIN / PUBLIC LANDING PAGE
   ============================================================

   ANTIMATE
   Advanced Networked Technology With Intelligent Machines
   And Telemetry Ecosystem

   Public experience:
   - RW / EN
   - Light / Dark
   - Animated hero
   - ANTIMATE systems
   - Plans
   - Support
   - Team
   - Login
   - Public ANTIMATE AI
   ============================================================ */


/* ============================================================
   ANTIMATE LOGO
   ============================================================ */

const AntimateLogo = ({ small = false }) => {
  return (
    <div className={`antimate-logo ${small ? "small" : ""}`}>
      <svg
        className="antimate-logo-mark"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="antimateLogoGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#1677ff" />
            <stop offset="50%" stopColor="#00b8ff" />
            <stop offset="100%" stopColor="#6b4cff" />
          </linearGradient>
        </defs>

        <path
          d="M50 7C26.25 7 7 26.25 7 50s19.25 43 43 43 43-19.25 43-43S73.75 7 50 7Z"
          fill="none"
          stroke="url(#antimateLogoGradient)"
          strokeWidth="8"
        />

        <path
          d="M31 63c7-18 14-27 19-27 6 0 12 9 19 27"
          fill="none"
          stroke="url(#antimateLogoGradient)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <circle
          cx="50"
          cy="36"
          r="5"
          fill="url(#antimateLogoGradient)"
        />

        <circle
          cx="31"
          cy="63"
          r="4"
          fill="url(#antimateLogoGradient)"
        />

        <circle
          cx="69"
          cy="63"
          r="4"
          fill="url(#antimateLogoGradient)"
        />
      </svg>

      <div className="antimate-logo-text">
        <strong>ANTIMATE</strong>
        <span>Intelligent Technology</span>
      </div>
    </div>
  );
};


/* ============================================================
   ANTIMATE AI O-SHAPED ICON
   IMPORTANT:
   Keep this concept consistent with the AI icon used elsewhere.
   ============================================================ */

const AntimateAIIcon = ({ size = "normal" }) => {
  return (
    <div className={`ai-orb ai-orb-${size}`}>
      <div className="ai-orb-ring ring-one" />
      <div className="ai-orb-ring ring-two" />
      <div className="ai-orb-ring ring-three" />

      <div className="ai-orb-core">
        <div className="ai-orb-inner" />
      </div>

      <span className="ai-orb-dot dot-one" />
      <span className="ai-orb-dot dot-two" />
      <span className="ai-orb-dot dot-three" />
    </div>
  );
};


/* ============================================================
   TRANSLATIONS
   ============================================================ */

const CONTENT = {
  rw: {
    nav: {
      home: "Ahabanza",
      about: "ANTIMATE",
      systems: "Systems",
      plans: "Plans",
      support: "Support",
      knowledge: "Knowledge Center",
      login: "Injira",
      signup: "Iyandikishe",
    },

    hero: {
      eyebrow: "THE INTELLIGENT TECHNOLOGY ECOSYSTEM",
      title1: "Ikoranabuhanga",
      words: [
        "Ritekereza.",
        "Rihuza.",
        "Rifasha.",
        "Riteza imbere.",
      ],
      description:
        "ANTIMATE ni ecosystem y'ikoranabuhanga yubakiye ku guhuza abantu, amakuru, systems n'ubwenge buhangano kugira ngo ibikorwa byawe birusheho kuba smart, byihuse kandi bifite umutekano.",
      primary: "Menya ANTIMATE",
      secondary: "Ganira na ANTIMATE AI",
    },

    company: {
      since: "Kuva tariki 14 Mata 2026",
      location: "Kigali, Rwanda",
      open: "Dufungura iminsi yose",
      title: "ANTIMATE ni iki?",
      text:
        "ANTIMATE ni urubuga rw'ikoranabuhanga ruhuza intelligent systems, data, cloud services n'ubwenge buhangano. Intego yacu ni ugukora technology yoroshya ubuzima kandi igafasha abantu n'ibigo gufata ibyemezo byiza.",
    },

    systems: {
      eyebrow: "OUR ECOSYSTEM",
      title: "Systems zakozwe kugira ngo zikore hamwe",
      description:
        "Buri system ya ANTIMATE ifite uruhare rwayo, ariko zose zikora nk'igice kimwe cya ecosystem.",
      ai: {
        title: "ANTIMATE AI",
        text:
          "Umufasha w'ubwenge ushobora kugufasha kubona ibisubizo, gusobanukirwa amakuru no kubona guidance igihe uyikeneye.",
        button: "Koresha AI",
      },
      brooding: {
        title: "ANTIMATE Smart Brooding",
        text:
          "System ifasha mu micungire y'ubworozi bw'inkoko, ikagufasha gukurikirana imiterere y'aho inkoko zororerwa no kubona guidance.",
        button: "Menya byinshi",
      },
      cloud: {
        title: "ANTIMATE Cloud",
        text:
          "Ahantu amakuru ya systems zawe abikwa kandi ukayageraho mu buryo bworoshye, aho waba uri hose.",
        button: "Menya Cloud",
      },
      link: {
        title: "ANTIMATE Link",
        text:
          "Ikoranabuhanga rihuza devices na services za ANTIMATE kugira ngo amakuru abashe kugenda aho akenewe.",
        button: "Menya Link",
      },
    },

    why: {
      eyebrow: "WHY ANTIMATE",
      title: "Technology igenewe abantu",
      items: [
        {
          title: "Smart",
          text: "Dukoresha ubwenge n'amakuru kugira ngo technology ikorere umuntu.",
        },
        {
          title: "Connected",
          text: "Systems zacu zubakiye ku guhuza amakuru n'abantu.",
        },
        {
          title: "Accessible",
          text: "Dushaka ko technology iba yoroshye gukoresha kuri buri wese.",
        },
        {
          title: "Future Ready",
          text: "Twubaka ecosystem ishobora gukura uko ibikorwa byawe bikura.",
        },
      ],
    },

    plans: {
      eyebrow: "PLANS & PRICING",
      title: "Hitamo plan ijyanye nawe",
      description:
        "Tegura uburyo ushaka gukoresha ANTIMATE kandi uzamure plan yawe igihe ibikorwa byawe bikura.",
      free: {
        name: "Free",
        price: "0 FRW",
        description: "Gutangira no kumenya ANTIMATE.",
        features: [
          "Basic access",
          "ANTIMATE experience",
          "Knowledge Center",
          "Public AI access",
        ],
      },
      basic: {
        name: "Basic",
        price: "3,000 FRW",
        description: "Ku muntu utangiye gukoresha services za ANTIMATE.",
        features: [
          "More features",
          "System insights",
          "Support",
          "Improved access",
        ],
      },
      pro: {
        name: "Pro",
        price: "7,000 FRW",
        description: "Ku bakoresha ANTIMATE mu buryo bwagutse.",
        features: [
          "Advanced features",
          "More insights",
          "Priority support",
          "Expanded experience",
        ],
      },
      premium: {
        name: "Premium",
        price: "15,000 FRW",
        description: "Experience yuzuye ku bikorwa bikomeye.",
        features: [
          "Premium experience",
          "Advanced insights",
          "Priority assistance",
          "Full ecosystem experience",
        ],
      },
      choose: "Hitamo iyi plan",
      popular: "POPULAR",
    },

    support: {
      eyebrow: "ANTIMATE SUPPORT",
      title: "Iyo ukeneye ubufasha, turi hafi",
      description:
        "Waba ushaka kubaza AI, kuvugana natwe kuri phone, WhatsApp, email cyangwa web chat — ushobora kutugeraho.",
      ai: "ANTIMATE AI",
      phone: "Phone",
      whatsapp: "WhatsApp",
      email: "Email",
      web: "Web Chat Room",
      open: "Open all days",
      contact: "Twandikire",
    },

    team: {
      eyebrow: "OUR PEOPLE",
      title: "Itsinda riri inyuma ya ANTIMATE",
      description:
        "ANTIMATE yubakwa n'abantu bafite inshingano zitandukanye ariko bahuje vision imwe.",
      members: [
        {
          name: "HIRWA Salem",
          role: "CEO — Chief Executive Officer",
          area: "Leadership",
        },
        {
          name: "CYUSA Chrispin",
          role: "CAIO — Chief AI Officer",
          area: "AI & Intelligence",
        },
        {
          name: "DJUMA David",
          role: "CDO — Chief Data Officer",
          area: "Data & Cloud",
        },
        {
          name: "ANTIMATE Team",
          role: "CIO — Connectivity",
          area: "Network & Communication",
        },
        {
          name: "MUGISHA Prince",
          role: "CTO — Technology",
          area: "Product & Development",
        },
        {
          name: "KWIZERA J.Bosco",
          role: "CMO — Marketing",
          area: "Marketing & Brand",
        },
        {
          name: "MUGISHA Steven",
          role: "Business Development",
          area: "Partnerships & Growth",
        },
      ],
    },

    vision: {
      eyebrow: "OUR VISION",
      title: "Kubaka ejo hazaza h'ikoranabuhanga",
      text:
        "ANTIMATE ishaka kuba ecosystem y'ikoranabuhanga ifasha abantu n'ibigo gukoresha amakuru n'ubwenge mu buryo bufatika. Turashaka technology itari iy'abahanga gusa, ahubwo yoroshye, ifatika kandi iboneka ku muntu wese.",
      points: [
        "Intelligent systems",
        "Human-centered technology",
        "Connected ecosystem",
      ],
    },

    faq: {
      eyebrow: "FAQ",
      title: "Ibibazo bikunze kubazwa",
      questions: [
        {
          q: "ANTIMATE ikora iki?",
          a:
            "ANTIMATE ihuza intelligent technology, AI, data na connected systems kugira ngo ifashe abantu n'ibigo gukora neza no gufata ibyemezo bifite amakuru inyuma yabyo.",
        },
        {
          q: "Nshobora gukoresha ANTIMATE AI ntarinjiye?",
          a:
            "Yego. ANTIMATE AI ifite public access ushobora gukoresha kugira ngo ubaze ibibazo kandi ubone assistance.",
        },
        {
          q: "ANTIMATE Smart Brooding ni iki?",
          a:
            "Ni system yagenewe gufasha mu micungire y'ubworozi bw'inkoko, monitoring no kubona guidance ijyanye n'imimerere y'ubworozi.",
        },
        {
          q: "Nabona nte support?",
          a:
            "Ushobora kutugeraho ukoresheje ANTIMATE AI, phone, WhatsApp, email cyangwa web chat room.",
        },
      ],
    },

    cta: {
      title: "Tangira gukoresha ANTIMATE",
      text:
        "Injira muri ecosystem yubakiye ku ikoranabuhanga, amakuru n'ubwenge.",
      button: "Tangira ubu",
      ai: "Ganira na AI",
    },

    login: {
      title: "Murakaza neza kuri ANTIMATE",
      subtitle: "Injira muri account yawe",
      email: "Email",
      password: "Password",
      emailPlaceholder: "Andika email yawe",
      passwordPlaceholder: "Andika password yawe",
      remember: "Nyibuka",
      forgot: "Wibagiwe password?",
      button: "Injira",
      loading: "Turimo kwinjiza...",
      noAccount: "Nta account ufite?",
      signup: "Iyandikishe",
      close: "Funga",
      error: "Email cyangwa password ntabwo ari byo.",
    },

    footer: {
      tagline:
        "Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem.",
      explore: "Explore",
      company: "Company",
      support: "Support",
      rights: "All rights reserved.",
    },
  },

  en: {
    nav: {
      home: "Home",
      about: "ANTIMATE",
      systems: "Systems",
      plans: "Plans",
      support: "Support",
      knowledge: "Knowledge Center",
      login: "Login",
      signup: "Sign up",
    },

    hero: {
      eyebrow: "THE INTELLIGENT TECHNOLOGY ECOSYSTEM",
      title1: "Technology",
      words: [
        "That Thinks.",
        "That Connects.",
        "That Helps.",
        "That Evolves.",
      ],
      description:
        "ANTIMATE is an intelligent technology ecosystem designed to connect people, information, systems and AI to make everyday operations smarter, faster and more accessible.",
      primary: "Explore ANTIMATE",
      secondary: "Talk to ANTIMATE AI",
    },

    company: {
      since: "Since 14 April 2026",
      location: "Kigali, Rwanda",
      open: "Open all days",
      title: "What is ANTIMATE?",
      text:
        "ANTIMATE is a technology ecosystem combining intelligent systems, data, cloud services and artificial intelligence. Our goal is to build technology that simplifies work and helps people and organizations make better decisions.",
    },

    systems: {
      eyebrow: "OUR ECOSYSTEM",
      title: "Systems designed to work together",
      description:
        "Each ANTIMATE system has its own purpose, while all systems work together as one ecosystem.",
      ai: {
        title: "ANTIMATE AI",
        text:
          "An intelligent assistant that helps you find answers, understand information and get guidance whenever you need it.",
        button: "Use AI",
      },
      brooding: {
        title: "ANTIMATE Smart Brooding",
        text:
          "A smart solution for poultry brooding management, helping you monitor conditions and get useful guidance.",
        button: "Learn more",
      },
      cloud: {
        title: "ANTIMATE Cloud",
        text:
          "A place where your system information can be securely stored and accessed whenever you need it.",
        button: "Explore Cloud",
      },
      link: {
        title: "ANTIMATE Link",
        text:
          "A connectivity solution that connects devices and ANTIMATE services so information can reach where it is needed.",
        button: "Explore Link",
      },
    },

    why: {
      eyebrow: "WHY ANTIMATE",
      title: "Technology designed for people",
      items: [
        {
          title: "Smart",
          text: "We use intelligence and information to make technology work for people.",
        },
        {
          title: "Connected",
          text: "Our ecosystem is built around connecting information and people.",
        },
        {
          title: "Accessible",
          text: "We believe technology should be easy to use and accessible.",
        },
        {
          title: "Future Ready",
          text: "We build an ecosystem that can grow with your needs.",
        },
      ],
    },

    plans: {
      eyebrow: "PLANS & PRICING",
      title: "Choose your plan",
      description:
        "Start with what you need and move to a higher experience as your activities grow.",
      free: {
        name: "Free",
        price: "0 FRW",
        description: "A simple way to start exploring ANTIMATE.",
        features: [
          "Basic access",
          "ANTIMATE experience",
          "Knowledge Center",
          "Public AI access",
        ],
      },
      basic: {
        name: "Basic",
        price: "3,000 FRW",
        description: "For users starting with ANTIMATE services.",
        features: [
          "More features",
          "System insights",
          "Support",
          "Improved access",
        ],
      },
      pro: {
        name: "Pro",
        price: "7,000 FRW",
        description: "For users who need a broader ANTIMATE experience.",
        features: [
          "Advanced features",
          "More insights",
          "Priority support",
          "Expanded experience",
        ],
      },
      premium: {
        name: "Premium",
        price: "15,000 FRW",
        description: "A complete experience for advanced activities.",
        features: [
          "Premium experience",
          "Advanced insights",
          "Priority assistance",
          "Full ecosystem experience",
        ],
      },
      choose: "Choose plan",
      popular: "POPULAR",
    },

    support: {
      eyebrow: "ANTIMATE SUPPORT",
      title: "We are here when you need us",
      description:
        "Ask our AI, call us, reach us on WhatsApp, email us or use our web chat room.",
      ai: "ANTIMATE AI",
      phone: "Phone",
      whatsapp: "WhatsApp",
      email: "Email",
      web: "Web Chat Room",
      open: "Open all days",
      contact: "Contact us",
    },

    team: {
      eyebrow: "OUR PEOPLE",
      title: "The people behind ANTIMATE",
      description:
        "ANTIMATE is built by people with different responsibilities and one shared vision.",
      members: [
        {
          name: "HIRWA Salem",
          role: "CEO — Chief Executive Officer",
          area: "Leadership",
        },
        {
          name: "CYUSA Chrispin",
          role: "CAIO — Chief AI Officer",
          area: "AI & Intelligence",
        },
        {
          name: "DJUMA David",
          role: "CDO — Chief Data Officer",
          area: "Data & Cloud",
        },
        {
          name: "ANTIMATE Team",
          role: "CIO — Connectivity",
          area: "Network & Communication",
        },
        {
          name: "MUGISHA Prince",
          role: "CTO — Technology",
          area: "Product & Development",
        },
        {
          name: "KWIZERA J.Bosco",
          role: "CMO — Marketing",
          area: "Marketing & Brand",
        },
        {
          name: "MUGISHA Steven",
          role: "Business Development",
          area: "Partnerships & Growth",
        },
      ],
    },

    vision: {
      eyebrow: "OUR VISION",
      title: "Building the future of intelligent technology",
      text:
        "ANTIMATE aims to become an ecosystem that helps people and organizations use information and intelligence in practical ways. We believe technology should not only be for experts, but should be useful, accessible and human-centered.",
      points: [
        "Intelligent systems",
        "Human-centered technology",
        "Connected ecosystem",
      ],
    },

    faq: {
      eyebrow: "FAQ",
      title: "Frequently asked questions",
      questions: [
        {
          q: "What does ANTIMATE do?",
          a:
            "ANTIMATE connects intelligent technology, AI, data and connected systems to help people and organizations work better and make informed decisions.",
        },
        {
          q: "Can I use ANTIMATE AI without logging in?",
          a:
            "Yes. ANTIMATE AI provides public access so you can ask questions and get assistance.",
        },
        {
          q: "What is ANTIMATE Smart Brooding?",
          a:
            "It is a solution designed to support poultry brooding management, monitoring and useful guidance.",
        },
        {
          q: "How can I get support?",
          a:
            "You can reach us through ANTIMATE AI, phone, WhatsApp, email or our web chat room.",
        },
      ],
    },

    cta: {
      title: "Start with ANTIMATE",
      text:
        "Join an ecosystem built around technology, information and intelligence.",
      button: "Get started",
      ai: "Talk to AI",
    },

    login: {
      title: "Welcome to ANTIMATE",
      subtitle: "Sign in to your account",
      email: "Email",
      password: "Password",
      emailPlaceholder: "Enter your email",
      passwordPlaceholder: "Enter your password",
      remember: "Remember me",
      forgot: "Forgot password?",
      button: "Login",
      loading: "Signing in...",
      noAccount: "Don't have an account?",
      signup: "Create account",
      close: "Close",
      error: "Incorrect email or password.",
    },

    footer: {
      tagline:
        "Advanced Networked Technology With Intelligent Machines And Telemetry Ecosystem.",
      explore: "Explore",
      company: "Company",
      support: "Support",
      rights: "All rights reserved.",
    },
  },
};


/* ============================================================
   SYSTEM CARD
   ============================================================ */

const SystemCard = ({
  icon,
  title,
  text,
  button,
  featured,
  onClick,
}) => {
  return (
    <article
      className={`system-card ${featured ? "featured-system" : ""}`}
      data-reveal
    >
      <div className="system-card-glow" />

      <div className="system-icon">
        {icon}
      </div>

      <div className="system-card-content">
        <h3>{title}</h3>
        <p>{text}</p>

        <button
          type="button"
          className="text-action"
          onClick={onClick}
        >
          {button}
          <ArrowRight size={17} />
        </button>
      </div>

      <div className="system-card-number">
        {featured ? "AI" : "•"}
      </div>
    </article>
  );
};


/* ============================================================
   SUPPORT CARD
   ============================================================ */

const SupportCard = ({
  icon,
  title,
  value,
  href,
  onClick,
  className = "",
}) => {
  const content = (
    <>
      <div className="support-icon">{icon}</div>
      <div className="support-copy">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <ArrowRight className="support-arrow" size={18} />
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`support-card ${className}`}
        onClick={onClick}
        data-reveal
      >
        {content}
      </button>
    );
  }

  return (
    <a
      className={`support-card ${className}`}
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      data-reveal
    >
      {content}
    </a>
  );
};


/* ============================================================
   PLAN CARD
   ============================================================ */

const PlanCard = ({
  plan,
  popular,
  t,
  onChoose,
}) => {
  return (
    <article
      className={`plan-card ${popular ? "popular-plan" : ""}`}
      data-reveal
    >
      {popular && (
        <div className="popular-badge">
          <Sparkles size={13} />
          {t.plans.popular}
        </div>
      )}

      <div className="plan-top">
        <span className="plan-name">{plan.name}</span>

        <div className="plan-price">
          <strong>{plan.price}</strong>
        </div>

        <p>{plan.description}</p>
      </div>

      <div className="plan-divider" />

      <ul className="plan-features">
        {plan.features.map((feature, index) => (
          <li key={index}>
            <span className="feature-check">
              <Check size={13} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`plan-button ${popular ? "primary-plan-button" : ""}`}
        onClick={onChoose}
      >
        {t.plans.choose}
        <ArrowRight size={17} />
      </button>
    </article>
  );
};


/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function Login() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState("rw");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [openFaq, setOpenFaq] = useState(null);

  const t = CONTENT[language];

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */

  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [language]);


  /* ============================================================
     NAVIGATION
     ============================================================ */

  const scrollToSection = (id) => {
    setMobileMenu(false);

    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };


  /* ============================================================
     LOGIN
     ============================================================ */

  const openLogin = () => {
    setMobileMenu(false);
    setLoginError("");
    setShowLogin(true);
  };

  const closeLogin = () => {
    if (loading) return;

    setShowLogin(false);
    setLoginError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLoginError(t.login.error);
      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });

      const token =
        response?.token ||
        response?.accessToken ||
        response?.data?.token;

      const user =
        response?.user ||
        response?.data?.user ||
        null;

      if (token) {
        localStorage.setItem("token", token);
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      if (remember) {
        localStorage.setItem("antimateRememberEmail", email.trim());
      } else {
        localStorage.removeItem("antimateRememberEmail");
      }

      navigate("/home");
    } catch (error) {
      console.error("ANTIMATE LOGIN ERROR:", error);
      setLoginError(
        error?.response?.data?.message ||
        error?.message ||
        t.login.error
      );
    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     REMEMBER EMAIL
     ============================================================ */

  useEffect(() => {
    const savedEmail = localStorage.getItem(
      "antimateRememberEmail"
    );

    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);


  /* ============================================================
     BODY LOCK WHEN LOGIN IS OPEN
     ============================================================ */

  useEffect(() => {
    if (showLogin) {
      document.body.classList.add("login-modal-open");
    } else {
      document.body.classList.remove("login-modal-open");
    }

    return () => {
      document.body.classList.remove("login-modal-open");
    };
  }, [showLogin]);


  /* ============================================================
     KEYBOARD ESC
     ============================================================ */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showLogin) {
        closeLogin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLogin, loading]);


  /* ============================================================
     PLAN ACTION
     ============================================================ */

  const choosePlan = () => {
    scrollToSection("support");
  };


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className={`login-page ${darkMode ? "dark" : "light"}`}>

      {/* ======================================================
          BACKGROUND SYSTEM
          ====================================================== */}

      <div className="ambient-background">
        <div className="ambient-orb orb-a" />
        <div className="ambient-orb orb-b" />
        <div className="ambient-orb orb-c" />

        <div className="ambient-grid" />

        <div className="ambient-particles">
          {Array.from({ length: 18 }).map((_, index) => (
            <span
              key={index}
              className="ambient-particle"
              style={{
                "--i": index,
              }}
            />
          ))}
        </div>
      </div>


      {/* ======================================================
          NAVBAR
          ====================================================== */}

      <header className="main-navbar">
        <div className="navbar-inner">

          <button
            type="button"
            className="brand-button"
            onClick={() => scrollToSection("top")}
            aria-label="ANTIMATE"
          >
            <AntimateLogo />
          </button>

          <nav className={`desktop-nav ${mobileMenu ? "mobile-open" : ""}`}>
            <button
              type="button"
              onClick={() => scrollToSection("top")}
            >
              {t.nav.home}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("about")}
            >
              {t.nav.about}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("systems")}
            >
              {t.nav.systems}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("plans")}
            >
              {t.nav.plans}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("support")}
            >
              {t.nav.support}
            </button>

            <Link
              to="/brooding-guide"
              className="knowledge-nav"
              onClick={() => setMobileMenu(false)}
            >
              {t.nav.knowledge}
              <span>TRENDING</span>
            </Link>
          </nav>

          <div className="navbar-actions">

            <button
              type="button"
              className="language-switch"
              onClick={() =>
                setLanguage((prev) =>
                  prev === "rw" ? "en" : "rw"
                )
              }
              aria-label="Change language"
            >
              <Globe2 size={17} />
              <span>{language.toUpperCase()}</span>
            </button>

            <button
              type="button"
              className="theme-button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun size={18} />
              ) : (
                <Sparkles size={18} />
              )}
            </button>

            <button
              type="button"
              className="nav-login-button"
              onClick={openLogin}
            >
              <Lock size={15} />
              {t.nav.login}
            </button>

            <Link
              to="/signup"
              className="nav-signup-button"
            >
              {t.nav.signup}
              <ArrowRight size={16} />
            </Link>

            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setMobileMenu((prev) => !prev)
              }
              aria-label="Menu"
            >
              {mobileMenu ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>
        </div>
      </header>


      {/* ======================================================
          HERO
          ====================================================== */}

      <main id="top">

        <section className="hero-section">

          <div className="hero-content" data-reveal>

            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              {t.hero.eyebrow}
            </div>

            <h1>
              {t.hero.title1}
              <span className="hero-moving-words">
                {t.hero.words.map((word, index) => (
                  <span
                    key={word}
                    className="hero-word"
                    style={{
                      "--word-index": index,
                    }}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </h1>

            <p className="hero-description">
              {t.hero.description}
            </p>

            <div className="hero-actions">

              <button
                type="button"
                className="hero-primary"
                onClick={() => scrollToSection("systems")}
              >
                <Rocket size={18} />
                {t.hero.primary}
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="hero-secondary"
                onClick={() => navigate("/antimate-ai")}
              >
                <AntimateAIIcon size="tiny" />
                {t.hero.secondary}
              </button>

            </div>

            <div className="hero-trust-line">
              <ShieldCheck size={17} />
              <span>{t.company.open}</span>
              <span className="trust-separator">•</span>
              <span>{t.company.location}</span>
            </div>
          </div>


          {/* ==================================================
              HERO VISUAL
              ================================================== */}

          <div
            className="hero-visual"
            data-reveal
          >

            <div className="hero-image-frame">

              <div className="hero-image-glow" />

              <img
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85"
                alt="ANTIMATE intelligent technology"
              />

              <div className="hero-image-overlay" />

              <div className="hero-floating-card card-ai">
                <div className="floating-icon ai-floating-icon">
                  <AntimateAIIcon size="tiny" />
                </div>

                <div>
                  <span>ANTIMATE</span>
                  <strong>AI</strong>
                </div>

                <div className="live-dot">
                  <i />
                  LIVE
                </div>
              </div>


              <div className="hero-floating-card card-system">
                <div className="floating-icon">
                  <Network size={19} />
                </div>

                <div>
                  <span>Connected</span>
                  <strong>Intelligent Systems</strong>
                </div>
              </div>


              <div className="hero-floating-card card-data">
                <div className="mini-chart">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div>
                  <span>Smart Data</span>
                  <strong>+ Intelligence</strong>
                </div>
              </div>

            </div>


            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />

            <div className="hero-orbit-dot orbit-dot-one" />
            <div className="hero-orbit-dot orbit-dot-two" />
            <div className="hero-orbit-dot orbit-dot-three" />

          </div>
        </section>


        {/* ====================================================
            COMPANY STRIP
            ==================================================== */}

        <section className="company-strip">
          <div className="company-strip-inner">

            <div className="company-strip-item">
              <span className="strip-icon">
                <Rocket size={16} />
              </span>
              <span>{t.company.since}</span>
            </div>

            <div className="strip-line" />

            <div className="company-strip-item">
              <span className="strip-icon">
                <Globe2 size={16} />
              </span>
              <span>{t.company.location}</span>
            </div>

            <div className="strip-line" />

            <div className="company-strip-item">
              <span className="strip-icon">
                <Headphones size={16} />
              </span>
              <span>{t.company.open}</span>
            </div>

          </div>
        </section>


        {/* ====================================================
            MARQUEE
            ==================================================== */}

        <div className="marquee-section">
          <div className="marquee-track">

            {[
              "ANTIMATE AI",
              "SMART TECHNOLOGY",
              "CONNECTED SYSTEMS",
              "INTELLIGENT DATA",
              "SMART BROODING",
              "ANTIMATE CLOUD",
              "ANTIMATE LINK",
              "FUTURE READY",
            ].map((item, index) => (
              <React.Fragment key={`${item}-${index}`}>
                <span>{item}</span>
                <i>✦</i>
              </React.Fragment>
            ))}

            {[
              "ANTIMATE AI",
              "SMART TECHNOLOGY",
              "CONNECTED SYSTEMS",
              "INTELLIGENT DATA",
              "SMART BROODING",
              "ANTIMATE CLOUD",
              "ANTIMATE LINK",
              "FUTURE READY",
            ].map((item, index) => (
              <React.Fragment key={`second-${item}-${index}`}>
                <span>{item}</span>
                <i>✦</i>
              </React.Fragment>
            ))}

          </div>
        </div>


        {/* ====================================================
            ABOUT
            ==================================================== */}

        <section
          className="section about-section"
          id="about"
        >
          <div className="section-container">

            <div
              className="section-heading centered"
              data-reveal
            >
              <span className="section-eyebrow">
                <Sparkles size={15} />
                {t.company.title}
              </span>

              <h2>{t.company.title}</h2>

              <p>
                {t.company.text}
              </p>
            </div>


            <div className="about-layout">

              <div
                className="about-visual"
                data-reveal
              >
                <div className="about-circle about-circle-one" />
                <div className="about-circle about-circle-two" />

                <div className="about-center-logo">
                  <AntimateLogo small />
                </div>

                <div className="about-floating about-floating-one">
                  <Brain size={19} />
                  <span>AI</span>
                </div>

                <div className="about-floating about-floating-two">
                  <Cloud size={19} />
                  <span>Cloud</span>
                </div>

                <div className="about-floating about-floating-three">
                  <Network size={19} />
                  <span>Connect</span>
                </div>

                <div className="about-floating about-floating-four">
                  <LineChart size={19} />
                  <span>Data</span>
                </div>
              </div>


              <div
                className="about-copy"
                data-reveal
              >
                <div className="about-copy-label">
                  <span>ANTIMATE</span>
                  <div />
                  <span>2026 →</span>
                </div>

                <h3>
                  {language === "rw"
                    ? "Ikoranabuhanga rihuza ubwenge n'ibikorwa."
                    : "Technology that connects intelligence with action."}
                </h3>

                <p>
                  {t.company.text}
                </p>

                <div className="about-values">

                  <div>
                    <span className="value-number">01</span>
                    <strong>
                      {language === "rw"
                        ? "Ubwenge"
                        : "Intelligence"}
                    </strong>
                  </div>

                  <div>
                    <span className="value-number">02</span>
                    <strong>
                      {language === "rw"
                        ? "Guhuza"
                        : "Connection"}
                    </strong>
                  </div>

                  <div>
                    <span className="value-number">03</span>
                    <strong>
                      {language === "rw"
                        ? "Iterambere"
                        : "Progress"}
                    </strong>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </section>


        {/* ====================================================
            SYSTEMS
            ==================================================== */}

        <section
          className="section systems-section"
          id="systems"
        >
          <div className="section-container">

            <div className="section-heading">
              <span
                className="section-eyebrow"
                data-reveal
              >
                <Network size={15} />
                {t.systems.eyebrow}
              </span>

              <h2 data-reveal>
                {t.systems.title}
              </h2>

              <p data-reveal>
                {t.systems.description}
              </p>
            </div>


            <div className="systems-grid">

              <SystemCard
                featured
                icon={<AntimateAIIcon size="small" />}
                title={t.systems.ai.title}
                text={t.systems.ai.text}
                button={t.systems.ai.button}
                onClick={() => navigate("/antimate-ai")}
              />

              <SystemCard
                icon={<Leaf size={25} />}
                title={t.systems.brooding.title}
                text={t.systems.brooding.text}
                button={t.systems.brooding.button}
                onClick={() => navigate("/brooding-guide")}
              />

              <SystemCard
                icon={<Cloud size={25} />}
                title={t.systems.cloud.title}
                text={t.systems.cloud.text}
                button={t.systems.cloud.button}
                onClick={() => scrollToSection("support")}
              />

              <SystemCard
                icon={<Network size={25} />}
                title={t.systems.link.title}
                text={t.systems.link.text}
                button={t.systems.link.button}
                onClick={() => scrollToSection("support")}
              />

            </div>

          </div>
        </section>


        {/* ====================================================
            WHY ANTIMATE
            ==================================================== */}

        <section className="section why-section">
          <div className="section-container">

            <div className="section-heading centered">
              <span
                className="section-eyebrow"
                data-reveal
              >
                <Target size={15} />
                {t.why.eyebrow}
              </span>

              <h2 data-reveal>
                {t.why.title}
              </h2>
            </div>


            <div className="why-grid">

              {t.why.items.map((item, index) => (
                <article
                  className="why-card"
                  key={item.title}
                  data-reveal
                >
                  <div className="why-number">
                    0{index + 1}
                  </div>

                  <div className="why-card-icon">
                    {index === 0 && <Brain size={22} />}
                    {index === 1 && <Network size={22} />}
                    {index === 2 && <Users size={22} />}
                    {index === 3 && <Rocket size={22} />}
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}

            </div>

          </div>
        </section>


        {/* ====================================================
            VISION
            ==================================================== */}

        <section
          className="section vision-section"
          id="vision"
        >
          <div className="section-container">

            <div className="vision-card">

              <div className="vision-glow vision-glow-one" />
              <div className="vision-glow vision-glow-two" />

              <div
                className="vision-content"
                data-reveal
              >
                <span className="section-eyebrow">
                  <Target size={15} />
                  {t.vision.eyebrow}
                </span>

                <h2>{t.vision.title}</h2>

                <p>{t.vision.text}</p>

                <div className="vision-points">
                  {t.vision.points.map((point, index) => (
                    <div key={point}>
                      <span>
                        <Check size={14} />
                      </span>
                      <strong>{point}</strong>
                    </div>
                  ))}
                </div>
              </div>


              <div
                className="vision-art"
                data-reveal
              >
                <div className="vision-core">
                  <AntimateLogo small />
                </div>

                <div className="vision-orbit v-orbit-one" />
                <div className="vision-orbit v-orbit-two" />
                <div className="vision-orbit v-orbit-three" />

                <div className="vision-node node-one">
                  <Brain size={18} />
                </div>

                <div className="vision-node node-two">
                  <Cloud size={18} />
                </div>

                <div className="vision-node node-three">
                  <Network size={18} />
                </div>

                <div className="vision-node node-four">
                  <Sparkles size={18} />
                </div>
              </div>

            </div>

          </div>
        </section>


        {/* ====================================================
            PLANS
            ==================================================== */}

        <section
          className="section plans-section"
          id="plans"
        >
          <div className="section-container">

            <div className="section-heading centered">
              <span
                className="section-eyebrow"
                data-reveal
              >
                <Zap size={15} />
                {t.plans.eyebrow}
              </span>

              <h2 data-reveal>
                {t.plans.title}
              </h2>

              <p data-reveal>
                {t.plans.description}
              </p>
            </div>


            <div className="plans-grid">

              <PlanCard
                plan={t.plans.free}
                t={t}
                onChoose={choosePlan}
              />

              <PlanCard
                plan={t.plans.basic}
                t={t}
                onChoose={choosePlan}
              />

              <PlanCard
                plan={t.plans.pro}
                popular
                t={t}
                onChoose={choosePlan}
              />

              <PlanCard
                plan={t.plans.premium}
                t={t}
                onChoose={choosePlan}
              />

            </div>

          </div>
        </section>


        {/* ====================================================
            SUPPORT
            ==================================================== */}

        <section
          className="section support-section"
          id="support"
        >
          <div className="section-container">

            <div className="support-header">

              <div>
                <span
                  className="section-eyebrow"
                  data-reveal
                >
                  <Headphones size={15} />
                  {t.support.eyebrow}
                </span>

                <h2 data-reveal>
                  {t.support.title}
                </h2>

                <p data-reveal>
                  {t.support.description}
                </p>
              </div>

              <div
                className="support-open-badge"
                data-reveal
              >
                <span />
                {t.support.open}
              </div>

            </div>


            <div className="support-grid">

              <SupportCard
                icon={<AntimateAIIcon size="tiny" />}
                title={t.support.ai}
                value={t.support.web}
                onClick={() => navigate("/antimate-ai")}
                className="support-ai"
              />

              <SupportCard
                icon={<Phone size={22} />}
                title={t.support.phone}
                value="+250 798 698 431"
                href="tel:+250798698431"
              />

              <SupportCard
                icon={<MessageCircle size={22} />}
                title={t.support.whatsapp}
                value="+250 798 698 431"
                href="https://wa.me/250798698431"
              />

              <SupportCard
                icon={<Mail size={22} />}
                title={t.support.email}
                value="antimate.inc@gmai.com"
                href="mailto:antimate.inc@gmai.com"
              />

              <SupportCard
                icon={<MessageCircle size={22} />}
                title={t.support.web}
                value="ANTIMATE AI Chat"
                onClick={() => navigate("/antimate-ai")}
                className="support-web"
              />

            </div>

          </div>
        </section>


        {/* ====================================================
            TEAM
            ==================================================== */}

        <section className="section team-section">
          <div className="section-container">

            <div className="section-heading centered">

              <span
                className="section-eyebrow"
                data-reveal
              >
                <Users size={15} />
                {t.team.eyebrow}
              </span>

              <h2 data-reveal>
                {t.team.title}
              </h2>

              <p data-reveal>
                {t.team.description}
              </p>

            </div>


            <div className="team-grid">

              {t.team.members.map((member, index) => (
                <article
                  className="team-card"
                  key={`${member.name}-${index}`}
                  data-reveal
                >
                  <div className="team-avatar">
                    {member.name
                      .replace("ANTIMATE Team", "AT")
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="team-info">
                    <span>{member.area}</span>
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </div>

                  <div className="team-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </article>
              ))}

            </div>

          </div>
        </section>


        {/* ====================================================
            FAQ
            ==================================================== */}

        <section className="section faq-section">
          <div className="section-container faq-container">

            <div className="section-heading centered">
              <span
                className="section-eyebrow"
                data-reveal
              >
                <MessageCircle size={15} />
                {t.faq.eyebrow}
              </span>

              <h2 data-reveal>
                {t.faq.title}
              </h2>
            </div>


            <div className="faq-list">

              {t.faq.questions.map((item, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    className={`faq-item ${isOpen ? "faq-open" : ""}`}
                    key={item.q}
                    data-reveal
                  >
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() =>
                        setOpenFaq(
                          isOpen ? null : index
                        )
                      }
                    >
                      <span>{item.q}</span>

                      <span className="faq-toggle">
                        {isOpen ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </span>
                    </button>

                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}

            </div>

          </div>
        </section>


        {/* ====================================================
            CTA
            ==================================================== */}

        <section className="cta-section">
          <div className="cta-container">

            <div className="cta-orb cta-orb-one" />
            <div className="cta-orb cta-orb-two" />

            <div className="cta-content" data-reveal>

              <div className="cta-ai">
                <AntimateAIIcon size="normal" />
              </div>

              <span className="section-eyebrow">
                <Sparkles size={15} />
                ANTIMATE
              </span>

              <h2>{t.cta.title}</h2>

              <p>{t.cta.text}</p>

              <div className="cta-actions">

                <Link
                  to="/signup"
                  className="cta-primary"
                >
                  <Rocket size={18} />
                  {t.cta.button}
                  <ArrowRight size={18} />
                </Link>

                <button
                  type="button"
                  className="cta-secondary"
                  onClick={() => navigate("/antimate-ai")}
                >
                  <Bot size={18} />
                  {t.cta.ai}
                </button>

              </div>

            </div>

          </div>
        </section>

      </main>


      {/* ======================================================
          FLOATING AI BUTTON
          ====================================================== */}

      <button
        type="button"
        className="floating-ai-button"
        onClick={() => navigate("/antimate-ai")}
        aria-label="Open ANTIMATE AI"
      >
        <div className="floating-ai-orb">
          <AntimateAIIcon size="tiny" />
        </div>

        <div className="floating-ai-text">
          <span>ANTIMATE</span>
          <strong>AI</strong>
        </div>

        <ArrowRight size={17} />
      </button>


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="site-footer">

        <div className="footer-top">

          <div className="footer-brand">
            <AntimateLogo />

            <p>{t.footer.tagline}</p>

            <div className="footer-contact-mini">
              <span>Kigali, Rwanda</span>
              <span>+250 798 698 431</span>
            </div>
          </div>


          <div className="footer-column">
            <h4>{t.footer.explore}</h4>

            <button
              type="button"
              onClick={() => scrollToSection("systems")}
            >
              {t.nav.systems}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("plans")}
            >
              {t.nav.plans}
            </button>

            <Link to="/brooding-guide">
              {t.nav.knowledge}
            </Link>

            <button
              type="button"
              onClick={() => navigate("/antimate-ai")}
            >
              ANTIMATE AI
            </button>
          </div>


          <div className="footer-column">
            <h4>{t.footer.company}</h4>

            <button
              type="button"
              onClick={() => scrollToSection("about")}
            >
              {t.nav.about}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("vision")}
            >
              {t.vision.eyebrow}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("support")}
            >
              {t.support.contact}
            </button>
          </div>


          <div className="footer-column">
            <h4>{t.footer.support}</h4>

            <a href="tel:+250798698431">
              <Phone size={14} />
              +250 798 698 431
            </a>

            <a href="https://wa.me/250798698431">
              <MessageCircle size={14} />
              WhatsApp
            </a>

            <a href="mailto:antimate.inc@gmai.com">
              <Mail size={14} />
              antimate.inc@gmai.com
            </a>

            <button
              type="button"
              onClick={() => navigate("/antimate-ai")}
            >
              <Bot size={14} />
              Web Chat
            </button>
          </div>

        </div>


        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} ANTIMATE.{" "}
            {t.footer.rights}
          </span>

          <span>
            Advanced Networked Technology With Intelligent
            Machines And Telemetry Ecosystem.
          </span>
        </div>

      </footer>


      {/* ======================================================
          LOGIN MODAL
          ====================================================== */}

      {showLogin && (
        <div
          className="login-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLogin();
            }
          }}
        >

          <div
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >

            <button
              type="button"
              className="login-modal-close"
              onClick={closeLogin}
              aria-label={t.login.close}
            >
              <X size={19} />
            </button>


            <div className="login-modal-visual">

              <div className="login-modal-glow glow-one" />
              <div className="login-modal-glow glow-two" />

              <AntimateAIIcon size="normal" />

              <span>ANTIMATE</span>
              <strong>Intelligent Access</strong>

            </div>


            <div className="login-modal-content">

              <div className="login-modal-heading">
                <span className="login-small-label">
                  ANTIMATE
                </span>

                <h2 id="login-title">
                  {t.login.title}
                </h2>

                <p>
                  {t.login.subtitle}
                </p>
              </div>


              <form onSubmit={handleLogin}>

                <div className="login-field">
                  <label htmlFor="login-email">
                    {t.login.email}
                  </label>

                  <div className="login-input-wrap">
                    <Mail size={18} />

                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder={
                        t.login.emailPlaceholder
                      }
                      autoComplete="email"
                    />
                  </div>
                </div>


                <div className="login-field">
                  <label htmlFor="login-password">
                    {t.login.password}
                  </label>

                  <div className="login-input-wrap">
                    <Lock size={18} />

                    <input
                      id="login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder={
                        t.login.passwordPlaceholder
                      }
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
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


                <div className="login-options">

                  <label className="remember-check">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) =>
                        setRemember(
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <Check size={12} />
                    </span>

                    {t.login.remember}
                  </label>

                  <Link to="/forgot-password">
                    {t.login.forgot}
                  </Link>

                </div>


                {loginError && (
                  <div className="login-error">
                    <span>!</span>
                    {loginError}
                  </div>
                )}


                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="button-loader" />
                      {t.login.loading}
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      {t.login.button}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

              </form>


              <div className="login-signup-line">
                <span>{t.login.noAccount}</span>

                <Link
                  to="/signup"
                  onClick={() => setShowLogin(false)}
                >
                  {t.login.signup}
                </Link>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}