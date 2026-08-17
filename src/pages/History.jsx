import { useEffect, useMemo, useState } from "react";

import {
  History as HistoryIcon,
  RefreshCw,
  Search,
  Filter,
  CalendarDays,
  Settings,
  Thermometer,
  Droplets,
  Fan,
  Flame,
  Wifi,
  WifiOff,
  Clock3,
  CheckCircle2,
  XCircle,
  Activity,
  CreditCard,
  Bell,
  Database,
  Cpu,
  ChevronRight,
} from "lucide-react";

import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";
import API from "../api/api";

export default function History() {
  const {
    isDark,
    language,
    text,
  } = useAppSettings();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // =====================================================
  // THEME
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
    ? "rgba(255,255,255,0.07)"
    : "rgba(255,255,255,0.82)";

  const border = isDark
    ? "rgba(255,255,255,0.10)"
    : "rgba(15,23,42,0.08)";

  // =====================================================
  // FETCH HISTORY
  // =====================================================

  async function fetchHistory() {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/history");

      /*
       * Backend:
       *
       * {
       *   success: true,
       *   data: [...],
       *   pagination: {...}
       * }
       */

      let data = [];

      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (Array.isArray(res.data?.data)) {
        data = res.data.data;
      } else if (Array.isArray(res.data?.history)) {
        data = res.data.history;
      }

      setHistory(data);
    } catch (err) {
      console.error(
        "HISTORY LOADING ERROR:",
        err
      );

      setHistory([]);

      setError(
        err?.response?.data?.message ||
          (language === "rw"
            ? "Ntibyashobotse kubona amateka."
            : "Failed to load history.")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  // =====================================================
  // NORMALIZE RAW VALUE
  // =====================================================

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .trim();
  }

  // =====================================================
  // GET HISTORY CATEGORY
  //
  // IMPORTANT:
  // Temperature / Humidity / Heater / Fan
  // are TELEMETRY, not top-level categories.
  // =====================================================

  function getHistoryCategory(item) {
    const raw = normalize(
      [
        item.category,
        item.type,
        item.eventType,
        item.action,
        item.event,
        item.source,
        item.module,
        item.service,
        item.kind,
      ]
        .filter(Boolean)
        .join(" ")
    );

    const textContent = normalize(
      [
        item.title,
        item.description,
        item.message,
      ]
        .filter(Boolean)
        .join(" ")
    );

    const combined = `${raw} ${textContent}`;

    // ===================================================
    // CONFIGURATION
    // ===================================================

    if (
      raw.includes("configuration") ||
      raw.includes("config") ||
      raw.includes("setting") ||
      raw.includes("settings") ||
      combined.includes("configuration updated") ||
      combined.includes("configuration changed")
    ) {
      return "configuration";
    }

    // ===================================================
    // TELEMETRY
    //
    // Temperature
    // Humidity
    // Heater
    // Fan
    // Sensor
    // telemetry
    // ===================================================

    if (
      raw.includes("telemetry") ||
      raw.includes("sensor") ||
      raw.includes("temperature") ||
      raw.includes("temp") ||
      raw.includes("humidity") ||
      raw.includes("humid") ||
      raw.includes("heater") ||
      raw.includes("heat") ||
      raw.includes("fan") ||
      raw.includes("ventilation") ||
      combined.includes("temperature") ||
      combined.includes("humidity") ||
      combined.includes("heater") ||
      combined.includes("fan")
    ) {
      return "telemetry";
    }

    // ===================================================
    // PAYMENTS
    // ===================================================

    if (
      raw.includes("payment") ||
      raw.includes("payments") ||
      raw.includes("subscription") ||
      raw.includes("plan") ||
      raw.includes("invoice") ||
      raw.includes("billing") ||
      raw.includes("paypack") ||
      combined.includes("payment") ||
      combined.includes("subscription") ||
      combined.includes("invoice")
    ) {
      return "payments";
    }

    // ===================================================
    // NOTIFICATIONS
    // ===================================================

    if (
      raw.includes("notification") ||
      raw.includes("notifications") ||
      raw.includes("alert") ||
      raw.includes("alerts") ||
      raw.includes("otp") ||
      combined.includes("notification") ||
      combined.includes("alert")
    ) {
      return "notifications";
    }

    // ===================================================
    // SYSTEM
    // ===================================================

    if (
      raw.includes("system") ||
      raw.includes("device") ||
      raw.includes("gateway") ||
      raw.includes("online") ||
      raw.includes("offline") ||
      raw.includes("connect") ||
      raw.includes("disconnect") ||
      raw.includes("heartbeat") ||
      raw.includes("br system") ||
      combined.includes("system came online") ||
      combined.includes("system went offline")
    ) {
      return "system";
    }

    return "activity";
  }

  // =====================================================
  // GET TELEMETRY TYPE
  //
  // Used only for displaying telemetry details.
  // =====================================================

  function getTelemetryType(item) {
    const raw = normalize(
      [
        item.type,
        item.eventType,
        item.action,
        item.event,
        item.category,
        item.sensor,
        item.metric,
        item.name,
        item.title,
        item.description,
        item.message,
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (
      raw.includes("temperature") ||
      raw.includes("temp")
    ) {
      return "temperature";
    }

    if (
      raw.includes("humidity") ||
      raw.includes("humid")
    ) {
      return "humidity";
    }

    if (
      raw.includes("heater") ||
      raw.includes("heat")
    ) {
      return "heater";
    }

    if (
      raw.includes("fan") ||
      raw.includes("ventilation")
    ) {
      return "fan";
    }

    if (
      raw.includes("online") ||
      raw.includes("connected")
    ) {
      return "online";
    }

    if (
      raw.includes("offline") ||
      raw.includes("disconnect")
    ) {
      return "offline";
    }

    return "telemetry";
  }

  // =====================================================
  // FILTER HISTORY
  // =====================================================

  const filteredHistory = useMemo(() => {
    let result = [...history];

    // CATEGORY FILTER
    if (filter !== "all") {
      result = result.filter(
        (item) =>
          getHistoryCategory(item) ===
          filter
      );
    }

    // SEARCH
    if (search.trim()) {
      const query = normalize(search);

      result = result.filter((item) => {
        const searchable = [
          item.title,
          item.description,
          item.message,
          item.deviceId,
          item.gatewayId,
          item.systemName,
          item.type,
          item.eventType,
          item.action,
          item.event,
          item.category,
          item.source,
          item.module,
          item.service,
          item.status,
          item.planName,
          item.paymentStatus,
          item.amount,
          item.value,
        ]
          .filter(
            (value) =>
              value !== undefined &&
              value !== null
          )
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    return result;
  }, [
    history,
    filter,
    search,
  ]);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  function getTimestamp(item) {
    return (
      item.createdAt ||
      item.timestamp ||
      item.date ||
      item.time ||
      item.updatedAt
    );
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "--";
    }

    return date.toLocaleDateString(
      language === "rw"
        ? "rw-RW"
        : "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "--";
    }

    return date.toLocaleTimeString(
      language === "rw"
        ? "rw-RW"
        : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // =====================================================
  // CATEGORY TITLE
  // =====================================================

  function getCategoryTitle(category) {
    const titles = {
      all:
        language === "rw"
          ? "Amateka yose"
          : "All History",

      configuration:
        language === "rw"
          ? "Configuration History"
          : "Configuration History",

      telemetry:
        language === "rw"
          ? "Telemetry History"
          : "Telemetry History",

      system:
        language === "rw"
          ? "System History"
          : "System History",

      payments:
        language === "rw"
          ? "Payments"
          : "Payments",

      notifications:
        language === "rw"
          ? "Notifications"
          : "Notifications",

      activity:
        language === "rw"
          ? "Other Activity"
          : "Other Activity",
    };

    return (
      titles[category] ||
      titles.activity
    );
  }

  // =====================================================
  // GET TITLE
  // =====================================================

  function getTitle(item) {
    if (item.title) {
      return item.title;
    }

    const category =
      getHistoryCategory(item);

    const telemetryType =
      getTelemetryType(item);

    if (
      category === "telemetry"
    ) {
      const telemetryTitles = {
        temperature:
          language === "rw"
            ? "Temperature"
            : "Temperature",

        humidity:
          language === "rw"
            ? "Humidity"
            : "Humidity",

        heater:
          language === "rw"
            ? "Heater"
            : "Heater",

        fan:
          language === "rw"
            ? "Fan"
            : "Fan",

        online:
          language === "rw"
            ? "System iri online"
            : "System online",

        offline:
          language === "rw"
            ? "System iri offline"
            : "System offline",

        telemetry:
          language === "rw"
            ? "Telemetry"
            : "Telemetry",
      };

      return (
        telemetryTitles[
          telemetryType
        ] || "Telemetry"
      );
    }

    const titles = {
      configuration:
        language === "rw"
          ? "Configuration yahinduwe"
          : "Configuration Updated",

      payments:
        language === "rw"
          ? "Payment"
          : "Payment",

      notifications:
        language === "rw"
          ? "Notification"
          : "Notification",

      system:
        language === "rw"
          ? "System Activity"
          : "System Activity",

      activity:
        language === "rw"
          ? "Igikorwa cya System"
          : "System Activity",
    };

    return (
      titles[category] ||
      titles.activity
    );
  }

  // =====================================================
  // GET DESCRIPTION
  // =====================================================

  function getDescription(item) {
    if (item.description) {
      return item.description;
    }

    if (item.message) {
      return item.message;
    }

    const category =
      getHistoryCategory(item);

    const telemetryType =
      getTelemetryType(item);

    // ===================================================
    // TELEMETRY
    // ===================================================

    if (
      category === "telemetry"
    ) {
      if (
        telemetryType ===
          "temperature" &&
        item.value !== undefined
      ) {
        return `${item.value}°C`;
      }

      if (
        telemetryType ===
          "humidity" &&
        item.value !== undefined
      ) {
        return `${item.value}%`;
      }

      if (
        telemetryType === "heater" &&
        item.status !== undefined
      ) {
        return `Heater: ${String(
          item.status
        ).toUpperCase()}`;
      }

      if (
        telemetryType === "fan" &&
        item.status !== undefined
      ) {
        return `Fan: ${String(
          item.status
        ).toUpperCase()}`;
      }

      if (
        item.temperature !==
          undefined ||
        item.humidity !==
          undefined
      ) {
        const parts = [];

        if (
          item.temperature !==
          undefined
        ) {
          parts.push(
            `Temperature: ${item.temperature}°C`
          );
        }

        if (
          item.humidity !==
          undefined
        ) {
          parts.push(
            `Humidity: ${item.humidity}%`
          );
        }

        return parts.join(" • ");
      }
    }

    // ===================================================
    // PAYMENT
    // ===================================================

    if (
      category === "payments"
    ) {
      const parts = [];

      if (item.planName) {
        parts.push(
          `Plan: ${item.planName}`
        );
      }

      if (item.amount !== undefined) {
        parts.push(
          `Amount: ${item.amount} FRW`
        );
      }

      if (item.status) {
        parts.push(
          `Status: ${item.status}`
        );
      }

      if (item.paymentStatus) {
        parts.push(
          `Status: ${item.paymentStatus}`
        );
      }

      if (parts.length) {
        return parts.join(" • ");
      }
    }

    // ===================================================
    // CONFIGURATION
    // ===================================================

    if (
      category === "configuration"
    ) {
      if (item.chicksType) {
        return `Chicks: ${item.chicksType}`;
      }

      if (item.area) {
        return `Area: ${item.area}`;
      }

      if (item.roomArea) {
        return `Room area: ${item.roomArea}`;
      }

      if (item.birthDate) {
        return `Birth date: ${formatDate(
          item.birthDate
        )}`;
      }
    }

    // ===================================================
    // GENERIC VALUE
    // ===================================================

    if (
      item.value !== undefined &&
      item.value !== null
    ) {
      return String(item.value);
    }

    if (item.status) {
      return String(
        item.status
      ).toUpperCase();
    }

    return language === "rw"
      ? "Nta bisobanuro by'inyongera bihari."
      : "No additional information.";
  }

  // =====================================================
  // CATEGORY ICON
  // =====================================================

  function getCategoryIcon(
    category,
    item
  ) {
    if (
      category === "telemetry"
    ) {
      const telemetryType =
        getTelemetryType(item);

      switch (
        telemetryType
      ) {
        case "temperature":
          return (
            <Thermometer
              size={19}
            />
          );

        case "humidity":
          return (
            <Droplets
              size={19}
            />
          );

        case "heater":
          return (
            <Flame size={19} />
          );

        case "fan":
          return (
            <Fan size={19} />
          );

        case "online":
          return (
            <Wifi size={19} />
          );

        case "offline":
          return (
            <WifiOff size={19} />
          );

        default:
          return (
            <Activity
              size={19}
            />
          );
      }
    }

    switch (category) {
      case "configuration":
        return (
          <Settings size={19} />
        );

      case "payments":
        return (
          <CreditCard
            size={19}
          />
        );

      case "notifications":
        return (
          <Bell size={19} />
        );

      case "system":
        return (
          <Cpu size={19} />
        );

      case "activity":
      default:
        return (
          <HistoryIcon
            size={19}
          />
        );
    }
  }

  // =====================================================
  // ICON STYLE
  // =====================================================

  function getIconStyle(
    category,
    item
  ) {
    if (
      category === "telemetry"
    ) {
      const type =
        getTelemetryType(item);

      switch (type) {
        case "temperature":
          return {
            background:
              "rgba(239,68,68,.12)",
            color: "#ef4444",
          };

        case "humidity":
          return {
            background:
              "rgba(59,130,246,.12)",
            color: "#3b82f6",
          };

        case "heater":
          return {
            background:
              "rgba(249,115,22,.12)",
            color: "#f97316",
          };

        case "fan":
          return {
            background:
              "rgba(14,165,233,.12)",
            color: "#0ea5e9",
          };

        case "online":
          return {
            background:
              "rgba(34,197,94,.12)",
            color: "#22c55e",
          };

        case "offline":
          return {
            background:
              "rgba(239,68,68,.12)",
            color: "#ef4444",
          };

        default:
          return {
            background:
              "rgba(37,99,235,.12)",
            color: "#2563eb",
          };
      }
    }

    switch (category) {
      case "configuration":
        return {
          background:
            "rgba(124,58,237,.12)",
          color: "#7c3aed",
        };

      case "payments":
        return {
          background:
            "rgba(34,197,94,.12)",
          color: "#22c55e",
        };

      case "notifications":
        return {
          background:
            "rgba(234,179,8,.12)",
          color: "#ca8a04",
        };

      case "system":
        return {
          background:
            "rgba(14,165,233,.12)",
          color: "#0284c7",
        };

      default:
        return {
          background:
            "rgba(37,99,235,.12)",
          color: "#2563eb",
        };
    }
  }

  // =====================================================
  // FILTERS
  // =====================================================

  const filters = [
    {
      id: "all",
      label:
        language === "rw"
          ? "Byose"
          : "All",
      icon: (
        <HistoryIcon size={14} />
      ),
    },

    {
      id: "configuration",
      label:
        language === "rw"
          ? "Configuration"
          : "Configuration",
      icon: (
        <Settings size={14} />
      ),
    },

    {
      id: "telemetry",
      label:
        language === "rw"
          ? "Telemetry"
          : "Telemetry",
      icon: (
        <Activity size={14} />
      ),
    },

    {
      id: "system",
      label:
        language === "rw"
          ? "System"
          : "System",
      icon: (
        <Cpu size={14} />
      ),
    },

    {
      id: "payments",
      label:
        language === "rw"
          ? "Payments"
          : "Payments",
      icon: (
        <CreditCard
          size={14}
        />
      ),
    },

    {
      id: "notifications",
      label:
        language === "rw"
          ? "Notifications"
          : "Notifications",
      icon: (
        <Bell size={14} />
      ),
    },

    {
      id: "activity",
      label:
        language === "rw"
          ? "Ibindi"
          : "Other",
      icon: (
        <HistoryIcon size={14} />
      ),
    },
  ];

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
      <AppHeader
        title={
          text?.history ||
          (language === "rw"
            ? "Amateka"
            : "History")
        }
      />

      <main style={styles.content}>
        {/* =================================================
            HEADER
        ================================================= */}

        <section
          style={styles.header}
        >
          <div>
            <p
              style={{
                ...styles.overline,
                color: muted,
              }}
            >
              ANTIMATE
            </p>

            <h1
              style={{
                ...styles.title,
                color: textColor,
              }}
            >
              {text?.history ||
                (language === "rw"
                  ? "Amateka"
                  : "History")}
            </h1>

            <p
              style={{
                ...styles.subtitle,
                color: muted,
              }}
            >
              {language === "rw"
                ? "Reba amateka y'ibikorwa bya system yawe."
                : "View the history of activities across your system."}
            </p>
          </div>

          <div
            style={styles.headerIcon}
          >
            <HistoryIcon
              size={21}
            />
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={
              styles.errorBox
            }
          >
            <XCircle size={16} />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* =================================================
            SEARCH
        ================================================= */}

        <section
          style={{
            ...styles.searchCard,
            background:
              cardBackground,
            border: `1px solid ${border}`,
          }}
        >
          <div
            style={
              styles.searchBox
            }
          >
            <Search
              size={17}
              color={muted}
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder={
                language === "rw"
                  ? "Shakisha mu mateka..."
                  : "Search history..."
              }
              style={{
                ...styles.searchInput,
                color: textColor,
              }}
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                style={
                  styles.clearButton
                }
              >
                ×
              </button>
            )}
          </div>
        </section>

        {/* =================================================
            CATEGORY FILTER
        ================================================= */}

        <section
          style={
            styles.filterSection
          }
        >
          <div
            style={
              styles.filterHeader
            }
          >
            <div
              style={
                styles.filterTitle
              }
            >
              <Filter
                size={15}
              />

              <span>
                {language === "rw"
                  ? "Ibyiciro"
                  : "Categories"}
              </span>
            </div>

            <span
              style={{
                ...styles.resultCount,
                color: muted,
              }}
            >
              {filteredHistory.length}{" "}
              {language === "rw"
                ? "records"
                : "records"}
            </span>
          </div>

          <div
            style={
              styles.filterList
            }
          >
            {filters.map(
              (item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setFilter(
                      item.id
                    )
                  }
                  style={{
                    ...styles.filterButton,
                    ...(filter ===
                    item.id
                      ? styles.filterActive
                      : {}),
                  }}
                >
                  {item.icon}

                  <span>
                    {item.label}
                  </span>
                </button>
              )
            )}
          </div>
        </section>

        {/* =================================================
            HISTORY HEADER
        ================================================= */}

        <div
          style={
            styles.historyHeader
          }
        >
          <div>
            <h2
              style={{
                ...styles.sectionTitle,
                color: textColor,
              }}
            >
              {getCategoryTitle(
                filter
              )}
            </h2>

            <p
              style={{
                ...styles.sectionSubtitle,
                color: muted,
              }}
            >
              {language === "rw"
                ? "Ibikorwa biheruka kugaragara."
                : "Recent records and activities."}
            </p>
          </div>

          <button
            onClick={
              fetchHistory
            }
            disabled={loading}
            style={{
              ...styles.refreshButton,
              opacity: loading
                ? 0.55
                : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={
                loading
                  ? {
                      animation:
                        "spin 1s linear infinite",
                    }
                  : {}
              }
            />

            Refresh
          </button>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading &&
          history.length === 0 && (
            <div
              style={{
                ...styles.loadingCard,
                background:
                  cardBackground,
                border:
                  `1px solid ${border}`,
              }}
            >
              <RefreshCw
                size={25}
                style={{
                  animation:
                    "spin 1s linear infinite",
                }}
              />

              <p
                style={{
                  color: muted,
                }}
              >
                {language === "rw"
                  ? "Turimo gushaka amateka..."
                  : "Loading history..."}
              </p>
            </div>
          )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          filteredHistory.length ===
            0 && (
            <div
              style={{
                ...styles.empty,
                background:
                  cardBackground,
                border:
                  `1px solid ${border}`,
              }}
            >
              <div
                style={
                  styles.emptyIcon
                }
              >
                {filter ===
                "configuration" ? (
                  <Settings
                    size={28}
                  />
                ) : filter ===
                  "telemetry" ? (
                  <Activity
                    size={28}
                  />
                ) : filter ===
                  "payments" ? (
                  <CreditCard
                    size={28}
                  />
                ) : filter ===
                  "notifications" ? (
                  <Bell
                    size={28}
                  />
                ) : (
                  <HistoryIcon
                    size={30}
                  />
                )}
              </div>

              <h3
                style={{
                  ...styles.emptyTitle,
                  color: textColor,
                }}
              >
                {search ||
                filter !== "all"
                  ? language === "rw"
                    ? "Nta records zabonetse"
                    : "No records found"
                  : language === "rw"
                  ? "Nta mateka ahari"
                  : "No history yet"}
              </h3>

              <p
                style={{
                  ...styles.emptyText,
                  color: muted,
                }}
              >
                {search ||
                filter !== "all"
                  ? language === "rw"
                    ? "Gerageza guhindura search cyangwa category."
                    : "Try changing your search or category."
                  : language === "rw"
                  ? "Ibikorwa bya system bizagaragara hano iyo byanditswe."
                  : "System activities will appear here when they are recorded."}
              </p>
            </div>
          )}

        {/* =================================================
            HISTORY LIST
        ================================================= */}

        {filteredHistory.length >
          0 && (
          <div
            style={
              styles.historyList
            }
          >
            {filteredHistory.map(
              (item, index) => {
                const category =
                  getHistoryCategory(
                    item
                  );

                const timestamp =
                  getTimestamp(
                    item
                  );

                const iconStyle =
                  getIconStyle(
                    category,
                    item
                  );

                return (
                  <div
                    key={
                      item._id ||
                      item.id ||
                      `${timestamp}-${index}`
                    }
                    style={{
                      ...styles.historyCard,
                      background:
                        cardBackground,
                      border:
                        `1px solid ${border}`,
                    }}
                  >
                    {/* ICON */}

                    <div
                      style={{
                        ...styles.historyIcon,
                        ...iconStyle,
                      }}
                    >
                      {getCategoryIcon(
                        category,
                        item
                      )}
                    </div>

                    {/* CONTENT */}

                    <div
                      style={
                        styles.historyContent
                      }
                    >
                      <div
                        style={
                          styles.historyTop
                        }
                      >
                        <div
                          style={
                            styles.titleGroup
                          }
                        >
                          <h3
                            style={{
                              ...styles.historyTitle,
                              color: textColor,
                            }}
                          >
                            {getTitle(
                              item
                            )}
                          </h3>

                          <span
                            style={{
                              ...styles.categoryBadge,
                              color:
                                iconStyle.color,
                              background:
                                iconStyle.background,
                            }}
                          >
                            {getCategoryTitle(
                              category
                            )}
                          </span>
                        </div>

                        {item.success !==
                          undefined &&
                          (item.success ? (
                            <CheckCircle2
                              size={15}
                              color="#22c55e"
                            />
                          ) : (
                            <XCircle
                              size={15}
                              color="#ef4444"
                            />
                          ))}
                      </div>

                      <p
                        style={{
                          ...styles.historyDescription,
                          color: muted,
                        }}
                      >
                        {getDescription(
                          item
                        )}
                      </p>

                      {/* TELEMETRY DETAILS */}

                      {category ===
                        "telemetry" && (
                        <div
                          style={
                            styles.telemetryRow
                          }
                        >
                          {item.temperature !==
                            undefined && (
                            <span>
                              <Thermometer
                                size={11}
                              />
                              {
                                item.temperature
                              }°C
                            </span>
                          )}

                          {item.humidity !==
                            undefined && (
                            <span>
                              <Droplets
                                size={11}
                              />
                              {
                                item.humidity
                              }%
                            </span>
                          )}

                          {item.heater !==
                            undefined && (
                            <span>
                              <Flame
                                size={11}
                              />
                              Heater:{" "}
                              {
                                String(
                                  item.heater
                                ).toUpperCase()
                              }
                            </span>
                          )}

                          {item.fan !==
                            undefined && (
                            <span>
                              <Fan
                                size={11}
                              />
                              Fan:{" "}
                              {
                                String(
                                  item.fan
                                ).toUpperCase()
                              }
                            </span>
                          )}
                        </div>
                      )}

                      {/* DEVICE / SYSTEM */}

                      {(item.deviceId ||
                        item.gatewayId ||
                        item.systemName) && (
                        <div
                          style={
                            styles.metaRow
                          }
                        >
                          {item.systemName && (
                            <span>
                              {
                                item.systemName
                              }
                            </span>
                          )}

                          {item.deviceId && (
                            <span>
                              Device:{" "}
                              {
                                item.deviceId
                              }
                            </span>
                          )}

                          {item.gatewayId && (
                            <span>
                              Gateway:{" "}
                              {
                                item.gatewayId
                              }
                            </span>
                          )}
                        </div>
                      )}

                      {/* PAYMENT */}

                      {category ===
                        "payments" && (
                        <div
                          style={
                            styles.paymentRow
                          }
                        >
                          {item.planName && (
                            <span>
                              Plan:{" "}
                              {
                                item.planName
                              }
                            </span>
                          )}

                          {item.amount !==
                            undefined && (
                            <span>
                              {
                                item.amount
                              }{" "}
                              FRW
                            </span>
                          )}

                          {(item.status ||
                            item.paymentStatus) && (
                            <span>
                              Status:{" "}
                              {String(
                                item.status ||
                                  item.paymentStatus
                              ).toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* DATE */}

                      <div
                        style={
                          styles.timeRow
                        }
                      >
                        <span
                          style={
                            styles.timeItem
                          }
                        >
                          <CalendarDays
                            size={12}
                          />

                          {formatDate(
                            timestamp
                          )}
                        </span>

                        <span
                          style={
                            styles.timeItem
                          }
                        >
                          <Clock3
                            size={12}
                          />

                          {formatTime(
                            timestamp
                          )}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      size={15}
                      color={muted}
                      style={{
                        marginTop: 13,
                        flexShrink: 0,
                      }}
                    />
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* =================================================
            FOOTER INFO
        ================================================= */}

        <section
          style={
            styles.footerInfo
          }
        >
          <Database size={16} />

          <span>
            {language === "rw"
              ? "ANTIMATE ibika ibikorwa bya system kugirango ubashe gukurikirana imikorere yayo."
              : "ANTIMATE keeps system activity records so you can monitor system operation."}
          </span>
        </section>
      </main>

      <BottomNav />

      {/* =================================================
          ANIMATION
      ================================================= */}

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
        `}
      </style>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    paddingBottom: "105px",
    fontFamily:
      "Inter, Arial, sans-serif",
    overflowX: "hidden",
  },

  content: {
    width: "100%",
    maxWidth: "680px",
    margin: "0 auto",
    padding: "18px",
    boxSizing: "border-box",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "14px",
    marginBottom: "24px",
    gap: "15px",
  },

  overline: {
    margin: 0,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.5px",
  },

  title: {
    margin: "4px 0 0",
    fontSize: "27px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  headerIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "15px",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    flexShrink: 0,
  },

  // ===================================================
  // ERROR
  // ===================================================

  errorBox: {
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background:
      "rgba(239,68,68,0.1)",
    border:
      "1px solid rgba(239,68,68,0.2)",
    color: "#ef4444",
    fontSize: "12px",
  },

  // ===================================================
  // SEARCH
  // ===================================================

  searchCard: {
    padding: "10px",
    borderRadius: "18px",
    backdropFilter:
      "blur(14px)",
    marginBottom: "16px",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "2px 4px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "12px",
    padding: "8px 0",
  },

  clearButton: {
    width: "25px",
    height: "25px",
    border: "none",
    borderRadius: "50%",
    background:
      "rgba(148,163,184,.15)",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1,
  },

  // ===================================================
  // FILTER
  // ===================================================

  filterSection: {
    marginBottom: "22px",
  },

  filterHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: "9px",
  },

  filterTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: 700,
  },

  resultCount: {
    fontSize: "10px",
  },

  filterList: {
    display: "flex",
    gap: "7px",
    overflowX: "auto",
    paddingBottom: "4px",
    scrollbarWidth: "none",
  },

  filterButton: {
    flexShrink: 0,
    border:
      "1px solid rgba(148,163,184,.18)",
    borderRadius: "11px",
    padding: "8px 11px",
    background: "transparent",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
  },

  filterActive: {
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    border:
      "1px solid transparent",
  },

  // ===================================================
  // HISTORY HEADER
  // ===================================================

  historyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "10px",
    marginBottom: "11px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 750,
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    fontSize: "10px",
  },

  refreshButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingCard: {
    minHeight: "170px",
    borderRadius: "21px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "10px",
    backdropFilter:
      "blur(12px)",
  },

  // ===================================================
  // EMPTY
  // ===================================================

  empty: {
    padding: "35px 18px",
    borderRadius: "21px",
    textAlign: "center",
    backdropFilter:
      "blur(12px)",
  },

  emptyIcon: {
    width: "55px",
    height: "55px",
    margin:
      "0 auto 10px",
    borderRadius: "17px",
    display: "grid",
    placeItems: "center",
    background:
      "rgba(37,99,235,.1)",
    color: "#6366f1",
  },

  emptyTitle: {
    margin:
      "0 0 6px",
    fontSize: "14px",
  },

  emptyText: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.5,
  },

  // ===================================================
  // HISTORY LIST
  // ===================================================

  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  historyCard: {
    padding: "13px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    backdropFilter:
      "blur(12px)",
    transition:
      "transform .15s ease",
  },

  historyIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },

  historyContent: {
    flex: 1,
    minWidth: 0,
  },

  historyTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "8px",
  },

  titleGroup: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "5px",
  },

  historyTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
  },

  categoryBadge: {
    padding:
      "3px 7px",
    borderRadius: "6px",
    fontSize: "8px",
    fontWeight: 800,
  },

  historyDescription: {
    margin:
      "7px 0 8px",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  // ===================================================
  // TELEMETRY
  // ===================================================

  telemetryRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "8px",
  },

  telemetryRowItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // ===================================================
  // PAYMENT
  // ===================================================

  paymentRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "8px",
    fontSize: "9px",
    fontWeight: 700,
  },

  // ===================================================
  // META
  // ===================================================

  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "7px",
  },

  // ===================================================
  // TIME
  // ===================================================

  timeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  timeItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "9px",
    color: "#94a3b8",
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footerInfo: {
    marginTop: "22px",
    padding:
      "13px 14px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "10px",
    lineHeight: 1.5,
    color: "#94a3b8",
    background:
      "rgba(148,163,184,.07)",
    border:
      "1px solid rgba(148,163,184,.1)",
  },
};