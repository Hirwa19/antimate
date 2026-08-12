import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import PageLoader from "../components/PageLoader";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function Profile() {
  const navigate = useNavigate();
  const { isDark, text: t } = useAppSettings();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  async function fetchProfile() {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load profile");
      }

      setProfile(data);
    } catch (err) {
      console.error("Profile error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) {
    return <PageLoader />;
  }

  const user = profile?.user;
  const devices = profile?.devices || [];
  const plan = profile?.plan;
  const hasDevice = devices.length > 0;

  const background = isDark
    ? "linear-gradient(135deg,#07111f,#0f2537)"
    : "linear-gradient(135deg,#f8fafc,#e2e8f0)";

  const text = isDark ? "#ffffff" : "#0f172a";
  const muted = isDark ? "#94a3b8" : "#64748b";

  const cardBackground = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.78)";

  const border = isDark
    ? "1px solid rgba(255,255,255,0.10)"
    : "1px solid rgba(15,23,42,0.08)";

  return (
    <div
      style={{
        ...styles.page,
        background,
        color: text,
      }}
    >
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.title}>
            {t?.profile || "Profile"}
          </h2>

          <p
            style={{
              ...styles.subtitle,
              color: muted,
            }}
          >
            {t?.accountOverview || "Account overview"}
          </p>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            ...styles.menuBtn,
            background: cardBackground,
            color: text,
            border,
          }}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div
          style={{
            ...styles.menu,
            background: isDark ? "#111c2c" : "#ffffff",
            border,
            boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
          }}
        >
          <MenuButton
            label={t?.dashboard || "Dashboard"}
            icon="⌂"
            onClick={() => navigate("/dashboard")}
            color={text}
          />

          <MenuButton
            label={t?.deviceManagement || "Device Management"}
            icon="📡"
            onClick={() => navigate("/device-management")}
            color={text}
          />

          <MenuButton
            label={t?.plans || "Plans"}
            icon="💳"
            onClick={() => navigate("/plans")}
            color={text}
          />

          <MenuButton
            label={t?.settings || "Settings"}
            icon="⚙"
            onClick={() => navigate("/settings")}
            color={text}
          />

          <div
            style={{
              height: "1px",
              background: isDark
                ? "rgba(255,255,255,0.10)"
                : "rgba(15,23,42,0.08)",
              margin: "4px 0",
            }}
          />

          <button
            onClick={logout}
            style={{
              ...styles.menuItem,
              color: "#ef4444",
            }}
          >
            <span style={styles.menuIcon}>↪</span>
            <span>{t?.logout || "Logout"}</span>
          </button>
        </div>
      )}

      <div
        style={{
          ...styles.card,
          background: cardBackground,
          border,
        }}
      >
        <div style={styles.avatar}>
          {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <h3 style={styles.name}>
          {user?.fullName || "User"}
        </h3>

        <p
          style={{
            ...styles.username,
            color: muted,
          }}
        >
          @{user?.username || "username"}
        </p>

        <div style={styles.stats}>
          <div style={styles.statItem}>
            <strong style={styles.statValue}>
              {devices.length}
            </strong>

            <span
              style={{
                ...styles.statLabel,
                color: muted,
              }}
            >
              {t?.devices || "Devices"}
            </span>
          </div>

          <div style={styles.statDivider} />

          <div style={styles.statItem}>
            <strong style={styles.statValue}>
              {plan?.planName || "Free"}
            </strong>

            <span
              style={{
                ...styles.statLabel,
                color: muted,
              }}
            >
              {t?.plan || "Plan"}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/plans")}
          style={styles.planButton}
        >
          💳 {t?.viewPlans || "View Plans"}
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={{ margin: 0 }}>
              {t?.devices || "Devices"}
            </h3>

            <p
              style={{
                ...styles.sectionSubtitle,
                color: muted,
              }}
            >
              {t?.connectedAntimateDevices ||
                "Connected ANTIMATE devices"}
            </p>
          </div>

          <button
            onClick={() => navigate("/device-management")}
            style={styles.addBtn}
          >
            + {t?.add || "Add"}
          </button>
        </div>

        {hasDevice ? (
          <div>
            {devices.map((device) => (
              <div
                key={device._id || device.deviceId}
                style={{
                  ...styles.deviceCard,
                  background: cardBackground,
                  border,
                }}
              >
                <div style={styles.deviceInfo}>
                  <div style={styles.deviceIcon}>📡</div>

                  <div>
                    <strong>
                      {device.deviceId}
                    </strong>

                    <p
                      style={{
                        ...styles.deviceStatus,
                        color: muted,
                      }}
                    >
                      {t?.status || "Status"}:{" "}
                      {device.activationStatus || "UNKNOWN"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/device-management")}
                  style={styles.smallBtn}
                >
                  {t?.manage || "Manage"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              ...styles.emptyDevice,
              background: cardBackground,
              border,
            }}
          >
            <div style={styles.emptyIcon}>📡</div>

            <strong>
              {t?.noDeviceLinked || "No device linked"}
            </strong>

            <p
              style={{
                color: muted,
                margin: "6px 0 14px",
              }}
            >
              {t?.connectAntimateDevice ||
                "Connect your ANTIMATE device to start monitoring your brooder."}
            </p>

            <button
              onClick={() => navigate("/device-management")}
              style={styles.primaryBtn}
            >
              {t?.deviceManagement || "Device Management"}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function MenuButton({ label, icon, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.menuItem,
        color,
      }}
    >
      <span style={styles.menuIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    paddingBottom: "110px",
    fontFamily: "Inter, Arial, sans-serif",
    position: "relative",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 750,
  },

  subtitle: {
    margin: "5px 0 0",
    fontSize: "12px",
  },

  menuBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    fontSize: "21px",
    cursor: "pointer",
  },

  menu: {
    position: "absolute",
    right: "20px",
    top: "72px",
    width: "210px",
    padding: "8px",
    borderRadius: "18px",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  menuItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "12px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
  },

  menuIcon: {
    width: "25px",
    textAlign: "center",
  },

  card: {
    marginTop: "22px",
    padding: "24px 20px",
    borderRadius: "26px",
    textAlign: "center",
    backdropFilter: "blur(14px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
  },

  avatar: {
    width: "76px",
    height: "76px",
    borderRadius: "24px",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px",
    fontWeight: 700,
    margin: "0 auto 12px",
    boxShadow: "0 12px 28px rgba(37,99,235,0.25)",
  },

  name: {
    margin: 0,
    fontSize: "20px",
  },

  username: {
    margin: "5px 0 0",
    fontSize: "13px",
  },

  stats: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "22px",
    gap: "35px",
  },

  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  statValue: {
    fontSize: "17px",
  },

  statLabel: {
    fontSize: "11px",
  },

  statDivider: {
    width: "1px",
    height: "34px",
    background: "rgba(148,163,184,0.25)",
  },

  planButton: {
    width: "100%",
    marginTop: "20px",
    padding: "12px",
    border: "none",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "13px",
  },

  section: {
    marginTop: "24px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    fontSize: "11px",
  },

  addBtn: {
    border: "none",
    borderRadius: "12px",
    padding: "9px 13px",
    background: "linear-gradient(135deg,#22c55e,#14b8a6)",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },

  deviceCard: {
    marginTop: "10px",
    padding: "14px",
    borderRadius: "19px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backdropFilter: "blur(12px)",
  },

  deviceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  deviceIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background: "rgba(37,99,235,0.12)",
    fontSize: "19px",
  },

  deviceStatus: {
    margin: "4px 0 0",
    fontSize: "11px",
  },

  smallBtn: {
    border: "none",
    borderRadius: "11px",
    padding: "8px 11px",
    background: "#22c55e",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "11px",
  },

  emptyDevice: {
    padding: "30px 20px",
    borderRadius: "22px",
    textAlign: "center",
    backdropFilter: "blur(12px)",
  },

  emptyIcon: {
    fontSize: "32px",
    marginBottom: "8px",
  },

  primaryBtn: {
    border: "none",
    borderRadius: "13px",
    padding: "11px 15px",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
};