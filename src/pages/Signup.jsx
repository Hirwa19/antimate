import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  checkUsername,
  registerUser,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../services/authService";

function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingUsername(true);
        const res = await checkUsername(username);
        setUsernameStatus(res.data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("error");
      } finally {
        setCheckingUsername(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  async function handleSendOtp() {
    try {
      if (!phone) {
        setMessage("Please enter phone number first");
        return;
      }

      setLoading(true);
      setMessage("");

      const res = await sendPhoneOtp(phone);
      setOtpSent(true);

      setMessage(
        res.data.devOtp
          ? `OTP sent. Dev OTP: ${res.data.devOtp}`
          : "OTP sent to your phone"
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      if (!otp) {
        setMessage("Please enter OTP");
        return;
      }

      setLoading(true);
      setMessage("");

      await verifyPhoneOtp(phone, otp);
      setPhoneVerified(true);
      setMessage("Phone verified successfully ✅");
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();

    if (usernameStatus !== "available") {
      setMessage("Please choose an available username");
      return;
    }

    if (!phoneVerified) {
      setMessage("Please verify your phone number first");
      return;
    }

    if (password !== repeatPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await registerUser({
        fullName,
        username,
        phone,
        password,
        repeatPassword,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/home");
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  function usernameIndicator() {
    if (checkingUsername) return <span style={styles.dotYellow}></span>;
    if (usernameStatus === "available") return <span style={styles.dotGreen}></span>;
    if (usernameStatus === "taken") return <span style={styles.dotRed}></span>;
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🐣</div>

        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Start monitoring your Smart Brooder</p>

        <form onSubmit={handleSignup}>
          <input
            style={styles.input}
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div style={styles.inputWrap}>
            <input
              style={{ ...styles.input, marginBottom: 0, paddingRight: "42px" }}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
            <div style={styles.indicator}>{usernameIndicator()}</div>
          </div>

          {usernameStatus === "available" && (
            <p style={styles.successText}>Username is available</p>
          )}
          {usernameStatus === "taken" && (
            <p style={styles.errorText}>Username is already taken</p>
          )}

          <div style={styles.phoneRow}>
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              placeholder="Phone number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneVerified(false);
                setOtpSent(false);
              }}
            />

            <button
              type="button"
              style={styles.smallBtn}
              onClick={handleSendOtp}
              disabled={loading || phoneVerified}
            >
              {phoneVerified ? "Verified" : "OTP"}
            </button>
          </div>

          {otpSent && !phoneVerified && (
            <div style={styles.phoneRow}>
              <input
                style={{ ...styles.input, marginBottom: 0 }}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <button
                type="button"
                style={styles.smallBtn}
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                Verify
              </button>
            </div>
          )}

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Repeat password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
          />

          {message && <p style={styles.message}>{message}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Create Account"}
          </button>
        </form>

        <p style={styles.linkText}>
          Already have an account?{" "}
          <Link style={styles.link} to="/login">
            Sign In
          </Link>
        </p>

        <p style={styles.footer}>ANTIMATE EDGE</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #020617, #0f172a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    color: "white",
    fontFamily: "Inter, Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "450px",
    background: "rgba(30,41,59,0.88)",
    padding: "28px",
    borderRadius: "30px",
    boxShadow: "0 25px 70px rgba(0,0,0,0.4)",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
  },

  logo: {
    width: "72px",
    height: "72px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #2dd4bf, #38bdf8)",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    margin: "0 auto 20px",
  },

  title: {
    margin: "0 0 6px",
    fontSize: "30px",
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: "24px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    marginBottom: "13px",
    borderRadius: "16px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "white",
    fontSize: "15px",
    outline: "none",
  },

  inputWrap: {
    position: "relative",
    marginBottom: "13px",
  },

  indicator: {
    position: "absolute",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
  },

  dotGreen: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 12px #22c55e",
    display: "block",
  },

  dotRed: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#ef4444",
    boxShadow: "0 0 12px #ef4444",
    display: "block",
  },

  dotYellow: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#f59e0b",
    boxShadow: "0 0 12px #f59e0b",
    display: "block",
  },

  phoneRow: {
    display: "grid",
    gridTemplateColumns: "1fr 90px",
    gap: "10px",
    marginBottom: "13px",
  },

  smallBtn: {
    border: "none",
    borderRadius: "16px",
    background: "#2dd4bf",
    color: "#06221f",
    fontWeight: "900",
    cursor: "pointer",
  },

  successText: {
    color: "#86efac",
    fontSize: "13px",
    margin: "-5px 0 12px",
    textAlign: "left",
  },

  errorText: {
    color: "#fca5a5",
    fontSize: "13px",
    margin: "-5px 0 12px",
    textAlign: "left",
  },

  message: {
    color: "#fde68a",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  button: {
    width: "100%",
    padding: "15px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e, #2dd4bf)",
    color: "#06221f",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "4px",
  },

  linkText: {
    marginTop: "18px",
    color: "#94a3b8",
  },

  link: {
    color: "#2dd4bf",
    fontWeight: "900",
    textDecoration: "none",
  },

  footer: {
    color: "#64748b",
    marginTop: "22px",
    fontWeight: "700",
    fontSize: "13px",
  },
};

export default Signup;