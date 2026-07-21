import { Link, useLocation } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import NotificationBadge from "../components/NotificationBadge";

function BottomNav() {
  const location = useLocation();
  const { isDark, text } = useAppSettings();

  const navItems = [
    { name: text.home, path: "/home", icon: "🏠" },
    { name: text.dashboard, path: "/dashboard", icon: "🎞" },
    { name: text.notifications, path: "/notifications", icon: "🔔" },
    { name: text.history, path: "/history", icon: "💾" },
    { name: text.profile, path: "/profile", icon: "👤" },
  ];

  return (
    <div style={styles.wrapper}>
      <div
        style={{
          ...styles.nav,
          background: isDark
            ? "rgba(3, 7, 18, 0.55)"
            : "rgba(255, 255, 255, 0.35)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.12)"
            : "1px solid rgba(255,255,255,0.45)",
        }}
      >
        {navItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path} style={styles.link}>
              <div
                style={{
                  ...styles.iconBox,
                  background: active
                    ? "linear-gradient(135deg, #7c3aed, #2563eb)"
                    : "transparent",
                  color: active ? "#fff" : isDark ? "#e5e7eb" : "#111827",
                  boxShadow: active
                    ? "0 8px 22px rgba(124,58,237,0.55)"
                    : "none",
                }}
              >
                <span style={styles.icon}>{item.icon}</span>

                {item.path === "/notifications" && (
                  <span style={styles.badgePosition}>
                    <NotificationBadge />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: "18px",
    display: "flex",
    justifyContent: "center",
    zIndex: 1000,
    pointerEvents: "none",
  },

  nav: {
    width: "min(92%, 390px)",
    height: "62px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "0 12px",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow: "0 20px 45px rgba(0,0,0,0.28)",
    pointerEvents: "auto",
  },

  link: {
    textDecoration: "none",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  iconBox: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "all 0.25s ease",
  },

  icon: {
    fontSize: "19px",
    lineHeight: 1,
  },

  badgePosition: {
    position: "absolute",
    top: "-7px",
    right: "-7px",
  },
};

export default BottomNav;