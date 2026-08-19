import { useEffect, useMemo, useState } from "react";
import PageLoader from "../components/PageLoader";
import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

// =====================================================
// NOTIFICATION PAGE
// =====================================================

export default function Notifications() {
  const { isDark } = useAppSettings();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState("");

  const [filter, setFilter] = useState("all");

  // =====================================================
  // COLORS
  // =====================================================

  const theme = useMemo(
    () => ({
      page: isDark ? "#07111f" : "#f5f7fb",
      surface: isDark
        ? "rgba(15, 31, 48, 0.86)"
        : "rgba(255,255,255,0.92)",

      surfaceStrong: isDark
        ? "#102338"
        : "#ffffff",

      border: isDark
        ? "rgba(148,163,184,0.13)"
        : "rgba(15,23,42,0.08)",

      text: isDark
        ? "#f8fafc"
        : "#0f172a",

      muted: isDark
        ? "#94a3b8"
        : "#64748b",

      soft: isDark
        ? "#cbd5e1"
        : "#475569",

      headerGradient: isDark
        ? "linear-gradient(135deg,#0b1d31,#102c43)"
        : "linear-gradient(135deg,#ffffff,#eef5ff)",

      input: isDark
        ? "rgba(255,255,255,0.055)"
        : "#f1f5f9",
    }),
    [isDark]
  );

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  async function fetchNotifications(showLoader = true) {
    let success = false;

    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");
      setErrorType("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "You are not logged in. Please login to view notifications."
        );

        setErrorType("auth");
        setNotifications([]);

        return false;
      }

      const response = await fetch(
        `${API_URL}/api/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      // =================================================
      // 401 AUTH
      // =================================================

      if (response.status === 401) {
        setError(
          data.message ||
            "Your session has expired. Please login again."
        );

        setErrorType("auth");
        setNotifications([]);

        return false;
      }

      // =================================================
      // 403 SUBSCRIPTION / PLAN
      // =================================================

      if (response.status === 403) {
        const message = String(
          data.message || ""
        ).toLowerCase();

        if (
          message.includes("subscription expired")
        ) {
          setError(
            "Your subscription plan has expired. Renew your plan to continue receiving notifications."
          );

          setErrorType("expired");
        } else if (
          message.includes(
            "no active subscription"
          )
        ) {
          setError(
            "You do not have an active subscription. Choose a plan to enable notifications."
          );

          setErrorType("no_subscription");
        } else if (
          message.includes("upgrade your plan")
        ) {
          setError(
            data.message ||
              "Your current plan does not include notifications."
          );

          setErrorType("upgrade");
        } else {
          setError(
            data.message ||
              "Your subscription does not allow access to notifications."
          );

          setErrorType("subscription");
        }

        setNotifications([]);

        return false;
      }

      // =================================================
      // OTHER HTTP ERROR
      // =================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load notifications."
        );
      }

      // =================================================
      // NORMALIZE RESPONSE
      // =================================================

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (
        Array.isArray(data.notifications)
      ) {
        list = data.notifications;
      } else if (
        Array.isArray(data.data)
      ) {
        list = data.data;
      }

      // =================================================
      // SORT NEWEST FIRST
      // =================================================

      list.sort((a, b) => {
        const dateA = new Date(
          a.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b.createdAt || 0
        ).getTime();

        return dateB - dateA;
      });

      setNotifications(list);

      success = true;

      return true;
    } catch (err) {
      console.error(
        "❌ Failed to fetch notifications:",
        err
      );

      setError(
        err.message ||
          "Failed to load notifications."
      );

      setErrorType("network");
      setNotifications([]);

      return false;
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

      if (!token) {
        return false;
      }

      const response = await fetch(
        `${API_URL}/api/notifications/read/all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        console.error(
          "❌ Mark all read failed:",
          data.message
        );

        return false;
      }

      // Update local state immediately
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          status: "read",
        }))
      );

      return true;
    } catch (err) {
      console.error(
        "❌ Failed to mark notifications as read:",
        err
      );

      return false;
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    async function loadPage() {
      const loaded =
        await fetchNotifications(true);

      // IMPORTANT:
      // Only mark as read when fetching succeeded.
      if (loaded) {
        await markAllAsRead();
      }
    }

    loadPage();
  }, []);

  // =====================================================
  // REFRESH
  // =====================================================

  async function handleRefresh() {
    const loaded =
      await fetchNotifications(false);

    if (loaded) {
      await markAllAsRead();
    }
  }

  // =====================================================
  // FILTER
  // =====================================================

  const filteredNotifications =
    useMemo(() => {
      if (filter === "all") {
        return notifications;
      }

      if (filter === "unread") {
        return notifications.filter(
          (item) =>
            item.status === "new"
        );
      }

      if (filter === "critical") {
        return notifications.filter(
          (item) =>
            item.severity === "critical"
        );
      }

      if (filter === "warning") {
        return notifications.filter(
          (item) =>
            item.severity === "warning"
        );
      }

      if (filter === "info") {
        return notifications.filter(
          (item) =>
            item.severity === "info"
        );
      }

      return notifications;
    }, [notifications, filter]);

  // =====================================================
  // COUNTERS
  // =====================================================

  const unreadCount =
    notifications.filter(
      (item) => item.status === "new"
    ).length;

  const criticalCount =
    notifications.filter(
      (item) =>
        item.severity === "critical"
    ).length;

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
  // TYPE LABEL
  // =====================================================

  function getTypeLabel(type) {
    switch (type) {
      case "TOO_HOT":
        return "High Temperature";

      case "TOO_COLD":
        return "Low Temperature";

      case "LOW_HUMIDITY":
        return "Low Humidity";

      case "VERY_HIGH_HUMIDITY":
        return "High Humidity";

      case "SENSOR_OFFLINE":
        return "System Offline";

      case "POWER_LOST":
        return "Power Lost";

      default:
        return "Brooder Alert";
    }
  }

  // =====================================================
  // SHORT MESSAGE
  // =====================================================

  function getMessage(item) {
    if (item.message) {
      return item.message;
    }

    if (item.body) {
      return item.body;
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
  // DATE
  // =====================================================

  function formatDate(date) {
    if (!date) {
      return "Unknown time";
    }

    const parsed = new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Unknown time";
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
  // SEVERITY
  // =====================================================

  function getSeverityStyle(
    severity
  ) {
    switch (severity) {
      case "critical":
        return {
          background: isDark
            ? "rgba(239,68,68,0.15)"
            : "#fef2f2",
          color: "#ef4444",
          border:
            "1px solid rgba(239,68,68,0.20)",
        };

      case "warning":
        return {
          background: isDark
            ? "rgba(245,158,11,0.15)"
            : "#fffbeb",
          color: "#d97706",
          border:
            "1px solid rgba(245,158,11,0.20)",
        };

      case "info":
        return {
          background: isDark
            ? "rgba(59,130,246,0.15)"
            : "#eff6ff",
          color: "#2563eb",
          border:
            "1px solid rgba(59,130,246,0.20)",
        };

      default:
        return {
          background: isDark
            ? "rgba(148,163,184,0.12)"
            : "#f1f5f9",
          color: "#64748b",
          border:
            "1px solid rgba(148,163,184,0.20)",
        };
    }
  }

  // =====================================================
  // CARD ACCENT
  // =====================================================

  function getAccentColor(type) {
    switch (type) {
      case "TOO_HOT":
        return "#ef4444";

      case "TOO_COLD":
        return "#38bdf8";

      case "LOW_HUMIDITY":
        return "#f59e0b";

      case "VERY_HIGH_HUMIDITY":
        return "#8b5cf6";

      case "SENSOR_OFFLINE":
        return "#ef4444";

      case "POWER_LOST":
        return "#f97316";

      default:
        return "#22c55e";
    }
  }

  // =====================================================
  // STATUS LABEL
  // =====================================================

  function getStatusLabel(status) {
    switch (status) {
      case "new":
        return "New";

      case "read":
        return "Read";

      case "resolved":
        return "Resolved";

      default:
        return "New";
    }
  }

  // =====================================================
  // PUSH STATUS
  // =====================================================

  function getPushStatus(item) {
    if (item.isPushSent) {
      return {
        label: "Push sent",
        color: "#22c55e",
      };
    }

    if (item.pushError) {
      return {
        label: "Push failed",
        color: "#ef4444",
      };
    }

    return {
      label: "Not sent",
      color: "#f59e0b",
    };
  }

  // =====================================================
  // ERROR CONTENT
  // =====================================================

  function renderErrorContent() {
    switch (errorType) {
      case "expired":
        return {
          icon: "⏳",
          title: "Subscription Expired",
          button: "Renew / Upgrade",
          href: "/plans",
        };

      case "no_subscription":
        return {
          icon: "🔒",
          title: "No Active Subscription",
          button: "Choose a Plan",
          href: "/plans",
        };

      case "upgrade":
      case "subscription":
        return {
          icon: "⭐",
          title: "Plan Upgrade Required",
          button: "View Plans",
          href: "/plans",
        };

      case "auth":
        return {
          icon: "🔐",
          title: "Authentication Required",
          button: "Login",
          href: "/login",
        };

      default:
        return {
          icon: "⚠️",
          title: "Unable to Load Notifications",
          button: "Try Again",
          href: null,
        };
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          ...styles.page,
          background: theme.page,
        }}
      >
        <PageLoader />
        <BottomNav />
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    const errorContent =
      renderErrorContent();

    return (
      <div
        style={{
          ...styles.page,
          background: theme.page,
          color: theme.text,
        }}
      >
        <style>
          {responsiveCSS}
        </style>

        <div style={styles.topBar}>
          <div>
            <div
              style={{
                ...styles.eyebrow,
                color: "#06b6d4",
              }}
            >
              ANTIMATE • ALERT CENTER
            </div>

            <h1 style={styles.pageTitle}>
              Notifications
            </h1>

            <p
              style={{
                ...styles.subtitle,
                color: theme.muted,
              }}
            >
              Smart brooder monitoring alerts
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              ...styles.refreshButton,
              opacity: refreshing
                ? 0.6
                : 1,
            }}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </div>

        <div
          style={{
            ...styles.errorPanel,
            background:
              theme.surface,
            border:
              `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              ...styles.errorIcon,
              background: isDark
                ? "rgba(239,68,68,0.12)"
                : "#fef2f2",
            }}
          >
            {errorContent.icon}
          </div>

          <h2
            style={{
              ...styles.errorTitle,
              color: theme.text,
            }}
          >
            {errorContent.title}
          </h2>

          <p
            style={{
              ...styles.errorMessage,
              color: theme.muted,
            }}
          >
            {error}
          </p>

          {errorContent.href ? (
            <a
              href={errorContent.href}
              style={
                styles.primaryButton
              }
            >
              {errorContent.button}
            </a>
          ) : (
            <button
              onClick={() =>
                fetchNotifications()
              }
              style={
                styles.primaryButton
              }
            >
              {errorContent.button}
            </button>
          )}
        </div>

        <BottomNav />
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div
      style={{
        ...styles.page,
        background: theme.page,
        color: theme.text,
      }}
    >
      <style>
        {responsiveCSS}
      </style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div style={styles.topBar}>
        <div>
          <div
            style={{
              ...styles.eyebrow,
              color: "#06b6d4",
            }}
          >
            ANTIMATE • ALERT CENTER
          </div>

          <h1 style={styles.pageTitle}>
            Notifications
          </h1>

          <p
            style={{
              ...styles.subtitle,
              color: theme.muted,
            }}
          >
            Smart brooder monitoring alerts
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            ...styles.refreshButton,
            opacity: refreshing
              ? 0.6
              : 1,
          }}
        >
          {refreshing
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div
        className="notification-summary"
        style={styles.summaryGrid}
      >
        <SummaryCard
          icon="🔔"
          label="Total alerts"
          value={notifications.length}
          theme={theme}
          isDark={isDark}
        />

        <SummaryCard
          icon="🆕"
          label="Unread"
          value={unreadCount}
          theme={theme}
          isDark={isDark}
        />

        <SummaryCard
          icon="🚨"
          label="Critical"
          value={criticalCount}
          theme={theme}
          isDark={isDark}
        />
      </div>

      {/* =================================================
          FILTER BAR
      ================================================= */}

      <div
        className="notification-filter"
        style={{
          ...styles.filterBar,
          background:
            theme.surface,
          border:
            `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "7px",
            flexWrap: "wrap",
          }}
        >
          <FilterButton
            label="All"
            active={filter === "all"}
            onClick={() =>
              setFilter("all")
            }
            theme={theme}
          />

          <FilterButton
            label={`Unread ${
              unreadCount > 0
                ? `(${unreadCount})`
                : ""
            }`}
            active={
              filter === "unread"
            }
            onClick={() =>
              setFilter("unread")
            }
            theme={theme}
          />

          <FilterButton
            label="Critical"
            active={
              filter === "critical"
            }
            onClick={() =>
              setFilter("critical")
            }
            theme={theme}
          />

          <FilterButton
            label="Warning"
            active={
              filter === "warning"
            }
            onClick={() =>
              setFilter("warning")
            }
            theme={theme}
          />

          <FilterButton
            label="Info"
            active={
              filter === "info"
            }
            onClick={() =>
              setFilter("info")
            }
            theme={theme}
          />
        </div>

        {notifications.length >
          0 && (
          <button
            onClick={markAllAsRead}
            style={{
              ...styles.readAllButton,
              color: "#06b6d4",
            }}
          >
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* =================================================
          EMPTY FILTER
      ================================================= */}

      {filteredNotifications.length ===
      0 ? (
        <div
          style={{
            ...styles.emptyPanel,
            background:
              theme.surface,
            border:
              `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              ...styles.emptyIcon,
              background: isDark
                ? "rgba(34,197,94,0.10)"
                : "#f0fdf4",
            }}
          >
            {filter === "all"
              ? "🔔"
              : "✓"}
          </div>

          <h2
            style={{
              ...styles.emptyTitle,
              color: theme.text,
            }}
          >
            {filter === "all"
              ? "No notifications"
              : "Nothing here"}
          </h2>

          <p
            style={{
              ...styles.emptyText,
              color: theme.muted,
            }}
          >
            {filter === "all"
              ? "Your brooder is currently running normally. New alerts will appear here."
              : "There are no notifications matching this filter."}
          </p>
        </div>
      ) : (
        /* =================================================
           LIST
        ================================================= */

        <div style={styles.list}>
          {filteredNotifications.map(
            (item, index) => {
              const accent =
                getAccentColor(
                  item.type
                );

              const severityStyle =
                getSeverityStyle(
                  item.severity
                );

              const pushStatus =
                getPushStatus(item);

              const isNew =
                item.status === "new";

              return (
                <div
                  key={
                    item._id ||
                    `${item.createdAt}-${index}`
                  }
                  style={{
                    ...styles.card,
                    background:
                      theme.surface,
                    border:
                      `1px solid ${theme.border}`,
                    borderLeft:
                      `4px solid ${accent}`,
                    boxShadow: isNew
                      ? isDark
                        ? "0 12px 35px rgba(0,0,0,0.22)"
                        : "0 12px 35px rgba(15,23,42,0.08)"
                      : "0 7px 25px rgba(15,23,42,0.05)",
                  }}
                >
                  {/* ======================================
                      CARD HEADER
                  ====================================== */}

                  <div
                    style={
                      styles.cardHeader
                    }
                  >
                    <div
                      style={{
                        ...styles.notificationIcon,
                        background: `${accent}18`,
                        border:
                          `1px solid ${accent}30`,
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
                        style={
                          styles.titleRow
                        }
                      >
                        <h2
                          style={{
                            ...styles.cardTitle,
                            color:
                              theme.text,
                          }}
                        >
                          {item.title ||
                            getTypeLabel(
                              item.type
                            )}
                        </h2>

                        {isNew && (
                          <span
                            style={
                              styles.newDot
                            }
                          >
                            NEW
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          ...styles.typeRow,
                          color:
                            theme.muted,
                        }}
                      >
                        <span>
                          {getTypeLabel(
                            item.type
                          )}
                        </span>

                        <span>
                          •
                        </span>

                        <span>
                          {formatDate(
                            item.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.severityBadge,
                        ...severityStyle,
                      }}
                    >
                      {item.severity ||
                        "warning"}
                    </span>
                  </div>

                  {/* ======================================
                      MESSAGE
                  ====================================== */}

                  <p
                    style={{
                      ...styles.message,
                      color: theme.soft,
                    }}
                  >
                    {getMessage(item)}
                  </p>

                  {/* ======================================
                      SENSOR DATA
                  ====================================== */}

                  <div
                    style={
                      styles.metricsGrid
                    }
                  >
                    {item.temperature !==
                      null &&
                      item.temperature !==
                        undefined && (
                        <Metric
                          icon="🌡️"
                          label="Temperature"
                          value={`${item.temperature}°C`}
                          theme={theme}
                        />
                      )}

                    {item.humidity !==
                      null &&
                      item.humidity !==
                        undefined && (
                        <Metric
                          icon="💧"
                          label="Humidity"
                          value={`${item.humidity}%`}
                          theme={theme}
                        />
                      )}

                    {item.chicksAge !==
                      null &&
                      item.chicksAge !==
                        undefined && (
                        <Metric
                          icon="🐣"
                          label="Chick age"
                          value={`${item.chicksAge} days`}
                          theme={theme}
                        />
                      )}

                    {item.chicksType && (
                      <Metric
                        icon="🐔"
                        label="Type"
                        value={
                          item.chicksType
                        }
                        theme={theme}
                      />
                    )}

                    {item.heater !==
                      undefined &&
                      item.heater !==
                        null && (
                        <Metric
                          icon="🔥"
                          label="Heater"
                          value={String(
                            item.heater
                          )}
                          theme={theme}
                        />
                      )}

                    {item.fan !==
                      undefined &&
                      item.fan !==
                        null && (
                        <Metric
                          icon="🌀"
                          label="Fan"
                          value={String(
                            item.fan
                          )}
                          theme={theme}
                        />
                      )}
                  </div>

                  {/* ======================================
                      INTELLIGENCE
                  ====================================== */}

                  {item.intelligence && (
                    <div
                      style={{
                        ...styles.intelligence,
                        background:
                          isDark
                            ? "rgba(6,182,212,0.08)"
                            : "#ecfeff",
                        border:
                          isDark
                            ? "1px solid rgba(6,182,212,0.16)"
                            : "1px solid #cffafe",
                      }}
                    >
                      <div
                        style={
                          styles.intelligenceTitle
                        }
                      >
                        <span>
                          🧠
                        </span>

                        <span>
                          ANTIMATE AI
                        </span>
                      </div>

                      <p
                        style={{
                          ...styles.intelligenceText,
                          color:
                            theme.soft,
                        }}
                      >
                        {
                          item.intelligence
                        }
                      </p>
                    </div>
                  )}

                  {/* ======================================
                      ACTION
                  ====================================== */}

                  {item.action && (
                    <div
                      style={{
                        ...styles.actionBox,
                        color:
                          theme.soft,
                      }}
                    >
                      <strong>
                        Recommended action:
                      </strong>

                      <span>
                        {item.action}
                      </span>
                    </div>
                  )}

                  {/* ======================================
                      FOOTER
                  ====================================== */}

                  <div
                    style={{
                      ...styles.cardFooter,
                      borderTop:
                        `1px solid ${theme.border}`,
                    }}
                  >
                    <div
                      style={
                        styles.footerLeft
                      }
                    >
                      <span
                        style={{
                          ...styles.statusBadge,
                          background:
                            isNew
                              ? isDark
                                ? "rgba(59,130,246,0.13)"
                                : "#eff6ff"
                              : isDark
                              ? "rgba(148,163,184,0.10)"
                              : "#f8fafc",
                          color:
                            isNew
                              ? "#3b82f6"
                              : theme.muted,
                        }}
                      >
                        {getStatusLabel(
                          item.status
                        )}
                      </span>

                      <span
                        style={{
                          ...styles.pushStatus,
                          color:
                            pushStatus.color,
                        }}
                      >
                        <span
                          style={{
                            ...styles.pushDot,
                            background:
                              pushStatus.color,
                          }}
                        />

                        {pushStatus.label}
                      </span>
                    </div>

                    <span
                      style={{
                        color:
                          theme.muted,
                        fontSize: "11px",
                      }}
                    >
                      {item.systemId ||
                        "BR System"}
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
// SUMMARY CARD
// =====================================================

function SummaryCard({
  icon,
  label,
  value,
  theme,
  isDark,
}) {
  return (
    <div
      style={{
        ...styles.summaryCard,
        background:
          theme.surface,
        border:
          `1px solid ${theme.border}`,
      }}
    >
      <div
        style={{
          ...styles.summaryIcon,
          background: isDark
            ? "rgba(6,182,212,0.10)"
            : "#ecfeff",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            ...styles.summaryValue,
            color: theme.text,
          }}
        >
          {value}
        </div>

        <div
          style={{
            ...styles.summaryLabel,
            color: theme.muted,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// FILTER BUTTON
// =====================================================

function FilterButton({
  label,
  active,
  onClick,
  theme,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.filterButton,
        background: active
          ? "linear-gradient(135deg,#0891b2,#2563eb)"
          : theme.input,
        color: active
          ? "#ffffff"
          : theme.muted,
        border: active
          ? "1px solid transparent"
          : `1px solid ${theme.border}`,
      }}
    >
      {label}
    </button>
  );
}

// =====================================================
// METRIC
// =====================================================

function Metric({
  icon,
  label,
  value,
  theme,
}) {
  return (
    <div
      style={{
        ...styles.metric,
        background:
          theme.input,
        border:
          `1px solid ${theme.border}`,
      }}
    >
      <span style={styles.metricIcon}>
        {icon}
      </span>

      <div>
        <div
          style={{
            ...styles.metricLabel,
            color: theme.muted,
          }}
        >
          {label}
        </div>

        <div
          style={{
            ...styles.metricValue,
            color: theme.text,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// RESPONSIVE CSS
// =====================================================

const responsiveCSS = `
  * {
    box-sizing: border-box;
  }

  button,
  a {
    -webkit-tap-highlight-color: transparent;
  }

  @media (max-width: 800px) {
    .notification-summary {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  }

  @media (max-width: 620px) {
    .notification-summary {
      grid-template-columns: 1fr !important;
    }

    .notification-filter {
      align-items: stretch !important;
      flex-direction: column !important;
    }
  }

  @media (max-width: 500px) {
    body {
      overflow-x: hidden;
    }
  }
`;

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "26px",
    paddingBottom: "115px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // ===================================================
  // HEADER
  // ===================================================

  topBar: {
    maxWidth: "1180px",
    margin: "0 auto 25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  eyebrow: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    marginBottom: "6px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: "-0.7px",
  },

  subtitle: {
    margin:
      "7px 0 0",
    fontSize: "13px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "12px",
    padding: "11px 16px",
    background:
      "linear-gradient(135deg,#06b6d4,#2563eb)",
    color: "#ffffff",
    fontWeight: 750,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow:
      "0 7px 20px rgba(37,99,235,0.20)",
  },

  // ===================================================
  // SUMMARY
  // ===================================================

  summaryGrid: {
    maxWidth: "1180px",
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "12px",
  },

  summaryCard: {
    minHeight: "82px",
    borderRadius: "17px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow:
      "0 7px 25px rgba(15,23,42,0.05)",
  },

  summaryIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    flexShrink: 0,
  },

  summaryValue: {
    fontSize: "23px",
    fontWeight: 800,
    lineHeight: 1,
  },

  summaryLabel: {
    fontSize: "11px",
    marginTop: "5px",
  },

  // ===================================================
  // FILTER
  // ===================================================

  filterBar: {
    maxWidth: "1180px",
    margin: "0 auto 18px",
    padding: "10px",
    borderRadius: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  filterButton: {
    borderRadius: "9px",
    padding: "8px 11px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  readAllButton: {
    border: "none",
    background: "transparent",
    fontSize: "11px",
    fontWeight: 750,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // ===================================================
  // LIST
  // ===================================================

  list: {
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  // ===================================================
  // CARD
  // ===================================================

  card: {
    borderRadius: "18px",
    padding: "17px",
    backdropFilter: "blur(15px)",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  notificationIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    flexShrink: 0,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },

  cardTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 780,
    lineHeight: 1.25,
  },

  newDot: {
    padding: "3px 6px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: "8px",
    fontWeight: 850,
    letterSpacing: "0.5px",
  },

  typeRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "5px",
    fontSize: "10px",
  },

  severityBadge: {
    padding: "5px 8px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 850,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    whiteSpace: "nowrap",
  },

  message: {
    margin:
      "14px 0 13px",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  // ===================================================
  // METRICS
  // ===================================================

  metricsGrid: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  metric: {
    minWidth: "112px",
    borderRadius: "11px",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  metricIcon: {
    fontSize: "16px",
  },

  metricLabel: {
    fontSize: "9px",
    marginBottom: "2px",
  },

  metricValue: {
    fontSize: "11px",
    fontWeight: 750,
  },

  // ===================================================
  // AI
  // ===================================================

  intelligence: {
    borderRadius: "13px",
    padding: "11px 12px",
    marginTop: "4px",
  },

  intelligenceTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "9px",
    fontWeight: 850,
    letterSpacing: "0.7px",
    color: "#0891b2",
  },

  intelligenceText: {
    margin:
      "6px 0 0",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  // ===================================================
  // ACTION
  // ===================================================

  actionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginTop: "11px",
    padding: "10px 11px",
    borderRadius: "11px",
    background:
      "rgba(148,163,184,0.07)",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  cardFooter: {
    marginTop: "14px",
    paddingTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    flexWrap: "wrap",
  },

  statusBadge: {
    padding: "4px 7px",
    borderRadius: "7px",
    fontSize: "9px",
    fontWeight: 750,
  },

  pushStatus: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "10px",
    fontWeight: 650,
  },

  pushDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  // ===================================================
  // EMPTY
  // ===================================================

  emptyPanel: {
    maxWidth: "620px",
    margin: "55px auto",
    padding: "45px 25px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.06)",
  },

  emptyIcon: {
    width: "65px",
    height: "65px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
    fontSize: "29px",
  },

  emptyTitle: {
    margin: "0 0 7px",
    fontSize: "20px",
    fontWeight: 780,
  },

  emptyText: {
    maxWidth: "430px",
    margin: "0 auto",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  // ===================================================
  // ERROR
  // ===================================================

  errorPanel: {
    maxWidth: "620px",
    margin: "60px auto",
    padding: "45px 25px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)",
  },

  errorIcon: {
    width: "68px",
    height: "68px",
    borderRadius: "21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
    fontSize: "30px",
  },

  errorTitle: {
    margin: "0 0 8px",
    fontSize: "21px",
    fontWeight: 800,
  },

  errorMessage: {
    maxWidth: "450px",
    margin: "0 auto 20px",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  primaryButton: {
    display: "inline-block",
    border: "none",
    textDecoration: "none",
    borderRadius: "11px",
    padding: "11px 17px",
    background:
      "linear-gradient(135deg,#06b6d4,#2563eb)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(37,99,235,0.20)",
  },
};