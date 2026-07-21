import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import PageLoader from "../components/PageLoader";
import { useAppSettings } from "../context/AppSettingsContext";
import API from "../api/api";

// Real payment status / receipt page.
// Shows the user's most recent payment attempt (from /api/payments/latest)
// instead of hardcoded placeholder data. This is where someone lands to
// check whether their last Paypack payment went through, since Paypack
// itself controls the in-browser redirect and there's no guaranteed
// return path straight back into the app after paying.
function Payment() {
  const { isDark } = useAppSettings();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchLatestPayment() {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/payments/latest");
      setPayment(res.data || null);
    } catch (err) {
      console.error("Failed to fetch payment status:", err);
      setError("Could not load your payment status. Please try again.");
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLatestPayment();
  }, []);

  if (loading) return <PageLoader />;

  const bg = isDark
    ? "linear-gradient(135deg, #07111f, #0f2537)"
    : "linear-gradient(135deg, #f8fafc, #e2e8f0)";
  const text = isDark ? "#fff" : "#0f172a";
  const muted = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.78)";
  const border = isDark
    ? "1px solid rgba(255,255,255,0.12)"
    : "1px solid rgba(15,23,42,0.08)";

  const statusStyles = {
    paid: { color: "#22c55e", bg: "rgba(34,197,94,0.16)", label: "Paid" },
    pending: {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.16)",
      label: "Pending",
    },
    failed: { color: "#ef4444", bg: "rgba(239,68,68,0.16)", label: "Failed" },
    cancelled: {
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.16)",
      label: "Cancelled",
    },
  };

  const statusInfo =
    statusStyles[payment?.status] || {
      color: muted,
      bg: "rgba(148,163,184,0.12)",
      label: "No payment yet",
    };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        color: text,
        padding: "30px",
        paddingBottom: "120px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <AppHeader title="Payment Status" />

      <div
        style={{
          background: cardBg,
          border,
          borderRadius: "24px",
          padding: "24px",
          backdropFilter: "blur(16px)",
          maxWidth: "560px",
        }}
      >
        {!payment ? (
          <>
            <h2 style={{ margin: 0 }}>No payments yet</h2>
            <p style={{ color: muted, marginTop: "10px", lineHeight: 1.6 }}>
              You haven't started a subscription payment yet. Choose a plan
              to get started.
            </p>
            <Link
              to="/plan"
              style={{
                display: "inline-block",
                marginTop: "18px",
                padding: "12px 18px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                color: "#fff",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              View Plans
            </Link>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div>
                <p style={{ margin: 0, color: muted, fontSize: "13px" }}>
                  Plan
                </p>
                <h2 style={{ margin: "4px 0 0", fontSize: "26px" }}>
                  {payment.planName}
                </h2>
              </div>

              <span
                style={{
                  padding: "8px 13px",
                  borderRadius: "999px",
                  fontWeight: 800,
                  fontSize: "13px",
                  background: statusInfo.bg,
                  color: statusInfo.color,
                  whiteSpace: "nowrap",
                }}
              >
                {statusInfo.label}
              </span>
            </div>

            <div
              style={{
                marginTop: "22px",
                display: "grid",
                gap: "12px",
                fontSize: "14px",
              }}
            >
              <Row label="Amount" value={`${payment.amount} FRW`} muted={muted} />
              <Row
                label="Provider"
                value={payment.provider || "Paypack Link"}
                muted={muted}
              />
              <Row
                label="Reference"
                value={payment.reference || "—"}
                muted={muted}
              />
              {payment.transactionId && (
                <Row
                  label="Transaction ID"
                  value={payment.transactionId}
                  muted={muted}
                />
              )}
              <Row
                label="Started"
                value={
                  payment.createdAt
                    ? new Date(payment.createdAt).toLocaleString()
                    : "—"
                }
                muted={muted}
              />
            </div>

            {payment.status === "pending" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "14px",
                  borderRadius: "16px",
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  color: isDark ? "#fde68a" : "#92400e",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                Your payment is still pending. If you already approved it on
                your phone, this will update automatically once Paypack
                confirms it. You can refresh below to check again.
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "22px" }}>
              <button
                onClick={fetchLatestPayment}
                style={{
                  padding: "12px 18px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.08)",
                  color: text,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>

              <Link
                to="/plan"
                style={{
                  padding: "12px 18px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  color: "#fff",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Manage Plan
              </Link>
            </div>
          </>
        )}

        {error && (
          <p style={{ color: "#fca5a5", marginTop: "16px", fontSize: "13px" }}>
            {error}
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
      <span style={{ color: muted }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default Payment;
