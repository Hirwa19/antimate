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
      ? "rgba(255,255,255,0.07)"
      : "rgba(255,255,255,0.82)",
    border: isDark
      ? "rgba(255,255,255,0.12)"
      : "rgba(15,23,42,0.08)",
    grid: isDark
      ? "rgba(148,163,184,0.12)"
      : "rgba(15,23,42,0.08)",
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
    const res = await fetch(
      `${API_URL}/api/profile/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to load subscription"
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
        data.message ||
          "Failed to load telemetry"
      );
    }

    return Array.isArray(data.data)
      ? data.data
      : [];
  }

  async function loadAnalysis(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      if (!token) {
        throw new Error(
          "Authentication required"
        );
      }

      const profileData =
        await fetchProfile();

      setProfile(profileData);

      const planName =
        getPlanName(profileData);

      if (!canUseAnalysis(planName)) {
        setRecords([]);
        return;
      }

      const telemetry =
        await fetchTelemetry();

      const sorted = telemetry
        .filter(
          (item) =>
            item.createdAt &&
            (
              Number.isFinite(
                Number(item.temperature)
              ) ||
              Number.isFinite(
                Number(item.humidity)
              )
            )
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt) -
            new Date(b.createdAt)
        );

      setRecords(sorted);
    } catch (err) {
      console.error(
        "Analysis error:",
        err
      );

      setError(
        err.message ||
          "Failed to load analysis"
      );

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
  const analysisAllowed =
    canUseAnalysis(planName);

  const selectedRange =
    RANGES.find(
      (item) => item.key === range
    ) || RANGES[0];

  const filteredRecords = useMemo(() => {
    if (!records.length) return [];

    const now = Date.now();

    const from =
      now -
      selectedRange.days *
        24 *
        60 *
        60 *
        1000;

    return records.filter((item) => {
      const time =
        new Date(
          item.createdAt
        ).getTime();

      return time >= from;
    });
  }, [
    records,
    selectedRange,
  ]);

  const chartData = useMemo(() => {
    return downsample(
      filteredRecords,
      100
    );
  }, [filteredRecords]);

  const statistics = useMemo(() => {
    const temperatures =
      filteredRecords
        .map((item) =>
          Number(item.temperature)
        )
        .filter(Number.isFinite);

    const humidities =
      filteredRecords
        .map((item) =>
          Number(item.humidity)
        )
        .filter(Number.isFinite);

    const average = (values) =>
      values.length
        ? values.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / values.length
        : 0;

    return {
      maxTemp: temperatures.length
        ? Math.max(...temperatures)
        : 0,

      minTemp: temperatures.length
        ? Math.min(...temperatures)
        : 0,

      avgTemp: average(
        temperatures
      ),

      avgHumidity: average(
        humidities
      ),

      maxHumidity:
        humidities.length
          ? Math.max(...humidities)
          : 0,

      minHumidity:
        humidities.length
          ? Math.min(...humidities)
          : 0,

      total:
        filteredRecords.length,
    };
  }, [filteredRecords]);

  const insight = useMemo(() => {
    const temp =
      statistics.avgTemp;

    const humidity =
      statistics.avgHumidity;

    if (!filteredRecords.length) {
      return {
        type: "neutral",
        text:
          "No telemetry data is available for this period.",
      };
    }

    if (
      temp > 32 ||
      temp < 20
    ) {
      return {
        type: "warning",
        text:
          "Temperature has moved outside the preferred monitoring range. Check the brooder environment.",
      };
    }

    if (
      humidity > 75 ||
      humidity < 40
    ) {
      return {
        type: "warning",
        text:
          "Humidity has moved outside the preferred monitoring range. Monitor ventilation and moisture.",
      };
    }

    return {
      type: "good",
      text:
        "Environmental conditions look relatively stable during this period.",
    };
  }, [statistics, filteredRecords]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div
      style={{
        ...styles.page,
        background: isDark
          ? "linear-gradient(135deg,#07111f,#0f2537)"
          : "linear-gradient(135deg,#f8fafc,#e2e8f0)",
        color: theme.text,
      }}
    >
      <AppHeader title="Analysis" />

      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Brooder Analysis
            </h1>

            <p
              style={{
                ...styles.subtitle,
                color: theme.muted,
              }}
            >
              Detailed environmental
              performance
            </p>
          </div>

          {analysisAllowed && (
            <button
              onClick={() =>
                loadAnalysis(true)
              }
              disabled={refreshing}
              style={styles.refresh}
            >
              {refreshing
                ? "..."
                : "Refresh"}
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
            <div style={styles.lockIcon}>
              🔒
            </div>

            <h2>
              Analysis is locked
            </h2>

            <p
              style={{
                color: theme.muted,
                lineHeight: 1.6,
              }}
            >
              Detailed environmental
              analysis is available on
              Pro and Premium plans.
            </p>

            <span
              style={styles.planBadge}
            >
              Current plan: {planName}
            </span>
          </div>
        ) : (
          <>
            {error && (
              <div
                style={styles.error}
              >
                {error}
              </div>
            )}

            {/* RANGE */}

            <section
              style={{
                ...styles.rangeBox,
                background: theme.card,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div>
                <p
                  style={{
                    ...styles.sectionLabel,
                    color: theme.muted,
                  }}
                >
                  Analysis period
                </p>

                <strong>
                  {selectedRange.label}
                </strong>
              </div>

              <div
                style={styles.rangeScroll}
              >
                {RANGES.map(
                  (item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setRange(
                          item.key
                        );
                        setSelectedPoint(
                          null
                        );
                      }}
                      style={{
                        ...styles.rangeButton,
                        ...(range ===
                        item.key
                          ? styles.rangeActive
                          : {
                              color:
                                theme.muted,
                              background:
                                "transparent",
                            }),
                      }}
                    >
                      {item.label}
                    </button>
                  )
                )}
              </div>
            </section>

            {/* SUMMARY */}

            <section
              style={styles.grid}
            >
              <StatCard
                title="Average Temp"
                value={`${statistics.avgTemp.toFixed(
                  1
                )}°C`}
                icon="🌡️"
                theme={theme}
              />

              <StatCard
                title="Max Temp"
                value={`${statistics.maxTemp.toFixed(
                  1
                )}°C`}
                icon="🔥"
                theme={theme}
              />

              <StatCard
                title="Min Temp"
                value={`${statistics.minTemp.toFixed(
                  1
                )}°C`}
                icon="❄️"
                theme={theme}
              />

              <StatCard
                title="Avg Humidity"
                value={`${statistics.avgHumidity.toFixed(
                  1
                )}%`}
                icon="💧"
                theme={theme}
              />
            </section>

            {/* CHART */}

            <section
              style={{
                ...styles.chartBox,
                background: theme.card,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={
                  styles.chartHeader
                }
              >
                <div>
                  <h2
                    style={
                      styles.chartTitle
                    }
                  >
                    Temperature & Humidity
                  </h2>

                  <p
                    style={{
                      ...styles.subtitle,
                      color: theme.muted,
                    }}
                  >
                    Touch a point for
                    detailed telemetry
                  </p>
                </div>

                <span
                  style={
                    styles.recordsBadge
                  }
                >
                  {statistics.total} records
                </span>
              </div>

              {chartData.length ? (
                <AnalysisChart
                  data={chartData}
                  dark={isDark}
                  selectedPoint={
                    selectedPoint
                  }
                  onSelectPoint={
                    setSelectedPoint
                  }
                  range={range}
                />
              ) : (
                <div
                  style={styles.noData}
                >
                  No telemetry data
                  available for this
                  period.
                </div>
              )}

              {selectedPoint && (
                <div
                  style={{
                    ...styles.pointDetails,
                    background:
                      isDark
                        ? "rgba(37,99,235,0.12)"
                        : "rgba(37,99,235,0.07)",
                    border:
                      "1px solid rgba(37,99,235,0.18)",
                  }}
                >
                  <strong>
                    Selected reading
                  </strong>

                  <div
                    style={
                      styles.pointGrid
                    }
                  >
                    <span>
                      Temperature
                      <b>
                        {selectedPoint.temperature ??
                          "—"}
                        °C
                      </b>
                    </span>

                    <span>
                      Humidity
                      <b>
                        {selectedPoint.humidity ??
                          "—"}
                        %
                      </b>
                    </span>

                    <span>
                      Time
                      <b>
                        {formatDateTime(
                          selectedPoint.createdAt
                        )}
                      </b>
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* INSIGHT */}

            <section
              style={{
                ...styles.insight,
                background:
                  insight.type ===
                  "warning"
                    ? "rgba(245,158,11,0.10)"
                    : "rgba(34,197,94,0.10)",
                border:
                  insight.type ===
                  "warning"
                    ? "1px solid rgba(245,158,11,0.25)"
                    : "1px solid rgba(34,197,94,0.20)",
              }}
            >
              <div
                style={styles.insightIcon}
              >
                {insight.type ===
                "warning"
                  ? "⚠️"
                  : "✓"}
              </div>

              <div>
                <strong>
                  Environmental insight
                </strong>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      theme.muted,
                    lineHeight: 1.5,
                  }}
                >
                  {insight.text}
                </p>
              </div>
            </section>

            {/* DATA SUMMARY */}

            <section
              style={{
                ...styles.dataSummary,
                background: theme.card,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div>
                <span
                  style={{
                    color: theme.muted,
                  }}
                >
                  Records
                </span>

                <strong>
                  {statistics.total}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    color: theme.muted,
                  }}
                >
                  Min humidity
                </span>

                <strong>
                  {statistics.minHumidity.toFixed(
                    1
                  )}
                  %
                </strong>
              </div>

              <div>
                <span
                  style={{
                    color: theme.muted,
                  }}
                >
                  Max humidity
                </span>

                <strong>
                  {statistics.maxHumidity.toFixed(
                    1
                  )}
                  %
                </strong>
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
   CHART
===================================================== */

function AnalysisChart({
  data,
  dark,
  selectedPoint,
  onSelectPoint,
  range,
}) {
  const width = 360;
  const height = 190;

  const paddingLeft = 42;
  const paddingRight = 12;
  const paddingTop = 15;
  const paddingBottom = 32;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const temperatures = data
    .map((item) =>
      Number(item.temperature)
    )
    .filter(Number.isFinite);

  const humidities = data
    .map((item) =>
      Number(item.humidity)
    )
    .filter(Number.isFinite);

  const tempMin =
    temperatures.length
      ? Math.floor(
          Math.min(...temperatures) - 1
        )
      : 0;

  const tempMax =
    temperatures.length
      ? Math.ceil(
          Math.max(...temperatures) + 1
        )
      : 40;

  const humidityMin = 0;
  const humidityMax = 100;

  const getX = (index) =>
    paddingLeft +
    (index /
      Math.max(data.length - 1, 1)) *
      chartWidth;

  const getTempY = (value) =>
    paddingTop +
    chartHeight -
    ((value - tempMin) /
      Math.max(
        tempMax - tempMin,
        1
      )) *
      chartHeight;

  const getHumidityY = (value) =>
    paddingTop +
    chartHeight -
    ((value - humidityMin) /
      (humidityMax -
        humidityMin)) *
      chartHeight;

  const tempPoints = data
    .map((item, index) => {
      const value =
        Number(item.temperature);

      if (!Number.isFinite(value))
        return null;

      return `${getX(index)},${getTempY(
        value
      )}`;
    })
    .filter(Boolean)
    .join(" ");

  const humidityPoints = data
    .map((item, index) => {
      const value =
        Number(item.humidity);

      if (!Number.isFinite(value))
        return null;

      return `${getX(
        index
      )},${getHumidityY(value)}`;
    })
    .filter(Boolean)
    .join(" ");

  const yTicks = 5;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: "100%",
          height: "220px",
          display: "block",
        }}
        onClick={(event) => {
          const rect =
            event.currentTarget.getBoundingClientRect();

          const svgX =
            ((event.clientX -
              rect.left) /
              rect.width) *
            width;

          const index = Math.round(
            ((svgX -
              paddingLeft) /
              chartWidth) *
              Math.max(
                data.length - 1,
                1
              )
          );

          if (
            index >= 0 &&
            index < data.length
          ) {
            onSelectPoint(
              data[index]
            );
          }
        }}
      >
        {/* GRID */}

        {Array.from(
          { length: yTicks },
          (_, index) => {
            const value =
              tempMin +
              ((tempMax -
                tempMin) /
                (yTicks - 1)) *
                index;

            const y =
              getTempY(value);

            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  x2={
                    width -
                    paddingRight
                  }
                  y1={y}
                  y2={y}
                  stroke={
                    dark
                      ? "rgba(148,163,184,0.13)"
                      : "rgba(15,23,42,0.08)"
                  }
                />

                <text
                  x="4"
                  y={y + 4}
                  fontSize="9"
                  fill={
                    dark
                      ? "#94a3b8"
                      : "#64748b"
                  }
                >
                  {value.toFixed(0)}°
                </text>
              </g>
            );
          }
        )}

        {/* TEMPERATURE */}

        <polyline
          points={tempPoints}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* HUMIDITY */}

        <polyline
          points={humidityPoints}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2.5"
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* POINTS */}

        {data.map(
          (item, index) => {
            const temp =
              Number(
                item.temperature
              );

            if (
              !Number.isFinite(temp)
            ) {
              return null;
            }

            const selected =
              selectedPoint?.createdAt ===
              item.createdAt;

            return (
              <circle
                key={`${item.createdAt}-${index}`}
                cx={getX(index)}
                cy={getTempY(temp)}
                r={
                  selected
                    ? 6
                    : 3.5
                }
                fill="#2563eb"
                stroke={
                  dark
                    ? "#0f172a"
                    : "#ffffff"
                }
                strokeWidth="2"
              />
            );
          }
        )}

        {/* X AXIS */}

        {getXAxisLabels(
          data,
          range
        ).map((item) => (
          <text
            key={item.index}
            x={getX(item.index)}
            y={
              height -
              8
            }
            textAnchor="middle"
            fontSize="8"
            fill={
              dark
                ? "#94a3b8"
                : "#64748b"
            }
          >
            {item.label}
          </text>
        ))}
      </svg>

      <div
        style={styles.legend}
      >
        <span>
          <i
            style={{
              ...styles.legendDot,
              background:
                "#2563eb",
            }}
          />
          Temperature
        </span>

        <span>
          <i
            style={{
              ...styles.legendDot,
              background:
                "#7c3aed",
            }}
          />
          Humidity
        </span>
      </div>
    </div>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function downsample(records, maxPoints) {
  if (records.length <= maxPoints) {
    return records;
  }

  const step =
    (records.length - 1) /
    (maxPoints - 1);

  const result = [];

  for (
    let i = 0;
    i < maxPoints;
    i++
  ) {
    result.push(
      records[
        Math.round(i * step)
      ]
    );
  }

  return result;
}

function getXAxisLabels(
  data,
  range
) {
  if (!data.length) return [];

  const count =
    range === "day"
      ? 6
      : range === "week"
      ? 7
      : 6;

  const result = [];

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const index = Math.round(
      (i /
        Math.max(
          count - 1,
          1
        )) *
        (data.length - 1)
    );

    const item =
      data[index];

    if (!item) continue;

    const date =
      new Date(
        item.createdAt
      );

    let label;

    if (
      range === "day"
    ) {
      label =
        date.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );
    } else if (
      range === "week"
    ) {
      label =
        date.toLocaleDateString(
          [],
          {
            weekday: "short",
          }
        );
    } else {
      label =
        date.toLocaleDateString(
          [],
          {
            month: "short",
            day: "numeric",
          }
        );
    }

    result.push({
      index,
      label,
    });
  }

  return result;
}

function formatDateTime(
  value
) {
  if (!value) return "—";

  return new Date(
    value
  ).toLocaleString(
    [],
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
  theme,
}) {
  return (
    <div
      style={{
        ...styles.card,
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div
        style={styles.cardIcon}
      >
        {icon}
      </div>

      <p
        style={{
          ...styles.cardLabel,
          color: theme.muted,
        }}
      >
        {title}
      </p>

      <strong
        style={styles.cardValue}
      >
        {value}
      </strong>
    </div>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    paddingBottom: "110px",
    fontFamily:
      "Inter, Arial, sans-serif",
    boxSizing: "border-box",
  },

  content: {
    maxWidth: "560px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginTop: "15px",
    marginBottom: "18px",
  },

  title: {
    margin: 0,
    fontSize: "27px",
    fontWeight: 800,
  },

  subtitle: {
    margin:
      "6px 0 0",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  refresh: {
    border: "none",
    borderRadius: "12px",
    padding:
      "9px 14px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  lock: {
    marginTop: "20px",
    padding: "35px 22px",
    borderRadius: "25px",
    textAlign: "center",
    backdropFilter:
      "blur(14px)",
  },

  lockIcon: {
    width: "65px",
    height: "65px",
    margin:
      "0 auto 15px",
    borderRadius: "20px",
    display: "grid",
    placeItems: "center",
    fontSize: "30px",
    background:
      "linear-gradient(135deg,rgba(37,99,235,0.15),rgba(124,58,237,0.15))",
  },

  planBadge: {
    display: "inline-block",
    padding:
      "8px 13px",
    borderRadius: "999px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
  },

  error: {
    padding: "13px",
    marginBottom: "14px",
    borderRadius: "15px",
    background:
      "rgba(239,68,68,0.1)",
    color: "#ef4444",
    fontSize: "12px",
  },

  rangeBox: {
    padding: "14px",
    borderRadius: "20px",
    marginBottom: "14px",
    backdropFilter:
      "blur(14px)",
  },

  sectionLabel: {
    margin:
      "0 0 3px",
    fontSize: "10px",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.06em",
  },

  rangeScroll: {
    display: "flex",
    gap: "6px",
    marginTop: "12px",
    overflowX: "auto",
    paddingBottom: "2px",
  },

  rangeButton: {
    border: "none",
    borderRadius: "11px",
    padding:
      "8px 11px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace:
      "nowrap",
  },

  rangeActive: {
    color: "#fff",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: "10px",
  },

  card: {
    padding: "15px",
    borderRadius: "21px",
    backdropFilter:
      "blur(14px)",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.06)",
  },

  cardIcon: {
    fontSize: "22px",
  },

  cardLabel: {
    margin:
      "8px 0 4px",
    fontSize: "10px",
  },

  cardValue: {
    fontSize: "20px",
  },

  chartBox: {
    marginTop: "14px",
    padding: "15px",
    borderRadius: "24px",
    backdropFilter:
      "blur(14px)",
  },

  chartHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "10px",
  },

  chartTitle: {
    margin: 0,
    fontSize: "16px",
  },

  recordsBadge: {
    padding:
      "6px 9px",
    borderRadius: "999px",
    background:
      "rgba(37,99,235,0.10)",
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: 700,
    whiteSpace:
      "nowrap",
  },

  legend: {
    display: "flex",
    justifyContent:
      "center",
    gap: "20px",
    marginTop: "-10px",
    fontSize: "10px",
  },

  legendDot: {
    width: "7px",
    height: "7px",
    display: "inline-block",
    borderRadius: "50%",
    marginRight: "5px",
  },

  pointDetails: {
    marginTop: "8px",
    padding: "12px",
    borderRadius: "15px",
    fontSize: "11px",
  },

  pointGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,1fr)",
    gap: "8px",
    marginTop: "9px",
  },

  insight: {
    display: "flex",
    gap: "10px",
    marginTop: "14px",
    padding: "14px",
    borderRadius: "18px",
    fontSize: "12px",
  },

  insightIcon: {
    fontSize: "20px",
  },

  dataSummary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,1fr)",
    gap: "10px",
    marginTop: "12px",
    padding: "15px",
    borderRadius: "20px",
    backdropFilter:
      "blur(14px)",
  },

  noData: {
    padding:
      "50px 10px",
    textAlign: "center",
    fontSize: "12px",
    opacity: 0.6,
  },
};