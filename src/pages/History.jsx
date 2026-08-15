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
  ChevronDown,
  Clock3,
  CheckCircle2,
  XCircle,
  Activity,
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
    ? "rgba(255,255,255,0.1)"
    : "rgba(15,23,42,0.08)";

  const inputBackground = isDark
    ? "rgba(15,23,42,0.8)"
    : "#ffffff";

  // =====================================================
  // FETCH HISTORY
  // =====================================================

  async function fetchHistory() {
    try {
      setLoading(true);
      setError("");

      /*
       * Expected backend response:
       *
       * {
       *   success: true,
       *   data: [...]
       * }
       *
       * or directly:
       *
       * [...]
       */

      const res = await API.get("/history");

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.history)
        ? res.data.history
        : [];

      setHistory(data);
    } catch (err) {
      console.error(
        "History loading error:",
        err
      );

      setHistory([]);

      setError(
        err.response?.data?.message ||
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
  // NORMALIZE HISTORY TYPE
  // =====================================================

  function getHistoryType(item) {
    const raw =
      item.type ||
      item.eventType ||
      item.action ||
      item.event ||
      item.category ||
      "";

    const value = String(raw)
      .toLowerCase()
      .trim();

    if (
      value.includes("temperature") ||
      value.includes("temp")
    ) {
      return "temperature";
    }

    if (
      value.includes("humidity") ||
      value.includes("humid")
    ) {
      return "humidity";
    }

    if (
      value.includes("heater") ||
      value.includes("heat")
    ) {
      return "heater";
    }

    if (
      value.includes("fan") ||
      value.includes("ventilation")
    ) {
      return "fan";
    }

    if (
      value.includes("online") ||
      value.includes("connected") ||
      value.includes("connect")
    ) {
      return "online";
    }

    if (
      value.includes("offline") ||
      value.includes("disconnect")
    ) {
      return "offline";
    }

    if (
      value.includes("config") ||
      value.includes("setting")
    ) {
      return "configuration";
    }

    if (
      value.includes("system")
    ) {
      return "system";
    }

    return "activity";
  }

  // =====================================================
  // FILTER HISTORY
  // =====================================================

  const filteredHistory = useMemo(() => {
    let result = [...history];

    if (filter !== "all") {
      result = result.filter(
        (item) =>
          getHistoryType(item) ===
          filter
      );
    }

    if (search.trim()) {
      const query =
        search
          .toLowerCase()
          .trim();

      result = result.filter(
        (item) => {
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
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
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

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
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

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
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
  // GET TITLE
  // =====================================================

  function getTitle(item) {
    if (item.title) {
      return item.title;
    }

    const type =
      getHistoryType(item);

    const titles = {
      temperature:
        language === "rw"
          ? "Temperature yahindutse"
          : "Temperature updated",

      humidity:
        language === "rw"
          ? "Humidity yahindutse"
          : "Humidity updated",

      heater:
        language === "rw"
          ? "Heater yahinduwe"
          : "Heater changed",

      fan:
        language === "rw"
          ? "Fan yahinduwe"
          : "Fan changed",

      online:
        language === "rw"
          ? "System iri online"
          : "System came online",

      offline:
        language === "rw"
          ? "System yagiye offline"
          : "System went offline",

      configuration:
        language === "rw"
          ? "Configuration yahinduwe"
          : "Configuration updated",

      system:
        language === "rw"
          ? "System event"
          : "System event",

      activity:
        language === "rw"
          ? "Igikorwa cya system"
          : "System activity",
    };

    return titles[type];
  }

  // =====================================================
  // GET DESCRIPTION
  // =====================================================

  function getDescription(item) {
    if (
      item.description
    ) {
      return item.description;
    }

    if (
      item.message
    ) {
      return item.message;
    }

    const type =
      getHistoryType(item);

    if (
      type === "temperature" &&
      item.value !== undefined
    ) {
      return `${item.value}°C`;
    }

    if (
      type === "humidity" &&
      item.value !== undefined
    ) {
      return `${item.value}%`;
    }

    if (
      type === "heater" &&
      item.status
    ) {
      return String(
        item.status
      ).toUpperCase();
    }

    if (
      type === "fan" &&
      item.status
    ) {
      return String(
        item.status
      ).toUpperCase();
    }

    return language === "rw"
      ? "Nta bisobanuro bihari."
      : "No additional information.";
  }

  // =====================================================
  // ICON
  // =====================================================

  function getIcon(type) {
    switch (type) {
      case "temperature":
        return (
          <Thermometer size={19} />
        );

      case "humidity":
        return (
          <Droplets size={19} />
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

      case "configuration":
        return (
          <Settings size={19} />
        );

      case "system":
        return (
          <Activity size={19} />
        );

      default:
        return (
          <HistoryIcon size={19} />
        );
    }
  }

  // =====================================================
  // ICON BACKGROUND
  // =====================================================

  function getIconStyle(type) {
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

      case "configuration":
        return {
          background:
            "rgba(124,58,237,.12)",
          color: "#7c3aed",
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
  // FILTER LABEL
  // =====================================================

  const filters = [
    {
      id: "all",
      label:
        language === "rw"
          ? "Byose"
          : "All",
    },
    {
      id: "configuration",
      label:
        language === "rw"
          ? "Configuration"
          : "Configuration",
    },
    {
      id: "temperature",
      label:
        language === "rw"
          ? "Temperature"
          : "Temperature",
    },
    {
      id: "humidity",
      label:
        language === "rw"
          ? "Humidity"
          : "Humidity",
    },
    {
      id: "heater",
      label:
        language === "rw"
          ? "Heater"
          : "Heater",
    },
    {
      id: "fan",
      label:
        language === "rw"
          ? "Fan"
          : "Fan",
    },
    {
      id: "online",
      label:
        language === "rw"
          ? "Online"
          : "Online",
    },
    {
      id: "offline",
      label:
        language === "rw"
          ? "Offline"
          : "Offline",
    },
  ];

  // =====================================================
  // UI
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
          text.history ||
          (language === "rw"
            ? "Amateka"
            : "History")
        }
      />

      <main style={styles.content}>
        {/* =================================================
            HEADER
        ================================================= */}

        <section style={styles.header}>
          <div>
            <p
              style={{
                ...styles.overline,
                color: muted,
              }}
            >
              ANTIMATE
            </p>

            <h1 style={styles.title}>
              {text.history ||
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
                ? "Reba ibikorwa byabaye kuri system yawe."
                : "View activities and events from your systems."}
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
          <div style={styles.errorBox}>
            <XCircle
              size={16}
            />

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
            border:
              `1px solid ${border}`,
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
                  ? "Shakisha amateka..."
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
            FILTERS
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
                  ? "Shungura"
                  : "Filter"}
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
                ? "ibikorwa"
                : "events"}
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
                  {item.label}
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
              {language === "rw"
                ? "Ibikorwa bya system"
                : "System activity"}
            </h2>

            <p
              style={{
                ...styles.sectionSubtitle,
                color: muted,
              }}
            >
              {language === "rw"
                ? "Ibikorwa biheruka kugaragara."
                : "Recent system events and activities."}
            </p>
          </div>

          <button
            onClick={fetchHistory}
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

            {language === "rw"
              ? "Refresh"
              : "Refresh"}
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
                <HistoryIcon
                  size={30}
                />
              </div>

              <h3
                style={{
                  ...styles.emptyTitle,
                  color: textColor,
                }}
              >
                {language === "rw"
                  ? search ||
                    filter !== "all"
                    ? "Nta byabonetse"
                    : "Nta mateka ahari"
                  : search ||
                    filter !== "all"
                  ? "No results found"
                  : "No history yet"}
              </h3>

              <p
                style={{
                  ...styles.emptyText,
                  color: muted,
                }}
              >
                {language === "rw"
                  ? search ||
                    filter !== "all"
                    ? "Gerageza guhindura search cyangwa filter."
                    : "Ibikorwa bya system bizagaragara hano."
                  : search ||
                    filter !== "all"
                  ? "Try changing your search or filter."
                  : "System activities will appear here."}
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
                const type =
                  getHistoryType(
                    item
                  );

                const iconStyle =
                  getIconStyle(
                    type
                  );

                const timestamp =
                  item.createdAt ||
                  item.timestamp ||
                  item.date ||
                  item.time ||
                  item.updatedAt;

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
                      {getIcon(
                        type
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

                        {item.success !==
                          undefined && (
                          item.success ? (
                            <CheckCircle2
                              size={
                                15
                              }
                              color="#22c55e"
                            />
                          ) : (
                            <XCircle
                              size={
                                15
                              }
                              color="#ef4444"
                            />
                          )
                        )}
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

                      {/* DEVICE */}

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
                              {item.systemName}
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
          <Activity
            size={16}
          />

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
    maxWidth: "620px",
    margin: "0 auto",
    padding: "18px",
    boxSizing: "border-box",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    display: "flex",
    justifyContent:
      "space-between",
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
    marginBottom: "14px",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding:
      "2px 4px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background:
      "transparent",
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
    gap: "6px",
    overflowX: "auto",
    paddingBottom: "3px",
    scrollbarWidth: "none",
  },

  filterButton: {
    flexShrink: 0,
    border:
      "1px solid rgba(148,163,184,.18)",
    borderRadius: "10px",
    padding: "7px 10px",
    background:
      "transparent",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
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
    background:
      "transparent",
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
    flexDirection:
      "column",
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
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "8px",
  },

  historyTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
  },

  historyDescription: {
    margin:
      "4px 0 7px",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    marginBottom: "7px",
  },

  timeRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },

  timeItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#64748b",
    fontSize: "9px",
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footerInfo: {
    marginTop: "24px",
    padding: "13px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    background:
      "rgba(37,99,235,.06)",
    color: "#64748b",
    fontSize: "10px",
    lineHeight: 1.5,
  },
};