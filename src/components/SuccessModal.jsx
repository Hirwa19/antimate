import React from "react";
import { useAppSettings } from "../context/AppSettingsContext";

export default function SuccessModal({
  open,
  title = "Success",
  message = "Action completed successfully.",
  onClose,
}) {
  const { isDark } = useAppSettings();

  if (!open) return null;

  const modalBg = isDark ? "rgba(15,23,42,0.96)" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subtextColor = isDark ? "#cbd5e1" : "#475569";
  const borderColor = isDark
    ? "rgba(255,255,255,0.08)"
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
        <div style={styles.icon}>✓</div>

        <h2 style={styles.title}>{title}</h2>

        <p style={{ ...styles.message, color: subtextColor }}>{message}</p>

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
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(12px)",
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
    padding: "34px 28px",
    textAlign: "center",
    boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
  },
  icon: {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    fontWeight: "900",
    margin: "0 auto 20px",
    boxShadow: "0 0 30px rgba(34,197,94,0.35)",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 750,
  },
  message: {
    marginTop: "12px",
    lineHeight: "1.6",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    marginTop: "26px",
    padding: "14px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "15px",
  },
};