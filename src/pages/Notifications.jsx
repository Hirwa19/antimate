import PageLoader from "../components/PageLoader";
import BottomNav from "../components/BottomNav";
import { useEffect, useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useAppSettings();

  async function fetchNotifications() {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/notifications`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_URL}/api/notifications/read/all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }

  useEffect(() => {
    async function loadPage() {
      await fetchNotifications();
      await markAllAsRead();
    }

    loadPage();
  }, []);

  function getAlertStyle(type) {
    if (type === "TOO_HOT") return "hot";
    if (type === "TOO_COLD") return "cold";
    if (type === "LOW_HUMIDITY") return "dry";
    if (type === "VERY_HIGH_HUMIDITY") return "humid";
    return "normal";
  }

  function getIcon(type) {
    if (type === "TOO_HOT") return "🔥";
    if (type === "TOO_COLD") return "❄️";
    if (type === "LOW_HUMIDITY") return "💧";
    if (type === "VERY_HIGH_HUMIDITY") return "🌫️";
    return "🐣";
  }

  return (
    <div
      style={{
        ...styles.page,
        background: isDark
          ? "linear-gradient(135deg, #07111f, #0f2537)"
          : "linear-gradient(135deg, #f8fafc, #e2e8f0)",
        color: isDark ? "#ffffff" : "#0f172a",
      }}
    >
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Notifications</h1>
          <p style={{ ...styles.subtitle, color: isDark ? "#a9b7c6" : "#64748b" }}>
            Smart Brooder alerts and environment warnings
          </p>
        </div>

        <button onClick={fetchNotifications} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <div
          style={{
            ...styles.emptyBox,
            background: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.75)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <h2>No notifications yet</h2>
          <p>Your brooder is currently running normally.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {notifications.map((item) => {
            const alertClass = getAlertStyle(item.type);

            return (
              <div
                key={item._id}
                style={{
                  ...styles.card,
                  ...styles[alertClass],
                  background: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.78)",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid rgba(15,23,42,0.08)",
                  color: isDark ? "#fff" : "#0f172a",
                }}
              >
                <div style={styles.cardTop}>
                  <div
                    style={{
                      ...styles.iconBox,
                      background: isDark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(15,23,42,0.06)",
                    }}
                  >
                    {getIcon(item.type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h2 style={styles.cardTitle}>{item.title || item.type}</h2>

                    <p style={{ ...styles.date, color: isDark ? "#94a3b8" : "#64748b" }}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "No date"}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.badge,
                      background: isDark
                        ? "rgba(255,255,255,0.14)"
                        : "rgba(15,23,42,0.08)",
                    }}
                  >
                    {item.severity || "warning"}
                  </span>
                </div>

                <p style={{ ...styles.message, color: isDark ? "#e2e8f0" : "#334155" }}>
                  {item.message || "No message available"}
                </p>

                <div style={styles.detailsGrid}>
                  {[
                    ["Temperature", `${item.temperature ?? "--"}°C`],
                    ["Humidity", `${item.humidity ?? "--"}%`],
                    ["Heater", String(item.heater ?? "UNKNOWN")],
                    ["Fan", String(item.fan ?? "UNKNOWN")],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        ...styles.detailBox,
                        background: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(15,23,42,0.05)",
                      }}
                    >
                      <span style={{ ...styles.label, color: isDark ? "#94a3b8" : "#64748b" }}>
                        {label}
                      </span>
                      <strong style={styles.value}>{value}</strong>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    ...styles.footer,
                    borderTop: isDark
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "1px solid rgba(15,23,42,0.08)",
                    color: isDark ? "#cbd5e1" : "#475569",
                  }}
                >
                  <span>Status: {item.status || "new"}</span>
                  <span>Push: {item.isPushSent ? "Sent" : "Not sent"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    paddingBottom: "110px",
    fontFamily: "Inter, Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    fontSize: "34px",
    margin: 0,
  },

  subtitle: {
    marginTop: "8px",
  },

  refreshBtn: {
    background: "#2dd4bf",
    color: "#06221f",
    border: "none",
    padding: "12px 18px",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  emptyBox: {
    borderRadius: "22px",
    padding: "30px",
    textAlign: "center",
    backdropFilter: "blur(14px)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
    gap: "22px",
  },

  card: {
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
    backdropFilter: "blur(14px)",
  },

  hot: { borderLeft: "6px solid #ef4444" },
  cold: { borderLeft: "6px solid #38bdf8" },
  dry: { borderLeft: "6px solid #f59e0b" },
  humid: { borderLeft: "6px solid #a78bfa" },
  normal: { borderLeft: "6px solid #22c55e" },

  cardTop: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginBottom: "16px",
  },

  iconBox: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "21px",
  },

  date: {
    margin: "5px 0 0",
    fontSize: "13px",
  },

  badge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    textTransform: "uppercase",
  },

  message: {
    lineHeight: "1.6",
    marginBottom: "18px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },

  detailBox: {
    borderRadius: "16px",
    padding: "14px",
  },

  label: {
    display: "block",
    fontSize: "12px",
    marginBottom: "6px",
  },

  value: {
    fontSize: "20px",
  },

  footer: {
    marginTop: "18px",
    paddingTop: "14px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
  },
};