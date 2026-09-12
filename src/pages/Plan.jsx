import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";
import SuccessModal from "../components/SuccessModal";
import PaymentModal from "../components/PaymentModal";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function Plan() {
  const { isDark } = useAppSettings();
  const navigate = useNavigate();

  const [currentPayment, setCurrentPayment] =
    useState(null);

  const [updating, setUpdating] =
    useState(false);

  const [successOpen, setSuccessOpen] =
    useState(false);

  const [paymentOpen, setPaymentOpen] =
    useState(false);

  const [selectedPlan, setSelectedPlan] =
    useState(null);

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
      description:
        "For testing Smart Brooder features.",
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
      description:
        "Best for small poultry farmers.",
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
      description:
        "For farmers managing multiple brooders.",
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
      description:
        "For commercial farms.",
      features: [
        "Everything in Pro",
        "AI recommendations",
        "Power loss alerts",
        "Business reports",
      ],
    },
  ];

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const getPaymentDate = useCallback(
    (payment) => {
      if (!payment) {
        return null;
      }

      const possibleDates = [
        payment.paidAt,
        payment.paymentDate,
        payment.paidDate,
        payment.transactionDate,
        payment.createdAt,
      ];

      for (const value of possibleDates) {
        if (!value) continue;

        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }

      return null;
    },
    []
  );

  const getEndDate = useCallback(
    (payment) => {
      if (!payment) {
        return null;
      }

      /*
       * IMPORTANT:
       *
       * End date is based on the actual PAID DATE.
       *
       * Example:
       * Paid date = 12 September 2026
       * End date  = 12 October 2026
       */

      const paidDate =
        getPaymentDate(payment);

      if (paidDate) {
        const endDate =
          new Date(paidDate);

        endDate.setMonth(
          endDate.getMonth() + 1
        );

        return endDate;
      }

      /*
       * Fallback for old payments that don't
       * contain paidAt/paymentDate.
       */

      if (payment.expiryDate) {
        const expiry = new Date(
          payment.expiryDate
        );

        if (
          !Number.isNaN(
            expiry.getTime()
          )
        ) {
          return expiry;
        }
      }

      return null;
    },
    [getPaymentDate]
  );

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  };

  // =====================================================
  // FETCH CURRENT PAYMENT
  // =====================================================

  const fetchCurrentPayment =
    useCallback(async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(
          `${API_URL}/api/payments/current`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

        const data =
          await res.json();

        console.log(
          "💳 CURRENT PAYMENT:",
          data
        );

        if (!res.ok) {
          console.error(
            "Current payment error:",
            data?.message
          );

          setCurrentPayment(null);
          return;
        }

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
      }
    }, [navigate]);

  // =====================================================
  // CHECK PAYMENT ACTIVE
  // =====================================================

  function isPaymentActive(
    payment
  ) {
    if (!payment) {
      return false;
    }

    const planName =
      payment.planName ||
      payment.plan ||
      "Free";

    if (
      String(planName)
        .toLowerCase() ===
      "free"
    ) {
      return false;
    }

    const status = String(
      payment.status || ""
    )
      .toLowerCase()
      .trim();

    if (status !== "paid") {
      return false;
    }

    /*
     * Calculate expiry from PAID DATE.
     */

    const endDate =
      getEndDate(payment);

    if (endDate) {
      const now = new Date();

      if (endDate <= now) {
        return false;
      }
    }

    return true;
  }

  // =====================================================
  // CURRENT PLAN NAME
  // =====================================================

  function getCurrentPlanName() {
    if (
      !isPaymentActive(
        currentPayment
      )
    ) {
      return "Free";
    }

    return (
      currentPayment?.planName ||
      currentPayment?.plan ||
      "Free"
    );
  }

  // =====================================================
  // PAYMENT STATUS
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
  // CURRENT VALUES
  // =====================================================

  const currentPlanName =
    getCurrentPlanName();

  const paidPlanRunning =
    isPaymentActive(
      currentPayment
    );

  const paymentStatus =
    getPaymentStatus();

  const paymentDate =
    paidPlanRunning
      ? getPaymentDate(
          currentPayment
        )
      : null;

  const endDate =
    paidPlanRunning
      ? getEndDate(
          currentPayment
        )
      : null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* =================================================
          RESPONSIVE CSS
      ================================================= */}

      <style>
        {`
          .plan-page {
            width: 100%;
            box-sizing: border-box;
          }

          .plan-container {
            width: 100%;
            max-width: 1180px;
            margin: 0 auto;
          }

          .plan-hero {
            width: 100%;
            max-width: 850px;
          }

          .plan-current-box {
            width: 100%;
            max-width: 850px;
            box-sizing: border-box;
          }

          .plan-grid {
            display: grid;
            grid-template-columns: repeat(
              4,
              minmax(0, 1fr)
            );
            gap: 20px;
            width: 100%;
          }

          .plan-card {
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
          }

          .plan-card-top {
            min-width: 0;
          }

          .plan-description {
            min-height: 42px;
          }

          .payment-info-grid {
            display: grid;
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
            gap: 10px;
            margin-top: 14px;
          }

          .payment-info-item {
            min-width: 0;
            box-sizing: border-box;
          }

          @media (max-width: 1050px) {
            .plan-grid {
              grid-template-columns: repeat(
                2,
                minmax(0, 1fr)
              );
            }
          }

          @media (max-width: 720px) {
            .plan-page {
              padding-left: 15px !important;
              padding-right: 15px !important;
              padding-top: 20px !important;
            }

            .plan-title {
              font-size: 30px !important;
            }

            .plan-subtitle {
              font-size: 14px !important;
            }

            .plan-current-box {
              flex-direction: column;
              align-items: flex-start !important;
              gap: 14px;
              padding: 17px !important;
              border-radius: 20px !important;
            }

            .plan-current-pill {
              align-self: flex-start;
            }

            .payment-info-grid {
              width: 100%;
            }

            .plan-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }

            .plan-card {
              transform: none !important;
              padding: 20px !important;
              border-radius: 22px !important;
            }

            .plan-card-top {
              gap: 10px !important;
            }

            .plan-name {
              font-size: 22px !important;
            }

            .plan-price {
              font-size: 27px !important;
            }
          }

          @media (max-width: 430px) {
            .plan-page {
              padding-left: 12px !important;
              padding-right: 12px !important;
            }

            .plan-title {
              font-size: 27px !important;
            }

            .plan-hero-badge {
              font-size: 11px !important;
              padding: 7px 10px !important;
            }

            .payment-info-grid {
              grid-template-columns: 1fr;
            }

            .plan-current-title {
              font-size: 21px !important;
            }

            .plan-card-top {
              flex-direction: column;
            }

            .plan-tag {
              align-self: flex-start;
            }
          }
        `}
      </style>

      <div
        className="plan-page"
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
        <div className="plan-container">
          {/* =================================================
              HERO
          ================================================= */}

          <div
            className="plan-hero"
            style={styles.hero}
          >
            <span
              className="plan-hero-badge"
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

            <h1
              className="plan-title"
              style={styles.title}
            >
              Choose your brooder plan
            </h1>

            <p
              className="plan-subtitle"
              style={{
                ...styles.subtitle,

                color: isDark
                  ? "#a9b7c6"
                  : "#64748b",
              }}
            >
              Choose the monitoring,
              alerts, analytics, and
              AI features that fit your
              poultry operation.
            </p>
          </div>

          {/* =================================================
              CURRENT PLAN
          ================================================= */}

          <div
            className="plan-current-box"
            style={{
              ...styles.currentBox,

              background: isDark
                ? "linear-gradient(135deg, rgba(45,212,191,0.13), rgba(59,130,246,0.10))"
                : "linear-gradient(135deg, rgba(45,212,191,0.10), rgba(59,130,246,0.08))",

              border:
                "1px solid rgba(45,212,191,0.25)",
            }}
          >
            <div
              style={{
                width: "100%",
                minWidth: 0,
              }}
            >
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

              <h2
                className="plan-current-title"
                style={
                  styles.currentTitle
                }
              >
                {currentPlanName}
              </h2>

              {/* =============================================
                  PAID PLAN INFORMATION
              ============================================= */}

              {paidPlanRunning ? (
                <div className="payment-info-grid">
                  <div
                    className="payment-info-item"
                    style={{
                      ...styles.paymentInfoItem,

                      background: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.60)",

                      borderColor:
                        isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(15,23,42,0.07)",
                    }}
                  >
                    <span
                      style={
                        styles.paymentInfoLabel
                      }
                    >
                      Paid date
                    </span>

                    <strong
                      style={{
                        ...styles.paymentInfoValue,

                        color: isDark
                          ? "#f8fafc"
                          : "#0f172a",
                      }}
                    >
                      {formatDate(
                        paymentDate
                      )}
                    </strong>
                  </div>

                  <div
                    className="payment-info-item"
                    style={{
                      ...styles.paymentInfoItem,

                      background: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.60)",

                      borderColor:
                        isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(15,23,42,0.07)",
                    }}
                  >
                    <span
                      style={
                        styles.paymentInfoLabel
                      }
                    >
                      End date
                    </span>

                    <strong
                      style={{
                        ...styles.paymentInfoValue,

                        color: "#22c55e",
                      }}
                    >
                      {formatDate(
                        endDate
                      )}
                    </strong>
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    ...styles.expiry,

                    color: isDark
                      ? "#cbd5e1"
                      : "#475569",
                  }}
                >
                  No active paid
                  subscription
                </p>
              )}

              {/* =============================================
                  PAYMENT STATUS
              ============================================= */}

              <p
                style={{
                  ...styles.paymentStatus,

                  color:
                    paymentStatus ===
                    "paid"
                      ? "#22c55e"
                      : paymentStatus ===
                        "pending"
                      ? "#f59e0b"
                      : "#94a3b8",
                }}
              >
                Payment status:{" "}
                <strong>
                  {String(
                    paymentStatus
                  ).toUpperCase()}
                </strong>
              </p>
            </div>

            <span
              className="plan-current-pill"
              style={{
                ...styles.activePill,

                background:
                  currentPlanName ===
                  "Free"
                    ? "rgba(148,163,184,0.16)"
                    : "rgba(34,197,94,0.16)",

                color:
                  currentPlanName ===
                  "Free"
                    ? "#94a3b8"
                    : "#22c55e",
              }}
            >
              {currentPlanName ===
              "Free"
                ? "Free"
                : "Active"}
            </span>
          </div>

          {/* =================================================
              PAYMENT HISTORY
          ================================================= */}

          <Link
            to="/payment"
            style={
              styles.paymentStatusLink
            }
          >
            💳 Payment History →
          </Link>

          {/* =================================================
              PLANS
          ================================================= */}

          <div className="plan-grid">
            {plans.map((plan) => {
              const active =
                currentPlanName ===
                plan.name;

              const highlighted =
                plan.name ===
                "Basic";

              const isFreePlan =
                plan.name ===
                "Free";

              /*
               * Prevent buying another paid
               * plan while current paid plan
               * is still active.
               */

              const blockedByActivePlan =
                paidPlanRunning &&
                !active &&
                !isFreePlan;

              return (
                <div
                  key={plan.name}
                  className="plan-card"
                  style={{
                    ...styles.card,

                    background: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.82)",

                    border: active
                      ? "1px solid #2dd4bf"
                      : isDark
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "1px solid rgba(15,23,42,0.08)",

                    transform:
                      highlighted
                        ? "translateY(-6px)"
                        : "none",
                  }}
                >
                  {/* =========================================
                      CARD HEADER
                  ========================================= */}

                  <div
                    className="plan-card-top"
                    style={
                      styles.cardTop
                    }
                  >
                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <h2
                        className="plan-name"
                        style={
                          styles.planName
                        }
                      >
                        {plan.name}
                      </h2>

                      <p
                        className="plan-description"
                        style={{
                          ...styles.description,

                          color: isDark
                            ? "#a9b7c6"
                            : "#64748b",
                        }}
                      >
                        {
                          plan.description
                        }
                      </p>
                    </div>

                    <span
                      className="plan-tag"
                      style={
                        styles.tag
                      }
                    >
                      {plan.tag}
                    </span>
                  </div>

                  {/* =========================================
                      PRICE
                  ========================================= */}

                  <div
                    style={
                      styles.priceBox
                    }
                  >
                    <strong
                      className="plan-price"
                      style={
                        styles.price
                      }
                    >
                      {
                        plan.displayPrice
                      }
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

                  {/* =========================================
                      FEATURES
                  ========================================= */}

                  <div
                    style={
                      styles.features
                    }
                  >
                    {plan.features.map(
                      (feature) => (
                        <div
                          key={feature}
                          style={
                            styles.featureItem
                          }
                        >
                          <span
                            style={
                              styles.check
                            }
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

                  {/* =========================================
                      FREE PLAN
                  ========================================= */}

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
                    /* =========================================
                       PAID PLAN
                    ========================================= */

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

                        setPaymentOpen(
                          true
                        );
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
                window.location.href =
                  data.paymentLink;

                return;
              }

              /*
               * INTERNAL / FREE PLAN
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
    </>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    padding: "30px",
    paddingBottom: "120px",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  hero: {
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
    letterSpacing: "-0.03em",
  },

  subtitle: {
    maxWidth: "680px",
    marginTop: "12px",
    marginBottom: 0,
    fontSize: "15px",
    lineHeight: "1.7",
  },

  currentBox: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding: "18px 20px",
    borderRadius: "24px",
    marginBottom: "18px",
    gap: "20px",
  },

  smallText: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
  },

  currentTitle: {
    margin: "4px 0 0",
    fontSize: "24px",
    letterSpacing: "-0.02em",
  },

  expiry: {
    margin: "8px 0 0",
    fontSize: "13px",
  },

  paymentStatus: {
    margin: "10px 0 0",
    fontSize: "13px",
  },

  paymentInfoItem: {
    minWidth: 0,
    padding: "10px 12px",
    borderRadius: "13px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  paymentInfoLabel: {
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "700",
    textTransform:
      "uppercase",
    letterSpacing: "0.05em",
  },

  paymentInfoValue: {
    fontSize: "13px",
    lineHeight: "1.3",
  },

  activePill: {
    padding: "8px 13px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    textTransform:
      "capitalize",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  paymentStatusLink: {
    display: "inline-block",
    marginBottom: "22px",
    color: "#38bdf8",
    fontWeight: 700,
    fontSize: "14px",
    textDecoration: "none",
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
    letterSpacing: "-0.02em",
  },

  description: {
    marginTop: "8px",
    marginBottom: 0,
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
    whiteSpace: "nowrap",
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
    letterSpacing: "-0.03em",
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
    lineHeight: "1.4",
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
    minHeight: "48px",
  },
};