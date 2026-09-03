import React, { useEffect, useState } from "react";
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
  Menu,
  MessageCircle,
  Moon,
  Network,
  Phone,
  Play,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Users,
  X,
  Zap,
  Mail,
  Check,
  ChevronDown,
  Globe,
  Bot,
  Radio,
  BarChart3,
  Headphones,
  MapPin,
  Clock3,
  Cpu,
} from "lucide-react";
import "./Login.css";

const AntimateLogo = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="antimate-logo"
  >
    <defs>
      <linearGradient id="antimateGradient" x1="10" y1="10" x2="90" y2="90">
        <stop offset="0%" stopColor="#00B7FF" />
        <stop offset="50%" stopColor="#4169E1" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>

    <circle
      cx="50"
      cy="50"
      r="39"
      stroke="url(#antimateGradient)"
      strokeWidth="8"
    />

    <path
      d="M30 67L39 34C40 30 46 30 47 34L50 46L53 34C54 30 60 30 61 34L70 67"
      stroke="url(#antimateGradient)"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <circle cx="50" cy="50" r="5" fill="url(#antimateGradient)" />
  </svg>
);

const content = {
  rw: {
    nav: {
      home: "Ahabanza",
      about: "ANTIMATE",
      solutions: "Ibisubizo",
      plans: "Plans",
      support: "Ubufasha",
      knowledge: "Knowledge Center",
      login: "Injira",
      signup: "Iyandikishe",
    },

    hero: {
      eyebrow: "SMARTER FUTURE • BUILT IN RWANDA",
      title1: "Ubwenge.",
      title2: "Ikoranabuhanga.",
      title3: "Ejo hazaza.",
      description:
        "ANTIMATE ni ecosystem yubaka ibisubizo by'ikoranabuhanga bifasha abantu n'ubucuruzi gukora neza, kumenya byinshi no gufata ibyemezo bifite amakuru.",
      button1: "Menya ANTIMATE",
      button2: "Ganira na ANTIMATE AI",
      trusted: "Yubakiwe Kigali, Rwanda",
    },

    about: {
      eyebrow: "ABOUT ANTIMATE",
      title: "Ikoranabuhanga rigomba kuba ryoroshye gukoresha.",
      description:
        "ANTIMATE ihuza ubwenge buhangano, amakuru, automation n'ibikoresho bya smart systems mu buryo bworoshye kandi bufatika.",
      points: [
        "Ibisubizo byubakiwe ibibazo nyabyo",
        "AI iboneka igihe uyikeneye",
        "Information imwe ahantu hamwe",
      ],
    },

    solutions: {
      eyebrow: "OUR ECOSYSTEM",
      title: "Ibisubizo bya ANTIMATE",
      description:
        "Buri gice cya ANTIMATE gifite uruhare mu gufasha user kubona information, control n'ubufasha bwiza.",
    },

    systems: [
      {
        icon: "ai",
        title: "ANTIMATE AI",
        description:
          "Umufasha w'ubwenge ushobora kugufasha kubaza, kwiga, gusesengura amakuru no kubona ibisubizo.",
        tag: "INTELLIGENCE",
      },
      {
        icon: "brooding",
        title: "ANTIMATE Smart Brooding",
        description:
          "Sisitemu ifasha mu gucunga no gukurikirana ibihe by'ingenzi mu burere bw'inkoko.",
        tag: "SMART FARMING",
      },
      {
        icon: "cloud",
        title: "ANTIMATE Cloud",
        description:
          "Ahantu ho kubika no kurebera amakuru ya systems zawe kugira ngo uyageraho igihe icyo ari cyo cyose.",
        tag: "CONNECTED",
      },
      {
        icon: "link",
        title: "ANTIMATE Link",
        description:
          "Ihuza ibikoresho n'imikorere ya ANTIMATE kugira ngo amakuru n'ubuyobozi bigende neza.",
        tag: "CONNECTIVITY",
      },
    ],

    why: {
      eyebrow: "WHY ANTIMATE",
      title: "Ntabwo twubaka technology gusa.",
      description:
        "Twubaka systems zifasha abantu kubona value nyayo mu ikoranabuhanga.",
      cards: [
        {
          icon: Zap,
          title: "Smart",
          text: "Systems zikoresha information kugira ngo ibikorwa birusheho gukora neza.",
        },
        {
          icon: ShieldCheck,
          title: "Reliable",
          text: "Dushyira imbere stability, security n'ubunararibonye bwiza kuri user.",
        },
        {
          icon: Users,
          title: "Human",
          text: "Technology igomba kumvikana no gukoreshwa n'umuntu wese.",
        },
      ],
    },

    plans: {
      eyebrow: "PLANS & PRICING",
      title: "Hitamo plan ijyanye nawe",
      description:
        "Tangira ku byo ukeneye uyu munsi, uzamure plan igihe ibikorwa byawe byiyongera.",
    },

    support: {
      eyebrow: "ANTIMATE SUPPORT",
      title: "Iyo ukeneye ubufasha, turi hafi.",
      description:
        "Waba ushaka kubaza AI, kuvugana natwe kuri WhatsApp, guhamagara, kohereza email cyangwa gukoresha web chat.",
    },

    team: {
      eyebrow: "OUR PEOPLE",
      title: "Abantu bari inyuma ya ANTIMATE",
      description:
        "Itsinda rihuza leadership, intelligence, development, cloud, marketing n'ubucuruzi.",
    },

    cta: {
      title: "Witeguye gutangira?",
      description:
        "Injira muri ANTIMATE cyangwa utangire kuganira na ANTIMATE AI nonaha.",
      button1: "Tangira nonaha",
      button2: "Ganira na AI",
    },

    footer: {
      description:
        "ANTIMATE — Smart technology built to create useful solutions for a better future.",
      rights: "All rights reserved.",
      location: "Kigali, Rwanda",
      open: "Open all days",
    },

    login: {
      title: "Murakaza neza",
      subtitle: "Injira muri konti yawe ya ANTIMATE.",
      email: "Email",
      password: "Password",
      forgot: "Wibagiwe password?",
      button: "Injira",
      noAccount: "Nta konti ufite?",
      signup: "Iyandikishe",
      close: "Funga",
    },
  },

  en: {
    nav: {
      home: "Home",
      about: "ANTIMATE",
      solutions: "Solutions",
      plans: "Plans",
      support: "Support",
      knowledge: "Knowledge Center",
      login: "Login",
      signup: "Sign up",
    },

    hero: {
      eyebrow: "SMARTER FUTURE • BUILT IN RWANDA",
      title1: "Intelligence.",
      title2: "Technology.",
      title3: "Tomorrow.",
      description:
        "ANTIMATE is an intelligent technology ecosystem creating practical solutions that help people and businesses work smarter, understand more and make better decisions.",
      button1: "Explore ANTIMATE",
      button2: "Talk to ANTIMATE AI",
      trusted: "Built in Kigali, Rwanda",
    },

    about: {
      eyebrow: "ABOUT ANTIMATE",
      title: "Technology should be simple to use.",
      description:
        "ANTIMATE brings together artificial intelligence, information, automation and smart systems into practical and easy-to-use experiences.",
      points: [
        "Solutions built around real problems",
        "AI assistance when you need it",
        "Your information in one connected experience",
      ],
    },

    solutions: {
      eyebrow: "OUR ECOSYSTEM",
      title: "The ANTIMATE ecosystem",
      description:
        "Each ANTIMATE service has a clear purpose: helping users access information, control their systems and get better assistance.",
    },

    systems: [
      {
        icon: "ai",
        title: "ANTIMATE AI",
        description:
          "An intelligent assistant that can help you ask questions, learn, analyze information and find useful answers.",
        tag: "INTELLIGENCE",
      },
      {
        icon: "brooding",
        title: "ANTIMATE Smart Brooding",
        description:
          "A smart solution for monitoring and managing important conditions during chick brooding.",
        tag: "SMART FARMING",
      },
      {
        icon: "cloud",
        title: "ANTIMATE Cloud",
        description:
          "A connected place where your system information can be stored and accessed whenever you need it.",
        tag: "CONNECTED",
      },
      {
        icon: "link",
        title: "ANTIMATE Link",
        description:
          "Connects systems and services so information and control can move together smoothly.",
        tag: "CONNECTIVITY",
      },
    ],

    why: {
      eyebrow: "WHY ANTIMATE",
      title: "We don't just build technology.",
      description:
        "We build systems that create real value from technology.",
      cards: [
        {
          icon: Zap,
          title: "Smart",
          text: "Systems use information to make everyday operations more effective.",
        },
        {
          icon: ShieldCheck,
          title: "Reliable",
          text: "We prioritize stability, security and a quality user experience.",
        },
        {
          icon: Users,
          title: "Human",
          text: "Technology should be understandable and useful to everyone.",
        },
      ],
    },

    plans: {
      eyebrow: "PLANS & PRICING",
      title: "Choose your plan",
      description:
        "Start with what you need today and move up as your needs grow.",
    },

    support: {
      eyebrow: "ANTIMATE SUPPORT",
      title: "Whenever you need help, we're here.",
      description:
        "Ask AI, reach us on WhatsApp, call us, send an email or use our web chat.",
    },

    team: {
      eyebrow: "OUR PEOPLE",
      title: "The people behind ANTIMATE",
      description:
        "A team bringing together leadership, intelligence, development, cloud, marketing and business.",
    },

    cta: {
      title: "Ready to get started?",
      description:
        "Join ANTIMATE or start a conversation with ANTIMATE AI right now.",
      button1: "Get started",
      button2: "Talk to AI",
    },

    footer: {
      description:
        "ANTIMATE — Smart technology built to create useful solutions for a better future.",
      rights: "All rights reserved.",
      location: "Kigali, Rwanda",
      open: "Open all days",
    },

    login: {
      title: "Welcome back",
      subtitle: "Login to your ANTIMATE account.",
      email: "Email",
      password: "Password",
      forgot: "Forgot password?",
      button: "Login",
      noAccount: "Don't have an account?",
      signup: "Sign up",
      close: "Close",
    },
  },
};

