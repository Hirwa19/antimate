import { useState } from "react";
import { Link } from "react-router-dom";
import {
  sendForgotPasswordOtp,
  resetPassword,
} from "../services/authService";

function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState("phone");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSendOtp(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const res = await sendForgotPasswordOtp({
        identifier,
        method,
      });

      setUserId(res.data.userId);
      setStep(2);

      setMessage(
        res.data.devOtp
          ? `OTP sent. Dev OTP: ${res.data.devOtp}`
          : `OTP sent to your ${method}`
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    if (password !== repeatPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await resetPassword({
        userId,
        otp,
        password,
        repeatPassword,
      });

      setMessage("Password reset successfully ✅ You can login now.");
      setStep(3);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🔐</div>

        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>
          Reset your Smart Brooder account password
        </p>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <input
              style={styles.input}
              placeholder="Email / Username / Phone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <div style={styles.methodBox}>
              <button
                type="button"
                onClick={() => setMethod("phone")}
                style={{
                  ...styles.methodBtn,
                  background:
                    method === "phone"
                      ? "linear-gradient(135deg, #2dd4bf, #38bdf8)"
                      : "rgba(255,255,255,0.08)",
                  color: method === "phone" ? "#06221f" : "#cbd5e1",
                }}
              >
                Phone OTP
              </button>

              <button
                type="button"
                onClick={() => setMethod("email")}
                style={{
                  ...styles.methodBtn,
                  background:
                    method === "email"
                      ? "linear-gradient(135deg, #2dd4bf, #38bdf8)"
                      : "rgba(255,255,255,0.08)",
                  color: method === "email" ? "#06221f" : "#cbd5e1",
                }}
              >
                Email OTP
              </button>
            </div>

            {message && <p style={styles.message}>{message}</p>}

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <input
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Repeat new password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />

            {message && <p style={styles.message}>{message}</p>}

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div>
            {message && <p style={styles.success}>{message}</p>}

            <Link style={styles.buttonLink} to="/login">
              Go to Login
            </Link>
          </div>
        )}

        <p style={styles.linkText}>
          Remember password?{" "}
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
    maxWidth: "430px",
    background: "rgba(30,41,59,0.88)",
    padding: "30px",
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
    marginBottom: "25px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    marginBottom: "14px",
    borderRadius: "16px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "white",
    fontSize: "15px",
    outline: "none",
  },

  methodBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "14px",
  },

  methodBtn: {
    padding: "13px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
  },

  message: {
    color: "#fde68a",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  success: {
    color: "#86efac",
    fontSize: "14px",
    lineHeight: "1.6",
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

  buttonLink: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #22c55e, #2dd4bf)",
    color: "#06221f",
    fontWeight: "900",
    fontSize: "16px",
    textDecoration: "none",
    marginTop: "18px",
  },

  linkText: {
    marginTop: "20px",
    color: "#94a3b8",
  },

  link: {
    color: "#2dd4bf",
    fontWeight: "900",
    textDecoration: "none",
  },

  footer: {
    color: "#64748b",
    marginTop: "24px",
    fontWeight: "700",
    fontSize: "13px",
  },
};

export default ForgotPassword;