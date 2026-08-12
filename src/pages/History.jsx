import React, { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function History() {
  const { isDark } = useAppSettings();

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] =
    useState("");

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH USER DEVICES
  // =====================================================

  async function fetchDevices() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/devices/my-devices`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to load devices"
        );
      }

      const deviceList =
        Array.isArray(data)
          ? data
          : data.data || [];

      setDevices(deviceList);

      if (deviceList.length > 0) {
        setSelectedDevice(
          deviceList[0].deviceId
        );
      }
    } catch (err) {
      console.error(
        "Devices error:",
        err
      );

      setError(
        err.message ||
          "Failed to load devices"
      );
    }
  }

  // =====================================================
  // FETCH HISTORY
  // =====================================================

  async function fetchHistory(deviceId) {
    if (!deviceId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_URL}/api/telemetry/history/${encodeURIComponent(
          deviceId
        )}?limit=100`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to load history"
        );
      }

      setHistory(
        Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (err) {
      console.error(
        "History error:",
        err
      );

      setHistory([]);

      setError(
        err.message ||
          "Failed to load history"
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchDevices();
  }, []);

  // =====================================================
  // LOAD SELECTED DEVICE HISTORY
  // =====================================================

  useEffect(() => {
    if (selectedDevice) {
      fetchHistory(selectedDevice);
    }
  }, [selectedDevice]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatDate(date) {
    if (!date) {
      return "Unknown time";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Unknown time";
    }

    return parsed.toLocaleString();
  }

  // =====================================================
  // COLORS
  // =====================================================

  const background = isDark
    ? "linear-gradient(135deg,#07111f,#0f2537)"
    : "linear-gradient(135deg,#f8fafc,#e2e8f0)";

  const text = isDark
    ? "#ffffff"
    : "#111827";

  const muted = isDark
    ? "#94a3b8"
    : "#64748b";

  const cardBackground = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.8)";

  const border = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(15,23,42,0.08)";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        paddingBottom: "100px",
        background,
        color: text,
        fontFamily:
          "Inter, Arial",
        position: "relative",
      }}
    >
      <style>
        {`
          @keyframes loadingMove {
            0% {
              transform: translateX(-100%);
            }

            100% {
              transform: translateX(300%);
            }
          }
        `}
      </style>

      {/* =================================================
          LOADING BAR
      ================================================= */}

      {loading && (
        <div
          style={
            styles.loadingContainer
          }
        >
          <div
            style={
              styles.loadingBar
            }
          />
        </div>
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <div style={styles.header}>
        <div>
          <h1
            style={{
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Sensor History
          </h1>

          <p
            style={{
              color: muted,
              margin: 0,
            }}
          >
            Temperature and humidity
            records
          </p>
        </div>
      </div>

      {/* =================================================
          DEVICE SELECTOR
      ================================================= */}

      {devices.length > 0 && (
        <div
          style={{
            ...styles.selectorCard,
            background:
              cardBackground,
            border:
              `1px solid ${border}`,
          }}
        >
          <label
            style={{
              ...styles.selectorLabel,
              color: muted,
            }}
          >
            Select device
          </label>

          <select
            value={selectedDevice}
            onChange={(e) =>
              setSelectedDevice(
                e.target.value
              )
            }
            style={{
              ...styles.select,
              background: isDark
                ? "#172033"
                : "#ffffff",
              color: text,
              border:
                `1px solid ${border}`,
            }}
          >
            {devices.map(
              (device) => (
                <option
                  key={
                    device._id ||
                    device.deviceId
                  }
                  value={
                    device.deviceId
                  }
                >
                  {device.deviceId}
                </option>
              )
            )}
          </select>
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          style={{
            ...styles.error,
            background: isDark
              ? "rgba(239,68,68,0.12)"
              : "rgba(239,68,68,0.08)",
            border:
              "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {error}
        </div>
      )}

      {/* =================================================
          NO DEVICES
      ================================================= */}

      {!loading &&
        devices.length === 0 &&
        !error && (
          <div
            style={{
              ...styles.empty,
              background:
                cardBackground,
            }}
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              📡
            </div>

            <h3>
              No device connected
            </h3>

            <p
              style={{
                color: muted,
              }}
            >
              Connect a device to
              start receiving sensor
              history.
            </p>
          </div>
        )}

      {/* =================================================
          NO HISTORY
      ================================================= */}

      {!loading &&
        devices.length > 0 &&
        history.length === 0 &&
        !error && (
          <div
            style={{
              ...styles.empty,
              background:
                cardBackground,
            }}
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              📊
            </div>

            <h3>
              No sensor data yet
            </h3>

            <p
              style={{
                color: muted,
              }}
            >
              Telemetry from this
              device will appear here
              once the device starts
              sending data.
            </p>
          </div>
        )}

      {/* =================================================
          HISTORY
      ================================================= */}

      <div>
        {history.map(
          (item, index) => {
            const temperature =
              item.temperature ??
              "--";

            const humidity =
              item.humidity ??
              "--";

            const heater =
              item.heater ||
              "OFF";

            const fan =
              item.fanSpeed ??
              0;

            return (
              <div
                key={
                  item._id ||
                  `${item.createdAt}-${index}`
                }
                style={{
                  ...styles.row,
                  background:
                    cardBackground,
                  border:
                    `1px solid ${border}`,
                }}
              >
                {/* LEFT */}

                <div>
                  <div
                    style={
                      styles.temperature
                    }
                  >
                    <span>
                      🌡
                    </span>

                    <strong>
                      {temperature}
                      °C
                    </strong>
                  </div>

                  <div
                    style={
                      styles.humidity
                    }
                  >
                    <span>
                      💧
                    </span>

                    <span>
                      {humidity}%
                    </span>
                  </div>
                </div>

                {/* RIGHT */}

                <div
                  style={
                    styles.right
                  }
                >
                  <p
                    style={
                      styles.status
                    }
                  >
                    🔥{" "}
                    {heater}
                  </p>

                  <p
                    style={
                      styles.fan
                    }
                  >
                    💨 Fan{" "}
                    {fan}%
                  </p>

                  <p
                    style={{
                      ...styles.date,
                      color: muted,
                    }}
                  >
                    {formatDate(
                      item.createdAt
                    )}
                  </p>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <BottomNav />
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  loadingContainer: {
    position: "fixed",
    bottom: "72px",
    left: 0,
    width: "100%",
    height: "4px",
    overflow: "hidden",
    zIndex: 999,
  },

  loadingBar: {
    height: "100%",
    width: "40%",
    background:
      "linear-gradient(90deg,#22c55e,#06b6d4,#7c3aed)",
    animation:
      "loadingMove 1.2s infinite linear",
  },

  header: {
    marginBottom: "22px",
  },

  selectorCard: {
    padding: "14px",
    borderRadius: "20px",
    marginBottom: "16px",
    backdropFilter:
      "blur(12px)",
  },

  selectorLabel: {
    display: "block",
    fontSize: "12px",
    marginBottom: "8px",
    fontWeight: 600,
  },

  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    outline: "none",
    fontSize: "14px",
  },

  error: {
    padding: "14px",
    borderRadius: "16px",
    marginBottom: "16px",
    fontSize: "13px",
  },

  row: {
    padding: "18px",
    borderRadius: "20px",
    marginBottom: "14px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    backdropFilter:
      "blur(12px)",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.08)",
  },

  temperature: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "18px",
  },

  humidity: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
    fontSize: "14px",
  },

  right: {
    textAlign: "right",
  },

  status: {
    margin: 0,
    fontSize: "14px",
  },

  fan: {
    margin: "7px 0",
    fontSize: "12px",
    opacity: 0.8,
  },

  date: {
    margin: 0,
    fontSize: "11px",
  },

  empty: {
    padding: "40px 20px",
    textAlign: "center",
    borderRadius: "24px",
    backdropFilter:
      "blur(12px)",
  },

  emptyIcon: {
    fontSize: "35px",
    marginBottom: "10px",
  },
};