import React from "react";

export default function SuccessModal({
  open,
  title,
  message,
  onClose,
}) {
  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.icon}>✓</div>

        <h2 style={styles.title}>{title}</h2>

        <p style={styles.message}>{message}</p>

        <button style={styles.button} onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },

  modal: {
    width: "100%",
    maxWidth: "360px",
    borderRadius: "28px",
    background: "rgba(15,23,42,0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "34px 28px",
    textAlign: "center",
    color: "#fff",
    animation: "pop 0.3s ease",
  },

  icon: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    fontWeight: "900",
    margin: "0 auto 22px",
    boxShadow: "0 0 30px rgba(34,197,94,0.4)",
  },

  title: {
    margin: 0,
    fontSize: "28px",
  },

  message: {
    marginTop: "14px",
    lineHeight: "1.7",
    color: "#cbd5e1",
  },

  button: {
    width: "100%",
    marginTop: "28px",
    padding: "14px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    color: "#fff",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "15px",
  },
};