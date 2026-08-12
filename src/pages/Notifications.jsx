import { useEffect, useState } from "react";
import PageLoader from "../components/PageLoader";
import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function Notifications() {
  const { isDark } = useAppSettings();

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  async function fetchNotifications(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "You are not logged in."
        );

        setNotifications([]);
        return;
      }

      const res = await fetch(
        `${API_URL}/api/notifications`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to load notifications"
        );
      }

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (
        Array.isArray(
          data.notifications
        )
      ) {
        list = data.notifications;
      } else if (
        Array.isArray(data.data)
      ) {
        list = data.data;
      }

      setNotifications(list);
    } catch (err) {
      console.error(
        "Failed to fetch notifications:",
        err
      );

      setError(
        err.message ||
          "Failed to load notifications"
      );

      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  async function markAllAsRead() {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) return;

      const res = await fetch(
        `${API_URL}/api/notifications/read/all`,
        {
          method: "PATCH",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data =
          await res.json().catch(
            () => ({})
          );

        console.error(
          "Mark read failed:",
          data.message
        );
      }
    } catch (err) {
      console.error(
        "Failed to mark notifications as read:",
        err
      );
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    async function loadPage() {
      await fetchNotifications();
      await markAllAsRead();
    }

    loadPage();
  }, []);

  // =====================================================
  // REFRESH
  // =====================================================

  async function handleRefresh() {
    await fetchNotifications(false);
    await markAllAsRead();
  }

  // =====================================================
  // ALERT STYLE
  // =====================================================

  function getAlertStyle(type) {
    switch (type) {
      case "TOO_HOT":
        return styles.hot;

      case "TOO_COLD":
        return styles.cold;

      case "LOW_HUMIDITY":
        return styles.dry;

      case "VERY_HIGH_HUMIDITY":
        return styles.humid;

      default:
        return styles.normal;
    }
  }

  // =====================================================
  // ALERT ICON
  // =====================================================

  function getIcon(type) {
    switch (type) {
      case "TOO_HOT":
        return "🔥";

      case "TOO_COLD":
        return "❄️";

      case "LOW_HUMIDITY":
        return "💧";

      case "VERY_HIGH_HUMIDITY":
        return "🌫️";

      default:
        return "🐣";
    }
  }

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatDate(date) {
    if (!date) {
      return "No date";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "No date";
    }

    return parsed.toLocaleString();
  }

  // =====================================================
  // COLORS
  // =====================================================

  const background = isDark
    ? "linear-gradient(135deg,#07111f,#0f2537)"
    : "linear-gradient(135deg,#f8fafc,#e2e8f0)";

  const textColor = isDark
    ? "#ffffff"
    : "#0f172a";

  const muted = isDark
    ? "#94a3b8"
    : "#64748b";

  const cardBackground = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.78)";

  const cardBorder = isDark
    ? "1px solid rgba(255,255,255,0.12)"
    : "1px solid rgba(15,23,42,0.08)";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      style={{
        ...styles.page,
        background,
        color: textColor,
      }}
    >
      <style>
        {`
          @media (max-width: 600px) {
            .notification-header {
              align-items: flex-start !important;
            }

            .notification-title {
              font-size: 28px !important;
            }

            .notification-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="notification-header"
        style={styles.header}
      >
        <div>
          <h1
            className="notification-title"
            style={styles.title}
          >
            Notifications
          </h1>

          <p
            style={{
              ...styles.subtitle,
              color: muted,
            }}
          >
            Smart Brooder alerts and
            environment warnings
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            ...styles.refreshBtn,
            opacity:
              refreshing ? 0.6 : 1,
          }}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <PageLoader />
      ) : error ? (
        /* =================================================
           ERROR
        ================================================= */

        <div
          style={{
            ...styles.emptyBox,
            background:
              isDark
                ? "rgba(239,68,68,0.10)"
                : "rgba(239,68,68,0.07)",
            border:
              "1px solid rgba(239,68,68,0.20)",
          }}
        >
          <div
            style={styles.emptyIcon}
          >
            ⚠️
          </div>

          <h2>
            Unable to load
            notifications
          </h2>

          <p
            style={{
              color: muted,
            }}
          >
            {error}
          </p>

          <button
            onClick={() =>
              fetchNotifications()
            }
            style={
              styles.retryBtn
            }
          >
            Try Again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        /* =================================================
           EMPTY
        ================================================= */

        <div
          style={{
            ...styles.emptyBox,
            background:
              cardBackground,
            border:
              cardBorder,
          }}
        >
          <div
            style={styles.emptyIcon}
          >
            🔔
          </div>

          <h2>
            No notifications yet
          </h2>

          <p
            style={{
              color: muted,
            }}
          >
            Your brooder is currently
            running normally.
          </p>
        </div>
      ) : (
        /* =================================================
           NOTIFICATIONS
        ================================================= */

        <div
          className="notification-grid"
          style={styles.grid}
        >
          {notifications.map(
            (item, index) => {
              const alertStyle =
                getAlertStyle(
                  item.type
                );

              return (
                <div
                  key={
                    item._id ||
                    `${item.createdAt}-${index}`
                  }
                  style={{
                    ...styles.card,
                    ...alertStyle,
                    background:
                      cardBackground,
                    border:
                      cardBorder,
                    color:
                      textColor,
                  }}
                >
                  {/* CARD TOP */}

                  <div
                    style={
                      styles.cardTop
                    }
                  >
                    <div
                      style={{
                        ...styles.iconBox,
                        background:
                          isDark
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(15,23,42,0.06)",
                      }}
                    >
                      {getIcon(
                        item.type
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <h2
                        style={
                          styles.cardTitle
                        }
                      >
                        {item.title ||
                          item.type ||
                          "Brooder Alert"}
                      </h2>

                      <p
                        style={{
                          ...styles.date,
                          color: muted,
                        }}
                      >
                        {formatDate(
                          item.createdAt
                        )}
                      </p>
                    </div>

                    <span
                      style={{
                        ...styles.badge,
                        background:
                          isDark
                            ? "rgba(255,255,255,0.14)"
                            : "rgba(15,23,42,0.08)",
                      }}
                    >
                      {item.severity ||
                        "warning"}
                    </span>
                  </div>

                  {/* MESSAGE */}

                  <p
                    style={{
                      ...styles.message,
                      color: isDark
                        ? "#e2e8f0"
                        : "#334155",
                    }}
                  >
                    {item.message ||
                      "No message available"}
                  </p>

                  {/* SENSOR DETAILS */}

                  <div
                    style={
                      styles.detailsGrid
                    }
                  >
                    <Detail
                      label="Temperature"
                      value={`${item.temperature ?? "--"}°C`}
                      isDark={isDark}
                    />

                    <Detail
                      label="Humidity"
                      value={`${item.humidity ?? "--"}%`}
                      isDark={isDark}
                    />

                    <Detail
                      label="Heater"
                      value={String(
                        item.heater ??
                          "UNKNOWN"
                      )}
                      isDark={isDark}
                    />

                    <Detail
                      label="Fan"
                      value={String(
                        item.fan ??
                          "UNKNOWN"
                      )}
                      isDark={isDark}
                    />
                  </div>

                  {/* FOOTER */}

                  <div
                    style={{
                      ...styles.footer,
                      borderTop: isDark
                        ? "1px solid rgba(255,255,255,0.12)"
                        : "1px solid rgba(15,23,42,0.08)",
                      color: muted,
                    }}
                  >
                    <span>
                      Status:{" "}
                      {item.status ||
                        "new"}
                    </span>

                    <span>
                      Push:{" "}
                      {item.isPushSent
                        ? "Sent"
                        : "Not sent"}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// =====================================================
// DETAIL COMPONENT
// =====================================================

function Detail({
  label,
  value,
  isDark,
}) {
  return (
    <div
      style={{
        ...styles.detailBox,
        background: isDark
          ? "rgba(255,255,255,0.10)"
          : "rgba(15,23,42,0.05)",
      }}
    >
      <span
        style={{
          ...styles.label,
          color: isDark
            ? "#94a3b8"
            : "#64748b",
        }}
      >
        {label}
      </span>

      <strong
        style={styles.value}
      >
        {value}
      </strong>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    paddingBottom: "110px",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
  },

  title: {
    fontSize: "34px",
    margin: 0,
    fontWeight: 750,
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "14px",
  },

  refreshBtn: {
    background:
      "linear-gradient(135deg,#2dd4bf,#06b6d4)",
    color: "#06221f",
    border: "none",
    padding: "11px 17px",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  retryBtn: {
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#ffffff",
    border: "none",
    padding: "11px 18px",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  emptyBox: {
    borderRadius: "24px",
    padding: "45px 25px",
    textAlign: "center",
    backdropFilter:
      "blur(14px)",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(310px,1fr))",
    gap: "20px",
  },

  card: {
    borderRadius: "24px",
    padding: "20px",
    boxShadow:
      "0 18px 40px rgba(0,0,0,0.18)",
    backdropFilter:
      "blur(14px)",
    borderLeft:
      "6px solid #22c55e",
  },

  hot: {
    borderLeft:
      "6px solid #ef4444",
  },

  cold: {
    borderLeft:
      "6px solid #38bdf8",
  },

  dry: {
    borderLeft:
      "6px solid #f59e0b",
  },

  humid: {
    borderLeft:
      "6px solid #a78bfa",
  },

  normal: {
    borderLeft:
      "6px solid #22c55e",
  },

  cardTop: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "16px",
  },

  iconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    flexShrink: 0,
  },

  cardTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 700,
  },

  date: {
    margin: "5px 0 0",
    fontSize: "12px",
  },

  badge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    textTransform:
      "uppercase",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  message: {
    lineHeight: "1.6",
    margin:
      "0 0 18px",
    fontSize: "14px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,1fr)",
    gap: "10px",
  },

  detailBox: {
    borderRadius: "15px",
    padding: "12px",
  },

  label: {
    display: "block",
    fontSize: "11px",
    marginBottom: "5px",
  },

  value: {
    fontSize: "17px",
  },

  footer: {
    marginTop: "17px",
    paddingTop: "13px",
    display: "flex",
    justifyContent:
      "space-between",
    gap: "10px",
    fontSize: "12px",
  },
};