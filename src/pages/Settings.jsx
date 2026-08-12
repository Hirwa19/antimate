import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe2,
  Moon,
  Sun,
  User,
  ShieldCheck,
  Bell,
  HelpCircle,
  CreditCard,
  Settings as SettingsIcon,
  Monitor,
  Plus,
  RefreshCw,
  ChevronRight,
  Server,
} from "lucide-react";

import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";
import API from "../api/api";

export default function Settings() {
  const {
    isDark,
    language,
    setLanguage,
    theme,
    setTheme,
    text,
  } = useAppSettings();

  const navigate = useNavigate();

  const [systems, setSystems] = useState([]);
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          text.failedLoadSystems
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
      setError(
        language === "rw"
          ? "Andika izina rya system na serial number."
          : "Please enter the system name and serial number."
      );
      setSuccess("");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      await API.post("/systems", {
        name: name.trim(),
        serialNumber: serialNumber.trim(),
      });

      setName("");
      setSerialNumber("");

      setSuccess(text.systemAdded);

      await fetchSystems();
    } catch (err) {
      console.error("Add system error:", err);

      setError(
        err.response?.data?.message ||
          text.failedAddSystem
      );
    } finally {
      setAdding(false);
    }
  }

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

  const inputBackground = isDark
    ? "rgba(15,23,42,0.8)"
    : "#ffffff";

  const border = isDark
    ? "rgba(255,255,255,0.1)"
    : "rgba(15,23,42,0.08)";

  // =====================================================
  // SETTING ROW
  // =====================================================

  const SettingRow = ({
    icon,
    title,
    description,
    children,
    onClick,
  }) => (
    <div
      onClick={onClick}
      style={{
        ...styles.settingRow,
        background: cardBackground,
        border: `1px solid ${border}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={styles.settingIcon}>
        {icon}
      </div>

      <div style={styles.settingContent}>
        <h3
          style={{
            ...styles.settingTitle,
            color: textColor,
          }}
        >
          {title}
        </h3>

        {description && (
          <p
            style={{
              ...styles.settingDescription,
              color: muted,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {children}
    </div>
  );

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
      <AppHeader title={text.settings} />

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
              {text.settings}
            </h1>

            <p
              style={{
                ...styles.subtitle,
                color: muted,
              }}
            >
              {language === "rw"
                ? "Genzura uko ukoresha ANTIMATE."
                : "Manage your ANTIMATE experience."}
            </p>
          </div>

          <div style={styles.headerIcon}>
            <SettingsIcon size={21} />
          </div>
        </section>

        {/* =================================================
            FEEDBACK
        ================================================= */}

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            {success}
          </div>
        )}

        {/* =================================================
            PREFERENCES
        ================================================= */}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {text.preferences}
              </h2>

              <p
                style={{
                  ...styles.sectionSubtitle,
                  color: muted,
                }}
              >
                {language === "rw"
                  ? "Hitamo uko ANTIMATE igaragara."
                  : "Customize your ANTIMATE experience."}
              </p>
            </div>
          </div>

          {/* LANGUAGE */}

          <SettingRow
            icon={<Globe2 size={19} />}
            title={text.language}
            description={text.languageDesc}
          >
            <div style={styles.languageButtons}>
              <button
                onClick={() => setLanguage("rw")}
                style={{
                  ...styles.optionButton,
                  ...(language === "rw"
                    ? styles.optionActive
                    : {}),
                }}
              >
                🇷🇼 Kinyarwanda
              </button>

              <button
                onClick={() => setLanguage("en")}
                style={{
                  ...styles.optionButton,
                  ...(language === "en"
                    ? styles.optionActive
                    : {}),
                }}
              >
                🇬🇧 English
              </button>
            </div>
          </SettingRow>

          {/* THEME */}

          <SettingRow
            icon={
              theme === "dark" ? (
                <Moon size={19} />
              ) : (
                <Sun size={19} />
              )
            }
            title={text.mode}
            description={text.modeDesc}
          >
            <div style={styles.themeButtons}>
              <button
                onClick={() => setTheme("dark")}
                style={{
                  ...styles.themeButton,
                  ...(theme === "dark"
                    ? styles.optionActive
                    : {}),
                }}
              >
                <Moon size={14} />
                {text.dark}
              </button>

              <button
                onClick={() => setTheme("light")}
                style={{
                  ...styles.themeButton,
                  ...(theme === "light"
                    ? styles.optionActive
                    : {}),
                }}
              >
                <Sun size={14} />
                {text.light}
              </button>
            </div>
          </SettingRow>
        </section>

        {/* =================================================
            ACCOUNT
        ================================================= */}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {text.account}
              </h2>
            </div>
          </div>

          <div style={styles.list}>
            <SettingRow
              icon={<User size={19} />}
              title={text.editProfile}
              description={text.editProfileDesc}
              onClick={() =>
                navigate("/profile")
              }
            >
              <ChevronRight
                size={18}
                color={muted}
              />
            </SettingRow>

            <SettingRow
              icon={<ShieldCheck size={19} />}
              title={text.changePassword}
              description={text.changePasswordDesc}
              onClick={() =>
                navigate("/change-password")
              }
            >
              <ChevronRight
                size={18}
                color={muted}
              />
            </SettingRow>

            <SettingRow
              icon={<Bell size={19} />}
              title={text.notifications}
              description={text.notificationDesc}
              onClick={() =>
                navigate("/notifications")
              }
            >
              <ChevronRight
                size={18}
                color={muted}
              />
            </SettingRow>

            <SettingRow
              icon={<CreditCard size={19} />}
              title={text.plans}
              description={text.plansDesc}
              onClick={() =>
                navigate("/plans")
              }
            >
              <ChevronRight
                size={18}
                color={muted}
              />
            </SettingRow>

            <SettingRow
              icon={<HelpCircle size={19} />}
              title={text.help}
              description={text.helpDesc}
              onClick={() =>
                navigate("/help")
              }
            >
              <ChevronRight
                size={18}
                color={muted}
              />
            </SettingRow>
          </div>
        </section>

        {/* =================================================
            SYSTEMS
        ================================================= */}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {text.systems}
              </h2>

              <p
                style={{
                  ...styles.sectionSubtitle,
                  color: muted,
                }}
              >
                {text.manageSystems}
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
            <div style={styles.formHeader}>
              <div style={styles.formIcon}>
                <Plus size={18} />
              </div>

              <div>
                <h3
                  style={{
                    ...styles.formTitle,
                    color: textColor,
                  }}
                >
                  {text.addSystem}
                </h3>

                <p
                  style={{
                    ...styles.formSubtitle,
                    color: muted,
                  }}
                >
                  {text.addSystemDesc}
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder={text.systemName}
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              style={{
                ...styles.input,
                background: inputBackground,
                color: textColor,
                border: `1px solid ${border}`,
              }}
            />

            <input
              type="text"
              placeholder={text.serialNumber}
              value={serialNumber}
              onChange={(e) =>
                setSerialNumber(
                  e.target.value
                )
              }
              style={{
                ...styles.input,
                background: inputBackground,
                color: textColor,
                border: `1px solid ${border}`,
              }}
            />

            <button
              onClick={addSystem}
              disabled={adding}
              style={{
                ...styles.addButton,
                opacity: adding ? 0.65 : 1,
              }}
            >
              <Plus size={17} />

              {adding
                ? text.saving
                : text.addSystem}
            </button>
          </div>

          {/* SYSTEM LIST HEADER */}

          <div style={styles.systemListHeader}>
            <h3
              style={{
                ...styles.listTitle,
                color: textColor,
              }}
            >
              {text.mySystems}
            </h3>

            <button
              onClick={fetchSystems}
              disabled={loading}
              style={{
                ...styles.refreshButton,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw size={14} />

              {text.refresh}
            </button>
          </div>

          {/* SYSTEMS */}

          {systems.length === 0 ? (
            <div
              style={{
                ...styles.empty,
                background: cardBackground,
                border: `1px solid ${border}`,
              }}
            >
              <div style={styles.emptyIcon}>
                <Server size={30} />
              </div>

              <h3
                style={{
                  ...styles.emptyTitle,
                  color: textColor,
                }}
              >
                {text.noSystems}
              </h3>

              <p
                style={{
                  ...styles.emptyText,
                  color: muted,
                }}
              >
                {text.noSystemsText}
              </p>
            </div>
          ) : (
            <div style={styles.systemList}>
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
                      <Monitor size={20} />
                    </div>

                    <div
                      style={
                        styles.systemInfo
                      }
                    >
                      <h3
                        style={{
                          ...styles.systemName,
                          color: textColor,
                        }}
                      >
                        {system.name ||
                          "ANTIMATE System"}
                      </h3>

                      <p
                        style={{
                          ...styles.serial,
                          color: muted,
                        }}
                      >
                        {text.serialNumber}:{" "}
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
                            fontWeight: 650,
                          }}
                        >
                          {online
                            ? text.online
                            : text.offline}
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
                      {text.manage}

                      <ChevronRight
                        size={14}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            APP INFORMATION
        ================================================= */}

        <section style={styles.appInfo}>
          <div style={styles.appLogo}>
            A
          </div>

          <div>
            <strong>ANTIMATE</strong>

            <p
              style={{
                color: muted,
              }}
            >
              Smart agriculture technology
            </p>
          </div>
        </section>
      </main>

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
    justifyContent: "space-between",
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

  successBox: {
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "14px",
    background:
      "rgba(34,197,94,0.1)",
    border:
      "1px solid rgba(34,197,94,0.2)",
    color: "#16a34a",
    fontSize: "12px",
  },

  section: {
    marginBottom: "28px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 750,
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    fontSize: "11px",
  },

  settingRow: {
    minHeight: "66px",
    padding: "12px 13px",
    marginBottom: "9px",
    borderRadius: "19px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    boxSizing: "border-box",
    backdropFilter: "blur(14px)",
  },

  settingIcon: {
    width: "39px",
    height: "39px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    background:
      "linear-gradient(135deg,rgba(37,99,235,.14),rgba(124,58,237,.14))",
    color: "#6366f1",
  },

  settingContent: {
    flex: 1,
    minWidth: 0,
  },

  settingTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
  },

  settingDescription: {
    margin: "4px 0 0",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  languageButtons: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  optionButton: {
    border: "1px solid rgba(148,163,184,.18)",
    borderRadius: "10px",
    padding: "7px 9px",
    background: "transparent",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  optionActive: {
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    border:
      "1px solid transparent",
  },

  themeButtons: {
    display: "flex",
    gap: "5px",
  },

  themeButton: {
    border: "1px solid rgba(148,163,184,.18)",
    borderRadius: "10px",
    padding: "7px 9px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "transparent",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },

  systemCount: {
    minWidth: "38px",
    height: "38px",
    padding: "0 10px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 750,
  },

  formCard: {
    padding: "17px",
    borderRadius: "22px",
    backdropFilter: "blur(14px)",
    boxShadow:
      "0 12px 28px rgba(0,0,0,.06)",
  },

  formHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },

  formIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    background:
      "rgba(37,99,235,.12)",
    color: "#2563eb",
    flexShrink: 0,
  },

  formTitle: {
    margin: 0,
    fontSize: "15px",
  },

  formSubtitle: {
    margin: "3px 0 0",
    fontSize: "10px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    marginBottom: "10px",
    borderRadius: "13px",
    outline: "none",
    fontSize: "13px",
  },

  addButton: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
  },

  systemListHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "20px",
    marginBottom: "10px",
  },

  listTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
  },

  refreshButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  systemList: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  systemCard: {
    padding: "13px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backdropFilter: "blur(12px)",
  },

  systemIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg,rgba(37,99,235,.14),rgba(124,58,237,.14))",
    color: "#6366f1",
    flexShrink: 0,
  },

  systemInfo: {
    flex: 1,
    minWidth: 0,
  },

  systemName: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  serial: {
    margin: "4px 0 6px",
    fontSize: "10px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "10px",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  manageButton: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 9px",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    background:
      "rgba(37,99,235,.1)",
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },

  empty: {
    padding: "32px 18px",
    borderRadius: "21px",
    textAlign: "center",
    backdropFilter: "blur(12px)",
  },

  emptyIcon: {
    width: "55px",
    height: "55px",
    margin: "0 auto 10px",
    borderRadius: "17px",
    display: "grid",
    placeItems: "center",
    background:
      "rgba(37,99,235,.1)",
    color: "#6366f1",
  },

  emptyTitle: {
    margin: "0 0 6px",
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