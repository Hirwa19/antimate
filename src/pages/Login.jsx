import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import {
  Cpu,
  Wifi,
  Radio,
  Activity,
  Database,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  ArrowRight,
  Brain,
  Layers3,
  Cloud,
  Lock,
  LineChart,
  Globe2,
} from "lucide-react";
import "./Login.css";

// Antimate Logo Component
const AntimateLogo = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="antimate-svg-logo"
  >
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00d9ff" />
        <stop offset="100%" stopColor="#0055ff" />
      </linearGradient>
    </defs>
    {/* Outer 'A' Frame */}
    <path
      d="M50 10 L85 85 L65 85 L50 50 L35 85 L15 85 Z"
      fill="url(#logoGrad)"
    />
    {/* Inner Diagonal Slash */}
    <path
      d="M50 35 L62 60 L50 60 Z"
      fill="#00030a"
    />
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const departments = [
    {
      id: "ai",
      icon: <Brain size={26} />,
      title: "ANTIMATE AI",
      subtitle: "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING",
      color: "#00d9ff",
    },
    {
      id: "edge",
      icon: <Layers3 size={26} />,
      title: "ANTIMATE EDGE",
      subtitle: "IOT DEVICES & EDGE SOLUTIONS",
      color: "#00ff7f",
    },
    {
      id: "link",
      icon: <Wifi size={26} />,
      title: "ANTIMATE LINK",
      subtitle: "LORAWAN & WIRELESS CONNECTIVITY",
      color: "#c300ff",
    },
    {
      id: "cloud",
      icon: <Cloud size={26} />,
      title: "ANTIMATE CLOUD",
      subtitle: "CLOUD INFRASTRUCTURE & DATA SERVICES",
      color: "#00d9ff",
    },
  ];

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      const res = await loginUser({ identifier, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page antimate-theme">
      {/* BACKGROUND GLOW EFFECTS */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* NAVBAR */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon-logo">
            <AntimateLogo size={34} />
          </div>
          <div className="brand-text">
            <h1>ANTIMATE</h1>
            <p>INTELLIGENT TECHNOLOGY ECOSYSTEM</p>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#departments">Departments</a>
          <a href="#vision">Vision & Mission</a>
        </nav>

        <div className="nav-buttons">
          <button onClick={() => setShowLogin(true)} className="login-btn">
            Login
          </button>
          <Link to="/signup" className="signup-btn">
            Access Platform <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* HERO SECTION WITH IOT ANIMATION */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Smart Farming Powered by <br />
            <span>AI + IoT</span>
          </h1>
          <p>
            ANTIMATE Smart Brooder is an intelligent poultry management platform 
            combining real-time IoT devices, low-latency connectivity, cloud infrastructure, 
            and Artificial Intelligence to maximize farm productivity.
          </p>
          <div className="hero-cta">
            <button onClick={() => setShowLogin(true)} className="primary-btn">
              Access Platform <ArrowRight size={18} />
            </button>
            <a href="#departments" className="secondary-btn">Explore Ecosystem</a>
          </div>
        </div>

        {/* IoT Interactive Animation Area */}
        <div className="iot-animation-wrapper">
          <div className="iot-core">
            <AntimateLogo size={42} />
          </div>
          <div className="iot-orbit orbit-1">
            <div className="iot-node node1"><Cpu size={20} /></div>
          </div>
          <div className="iot-orbit orbit-2">
            <div className="iot-node node2"><Wifi size={20} /></div>
            <div className="iot-node node3"><Radio size={20} /></div>
          </div>
          <div className="iot-orbit orbit-3">
            <div className="iot-node node4"><Activity size={20} /></div>
            <div className="iot-node node5"><Database size={20} /></div>
            <div className="iot-node node6"><ShieldCheck size={20} /></div>
          </div>
        </div>
      </section>

      {/* CORE DEPARTMENTS SECTION */}
      <section id="departments" className="departments-section">
        <div className="section-header">
          <h2>Core Departments</h2>
          <p>The foundation of our intelligent technology ecosystem.</p>
        </div>
        <div className="department-grid">
          {departments.map((dept) => (
            <div key={dept.id} className="dept-card" style={{ "--dept-color": dept.color }}>
              <div className="dept-icon-wrapper">{dept.icon}</div>
              <h3>{dept.title}</h3>
              <p className="dept-subtitle">{dept.subtitle}</p>
              <div className="dept-glow-line"></div>
            </div>
          ))}
        </div>
      </section>

      {/* VISION & MISSION SECTION */}
      <section id="vision" className="vision-mission-container">
        <div id="vision-card" className="info-card">
          <div className="card-icon-wrapper"><Layers3 size={24} /></div>
          <h2>Our Vision</h2>
          <p>
            To transform global agriculture through intelligent technology where farmers seamlessly access 
            real-time telemetry, automated controls, and predictive AI solutions for superior yields.
          </p>
        </div>

        <div id="mission-card" className="info-card">
          <div className="card-icon-wrapper"><ShieldCheck size={24} /></div>
          <h2>Our Mission</h2>
          <p>
            To deliver affordable, robust, AI-powered IoT ecosystems that empower modern farmers to 
            precisely monitor, manage, and scale animal production with zero guesswork.
          </p>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="value-proposition">
        <div className="value-grid">
          <div className="value-item"><Brain /><h4>INTELLIGENT</h4><p>AI-powered solutions for a smarter future.</p></div>
          <div className="value-item"><Radio /><h4>CONNECTED</h4><p>Seamless devices and networks everywhere.</p></div>
          <div className="value-item"><Globe2 /><h4>SCALABLE</h4><p>Cloud infrastructure built to scale.</p></div>
          <div className="value-item"><Lock /><h4>SECURE</h4><p>Enterprise-grade security and data protection.</p></div>
          <div className="value-item"><LineChart /><h4>IMPACTFUL</h4><p>Real-world impact through innovation and technology.</p></div>
        </div>
      </section>

      <footer>
        <p>ANTIMATE EDGE AI © 2026 • Intelligent Agriculture Systems • Ecosystem by ANTIMATE</p>
      </footer>

      {/* LOGIN POPUP MODAL */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="login-card animate-scale-up">
            <button className="close-modal" onClick={() => setShowLogin(false)}>
              <X size={20} />
            </button>

            <div className="modal-header">
              <div className="brand-icon-modal">
                <AntimateLogo size={36} />
              </div>
              <h2>Welcome Back</h2>
              <p className="subtitle">Sign in to your ANTIMATE Dashboard</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>Email, Username, or Phone</label>
                <input
                  className="login-input"
                  placeholder="e.g. farmer@antimate.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="password-box">
                  <input
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="show-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {message && <div className="error-alert">{message}</div>}

              <button className="login-button" disabled={loading}>
                {loading ? <span className="spinner"></span> : "Sign In to Dashboard"}
              </button>
            </form>

            <div className="modal-footer">
              <Link className="forgot" to="/forgot-password" onClick={() => setShowLogin(false)}>
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;