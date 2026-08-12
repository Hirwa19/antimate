import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import AnalysisChart from "../components/AnalysisChart";
import PageLoader from "../components/PageLoader";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const ANALYSIS_PLANS = ["PRO", "PREMIUM"];

export default function Analysis() {
  const { isDark } = useAppSettings();

  const [profile, setProfile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  function getPlanName(profileData) {
    return String(
      profileData?.plan?.planName ||
      profileData?.plan?.name ||
      "FREE"
    ).toUpperCase();
  }

  function canUseAnalysis(planName) {
    return ANALYSIS_PLANS.includes(planName);
  }

  async function fetchProfile() {
    const res = await fetch(`${API_URL}/api/profile/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message || "Failed to load subscription"
      );
    }

    return data;
  }

  async function fetchTelemetry() {
    const res = await fetch(
      `${API_URL}/api/telemetry/my-devices`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message || "Failed to load telemetry"
      );
    }

    return Array.isArray(data.data) ? data.data : [];
  }

  function calculateAnalysis(records) {
    const validTemperature = records
      .map((item) => Number(item.temperature))
      .filter(Number.isFinite);

    const validHumidity = records
      .map((item) => Number(item.humidity))
      .filter(Number.isFinite);

    const maxTemperature = validTemperature.length
      ? Math.max(...validTemperature)
      : 0;

    const minTemperature = validTemperature.length
      ? Math.min(...validTemperature)
      : 0;

    const averageTemperature = validTemperature.length
      ? validTemperature.reduce((a, b) => a + b, 0) /
        validTemperature.length
      : 0;

    const averageHumidity = validHumidity.length
      ? validHumidity.reduce((a, b) => a + b, 0) /
        validHumidity.length
      : 0;

    return {
      maxTemperature,
      minTemperature,
      averageTemperature,
      averageHumidity,
      totalRecords: records.length,
    };
  }

  function formatChartData(records) {
    return records
      .filter(
        (item) =>
          Number.isFinite(Number(item.temperature)) ||
          Number.isFinite(Number(item.humidity))
      )
      .slice(-20)
      .map((item) => ({
        temperature: Number.isFinite(Number(item.temperature))
          ? Number(item.temperature)
          : null,

        humidity: Number.isFinite(Number(item.humidity))
          ? Number(item.humidity)
          : null,

        time: item.createdAt
          ? new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--",
      }));
  }

  async function loadAnalysis(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      if (!token) {
        throw new Error("Authentication required");
      }

      // ============================================
      // 1. LOAD USER PROFILE + PLAN
      // ============================================

      const profileData = await fetchProfile();

      setProfile(profileData);

      const planName = getPlanName(profileData);

      // ============================================
      // 2. SUBSCRIPTION CHECK
      // ============================================

      if (!canUseAnalysis(planName)) {
        setAnalysis(null);
        setChartData([]);
        return;
      }

      // ============================================
      // 3. LOAD TELEMETRY ONLY FOR ALLOWED PLANS
      // ============================================

      const records = await fetchTelemetry();

      // Backend can return newest first.
      // Sort oldest -> newest for chart/calculation consistency.
      const sortedRecords = [...records].sort(
        (a, b) =>
          new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0)
      );

      // ============================================
      // 4. CALCULATE ANALYSIS
      // ============================================

      setAnalysis(
        calculateAnalysis(sortedRecords)
      );

      setChartData(
        formatChartData(sortedRecords)
      );
    } catch (err) {
      console.error("Analysis error:", err);

      setError(
        err.message || "Failed to load analysis"
      );

      setAnalysis(null);
      setChartData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAnalysis();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  const planName = getPlanName(profile);
  const analysisAllowed = canUseAnalysis(planName);

  const cards = [
    {
      title: "Max Temp",
      value: `${Number(
        analysis?.maxTemperature || 0
      ).toFixed(1)}°C`,
      icon: "🔥",
    },
    {
      title: "Min Temp",
      value: `${Number(
        analysis?.minTemperature || 0
      ).toFixed(1)}°C`,
      icon: "❄️",
    },
    {
      title: "Average Temp",
      value: `${Number(
        analysis?.averageTemperature || 0
      ).toFixed(1)}°C`,
      icon: "🌡️",
    },
    {
      title: "Average Humidity",
      value: `${Number(
        analysis?.averageHumidity || 0
      ).toFixed(1)}%`,
      icon: "💧",
    },
  ];

  return (
    <div
      style={{
        ...styles.page,
        background: isDark
          ? "linear-gradient(135deg,#07111f,#0f2537)"
          : "linear-gradient(135deg,#f8fafc,#e2e8f0)",
        color: isDark ? "#fff" : "#0f172a",
      }}
    >
      <AppHeader title="Analysis" />

      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>
            Brooder Analysis
          </h1>

          <p
            style={{
              ...styles.subtitle,
              color: isDark
                ? "#94a3b8"
                : "#64748b",
            }}
          >
            Environmental performance from your
            telemetry data
          </p>
        </div>

        {analysisAllowed && (
          <button
            onClick={() => loadAnalysis(true)}
            style={styles.refreshBtn}
            disabled={refreshing}
          >
            {refreshing ? "..." : "Refresh"}
          </button>
        )}
      </div>

      {/* ==========================================
          SUBSCRIPTION LOCK
      ========================================== */}

      {!analysisAllowed ? (
        <div
          style={{
            ...styles.lockBox,
            background: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.78)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <div style={styles.lockIcon}>
            🔒
          </div>

          <h2 style={styles.lockTitle}>
            Analysis is locked
          </h2>

          <p
            style={{
              ...styles.lockText,
              color: isDark
                ? "#94a3b8"
                : "#64748b",
            }}
          >
            Environmental analysis, statistics and
            telemetry trends are available on
            Pro and Premium plans.
          </p>

          <div style={styles.currentPlan}>
            Current plan:{" "}
            <strong>{planName}</strong>
          </div>
        </div>
      ) : (
        <>
          {/* ======================================
              ERROR
          ====================================== */}

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          {/* ======================================
              RECORD COUNT
          ====================================== */}

          <div
            style={{
              ...styles.recordBox,
              background: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.78)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(15,23,42,0.08)",
            }}
          >
            <span
              style={{
                color: isDark
                  ? "#94a3b8"
                  : "#64748b",
              }}
            >
              Total Records
            </span>

            <strong>
              {analysis?.totalRecords || 0}
            </strong>
          </div>

          {/* ======================================
              ANALYSIS CARDS
          ====================================== */}

          <div style={styles.grid}>
            {cards.map((card) => (
              <div
                key={card.title}
                style={{
                  ...styles.card,
                  background: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.78)",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid rgba(15,23,42,0.08)",
                }}
              >
                <div style={styles.icon}>
                  {card.icon}
                </div>

                <p
                  style={{
                    ...styles.cardLabel,
                    color: isDark
                      ? "#94a3b8"
                      : "#64748b",
                  }}
                >
                  {card.title}
                </p>

                <h2 style={styles.cardValue}>
                  {card.value}
                </h2>
              </div>
            ))}
          </div>

          {/* ======================================
              CHART
          ====================================== */}

          <div
            style={{
              ...styles.chartBox,
              background: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.78)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(15,23,42,0.08)",
            }}
          >
            <div style={styles.chartHeader}>
              <div>
                <h2 style={styles.chartTitle}>
                  Environment Trend
                </h2>

                <p
                  style={{
                    ...styles.chartSubtitle,
                    color: isDark
                      ? "#94a3b8"
                      : "#64748b",
                  }}
                >
                  Latest {chartData.length} telemetry
                  readings
                </p>
              </div>

              <span style={styles.planBadge}>
                {planName}
              </span>
            </div>

            {chartData.length > 0 ? (
              <AnalysisChart data={chartData} />
            ) : (
              <div style={styles.noData}>
                No telemetry data available yet.
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    paddingBottom: "110px",
    fontFamily: "Inter, Arial, sans-serif",
    boxSizing: "border-box",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginTop: "15px",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    fontSize: "27px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "7px 0 0",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  refreshBtn: {
    border: "none",
    borderRadius: "12px",
    padding: "9px 14px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  errorBox: {
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "15px",
    background: "rgba(239,68,68,0.12)",
    color: "#ef4444",
    border:
      "1px solid rgba(239,68,68,0.25)",
    fontSize: "13px",
  },

  lockBox: {
    marginTop: "20px",
    padding: "35px 22px",
    borderRadius: "25px",
    textAlign: "center",
    backdropFilter: "blur(14px)",
    boxShadow:
      "0 18px 40px rgba(0,0,0,0.08)",
  },

  lockIcon: {
    width: "65px",
    height: "65px",
    margin: "0 auto 15px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    background:
      "linear-gradient(135deg,rgba(37,99,235,0.15),rgba(124,58,237,0.15))",
  },

  lockTitle: {
    margin: "0 0 10px",
    fontSize: "21px",
  },

  lockText: {
    margin: "0 auto 18px",
    maxWidth: "390px",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  currentPlan: {
    display: "inline-block",
    padding: "8px 13px",
    borderRadius: "999px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "12px",
  },

  recordBox: {
    padding: "15px 18px",
    borderRadius: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    backdropFilter: "blur(14px)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: "12px",
  },

  card: {
    padding: "17px",
    borderRadius: "21px",
    backdropFilter: "blur(14px)",
    boxShadow:
      "0 12px 28px rgba(0,0,0,0.08)",
  },

  icon: {
    fontSize: "25px",
  },

  cardLabel: {
    margin: "10px 0 4px",
    fontSize: "11px",
  },

  cardValue: {
    margin: 0,
    fontSize: "21px",
  },

  chartBox: {
    marginTop: "15px",
    padding: "17px",
    borderRadius: "23px",
    backdropFilter: "blur(14px)",
  },

  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "10px",
  },

  chartTitle: {
    margin: 0,
    fontSize: "17px",
  },

  chartSubtitle: {
    margin: "5px 0 0",
    fontSize: "11px",
  },

  planBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "10px",
    fontWeight: 700,
  },

  noData: {
    padding: "45px 10px",
    textAlign: "center",
    opacity: 0.6,
    fontSize: "13px",
  },
};