"use client";
import { WorkReview } from "@/components/work-review";
import { ConnectionCheck } from "@/components/connection-check";
import { TestnetEscrow } from "@/components/testnet-escrow";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  FolderKanban,
  Link2,
  LogOut,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  AgreementEditor,
  AgreementSummary,
} from "@/components/agreement-editor";
import { Agreement, emptyAgreement, total } from "@/lib/agreement";
import { Account, api, ApiError, Project, ProjectSummary, serviceUnavailable } from "@/lib/api";

type Editor = { agreement: Agreement; baseVersion: number; revision: number };

export default function Workspace() {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [notice, setNotice] = useState("");
  const [register, setRegister] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [creating, setCreating] = useState(false);
  const [showId, setShowId] = useState(false);

  function fail(cause: unknown) {
    setUnavailable(serviceUnavailable(cause));
    setError(
      cause instanceof Error
        ? cause.message
        : "Something went wrong. Please try again.",
    );
    if (cause instanceof ApiError && cause.status === 401) {
      setUser(null);
      setProjects([]);
      setProject(null);
      setEditor(null);
    }
  }
  async function refreshList() {
    const data = await api<{ projects: ProjectSummary[] }>("/projects");
    setProjects(data.projects);
  }
  async function loadProject(id: string, preserveEdits = false) {
    const data = await api<Project>(`/projects/${id}`);
    setProject(data);
    if (!preserveEdits) {
      setEditor(null);
      setCreating(false);
    }
    window.history.replaceState(
      null,
      "",
      `/?project=${encodeURIComponent(id)}`,
    );
    return data;
  }
  async function recoverWorkspace() {
    // Reads only. No mutations are repeated after a timeout.
    try {
      const account = await api<{ user: Account }>("/auth/me");
      const list = await api<{ projects: ProjectSummary[] }>("/projects");
      setUser(account.user);
      setProjects(list.projects);
      const selected =
        project?.id ?? new URLSearchParams(window.location.search).get("project");
      if (selected) await loadProject(selected, true);
      setUnavailable(false);
      setError("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setUnavailable(false);
        setError("");
        return;
      }
      throw cause;
    }
  }
  async function run(action: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setUnavailable(false);
    setNotice("");
    try {
      await action();
    } catch (cause) {
      fail(cause);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const account = await api<{ user: Account }>("/auth/me");
        const list = await api<{ projects: ProjectSummary[] }>("/projects");
        if (!active) return;
        setUser(account.user);
        setProjects(list.projects);
        const selected = new URLSearchParams(window.location.search).get(
          "project",
        );
        if (selected) {
          const current = await api<Project>(
            `/projects/${encodeURIComponent(selected)}`,
          );
          if (active) setProject(current);
        }
      } catch (cause) {
        if (active && !(cause instanceof ApiError && cause.status === 401)) {
          setUnavailable(serviceUnavailable(cause));
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load the workspace.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    await run(async () => {
      const payload = {
        email: values.get("email"),
        password: values.get("password"),
        ...(register ? { name: values.get("name") } : {}),
      };
      const account = await api<{ user: Account }>(
        register ? "/auth/register" : "/auth/login",
        "POST",
        payload,
      );
      setUser(account.user);
      await refreshList();
      const selected = new URLSearchParams(window.location.search).get(
        "project",
      );
      if (selected) await loadProject(selected);
    });
  }
  async function saveDraft(publish: boolean) {
    if (!project || !editor) return;
    await run(async () => {
      const saved = await api<{ revision: number }>(
        `/projects/${project.id}/draft`,
        "PUT",
        {
          agreement: editor.agreement,
          expectedVersion: editor.baseVersion,
          expectedRevision: editor.revision,
        },
      );
      setEditor({ ...editor, revision: saved.revision });
      if (publish)
        await api(`/projects/${project.id}/publish`, "POST", {
          expectedVersion: editor.baseVersion,
          expectedRevision: saved.revision,
        });
      await loadProject(project.id);
      await refreshList();
      setNotice(
        publish
          ? "New version published. Both participants must accept this version."
          : "Draft saved to your account. You can return after refreshing.",
      );
    });
  }
  const current = project?.versions.find(
    (item) => item.version === project.currentVersion,
  );
  const accepted = current?.acceptances.some(
    (item) => item.userId === user?.id,
  );
  const bothAccepted = current?.acceptances.length === 2;
  return (
    <div className="app-shell saved-workspace">
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <a href="/" className="brand">
          <span className="brand-symbol">
            <Link2 size={23} />
          </span>
          accordbridge.
        </a>
        <div className="workspace-label">
          YOUR SHARED WORKSPACE<span>Accounts & agreements</span>
        </div>
        <nav aria-label="Workspace navigation">
          <button
            className="nav-item active"
            disabled={busy}
            onClick={() => {
              setProject(null);
              setEditor(null);
              setCreating(false);
              window.history.replaceState(null, "", "/");
            }}
          >
            <FolderKanban size={18} />
            Projects
          </button>
          <a className="nav-item" href="/demo">
            Explore payment demo <ArrowRight size={16} />
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="trust-note">
            <ShieldCheck size={23} />
            <strong>One agreement. Two participants.</strong>
            <p>Your account controls which projects you can open and accept.</p>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumbs">
            Workspace / {project ? "Agreement" : "Projects"}
          </span>
          {user && (
            <div className="button-row">
              <span className="account-name">{user.name}</span>
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await api("/auth/logout", "POST");
                    setUser(null);
                    setProjects([]);
                    setProject(null);
                    setEditor(null);
                    setCreating(false);
                    window.history.replaceState(null, "", "/");
                  })
                }
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </header>
        <div className="demo-bar">
          <strong>Development workspace · testnet tokens only</strong>
          <span>Agreements are saved to your account</span>
        </div>
        <main id="main">
          {busy && <p className="small" role="status" aria-live="polite">Processing your request…</p>}
          {error && (
            <div className="workspace-error" role="alert">
              <p>{error}</p>
              {(editor || creating) && (
                <p>
                  Your entered data remains on this page. Check existing records
                  before repeating any submission with an uncertain outcome.
                </p>
              )}
              {unavailable && <ConnectionCheck onRecovered={recoverWorkspace} />}
              {project && !unavailable && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await loadProject(project.id);
                      await refreshList();
                    })
                  }
                >
                  Reload project · discard unsaved edits
                </button>
              )}
            </div>
          )}
          {notice && (
            <p className="workspace-notice" role="status">
              {notice}
            </p>
          )}
          {loading ? (
            <p role="status">Loading your workspace…</p>
          ) : !user ? (
            <section className="panel auth-card">
              <span className="eyebrow">WELCOME TO ACCORDBRIDGE</span>
              <h1>
                {register ? "Create your account." : "Your work, in one place."}
              </h1>
              <p>
                Sign in to save agreements and work with your project partner.
              </p>
              <form onSubmit={authenticate}>
                <fieldset disabled={busy}>
                  {register && (
                    <label>
                      Your name
                      <input
                        name="name"
                        required
                        maxLength={100}
                        autoComplete="name"
                      />
                    </label>
                  )}
                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    Password
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete={
                        register ? "new-password" : "current-password"
                      }
                    />
                  </label>
                  <p className="small">
                    Use at least 12 characters. Email verification and password
                    recovery are not available in this development version.
                  </p>
                  <button className="primary">
                    {busy
                      ? "Please wait…"
                      : register
                        ? "Create account"
                        : "Sign in"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </fieldset>
              </form>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setRegister(!register);
                  setError("");
                }}
              >
                {register
                  ? "Already have an account? Sign in"
                  : "New here? Create an account"}
              </button>
            </section>
          ) : (
            <>
              {!project && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        AGREEMENTS THAT STAY WITH YOU
                      </span>
                      <h1>Your projects, {user.name}.</h1>
                      <p>
                        Define the work together. Keep every accepted version.
                      </p>
                    </div>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => setCreating(true)}
                    >
                      <Plus size={16} />
                      New project
                    </button>
                  </div>
                  <section className="panel account-card">
                    <h2>Connect with your project partner</h2>
                    <p>
                      Ask your partner to create an account and share their
                      account ID. You choose their ID when creating a project;
                      no invitation email is sent.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => setShowId(!showId)}
                    >
                      {showId ? "Hide account ID" : "Show my account ID"}
                    </button>
                    {showId && (
                      <p className="account-id">
                        <strong>Your account ID</strong>
                        <code data-testid="account-id">{user.id}</code>
                      </p>
                    )}
                  </section>
                  {creating && (
                    <section className="panel auth-card create-project">
                      <h2>Create a shared project</h2>
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          const data = new FormData(event.currentTarget);
                          run(async () => {
                            const agreement = {
                              ...emptyAgreement(),
                              title: String(data.get("title")),
                            };
                            const result = await api<{ id: string }>(
                              "/projects",
                              "POST",
                              {
                                counterpartyId: data.get("counterparty"),
                                role: data.get("role"),
                                agreement,
                              },
                            );
                            const created = await loadProject(result.id);
                            setEditor(created.draft);
                            await refreshList();
                          });
                        }}
                      >
                        <fieldset disabled={busy}>
                          <label>
                            Project title
                            <input name="title" required maxLength={100} />
                          </label>
                          <label>
                            Counterparty account ID
                            <input
                              name="counterparty"
                              required
                              placeholder="Account ID shared by your partner"
                            />
                          </label>
                          <label>
                            Your role in this project
                            <select name="role">
                              <option value="client">
                                Client · I commission the work
                              </option>
                              <option value="freelancer">
                                Freelancer · I deliver the work
                              </option>
                            </select>
                          </label>
                          <p className="small">
                            Both participants can view published agreements.
                            Unpublished drafts are private to their author.
                            Participant roles are fixed when the project is
                            created.
                          </p>
                          <div className="button-row">
                            <button className="primary">
                              Create project & edit agreement
                            </button>
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => setCreating(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </fieldset>
                      </form>
                    </section>
                  )}
                  <section className="panel project-list">
                    <div className="section-heading">
                      <h2>
                        Your projects{" "}
                        <span className="tiny-pill">{projects.length}</span>
                      </h2>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => run(refreshList)}
                      >
                        Refresh list
                      </button>
                    </div>
                    {projects.length === 0 ? (
                      <div className="empty-state">
                        <FolderKanban size={32} />
                        <h3>A clear agreement starts here.</h3>
                        <p>
                          Create a project with a registered partner to begin.
                        </p>
                      </div>
                    ) : (
                      projects.map((item) => (
                        <button
                          className="project-row"
                          key={item.id}
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await loadProject(item.id);
                            })
                          }
                        >
                          <span className="project-name">
                            <strong>
                              {item.title ||
                                item.draftTitle ||
                                "Unpublished project"}
                            </strong>
                            <span>
                              {item.clientName} & {item.freelancerName} · You
                              are the {item.role}
                            </span>
                          </span>
                          <span className="badge">
                            {item.currentVersion
                              ? `Agreement v${item.currentVersion}`
                              : "Draft"}
                          </span>
                          <ArrowRight size={17} />
                        </button>
                      ))
                    )}
                  </section>
                </>
              )}
              {project && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        {project.client.name} × {project.freelancer.name}
                      </span>
                      <h1>
                        {current?.agreement.title ||
                          project.draft?.agreement.title ||
                          "Project agreement"}
                      </h1>
                      <p>
                        You are the {project.role}. Only you can record your
                        acceptance.
                      </p>
                    </div>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await loadProject(project.id, true);
                        })
                      }
                    >
                      Refresh project
                    </button>
                  </div>
                  {!editor && (
                    <section className="panel agreement-review">
                      <div className="section-heading">
                        <h2>
                          {current
                            ? `Agreement v${current.version}`
                            : "No published agreement yet"}
                        </h2>
                        <span className="badge">
                          {project.fundingStarted
                            ? "Terms locked"
                            : bothAccepted
                              ? "Accepted by both"
                              : current
                                ? "Awaiting acceptance"
                                : "Draft"}
                        </span>
                      </div>
                      {current && (
                        <>
                          <AgreementSummary agreement={current.agreement} />
                          <p className="agreement-total">
                            Total:{" "}
                            <strong>
                              {total(current.agreement).toLocaleString("en-US")}{" "}
                              USDC
                            </strong>
                          </p>
                          <div className="acceptances">
                            {[project.client, project.freelancer].map(
                              (person) => (
                                <span key={person.id}>
                                  {person.name}:{" "}
                                  {current.acceptances.some(
                                    (item) => item.userId === person.id,
                                  )
                                    ? "Accepted"
                                    : "Awaiting acceptance"}{" "}
                                  v{current.version}
                                </span>
                              ),
                            )}
                          </div>
                        </>
                      )}
                      <div className="button-row">
                        {current && !project.fundingStarted && (
                          <button
                            className="primary"
                            disabled={busy || accepted}
                            onClick={() =>
                              run(async () => {
                                await api(
                                  `/projects/${project.id}/accept`,
                                  "POST",
                                  { version: current.version },
                                );
                                await loadProject(project.id);
                                setNotice(
                                  "Your acceptance has been saved for this version.",
                                );
                              })
                            }
                          >
                            {accepted
                              ? "Your acceptance is saved"
                              : `Accept agreement v${current.version}`}
                          </button>
                        )}
                        {!project.fundingStarted && (
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              setEditor(
                                project.draft ?? {
                                  agreement: current
                                    ? structuredClone(current.agreement)
                                    : emptyAgreement(),
                                  baseVersion: project.currentVersion,
                                  revision: 0,
                                },
                              )
                            }
                          >
                            {project.draft
                              ? "Resume my saved draft"
                              : current
                                ? "Propose changes"
                                : "Write an agreement"}
                          </button>
                        )}
                      </div>
                      {bothAccepted && (
                        <p className="policy-note">
                          Both participants accepted these development terms.
                          Acceptance alone does not fund the milestone. Use the
                          testnet escrow section to verify wallets and authorize
                          test-token transactions.
                        </p>
                      )}
                      {project.fundingStarted && (
                        <p className="policy-note">
                          Escrow preparation has locked this agreement. Check
                          the testnet panel for verified funding status.
                        </p>
                      )}
                      {!current && (
                        <p className="small">
                          Drafts are visible only to their author. Publish a
                          version so your partner can review it.
                        </p>
                      )}
                    </section>
                  )}
                  {editor && (
                    <>
                      <div className="editor-toolbar">
                        <span className="small">
                          Editing against version {editor.baseVersion} ·{" "}
                          {editor.revision
                            ? "A saved draft exists"
                            : "Not saved yet"}
                        </span>
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => setEditor(null)}
                        >
                          Close · discard unsaved edits
                        </button>
                      </div>
                      {editor.baseVersion !== project.currentVersion && (
                        <p className="workspace-error">
                          This draft predates the current agreement. Review the
                          latest version before starting a fresh proposal.
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              setEditor({
                                agreement: structuredClone(current!.agreement),
                                baseVersion: project.currentVersion,
                                revision: editor.revision,
                              })
                            }
                          >
                            Use latest terms · replace editor contents
                          </button>
                        </p>
                      )}
                      <fieldset className="editor-shell" disabled={busy}>
                        <AgreementEditor
                          draft={editor.agreement}
                          onChange={(agreement) =>
                            setEditor({ ...editor, agreement })
                          }
                          onSave={() => saveDraft(false)}
                          onPublish={() => saveDraft(true)}
                          creating={false}
                          persistent
                          participants={`${project.client.name} is the client; ${project.freelancer.name} is the freelancer.`}
                        />
                      </fieldset>
                    </>
                  )}
                  {current && (
                    <WorkReview
                      key={`work-${project.id}`}
                      project={project}
                      onChange={() => loadProject(project.id, true)}
                    />
                  )}
                  {current && (
                    <TestnetEscrow
                      key={project.id}
                      project={project}
                      userId={user.id}
                      onChange={() => loadProject(project.id)}
                    />
                  )}
                  {project.versions.length > 1 && (
                    <section className="panel agreement-review">
                      <h2>Previous versions</h2>
                      {project.versions
                        .filter(
                          (item) => item.version !== project.currentVersion,
                        )
                        .map((item) => (
                          <details key={item.version}>
                            <summary>
                              Agreement v{item.version} · superseded
                            </summary>
                            <AgreementSummary agreement={item.agreement} />
                            <p className="small">
                              {item.acceptances.length} recorded acceptance(s).
                              These do not apply to the current version.
                            </p>
                          </details>
                        ))}
                    </section>
                  )}
                </>
              )}
            </>
          )}
          <footer>
            <span>AccordBridge Labs · Development workspace</span>
            <span>Saved agreements · no mainnet payments</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
