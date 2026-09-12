import { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
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
    subtle: isDark ? "#64748b" : "#94a3b8",
    border: isDark
      ? "rgba(255,255,255,0.09)"
      : "rgba(15,23,42,0.08)",
    line: isDark
      ? "rgba(255,255,255,0.08)"
      : "rgba(15,23,42,0.07)",
    surface: isDark ? "#0f172a" : "#ffffff",
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load profile");
    }

    return data;
  }

  async function fetchTelemetry() {
    const res = await fetch(`${API_URL}/api/telemetry/my-devices`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load telemetry");
    }

    return Array.isArray(data.data) ? data.data : [];
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
            (
              Number.isFinite(Number(item.temperature)) ||
              Number.isFinite(Number(item.humidity))
            )
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
        );

      setRecords(sorted);

      if (sorted.length) {
        setSelectedPoint(sorted[sorted.length - 1]);
      }
    } catch (err) {
      console.error("Analysis error:", err);

      setError(
        err.message || "Failed to load analysis"
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
  const analysisAllowed = canUseAnalysis(planName);

  const selectedRange =
    RANGES.find((item) => item.key === range) || RANGES[0];

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

    return records.filter(
      (item) =>
        new Date(item.createdAt).getTime() >= from
    );
  }, [records, selectedRange]);

  const chartData = useMemo(() => {
    return downsample(filteredRecords, 100);
  }, [filteredRecords]);

  const statistics = useMemo(() => {
    const temps = filteredRecords
      .map((item) => Number(item.temperature))
      .filter(Number.isFinite);

    const hums = filteredRecords
      .map((item) => Number(item.humidity))
      .filter(Number.isFinite);

    const average = (values) =>
      values.length
        ? values.reduce((sum, value) => sum + value, 0) /
          values.length
        : 0;

    return {
      avgTemp: average(temps),
      maxTemp: temps.length ? Math.max(...temps) : 0,
      minTemp: temps.length ? Math.min(...temps) : 0,

      avgHumidity: average(hums),
      maxHumidity: hums.length ? Math.max(...hums) : 0,
      minHumidity: hums.length ? Math.min(...hums) : 0,

      total: filteredRecords.length,
    };
  }, [filteredRecords]);

  const insight = useMemo(() => {
    const {
      avgTemp,
      avgHumidity,
    } = statistics;

    if (!filteredRecords.length) {
      return {
        type: "neutral",
        title: "No telemetry",
        text: "No telemetry data is available for this period.",
      };
    }

    if (avgTemp > 32 || avgTemp < 20) {
      return {
        type: "warning",
        title: "Temperature requires attention",
        text:
          "Average temperature is outside the configured 20°C–32°C range.",
      };
    }

    if (avgHumidity > 75 || avgHumidity < 40) {
      return {
        type: "warning",
        title: "Humidity requires attention",
        text:
          "Average humidity is outside the configured 40%–75% range.",
      };
    }

    return {
      type: "good",
      title: "Environment stable",
      text:
        "Temperature and humidity are currently within the configured operating range.",
    };
  }, [statistics, filteredRecords]);

  return (
    <div
      style={{
        ...styles.page,
        background: isDark
          ? "#020617"
          : "#f8fafc",
        color: theme.text,
      }}
    >
      <AppHeader title="Analysis" />

      <main style={styles.content}>
        {/* HEADER */}

        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Environmental Analysis
            </h1>

            <p
              style={{
                ...styles.subtitle,
                color: theme.muted,
              }}
            >
              Telemetry trends and system conditions
            </p>
          </div>

          {analysisAllowed && (
            <button
              type="button"
              onClick={() => loadAnalysis(true)}
              disabled={refreshing}
              style={{
                ...styles.refresh,
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              {refreshing ? "Syncing..." : "Sync"}
            </button>
          )}
        </header>

        {/* LOADING WITHOUT PAGELOADER */}

        {loading && (
          <div
            style={{
              ...styles.loadingLine,
              borderBottom: `1px solid ${theme.border}`,
              color: theme.muted,
            }}
          >
            Loading telemetry data...
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              ...styles.error,
              borderBottom: `1px solid rgba(239,68,68,0.25)`,
            }}
          >
            {error}
          </div>
        )}

        {/* PLAN LOCK */}

        {!loading && !analysisAllowed ? (
          <section
            style={{
              ...styles.lockSection,
              borderTop: `1px solid ${theme.border}`,
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <div style={styles.lockIcon}>
              🔒
            </div>

            <div>
              <h2 style={styles.lockTitle}>
                Analysis Locked
              </h2>

              <p
                style={{
                  ...styles.lockText,
                  color: theme.muted,
                }}
              >
                Upgrade to{" "}
                <strong>PRO</strong> or{" "}
                <strong>PREMIUM</strong> to access
                environmental analytics and historical
                telemetry data.
              </p>

              <div
                style={{
                  ...styles.currentPlan,
                  color: theme.muted,
                }}
              >
                Current plan:{" "}
                <strong style={{ color: theme.text }}>
                  {planName}
                </strong>
              </div>
            </div>
          </section>
        ) : (
          analysisAllowed && (
            <>
              {/* RANGE */}

              <section
                style={{
                  ...styles.rangeSection,
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <div style={styles.rangeHeader}>
                  <span
                    style={{
                      ...styles.rangeLabel,
                      color: theme.muted,
                    }}
                  >
                    Period
                  </span>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {selectedRange.label}
                  </span>
                </div>

                <div
                  style={{
                    ...styles.rangeScroll,
                    scrollbarColor: isDark
                      ? "#334155 transparent"
                      : "#cbd5e1 transparent",
                  }}
                >
                  {RANGES.map((item) => {
                    const active =
                      range === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setRange(item.key);
                          setSelectedPoint(null);
                        }}
                        style={{
                          ...styles.rangeButton,
                          color: active
                            ? "#ffffff"
                            : theme.muted,
                          background: active
                            ? "#2563eb"
                            : "transparent",
                          border: active
                            ? "1px solid #2563eb"
                            : `1px solid ${theme.border}`,
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* METRIC SUMMARY */}

              <section
                style={{
                  ...styles.summary,
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <Metric
                  label="Average temperature"
                  value={`${statistics.avgTemp.toFixed(1)}°C`}
                  color="#ef4444"
                  muted={theme.muted}
                />

                <Metric
                  label="Temperature range"
                  value={`${statistics.minTemp.toFixed(
                    1
                  )}° – ${statistics.maxTemp.toFixed(1)}°C`}
                  color="#f97316"
                  muted={theme.muted}
                />

                <Metric
                  label="Average humidity"
                  value={`${statistics.avgHumidity.toFixed(
                    1
                  )}%`}
                  color="#3b82f6"
                  muted={theme.muted}
                />

                <Metric
                  label="Humidity range"
                  value={`${statistics.minHumidity.toFixed(
                    1
                  )}% – ${statistics.maxHumidity.toFixed(
                    1
                  )}%`}
                  color="#06b6d4"
                  muted={theme.muted}
                />
              </section>

              {/* MAIN ANALYSIS */}

              <section style={styles.analysisSection}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>
                      Climate timeline
                    </h2>

                    <p
                      style={{
                        ...styles.sectionDescription,
                        color: theme.muted,
                      }}
                    >
                      Temperature and humidity recorded
                      during the selected period.
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.recordCount,
                      color: theme.muted,
                    }}
                  >
                    {statistics.total} records
                  </span>
                </div>

                {chartData.length ? (
                  <TelemetryChart
                    data={chartData}
                    dark={isDark}
                    selectedPoint={selectedPoint}
                    onSelectPoint={setSelectedPoint}
                    range={range}
                    theme={theme}
                  />
                ) : (
                  <div
                    style={{
                      ...styles.noData,
                      color: theme.muted,
                      borderTop: `1px solid ${theme.border}`,
                    }}
                  >
                    No telemetry records available for
                    this period.
                  </div>
                )}
              </section>

              {/* DETAIL */}

              <section
                style={{
                  ...styles.detailSection,
                  borderTop: `1px solid ${theme.border}`,
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>
                      Telemetry detail
                    </h2>

                    <p
                      style={{
                        ...styles.sectionDescription,
                        color: theme.muted,
                      }}
                    >
                      Selected measurement
                    </p>
                  </div>
                </div>

                {selectedPoint ? (
                  <TelemetryDetail
                    point={selectedPoint}
                    theme={theme}
                  />
                ) : (
                  <div
                    style={{
                      ...styles.emptyDetail,
                      color: theme.muted,
                    }}
                  >
                    Select a point on the chart to inspect
                    its telemetry.
                  </div>
                )}
              </section>

              {/* SYSTEM NOTE */}

              <section
                style={{
                  ...styles.insightSection,
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <div
                  style={{
                    ...styles.insightIndicator,
                    background:
                      insight.type === "warning"
                        ? "#f59e0b"
                        : insight.type === "good"
                        ? "#22c55e"
                        : "#64748b",
                  }}
                />

                <div>
                  <strong style={styles.insightTitle}>
                    {insight.title}
                  </strong>

                  <p
                    style={{
                      ...styles.insightText,
                      color: theme.muted,
                    }}
                  >
                    {insight.text}
                  </p>
                </div>
              </section>
            </>
          )
        )}
      </main>

      <BottomNav />
    </div>
  );
}

/* =====================================================
   METRIC
===================================================== */

function Metric({
  label,
  value,
  color,
  muted,
}) {
  return (
    <div style={styles.metric}>
      <span
        style={{
          ...styles.metricLabel,
          color: muted,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          ...styles.metricValue,
          color,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/* =====================================================
   TELEMETRY CHART
===================================================== */

function TelemetryChart({
  data,
  dark,
  selectedPoint,
  onSelectPoint,
  range,
  theme,
}) {
  const width = 760;
  const height = 330;

  const padding = {
    left: 48,
    right: 48,
    top: 30,
    bottom: 45,
  };

  const chartWidth =
    width -
    padding.left -
    padding.right;

  const chartHeight =
    height -
    padding.top -
    padding.bottom;

  const temps = data
    .map((item) => Number(item.temperature))
    .filter(Number.isFinite);

  const hums = data
    .map((item) => Number(item.humidity))
    .filter(Number.isFinite);

  const minTemp = temps.length
    ? Math.floor(Math.min(...temps) - 2)
    : 15;

  const maxTemp = temps.length
    ? Math.ceil(Math.max(...temps) + 2)
    : 40;

  const minHumidity = hums.length
    ? Math.max(
        0,
        Math.floor(Math.min(...hums) - 5)
      )
    : 0;

  const maxHumidity = hums.length
    ? Math.min(
        100,
        Math.ceil(Math.max(...hums) + 5)
      )
    : 100;

  const getX = (index) =>
    padding.left +
    (index / Math.max(data.length - 1, 1)) *
      chartWidth;

  const getTemperatureY = (value) =>
    padding.top +
    chartHeight -
    ((value - minTemp) /
      Math.max(maxTemp - minTemp, 1)) *
      chartHeight;

  const getHumidityY = (value) =>
    padding.top +
    chartHeight -
    ((value - minHumidity) /
      Math.max(
        maxHumidity - minHumidity,
        1
      )) *
      chartHeight;

  const createPath = (
    getter,
    field
  ) => {
    const points = data
      .map((item, index) => {
        const value = Number(item[field]);

        if (!Number.isFinite(value)) {
          return null;
        }

        return {
          x: getX(index),
          y: getter(value),
        };
      })
      .filter(Boolean);

    if (!points.length) return "";

    return points
      .map((point, index) =>
        index === 0
          ? `M ${point.x} ${point.y}`
          : `L ${point.x} ${point.y}`
      )
      .join(" ");
  };

  const temperaturePath =
    createPath(
      getTemperatureY,
      "temperature"
    );

  const humidityPath =
    createPath(
      getHumidityY,
      "humidity"
    );

  const activeIndex = selectedPoint
    ? data.findIndex(
        (item) =>
          item.createdAt ===
          selectedPoint.createdAt
      )
    : -1;

  const handlePointer = (event) => {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const clientX =
      event.touches?.[0]?.clientX ??
      event.clientX;

    const localX =
      clientX - rect.left;

    const svgX =
      (localX / rect.width) * width;

    let index = Math.round(
      ((svgX - padding.left) /
        chartWidth) *
        (data.length - 1)
    );

    index = Math.max(
      0,
      Math.min(
        data.length - 1,
        index
      )
    );

    onSelectPoint(data[index]);
  };

  const yTickCount = 5;

  return (
    <div
      style={{
        ...styles.chartContainer,
        borderTop: `1px solid ${theme.border}`,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <div
        style={{
          ...styles.chartLegend,
          color: theme.muted,
        }}
      >
        <span>
          <i
            style={{
              ...styles.legendLine,
              background: "#ef4444",
            }}
          />
          Temperature
        </span>

        <span>
          <i
            style={{
              ...styles.legendLine,
              background: "#3b82f6",
            }}
          />
          Humidity
        </span>
      </div>

      <div style={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={styles.svg}
          onMouseDown={handlePointer}
          onTouchStart={handlePointer}
          onTouchMove={handlePointer}
        >
          {/* GRID */}

          {Array.from({
            length: yTickCount,
          }).map((_, index) => {
            const ratio =
              index /
              (yTickCount - 1);

            const y =
              padding.top +
              chartHeight * ratio;

            const tempValue =
              maxTemp -
              (maxTemp - minTemp) *
                ratio;

            const humidityValue =
              maxHumidity -
              (maxHumidity -
                minHumidity) *
                ratio;

            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  x2={
                    width -
                    padding.right
                  }
                  y1={y}
                  y2={y}
                  stroke={
                    dark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(15,23,42,0.07)"
                  }
                  strokeDasharray="3 5"
                />

                <text
                  x={
                    padding.left -
                    8
                  }
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#ef4444"
                >
                  {Math.round(
                    tempValue
                  )}°
                </text>

                <text
                  x={
                    width -
                    padding.right +
                    8
                  }
                  y={y + 3}
                  textAnchor="start"
                  fontSize="10"
                  fill="#3b82f6"
                >
                  {Math.round(
                    humidityValue
                  )}%
                </text>
              </g>
            );
          })}

          {/* TEMPERATURE LINE */}

          {temperaturePath && (
            <path
              d={temperaturePath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* HUMIDITY LINE */}

          {humidityPath && (
            <path
              d={humidityPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* DATA POINTS */}

          {data.map(
            (item, index) => {
              const temp =
                Number(
                  item.temperature
                );

              const humidity =
                Number(
                  item.humidity
                );

              return (
                <g
                  key={
                    item.createdAt ||
                    index
                  }
                >
                  {Number.isFinite(
                    temp
                  ) && (
                    <circle
                      cx={getX(index)}
                      cy={getTemperatureY(
                        temp
                      )}
                      r={
                        activeIndex ===
                        index
                          ? 5
                          : 2.5
                      }
                      fill="#ef4444"
                    />
                  )}

                  {Number.isFinite(
                    humidity
                  ) && (
                    <circle
                      cx={getX(index)}
                      cy={getHumidityY(
                        humidity
                      )}
                      r={
                        activeIndex ===
                        index
                          ? 5
                          : 2.5
                      }
                      fill="#3b82f6"
                    />
                  )}
                </g>
              );
            }
          )}

          {/* ACTIVE CROSSHAIR */}

          {activeIndex !== -1 && (
            <line
              x1={getX(activeIndex)}
              x2={getX(activeIndex)}
              y1={padding.top}
              y2={
                padding.top +
                chartHeight
              }
              stroke={
                dark
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(15,23,42,0.25)"
              }
              strokeWidth="1"
              strokeDasharray="4 4"
            />
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
                14
              }
              textAnchor="middle"
              fontSize="10"
              fill={
                dark
                  ? "#64748b"
                  : "#94a3b8"
              }
            >
              {item.label}
            </text>
          ))}
        </svg>
      </div>

      {/* SELECTED DATA */}

      {selectedPoint && (
        <div
          style={{
            ...styles.selectedTelemetry,
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <div>
            <span
              style={{
                ...styles.selectedDate,
                color: theme.muted,
              }}
            >
              {formatDateTime(
                selectedPoint.createdAt
              )}
            </span>

            <strong
              style={styles.selectedTitle}
            >
              Selected measurement
            </strong>
          </div>

          <div
            style={
              styles.selectedValues
            }
          >
            <span
              style={{
                color: "#ef4444",
                fontWeight: 700,
              }}
            >
              {selectedPoint.temperature ??
                "—"}
              °C
            </span>

            <span
              style={{
                color: "#3b82f6",
                fontWeight: 700,
              }}
            >
              {selectedPoint.humidity ??
                "—"}
              %
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   TELEMETRY DETAIL
===================================================== */

function TelemetryDetail({
  point,
  theme,
}) {
  return (
    <div style={styles.detailGrid}>
      <DetailItem
        label="Recorded"
        value={formatDateTime(
          point.createdAt
        )}
        theme={theme}
      />

      <DetailItem
        label="Temperature"
        value={
          point.temperature !==
          undefined
            ? `${point.temperature}°C`
            : "—"
        }
        valueColor="#ef4444"
        theme={theme}
      />

      <DetailItem
        label="Humidity"
        value={
          point.humidity !==
          undefined
            ? `${point.humidity}%`
            : "—"
        }
        valueColor="#3b82f6"
        theme={theme}
      />

      <DetailItem
        label="Device"
        value={
          point.deviceId ||
          point.deviceName ||
          point.nodeId ||
          "—"
        }
        theme={theme}
      />

      <DetailItem
        label="Gateway"
        value={
          point.gatewayId ||
          point.gatewayName ||
          "—"
        }
        theme={theme}
      />

      <DetailItem
        label="Status"
        value={
          point.status ||
          point.deviceStatus ||
          "Telemetry received"
        }
        theme={theme}
      />
    </div>
  );
}

/* =====================================================
   DETAIL ITEM
===================================================== */

function DetailItem({
  label,
  value,
  valueColor,
  theme,
}) {
  return (
    <div
      style={{
        ...styles.detailItem,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <span
        style={{
          ...styles.detailLabel,
          color: theme.muted,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          ...styles.detailValue,
          color:
            valueColor || theme.text,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function downsample(
  records,
  maxPoints
) {
  if (
    records.length <=
    maxPoints
  ) {
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
  if (!data.length) {
    return [];
  }

  const count = 6;
  const result = [];

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const index = Math.round(
      (i /
        (count - 1)) *
        (data.length - 1)
    );

    const item = data[index];

    if (!item) continue;

    const date =
      new Date(
        item.createdAt
      );

    let label;

    if (range === "day") {
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
            month: "short",
            day: "numeric",
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
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* =====================================================
   STYLES
===================================================== */

const styles = {
  page: {
    minHeight: "100vh",
    padding: "16px",
    paddingBottom: "100px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
  },

  content: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },

  subtitle: {
    margin: "4px 0 0",
    fontSize: "11px",
  },

  refresh: {
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  loadingLine: {
    padding:
      "10px 0",
    fontSize: "11px",
    marginBottom: "12px",
  },

  error: {
    padding:
      "10px 0",
    marginBottom: "12px",
    color: "#ef4444",
    fontSize: "12px",
  },

  lockSection: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "28px 0",
  },

  lockIcon: {
    fontSize: "32px",
    flexShrink: 0,
  },

  lockTitle: {
    margin: "0 0 6px",
    fontSize: "17px",
  },

  lockText: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.6,
  },

  currentPlan: {
    marginTop: "10px",
    fontSize: "11px",
  },

  rangeSection: {
    padding:
      "12px 0 16px",
  },

  rangeHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  rangeLabel: {
    fontSize: "10px",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.08em",
    fontWeight: 700,
  },

  rangeScroll: {
    display: "flex",
    gap: "6px",
    overflowX: "auto",
    paddingBottom: "2px",
  },

  rangeButton: {
    flexShrink: 0,
    borderRadius: "7px",
    padding:
      "6px 11px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace:
      "nowrap",
  },

  summary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    padding:
      "18px 0",
  },

  metric: {
    minWidth: 0,
  },

  metricLabel: {
    display: "block",
    fontSize: "10px",
    lineHeight: 1.4,
    marginBottom: "5px",
  },

  metricValue: {
    display: "block",
    fontSize: "18px",
    fontWeight: 800,
    lineHeight: 1.2,
  },

  analysisSection: {
    paddingTop: "6px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "12px",
    marginBottom: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 800,
  },

  sectionDescription: {
    margin:
      "3px 0 0",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  recordCount: {
    fontSize: "10px",
    whiteSpace:
      "nowrap",
  },

  chartContainer: {
    padding:
      "12px 0 0",
  },

  chartLegend: {
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "14px",
    fontSize: "10px",
    marginBottom: "4px",
  },

  legendLine: {
    width: "18px",
    height: "3px",
    display:
      "inline-block",
    borderRadius: "2px",
    marginRight: "5px",
    verticalAlign:
      "middle",
  },

  svgWrapper: {
    width: "100%",
    overflowX:
      "auto",
    overflowY:
      "hidden",
  },

  svg: {
    width: "100%",
    minWidth: "620px",
    height: "auto",
    display: "block",
    touchAction:
      "none",
  },

  selectedTelemetry: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "16px",
    padding:
      "12px 0",
  },

  selectedDate: {
    display: "block",
    fontSize: "10px",
    marginBottom:
      "3px",
  },

  selectedTitle: {
    display: "block",
    fontSize: "11px",
  },

  selectedValues: {
    display: "flex",
    gap: "14px",
    fontSize: "12px",
    whiteSpace:
      "nowrap",
  },

  noData: {
    padding:
      "40px 0",
    textAlign:
      "center",
    fontSize: "12px",
  },

  detailSection: {
    marginTop: "24px",
    padding:
      "18px 0",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    columnGap: "24px",
  },

  detailItem: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "12px",
    padding:
      "11px 0",
  },

  detailLabel: {
    fontSize: "10px",
    flexShrink: 0,
  },

  detailValue: {
    fontSize: "11px",
    textAlign:
      "right",
    wordBreak:
      "break-word",
  },

  emptyDetail: {
    padding:
      "20px 0",
    fontSize: "11px",
  },

  insightSection: {
    display: "flex",
    gap: "12px",
    alignItems:
      "flex-start",
    padding:
      "18px 0",
  },

  insightIndicator: {
    width: "7px",
    height: "7px",
    borderRadius:
      "50%",
    marginTop: "5px",
    flexShrink: 0,
  },

  insightTitle: {
    fontSize: "12px",
  },

  insightText: {
    margin:
      "4px 0 0",
    fontSize: "11px",
    lineHeight: 1.5,
  },
};

/* =====================================================
   RESPONSIVE
===================================================== */

if (
  typeof document !==
  "undefined"
) {
  const styleId =
    "analysis-responsive-styles";

  if (
    !document.getElementById(
      styleId
    )
  ) {
    const style =
      document.createElement(
        "style"
      );

    style.id = styleId;

    style.textContent = `
      @media (max-width: 700px) {
        .analysis-summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 600px) {
        body {
          overflow-x: hidden;
        }
      }

      @media (max-width: 520px) {
        .analysis-detail-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }
}