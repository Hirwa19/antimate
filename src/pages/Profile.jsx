import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import PageLoader from "../components/PageLoader";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL = import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

export default function Profile() {
  const navigate = useNavigate();
  const { isDark } = useAppSettings();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);

  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [linking, setLinking] = useState(false);

  async function fetchProfile() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function linkDevice() {
    if (!deviceIdInput || !secretKeyInput) return alert("Fill all fields");

    try {
      setLinking(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/devices/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: deviceIdInput,
          secretKey: secretKeyInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return alert(data.message || "Failed");
      }

      alert("Device linked successfully");
      setShowAddDevice(false);
      setDeviceIdInput("");
      setSecretKeyInput("");
      fetchProfile();
    } catch (err) {
      alert("Error linking device");
    } finally {
      setLinking(false);
    }
  }

  function logout() {
    localStorage.clear();
    navigate("/login");
  }

  if (loading) return <PageLoader />;

  const user = profile?.user;
  const devices = profile?.devices || [];
  const plan = profile?.plan;

  const hasDevice = devices.length > 0;

  return (
    <div style={{
      ...styles.page,
      background: isDark
        ? "#07111f"
        : "#f8fafc",
      color: isDark ? "#fff" : "#0f172a",
    }}>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.title}>Profile</h2>
          <p style={{ fontSize: 12, opacity: 0.7 }}>Account overview</p>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={styles.menuBtn}
        >
          ☰
        </button>
      </div>

      {/* MENU (VERTICAL FIXED) */}
      {menuOpen && (
        <div style={styles.menu}>
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>

          <button onClick={() => navigate("/device-management")}>
            Device Management
          </button>

          <button onClick={() => navigate("/settings")}>Settings</button>

          <button onClick={logout} style={{ color: "red" }}>
            Logout
          </button>
        </div>
      )}

      {/* PROFILE CARD */}
      <div style={styles.card}>
        <div style={styles.avatar}>
          {user?.fullName?.[0]?.toUpperCase() || "U"}
        </div>

        <h3>{user?.fullName}</h3>
        <p>@{user?.username}</p>

        <div style={styles.stats}>
          <div>
            <strong>{devices.length}</strong>
            <span>Device</span>
          </div>

          <div>
            <strong>{plan?.planName || "Free"}</strong>
            <span>Plan</span>
          </div>
        </div>
      </div>

      {/* DEVICE SECTION */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3>Device</h3>

          {!hasDevice && (
            <button
  onClick={() => navigate("/device-management")}
  style={styles.addBtn}
>
  ⚙️ Device Management
</button>
          )}
        </div>

        {hasDevice ? (
          devices.map((d) => (
            <div key={d._id} style={styles.deviceCard}>
              <div>
                <strong>{d.deviceId}</strong>
                <p style={{ fontSize: 12, opacity: 0.6 }}>
                  Status: {d.activationStatus}
                </p>
              </div>

              <button
                onClick={() => navigate("/device-management")}
                style={styles.smallBtn}
              >
                Manage
              </button>
            </div>
          ))
        ) : (
          <p style={{ opacity: 0.6 }}>No device linked</p>
        )}
      </div>

      {/* ADD DEVICE MODAL */}
      {showAddDevice && (
        <div style={styles.modalBg}>
          <div style={styles.modal}>
            <h3>Link Device</h3>

            <input
              placeholder="Device ID"
              value={deviceIdInput}
              onChange={(e) => setDeviceIdInput(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Secret Key"
              value={secretKeyInput}
              onChange={(e) => setSecretKeyInput(e.target.value)}
              style={styles.input}
            />

            <button onClick={linkDevice} style={styles.primaryBtn}>
              {linking ? "Linking..." : "Link"}
            </button>

            <button
              onClick={() => setShowAddDevice(false)}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

/* ========== CLEAN STYLES ========== */
const styles = {
  page: { minHeight: "100vh", padding: 16, paddingBottom: 100 },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: { margin: 0 },

  menuBtn: { padding: 10, borderRadius: 10 },

  menu: {
    position: "absolute",
    right: 10,
    top: 60,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    minWidth: 160,
  },

  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    background: "#ffffff10",
    textAlign: "center",
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
    background: "#22c55e",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 26,
    margin: "0 auto 10px",
  },

  stats: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: 10,
  },

  section: { marginTop: 20 },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  deviceCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    background: "#ffffff10",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
  },

  smallBtn: {
    background: "#22c55e",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 8,
    border: "none",
  },

  modalBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    width: 300,
  },

  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
  },

  cancelBtn: {
    marginTop: 10,
    width: "100%",
    padding: 10,
  },
};