import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  Cpu,
  FolderKanban,
  Radio,
  Server,
  Wifi,
  WifiOff,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

const MAX_ACTIVITY = 20;
const MAX_TERMINAL_LOGS = 30;

// =====================================================
// HELPERS
// =====================================================

const getToken = () => {
  return localStorage.getItem("token");
};

const getTime = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getRelativeTime = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const diff = Math.max(0, Date.now() - date.getTime());

  const seconds = Math.floor(diff / 1000);

  if (seconds < 10) return "Just now";

  if (seconds < 60) {
    return `${seconds} sec ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days !== 1 ? "s" : ""} ago`;
};

const extractError = async (response) => {
  try {
    const data = await response.json();

    return (
      data?.message ||
      data?.error ||
      "Request failed"
    );
  } catch {
    return `Request failed (${response.status})`;
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      await extractError(response)
    );
  }

  return response.json();
};

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();

  if (
    value === "active" ||
    value === "online" ||
    value === "connected" ||
    value === "success"
  ) {
    return "success";
  }

  if (
    value === "warning" ||
    value === "pending" ||
    value === "wait"
  ) {
    return "warning";
  }

  if (
    value === "error" ||
    value === "failed" ||
    value === "offline" ||
    value === "disconnected"
  ) {
    return "error";
  }

  return "info";
};

const getEventData = (payload) => {
  if (
    payload &&
    typeof payload === "object" &&
    payload.data &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }

  return payload || {};
};

const getProjectIdFromEvent = (payload) => {
  const data = getEventData(payload);

  return (
    data.projectId ||
    data.project?.projectId ||
    data.project?.id ||
    data.projectID ||
    null
  );
};

const getDeviceIdFromEvent = (payload) => {
  const data = getEventData(payload);

  return (
    data.deviceId ||
    data.gatewayId ||
    data.nodeId ||
    data.device?.deviceId ||
    data.device?.id ||
    data.gateway?.gatewayId ||
    data.gateway?.id ||
    data.node ||
    data.id ||
    "NETWORK"
  );
};

const getEventMessage = (
  payload,
  eventName
) => {
  const data = getEventData(payload);

  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data.description === "string") {
    return data.description;
  }

  if (typeof data.reason === "string") {
    return data.reason;
  }

  if (eventName === "telemetry:update") {
    return "Telemetry update received";
  }

  if (eventName === "alert:new") {
    return "Network alert received";
  }

  if (eventName === "dashboard:update") {
    return "Network dashboard updated";
  }

  return "Network event received";
};

const normalizeEvent = (
  payload,
  eventName
) => {
  const data = getEventData(payload);

  let level = "info";

  if (eventName === "alert:new") {
    level = normalizeStatus(
      data.severity ||
        data.level ||
        data.status ||
        "warning"
    );

    if (level === "info") {
      level = "warning";
    }
  } else {
    level = normalizeStatus(
      data.level ||
        data.status ||
        data.connectionStatus
    );
  }

  let source = "LINK";

  if (eventName === "telemetry:update") {
    source = "TELEMETRY";
  }

  if (eventName === "alert:new") {
    source = "ALERT";
  }

  if (eventName === "dashboard:update") {
    source = "NETWORK";
  }

  const timestamp =
    data.timestamp ||
    data.createdAt ||
    data.updatedAt ||
    new Date().toISOString();

  return {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
    timestamp,
    time: getTime(timestamp),
    relativeTime: getRelativeTime(timestamp),
    level,
    source,
    device: String(
      getDeviceIdFromEvent(payload)
    ),
    projectId:
      getProjectIdFromEvent(payload),
    message: getEventMessage(
      payload,
      eventName
    ),
  };
};

// =====================================================
// COMPONENT
// =====================================================

