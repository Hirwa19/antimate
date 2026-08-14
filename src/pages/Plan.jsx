import { useEffect, useState, useCallback } from "react";
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

  const [currentPayment, setCurrentPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // =====================================================
  // PLANS
  // =====================================================

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
  // FETCH LATEST/CURRENT PAYMENT
  // =====================================================

  const fetchCurrentPayment = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      /*
       * IMPORTANT:
       *
       * This endpoint must return the user's latest/current
       * payment from the Payment collection.
       *
       * GET /api/payments/current
       */

      const res = await fetch(
        `${API_URL}/api/payments/current`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      console.log("💳 CURRENT PAYMENT:", data);

      if (!res.ok) {
        console.error(
          "Current payment error:",
          data?.message
        );

        setCurrentPayment(null);
        return;
      }

      /*
       * Support different backend response formats.
       */

      const payment =
        data?.payment ||
        data?.currentPayment ||
        data?.latestPayment ||
        null;

      setCurrentPayment(payment);
    } catch (error) {
      console.error(
        "FETCH CURRENT PAYMENT ERROR:",
        error
      );

      setCurrentPayment(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // =====================================================
  // CHECK IF PAYMENT IS ACTIVE
  // =====================================================

  function isPaymentActive(payment) {
    if (!payment) {
      return false;
    }

    const planName =
      payment.planName || "Free";

    if (planName === "Free") {
      return false;
    }

    const status =
      String(payment.status || "")
        .toLowerCase()
        .trim();

    /*
     * Payment collection:
     *
     * pending
     * paid
     * failed
     * cancelled
     */

    if (status !== "paid") {
      return false;
    }

    // -----------------------------------------------
    // EXPIRY
    // -----------------------------------------------

    if (payment.expiryDate) {
      const expiry =
        new Date(payment.expiryDate);

      if (
        !Number.isNaN(expiry.getTime()) &&
        expiry <= new Date()
      ) {
        return false;
      }
    }

    return true;
  }

  // =====================================================
  // CURRENT PLAN NAME
  // =====================================================

  function getCurrentPlanName() {
    /*
     * Only a PAID and non-expired payment
     * is considered an active subscription.
     */

    if (!isPaymentActive(currentPayment)) {
      return "Free";
    }

    return (
      currentPayment.planName ||
      "Free"
    );
  }

  // =====================================================
  // CURRENT PAYMENT STATUS
  // =====================================================

  function getPaymentStatus() {
    if (!currentPayment) {
      return "No Payment";
    }

    return (
      currentPayment.status ||
      "pending"
    );
  }

  // =====================================================
  // LOAD PAYMENT
  // =====================================================

  useEffect(() => {
    fetchCurrentPayment();
  }, [fetchCurrentPayment]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <PageLoader />;
  }

  // =====================================================
  // CURRENT VALUES
  // =====================================================

  const currentPlanName =
    getCurrentPlanName();

  const paidPlanRunning =
    isPaymentActive(currentPayment);

  const paymentStatus =
    getPaymentStatus();

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      style={{
        ...styles.page,

        background: isDark
          ? "linear-gradient(135deg, #07111f, #0f2537)"
          : "linear-gradient(135deg, #f8fafc, #e2e8f0)",

        color: isDark
          ? "#fff"
          : "#0f172a",
      }}
    >
      {/* =================================================
          HERO
      ================================================= */}

      <div style={styles.hero}>
        <span
          style={{
            ...styles.heroBadge,

            background: isDark
              ? "rgba(45,212,191,0.12)"
              : "rgba(15,118,110,0.09)",

            color: isDark
              ? "#5eead4"
              : "#0f766e",
          }}
        >
          Smart Brooder Plans
        </span>

        <h1 style={styles.title}>
          Choose your brooder plan
        </h1>

        <p
          style={{
            ...styles.subtitle,

            color: isDark
              ? "#a9b7c6"
              : "#64748b",
          }}
        >
          Manage your subscription,
          alerts, analytics, and
          monitoring level.
        </p>
      </div>

      {/* =================================================
          CURRENT PLAN
      ================================================= */}

      <div style={styles.currentBox}>
        <div>
          <p
            style={{
              ...styles.smallText,

              color: isDark
                ? "#94a3b8"
                : "#64748b",
            }}
          >
            Current Plan
          </p>

          <h2 style={styles.currentTitle}>
            {currentPlanName}
          </h2>

          <p
            style={{
              ...styles.expiry,

              color: isDark
                ? "#cbd5e1"
                : "#475569",
            }}
          >
            {currentPlanName !== "Free" &&
            currentPayment?.expiryDate
              ? `Expires: ${new Date(
                  currentPayment.expiryDate
                ).toLocaleDateString()}`
              : currentPlanName !== "Free"
              ? "Active subscription"
              : "No active paid subscription"}
          </p>

          {/* PAYMENT STATUS */}

          <p
            style={{
              ...styles.paymentStatus,

              color:
                paymentStatus === "paid"
                  ? "#22c55e"
                  : paymentStatus ===
                    "pending"
                  ? "#f59e0b"
                  : "#94a3b8",
            }}
          >
            Payment status:{" "}
            <strong>
              {paymentStatus.toUpperCase()}
            </strong>
          </p>
        </div>

        <span
          style={{
            ...styles.activePill,

            background:
              currentPlanName === "Free"
                ? "rgba(148,163,184,0.16)"
                : "rgba(34,197,94,0.16)",

            color:
              currentPlanName === "Free"
                ? "#94a3b8"
                : "#22c55e",
          }}
        >
          {currentPlanName === "Free"
            ? "free"
            : "active"}
        </span>
      </div>

      {/* =================================================
          PAYMENT HISTORY
      ================================================= */}

      <Link
        to="/payment"
        style={styles.paymentStatusLink}
      >
        💳 Payment History →
      </Link>

      {/* =================================================
          PLANS
      ================================================= */}

      <div style={styles.grid}>
        {plans.map((plan) => {
          const active =
            currentPlanName === plan.name;

          const highlighted =
            plan.name === "Basic";

          const isFreePlan =
            plan.name === "Free";

          /*
           * If a paid plan is currently active,
           * don't allow another paid plan until
           * current subscription expires.
           */

          const blockedByActivePlan =
            paidPlanRunning &&
            !active &&
            !isFreePlan;

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

                transform: highlighted
                  ? "translateY(-6px)"
                  : "none",
              }}
            >
              {/* CARD HEADER */}

              <div style={styles.cardTop}>
                <div>
                  <h2 style={styles.planName}>
                    {plan.name}
                  </h2>

                  <p
                    style={{
                      ...styles.description,

                      color: isDark
                        ? "#a9b7c6"
                        : "#64748b",
                    }}
                  >
                    {plan.description}
                  </p>
                </div>

                <span style={styles.tag}>
                  {plan.tag}
                </span>
              </div>

              {/* PRICE */}

              <div style={styles.priceBox}>
                <strong style={styles.price}>
                  {plan.displayPrice}
                </strong>

                <span
                  style={{
                    ...styles.perMonth,

                    color: isDark
                      ? "#94a3b8"
                      : "#64748b",
                  }}
                >
                  / month
                </span>
              </div>

              {/* FEATURES */}

              <div style={styles.features}>
                {plan.features.map(
                  (feature) => (
                    <div
                      key={feature}
                      style={
                        styles.featureItem
                      }
                    >
                      <span
                        style={styles.check}
                      >
                        ✓
                      </span>

                      <span>
                        {feature}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* =================================================
                  FREE
              ================================================= */}

              {isFreePlan ? (
                <button
                  disabled
                  style={{
                    ...styles.button,

                    background: active
                      ? "rgba(34,197,94,0.18)"
                      : "rgba(148,163,184,0.18)",

                    color: active
                      ? "#22c55e"
                      : "#94a3b8",

                    cursor:
                      "not-allowed",
                  }}
                >
                  {active
                    ? "Current Free Plan"
                    : "Free Plan"}
                </button>
              ) : (
                /* =================================================
                   PAID PLAN
                ================================================= */

                <button
                  disabled={
                    active ||
                    updating ||
                    blockedByActivePlan
                  }
                  onClick={() => {
                    if (
                      active ||
                      blockedByActivePlan ||
                      updating
                    ) {
                      return;
                    }

                    setSelectedPlan(
                      plan
                    );

                    setPaymentOpen(true);
                  }}
                  style={{
                    ...styles.button,

                    opacity:
                      updating ||
                      blockedByActivePlan
                        ? 0.65
                        : 1,

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
                      active ||
                      blockedByActivePlan
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {active
                    ? "Current Plan"
                    : blockedByActivePlan
                    ? "Active Plan Running"
                    : updating
                    ? "Starting Payment..."
                    : "Choose Plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <BottomNav />

      {/* =================================================
          SUCCESS MODAL
      ================================================= */}

      <SuccessModal
        open={successOpen}
        title="Plan Activated"
        message={`Your ${currentPlanName} plan is now active.`}
        onClose={() =>
          setSuccessOpen(false)
        }
      />

      {/* =================================================
          PAYMENT MODAL
      ================================================= */}

      <PaymentModal
        open={paymentOpen}
        plan={selectedPlan}
        onClose={() =>
          setPaymentOpen(false)
        }
        onConfirm={async ({
          plan,
        }) => {
          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {
            navigate("/login");
            return;
          }

          setUpdating(true);

          try {
            /*
             * CREATE PENDING PAYMENT
             */

            const res =
              await fetch(
                `${API_URL}/api/payments/start`,
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",

                    Authorization: `Bearer ${token}`,
                  },

                  body: JSON.stringify({
                    planName:
                      plan.name,
                  }),
                }
              );

            const data =
              await res.json();

            console.log(
              "💳 PAYMENT START:",
              data
            );

            if (!res.ok) {
              throw new Error(
                data?.message ||
                  "Failed to start payment"
              );
            }

            /*
             * PAYPACK PAYMENT LINK
             */

            if (
              data.paymentLink
            ) {
              /*
               * We intentionally don't mark
               * the payment as paid here.
               *
               * Backend must verify payment
               * before status becomes "paid".
               */

              window.location.href =
                data.paymentLink;

              return;
            }

            /*
             * FREE PLAN / INTERNAL
             */

            setPaymentOpen(false);

            await fetchCurrentPayment();

          } catch (error) {
            console.error(
              "PAYMENT START ERROR:",
              error
            );

            alert(
              error.message ||
                "Failed to start payment"
            );
          } finally {
            setUpdating(false);
          }
        }}
      />
    </div>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    paddingBottom: "120px",
    fontFamily:
      "Inter, Arial, sans-serif",
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
    justifyContent:
      "space-between",
    alignItems: "center",
    maxWidth: "850px",
    padding: "18px 20px",
    borderRadius: "24px",
    marginBottom: "18px",

    background:
      "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(59,130,246,0.12))",

    border:
      "1px solid rgba(45,212,191,0.25)",
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

  paymentStatus: {
    margin: "7px 0 0",
    fontSize: "13px",
  },

  activePill: {
    padding: "8px 13px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    textTransform:
      "capitalize",
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
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
  },

  card: {
    borderRadius: "28px",
    padding: "24px",
    backdropFilter:
      "blur(16px)",
    boxShadow:
      "0 20px 45px rgba(0,0,0,0.18)",
    transition:
      "all 0.25s ease",
  },

  cardTop: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "14px",
    alignItems:
      "flex-start",
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

    background:
      "linear-gradient(135deg, #2dd4bf, #38bdf8)",

    color: "#06221f",
    whiteSpace:
      "nowrap",
  },

  priceBox: {
    marginTop: "20px",
    display: "flex",
    alignItems:
      "flex-end",
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
    alignItems:
      "center",
    gap: "10px",
    fontSize: "14px",
  },

  check: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background:
      "rgba(45,212,191,0.16)",
    color: "#2dd4bf",
    display: "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontWeight: "900",
    flexShrink: 0,
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