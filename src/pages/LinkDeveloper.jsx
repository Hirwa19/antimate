import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Package,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function LinkDeveloper() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState("");
  const [sdkType, setSdkType] = useState("Arduino");

  const project = useMemo(
    () => ({
      name: "ANTIMATE Link Project",
      id: "LNK-26-8F4D21",
      key: "lnk_live_8F4D21A9C72E5B6D91",
      status: "connected",
      sdkVersion: "1.0.0",
      protocol: "1.0",
      virtualSim: "VSIM-LNK-8F4D21",
      destination: "ANTIMATE Gateway",
      lastConnected: "Just now",
    }),
    []
  );

  const copyValue = async (value, type) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);

      setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const maskedKey = `${project.key.slice(0, 12)}••••••••••••`;

  return (
    <div className="link-developer-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .link-developer-page {
          min-height: 100vh;
          background: #f6f8fc;
          color: #111827;
          padding: 24px;
        }

        .developer-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        .developer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .header-left {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .page-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          flex-shrink: 0;
        }

        .developer-header h1 {
          margin: 0;
          font-size: 25px;
          font-weight: 700;
          letter-spacing: -0.4px;
        }

        .developer-header p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          height: 40px;
          padding: 0 14px;
          border: 1px solid #dbe1ea;
          background: white;
          color: #374151;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .btn:hover {
          background: #f9fafb;
        }

        .btn-primary {
          border-color: #2563eb;
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 13px 16px;
          margin-bottom: 18px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
        }

        .status-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 4px #dcfce7;
          flex-shrink: 0;
        }

        .status-text strong {
          display: block;
          font-size: 13px;
          color: #111827;
        }

        .status-text span {
          display: block;
          margin-top: 2px;
          font-size: 12px;
          color: #6b7280;
        }

        .status-meta {
          display: flex;
          align-items: center;
          gap: 18px;
          color: #6b7280;
          font-size: 12px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
          gap: 18px;
        }

        .section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .section-header {
          padding: 17px 18px;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-title svg {
          color: #2563eb;
        }

        .section-title h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
        }

        .section-title p {
          margin: 3px 0 0;
          color: #6b7280;
          font-size: 12px;
        }

        .section-body {
          padding: 18px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .info-item {
          border: 1px solid #edf0f4;
          border-radius: 9px;
          padding: 13px;
          background: #fafbfc;
        }

        .info-label {
          color: #6b7280;
          font-size: 11px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .info-value {
          color: #111827;
          font-size: 13px;
          font-weight: 600;
          word-break: break-word;
        }

        .value-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .icon-button {
          width: 30px;
          height: 30px;
          border: 1px solid #dfe4eb;
          background: white;
          color: #6b7280;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .icon-button:hover {
          color: #2563eb;
          border-color: #bfdbfe;
          background: #eff6ff;
        }

        .copy-message {
          margin-top: 12px;
          min-height: 18px;
          color: #15803d;
          font-size: 12px;
          font-weight: 600;
        }

        .sdk-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .sdk-option {
          padding: 13px;
          border: 1px solid #dfe4eb;
          background: white;
          border-radius: 9px;
          cursor: pointer;
          text-align: left;
        }

        .sdk-option.active {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .sdk-option strong {
          display: block;
          font-size: 13px;
        }

        .sdk-option span {
          display: block;
          margin-top: 3px;
          font-size: 11px;
          color: #6b7280;
        }

        .code-block {
          border-radius: 10px;
          overflow: hidden;
          background: #111827;
          color: #e5e7eb;
        }

        .code-header {
          padding: 10px 13px;
          border-bottom: 1px solid #293241;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #9ca3af;
        }

        .code-body {
          padding: 15px;
          overflow-x: auto;
        }

        .code-body pre {
          margin: 0;
          font-family: "Courier New", monospace;
          font-size: 12px;
          line-height: 1.7;
          white-space: pre;
        }

        .download-row {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .feature {
          display: flex;
          gap: 11px;
          align-items: flex-start;
        }

        .feature-icon {
          width: 31px;
          height: 31px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature strong {
          display: block;
          font-size: 13px;
        }

        .feature span {
          display: block;
          margin-top: 3px;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.45;
        }

        .connection-box {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 18px;
        }

        .connection-top {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #166534;
          font-size: 13px;
          font-weight: 700;
        }

        .connection-details {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .connection-details div {
          padding-top: 8px;
          border-top: 1px solid #dcfce7;
        }

        .connection-details small {
          display: block;
          color: #65a30d;
          font-size: 10px;
        }

        .connection-details strong {
          display: block;
          margin-top: 3px;
          color: #166534;
          font-size: 12px;
        }

        .security-note {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-radius: 9px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
        }

        .security-note svg {
          color: #2563eb;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .security-note strong {
          display: block;
          font-size: 12px;
        }

        .security-note span {
          display: block;
          margin-top: 3px;
          color: #6b7280;
          font-size: 11px;
          line-height: 1.5;
        }

        .quick-links {
          display: flex;
          flex-direction: column;
        }

        .quick-link {
          padding: 13px 0;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #374151;
          cursor: pointer;
        }

        .quick-link:last-child {
          border-bottom: none;
        }

        .quick-link-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .quick-link-left svg {
          color: #2563eb;
        }

        .quick-link span {
          font-size: 13px;
          font-weight: 600;
        }

        .quick-link:hover span {
          color: #2563eb;
        }

        @media (max-width: 900px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .link-developer-page {
            padding: 15px;
          }

          .developer-header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .btn {
            flex: 1;
            justify-content: center;
          }

          .status-bar {
            align-items: flex-start;
            flex-direction: column;
          }

          .status-meta {
            width: 100%;
            justify-content: space-between;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .section-body {
            padding: 14px;
          }

          .sdk-options {
            grid-template-columns: 1fr;
          }

          .developer-header h1 {
            font-size: 21px;
          }
        }
      `}</style>

      <div className="developer-container">
        <div className="developer-header">
          <div className="header-left">
            <div className="page-icon">
              <Code2 size={23} />
            </div>

            <div>
              <h1>Link Developer</h1>
              <p>
                Manage your ANTIMATE LINK project, SDK and network credentials.
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn">
              <RefreshCw size={15} />
              Refresh
            </button>

            <button className="btn btn-primary">
              <Download size={15} />
              Download SDK
            </button>
          </div>
        </div>

        <div className="status-bar">
          <div className="status-left">
            <div className="status-dot" />

            <div className="status-text">
              <strong>LINK project connected</strong>
              <span>
                {project.name} · Last connection {project.lastConnected}
              </span>
            </div>
          </div>

          <div className="status-meta">
            <span>SDK {project.sdkVersion}</span>
            <span>Protocol {project.protocol}</span>
          </div>
        </div>

        <div className="content-grid">
          <div>
            <section className="section">
              <div className="section-header">
                <div className="section-title">
                  <Server size={18} />
                  <div>
                    <h2>Project credentials</h2>
                    <p>Credentials used by your LINK application.</p>
                  </div>
                </div>

                <ShieldCheck size={18} color="#16a34a" />
              </div>

              <div className="section-body">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Project name</div>
                    <div className="info-value">{project.name}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Project ID</div>

                    <div className="value-row">
                      <div className="info-value">{project.id}</div>

                      <button
                        className="icon-button"
                        onClick={() => copyValue(project.id, "project")}
                        title="Copy Project ID"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">API key</div>

                    <div className="value-row">
                      <div className="info-value">
                        {showKey ? project.key : maskedKey}
                      </div>

                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          className="icon-button"
                          onClick={() => setShowKey((value) => !value)}
                          title={showKey ? "Hide key" : "Show key"}
                        >
                          {showKey ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>

                        <button
                          className="icon-button"
                          onClick={() => copyValue(project.key, "key")}
                          title="Copy API key"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Virtual SIM</div>

                    <div className="value-row">
                      <div className="info-value">
                        {project.virtualSim}
                      </div>

                      <button
                        className="icon-button"
                        onClick={() =>
                          copyValue(project.virtualSim, "sim")
                        }
                        title="Copy Virtual SIM"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Destination</div>
                    <div className="info-value">{project.destination}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Protocol</div>
                    <div className="info-value">
                      ANTIMATE LINK {project.protocol}
                    </div>
                  </div>
                </div>

                <div className="copy-message">
                  {copied === "project" && "Project ID copied."}
                  {copied === "key" && "API key copied."}
                  {copied === "sim" && "Virtual SIM copied."}
                </div>
              </div>
            </section>

            <section className="section" style={{ marginTop: 18 }}>
              <div className="section-header">
                <div className="section-title">
                  <Package size={18} />
                  <div>
                    <h2>ANTIMATE LINK SDK</h2>
                    <p>Install the SDK and connect your gateway.</p>
                  </div>
                </div>
              </div>

              <div className="section-body">
                <div className="sdk-options">
                  <button
                    className={`sdk-option ${
                      sdkType === "Arduino" ? "active" : ""
                    }`}
                    onClick={() => setSdkType("Arduino")}
                  >
                    <strong>Arduino / ESP32</strong>
                    <span>Recommended for gateway hardware</span>
                  </button>

                  <button
                    className={`sdk-option ${
                      sdkType === "PlatformIO" ? "active" : ""
                    }`}
                    onClick={() => setSdkType("PlatformIO")}
                  >
                    <strong>PlatformIO</strong>
                    <span>For structured embedded projects</span>
                  </button>
                </div>

                <div className="code-block">
                  <div className="code-header">
                    <span>
                      {sdkType === "Arduino"
                        ? "main.ino"
                        : "src/main.cpp"}
                    </span>

                    <button
                      className="icon-button"
                      onClick={() =>
                        copyValue(
                          `#include <AntimateLink.h>

AntimateLink link;

void setup() {
  Serial.begin(115200);

  link.begin(
    "${project.id}",
    "${project.key}"
  );

  link.connect();
}

void loop() {
  link.loop();
}`,
                          "code"
                        )
                      }
                      title="Copy code"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="code-body">
                    <pre>{`#include <AntimateLink.h>

AntimateLink link;

void setup() {
  Serial.begin(115200);

  link.begin(
    "${project.id}",
    "${project.key}"
  );

  link.connect();
}

void loop() {
  link.loop();
}`}</pre>
                  </div>
                </div>

                <div className="download-row">
                  <button className="btn btn-primary">
                    <Download size={15} />
                    Download AntimateLink SDK
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div>
            <section className="section">
              <div className="section-header">
                <div className="section-title">
                  <Activity size={18} />
                  <div>
                    <h2>Connection</h2>
                    <p>Current LINK service status.</p>
                  </div>
                </div>
              </div>

              <div className="section-body">
                <div className="connection-box">
                  <div className="connection-top">
                    <Wifi size={16} />
                    Connected
                  </div>

                  <div className="connection-details">
                    <div>
                      <small>Gateway</small>
                      <strong>ANTIMATE Gateway</strong>
                    </div>

                    <div>
                      <small>Protocol</small>
                      <strong>v{project.protocol}</strong>
                    </div>

                    <div>
                      <small>SDK</small>
                      <strong>v{project.sdkVersion}</strong>
                    </div>

                    <div>
                      <small>Destination</small>
                      <strong>{project.destination}</strong>
                    </div>
                  </div>
                </div>

                <div className="feature-list">
                  <div className="feature">
                    <div className="feature-icon">
                      <Radio size={16} />
                    </div>

                    <div>
                      <strong>Gateway communication</strong>
                      <span>
                        Connect your gateway to the ANTIMATE LINK network.
                      </span>
                    </div>
                  </div>

                  <div className="feature">
                    <div className="feature-icon">
                      <Link2 size={16} />
                    </div>

                    <div>
                      <strong>Project routing</strong>
                      <span>
                        Data is routed according to the destination configured
                        for this project.
                      </span>
                    </div>
                  </div>

                  <div className="feature">
                    <div className="feature-icon">
                      <KeyRound size={16} />
                    </div>

                    <div>
                      <strong>Project authentication</strong>
                      <span>
                        Your Project ID and API key identify this application.
                      </span>
                    </div>
                  </div>

                  <div className="feature">
                    <div className="feature-icon">
                      <ShieldCheck size={16} />
                    </div>

                    <div>
                      <strong>Protocol security</strong>
                      <span>
                        Communication is handled through the ANTIMATE LINK
                        protocol layer.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="section" style={{ marginTop: 18 }}>
              <div className="section-header">
                <div className="section-title">
                  <Terminal size={18} />
                  <div>
                    <h2>Developer tools</h2>
                    <p>Useful resources for your project.</p>
                  </div>
                </div>
              </div>

              <div className="section-body">
                <div className="quick-links">
                  <div className="quick-link">
                    <div className="quick-link-left">
                      <Code2 size={16} />
                      <span>SDK documentation</span>
                    </div>

                    <ChevronRight size={16} />
                  </div>

                  <div className="quick-link">
                    <div className="quick-link-left">
                      <Terminal size={16} />
                      <span>API reference</span>
                    </div>

                    <ChevronRight size={16} />
                  </div>

                  <div className="quick-link">
                    <div className="quick-link-left">
                      <Activity size={16} />
                      <span>Network monitor</span>
                    </div>

                    <ChevronRight size={16} />
                  </div>

                  <div className="quick-link">
                    <div className="quick-link-left">
                      <Package size={16} />
                      <span>SDK releases</span>
                    </div>

                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </section>

            <div className="security-note" style={{ marginTop: 18 }}>
              <ShieldCheck size={17} />

              <div>
                <strong>Keep your API key private</strong>
                <span>
                  Never commit your Project API key to a public GitHub
                  repository or expose it in client-side applications.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}