const LinkDashboard = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [terminalLogs, setTerminalLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] =
    useState("");

  const [socketStatus, setSocketStatus] =
    useState("connecting");

  const [lastEventAt, setLastEventAt] =
    useState(null);

  // ===================================================
  // LOAD PROJECTS
  // ===================================================

  const loadProjects = useCallback(
    async () => {
      setLoading(true);
      setLoadingError("");

      try {
        const data = await apiRequest(
          "/api/link/projects"
        );

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.projects)
            ? data.projects
            : Array.isArray(data?.data)
            ? data.data
            : [];

        setProjects(list);
      } catch (error) {
        console.error(
          "LINK projects error:",
          error
        );

        setLoadingError(
          error.message ||
            "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ===================================================
  // SOCKET.IO NETWORK EVENTS
  // ===================================================

  useEffect(() => {
    const token = getToken();

    const socket = io(API_URL, {
      transports: [
        "websocket",
        "polling",
      ],
      auth: {
        token,
      },
      autoConnect: true,
    });

    const addEvent = (
      eventName,
      payload
    ) => {
      const event = normalizeEvent(
        payload,
        eventName
      );

      setLastEventAt(
        event.timestamp
      );

      setActivities((previous) => {
        const next = [
          event,
          ...previous,
        ];

        return next.slice(
          0,
          MAX_ACTIVITY
        );
      });

      setTerminalLogs((previous) => {
        const next = [
          event,
          ...previous,
        ];

        return next.slice(
          0,
          MAX_TERMINAL_LOGS
        );
      });
    };

    socket.on("connect", () => {
      setSocketStatus("connected");
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error(
        "LINK Socket error:",
        error.message
      );

      setSocketStatus("error");
    });

    socket.on(
      "telemetry:update",
      (payload) => {
        addEvent(
          "telemetry:update",
          payload
        );
      }
    );

    socket.on(
      "alert:new",
      (payload) => {
        addEvent(
          "alert:new",
          payload
        );
      }
    );

    socket.on(
      "dashboard:update",
      (payload) => {
        /*
         * dashboard:update can contain different
         * backend data depending on the event source.
         *
         * We only convert explicit event arrays
         * into activity entries.
         */
        const data =
          getEventData(payload);

        const events =
          data.networkLogs ||
          data.logs ||
          data.events;

        if (Array.isArray(events)) {
          events
            .slice(-10)
            .forEach((item) => {
              addEvent(
                "dashboard:update",
                item
              );
            });
        }
      }
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  // ===================================================
  // PROJECT IDS
  // ===================================================

  const projectIds = useMemo(() => {
    return new Set(
      projects
        .map(
          (project) =>
            project.projectId
        )
        .filter(Boolean)
    );
  }, [projects]);

  /*
   * IMPORTANT:
   *
   * The current backend Socket.IO events are not yet
   * project-scoped.
   *
   * Therefore events carrying a projectId are checked
   * against the user's projects.
   *
   * Events without projectId are displayed because the
   * current backend may emit gateway/network events
   * without project metadata.
   */

  const visibleActivities = useMemo(() => {
    if (!projectIds.size) {
      return activities;
    }

    return activities.filter((item) => {
      if (!item.projectId) {
        return true;
      }

      return projectIds.has(
        item.projectId
      );
    });
  }, [activities, projectIds]);

  const visibleTerminalLogs =
    useMemo(() => {
      if (!projectIds.size) {
        return terminalLogs;
      }

      return terminalLogs.filter(
        (item) => {
          if (!item.projectId) {
            return true;
          }

          return projectIds.has(
            item.projectId
          );
        }
      );
    }, [terminalLogs, projectIds]);

  // ===================================================
  // STATS
  // ===================================================

  const activeProjects = useMemo(() => {
    return projects.filter(
      (project) =>
        String(
          project.status || ""
        ).toLowerCase() === "active"
    ).length;
  }, [projects]);

  const networkStats = useMemo(() => {
    let success = 0;
    let warning = 0;
    let error = 0;

    visibleTerminalLogs.forEach(
      (event) => {
        if (event.level === "success") {
          success += 1;
        }

        if (event.level === "warning") {
          warning += 1;
        }

        if (event.level === "error") {
          error += 1;
        }
      }
    );

    return {
      total: visibleTerminalLogs.length,
      success,
      warning,
      error,
    };
  }, [visibleTerminalLogs]);

  // ===================================================
  // PROJECT NAVIGATION
  // ===================================================

  const openProject = (projectId) => {
    if (!projectId) return;

    navigate(
      `/link/developer/${projectId}`
    );
  };

  const viewAllProjects = () => {
    navigate("/link/projects");
  };

  // ===================================================
  // STAT CARDS
  // ===================================================

  const stats = useMemo(
    () => [
      {
        label: "Projects",
        value: projects.length,
        detail: `${activeProjects} active`,
        icon: FolderKanban,
        type: "purple",
      },
      {
        label: "Network events",
        value: networkStats.total,
        detail:
          "Received this session",
        icon: Activity,
        type: "blue",
      },
      {
        label: "Successful events",
        value: networkStats.success,
        detail:
          "Received successfully",
        icon: CheckCircle2,
        type: "green",
      },
      {
        label: "Network status",
        value:
          socketStatus === "connected"
            ? "Online"
            : "Offline",
        detail:
          socketStatus ===
          "connected"
            ? lastEventAt
              ? `Last event ${getRelativeTime(
                  lastEventAt
                )}`
              : "Connected to server"
            : "Connection unavailable",
        icon:
          socketStatus ===
          "connected"
            ? Wifi
            : WifiOff,
        type: "cyan",
      },
    ],
    [
      projects.length,
      activeProjects,
      networkStats,
      socketStatus,
      lastEventAt,
    ]
  );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <style>{`
        .link-dashboard {
          min-height: 100vh;
          background: #f6f7fb;
          color: #151827;
          padding: 24px;
          box-sizing: border-box;
        }

        .link-dashboard * {
          box-sizing: border-box;
        }

        .link-dashboard-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .link-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .link-title-area {
          min-width: 0;
        }

        .link-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #656b7d;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .link-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.10);
        }

        .link-title {
          margin: 0;
          font-size: clamp(24px, 3vw, 34px);
          line-height: 1.15;
          font-weight: 750;
          letter-spacing: -0.7px;
        }

        .link-subtitle {
          margin: 8px 0 0;
          color: #6d7385;
          font-size: 14px;
          line-height: 1.5;
        }

        .link-status {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e5e7ef;
          border-radius: 12px;
          padding: 11px 15px;
          white-space: nowrap;
        }

        .link-status-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
        }

        .link-status-icon.online {
          background: #ecfdf3;
          color: #16a34a;
        }

        .link-status-icon.offline {
          background: #fef2f2;
          color: #dc2626;
        }

        .link-status-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .link-status-label {
          color: #73798b;
          font-size: 11px;
          font-weight: 600;
        }

        .link-status-value {
          font-size: 13px;
          font-weight: 700;
        }

        .link-status-value.online {
          color: #15803d;
        }

        .link-status-value.offline {
          color: #b91c1c;
        }

        .link-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .link-stat {
          background: #ffffff;
          border: 1px solid #e5e7ef;
          border-radius: 14px;
          padding: 18px;
          min-width: 0;
        }

        .link-stat-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .link-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .link-stat-icon.purple {
          background: #f3e8ff;
          color: #7e22ce;
        }

        .link-stat-icon.blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .link-stat-icon.green {
          background: #ecfdf3;
          color: #16a34a;
        }

        .link-stat-icon.cyan {
          background: #ecfeff;
          color: #0891b2;
        }

        .link-stat-label {
          color: #707689;
          font-size: 13px;
          font-weight: 600;
        }

        .link-stat-value {
          margin-top: 5px;
          font-size: 25px;
          line-height: 1.1;
          font-weight: 750;
          letter-spacing: -0.4px;
          word-break: break-word;
        }

        .link-stat-detail {
          color: #8a90a0;
          font-size: 12px;
          margin-top: 7px;
        }

        .link-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
          gap: 20px;
          align-items: start;
        }

        .link-panel {
          background: #ffffff;
          border: 1px solid #e5e7ef;
          border-radius: 14px;
          overflow: hidden;
        }

        .link-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid #edf0f5;
        }

        .link-panel-title-area {
          min-width: 0;
        }

        .link-panel-title {
          margin: 0;
          font-size: 15px;
          font-weight: 750;
        }

        .link-panel-description {
          margin: 5px 0 0;
          color: #858b9b;
          font-size: 12px;
        }

        .link-panel-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 0;
          background: transparent;
          color: #4f46e5;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 5px;
        }

        .link-panel-action:hover {
          color: #3730a3;
        }

        .link-projects {
          display: flex;
          flex-direction: column;
        }

        .link-project {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          padding: 17px 20px;
          border-bottom: 1px solid #f0f1f5;
        }

        .link-project:last-child {
          border-bottom: 0;
        }

        .link-project-main {
          min-width: 0;
        }

        .link-project-name-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .link-project-name {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .link-project-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 700;
        }

        .link-project-status.active {
          background: #ecfdf3;
          color: #15803d;
        }

        .link-project-status.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .link-project-id {
          margin: 6px 0 0;
          color: #858b9b;
          font-size: 11px;
          font-family: monospace;
          overflow-wrap: anywhere;
        }

        .link-project-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 10px;
          color: #73798a;
          font-size: 11px;
        }

        .link-project-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .link-project-open {
          align-self: center;
          width: 32px;
          height: 32px;
          border: 1px solid #e5e7ef;
          background: #ffffff;
          color: #687084;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .link-project-open:hover {
          border-color: #cdd1dc;
          color: #4f46e5;
          background: #fafaff;
        }

        .link-empty {
          padding: 34px 20px;
          text-align: center;
        }

        .link-empty-icon {
          width: 42px;
          height: 42px;
          margin: 0 auto 12px;
          border-radius: 11px;
          background: #f3f4f6;
          color: #7b8191;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .link-empty-title {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
        }

        .link-empty-text {
          margin: 6px auto 0;
          max-width: 400px;
          color: #858b9b;
          font-size: 11px;
          line-height: 1.5;
        }

        .link-error {
          padding: 18px 20px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.5;
        }

        .link-network-box {
          margin-top: 20px;
          background: #151827;
          border-radius: 14px;
          overflow: hidden;
          color: #d8dbea;
        }

        .link-network-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 13px 16px;
          background: #1c2030;
          border-bottom: 1px solid #292e40;
        }

        .link-network-header-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .link-terminal-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .link-terminal-dot.live {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        }

        .link-terminal-dot.offline {
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }

        .link-terminal-title {
          font-size: 11px;
          font-weight: 700;
          color: #e8eaf2;
        }

        .link-terminal-status {
          font-size: 10px;
          font-family: monospace;
        }

        .link-terminal-status.live {
          color: #6ee7b7;
        }

        .link-terminal-status.offline {
          color: #fca5a5;
        }

        .link-terminal-body {
          padding: 15px 16px;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.8;
          max-height: 310px;
          overflow-y: auto;
        }

        .link-terminal-line {
          display: flex;
          gap: 9px;
          min-width: 0;
        }

        .link-terminal-prefix {
          color: #81879b;
          flex-shrink: 0;
        }

        .link-terminal-source {
          flex-shrink: 0;
          font-weight: 700;
        }

        .link-terminal-success {
          color: #6ee7b7;
        }

        .link-terminal-info {
          color: #93c5fd;
        }

        .link-terminal-warning {
          color: #fdba74;
        }

        .link-terminal-error {
          color: #fca5a5;
        }

        .link-terminal-command {
          color: #a5b4fc;
        }

        .link-terminal-message {
          color: #d8dbea;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .link-terminal-empty {
          color: #81879b;
          text-align: center;
          padding: 12px 0;
        }

        .link-activity-list {
          padding: 4px 20px;
        }

        .link-activity {
          position: relative;
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) auto;
          gap: 10px;
          padding: 15px 0;
          border-bottom: 1px solid #f0f1f5;
        }

        .link-activity:last-child {
          border-bottom: 0;
        }

        .link-activity-icon {
          width: 27px;
          height: 27px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .link-activity-icon.success {
          background: #ecfdf3;
          color: #16a34a;
        }

        .link-activity-icon.info {
          background: #eff6ff;
          color: #2563eb;
        }

        .link-activity-icon.warning {
          background: #fff7ed;
          color: #ea580c;
        }

        .link-activity-icon.error {
          background: #fef2f2;
          color: #dc2626;
        }

        .link-activity-content {
          min-width: 0;
        }

        .link-activity-title {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
          color: #272b39;
        }

        .link-activity-description {
          margin: 4px 0 0;
          color: #858b9b;
          font-size: 11px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .link-activity-time {
          color: #9a9fad;
          font-size: 10px;
          white-space: nowrap;
          padding-top: 2px;
        }

        .link-loading {
          padding: 30px 20px;
          text-align: center;
          color: #858b9b;
          font-size: 12px;
        }

        .link-session-note {
          margin-top: 10px;
          color: #8a90a0;
          font-size: 10px;
          line-height: 1.5;
        }

        @media (max-width: 1100px) {
          .link-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .link-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .link-dashboard {
            padding: 16px;
          }

          .link-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .link-status {
            width: 100%;
          }

          .link-stats {
            grid-template-columns: 1fr;
          }

          .link-stat {
            padding: 16px;
          }

          .link-panel-header {
            padding: 16px;
          }

          .link-project {
            padding: 16px;
          }

          .link-activity-list {
            padding: 4px 16px;
          }

          .link-activity {
            grid-template-columns: 30px minmax(0, 1fr);
          }

          .link-activity-time {
            grid-column: 2;
            padding-top: 0;
          }

          .link-network-box {
            margin-top: 16px;
          }
        }

        @media (max-width: 420px) {
          .link-dashboard {
            padding: 12px;
          }

          .link-title {
            font-size: 23px;
          }

          .link-subtitle {
            font-size: 13px;
          }

          .link-project-meta {
            gap: 9px;
          }

          .link-terminal-body {
            padding: 12px;
            font-size: 10px;
          }
        }
      `}</style>

      <main className="link-dashboard">
        <div className="link-dashboard-container">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="link-header">
            <div className="link-title-area">
              <div className="link-eyebrow">
                <span className="link-eyebrow-dot" />
                ANTIMATE LINK
              </div>

              <h1 className="link-title">
                Network Dashboard
              </h1>

              <p className="link-subtitle">
                Monitor your projects and live
                ANTIMATE LINK network activity.
              </p>
            </div>

            <div className="link-status">
              <div
                className={`link-status-icon ${
                  socketStatus === "connected"
                    ? "online"
                    : "offline"
                }`}
              >
                {socketStatus ===
                "connected" ? (
                  <Wifi size={18} />
                ) : (
                  <WifiOff size={18} />
                )}
              </div>

              <div className="link-status-text">
                <span className="link-status-label">
                  Network status
                </span>

                <span
                  className={`link-status-value ${
                    socketStatus ===
                    "connected"
                      ? "online"
                      : "offline"
                  }`}
                >
                  {socketStatus ===
                  "connected"
                    ? "Live connection"
                    : "Connection unavailable"}
                </span>
              </div>
            </div>
          </header>

          {/* =================================================
              STATS
          ================================================= */}

          <section className="link-stats">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  className="link-stat"
                  key={stat.label}
                >
                  <div className="link-stat-top">
                    <div
                      className={`link-stat-icon ${stat.type}`}
                    >
                      <Icon size={19} />
                    </div>

                    <Activity
                      size={16}
                      color="#a0a5b3"
                    />
                  </div>

                  <div className="link-stat-label">
                    {stat.label}
                  </div>

                  <div className="link-stat-value">
                    {stat.value}
                  </div>

                  <div className="link-stat-detail">
                    {stat.detail}
                  </div>
                </div>
              );
            })}
          </section>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <section className="link-main-grid">

            {/* =================================================
                LEFT
            ================================================= */}

            <div>

              {/* PROJECTS */}

              <div className="link-panel">
                <div className="link-panel-header">
                  <div className="link-panel-title-area">
                    <h2 className="link-panel-title">
                      Projects
                    </h2>

                    <p className="link-panel-description">
                      Your ANTIMATE LINK projects
                    </p>
                  </div>

                  <button
                    className="link-panel-action"
                    type="button"
                    onClick={
                      viewAllProjects
                    }
                  >
                    View all
                    <ArrowUpRight
                      size={14}
                    />
                  </button>
                </div>

                {loading ? (
                  <div className="link-loading">
                    Loading projects...
                  </div>
                ) : loadingError ? (
                  <div className="link-error">
                    {loadingError}
                  </div>
                ) : projects.length ===
                  0 ? (
                  <div className="link-empty">
                    <div className="link-empty-icon">
                      <FolderKanban
                        size={19}
                      />
                    </div>

                    <h3 className="link-empty-title">
                      No projects yet
                    </h3>

                    <p className="link-empty-text">
                      Create an ANTIMATE LINK
                      project to start
                      connecting your devices
                      through the network.
                    </p>
                  </div>
                ) : (
                  <div className="link-projects">
                    {projects
                      .slice(0, 5)
                      .map((project) => {
                        const isActive =
                          String(
                            project.status ||
                              ""
                          ).toLowerCase() ===
                          "active";

                        return (
                          <div
                            className="link-project"
                            key={
                              project.projectId ||
                              project._id
                            }
                          >
                            <div className="link-project-main">

                              <div className="link-project-name-row">
                                <h3 className="link-project-name">
                                  {project.projectName ||
                                    "Unnamed project"}
                                </h3>

                                <span
                                  className={`link-project-status ${
                                    isActive
                                      ? "active"
                                      : "inactive"
                                  }`}
                                >
                                  <Circle
                                    size={6}
                                    fill="currentColor"
                                  />

                                  {isActive
                                    ? "Active"
                                    : project.status ||
                                      "Inactive"}
                                </span>
                              </div>

                              <p className="link-project-id">
                                {project.projectId ||
                                  "No Project ID"}
                              </p>

                              <div className="link-project-meta">

                                <span className="link-project-meta-item">
                                  <Server
                                    size={13}
                                  />
                                  {project.authorizedDestinations
                                    ?.length ??
                                    "—"}{" "}
                                  authorized
                                </span>

                                <span className="link-project-meta-item">
                                  <Radio
                                    size={13}
                                  />
                                  Protocol{" "}
                                  {project.protocolVersion ||
                                    "1.0"}
                                </span>

                                <span className="link-project-meta-item">
                                  <Zap
                                    size={13}
                                  />
                                  Edge SDK{" "}
                                  {project.sdkVersion ||
                                    "1.0.0"}
                                </span>

                              </div>

                            </div>

                            <button
                              className="link-project-open"
                              type="button"
                              aria-label={`Open ${
                                project.projectName ||
                                "project"
                              }`}
                              onClick={() =>
                                openProject(
                                  project.projectId
                                )
                              }
                            >
                              <ChevronRight
                                size={17}
                              />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* NETWORK TERMINAL */}

              <div className="link-network-box">
                <div className="link-network-header">

                  <div className="link-network-header-left">
                    <span
                      className={`link-terminal-dot ${
                        socketStatus ===
                        "connected"
                          ? "live"
                          : "offline"
                      }`}
                    />

                    <span className="link-terminal-title">
                      ANTIMATE LINK NETWORK
                    </span>
                  </div>

                  <span
                    className={`link-terminal-status ${
                      socketStatus ===
                      "connected"
                        ? "live"
                        : "offline"
                    }`}
                  >
                    {socketStatus ===
                    "connected"
                      ? "LIVE"
                      : "OFFLINE"}
                  </span>
                </div>

                <div className="link-terminal-body">
                  {visibleTerminalLogs.length ===
                  0 ? (
                    <div className="link-terminal-empty">
                      {socketStatus ===
                      "connected"
                        ? "Listening for live network events..."
                        : "Waiting for network connection..."}
                    </div>
                  ) : (
                    visibleTerminalLogs.map(
                      (event) => (
                        <div
                          className="link-terminal-line"
                          key={event.id}
                        >
                          <span className="link-terminal-prefix">
                            {event.time}
                          </span>

                          <span
                            className={`link-terminal-source ${
                              event.level ===
                              "success"
                                ? "link-terminal-success"
                                : event.level ===
                                  "warning"
                                ? "link-terminal-warning"
                                : event.level ===
                                  "error"
                                ? "link-terminal-error"
                                : event.source ===
                                  "LINK"
                                ? "link-terminal-command"
                                : "link-terminal-info"
                            }`}
                          >
                            [
                            {event.source}
                            ]
                          </span>

                          <span className="link-terminal-message">
                            {event.device !==
                              "NETWORK" &&
                              `${event.device}: `}
                            {event.message}
                          </span>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              <div className="link-session-note">
                Network events shown here are
                received from the ANTIMATE backend
                during the current dashboard
                session.
              </div>

            </div>

            {/* =================================================
                RIGHT — RECENT ACTIVITY
            ================================================= */}

            <div className="link-panel">
              <div className="link-panel-header">
                <div className="link-panel-title-area">
                  <h2 className="link-panel-title">
                    Recent activity
                  </h2>

                  <p className="link-panel-description">
                    Latest network events
                  </p>
                </div>

                <Activity
                  size={17}
                  color="#7b8191"
                />
              </div>

              <div className="link-activity-list">
                {visibleActivities.length ===
                0 ? (
                  <div className="link-empty">
                    <div className="link-empty-icon">
                      <Activity
                        size={19}
                      />
                    </div>

                    <h3 className="link-empty-title">
                      No recent activity
                    </h3>

                    <p className="link-empty-text">
                      Live network events will
                      appear here when your
                      ANTIMATE LINK backend
                      receives them.
                    </p>
                  </div>
                ) : (
                  visibleActivities.map(
                    (item) => (
                      <div
                        className="link-activity"
                        key={item.id}
                      >
                        <div
                          className={`link-activity-icon ${item.level}`}
                        >
                          {item.level ===
                            "success" && (
                            <CheckCircle2
                              size={14}
                            />
                          )}

                          {item.level ===
                            "warning" && (
                            <AlertTriangle
                              size={14}
                            />
                          )}

                          {item.level ===
                            "error" && (
                            <WifiOff
                              size={14}
                            />
                          )}

                          {item.level ===
                            "info" && (
                            <Radio
                              size={14}
                            />
                          )}
                        </div>

                        <div className="link-activity-content">
                          <h3 className="link-activity-title">
                            {item.source}
                            {" "}
                            event
                          </h3>

                          <p className="link-activity-description">
                            {item.device !==
                              "NETWORK" &&
                              `${item.device}: `}
                            {item.message}
                          </p>

                          {item.projectId && (
                            <p className="link-activity-description">
                              Project:{" "}
                              {item.projectId}
                            </p>
                          )}
                        </div>

                        <span className="link-activity-time">
                          {item.relativeTime}
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

          </section>

        </div>
      </main>
    </>
  );
};

export default LinkDashboard;