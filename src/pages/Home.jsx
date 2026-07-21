import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";

function Home() {
  const user = JSON.parse(localStorage.getItem("user"));
  const { isDark, text } = useAppSettings();

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark ? "#0f172a" : "#f8fafc",
      color: isDark ? "white" : "#0f172a",
      padding: "20px",
      paddingBottom: "100px",
      fontFamily: "Arial",
    }}>
      <AppHeader title={text.home} />

      <h1>{text.home}, {user?.name || "User"} 👋</h1>

      <div style={{
        background: isDark ? "#1e293b" : "white",
        borderRadius: "20px",
        padding: "20px",
        marginTop: "20px",
        boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.08)",
      }}>
        <h2>BRD Basic V1</h2>
        <p style={{ color: "#00ff99" }}>Online</p>
        <p>Serial N: 117986984311</p>
        <p>Firmware Version: 1.0</p>

        <Link to="/dashboard">
          <button style={{
            width: "100%",
            marginTop: "15px",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: "#00ff99",
            color: "#0f172a",
            fontWeight: "bold",
          }}>
            {text.dashboard}
          </button>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}

export default Home;