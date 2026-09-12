import { useCallback, useEffect, useMemo, useState } from "react";
import PageLoader from "../components/PageLoader";
import BottomNav from "../components/BottomNav";
import { useAppSettings } from "../context/AppSettingsContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

export default function Notifications() {
  const { isDark } = useAppSettings();

  const [notifications, setNotifications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [subscriptionState, setSubscriptionState] =
    useState(null);

  const [mobileDetail, setMobileDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem("token");

  // =====================================================
  // COLORS
  // =====================================================

  const colors = {
    page: isDark ? "#07111f" : "#f5f7fb",
    panel: isDark ? "#0c1a2a" : "#ffffff",
    panelSoft: isDark ? "#101f31" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,.08)" : "#e5e7eb",
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#94a3b8" : "#64748b",
    mutedStrong: isDark ? "#cbd5e1" : "#475569",
    selected: isDark
      ? "rgba(37,99,235,.16)"
      : "#eff6ff",
    hover: isDark
      ? "rgba(255,255,255,.045)"
      : "#f8fafc",
  };

  // =====================================================
  // FETCH
  // =====================================================

  const fetchNotifications = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
        setSubscriptionState(null);

        if (!token) {
          setError("Please login to view notifications.");
          setNotifications([]);
          return false;
        }

        const response = await fetch(
          `${API_URL}/api/notifications`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        // =================================================
        // AUTH
        // =================================================

        if (response.status === 401) {
          setError(
            data.message ||
              "Your session has expired. Please login again."
          );

          setNotifications([]);
          return false;
        }

        // =================================================
        // SUBSCRIPTION
        // =================================================

        if (response.status === 403) {
          setSubscriptionState(
            data.code || "NO_ACTIVE_SUBSCRIPTION"
          );

          setError(
            data.message ||
              "An active subscription is required."
          );

          setNotifications([]);
          return false;
        }

        // =================================================
        // OTHER ERROR
        // =================================================

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load notifications."
          );
        }

        // =================================================
        // RESPONSE
        // =================================================

        let list = [];

        if (Array.isArray(data.notifications)) {
          list = data.notifications;
        } else if (Array.isArray(data.data)) {
          list = data.data;
        } else if (Array.isArray(data)) {
          list = data;
        }

        list.sort((a, b) => {
          return (
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
          );
        });

        setNotifications(list);

        if (list.length > 0) {
          setSelectedId((current) => {
            const exists = list.some(
              (item) => item._id === current
            );

            return exists ? current : list[0]._id;
          });
        } else {
          setSelectedId(null);
        }

        return true;
      } catch (err) {
        console.error(
          "❌ Notifications fetch:",
          err
        );

        setError(
          err.message ||
            "Unable to load notifications."
        );

        setNotifications([]);
        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  // =====================================================
  // MARK ALL READ
  // =====================================================

  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/read/all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(
          "Could not mark notifications as read."
        );
      }
    } catch (err) {
      console.error(
        "❌ Mark notifications read:",
        err
      );
    }
  }, [token]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function load() {
      const success =
        await fetchNotifications(false);

      if (mounted && success) {
        await markAllAsRead();
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [fetchNotifications, markAllAsRead]);

  // =====================================================
  // REFRESH
  // =====================================================

  async function handleRefresh() {
    await fetchNotifications(true);
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function deleteNotification(id) {
    if (!id || !token || deleting) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete notification"
        );
      }

      const remaining = notifications.filter(
        (item) => item._id !== id
      );

      setNotifications(remaining);

      if (selectedId === id) {
        setSelectedId(
          remaining.length > 0
            ? remaining[0]._id
            : null
        );
      }

      setMobileDetail(false);
    } catch (err) {
      console.error(
        "❌ Delete notification:",
        err
      );
    } finally {
      setDeleting(false);
    }
  }

  // =====================================================
  // SELECT
  // =====================================================

  function selectNotification(id) {
    setSelectedId(id);
    setMobileDetail(true);
  }

  // =====================================================
  // SELECTED
  // =====================================================

  const selectedNotification = useMemo(() => {
    return (
      notifications.find(
        (item) => item._id === selectedId
      ) || null
    );
  }, [notifications, selectedId]);

  // =====================================================
  // HELPERS
  // =====================================================

  function getIcon(type) {
    const icons = {
      TOO_HOT: "🔥",
      TOO_COLD: "❄️",
      LOW_HUMIDITY: "💧",
      VERY_HIGH_HUMIDITY: "🌫️",
      SENSOR_OFFLINE: "📡",
      POWER_LOST: "⚡",
    };

    return icons[type] || "🔔";
  }

  function getTitle(item) {
    if (item?.title) return item.title;

    const titles = {
      TOO_HOT: "Temperature Too High",
      TOO_COLD: "Temperature Too Low",
      LOW_HUMIDITY: "Low Humidity",
      VERY_HIGH_HUMIDITY:
        "Humidity Too High",
      SENSOR_OFFLINE: "System Offline",
      POWER_LOST: "Power Lost",
    };

    return titles[item?.type] || "Brooder Alert";
  }

  function getMessage(item) {
    if (item?.message) {
      return item.message;
    }

    const messages = {
      TOO_HOT:
        "The brooder temperature is above the recommended range.",

      TOO_COLD:
        "The brooder temperature is below the recommended range.",

      LOW_HUMIDITY:
        "The brooder humidity is below the recommended range.",

      VERY_HIGH_HUMIDITY:
        "The brooder humidity is above the recommended range.",

      SENSOR_OFFLINE:
        "The BR System is currently offline.",

      POWER_LOST:
        "The system may have lost electrical power.",
    };

    return (
      messages[item?.type] ||
      "A brooder event requires your attention."
    );
  }

  function getSeverity(item) {
    return (
      item?.severity || "warning"
    ).toLowerCase();
  }

  function formatDate(value) {
    if (!value) return "Unknown time";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown time";
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatShortDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  function getSeverityStyle(severity) {
    if (severity === "critical") {
      return {
        background: isDark
          ? "rgba(239,68,68,.15)"
          : "#fee2e2",
        color: "#ef4444",
      };
    }

    if (severity === "info") {
      return {
        background: isDark
          ? "rgba(59,130,246,.15)"
          : "#dbeafe",
        color: "#3b82f6",
      };
    }

    return {
      background: isDark
        ? "rgba(245,158,11,.15)"
        : "#fef3c7",
      color: "#f59e0b",
    };
  }

  function getAccent(type) {
    const accents = {
      TOO_HOT: "#ef4444",
      TOO_COLD: "#38bdf8",
      LOW_HUMIDITY: "#f59e0b",
      VERY_HIGH_HUMIDITY: "#8b5cf6",
      SENSOR_OFFLINE: "#ef4444",
      POWER_LOST: "#f97316",
    };

    return accents[type] || "#22c55e";
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.page,
        color: colors.text,
        paddingBottom: 90,
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          overflow-x: hidden;
        }

        button {
          font-family: inherit;
        }

        /* =================================================
           PAGE
        ================================================= */

        .notifications-page {
          width: 100%;
          max-width: 1250px;
          margin: 0 auto;
          padding: 28px 24px;
        }

        /* =================================================
           HEADER
        ================================================= */

        .notifications-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .notifications-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notifications-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #06b6d4,
            #2563eb
          );
          box-shadow:
            0 8px 25px rgba(37,99,235,.22);
          font-size: 20px;
        }

        .notifications-title {
          margin: 0;
          font-size: 27px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -.6px;
        }

        .notifications-subtitle {
          margin: 5px 0 0;
          color: ${colors.muted};
          font-size: 12px;
        }

        .refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          height: 40px;
          padding: 0 14px;
          border: 1px solid ${colors.border};
          border-radius: 10px;
          background: ${colors.panel};
          color: ${colors.text};
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s ease;
        }

        .refresh-button:hover {
          transform: translateY(-1px);
        }

        .refresh-button:disabled {
          cursor: default;
          opacity: .6;
        }

        .refresh-icon {
          display: inline-block;
          font-size: 17px;
        }

        .refreshing .refresh-icon {
          animation:
            notificationSpin
            .8s linear infinite;
        }

        @keyframes notificationSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* =================================================
           MAIN WORKSPACE
        ================================================= */

        .notification-workspace {
          display: grid;
          grid-template-columns: 390px minmax(0, 1fr);

          /*
           * IMPORTANT:
           * The workspace itself does NOT scroll.
           * Only .notification-items scrolls.
           */
          height: 650px;

          overflow: hidden;

          border: 1px solid ${colors.border};
          border-radius: 16px;
          background: ${colors.panel};
        }

        /* =================================================
           LEFT LIST
        ================================================= */

        .notification-list {
          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          border-right:
            1px solid ${colors.border};

          background: ${colors.panel};
        }

        .notification-list-header {
          height: 57px;
          min-height: 57px;

          padding: 0 17px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-bottom:
            1px solid ${colors.border};

          background: ${colors.panel};
        }

        .notification-list-heading {
          font-size: 13px;
          font-weight: 800;
        }

        .notification-count {
          min-width: 25px;
          height: 23px;

          padding: 0 7px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 7px;

          background: ${colors.panelSoft};
          border: 1px solid ${colors.border};

          color: ${colors.muted};

          font-size: 10px;
          font-weight: 800;
        }

        /*
         * ONLY THIS AREA SCROLLS
         */
        .notification-items {
          min-height: 0;
          flex: 1;

          overflow-y: auto;
          overflow-x: hidden;

          overscroll-behavior: contain;

          scrollbar-width: thin;
        }

        .notification-items::-webkit-scrollbar {
          width: 6px;
        }

        .notification-items::-webkit-scrollbar-track {
          background: transparent;
        }

        .notification-items::-webkit-scrollbar-thumb {
          background: ${isDark
            ? "rgba(148,163,184,.25)"
            : "rgba(100,116,139,.25)"};

          border-radius: 20px;
        }

        /* =================================================
           LIST ITEM
        ================================================= */

        .notification-item {
          width: 100%;

          position: relative;

          display: flex;
          align-items: flex-start;

          gap: 11px;

          padding: 14px 15px;

          border: none;
          border-bottom:
            1px solid ${colors.border};

          background: transparent;
          color: ${colors.text};

          text-align: left;

          cursor: pointer;

          transition:
            background .18s ease;
        }

        .notification-item:hover {
          background: ${colors.hover};
        }

        .notification-item.selected {
          background: ${colors.selected};
        }

        .notification-item.selected::before {
          content: "";

          position: absolute;

          left: 0;
          top: 0;
          bottom: 0;

          width: 3px;

          background: #2563eb;
        }

        .notification-list-icon {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          font-size: 17px;
        }

        .notification-item-content {
          min-width: 0;
          flex: 1;
        }

        .notification-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;
        }

        .notification-item-title {
          min-width: 0;

          overflow: hidden;

          white-space: nowrap;
          text-overflow: ellipsis;

          font-size: 12px;
          font-weight: 750;
        }

        .notification-item-date {
          flex-shrink: 0;

          color: ${colors.muted};

          font-size: 9px;
        }

        .notification-item-message {
          margin-top: 5px;

          overflow: hidden;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;

          color: ${colors.muted};

          font-size: 10px;
          line-height: 1.45;
        }

        .notification-item-bottom {
          margin-top: 8px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;
        }

        .severity-badge {
          display: inline-flex;
          align-items: center;

          padding: 3px 7px;

          border-radius: 6px;

          font-size: 8px;
          font-weight: 800;

          text-transform: uppercase;
          letter-spacing: .3px;
        }

        .system-label {
          max-width: 130px;

          overflow: hidden;

          white-space: nowrap;
          text-overflow: ellipsis;

          color: ${colors.muted};

          font-size: 9px;
        }

        /* =================================================
           RIGHT DETAIL
        ================================================= */

        .notification-detail {
          /*
           * FIXED DETAIL PANEL
           *
           * It stays in place while the notification list
           * on the left scrolls.
           */
          position: relative;

          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background: ${colors.panel};
        }

        .detail-header {
          height: 68px;
          min-height: 68px;

          padding: 0 22px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          border-bottom:
            1px solid ${colors.border};

          background: ${colors.panel};
        }

        .detail-header-label {
          color: ${colors.muted};

          font-size: 10px;
          font-weight: 700;

          text-transform: uppercase;
          letter-spacing: .5px;
        }

        .detail-delete {
          width: 34px;
          height: 34px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border: none;
          border-radius: 9px;

          background: transparent;

          color: ${colors.muted};

          font-size: 17px;

          cursor: pointer;

          transition: .18s ease;
        }

        .detail-delete:hover {
          background:
            rgba(239,68,68,.12);

          color: #ef4444;
        }

        .detail-delete:disabled {
          opacity: .5;
          cursor: default;
        }

        /*
         * Detail body has its own scroll only if the
         * selected notification contains very long data.
         *
         * Normal use keeps the detail visually fixed.
         */
        .detail-body {
          min-height: 0;
          flex: 1;

          overflow-y: auto;
          overflow-x: hidden;

          padding: 30px;

          scrollbar-width: thin;
        }

        .detail-body::-webkit-scrollbar {
          width: 5px;
        }

        .detail-body::-webkit-scrollbar-thumb {
          background: ${isDark
            ? "rgba(148,163,184,.2)"
            : "rgba(100,116,139,.2)"};

          border-radius: 20px;
        }

        .detail-main {
          width: 100%;
          max-width: 760px;

          margin: 0 auto;
        }

        .detail-alert-header {
          display: flex;
          align-items: flex-start;

          gap: 15px;
        }

        .detail-alert-icon {
          width: 58px;
          height: 58px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 16px;

          font-size: 27px;
        }

        .detail-heading-content {
          min-width: 0;
          flex: 1;
        }

        .detail-title-row {
          display: flex;
          align-items: center;

          flex-wrap: wrap;

          gap: 9px;
        }

        .detail-title {
          margin: 0;

          font-size: 21px;
          line-height: 1.25;

          font-weight: 800;

          letter-spacing: -.3px;
        }

        .detail-time {
          margin-top: 6px;

          color: ${colors.muted};

          font-size: 11px;
        }

        .detail-message {
          margin: 28px 0 0;

          color: ${colors.mutedStrong};

          font-size: 14px;
          line-height: 1.75;
        }

        /* =================================================
           DETAIL SECTIONS
        ================================================= */

        .detail-section {
          margin-top: 28px;
        }

        .detail-section-title {
          margin: 0 0 11px;

          color: ${colors.muted};

          font-size: 10px;
          font-weight: 800;

          text-transform: uppercase;
          letter-spacing: .55px;
        }

        .detail-metrics {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 9px;
        }

        .detail-metric {
          padding: 13px;

          border:
            1px solid ${colors.border};

          border-radius: 11px;

          background: ${colors.panelSoft};
        }

        .detail-metric-label {
          color: ${colors.muted};

          font-size: 9px;
          font-weight: 700;
        }

        .detail-metric-value {
          margin-top: 5px;

          color: ${colors.text};

          font-size: 13px;
          font-weight: 750;
        }

        .detail-info {
          display: flex;
          flex-direction: column;

          overflow: hidden;

          border:
            1px solid ${colors.border};

          border-radius: 11px;
        }

        .detail-info-row {
          min-height: 43px;

          padding: 0 13px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          border-bottom:
            1px solid ${colors.border};
        }

        .detail-info-row:last-child {
          border-bottom: none;
        }

        .detail-info-label {
          color: ${colors.muted};

          font-size: 10px;
        }

        .detail-info-value {
          max-width: 60%;

          overflow: hidden;

          white-space: nowrap;
          text-overflow: ellipsis;

          color: ${colors.text};

          font-size: 10px;
          font-weight: 700;

          text-align: right;
        }

        .push-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .push-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;
        }

        /* =================================================
           EMPTY
        ================================================= */

        .empty-state {
          height: 100%;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          padding: 35px;

          text-align: center;
        }

        .empty-icon {
          width: 58px;
          height: 58px;

          margin-bottom: 14px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 16px;

          font-size: 25px;
        }

        .empty-title {
          margin: 0 0 7px;

          font-size: 18px;
          font-weight: 800;
        }

        .empty-text {
          max-width: 430px;

          margin: 0 0 18px;

          color: ${colors.muted};

          font-size: 12px;
          line-height: 1.6;
        }

        .primary-button {
          padding: 10px 16px;

          border: none;
          border-radius: 9px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );

          color: #fff;

          font-size: 11px;
          font-weight: 750;

          cursor: pointer;
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 800px) {

          .notifications-page {
            padding: 18px 14px;
          }

          .notifications-header {
            align-items: flex-start;
          }

          .notifications-title {
            font-size: 23px;
          }

          .notifications-subtitle {
            max-width: 220px;
          }

          /*
           * Mobile uses one panel at a time.
           */
          .notification-workspace {
            display: block;

            height:
              calc(100vh - 165px);

            min-height: 500px;

            border-radius: 14px;
          }

          .notification-list {
            width: 100%;
            height: 100%;

            border-right: none;
          }

          .notification-detail {
            display: none;

            width: 100%;
            height: 100%;
          }

          .notification-workspace.mobile-detail
            .notification-list {
            display: none;
          }

          .notification-workspace.mobile-detail
            .notification-detail {
            display: flex;
          }

          /*
           * On mobile only the current panel scrolls.
           */
          .notification-items {
            overflow-y: auto;
          }

          .detail-back {
            display: inline-flex;

            align-items: center;

            gap: 6px;

            margin-right: 10px;

            padding: 7px 9px;

            border:
              1px solid ${colors.border};

            border-radius: 8px;

            background:
              ${colors.panelSoft};

            color: ${colors.text};

            font-size: 10px;
            font-weight: 700;

            cursor: pointer;
          }

          .detail-header {
            min-height: 58px;
            height: 58px;

            padding: 0 13px;
          }

          .detail-body {
            padding: 22px 16px;
          }

          .detail-title {
            font-size: 18px;
          }

          .detail-message {
            margin-top: 22px;

            font-size: 13px;
          }

          .detail-metrics {
            grid-template-columns: 1fr;
          }
        }

        /* =================================================
           SMALL MOBILE
        ================================================= */

        @media (max-width: 520px) {

          .notifications-header {
            gap: 12px;
          }

          .notifications-icon {
            width: 39px;
            height: 39px;

            border-radius: 11px;

            font-size: 18px;
          }

          .notifications-title {
            font-size: 21px;
          }

          .refresh-button {
            width: 40px;
            padding: 0;
          }

          .refresh-button span:last-child {
            display: none;
          }

          .notification-list-header {
            min-height: 52px;
            height: 52px;
          }

          .notification-item {
            padding: 13px;
          }

          .detail-alert-header {
            gap: 11px;
          }

          .detail-alert-icon {
            width: 48px;
            height: 48px;

            border-radius: 13px;

            font-size: 22px;
          }

          .detail-title {
            font-size: 16px;
          }

          .detail-time {
            font-size: 9px;
          }

          .detail-info-row {
            min-height: 45px;
          }
        }
      `}</style>

      <main className="notifications-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="notifications-header">

          <div className="notifications-title-wrap">

            <div className="notifications-icon">
              🔔
            </div>

            <div>
              <h1 className="notifications-title">
                Notifications
              </h1>

              <p className="notifications-subtitle">
                Alerts and events from your Smart Brooder
              </p>
            </div>

          </div>

          <button
            className={`refresh-button ${
              refreshing ? "refreshing" : ""
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh notifications"
          >
            <span className="refresh-icon">
              ↻
            </span>

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>

        </header>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div
            style={{
              minHeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PageLoader />
          </div>

        ) : subscriptionState ? (

          <div
            className="notification-workspace"
            style={{ display: "block" }}
          >
            <section className="empty-state">

              <div
                className="empty-icon"
                style={{
                  background:
                    "rgba(245,158,11,.12)",
                }}
              >
                🔒
              </div>

              <h2 className="empty-title">
                Subscription Required
              </h2>

              <p className="empty-text">
                {error ||
                  "An active Basic, Pro, or Premium plan is required to access notifications."}
              </p>

              <a
                href="/plans"
                className="primary-button"
                style={{
                  textDecoration: "none",
                }}
              >
                View Plans
              </a>

            </section>
          </div>

        ) : error ? (

          <div
            className="notification-workspace"
            style={{ display: "block" }}
          >
            <section className="empty-state">

              <div
                className="empty-icon"
                style={{
                  background:
                    "rgba(239,68,68,.12)",
                }}
              >
                ⚠️
              </div>

              <h2 className="empty-title">
                Unable to load notifications
              </h2>

              <p className="empty-text">
                {error}
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  fetchNotifications(false)
                }
              >
                Try Again
              </button>

            </section>
          </div>

        ) : notifications.length === 0 ? (

          <div
            className="notification-workspace"
            style={{ display: "block" }}
          >
            <section className="empty-state">

              <div
                className="empty-icon"
                style={{
                  background:
                    "rgba(34,197,94,.12)",
                }}
              >
                ✓
              </div>

              <h2 className="empty-title">
                Everything looks good
              </h2>

              <p className="empty-text">
                No brooder alerts have been generated yet.
              </p>

            </section>
          </div>

        ) : (

          /* =================================================
             LIST + FIXED DETAIL
          ================================================= */

          <div
            className={`notification-workspace ${
              mobileDetail
                ? "mobile-detail"
                : ""
            }`}
          >

            {/* =================================================
                LEFT — SCROLLABLE LIST
            ================================================= */}

            <section className="notification-list">

              <div className="notification-list-header">

                <span className="notification-list-heading">
                  All notifications
                </span>

                <span className="notification-count">
                  {notifications.length}
                </span>

              </div>

              <div className="notification-items">

                {notifications.map(
                  (item, index) => {

                    const severity =
                      getSeverity(item);

                    const severityStyle =
                      getSeverityStyle(
                        severity
                      );

                    const accent =
                      getAccent(item.type);

                    const isSelected =
                      item._id === selectedId;

                    return (
                      <button
                        key={
                          item._id ||
                          `${item.createdAt}-${index}`
                        }
                        className={`notification-item ${
                          isSelected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          selectNotification(
                            item._id
                          )
                        }
                      >

                        <div
                          className="notification-list-icon"
                          style={{
                            background:
                              `${accent}18`,
                          }}
                        >
                          {getIcon(item.type)}
                        </div>

                        <div className="notification-item-content">

                          <div className="notification-item-top">

                            <span className="notification-item-title">
                              {getTitle(item)}
                            </span>

                            <span className="notification-item-date">
                              {formatShortDate(
                                item.createdAt
                              )}
                            </span>

                          </div>

                          <div className="notification-item-message">
                            {getMessage(item)}
                          </div>

                          <div className="notification-item-bottom">

                            <span
                              className="severity-badge"
                              style={
                                severityStyle
                              }
                            >
                              {severity}
                            </span>

                            {item.systemId && (
                              <span className="system-label">
                                {item.systemId}
                              </span>
                            )}

                          </div>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>
            </section>

            {/* =================================================
                RIGHT — FIXED DETAIL
            ================================================= */}

            <section className="notification-detail">

              <div className="detail-header">

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >

                  <button
                    className="detail-back"
                    onClick={() =>
                      setMobileDetail(false)
                    }
                  >
                    ←
                    <span>
                      Notifications
                    </span>
                  </button>

                  <span className="detail-header-label">
                    Notification details
                  </span>

                </div>

                {selectedNotification?._id && (
                  <button
                    className="detail-delete"
                    onClick={() =>
                      deleteNotification(
                        selectedNotification._id
                      )
                    }
                    disabled={deleting}
                    title="Delete notification"
                  >
                    {deleting ? "…" : "×"}
                  </button>
                )}

              </div>

              {selectedNotification ? (

                <NotificationDetail
                  item={selectedNotification}
                  isDark={isDark}
                  colors={colors}
                  getIcon={getIcon}
                  getTitle={getTitle}
                  getMessage={getMessage}
                  getSeverity={getSeverity}
                  getSeverityStyle={
                    getSeverityStyle
                  }
                  getAccent={getAccent}
                  formatDate={formatDate}
                />

              ) : (

                <div className="empty-state">

                  <div
                    className="empty-icon"
                    style={{
                      background:
                        "rgba(59,130,246,.12)",
                    }}
                  >
                    🔔
                  </div>

                  <h2 className="empty-title">
                    Select a notification
                  </h2>

                  <p className="empty-text">
                    Select an alert from the list to view
                    its complete details.
                  </p>

                </div>
              )}

            </section>

          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}

// =====================================================
// NOTIFICATION DETAIL
// =====================================================

function NotificationDetail({
  item,
  colors,
  getIcon,
  getTitle,
  getMessage,
  getSeverity,
  getSeverityStyle,
  getAccent,
  formatDate,
}) {
  const severity = getSeverity(item);

  const severityStyle =
    getSeverityStyle(severity);

  const accent =
    getAccent(item.type);

  const hasSensorData =
    (item.temperature !== null &&
      item.temperature !== undefined) ||
    (item.humidity !== null &&
      item.humidity !== undefined) ||
    (item.heater !== null &&
      item.heater !== undefined) ||
    (item.fan !== null &&
      item.fan !== undefined);

  const hasBrooderInfo =
    Boolean(item.chicksType) ||
    (item.chicksAge !== null &&
      item.chicksAge !== undefined) ||
    Boolean(item.systemId);

  return (
    <div className="detail-body">

      <div className="detail-main">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="detail-alert-header">

          <div
            className="detail-alert-icon"
            style={{
              background:
                `${accent}18`,
            }}
          >
            {getIcon(item.type)}
          </div>

          <div className="detail-heading-content">

            <div className="detail-title-row">

              <h1 className="detail-title">
                {getTitle(item)}
              </h1>

              <span
                className="severity-badge"
                style={severityStyle}
              >
                {severity}
              </span>

            </div>

            <div className="detail-time">
              {formatDate(item.createdAt)}
            </div>

          </div>

        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        <p className="detail-message">
          {getMessage(item)}
        </p>

        {/* =================================================
            SENSOR DATA
        ================================================= */}

        {hasSensorData && (
          <section className="detail-section">

            <h3 className="detail-section-title">
              Sensor data
            </h3>

            <div className="detail-metrics">

              {item.temperature !== null &&
                item.temperature !== undefined && (
                  <DetailMetric
                    label="Temperature"
                    value={`${item.temperature}°C`}
                    icon="🌡️"
                    colors={colors}
                  />
                )}

              {item.humidity !== null &&
                item.humidity !== undefined && (
                  <DetailMetric
                    label="Humidity"
                    value={`${item.humidity}%`}
                    icon="💧"
                    colors={colors}
                  />
                )}

              {item.heater !== null &&
                item.heater !== undefined && (
                  <DetailMetric
                    label="Heater"
                    value={String(item.heater)}
                    icon="🔥"
                    colors={colors}
                  />
                )}

              {item.fan !== null &&
                item.fan !== undefined && (
                  <DetailMetric
                    label="Fan"
                    value={String(item.fan)}
                    icon="🌀"
                    colors={colors}
                  />
                )}

            </div>

          </section>
        )}

        {/* =================================================
            BROODER INFORMATION
        ================================================= */}

        {hasBrooderInfo && (
          <section className="detail-section">

            <h3 className="detail-section-title">
              Brooder information
            </h3>

            <div className="detail-info">

              {item.chicksType && (
                <DetailInfoRow
                  label="Chicks type"
                  value={item.chicksType}
                />
              )}

              {item.chicksAge !== null &&
                item.chicksAge !== undefined && (
                  <DetailInfoRow
                    label="Chicks age"
                    value={`Day ${item.chicksAge}`}
                  />
                )}

              {item.systemId && (
                <DetailInfoRow
                  label="System ID"
                  value={item.systemId}
                />
              )}

            </div>

          </section>
        )}

        {/* =================================================
            DELIVERY
        ================================================= */}

        <section className="detail-section">

          <h3 className="detail-section-title">
            Delivery
          </h3>

          <div className="detail-info">

            <div className="detail-info-row">

              <span className="detail-info-label">
                Push notification
              </span>

              <span className="detail-info-value">

                <span className="push-status">

                  <span
                    className="push-dot"
                    style={{
                      background:
                        item.isPushSent
                          ? "#22c55e"
                          : "#f59e0b",
                    }}
                  />

                  {item.isPushSent
                    ? "Sent"
                    : "Not sent"}

                </span>

              </span>

            </div>

            {item.type && (
              <DetailInfoRow
                label="Event type"
                value={item.type}
              />
            )}

            {item.createdAt && (
              <DetailInfoRow
                label="Created"
                value={formatDate(
                  item.createdAt
                )}
              />
            )}

          </div>

        </section>

      </div>

    </div>
  );
}

// =====================================================
// DETAIL METRIC
// =====================================================

function DetailMetric({
  label,
  value,
  icon,
}) {
  return (
    <div className="detail-metric">

      <div className="detail-metric-label">
        {icon} {label}
      </div>

      <div className="detail-metric-value">
        {value}
      </div>

    </div>
  );
}

// =====================================================
// DETAIL INFO ROW
// =====================================================

function DetailInfoRow({
  label,
  value,
}) {
  return (
    <div className="detail-info-row">

      <span className="detail-info-label">
        {label}
      </span>

      <span className="detail-info-value">
        {value}
      </span>

    </div>
  );
}