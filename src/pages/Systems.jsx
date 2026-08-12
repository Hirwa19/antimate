import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";
import API from "../api/api";

export default function Systems() {
  const { isDark } = useAppSettings();
  const navigate = useNavigate();

  const [systems, setSystems] = useState([]);
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH SYSTEMS
  // =====================================================

  async function fetchSystems() {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/systems");

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setSystems(data);
    } catch (err) {
      console.error("Systems error:", err);

      setSystems([]);

      setError(
        err.response?.data?.message ||
          "Failed to load systems"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSystems();
  }, []);

  // =====================================================
  // ADD SYSTEM
  // =====================================================

  async function addSystem() {
    if (!name.trim() || !serialNumber.trim()) {
      alert(
        "Please enter the system name and serial number."
      );
      return;
    }

    try {
      setAdding(true);
      setError("");

      await API.post("/systems", {
        name: name.trim(),
        serialNumber: serialNumber.trim(),
      });

      setName("");
      setSerialNumber("");

      await fetchSystems();
    } catch (err) {
      console.error("Add system error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to add system"
      );
    } finally {
      setAdding(false);
    }
  }

  // =====================================================
  // COLORS
  // =====================================================

  const background = isDark
    ? "linear-gradient(135deg,#07111f,#0f2537)"
    : "linear-gradient(135deg,#f8fafc,#e2e8f0)";

  const text = isDark
    ? "#ffffff"
    : "#0f172a";

  const muted = isDark
    ? "#94a3b8"
    : "#64748b";

  const cardBackground = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.8)";

  const border = isDark
    ? "rgba(255,255,255,0.1)"
    : "rgba(15,23,42,0.08)";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        ...styles.page,
        background,
        color: text,
      }}
    >
      <AppHeader title="Systems" />

      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            My Systems
          </h1>

          <p
            style={{
              ...styles.subtitle,
              color: muted,
            }}
          >
            Manage your ANTIMATE systems
          </p>
        </div>

        <div style={styles.systemCount}>
          {systems.length}
        </div>
      </div>

      {/* ADD SYSTEM */}

      <div
        style={{
          ...styles.formCard,
          background: cardBackground,
          border: `1px solid ${border}`,
        }}
      >
        <h3 style={styles.formTitle}>
          Add System
        </h3>

        <p
          style={{
            ...styles.formSubtitle,
            color: muted,
          }}
        >
          Register a new system to your
          account.
        </p>

        <input
          type="text"
          placeholder="System Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          style={{
            ...styles.input,
            background: isDark
              ? "rgba(15,23,42,0.8)"
              : "#ffffff",
            color: text,
            border: `1px solid ${border}`,
          }}
        />

        <input
          type="text"
          placeholder="Serial Number"
          value={serialNumber}
          onChange={(e) =>
            setSerialNumber(
              e.target.value
            )
          }
          style={{
            ...styles.input,
            background: isDark
              ? "rgba(15,23,42,0.8)"
              : "#ffffff",
            color: text,
            border: `1px solid ${border}`,
          }}
        />

        <button
          onClick={addSystem}
          disabled={adding}
          style={{
            ...styles.addButton,
            opacity: adding ? 0.7 : 1,
          }}
        >
          {adding
            ? "Adding..."
            : "+ Add System"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* SYSTEMS */}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Systems
          </h2>

          <button
            onClick={fetchSystems}
            style={styles.refreshButton}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div
            style={{
              ...styles.empty,
              background: cardBackground,
              border: `1px solid ${border}`,
            }}
          >
            <div style={styles.loader}>
              Loading systems...
            </div>
          </div>
        ) : systems.length === 0 ? (
          <div
            style={{
              ...styles.empty,
              background: cardBackground,
              border: `1px solid ${border}`,
            }}
          >
            <div style={styles.emptyIcon}>
              🖥️
            </div>

            <h3>No systems yet</h3>

            <p
              style={{
                color: muted,
              }}
            >
              Add your first ANTIMATE
              system above.
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {systems.map((system) => {
              const online =
                String(
                  system.status || ""
                ).toLowerCase() ===
                "online";

              return (
                <div
                  key={
                    system._id ||
                    system.serialNumber
                  }
                  style={{
                    ...styles.systemCard,
                    background:
                      cardBackground,
                    border: `1px solid ${border}`,
                  }}
                >
                  <div
                    style={
                      styles.systemIcon
                    }
                  >
                    ⚙️
                  </div>

                  <div
                    style={
                      styles.systemInfo
                    }
                  >
                    <h3
                      style={
                        styles.systemName
                      }
                    >
                      {system.name ||
                        "Unnamed System"}
                    </h3>

                    <p
                      style={{
                        ...styles.serial,
                        color: muted,
                      }}
                    >
                      Serial:{" "}
                      {system.serialNumber ||
                        "--"}
                    </p>

                    <div
                      style={
                        styles.statusRow
                      }
                    >
                      <span
                        style={{
                          ...styles.statusDot,
                          background:
                            online
                              ? "#22c55e"
                              : "#ef4444",
                        }}
                      />

                      <span
                        style={{
                          color: online
                            ? "#22c55e"
                            : "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        {system.status ||
                          "Offline"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/systems/${system._id}`
                      )
                    }
                    style={
                      styles.manageButton
                    }
                  >
                    Manage
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    paddingBottom: "105px",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "18px",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 750,
  },

  subtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
  },

  systemCount: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 700,
  },

  formCard: {
    padding: "20px",
    borderRadius: "24px",
    backdropFilter:
      "blur(14px)",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.08)",
  },

  formTitle: {
    margin: 0,
    fontSize: "18px",
  },

  formSubtitle: {
    margin:
      "5px 0 18px",
    fontSize: "12px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    marginBottom: "12px",
    borderRadius: "14px",
    outline: "none",
    fontSize: "14px",
  },

  addButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  error: {
    marginTop: "15px",
    padding: "13px",
    borderRadius: "14px",
    background:
      "rgba(239,68,68,0.1)",
    border:
      "1px solid rgba(239,68,68,0.2)",
    color: "#ef4444",
    fontSize: "13px",
  },

  section: {
    marginTop: "25px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
  },

  refreshButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontWeight: 700,
    cursor: "pointer",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  systemCard: {
    padding: "16px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    backdropFilter:
      "blur(12px)",
    boxShadow:
      "0 8px 22px rgba(0,0,0,0.06)",
  },

  systemIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "15px",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg,rgba(37,99,235,0.15),rgba(124,58,237,0.15))",
    fontSize: "21px",
    flexShrink: 0,
  },

  systemInfo: {
    flex: 1,
    minWidth: 0,
  },

  systemName: {
    margin: 0,
    fontSize: "15px",
  },

  serial: {
    margin: "4px 0 7px",
    fontSize: "11px",
  },

  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
  },

  manageButton: {
    border: "none",
    borderRadius: "12px",
    padding: "9px 12px",
    background:
      "rgba(37,99,235,0.12)",
    color: "#2563eb",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },

  empty: {
    padding: "40px 20px",
    borderRadius: "24px",
    textAlign: "center",
    backdropFilter:
      "blur(12px)",
  },

  emptyIcon: {
    fontSize: "38px",
    marginBottom: "10px",
  },

  loader: {
    padding: "20px",
    color: "#64748b",
  },
};