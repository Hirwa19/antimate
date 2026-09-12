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
  KeyRound,
  Link2,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
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

function getToken() {
  return localStorage.getItem("token");
}

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

  const [newApiKey, setNewApiKey] =
    useState("");

  const [copied, setCopied] =
    useState("");

  const [form, setForm] =
    useState({
      projectName: "",
      description: "",
    });

  /* ==========================================================
     LOAD
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
          data.projects || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load projects."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /* ==========================================================
     CREATE
  ========================================================== */

  async function handleCreate(
    event
  ) {
    event.preventDefault();

    if (
      !form.projectName.trim()
    ) {
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
              projectName:
                form.projectName,

              description:
                form.description,
            }),
          }
        );

      const project =
        data.project;

      setProjects((current) => [
        project,
        ...current,
      ]);

      setNewApiKey(
        data.apiKey || ""
      );

      setSelectedProject(project);

      setForm({
        projectName: "",
        description: "",
      });

      setShowCreate(false);
    } catch (err) {
      setError(
        err.message ||
          "Failed to create project."
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
    apiKey = ""
  ) {
    navigate(
      `/link/developer/${project.projectId}`,
      {
        state: {
          project,
          apiKey,
        },
      }
    );
  }

  /* ==========================================================
     REGENERATE KEY
  ========================================================== */

  async function regenerateKey(
    project
  ) {
    const confirmed =
      window.confirm(
        "Regenerate this API key? The current key will stop working."
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

      setNewApiKey(
        data.apiKey || ""
      );

      setSelectedProject(
        data.project
      );

      setProjects((current) =>
        current.map((item) =>
          item.projectId ===
          project.projectId
            ? data.project
            : item
        )
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to regenerate API key."
      );
    } finally {
      setSaving(false);
    }
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
    },

    container: {
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
    },

    createButton: {
      display: "inline-flex",
      alignItems: "center",
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
        "minmax(220px, 1.5fr) minmax(150px,.7fr) minmax(150px,.7fr) auto",
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
    },

    projectId: {
      marginTop: "4px",
      fontSize: "11px",
      opacity: 0.52,
      fontFamily:
        "ui-monospace,SFMono-Regular,Menlo,monospace",
    },

    metaLabel: {
      display: "block",
      fontSize: "10px",
      textTransform: "uppercase",
      letterSpacing: ".8px",
      opacity: .45,
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
      maxWidth: "570px",
      maxHeight: "90vh",
      overflowY: "auto",
      position: "relative",
      borderRadius: "20px",
      padding: "27px",
      background: "#fff",
      color: "#111827",
      boxShadow:
        "0 30px 90px rgba(0,0,0,.25)",
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
      opacity: .62,
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
      minHeight: "95px",
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

    submit: {
      width: "100%",
      minHeight: "44px",
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
    },
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              ANTIMATE Link
            </h1>

            <p style={styles.subtitle}>
              Manage your Link projects,
              credentials and developer
              connections.
            </p>
          </div>

          <button
            style={styles.createButton}
            onClick={() =>
              setShowCreate(true)
            }
          >
            <Plus size={17} />
            Create project
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
              style={{
                border: 0,
                background:
                  "transparent",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* TOOLBAR */}

        <div style={styles.toolbar}>
          <span
            style={{
              fontSize: "12px",
              opacity: .55,
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

        {/* PROJECTS */}

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
                opacity: .35,
                marginBottom: "13px",
              }}
            />

            <h3>
              No LINK projects yet
            </h3>

            <p
              style={{
                opacity: .55,
                fontSize: "13px",
              }}
            >
              Create your first project
              to start using ANTIMATE
              Link SDK.
            </p>

            <button
              style={{
                ...styles.createButton,
                marginTop: "10px",
              }}
              onClick={() =>
                setShowCreate(true)
              }
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
                >
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

                      {project.status}
                    </span>
                  </div>

                  <div>
                    <span
                      style={
                        styles.metaLabel
                      }
                    >
                      Virtual SIM
                    </span>

                    <span
                      style={
                        styles.metaValue
                      }
                    >
                      {
                        project.virtualSimId
                      }
                    </span>
                  </div>

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
                        setNewApiKey("");
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
          CREATE MODAL
      ======================================================== */}

      {showCreate && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(event) => {
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
              style={styles.modalTitle}
            >
              Create LINK project
            </h2>

            <p
              style={styles.modalText}
            >
              Create a project for your
              ANTIMATE Link SDK
              application.
            </p>

            <form
              onSubmit={handleCreate}
            >
              <div
                style={styles.inputGroup}
              >
                <label
                  style={styles.label}
                >
                  Project name
                </label>

                <input
                  style={styles.input}
                  value={
                    form.projectName
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      projectName:
                        event.target
                          .value,
                    })
                  }
                  placeholder="e.g. Farm Network"
                  required
                />
              </div>

              <div
                style={styles.inputGroup}
              >
                <label
                  style={styles.label}
                >
                  Description
                </label>

                <textarea
                  style={styles.textarea}
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target
                          .value,
                    })
                  }
                  placeholder="What will this project connect?"
                />
              </div>

              <button
                type="submit"
                style={styles.submit}
                disabled={saving}
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
          DETAIL MODAL
      ======================================================== */}

      {selectedProject && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedProject(
                null
              );
              setNewApiKey("");
            }
          }}
        >
          <div style={styles.modal}>
            <button
              style={styles.close}
              onClick={() => {
                setSelectedProject(
                  null
                );
                setNewApiKey("");
              }}
            >
              <X size={17} />
            </button>

            <h2
              style={styles.modalTitle}
            >
              {
                selectedProject.projectName
              }
            </h2>

            <p
              style={styles.modalText}
            >
              {
                selectedProject.description ||
                "ANTIMATE Link project"
              }
            </p>

            <div
              style={styles.detailGrid}
            >
              <div
                style={styles.detail}
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
                    fontSize: "12px",
                    fontFamily:
                      "ui-monospace,SFMono-Regular,Menlo,monospace",
                  }}
                >
                  {
                    selectedProject.projectId
                  }
                </strong>
              </div>

              <div
                style={styles.detail}
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
                    fontSize: "12px",
                  }}
                >
                  {
                    selectedProject.virtualSimId
                  }
                </strong>
              </div>

              <div
                style={styles.detail}
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
                    selectedProject.protocolVersion
                  }
                </strong>
              </div>

              <div
                style={styles.detail}
              >
                <span
                  style={
                    styles.metaLabel
                  }
                >
                  SDK
                </span>

                <strong>
                  {
                    selectedProject.sdkVersion
                  }
                </strong>
              </div>
            </div>

            {/* API KEY */}

            {newApiKey ? (
              <div
                style={styles.keyBox}
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
                    This API key is shown
                    only now. Store it
                    securely. After leaving
                    this screen, it cannot
                    be recovered.
                  </span>
                </div>

                <div
                  style={
                    styles.keyValue
                  }
                >
                  <input
                    readOnly
                    value={newApiKey}
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
                        newApiKey,
                        "key"
                      )
                    }
                  >
                    {copied ===
                    "key" ? (
                      <CheckCircle2
                        size={15}
                      />
                    ) : (
                      <Copy
                        size={15}
                      />
                    )}

                    {copied === "key"
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
                    API key is securely
                    hidden. It cannot be
                    recovered after creation.
                  </span>
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "18px",
                flexWrap: "wrap",
              }}
            >
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryAction,
                }}
                onClick={() =>
                  openDeveloper(
                    selectedProject,
                    newApiKey
                  )
                }
              >
                <Smartphone
                  size={15}
                />
                Open Developer
              </button>

              <button
                style={
                  styles.actionButton
                }
                onClick={() =>
                  regenerateKey(
                    selectedProject
                  )
                }
                disabled={saving}
              >
                <RefreshCw
                  size={15}
                />

                Regenerate API key
              </button>
            </div>
          </div>
        </div>
      )}

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

          @media (max-width: 900px) {
            .link-project-row {
              grid-template-columns: 1fr !important;
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