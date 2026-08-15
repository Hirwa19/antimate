import { useEffect, useState } from "react";
import {
  History as HistoryIcon,
  RefreshCw,
  Server,
  Cpu,
  Radio,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  Trash2,
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

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [deleting, setDeleting] =
    useState(null);

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

  // =====================================================
  // FETCH HISTORY
  // =====================================================

  async function fetchHistory() {
    try {
      setLoading(true);
      setError("");

      const res =
        await API.get("/history");

      const data =
        Array.isArray(
          res.data?.data
        )
          ? res.data.data
          : Array.isArray(
              res.data
            )
          ? res.data
          : [];

      setHistory(data);
    } catch (err) {
      console.error(
        "History error:",
        err
      );

      setHistory([]);

      setError(
        err.response?.data?.message ||
          (
            language === "rw"
              ? "History ntishoboye kuboneka."
              : "Failed to load history."
          )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  // =====================================================
  // DELETE
  // =====================================================

  async function deleteHistory(id) {
    try {
      setDeleting(id);

      await API.delete(
        `/history/${id}`
      );

      setHistory((prev) =>
        prev.filter(
          (item) =>
            item._id !== id
        )
      );
    } catch (err) {
      console.error(
        "Delete history error:",
        err
      );

      setError(
        err.response?.data?.message ||
          (
            language === "rw"
              ? "History ntiyasibwe."
              : "Failed to delete history."
          )
      );
    } finally {
      setDeleting(null);
    }
  }

  // =====================================================
  // ICON
  // =====================================================

  function getTypeIcon(type) {
    switch (type) {
      case "SYSTEM":
        return (
          <Server size={19} />
        );

      case "DEVICE":
        return (
          <Cpu size={19} />
        );

      case "GATEWAY":
        return (
          <Radio size={19} />
        );

      case "CONFIGURATION":
        return (
          <Settings size={19} />
        );

      case "COMMAND":
        return (
          <Activity size={19} />
        );

      case "SECURITY":
        return (
          <ShieldCheck
            size={19}
          />
        );

      case "ALERT":
        return (
          <AlertTriangle
            size={19}
          />
        );

      default:
        return (
          <Info size={19} />
        );
    }
  }

  // =====================================================
  // STATUS ICON
  // =====================================================

  function getStatusIcon(status) {
    switch (status) {
      case "SUCCESS":
        return (
          <CheckCircle2
            size={14}
          />
        );

      case "FAILED":
        return (
          <AlertTriangle
            size={14}
          />
        );

      case "WARNING":
        return (
          <AlertTriangle
            size={14}
          />
        );

      default:
        return (
          <Info size={14} />
        );
    }
  }

  // =====================================================
  // STATUS COLOR
  // =====================================================

  function getStatusColor(status) {
    switch (status) {
      case "SUCCESS":
        return "#22c55e";

      case "FAILED":
        return "#ef4444";

      case "WARNING":
        return "#f59e0b";

      default:
        return "#3b82f6";
    }
  }

  // =====================================================
  // DATE
  // =====================================================

  function formatDate(date) {
    if (!date) {
      return "--";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "--";
    }

    return parsed.toLocaleString(
      language === "rw"
        ? "rw-RW"
        : "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

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
          language === "rw"
            ? "Amateka"
            : "History"
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

            <h1
              style={{
                ...styles.title,
                color: textColor,
              }}
            >
              {language === "rw"
                ? "Amateka ya System"
                : "System History"}
            </h1>

            <p
              style={{
                ...styles.subtitle,
                color: muted,
              }}
            >
              {language === "rw"
                ? "Reba ibikorwa n'impinduka zabaye kuri ANTIMATE."
                : "View activities and events from your ANTIMATE systems."}
            </p>
          </div>

          <div style={styles.headerIcon}>
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
            style={styles.errorBox}
          >
            {error}
          </div>
        )}

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div
          style={{
            ...styles.toolbar,
            background:
              cardBackground,
            border:
              `1px solid ${border}`,
          }}
        >
          <div>
            <h2
              style={{
                ...styles.toolbarTitle,
                color: textColor,
              }}
            >
              {language === "rw"
                ? "Ibikorwa"
                : "Activity"}
            </h2>

            <p
              style={{
                ...styles.toolbarText,
                color: muted,
              }}
            >
              {history.length}{" "}
              {language === "rw"
                ? "byanditswe"
                : "events"}
            </p>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            style={{
              ...styles.refreshButton,
              opacity:
                loading ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={15}
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
        history.length === 0 ? (
          <div
            style={{
              ...styles.empty,
              background:
                cardBackground,
              border:
                `1px solid ${border}`,
            }}
          >
            <RefreshCw
              size={28}
              style={{
                animation:
                  "spin 1s linear infinite",
                color: "#6366f1",
              }}
            />

            <p
              style={{
                color: muted,
              }}
            >
              {language === "rw"
                ? "Turimo gushaka history..."
                : "Loading history..."}
            </p>
          </div>
        ) : history.length === 0 ? (
          /* =================================================
             EMPTY
          ================================================= */

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
              style={styles.emptyIcon}
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
                ? "Nta history iraboneka"
                : "No history yet"}
            </h3>

            <p
              style={{
                ...styles.emptyText,
                color: muted,
              }}
            >
              {language === "rw"
                ? "Ibikorwa bya ANTIMATE bizagaragara hano."
                : "ANTIMATE activities will appear here."}
            </p>
          </div>
        ) : (
          /* =================================================
             HISTORY LIST
          ================================================= */

          <div style={styles.timeline}>
            {history.map(
              (item, index) => {
                const statusColor =
                  getStatusColor(
                    item.status
                  );

                return (
                  <div
                    key={
                      item._id ||
                      index
                    }
                    style={styles.timelineItem}
                  >
                    {/* LINE */}

                    {index !==
                      history.length -
                        1 && (
                      <div
                        style={{
                          ...styles.timelineLine,
                          background:
                            border,
                        }}
                      />
                    )}

                    {/* ICON */}

                    <div
                      style={{
                        ...styles.eventIcon,
                        background:
                          cardBackground,
                        border:
                          `1px solid ${border}`,
                        color:
                          statusColor,
                      }}
                    >
                      {getTypeIcon(
                        item.type
                      )}
                    </div>

                    {/* CARD */}

                    <div
                      style={{
                        ...styles.eventCard,
                        background:
                          cardBackground,
                        border:
                          `1px solid ${border}`,
                      }}
                    >
                      <div
                        style={
                          styles.eventTop
                        }
                      >
                        <div
                          style={
                            styles.eventMain
                          }
                        >
                          <h3
                            style={{
                              ...styles.eventTitle,
                              color:
                                textColor,
                            }}
                          >
                            {item.title}
                          </h3>

                          <p
                            style={{
                              ...styles.eventDate,
                              color:
                                muted,
                            }}
                          >
                            {formatDate(
                              item.createdAt
                            )}
                          </p>
                        </div>

                        <div
                          style={{
                            ...styles.statusBadge,
                            color:
                              statusColor,
                            background:
                              `${statusColor}15`,
                          }}
                        >
                          {getStatusIcon(
                            item.status
                          )}

                          {item.status}
                        </div>
                      </div>

                      {item.description && (
                        <p
                          style={{
                            ...styles.description,
                            color: muted,
                          }}
                        >
                          {
                            item.description
                          }
                        </p>
                      )}

                      {/* DEVICE */}

                      {(item.deviceId ||
                        item.gatewayId ||
                        item.systemId) && (
                        <div
                          style={
                            styles.meta
                          }
                        >
                          {item.deviceId && (
                            <span
                              style={{
                                ...styles.metaItem,
                                color:
                                  muted,
                              }}
                            >
                              <Cpu
                                size={12}
                              />

                              {
                                item.deviceId
                              }
                            </span>
                          )}

                          {item.gatewayId && (
                            <span
                              style={{
                                ...styles.metaItem,
                                color:
                                  muted,
                              }}
                            >
                              <Radio
                                size={12}
                              />

                              {
                                item.gatewayId
                              }
                            </span>
                          )}

                          {item.systemId?.name && (
                            <span
                              style={{
                                ...styles.metaItem,
                                color:
                                  muted,
                              }}
                            >
                              <Server
                                size={12}
                              />

                              {
                                item
                                  .systemId
                                  .name
                              }
                            </span>
                          )}
                        </div>
                      )}

                      {/* ACTION */}

                      <div
                        style={
                          styles.eventBottom
                        }
                      >
                        <span
                          style={{
                            ...styles.typeLabel,
                            color: muted,
                          }}
                        >
                          {item.type}
                        </span>

                        <button
                          onClick={() =>
                            deleteHistory(
                              item._id
                            )
                          }
                          disabled={
                            deleting ===
                            item._id
                          }
                          style={
                            styles.deleteButton
                          }
                        >
                          <Trash2
                            size={13}
                          />

                          {language ===
                          "rw"
                            ? "Siba"
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <section
          style={styles.appInfo}
        >
          <div
            style={styles.appLogo}
          >
            A
          </div>

          <div>
            <strong>
              ANTIMATE
            </strong>

            <p
              style={{
                color: muted,
              }}
            >
              Smart agriculture
              technology
            </p>
          </div>
        </section>
      </main>

      <BottomNav />

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

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginTop: "14px",
    marginBottom: "25px",
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

  errorBox: {
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "14px",
    background:
      "rgba(239,68,68,0.1)",
    border:
      "1px solid rgba(239,68,68,0.2)",
    color: "#ef4444",
    fontSize: "12px",
  },

  toolbar: {
    padding: "13px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: "18px",
    backdropFilter:
      "blur(14px)",
  },

  toolbarTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 750,
  },

  toolbarText: {
    margin: "3px 0 0",
    fontSize: "10px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background:
      "rgba(37,99,235,.1)",
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  timeline: {
    display: "flex",
    flexDirection: "column",
  },

  timelineItem: {
    position: "relative",
    display: "flex",
    gap: "11px",
    paddingBottom: "14px",
  },

  timelineLine: {
    position: "absolute",
    left: "19px",
    top: "40px",
    bottom: 0,
    width: "1px",
  },

  eventIcon: {
    position: "relative",
    zIndex: 2,
    width: "40px",
    height: "40px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    backdropFilter:
      "blur(12px)",
  },

  eventCard: {
    flex: 1,
    minWidth: 0,
    padding: "13px",
    borderRadius: "17px",
    backdropFilter:
      "blur(14px)",
  },

  eventTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "10px",
  },

  eventMain: {
    flex: 1,
    minWidth: 0,
  },

  eventTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 750,
    lineHeight: 1.3,
  },

  eventDate: {
    margin: "4px 0 0",
    fontSize: "9px",
  },

  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px 7px",
    borderRadius: "8px",
    fontSize: "8px",
    fontWeight: 800,
    flexShrink: 0,
  },

  description: {
    margin: "9px 0 0",
    fontSize: "10px",
    lineHeight: 1.5,
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
  },

  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding:
      "4px 7px",
    borderRadius: "7px",
    background:
      "rgba(148,163,184,.08)",
    fontSize: "8px",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow:
      "ellipsis",
    whiteSpace:
      "nowrap",
  },

  eventBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginTop: "10px",
    paddingTop: "8px",
    borderTop:
      "1px solid rgba(148,163,184,.1)",
  },

  typeLabel: {
    fontSize: "8px",
    fontWeight: 700,
    letterSpacing: ".5px",
  },

  deleteButton: {
    border: "none",
    background:
      "transparent",
    color: "#ef4444",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

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

  appInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "35px",
    marginBottom: "15px",
    opacity: 0.75,
  },

  appLogo: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "15px",
  },
};