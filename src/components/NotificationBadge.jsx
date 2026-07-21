import React, { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://brooder-backend.onrender.com";

export default function NotificationBadge() {
  const [count, setCount] = useState(0);

  async function fetchCount() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/notifications/count/new`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (typeof data.count === "number") {
        setCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }

  useEffect(() => {
    fetchCount();

    const interval = setInterval(fetchCount, 10000);

    return () => clearInterval(interval);
  }, []);

  if (count <= 0) return null;

  return (
    <span style={styles.badge}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

const styles = {
  badge: {
    minWidth: "20px",
    height: "20px",
    padding: "0 6px",
    borderRadius: "999px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "8px",
  },
};