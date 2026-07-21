import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import API from "../api/api";
import AnalysisChart from "../components/AnalysisChart";

function Analysis() {
  const [analysis, setAnalysis] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
  const fetchAnalysis = async () => {
    try {
      const analysisRes = await API.get("/sensors/analysis");
      setAnalysis(analysisRes.data);

      const historyRes = await API.get("/sensors/history");

      const formatted = historyRes.data
        .slice(0, 20)
        .reverse()
        .map((item) => ({
          temperature: item.temperature,
          humidity: item.humidity,
          time: new Date(item.createdAt).toLocaleTimeString(),
        }));

      setChartData(formatted);
    } catch (err) {
      console.log("Analysis error:", err);
    }
  };

  fetchAnalysis();
}, []);

  const cards = [
    {
      title: "Max Temp",
      value: `${analysis?.maxTemperature || 0}°C`,
      icon: "🔥",
    },
    {
      title: "Min Temp",
      value: `${analysis?.minTemperature || 0}°C`,
      icon: "❄️",
    },
    {
      title: "Average Temp",
      value: `${analysis?.averageTemperature || 0}°C`,
      icon: "🌡️",
    },
    {
      title: "Average Humidity",
      value: `${analysis?.averageHumidity || 0}%`,
      icon: "💧",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "20px",
        paddingBottom: "100px",
        fontFamily: "Arial",
      }}
    >
      <AppHeader title="Analysis" />

      <p style={{ color: "#94a3b8" }}>
        Total Records: {analysis?.totalRecords || 0}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            style={{
              background: "#1e293b",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "28px" }}>{card.icon}</div>
            <p style={{ color: "#94a3b8" }}>{card.title}</p>
            <h2>{card.value}</h2>
          </div>
        ))}
      </div>
      <AnalysisChart data={chartData} />
      <BottomNav />
    </div>
  );
}

export default Analysis;