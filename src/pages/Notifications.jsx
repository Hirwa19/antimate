import { useEffect, useState } from "react";
import PageLoader from "../components/PageLoader";
import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const COOLDOWN_MINUTES = 10;

// =====================================================
// NOTIFICATIONS PAGE
// =====================================================

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

      // =================================================
      // SUBSCRIPTION EXPIRED
      // =================================================

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

      // =================================================
      // NORMALIZE RESPONSE
      // =================================================

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.notifications)) {
        list = data.notifications;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      }

      // Newest first
      list.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });

      setNotifications(list);
    } catch (err) {
      console.error(
        "Failed to fetch notifications:",
        err
      );

      setError(
        err.message || "Failed to load notifications"
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

    if (!isSubscriptionExpired) {
      await markAllAsRead();
    }
  }

  // =====================================================
  // ALERT COLOR
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

      case "SENSOR_OFFLINE":
        return styles.offline;

      case "POWER_LOST":
        return styles.power;

      default:
        return styles.normal;
    }
  }

  // =====================================================
  // ICON
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

      default:
        return "🔔";
    }
  }

  // =====================================================
  // TIME FORMAT
  // =====================================================

  function formatDate(date) {
    if (!date) {
      return "No date";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "No date";
    }

    return parsed.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // =====================================================
  // SHORT MESSAGE
  // =====================================================

  function getShortMessage(item) {
    if (item.message) {
      return item.message;
    }

    switch (item.type) {
      case "TOO_HOT":
        return "Brooder temperature is too high.";

      case "TOO_COLD":
        return "Brooder temperature is too low.";

      case "LOW_HUMIDITY":
        return "Brooder humidity is too low.";

      case "VERY_HIGH_HUMIDITY":
        return "Brooder humidity is too high.";

      case "SENSOR_OFFLINE":
        return "BR System is currently offline.";

      case "POWER_LOST":
        return "Power may have been lost.";

      default:
        return "A brooder event requires your attention.";
    }
  }

  // =====================================================
  // COOLDOWN
  // =====================================================

  function getCooldownText(item) {
    /*
      Backend can optionally send:
      cooldownUntil
      nextNotificationAt

      If neither exists, we simply don't show
      a cooldown message.

      This keeps the frontend compatible with
      the backend notification model.
    */

    const cooldownValue =
      item.cooldownUntil ||
      item.nextNotificationAt;

    if (!cooldownValue) {
      return null;
    }

    const cooldownDate =
      new Date(cooldownValue);

    if (Number.isNaN(cooldownDate.getTime())) {
      return null;
    }

    const remaining =
      cooldownDate.getTime() -
      Date.now();

    if (remaining <= 0) {
      return null;
    }

    const minutes = Math.ceil(
      remaining / (1000 * 60)
    );

    return `Cooldown ${minutes}m`;
  }

  // =====================================================
  // PUSH STATUS
  // =====================================================

  function getPushStatus(item) {
    return item.isPushSent
      ? "Sent"
      : "Not sent";
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
    ? "rgba(255,255,255,0.065)"
    : "rgba(255,255,255,0.82)";

  const cardBorder = isDark
    ? "1px solid rgba(255,255,255,0.10)"
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
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 700px) {
            .notification-header {
              align-items: flex-start !important;
              flex-direction: column !important;
            }

            .notification-title {
              font-size: 28px !important;
            }

            .notification-list {
              max-width: 100% !important;
            }

            .notification-card {
              padding: 15px !important;
            }

            .notification-card-top {
              gap: 10px !important;
            }

            .notification-icon {
              width: 44px !important;
              height: 44px !important;
              border-radius: 13px !important;
              font-size: 21px !important;
            }

            .notification-card-title {
              font-size: 15px !important;
            }

            .notification-message {
              font-size: 13px !important;
            }

            .notification-meta {
              flex-wrap: wrap !important;
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
            Smart brooder alerts
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            ...styles.refreshBtn,
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          {refreshing ? (
            <>
              <span style={styles.refreshSpinner}>
                ⟳
              </span>
              Refreshing
            </>
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <PageLoader />
      ) : isSubscriptionExpired ? (
        /* =================================================
           SUBSCRIPTION EXPIRED
        ================================================= */

        <div
          style={{
            ...styles.emptyBox,
            background: isDark
              ? "rgba(239,68,68,0.10)"
              : "rgba(239,68,68,0.07)",
            border:
              "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <div style={styles.emptyIcon}>
            ⏳
          </div>

          <h2 style={styles.emptyTitle}>
            Subscription Expired
          </h2>

          <p
            style={{
              ...styles.emptyText,
              color: muted,
            }}
          >
            Your active plan has expired.
            Renew or upgrade your plan to
            continue receiving notifications.
          </p>

          <a
            href="/plans"
            style={{
              ...styles.retryBtn,
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            Renew / Upgrade Plan
          </a>
        </div>
      ) : error ? (
        /* =================================================
           ERROR
        ================================================= */

        <div
          style={{
            ...styles.emptyBox,
            background: isDark
              ? "rgba(239,68,68,0.08)"
              : "rgba(239,68,68,0.06)",
            border:
              "1px solid rgba(239,68,68,0.20)",
          }}
        >
          <div style={styles.emptyIcon}>
            ⚠️
          </div>

          <h2 style={styles.emptyTitle}>
            Unable to load notifications
          </h2>

          <p
            style={{
              ...styles.emptyText,
              color: muted,
            }}
          >
            {error}
          </p>

          <button
            onClick={() => fetchNotifications()}
            style={styles.retryBtn}
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
            background: cardBackground,
            border: cardBorder,
          }}
        >
          <div style={styles.emptyIcon}>
            🔔
          </div>

          <h2 style={styles.emptyTitle}>
            No notifications
          </h2>

          <p
            style={{
              ...styles.emptyText,
              color: muted,
            }}
          >
            Your brooder is currently running
            normally.
          </p>
        </div>
      ) : (
        /* =================================================
           NOTIFICATIONS
        ================================================= */

        <div
          className="notification-list"
          style={styles.list}
        >
          {notifications.map(
            (item, index) => {
              const alertStyle =
                getAlertStyle(item.type);

              const cooldownText =
                getCooldownText(item);

              const pushSent =
                Boolean(item.isPushSent);

              return (
                <div
                  key={
                    item._id ||
                    `${item.createdAt}-${index}`
                  }
                  className="notification-card"
                  style={{
                    ...styles.card,
                    ...alertStyle,
                    background:
                      cardBackground,
                    border:
                      cardBorder,
                    color: textColor,
                  }}
                >
                  {/* ======================================
                      TOP
                  ====================================== */}

                  <div
                    className="notification-card-top"
                    style={
                      styles.cardTop
                    }
                  >
                    <div
                      className="notification-icon"
                      style={{
                        ...styles.iconBox,
                        background:
                          isDark
                            ? "rgba(255,255,255,0.09)"
                            : "rgba(15,23,42,0.055)",
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
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "8px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <h2
                          className="notification-card-title"
                          style={
                            styles.cardTitle
                          }
                        >
                          {item.title ||
                            item.type ||
                            "Brooder Alert"}
                        </h2>

                        <span
                          style={{
                            ...styles.severity,
                            background:
                              getSeverityBackground(
                                item.severity,
                                isDark
                              ),
                            color:
                              getSeverityColor(
                                item.severity
                              ),
                          }}
                        >
                          {item.severity ||
                            "warning"}
                        </span>
                      </div>

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
                  </div>

                  {/* ======================================
                      SHORT MESSAGE
                  ====================================== */}

                  <p
                    className="notification-message"
                    style={{
                      ...styles.message,
                      color: isDark
                        ? "#dbe4ef"
                        : "#475569",
                    }}
                  >
                    {getShortMessage(
                      item
                    )}
                  </p>

                  {/* ======================================
                      SENSOR SUMMARY
                  ====================================== */}

                  {(item.temperature !==
                    null &&
                    item.temperature !==
                      undefined) ||
                  (item.humidity !==
                    null &&
                    item.humidity !==
                      undefined) ? (
                    <div
                      className="notification-meta"
                      style={
                        styles.meta
                      }
                    >
                      {item.temperature !==
                        null &&
                        item.temperature !==
                          undefined && (
                          <span
                            style={{
                              ...styles.metric,
                              color: textColor,
                            }}
                          >
                            🌡️{" "}
                            {
                              item.temperature
                            }
                            °C
                          </span>
                        )}

                      {item.humidity !==
                        null &&
                        item.humidity !==
                          undefined && (
                          <span
                            style={{
                              ...styles.metric,
                              color: textColor,
                            }}
                          >
                            💧{" "}
                            {
                              item.humidity
                            }
                            %
                          </span>
                        )}
                    </div>
                  ) : null}

                  {/* ======================================
                      FOOTER
                  ====================================== */}

                  <div
                    style={{
                      ...styles.footer,
                      borderTop: isDark
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(15,23,42,0.07)",
                    }}
                  >
                    {/* PUSH STATUS */}

                    <div
                      style={
                        styles.pushStatus
                      }
                    >
                      <span
                        style={{
                          ...styles.pushDot,
                          background:
                            pushSent
                              ? "#22c55e"
                              : "#f59e0b",
                        }}
                      />

                      <span
                        style={{
                          color:
                            muted,
                        }}
                      >
                        Push:
                      </span>

                      <strong
                        style={{
                          color:
                            pushSent
                              ? "#22c55e"
                              : "#f59e0b",
                        }}
                      >
                        {getPushStatus(
                          item
                        )}
                      </strong>
                    </div>

                    {/* COOLDOWN */}

                    {cooldownText && (
                      <span
                        style={{
                          ...styles.cooldown,
                          color: muted,
                        }}
                      >
                        ⏱ {cooldownText}
                      </span>
                    )}
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
// SEVERITY BACKGROUND
// =====================================================

function getSeverityBackground(
  severity,
  isDark
) {
  switch (severity) {
    case "critical":
      return isDark
        ? "rgba(239,68,68,0.16)"
        : "rgba(239,68,68,0.10)";

    case "warning":
      return isDark
        ? "rgba(245,158,11,0.16)"
        : "rgba(245,158,11,0.10)";

    case "info":
      return isDark
        ? "rgba(59,130,246,0.16)"
        : "rgba(59,130,246,0.10)";

    default:
      return isDark
        ? "rgba(148,163,184,0.14)"
        : "rgba(100,116,139,0.09)";
  }
}

// =====================================================
// SEVERITY COLOR
// =====================================================

function getSeverityColor(severity) {
  switch (severity) {
    case "critical":
      return "#ef4444";

    case "warning":
      return "#f59e0b";

    case "info":
      return "#3b82f6";

    default:
      return "#64748b";
  }
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  // ===================================================
  // PAGE
  // ===================================================

  page: {
    minHeight: "100vh",
    padding: "24px",
    paddingBottom: "110px",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
  },

  title: {
    fontSize: "32px",
    margin: 0,
    fontWeight: 750,
    letterSpacing: "-0.5px",
  },

  subtitle: {
    marginTop: "6px",
    marginBottom: 0,
    fontSize: "13px",
  },

  refreshBtn: {
    background:
      "linear-gradient(135deg,#2dd4bf,#06b6d4)",
    color: "#06221f",
    border: "none",
    padding:
      "10px 16px",
    borderRadius: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace:
      "nowrap",
    display: "flex",
    alignItems:
      "center",
    gap: "6px",
  },

  refreshSpinner: {
    fontSize: "17px",
    display: "inline-block",
    animation:
      "spin 0.8s linear infinite",
  },

  // ===================================================
  // LIST
  // ===================================================

  list: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  // ===================================================
  // CARD
  // ===================================================

  card: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "16px",
    padding: "15px 17px",
    boxShadow:
      "0 8px 25px rgba(0,0,0,0.10)",
    backdropFilter:
      "blur(14px)",
    borderLeft:
      "4px solid #22c55e",
  },

  hot: {
    borderLeft:
      "4px solid #ef4444",
  },

  cold: {
    borderLeft:
      "4px solid #38bdf8",
  },

  dry: {
    borderLeft:
      "4px solid #f59e0b",
  },

  humid: {
    borderLeft:
      "4px solid #a78bfa",
  },

  offline: {
    borderLeft:
      "4px solid #ef4444",
  },

  power: {
    borderLeft:
      "4px solid #f97316",
  },

  normal: {
    borderLeft:
      "4px solid #22c55e",
  },

  // ===================================================
  // CARD TOP
  // ===================================================

  cardTop: {
    display: "flex",
    gap: "11px",
    alignItems: "center",
  },

  iconBox: {
    width: "45px",
    height: "45px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  cardTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: 1.25,
  },

  date: {
    margin:
      "4px 0 0",
    fontSize: "11px",
  },

  // ===================================================
  // SEVERITY
  // ===================================================

  severity: {
    padding:
      "3px 7px",
    borderRadius:
      "999px",
    fontSize: "9px",
    textTransform:
      "uppercase",
    fontWeight: 800,
    letterSpacing:
      "0.3px",
  },

  // ===================================================
  // MESSAGE
  // ===================================================

  message: {
    lineHeight: 1.45,
    margin:
      "11px 0 9px",
    fontSize: "13px",
  },

  // ===================================================
  // SENSOR META
  // ===================================================

  meta: {
    display: "flex",
    alignItems:
      "center",
    gap: "7px",
    flexWrap:
      "wrap",
    marginBottom: "10px",
  },

  metric: {
    padding:
      "5px 8px",
    borderRadius:
      "8px",
    background:
      "rgba(148,163,184,0.10)",
    fontSize: "11px",
    fontWeight: 600,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    marginTop: "5px",
    paddingTop: "9px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "10px",
    fontSize: "11px",
    minHeight: "20px",
  },

  pushStatus: {
    display: "flex",
    alignItems:
      "center",
    gap: "5px",
  },

  pushDot: {
    width: "7px",
    height: "7px",
    borderRadius:
      "50%",
    display: "inline-block",
  },

  cooldown: {
    fontSize: "10px",
    whiteSpace:
      "nowrap",
  },

  // ===================================================
  // EMPTY / ERROR
  // ===================================================

  emptyBox: {
    borderRadius: "18px",
    padding:
      "40px 22px",
    textAlign: "center",
    backdropFilter:
      "blur(14px)",
    maxWidth: "650px",
    margin:
      "40px auto 0",
  },

  emptyIcon: {
    fontSize: "38px",
    marginBottom:
      "10px",
  },

  emptyTitle: {
    margin:
      "0 0 8px",
    fontSize: "20px",
  },

  emptyText: {
    maxWidth: "430px",
    margin:
      "0 auto 18px",
    lineHeight: 1.5,
    fontSize: "13px",
  },

  retryBtn: {
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#ffffff",
    border: "none",
    padding:
      "10px 17px",
    borderRadius:
      "11px",
    fontWeight: 700,
    cursor: "pointer",
  },
};