const iconMap = {
  ai: Brain,
  brooding: Leaf,
  cloud: Cloud,
  link: Network,
};

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Gutangira no kumenya ANTIMATE.",
    features: [
      "Basic access",
      "ANTIMATE AI",
      "Knowledge Center",
    ],
  },
  {
    name: "Basic",
    price: "3,000",
    description: "Ku bakoresha bakeneye services ziyongera.",
    features: [
      "Advanced features",
      "AI assistance",
      "Smart monitoring",
      "Support",
    ],
  },
  {
    name: "Pro",
    price: "7,000",
    popular: true,
    description: "Ku bakoresha bashaka byinshi kandi byimbitse.",
    features: [
      "Pro features",
      "Advanced AI assistance",
      "Smart systems",
      "Priority support",
    ],
  },
  {
    name: "Premium",
    price: "15,000",
    description: "Experience yagutse ku bakoresha bakomeye.",
    features: [
      "Premium features",
      "Advanced intelligence",
      "Full smart ecosystem",
      "Premium support",
    ],
  },
];

const team = [
  {
    name: "HIRWA Salem",
    role: "CEO — Chief Executive Officer",
    initials: "HS",
  },
  {
    name: "CYUSA Chrispin",
    role: "CAIO — Chief AI Officer",
    initials: "CC",
  },
  {
    name: "DJUMA David",
    role: "CDO — Chief Data Officer",
    initials: "DD",
  },
  {
    name: "MUGISHA Prince",
    role: "CTO — Technology & Development",
    initials: "MP",
  },
  {
    name: "KWIZERA J. Bosco",
    role: "CMO — Marketing & Brand",
    initials: "KB",
  },
  {
    name: "MUGISHA Steven",
    role: "Business Development & Partnerships",
    initials: "MS",
  },
];

