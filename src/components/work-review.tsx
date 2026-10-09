"use client";
import { useEffect, useRef, useState } from "react";
import { api, Project, serviceUnavailable } from "@/lib/api";
import { ConnectionCheck } from "@/components/connection-check";

type Submission = {
  id: string;
  sequence: number;
  notes: string;
  links: string[];
  submittedAt: string;
  reviewDueAt: string;
  review: null | {
    decision: "approved" | "revision_requested";
    feedback: string;
    reviewedAt: string;
  };
};
type Work = { canAct: boolean; submissions: Submission[] };
const utc = (date: string) =>
  new Date(date).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC";
export function WorkReview({
  project,
  onChange,
}: {
  project: Project;
  onChange: () => Promise<unknown>;
}) {
  const [work, setWork] = useState<Work | null>(null);
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const agreement = project.versions.find(
    (v) => v.version === project.currentVersion,
  )?.agreement;
  const latest = work?.submissions[0];
  const used =
    work?.submissions.filter((s) => s.review?.decision === "revision_requested")
      .length ?? 0;
  useEffect(() => {
    let active = true;
    api<Work>(`/projects/${project.id}/work`)
      .then((value) => {
        if (active) setWork(value);
      })
      .catch((cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load submissions.");
          setUnavailable(serviceUnavailable(cause));
        }
      });
    return () => {
      active = false;
    };
  }, [project]);
  async function refreshWork() {
    const current = await api<Work>(`/projects/${project.id}/work`);
    setWork(current);
    setUnavailable(false);
    setError("");
  }
  async function run(
    operation: () => Promise<unknown>,
    success: string,
    afterConfirmed?: () => void,
  ) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    let completed = false;
    try {
      await operation();
      completed = true;
      await refreshWork();
      await onChange();
      afterConfirmed?.();
      setMessage(success);
    } catch (cause) {
      setUnavailable(serviceUnavailable(cause));
      setError(
        (cause instanceof Error ? cause.message : "Unable to save.") +
          (completed
            ? " The write may already be saved. Check the current project before submitting again."
            : serviceUnavailable(cause)
              ? " The outcome may be unknown. Check saved state before submitting again."
              : ""),
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="panel agreement-review work-review"
      aria-labelledby="work-title"
    >
      <div className="section-heading">
        <h2 id="work-title">Deliverables & review</h2>
        <span className="badge">Milestone 1</span>
      </div>
      <p>
        Submit delivery notes and HTTPS links for the first funded milestone.
        Links are shared with your project partner; grant them access at the
        destination. Linked content can change and is not stored or verified by
        AccordBridge.
      </p>
      <p className="small">
        Approval records a work decision. Releasing tokens still needs the
        client’s separate wallet signature. The experimental contract permits
        client release outside this app without a recorded review.
      </p>
      {busy && <p className="small" role="status" aria-live="polite">Saving or checking your work…</p>}
      {error && (
        <div className="workspace-error" role="alert">
          <p>{error}</p>
          {unavailable && <ConnectionCheck onRecovered={refreshWork} />}
          <p className="small">
            Your delivery notes, links and review feedback remain in their fields.
            Check saved history before repeating a write.
          </p>
        </div>
      )}
      {message && (
        <p className="workspace-notice" role="status">
          {message}
        </p>
      )}
      {!work ? (
        <p>Loading submissions…</p>
      ) : (
        <>
          {!work.canAct && (
            <p className="policy-note">
              To submit or review, confirm funding with “Check transaction &
              chain state” below. Funding must have been checked within five
              minutes, with no pending transaction. Released or refunded work
              remains available as history.
            </p>
          )}
          <p className="small">
            Revision requests used: {used} / {agreement?.revisions ?? 0}. Review
            period: {agreement?.reviewDays ?? 0} calendar days. Deadlines do not
            automatically release tokens or open disputes.
          </p>
          {latest && (
            <p>
              <strong>
                {latest.review?.decision === "approved"
                  ? "Work approved · release is a separate step"
                  : latest.review?.decision === "revision_requested"
                    ? "Revisions requested"
                    : "Awaiting client review"}
              </strong>
            </p>
          )}
          {project.role === "freelancer" &&
            (!latest || latest.review?.decision === "revision_requested") && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    await api(
                      `/projects/${project.id}/work/submissions`,
                      "POST",
                      {
                        version: project.currentVersion,
                        expectedLatestId: latest?.id ?? null,
                        notes,
                        links: links
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean),
                      },
                    );
                  }, "Submission saved. Your client can now review this version.", () => {
                    setNotes("");
                    setLinks("");
                  });
                }}
              >
                <label>
                  Delivery notes
                  <textarea
                    required
                    maxLength={5000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
                <label>
                  Delivery links (one HTTPS URL per line)
                  <textarea
                    required
                    maxLength={20000}
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                  />
                </label>
                <p className="small">
                  Up to 10 links. Submission versions are permanent records;
                  submit only content you intend to share.
                </p>
                <button className="primary" disabled={busy || !work.canAct}>
                  Submit work for review
                </button>
              </form>
            )}
          {project.role === "client" && latest && !latest.review && (
            <div>
              <p>
                Review submission {latest.sequence} against the agreed
                acceptance criteria: {agreement?.milestones[0].criteria}
              </p>
              <label>
                Review feedback
                <textarea
                  maxLength={5000}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </label>
              <p className="small">
                Explain which agreed requirements need revision. Approval is
                final for this submission and cannot be edited.
              </p>
              <div className="button-row">
                <button
                  className="primary"
                  disabled={busy || !work.canAct}
                  onClick={() =>
                    void run(
                      () =>
                        api(`/projects/${project.id}/work/reviews`, "POST", {
                          submissionId: latest.id,
                          decision: "approved",
                          feedback,
                        }),
                      "Approval saved. Review the release in the testnet panel when ready.",
                    )
                  }
                >
                  Approve submitted work
                </button>
                <button
                  className="secondary"
                  disabled={
                    busy ||
                    !work.canAct ||
                    !feedback.trim() ||
                    used >= (agreement?.revisions ?? 0)
                  }
                  onClick={() =>
                    void run(async () => {
                      await api(
                        `/projects/${project.id}/work/reviews`,
                        "POST",
                        {
                          submissionId: latest.id,
                          decision: "revision_requested",
                          feedback,
                        },
                      );
                    }, "Revision request saved. The freelancer can submit a new version.", () => setFeedback(""))
                  }
                >
                  Request revisions
                </button>
              </div>
              {used >= (agreement?.revisions ?? 0) && (
                <p className="policy-note">
                  No agreed revision rounds remain. Discuss a separate agreement
                  or mutual refund if the work cannot be approved. Dispute
                  resolution is not implemented.
                </p>
              )}
            </div>
          )}
          {!latest && <p>No work submitted yet.</p>}
          {work.submissions.map((item) => (
            <article className="submission-record" key={item.id}>
              <h3>Submission {item.sequence}</h3>
              <p className="small">
                Submitted {utc(item.submittedAt)} · Review due{" "}
                {utc(item.reviewDueAt)}
                {!item.review && Date.now() > Date.parse(item.reviewDueAt)
                  ? " · Review overdue"
                  : ""}
              </p>
              <p className="work-text">{item.notes}</p>
              <ul>
                {item.links.map((link, index) => (
                  <li key={index}>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
              {item.review && (
                <>
                  <p>
                    <strong>
                      {item.review.decision === "approved"
                        ? "Approved"
                        : "Revisions requested"}
                    </strong>{" "}
                    · {utc(item.review.reviewedAt)}
                  </p>
                  <p className="work-text">
                    {item.review.feedback || "No additional feedback."}
                  </p>
                </>
              )}
            </article>
          ))}
        </>
      )}
    </section>
  );
}
