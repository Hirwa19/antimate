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
  Clock3,
  Wifi,
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
  const {
    isDark,
    text,
    telemetryHistory,
    addTelemetryPoint,
  } = useAppSettings();

  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    heater: "OFF",
    fanSpeed: 0,
    condition: "NORMAL",
    chicksAge: null,
  });

  const [lastActivity, setLastActivity] = useState(null);
  const [socketConnected, setSocketConnected] =
    useState(false);
  const [now, setNow] = useState(Date.now());
  const [hoveredPoint, setHoveredPoint] =
    useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

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
      const birth = new Date(
        birthDate
      ).getTime();

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

    addTelemetryPoint({
      timestamp,
      temperature,
      humidity,
    });
  };

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const user = JSON.parse(
      localStorage.getItem("user") ||
        "null"
    );

    const userId =
      user?._id || user?.id;

    const handleConnect = () => {
      setSocketConnected(true);

      if (userId) {
        socket.emit(
          "join-user",
          userId
        );
      }
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleTelemetry = (
      telemetry
    ) => {
      updateTelemetry(telemetry);
    };

    const loadTelemetry =
      async () => {
        if (!token) return;

        try {
          const response =
            await axios.get(
              `${API}/api/telemetry/latest`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          const telemetry =
            response.data?.data ||
            response.data;

          if (telemetry) {
            updateTelemetry(
              telemetry
            );
          }
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

  const deviceOnline = useMemo(() => {
    if (!lastActivity) {
      return false;
    }

    return (
      now - lastActivity <=
      DEVICE_TIMEOUT
    );
  }, [lastActivity, now]);

  const lastSeenText = useMemo(() => {
    if (!lastActivity) {
      return (
        text?.noDataReceived ||
        "No data received"
      );
    }

    const seconds = Math.floor(
      (now - lastActivity) / 1000
    );

    if (seconds < 10) {
      return (
        text?.justNow ||
        "Just now"
      );
    }

    if (seconds < 60) {
      return `${seconds}s ${
        text?.ago || "ago"
      }`;
    }

    const minutes = Math.floor(
      seconds / 60
    );

    if (minutes < 60) {
      return `${minutes}m ${
        text?.ago || "ago"
      }`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    return `${hours}h ${
      text?.ago || "ago"
    }`;
  }, [
    lastActivity,
    now,
    text,
  ]);

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

  const chicksAgeText =
    data.chicksAge === null ||
    data.chicksAge === undefined
      ? "—"
      : `${Number(
          data.chicksAge
        ).toFixed(0)} ${
          text?.days || "days"
        }`;

  const bg = isDark
    ? "#0f172a"
    : "#f8fafc";

  const primaryText = isDark
    ? "#f8fafc"
    : "#0f172a";

  const muted = isDark
    ? "#94a3b8"
    : "#64748b";

  const border = isDark
    ? "rgba(148,163,184,0.14)"
    : "rgba(15,23,42,0.08)";

  const sectionBg = isDark
    ? "rgba(15,23,42,0.55)"
    : "rgba(255,255,255,0.72)";

  const chart = useMemo(() => {
    const width = 700;
    const height = 250;

    const left = 45;
    const right = 18;
    const top = 22;
    const bottom = 35;

    const plotWidth =
      width - left - right;

    const plotHeight =
      height - top - bottom;

    const cutoff =
      now - CHART_WINDOW;

    const points = (
      telemetryHistory || []
    )
      .filter(
        (item) =>
          item.timestamp >= cutoff
      )
      .sort(
        (a, b) =>
          a.timestamp -
          b.timestamp
      );

    let minTime =
      points.length > 0
        ? points[0].timestamp
        : cutoff;

    let maxTime =
      points.length > 0
        ? points[
            points.length - 1
          ].timestamp
        : now;

    if (maxTime === minTime) {
      minTime = maxTime - 10000;
    }

    const timeSpan =
      maxTime - minTime;

    let values = points.map(
      (item) =>
        Number(item.temperature)
    );

    if (!values.length) {
      values = [
        temperature || 25,
      ];
    }

    let minTemp = Math.floor(
      Math.min(...values) - 1.5
    );

    let maxTemp = Math.ceil(
      Math.max(...values) + 1.5
    );

    if (
      maxTemp - minTemp <
      4
    ) {
      const middle =
        (maxTemp + minTemp) /
        2;

      minTemp = Math.floor(
        middle - 2
      );

      maxTemp = Math.ceil(
        middle + 2
      );
    }

    const tempRange =
      maxTemp - minTemp;

    const getX = (
      timestamp
    ) => {
      const position =
        (timestamp - minTime) /
        timeSpan;

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

    const plottedPoints =
      points.map((point) => ({
        x: getX(
          point.timestamp
        ),
        y: getY(
          Number(
            point.temperature
          )
        ),
        temp: Number(
          point.temperature
        ),
        time: new Date(
          point.timestamp
        ).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        ),
        raw: point,
      }));

    let linePath = "";
    let areaPath = "";

    if (
      plottedPoints.length === 1
    ) {
      const p =
        plottedPoints[0];

      linePath =
        `M ${left},${p.y} ` +
        `L ${
          width - right
        },${p.y}`;

      areaPath =
        `M ${left},${
          top + plotHeight
        } ` +
        `L ${left},${p.y} ` +
        `L ${
          width - right
        },${p.y} ` +
        `L ${
          width - right
        },${
          top + plotHeight
        } Z`;
    } else if (
      plottedPoints.length > 1
    ) {
      linePath =
        `M ${
          plottedPoints[0].x
        },${
          plottedPoints[0].y
        }`;

      for (
        let i = 0;
        i <
        plottedPoints.length - 1;
        i++
      ) {
        const curr =
          plottedPoints[i];

        const next =
          plottedPoints[i + 1];

        const cx =
          (curr.x + next.x) /
          2;

        linePath +=
          ` C ${cx},${curr.y} ` +
          `${cx},${next.y} ` +
          `${next.x},${next.y}`;
      }

      const firstX =
        plottedPoints[0].x;

      const lastX =
        plottedPoints[
          plottedPoints.length -
            1
        ].x;

      const bottomY =
        top + plotHeight;

      areaPath =
        `${linePath} ` +
        `L ${lastX},${bottomY} ` +
        `L ${firstX},${bottomY} Z`;
    }

    const last =
      plottedPoints.length
        ? plottedPoints[
            plottedPoints.length -
              1
          ]
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

    const formatTimeLabel =
      (ms) =>
        new Date(
          ms
        ).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

    const xTicks = [
      {
        label:
          formatTimeLabel(
            minTime
          ),
        ratio: 0,
      },
      {
        label:
          formatTimeLabel(
            minTime +
              timeSpan * 0.5
          ),
        ratio: 0.5,
      },
      {
        label:
          formatTimeLabel(
            maxTime
          ),
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
      linePath,
      areaPath,
      last,
      yTicks,
      xTicks,
      points:
        plottedPoints,
    };
  }, [
    telemetryHistory,
    now,
    temperature,
  ]);

  return (
    <div
      style={{
        ...styles.page,
        background: bg,
        color: primaryText,
      }}
    >
      <AppHeader
        title={
          text?.dashboard ||
          "Dashboard"
        }
      />

      <main style={styles.content}>
        {/* TOP HEADER */}
        <section
          style={styles.header}
        >
          <div>
            <p
              style={{
                ...styles.eyebrow,
                color: muted,
              }}
            >
              {text?.liveBrooderStatus ||
                "Live brooder status"}
            </p>

            <h1
              style={{
                ...styles.title,
                color: primaryText,
              }}
            >
              ANTIMATE Edge
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/analysis";
            }}
            style={
              styles.analysisButton
            }
          >
            <BarChart3 size={15} />

            <span>
              {text?.viewDetailedAnalysis ||
                "Detailed analysis"}
            </span>
          </button>
        </section>

        {/* DEVICE STATUS LINE */}
        <section
          style={{
            ...styles.statusLineTop,
            borderBottomColor:
              border,
          }}
        >
          <div
            style={
              styles.statusLeft
            }
          >
            <span
              style={{
                ...styles.statusDot,
                background:
                  deviceOnline
                    ? "#22c55e"
                    : "#ef4444",
              }}
            />

            <strong
              style={{
                color: deviceOnline
                  ? "#22c55e"
                  : "#ef4444",
              }}
            >
              {deviceOnline
                ? text?.online ||
                  "Online"
                : text?.offline ||
                  "Offline"}
            </strong>

            <span
              style={{
                color: muted,
              }}
            >
              {lastSeenText}
            </span>
          </div>

          <div
            style={{
              ...styles.socketStatus,
              color: socketConnected
                ? "#22c55e"
                : muted,
            }}
          >
            <Wifi size={13} />

            {socketConnected
              ? "Live connection"
              : "Waiting for connection"}
          </div>
        </section>

        {/* MAIN INFORMATION */}
        <section
          style={{
            ...styles.mainSection,
            borderBottomColor:
              border,
          }}
        >
          {/* TEMPERATURE */}
          <div
            style={{
              ...styles.metricRow,
              borderBottomColor:
                border,
            }}
          >
            <div
              style={
                styles.metricIcon
              }
            >
              <Thermometer
                size={20}
              />
            </div>

            <div
              style={styles.metricInfo}
            >
              <span
                style={{
                  ...styles.metricLabel,
                  color: muted,
                }}
              >
                {text?.temperature ||
                  "Temperature"}
              </span>

              <strong
                style={{
                  ...styles.metricValue,
                  color: primaryText,
                }}
              >
                {temperature.toFixed(
                  1
                )}
                <small>°C</small>
              </strong>
            </div>

            <span
              style={{
                ...styles.metricState,
                color: deviceOnline
                  ? "#22c55e"
                  : muted,
              }}
            >
              {deviceOnline
                ? text?.live ||
                  "Live"
                : text?.offline ||
                  "Offline"}
            </span>
          </div>

          {/* HUMIDITY */}
          <div
            style={{
              ...styles.metricRow,
              borderBottomColor:
                border,
            }}
          >
            <div
              style={{
                ...styles.metricIcon,
                color: "#0891b2",
                background:
                  "rgba(8,145,178,0.10)",
              }}
            >
              <Droplets
                size={20}
              />
            </div>

            <div
              style={styles.metricInfo}
            >
              <span
                style={{
                  ...styles.metricLabel,
                  color: muted,
                }}
              >
                {text?.humidity ||
                  "Humidity"}
              </span>

              <strong
                style={{
                  ...styles.metricValue,
                  color: primaryText,
                }}
              >
                {humidity.toFixed(
                  1
                )}
                <small>%</small>
              </strong>
            </div>

            <span
              style={{
                ...styles.metricState,
                color: muted,
              }}
            >
              {text?.current ||
                "Current"}
            </span>
          </div>

          {/* HEATER */}
          <div
            style={{
              ...styles.metricRow,
              borderBottomColor:
                border,
            }}
          >
            <div
              style={{
                ...styles.metricIcon,
                color: "#f59e0b",
                background:
                  "rgba(245,158,11,0.10)",
              }}
            >
              <Flame size={20} />
            </div>

            <div
              style={styles.metricInfo}
            >
              <span
                style={{
                  ...styles.metricLabel,
                  color: muted,
                }}
              >
                {text?.heater ||
                  "Heater"}
              </span>

              <strong
                style={{
                  ...styles.metricValue,
                  color: heaterOn
                    ? "#f59e0b"
                    : primaryText,
                }}
              >
                {heaterOn
                  ? text?.on || "ON"
                  : text?.off || "OFF"}
              </strong>
            </div>

            <span
              style={{
                ...styles.metricState,
                color: heaterOn
                  ? "#f59e0b"
                  : muted,
              }}
            >
              {heaterOn
                ? text?.heating ||
                  "Heating"
                : text?.standby ||
                  "Standby"}
            </span>
          </div>

          {/* FAN */}
          <div
            style={{
              ...styles.metricRow,
              borderBottomColor:
                border,
            }}
          >
            <div
              style={{
                ...styles.metricIcon,
                color: "#7c3aed",
                background:
                  "rgba(124,58,237,0.10)",
              }}
            >
              <Wind size={20} />
            </div>

            <div
              style={styles.metricInfo}
            >
              <span
                style={{
                  ...styles.metricLabel,
                  color: muted,
                }}
              >
                {text?.fan ||
                  "Fan"}
              </span>

              <strong
                style={{
                  ...styles.metricValue,
                  color: primaryText,
                }}
              >
                {fanValue}
                <small>%</small>
              </strong>
            </div>

            <span
              style={{
                ...styles.metricState,
                color:
                  fanValue > 0
                    ? "#7c3aed"
                    : muted,
              }}
            >
              {fanValue > 0
                ? text?.running ||
                  "Running"
                : text?.off ||
                  "Off"}
            </span>
          </div>

          {/* CHICKS AGE */}
          <div
            style={{
              ...styles.metricRow,
              borderBottom:
                "none",
            }}
          >
            <div
              style={{
                ...styles.metricIcon,
                color: "#ec4899",
                background:
                  "rgba(236,72,153,0.10)",
              }}
            >
              <Clock3
                size={20}
              />
            </div>

            <div
              style={styles.metricInfo}
            >
              <span
                style={{
                  ...styles.metricLabel,
                  color: muted,
                }}
              >
                {text?.chicksAge ||
                  "Chicks age"}
              </span>

              <strong
                style={{
                  ...styles.metricValue,
                  color: primaryText,
                }}
              >
                {chicksAgeText}
              </strong>
            </div>

            <span
              style={{
                ...styles.metricState,
                color: muted,
              }}
            >
              {text?.flockAge ||
                "Flock age"}
            </span>
          </div>
        </section>

        {/* TEMPERATURE GRAPH */}
        <section
          style={{
            ...styles.graphSection,
            borderBottomColor:
              border,
          }}
        >
          <div
            style={
              styles.graphHeader
            }
          >
            <div>
              <span
                style={{
                  ...styles.graphEyebrow,
                  color: muted,
                }}
              >
                {text?.temperature ||
                  "Temperature"}
              </span>

              <h2
                style={{
                  ...styles.graphTitle,
                  color: primaryText,
                }}
              >
                {text?.last120Minutes ||
                  "Live Trend Graph"}
              </h2>
            </div>

            <span
              style={{
                color: muted,
                fontSize: "11px",
              }}
            >
              {chart.points.length}{" "}
              {text?.readings ||
                "readings"}
            </span>
          </div>

          <div
            style={
              styles.chartWrapper
            }
          >
            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              style={styles.svg}
              preserveAspectRatio="none"
              onMouseLeave={() =>
                setHoveredPoint(
                  null
                )
              }
              onTouchEnd={() =>
                setHoveredPoint(
                  null
                )
              }
            >
              <defs>
                <linearGradient
                  id="dashboardLineGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
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

                <linearGradient
                  id="dashboardAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#7c3aed"
                    stopOpacity="0.24"
                  />

                  <stop
                    offset="100%"
                    stopColor="#2563eb"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {chart.yTicks.map(
                (
                  value,
                  index
                ) => {
                  const y =
                    chart.top +
                    (index /
                      (chart.yTicks
                        .length -
                        1)) *
                      chart.plotHeight;

                  return (
                    <g
                      key={`y-${index}`}
                    >
                      <line
                        x1={
                          chart.left
                        }
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
                        strokeDasharray="3 3"
                      />

                      <text
                        x="2"
                        y={
                          y + 3
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

              <line
                x1={
                  chart.left
                }
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
                    ? "rgba(148,163,184,0.20)"
                    : "rgba(15,23,42,0.12)"
                }
              />

              {chart.xTicks.map(
                (
                  tick,
                  index
                ) => {
                  const x =
                    chart.left +
                    tick.ratio *
                      chart.plotWidth;

                  return (
                    <text
                      key={`x-${index}`}
                      x={x}
                      y={
                        chart.height -
                        7
                      }
                      textAnchor={
                        index === 0
                          ? "start"
                          : index ===
                            chart.xTicks
                              .length -
                              1
                          ? "end"
                          : "middle"
                      }
                      fontSize="9"
                      fill={muted}
                    >
                      {tick.label}
                    </text>
                  );
                }
              )}

              {chart.areaPath && (
                <path
                  d={
                    chart.areaPath
                  }
                  fill="url(#dashboardAreaGradient)"
                />
              )}

              {chart.linePath && (
                <path
                  d={
                    chart.linePath
                  }
                  fill="none"
                  stroke="url(#dashboardLineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {chart.points.map(
                (
                  point,
                  index
                ) => (
                  <circle
                    key={`target-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="12"
                    fill="transparent"
                    style={{
                      cursor:
                        "pointer",
                    }}
                    onMouseEnter={() =>
                      setHoveredPoint(
                        point
                      )
                    }
                    onTouchStart={() =>
                      setHoveredPoint(
                        point
                      )
                    }
                  />
                )
              )}

              {!hoveredPoint &&
                chart.last && (
                  <g>
                    <circle
                      cx={
                        chart.last
                          .x
                      }
                      cy={
                        chart.last
                          .y
                      }
                      r="6"
                      fill="rgba(124,58,237,0.25)"
                    >
                      <animate
                        attributeName="r"
                        values="4;8;4"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    <circle
                      cx={
                        chart.last
                          .x
                      }
                      cy={
                        chart.last
                          .y
                      }
                      r="3.5"
                      fill="#7c3aed"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

              {hoveredPoint && (
                <g>
                  <line
                    x1={
                      hoveredPoint.x
                    }
                    x2={
                      hoveredPoint.x
                    }
                    y1={
                      chart.top
                    }
                    y2={
                      chart.top +
                      chart.plotHeight
                    }
                    stroke="#7c3aed"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />

                  <circle
                    cx={
                      hoveredPoint.x
                    }
                    cy={
                      hoveredPoint.y
                    }
                    r="5"
                    fill="#7c3aed"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  <g
                    transform={`translate(${Math.max(
                      chart.left +
                        40,
                      Math.min(
                        chart.width -
                          chart.right -
                          45,
                        hoveredPoint.x
                      )
                    )}, ${Math.max(
                      chart.top +
                        20,
                      hoveredPoint.y -
                        12
                    )})`}
                  >
                    <rect
                      x="-38"
                      y="-18"
                      width="76"
                      height="25"
                      rx="6"
                      fill={
                        isDark
                          ? "#1e293b"
                          : "#ffffff"
                      }
                      stroke={
                        isDark
                          ? "#334155"
                          : "#e2e8f0"
                      }
                    />

                    <text
                      x="0"
                      y="-5"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill={
                        isDark
                          ? "#f8fafc"
                          : "#0f172a"
                      }
                    >
                      {
                        hoveredPoint.temp
                      }
                      °C
                    </text>

                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fontSize="7.5"
                      fill={muted}
                    >
                      {
                        hoveredPoint.time
                      }
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>

          <div
            style={
              styles.graphFooter
            }
          >
            <span
              style={{
                color: muted,
              }}
            >
              {text?.temperature ||
                "Temperature"}{" "}
              (°C)
            </span>

            <span
              style={{
                color: muted,
              }}
            >
              {text?.time ||
                "Time"}
            </span>
          </div>
        </section>

        {/* FINAL DEVICE SUMMARY */}
        <section
          style={{
            ...styles.footerStatus,
            borderBottomColor:
              border,
          }}
        >
          <div>
            <span
              style={{
                ...styles.footerLabel,
                color: muted,
              }}
            >
              {text?.deviceHeartbeat ||
                "Device heartbeat"}
            </span>

            <strong
              style={{
                ...styles.footerValue,
                color: primaryText,
              }}
            >
              {deviceOnline
                ? text?.receivingData ||
                  "Receiving data normally"
                : text?.noRecentHeartbeat ||
                  "No recent heartbeat"}
            </strong>
          </div>

          <div
            style={{
              ...styles.footerConnection,
              color: deviceOnline
                ? "#22c55e"
                : "#ef4444",
            }}
          >
            <span
              style={{
                ...styles.statusDotSmall,
                background:
                  deviceOnline
                    ? "#22c55e"
                    : "#ef4444",
              }}
            />

            {lastSeenText}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    paddingBottom: "90px",
    overflowX: "hidden",
  },

  content: {
    width: "100%",
    maxWidth: "980px",
    margin: "0 auto",
    padding: "18px 20px 35px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "10px",
  },

  eyebrow: {
    margin: 0,
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.03em",
  },

  title: {
    margin: "3px 0 0",
    fontSize: "23px",
    lineHeight: 1.15,
    fontWeight: 750,
    letterSpacing: "-0.02em",
  },

  analysisButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    height: "34px",
    padding: "0 11px",
    border: "1px solid rgba(37,99,235,0.20)",
    borderRadius: "9px",
    background:
      "rgba(37,99,235,0.07)",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: 650,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  statusLineTop: {
    minHeight: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    borderBottom: "1px solid",
    marginBottom: "4px",
  },

  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "11px",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  statusDotSmall: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    display: "inline-block",
  },

  socketStatus: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "10px",
  },

  mainSection: {
    width: "100%",
    borderBottom: "1px solid",
  },

  metricRow: {
    minHeight: "70px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    borderBottom: "1px solid",
  },

  metricIcon: {
    width: "39px",
    height: "39px",
    borderRadius: "11px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb",
    background:
      "rgba(37,99,235,0.10)",
  },

  metricInfo: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  metricLabel: {
    fontSize: "11px",
    fontWeight: 500,
  },

  metricValue: {
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: 1.1,
  },

  metricValueSmall: {
    fontSize: "12px",
  },

  metricState: {
    fontSize: "11px",
    fontWeight: 550,
    textAlign: "right",
    whiteSpace: "nowrap",
  },

  graphSection: {
    padding:
      "20px 0 16px",
    borderBottom: "1px solid",
  },

  graphHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
    gap: "12px",
    marginBottom: "8px",
  },

  graphEyebrow: {
    fontSize: "10px",
    fontWeight: 600,
  },

  graphTitle: {
    margin: "2px 0 0",
    fontSize: "16px",
    fontWeight: 700,
  },

  chartWrapper: {
    width: "100%",
    overflow: "hidden",
  },

  svg: {
    width: "100%",
    height: "250px",
    display: "block",
    overflow: "visible",
  },

  graphFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginTop: "1px",
    fontSize: "9px",
  },

  footerStatus: {
    minHeight: "65px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "20px",
    borderBottom: "1px solid",
  },

  footerLabel: {
    display: "block",
    fontSize: "10px",
    marginBottom: "3px",
  },

  footerValue: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
  },

  footerConnection: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10px",
    whiteSpace: "nowrap",
  },
};

export default Dashboard;