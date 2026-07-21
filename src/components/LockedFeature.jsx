import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";

export default function LockedFeature({
  title,
  description,
  requiredPlan = "Basic",
}) {
  const navigate = useNavigate();
  const { isDark } = useAppSettings();

  return (
    <div
      style={{
        ...styles.card,
        background: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.78)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px solid rgba(15,23,42,0.08)",
        color: isDark ? "#fff" : "#0f172a",
      }}
    >
      <div style={styles.icon}>🔒</div>

      <h2 style={styles.title}>{title}</h2>

      <p
        style={{
          ...styles.description,
          color: isDark ? "#cbd5e1" : "#475569",
        }}
      >
        {description}
      </p>

      <div style={styles.planBadge}>
        Requires {requiredPlan} Plan
      </div>

      <button
        style={styles.button}
        onClick={() => navigate("/plan")}
      >
        Upgrade Plan
      </button>
    </div>
  );
}

const styles = {
  card: {
    borderRadius: "28px",
    padding: "28px",
    textAlign: "center",
    backdropFilter: "blur(14px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.15)",
  },

  icon: {
    fontSize: "58px",
    marginBottom: "16px",
  },

  title: {
    margin: 0,
    fontSize: "26px",
  },

  description: {
    marginTop: "14px",
    lineHeight: "1.7",
  },

  planBadge: {
    marginTop: "18px",
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(124,58,237,0.14)",
    color: "#a78bfa",
    fontWeight: "800",
    fontSize: "13px",
  },

  button: {
    width: "100%",
    marginTop: "24px",
    padding: "14px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "15px",
  },
};