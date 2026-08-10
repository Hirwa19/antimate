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

function Dashboard() {
  const { isDark } = useAppSettings();

  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    heater: "OFF",
    fanSpeed: 0,
    condition: "NORMAL",
  });

  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);

  // =====================================================
  // TELEMETRY
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const userId = user?._id || user?.id;

    // Join user socket room
    if (userId) {
      socket.emit("join-user", userId);
    }

    // ---------------------------------------------------
    // SOCKET CONNECTION
    // ---------------------------------------------------

    const handleConnect = () => {
      console.log("🟢 Dashboard Socket Connected");

      setConnected(true);

      if (userId) {
        socket.emit("join-user", userId);
      }
    };

    const handleDisconnect = () => {
      console.log("🔴 Dashboard Socket Disconnected");
      setConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // ---------------------------------------------------
    // LOAD LATEST TELEMETRY
    // ---------------------------------------------------

    const loadTelemetry = async () => {
      if (!token) {
        console.warn("⚠️ No authentication token");
        return;
      }

      try {
        const response = await axios.get(
          `${API}/api/telemetry/latest`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const telemetry = response.data?.data;

        if (!telemetry) {
          console.log("ℹ️ No telemetry available yet");
          return;
        }

        console.log(
          "📡 Latest telemetry:",
          telemetry
        );

        updateTelemetry(telemetry);
      } catch (error) {
        console.error(
          "❌ TELEMETRY LOAD ERROR:",
          error.response?.data || error.message
        );
      }
    };

    // ---------------------------------------------------
    // LIVE TELEMETRY
    // ---------------------------------------------------

    const handleTelemetry = (telemetry) => {
      console.log(
        "📡 Live telemetry:",
        telemetry
      );

      updateTelemetry(telemetry);
    };

    socket.on(
      "telemetry:update",
      handleTelemetry
    );

    loadTelemetry();

    // ---------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------

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
  // UPDATE TELEMETRY
  // =====================================================

  const updateTelemetry = (telemetry) => {
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
        0
    );

    const heater =
      telemetry.heater ??
      "OFF";

    setData({
      temperature,
      humidity,
      heater,
      fanSpeed,
      condition:
        telemetry.condition ||
        "NORMAL",
    });

    setHistory((previous) => {
      const item = {
        time: new Date(
          telemetry.createdAt ||
            Date.now()
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        temperature,

        humidity,
      };

      const next = [
        ...previous,
        item,
      ];

      return next.slice(-12);
    });
  };

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

  const fanValue = Number(
    data.fanSpeed || 0
  );

  const conditionText =
    data.condition || "NORMAL";

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

  const chartPoints = useMemo(() => {
    const values = history.length
      ? history.map(
          (item) =>
            item.temperature
        )
      : [
          temperature || 25,
          temperature || 25,
          temperature || 25,
        ];

    const min =
      Math.min(...values) - 1;

    const max =
      Math.max(...values) + 1;

    const width = 320;

    const height = 105;

    return values
      .map((value, index) => {
        const x =
          values.length === 1
            ? 0
            : (index /
                (values.length - 1)) *
              width;

        const y =
          height -
          ((value - min) /
            (max - min || 1)) *
            height;

        return `${x},${y}`;
      })
      .join(" ");
  }, [
    history,
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
              color: text,
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

          <div style={styles.statusPill}>
            <Activity size={14} />

            <span>
              {conditionText}
            </span>
          </div>
        </section>

        {/* QUICK STATS */}

        <section style={styles.quickStats}>

          <div style={styles.bigStat}>
            <Thermometer size={18} />

            <div>
              <p style={styles.whiteLabel}>
                Temperature
              </p>

              <h1 style={styles.bigValue}>
                {temperature.toFixed(1)}
                °C
              </h1>
            </div>
          </div>

          <div style={styles.bigStat}>
            <Droplets size={18} />

            <div>
              <p style={styles.whiteLabel}>
                Humidity
              </p>

              <h1 style={styles.bigValue}>
                {humidity.toFixed(1)}
                %
              </h1>
            </div>
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
          <div style={styles.chartHeader}>

            <div>
              <p
                style={{
                  ...styles.label,
                  color: muted,
                }}
              >
                Temperature trend
              </p>

              <h3
                style={{
                  ...styles.chartTitle,
                  color: text,
                }}
              >
                Last readings
              </h3>
            </div>

            <span
              style={{
                ...styles.extra,
                color: muted,
              }}
            >
              {history.length
                ? `${history.length} points`
                : "waiting"}
            </span>

          </div>

          <svg
            viewBox="0 0 320 115"
            style={styles.svg}
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

            <polyline
              points={chartPoints}
              fill="none"
              stroke="url(#trendGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {history.length > 0 && (
              <circle
                cx={
                  chartPoints
                    .split(" ")
                    .at(-1)
                    ?.split(",")[0]
                }
                cy={
                  chartPoints
                    .split(" ")
                    .at(-1)
                    ?.split(",")[1]
                }
                r="4.5"
                fill="#7c3aed"
              />
            )}
          </svg>
        </section>

        {/* DEVICE STATUS */}

        <section style={styles.deviceSection}>

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

          <InfoRow
            icon={
              <Power size={17} />
            }
            label="Connection"
            value={
              connected
                ? "Live"
                : "Offline"
            }
            extra={
              connected
                ? "socket"
                : "disconnected"
            }
          />

        </section>

      </main>

      {/* BOTTOM ANIMATION */}

      <div
        style={styles.bottomLineWrap}
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
    justifyContent: "space-between",
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
    background:
      "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white",
    fontSize: "11px",
    fontWeight: 600,
  },

  quickStats: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "12px",
    marginBottom: "14px",
  },

  bigStat: {
    minHeight: "112px",
    borderRadius: "26px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background:
      "linear-gradient(145deg, #2563eb, #7c3aed)",
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

  label: {
    margin: 0,
    fontSize: "11px",
    fontWeight: 500,
  },

  bigValue: {
    margin: "5px 0 0",
    fontSize: "25px",
    fontWeight: 750,
  },

  chartBox: {
    borderRadius: "28px",
    padding: "15px",
    marginBottom: "14px",
    backdropFilter: "blur(12px)",
  },

  chartHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  chartTitle: {
    margin: "3px 0 0",
    fontSize: "15px",
  },

  svg: {
    width: "100%",
    height: "125px",
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
    backdropFilter: "blur(12px)",
  },

  infoLeft: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  iconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.18))",
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
      "linear-gradient(90deg, transparent, #2563eb, #7c3aed, transparent)",
    animation:
      "moveLine 2.8s linear infinite",
  },
};

export default Dashboard;