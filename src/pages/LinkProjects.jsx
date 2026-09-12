import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

/* ============================================================
   API
============================================================ */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://brooder-backend.onrender.com";

/* ============================================================
   AUTH
============================================================ */

function getToken() {
  return localStorage.getItem("token");
}

/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest(
  endpoint,
  options = {}
) {
  const token = getToken();

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

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

  const data =
    await response
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
   COMPONENT
============================================================ */

export default function LinkProjects() {
  const navigate = useNavigate();

  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [projectKey, setProjectKey] =
    useState("");

  const [copied, setCopied] =
    useState("");

  const [form, setForm] =
    useState({
      projectName: "",
      description: "",
      destinationUrl: "",
      platform: "esp32",
    });

  /* ==========================================================
     LOAD PROJECTS
  ========================================================== */

  const loadProjects =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await apiRequest(
            "/api/link/projects"
          );

        setProjects(
          Array.isArray(
            data.projects
          )
            ? data.projects
            : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load LINK projects."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /* ==========================================================
     CREATE PROJECT
  ========================================================== */

  async function handleCreate(
    event
  ) {
    event.preventDefault();

    const projectName =
      form.projectName.trim();

    const description =
      form.description.trim();

    const destinationUrl =
      form.destinationUrl.trim();

    if (!projectName) {
      setError(
        "Project name is required."
      );
      return;
    }

    if (!destinationUrl) {
      setError(
        "Destination URL is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data =
        await apiRequest(
          "/api/link/projects",
          {
            method: "POST",

            body: JSON.stringify({
              projectName,

              description,

              destinationUrl,

              platform:
                form.platform,
            }),
          }
        );

      const project =
        data.project;

      const credentials =
        data.credentials || {};

      const generatedKey =
        credentials.projectKey ||
        data.projectKey ||
        "";

      if (project) {
        setProjects(
          (current) => [
            project,
            ...current.filter(
              (item) =>
                item.projectId !==
                project.projectId
            ),
          ]
        );
      }

      setProjectKey(
        generatedKey
      );

      setSelectedProject(
        project || null
      );

      setForm({
        projectName: "",
        description: "",
        destinationUrl: "",
        platform: "esp32",
      });

      setShowCreate(false);
    } catch (err) {
      setError(
        err.message ||
          "Failed to create LINK project."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     COPY
  ========================================================== */

  async function copyText(
    value,
    type
  ) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(type);

      setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch {
      setError(
        "Could not copy to clipboard."
      );
    }
  }

  /* ==========================================================
     OPEN DEVELOPER
  ========================================================== */

  function openDeveloper(
    project,
    key = ""
  ) {
    if (!project?.projectId) {
      return;
    }

    navigate(
      `/link/developer/${project.projectId}`,
      {
        state: {
          project,
          projectKey: key,
        },
      }
    );
  }

  /* ==========================================================
     REGENERATE PROJECT KEY
  ========================================================== */

  async function regenerateKey(
    project
  ) {
    const confirmed =
      window.confirm(
        "Regenerate this Project Key? The current key will stop working immediately."
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data =
        await apiRequest(
          `/api/link/projects/${project.projectId}/regenerate-key`,
          {
            method: "POST",
          }
        );

      const credentials =
        data.credentials || {};

      const generatedKey =
        credentials.projectKey ||
        data.projectKey ||
        "";

      const updatedProject =
        data.project ||
        project;

      setProjectKey(
        generatedKey
      );

      setSelectedProject(
        updatedProject
      );

      setProjects(
        (current) =>
          current.map(
            (item) =>
              item.projectId ===
              project.projectId
                ? updatedProject
                : item
          )
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to regenerate Project Key."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     SUSPEND PROJECT
  ========================================================== */

  async function suspendProject(
    project
  ) {
    const confirmed =
      window.confirm(
        "Suspend this project? Its devices will no longer be allowed to use the project."
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data =
        await apiRequest(
          `/api/link/projects/${project.projectId}/suspend`,
          {
            method: "POST",
          }
        );

      const updatedProject =
        data.project;

      if (updatedProject) {
        setProjects(
          (current) =>
            current.map(
              (item) =>
                item.projectId ===
                project.projectId
                  ? updatedProject
                  : item
            )
        );

        setSelectedProject(
          updatedProject
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Failed to suspend project."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     ACTIVATE PROJECT
  ========================================================== */

  async function activateProject(
    project
  ) {
    try {
      setSaving(true);
      setError("");

      const data =
        await apiRequest(
          `/api/link/projects/${project.projectId}/activate`,
          {
            method: "POST",
          }
        );

      const updatedProject =
        data.project;

      if (updatedProject) {
        setProjects(
          (current) =>
            current.map(
              (item) =>
                item.projectId ===
                project.projectId
                  ? updatedProject
                  : item
            )
        );

        setSelectedProject(
          updatedProject
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Failed to activate project."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     DELETE PROJECT
  ========================================================== */

  async function deleteProject(
    project
  ) {
    const confirmed =
      window.confirm(
        `Delete "${project.projectName}" permanently? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiRequest(
        `/api/link/projects/${project.projectId}`,
        {
          method: "DELETE",
        }
      );

      setProjects(
        (current) =>
          current.filter(
            (item) =>
              item.projectId !==
              project.projectId
          )
      );

      setSelectedProject(
        null
      );

      setProjectKey("");
    } catch (err) {
      setError(
        err.message ||
          "Failed to delete project."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     CLOSE DETAILS
  ========================================================== */

  function closeDetails() {
    setSelectedProject(
      null
    );

    setProjectKey("");

    setCopied("");
  }

  /* ==========================================================
     STYLES
  ========================================================== */

  const styles = {
    page: {
      minHeight: "100%",
      padding: "28px",
      background:
        "var(--page-bg, #f7f9fc)",
      color:
        "var(--text-color, #111827)",
      boxSizing: "border-box",
    },

    container: {
      width: "100%",
      maxWidth: "1250px",
      margin: "0 auto",
    },

    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
      marginBottom: "26px",
      flexWrap: "wrap",
    },

    title: {
      margin: 0,
      fontSize: "28px",
      fontWeight: 850,
      letterSpacing: "-0.7px",
    },

    subtitle: {
      margin:
        "7px 0 0",
      opacity: 0.62,
      fontSize: "14px",
      lineHeight: 1.5,
    },

    createButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      border: 0,
      borderRadius: "12px",
      padding:
        "11px 16px",
      color: "#fff",
      background:
        "linear-gradient(135deg,#2563eb,#6366f1)",
      fontWeight: 800,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    error: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "15px",
      marginBottom: "18px",
      padding: "13px 15px",
      borderRadius: "12px",
      background:
        "rgba(239,68,68,.08)",
      border:
        "1px solid rgba(239,68,68,.2)",
      color: "#dc2626",
      fontSize: "13px",
    },

    toolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      marginBottom: "18px",
      flexWrap: "wrap",
    },

    refresh: {
      display: "inline-flex",
      alignItems: "center",
      gap: "7px",
      border:
        "1px solid rgba(100,116,139,.18)",
      background:
        "rgba(255,255,255,.65)",
      borderRadius: "10px",
      padding:
        "9px 12px",
      cursor: "pointer",
      fontWeight: 700,
      color: "inherit",
    },

    list: {
      display: "grid",
      gap: "12px",
    },

    row: {
      display: "grid",
      gridTemplateColumns:
        "minmax(220px,1.5fr) minmax(120px,.65fr) minmax(150px,.8fr) auto",
      alignItems: "center",
      gap: "20px",
      padding:
        "19px 20px",
      border:
        "1px solid rgba(100,116,139,.13)",
      background:
        "rgba(255,255,255,.72)",
      borderRadius: "16px",
      boxShadow:
        "0 5px 18px rgba(15,23,42,.035)",
    },

    projectInfo: {
      display: "flex",
      alignItems: "center",
      gap: "13px",
      minWidth: 0,
    },

    icon: {
      width: "43px",
      height: "43px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      color: "#2563eb",
      background:
        "rgba(37,99,235,.08)",
    },

    projectName: {
      margin: 0,
      fontSize: "15px",
      fontWeight: 850,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    projectId: {
      marginTop: "4px",
      fontSize: "11px",
      opacity: 0.52,
      fontFamily:
        "ui-monospace,SFMono-Regular,Menlo,monospace",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    metaLabel: {
      display: "block",
      fontSize: "10px",
      textTransform: "uppercase",
      letterSpacing: ".8px",
      opacity: 0.45,
      marginBottom: "4px",
      fontWeight: 800,
    },

    metaValue: {
      fontSize: "13px",
      fontWeight: 700,
    },

    status: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
      fontWeight: 800,
      textTransform: "capitalize",
    },

    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "7px",
      flexWrap: "wrap",
    },

    actionButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      border:
        "1px solid rgba(100,116,139,.17)",
      borderRadius: "9px",
      padding:
        "8px 10px",
      background:
        "transparent",
      cursor: "pointer",
      color: "inherit",
      fontWeight: 750,
      fontSize: "11px",
      whiteSpace: "nowrap",
    },

    primaryAction: {
      background:
        "rgba(37,99,235,.08)",
      borderColor:
        "rgba(37,99,235,.2)",
      color: "#2563eb",
    },

    empty: {
      textAlign: "center",
      padding: "70px 20px",
      border:
        "1px dashed rgba(100,116,139,.22)",
      borderRadius: "18px",
    },

    modalOverlay: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background:
        "rgba(15,23,42,.48)",
      backdropFilter:
        "blur(5px)",
    },

    modal: {
      width: "100%",
      maxWidth: "590px",
      maxHeight: "90vh",
      overflowY: "auto",
      position: "relative",
      borderRadius: "20px",
      padding: "27px",
      background: "#fff",
      color: "#111827",
      boxShadow:
        "0 30px 90px rgba(0,0,0,.25)",
      boxSizing: "border-box",
    },

    close: {
      position: "absolute",
      top: "15px",
      right: "15px",
      width: "34px",
      height: "34px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: 0,
      borderRadius: "50%",
      background:
        "rgba(100,116,139,.08)",
      cursor: "pointer",
    },

    modalTitle: {
      margin:
        "0 35px 7px 0",
      fontSize: "21px",
      fontWeight: 850,
    },

    modalText: {
      margin:
        "0 0 22px",
      fontSize: "13px",
      opacity: 0.62,
      lineHeight: 1.6,
    },

    inputGroup: {
      display: "grid",
      gap: "7px",
      marginBottom: "16px",
    },

    label: {
      fontSize: "12px",
      fontWeight: 800,
    },

    input: {
      width: "100%",
      boxSizing: "border-box",
      minHeight: "43px",
      padding:
        "10px 12px",
      border:
        "1px solid #dbe2ea",
      borderRadius: "10px",
      outline: "none",
      fontSize: "13px",
      background: "#fff",
    },

    textarea: {
      width: "100%",
      boxSizing: "border-box",
      minHeight: "90px",
      resize: "vertical",
      padding:
        "10px 12px",
      border:
        "1px solid #dbe2ea",
      borderRadius: "10px",
      outline: "none",
      fontSize: "13px",
      fontFamily: "inherit",
    },

    select: {
      width: "100%",
      boxSizing: "border-box",
      minHeight: "43px",
      padding:
        "10px 12px",
      border:
        "1px solid #dbe2ea",
      borderRadius: "10px",
      outline: "none",
      fontSize: "13px",
      background: "#fff",
      cursor: "pointer",
    },

    submit: {
      width: "100%",
      minHeight: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      border: 0,
      borderRadius: "11px",
      color: "#fff",
      background:
        "linear-gradient(135deg,#2563eb,#6366f1)",
      fontWeight: 850,
      cursor: "pointer",
    },

    keyBox: {
      marginTop: "20px",
      padding: "17px",
      borderRadius: "14px",
      background:
        "rgba(245,158,11,.07)",
      border:
        "1px solid rgba(245,158,11,.22)",
    },

    keyWarning: {
      display: "flex",
      gap: "9px",
      alignItems: "flex-start",
      fontSize: "12px",
      lineHeight: 1.55,
      color: "#92400e",
    },

    keyValue: {
      marginTop: "13px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },

    keyInput: {
      flex: 1,
      minWidth: 0,
      padding:
        "10px 11px",
      border:
        "1px solid #e5e7eb",
      borderRadius: "9px",
      background: "#fff",
      fontFamily:
        "ui-monospace,SFMono-Regular,Menlo,monospace",
      fontSize: "11px",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    detailGrid: {
      display: "grid",
      gridTemplateColumns:
        "repeat(2,minmax(0,1fr))",
      gap: "10px",
      marginTop: "20px",
    },

    detail: {
      padding: "13px",
      borderRadius: "12px",
      background:
        "rgba(100,116,139,.055)",
      minWidth: 0,
    },

    destination: {
      display: "block",
      marginTop: "5px",
      fontSize: "11px",
      color: "#2563eb",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    modalActions: {
      display: "flex",
      gap: "8px",
      marginTop: "18px",
      flexWrap: "wrap",
    },
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              ANTIMATE LINK
            </h1>

            <p style={styles.subtitle}>
              Create and manage projects
              connected to the ANTIMATE
              LINK Network.
            </p>
          </div>

          <button
            style={styles.createButton}
            onClick={() => {
              setError("");
              setShowCreate(true);
            }}
          >
            <Plus size={17} />
            Create project
          </button>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div style={styles.error}>
            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
              style={{
                border: 0,
                background:
                  "transparent",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <div style={styles.toolbar}>
          <span
            style={{
              fontSize: "12px",
              opacity: 0.55,
            }}
          >
            {projects.length} project
            {projects.length === 1
              ? ""
              : "s"}
          </span>

          <button
            style={styles.refresh}
            onClick={loadProjects}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              style={{
                animation: loading
                  ? "spin 1s linear infinite"
                  : "none",
              }}
            />

            Refresh
          </button>
        </div>

        {/* ====================================================
            PROJECT LIST
        ==================================================== */}

        {loading ? (
          <div
            style={{
              minHeight: "260px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader2
              size={28}
              style={{
                animation:
                  "spin 1s linear infinite",
              }}
            />
          </div>
        ) : projects.length === 0 ? (
          <div style={styles.empty}>
            <Link2
              size={38}
              style={{
                opacity: 0.35,
                marginBottom: "13px",
              }}
            />

            <h3>
              No LINK projects yet
            </h3>

            <p
              style={{
                opacity: 0.55,
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              Create your first project
              to connect your devices
              to the ANTIMATE LINK
              Network.
            </p>

            <button
              style={{
                ...styles.createButton,
                marginTop: "10px",
              }}
              onClick={() => {
                setError("");
                setShowCreate(true);
              }}
            >
              <Plus size={16} />
              Create project
            </button>
          </div>
        ) : (
          <div style={styles.list}>
            {projects.map(
              (project) => (
                <div
                  key={
                    project.projectId
                  }
                  style={styles.row}
                  className="link-project-row"
                >

                  {/* PROJECT */}

                  <div
                    style={
                      styles.projectInfo
                    }
                  >
                    <div
                      style={styles.icon}
                    >
                      <Radio
                        size={21}
                      />
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <h3
                        style={
                          styles.projectName
                        }
                      >
                        {
                          project.projectName
                        }
                      </h3>

                      <div
                        style={
                          styles.projectId
                        }
                      >
                        {
                          project.projectId
                        }
                      </div>
                    </div>
                  </div>

                  {/* STATUS */}

                  <div>
                    <span
                      style={
                        styles.metaLabel
                      }
                    >
                      Status
                    </span>

                    <span
                      style={{
                        ...styles.status,
                        color:
                          project.status ===
                          "active"
                            ? "#16a34a"
                            : project.status ===
                              "suspended"
                            ? "#d97706"
                            : "#dc2626",
                      }}
                    >
                      {project.status ===
                      "active" ? (
                        <CheckCircle2
                          size={14}
                        />
                      ) : (
                        <Circle
                          size={14}
                        />
                      )}

                      {project.status ||
                        "unknown"}
                    </span>
                  </div>

                  {/* PLATFORM */}

                  <div>
                    <span
                      style={
                        styles.metaLabel
                      }
                    >
                      Platform
                    </span>

                    <span
                      style={
                        styles.metaValue
                      }
                    >
                      {project.platform ||
                        "ESP32"}
                    </span>
                  </div>

                  {/* ACTIONS */}

                  <div
                    style={
                      styles.actions
                    }
                  >
                    <button
                      style={{
                        ...styles.actionButton,
                        ...styles.primaryAction,
                      }}
                      onClick={() =>
                        openDeveloper(
                          project
                        )
                      }
                    >
                      Developer
                      <ArrowRight
                        size={13}
                      />
                    </button>

                    <button
                      style={
                        styles.actionButton
                      }
                      onClick={() => {
                        setProjectKey("");
                        setSelectedProject(
                          project
                        );
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          CREATE PROJECT MODAL
      ======================================================== */}

      {showCreate && (
        <div
          style={
            styles.modalOverlay
          }
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >
          <div style={styles.modal}>

            <button
              style={styles.close}
              onClick={() =>
                setShowCreate(false)
              }
            >
              <X size={17} />
            </button>

            <h2
              style={
                styles.modalTitle
              }
            >
              Create LINK project
            </h2>

            <p
              style={
                styles.modalText
              }
            >
              Create a project and
              provide the backend URL
              where your application
              wants to receive data.
            </p>

            <form
              onSubmit={
                handleCreate
              }
            >

              {/* PROJECT NAME */}

              <div
                style={
                  styles.inputGroup
                }
              >
                <label
                  style={
                    styles.label
                  }
                >
                  Project name
                </label>

                <input
                  style={
                    styles.input
                  }
                  value={
                    form.projectName
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      projectName:
                        event.target
                          .value,
                    })
                  }
                  placeholder="e.g. Farm Network"
                  maxLength={120}
                  required
                />
              </div>

              {/* DESCRIPTION */}

              <div
                style={
                  styles.inputGroup
                }
              >
                <label
                  style={
                    styles.label
                  }
                >
                  Description
                </label>

                <textarea
                  style={
                    styles.textarea
                  }
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      description:
                        event.target
                          .value,
                    })
                  }
                  placeholder="What will this project connect?"
                  maxLength={500}
                />
              </div>

              {/* DESTINATION URL */}

              <div
                style={
                  styles.inputGroup
                }
              >
                <label
                  style={
                    styles.label
                  }
                >
                  Destination URL
                </label>

                <input
                  type="url"
                  style={
                    styles.input
                  }
                  value={
                    form.destinationUrl
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      destinationUrl:
                        event.target
                          .value,
                    })
                  }
                  placeholder="https://your-backend.com/api/antimate/data"
                  maxLength={500}
                  required
                />

                <span
                  style={{
                    fontSize:
                      "11px",
                    opacity:
                      0.5,
                    lineHeight:
                      1.5,
                  }}
                >
                  This is your own backend
                  endpoint where LINK
                  data will be delivered.
                </span>
              </div>

              {/* PLATFORM */}

              <div
                style={
                  styles.inputGroup
                }
              >
                <label
                  style={
                    styles.label
                  }
                >
                  Platform
                </label>

                <select
                  style={
                    styles.select
                  }
                  value={
                    form.platform
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      platform:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="esp32">
                    ESP32
                  </option>

                  <option value="arduino">
                    Arduino
                  </option>

                  <option value="platformio">
                    PlatformIO
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                style={
                  styles.submit
                }
                disabled={
                  saving
                }
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      style={{
                        animation:
                          "spin 1s linear infinite",
                      }}
                    />

                    Creating...
                  </>
                ) : (
                  <>
                    Create project
                    <ArrowRight
                      size={16}
                    />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          PROJECT DETAILS MODAL
      ======================================================== */}

      {selectedProject && (
        <div
          style={
            styles.modalOverlay
          }
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails();
            }
          }}
        >
          <div style={styles.modal}>

            <button
              style={styles.close}
              onClick={
                closeDetails
              }
            >
              <X size={17} />
            </button>

            <h2
              style={
                styles.modalTitle
              }
            >
              {
                selectedProject.projectName
              }
            </h2>

            <p
              style={
                styles.modalText
              }
            >
              {
                selectedProject.description ||
                "ANTIMATE LINK project"
              }
            </p>

            {/* DETAILS */}

            <div
              style={
                styles.detailGrid
              }
            >

              {/* PROJECT ID */}

              <div
                style={
                  styles.detail
                }
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Project ID
                </span>

                <strong
                  style={{
                    fontSize:
                      "12px",
                    fontFamily:
                      "ui-monospace,SFMono-Regular,Menlo,monospace",
                    wordBreak:
                      "break-all",
                  }}
                >
                  {
                    selectedProject.projectId
                  }
                </strong>
              </div>

              {/* STATUS */}

              <div
                style={
                  styles.detail
                }
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Status
                </span>

                <strong
                  style={{
                    fontSize:
                      "12px",
                    color:
                      selectedProject.status ===
                      "active"
                        ? "#16a34a"
                        : selectedProject.status ===
                          "suspended"
                        ? "#d97706"
                        : "#dc2626",
                  }}
                >
                  {
                    selectedProject.status ||
                    "unknown"
                  }
                </strong>
              </div>

              {/* PLATFORM */}

              <div
                style={
                  styles.detail
                }
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Platform
                </span>

                <strong
                  style={{
                    fontSize:
                      "12px",
                  }}
                >
                  {
                    selectedProject.platform ||
                    "esp32"
                  }
                </strong>
              </div>

              {/* PROTOCOL */}

              <div
                style={
                  styles.detail
                }
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Protocol
                </span>

                <strong>
                  v
                  {
                    selectedProject.protocolVersion ||
                    "1.0"
                  }
                </strong>
              </div>

              {/* SDK */}

              <div
                style={
                  styles.detail
                }
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Edge SDK
                </span>

                <strong>
                  {
                    selectedProject.sdkVersion ||
                    "1.0.0"
                  }
                </strong>
              </div>

              {/* VIRTUAL SIM */}

              <div
                style={
                  styles.detail
                }
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Virtual SIM
                </span>

                <strong
                  style={{
                    fontSize:
                      "12px",
                    fontFamily:
                      selectedProject.virtualSimId
                        ? "ui-monospace,SFMono-Regular,Menlo,monospace"
                        : "inherit",
                    opacity:
                      selectedProject.virtualSimId
                        ? 1
                        : 0.55,
                  }}
                >
                  {
                    selectedProject.virtualSimId ||
                    "Not assigned"
                  }
                </strong>
              </div>

              {/* DESTINATION */}

              <div
                style={{
                  ...styles.detail,
                  gridColumn:
                    "1 / -1",
                }}
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Destination URL
                </span>

                <span
                  style={
                    styles.destination
                  }
                  title={
                    selectedProject.destinationUrl ||
                    ""
                  }
                >
                  {
                    selectedProject.destinationUrl ||
                    "Not configured"
                  }
                </span>
              </div>

              {/* LAST CONNECTION */}

              <div
                style={
                  styles.detail
                }
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Connection
                </span>

                <strong
                  style={{
                    fontSize:
                      "12px",
                  }}
                >
                  {
                    selectedProject.lastConnectionStatus ||
                    "unknown"
                  }
                </strong>
              </div>

              {/* LAST CONNECTED */}

              <div
                style={
                  styles.detail
                }
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  Last connected
                </span>

                <strong
                  style={{
                    fontSize:
                      "11px",
                  }}
                >
                  {selectedProject.lastConnectedAt
                    ? new Date(
                        selectedProject.lastConnectedAt
                      ).toLocaleString()
                    : "Never"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                PROJECT KEY
            ================================================== */}

            {projectKey ? (
              <div
                style={
                  styles.keyBox
                }
              >
                <div
                  style={
                    styles.keyWarning
                  }
                >
                  <KeyRound
                    size={17}
                  />

                  <span>
                    This Project Key is
                    shown only now.
                    Store it securely.
                    ANTIMATE does not store
                    the original key in
                    readable form.
                  </span>
                </div>

                <div
                  style={
                    styles.keyValue
                  }
                >
                  <input
                    readOnly
                    value={
                      projectKey
                    }
                    style={
                      styles.keyInput
                    }
                  />

                  <button
                    style={
                      styles.actionButton
                    }
                    onClick={() =>
                      copyText(
                        projectKey,
                        "project-key"
                      )
                    }
                  >
                    {copied ===
                    "project-key" ? (
                      <CheckCircle2
                        size={15}
                      />
                    ) : (
                      <Copy
                        size={15}
                      />
                    )}

                    {copied ===
                    "project-key"
                      ? "Copied"
                      : "Copy"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  ...styles.keyBox,
                  background:
                    "rgba(37,99,235,.05)",
                  borderColor:
                    "rgba(37,99,235,.16)",
                }}
              >
                <div
                  style={{
                    ...styles.keyWarning,
                    color: "#1d4ed8",
                  }}
                >
                  <ShieldCheck
                    size={17}
                  />

                  <span>
                    The Project Key is
                    securely hidden. It
                    cannot be recovered
                    after creation.
                  </span>
                </div>
              </div>
            )}

            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div
              style={
                styles.modalActions
              }
            >

              {/* DEVELOPER */}

              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryAction,
                }}
                onClick={() =>
                  openDeveloper(
                    selectedProject,
                    projectKey
                  )
                }
              >
                <Smartphone
                  size={15}
                />

                Developer
                <ArrowRight
                  size={13}
                />
              </button>

              {/* REGENERATE KEY */}

              <button
                style={
                  styles.actionButton
                }
                onClick={() =>
                  regenerateKey(
                    selectedProject
                  )
                }
                disabled={
                  saving
                }
              >
                <RefreshCw
                  size={15}
                />

                Regenerate key
              </button>

              {/* SUSPEND */}

              {selectedProject.status ===
              "active" ? (
                <button
                  style={
                    styles.actionButton
                  }
                  onClick={() =>
                    suspendProject(
                      selectedProject
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <Circle
                    size={15}
                  />

                  Suspend
                </button>
              ) : (
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryAction,
                  }}
                  onClick={() =>
                    activateProject(
                      selectedProject
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <CheckCircle2
                    size={15}
                  />

                  Activate
                </button>
              )}

              {/* DELETE */}

              <button
                style={{
                  ...styles.actionButton,
                  color: "#dc2626",
                  borderColor:
                    "rgba(220,38,38,.18)",
                }}
                onClick={() =>
                  deleteProject(
                    selectedProject
                  )
                }
                disabled={
                  saving
                }
              >
                <Trash2
                  size={15}
                />

                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          RESPONSIVE CSS
      ======================================================== */}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1000px) {
            .link-project-row {
              grid-template-columns: 1fr 1fr !important;
            }

            .link-project-row > div:last-child {
              grid-column: 1 / -1;
              justify-content: flex-start !important;
            }
          }

          @media (max-width: 650px) {
            .link-project-row {
              grid-template-columns: 1fr !important;
            }

            .link-project-row > div:last-child {
              grid-column: auto;
            }
          }

          @media (max-width: 600px) {
            .link-page {
              padding: 18px !important;
            }
          }
        `}
      </style>
    </div>
  );
}
