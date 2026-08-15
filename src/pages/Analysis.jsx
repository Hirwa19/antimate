import { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import PageLoader from "../components/PageLoader";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const ANALYSIS_PLANS = ["PRO", "PREMIUM"];

const RANGES = [
  { key: "day", label: "1 Day", days: 1 },
  { key: "week", label: "1 Week", days: 7 },
  { key: "month", label: "1 Month", days: 30 },
  { key: "3months", label: "3 Months", days: 90 },
  { key: "6months", label: "6 Months", days: 180 },
  { key: "year", label: "1 Year", days: 365 },
];

export default function Analysis() {
  const { isDark } = useAppSettings();

  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState("day");
  const [selectedPoint, setSelectedPoint] = useState(null);

  const token = localStorage.getItem("token");

  const theme = {
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#94a3b8" : "#64748b",
    card: isDark
      ? "rgba(15, 23, 42, 0.75)"
      : "rgba(255, 255, 255, 0.85)",
    border: isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(15, 23, 42, 0.08)",
  };

  function getPlanName(data) {
    return String(
      data?.plan?.planName ||
        data?.plan?.name ||
        "FREE"
    ).toUpperCase();
  }

  function canUseAnalysis(plan) {
    return ANALYSIS_PLANS.includes(plan);
  }

  async function fetchProfile() {
    const res = await fetch(`${API_URL}/api/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load profile");
    return data;
  }

  async function fetchTelemetry() {
    const res = await fetch(`${API_URL}/api/telemetry/my-devices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load telemetry");
    return Array.isArray(data.data) ? data.data : [];
  }

  async function loadAnalysis(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      if (!token) throw new Error("Authentication required");

      const profileData = await fetchProfile();
      setProfile(profileData);

      const planName = getPlanName(profileData);
      if (!canUseAnalysis(planName)) {
        setRecords([]);
        return;
      }

      const telemetry = await fetchTelemetry();
      const sorted = telemetry
        .filter(
          (item) =>
            item.createdAt &&
            (Number.isFinite(Number(item.temperature)) ||
              Number.isFinite(Number(item.humidity)))
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setRecords(sorted);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to load analysis");
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAnalysis();
  }, []);

  const planName = getPlanName(profile);
  const analysisAllowed = canUseAnalysis(planName);

  const selectedRange =
    RANGES.find((item) => item.key === range) || RANGES[0];

  const filteredRecords = useMemo(() => {
    if (!records.length) return [];
    const now = Date.now();
    const from = now - selectedRange.days * 24 * 60 * 60 * 1000;
    return records.filter(
      (item) => new Date(item.createdAt).getTime() >= from
    );
  }, [records, selectedRange]);

  const chartData = useMemo(() => {
    return downsample(filteredRecords, 80);
  }, [filteredRecords]);

  const statistics = useMemo(() => {
    const temps = filteredRecords
      .map((i) => Number(i.temperature))
      .filter(Number.isFinite);
    const hums = filteredRecords
      .map((i) => Number(i.humidity))
      .filter(Number.isFinite);

    const avg = (arr) =>
      arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

    return {
      avgTemp: avg(temps),
      maxTemp: temps.length ? Math.max(...temps) : 0,
      minTemp: temps.length ? Math.min(...temps) : 0,
      avgHumidity: avg(hums),
      maxHumidity: hums.length ? Math.max(...hums) : 0,
      minHumidity: hums.length ? Math.min(...hums) : 0,
      total: filteredRecords.length,
    };
  }, [filteredRecords]);

  const insight = useMemo(() => {
    const { avgTemp, avgHumidity } = statistics;
    if (!filteredRecords.length) {
      return { type: "neutral", text: "No telemetry data is available." };
    }
    if (avgTemp > 32 || avgTemp < 20) {
      return {
        type: "warning",
        text: "Temperature is out of ideal range (20°C - 32°C). Adjust brooder heat source.",
      };
    }
    if (avgHumidity > 75 || avgHumidity < 40) {
      return {
        type: "warning",
        text: "Humidity level is irregular (40% - 75%). Check ventilation system.",
      };
    }
    return {
      type: "good",
      text: "Environmental factors are stable and optimal for brooder conditions.",
    };
  }, [statistics, filteredRecords]);

  if (loading) return <PageLoader />;

  return (
    <div
      style={{
        ...styles.page,
        background: isDark
          ? "radial-gradient(circle at top, #0f172a, #020617)"
          : "radial-gradient(circle at top, #f8fafc, #f1f5f9)",
        color: theme.text,
      }}
    >
      <AppHeader title="Analysis" />

      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Analytics Dashboard</h1>
            <p style={{ ...styles.subtitle, color: theme.muted }}>
              Real-time environmental metrics & telemetry
            </p>
          </div>

          {analysisAllowed && (
            <button
              onClick={() => loadAnalysis(true)}
              disabled={refreshing}
              style={styles.refresh}
            >
              {refreshing ? "Refreshing..." : "Sync Data"}
            </button>
          )}
        </div>

        {!analysisAllowed ? (
          <div
            style={{
              ...styles.lock,
              background: theme.card,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={styles.lockIcon}>🔒</div>
            <h2 style={{ margin: "0 0 8px 0" }}>Analysis Locked</h2>
            <p style={{ color: theme.muted, lineHeight: 1.6, margin: "0 0 16px 0" }}>
              Upgrade to <b>PRO</b> or <b>PREMIUM</b> plan to access complete system data graphs.
            </p>
            <span style={styles.planBadge}>Current Plan: {planName}</span>
          </div>
        ) : (
          <>
            {error && <div style={styles.error}>{error}</div>}

            {/* RANGE SELECTOR */}
            <section
              style={{
                ...styles.rangeBox,
                background: theme.card,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={styles.rangeHeader}>
                <span style={{ ...styles.sectionLabel, color: theme.muted }}>
                  Time Interval
                </span>
                <span style={{ fontWeight: 700, fontSize: "13px" }}>
                  {selectedRange.label}
                </span>
              </div>

              <div style={styles.rangeScroll}>
                {RANGES.map((item) => {
                  const active = range === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setRange(item.key);
                        setSelectedPoint(null);
                      }}
                      style={{
                        ...styles.rangeButton,
                        background: active
                          ? "#3b82f6"
                          : isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.04)",
                        color: active ? "#ffffff" : theme.muted,
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* METRIC STATS */}
            <section style={styles.grid}>
              <StatCard title="Avg Temp" value={`${statistics.avgTemp.toFixed(1)}°C`} icon="🌡️" color="#ef4444" theme={theme} />
              <StatCard title="Max Temp" value={`${statistics.maxTemp.toFixed(1)}°C`} icon="🔥" color="#f97316" theme={theme} />
              <StatCard title="Avg Humidity" value={`${statistics.avgHumidity.toFixed(1)}%`} icon="💧" color="#3b82f6" theme={theme} />
              <StatCard title="Min Humidity" value={`${statistics.minHumidity.toFixed(1)}%`} icon="❄️" color="#06b6d4" theme={theme} />
            </section>

            {/* PROFESSIONAL CHART */}
            <section
              style={{
                ...styles.chartBox,
                background: theme.card,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={styles.chartHeader}>
                <div>
                  <h2 style={styles.chartTitle}>Climate Trends</h2>
                  <p style={{ ...styles.subtitle, color: theme.muted }}>
                    Drag or click on points to inspect telemetry
                  </p>
                </div>
                <span style={styles.recordsBadge}>
                  {statistics.total} Logs
                </span>
              </div>

              {chartData.length ? (
                <ProfessionalChart
                  data={chartData}
                  dark={isDark}
                  selectedPoint={selectedPoint}
                  onSelectPoint={setSelectedPoint}
                  range={range}
                />
              ) : (
                <div style={styles.noData}>
                  No telemetry records available for this selected range.
                </div>
              )}
            </section>

            {/* INSIGHT BANNER */}
            <section
              style={{
                ...styles.insight,
                background:
                  insight.type === "warning"
                    ? "rgba(245, 158, 11, 0.12)"
                    : "rgba(34, 197, 94, 0.12)",
                border:
                  insight.type === "warning"
                    ? "1px solid rgba(245, 158, 11, 0.25)"
                    : "1px solid rgba(34, 197, 94, 0.25)",
              }}
            >
              <div style={{ fontSize: "22px" }}>
                {insight.type === "warning" ? "⚠️" : "✅"}
              </div>
              <div>
                <strong style={{ fontSize: "13px" }}>System Health Note</strong>
                <p style={{ margin: "4px 0 0", color: theme.muted, lineHeight: 1.4, fontSize: "12px" }}>
                  {insight.text}
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

/* =====================================================
   PROFESSIONAL CHART ENGINE (DUAL Y-AXIS, GRADIENT, SMOOTH CURVES)
===================================================== */

function ProfessionalChart({ data, dark, selectedPoint, onSelectPoint, range }) {
  const width = 500;
  const height = 240;

  const padLeft = 38;
  const padRight = 38;
  const padTop = 20;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const temps = data.map((d) => Number(d.temperature)).filter(Number.isFinite);
  const hums = data.map((d) => Number(d.humidity)).filter(Number.isFinite);

  // Dual Axis Scales
  const minT = temps.length ? Math.floor(Math.min(...temps) - 2) : 10;
  const maxT = temps.length ? Math.ceil(Math.max(...temps) + 2) : 45;

  const minH = hums.length ? Math.max(0, Math.floor(Math.min(...hums) - 5)) : 0;
  const maxH = hums.length ? Math.min(100, Math.ceil(Math.max(...hums) + 5)) : 100;

  const getX = (idx) => padLeft + (idx / Math.max(data.length - 1, 1)) * chartW;
  const getTY = (val) => padTop + chartH - ((val - minT) / Math.max(maxT - minT, 1)) * chartH;
  const getHY = (val) => padTop + chartH - ((val - minH) / Math.max(maxH - minH, 1)) * chartH;

  // Generate Smooth Quadratic Curved Paths
  const createSmoothPath = (getValueY) => {
    if (!data.length) return "";
    const points = data.map((d, i) => ({ x: getX(i), y: getValueY(Number(d.temperature ?? d.humidity)) }));

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`;
    }
    path += ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;
    return path;
  };

  const tempPath = createSmoothPath((val) => getTY(val));
  const humPath = createSmoothPath((val) => getHY(val));

  // Area Path for Gradient Fill
  const tempArea = `${tempPath} L ${getX(data.length - 1)},${padTop + chartH} L ${padLeft},${padTop + chartH} Z`;

  const handlePointer = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const svgX = ((clientX - rect.left) / rect.width) * width;

    let index = Math.round(((svgX - padLeft) / chartW) * (data.length - 1));
    index = Math.max(0, Math.min(data.length - 1, index));

    onSelectPoint(data[index]);
  };

  const activeIdx = selectedPoint
    ? data.findIndex((p) => p.createdAt === selectedPoint.createdAt)
    : -1;

  const yTicks = 4;

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        onMouseDown={handlePointer}
        onTouchStart={handlePointer}
        onTouchMove={handlePointer}
      >
        <defs>
          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* HORIZONTAL GRID LINES & Y-AXIS LABELS */}
        {Array.from({ length: yTicks }).map((_, i) => {
          const ratio = i / (yTicks - 1);
          const tVal = maxT - (maxT - minT) * ratio;
          const hVal = maxH - (maxH - minH) * ratio;
          const y = padTop + chartH * ratio;

          return (
            <g key={i}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke={dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)"}
                strokeDasharray="4 4"
              />
              {/* Left Y-Axis: Temp */}
              <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#ef4444" fontWeight="600">
                {Math.round(tVal)}°
              </text>
              {/* Right Y-Axis: Humidity */}
              <text x={width - padRight + 6} y={y + 3} textAnchor="start" fontSize="9" fill="#3b82f6" fontWeight="600">
                {Math.round(hVal)}%
              </text>
            </g>
          );
        })}

        {/* GRADIENT FILL AREA */}
        <path d={tempArea} fill="url(#tempGradient)" />

        {/* HUMIDITY STROKE */}
        <path
          d={humPath}
          fill="none"
          stroke="#be3bf6"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeOpacity="0.85"
        />

        {/* TEMPERATURE STROKE */}
        <path
          d={tempPath}
          fill="none"
          stroke="#0202df"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* CROSSHAIR & SELECTED HIGHLIGHT */}
        {activeIdx !== -1 && (
          <g>
            <line
              x1={getX(activeIdx)}
              x2={getX(activeIdx)}
              y1={padTop}
              y2={padTop + chartH}
              stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.3)"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {/* Temp Point Circle */}
            <circle
              cx={getX(activeIdx)}
              cy={getTY(Number(data[activeIdx].temperature))}
              r="6"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Humidity Point Circle */}
            <circle
              cx={getX(activeIdx)}
              cy={getHY(Number(data[activeIdx].humidity))}
              r="5"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}

        {/* X AXIS LABELS */}
        {getXAxisLabels(data, range).map((item) => (
          <text
            key={item.index}
            x={getX(item.index)}
            y={height - 8}
            textAnchor="middle"
            fontSize="9"
            fill={dark ? "#94a3b8" : "#64748b"}
          >
            {item.label}
          </text>
        ))}
      </svg>

      {/* POPUP FLOATING TOOLTIP */}
      {selectedPoint && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            background: dark ? "rgba(30,41,59,0.95)" : "#ffffff",
            border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
          }}
        >
          <div>
            <span style={{ color: dark ? "#94a3b8" : "#64748b", display: "block", fontSize: "10px" }}>
              {formatDateTime(selectedPoint.createdAt)}
            </span>
            <span style={{ fontWeight: 700 }}>Telemetry Metric</span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>
              🌡️ {selectedPoint.temperature ?? "—"}°C
            </span>
            <span style={{ color: "#3b82f6", fontWeight: 700 }}>
              💧 {selectedPoint.humidity ?? "—"}%
            </span>
          </div>
        </div>
      )}

      {/* LEGEND */}
      <div style={styles.legend}>
        <span>
          <i style={{ ...styles.legendDot, background: "#ef4444" }} />
          Temp (°C - Left Y)
        </span>
        <span>
          <i style={{ ...styles.legendDot, background: "#3b82f6" }} />
          Humidity (% - Right Y)
        </span>
      </div>
    </div>
  );
}

/* =====================================================
   HELPERS & STYLES
===================================================== */

function downsample(records, maxPoints) {
  if (records.length <= maxPoints) return records;
  const step = (records.length - 1) / (maxPoints - 1);
  const result = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(records[Math.round(i * step)]);
  }
  return result;
}

function getXAxisLabels(data, range) {
  if (!data.length) return [];
  const count = 5;
  const result = [];
  for (let i = 0; i < count; i++) {
    const index = Math.round((i / (count - 1)) * (data.length - 1));
    const item = data[index];
    if (!item) continue;
    const date = new Date(item.createdAt);
    let label =
      range === "day"
        ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString([], { month: "short", day: "numeric" });
    result.push({ index, label });
  }
  return result;
}

function formatDateTime(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function StatCard({ title, value, icon, color, theme }) {
  return (
    <div
      style={{
        ...styles.card,
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: theme.muted }}>{title}</span>
        <span style={{ fontSize: "16px" }}>{icon}</span>
      </div>
      <strong style={{ fontSize: "20px", color, marginTop: "6px", display: "block" }}>
        {value}
      </strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "16px",
    paddingBottom: "100px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  },
  content: { maxWidth: "600px", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  title: { margin: 0, fontSize: "22px", fontWeight: 800 },
  subtitle: { margin: "2px 0 0", fontSize: "11px" },
  refresh: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 14px",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: 600,
    fontSize: "12px",
    cursor: "pointer",
  },
  lock: {
    padding: "30px 20px",
    borderRadius: "20px",
    textAlign: "center",
  },
  lockIcon: { fontSize: "36px", marginBottom: "10px" },
  planBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    background: "#3b82f6",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
  },
  error: {
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "10px",
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    fontSize: "12px",
  },
  rangeBox: { padding: "12px", borderRadius: "16px", marginBottom: "12px" },
  rangeHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" },
  rangeScroll: { display: "flex", gap: "6px", marginTop: "8px", overflowX: "auto" },
  rangeButton: {
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "12px" },
  card: { padding: "12px", borderRadius: "16px" },
  chartBox: { padding: "16px", borderRadius: "20px", marginBottom: "12px" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  chartTitle: { margin: 0, fontSize: "15px", fontWeight: 700 },
  recordsBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    background: "rgba(59, 130, 246, 0.1)",
    color: "#3b82f6",
    fontSize: "10px",
    fontWeight: 700,
  },
  legend: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginTop: "12px",
    fontSize: "11px",
    fontWeight: 500,
  },
  legendDot: {
    width: "8px",
    height: "8px",
    display: "inline-block",
    borderRadius: "50%",
    marginRight: "6px",
  },
  insight: { display: "flex", gap: "12px", padding: "12px", borderRadius: "14px" },
  noData: { padding: "40px 0", textAlign: "center", fontSize: "12px", opacity: 0.6 },
};