import React, {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import BottomNav from "../components/BottomNav";

import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function History() {
  const { isDark } = useAppSettings();
  const navigate = useNavigate();

  const [planName, setPlanName] = useState("Free");

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] =
    useState("");

  const [selectedDeviceData, setSelectedDeviceData] =
    useState(null);

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] =
    useState(false);

  // =====================================================
  // TOKEN
  // =====================================================

  function getToken() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      throw new Error(
        "You are not logged in."
      );
    }

    return token;
  }

  // =====================================================
  // SUBSCRIPTION
  // =====================================================

  async function fetchSubscription() {
    const token = getToken();

    const res = await fetch(
      `${API_URL}/api/payments/latest`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    let data = {};

    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to load subscription"
      );
    }

    /*
     * Expected examples:
     *
     * {
     *   currentPlan: "Pro"
     * }
     *
     * OR
     *
     * {
     *   planName: "Pro"
     * }
     */

    const currentPlan =
      data.currentPlan ||
      data.planName ||
      data.plan ||
      "Free";

    const normalizedPlan =
      String(currentPlan).trim();

    setPlanName(normalizedPlan);

    return normalizedPlan;
  }

  // =====================================================
  // HISTORY ACCESS
  // =====================================================

  function checkHistoryAccess(plan) {
    const normalized =
      String(plan || "")
        .trim()
        .toLowerCase();

    return normalized !== "free";
  }

  // =====================================================
  // DEVICES
  // =====================================================

  async function fetchDevices() {
    const token = getToken();

    const res = await fetch(
      `${API_URL}/api/devices/my-devices`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    let data = {};

    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to load devices"
      );
    }

    const deviceList =
      Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.devices)
        ? data.devices
        : [];

    setDevices(deviceList);

    if (deviceList.length > 0) {
      const firstDevice =
        deviceList[0];

      const firstDeviceId =
        firstDevice.deviceId ||
        "";

      setSelectedDevice(
        firstDeviceId
      );

      setSelectedDeviceData(
        firstDevice
      );
    } else {
      setSelectedDevice("");
      setSelectedDeviceData(null);
    }

    return deviceList;
  }

  // =====================================================
  // SELECTED DEVICE
  // =====================================================

  useEffect(() => {
    if (!selectedDevice) {
      setSelectedDeviceData(null);
      return;
    }

    const device =
      devices.find(
        (item) =>
          item.deviceId ===
          selectedDevice
      );

    setSelectedDeviceData(
      device || null
    );
  }, [
    selectedDevice,
    devices,
  ]);

  // =====================================================
  // HISTORY
  // =====================================================

  async function fetchHistory(deviceId) {
    if (
      !deviceId ||
      accessDenied
    ) {
      setHistory([]);
      return;
    }

    try {
      const token = getToken();

      setHistoryLoading(true);
      setError("");

      const url =
        `${API_URL}/api/telemetry/history/` +
        `${encodeURIComponent(deviceId)}` +
        `?limit=100`;

      const res = await fetch(
        url,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      // =================================================
      // PLAN RESTRICTION
      // =================================================

      if (res.status === 403) {
        setHistory([]);
        setAccessDenied(true);

        setError(
          data.message ||
            "Your current subscription does not include sensor history."
        );

        return;
      }

      if (!res.ok) {
        throw new Error(
          data.message ||
            `Failed to load sensor history (${res.status})`
        );
      }

      // =================================================
      // NORMALIZE RESPONSE
      // =================================================

      const rawData =
        Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.history)
          ? data.history
          : Array.isArray(data)
          ? data
          : [];

      const sortedHistory =
        [...rawData].sort(
          (a, b) =>
            new Date(
              b.createdAt ||
                b.timestamp ||
                0
            ) -
            new Date(
              a.createdAt ||
                a.timestamp ||
                0
            )
        );

      setHistory(
        sortedHistory
      );
    } catch (err) {
      console.error(
        "History error:",
        err
      );

      setHistory([]);

      setError(
        err.message ||
          "Failed to load sensor history"
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError("");
        setAccessDenied(false);

        // -----------------------------------------------
        // 1. CURRENT PAYMENT / PLAN
        // -----------------------------------------------

        const plan =
          await fetchSubscription();

        if (!mounted) {
          return;
        }

        const allowed =
          checkHistoryAccess(plan);

        if (!allowed) {
          setAccessDenied(true);
          return;
        }

        // -----------------------------------------------
        // 2. DEVICES
        // -----------------------------------------------

        await fetchDevices();
      } catch (err) {
        console.error(
          "History page error:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          err.message ||
            "Failed to load history"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // LOAD HISTORY WHEN DEVICE CHANGES
  // =====================================================

  useEffect(() => {
    if (
      selectedDevice &&
      !accessDenied &&
      !loading
    ) {
      fetchHistory(
        selectedDevice
      );
    }
  }, [
    selectedDevice,
    accessDenied,
    loading,
  ]);

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
  // FORMAT NUMBER
  // =====================================================

  function formatNumber(
    value,
    decimals = 1
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return "--";
    }

    return number.toFixed(
      decimals
    );
  }

  // =====================================================
  // DEVICE CONFIGURATION
  // =====================================================

  const chicksAge =
    selectedDeviceData?.chicksAge ??
    selectedDeviceData?.chickAge ??
    null;

  const numberOfChickens =
    selectedDeviceData?.numberOfChickens ??
    selectedDeviceData?.chickenCount ??
    null;

  const broodingRoomArea =
    selectedDeviceData?.broodingRoomArea ??
    selectedDeviceData?.roomArea ??
    null;

  const chicksType =
    selectedDeviceData?.chicksType ??
    selectedDeviceData?.chickType ??
    "--";

  // =====================================================
  // THEME
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
    : "rgba(255,255,255,0.82)";

  const border = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(15,23,42,0.08)";

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          ...styles.page,
          background,
          color: text,
        }}
      >
        <div
          style={
            styles.loadingPage
          }
        >
          <div
            style={styles.spinner}
          />

          <p
            style={{
              color: muted,
            }}
          >
            Checking subscription...
          </p>
        </div>

        <BottomNav />
      </div>
    );
  }

  // =====================================================
  // ACCESS DENIED
  // =====================================================

  if (accessDenied) {
    return (
      <div
        style={{
          ...styles.page,
          background,
          color: text,
        }}
      >
        <div
          style={styles.header}
        >
          <div>
            <h1
              style={{
                margin: 0,
                marginBottom: 8,
              }}
            >
              Brooder History
            </h1>

            <p
              style={{
                color: muted,
                margin: 0,
              }}
            >
              Historical brooder
              conditions
            </p>
          </div>
        </div>

        <div
          style={{
            ...styles.subscriptionCard,
            background:
              cardBackground,
            border:
              `1px solid ${border}`,
          }}
        >
          <div
            style={styles.lockIcon}
          >
            🔒
          </div>

          <h2
            style={
              styles.subscriptionTitle
            }
          >
            History requires a paid
            plan
          </h2>

          <p
            style={{
              ...styles.subscriptionText,
              color: muted,
            }}
          >
            Your current plan is{" "}
            <strong>
              {planName}
            </strong>
            .
          </p>

          <p
            style={{
              ...styles.subscriptionText,
              color: muted,
            }}
          >
            Upgrade your ANTIMATE
            subscription to access
            historical brooder
            telemetry.
          </p>

          <button
            onClick={() =>
              navigate("/plans")
            }
            style={
              styles.primaryButton
            }
          >
            View Plans
          </button>

          <button
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
            style={
              styles.secondaryButton
            }
          >
            Back to Dashboard
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div
      style={{
        ...styles.page,
        background,
        color: text,
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

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 700px) {
            .history-header {
              flex-direction: column;
              align-items: flex-start !important;
              gap: 14px;
            }

            .analysis-button {
              width: 100%;
            }

            .history-row {
              flex-direction: column;
              align-items: stretch !important;
            }

            .history-grid {
              grid-template-columns: 1fr !important;
            }

            .history-right {
              text-align: left !important;
            }
          }
        `}
      </style>

      {/* LOADING BAR */}

      {historyLoading && (
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

      {/* HEADER */}

      <div
        className="history-header"
        style={styles.header}
      >
        <div>
          <h1
            style={{
              margin: 0,
              marginBottom: 8,
            }}
          >
            Brooder History
          </h1>

          <p
            style={{
              color: muted,
              margin: 0,
            }}
          >
            Historical conditions of
            your brooder
          </p>
        </div>

        <button
          className="analysis-button"
          onClick={() =>
            navigate("/analysis")
          }
          style={
            styles.analysisButton
          }
        >
          📊 View Analysis
        </button>
      </div>

      {/* DEVICE SELECTOR */}

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
            Select brooder
          </label>

          <select
            value={
              selectedDevice
            }
            onChange={(e) =>
              setSelectedDevice(
                e.target.value
              )
            }
            style={{
              ...styles.select,
              background:
                isDark
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
                  {device.deviceName ||
                    device.name ||
                    device.brooderName ||
                    "My Brooder"}
                </option>
              )
            )}
          </select>
        </div>
      )}

      {/* DEVICE CONFIG */}

      {selectedDeviceData && (
        <div
          style={{
            ...styles.configCard,
            background:
              cardBackground,
            border:
              `1px solid ${border}`,
          }}
        >
          <div
            style={styles.configItem}
          >
            <span
              style={{
                ...styles.infoLabel,
                color: muted,
              }}
            >
              🐣 Age
            </span>

            <strong>
              {chicksAge !== null
                ? `${chicksAge} days`
                : "--"}
            </strong>
          </div>

          <div
            style={styles.configItem}
          >
            <span
              style={{
                ...styles.infoLabel,
                color: muted,
              }}
            >
              🐔 Chickens
            </span>

            <strong>
              {numberOfChickens ??
                "--"}
            </strong>
          </div>

          <div
            style={styles.configItem}
          >
            <span
              style={{
                ...styles.infoLabel,
                color: muted,
              }}
            >
              📐 Room
            </span>

            <strong>
              {broodingRoomArea !==
              null
                ? `${formatNumber(
                    broodingRoomArea,
                    2
                  )} m²`
                : "--"}
            </strong>
          </div>

          <div
            style={styles.configItem}
          >
            <span
              style={{
                ...styles.infoLabel,
                color: muted,
              }}
            >
              🐓 Type
            </span>

            <strong
              style={{
                textTransform:
                  "capitalize",
              }}
            >
              {chicksType}
            </strong>
          </div>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div
          style={{
            ...styles.error,
            background:
              isDark
                ? "rgba(239,68,68,0.12)"
                : "rgba(239,68,68,0.08)",
            border:
              "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {error}
        </div>
      )}

      {/* NO DEVICE */}

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
              🐣
            </div>

            <h3>
              No brooder connected
            </h3>

            <p
              style={{
                color: muted,
              }}
            >
              Connect a Smart Brooder
              to start collecting
              historical data.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/device-management"
                )
              }
              style={
                styles.primaryButton
              }
            >
              Add Brooder
            </button>
          </div>
        )}

      {/* NO DATA */}

      {!loading &&
        !historyLoading &&
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
              No brooder data yet
            </h3>

            <p
              style={{
                color: muted,
              }}
            >
              Historical telemetry
              will appear here when
              your Smart Brooder starts
              sending data.
            </p>
          </div>
        )}

      {/* HISTORY */}

      {history.map(
        (item, index) => {
          const temperature =
            item.temperature;

          const humidity =
            item.humidity;

          const heater =
            item.heater || "OFF";

          const fanSpeed =
            Number(
              item.fanSpeed ??
                0
            );

          const fan =
            item.fan || "OFF";

          return (
            <div
              className="history-row"
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
              {/* ENVIRONMENT */}

              <div
                style={
                  styles.mainInfo
                }
              >
                <div
                  style={
                    styles.temperature
                  }
                >
                  <span>
                    🌡️
                  </span>

                  <strong>
                    {formatNumber(
                      temperature
                    )}
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
                    {formatNumber(
                      humidity
                    )}
                    %
                  </span>
                </div>
              </div>

              {/* OUTSIDE ENVIRONMENT */}

              <div
                style={
                  styles.outside
                }
              >
                <span
                  style={{
                    color: muted,
                  }}
                >
                  Outside
                </span>

                <strong>
                  {formatNumber(
                    item.outsideTemperature
                  )}
                  °C
                </strong>

                <span>
                  💧{" "}
                  {formatNumber(
                    item.outsideHumidity
                  )}
                  %
                </span>
              </div>

              {/* ACTUATORS */}

              <div
                className="history-right"
                style={styles.right}
              >
                <p
                  style={
                    styles.status
                  }
                >
                  🔥 Heater{" "}
                  <strong>
                    {String(
                      heater
                    ).toUpperCase()}
                  </strong>
                </p>

                <p
                  style={
                    styles.fan
                  }
                >
                  💨 Fan{" "}
                  {fanSpeed}%
                  {" "}
                  ({String(
                    fan
                  ).toUpperCase()})
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

      <BottomNav />
    </div>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    paddingBottom: "100px",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  loadingPage: {
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },

  spinner: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border:
      "3px solid rgba(148,163,184,0.25)",
    borderTop:
      "3px solid #2563eb",
    animation:
      "spin 0.8s linear infinite",
  },

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
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  analysisButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
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

  configCard: {
    padding: "14px",
    borderRadius: "20px",
    marginBottom: "16px",
    display: "grid",
    gridTemplateColumns:
      "repeat(4,1fr)",
    gap: "10px",
    backdropFilter:
      "blur(12px)",
  },

  configItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "10px",
    borderRadius: "14px",
    background:
      "rgba(148,163,184,0.08)",
  },

  infoLabel: {
    fontSize: "10px",
    fontWeight: 700,
  },

  error: {
    padding: "14px",
    borderRadius: "16px",
    marginBottom: "16px",
    fontSize: "13px",
  },

  row: {
    padding: "18px",
    borderRadius: "22px",
    marginBottom: "14px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    backdropFilter:
      "blur(12px)",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.08)",
  },

  mainInfo: {
    minWidth: "110px",
  },

  temperature: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "20px",
  },

  humidity: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
    fontSize: "14px",
  },

  outside: {
    minWidth: "130px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "12px",
  },

  right: {
    minWidth: "145px",
    textAlign: "right",
  },

  status: {
    margin: 0,
    fontSize: "13px",
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

  subscriptionCard: {
    maxWidth: "520px",
    margin: "50px auto 0",
    padding: "35px 25px",
    borderRadius: "28px",
    textAlign: "center",
    backdropFilter:
      "blur(14px)",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.18)",
  },

  lockIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },

  subscriptionTitle: {
    margin: "0 0 12px",
    fontSize: "22px",
  },

  subscriptionText: {
    fontSize: "14px",
    lineHeight: 1.6,
    margin: "8px 0",
  },

  primaryButton: {
    marginTop: "18px",
    padding: "12px 20px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    display: "block",
    width: "100%",
    marginTop: "10px",
    padding: "11px 18px",
    border:
      "1px solid rgba(148,163,184,0.25)",
    borderRadius: "14px",
    background: "transparent",
    color: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
};