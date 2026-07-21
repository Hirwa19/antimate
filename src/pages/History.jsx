import React, { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

export default function History() {
  const { isDark } = useAppSettings();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchHistory() {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/sensors/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setHistory(Array.isArray(data) ? data : []);

    } catch (error) {
      console.log("History error:", error);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    fetchHistory();
  }, []);


  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        paddingBottom: "100px",
        background: isDark
          ? "linear-gradient(135deg,#07111f,#0f2537)"
          : "linear-gradient(135deg,#f8fafc,#e2e8f0)",
        color: isDark ? "#fff" : "#111827",
        fontFamily: "Inter, Arial",
        position: "relative",
      }}
    >

      {/* LOADING BAR */}
      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingBar}></div>
        </div>
      )}


      <h1 style={{ marginBottom: "8px" }}>
        Sensor History
      </h1>

      <p
        style={{
          color: isDark ? "#94a3b8" : "#64748b",
          marginBottom: "25px",
        }}
      >
        Temperature and humidity records
      </p>


      <div>
        {history.length === 0 && !loading ? (

          <div style={styles.empty}>
            No sensor data available
          </div>

        ) : (

          history.map((item) => (

            <div
              key={item._id}
              style={{
                ...styles.row,
                background: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.8)",
              }}
            >

              <div>
                <strong>
                  🌡 {item.temperature}°C
                </strong>

                <p>
                  💧 {item.humidity}%
                </p>
              </div>


              <div style={{textAlign:"right"}}>

                <p>
                  🔥 {item.heater}
                </p>

                <p
                  style={{
                    fontSize:"12px",
                    color:isDark?"#94a3b8":"#64748b"
                  }}
                >
                  {new Date(item.createdAt)
                    .toLocaleString()}
                </p>

              </div>


            </div>

          ))

        )}
      </div>



      {/* BOTTOM NAVIGATION */}
      <BottomNav />


    </div>
  );
}



const styles = {


loadingContainer:{
  position:"fixed",
  bottom:"72px",
  left:0,
  width:"100%",
  height:"4px",
  overflow:"hidden",
  zIndex:999,
},


loadingBar:{
  height:"100%",
  width:"40%",
  background:
    "linear-gradient(90deg,#22c55e,#06b6d4,#7c3aed)",
  animation:"loadingMove 1.2s infinite linear",
},


row:{
  padding:"18px",
  borderRadius:"20px",
  marginBottom:"14px",
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  backdropFilter:"blur(12px)",
  boxShadow:"0 10px 25px rgba(0,0,0,0.08)",
},


empty:{
  padding:"40px",
  textAlign:"center",
  opacity:0.7,
}

};