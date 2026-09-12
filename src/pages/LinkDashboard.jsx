import { useMemo } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  Cpu,
  FolderKanban,
  Gateway,
  Radio,
  Server,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

const LinkDashboard = () => {
  const stats = useMemo(
    () => [
      {
        label: "Projects",
        value: "3",
        detail: "2 active",
        icon: FolderKanban,
        type: "purple",
      },
      {
        label: "Gateways",
        value: "4",
        detail: "3 online",
        icon: Server,
        type: "blue",
      },
      {
        label: "Connected nodes",
        value: "28",
        detail: "26 online",
        icon: Cpu,
        type: "green",
      },
      {
        label: "Network status",
        value: "Online",
        detail: "All systems operational",
        icon: Wifi,
        type: "cyan",
      },
    ],
    []
  );

  const activity = useMemo(
    () => [
      {
        type: "success",
        title: "Gateway connected",
        description: "GTW-26-86FD75 is now online",
        time: "Just now",
      },
      {
        type: "info",
        title: "Data received",
        description: "New packet received from DEV-339CD8",
        time: "2 min ago",
      },
      {
        type: "success",
        title: "Project active",
        description: "ANTIMATE Farm Network is operational",
        time: "8 min ago",
      },
      {
        type: "warning",
        title: "Gateway heartbeat",
        description: "Heartbeat received successfully",
        time: "12 min ago",
      },
    ],
    []
  );

  const projects = useMemo(
    () => [
      {
        name: "Farm Network",
        id: "ANT-LK-8F29",
        status: "Active",
        gateways: 2,
        nodes: 14,
      },
      {
        name: "Smart Home",
        id: "ANT-LK-31AC",
        status: "Active",
        gateways: 1,
        nodes: 8,
      },
      {
        name: "Test Network",
        id: "ANT-LK-74BD",
        status: "Inactive",
        gateways: 1,
        nodes: 6,
      },
    ],
    []
  );

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
          background: #ecfdf3;
          color: #16a34a;
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
          color: #15803d;
          font-size: 13px;
          font-weight: 700;
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
        }

        .link-activity-time {
          color: #9a9fad;
          font-size: 10px;
          white-space: nowrap;
          padding-top: 2px;
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
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        }

        .link-terminal-title {
          font-size: 11px;
          font-weight: 700;
          color: #e8eaf2;
        }

        .link-terminal-status {
          color: #6ee7b7;
          font-size: 10px;
          font-family: monospace;
        }

        .link-terminal-body {
          padding: 15px 16px;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.8;
        }

        .link-terminal-line {
          display: flex;
          gap: 9px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .link-terminal-prefix {
          color: #81879b;
          flex-shrink: 0;
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

        .link-terminal-command {
          color: #a5b4fc;
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
        }
      `}</style>

      <main className="link-dashboard">
        <div className="link-dashboard-container">

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
                Monitor your connectivity, projects and network infrastructure.
              </p>
            </div>

            <div className="link-status">
              <div className="link-status-icon">
                <Wifi size={18} />
              </div>

              <div className="link-status-text">
                <span className="link-status-label">
                  Network status
                </span>

                <span className="link-status-value">
                  All systems operational
                </span>
              </div>
            </div>
          </header>

          <section className="link-stats">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div className="link-stat" key={stat.label}>
                  <div className="link-stat-top">
                    <div className={`link-stat-icon ${stat.type}`}>
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

          <section className="link-main-grid">

            <div>

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
                  >
                    View all
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="link-projects">
                  {projects.map((project) => (
                    <div
                      className="link-project"
                      key={project.id}
                    >
                      <div className="link-project-main">

                        <div className="link-project-name-row">
                          <h3 className="link-project-name">
                            {project.name}
                          </h3>

                          <span
                            className={`link-project-status ${
                              project.status === "Active"
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            <Circle
                              size={6}
                              fill="currentColor"
                            />
                            {project.status}
                          </span>
                        </div>

                        <p className="link-project-id">
                          {project.id}
                        </p>

                        <div className="link-project-meta">
                          <span className="link-project-meta-item">
                            <Server size={13} />
                            {project.gateways} gateway
                            {project.gateways !== 1 ? "s" : ""}
                          </span>

                          <span className="link-project-meta-item">
                            <Radio size={13} />
                            {project.nodes} nodes
                          </span>

                          <span className="link-project-meta-item">
                            <Zap size={13} />
                            Link SDK
                          </span>
                        </div>

                      </div>

                      <button
                        className="link-project-open"
                        type="button"
                        aria-label={`Open ${project.name}`}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="link-network-box">
                <div className="link-network-header">
                  <div className="link-network-header-left">
                    <span className="link-terminal-dot" />

                    <span className="link-terminal-title">
                      ANTIMATE LINK NETWORK
                    </span>
                  </div>

                  <span className="link-terminal-status">
                    LIVE
                  </span>
                </div>

                <div className="link-terminal-body">
                  <div className="link-terminal-line">
                    <span className="link-terminal-prefix">
                      17:48:21
                    </span>

                    <span className="link-terminal-success">
                      [SUCCESS]
                    </span>

                    <span>
                      Gateway GTW-26-86FD75 connected
                    </span>
                  </div>

                  <div className="link-terminal-line">
                    <span className="link-terminal-prefix">
                      17:48:25
                    </span>

                    <span className="link-terminal-info">
                      [INFO]
                    </span>

                    <span>
                      Data packet received
                    </span>
                  </div>

                  <div className="link-terminal-line">
                    <span className="link-terminal-prefix">
                      17:48:27
                    </span>

                    <span className="link-terminal-success">
                      [SUCCESS]
                    </span>

                    <span>
                      Packet forwarded successfully
                    </span>
                  </div>

                  <div className="link-terminal-line">
                    <span className="link-terminal-prefix">
                      17:48:31
                    </span>

                    <span className="link-terminal-command">
                      [LINK]
                    </span>

                    <span>
                      Network heartbeat received
                    </span>
                  </div>

                  <div className="link-terminal-line">
                    <span className="link-terminal-prefix">
                      17:48:35
                    </span>

                    <span className="link-terminal-warning">
                      [WAIT]
                    </span>

                    <span>
                      Listening for new events...
                    </span>
                  </div>
                </div>
              </div>

            </div>

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
                {activity.map((item, index) => (
                  <div
                    className="link-activity"
                    key={`${item.title}-${index}`}
                  >
                    <div
                      className={`link-activity-icon ${item.type}`}
                    >
                      {item.type === "success" && (
                        <CheckCircle2 size={14} />
                      )}

                      {item.type === "info" && (
                        <Radio size={14} />
                      )}

                      {item.type === "warning" && (
                        <Zap size={14} />
                      )}
                    </div>

                    <div className="link-activity-content">
                      <h3 className="link-activity-title">
                        {item.title}
                      </h3>

                      <p className="link-activity-description">
                        {item.description}
                      </p>
                    </div>

                    <span className="link-activity-time">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </section>

        </div>
      </main>
    </>
  );
};

export default LinkDashboard;