import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Copy,
  Filter,
  Info,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  Server,
  Trash2,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";

const INITIAL_LOGS = [
  {
    id: 1,
    time: "17:48:21.142",
    level: "SUCCESS",
    source: "GATEWAY",
    device: "GTW-26-86FD75",
    message: "Gateway connected successfully",
  },
  {
    id: 2,
    time: "17:48:22.031",
    level: "INFO",
    source: "LINK",
    device: "GTW-26-86FD75",
    message: "Gateway heartbeat received",
  },
  {
    id: 3,
    time: "17:48:23.487",
    level: "SUCCESS",
    source: "NODE",
    device: "DEV-339CD8",
    message: "Node registered on network",
  },
  {
    id: 4,
    time: "17:48:25.104",
    level: "INFO",
    source: "LORA",
    device: "DEV-339CD8",
    message: "LoRa packet received",
  },
  {
    id: 5,
    time: "17:48:25.129",
    level: "SUCCESS",
    source: "LINK",
    device: "DEV-339CD8",
    message: "Packet forwarded successfully",
  },
  {
    id: 6,
    time: "17:48:27.612",
    level: "INFO",
    source: "PROJECT",
    device: "ANT-LK-8F29",
    message: "Project traffic synchronized",
  },
  {
    id: 7,
    time: "17:48:29.305",
    level: "SUCCESS",
    source: "GATEWAY",
    device: "GTW-26-86FD75",
    message: "Heartbeat acknowledged",
  },
  {
    id: 8,
    time: "17:48:31.774",
    level: "WARNING",
    source: "NETWORK",
    device: "GTW-26-86FD75",
    message: "Network latency above normal threshold",
  },
  {
    id: 9,
    time: "17:48:33.020",
    level: "INFO",
    source: "LINK",
    device: "ANT-LK-8F29",
    message: "Listening for incoming events",
  },
];

const LEVELS = ["ALL", "INFO", "SUCCESS", "WARNING", "ERROR"];

