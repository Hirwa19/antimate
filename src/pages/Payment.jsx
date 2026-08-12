import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import PageLoader from "../components/PageLoader";
import { useAppSettings } from "../context/AppSettingsContext";
import API from "../api/api";

function Payment() {
  const { isDark } = useAppSettings();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const bg = isDark
    ? "linear-gradient(135deg,#07111f,#0f2537)"
    : "linear-gradient(135deg,#f8fafc,#e2e8f0)";

  const text = isDark ? "#fff" : "#0f172a";
  const muted = isDark ? "#94a3b8" : "#64748b";

  const cardBg = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.78)";

  const border = isDark
    ? "1px solid rgba(255,255,255,0.12)"
    : "1px solid rgba(15,23,42,0.08)";

  const fetchPayments = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const res = await API.get("/payments");

      const data = res?.data;

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.payments)) {
        list = data.payments;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      }

      setPayments(list);
    } catch (err) {
      console.error("Failed to fetch payment history:", err);

      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            "Could not load your payment history. Please try again."
        );
      }

      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(true);

    const interval = setInterval(() => {
      fetchPayments(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPayments]);

  function getStatusInfo(status) {
    switch (String(status || "").toLowerCase()) {
      case "paid":
      case "success":
      case "successful":
        return {
          label: "Successful",
          color: "#22c55e",
          bg: "rgba(34,197,94,0.16)",
          icon: "✓",
        };

      case "pending":
        return {
          label: "Pending",
          color: "#f59e0b",
          bg: "rgba(245,158,11,0.16)",
          icon: "⏳",
        };

      case "failed":
        return {
          label: "Failed",
          color: "#ef4444",
          bg: "rgba(239,68,68,0.16)",
          icon: "✕",
        };

      case "cancelled":
      case "canceled":
        return {
          label: "Cancelled",
          color: "#94a3b8",
          bg: "rgba(148,163,184,0.16)",
          icon: "−",
        };

      default:
        return {
          label: status || "Unknown",
          color: muted,
          bg: "rgba(148,163,184,0.12)",
          icon: "•",
        };
    }
  }

  function formatDate(date) {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleString();
  }

  function formatAmount(amount) {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return `${Number(amount).toLocaleString()} FRW`;
  }

  function getRemainingTime(payment) {
    if (
      !payment ||
      payment.status !== "pending" ||
      !payment.createdAt
    ) {
      return null;
    }

    const created = new Date(payment.createdAt).getTime();

    if (Number.isNaN(created)) {
      return null;
    }

    const expiresAt = created + 10 * 60 * 1000;
    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      return "Expired";
    }

    const minutes = Math.floor(remaining / 60000);

    const seconds = Math.floor(
      (remaining % 60000) / 1000
    );

    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }

  const successful = payments.filter((payment) =>
    ["paid", "success", "successful"].includes(
      String(payment.status).toLowerCase()
    )
  ).length;

  const pending = payments.filter(
    (payment) =>
      String(payment.status).toLowerCase() === "pending"
  ).length;

  const failed = payments.filter(
    (payment) =>
      String(payment.status).toLowerCase() === "failed"
  ).length;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div
      style={{
        ...styles.page,
        background: bg,
        color: text,
      }}
    >
      <AppHeader title="Payments" />

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Payment History</h1>

          <p
            style={{
              ...styles.subtitle,
              color: muted,
            }}
          >
            View your successful, pending and failed
            subscription payments.
          </p>
        </div>

        <button
          onClick={() => fetchPayments(false)}
          disabled={refreshing}
          style={{
            ...styles.refreshButton,
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={styles.summaryGrid}>
        <SummaryCard
          label="Successful"
          value={successful}
          color="#22c55e"
          background="rgba(34,197,94,0.12)"
        />

        <SummaryCard
          label="Pending"
          value={pending}
          color="#f59e0b"
          background="rgba(245,158,11,0.12)"
        />

        <SummaryCard
          label="Failed"
          value={failed}
          color="#ef4444"
          background="rgba(239,68,68,0.12)"
        />
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div
          style={{
            ...styles.empty,
            background: cardBg,
            border,
          }}
        >
          <div style={styles.emptyIcon}>💳</div>

          <h2 style={{ margin: 0 }}>
            No payments yet
          </h2>

          <p
            style={{
              color: muted,
              lineHeight: 1.6,
            }}
          >
            You haven't made a subscription payment yet.
          </p>

          <Link to="/plan" style={styles.primaryButton}>
            View Plans
          </Link>
        </div>
      ) : (
        <div style={styles.list}>
          {payments.map((payment, index) => {
            const status = getStatusInfo(payment.status);

            const remaining = getRemainingTime(payment);

            return (
              <div
                key={
                  payment._id ||
                  payment.reference ||
                  index
                }
                style={{
                  ...styles.card,
                  background: cardBg,
                  border,
                }}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <p
                      style={{
                        ...styles.smallLabel,
                        color: muted,
                      }}
                    >
                      Plan
                    </p>

                    <h2 style={styles.planName}>
                      {payment.planName ||
                        payment.plan ||
                        "Subscription"}
                    </h2>
                  </div>

                  <div
                    style={{
                      ...styles.statusBadge,
                      background: status.bg,
                      color: status.color,
                    }}
                  >
                    <span>{status.icon}</span>
                    {status.label}
                  </div>
                </div>

                <div style={styles.details}>
                  <PaymentRow
                    label="Amount"
                    value={formatAmount(payment.amount)}
                    muted={muted}
                  />

                  <PaymentRow
                    label="Provider"
                    value={payment.provider || "Paypack Link"}
                    muted={muted}
                  />

                  <PaymentRow
                    label="Reference"
                    value={payment.reference || "—"}
                    muted={muted}
                  />

                  {payment.transactionId && (
                    <PaymentRow
                      label="Transaction ID"
                      value={payment.transactionId}
                      muted={muted}
                    />
                  )}

                  <PaymentRow
                    label="Started"
                    value={formatDate(payment.createdAt)}
                    muted={muted}
                  />
                </div>

                {payment.status === "pending" && (
                  <div style={styles.pendingBox}>
                    <div>
                      <strong>Payment pending</strong>

                      <p style={styles.pendingText}>
                        Waiting for Paypack confirmation.
                      </p>
                    </div>

                    <strong>
                      {remaining || "—"}
                    </strong>
                  </div>
                )}

                {payment.status === "failed" && (
                  <div style={styles.failedBox}>
                    Payment was not completed. You can
                    choose a plan again and retry.
                  </div>
                )}

                {(payment.status === "cancelled" ||
                  payment.status === "canceled") && (
                  <div style={styles.cancelledBox}>
                    This payment was cancelled because it
                    was not completed.
                  </div>
                )}

                {["paid", "success", "successful"].includes(
                  String(payment.status).toLowerCase()
                ) && (
                  <div style={styles.successBox}>
                    ✓ Payment completed successfully.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  background,
}) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "20px",
        background,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          opacity: 0.7,
        }}
      >
        {label}
      </p>

      <strong
        style={{
          display: "block",
          marginTop: "5px",
          fontSize: "25px",
          color,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function PaymentRow({
  label,
  value,
  muted,
}) {
  return (
    <div style={styles.paymentRow}>
      <span
        style={{
          color: muted,
          fontSize: "13px",
        }}
      >
        {label}
      </span>

      <span style={styles.paymentValue}>
        {value}
      </span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    paddingBottom: "120px",
    fontFamily: "Inter, Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "22px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
  },

  subtitle: {
    margin: "7px 0 0",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  refreshButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "13px",
    background: "rgba(37,99,235,0.12)",
    color: "#2563eb",
    fontWeight: 700,
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "10px",
    marginBottom: "20px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  card: {
    borderRadius: "24px",
    padding: "20px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  smallLabel: {
    margin: 0,
    fontSize: "11px",
  },

  planName: {
    margin: "4px 0 0",
    fontSize: "20px",
  },

  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  details: {
    marginTop: "18px",
    borderTop: "1px solid rgba(148,163,184,0.12)",
    paddingTop: "10px",
  },

  paymentRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "7px 0",
  },

  paymentValue: {
    fontWeight: 700,
    fontSize: "13px",
    textAlign: "right",
    wordBreak: "break-word",
    maxWidth: "65%",
  },

  pendingBox: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "16px",
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.25)",
    color: "#f59e0b",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "13px",
  },

  pendingText: {
    margin: "5px 0 0",
  },

  failedBox: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "16px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#ef4444",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  cancelledBox: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "16px",
    background: "rgba(148,163,184,0.1)",
    border: "1px solid rgba(148,163,184,0.2)",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  successBox: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "16px",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.2)",
    color: "#22c55e",
    fontSize: "13px",
    fontWeight: 700,
  },

  empty: {
    maxWidth: "560px",
    margin: "30px auto",
    padding: "40px 25px",
    borderRadius: "26px",
    textAlign: "center",
    backdropFilter: "blur(16px)",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "12px",
  },

  primaryButton: {
    display: "inline-block",
    marginTop: "15px",
    padding: "12px 20px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#7c3aed,#2563eb)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
  },

  error: {
    padding: "13px",
    marginBottom: "16px",
    borderRadius: "15px",
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    fontSize: "13px",
  },
};

export default Payment;