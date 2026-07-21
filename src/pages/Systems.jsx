import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import API from "../api/api";

function Systems() {
  const [systems, setSystems] = useState([]);
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const fetchSystems = async () => {
    try {
      const res = await API.get("/systems");
      setSystems(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const addSystem = async () => {
    try {
      await API.post("/systems", {
        name,
        serialNumber,
      });

      setName("");
      setSerialNumber("");

      fetchSystems();
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "20px",
        paddingBottom: "100px",
      }}
    >
      <AppHeader title="Systems" />

      <div
        style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "20px",
        }}
      >
        <input
          placeholder="System Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Serial Number"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={addSystem}
          style={buttonStyle}
        >
          Add System
        </button>
      </div>

      {systems.map((system) => (
        <div
          key={system._id}
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "20px",
            marginTop: "15px",
          }}
        >
          <h3>{system.name}</h3>

          <p>Serial: {system.serialNumber}</p>

          <p
            style={{
              color:
                system.status === "Online"
                  ? "#00ff99"
                  : "#ef4444",
            }}
          >
            {system.status}
          </p>
        </div>
      ))}

      <BottomNav />
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "none",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#00ff99",
  fontWeight: "bold",
};

export default Systems;