import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BottomNav from "../components/BottomNav";
import PageLoader from "../components/PageLoader";
import { useAppSettings } from "../context/AppSettingsContext";
import SuccessModal from "../components/SuccessModal";
import PaymentModal from "../components/PaymentModal";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function Plan() {
  const { isDark } = useAppSettings();
  const navigate = useNavigate();

  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      name: "Free",
      price: 0,
      displayPrice: "0 FRW",
      paymentLink: null,
      tag: "Starter",
      description: "For testing Smart Brooder features.",
      features: [
        "Live dashboard",
        "Basic temperature view",
        "Basic humidity view",
        "Limited history",
      ],
    },
    {
      name: "Basic",
      price: 3000,
      displayPrice: "3,000 FRW",
      paymentLink:
        "https://payments.paypack.rw/link/plink_Pr1eEHnvXFWRFYb80bmR",
      tag: "Recommended",
      description: "Best for small poultry farmers.",
      features: [
        "Push notifications",
        "Temperature alerts",
        "Humidity alerts",
        "Notification history",
      ],
    },
    {
      name: "Pro",
      price: 7000,
      displayPrice: "7,000 FRW",
      paymentLink:
        "https://payments.paypack.rw/link/plink_6LIEZWtJQSg6GgScYG14",
      tag: "Smart",
      description: "For farmers managing multiple brooders.",
      features: [
        "Everything in Basic",
        "Multiple brooders",
        "Advanced analytics",
        "Device health alerts",
      ],
    },
    {
      name: "Premium",
      price: 15000,
      displayPrice: "15,000 FRW",
      paymentLink:
        "https://payments.paypack.rw/link/plink_aOyQzpAVFiEHPSlecei5",
      tag: "Business",
      description: "For commercial farms.",
      features: [
        "Everything in Pro",
        "AI recommendations",
        "Power loss alerts",
        "Business reports",
      ],
    },
  ];

  // =====================================================
  // FETCH CURRENT SUBSCRIPTION
  // =====================================================

  async function fetchCurrentPlan() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // 1. Try fetching from /api/payments/current
      const res = await fetch(`${API_URL}/api/payments/current`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      let payment = data?.payment || data?.currentPayment || data;

      // 2. Fallback: If /api/payments/current returned empty/failed, try /api/profile/me
      if (!payment || payment.message === "No active subscription found" || !res.ok) {
        const profileRes = await fetch(`${API_URL}/api/profile/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const profileData = await profileRes.json();
        payment = profileData?.payment || profileData?.plan;
      }

      setCurrentPlan(payment || null);
    } catch (error) {
      console.error("Failed to fetch current subscription:", error);
      setCurrentPlan(null);
    } finally {
      setLoading(false);
    }
  }

  // Helper to extract active plan name
  function getActivePlanDetails() {
    if (!currentPlan) return { name: "Free", status: "free", expiry: null };

    const planName = currentPlan.planName || currentPlan.plan || currentPlan.name || "Free";
    const rawStatus = String(currentPlan.status || "").toLowerCase().trim();

    // Accept all common status variations from Paypack / webhook
    const validStatuses = ["active", "paid", "completed", "success", "successful", "approved"];
    const isActiveStatus = validStatuses.includes(rawStatus);

    // Expiry check
    const expiryDate = currentPlan.expiryDate ? new Date(currentPlan.expiryDate) : null;
    const isExpired = expiryDate && expiryDate <= new Date();

    if (planName === "Free" || (!isActiveStatus && rawStatus !== "active") || isExpired) {
      return {
        name: "Free",
        status: isExpired ? "expired" : rawStatus || "free",
        expiry: null,
      };
    }

    return {
      name: planName,
      status: rawStatus || "active",
      expiry: currentPlan.expiryDate,
    };
  }

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  const { name: currentPlanName, status: currentStatus, expiry: expiryDate } = getActivePlanDetails();
  const paidPlanRunning = currentPlanName !== "Free";

  return (
    <div
      style={{
        ...styles.page,
        background: isDark
          ? "linear-gradient(135deg, #07111f, #0f2537)"
          : "linear-gradient(135deg, #f8fafc, #e2e8f0)",
        color: isDark ? "#fff" : "#0f172a",
      }}
    >
      {/* HERO */}
      <div style={styles.hero}>
        <span
          style={{
            ...styles.heroBadge,
            background: isDark
              ? "rgba(45,212,191,0.12)"
              : "rgba(15,118,110,0.09)",
            color: isDark ? "#5eead4" : "#0f766e",
          }}
        >
          Smart Brooder Plans
        </span>

        <h1 style={styles.title}>Choose your brooder plan</h1>

        <p
          style={{
            ...styles.subtitle,
            color: isDark ? "#a9b7c6" : "#64748b",
          }}
        >
          Manage your subscription, alerts, analytics, and monitoring level.
        </p>
      </div>

      {/* CURRENT PLAN BOX */}
      <div style={styles.currentBox}>
        <div>
          <p
            style={{
              ...styles.smallText,
              color: isDark ? "#94a3b8" : "#64748b",
            }}
          >
            Current Plan
          </p>

          <h2 style={styles.currentTitle}>{currentPlanName}</h2>

          <p
            style={{
              ...styles.expiry,
              color: isDark ? "#cbd5e1" : "#475569",
            }}
          >
            Expires:{" "}
            {currentPlanName !== "Free" && expiryDate
              ? new Date(expiryDate).toLocaleDateString()
              : "No expiry"}
          </p>
        </div>

        <span style={styles.activePill}>
          {currentPlanName === "Free" ? "free" : currentStatus}
        </span>
      </div>

      {/* PAYMENT HISTORY */}
      <Link to="/payment" style={styles.paymentStatusLink}>
        💳 Payment History →
      </Link>

      {/* PLANS GRID */}
      <div style={styles.grid}>
        {plans.map((plan) => {
          const active = currentPlanName.toLowerCase() === plan.name.toLowerCase();
          const highlighted = plan.name === "Basic";
          const isFreePlan = plan.name === "Free";
          const blockedByActivePlan = paidPlanRunning && !active && !isFreePlan;

          return (
            <div
              key={plan.name}
              style={{
                ...styles.card,
                background: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.78)",
                border: active
                  ? "1px solid #2dd4bf"
                  : isDark
                  ? "1px solid rgba(255,255,255,0.12)"
                  : "1px solid rgba(15,23,42,0.08)",
                transform: highlighted ? "translateY(-6px)" : "none",
              }}
            >
              <div style={styles.cardTop}>
                <div>
                  <h2 style={styles.planName}>{plan.name}</h2>
                  <p
                    style={{
                      ...styles.description,
                      color: isDark ? "#a9b7c6" : "#64748b",
                    }}
                  >
                    {plan.description}
                  </p>
                </div>

                <span style={styles.tag}>{plan.tag}</span>
              </div>

              <div style={styles.priceBox}>
                <strong style={styles.price}>{plan.displayPrice}</strong>
                <span
                  style={{
                    ...styles.perMonth,
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                >
                  / month
                </span>
              </div>

              <div style={styles.features}>
                {plan.features.map((feature) => (
                  <div key={feature} style={styles.featureItem}>
                    <span style={styles.check}>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {isFreePlan ? (
                <button
                  disabled
                  style={{
                    ...styles.button,
                    background: active
                      ? "rgba(34,197,94,0.18)"
                      : "rgba(148,163,184,0.18)",
                    color: active ? "#22c55e" : "#94a3b8",
                    cursor: "not-allowed",
                  }}
                >
                  {active ? "Current Free Plan" : "Free Plan"}
                </button>
              ) : (
                <button
                  disabled={active || updating || blockedByActivePlan}
                  onClick={() => {
                    if (blockedByActivePlan || active) return;
                    setSelectedPlan(plan);
                    setPaymentOpen(true);
                  }}
                  style={{
                    ...styles.button,
                    opacity: updating || blockedByActivePlan ? 0.65 : 1,
                    background: active
                      ? "rgba(34,197,94,0.18)"
                      : blockedByActivePlan
                      ? "rgba(148,163,184,0.18)"
                      : "linear-gradient(135deg, #7c3aed, #2563eb)",
                    color: active
                      ? "#22c55e"
                      : blockedByActivePlan
                      ? "#94a3b8"
                      : "#fff",
                    cursor:
                      active || blockedByActivePlan
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {active
                    ? "Current Plan"
                    : blockedByActivePlan
                    ? "Active Plan Running"
                    : updating
                    ? "Updating..."
                    : "Choose Plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />

      <SuccessModal
        open={successOpen}
        title="Plan Activated"
        message={`Your ${currentPlanName} plan is now active.`}
        onClose={() => setSuccessOpen(false)}
      />

      <PaymentModal
        open={paymentOpen}
        plan={selectedPlan}
        onClose={() => setPaymentOpen(false)}
        onConfirm={async ({ plan }) => {
          const token = localStorage.getItem("token");

          if (!token) {
            navigate("/login");
            return;
          }

          setUpdating(true);

          try {
            const res = await fetch(`${API_URL}/api/payments/start`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                planName: plan.name,
              }),
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data?.message || "Failed to start payment");
            }

            if (data.paymentLink) {
              window.open(data.paymentLink, "_self");
              return;
            }

            setPaymentOpen(false);
            await fetchCurrentPlan();
          } catch (error) {
            console.error("Payment start error:", error);
            alert(error.message || "Failed to start payment");
          } finally {
            setUpdating(false);
          }
        }}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    paddingBottom: "120px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  hero: {
    maxWidth: "850px",
    marginBottom: "26px",
  },
  heroBadge: {
    display: "inline-flex",
    padding: "8px 13px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    fontSize: "38px",
    lineHeight: "1.1",
  },
  subtitle: {
    maxWidth: "680px",
    marginTop: "12px",
    fontSize: "15px",
    lineHeight: "1.7",
  },
  currentBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "850px",
    padding: "18px 20px",
    borderRadius: "24px",
    marginBottom: "18px",
    background:
      "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(59,130,246,0.12))",
    border: "1px solid rgba(45,212,191,0.25)",
  },
  smallText: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
  },
  currentTitle: {
    margin: "4px 0 0",
    fontSize: "24px",
  },
  expiry: {
    margin: "6px 0 0",
    fontSize: "13px",
  },
  activePill: {
    padding: "8px 13px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    background: "rgba(34,197,94,0.16)",
    color: "#22c55e",
    textTransform: "capitalize",
  },
  paymentStatusLink: {
    display: "inline-block",
    marginBottom: "22px",
    color: "#38bdf8",
    fontWeight: 700,
    fontSize: "14px",
    textDecoration: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
  },
  card: {
    borderRadius: "28px",
    padding: "24px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 20px 45px rgba(0,0,0,0.18)",
    transition: "all 0.25s ease",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
  },
  planName: {
    margin: 0,
    fontSize: "25px",
  },
  description: {
    marginTop: "8px",
    lineHeight: "1.5",
    fontSize: "14px",
  },
  tag: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    background: "linear-gradient(135deg, #2dd4bf, #38bdf8)",
    color: "#06221f",
    whiteSpace: "nowrap",
  },
  priceBox: {
    marginTop: "20px",
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
  },
  price: {
    fontSize: "30px",
  },
  perMonth: {
    fontSize: "13px",
    marginBottom: "5px",
  },
  features: {
    marginTop: "22px",
    display: "grid",
    gap: "12px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
  },
  check: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "rgba(45,212,191,0.16)",
    color: "#2dd4bf",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },
  button: {
    width: "100%",
    marginTop: "24px",
    padding: "13px 16px",
    borderRadius: "16px",
    fontWeight: "900",
    border: "none",
    fontSize: "14px",
  },
};