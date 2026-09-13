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

  // ==========================================================
  // FORM
  // ==========================================================

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // ==========================================================
  // USERNAME
  // ==========================================================

  const [usernameStatus, setUsernameStatus] =
    useState(null);

  const [checkingUsername, setCheckingUsername] =
    useState(false);

  // ==========================================================
  // PHONE OTP
  // ==========================================================

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] =
    useState(false);

  // ==========================================================
  // UI
  // ==========================================================

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("info");

  // ==========================================================
  // USERNAME CHECK
  // ==========================================================

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingUsername(true);

        const res = await checkUsername(
          username
        );

        setUsernameStatus(
          res.data.available
            ? "available"
            : "taken"
        );
      } catch {
        setUsernameStatus("error");
      } finally {
        setCheckingUsername(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  // ==========================================================
  // SEND OTP
  // ==========================================================

  async function handleSendOtp() {
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setMessage(
        "Please enter your phone number first."
      );
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res =
        await sendPhoneOtp(cleanPhone);

      setOtpSent(true);
      setPhoneVerified(false);
      setOtp("");

      setMessage(
        res.data.devOtp
          ? `OTP sent. Dev OTP: ${res.data.devOtp}`
          : "OTP sent to your phone."
      );

      setMessageType("success");
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Failed to send OTP."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      setMessage(
        "Please enter the OTP you received."
      );
      setMessageType("error");
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

      setMessage(
        "Phone number verified successfully."
      );

      setMessageType("success");
    } catch (err) {
      setPhoneVerified(false);

      setMessage(
        err.response?.data?.message ||
          "OTP verification failed."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // PHONE CHANGE
  // ==========================================================

  function handlePhoneChange(e) {
    const value = e.target.value;

    setPhone(value);

    // Changing phone invalidates previous verification.
    setPhoneVerified(false);
    setOtpSent(false);
    setOtp("");

    if (messageType === "success") {
      setMessage("");
    }
  }

  // ==========================================================
  // SIGNUP
  // ==========================================================

  async function handleSignup(e) {
    e.preventDefault();

    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
      setMessageType("error");
      return;
    }

    if (
      !username.trim() ||
      username.trim().length < 3
    ) {
      setMessage(
        "Please choose a valid username."
      );
      setMessageType("error");
      return;
    }

    if (
      usernameStatus !== "available"
    ) {
      setMessage(
        "Please choose an available username."
      );
      setMessageType("error");
      return;
    }

    if (!phone.trim()) {
      setMessage(
        "Phone number is required."
      );
      setMessageType("error");
      return;
    }

    if (!phoneVerified) {
      setMessage(
        "Please verify your phone number first."
      );
      setMessageType("error");
      return;
    }

    if (!password) {
      setMessage(
        "Please enter a password."
      );
      setMessageType("error");
      return;
    }

    if (password !== repeatPassword) {
      setMessage(
        "Passwords do not match."
      );
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const userData = {
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        password,
        repeatPassword,
      };

      // Email is optional.
      // Only send it when the user actually entered one.
      if (email.trim()) {
        userData.email =
          email.trim().toLowerCase();
      }

      const res =
        await registerUser(userData);

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
          err.message ||
          "Signup failed."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // USERNAME INDICATOR
  // ==========================================================

  function usernameIndicator() {
    if (checkingUsername) {
      return (
        <span className="statusDot yellow" />
      );
    }

    if (
      usernameStatus === "available"
    ) {
      return (
        <span className="statusDot green" />
      );
    }

    if (
      usernameStatus === "taken"
    ) {
      return (
        <span className="statusDot red" />
      );
    }

    return null;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .signup-page {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background:
            radial-gradient(
              circle at top left,
              rgba(45, 212, 191, 0.12),
              transparent 35%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(56, 189, 248, 0.10),
              transparent 35%
            ),
            linear-gradient(
              160deg,
              #020617,
              #0f172a
            );

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px 16px;

          color: #ffffff;

          font-family:
            Inter,
            Arial,
            sans-serif;
        }

        .signup-card {
          width: 100%;
          max-width: 450px;

          background:
            rgba(30, 41, 59, 0.92);

          border:
            1px solid
            rgba(255, 255, 255, 0.08);

          border-radius: 28px;

          padding: 30px;

          box-shadow:
            0 25px 70px
            rgba(0, 0, 0, 0.42);

          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .signup-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .signup-logo {
          width: 70px;
          height: 70px;

          margin: 0 auto 18px;

          border-radius: 22px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #2dd4bf,
              #38bdf8
            );

          color: #0f172a;

          font-size: 34px;

          box-shadow:
            0 12px 35px
            rgba(45, 212, 191, 0.18);
        }

        .signup-title {
          margin: 0 0 7px;

          font-size: 29px;
          line-height: 1.2;
          font-weight: 800;

          letter-spacing: -0.4px;
        }

        .signup-subtitle {
          margin: 0;

          color: #94a3b8;

          font-size: 14px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 13px;
        }

        .input {
          width: 100%;

          padding: 14px 15px;

          border:
            1px solid #334155;

          border-radius: 15px;

          background: #0f172a;

          color: #ffffff;

          font-size: 15px;

          outline: none;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .input::placeholder {
          color: #64748b;
        }

        .input:focus {
          border-color: #2dd4bf;

          box-shadow:
            0 0 0 3px
            rgba(45, 212, 191, 0.10);
        }

        .input:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .input-wrap {
          position: relative;
        }

        .username-input {
          padding-right: 45px;
        }

        .indicator {
          position: absolute;

          right: 15px;
          top: 50%;

          transform:
            translateY(-50%);
        }

        .statusDot {
          display: block;

          width: 11px;
          height: 11px;

          border-radius: 50%;
        }

        .statusDot.green {
          background: #22c55e;

          box-shadow:
            0 0 12px
            rgba(34, 197, 94, 0.75);
        }

        .statusDot.red {
          background: #ef4444;

          box-shadow:
            0 0 12px
            rgba(239, 68, 68, 0.75);
        }

        .statusDot.yellow {
          background: #f59e0b;

          box-shadow:
            0 0 12px
            rgba(245, 158, 11, 0.75);
        }

        .field-hint {
          margin:
            -5px 0
            11px;

          font-size: 12px;

          color: #64748b;

          text-align: left;
        }

        .success-text {
          margin:
            -5px 0
            12px;

          color: #86efac;

          font-size: 13px;

          text-align: left;
        }

        .error-text {
          margin:
            -5px 0
            12px;

          color: #fca5a5;

          font-size: 13px;

          text-align: left;
        }

        .phone-section {
          margin-top: 4px;
          margin-bottom: 15px;
        }

        .section-label {
          display: block;

          margin-bottom: 7px;

          color: #cbd5e1;

          font-size: 13px;

          font-weight: 700;

          text-align: left;
        }

        .required {
          color: #f87171;
        }

        .optional {
          color: #64748b;

          font-weight: 500;
        }

        .phone-row {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            105px;

          gap: 9px;
        }

        .otp-row {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            105px;

          gap: 9px;

          margin-top: 9px;
        }

        .small-button {
          min-height: 48px;

          border: none;

          border-radius: 15px;

          background: #2dd4bf;

          color: #06221f;

          font-size: 14px;

          font-weight: 800;

          cursor: pointer;

          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .small-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .small-button:disabled {
          opacity: 0.45;

          cursor: not-allowed;

          transform: none;
        }

        .verified-box {
          margin-top: 9px;

          padding: 11px 13px;

          border-radius: 13px;

          background:
            rgba(34, 197, 94, 0.08);

          border:
            1px solid
            rgba(34, 197, 94, 0.20);

          color: #86efac;

          font-size: 13px;

          text-align: left;
        }

        .message {
          margin:
            3px 0
            13px;

          padding: 11px 13px;

          border-radius: 12px;

          font-size: 13px;

          line-height: 1.45;

          text-align: left;
        }

        .message.success {
          color: #bbf7d0;

          background:
            rgba(34, 197, 94, 0.08);

          border:
            1px solid
            rgba(34, 197, 94, 0.18);
        }

        .message.error {
          color: #fecaca;

          background:
            rgba(239, 68, 68, 0.08);

          border:
            1px solid
            rgba(239, 68, 68, 0.18);
        }

        .message.info {
          color: #fde68a;

          background:
            rgba(245, 158, 11, 0.08);

          border:
            1px solid
            rgba(245, 158, 11, 0.18);
        }

        .create-button {
          width: 100%;

          min-height: 50px;

          padding: 14px 16px;

          border: none;

          border-radius: 15px;

          background:
            linear-gradient(
              135deg,
              #22c55e,
              #2dd4bf
            );

          color: #06221f;

          font-size: 16px;

          font-weight: 900;

          cursor: pointer;

          transition:
            transform 0.15s ease,
            opacity 0.15s ease,
            filter 0.15s ease;

          margin-top: 3px;
        }

        .create-button:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.04);
        }

        .create-button:disabled {
          opacity: 0.35;

          cursor: not-allowed;

          filter: grayscale(0.35);

          transform: none;
        }

        .verification-required {
          margin:
            8px 0
            0;

          color: #94a3b8;

          font-size: 11px;

          text-align: center;
        }

        .login-text {
          margin:
            18px 0
            0;

          color: #94a3b8;

          font-size: 14px;

          text-align: center;
        }

        .login-link {
          color: #2dd4bf;

          font-weight: 800;

          text-decoration: none;
        }

        .login-link:hover {
          text-decoration: underline;
        }

        .footer {
          margin:
            20px 0
            0;

          color: #64748b;

          font-size: 12px;

          font-weight: 700;

          letter-spacing: 0.4px;

          text-align: center;
        }

        @media (max-width: 520px) {
          .signup-page {
            padding:
              16px 12px;
          }

          .signup-card {
            padding: 23px 18px;

            border-radius: 23px;
          }

          .signup-logo {
            width: 62px;
            height: 62px;

            border-radius: 19px;

            font-size: 30px;

            margin-bottom: 15px;
          }

          .signup-title {
            font-size: 25px;
          }

          .signup-subtitle {
            font-size: 13px;
          }

          .phone-row,
          .otp-row {
            grid-template-columns:
              minmax(0, 1fr)
              92px;
          }

          .input {
            padding:
              13px 14px;
          }

          .small-button {
            min-height: 46px;
          }

          .create-button {
            min-height: 48px;
          }
        }

        @media (max-width: 360px) {
          .signup-card {
            padding:
              20px 14px;
          }

          .phone-row,
          .otp-row {
            grid-template-columns:
              1fr;
          }

          .small-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="signup-page">
        <div className="signup-card">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="signup-header">
            <div className="signup-logo">
              🐣
            </div>

            <h1 className="signup-title">
              Create Account
            </h1>

            <p className="signup-subtitle">
              Start monitoring your Smart Brooder
            </p>
          </div>

          {/* ==================================================
              FORM
          ================================================== */}

          <form onSubmit={handleSignup}>

            {/* FULL NAME */}

            <div className="form-group">
              <input
                className="input"
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
                autoComplete="name"
              />
            </div>

            {/* USERNAME */}

            <div className="form-group">
              <div className="input-wrap">
                <input
                  className="input username-input"
                  type="text"
                  placeholder="Username"
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

                <div className="indicator">
                  {usernameIndicator()}
                </div>
              </div>
            </div>

            {usernameStatus ===
              "available" && (
              <p className="success-text">
                Username is available.
              </p>
            )}

            {usernameStatus ===
              "taken" && (
              <p className="error-text">
                Username is already taken.
              </p>
            )}

            {/* EMAIL */}

            <div className="form-group">
              <label className="section-label">
                Email{" "}
                <span className="optional">
                  (optional)
                </span>
              </label>

              <input
                className="input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                autoComplete="email"
              />

              <p className="field-hint">
                You can leave this empty.
              </p>
            </div>

            {/* PHONE */}

            <div className="phone-section">
              <label className="section-label">
                Phone number{" "}
                <span className="required">
                  *
                </span>
              </label>

              <div className="phone-row">
                <input
                  className="input"
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={
                    handlePhoneChange
                  }
                  disabled={
                    phoneVerified
                  }
                  autoComplete="tel"
                />

                <button
                  type="button"
                  className="small-button"
                  onClick={
                    handleSendOtp
                  }
                  disabled={
                    loading ||
                    !phone.trim() ||
                    phoneVerified
                  }
                >
                  {phoneVerified
                    ? "Verified"
                    : otpSent
                    ? "Resend OTP"
                    : "Send OTP"}
                </button>
              </div>

              {/* OTP */}

              {otpSent &&
                !phoneVerified && (
                  <div className="otp-row">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      autoComplete="one-time-code"
                    />

                    <button
                      type="button"
                      className="small-button"
                      onClick={
                        handleVerifyOtp
                      }
                      disabled={
                        loading ||
                        otp.length === 0
                      }
                    >
                      Verify
                    </button>
                  </div>
                )}

              {phoneVerified && (
                <div className="verified-box">
                  ✓ Phone number verified
                </div>
              )}
            </div>

            {/* PASSWORD */}

            <div className="form-group">
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                autoComplete="new-password"
              />
            </div>

            {/* REPEAT PASSWORD */}

            <div className="form-group">
              <input
                className="input"
                type="password"
                placeholder="Repeat password"
                value={repeatPassword}
                onChange={(e) =>
                  setRepeatPassword(
                    e.target.value
                  )
                }
                autoComplete="new-password"
              />
            </div>

            {/* MESSAGE */}

            {message && (
              <p
                className={`message ${messageType}`}
              >
                {message}
              </p>
            )}

            {/* CREATE ACCOUNT */}

            <button
              className="create-button"
              type="submit"
              disabled={
                loading ||
                !phoneVerified ||
                usernameStatus !==
                  "available"
              }
            >
              {loading
                ? "Please wait..."
                : "Create Account"}
            </button>

            {!phoneVerified && (
              <p className="verification-required">
                Verify your phone number to create
                your account.
              </p>
            )}
          </form>

          {/* LOGIN */}

          <p className="login-text">
            Already have an account?{" "}
            <Link
              className="login-link"
              to="/login"
            >
              Sign In
            </Link>
          </p>

          <p className="footer">
            ANTIMATE EDGE
          </p>
        </div>
      </div>
    </>
  );
}

export default Signup;