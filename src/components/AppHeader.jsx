import { useAppSettings } from "../context/AppSettingsContext";

function AppHeader({ title }) {
  const { isDark } = useAppSettings();
  const today = new Date();

  return (
    <div
      style={{
        background: isDark ? "#1e293b" : "white",
        color: isDark ? "white" : "#0f172a",
        padding: "15px",
        borderRadius: "15px",
        marginBottom: "20px",
        boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>

      <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>
        {today.toDateString()} • {today.toLocaleTimeString()}
      </p>
    </div>
  );
}

export default AppHeader;