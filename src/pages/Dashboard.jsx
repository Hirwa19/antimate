import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
  Thermometer,
  Droplets,
  Flame,
  Wind,
  Activity,
  Power,
  BarChart3,
} from "lucide-react";

import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { useAppSettings } from "../context/AppSettingsContext";

const API =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const socket = io(API, {
  transports: ["websocket", "polling"],
});

const DEVICE_TIMEOUT = 3 * 60 * 1000;
const CHART_WINDOW = 120 * 60 * 1000;

function Dashboard() {
  const { isDark } = useAppSettings();

  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    heater: "OFF",
    fanSpeed: 0,
    condition: "NORMAL",
    chicksAge: null,
  });

  const [history, setHistory] = useState([]);
  const [lastActivity, setLastActivity] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [now, setNow] = useState(Date.now());

  // =====================================================
  // UPDATE TIME
  // =====================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const getTimestamp = (telemetry) => {
    const timestamp =
      telemetry?.heartbeatAt ||
      telemetry?.lastHeartbeat ||
      telemetry?.heartbeat ||
      telemetry?.createdAt ||
      telemetry?.timestamp ||
      telemetry?.updatedAt;

    if (!timestamp) {
      return Date.now();
    }

    const parsed = new Date(timestamp).getTime();

    return Number.isNaN(parsed)
      ? Date.now()
      : parsed;
  };

  const getChicksAge = (telemetry) => {
    const directAge =
      telemetry?.chicksAge ??
      telemetry?.chickAge ??
      telemetry?.ageDays ??
      telemetry?.dayAge ??
      telemetry?.flockAge ??
      telemetry?.chickenAge;

    if (
      directAge !== undefined &&
      directAge !== null &&
      directAge !== ""
    ) {
      const age = Number(directAge);

      if (!Number.isNaN(age)) {
        return age;
      }
    }

    const birthDate =
      telemetry?.birthDate ||
      telemetry?.chicksBirthDate ||
      telemetry?.flockBirthDate;

    if (birthDate) {
      const birth = new Date(birthDate).getTime();

      if (!Number.isNaN(birth)) {
        return Math.max(
          0,
          Math.floor(
            (Date.now() - birth) /
              (24 * 60 * 60 * 1000)
          )
        );
      }
    }

    return null;
  };

  // =====================================================
  // UPDATE TELEMETRY
  // =====================================================

  const updateTelemetry = (telemetry) => {
    if (!telemetry) return;

    const temperature = Number(
      telemetry.temperature ??
        telemetry.temp ??
        telemetry.t ??
        0
    );

    const humidity = Number(
      telemetry.humidity ??
        telemetry.rh ??
        telemetry.h ??
        0
    );

    const fanSpeed = Number(
      telemetry.fanSpeed ??
        telemetry.fan ??
        telemetry.fanPercent ??
        0
    );

    const heater =
      telemetry.heater ??
      telemetry.heaterStatus ??
      "OFF";

    const condition =
      telemetry.condition ||
      telemetry.status ||
      "NORMAL";

    const timestamp =
      getTimestamp(telemetry);

    const chicksAge =
      getChicksAge(telemetry);

    setData({
      temperature,
      humidity,
      heater,
      fanSpeed,
      condition,
      chicksAge,
    });

    setLastActivity(timestamp);

    setHistory((previous) => {
      const point = {
        timestamp,
        temperature,
        humidity,
      };

      const existingIndex =
        previous.findIndex(
          (item) =>
            Math.abs(
              item.timestamp -
                timestamp
            ) < 1000
        );

      let next;

      if (existingIndex >= 0) {
        next = [...previous];
        next[existingIndex] = point;
      } else {
        next = [
          ...previous,
          point,
        ];
      }

      const cutoff =
        Date.now() - CHART_WINDOW;

      return next
        .filter(
          (item) =>
            item.timestamp >= cutoff
        )
        .sort(
          (a, b) =>
            a.timestamp -
            b.timestamp
        );
    });
  };

  // =====================================================
  // TELEMETRY
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const user = JSON.parse(
      localStorage.getItem("user") ||
        "null"
    );

    const userId =
      user?._id || user?.id;

    // ---------------------------------------------------
    // SOCKET CONNECT
    // ---------------------------------------------------

    const handleConnect = () => {
      console.log(
        "🟢 Dashboard Socket Connected"
      );

      setSocketConnected(true);

      if (userId) {
        socket.emit(
          "join-user",
          userId
        );
      }
    };

    const handleDisconnect = () => {
      console.log(
        "🔴 Dashboard Socket Disconnected"
      );

      setSocketConnected(false);
    };

    // ---------------------------------------------------
    // LIVE TELEMETRY
    // ---------------------------------------------------

    const handleTelemetry = (
      telemetry
    ) => {
      console.log(
        "📡 Live telemetry:",
        telemetry
      );

      updateTelemetry(telemetry);
    };

    // ---------------------------------------------------
    // LOAD LATEST
    // ---------------------------------------------------

    const loadTelemetry = async () => {
      if (!token) {
        console.warn(
          "⚠️ No authentication token"
        );
        return;
      }

      try {
        const response =
          await axios.get(
            `${API}/api/telemetry/latest`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const telemetry =
          response.data?.data ||
          response.data;

        if (!telemetry) {
          console.log(
            "ℹ️ No telemetry available yet"
          );

          return;
        }

        console.log(
          "📡 Latest telemetry:",
          telemetry
        );

        updateTelemetry(
          telemetry
        );
      } catch (error) {
        console.error(
          "❌ TELEMETRY LOAD ERROR:",
          error.response?.data ||
            error.message
        );
      }
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "telemetry:update",
      handleTelemetry
    );

    if (socket.connected) {
      handleConnect();
    }

    loadTelemetry();

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "telemetry:update",
        handleTelemetry
      );
    };
  }, []);

  // =====================================================
  // DEVICE STATUS
  // =====================================================

  const deviceOnline = useMemo(() => {
    if (!lastActivity) {
      return false;
    }

    return (
      now - lastActivity <=
      DEVICE_TIMEOUT
    );
  }, [
    lastActivity,
    now,
  ]);

  // =====================================================
  // LAST SEEN
  // =====================================================

  const lastSeenText = useMemo(() => {
    if (!lastActivity) {
      return "No data received";
    }

    const seconds = Math.floor(
      (now - lastActivity) /
        1000
    );

    if (seconds < 10) {
      return "Just now";
    }

    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    const minutes = Math.floor(
      seconds / 60
    );

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    return `${hours}h ago`;
  }, [
    lastActivity,
    now,
  ]);

  // =====================================================
  // VALUES
  // =====================================================

  const temperature = Number(
    data.temperature || 0
  );

  const humidity = Number(
    data.humidity || 0
  );

  const heaterOn =
    data.heater === "ON" ||
    data.heater === 1 ||
    data.heater === true;

  const fanValue = Math.max(
    0,
    Math.min(
      100,
      Number(data.fanSpeed || 0)
    )
  );

  const conditionText =
    data.condition || "NORMAL";

  // =====================================================
  // CHICKS AGE
  // =====================================================

  const chicksAgeText =
    data.chicksAge === null ||
    data.chicksAge === undefined
      ? "—"
      : `${Number(
          data.chicksAge
        ).toFixed(0)} days`;

  // =====================================================
  // THEME
  // =====================================================

  const bg = isDark
    ? "#0f172a"
    : "#f8fafc";

  const text = isDark
    ? "#f8fafc"
    : "#0f172a";

  const muted = isDark
    ? "#94a3b8"
    : "#64748b";

  const softBg = isDark
    ? "rgba(30,41,59,0.72)"
    : "rgba(255,255,255,0.78)";

  const border = isDark
    ? "rgba(148,163,184,0.14)"
    : "rgba(15,23,42,0.08)";

  // =====================================================
  // CHART
  // =====================================================

  const chart = useMemo(() => {
    const width = 360;
    const height = 150;

    const left = 42;
    const right = 10;
    const top = 12;
    const bottom = 28;

    const plotWidth =
      width - left - right;

    const plotHeight =
      height - top - bottom;

    const cutoff =
      now - CHART_WINDOW;

    const points = history
      .filter(
        (item) =>
          item.timestamp >= cutoff
      )
      .sort(
        (a, b) =>
          a.timestamp -
          b.timestamp
      );

    let values = points.map(
      (item) =>
        Number(item.temperature)
    );

    if (!values.length) {
      values = [temperature || 25];
    }

    let minTemp =
      Math.floor(
        Math.min(...values) - 1
      );

    let maxTemp =
      Math.ceil(
        Math.max(...values) + 1
      );

    if (
      maxTemp - minTemp <
      4
    ) {
      const middle =
        (maxTemp + minTemp) / 2;

      minTemp =
        Math.floor(
          middle - 2
        );

      maxTemp =
        Math.ceil(
          middle + 2
        );
    }

    const tempRange =
      maxTemp - minTemp;

    const getX = (timestamp) => {
      const position =
        (timestamp - cutoff) /
        CHART_WINDOW;

      return (
        left +
        Math.max(
          0,
          Math.min(
            1,
            position
          )
        ) *
          plotWidth
      );
    };

    const getY = (value) => {
      const position =
        (value - minTemp) /
        tempRange;

      return (
        top +
        (1 - position) *
          plotHeight
      );
    };

    const polyline = points
      .map(
        (point) =>
          `${getX(
            point.timestamp
          )},${getY(
            point.temperature
          )}`
      )
      .join(" ");

    const last =
      points.length
        ? points[
            points.length - 1
          ]
        : null;

    const lastX = last
      ? getX(last.timestamp)
      : null;

    const lastY = last
      ? getY(last.temperature)
      : null;

    const yTicks = [
      maxTemp,
      Math.round(
        minTemp +
          tempRange * 0.66
      ),
      Math.round(
        minTemp +
          tempRange * 0.33
      ),
      minTemp,
    ];

    const xTicks = [
      {
        label: "120m",
        ratio: 0,
      },
      {
        label: "90m",
        ratio: 0.25,
      },
      {
        label: "60m",
        ratio: 0.5,
      },
      {
        label: "30m",
        ratio: 0.75,
      },
      {
        label: "Now",
        ratio: 1,
      },
    ];

    return {
      width,
      height,
      left,
      right,
      top,
      bottom,
      plotWidth,
      plotHeight,
      polyline,
      lastX,
      lastY,
      yTicks,
      xTicks,
      minTemp,
      maxTemp,
      points,
    };
  }, [
    history,
    now,
    temperature,
  ]);

  // =====================================================
  // INFO ROW
  // =====================================================

  const InfoRow = ({
    icon,
    label,
    value,
    extra,
    valueColor,
  }) => (
    <div
      style={{
        ...styles.infoRow,
        background: softBg,
        border: `1px solid ${border}`,
      }}
    >
      <div style={styles.infoLeft}>
        <div style={styles.iconBox}>
          {icon}
        </div>

        <div>
          <p
            style={{
              ...styles.label,
              color: muted,
            }}
          >
            {label}
          </p>

          <h3
            style={{
              ...styles.value,
              color:
                valueColor || text,
            }}
          >
            {value}
          </h3>
        </div>
      </div>

      {extra && (
        <span
          style={{
            ...styles.extra,
            color: muted,
          }}
        >
          {extra}
        </span>
      )}
    </div>
  );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        ...styles.page,
        background: bg,
        color: text,
      }}
    >
      <style>
        {`
          @keyframes moveLine {
            0% {
              transform: translateX(-55%);
            }

            100% {
              transform: translateX(55%);
            }
          }
        `}
      </style>

      <AppHeader title="Dashboard" />

      <main style={styles.content}>
        {/* HERO */}

        <section style={styles.hero}>
          <div>
            <p
              style={{
                ...styles.smallText,
                color: muted,
              }}
            >
              Live brooder status
            </p>

            <h2 style={styles.title}>
              ANTIMATE Edge
            </h2>
          </div>

          <div
            style={{
              ...styles.statusPill,
              background:
                deviceOnline
                  ? "rgba(34,197,94,0.14)"
                  : "rgba(239,68,68,0.14)",
              color:
                deviceOnline
                  ? "#22c55e"
                  : "#ef4444",
              border:
                deviceOnline
                  ? "1px solid rgba(34,197,94,0.22)"
                  : "1px solid rgba(239,68,68,0.22)",
            }}
          >
            <Activity size={14} />

            <span>
              {deviceOnline
                ? "Online"
                : "Offline"}
            </span>
          </div>
        </section>

        {/* QUICK STATS */}

        <section
          style={styles.quickStats}
        >
          <div style={styles.bigStat}>
            <Thermometer size={18} />

            <div>
              <p
                style={styles.whiteLabel}
              >
                Temperature
              </p>

              <h1
                style={styles.bigValue}
              >
                {temperature.toFixed(
                  1
                )}
                °C
              </h1>
            </div>
          </div>

          <div style={styles.bigStat}>
            <Droplets size={18} />

            <div>
              <p
                style={styles.whiteLabel}
              >
                Humidity
              </p>

              <h1
                style={styles.bigValue}
              >
                {humidity.toFixed(1)}
                %
              </h1>
            </div>
          </div>
        </section>

        {/* CHICKS AGE */}

        <section
          style={{
            ...styles.ageCard,
            background: softBg,
            border: `1px solid ${border}`,
          }}
        >
          <div>
            <p
              style={{
                ...styles.label,
                color: muted,
              }}
            >
              Chicks age
            </p>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: "21px",
              }}
            >
              {chicksAgeText}
            </h2>
          </div>

          <div
            style={{
              ...styles.ageIndicator,
              background:
                deviceOnline
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(239,68,68,0.12)",
              color:
                deviceOnline
                  ? "#22c55e"
                  : "#ef4444",
            }}
          >
            {deviceOnline
              ? "Device active"
              : "Device offline"}
          </div>
        </section>

        {/* TEMPERATURE CHART */}

        <section
          style={{
            ...styles.chartBox,
            background: softBg,
            border: `1px solid ${border}`,
          }}
        >
          <div
            style={styles.chartHeader}
          >
            <div>
              <p
                style={{
                  ...styles.label,
                  color: muted,
                }}
              >
                Temperature
              </p>

              <h3
                style={{
                  ...styles.chartTitle,
                  color: text,
                }}
              >
                Last 120 minutes
              </h3>
            </div>

            <span
              style={{
                ...styles.extra,
                color: muted,
              }}
            >
              {chart.points.length} readings
            </span>
          </div>

          <div style={styles.chartWrapper}>
            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              style={styles.svg}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="trendGradient"
                  x1="0"
                  x2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#2563eb"
                  />

                  <stop
                    offset="100%"
                    stopColor="#7c3aed"
                  />
                </linearGradient>
              </defs>

              {/* Y GRID */}

              {chart.yTicks.map(
                (value, index) => {
                  const y =
                    chart.top +
                    (index /
                      (chart.yTicks
                        .length -
                        1)) *
                      chart.plotHeight;

                  return (
                    <g
                      key={
                        `y-${index}`
                      }
                    >
                      <line
                        x1={chart.left}
                        x2={
                          chart.width -
                          chart.right
                        }
                        y1={y}
                        y2={y}
                        stroke={
                          isDark
                            ? "rgba(148,163,184,0.10)"
                            : "rgba(15,23,42,0.08)"
                        }
                        strokeWidth="1"
                      />

                      <text
                        x="3"
                        y={
                          y + 4
                        }
                        fontSize="9"
                        fill={muted}
                      >
                        {value}°
                      </text>
                    </g>
                  );
                }
              )}

              {/* X AXIS */}

              <line
                x1={chart.left}
                x2={
                  chart.width -
                  chart.right
                }
                y1={
                  chart.top +
                  chart.plotHeight
                }
                y2={
                  chart.top +
                  chart.plotHeight
                }
                stroke={
                  isDark
                    ? "rgba(148,163,184,0.25)"
                    : "rgba(15,23,42,0.15)"
                }
              />

              {/* X LABELS */}

              {chart.xTicks.map(
                (tick) => {
                  const x =
                    chart.left +
                    tick.ratio *
                      chart.plotWidth;

                  return (
                    <text
                      key={
                        tick.label
                      }
                      x={x}
                      y={
                        chart.height -
                        7
                      }
                      textAnchor="middle"
                      fontSize="9"
                      fill={muted}
                    >
                      {tick.label}
                    </text>
                  );
                }
              )}

              {/* TEMPERATURE LINE */}

              {chart.polyline && (
                <polyline
                  points={
                    chart.polyline
                  }
                  fill="none"
                  stroke="url(#trendGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* LAST POINT */}

              {chart.lastX !==
                null && (
                <>
                  <circle
                    cx={
                      chart.lastX
                    }
                    cy={
                      chart.lastY
                    }
                    r="7"
                    fill="rgba(124,58,237,0.18)"
                  />

                  <circle
                    cx={
                      chart.lastX
                    }
                    cy={
                      chart.lastY
                    }
                    r="4"
                    fill="#7c3aed"
                  />
                </>
              )}
            </svg>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginTop: "2px",
              fontSize: "10px",
              color: muted,
            }}
          >
            <span>
              Temperature °C
            </span>

            <span>
              Time
            </span>
          </div>
        </section>

        {/* DEVICE STATUS */}

        <section
          style={styles.deviceSection}
        >
          <InfoRow
            icon={
              <Power size={17} />
            }
            label="Device status"
            value={
              deviceOnline
                ? "Online"
                : "Offline"
            }
            valueColor={
              deviceOnline
                ? "#22c55e"
                : "#ef4444"
            }
            extra={
              deviceOnline
                ? "data received"
                : lastActivity
                ? `last ${lastSeenText}`
                : "no data"
            }
          />

          <InfoRow
            icon={
              <Flame size={17} />
            }
            label="Heater"
            value={
              heaterOn
                ? "ON"
                : "OFF"
            }
            valueColor={
              heaterOn
                ? "#f59e0b"
                : undefined
            }
            extra={
              heaterOn
                ? "heating"
                : "standby"
            }
          />

          <InfoRow
            icon={
              <Wind size={17} />
            }
            label="Fan"
            value={`${fanValue}%`}
            extra={
              fanValue > 0
                ? "running"
                : "off"
            }
          />
        </section>

        {/* CONNECTION DETAILS */}

        <section
          style={{
            ...styles.connectionCard,
            background: softBg,
            border: `1px solid ${border}`,
          }}
        >
          <div>
            <p
              style={{
                ...styles.label,
                color: muted,
              }}
            >
              Device heartbeat
            </p>

            <strong
              style={{
                fontSize: "14px",
              }}
            >
              {deviceOnline
                ? "Receiving data normally"
                : "No recent heartbeat or telemetry"}
            </strong>
          </div>

          <span
            style={{
              fontSize: "11px",
              color: muted,
            }}
          >
            {lastSeenText}
          </span>
        </section>

        {/* ANALYSIS BUTTON */}

        <button
          onClick={() =>
            window.location.href =
              "/analysis"
          }
          style={styles.analysisButton}
        >
          <BarChart3 size={18} />

          <span>
            View detailed analysis
          </span>
        </button>
      </main>

      {/* BOTTOM ANIMATION */}

      <div
        style={
          styles.bottomLineWrap
        }
      >
        <div
          style={styles.bottomLine}
        />
      </div>

      <BottomNav />
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    paddingBottom: "95px",
    overflowX: "hidden",
  },

  content: {
    padding: "18px",
    maxWidth: "520px",
    margin: "0 auto",
  },

  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "12px",
    marginBottom: "18px",
  },

  smallText: {
    margin: 0,
    fontSize: "12px",
  },

  title: {
    margin: "3px 0 0",
    fontSize: "22px",
    fontWeight: 700,
  },

  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  quickStats: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "12px",
    marginBottom: "12px",
  },

  bigStat: {
    minHeight: "112px",
    borderRadius: "26px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent:
      "space-between",
    background:
      "linear-gradient(145deg,#2563eb,#7c3aed)",
    color: "white",
    boxShadow:
      "0 18px 35px rgba(37,99,235,0.22)",
  },

  whiteLabel: {
    margin: 0,
    fontSize: "11px",
    fontWeight: 500,
    opacity: 0.85,
  },

  bigValue: {
    margin: "5px 0 0",
    fontSize: "25px",
    fontWeight: 750,
  },

  ageCard: {
    minHeight: "68px",
    borderRadius: "22px",
    padding: "13px 15px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "10px",
    marginBottom: "14px",
    backdropFilter: "blur(12px)",
  },

  ageIndicator: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  label: {
    margin: 0,
    fontSize: "11px",
    fontWeight: 500,
  },

  chartBox: {
    borderRadius: "26px",
    padding: "15px",
    marginBottom: "14px",
    backdropFilter:
      "blur(12px)",
  },

  chartHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  chartTitle: {
    margin: "3px 0 0",
    fontSize: "15px",
  },

  chartWrapper: {
    width: "100%",
    overflow: "hidden",
  },

  svg: {
    width: "100%",
    height: "160px",
    display: "block",
    overflow: "visible",
  },

  deviceSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  infoRow: {
    minHeight: "62px",
    borderRadius: "22px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "10px",
    backdropFilter:
      "blur(12px)",
  },

  infoLeft: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    minWidth: 0,
  },

  iconBox: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg,rgba(37,99,235,0.18),rgba(124,58,237,0.18))",
    color: "#7c3aed",
  },

  value: {
    margin: "3px 0 0",
    fontSize: "15px",
    fontWeight: 700,
  },

  extra: {
    fontSize: "11px",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },

  connectionCard: {
    marginTop: "10px",
    padding: "14px 15px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "12px",
  },

  analysisButton: {
    width: "100%",
    marginTop: "14px",
    padding: "14px 18px",
    border: "none",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "9px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 12px 25px rgba(37,99,235,0.20)",
  },

  bottomLineWrap: {
    position: "fixed",
    bottom: "76px",
    left: "50%",
    transform:
      "translateX(-50%)",
    width: "58%",
    height: "4px",
    borderRadius: "999px",
    overflow: "hidden",
    background:
      "rgba(148,163,184,0.18)",
    backdropFilter: "blur(5px)",
    zIndex: 20,
  },

  bottomLine: {
    width: "200%",
    height: "100%",
    background:
      "linear-gradient(90deg,transparent,#2563eb,#7c3aed,transparent)",
    animation:
      "moveLine 2.8s linear infinite",
  },
};

export default Dashboard;