import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Settings,
  LogOut,
  LayoutDashboard,
  Radio,
  CreditCard,
  Plus,
  ChevronRight,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";

import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function Profile() {
  const navigate = useNavigate();
  const { isDark, text: t } = useAppSettings();

  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  async function fetchProfile() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(
        `${API_URL}/api/profile/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to load profile"
        );
      }

      setProfile(data);
    } catch (err) {
      console.error(
        "❌ Profile error:",
        err
      );
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  }

  // =====================================================
  // PROFILE DATA
  // =====================================================

  const user = profile?.user;

  const devices = Array.isArray(
    profile?.devices
  )
    ? profile.devices
    : [];

  // =====================================================
  // PAYMENT / SUBSCRIPTION
  // =====================================================

  const payment = profile?.payment;
  const fallbackPlan = profile?.plan;

  const currentPlan =
    payment?.planName ||
    fallbackPlan?.planName ||
    "Free";

  const paymentStatus =
    payment?.status ||
    fallbackPlan?.status ||
    "none";

  const expiryDate =
    payment?.expiryDate ||
    fallbackPlan?.expiryDate ||
    null;

  const isExpired =
    expiryDate &&
    new Date(expiryDate) <= new Date();

  const displayPlan = isExpired
    ? "Expired"
    : currentPlan;

  const hasDevice =
    devices.length > 0;

  // =====================================================
  // THEME
  // =====================================================

  const background = isDark
    ? "#07111f"
    : "#ffffff";

  const textColor = isDark
    ? "#f8fafc"
    : "#0f172a";

  const muted = isDark
    ? "#94a3b8"
    : "#64748b";

  const line = isDark
    ? "rgba(148,163,184,0.16)"
    : "rgba(15,23,42,0.10)";

  const softBackground = isDark
    ? "rgba(255,255,255,0.035)"
    : "#f8fafc";

  // =====================================================
  // USER AVATAR
  // =====================================================

  const initials =
    user?.fullName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";

  // =====================================================
  // PAYMENT COLOR
  // =====================================================

  const paymentColor = isExpired
    ? "#ef4444"
    : paymentStatus === "paid" ||
      paymentStatus === "completed" ||
      paymentStatus === "active"
    ? "#22c55e"
    : muted;

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
      {/* =================================================
          TOP BAR
      ================================================= */}

      <header
        style={{
          ...styles.topBar,
          borderBottom: `1px solid ${line}`,
        }}
      >
        <button
          type="button"
          onClick={() =>
            setMenuOpen(
              (previous) => !previous
            )
          }
          aria-label="Menu"
          style={{
            ...styles.iconButton,
            color: textColor,
          }}
        >
          {menuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

        <h1 style={styles.topTitle}>
          {t?.profile || "Profile"}
        </h1>

        <button
          type="button"
          onClick={() =>
            navigate("/settings")
          }
          aria-label="Settings"
          style={{
            ...styles.iconButton,
            color: textColor,
          }}
        >
          <Settings size={20} />
        </button>
      </header>

      {/* =================================================
          MENU
      ================================================= */}

      {menuOpen && (
        <div
          style={{
            ...styles.menu,
            background: isDark
              ? "#101b2d"
              : "#ffffff",
            borderColor: line,
          }}
        >
          <MenuItem
            icon={<LayoutDashboard size={18} />}
            label={
              t?.dashboard ||
              "Dashboard"
            }
            color={textColor}
            onClick={() =>
              navigate("/dashboard")
            }
          />

          <MenuItem
            icon={<Radio size={18} />}
            label={
              t?.system ||
              t?.brSystem ||
              "BR System"
            }
            color={textColor}
            onClick={() =>
              navigate("/systems")
            }
          />

          <MenuItem
            icon={<Wifi size={18} />}
            label={
              t?.deviceManagement ||
              "Device Management"
            }
            color={textColor}
            onClick={() =>
              navigate(
                "/device-management"
              )
            }
          />

          <MenuItem
            icon={<CreditCard size={18} />}
            label={
              t?.plans || "Plans"
            }
            color={textColor}
            onClick={() =>
              navigate("/plans")
            }
          />

          <MenuItem
            icon={<Settings size={18} />}
            label={
              t?.settings || "Settings"
            }
            color={textColor}
            onClick={() =>
              navigate("/settings")
            }
          />

          <div
            style={{
              height: "1px",
              background: line,
              margin: "5px 0",
            }}
          />

          <MenuItem
            icon={<LogOut size={18} />}
            label={
              t?.logout || "Logout"
            }
            color="#ef4444"
            onClick={logout}
          />
        </div>
      )}

      {/* =================================================
          PROFILE HEADER
      ================================================= */}

      <main style={styles.content}>
        <section style={styles.profileHeader}>
          {/* AVATAR */}

          <div style={styles.avatarOuter}>
            <div style={styles.avatarInner}>
              {initials}
            </div>
          </div>

          {/* NAME */}

          <h2 style={styles.name}>
            {user?.fullName ||
              "User"}
          </h2>

          <p
            style={{
              ...styles.username,
              color: muted,
            }}
          >
            @{user?.username ||
              "username"}
          </p>

          {/* =================================================
              STATS - SOCIAL MEDIA STYLE
          ================================================= */}

          <div
            style={{
              ...styles.stats,
              borderTop: `1px solid ${line}`,
              borderBottom: `1px solid ${line}`,
            }}
          >
            <Stat
              value={devices.length}
              label={
                t?.devices ||
                "Devices"
              }
              color={textColor}
            />

            <Stat
              value={displayPlan}
              label={
                t?.plan || "Plan"
              }
              color={textColor}
            />

            <Stat
              value={
                hasDevice
                  ? "Active"
                  : "None"
              }
              label={
                t?.status ||
                "Status"
              }
              color={textColor}
            />
          </div>
        </section>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <section
          style={{
            ...styles.actions,
            borderBottom: `1px solid ${line}`,
          }}
        >
          <ActionButton
            icon={<Radio size={17} />}
            label={
              t?.system ||
              t?.brSystem ||
              "BR System"
            }
            onClick={() =>
              navigate("/systems")
            }
            background={
              "linear-gradient(135deg,#06b6d4,#2563eb)"
            }
          />

          <ActionButton
            icon={
              <CreditCard size={17} />
            }
            label={
              t?.viewPlans ||
              "View Plans"
            }
            onClick={() =>
              navigate("/plans")
            }
            background={
              "linear-gradient(135deg,#2563eb,#7c3aed)"
            }
          />
        </section>

        {/* =================================================
            SUBSCRIPTION STATUS
        ================================================= */}

        {currentPlan !== "Free" && (
          <section
            style={{
              ...styles.subscriptionLine,
              borderBottom: `1px solid ${line}`,
            }}
          >
            <div
              style={
                styles.subscriptionLeft
              }
            >
              <div
                style={{
                  ...styles.subscriptionDot,
                  background:
                    paymentColor,
                }}
              />

              <div>
                <strong
                  style={{
                    fontSize: "13px",
                  }}
                >
                  {displayPlan}
                </strong>

                <p
                  style={{
                    margin:
                      "3px 0 0",
                    color: muted,
                    fontSize: "11px",
                  }}
                >
                  {isExpired
                    ? "Subscription expired"
                    : paymentStatus.toUpperCase()}
                </p>
              </div>
            </div>

            {expiryDate &&
              !isExpired && (
                <span
                  style={{
                    color: muted,
                    fontSize: "11px",
                  }}
                >
                  {new Date(
                    expiryDate
                  ).toLocaleDateString()}
                </span>
              )}
          </section>
        )}

        {/* =================================================
            DEVICES
        ================================================= */}

        <section style={styles.deviceSection}>
          <div
            style={
              styles.sectionHeader
            }
          >
            <div>
              <h3
                style={{
                  ...styles.sectionTitle,
                  color: textColor,
                }}
              >
                {t?.devices ||
                  "Devices"}
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
              type="button"
              onClick={() =>
                navigate(
                  "/device-management"
                )
              }
              style={{
                ...styles.addButton,
                color: "#2563eb",
              }}
            >
              <Plus size={16} />

              {t?.add || "Add"}
            </button>
          </div>

          {/* =================================================
              DEVICE LIST
          ================================================= */}

          {hasDevice ? (
            <div>
              {devices.map(
                (device, index) => {
                  const deviceId =
                    device._id ||
                    device.deviceId ||
                    index;

                  const active =
                    String(
                      device.activationStatus ||
                        ""
                    ).toUpperCase() ===
                    "ACTIVE";

                  return (
                    <div
                      key={deviceId}
                      style={{
                        ...styles.deviceRow,
                        borderBottom:
                          `1px solid ${line}`,
                      }}
                    >
                      <div
                        style={
                          styles.deviceLeft
                        }
                      >
                        <div
                          style={
                            styles.deviceAvatar
                          }
                        >
                          <Radio
                            size={18}
                          />
                        </div>

                        <div
                          style={
                            styles.deviceText
                          }
                        >
                          <strong
                            style={{
                              color:
                                textColor,
                              fontSize:
                                "13px",
                            }}
                          >
                            {device.deviceId ||
                              "ANTIMATE Device"}
                          </strong>

                          <div
                            style={
                              styles.deviceMeta
                            }
                          >
                            <span
                              style={{
                                ...styles.statusDot,
                                background:
                                  active
                                    ? "#22c55e"
                                    : "#94a3b8",
                              }}
                            />

                            <span
                              style={{
                                color:
                                  muted,
                              }}
                            >
                              {device.activationStatus ||
                                "UNKNOWN"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/device-management"
                          )
                        }
                        aria-label="Manage device"
                        style={{
                          ...styles.chevronButton,
                          color:
                            muted,
                        }}
                      >
                        <ChevronRight
                          size={19}
                        />
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div
              style={{
                ...styles.emptyState,
                borderTop:
                  `1px solid ${line}`,
                borderBottom:
                  `1px solid ${line}`,
              }}
            >
              <div
                style={{
                  ...styles.emptyIcon,
                  color: muted,
                }}
              >
                <WifiOff size={28} />
              </div>

              <strong
                style={{
                  fontSize: "14px",
                }}
              >
                {t?.noDeviceLinked ||
                  "No device linked"}
              </strong>

              <p
                style={{
                  margin:
                    "6px 0 16px",
                  color: muted,
                  fontSize: "12px",
                  lineHeight: 1.5,
                  maxWidth: "360px",
                }}
              >
                {t?.connectAntimateDevice ||
                  "Connect your ANTIMATE device to start monitoring your brooder."}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/device-management"
                  )
                }
                style={
                  styles.connectButton
                }
              >
                <Plus size={17} />

                {t?.deviceManagement ||
                  "Device Management"}
              </button>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

// =====================================================
// MENU ITEM
// =====================================================

function MenuItem({
  icon,
  label,
  color,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.menuItem,
        color,
      }}
    >
      <span
        style={styles.menuItemIcon}
      >
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}

// =====================================================
// STAT
// =====================================================

function Stat({
  value,
  label,
  color,
}) {
  return (
    <div style={styles.stat}>
      <strong
        style={{
          ...styles.statValue,
          color,
        }}
      >
        {value}
      </strong>

      <span style={styles.statLabel}>
        {label}
      </span>
    </div>
  );
}

// =====================================================
// ACTION BUTTON
// =====================================================

function ActionButton({
  icon,
  label,
  onClick,
  background,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.actionButton,
        background,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
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
    position: "relative",
    overflowX: "hidden",
  },

  topBar: {
    height: "62px",
    padding:
      "0 18px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter:
      "blur(18px)",
  },

  topTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 750,
  },

  iconButton: {
    width: "38px",
    height: "38px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    background:
      "transparent",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },

  menu: {
    position: "absolute",
    top: "58px",
    right: "16px",
    width: "230px",
    padding: "7px",
    border: "1px solid",
    borderRadius: "16px",
    zIndex: 100,
    boxShadow:
      "0 18px 45px rgba(0,0,0,0.18)",
  },

  menuItem: {
    width: "100%",
    minHeight: "44px",
    padding:
      "8px 10px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "none",
    background:
      "transparent",
    borderRadius: "11px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
  },

  menuItemIcon: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
  },

  content: {
    width: "100%",
    maxWidth: "620px",
    margin: "0 auto",
    padding:
      "18px 18px 0",
  },

  profileHeader: {
    textAlign: "center",
  },

  avatarOuter: {
    width: "92px",
    height: "92px",
    margin:
      "8px auto 13px",
    padding: "3px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed,#ec4899)",
    boxShadow:
      "0 10px 28px rgba(37,99,235,0.22)",
  },

  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background:
      "linear-gradient(145deg,#0f172a,#1e293b)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: "31px",
    fontWeight: 800,
  },

  name: {
    margin: 0,
    fontSize: "21px",
    fontWeight: 750,
    letterSpacing:
      "-0.02em",
  },

  username: {
    margin:
      "4px 0 0",
    fontSize: "12px",
  },

  stats: {
    marginTop: "19px",
    minHeight: "68px",
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr 1fr",
    alignItems: "center",
  },

  stat: {
    display: "flex",
    flexDirection:
      "column",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "3px",
    minWidth: 0,
  },

  statValue: {
    fontSize: "14px",
    fontWeight: 750,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow:
      "ellipsis",
    whiteSpace: "nowrap",
  },

  statLabel: {
    color: "#64748b",
    fontSize: "10px",
  },

  actions: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "9px",
    padding:
      "15px 0",
  },

  actionButton: {
    minHeight: "42px",
    border: "none",
    borderRadius: "13px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "7px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 7px 18px rgba(37,99,235,0.16)",
  },

  subscriptionLine: {
    minHeight: "62px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "15px",
  },

  subscriptionLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  subscriptionDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },

  deviceSection: {
    marginTop: "22px",
  },

  sectionHeader: {
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 750,
  },

  sectionSubtitle: {
    margin:
      "3px 0 0",
    fontSize: "11px",
  },

  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding:
      "8px 10px",
    border: "none",
    background:
      "transparent",
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
  },

  deviceRow: {
    minHeight: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "12px",
  },

  deviceLeft: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  deviceAvatar: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    color: "#2563eb",
    background:
      "rgba(37,99,235,0.10)",
  },

  deviceText: {
    minWidth: 0,
  },

  deviceMeta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
    fontSize: "10px",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  chevronButton: {
    width: "35px",
    height: "35px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    background:
      "transparent",
    border: "none",
    cursor: "pointer",
  },

  emptyState: {
    marginTop: "8px",
    padding:
      "30px 15px",
    display: "flex",
    flexDirection:
      "column",
    alignItems: "center",
    textAlign: "center",
  },

  emptyIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    marginBottom: "11px",
    background:
      "rgba(148,163,184,0.10)",
  },

  connectButton: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "7px",
    minHeight: "40px",
    padding:
      "0 15px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
};