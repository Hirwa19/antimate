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
  ChevronRight,
} from "lucide-react";

import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";

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
      {/* ICON */}

      <div style={styles.settingIcon}>
        {icon}
      </div>

      {/* CONTENT */}

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

      {/* RIGHT SIDE */}

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
      {/* =================================================
          HEADER
      ================================================= */}

      <AppHeader title={text.settings} />

      <main style={styles.content}>
        {/* =================================================
            PAGE HEADER
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
            PREFERENCES
        ================================================= */}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2
                style={{
                  ...styles.sectionTitle,
                  color: textColor,
                }}
              >
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

          {/* =================================================
              LANGUAGE
          ================================================= */}

          <SettingRow
            icon={<Globe2 size={19} />}
            title={text.language}
            description={text.languageDesc}
          >
            <div style={styles.languageButtons}>
              <button
                type="button"
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
                type="button"
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

          {/* =================================================
              THEME
          ================================================= */}

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
                type="button"
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
                type="button"
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
              <h2
                style={{
                  ...styles.sectionTitle,
                  color: textColor,
                }}
              >
                {text.account}
              </h2>
            </div>
          </div>

          <div style={styles.list}>
            {/* =================================================
                PROFILE
            ================================================= */}

            <SettingRow
              icon={<User size={19} />}
              title={text.editProfile}
              description={text.editProfileDesc}
              onClick={() => navigate("/profile")}
            >
              <ChevronRight
                size={18}
                color={muted}
              />
            </SettingRow>

            {/* =================================================
                CHANGE PASSWORD
            ================================================= */}

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

            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

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

            {/* =================================================
                PLANS
            ================================================= */}

            <SettingRow
              icon={<CreditCard size={19} />}
              title={text.plans}
              description={text.plansDesc}
              onClick={() => navigate("/plans")}
            >
              <ChevronRight
                size={18}
                color={muted}
              />
            </SettingRow>

            {/* =================================================
                HELP
            ================================================= */}

            <SettingRow
              icon={<HelpCircle size={19} />}
              title={text.help}
              description={text.helpDesc}
              onClick={() => navigate("/help")}
            >
              <ChevronRight
                size={18}
                color={muted}
              />
            </SettingRow>
          </div>
        </section>

        {/* =================================================
            DEVICE MANAGEMENT
        ================================================= */}

        <section style={styles.section}>
          <div
            style={{
              ...styles.deviceManagementCard,
              background: cardBackground,
              border: `1px solid ${border}`,
            }}
          >
            <div style={styles.deviceManagementIcon}>
              <SettingsIcon size={19} />
            </div>

            <div style={styles.deviceManagementContent}>
              <h3
                style={{
                  ...styles.deviceManagementTitle,
                  color: textColor,
                }}
              >
                {language === "rw"
                  ? "Device Management"
                  : "Device Management"}
              </h3>

              <p
                style={{
                  ...styles.deviceManagementText,
                  color: muted,
                }}
              >
                {language === "rw"
                  ? "Genzura BR Systems, Devices na Gateways byawe."
                  : "Manage your BR Systems, Devices and Gateways."}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/devices")
              }
              style={styles.deviceManagementButton}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </section>

        {/* =================================================
            APP INFORMATION
        ================================================= */}

        <section style={styles.appInfo}>
          <div style={styles.appLogo}>
            A
          </div>

          <div>
            <strong
              style={{
                color: textColor,
              }}
            >
              ANTIMATE
            </strong>

            <p
              style={{
                ...styles.appDescription,
                color: muted,
              }}
            >
              Smart agriculture technology
            </p>
          </div>
        </section>
      </main>

      {/* =================================================
          BOTTOM NAV
      ================================================= */}

      <BottomNav />
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  // =====================================================
  // PAGE
  // =====================================================

  page: {
    minHeight: "100vh",
    paddingBottom: "105px",
    fontFamily:
      "Inter, Arial, sans-serif",
    overflowX: "hidden",
  },

  // =====================================================
  // CONTENT
  // =====================================================

  content: {
    width: "100%",
    maxWidth: "620px",
    margin: "0 auto",
    padding: "18px",
    boxSizing: "border-box",
  },

  // =====================================================
  // HEADER
  // =====================================================

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

  // =====================================================
  // SECTION
  // =====================================================

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

  // =====================================================
  // SETTING ROW
  // =====================================================

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

  // =====================================================
  // LANGUAGE
  // =====================================================

  languageButtons: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  optionButton: {
    border:
      "1px solid rgba(148,163,184,.18)",
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

  // =====================================================
  // THEME
  // =====================================================

  themeButtons: {
    display: "flex",
    gap: "5px",
  },

  themeButton: {
    border:
      "1px solid rgba(148,163,184,.18)",
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

  // =====================================================
  // LIST
  // =====================================================

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },

  // =====================================================
  // DEVICE MANAGEMENT CARD
  // =====================================================

  deviceManagementCard: {
    padding: "14px",
    borderRadius: "19px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    boxSizing: "border-box",
    backdropFilter: "blur(14px)",
  },

  deviceManagementIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    background:
      "linear-gradient(135deg,rgba(37,99,235,.14),rgba(124,58,237,.14))",
    color: "#6366f1",
  },

  deviceManagementContent: {
    flex: 1,
    minWidth: 0,
  },

  deviceManagementTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
  },

  deviceManagementText: {
    margin: "4px 0 0",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  deviceManagementButton: {
    width: "34px",
    height: "34px",
    border: "none",
    borderRadius: "10px",
    display: "grid",
    placeItems: "center",
    background:
      "rgba(37,99,235,.1)",
    color: "#2563eb",
    cursor: "pointer",
    flexShrink: 0,
  },

  // =====================================================
  // APP INFORMATION
  // =====================================================

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

  appDescription: {
    margin: "3px 0 0",
    fontSize: "10px",
  },
};