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

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
| Frontend responsibility:
|   - Receive data
|   - Display data
|   - Render chart
|   - Handle UI interactions
|
| Backend responsibility:
|   - Device online/offline status
|   - Last activity / heartbeat
|   - Chicks age
|   - Telemetry history/window
|   - Condition/status
|   - Authentication/authorization
|   - Socket user identification
|--------------------------------------------------------------------------
*/

function Dashboard() {
  const {
    isDark,
    text,
    telemetryHistory,
  } = useAppSettings();

  const [data, setData] = useState({
    temperature: null,
    humidity: null,
    heater: "OFF",
    fanSpeed: 0,
    condition: "NORMAL",
    chicksAge: null,

    // Backend should provide these
    deviceStatus: "OFFLINE",
    lastActivity: null,
  });

  const [socketConnected, setSocketConnected] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Theme
  |--------------------------------------------------------------------------
  */

  const bg = isDark ? "#0f172a" : "#f8fafc";
  const primaryText = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "#94a3b8" : "#64748b";

  const softBg = isDark
    ? "rgba(30,41,59,0.72)"
    : "rgba(255,255,255,0.78)";

  const border = isDark
    ? "rgba(148,163,184,0.14)"
    : "rgba(15,23,42,0.08)";

  /*
  |--------------------------------------------------------------------------
  | Normalize backend payload
  |--------------------------------------------------------------------------
  |
  | Backend should ideally return one consistent schema.
  | These fallbacks make the page tolerant of old telemetry payloads
  | without putting business logic here.
  |--------------------------------------------------------------------------
  */

  const updateTelemetry = (telemetry) => {
    if (!telemetry) return;

    const payload = telemetry.data || telemetry;

    setData({
      temperature:
        payload.temperature ??
        payload.temp ??
        null,

      humidity:
        payload.humidity ??
        payload.rh ??
        null,

      heater:
        payload.heater ??
        payload.heaterStatus ??
        "OFF",

      fanSpeed:
        payload.fanSpeed ??
        payload.fanPercent ??
        payload.fan ??
        0,

      condition:
        payload.condition ??
        payload.status ??
        "NORMAL",

      chicksAge:
        payload.chicksAge ??
        payload.chickAge ??
        payload.ageDays ??
        null,

      deviceStatus:
        payload.deviceStatus ??
        payload.deviceOnline
          ? "ONLINE"
          : payload.deviceStatus || "OFFLINE",

      lastActivity:
        payload.lastActivity ??
        payload.lastHeartbeat ??
        payload.heartbeatAt ??
        null,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  const getToken = () => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REST API
  |--------------------------------------------------------------------------
  |
  | Initial state comes from backend.
  | No timeout calculations.
  | No chicks-age calculations.
  | No heartbeat calculations.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const token = getToken();

    if (!token) {
      console.warn("⚠️ Dashboard: authentication token missing");
      return;
    }

    const loadTelemetry = async () => {
      try {
        const response = await axios.get(
          `${API}/api/telemetry/latest`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 15000,
          }
        );

        if (!mounted) return;

        const telemetry =
          response.data?.data ??
          response.data;

        updateTelemetry(telemetry);
      } catch (error) {
        if (!mounted) return;

        console.error(
          "❌ TELEMETRY LOAD ERROR:",
          error.response?.data || error.message
        );
      }
    };

    loadTelemetry();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Socket.IO
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Do NOT send userId from localStorage.
  |
  | JWT is sent to backend.
  | Backend should authenticate socket.handshake.auth.token
  | and determine the user itself.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const token = getToken();

    if (!token) {
      console.warn("⚠️ Dashboard Socket: authentication token missing");
      return undefined;
    }

    const socket = io(API, {
      transports: ["websocket", "polling"],

      auth: {
        token,
      },

      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    const handleConnect = () => {
      setSocketConnected(true);

      console.log("✅ Dashboard Socket connected");
    };

    const handleDisconnect = (reason) => {
      setSocketConnected(false);

      console.warn(
        "⚠️ Dashboard Socket disconnected:",
        reason
      );
    };

    const handleConnectError = (error) => {
      setSocketConnected(false);

      console.error(
        "❌ Dashboard Socket authentication/connection error:",
        error?.message || error
      );
    };

    const handleTelemetry = (telemetry) => {
      updateTelemetry(telemetry);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    socket.on(
      "telemetry:update",
      handleTelemetry
    );

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      socket.off(
        "telemetry:update",
        handleTelemetry
      );

      socket.disconnect();
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Display values
  |--------------------------------------------------------------------------
  */

  const temperature =
    data.temperature === null ||
    data.temperature === undefined ||
    Number.isNaN(Number(data.temperature))
      ? null
      : Number(data.temperature);

  const humidity =
    data.humidity === null ||
    data.humidity === undefined ||
    Number.isNaN(Number(data.humidity))
      ? null
      : Number(data.humidity);

  const heaterOn =
    data.heater === "ON" ||
    data.heater === 1 ||
    data.heater === true;

  const fanValue = Math.max(
    0,
    Math.min(
      100,
      Number(data.fanSpeed) || 0
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Backend controlled device status
  |--------------------------------------------------------------------------
  */

  const deviceOnline =
    String(data.deviceStatus).toUpperCase() ===
      "ONLINE" ||
    String(data.deviceStatus).toLowerCase() ===
      "online";

  /*
  |--------------------------------------------------------------------------
  | Last activity
  |--------------------------------------------------------------------------
  |
  | Backend provides the timestamp.
  | Frontend only formats it.
  |--------------------------------------------------------------------------
  */

  const lastSeenText = useMemo(() => {
    if (!data.lastActivity) {
      return (
        text?.noDataReceived ||
        "No data received"
      );
    }

    const date = new Date(data.lastActivity);

    if (Number.isNaN(date.getTime())) {
      return (
        text?.noDataReceived ||
        "No data received"
      );
    }

    return date.toLocaleString();
  }, [data.lastActivity, text]);

  /*
  |--------------------------------------------------------------------------
  | Chicks age
  |--------------------------------------------------------------------------
  |
  | Backend calculates this.
  |--------------------------------------------------------------------------
  */

  const chicksAgeText =
    data.chicksAge === null ||
    data.chicksAge === undefined ||
    data.chicksAge === ""
      ? "—"
      : `${Number(data.chicksAge).toFixed(0)} ${
          text?.days || "days"
        }`;

  /*
  |--------------------------------------------------------------------------
  | Chart
  |--------------------------------------------------------------------------
  |
  | Backend/Context provides the already-selected history.
  |
  | Frontend does NOT decide:
  |   - 5 minutes
  |   - 120 minutes
  |   - 3 minutes
  |   - device timeout
  |
  | It only renders the points supplied to it.
  |--------------------------------------------------------------------------
  */

  const chart = useMemo(() => {
    const width = 360;
    const height = 160;

    const left = 38;
    const right = 15;
    const top = 18;
    const bottom = 28;

    const plotWidth =
      width - left - right;

    const plotHeight =
      height - top - bottom;

    const points = Array.isArray(
      telemetryHistory
    )
      ? telemetryHistory
          .filter(
            (item) =>
              item &&
              item.timestamp &&
              item.temperature !== null &&
              item.temperature !== undefined &&
              !Number.isNaN(
                Number(item.temperature)
              )
          )
          .map((item) => ({
            ...item,
            timestamp: new Date(
              item.timestamp
            ).getTime(),
            temperature: Number(
              item.temperature
            ),
          }))
          .filter(
            (item) =>
              !Number.isNaN(
                item.timestamp
              )
          )
      : [];

    let minTime =
      points.length > 0
        ? Math.min(
            ...points.map(
              (p) => p.timestamp
            )
          )
        : Date.now() - 60 * 60 * 1000;

    let maxTime =
      points.length > 0
        ? Math.max(
            ...points.map(
              (p) => p.timestamp
            )
          )
        : Date.now();

    if (maxTime === minTime) {
      minTime -= 10000;
      maxTime += 10000;
    }

    const timeSpan =
      maxTime - minTime;

    let values = points.map(
      (item) => item.temperature
    );

    if (!values.length) {
      values =
        temperature !== null
          ? [temperature]
          : [25];
    }

    let minTemp = Math.floor(
      Math.min(...values) - 1.5
    );

    let maxTemp = Math.ceil(
      Math.max(...values) + 1.5
    );

    if (maxTemp - minTemp < 4) {
      const middle =
        (maxTemp + minTemp) / 2;

      minTemp = Math.floor(
        middle - 2
      );

      maxTemp = Math.ceil(
        middle + 2
      );
    }

    const tempRange =
      maxTemp - minTemp;

    const getX = (timestamp) => {
      const position =
        (timestamp - minTime) /
        timeSpan;

      return (
        left +
        Math.max(
          0,
          Math.min(1, position)
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
        x: getX(point.timestamp),
        y: getY(point.temperature),
        temp: point.temperature,

        time: new Date(
          point.timestamp
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),

        raw: point,
      }));

    let linePath = "";
    let areaPath = "";

    if (plottedPoints.length === 1) {
      const p =
        plottedPoints[0];

      linePath =
        `M ${left},${p.y} ` +
        `L ${width - right},${p.y}`;

      areaPath =
        `M ${left},${top + plotHeight} ` +
        `L ${left},${p.y} ` +
        `L ${width - right},${p.y} ` +
        `L ${width - right},${top + plotHeight} Z`;
    }

    if (plottedPoints.length > 1) {
      linePath =
        `M ${plottedPoints[0].x},${plottedPoints[0].y}`;

      for (
        let i = 0;
        i < plottedPoints.length - 1;
        i++
      ) {
        const curr =
          plottedPoints[i];

        const next =
          plottedPoints[i + 1];

        const cx =
          (curr.x + next.x) / 2;

        linePath +=
          ` C ${cx},${curr.y} ` +
          `${cx},${next.y} ` +
          `${next.x},${next.y}`;
      }

      const firstX =
        plottedPoints[0].x;

      const lastX =
        plottedPoints[
          plottedPoints.length - 1
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
            plottedPoints.length - 1
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

    const formatTimeLabel = (
      timestamp
    ) =>
      new Date(
        timestamp
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

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
      points: plottedPoints,
    };
  }, [
    telemetryHistory,
    temperature,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Info Row
  |--------------------------------------------------------------------------
  */

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
                valueColor ||
                primaryText,
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

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

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
        {/* HERO */}

        <section style={styles.hero}>
          <div>
            <p
              style={{
                ...styles.smallText,
                color: muted,
              }}
            >
              {text?.liveBrooderStatus ||
                "Live brooder status"}
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

              color: deviceOnline
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
                ? text?.online ||
                  "Online"
                : text?.offline ||
                  "Offline"}
            </span>
          </div>
        </section>

        {/* QUICK STATS */}

        <section
          style={styles.quickStats}
        >
          <div
            style={styles.bigStat}
          >
            <Thermometer size={18} />

            <div>
              <p
                style={
                  styles.whiteLabel
                }
              >
                {text?.temperature ||
                  "Temperature"}
              </p>

              <h1
                style={
                  styles.bigValue
                }
              >
                {temperature === null
                  ? "—"
                  : `${temperature.toFixed(
                      1
                    )}°C`}
              </h1>
            </div>
          </div>

          <div
            style={styles.bigStat}
          >
            <Droplets size={18} />

            <div>
              <p
                style={
                  styles.whiteLabel
                }
              >
                {text?.humidity ||
                  "Humidity"}
              </p>

              <h1
                style={
                  styles.bigValue
                }
              >
                {humidity === null
                  ? "—"
                  : `${humidity.toFixed(
                      1
                    )}%`}
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
              {text?.chicksAge ||
                "Chicks age"}
            </p>

            <h2
              style={{
                margin:
                  "4px 0 0",
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
              color: deviceOnline
                ? "#22c55e"
                : "#ef4444",
            }}
          >
            {deviceOnline
              ? text?.deviceActive ||
                "Device active"
              : text?.deviceOffline ||
                "Device offline"}
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
            style={
              styles.chartHeader
            }
          >
            <div>
              <p
                style={{
                  ...styles.label,
                  color: muted,
                }}
              >
                {text?.temperature ||
                  "Temperature"}
              </p>

              <h3
                style={{
                  ...styles.chartTitle,
                  color:
                    primaryText,
                }}
              >
                {text?.last120Minutes ||
                  "Live Trend Graph"}
              </h3>
            </div>

            <span
              style={{
                ...styles.extra,
                color: muted,
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
                  id="lineGradient"
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
                  id="areaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#7c3aed"
                    stopOpacity="0.28"
                  />

                  <stop
                    offset="100%"
                    stopColor="#2563eb"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* GRID */}

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
                        y={y + 3}
                        fontSize="9"
                        fill={muted}
                        fontWeight="500"
                      >
                        {value}°
                      </text>
                    </g>
                  );
                }
              )}

              {/* BASELINE */}

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
                    ? "rgba(148,163,184,0.20)"
                    : "rgba(15,23,42,0.12)"
                }
              />

              {/* TIME LABELS */}

              {chart.xTicks.map(
                (
                  tick,
                  idx
                ) => {
                  const x =
                    chart.left +
                    tick.ratio *
                      chart.plotWidth;

                  return (
                    <text
                      key={`xtick-${idx}`}
                      x={x}
                      y={
                        chart.height -
                        6
                      }
                      textAnchor={
                        idx === 0
                          ? "start"
                          : idx ===
                            chart.xTicks
                              .length -
                              1
                          ? "end"
                          : "middle"
                      }
                      fontSize="9"
                      fill={muted}
                    >
                      {
                        tick.label
                      }
                    </text>
                  );
                }
              )}

              {/* AREA */}

              {chart.areaPath && (
                <path
                  d={
                    chart.areaPath
                  }
                  fill="url(#areaGradient)"
                />
              )}

              {/* LINE */}

              {chart.linePath && (
                <path
                  d={
                    chart.linePath
                  }
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* TOUCH TARGETS */}

              {chart.points.map(
                (p, i) => (
                  <circle
                    key={`target-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r="12"
                    fill="transparent"
                    style={{
                      cursor:
                        "pointer",
                    }}
                    onMouseEnter={() =>
                      setHoveredPoint(
                        p
                      )
                    }
                    onTouchStart={() =>
                      setHoveredPoint(
                        p
                      )
                    }
                  />
                )
              )}

              {/* CURRENT POINT */}

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

              {/* HOVER */}

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
                        30,
                      Math.min(
                        chart.width -
                          chart.right -
                          55,
                        hoveredPoint.x
                      )
                    )}, ${Math.max(
                      chart.top +
                        15,
                      hoveredPoint.y -
                        12
                    )})`}
                  >
                    <rect
                      x="-35"
                      y="-18"
                      width="70"
                      height="22"
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
                      strokeWidth="1"
                      filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
                    />

                    <text
                      x="0"
                      y="-4"
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
                      y="1"
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
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              marginTop: "4px",
              fontSize: "10px",
              color: muted,
            }}
          >
            <span>
              {text?.temperature ||
                "Temperature"}{" "}
              (°C)
            </span>

            <span>
              {text?.time ||
                "Time Timeline"}
            </span>
          </div>
        </section>

        {/* DEVICE INFO */}

        <section
          style={
            styles.deviceSection
          }
        >
          <InfoRow
            icon={
              <Power size={17} />
            }
            label={
              text?.deviceStatus ||
              "Device status"
            }
            value={
              deviceOnline
                ? text?.online ||
                  "Online"
                : text?.offline ||
                  "Offline"
            }
            valueColor={
              deviceOnline
                ? "#22c55e"
                : "#ef4444"
            }
            extra={
              socketConnected
                ? text?.dataReceived ||
                  "data received"
                : text?.connectionLost ||
                  "connection unavailable"
            }
          />

          <InfoRow
            icon={
              <Flame size={17} />
            }
            label={
              text?.heater ||
              "Heater"
            }
            value={
              heaterOn
                ? text?.on || "ON"
                : text?.off || "OFF"
            }
            valueColor={
              heaterOn
                ? "#f59e0b"
                : undefined
            }
            extra={
              heaterOn
                ? text?.heating ||
                  "heating"
                : text?.standby ||
                  "standby"
            }
          />

          <InfoRow
            icon={
              <Wind size={17} />
            }
            label={
              text?.fan ||
              "Fan"
            }
            value={`${fanValue}%`}
            extra={
              fanValue > 0
                ? text?.running ||
                  "running"
                : text?.off ||
                  "off"
            }
          />
        </section>

        {/* HEARTBEAT */}

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
              {text?.deviceHeartbeat ||
                "Device heartbeat"}
            </p>

            <strong
              style={{
                fontSize: "14px",
              }}
            >
              {deviceOnline
                ? text?.receivingData ||
                  "Receiving data normally"
                : text?.noRecentHeartbeat ||
                  "No recent heartbeat or telemetry"}
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

        {/* ANALYSIS */}

        <button
          onClick={() => {
            window.location.href =
              "/analysis";
          }}
          style={
            styles.analysisButton
          }
        >
          <BarChart3 size={18} />

          <span>
            {text?.viewDetailedAnalysis ||
              "View detailed analysis"}
          </span>
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

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
    justifyContent: "space-between",
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
    justifyContent: "space-between",
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
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "14px",
    backdropFilter:
      "blur(12px)",
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
    justifyContent: "space-between",
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
    marginBottom: "14px",
  },

  infoRow: {
    borderRadius: "20px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backdropFilter:
      "blur(12px)",
  },

  infoLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  iconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(37,99,235,0.12)",
    color: "#2563eb",
  },

  value: {
    margin: "2px 0 0",
    fontSize: "16px",
    fontWeight: 600,
  },

  extra: {
    fontSize: "12px",
    fontWeight: 500,
  },

  connectionCard: {
    borderRadius: "20px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
    backdropFilter:
      "blur(12px)",
  },

  analysisButton: {
    width: "100%",
    height: "52px",
    borderRadius: "18px",
    border: "none",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow:
      "0 10px 25px rgba(37,99,235,0.25)",
  },
};

export default Dashboard;