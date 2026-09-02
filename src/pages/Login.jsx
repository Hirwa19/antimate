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

  // ============================================================
  // DEFAULT THEME = LIGHT
  // ============================================================

  const [darkMode, setDarkMode] = useState(false);

  // ============================================================
  // CONTENT
  // ============================================================

  const content = {
    rw: {
      navHome: "Ahabanza",
      navHow: "Uko ikora",
      navVision: "Intego",

      knowledge: "Amakuru y’Ubworozi",
      trending: "TRENDING",

      login: "Injira",
      signup: "Tangira natwe",

      eyebrow: "UBWOROZI BW'IGIHE KIZAZA",

      title1: "Ubworozi bwiza",
      title2: "butangirira ku makuru meza.",

      description:
        "ANTIMATE igufasha gukurikirana ubworozi bwawe, kumenya uko amatungo yawe ameze no gufata ibyemezo byiza ukoresheje ikoranabuhanga ryoroheje kandi ryizewe.",

      start: "Tangira natwe",
      learn: "Menya byinshi",

      live: "Amakuru y'igihe nyacyo",
      smart: "Ubworozi bw'ikoranabuhanga",

      featuresTitle:
        "Ikoranabuhanga rikora ku bworozi bwawe",

      feature1Title: "Kurikira ubworozi",
      feature1Text:
        "Reba uko ubushyuhe, ubuhehere n'ibindi bipimo bihinduka igihe cyose.",

      feature2Title: "Menya ibibazo hakiri kare",
      feature2Text:
        "ANTIMATE igufasha kubona impinduka zishobora kugira ingaruka ku matungo yawe.",

      feature3Title: "Fata ibyemezo neza",
      feature3Text:
        "Amakuru yoroheje kandi asobanutse agufasha gukora ibikwiye ku gihe.",

      visionTitle:
        "Duharanira ubworozi bwiza kandi bwunguka",

      visionText:
        "Duhuza ubworozi n'ikoranabuhanga kugira ngo umuhinzi cyangwa umworozi abashe gukora byinshi, mu buryo bworoshye kandi bwizewe.",

      joinTitle: "Witeguye gutangira?",
      joinText:
        "Injira muri ANTIMATE maze uhindure uburyo ukurikiranamo ubworozi bwawe.",

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
      navVision: "Our vision",

      knowledge: "Poultry Knowledge",
      trending: "TRENDING",

      login: "Login",
      signup: "Join us",

      eyebrow: "THE FUTURE OF FARMING",

      title1: "Better farming",
      title2: "starts with better information.",

      description:
        "ANTIMATE helps you monitor your farm, understand your animals and make better decisions using simple, reliable technology.",

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
        "ANTIMATE helps you notice changes that may affect your animals.",

      feature3Title: "Make better decisions",
      feature3Text:
        "Clear information helps you take the right action at the right time.",

      visionTitle:
        "Building better and more productive farms",

      visionText:
        "We connect farming with technology so farmers can do more with less complexity and greater confidence.",

      joinTitle: "Ready to get started?",
      joinText:
        "Join ANTIMATE and transform the way you manage your farm.",

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
  // OPEN KNOWLEDGE CENTER
  // ============================================================

  const openKnowledgeCenter = () => {
    setMobileMenu(false);
    navigate("/brooding-guide");
  };

  return (
    <>
      {/* =========================================================
          ANTIMATE AI FLOATING ICON
      ========================================================= */}

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

        /* ======================================================
           KNOWLEDGE CENTER PULSE
        ====================================================== */

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
           KNOWLEDGE CENTER NAV BUTTON
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

        .knowledge-nav-button:focus-visible {
          outline:
            3px solid
            rgba(0, 217, 255, 0.25);

          outline-offset: 3px;
        }

        /* ======================================================
           TRENDING BADGE
        ====================================================== */

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
           MOBILE KNOWLEDGE BUTTON
        ====================================================== */

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
        }

        @media (prefers-reduced-motion: reduce) {
          .antimate-ai-float-login,
          .antimate-ai-float-login::before,
          .antimate-ai-ring-login::before,
          .knowledge-trending-badge {
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
            FIXED HEADER
        ===================================================== */}

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

          {/* ===================================================
              NAVIGATION
          =================================================== */}

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
              href="#vision"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.navVision}
            </a>

            {/* ===============================================
                KNOWLEDGE CENTER BUTTON
            =============================================== */}

            <div className="knowledge-nav-wrapper">
              <button
                type="button"
                className="knowledge-nav-button"
                onClick={
                  openKnowledgeCenter
                }
                aria-label={
                  t.knowledge
                }
                title={
                  t.knowledge
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

              {/* TRENDING */}

              <span className="knowledge-trending-badge">
                <TrendingUp
                  size={9}
                  strokeWidth={3}
                />

                {t.trending}
              </span>
            </div>

            {/* ===============================================
                LOGIN
            =============================================== */}

            <button
              onClick={() => {
                setShowLogin(true);
                setMobileMenu(false);
              }}
              className="nav-login"
            >
              {t.login}
            </button>

            {/* ===============================================
                SIGNUP
            =============================================== */}

            <Link
              to="/signup"
              className="nav-signup"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              {t.signup}

              <ArrowRight
                size={15}
              />
            </Link>
          </nav>

          {/* =================================================
              NAVBAR TOOLS
          ================================================= */}

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
              title={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
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

                  <ArrowRight
                    size={18}
                  />
                </button>

                <a
                  href="#features"
                  className="secondary-button"
                >
                  {t.learn}
                </a>
              </div>

              <div className="hero-trust">
                <div>
                  <ShieldCheck
                    size={17}
                  />

                  <span>
                    {t.live}
                  </span>
                </div>

                <div>
                  <Leaf size={17} />

                  <span>
                    {t.smart}
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                HERO VISUAL
            ================================================= */}

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

          {/* ===================================================
              FEATURES
          =================================================== */}

          <section
            id="features"
            className="features-section"
          >
            <div className="section-heading">
              <span>
                ANTIMATE
              </span>

              <h2>
                {t.featuresTitle}
              </h2>
            </div>

            <div className="feature-grid">
              <Feature
                icon={<Wifi />}
                title={
                  t.feature1Title
                }
                text={
                  t.feature1Text
                }
              />

              <Feature
                icon={<Brain />}
                title={
                  t.feature2Title
                }
                text={
                  t.feature2Text
                }
              />

              <Feature
                icon={<LineChart />}
                title={
                  t.feature3Title
                }
                text={
                  t.feature3Text
                }
              />
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
                <HeartHandshake
                  size={17}
                />

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
                  <ShieldCheck
                    size={18}
                  />

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

          {/* ===================================================
              JOIN
          =================================================== */}

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

                <ArrowRight
                  size={18}
                />
              </Link>
            </div>
          </section>
        </main>

        {/* =====================================================
            PUBLIC ANTIMATE AI
        ===================================================== */}

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

        {/* =====================================================
            FOOTER
        ===================================================== */}

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
                <AntimateLogo
                  size={42}
                />
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
                {/* =========================================
                    IDENTIFIER
                ========================================= */}

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

                {/* =========================================
                    PASSWORD
                ========================================= */}

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

                {/* =========================================
                    ERROR
                ========================================= */}

                {message && (
                  <div className="login-error">
                    {message}
                  </div>
                )}

                {/* =========================================
                    LOGIN BUTTON
                ========================================= */}

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

              {/* =========================================
                  MODAL FOOTER
              ========================================= */}

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

// ============================================================
// FEATURE COMPONENT
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