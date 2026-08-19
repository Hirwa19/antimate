import { useCallback, useEffect, useState } from "react";
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
  const [subscriptionState, setSubscriptionState] =
    useState(null);

  const token = localStorage.getItem("token");

  // =====================================================
  // FETCH
  // =====================================================

  const fetchNotifications = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
        setSubscriptionState(null);

        if (!token) {
          setError("Please login to view notifications.");
          setNotifications([]);
          return false;
        }

        const response = await fetch(
          `${API_URL}/api/notifications`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data =
          await response.json().catch(() => ({}));

        // ===============================================
        // AUTH
        // ===============================================

        if (response.status === 401) {
          setError(
            data.message ||
              "Your session has expired. Please login again."
          );

          setNotifications([]);
          return false;
        }

        // ===============================================
        // SUBSCRIPTION
        // ===============================================

        if (response.status === 403) {
          setSubscriptionState(
            data.code || "NO_ACTIVE_SUBSCRIPTION"
          );

          setError(
            data.message ||
              "An active subscription is required."
          );

          setNotifications([]);

          return false;
        }

        // ===============================================
        // OTHER ERROR
        // ===============================================

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load notifications."
          );
        }

        // ===============================================
        // RESPONSE
        // ===============================================

        let list = [];

        if (Array.isArray(data.notifications)) {
          list = data.notifications;
        } else if (Array.isArray(data.data)) {
          list = data.data;
        } else if (Array.isArray(data)) {
          list = data;
        }

        list.sort((a, b) => {
          return (
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
          );
        });

        setNotifications(list);

        return true;
      } catch (err) {
        console.error(
          "❌ Notifications fetch:",
          err
        );

        setError(
          err.message ||
            "Unable to load notifications."
        );

        setNotifications([]);

        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  // =====================================================
  // MARK ALL READ
  // =====================================================

  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/read/all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(
          "Could not mark notifications as read."
        );
      }
    } catch (error) {
      console.error(
        "❌ Mark notifications read:",
        error
      );
    }
  }, [token]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function load() {
      const success =
        await fetchNotifications(false);

      if (mounted && success) {
        await markAllAsRead();
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [
    fetchNotifications,
    markAllAsRead,
  ]);

  // =====================================================
  // REFRESH
  // =====================================================

  async function handleRefresh() {
    await fetchNotifications(true);
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function deleteNotification(id) {
    if (!id || !token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete notification"
        );
      }

      setNotifications((current) =>
        current.filter(
          (item) => item._id !== id
        )
      );
    } catch (error) {
      console.error(
        "❌ Delete notification:",
        error
      );
    }
  }

  // =====================================================
  // HELPERS
  // =====================================================

  function getIcon(type) {
    const icons = {
      TOO_HOT: "🔥",
      TOO_COLD: "❄️",
      LOW_HUMIDITY: "💧",
      VERY_HIGH_HUMIDITY: "🌫️",
      SENSOR_OFFLINE: "📡",
      POWER_LOST: "⚡",
    };

    return icons[type] || "🔔";
  }

  function getTitle(item) {
    if (item.title) return item.title;

    const titles = {
      TOO_HOT: "Temperature Too High",
      TOO_COLD: "Temperature Too Low",
      LOW_HUMIDITY: "Low Humidity",
      VERY_HIGH_HUMIDITY:
        "Humidity Too High",
      SENSOR_OFFLINE: "System Offline",
      POWER_LOST: "Power Lost",
    };

    return (
      titles[item.type] ||
      "Brooder Alert"
    );
  }

  function getMessage(item) {
    if (item.message) {
      return item.message;
    }

    const messages = {
      TOO_HOT:
        "The brooder temperature is above the recommended range.",

      TOO_COLD:
        "The brooder temperature is below the recommended range.",

      LOW_HUMIDITY:
        "The brooder humidity is below the recommended range.",

      VERY_HIGH_HUMIDITY:
        "The brooder humidity is above the recommended range.",

      SENSOR_OFFLINE:
        "The BR System is currently offline.",

      POWER_LOST:
        "The system may have lost electrical power.",
    };

    return (
      messages[item.type] ||
      "A brooder event requires your attention."
    );
  }

  function getSeverity(item) {
    return (
      item.severity || "warning"
    ).toLowerCase();
  }

  function formatDate(value) {
    if (!value) return "Unknown time";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown time";
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getSeverityStyle(severity) {
    if (severity === "critical") {
      return {
        background: isDark
          ? "rgba(239,68,68,.15)"
          : "#fee2e2",
        color: "#ef4444",
      };
    }

    if (severity === "info") {
      return {
        background: isDark
          ? "rgba(59,130,246,.15)"
          : "#dbeafe",
        color: "#3b82f6",
      };
    }

    return {
      background: isDark
        ? "rgba(245,158,11,.15)"
        : "#fef3c7",
      color: "#f59e0b",
    };
  }

  function getAccent(type) {
    const accents = {
      TOO_HOT: "#ef4444",
      TOO_COLD: "#38bdf8",
      LOW_HUMIDITY: "#f59e0b",
      VERY_HIGH_HUMIDITY: "#8b5cf6",
      SENSOR_OFFLINE: "#ef4444",
      POWER_LOST: "#f97316",
    };

    return (
      accents[type] || "#22c55e"
    );
  }

  // =====================================================
  // COLORS
  // =====================================================

  const colors = {
    page: isDark
      ? "#07111f"
      : "#f5f7fb",

    card: isDark
      ? "rgba(15,31,49,.88)"
      : "#ffffff",

    border: isDark
      ? "rgba(255,255,255,.08)"
      : "#e5e7eb",

    text: isDark
      ? "#f8fafc"
      : "#0f172a",

    muted: isDark
      ? "#94a3b8"
      : "#64748b",

    soft: isDark
      ? "rgba(255,255,255,.045)"
      : "#f8fafc",
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.page,
        color: colors.text,
        paddingBottom: 100,
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @keyframes notificationSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .notification-refresh:hover {
          transform: translateY(-1px);
        }

        .notification-card:hover {
          transform: translateY(-2px);
        }

        .notification-delete:hover {
          background: rgba(239,68,68,.12) !important;
          color: #ef4444 !important;
        }

        @media(max-width:700px) {
          .notification-page {
            padding: 18px !important;
          }

          .notification-heading {
            font-size: 28px !important;
          }

          .notification-card {
            padding: 16px !important;
          }

          .notification-actions {
            width: 100%;
          }

          .notification-refresh {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <main
        className="notification-page"
        style={{
          maxWidth: 1050,
          margin: "0 auto",
          padding: "30px 24px",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg,#06b6d4,#2563eb)",
                  boxShadow:
                    "0 8px 25px rgba(37,99,235,.25)",
                  fontSize: 20,
                }}
              >
                🔔
              </div>

              <h1
                className="notification-heading"
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "-.8px",
                }}
              >
                Notifications
              </h1>
            </div>

            <p
              style={{
                margin:
                  "9px 0 0 52px",
                color: colors.muted,
                fontSize: 13,
              }}
            >
              Real-time alerts from your Smart Brooder
            </p>
          </div>

          <div className="notification-actions">
            <button
              className="notification-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.card,
                color: colors.text,
                borderRadius: 12,
                padding: "10px 15px",
                fontWeight: 700,
                cursor: refreshing
                  ? "default"
                  : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: ".2s",
                opacity: refreshing ? .65 : 1,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  animation: refreshing
                    ? "notificationSpin .8s linear infinite"
                    : "none",
                }}
              >
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </header>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <PageLoader />
        ) : subscriptionState ? (
          // =================================================
          // SUBSCRIPTION
          // =================================================

          <section
            style={{
              ...emptyStyle(colors),
              borderColor:
                "rgba(245,158,11,.25)",
            }}
          >
            <div
              style={{
                ...emptyIconStyle,
                background:
                  "rgba(245,158,11,.12)",
              }}
            >
              🔒
            </div>

            <h2 style={emptyTitleStyle}>
              Subscription Required
            </h2>

            <p
              style={{
                ...emptyTextStyle,
                color: colors.muted,
              }}
            >
              {error ||
                "An active Basic, Pro, or Premium plan is required to access notifications."}
            </p>

            <a
              href="/plans"
              style={{
                display: "inline-flex",
                textDecoration: "none",
                padding: "11px 18px",
                borderRadius: 11,
                color: "#fff",
                fontWeight: 700,
                background:
                  "linear-gradient(135deg,#2563eb,#7c3aed)",
              }}
            >
              View Plans
            </a>
          </section>
        ) : error ? (
          // =================================================
          // ERROR
          // =================================================

          <section style={emptyStyle(colors)}>
            <div
              style={{
                ...emptyIconStyle,
                background:
                  "rgba(239,68,68,.12)",
              }}
            >
              ⚠️
            </div>

            <h2 style={emptyTitleStyle}>
              Unable to load notifications
            </h2>

            <p
              style={{
                ...emptyTextStyle,
                color: colors.muted,
              }}
            >
              {error}
            </p>

            <button
              onClick={() =>
                fetchNotifications(false)
              }
              style={{
                padding: "10px 17px",
                border: "none",
                borderRadius: 11,
                background:
                  "linear-gradient(135deg,#2563eb,#7c3aed)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </section>
        ) : notifications.length === 0 ? (
          // =================================================
          // EMPTY
          // =================================================

          <section style={emptyStyle(colors)}>
            <div
              style={{
                ...emptyIconStyle,
                background:
                  "rgba(34,197,94,.12)",
              }}
            >
              ✓
            </div>

            <h2 style={emptyTitleStyle}>
              Everything looks good
            </h2>

            <p
              style={{
                ...emptyTextStyle,
                color: colors.muted,
              }}
            >
              No brooder alerts have been generated yet.
            </p>
          </section>
        ) : (
          // =================================================
          // LIST
          // =================================================

          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* SUMMARY */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 15px",
                borderRadius: 13,
                background: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: colors.muted,
                }}
              >
                Recent alerts
              </span>

              <strong
                style={{
                  fontSize: 13,
                }}
              >
                {notifications.length}
              </strong>
            </div>

            {notifications.map(
              (item, index) => {
                const severity =
                  getSeverity(item);

                const severityStyle =
                  getSeverityStyle(
                    severity
                  );

                const accent =
                  getAccent(item.type);

                return (
                  <article
                    key={
                      item._id ||
                      `${item.createdAt}-${index}`
                    }
                    className="notification-card"
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      background:
                        colors.card,
                      border:
                        `1px solid ${colors.border}`,
                      borderRadius: 17,
                      padding: 19,
                      boxShadow:
                        isDark
                          ? "0 10px 35px rgba(0,0,0,.18)"
                          : "0 8px 25px rgba(15,23,42,.06)",
                      transition:
                        "transform .2s ease",
                    }}
                  >
                    {/* ACCENT */}

                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: accent,
                      }}
                    />

                    {/* TOP */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 13,
                      }}
                    >
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          flexShrink: 0,
                          borderRadius: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                          background:
                            `${accent}18`,
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
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <h2
                            style={{
                              margin: 0,
                              fontSize: 16,
                              fontWeight: 750,
                            }}
                          >
                            {getTitle(item)}
                          </h2>

                          <span
                            style={{
                              padding:
                                "4px 8px",
                              borderRadius:
                                999,
                              fontSize: 9,
                              fontWeight: 800,
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                ".3px",
                              ...severityStyle,
                            }}
                          >
                            {severity}
                          </span>
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 11,
                            color: colors.muted,
                          }}
                        >
                          {formatDate(
                            item.createdAt
                          )}
                        </div>
                      </div>

                      {/* DELETE */}

                      {item._id && (
                        <button
                          className="notification-delete"
                          onClick={() =>
                            deleteNotification(
                              item._id
                            )
                          }
                          title="Delete"
                          style={{
                            width: 32,
                            height: 32,
                            border: "none",
                            borderRadius: 9,
                            background:
                              "transparent",
                            color:
                              colors.muted,
                            cursor: "pointer",
                            fontSize: 15,
                            transition: ".2s",
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* MESSAGE */}

                    <p
                      style={{
                        margin:
                          "13px 0 14px 59px",
                        color: isDark
                          ? "#dbe4ef"
                          : "#475569",
                        fontSize: 13,
                        lineHeight: 1.55,
                      }}
                    >
                      {getMessage(item)}
                    </p>

                    {/* METRICS */}

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 7,
                        marginLeft: 59,
                      }}
                    >
                      {item.temperature !==
                        null &&
                        item.temperature !==
                          undefined && (
                          <Metric
                            icon="🌡️"
                            value={`${item.temperature}°C`}
                            colors={colors}
                          />
                        )}

                      {item.humidity !==
                        null &&
                        item.humidity !==
                          undefined && (
                          <Metric
                            icon="💧"
                            value={`${item.humidity}%`}
                            colors={colors}
                          />
                        )}

                      {item.heater !==
                        null &&
                        item.heater !==
                          undefined && (
                          <Metric
                            icon="🔥"
                            value={`Heater: ${String(
                              item.heater
                            )}`}
                            colors={colors}
                          />
                        )}

                      {item.fan !==
                        null &&
                        item.fan !==
                          undefined && (
                          <Metric
                            icon="🌀"
                            value={`Fan: ${String(
                              item.fan
                            )}`}
                            colors={colors}
                          />
                        )}
                    </div>

                    {/* FOOTER */}

                    <div
                      style={{
                        marginTop: 15,
                        paddingTop: 11,
                        marginLeft: 59,
                        borderTop:
                          `1px solid ${colors.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 10,
                          color: colors.muted,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius:
                              "50%",
                            background:
                              item.isPushSent
                                ? "#22c55e"
                                : "#f59e0b",
                          }}
                        />

                        Push{" "}
                        {item.isPushSent
                          ? "sent"
                          : "not sent"}
                      </span>

                      {item.chicksType && (
                        <span
                          style={{
                            fontSize: 10,
                            color: colors.muted,
                          }}
                        >
                          {item.chicksType}
                          {item.chicksAge !==
                            null &&
                            ` • Day ${item.chicksAge}`}
                        </span>
                      )}

                      {item.systemId && (
                        <span
                          style={{
                            fontSize: 10,
                            color: colors.muted,
                          }}
                        >
                          {item.systemId}
                        </span>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

// =====================================================
// METRIC
// =====================================================

function Metric({
  icon,
  value,
  colors,
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 9px",
        borderRadius: 9,
        background: colors.soft,
        border:
          `1px solid ${colors.border}`,
        fontSize: 10,
        fontWeight: 650,
        color: colors.text,
      }}
    >
      {icon} {value}
    </span>
  );
}

// =====================================================
// EMPTY STYLE
// =====================================================

function emptyStyle(colors) {
  return {
    maxWidth: 650,
    margin: "60px auto",
    textAlign: "center",
    padding: "45px 25px",
    borderRadius: 20,
    background: colors.card,
    border: `1px solid ${colors.border}`,
    boxShadow:
      "0 15px 40px rgba(15,23,42,.06)",
  };
}

const emptyIconStyle = {
  width: 62,
  height: 62,
  margin: "0 auto 15px",
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 27,
};

const emptyTitleStyle = {
  margin: "0 0 8px",
  fontSize: 20,
  fontWeight: 800,
};

const emptyTextStyle = {
  maxWidth: 450,
  margin: "0 auto 20px",
  fontSize: 13,
  lineHeight: 1.55,
};