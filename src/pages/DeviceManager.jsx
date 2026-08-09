import React, { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "../components/QRScanner";

const API = import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

export default function DeviceManager() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [devices, setDevices] = useState([]);
  const [mode, setMode] = useState("QR");
  const [showScanner, setShowScanner] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      const res = await axios.get(`${API}/api/devices/my-devices`, { headers });
      setDevices(res.data.data || res.data || []);
    } catch (err) {
      console.log("LOAD DEVICES ERROR", err.response?.data || err.message);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleQR = (data) => {
    try {
      const qr = JSON.parse(data);
      setDeviceId(qr.deviceId);
      setQrToken(qr.qrToken);
      setShowScanner(false);
    } catch (err) {
      alert("Invalid QR Code");
    }
  };

  const claimDevice = async () => {
    try {
      setLoading(true);
      if (mode === "QR") {
        await axios.post(`${API}/api/devices/verify`, { deviceId, qrToken }, { headers });
      }
      if (mode === "KEY") {
        await axios.post(`${API}/api/devices/verify-key`, { deviceId, deviceKey }, { headers });
      }
      await axios.post(`${API}/api/devices/claim`, { deviceId }, { headers });

      alert("Device connected successfully ✅");
      setDeviceId("");
      setQrToken("");
      setDeviceKey("");
      loadDevices();
    } catch (err) {
      console.log("CLAIM ERROR", err.response?.data || err.message);
      alert(err.response?.data?.message || "Device connection failed");
    } finally {
      setLoading(false);
    }
  };

  const releaseDevice = async (device) => {
    const key = prompt("Enter device key");
    if (!key) return;

    try {
      await axios.post(
        `${API}/api/devices/${device.deviceId}/release`,
        { deviceKey: key },
        { headers }
      );
      alert("Device released");
      loadDevices();
    } catch (err) {
      alert(err.response?.data?.message || "Release failed");
    }
  };

  return (
    <>
      <style>{`
        .dm-container {
          min-height: 100vh;
          background-color: #f8fafc;
          color: #1e293b;
          padding: 2rem 1rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .dm-wrapper {
          max-width: 64rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .dm-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1.25rem;
        }
        .dm-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .dm-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.25rem;
        }
        .dm-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .dm-btn-secondary:hover {
          background-color: #f8fafc;
        }
        .dm-card {
          background: #ffffff;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .dm-card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .dm-card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        .dm-card-subtitle {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }
        .dm-card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .dm-tabs {
          display: inline-flex;
          padding: 0.25rem;
          background-color: #f1f5f9;
          border-radius: 0.75rem;
          gap: 0.25rem;
          align-self: flex-start;
        }
        .dm-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dm-tab.active {
          background-color: #ffffff;
          color: #2563eb;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .dm-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
        }
        .dm-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.375rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .dm-input {
          width: 100%;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          box-sizing: border-box;
          outline: none;
          transition: all 0.2s;
        }
        .dm-input:focus {
          background-color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        .dm-btn-primary {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background-color: #2563eb;
          color: #ffffff;
          font-weight: 500;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dm-btn-primary:hover:not(:disabled) {
          background-color: #1d4ed8;
        }
        .dm-btn-primary:disabled {
          background-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .dm-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 0.75rem;
          padding: 1rem;
          color: #065f46;
        }
        .dm-badge-active {
          background-color: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .dm-badge-inactive {
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .dm-btn-danger {
          background-color: #fff1f2;
          color: #e11d48;
          border: none;
          padding: 0.5rem 0.875rem;
          border-radius: 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dm-btn-danger:hover {
          background-color: #ffe4e6;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="dm-container">
        <div className="dm-wrapper">
          {/* Header */}
          <div className="dm-header">
            <div>
              <h1 className="dm-title">Device Manager</h1>
              <p className="dm-subtitle">
                Connect and manage your hardware devices seamlessly.
              </p>
            </div>
            <button
              onClick={loadDevices}
              disabled={loadingDevices}
              className="dm-btn-secondary"
            >
              <svg
                className={`spin`}
                style={{ width: "16px", height: "16px", display: loadingDevices ? "block" : "none" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Connect Device Form */}
          <div className="dm-card">
            <div className="dm-card-header">
              <h2 className="dm-card-title">Connect New Device</h2>
              <p className="dm-card-subtitle">
                Choose your preferred method to register a new unit.
              </p>
            </div>

            <div className="dm-card-body">
              <div className="dm-tabs">
                <button
                  type="button"
                  onClick={() => setMode("QR")}
                  className={`dm-tab ${mode === "QR" ? "active" : ""}`}
                >
                  📷 Scan QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setMode("KEY")}
                  className={`dm-tab ${mode === "KEY" ? "active" : ""}`}
                >
                  🔑 Manual Key
                </button>
              </div>

              {mode === "QR" && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowScanner(!showScanner)}
                    className="dm-btn-secondary"
                    style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
                  >
                    {showScanner ? "Close Camera Scanner" : "Open Camera Scanner"}
                  </button>

                  {showScanner && (
                    <div style={{ marginTop: "1rem", padding: "1rem", border: "2px dashed #cbd5e1", borderRadius: "1rem", background: "#f8fafc" }}>
                      <div style={{ maxWidth: "400px", margin: "0 auto", overflow: "hidden", borderRadius: "0.75rem", background: "#000" }}>
                        <QRScanner onScan={handleQR} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === "KEY" && (
                <div className="dm-grid-2">
                  <div>
                    <label className="dm-label">Device ID</label>
                    <input
                      className="dm-input"
                      placeholder="e.g. BRD-9042-X"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="dm-label">Device Key</label>
                    <input
                      type="password"
                      className="dm-input"
                      placeholder="••••••••••••"
                      value={deviceKey}
                      onChange={(e) => setDeviceKey(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {deviceId && (
                <div className="dm-preview">
                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Target Device</span>
                    <div style={{ fontFamily: "monospace", fontWeight: 700 }}>{deviceId}</div>
                  </div>
                  {qrToken && (
                    <span className="dm-badge-active">✓ Verified</span>
                  )}
                </div>
              )}

              <button
                disabled={loading || !deviceId}
                onClick={claimDevice}
                className="dm-btn-primary"
              >
                {loading ? "Connecting Device..." : "Connect Device"}
              </button>
            </div>
          </div>

          {/* Connected Devices List */}
          <div>
            <h2 className="dm-card-title" style={{ marginBottom: "1rem" }}>
              Connected Devices ({devices.length})
            </h2>

            {loadingDevices ? (
              <p style={{ color: "#64748b" }}>Loading devices...</p>
            ) : devices.length === 0 ? (
              <div className="dm-card" style={{ padding: "2.5rem", textAlign: "center", borderStyle: "dashed" }}>
                <p style={{ color: "#64748b", margin: 0 }}>No devices connected yet.</p>
              </div>
            ) : (
              <div className="dm-grid-2">
                {devices.map((device) => {
                  const isActive = device.activationStatus === "active" || device.activationStatus === "ONLINE";
                  return (
                    <div key={device._id} className="dm-card" style={{ padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "1.125rem" }}>
                          {device.deviceId}
                        </span>
                        <span className={isActive ? "dm-badge-active" : "dm-badge-inactive"}>
                          {device.activationStatus || "Unknown"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem" }}>
                        Last seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <button onClick={() => releaseDevice(device)} className="dm-btn-danger">
                          Release Device
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}