const LinkNetwork = () => {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const terminalRef = useRef(null);

  const sources = useMemo(() => {
    const values = logs.map((log) => log.source);
    return ["ALL", ...new Set(values)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel =
        levelFilter === "ALL" ||
        log.level === levelFilter;

      const matchesSource =
        sourceFilter === "ALL" ||
        log.source === sourceFilter;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        log.message.toLowerCase().includes(query) ||
        log.device.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query);

      return (
        matchesLevel &&
        matchesSource &&
        matchesSearch
      );
    });
  }, [logs, levelFilter, sourceFilter, search]);

  const statistics = useMemo(() => {
    return {
      total: logs.length,
      success: logs.filter(
        (log) => log.level === "SUCCESS"
      ).length,
      warnings: logs.filter(
        (log) => log.level === "WARNING"
      ).length,
      errors: logs.filter(
        (log) => log.level === "ERROR"
      ).length,
    };
  }, [logs]);

  useEffect(() => {
    if (!autoScroll || paused || !terminalRef.current) {
      return;
    }

    terminalRef.current.scrollTop =
      terminalRef.current.scrollHeight;
  }, [filteredLogs, autoScroll, paused]);

  useEffect(() => {
    if (paused) {
      return undefined;
    }

    const timer = setInterval(() => {
      const now = new Date();

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const milliseconds = String(
        now.getMilliseconds()
      ).padStart(3, "0");

      const demoEvents = [
        {
          level: "INFO",
          source: "LINK",
          device: "ANT-LK-8F29",
          message: "Network heartbeat received",
        },
        {
          level: "SUCCESS",
          source: "LORA",
          device: "DEV-339CD8",
          message: "Telemetry packet received",
        },
        {
          level: "INFO",
          source: "GATEWAY",
          device: "GTW-26-86FD75",
          message: "Gateway status synchronized",
        },
        {
          level: "SUCCESS",
          source: "LINK",
          device: "GTW-26-86FD75",
          message: "Packet forwarded successfully",
        },
        {
          level: "WARNING",
          source: "NETWORK",
          device: "GTW-26-86FD75",
          message: "Waiting for network response",
        },
      ];

      const event =
        demoEvents[
          Math.floor(
            Math.random() * demoEvents.length
          )
        ];

      const newLog = {
        id: Date.now(),
        time: `${hours}:${minutes}:${seconds}.${milliseconds}`,
        ...event,
      };

      setLogs((current) => {
        const next = [...current, newLog];

        if (next.length > 150) {
          return next.slice(next.length - 150);
        }

        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [paused]);

  const clearLogs = () => {
    setLogs([]);
  };

  const restoreDemoLogs = () => {
    setLogs(INITIAL_LOGS);
  };

  const copyLogs = async () => {
    const text = filteredLogs
      .map(
        (log) =>
          `${log.time} [${log.level}] [${log.source}] ${log.device} - ${log.message}`
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  const levelClass = (level) => {
    switch (level) {
      case "SUCCESS":
        return "success";

      case "WARNING":
        return "warning";

      case "ERROR":
        return "error";

      default:
        return "info";
    }
  };

  const levelIcon = (level) => {
    switch (level) {
      case "SUCCESS":
        return <CheckCircle2 size={13} />;

      case "WARNING":
        return <AlertTriangle size={13} />;

      case "ERROR":
        return <XCircle size={13} />;

      default:
        return <Info size={13} />;
    }
  };

  return (
    <>
      <style>{`
        .link-network-page {
          min-height: 100vh;
          background: #f5f6fa;
          color: #161925;
          padding: 24px;
        }

        .link-network-page * {
          box-sizing: border-box;
        }

        .link-network-container {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .ln-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .ln-header-left {
          min-width: 0;
        }

        .ln-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #646a7b;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .ln-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
        }

        .ln-title {
          margin: 0;
          font-size: clamp(25px, 3vw, 34px);
          line-height: 1.15;
          letter-spacing: -0.7px;
          font-weight: 750;
        }

        .ln-subtitle {
          margin: 8px 0 0;
          color: #707689;
          font-size: 14px;
          line-height: 1.5;
        }

        .ln-live-status {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e2e5ed;
          border-radius: 11px;
          padding: 10px 13px;
          white-space: nowrap;
        }

        .ln-live-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #ecfdf3;
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ln-live-label {
          color: #858b9b;
          font-size: 10px;
          font-weight: 600;
        }

        .ln-live-value {
          color: #15803d;
          font-size: 12px;
          font-weight: 750;
          margin-top: 2px;
        }

        .ln-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 16px;
        }

        .ln-stat {
          background: #ffffff;
          border: 1px solid #e3e6ed;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ln-stat-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ln-stat-icon.blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .ln-stat-icon.green {
          background: #ecfdf3;
          color: #16a34a;
        }

        .ln-stat-icon.orange {
          background: #fff7ed;
          color: #ea580c;
        }

        .ln-stat-icon.red {
          background: #fef2f2;
          color: #dc2626;
        }

        .ln-stat-label {
          color: #7b8191;
          font-size: 10px;
          font-weight: 700;
        }

        .ln-stat-value {
          margin-top: 3px;
          font-size: 19px;
          font-weight: 750;
        }

        .ln-console {
          background: #111522;
          border: 1px solid #252b3d;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 12px 35px rgba(15, 18, 30, 0.13);
        }

        .ln-console-top {
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 14px;
          background: #191e2d;
          border-bottom: 1px solid #292f41;
        }

        .ln-console-title {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .ln-terminal-dots {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-right: 5px;
        }

        .ln-terminal-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .ln-terminal-dot.red {
          background: #ef4444;
        }

        .ln-terminal-dot.yellow {
          background: #f59e0b;
        }

        .ln-terminal-dot.green {
          background: #22c55e;
        }

        .ln-console-name {
          color: #e7e9f1;
          font-family: monospace;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .ln-console-live {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #6ee7b7;
          font-family: monospace;
          font-size: 10px;
        }

        .ln-console-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 7px rgba(34, 197, 94, 0.7);
        }

        .ln-console-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ln-tool-button {
          height: 31px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #32394d;
          background: #202638;
          color: #aeb5c7;
          border-radius: 7px;
          padding: 0 9px;
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .ln-tool-button:hover {
          background: #282f43;
          color: #ffffff;
        }

        .ln-tool-button.active {
          color: #a5b4fc;
          border-color: #444b72;
          background: #272b49;
        }

        .ln-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          background: #151a28;
          border-bottom: 1px solid #292f41;
        }

        .ln-filter-group {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }

        .ln-filter-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #737b8f;
          font-size: 10px;
          margin-right: 4px;
        }

        .ln-filter-button {
          height: 27px;
          padding: 0 8px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #7e8699;
          font-family: inherit;
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
        }

        .ln-filter-button:hover {
          background: #22283a;
          color: #cdd2df;
        }

        .ln-filter-button.active {
          background: #303750;
          color: #a5b4fc;
        }

        .ln-search {
          position: relative;
          width: 220px;
          flex-shrink: 0;
        }

        .ln-search-icon {
          position: absolute;
          left: 9px;
          top: 50%;
          transform: translateY(-50%);
          color: #697186;
        }

        .ln-search-input {
          width: 100%;
          height: 29px;
          padding: 0 9px 0 28px;
          border: 1px solid #30374b;
          border-radius: 7px;
          outline: none;
          background: #101522;
          color: #dce0ea;
          font-family: monospace;
          font-size: 10px;
        }

        .ln-search-input::placeholder {
          color: #626a7e;
        }

        .ln-search-input:focus {
          border-color: #4f46e5;
        }

        .ln-terminal {
          height: min(62vh, 650px);
          min-height: 420px;
          overflow-y: auto;
          padding: 14px 16px 20px;
          background: #0d111b;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 11px;
          line-height: 1.7;
        }

        .ln-terminal::-webkit-scrollbar {
          width: 9px;
        }

        .ln-terminal::-webkit-scrollbar-track {
          background: #0b0f18;
        }

        .ln-terminal::-webkit-scrollbar-thumb {
          background: #293145;
          border-radius: 10px;
        }

        .ln-log {
          display: grid;
          grid-template-columns: 94px 74px 72px 135px minmax(0, 1fr);
          gap: 8px;
          align-items: baseline;
          min-height: 25px;
          padding: 3px 0;
          color: #aeb6c7;
        }

        .ln-log:hover {
          background: rgba(255, 255, 255, 0.025);
        }

        .ln-log-time {
          color: #626b80;
        }

        .ln-log-level {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 750;
        }

        .ln-log-level.info {
          color: #93c5fd;
        }

        .ln-log-level.success {
          color: #6ee7b7;
        }

        .ln-log-level.warning {
          color: #fdba74;
        }

        .ln-log-level.error {
          color: #fca5a5;
        }

        .ln-log-source {
          color: #a5b4fc;
          font-size: 10px;
        }

        .ln-log-device {
          color: #7f899f;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ln-log-message {
          color: #c7ccda;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ln-terminal-empty {
          min-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: #687187;
          text-align: center;
          gap: 8px;
        }

        .ln-terminal-empty strong {
          color: #9aa3b8;
          font-size: 12px;
        }

        .ln-terminal-empty span {
          font-size: 10px;
        }

        .ln-terminal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 13px;
          background: #111622;
          border-top: 1px solid #252b3d;
          color: #687187;
          font-family: monospace;
          font-size: 9px;
        }

        .ln-footer-left {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .ln-footer-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .ln-footer-green {
          color: #6ee7b7;
        }

        .ln-footer-blue {
          color: #93c5fd;
        }

        .ln-command {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px 14px;
          border: 1px solid #252b3d;
          border-radius: 10px;
          background: #111622;
          color: #697287;
          font-family: monospace;
          font-size: 10px;
        }

        .ln-command-prompt {
          color: #6ee7b7;
        }

        .ln-command-text {
          color: #858ea3;
        }

        @media (max-width: 1000px) {
          .ln-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ln-log {
            grid-template-columns: 85px 70px 65px 115px minmax(0, 1fr);
          }
        }

        @media (max-width: 760px) {
          .link-network-page {
            padding: 16px;
          }

          .ln-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .ln-live-status {
            width: 100%;
          }

          .ln-console-top {
            align-items: flex-start;
            flex-direction: column;
          }

          .ln-console-actions {
            width: 100%;
            overflow-x: auto;
          }

          .ln-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .ln-filter-group {
            width: 100%;
            overflow-x: auto;
          }

          .ln-search {
            width: 100%;
          }

          .ln-terminal {
            min-height: 450px;
            height: 60vh;
            overflow-x: auto;
          }

          .ln-log {
            min-width: 610px;
          }

          .ln-terminal-footer {
            min-width: 610px;
          }

          .ln-terminal-footer {
            overflow-x: auto;
          }

          .ln-footer-left {
            white-space: nowrap;
          }

          .ln-command {
            overflow-x: auto;
            white-space: nowrap;
          }
        }

        @media (max-width: 520px) {
          .link-network-page {
            padding: 12px;
          }

          .ln-stats {
            grid-template-columns: 1fr;
          }

          .ln-title {
            font-size: 24px;
          }

          .ln-subtitle {
            font-size: 13px;
          }

          .ln-console-actions {
            width: 100%;
          }

          .ln-tool-button {
            flex: 0 0 auto;
          }
        }
      `}</style>

      <main className="link-network-page">
        <div className="link-network-container">

          <header className="ln-header">
            <div className="ln-header-left">
              <div className="ln-eyebrow">
                <span className="ln-eyebrow-dot" />
                ANTIMATE LINK
              </div>

              <h1 className="ln-title">
                Network Console
              </h1>

              <p className="ln-subtitle">
                Monitor live connectivity events, gateways,
                nodes and network traffic.
              </p>
            </div>

            <div className="ln-live-status">
              <div className="ln-live-icon">
                <Activity size={17} />
              </div>

              <div>
                <div className="ln-live-label">
                  NETWORK
                </div>

                <div className="ln-live-value">
                  LIVE
                </div>
              </div>
            </div>
          </header>

          <section className="ln-stats">

            <div className="ln-stat">
              <div className="ln-stat-icon blue">
                <Activity size={17} />
              </div>

              <div>
                <div className="ln-stat-label">
                  TOTAL EVENTS
                </div>

                <div className="ln-stat-value">
                  {statistics.total}
                </div>
              </div>
            </div>

            <div className="ln-stat">
              <div className="ln-stat-icon green">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <div className="ln-stat-label">
                  SUCCESS
                </div>

                <div className="ln-stat-value">
                  {statistics.success}
                </div>
              </div>
            </div>

            <div className="ln-stat">
              <div className="ln-stat-icon orange">
                <AlertTriangle size={17} />
              </div>

              <div>
                <div className="ln-stat-label">
                  WARNINGS
                </div>

                <div className="ln-stat-value">
                  {statistics.warnings}
                </div>
              </div>
            </div>

            <div className="ln-stat">
              <div className="ln-stat-icon red">
                <XCircle size={17} />
              </div>

              <div>
                <div className="ln-stat-label">
                  ERRORS
                </div>

                <div className="ln-stat-value">
                  {statistics.errors}
                </div>
              </div>
            </div>

          </section>

          <section className="ln-console">

            <div className="ln-console-top">

              <div className="ln-console-title">
                <div className="ln-terminal-dots">
                  <span className="ln-terminal-dot red" />
                  <span className="ln-terminal-dot yellow" />
                  <span className="ln-terminal-dot green" />
                </div>

                <span className="ln-console-name">
                  antimate-link-network
                </span>

                <span className="ln-console-live">
                  <span className="ln-console-live-dot" />
                  LIVE
                </span>
              </div>

              <div className="ln-console-actions">

                <button
                  type="button"
                  className={`ln-tool-button ${
                    !paused ? "active" : ""
                  }`}
                  onClick={() => setPaused(false)}
                >
                  <Play size={12} />
                  Live
                </button>

                <button
                  type="button"
                  className={`ln-tool-button ${
                    paused ? "active" : ""
                  }`}
                  onClick={() => setPaused(true)}
                >
                  <Pause size={12} />
                  Pause
                </button>

                <button
                  type="button"
                  className={`ln-tool-button ${
                    autoScroll ? "active" : ""
                  }`}
                  onClick={() =>
                    setAutoScroll((current) => !current)
                  }
                >
                  <RefreshCw size={12} />
                  Auto-scroll
                </button>

                <button
                  type="button"
                  className="ln-tool-button"
                  onClick={copyLogs}
                >
                  {copied ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>

                <button
                  type="button"
                  className="ln-tool-button"
                  onClick={clearLogs}
                >
                  <Trash2 size={12} />
                  Clear
                </button>

              </div>

            </div>

            <div className="ln-toolbar">

              <div className="ln-filter-group">

                <span className="ln-filter-label">
                  <Filter size={11} />
                  LEVEL
                </span>

                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`ln-filter-button ${
                      levelFilter === level
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setLevelFilter(level)
                    }
                  >
                    {level}
                  </button>
                ))}

              </div>

              <div className="ln-filter-group">

                <span className="ln-filter-label">
                  SOURCE
                </span>

                {sources.map((source) => (
                  <button
                    key={source}
                    type="button"
                    className={`ln-filter-button ${
                      sourceFilter === source
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSourceFilter(source)
                    }
                  >
                    {source}
                  </button>
                ))}

              </div>

              <div className="ln-search">
                <Search
                  size={12}
                  className="ln-search-icon"
                />

                <input
                  type="search"
                  className="ln-search-input"
                  placeholder="Search logs..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

            </div>

            <div
              className="ln-terminal"
              ref={terminalRef}
            >
              {filteredLogs.length === 0 ? (
                <div className="ln-terminal-empty">
                  <WifiOff size={22} />

                  <strong>
                    No network events
                  </strong>

                  <span>
                    Clear filters or wait for new events.
                  </span>

                  {logs.length === 0 && (
                    <button
                      type="button"
                      className="ln-tool-button"
                      onClick={restoreDemoLogs}
                      style={{ marginTop: 8 }}
                    >
                      <RefreshCw size={12} />
                      Restore demo logs
                    </button>
                  )}
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    className="ln-log"
                    key={log.id}
                  >
                    <span className="ln-log-time">
                      {log.time}
                    </span>

                    <span
                      className={`ln-log-level ${levelClass(
                        log.level
                      )}`}
                    >
                      {levelIcon(log.level)}
                      {log.level}
                    </span>

                    <span className="ln-log-source">
                      [{log.source}]
                    </span>

                    <span className="ln-log-device">
                      {log.device}
                    </span>

                    <span className="ln-log-message">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="ln-terminal-footer">

              <div className="ln-footer-left">

                <span className="ln-footer-item">
                  <Circle
                    size={7}
                    fill="currentColor"
                    className="ln-footer-green"
                  />
                  Connection active
                </span>

                <span className="ln-footer-item">
                  <Server size={10} />
                  4 gateways
                </span>

                <span className="ln-footer-item">
                  <Radio size={10} />
                  28 nodes
                </span>

              </div>

              <span className="ln-footer-item ln-footer-blue">
                {filteredLogs.length} visible events
              </span>

            </div>

          </section>

          <div className="ln-command">
            <span className="ln-command-prompt">
              antimate-link$
            </span>

            <span className="ln-command-text">
              listening for network events...
            </span>

            <Zap size={11} />

            <span>
              SDK v1.0
            </span>
          </div>

        </div>
      </main>
    </>
  );
};

export default LinkNetwork;