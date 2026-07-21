import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";
import { enablePushNotifications } from "../utils/pushNotifications";

function Settings() {
  const navigate = useNavigate();
  const { language, setLanguage, theme, setTheme, isDark, text } =
    useAppSettings();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const pageStyle = {
    minHeight: "100vh",
    background: isDark ? "#0f172a" : "#f8fafc",
    color: isDark ? "white" : "#0f172a",
    padding: "20px",
    paddingBottom: "100px",
    fontFamily: "Arial",
  };

  const sectionStyle = {
    background: isDark ? "#1e293b" : "white",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "18px",
    boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.08)",
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    background: isDark ? "#0f172a" : "#f1f5f9",
    padding: "14px",
    borderRadius: "16px",
    marginTop: "12px",
  };

  const actionButton = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px",
    borderRadius: "16px",
    border: "none",
    background: isDark ? "#0f172a" : "#f1f5f9",
    color: isDark ? "white" : "#0f172a",
    marginTop: "12px",
    cursor: "pointer",
  };

  return (
    <div style={pageStyle}>
      <AppHeader title={text.settings} />

      <div style={sectionStyle}>
        <h2>{text.preferences}</h2>

        <div style={rowStyle}>
          <div>
            <h3>🌍 {text.language}</h3>
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Choose app language
            </p>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "12px",
              border: "none",
              background: isDark ? "#334155" : "#e2e8f0",
              color: isDark ? "white" : "#0f172a",
            }}
          >
            <option value="en">English</option>
            <option value="rw">Ikinyarwanda</option>
          </select>
        </div>

        <div style={rowStyle}>
          <div>
            <h3>🌓 {text.mode}</h3>
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Dark / Light mode
            </p>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: "none",
              background: "#00ff99",
              color: "#0f172a",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? text.light : text.dark}
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2>Account</h2>

        <button style={actionButton} onClick={() => navigate("/profile")}>
          <span style={{ fontSize: "26px" }}>👤</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <strong>{text.profile}</strong>
            <p style={{ margin: "5px 0 0", color: "#94a3b8" }}>
              Update your personal information
            </p>
          </div>
          <span>›</span>
        </button>
        
         <button style={actionButton} onClick={enablePushNotifications}>
  <span style={{ fontSize: "26px" }}>📲</span>

  <div style={{ textAlign: "left", flex: 1 }}>
    <strong>Enable Push Notifications</strong>
    <p style={{ margin: "5px 0 0", color: "#94a3b8" }}>
      Receive brooder alerts even when dashboard is closed
    </p>
  </div>

  <span>›</span>
</button>

        <button style={actionButton} onClick={() => navigate("/notifications")}>
          <span style={{ fontSize: "26px" }}>🔔</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <strong>{text.notifications}</strong>
            <p style={{ margin: "5px 0 0", color: "#94a3b8" }}>
              View alerts and warnings
            </p>
          </div>
          <span>›</span>
        </button>

        <button
          style={actionButton}
          onClick={() => alert("Change password will be added next.")}
        >
          <span style={{ fontSize: "26px" }}>🔐</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <strong>Change Password</strong>
            <p style={{ margin: "5px 0 0", color: "#94a3b8" }}>
              Update account security
            </p>
          </div>
          <span>›</span>
        </button>
      </div>

      <div style={sectionStyle}>
        <h2>Support</h2>

        <button style={actionButton} onClick={() => navigate("/help")}>
          <span style={{ fontSize: "26px" }}>☂️</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <strong>{text.help}</strong>
            <p style={{ margin: "5px 0 0", color: "#94a3b8" }}>
              Common problems and support
            </p>
          </div>
          <span>›</span>
        </button>

        <button style={actionButton} onClick={() => navigate("/plan")}>
          <span style={{ fontSize: "26px" }}>💳</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <strong>{text.plans}</strong>
            <p style={{ margin: "5px 0 0", color: "#94a3b8" }}>
              Manage subscription package
            </p>
          </div>
          <span>›</span>
        </button>
      </div>

      <button
        onClick={logout}
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: "16px",
          border: "none",
          background: "#ef4444",
          color: "white",
          fontWeight: "bold",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        🚪 {text.logout}
      </button>

      <BottomNav />
    </div>
  );
}

export default Settings;