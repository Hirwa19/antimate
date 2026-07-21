import React, { useState } from "react";

export default function PaymentModal({ open, plan, onClose, onConfirm }) {
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
      setError("Failed to open Paypack. Please try again.");
      setPending(false);
    }
  }

  function handleClose() {
    setPending(false);
    setError("");
    setAccepted(false);
    onClose();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Complete Subscription</h2>

        <p style={styles.subtitle}>
          You are choosing <strong>{plan.name}</strong> plan for{" "}
          <strong>{plan.displayPrice}</strong>.
        </p>

        <div style={styles.infoBox}>
          You will be redirected to Paypack secure payment page.
        </div>

        <label style={styles.terms}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            disabled={pending}
          />
          <span>I agree to the terms and conditions.</span>
        </label>

        {pending && (
          <div style={styles.pendingBox}>
            <div style={styles.dot}></div>
            <p>Opening Paypack payment page...</p>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>

          <button
            style={{
              ...styles.payBtn,
              opacity: !accepted || pending ? 0.55 : 1,
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
    background: "rgba(0,0,0,0.58)",
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
    background: "rgba(15,23,42,0.96)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    boxShadow: "0 25px 70px rgba(0,0,0,0.45)",
  },

  title: {
    margin: 0,
    fontSize: "28px",
  },

  subtitle: {
    color: "#cbd5e1",
    lineHeight: "1.6",
  },

  infoBox: {
    marginTop: "18px",
    padding: "15px",
    borderRadius: "18px",
    background: "rgba(45,212,191,0.12)",
    border: "1px solid rgba(45,212,191,0.25)",
    color: "#ccfbf1",
    lineHeight: "1.6",
    fontSize: "14px",
  },

  terms: {
    marginTop: "18px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    color: "#cbd5e1",
    fontSize: "14px",
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
    color: "#fde68a",
    fontSize: "13px",
  },

  dot: {
    minWidth: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#f59e0b",
    boxShadow: "0 0 18px #f59e0b",
  },

  error: {
    color: "#fca5a5",
    marginTop: "14px",
    fontSize: "13px",
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
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },

  payBtn: {
    padding: "14px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },
};