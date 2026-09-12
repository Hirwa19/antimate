import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  FolderKanban,
  Code2,
  Network,
  Settings,
  ArrowLeft,
  Menu,
  X,
  Radio,
} from "lucide-react";

function LinkLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const navItems = [
    {
      label: "Projects",
      path: "/link/projects",
      icon: FolderKanban,
    },
    {
      label: "Developer",
      path: "/link/developer",
      icon: Code2,
    },
    {
      label: "Network",
      path: "/link/network",
      icon: Network,
    },
  ];

  return (
    <div style={styles.app}>
      {/* MOBILE TOP BAR */}
      <div style={styles.mobileTopbar}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          style={styles.menuButton}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div style={styles.mobileBrand}>
          <div style={styles.brandIcon}>
            <Radio size={18} />
          </div>

          <div>
            <div style={styles.mobileBrandName}>
              ANTIMATE LINK
            </div>

            <div style={styles.mobileBrandSub}>
              Developer Network
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          style={styles.overlay}
          onClick={closeMobile}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          ...(mobileOpen
            ? styles.sidebarMobileOpen
            : {}),
        }}
      >
        {/* BRAND */}
        <div style={styles.brandSection}>
          <div style={styles.brandLogo}>
            <Radio size={23} />
          </div>

          <div style={styles.brandText}>
            <div style={styles.brandName}>
              ANTIMATE
            </div>

            <div style={styles.brandProduct}>
              LINK
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobile}
            style={styles.closeButton}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* SYSTEM LABEL */}
        <div style={styles.systemLabel}>
          LINK PLATFORM
        </div>

        {/* NAVIGATION */}
        <nav style={styles.navigation}>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/link/projects"}
                onClick={closeMobile}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive
                    ? styles.navItemActive
                    : {}),
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      strokeWidth={
                        isActive ? 2.3 : 2
                      }
                    />

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* BOTTOM */}
        <div style={styles.sidebarBottom}>
          <button
            type="button"
            onClick={() => {
              closeMobile();
              navigate("/settings");
            }}
            style={styles.bottomItem}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeMobile();
              navigate("/systems");
            }}
            style={styles.bottomItem}
          >
            <ArrowLeft size={18} />
            <span>Switch System</span>
          </button>

          <div style={styles.version}>
            <span>ANTIMATE LINK</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f7f8fc",
    color: "#111827",
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "250px",
    background:
      "linear-gradient(180deg, #ffffff 0%, #fafaff 100%)",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    zIndex: 1000,
    boxSizing: "border-box",
  },

  brandSection: {
    height: "78px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "0 18px",
    borderBottom: "1px solid #edf0f5",
    boxSizing: "border-box",
  },

  brandLogo: {
    width: "40px",
    height: "40px",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow:
      "0 5px 14px rgba(79, 70, 229, 0.20)",
  },

  brandText: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1,
  },

  brandName: {
    fontSize: "15px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "#111827",
  },

  brandProduct: {
    marginTop: "5px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    color: "#6366f1",
  },

  closeButton: {
    display: "none",
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    padding: "5px",
  },

  systemLabel: {
    padding: "22px 19px 10px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#9ca3af",
  },

  navigation: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "0 11px",
  },

  navItem: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minHeight: "45px",
    padding: "0 13px",
    borderRadius: "9px",
    textDecoration: "none",
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: 600,
    transition:
      "background 0.18s ease, color 0.18s ease",
    boxSizing: "border-box",
  },

  navItemActive: {
    background:
      "linear-gradient(90deg, #eef4ff, #f3efff)",
    color: "#4f46e5",
    fontWeight: 700,
  },

  sidebarBottom: {
    marginTop: "auto",
    padding: "12px 11px 16px",
    borderTop: "1px solid #edf0f5",
  },

  bottomItem: {
    width: "100%",
    minHeight: "43px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 13px",
    border: "none",
    borderRadius: "9px",
    background: "transparent",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    marginBottom: "3px",
  },

  version: {
    marginTop: "14px",
    padding: "8px 13px 0",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "#a1a1aa",
  },

  main: {
    minHeight: "100vh",
    marginLeft: "250px",
    boxSizing: "border-box",
  },

  mobileTopbar: {
    display: "none",
  },

  menuButton: {
    border: "none",
    background: "transparent",
    color: "#374151",
    cursor: "pointer",
    padding: "7px",
  },

  mobileBrand: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  brandIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background:
      "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileBrandName: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#111827",
  },

  mobileBrandSub: {
    marginTop: "2px",
    fontSize: "9px",
    color: "#9ca3af",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    zIndex: 999,
  },

  sidebarMobileOpen: {
    transform: "translateX(0)",
  },
};

export default LinkLayout;