function FloatingParticle({ index }) {
  return (
    <span
      className="floating-particle"
      style={{
        "--i": index,
        "--delay": `${index * 0.65}s`,
        "--x": `${8 + ((index * 17) % 84)}%`,
        "--y": `${12 + ((index * 23) % 76)}%`,
      }}
    />
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState("rw");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const t = content[language];

  useEffect(() => {
    const revealElements = document.querySelectorAll("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
      }
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    document.body.classList.toggle("login-dark", darkMode);

    return () => {
      document.body.classList.remove("login-dark");
    };
  }, [darkMode]);

  const scrollTo = (id) => {
    setMobileMenu(false);

    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginError("");

    if (!email || !password) {
      setLoginError(
        language === "rw"
          ? "Shyiramo email na password."
          : "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        email,
        password,
      });

      if (response?.token) {
        localStorage.setItem("token", response.token);
      }

      if (response?.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      navigate("/home");
    } catch (error) {
      setLoginError(
        error?.response?.data?.message ||
          error?.message ||
          (language === "rw"
            ? "Login yanze. Ongera ugerageze."
            : "Login failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const openAI = () => {
    navigate("/antimate-ai");
  };

  return (
    <div className={`login-page ${darkMode ? "dark" : ""}`}>
      <div className="ambient-background">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />

        {[...Array(12)].map((_, index) => (
          <FloatingParticle key={index} index={index} />
        ))}
      </div>

      {/* NAVBAR */}
      <header className="main-navbar">
        <div className="navbar-inner">
          <button
            className="brand"
            onClick={() => scrollTo("home")}
            aria-label="ANTIMATE"
          >
            <AntimateLogo size={48} />

            <div className="brand-text">
              <strong>ANTIMATE</strong>
              <span>SMART TECHNOLOGY</span>
            </div>
          </button>

          <nav className={`desktop-nav ${mobileMenu ? "mobile-open" : ""}`}>
            <button onClick={() => scrollTo("home")}>
              {t.nav.home}
            </button>

            <button onClick={() => scrollTo("about")}>
              {t.nav.about}
            </button>

            <button onClick={() => scrollTo("solutions")}>
              {t.nav.solutions}
            </button>

            <button onClick={() => scrollTo("plans")}>
              {t.nav.plans}
            </button>

            <button onClick={() => scrollTo("support")}>
              {t.nav.support}
            </button>

            <Link to="/brooding-guide" className="knowledge-link">
              <span className="trending-badge">TRENDING</span>
              {t.nav.knowledge}
            </Link>
          </nav>

          <div className="navbar-actions">
            <button
              className="language-button"
              onClick={() => setLanguage(language === "rw" ? "en" : "rw")}
              title="Language"
            >
              <Globe size={17} />
              {language.toUpperCase()}
            </button>

            <button
              className="theme-button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="login-nav-button"
              onClick={() => setLoginOpen(true)}
            >
              {t.nav.login}
            </button>

            <Link to="/signup" className="signup-nav-button">
              {t.nav.signup}
            </Link>

            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Menu"
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section id="home" className="hero-section">
          <div className="hero-grid" />

          <div className="hero-content" data-reveal>
            <div className="hero-eyebrow">
              <span className="pulse-dot" />
              {t.hero.eyebrow}
            </div>

            <h1>
              {t.hero.title1}
              <span>{t.hero.title2}</span>
              <em>{t.hero.title3}</em>
            </h1>

            <p>{t.hero.description}</p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => scrollTo("solutions")}
              >
                {t.hero.button1}
                <ArrowRight size={19} />
              </button>

              <button className="secondary-button" onClick={openAI}>
                <Bot size={19} />
                {t.hero.button2}
              </button>
            </div>

            <div className="hero-trust">
              <div className="trust-icons">
                <span>
                  <MapPin size={15} />
                </span>
                <span>
                  <Sparkles size={15} />
                </span>
                <span>
                  <ShieldCheck size={15} />
                </span>
              </div>

              <span>{t.hero.trusted}</span>
            </div>
          </div>

          <div className="hero-visual" data-reveal>
            <div className="hero-ring ring-one" />
            <div className="hero-ring ring-two" />

            <div className="hero-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1100&q=85"
                alt="Smart technology"
              />

              <div className="image-glow" />
            </div>

            <div className="floating-card card-ai">
              <div className="floating-card-icon">
                <Brain size={20} />
              </div>

              <div>
                <strong>ANTIMATE AI</strong>
                <span>Always learning</span>
              </div>

              <div className="live-indicator">
                <i />
                LIVE
              </div>
            </div>

            <div className="floating-card card-smart">
              <div className="mini-chart">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div>
                <strong>SMART SYSTEM</strong>
                <span>Connected</span>
              </div>
            </div>

            <div className="floating-card card-location">
              <MapPin size={17} />
              <span>Kigali, Rwanda</span>
            </div>
          </div>

          <div className="hero-scroll">
            <span>SCROLL</span>
            <div className="scroll-line" />
          </div>
        </section>

        {/* COMPANY STRIP */}
        <section className="company-strip">
          <div className="company-strip-item">
            <Sparkles size={17} />
            <span>ANTIMATE</span>
          </div>

          <div className="strip-line" />

          <div className="company-strip-item">
            <Clock3 size={17} />
            <span>Since 14 April 2026</span>
          </div>

          <div className="strip-line" />

          <div className="company-strip-item">
            <MapPin size={17} />
            <span>Kigali, Rwanda</span>
          </div>

          <div className="strip-line" />

          <div className="company-strip-item">
            <Headphones size={17} />
            <span>{t.footer.open}</span>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="about-section section">
          <div className="about-image" data-reveal>
            <div className="about-image-frame">
              <img
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=85"
                alt="ANTIMATE technology"
              />

              <div className="image-overlay" />

              <div className="about-badge">
                <div className="about-badge-icon">
                  <Cpu size={21} />
                </div>

                <div>
                  <strong>ANTIMATE</strong>
                  <span>Smart ecosystem</span>
                </div>
              </div>
            </div>
          </div>

          <div className="about-content" data-reveal>
            <div className="section-eyebrow">
              <span />
              {t.about.eyebrow}
            </div>

            <h2>{t.about.title}</h2>

            <p>{t.about.description}</p>

            <div className="about-points">
              {t.about.points.map((point, index) => (
                <div className="about-point" key={index}>
                  <div className="point-check">
                    <Check size={15} />
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <button
              className="text-button"
              onClick={() => scrollTo("solutions")}
            >
              {t.hero.button1}
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* MOVING MARQUEE */}
        <div className="marquee-section">
          <div className="marquee-track">
            {[...Array(2)].map((_, group) => (
              <div className="marquee-group" key={group}>
                <span>ANTIMATE AI</span>
                <b>✦</b>
                <span>SMART FARMING</span>
                <b>✦</b>
                <span>CONNECTED SYSTEMS</span>
                <b>✦</b>
                <span>INTELLIGENT FUTURE</span>
                <b>✦</b>
                <span>BUILT IN RWANDA</span>
                <b>✦</b>
              </div>
            ))}
          </div>
        </div>

        {/* SOLUTIONS */}
        <section id="solutions" className="solutions-section section">
          <div className="section-heading centered" data-reveal>
            <div className="section-eyebrow">
              <span />
              {t.solutions.eyebrow}
              <span />
            </div>

            <h2>{t.solutions.title}</h2>
            <p>{t.solutions.description}</p>
          </div>

          <div className="systems-grid">
            {t.systems.map((system, index) => {
              const Icon = iconMap[system.icon];

              return (
                <article
                  className={`system-card system-${index + 1}`}
                  key={system.title}
                  data-reveal
                  style={{ "--delay": `${index * 0.1}s` }}
                >
                  <div className="system-card-top">
                    <div className="system-icon">
                      <Icon size={26} />
                    </div>

                    <span>{system.tag}</span>
                  </div>

                  <h3>{system.title}</h3>
                  <p>{system.description}</p>

                  <div className="system-card-bottom">
                    <span>EXPLORE</span>
                    <ArrowRight size={18} />
                  </div>

                  <div className="card-shine" />
                </article>
              );
            })}
          </div>
        </section>

        {/* WHY */}
        <section className="why-section section">
          <div className="why-heading" data-reveal>
            <div className="section-eyebrow">
              <span />
              {t.why.eyebrow}
            </div>

            <h2>{t.why.title}</h2>
            <p>{t.why.description}</p>
          </div>

          <div className="why-grid">
            {t.why.cards.map((card, index) => {
              const Icon = card.icon;

              return (
                <div
                  className="why-card"
                  key={card.title}
                  data-reveal
                  style={{ "--delay": `${index * 0.12}s` }}
                >
                  <div className="why-number">0{index + 1}</div>

                  <div className="why-icon">
                    <Icon size={25} />
                  </div>

                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* PLANS */}
        <section id="plans" className="plans-section section">
          <div className="section-heading centered" data-reveal>
            <div className="section-eyebrow">
              <span />
              {t.plans.eyebrow}
              <span />
            </div>

            <h2>{t.plans.title}</h2>
            <p>{t.plans.description}</p>
          </div>

          <div className="plans-grid">
            {plans.map((plan, index) => (
              <article
                className={`plan-card ${plan.popular ? "popular" : ""}`}
                key={plan.name}
                data-reveal
                style={{ "--delay": `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="popular-label">
                    <Sparkles size={14} />
                    POPULAR
                  </div>
                )}

                <div className="plan-icon">
                  {index === 0 && <Leaf size={22} />}
                  {index === 1 && <Zap size={22} />}
                  {index === 2 && <Brain size={22} />}
                  {index === 3 && <Sparkles size={22} />}
                </div>

                <h3>{plan.name}</h3>

                <div className="plan-price">
                  <strong>{plan.price}</strong>
                  <span>FRW</span>
                </div>

                <p>{plan.description}</p>

                <div className="plan-divider" />

                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={15} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={plan.popular ? "plan-button primary" : "plan-button"}
                  onClick={() =>
                    plan.name === "Free"
                      ? navigate("/signup")
                      : setLoginOpen(true)
                  }
                >
                  {language === "rw" ? "Hitamo plan" : "Choose plan"}
                  <ArrowRight size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* SUPPORT */}
        <section id="support" className="support-section section">
          <div className="section-heading centered" data-reveal>
            <div className="section-eyebrow">
              <span />
              {t.support.eyebrow}
              <span />
            </div>

            <h2>{t.support.title}</h2>
            <p>{t.support.description}</p>
          </div>

          <div className="support-grid">
            <button
              className="support-card support-ai"
              onClick={openAI}
              data-reveal
            >
              <div className="support-card-icon">
                <Bot size={25} />
              </div>

              <div>
                <span>24/7 AI</span>
                <h3>ANTIMATE AI</h3>
                <p>
                  {language === "rw"
                    ? "Baza ikibazo cyawe nonaha."
                    : "Ask your question right now."}
                </p>
              </div>

              <ArrowRight size={19} />
            </button>

            <a
              href="tel:+250798698431"
              className="support-card"
              data-reveal
            >
              <div className="support-card-icon">
                <Phone size={24} />
              </div>

              <div>
                <span>PHONE</span>
                <h3>+250 798 698 431</h3>
                <p>
                  {language === "rw"
                    ? "Twandikire kuri telefoni."
                    : "Call our support team."}
                </p>
              </div>

              <ArrowRight size={19} />
            </a>

            <a
              href="https://wa.me/250798698431"
              target="_blank"
              rel="noreferrer"
              className="support-card"
              data-reveal
            >
              <div className="support-card-icon">
                <MessageCircle size={24} />
              </div>

              <div>
                <span>WHATSAPP</span>
                <h3>+250 798 698 431</h3>
                <p>
                  {language === "rw"
                    ? "Twandikire kuri WhatsApp."
                    : "Message us on WhatsApp."}
                </p>
              </div>

              <ArrowRight size={19} />
            </a>

            <a
              href="mailto:antimate.inc@gmai.com"
              className="support-card"
              data-reveal
            >
              <div className="support-card-icon">
                <Mail size={24} />
              </div>

              <div>
                <span>EMAIL</span>
                <h3>antimate.inc@gmai.com</h3>
                <p>
                  {language === "rw"
                    ? "Twohereze email."
                    : "Send us an email."}
                </p>
              </div>

              <ArrowRight size={19} />
            </a>

            <button
              className="support-card"
              onClick={openAI}
              data-reveal
            >
              <div className="support-card-icon">
                <MessageCircle size={24} />
              </div>

              <div>
                <span>WEB CHAT</span>
                <h3>ANTIMATE Chat Room</h3>
                <p>
                  {language === "rw"
                    ? "Ganira natwe online."
                    : "Chat with ANTIMATE online."}
                </p>
              </div>

              <ArrowRight size={19} />
            </button>
          </div>
        </section>

        {/* TEAM */}
        <section className="team-section section">
          <div className="section-heading centered" data-reveal>
            <div className="section-eyebrow">
              <span />
              {t.team.eyebrow}
              <span />
            </div>

            <h2>{t.team.title}</h2>
            <p>{t.team.description}</p>
          </div>

          <div className="team-grid">
            {team.map((member, index) => (
              <article
                className="team-card"
                key={member.name}
                data-reveal
                style={{ "--delay": `${index * 0.08}s` }}
              >
                <div className="team-avatar">
                  {member.initials}

                  <span className="avatar-status" />
                </div>

                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ / QUICK ANSWERS */}
        <section className="faq-section section">
          <div className="faq-heading" data-reveal>
            <div className="section-eyebrow">
              <span />
              {language === "rw" ? "WAKIBAZA?" : "STILL CURIOUS?"}
            </div>

            <h2>
              {language === "rw"
                ? "ANTIMATE ikora iki?"
                : "What does ANTIMATE do?"}
            </h2>

            <p>
              {language === "rw"
                ? "Dore ibisubizo bigufi ku bibazo bikunze kubazwa."
                : "Here are quick answers to common questions."}
            </p>
          </div>

          <div className="faq-list" data-reveal>
            {[
              {
                q:
                  language === "rw"
                    ? "ANTIMATE AI ishobora kumfasha iki?"
                    : "What can ANTIMATE AI help me with?",
                a:
                  language === "rw"
                    ? "ANTIMATE AI igufasha kubaza ibibazo, kubona ibisubizo, gusobanukirwa amakuru no kukuyobora ku byo ushaka gukora."
                    : "ANTIMATE AI can help you ask questions, understand information, find answers and guide you through what you want to accomplish.",
              },
              {
                q:
                  language === "rw"
                    ? "Nshobora gukoresha ANTIMATE nta konti?"
                    : "Can I use ANTIMATE without an account?",
                a:
                  language === "rw"
                    ? "Yego. Services zimwe nka ANTIMATE AI zishobora kuboneka public. Konti ikenerwa ku services zibika cyangwa zihuza amakuru yawe."
                    : "Yes. Some services such as ANTIMATE AI can be available publicly. An account is needed for services that store or connect your personal system information.",
              },
              {
                q:
                  language === "rw"
                    ? "ANTIMATE iboneka he?"
                    : "Where is ANTIMATE based?",
                a:
                  language === "rw"
                    ? "ANTIMATE yubakiwe i Kigali, Rwanda kandi ikorera ku ishyaka ryo gukora technology ifite akamaro."
                    : "ANTIMATE is built in Kigali, Rwanda with a focus on creating useful technology.",
              },
            ].map((faq, index) => (
              <div
                className={`faq-item ${activeFaq === index ? "open" : ""}`}
                key={faq.q}
              >
                <button
                  onClick={() =>
                    setActiveFaq(activeFaq === index ? -1 : index)
                  }
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={19} />
                </button>

                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-background">
            <div className="cta-orb cta-orb-one" />
            <div className="cta-orb cta-orb-two" />
          </div>

          <div className="cta-content" data-reveal>
            <div className="cta-icon">
              <Sparkles size={28} />
            </div>

            <div className="section-eyebrow">
              <span />
              ANTIMATE
              <span />
            </div>

            <h2>{t.cta.title}</h2>
            <p>{t.cta.description}</p>

            <div className="cta-actions">
              <Link to="/signup" className="primary-button">
                {t.cta.button1}
                <ArrowRight size={19} />
              </Link>

              <button className="secondary-button" onClick={openAI}>
                <Bot size={19} />
                {t.cta.button2}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo-row">
              <AntimateLogo size={45} />

              <div>
                <strong>ANTIMATE</strong>
                <span>SMART TECHNOLOGY</span>
              </div>
            </div>

            <p>{t.footer.description}</p>

            <div className="footer-location">
              <MapPin size={16} />
              {t.footer.location}
            </div>
          </div>

          <div className="footer-column">
            <h4>{t.nav.solutions}</h4>
            <button onClick={() => scrollTo("solutions")}>
              ANTIMATE AI
            </button>
            <button onClick={() => scrollTo("solutions")}>
              Smart Brooding
            </button>
            <button onClick={() => scrollTo("solutions")}>
              ANTIMATE Cloud
            </button>
            <button onClick={() => scrollTo("solutions")}>
              ANTIMATE Link
            </button>
          </div>

          <div className="footer-column">
            <h4>{t.nav.support}</h4>
            <button onClick={openAI}>AI Chat</button>
            <a href="tel:+250798698431">Phone</a>
            <a
              href="https://wa.me/250798698431"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <a href="mailto:antimate.inc@gmai.com">Email</a>
          </div>

          <div className="footer-column">
            <h4>{language === "rw" ? "Quick Links" : "Quick Links"}</h4>
            <button onClick={() => scrollTo("about")}>
              {t.nav.about}
            </button>
            <button onClick={() => scrollTo("plans")}>
              {t.nav.plans}
            </button>
            <Link to="/brooding-guide">{t.nav.knowledge}</Link>
            <Link to="/signup">{t.nav.signup}</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} ANTIMATE. {t.footer.rights}
          </span>

          <span>Made with intelligence in Rwanda 🇷🇼</span>
        </div>
      </footer>

      {/* FLOATING AI */}
      <button className="floating-ai-button" onClick={openAI}>
        <div className="ai-button-pulse" />

        <div className="floating-ai-icon">
          <Brain size={23} />
        </div>

        <div className="floating-ai-text">
          <strong>ANTIMATE AI</strong>
          <span>
            {language === "rw" ? "Baza ikibazo" : "Ask anything"}
          </span>
        </div>

        <ArrowRight size={17} />
      </button>

      {/* LOGIN MODAL */}
      {loginOpen && (
        <div
          className="login-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setLoginOpen(false);
            }
          }}
        >
          <div className="login-modal">
            <button
              className="modal-close"
              onClick={() => setLoginOpen(false)}
              aria-label={t.login.close}
            >
              <X size={20} />
            </button>

            <div className="modal-logo">
              <AntimateLogo size={58} />
            </div>

            <div className="modal-header">
              <div className="modal-eyebrow">
                <Sparkles size={14} />
                ANTIMATE
              </div>

              <h2>{t.login.title}</h2>
              <p>{t.login.subtitle}</p>
            </div>

            <form onSubmit={handleLogin}>
              <label>{t.login.email}</label>

              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                />
              </div>

              <label>{t.login.password}</label>

              <div className="input-wrapper">
                <ShieldCheck size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <div className="login-extra">
                <Link to="/forgot-password" onClick={() => setLoginOpen(false)}>
                  {t.login.forgot}
                </Link>
              </div>

              {loginError && (
                <div className="login-error">
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
                    <span className="button-spinner" />
                    {language === "rw"
                      ? "Turimo kwinjiza..."
                      : "Signing in..."}
                  </>
                ) : (
                  <>
                    {t.login.button}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="modal-divider">
              <span />
              <small>
                {language === "rw" ? "CYANGWA" : "OR"}
              </small>
              <span />
            </div>

            <button
              className="modal-ai-button"
              onClick={() => {
                setLoginOpen(false);
                openAI();
              }}
            >
              <Bot size={19} />
              {language === "rw"
                ? "Koresha ANTIMATE AI"
                : "Use ANTIMATE AI"}
            </button>

            <div className="modal-signup">
              {t.login.noAccount}{" "}
              <Link to="/signup" onClick={() => setLoginOpen(false)}>
                {t.login.signup}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}