import React, { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "../components/QRScanner";

// Optional: If you use lucide-react, import icons here.
// Standard SVG fallback icons are used below so this works out-of-the-box!

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

  // ================= LOAD USER DEVICES =================
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

  // ================= QR SCAN =================
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

  // ================= CLAIM DEVICE =================
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

  // ================= RELEASE =================
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
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 antialiased">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Device Manager
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Connect and manage your hardware devices seamlessly.
            </p>
          </div>
          <button
            onClick={loadDevices}
            disabled={loadingDevices}
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:bg-slate-100 transition-all disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loadingDevices ? "animate-spin text-blue-600" : "text-slate-500"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* CONNECT DEVICE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              Connect New Device
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your preferred method to register a new unit to your account.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Segmented Mode Selector */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setMode("QR")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "QR"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <span>📷</span> Scan QR Code
              </button>

              <button
                type="button"
                onClick={() => setMode("KEY")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "KEY"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <span>🔑</span> Manual Key
              </button>
            </div>

            {/* Mode Content */}
            {mode === "QR" && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-slate-900/20 active:scale-[0.99]"
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  {showScanner ? "Close Camera Scanner" : "Open Camera Scanner"}
                </button>

                {showScanner && (
                  <div className="mt-4 p-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50 flex flex-col items-center justify-center">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-black">
                      <QRScanner onScan={handleQR} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === "KEY" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Device ID
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    placeholder="e.g. BRD-9042-X"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Device Key
                  </label>
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    placeholder="••••••••••••"
                    value={deviceKey}
                    onChange={(e) => setDeviceKey(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Verification Preview Card */}
            {deviceId && (
              <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-emerald-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                    ID
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider">Target Device</p>
                    <p className="font-mono text-sm font-bold">{deviceId}</p>
                  </div>
                </div>

                {qrToken && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    QR Token Verified
                  </span>
                )}
              </div>
            )}

            {/* Claim Action */}
            <button
              disabled={loading || !deviceId}
              onClick={claimDevice}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-3 px-4 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connecting Device...</span>
                </>
              ) : (
                <span>Connect Device</span>
              )}
            </button>
          </div>
        </div>

        {/* DEVICE LIST SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Connected Devices
            </h2>
            <span className="text-xs font-medium bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
              {devices.length} {devices.length === 1 ? "device" : "devices"}
            </span>
          </div>

          {loadingDevices ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                  </div>
                  <div className="h-9 bg-slate-100 rounded-xl w-24"></div>
                </div>
              ))}
            </div>
          ) : devices.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-10 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                📡
              </div>
              <h3 className="text-slate-800 font-semibold text-sm">No devices connected</h3>
              <p className="text-slate-500 text-xs mt-1">Use the section above to pair your first hardware unit.</p>
            </div>
          ) : (
            /* Device Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device) => {
                const isActive = device.activationStatus === "active" || device.activationStatus === "ONLINE";

                return (
                  <div
                    key={device._id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top bar in card */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl font-mono text-xs font-bold">
                            DEV
                          </span>
                          <h3 className="font-mono font-bold text-slate-900 text-base tracking-tight">
                            {device.deviceId}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {device.activationStatus || "Unknown"}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <span>Last seen:</span>
                          <span className="font-medium text-slate-700">
                            {device.lastSeen
                              ? new Date(device.lastSeen).toLocaleString()
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => releaseDevice(device)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3.5 py-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
  );
}