import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Globe2,
  Moon,
  Sun,
  User,
  ShieldCheck,
  Bell,
  BellRing,
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
  // BROWSER NOTIFICATION PERMISSION
  // =====================================================

  const [notificationPermission, setNotificationPermission] =
    useState(() => {
      if (!("Notification" in window)) {
        return "unsupported";
      }

      return Notification.permission;
    });

  const [permissionLoading, setPermissionLoading] =
    useState(false);

  // =====================================================
  // CHECK BROWSER PERMISSION
  // =====================================================

  useEffect(() => {
    const checkPermission = () => {
      if (!("Notification" in window)) {
        setNotificationPermission("unsupported");
        return;
      }

      setNotificationPermission(
        Notification.permission
      );
    };

    checkPermission();

    // Check again whenever user comes back to this page
    window.addEventListener(
      "focus",
      checkPermission
    );

    document.addEventListener(
      "visibilitychange",
      checkPermission
    );

    return () => {
      window.removeEventListener(
        "focus",
        checkPermission
      );

      document.removeEventListener(
        "visibilitychange",
        checkPermission
      );
    };
  }, []);

  // =====================================================
  // REQUEST BROWSER NOTIFICATION PERMISSION
  // =====================================================

  const handleNotificationPermission = async () => {
    if (permissionLoading) return;

    // -----------------------------------------------------
    // Browser does not support notifications
    // -----------------------------------------------------

    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");

      return;
    }

    // -----------------------------------------------------
    // Already ON
    // -----------------------------------------------------

    if (
      Notification.permission ===
      "granted"
    ) {
      setNotificationPermission("granted");

      return;
    }

    // -----------------------------------------------------
    // Already blocked by browser
    // -----------------------------------------------------

    if (
      Notification.permission ===
      "denied"
    ) {
      setNotificationPermission("denied");

      alert(
        language === "rw"
          ? "Notifications zarafunzwe muri browser. Jya muri browser settings uzifungure."
          : "Notifications are blocked by your browser. Open browser settings and allow notifications."
      );

      return;
    }

    // -----------------------------------------------------
    // REQUEST PERMISSION
    // -----------------------------------------------------

    try {
      setPermissionLoading(true);

      const permission =
        await Notification.requestPermission();

      setNotificationPermission(
        permission
      );
    } catch (error) {
      console.error(
        "❌ Browser notification permission error:",
        error
      );
    } finally {
      setPermissionLoading(false);
    }
  };

  // =====================================================
  // NOTIFICATION STATE
  // =====================================================

  const notificationIsOn =
    notificationPermission ===
    "granted";

  const notificationIsOff =
    notificationPermission !==
    "granted";

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
        cursor: onClick
          ? "pointer"
          : "default",
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
      {/* Dynamic Keyframes Animation for Vibration Waves */}
      <style>{`
        @keyframes vibrateWaves {
          0% { transform: translate(0, 0) scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          15% { transform: translate(-2px, 1px) scale(1.01); }
          30% { transform: translate(2px, -1px) scale(1.01); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.15); }
          45% { transform: translate(-2px, -1px) scale(1.01); }
          60% { transform: translate(2px, 1px) scale(1.01); box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
          75% { transform: translate(-1px, 1px) scale(1); }
          100% { transform: translate(0, 0) scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @keyframes bellRingWave {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(4deg); }
        }

        .vibrate-alert {
          animation: vibrateWaves 2s infinite ease-in-out;
          border-color: rgba(239, 68, 68, 0.4) !important;
        }

        .vibrate-icon {
          animation: bellRingWave 1.8s infinite ease-in-out;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #ef4444 !important;
        }
      `}</style>

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
            description={
              text.languageDesc
            }
          >
            <div
              style={styles.languageButtons}
            >
              <button
                type="button"
                onClick={() =>
                  setLanguage("rw")
                }
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
                onClick={() =>
                  setLanguage("en")
                }
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
            description={
              text.modeDesc
            }
          >
            <div
              style={styles.themeButtons}
            >
              <button
                type="button"
                onClick={() =>
                  setTheme("dark")
                }
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
                onClick={() =>
                  setTheme("light")
                }
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

          {/* =================================================
              BROWSER PUSH NOTIFICATIONS
          ================================================= */}

          <div
            className={notificationIsOff ? "vibrate-alert" : ""}
            style={{
              ...styles.pushCard,
              background:
                cardBackground,
              border: `1px solid ${border}`,
            }}
          >
            {/* TOP ROW */}

            <div
              style={styles.pushTopRow}
            >
              {/* ICON */}

              <div
                className={notificationIsOff ? "vibrate-icon" : ""}
                style={{
                  ...styles.pushIcon,
                  ...(notificationIsOn
                    ? styles.pushIconOn
                    : {}),
                }}
              >
                {notificationIsOn ? (
                  <BellRing size={19} />
                ) : (
                  <Bell size={19} />
                )}
              </div>

              {/* TEXT */}

              <div
                style={
                  styles.pushContent
                }
              >
                <h3
                  style={{
                    ...styles.settingTitle,
                    color: textColor,
                  }}
                >
                  {language === "rw"
                    ? "Push Notifications"
                    : "Push Notifications"}
                </h3>

                <p
                  style={{
                    ...styles.settingDescription,
                    color: notificationIsOff ? "#ef4444" : muted,
                    fontWeight: notificationIsOff ? 600 : 400,
                  }}
                >
                  {notificationIsOn
                    ? language === "rw"
                      ? "Notifications zirafunguye."
                      : "Notifications are allowed."
                    : language === "rw"
                      ? "Fungura notifications kugira ngo ubone Amamenyesha Kuri Telephone."
                      : "Allow notifications to receive real-time alerts."}
                </p>
              </div>

              {/* TOGGLE */}

              <button
                type="button"
                onClick={
                  handleNotificationPermission
                }
                disabled={
                  permissionLoading ||
                  notificationPermission ===
                    "unsupported"
                }
                style={{
                  ...styles.notificationToggle,
                  ...(notificationIsOn
                    ? styles.notificationToggleActive
                    : {}),
                  opacity:
                    permissionLoading
                      ? 0.65
                      : 1,
                  cursor:
                    permissionLoading ||
                    notificationPermission ===
                      "unsupported"
                      ? "not-allowed"
                      : "pointer",
                }}
                aria-label={
                  notificationIsOn
                    ? "Notifications ON"
                    : "Turn ON notifications"
                }
              >
                <span
                  style={{
                    ...styles.notificationToggleKnob,
                    transform:
                      notificationIsOn
                        ? "translateX(20px)"
                        : "translateX(0)",
                  }}
                />
              </button>
            </div>

            {/* =================================================
                TURN ON MESSAGE
            ================================================= */}

            {notificationIsOff &&
              notificationPermission !==
                "unsupported" && (
                <button
                  type="button"
                  onClick={
                    handleNotificationPermission
                  }
                  style={
                    styles.turnOnMessage
                  }
                >
                  {permissionLoading
                    ? language === "rw"
                      ? "Tegereza..."
                      : "Please wait..."
                    : language === "rw"
                      ? "⚠️ Kanda hano ufungure Notifications (Turn ON)"
                      : "⚠️ Click here to Turn ON Notifications"}
                </button>
              )}

            {/* =================================================
                UNSUPPORTED MESSAGE
            ================================================= */}

            {notificationPermission ===
              "unsupported" && (
              <div
                style={
                  styles.unsupportedMessage
                }
              >
                {language === "rw"
                  ? "Browser yawe ntabwo ishyigikira notifications."
                  : "Your browser does not support notifications."}
              </div>
            )}

            {/* =================================================
                BLOCKED MESSAGE
            ================================================= */}

            {notificationPermission ===
              "denied" && (
              <div
                style={
                  styles.blockedMessage
                }
              >
                {language === "rw"
                  ? "Notifications zafunzwe na browser. Zifungure muri browser settings."
                  : "Notifications are blocked. Allow them in your browser settings."}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            ACCOUNT
        ================================================= */}

        <section style={styles.section}>
          <div
            style={styles.sectionHeader}
          >
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
              description={
                text.editProfileDesc
              }
              onClick={() =>
                navigate("/profile")
              }
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
              icon={
                <ShieldCheck size={19} />
              }
              title={
                text.changePassword
              }
              description={
                text.changePasswordDesc
              }
              onClick={() =>
                navigate(
                  "/change-password"
                )
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
              title={
                text.notifications
              }
              description={
                text.notificationDesc
              }
              onClick={() =>
                navigate(
                  "/notifications"
                )
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
              icon={
                <CreditCard size={19} />
              }
              title={text.plans}
              description={
                text.plansDesc
              }
              onClick={() =>
                navigate("/plans")
              }
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
              icon={
                <HelpCircle size={19} />
              }
              title={text.help}
              description={
                text.helpDesc
              }
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
            DEVICE MANAGEMENT
        ================================================= */}

        <section style={styles.section}>
          <div
            style={{
              ...styles.deviceManagementCard,
              background:
                cardBackground,
              border: `1px solid ${border}`,
            }}
          >
            <div
              style={
                styles.deviceManagementIcon
              }
            >
              <SettingsIcon size={19} />
            </div>

            <div
              style={
                styles.deviceManagementContent
              }
            >
              <h3
                style={{
                  ...styles.deviceManagementTitle,
                  color: textColor,
                }}
              >
                Device Management
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
                navigate(
                  "/device-management"
                )
              }
              style={
                styles.deviceManagementButton
              }
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
  // PUSH CARD
  // =====================================================

  pushCard: {
    marginBottom: "9px",
    padding: "13px",
    borderRadius: "19px",
    boxSizing: "border-box",
    backdropFilter: "blur(14px)",
    transition: "all 0.3s ease",
  },

  pushTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  pushIcon: {
    width: "39px",
    height: "39px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    background:
      "rgba(148,163,184,.13)",
    color: "#64748b",
    transition:
      "all .25s ease",
  },

  pushIconOn: {
    background:
      "linear-gradient(135deg,rgba(34,197,94,.16),rgba(22,163,74,.12))",
    color: "#16a34a",
  },

  pushContent: {
    flex: 1,
    minWidth: 0,
  },

  // =====================================================
  // NOTIFICATION TOGGLE
  // =====================================================

  notificationToggle: {
    width: "44px",
    height: "24px",
    padding: "2px",
    border: "none",
    borderRadius: "999px",
    background: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    transition:
      "all .25s ease",
  },

  notificationToggleActive: {
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
  },

  notificationToggleKnob: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow:
      "0 2px 6px rgba(0,0,0,.2)",
    transition:
      "transform .25s ease",
  },

  // =====================================================
  // TURN ON MESSAGE
  // =====================================================

  turnOnMessage: {
    width: "100%",
    marginTop: "9px",
    padding: "7px 9px",
    border: "none",
    background: "rgba(239, 68, 68, 0.1)",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "11px",
    fontWeight: 700,
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  // =====================================================
  // BLOCKED MESSAGE
  // =====================================================

  blockedMessage: {
    marginTop: "9px",
    padding:
      "8px 10px",
    borderRadius: "10px",
    background:
      "rgba(239,68,68,.08)",
    color: "#dc2626",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  // =====================================================
  // UNSUPPORTED MESSAGE
  // =====================================================

  unsupportedMessage: {
    marginTop: "9px",
    padding:
      "8px 10px",
    borderRadius: "10px",
    background:
      "rgba(148,163,184,.08)",
    color: "#64748b",
    fontSize: "10px",
    lineHeight: 1.4,
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
  // DEVICE MANAGEMENT
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