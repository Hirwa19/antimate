import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      setCheckingUsername(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingUsername(true);

        const res = await checkUsername(username);

        setUsernameStatus(
          res.data.available ? "available" : "taken"
        );
      } catch {
        setUsernameStatus("error");
      } finally {
        setCheckingUsername(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      showMessage(
        "Please enter your phone number first.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await sendPhoneOtp(phone.trim());

      setOtpSent(true);
      setOtp("");
      setPhoneVerified(false);

      showMessage(
        res.data.message || "OTP sent to your phone.",
        "success"
      );
    } catch (err) {
      showMessage(
        err.response?.data?.message ||
          "Failed to send OTP. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      showMessage(
        "Please enter the OTP sent to your phone.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await verifyPhoneOtp(
        phone.trim(),
        otp.trim()
      );

      setPhoneVerified(true);

      showMessage(
        "Phone number verified successfully.",
        "success"
      );
    } catch (err) {
      setPhoneVerified(false);

      showMessage(
        err.response?.data?.message ||
          "OTP verification failed.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePhoneChange(e) {
    const value = e.target.value;

    setPhone(value);

    // Changing the phone invalidates previous verification.
    setPhoneVerified(false);
    setOtpSent(false);
    setOtp("");
  }

  async function handleSignup(e) {
    e.preventDefault();

    if (!fullName.trim()) {
      showMessage(
        "Please enter your full name.",
        "error"
      );
      return;
    }

    if (usernameStatus !== "available") {
      showMessage(
        "Please choose an available username.",
        "error"
      );
      return;
    }

    if (!phone.trim()) {
      showMessage(
        "Phone number is required.",
        "error"
      );
      return;
    }

    if (!phoneVerified) {
      showMessage(
        "Please verify your phone number first.",
        "error"
      );
      return;
    }

    if (!password) {
      showMessage(
        "Please enter a password.",
        "error"
      );
      return;
    }

    if (password !== repeatPassword) {
      showMessage(
        "Passwords do not match.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await registerUser({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim() || null,
        phone: phone.trim(),
        password,
        repeatPassword,
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
      showMessage(
        err.response?.data?.message ||
          err.message ||
          "Account creation failed.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  const canCreateAccount =
    fullName.trim() &&
    usernameStatus === "available" &&
    phone.trim() &&
    phoneVerified &&
    password &&
    repeatPassword &&
    password === repeatPassword;

  function usernameIndicator() {
    if (checkingUsername) {
      return (
        <span
          style={styles.dotYellow}
          aria-label="Checking username"
        />
      );
    }

    if (usernameStatus === "available") {
      return (
        <span
          style={styles.dotGreen}
          aria-label="Username available"
        />
      );
    }

    if (
      usernameStatus === "taken" ||
      usernameStatus === "error"
    ) {
      return (
        <span
          style={styles.dotRed}
          aria-label="Username unavailable"
        />
      );
    }

    return null;
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        {/* BRAND */}
        <div style={styles.brand}>
          <span style={styles.brandMain}>
            ANTIMATE
          </span>

          <span style={styles.brandLine} />
        </div>

        {/* HEADER */}
        <header style={styles.header}>
          <h1 style={styles.title}>
            Create your account
          </h1>

          <p style={styles.subtitle}>
            Join ANTIMATE and connect your smart
            devices securely.
          </p>
        </header>

        {/* FORM */}
        <form
          onSubmit={handleSignup}
          style={styles.form}
        >
          {/* FULL NAME */}
          <div style={styles.field}>
            <label style={styles.label}>
              Full name
            </label>

            <input
              style={styles.input}
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              autoComplete="name"
            />
          </div>

          {/* USERNAME */}
          <div style={styles.field}>
            <label style={styles.label}>
              Username
            </label>

            <div style={styles.inputWrap}>
              <input
                style={{
                  ...styles.input,
                  marginBottom: 0,
                  paddingRight: "46px",
                }}
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .toLowerCase()
                      .replace(/\s/g, "")
                  )
                }
                autoComplete="username"
              />

              <div style={styles.indicator}>
                {usernameIndicator()}
              </div>
            </div>

            {usernameStatus === "available" && (
              <p style={styles.successText}>
                Username is available
              </p>
            )}

            {usernameStatus === "taken" && (
              <p style={styles.errorText}>
                Username is already taken
              </p>
            )}

            {usernameStatus === "error" && (
              <p style={styles.errorText}>
                Unable to check username
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div style={styles.field}>
            <label style={styles.label}>
              Email
              <span style={styles.optional}>
                Optional
              </span>
            </label>

            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
            />
          </div>

          {/* PHONE */}
          <div style={styles.field}>
            <label style={styles.label}>
              Phone number
              <span style={styles.required}>
                Required
              </span>
            </label>

            <div style={styles.actionRow}>
              <input
                style={{
                  ...styles.input,
                  marginBottom: 0,
                }}
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={handlePhoneChange}
                autoComplete="tel"
                disabled={phoneVerified}
              />

              {!phoneVerified && (
                <button
                  type="button"
                  style={{
                    ...styles.secondaryButton,
                    opacity: loading ? 0.65 : 1,
                  }}
                  onClick={handleSendOtp}
                  disabled={
                    loading ||
                    !phone.trim()
                  }
                >
                  {loading && !otpSent
                    ? "Sending..."
                    : otpSent
                    ? "Resend OTP"
                    : "Send OTP"}
                </button>
              )}

              {phoneVerified && (
                <div style={styles.verifiedBadge}>
                  ✓ Verified
                </div>
              )}
            </div>
          </div>

          {/* OTP */}
          {otpSent && !phoneVerified && (
            <div style={styles.field}>
              <label style={styles.label}>
                Verification code
              </label>

              <div style={styles.actionRow}>
                <input
                  style={{
                    ...styles.input,
                    marginBottom: 0,
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                    )
                  }
                  autoComplete="one-time-code"
                />

                <button
                  type="button"
                  style={{
                    ...styles.secondaryButton,
                    opacity: loading ? 0.65 : 1,
                  }}
                  onClick={handleVerifyOtp}
                  disabled={
                    loading ||
                    otp.trim().length < 4
                  }
                >
                  {loading
                    ? "Checking..."
                    : "Verify"}
                </button>
              </div>

              <p style={styles.helperText}>
                Enter the verification code sent
                to your phone.
              </p>
            </div>
          )}

          {/* PASSWORD */}
          <div style={styles.field}>
            <label style={styles.label}>
              Password
            </label>

            <input
              style={styles.input}
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="new-password"
            />
          </div>

          {/* REPEAT PASSWORD */}
          <div style={styles.field}>
            <label style={styles.label}>
              Repeat password
            </label>

            <input
              style={styles.input}
              type="password"
              placeholder="Repeat your password"
              value={repeatPassword}
              onChange={(e) =>
                setRepeatPassword(
                  e.target.value
                )
              }
              autoComplete="new-password"
            />

            {repeatPassword &&
              password !== repeatPassword && (
                <p style={styles.errorText}>
                  Passwords do not match
                </p>
              )}

            {repeatPassword &&
              password === repeatPassword && (
                <p style={styles.successText}>
                  Passwords match
                </p>
              )}
          </div>

          {/* MESSAGE */}
          {message && (
            <div
              style={{
                ...styles.message,
                ...(messageType === "success"
                  ? styles.messageSuccess
                  : messageType === "error"
                  ? styles.messageError
                  : styles.messageInfo),
              }}
            >
              {message}
            </div>
          )}

          {/* CREATE ACCOUNT */}
          <button
            type="submit"
            style={{
              ...styles.createButton,
              ...(canCreateAccount
                ? styles.createButtonEnabled
                : styles.createButtonDisabled),
            }}
            disabled={
              loading || !canCreateAccount
            }
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>

          {!phoneVerified && (
            <p style={styles.verificationNotice}>
              Verify your phone number to enable
              account creation.
            </p>
          )}
        </form>

        {/* LOGIN */}
        <div style={styles.loginSection}>
          <span style={styles.loginText}>
            Already have an account?
          </span>

          <Link
            to="/login"
            style={styles.loginLink}
          >
            Sign In
          </Link>
        </div>

        {/* FOOTER */}
        <footer style={styles.footer}>
          ANTIMATE · SMART CONNECTED SYSTEMS
        </footer>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #07111f 0%, #0b1220 48%, #10142a 100%)",
    color: "#f8fafc",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 20px",
    overflowX: "hidden",
  },

  container: {
    width: "100%",
    maxWidth: "520px",
    boxSizing: "border-box",
  },

  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: "42px",
  },

  brandMain: {
    fontSize: "25px",
    fontWeight: "900",
    letterSpacing: "5px",
    lineHeight: 1,
    background:
      "linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  brandLine: {
    width: "52px",
    height: "3px",
    borderRadius: "999px",
    marginTop: "9px",
    background:
      "linear-gradient(90deg, #38bdf8, #a78bfa)",
  },

  header: {
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
    fontWeight: "800",
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin:
      "10px 0 0",
    color: "#94a3b8",
    fontSize: "15px",
    lineHeight: 1.6,
    maxWidth: "450px",
  },

  form: {
    width: "100%",
  },

  field: {
    width: "100%",
    marginBottom: "20px",
  },

  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "700",
  },

  optional: {
    color: "#64748b",
    fontWeight: "500",
    fontSize: "12px",
  },

  required: {
    color: "#94a3b8",
    fontWeight: "500",
    fontSize: "12px",
  },

  input: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    height: "50px",
    padding: "0 15px",
    borderRadius: "12px",
    border:
      "1px solid rgba(148, 163, 184, 0.22)",
    background:
      "rgba(15, 23, 42, 0.68)",
    color: "#f8fafc",
    fontSize: "15px",
    outline: "none",
    transition:
      "border-color 0.2s ease, background 0.2s ease",
  },

  inputWrap: {
    position: "relative",
    width: "100%",
  },

  indicator: {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },

  dotGreen: {
    display: "block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow:
      "0 0 10px rgba(34, 197, 94, 0.65)",
  },

  dotRed: {
    display: "block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#ef4444",
    boxShadow:
      "0 0 10px rgba(239, 68, 68, 0.65)",
  },

  dotYellow: {
    display: "block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#f59e0b",
    boxShadow:
      "0 0 10px rgba(245, 158, 11, 0.65)",
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 118px",
    gap: "10px",
    alignItems: "stretch",
  },

  secondaryButton: {
    minWidth: 0,
    height: "50px",
    padding: "0 12px",
    border: "1px solid rgba(56, 189, 248, 0.35)",
    borderRadius: "12px",
    background:
      "rgba(14, 165, 233, 0.12)",
    color: "#7dd3fc",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  verifiedBadge: {
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 12px",
    boxSizing: "border-box",
    borderRadius: "12px",
    border:
      "1px solid rgba(34, 197, 94, 0.35)",
    background:
      "rgba(34, 197, 94, 0.10)",
    color: "#86efac",
    fontSize: "13px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  helperText: {
    margin:
      "8px 0 0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  successText: {
    margin:
      "7px 0 0",
    color: "#86efac",
    fontSize: "12px",
    fontWeight: "600",
  },

  errorText: {
    margin:
      "7px 0 0",
    color: "#fca5a5",
    fontSize: "12px",
    fontWeight: "600",
  },

  message: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    margin:
      "4px 0 16px",
    borderRadius: "10px",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  messageSuccess: {
    color: "#86efac",
    background:
      "rgba(34, 197, 94, 0.08)",
    border:
      "1px solid rgba(34, 197, 94, 0.18)",
  },

  messageError: {
    color: "#fca5a5",
    background:
      "rgba(239, 68, 68, 0.08)",
    border:
      "1px solid rgba(239, 68, 68, 0.18)",
  },

  messageInfo: {
    color: "#cbd5e1",
    background:
      "rgba(148, 163, 184, 0.08)",
    border:
      "1px solid rgba(148, 163, 184, 0.15)",
  },

  createButton: {
    width: "100%",
    height: "52px",
    borderRadius: "13px",
    border: "none",
    fontSize: "15px",
    fontWeight: "800",
    letterSpacing: "0.1px",
    transition:
      "opacity 0.2s ease, transform 0.2s ease",
  },

  createButtonEnabled: {
    background:
      "linear-gradient(90deg, #38bdf8, #818cf8)",
    color: "#ffffff",
    cursor: "pointer",
    boxShadow:
      "0 12px 30px rgba(59, 130, 246, 0.18)",
  },

  createButtonDisabled: {
    background:
      "rgba(71, 85, 105, 0.45)",
    color: "#64748b",
    cursor: "not-allowed",
  },

  verificationNotice: {
    margin:
      "10px 0 0",
    textAlign: "center",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  loginSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "28px",
  },

  loginText: {
    color: "#64748b",
    fontSize: "13px",
  },

  loginLink: {
    color: "#7dd3fc",
    fontSize: "13px",
    fontWeight: "800",
    textDecoration: "none",
  },

  footer: {
    marginTop: "36px",
    paddingTop: "18px",
    borderTop:
      "1px solid rgba(148, 163, 184, 0.10)",
    color: "#475569",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    textAlign: "center",
  },
};

export default Signup;