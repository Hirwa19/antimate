import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Loader2,
  Package,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

/* ============================================================
   API
============================================================ */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Request failed."
    );
  }

  return data;
}

/* ============================================================
   HELPERS
============================================================ */

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

function formatRelativeDate(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Never";
  }

  const diff =
    Date.now() - date.getTime();

  if (diff < 60 * 1000) {
    return "Just now";
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(
      diff / (60 * 1000)
    )} min ago`;
  }

  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(
      diff / (60 * 60 * 1000)
    )} hr ago`;
  }

  return date.toLocaleDateString();
}

function getStatusLabel(status) {
  switch (status) {
    case "active":
      return "Active";

    case "suspended":
      return "Suspended";

    case "disabled":
      return "Disabled";

    default:
      return "Unknown";
  }
}

function getConnectionLabel(status) {
  switch (status) {
    case "connected":
      return "Connected";

    case "failed":
      return "Connection failed";

    case "disconnected":
      return "Disconnected";

    default:
      return "No connection data";
  }
}

/* ============================================================
   COMPONENT
============================================================ */

export default function LinkDeveloper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();

  const stateProject =
    location.state?.project || null;

  const stateProjectKey =
    location.state?.apiKey ||
    location.state?.projectKey ||
    "";

  const [project, setProject] =
    useState(stateProject);

  const [projectKey, setProjectKey] =
    useState(stateProjectKey);

  const [loading, setLoading] =
    useState(!stateProject);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showKey, setShowKey] =
    useState(false);

  const [copied, setCopied] =
    useState("");

  const [sdkType, setSdkType] =
    useState("Arduino");

  /* ==========================================================
     LOAD PROJECT
  ========================================================== */

  const loadProject = useCallback(
    async (showLoader = true) => {
      if (!projectId) {
        setError(
          "No project was selected."
        );
        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const data =
          await apiRequest(
            `/api/link/projects/${projectId}`
          );

        if (!data.project) {
          throw new Error(
            "Project was not returned by the server."
          );
        }

        setProject(data.project);
      } catch (err) {
        setError(
          err.message ||
            "Failed to load project."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (!stateProject) {
      loadProject(true);
    }
  }, [
    stateProject,
    loadProject,
  ]);

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadProject(false);
  }

  /* ==========================================================
     COPY
  ========================================================== */

  async function copyValue(value, type) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(type);

      window.setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch {
      setError(
        "Could not copy to clipboard."
      );
    }
  }

  /* ==========================================================
     PROJECT KEY
  ========================================================== */

  const maskedKey = useMemo(() => {
    if (!projectKey) {
      return "••••••••••••••••";
    }

    if (projectKey.length <= 12) {
      return "••••••••••••";
    }

    return `${projectKey.slice(
      0,
      12
    )}••••••••••••`;
  }, [projectKey]);

  /* ==========================================================
     SDK CODE
  ========================================================== */

  const sdkCode = useMemo(() => {
    if (!project) {
      return "";
    }

    const id =
      project.projectId || "";

    const key =
      projectKey ||
      "YOUR_PROJECT_KEY";

    if (sdkType === "PlatformIO") {
      return `#include <AntimateEdge.h>

AntimateEdge edge;

void setup() {
  Serial.begin(115200);

  edge.begin(
    "${id}",
    "${key}",
    "DEV-26-XXXXXX"
  );

  edge.connect();
}

void loop() {
  edge.loop();
}`;
    }

    return `#include <AntimateEdge.h>

AntimateEdge edge;

void setup() {
  Serial.begin(115200);

  edge.begin(
    "${id}",
    "${key}",
    "DEV-26-XXXXXX"
  );

  edge.connect();
}

void loop() {
  edge.loop();
}`;
  }, [
    project,
    projectKey,
    sdkType,
  ]);

  /* ==========================================================
     DOWNLOAD SDK
  ========================================================== */

  function handleDownloadSDK() {
    /*
      The actual personalized SDK download endpoint
      can be connected here when the backend download
      route is implemented.

      We keep the button functional without inventing
      a backend endpoint.
    */

    setError(
      "SDK download endpoint is not available yet."
    );
  }

  /* ==========================================================
     GO BACK
  ========================================================== */

  function goToProjects() {
    navigate("/link/projects");
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="link-developer-page">
        <style>{styles}</style>

        <div className="developer-loading">
          <Loader2
            size={25}
            className="loading-icon"
          />

          <strong>
            Loading project...
          </strong>

          <span>
            Getting your ANTIMATE LINK
            project information.
          </span>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR WITHOUT PROJECT
  ========================================================== */

  if (!project) {
    return (
      <div className="link-developer-page">
        <style>{styles}</style>

        <div className="developer-container">
          <div className="error-panel">
            <div className="error-icon">
              <WifiOff size={22} />
            </div>

            <h2>
              Project unavailable
            </h2>

            <p>
              {error ||
                "The requested project could not be loaded."}
            </p>

            <button
              className="btn btn-primary"
              onClick={goToProjects}
            >
              <ChevronRight
                size={15}
              />
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isConnected =
    project.lastConnectionStatus ===
    "connected";

  const isActive =
    project.status === "active";

  return (
    <div className="link-developer-page">
      <style>{styles}</style>

      <div className="developer-container">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="developer-header">
          <div className="header-left">
            <div className="page-icon">
              <Code2 size={23} />
            </div>

            <div>
              <div className="breadcrumb">
                <button
                  onClick={goToProjects}
                >
                  Projects
                </button>

                <ChevronRight
                  size={13}
                />

                <span>
                  Developer
                </span>
              </div>

              <h1>
                {project.projectName ||
                  "Link Developer"}
              </h1>

              <p>
                Configure your project,
                Edge SDK and ANTIMATE LINK
                connection.
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              className="btn btn-primary"
              onClick={handleDownloadSDK}
            >
              <Download size={15} />
              Download Edge SDK
            </button>
          </div>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="error-banner">
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* ====================================================
            STATUS
        ==================================================== */}

        <div className="status-bar">
          <div className="status-left">
            <div
              className={`status-dot ${
                isConnected
                  ? "connected"
                  : "offline"
              }`}
            />

            <div className="status-text">
              <strong>
                {isConnected
                  ? "LINK project connected"
                  : getConnectionLabel(
                      project.lastConnectionStatus
                    )}
              </strong>

              <span>
                {project.projectName ||
                  project.projectId}

                {" · "}

                Last connection{" "}
                {formatRelativeDate(
                  project.lastConnectedAt
                )}
              </span>
            </div>
          </div>

          <div className="status-meta">
            <span
              className={`status-badge ${
                project.status
              }`}
            >
              {getStatusLabel(
                project.status
              )}
            </span>

            <span>
              SDK{" "}
              {project.sdkVersion ||
                "1.0.0"}
            </span>

            <span>
              Protocol{" "}
              {project.protocolVersion ||
                "1.0"}
            </span>
          </div>
        </div>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="content-grid">
          <div>
            {/* ==================================================
                PROJECT CREDENTIALS
            ================================================== */}

            <section className="section">
              <div className="section-header">
                <div className="section-title">
                  <Server size={18} />

                  <div>
                    <h2>
                      Project credentials
                    </h2>

                    <p>
                      Credentials used by
                      your ANTIMATE LINK
                      project.
                    </p>
                  </div>
                </div>

                <ShieldCheck
                  size={18}
                  color="#16a34a"
                />
              </div>

              <div className="section-body">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      Project name
                    </div>

                    <div className="info-value">
                      {project.projectName ||
                        "Unnamed project"}
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      Project ID
                    </div>

                    <div className="value-row">
                      <div className="info-value">
                        {project.projectId}
                      </div>

                      <button
                        className="icon-button"
                        onClick={() =>
                          copyValue(
                            project.projectId,
                            "project"
                          )
                        }
                        title="Copy Project ID"
                      >
                        {copied ===
                        "project" ? (
                          <CheckCircle2
                            size={14}
                          />
                        ) : (
                          <Copy
                            size={14}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      Project Key
                    </div>

                    <div className="value-row">
                      <div className="info-value key-value">
                        {projectKey
                          ? showKey
                            ? projectKey
                            : maskedKey
                          : "Not available"}
                      </div>

                      {projectKey && (
                        <div className="key-actions">
                          <button
                            className="icon-button"
                            onClick={() =>
                              setShowKey(
                                (value) =>
                                  !value
                              )
                            }
                            title={
                              showKey
                                ? "Hide Project Key"
                                : "Show Project Key"
                            }
                          >
                            {showKey ? (
                              <EyeOff
                                size={14}
                              />
                            ) : (
                              <Eye
                                size={14}
                              />
                            )}
                          </button>

                          <button
                            className="icon-button"
                            onClick={() =>
                              copyValue(
                                projectKey,
                                "key"
                              )
                            }
                            title="Copy Project Key"
                          >
                            {copied ===
                            "key" ? (
                              <CheckCircle2
                                size={14}
                              />
                            ) : (
                              <Copy
                                size={14}
                              />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      Virtual SIM
                    </div>

                    <div className="value-row">
                      <div className="info-value">
                        {project.virtualSimId ||
                          "Not assigned"}
                      </div>

                      {project.virtualSimId && (
                        <button
                          className="icon-button"
                          onClick={() =>
                            copyValue(
                              project.virtualSimId,
                              "sim"
                            )
                          }
                          title="Copy Virtual SIM ID"
                        >
                          {copied ===
                          "sim" ? (
                            <CheckCircle2
                              size={14}
                            />
                          ) : (
                            <Copy
                              size={14}
                            />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="info-item info-item-wide">
                    <div className="info-label">
                      Destination URL
                    </div>

                    <div className="info-value destination-value">
                      {project.destinationUrl ||
                        "Not configured"}
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      Platform
                    </div>

                    <div className="info-value">
                      {project.platform ||
                        "esp32"}
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      Protocol
                    </div>

                    <div className="info-value">
                      ANTIMATE LINK{" "}
                      {project.protocolVersion ||
                        "1.0"}
                    </div>
                  </div>
                </div>

                <div className="copy-message">
                  {copied === "project" &&
                    "Project ID copied."}

                  {copied === "key" &&
                    "Project Key copied."}

                  {copied === "sim" &&
                    "Virtual SIM ID copied."}
                </div>
              </div>
            </section>

            {/* ==================================================
                EDGE SDK
            ================================================== */}

            <section
              className="section"
              style={{
                marginTop: 18,
              }}
            >
              <div className="section-header">
                <div className="section-title">
                  <Package size={18} />

                  <div>
                    <h2>
                      ANTIMATE Edge SDK
                    </h2>

                    <p>
                      Use the public Edge SDK
                      to connect your device
                      to ANTIMATE LINK.
                    </p>
                  </div>
                </div>

                <span className="sdk-version">
                  v
                  {project.sdkVersion ||
                    "1.0.0"}
                </span>
              </div>

              <div className="section-body">
                <div className="sdk-notice">
                  <ShieldCheck
                    size={17}
                  />

                  <div>
                    <strong>
                      Public Edge SDK
                    </strong>

                    <span>
                      External developers use{" "}
                      <code>
                        #include
                        {" <AntimateEdge.h>"}
                      </code>{" "}
                      in their devices.
                      ANTIMATE LINK internal
                      Gateway SDK is not exposed
                      here.
                    </span>
                  </div>
                </div>

                <div className="sdk-options">
                  <button
                    type="button"
                    className={`sdk-option ${
                      sdkType ===
                      "Arduino"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSdkType(
                        "Arduino"
                      )
                    }
                  >
                    <div className="sdk-option-icon">
                      <Code2 size={17} />
                    </div>

                    <div>
                      <strong>
                        Arduino / ESP32
                      </strong>

                      <span>
                        Recommended for
                        embedded devices
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`sdk-option ${
                      sdkType ===
                      "PlatformIO"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSdkType(
                        "PlatformIO"
                      )
                    }
                  >
                    <div className="sdk-option-icon">
                      <Terminal
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        PlatformIO
                      </strong>

                      <span>
                        Structured embedded
                        development
                      </span>
                    </div>
                  </button>
                </div>

                <div className="code-block">
                  <div className="code-header">
                    <div>
                      <span className="code-dot" />
                      <span>
                        {sdkType ===
                        "Arduino"
                          ? "main.ino"
                          : "src/main.cpp"}
                      </span>
                    </div>

                    <button
                      className="code-copy"
                      onClick={() =>
                        copyValue(
                          sdkCode,
                          "code"
                        )
                      }
                      title="Copy code"
                    >
                      {copied ===
                      "code" ? (
                        <CheckCircle2
                          size={14}
                        />
                      ) : (
                        <Copy
                          size={14}
                        />
                      )}

                      <span>
                        {copied ===
                        "code"
                          ? "Copied"
                          : "Copy"}
                      </span>
                    </button>
                  </div>

                  <div className="code-body">
                    <pre>
                      {sdkCode}
                    </pre>
                  </div>
                </div>

                <div className="code-note">
                  <strong>
                    Device ID
                  </strong>

                  <span>
                    Replace{" "}
                    <code>
                      DEV-26-XXXXXX
                    </code>{" "}
                    with the unique Device ID
                    assigned to your device.
                  </span>
                </div>

                <div className="download-row">
                  <button
                    className="btn btn-primary"
                    onClick={
                      handleDownloadSDK
                    }
                  >
                    <Download
                      size={15}
                    />
                    Download AntimateEdge SDK
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ====================================================
              RIGHT COLUMN
          ==================================================== */}

          <div>
            {/* ==================================================
                CONNECTION
            ================================================== */}

            <section className="section">
              <div className="section-header">
                <div className="section-title">
                  <Activity size={18} />

                  <div>
                    <h2>
                      Connection
                    </h2>

                    <p>
                      Current project
                      connection status.
                    </p>
                  </div>
                </div>
              </div>

              <div className="section-body">
                <div
                  className={`connection-box ${
                    isConnected
                      ? "connection-online"
                      : "connection-offline"
                  }`}
                >
                  <div className="connection-top">
                    {isConnected ? (
                      <Wifi size={16} />
                    ) : (
                      <WifiOff
                        size={16}
                      />
                    )}

                    {isConnected
                      ? "Connected"
                      : getConnectionLabel(
                          project.lastConnectionStatus
                        )}
                  </div>

                  <div className="connection-details">
                    <div>
                      <small>
                        Project status
                      </small>

                      <strong>
                        {getStatusLabel(
                          project.status
                        )}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Protocol
                      </small>

                      <strong>
                        v
                        {project.protocolVersion ||
                          "1.0"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        SDK
                      </small>

                      <strong>
                        v
                        {project.sdkVersion ||
                          "1.0.0"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Last connected
                      </small>

                      <strong>
                        {formatRelativeDate(
                          project.lastConnectedAt
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="connection-info">
                  <div>
                    <span>
                      Last connection status
                    </span>

                    <strong>
                      {getConnectionLabel(
                        project.lastConnectionStatus
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Last connected
                    </span>

                    <strong>
                      {formatDate(
                        project.lastConnectedAt
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================
                HOW IT WORKS
            ================================================== */}

            <section
              className="section"
              style={{
                marginTop: 18,
              }}
            >
              <div className="section-header">
                <div className="section-title">
                  <Radio size={18} />

                  <div>
                    <h2>
                      How it works
                    </h2>

                    <p>
                      Project connection flow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="section-body">
                <div className="feature-list">
                  <div className="feature">
                    <div className="feature-icon">
                      <KeyRound
                        size={16}
                      />
                    </div>

                    <div>
                      <strong>
                        Project authentication
                      </strong>

                      <span>
                        Your Project ID and
                        Project Key identify
                        this project.
                      </span>
                    </div>
                  </div>

                  <div className="feature">
                    <div className="feature-icon">
                      <Radio size={16} />
                    </div>

                    <div>
                      <strong>
                        Edge device
                      </strong>

                      <span>
                        Your device uses the
                        public AntimateEdge SDK
                        to communicate with LINK.
                      </span>
                    </div>
                  </div>

                  <div className="feature">
                    <div className="feature-icon">
                      <Link2 size={16} />
                    </div>

                    <div>
                      <strong>
                        Network routing
                      </strong>

                      <span>
                        ANTIMATE LINK routes
                        project data through
                        the authorized network.
                      </span>
                    </div>
                  </div>

                  <div className="feature">
                    <div className="feature-icon">
                      <Server size={16} />
                    </div>

                    <div>
                      <strong>
                        Your destination
                      </strong>

                      <span>
                        Data is delivered toward
                        the destination URL
                        configured for this
                        project.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================
                DEVELOPER TOOLS
            ================================================== */}

            <section
              className="section"
              style={{
                marginTop: 18,
              }}
            >
              <div className="section-header">
                <div className="section-title">
                  <Terminal size={18} />

                  <div>
                    <h2>
                      Developer tools
                    </h2>

                    <p>
                      Resources for your
                      project.
                    </p>
                  </div>
                </div>
              </div>

              <div className="section-body">
                <div className="quick-links">
                  <button
                    className="quick-link"
                    type="button"
                  >
                    <div className="quick-link-left">
                      <Code2
                        size={16}
                      />

                      <span>
                        Edge SDK documentation
                      </span>
                    </div>

                    <ChevronRight
                      size={16}
                    />
                  </button>

                  <button
                    className="quick-link"
                    type="button"
                  >
                    <Terminal
                      size={16}
                    />

                    <span>
                      API reference
                    </span>

                    <ChevronRight
                      size={16}
                    />
                  </button>

                  <button
                    className="quick-link"
                    type="button"
                    onClick={() =>
                      navigate(
                        "/link/network"
                      )
                    }
                  >
                    <div className="quick-link-left">
                      <Activity
                        size={16}
                      />

                      <span>
                        Network monitor
                      </span>
                    </div>

                    <ChevronRight
                      size={16}
                    />
                  </button>

                  <button
                    className="quick-link"
                    type="button"
                  >
                    <div className="quick-link-left">
                      <Package
                        size={16}
                      />

                      <span>
                        SDK releases
                      </span>
                    </div>

                    <ChevronRight
                      size={16}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* ==================================================
                SECURITY
            ================================================== */}

            <div className="security-note">
              <ShieldCheck size={17} />

              <div>
                <strong>
                  Protect your Project Key
                </strong>

                <span>
                  Never commit your Project Key
                  to a public GitHub repository.
                  Keep it inside your device
                  firmware or secure project
                  configuration.
                </span>
              </div>
            </div>

            {/* ==================================================
                PROJECT INFORMATION
            ================================================== */}

            <div className="project-meta">
              <div>
                <span>
                  Created
                </span>

                <strong>
                  {formatDate(
                    project.createdAt
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Updated
                </span>

                <strong>
                  {formatDate(
                    project.updatedAt
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <strong
                  className={
                    isActive
                      ? "text-active"
                      : "text-muted"
                  }
                >
                  {getStatusLabel(
                    project.status
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = `
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
    margin-bottom: 22px;
  }

  .header-left {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    min-width: 0;
  }

  .page-icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      #2563eb,
      #7c3aed
    );
    color: white;
    flex-shrink: 0;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
    color: #9ca3af;
    font-size: 11px;
  }

  .breadcrumb button {
    padding: 0;
    border: none;
    background: none;
    color: #2563eb;
    cursor: pointer;
    font-size: 11px;
  }

  .developer-header h1 {
    margin: 0;
    font-size: 25px;
    font-weight: 700;
    letter-spacing: -0.4px;
    word-break: break-word;
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
    flex-shrink: 0;
  }

  .btn {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid #dbe1ea;
    background: white;
    color: #374151;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: 0.15s ease;
  }

  .btn:hover {
    background: #f9fafb;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    border-color: #2563eb;
    background: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background: #1d4ed8;
  }

  .spin {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    padding: 11px 14px;
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #b91c1c;
    border-radius: 9px;
    font-size: 12px;
  }

  .error-banner button {
    border: none;
    background: transparent;
    color: #991b1b;
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
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
    background: #f59e0b;
    flex-shrink: 0;
  }

  .status-dot.connected {
    background: #16a34a;
    box-shadow: 0 0 0 4px #dcfce7;
  }

  .status-dot.offline {
    background: #9ca3af;
    box-shadow: 0 0 0 4px #f3f4f6;
  }

  .status-text {
    min-width: 0;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #6b7280;
    font-size: 12px;
    flex-shrink: 0;
  }

  .status-badge {
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
  }

  .status-badge.active {
    background: #dcfce7;
    color: #166534;
  }

  .status-badge.suspended {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.disabled {
    background: #fee2e2;
    color: #991b1b;
  }

  .content-grid {
    display: grid;
    grid-template-columns:
      minmax(0, 1.4fr)
      minmax(320px, 0.8fr);
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
    min-width: 0;
  }

  .section-title > svg {
    color: #2563eb;
    flex-shrink: 0;
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
    line-height: 1.4;
  }

  .section-body {
    padding: 18px;
  }

  .info-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .info-item {
    min-width: 0;
    border: 1px solid #edf0f4;
    border-radius: 9px;
    padding: 13px;
    background: #fafbfc;
  }

  .info-item-wide {
    grid-column: span 2;
  }

  .info-label {
    color: #6b7280;
    font-size: 10px;
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

  .key-value {
    font-family: "Courier New", monospace;
    font-size: 12px;
  }

  .destination-value {
    color: #2563eb;
    font-weight: 500;
  }

  .value-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .key-actions {
    display: flex;
    gap: 5px;
    flex-shrink: 0;
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

  .sdk-version {
    padding: 4px 8px;
    background: #eff6ff;
    color: #2563eb;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }

  .sdk-notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    margin-bottom: 16px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    border-radius: 9px;
  }

  .sdk-notice > svg {
    color: #2563eb;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .sdk-notice strong {
    display: block;
    font-size: 12px;
    color: #1e40af;
  }

  .sdk-notice span {
    display: block;
    margin-top: 3px;
    color: #475569;
    font-size: 11px;
    line-height: 1.5;
  }

  .sdk-notice code,
  .code-note code {
    font-family: "Courier New", monospace;
    font-size: 10px;
    color: #1d4ed8;
  }

  .sdk-options {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 18px;
  }

  .sdk-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid #dfe4eb;
    background: white;
    border-radius: 9px;
    cursor: pointer;
    text-align: left;
  }

  .sdk-option:hover {
    border-color: #bfdbfe;
  }

  .sdk-option.active {
    border-color: #2563eb;
    background: #eff6ff;
  }

  .sdk-option-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: #2563eb;
    flex-shrink: 0;
  }

  .sdk-option.active
    .sdk-option-icon {
    background: white;
  }

  .sdk-option strong {
    display: block;
    font-size: 12px;
    color: #111827;
  }

  .sdk-option span {
    display: block;
    margin-top: 3px;
    font-size: 10px;
    color: #6b7280;
    line-height: 1.35;
  }

  .code-block {
    border-radius: 10px;
    overflow: hidden;
    background: #111827;
    color: #e5e7eb;
  }

  .code-header {
    min-height: 40px;
    padding: 8px 12px;
    border-bottom: 1px solid #293241;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    color: #9ca3af;
  }

  .code-header > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .code-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #16a34a;
  }

  .code-copy {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    font-size: 10px;
  }

  .code-copy:hover {
    color: white;
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

  .code-note {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    padding: 9px 11px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
  }

  .code-note strong {
    font-size: 11px;
    color: #374151;
  }

  .code-note span {
    font-size: 11px;
    color: #6b7280;
    line-height: 1.4;
  }

  .download-row {
    margin-top: 14px;
    display: flex;
    justify-content: flex-end;
  }

  .connection-box {
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 15px;
  }

  .connection-online {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    color: #166534;
  }

  .connection-offline {
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    color: #475569;
  }

  .connection-top {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13px;
    font-weight: 700;
  }

  .connection-details {
    margin-top: 10px;
    display: grid;
    grid-template-columns:
      1fr 1fr;
    gap: 10px;
  }

  .connection-details div {
    padding-top: 8px;
    border-top: 1px solid #dcfce7;
  }

  .connection-offline
    .connection-details div {
    border-color: #e5e7eb;
  }

  .connection-details small {
    display: block;
    color: #65a30d;
    font-size: 10px;
  }

  .connection-offline
    .connection-details small {
    color: #64748b;
  }

  .connection-details strong {
    display: block;
    margin-top: 3px;
    color: #166534;
    font-size: 12px;
  }

  .connection-offline
    .connection-details strong {
    color: #475569;
  }

  .connection-info {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .connection-info div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-bottom: 9px;
    border-bottom: 1px solid #edf0f4;
  }

  .connection-info span {
    color: #6b7280;
    font-size: 11px;
  }

  .connection-info strong {
    color: #374151;
    font-size: 11px;
    text-align: right;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
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
    font-size: 12px;
  }

  .feature span {
    display: block;
    margin-top: 3px;
    color: #6b7280;
    font-size: 11px;
    line-height: 1.45;
  }

  .quick-links {
    display: flex;
    flex-direction: column;
  }

  .quick-link {
    width: 100%;
    padding: 13px 0;
    border: none;
    border-bottom: 1px solid #edf0f4;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: #374151;
    cursor: pointer;
    text-align: left;
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
    font-size: 12px;
    font-weight: 600;
  }

  .quick-link:hover span {
    color: #2563eb;
  }

  .security-note {
    display: flex;
    gap: 10px;
    margin-top: 18px;
    padding: 12px;
    border-radius: 9px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
  }

  .security-note > svg {
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

  .project-meta {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: 12px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 9px;
    background: white;
  }

  .project-meta div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .project-meta span {
    color: #9ca3af;
    font-size: 10px;
  }

  .project-meta strong {
    color: #4b5563;
    font-size: 10px;
    text-align: right;
  }

  .text-active {
    color: #15803d !important;
  }

  .text-muted {
    color: #92400e !important;
  }

  .developer-loading {
    width: 100%;
    max-width: 400px;
    margin: 120px auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    color: #374151;
  }

  .developer-loading .loading-icon {
    color: #2563eb;
    animation: spin 0.8s linear infinite;
    margin-bottom: 5px;
  }

  .developer-loading span {
    color: #6b7280;
    font-size: 12px;
  }

  .error-panel {
    max-width: 500px;
    margin: 100px auto;
    padding: 30px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    text-align: center;
  }

  .error-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 14px;
    border-radius: 12px;
    background: #fef2f2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-panel h2 {
    margin: 0;
    font-size: 18px;
  }

  .error-panel p {
    margin: 7px 0 18px;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.5;
  }

  @media (max-width: 900px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .developer-header {
      flex-direction: column;
    }

    .header-actions {
      width: 100%;
    }

    .header-actions .btn {
      flex: 1;
    }

    .status-bar {
      align-items: flex-start;
      flex-direction: column;
    }

    .status-meta {
      width: 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 10px;
    }
  }

  @media (max-width: 640px) {
    .link-developer-page {
      padding: 15px;
    }

    .developer-header h1 {
      font-size: 21px;
    }

    .developer-header p {
      font-size: 12px;
    }

    .page-icon {
      width: 42px;
      height: 42px;
    }

    .header-actions {
      flex-direction: column;
    }

    .header-actions .btn {
      width: 100%;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .info-item-wide {
      grid-column: span 1;
    }

    .section-body {
      padding: 14px;
    }

    .section-header {
      padding: 14px;
    }

    .sdk-options {
      grid-template-columns: 1fr;
    }

    .connection-details {
      grid-template-columns: 1fr;
    }

    .status-text span {
      white-space: normal;
    }

    .download-row {
      justify-content: stretch;
    }

    .download-row .btn {
      width: 100%;
    }

    .value-row {
      align-items: flex-start;
    }

    .key-value {
      overflow-wrap: anywhere;
    }

    .destination-value {
      overflow-wrap: anywhere;
    }
  }
`;
