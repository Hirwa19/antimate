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
  // PUSH NOTIFICATIONS
  // =====================================================

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://brooder-backend.onrender.com";

  // =====================================================
  // GET AUTH TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );
  };

  // =====================================================
  // CHECK BROWSER PUSH PERMISSION
  // =====================================================

  useEffect(() => {
    const checkPushPermission = async () => {
      try {
        if (!("Notification" in window)) {
          setPushEnabled(false);
          return;
        }

        // Browser permission is the main source of truth
        if (Notification.permission !== "granted") {
          setPushEnabled(false);
          return;
        }

        // If browser permission is granted,
        // check whether a push subscription exists.
        if (!("serviceWorker" in navigator)) {
          setPushEnabled(false);
          return;
        }

        const registration =
          await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        setPushEnabled(!!subscription);
      } catch (error) {
        console.error(
          "❌ Failed to check push permission:",
          error
        );

        setPushEnabled(false);
      }
    };

    checkPushPermission();
  }, []);

  // =====================================================
  // ENABLE PUSH NOTIFICATIONS
  // =====================================================

  const enablePushNotifications = async () => {
    if (pushLoading) return;

    try {
      setPushLoading(true);

      // -------------------------------------------------
      // Browser support
      // -------------------------------------------------

      if (!("Notification" in window)) {
        alert(
          language === "rw"
            ? "Browser yawe ntabwo ishyigikira push notifications."
            : "Your browser does not support push notifications."
        );

        return;
      }

      if (!("serviceWorker" in navigator)) {
        alert(
          language === "rw"
            ? "Browser yawe ntabwo ishyigikira Service Worker."
            : "Your browser does not support Service Workers."
        );

        return;
      }

      // -------------------------------------------------
      // REQUEST BROWSER PERMISSION
      // -------------------------------------------------

      let permission = Notification.permission;

      if (permission !== "granted") {
        permission =
          await Notification.requestPermission();
      }

      // -------------------------------------------------
      // USER DID NOT ALLOW
      // -------------------------------------------------

      if (permission !== "granted") {
        setPushEnabled(false);

        if (permission === "denied") {
          alert(
            language === "rw"
              ? "Wanze browser permission. Jya muri browser settings wemere notifications za ANTIMATE."
              : "Notification permission was denied. Open your browser settings and allow notifications for ANTIMATE."
          );
        }

        return;
      }

      // -------------------------------------------------
      // WAIT FOR SERVICE WORKER
      // -------------------------------------------------

      const registration =
        await navigator.serviceWorker.ready;

      // -------------------------------------------------
      // CHECK EXISTING SUBSCRIPTION
      // -------------------------------------------------

      let subscription =
        await registration.pushManager.getSubscription();

      // -------------------------------------------------
      // CREATE NEW PUSH SUBSCRIPTION
      // -------------------------------------------------

      if (!subscription) {
        const vapidPublicKey =
          import.meta.env.VITE_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey) {
          throw new Error(
            "VITE_VAPID_PUBLIC_KEY is missing."
          );
        }

        const convertedKey =
          urlBase64ToUint8Array(vapidPublicKey);

        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });
      }

      // -------------------------------------------------
      // SEND SUBSCRIPTION TO BACKEND
      // -------------------------------------------------

      const token = getToken();

      if (!token) {
        throw new Error(
          language === "rw"
            ? "Ntabwo winjiye muri account."
            : "You are not logged in."
        );
      }

      const response = await fetch(
        `${API_URL}/api/push/subscribe`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(
            subscription.toJSON()
          ),
        }
      );

      const data = await response.json();

      // -------------------------------------------------
      // SUBSCRIPTION / PLAN CHECK
      // -------------------------------------------------

      if (!response.ok) {
        /*
         * IMPORTANT:
         * Backend still has:
         *
         * requirePlan(["Basic", "Pro", "Premium"])
         *
         * Therefore Free users will be rejected here.
         *
         * We unsubscribe the browser subscription so that
         * the UI does not incorrectly show ON.
         */

        await subscription.unsubscribe();

        setPushEnabled(false);

        throw new Error(
          data?.message ||
            (language === "rw"
              ? "Push notifications zisaba subscription ibifitiye uburenganzira."
              : "Push notifications require an eligible subscription.")
        );
      }

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      setPushEnabled(true);

      // Store local state only for UI convenience
      localStorage.setItem(
        "pushNotificationsEnabled",
        "true"
      );

      alert(
        language === "rw"
          ? "Push notifications zafunguwe neza."
          : "Push notifications enabled successfully."
      );
    } catch (error) {
      console.error(
        "❌ Enable push notification error:",
        error
      );

      setPushEnabled(false);

      /*
       * Avoid showing duplicate browser alerts when
       * we already displayed a specific permission message.
       */

      if (
        !error.message?.includes(
          "permission"
        )
      ) {
        alert(
          language === "rw"
            ? `Ntibyashobotse gufungura notifications: ${error.message}`
            : `Failed to enable notifications: ${error.message}`
        );
      }
    } finally {
      setPushLoading(false);
    }
  };

  // =====================================================
  // DISABLE PUSH NOTIFICATIONS
  // =====================================================

  const disablePushNotifications = async () => {
    if (pushLoading) return;

    try {
      setPushLoading(true);

      // -------------------------------------------------
      // UNSUBSCRIBE FROM BROWSER
      // -------------------------------------------------

      if ("serviceWorker" in navigator) {
        const registration =
          await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // -------------------------------------------------
      // UPDATE UI
      // -------------------------------------------------

      setPushEnabled(false);

      localStorage.setItem(
        "pushNotificationsEnabled",
        "false"
      );

      /*
       * NOTE:
       * Browser unsubscribe does not delete the MongoDB
       * subscription yet.
       *
       * The backend subscription will remain until we add
       * a DELETE /unsubscribe endpoint.
       */

    } catch (error) {
      console.error(
        "❌ Disable push notification error:",
        error
      );
    } finally {
      setPushLoading(false);
    }
  };

  // =====================================================
  // URL BASE64 -> UINT8ARRAY
  // =====================================================

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

    const base64 =
      (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);

    return Uint8Array.from(
      [...rawData].map((char) =>
        char.charCodeAt(0)
      )
    );
  };

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
            description={text.modeDesc}
          >
            <div style={styles.themeButtons}>
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
              PUSH NOTIFICATIONS
          ================================================= */}

          <SettingRow
            icon={
              pushEnabled ? (
                <BellRing size={19} />
              ) : (
                <Bell size={19} />
              )
            }
            title={
              language === "rw"
                ? "Push Notifications"
                : "Push Notifications"
            }
            description={
              pushEnabled
                ? language === "rw"
                  ? "Ubu wemerewe kwakira notifications za ANTIMATE."
                  : "ANTIMATE notifications are enabled."
                : language === "rw"
                  ? "Emera ANTIMATE kukwoherereza notifications."
                  : "Allow ANTIMATE to send you push notifications."
            }
          >
            <button
              type="button"
              disabled={pushLoading}
              onClick={
                pushEnabled
                  ? disablePushNotifications
                  : enablePushNotifications
              }
              style={{
                ...styles.notificationToggle,
                ...(pushEnabled
                  ? styles.notificationToggleActive
                  : {}),
                opacity: pushLoading ? 0.6 : 1,
              }}
              aria-label={
                pushEnabled
                  ? "Disable push notifications"
                  : "Allow push notifications"
              }
            >
              <span
                style={{
                  ...styles.notificationToggleKnob,
                  transform: pushEnabled
                    ? "translateX(20px)"
                    : "translateX(0)",
                }}
              />
            </button>
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
              icon={<ShieldCheck size={19} />}
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
            <div
              style={styles.deviceManagementIcon}
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
  // PUSH NOTIFICATION TOGGLE
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
    cursor: "pointer",
    flexShrink: 0,
    transition:
      "background .2s ease, opacity .2s ease",
  },

  notificationToggleActive: {
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
  },

  notificationToggleKnob: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow:
      "0 2px 6px rgba(0,0,0,.2)",
    transition:
      "transform .2s ease",
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