import React, { useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";

export default function PaymentModal({ open, plan, onClose, onConfirm }) {
  const { isDark } = useAppSettings();

  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!open || !plan) return null;

  async function handlePay() {
    if (!accepted || pending) return;

    try {
      setPending(true);
      setError("");
      await onConfirm({ plan });
    } catch (err) {
      console.error("Payment redirect error:", err);
      setError(err?.message || "Failed to open Paypack. Please try again.");
      setPending(false);
    }
  }

  function handleClose() {
    setPending(false);
    setError("");
    setAccepted(false);
    onClose();
  }

  const modalBg = isDark ? "rgba(15,23,42,0.96)" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subtextColor = isDark ? "#cbd5e1" : "#475569";
  const borderColor = isDark
    ? "rgba(255,255,255,0.12)"
    : "rgba(15,23,42,0.08)";

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.modal,
          background: modalBg,
          color: textColor,
          border: borderColor,
        }}
      >
        <h2 style={styles.title}>Complete Subscription</h2>

        <p style={{ ...styles.subtitle, color: subtextColor }}>
          You are choosing <strong>{plan.name}</strong> plan for{" "}
          <strong>{plan.displayPrice}</strong>.
        </p>

        <div style={styles.infoBox}>
          You will be redirected to Paypack secure payment page.
        </div>

        <label style={{ ...styles.terms, color: subtextColor }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            disabled={pending}
            style={styles.checkbox}
          />
          <span>I agree to the terms and conditions.</span>
        </label>

        {pending && (
          <div style={styles.pendingBox}>
            <div style={styles.dot}></div>
            <p style={{ margin: 0 }}>Opening Paypack payment page...</p>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button
            style={{
              ...styles.cancelBtn,
              background: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(15,23,42,0.05)",
              color: textColor,
              border: borderColor,
            }}
            onClick={handleClose}
            disabled={pending}
          >
            Cancel
          </button>

          <button
            style={{
              ...styles.payBtn,
              opacity: !accepted || pending ? 0.55 : 1,
              cursor: !accepted || pending ? "not-allowed" : "pointer",
            }}
            disabled={!accepted || pending}
            onClick={handlePay}
          >
            {pending ? "Opening..." : "Continue to Paypack"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "18px",
  },
  modal: {
    width: "100%",
    maxWidth: "430px",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 25px 70px rgba(0,0,0,0.45)",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 750,
  },
  subtitle: {
    marginTop: "8px",
    lineHeight: "1.6",
    fontSize: "14px",
  },
  infoBox: {
    marginTop: "18px",
    padding: "15px",
    borderRadius: "18px",
    background: "rgba(45,212,191,0.12)",
    border: "1px solid rgba(45,212,191,0.25)",
    color: "#0d9488",
    lineHeight: "1.6",
    fontSize: "14px",
    fontWeight: "500",
  },
  terms: {
    marginTop: "18px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    fontSize: "14px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  pendingBox: {
    marginTop: "18px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.25)",
    color: "#d97706",
    fontSize: "13px",
    fontWeight: "600",
  },
  dot: {
    minWidth: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#f59e0b",
    boxShadow: "0 0 14px #f59e0b",
  },
  error: {
    color: "#ef4444",
    marginTop: "14px",
    fontSize: "13px",
    fontWeight: "600",
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1.6fr",
    gap: "12px",
    marginTop: "24px",
  },
  cancelBtn: {
    padding: "14px",
    borderRadius: "16px",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "14px",
  },
  payBtn: {
    padding: "14px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "14px",
  },
};