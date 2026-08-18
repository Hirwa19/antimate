import { useEffect, useState } from "react";
import PageLoader from "../components/PageLoader";
import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function Notifications() {
  const { isDark } = useAppSettings();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isSubscriptionExpired, setIsSubscriptionExpired] =
    useState(false);

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
      setIsSubscriptionExpired(false);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        setNotifications([]);
        return;
      }

      const res = await fetch(`${API_URL}/api/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));

      // ===================================================
      // SUBSCRIPTION EXPIRED
      // ===================================================

      if (
        res.status === 403 &&
        String(data.message || "")
          .toLowerCase()
          .includes("subscription expired")
      ) {
        setIsSubscriptionExpired(true);
        setError("Your subscription plan has expired.");
        setNotifications([]);
        return;
      }

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load notifications"
        );
      }

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.notifications)) {
        list = data.notifications;
      } else if (Array.isArray(data.data)) {
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
      const token = localStorage.getItem("token");

      if (!token || isSubscriptionExpired) {
        return;
      }

      const res = await fetch(
        `${API_URL}/api/notifications/read/all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        console.error(
          "Mark notifications as read failed:",
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

    if (!isSubscriptionExpired) {
      await markAllAsRead();
    }
  }

  // =====================================================
  // NOTIFICATION ICON
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

      case "SENSOR_OFFLINE":
        return "📡";

      case "POWER_LOST":
        return "⚡";

      case "CHICKS_AGE":
        return "🐣";

      default:
        return "🔔";
    }
  }

  // =====================================================
  // TYPE LABEL
  // =====================================================

  function getTypeLabel(type) {
    switch (type) {
      case "TOO_HOT":
        return "Temperature";

      case "TOO_COLD":
        return "Temperature";

      case "LOW_HUMIDITY":
        return "Humidity";

      case "VERY_HIGH_HUMIDITY":
        return "Humidity";

      case "SENSOR_OFFLINE":
        return "System";

      case "POWER_LOST":
        return "Power";

      case "CHICKS_AGE":
        return "Chicks";

      default:
        return "Brooder";
    }
  }

  // =====================================================
  // SEVERITY
  // =====================================================

  function getSeverity(item) {
    const severity = String(
      item?.severity || "warning"
    ).toLowerCase();

    if (
      ["critical", "danger", "error"].includes(
        severity
      )
    ) {
      return "critical";
    }

    if (severity === "info") {
      return "info";
    }

    return "warning";
  }

  // =====================================================
  // DATE
  // =====================================================

  function formatDate(date) {
    if (!date) {
      return "Just now";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Just now";
    }

    const now = new Date();

    const diff =
      now.getTime() -
      parsed.getTime();

    const minute =
      60 * 1000;

    const hour =
      60 * minute;

    const day =
      24 * hour;

    if (diff < minute) {
      return "Just now";
    }

    if (diff < hour) {
      const minutes = Math.floor(
        diff / minute
      );

      return `${minutes}m ago`;
    }

    if (diff < day) {
      const hours = Math.floor(
        diff / hour
      );

      return `${hours}h ago`;
    }

    if (diff < 7 * day) {
      const days = Math.floor(
        diff / day
      );

      return `${days}d ago`;
    }

    return parsed.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  // =====================================================
  // EMPTY / ERROR COLORS
  // =====================================================

  const colors = {
    text: isDark
      ? "#f8fafc"
      : "#0f172a",

    muted: isDark
      ? "#94a3b8"
      : "#64748b",

    subtle: isDark
      ? "#64748b"
      : "#94a3b8",

    background: isDark
      ? "#07111f"
      : "#f8fafc",

    card: isDark
      ? "rgba(255,255,255,0.055)"
      : "#ffffff",

    border: isDark
      ? "rgba(255,255,255,0.09)"
      : "#e2e8f0",

    hover: isDark
      ? "rgba(255,255,255,0.08)"
      : "#f8fafc",
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      style={{
        ...styles.page,
        background: colors.background,
        color: colors.text,
      }}
    >
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          .notification-row {
            transition:
              background 0.18s ease,
              border-color 0.18s ease,
              transform 0.18s ease;
          }

          .notification-row:hover {
            transform: translateY(-1px);
          }

          .refresh-button {
            transition:
              opacity 0.2s ease,
              transform 0.2s ease;
          }

          .refresh-button:hover:not(:disabled) {
            transform: translateY(-1px);
          }

          @media (max-width: 600px) {
            .notifications-header {
              align-items: flex-start !important;
            }

            .notifications-title {
              font-size: 27px !important;
            }

            .notification-row {
              padding: 13px !important;
            }

            .notification-icon {
              width: 40px !important;
              height: 40px !important;
              min-width: 40px !important;
              font-size: 19px !important;
            }

            .notification-title-text {
              font-size: 14px !important;
            }

            .notification-message {
              font-size: 12px !important;
            }

            .notification-meta {
              font-size: 10px !important;
            }
          }
        `}
      </style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="notifications-header"
        style={{
          ...styles.header,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div>
          <h1
            className="notifications-title"
            style={styles.title}
          >
            Notifications
          </h1>

          <p
            style={{
              ...styles.subtitle,
              color: colors.muted,
            }}
          >
            Important updates from your brooder
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            ...styles.refreshButton,
            opacity: refreshing ? 0.55 : 1,
          }}
        >
          <span
            style={{
              display: "inline-block",
              animation: refreshing
                ? "spin 1s linear infinite"
                : "none",
            }}
          >
            ↻
          </span>

          <span>
            {refreshing
              ? "Refreshing"
              : "Refresh"}
          </span>
        </button>
      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <PageLoader />
      ) : isSubscriptionExpired ? (
        /* ===============================================
           SUBSCRIPTION EXPIRED
        =============================================== */

        <div
          style={{
            ...styles.messageBox,
            background: isDark
              ? "rgba(239,68,68,0.08)"
              : "#fff7f7",
            border: isDark
              ? "1px solid rgba(239,68,68,0.20)"
              : "1px solid #fecaca",
          }}
        >
          <div style={styles.messageIcon}>
            ⏳
          </div>

          <h2 style={styles.messageTitle}>
            Subscription expired
          </h2>

          <p
            style={{
              ...styles.messageText,
              color: colors.muted,
            }}
          >
            Renew your plan to continue
            receiving brooder notifications.
          </p>

          <a
            href="/plans"
            style={styles.primaryButton}
          >
            Renew / Upgrade
          </a>
        </div>
      ) : error ? (
        /* ===============================================
           ERROR
        =============================================== */

        <div
          style={{
            ...styles.messageBox,
            background: isDark
              ? "rgba(239,68,68,0.07)"
              : "#fffafa",
            border: isDark
              ? "1px solid rgba(239,68,68,0.18)"
              : "1px solid #fecaca",
          }}
        >
          <div style={styles.messageIcon}>
            ⚠️
          </div>

          <h2 style={styles.messageTitle}>
            Unable to load notifications
          </h2>

          <p
            style={{
              ...styles.messageText,
              color: colors.muted,
            }}
          >
            {error}
          </p>

          <button
            onClick={() => fetchNotifications()}
            style={styles.primaryButton}
          >
            Try Again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        /* ===============================================
           EMPTY
        =============================================== */

        <div
          style={{
            ...styles.messageBox,
            background: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              ...styles.emptyIcon,
              color: colors.muted,
            }}
          >
            ✓
          </div>

          <h2 style={styles.messageTitle}>
            All clear
          </h2>

          <p
            style={{
              ...styles.messageText,
              color: colors.muted,
            }}
          >
            No new brooder alerts at the moment.
          </p>
        </div>
      ) : (
        /* ===============================================
           NOTIFICATION LIST
        =============================================== */

        <div style={styles.list}>
          {notifications.map(
            (item, index) => {
              const severity =
                getSeverity(item);

              const severityStyle =
                getSeverityStyle(
                  severity,
                  isDark
                );

              return (
                <div
                  key={
                    item._id ||
                    `${item.createdAt}-${index}`
                  }
                  className="notification-row"
                  style={{
                    ...styles.notificationRow,
                    background:
                      colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `3px solid ${severityStyle.accent}`,
                  }}
                >
                  {/* ICON */}

                  <div
                    className="notification-icon"
                    style={{
                      ...styles.notificationIcon,
                      background:
                        severityStyle.iconBackground,
                    }}
                  >
                    {getIcon(item.type)}
                  </div>

                  {/* CONTENT */}

                  <div
                    style={
                      styles.notificationContent
                    }
                  >
                    {/* TOP LINE */}

                    <div
                      style={
                        styles.notificationTop
                      }
                    >
                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          className="notification-title-text"
                          style={
                            styles.notificationTitle
                          }
                        >
                          {item.title ||
                            getTypeLabel(
                              item.type
                            )}
                        </div>

                        <div
                          className="notification-meta"
                          style={{
                            ...styles.notificationMeta,
                            color:
                              colors.muted,
                          }}
                        >
                          {getTypeLabel(
                            item.type
                          )}{" "}
                          •{" "}
                          {formatDate(
                            item.createdAt
                          )}
                        </div>
                      </div>

                      {/* SEVERITY */}

                      <span
                        style={{
                          ...styles.severityBadge,
                          color:
                            severityStyle.text,
                          background:
                            severityStyle.background,
                        }}
                      >
                        {severity}
                      </span>
                    </div>

                    {/* MESSAGE */}

                    <div
                      className="notification-message"
                      style={{
                        ...styles.notificationMessage,
                        color:
                          colors.muted,
                      }}
                    >
                      {item.message ||
                        item.body ||
                        "Brooder alert received."}
                    </div>

                    {/* PRO / PREMIUM DETAILS
                        Only display if backend provides them.
                    */}

                    {(item.temperature !==
                      null &&
                      item.temperature !==
                        undefined) ||
                    (item.humidity !== null &&
                      item.humidity !==
                        undefined) ? (
                      <div
                        style={
                          styles.compactDetails
                        }
                      >
                        {item.temperature !==
                          null &&
                        item.temperature !==
                          undefined ? (
                          <span
                            style={{
                              ...styles.detail,
                              color:
                                colors.muted,
                            }}
                          >
                            🌡️{" "}
                            {
                              item.temperature
                            }
                            °C
                          </span>
                        ) : null}

                        {item.humidity !==
                          null &&
                        item.humidity !==
                          undefined ? (
                          <span
                            style={{
                              ...styles.detail,
                              color:
                                colors.muted,
                            }}
                          >
                            💧{" "}
                            {item.humidity}%
                          </span>
                        ) : null}
                      </div>
                    ) : null}
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
// SEVERITY STYLE
// =====================================================

function getSeverityStyle(
  severity,
  isDark
) {
  switch (severity) {
    case "critical":
      return {
        accent: "#ef4444",

        text: "#ef4444",

        background: isDark
          ? "rgba(239,68,68,0.12)"
          : "#fef2f2",

        iconBackground: isDark
          ? "rgba(239,68,68,0.13)"
          : "#fef2f2",
      };

    case "info":
      return {
        accent: "#3b82f6",

        text: "#3b82f6",

        background: isDark
          ? "rgba(59,130,246,0.12)"
          : "#eff6ff",

        iconBackground: isDark
          ? "rgba(59,130,246,0.13)"
          : "#eff6ff",
      };

    default:
      return {
        accent: "#f59e0b",

        text: "#f59e0b",

        background: isDark
          ? "rgba(245,158,11,0.12)"
          : "#fffbeb",

        iconBackground: isDark
          ? "rgba(245,158,11,0.13)"
          : "#fffbeb",
      };
  }
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    paddingBottom: "105px",
    fontFamily:
      "Inter, Arial, sans-serif",
    boxSizing: "border-box",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    paddingBottom: "18px",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    fontSize: "31px",
    fontWeight: 750,
    letterSpacing: "-0.5px",
  },

  subtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
  },

  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    border: "none",
    borderRadius: "10px",
    padding: "9px 13px",
    background: "#0f766e",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  // ===================================================
  // LIST
  // ===================================================

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    maxWidth: "900px",
  },

  // ===================================================
  // NOTIFICATION ROW
  // ===================================================

  notificationRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    borderRadius: "14px",
    boxSizing: "border-box",
  },

  notificationIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  notificationContent: {
    minWidth: 0,
    flex: 1,
  },

  notificationTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },

  notificationTitle: {
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.3,
  },

  notificationMeta: {
    marginTop: "3px",
    fontSize: "10px",
    lineHeight: 1.3,
  },

  notificationMessage: {
    marginTop: "7px",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  severityBadge: {
    flexShrink: 0,
    padding: "4px 7px",
    borderRadius: "999px",
    fontSize: "8px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },

  // ===================================================
  // COMPACT DETAILS
  // ===================================================

  compactDetails: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "7px",
  },

  detail: {
    fontSize: "10px",
  },

  // ===================================================
  // MESSAGE BOX
  // ===================================================

  messageBox: {
    maxWidth: "600px",
    margin: "45px auto",
    padding: "35px 24px",
    borderRadius: "18px",
    textAlign: "center",
    boxSizing: "border-box",
  },

  messageIcon: {
    fontSize: "34px",
    marginBottom: "10px",
  },

  emptyIcon: {
    fontSize: "34px",
    marginBottom: "10px",
  },

  messageTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 700,
  },

  messageText: {
    margin:
      "8px auto 18px",
    maxWidth: "430px",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  primaryButton: {
    display: "inline-block",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    background:
      "linear-gradient(135deg,#2563eb,#4f46e5)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
  },
};