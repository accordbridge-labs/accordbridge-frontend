"use client";

import { useReducer, useState } from "react";
import { DemoScenarios } from "@/components/demo-scenarios";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  Link2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Wallet,
  Scale,
} from "lucide-react";
import {
  balances,
  demoReducer,
  initialState,
  Role,
  stageLabels,
} from "@/lib/demo";

import { Agreement, emptyAgreement, payout, total } from "@/lib/agreement";
import {
  AgreementEditor,
  AgreementSummary,
} from "@/components/agreement-editor";

type View =
  "Overview" | "Project workspace" | "Wallet & receipts" | "Resolution centre";
const navigation = [
  { name: "Overview" as const, icon: LayoutDashboard },
  { name: "Project workspace" as const, icon: FolderKanban },
  { name: "Wallet & receipts" as const, icon: Wallet },
  { name: "Resolution centre" as const, icon: Scale },
];
const money = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function Home() {
  const [state, dispatch] = useReducer(demoReducer, undefined, () =>
    initialState(),
  );
  const [role, setRole] = useState<Role>("client");
  const [view, setView] = useState<View>("Overview");
  const [notes, setNotes] = useState(
    "Five page layouts with desktop and mobile variants are ready for review. Sample evidence only.",
  );
  const [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState<"scope" | "submissions" | "activity">("scope");
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [draft, setDraft] = useState<Agreement | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draftVersion, setDraftVersion] = useState(1);
  const [scenarioKey, setScenarioKey] = useState(0);
  const agreement = state.agreement;
  const milestone = agreement.milestones[0];
  const payment = payout(milestone.amount);
  const projectTotal =
    total(agreement) +
    (state.extra && !["proposed", "rejected"].includes(state.extra.status)
      ? 200
      : 0);
  const criteria = milestone.criteria.split("\n").filter((line) => line.trim());
  const canEdit = ["agreement", "unfunded"].includes(state.stage);
  const funds = balances(state);
  const name = role === "client" ? "Maya" : "Tobi";
  const isPending = [
    "funding-pending",
    "funding-unknown",
    "payment-pending",
  ].includes(state.stage);
  const nextActor =
    state.stage === "agreement"
      ? "Both parties"
      : ["working", "revision"].includes(state.stage)
        ? "Tobi · Freelancer"
        : ["review", "unfunded", "funding-failed"].includes(state.stage)
          ? "Maya · Client"
          : state.stage === "disputed"
            ? "Reviewer"
            : state.stage === "settling"
              ? "Both parties / demo settlement check"
              : state.stage === "settled"
                ? "First milestone settled"
                : state.stage === "released"
                  ? "Milestone complete"
                  : "Demo transaction check";

  function reset(scenario: "new" | "funded" | "review") {
    setScenarioKey((key) => key + 1);
    dispatch({ type: "reset", scenario });
    setApprovalOpen(false);
    setFeedback("");
    setTab("scope");
    setDraft(null);
    setEditorOpen(false);
  }

  const actionPanel = (
    <section className="panel action-panel" aria-labelledby="next-action">
      <div className="section-heading">
        <span className="eyebrow">YOUR NEXT STEP</span>
        <span className="badge">{stageLabels[state.stage]}</span>
      </div>
      <h2 id="next-action">
        {state.stage === "agreement"
          ? "Good work starts with a clear agreement."
          : state.stage === "unfunded"
            ? `Give ${milestone.name} a green light.`
            : state.stage === "working"
              ? `${milestone.name} is ready to start.`
              : state.stage === "review"
                ? "A little feedback. A big step forward."
                : state.stage === "revision"
                  ? "Keep the feedback connected to the scope."
                  : state.stage === "released"
                    ? "First milestone, completed."
                    : state.stage === "disputed"
                      ? "A decision needs a human reviewer."
                      : state.stage === "settled"
                        ? "Sample settlement confirmed."
                        : state.stage === "settling"
                          ? "Review the proposed settlement below."
                          : "Let’s check where the payment stands."}
      </h2>
      <p>
        {state.stage === "agreement"
          ? "Maya and Tobi must accept the same version before funding. Review the scope and sample terms in the workspace."
          : state.stage === "unfunded"
            ? `${money(payment.gross)} USDC funds ${milestone.name} only. Other milestones stay unfunded.`
            : state.stage === "working"
              ? `${money(payment.gross)} USDC is held in the simulated milestone escrow. Tobi can submit a version for Maya to review.`
              : state.stage === "review"
                ? "Review the latest submission against the agreed criteria. Approve it, request a specific revision, or ask for a reviewer."
                : state.stage === "revision"
                  ? state.feedback
                  : state.stage === "released"
                    ? "The sample payout is confirmed. Any remaining milestones still need their own funding."
                    : state.stage === "disputed"
                      ? `${money(payment.gross)} USDC remains held for this milestone. Explore an illustrative, mutually authorized split below; no real reviewer is contacted.`
                      : ["settling", "settled"].includes(state.stage)
                        ? "See the itemized cancellation or split record below. Extra-work deposits, if any, stay separate."
                        : "A submitted transaction is not a confirmed payment. Use the demo control below to simulate checking its result."}
      </p>
      <div className="action-footer">
        <span className="muted">
          Next actor: <strong>{nextActor}</strong>
        </span>
        {view === "Overview" && (
          <button
            className="primary"
            onClick={() => setView("Project workspace")}
          >
            Open workspace <ArrowRight size={16} />
          </button>
        )}
      </div>
      {view === "Project workspace" && (
        <div className="workflow">
          {state.stage === "agreement" && (
            <>
              <div className="acceptances">
                <span>
                  {state.accepted.client ? "✓" : "○"} Maya{" "}
                  {state.accepted.client ? "accepted" : "has not accepted"} v
                  {state.agreementVersion}
                </span>
                <span>
                  {state.accepted.freelancer ? "✓" : "○"} Tobi{" "}
                  {state.accepted.freelancer ? "accepted" : "has not accepted"}{" "}
                  v{state.agreementVersion}
                </span>
              </div>
              <button
                className="primary"
                disabled={state.accepted[role] || editorOpen}
                onClick={() =>
                  dispatch({
                    type: "accept",
                    role,
                    version: state.agreementVersion,
                  })
                }
              >
                {state.accepted[role]
                  ? "Accepted · waiting for the other party"
                  : `Accept sample agreement as ${name}`}
              </button>
              <p className="small">
                Switch the demo role to accept as the other participant. These
                are sample terms, not a live agreement.
              </p>
            </>
          )}
          {["unfunded", "funding-failed"].includes(state.stage) && (
            <>
              {state.stage === "funding-failed" && (
                <p role="alert">
                  The demo check confirmed deposit failure. No funds moved.
                  Retry only after a confirmed failure, never merely after a
                  timeout.
                </p>
              )}
              <div className="funding-details">
                <span>
                  Asset <strong>Sample USDC · Stellar demo</strong>
                </span>
                <span>
                  Destination <strong>DEMO-MILESTONE-ESCROW</strong>
                </span>
                <span>
                  Gross deposit <strong>{money(payment.gross)} USDC</strong>
                </span>
                <span>
                  Illustrative payout fee{" "}
                  <strong>{money(payment.fee)} USDC (0.3%)</strong>
                </span>
                <span>
                  Illustrative net payout{" "}
                  <strong>{money(payment.net)} USDC</strong>
                </span>
              </div>
              <p className="small">
                No real asset address or signing wallet is connected. Network
                fees are not estimated. Pricing and resolver terms remain
                proposals.
              </p>
              {role === "client" ? (
                <button
                  className="primary"
                  onClick={() => dispatch({ type: "fund", role })}
                >
                  Simulate funding · {money(payment.gross)} USDC{" "}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <p>Waiting for Maya to fund this milestone.</p>
              )}
            </>
          )}
          {isPending && (
            <div className="button-row">
              <button
                className="primary"
                onClick={() =>
                  dispatch({
                    type:
                      state.stage === "payment-pending"
                        ? "confirm-payment"
                        : "confirm-funding",
                  })
                }
              >
                {state.stage === "funding-unknown"
                  ? "Check transaction · simulate confirmation"
                  : "Simulate confirmed transaction"}
              </button>
              {state.stage === "funding-pending" && (
                <button
                  className="secondary"
                  onClick={() => dispatch({ type: "funding-unknown" })}
                >
                  Simulate unknown outcome
                </button>
              )}
              {["funding-pending", "funding-unknown"].includes(state.stage) && (
                <button
                  className="secondary"
                  onClick={() => dispatch({ type: "fail-funding" })}
                >
                  Check transaction · simulate confirmed failure
                </button>
              )}
            </div>
          )}
          {["working", "revision"].includes(state.stage) &&
            role === "freelancer" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  dispatch({ type: "submit", role, notes });
                  setTab("submissions");
                }}
              >
                <label htmlFor="notes">
                  Delivery notes · sample evidence only
                </label>
                <textarea
                  id="notes"
                  required
                  maxLength={2000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
                <p className="small">
                  Sample reference: {milestone.name} delivery pack. No file is
                  uploaded. Each submission creates a new version.
                </p>
                <button className="primary" disabled={!notes.trim()}>
                  Submit work · v{state.submissions.length + 1}{" "}
                  <ArrowUpRight size={16} />
                </button>
              </form>
            )}
          {state.stage === "review" && role === "client" && (
            <>
              <div className="submission-preview">
                <FileCheck2 size={20} />
                <div>
                  <strong>
                    {milestone.name} submission v{state.submissions.length}
                  </strong>
                  <p>{state.submissions.at(-1)?.notes}</p>
                </div>
              </div>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => setApprovalOpen(true)}
                >
                  Approve milestone <Check size={16} />
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    dispatch({ type: "dispute", role });
                    setView("Resolution centre");
                  }}
                >
                  Open dispute
                </button>
              </div>
              {approvalOpen && (
                <section
                  className="confirmation"
                  aria-label="Approval confirmation"
                >
                  <h3>Authorize the sample payout?</h3>
                  <p>
                    {money(payment.gross)} USDC gross − {money(payment.fee)}{" "}
                    USDC illustrative fee = {money(payment.net)} USDC net to
                    Tobi. Approval starts the payout process; it does not
                    confirm payment.
                  </p>
                  <div className="button-row">
                    <button
                      className="primary"
                      onClick={() => {
                        dispatch({ type: "approve", role });
                        setApprovalOpen(false);
                      }}
                    >
                      Confirm approval
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setApprovalOpen(false)}
                    >
                      Keep reviewing
                    </button>
                  </div>
                </section>
              )}
              <form
                className="revision-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  dispatch({ type: "revise", role, feedback });
                  setApprovalOpen(false);
                }}
              >
                <label htmlFor="feedback">
                  Request a revision · name an unmet criterion
                </label>
                <textarea
                  id="feedback"
                  required
                  maxLength={2000}
                  placeholder="For example: the mobile contact-page layout is missing."
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                />
                <button
                  className="secondary"
                  disabled={
                    !feedback.trim() ||
                    state.revisionsUsed >= agreement.revisions
                  }
                >
                  Request revision
                </button>
                {state.revisionsUsed >= agreement.revisions && (
                  <p>
                    Included revision rounds exhausted. Consider a separately
                    funded change or request review.
                  </p>
                )}
              </form>
            </>
          )}
          {state.stage === "review" && role === "freelancer" && (
            <p>
              Submission v{state.submissions.length} is with Maya. Switch to the
              client view to review it.
            </p>
          )}
          {["working", "revision"].includes(state.stage) && (
            <button
              className="text-button"
              onClick={() => {
                dispatch({ type: "dispute", role });
                setView("Resolution centre");
              }}
            >
              Need a reviewer? Open a dispute <ArrowUpRight size={14} />
            </button>
          )}
          {state.stage === "released" && (
            <button
              className="primary"
              onClick={() => setView("Wallet & receipts")}
            >
              View sample receipt <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
    </section>
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="AccordBridge home">
          <span className="brand-symbol">
            <Link2 size={23} />
          </span>
          accordbridge<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">
          NORTHSTAR WORKSPACE
          <span>
            Personal workspace <span className="tiny-pill">DEMO</span>
          </span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(({ name: item, icon: Icon }) => (
            <button
              key={item}
              className={`nav-item ${view === item ? "active" : ""}`}
              aria-current={view === item ? "page" : undefined}
              onClick={() => {
                setView(item);
                setApprovalOpen(false);
              }}
            >
              <Icon size={19} />
              {item}
              {item === "Resolution centre" && state.stage === "disputed" && (
                <span className="count">1</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trust-note">
            <ShieldCheck size={23} />
            <strong>Clear terms. Shared confidence.</strong>
            <p>A better starting point for working together.</p>
          </div>
          <div className="profile">
            <span className="avatar">{role === "client" ? "MA" : "TO"}</span>
            <div>
              <strong>
                {name} {role === "client" ? "Adeyemi" : "Ojo"}
              </strong>
              <span>
                {role === "client" ? "Client" : "Freelancer"} · Sample account
              </span>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <ChevronRight size={14} />
            <strong>{view}</strong>
          </div>
          <span className="network">
            <span />
            Stellar · demo environment
          </span>
        </header>
        <div className="demo-bar">
          <div>
            <span className="demo-tag">PROTOTYPE</span>
            <strong>Demo — sample data, no real payments</strong>
          </div>
          <label>
            View as{" "}
            <select
              aria-label="Demo role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as Role);
                setApprovalOpen(false);
              }}
            >
              <option value="client">Maya · Client</option>
              <option value="freelancer">Tobi · Freelancer</option>
            </select>
          </label>
        </div>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR WORK, ON THE SAME PAGE</div>
              <h1>
                {view === "Overview"
                  ? `A clear view, ${name}.`
                  : view === "Project workspace"
                    ? agreement.title
                    : view === "Wallet & receipts"
                      ? "Every milestone accounted for."
                      : "Room for a fair resolution."}
              </h1>
              <p>
                {view === "Overview"
                  ? "Good agreements. Funded milestones. More room to do great work."
                  : view === "Project workspace"
                    ? agreement.description
                    : view === "Wallet & receipts"
                      ? "Keep available funds, held funds, and completed payments separate."
                      : "Bring the agreed scope and the work into the same conversation."}
              </p>
            </div>
            {view === "Overview" && (
              <button
                className="secondary"
                onClick={() => {
                  setDraft(emptyAgreement());
                  setCreating(true);
                  setEditorOpen(true);
                  setView("Project workspace");
                }}
              >
                <Plus size={17} />
                Create agreement
              </button>
            )}
          </div>
          <div className="scenario-strip">
            <span>Explore the demo</span>
            <button
              onClick={() => {
                reset("new");
                setView("Project workspace");
              }}
            >
              01 Agreement
            </button>
            <button
              onClick={() => {
                reset("funded");
                setView("Project workspace");
                setRole("freelancer");
              }}
            >
              02 Funded work
            </button>
            <button
              onClick={() => {
                reset("review");
                setView("Project workspace");
                setRole("client");
              }}
            >
              03 Client review
            </button>
            <button
              onClick={() => {
                reset("funded");
                setView("Project workspace");
                setRole("client");
              }}
            >
              04 Extra work
            </button>
            <button
              onClick={() => {
                reset("review");
                setView("Project workspace");
                setRole("freelancer");
              }}
            >
              05 Client silence
            </button>
            <button
              onClick={() => {
                reset("funded");
                setView("Project workspace");
                setRole("client");
              }}
            >
              06 Cancellation
            </button>
            <button
              onClick={() => {
                reset("review");
                dispatch({ type: "dispute", role: "client" });
                setView("Resolution centre");
                setRole("client");
              }}
            >
              07 Split settlement
            </button>
            <button className="reset" onClick={() => reset("new")}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
          <div className="stats">
            <div className="stat">
              <span>
                Total project value <FolderKanban size={17} />
              </span>
              <strong>
                {money(projectTotal)} <small>USDC</small>
              </strong>
              <p>
                {agreement.milestones.length} milestones in the sample agreement
              </p>
            </div>
            <div className="stat">
              <span>
                Held in escrow <ShieldCheck size={17} />
              </span>
              <strong>
                {money(funds.locked)} <small>USDC</small>
              </strong>
              <p>
                {funds.disputed
                  ? `Includes ${money(funds.disputed)} USDC under dispute`
                  : "Confirmed sample funds only"}
              </p>
            </div>
            <div className="stat">
              <span>
                Unfunded work <ArrowDownLeft size={17} />
              </span>
              <strong>
                {money(funds.unfunded)} <small>USDC</small>
              </strong>
              <p>
                {isPending
                  ? "Pending outcomes are not counted as settled"
                  : "Requires separate confirmed funding"}
              </p>
            </div>
            <div className="stat">
              <span>
                Released · gross <ArrowUpRight size={17} />
              </span>
              <strong>
                {money(funds.released)} <small>USDC</small>
              </strong>
              <p>
                {funds.released
                  ? `${money(payout(String(funds.released)).net)} USDC net after illustrative fee`
                  : "No confirmed sample payouts yet"}
              </p>
            </div>
          </div>
          {funds.refunded > 0 && (
            <p className="policy-note" role="status">
              Confirmed sample refund to Maya: {money(funds.refunded)} USDC.
              This is not unfunded work or a freelancer payout.
            </p>
          )}
          {view === "Overview" && (
            <>
              {actionPanel}
              <section className="panel project-list">
                <div className="section-heading">
                  <h2>
                    Your projects <span className="tiny-pill">1</span>
                  </h2>
                  <span className="muted">
                    An agreement behind every milestone
                  </span>
                </div>
                <button
                  className="project-row"
                  onClick={() => setView("Project workspace")}
                >
                  <span className="project-avatar">
                    N<span>✦</span>
                  </span>
                  <span className="project-name">
                    <strong>{agreement.title}</strong>
                    <span>Maya & Tobi · {milestone.name} milestone</span>
                  </span>
                  <span className="badge">{stageLabels[state.stage]}</span>
                  <span className="project-total">
                    {money(projectTotal)} USDC<small>Project total</small>
                  </span>
                  <ArrowUpRight size={20} />
                </button>
              </section>
              <div className="bottom-note">
                <ShieldCheck size={17} />
                <span>
                  Work starts with agreement. Confidence starts with confirmed
                  funding.
                </span>
              </div>
            </>
          )}
          {view === "Project workspace" && (
            <>
              <section className="panel agreement-review">
                <div className="section-heading">
                  <h2>Agreement v{state.agreementVersion}</h2>
                  {canEdit && (
                    <button
                      className="secondary"
                      onClick={() => {
                        setDraft(structuredClone(agreement));
                        setDraftVersion(state.agreementVersion);
                        setCreating(false);
                        setEditorOpen(true);
                      }}
                    >
                      Propose changes
                    </button>
                  )}
                </div>
                {!canEdit && (
                  <p className="policy-note">
                    This agreement is locked because funding has started.
                    Changes to funded work require a separate scope-change
                    agreement.
                  </p>
                )}
                {draft && !editorOpen && (creating || canEdit) && (
                  <button
                    className="secondary"
                    onClick={() => setEditorOpen(true)}
                  >
                    Resume saved draft
                  </button>
                )}
                <details>
                  <summary>
                    Review all milestones and terms · v{state.agreementVersion}
                  </summary>
                  <AgreementSummary agreement={agreement} context="demo" />
                </details>
                <p className="small">
                  Maya:{" "}
                  {state.accepted.client ? "accepted" : "awaiting acceptance"} v
                  {state.agreementVersion} · Tobi:{" "}
                  {state.accepted.freelancer
                    ? "accepted"
                    : "awaiting acceptance"}{" "}
                  v{state.agreementVersion}
                </p>
                {state.history.length > 0 && (
                  <div className="version-history">
                    <h3>Previous versions</h3>
                    {state.history.map((record) => (
                      <details key={record.version}>
                        <summary>
                          Agreement v{record.version} ·{" "}
                          {money(total(record.agreement))} USDC · superseded
                        </summary>
                        <p className="small">
                          Maya:{" "}
                          {record.accepted.client ? "accepted" : "not accepted"}{" "}
                          · Tobi:{" "}
                          {record.accepted.freelancer
                            ? "accepted"
                            : "not accepted"}
                          . These acceptances do not apply to the current
                          version.
                        </p>
                        <AgreementSummary
                          agreement={record.agreement}
                          context="demo"
                        />
                      </details>
                    ))}
                  </div>
                )}
              </section>
              {editorOpen && draft && (
                <AgreementEditor
                  context="demo"
                  draft={draft}
                  onChange={setDraft}
                  creating={creating}
                  onSave={() => setEditorOpen(false)}
                  onPublish={() => {
                    dispatch(
                      creating
                        ? { type: "create-agreement", agreement: draft }
                        : {
                            type: "publish-agreement",
                            agreement: draft,
                            version: draftVersion,
                          },
                    );
                    setEditorOpen(false);
                    setDraft(null);
                    setApprovalOpen(false);
                    setFeedback("");
                    setTab("scope");
                  }}
                />
              )}
            </>
          )}
          {view === "Project workspace" && !editorOpen && (
            <div className="project-layout">
              <div>
                {actionPanel}
                <section className="panel detail-panel">
                  <div
                    className="tabs"
                    role="group"
                    aria-label="Project details"
                  >
                    {(["scope", "submissions", "activity"] as const).map(
                      (item) => (
                        <button
                          key={item}
                          aria-pressed={tab === item}
                          className={tab === item ? "selected" : ""}
                          onClick={() => setTab(item)}
                        >
                          {item === "scope"
                            ? "Agreed scope"
                            : item === "submissions"
                              ? `Submissions (${state.submissions.length})`
                              : "Activity"}
                        </button>
                      ),
                    )}
                  </div>
                  {tab === "scope" && (
                    <div className="tab-content">
                      <span className="eyebrow">
                        AGREEMENT V{state.agreementVersion} · SAMPLE TERMS
                      </span>
                      <h2>{milestone.name}</h2>
                      <p>{milestone.scope}</p>
                      <ul className="criteria">
                        {criteria.map((item, index) => (
                          <li key={index}>
                            <FileCheck2 size={17} />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="terms-grid">
                        <div>
                          <span>Included revisions</span>
                          <strong>
                            {agreement.revisions} rounds · proposed
                          </strong>
                        </div>
                        <div>
                          <span>Delivery target</span>
                          <strong>
                            {milestone.dueDate}, 17:00 WAT (UTC+1)
                          </strong>
                        </div>
                        <div>
                          <span>Review period</span>
                          <strong>
                            {agreement.reviewDays} calendar days · proposed
                          </strong>
                        </div>
                        <div>
                          <span>Out of scope</span>
                          <strong>{agreement.exclusions}</strong>
                        </div>
                      </div>
                      <p className="policy-note">
                        Client silence goes to a reviewer; it does not trigger
                        automatic payment. Resolver appointment, cancellation
                        terms, fees, and appeals must be finalized before live
                        agreements.
                      </p>
                    </div>
                  )}
                  {tab === "submissions" && (
                    <div className="tab-content">
                      {state.submissions.length === 0 ? (
                        <div className="empty-state">
                          <FileCheck2 size={30} />
                          <h3>A place for each version.</h3>
                          <p>
                            Fund the milestone, then switch to Tobi to submit
                            sample work.
                          </p>
                        </div>
                      ) : (
                        state.submissions.map((submission) => (
                          <article
                            className="submission-card"
                            key={submission.version}
                          >
                            <span className="badge">
                              Version {submission.version}
                            </span>
                            <h3>{milestone.name} delivery pack</h3>
                            <p>{submission.notes}</p>
                            <span className="muted small">
                              Synthetic reference · no uploaded files
                            </span>
                          </article>
                        ))
                      )}
                    </div>
                  )}
                  {tab === "activity" && (
                    <ol className="activity tab-content">
                      {state.activity.map((event, index) => (
                        <li key={`${index}-${event}`}>
                          <span className="activity-dot" />
                          {event}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
              <aside className="panel milestone-panel">
                <div className="section-heading">
                  <h2>The milestones</h2>
                  <span className="tiny-pill">
                    {agreement.milestones.length}
                  </span>
                </div>
                {agreement.milestones.map((milestone, index) => (
                  <div
                    className={`milestone ${index === 0 ? "current" : ""}`}
                    key={index}
                  >
                    <span className="milestone-number">{index + 1}</span>
                    <div>
                      <strong>{milestone.name}</strong>
                      <span>
                        {index === 0 ? stageLabels[state.stage] : "Unfunded"}
                      </span>
                    </div>
                    <strong>
                      {milestone.amount}
                      <small>USDC</small>
                    </strong>
                  </div>
                ))}
                <div className="milestone-total">
                  <span>Project total</span>
                  <strong>{money(projectTotal)} USDC</strong>
                </div>
                <div className="scope-note">
                  <Link2 size={21} />
                  <h3>More work? A new agreement.</h3>
                  <p>
                    Extra scope needs mutual acceptance and separate funding.
                    Explore the separate sample change proposal below. It does
                    not modify the deployed contract.
                  </p>
                </div>
              </aside>
            </div>
          )}
          {view === "Wallet & receipts" && (
            <section className="panel receipt-panel">
              <div className="section-heading">
                <h2>Wallet & payment records</h2>
                <span className="badge">Simulation only</span>
              </div>
              <div className="wallet-empty">
                <Wallet size={25} />
                <div>
                  <h3>No wallet connected</h3>
                  <p>
                    Available wallet balance is unavailable. This prototype does
                    not request wallet access or credentials.
                  </p>
                </div>
              </div>
              {state.stage === "released" ? (
                <>
                  <h3>{milestone.name} milestone · confirmed sample receipt</h3>
                  <dl className="receipt">
                    <div>
                      <dt>Transaction reference</dt>
                      <dd>DEMO-PAYOUT-001 · synthetic</dd>
                    </div>
                    <div>
                      <dt>Project / agreement</dt>
                      <dd>
                        {agreement.title} / v{state.agreementVersion}
                      </dd>
                    </div>
                    <div>
                      <dt>Recipient</dt>
                      <dd>Tobi · sample freelancer</dd>
                    </div>
                    <div>
                      <dt>Network / asset</dt>
                      <dd>Stellar demo / sample USDC</dd>
                    </div>
                    <div>
                      <dt>Gross released</dt>
                      <dd>{money(payment.gross)} USDC</dd>
                    </div>
                    <div>
                      <dt>Illustrative provider fee (0.3%)</dt>
                      <dd>{money(payment.fee)} USDC</dd>
                    </div>
                    <div>
                      <dt>Illustrative platform fee</dt>
                      <dd>0 USDC</dd>
                    </div>
                    <div>
                      <dt>Net received</dt>
                      <dd>{money(payment.net)} USDC</dd>
                    </div>
                  </dl>
                  <p className="small muted">
                    This is a simulated payment record, not a blockchain
                    transaction or tax document. Network fees are not estimated.
                  </p>
                </>
              ) : state.stage === "settled" ? (
                <p>The itemized sample settlement receipt is below.</p>
              ) : (
                <div className="empty-state">
                  <FileCheck2 size={30} />
                  <h3>No confirmed payout yet.</h3>
                  <p>
                    A sample receipt appears after approval and a separate
                    payment confirmation.
                  </p>
                </div>
              )}
            </section>
          )}
          {view === "Resolution centre" && (
            <section className="panel resolution-panel">
              <div className="section-heading">
                <h2>Resolution centre</h2>
                <Scale size={21} />
              </div>
              {state.stage === "disputed" ? (
                <>
                  <span className="badge warning">Open case · sample data</span>
                  <h2>
                    {agreement.title} / {milestone.name}
                  </h2>
                  <p>
                    {money(funds.locked)} USDC held, including{" "}
                    {money(funds.disputed)} USDC disputed. These are the same
                    funds, not two balances.
                  </p>
                  <div className="terms-grid">
                    <div>
                      <span>Reviewer assignment</span>
                      <strong>Pending · no real reviewer contacted</strong>
                    </div>
                    <div>
                      <span>Next step</span>
                      <strong>Review terms and both parties’ evidence</strong>
                    </div>
                  </div>
                  <h3>Submission evidence</h3>
                  {state.submissions.length ? (
                    state.submissions.map((item) => (
                      <p key={item.version}>
                        v{item.version}: {item.notes}
                      </p>
                    ))
                  ) : (
                    <p>No submitted work yet.</p>
                  )}
                  <p className="policy-note">
                    Reviewer powers, response deadlines, settlement fees, and
                    appeals are unresolved policy decisions. The case stays
                    pending unless you explicitly explore and mutually authorize
                    a synthetic allocation below. This does not authorize a real
                    payout or refund.
                  </p>
                </>
              ) : (
                <div className="empty-state">
                  <ShieldCheck size={34} />
                  <h3>
                    {state.settlement
                      ? "Settlement record below."
                      : "No open cases."}
                  </h3>
                  <p>
                    If an agreed requirement is in dispute, open a case from a
                    funded milestone’s workspace.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => setView("Project workspace")}
                  >
                    Go to workspace <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
          <DemoScenarios
            key={scenarioKey}
            state={state}
            role={role}
            dispatch={dispatch}
            view={view}
          />
          <footer>
            <span>AccordBridge Labs · Product prototype</span>
            <span>
              <CircleHelp size={14} /> Refreshing clears this demo. Use sample
              information only.
            </span>
          </footer>
        </main>
        <div className="sr-only" role="status" aria-live="polite">
          {stageLabels[state.stage]}. {state.activity[0]}
        </div>
      </div>
    </div>
  );
}
