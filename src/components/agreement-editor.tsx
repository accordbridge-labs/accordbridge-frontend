"use client";
import { useId, useRef, useState } from "react";
import { Agreement, emptyMilestone, agreementErrors } from "@/lib/agreement";

type DisplayContext = "demo" | "testnet";

const displayCopy = {
  demo: {
    amount: "Amount (USDC)",
    unit: "sample USDC",
    policy:
      "Sample USDC only. Illustrative provider fee: 0.3%, rounded to cents; platform fee: 0%. Network fees are not estimated. Reviewer escalation is a simulated scenario only. Resolver, cancellation and appeal terms remain unresolved, so these proposals cannot become live agreements.",
  },
  testnet: {
    amount: "Nominal agreement amount",
    unit: "nominal units",
    policy:
      "Agreement amounts are nominal terms for this experiment. Settlement uses ABUSD, which has no value and is not USDC. Only the first milestone is connected to Testnet escrow. There is no provider or platform fee; network fees use test XLM. No resolver or automatic escalation is available. A missed review deadline does not automatically release funds.",
  },
};

export function AgreementEditor({
  draft,
  onChange,
  onSave,
  onPublish,
  creating,
  context,
  participants,
}: {
  draft: Agreement;
  onChange: (draft: Agreement) => void;
  onSave: () => void;
  onPublish: () => void;
  creating: boolean;
  context: DisplayContext;
  participants?: string;
}) {
  const persistent = context === "testnet";
  const copy = displayCopy[context];
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? agreementErrors(draft) : [];
  const prefix = useId();
  const summary = useRef<HTMLDivElement>(null);
  const id = (field: string) => `${prefix}-${field}`;
  const attributes = (field: string) => ({
    id: id(field),
    "aria-invalid": errors.some((error) => error.field === field) || undefined,
    "aria-describedby": errors.some((error) => error.field === field)
      ? `${id(field)}-error`
      : undefined,
  });
  const field = <K extends keyof Agreement>(key: K, value: Agreement[K]) =>
    onChange({ ...draft, [key]: value });
  return (
    <section className="panel agreement-editor" aria-labelledby="editor-title">
      <span className="eyebrow">
        {persistent ? "PROJECT AGREEMENT BUILDER" : "SAMPLE AGREEMENT BUILDER"}
      </span>
      <h2 id="editor-title">
        {creating
          ? "Create a project agreement"
          : "Propose a new agreement version"}
      </h2>
      <p>
        {participants ??
          "Maya is the sample client; Tobi is the sample freelancer."}{" "}
        All dates use WAT (UTC+1), at 17:00. This is a development workspace;
        use fictional work details.
      </p>
      {creating && !persistent && (
        <p className="policy-note">
          Publishing replaces the current project in this single-project demo.
          Saving a draft leaves the current project unchanged.
        </p>
      )}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = agreementErrors(draft);
          setSubmitted(true);
          if (!next.length) onPublish();
          else requestAnimationFrame(() => summary.current?.focus());
        }}
      >
        {errors.length > 0 && (
          <div className="form-errors" role="alert" tabIndex={-1} ref={summary}>
            <strong>Check these fields before sending:</strong>
            <ul>
              {errors.map((error) => (
                <li key={error.field} id={`${id(error.field)}-error`}>
                  <a
                    href={`#${id(error.field)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById(id(error.field))?.focus();
                    }}
                  >
                    {error.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <label>
          Project title
          <input
            {...attributes("title")}
            value={draft.title}
            maxLength={100}
            onChange={(event) => field("title", event.target.value)}
          />
        </label>
        <label>
          Project description
          <textarea
            {...attributes("description")}
            value={draft.description}
            maxLength={2000}
            onChange={(event) => field("description", event.target.value)}
          />
        </label>
        <div className="editor-milestones">
          {draft.milestones.map((milestone, index) => {
            const change = (key: keyof typeof milestone, value: string) =>
              field(
                "milestones",
                draft.milestones.map((item, i) =>
                  i === index ? { ...item, [key]: value } : item,
                ),
              );
            return (
              <fieldset key={index}>
                <legend>Milestone {index + 1}</legend>
                <label>
                  Milestone name
                  <input
                    {...attributes(`milestones.${index}.name`)}
                    value={milestone.name}
                    maxLength={100}
                    onChange={(event) => change("name", event.target.value)}
                  />
                </label>
                <div className="terms-grid">
                  <label>
                    {copy.amount}
                    <input
                      inputMode="decimal"
                      {...attributes(`milestones.${index}.amount`)}
                      value={milestone.amount}
                      onChange={(event) => change("amount", event.target.value)}
                    />
                  </label>
                  <label>
                    Delivery date
                    <input
                      type="date"
                      {...attributes(`milestones.${index}.dueDate`)}
                      value={milestone.dueDate}
                      onChange={(event) =>
                        change("dueDate", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label>
                  Deliverables
                  <textarea
                    {...attributes(`milestones.${index}.scope`)}
                    value={milestone.scope}
                    maxLength={2000}
                    onChange={(event) => change("scope", event.target.value)}
                  />
                </label>
                <label>
                  Acceptance criteria (one per line)
                  <textarea
                    {...attributes(`milestones.${index}.criteria`)}
                    value={milestone.criteria}
                    maxLength={2000}
                    onChange={(event) => change("criteria", event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="secondary"
                  disabled={draft.milestones.length === 1}
                  onClick={() =>
                    field(
                      "milestones",
                      draft.milestones.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove milestone {index + 1}
                </button>
              </fieldset>
            );
          })}
        </div>
        <button
          type="button"
          className="secondary"
          {...attributes("milestones")}
          disabled={draft.milestones.length >= 10}
          onClick={() =>
            field("milestones", [...draft.milestones, emptyMilestone()])
          }
        >
          Add milestone
        </button>
        <label>
          Exclusions
          <textarea
            {...attributes("exclusions")}
            value={draft.exclusions}
            maxLength={2000}
            onChange={(event) => field("exclusions", event.target.value)}
          />
        </label>
        <div className="terms-grid">
          <label>
            Included revision rounds
            <input
              type="number"
              min={0}
              max={10}
              {...attributes("revisions")}
              value={Number.isNaN(draft.revisions) ? "" : draft.revisions}
              onChange={(event) =>
                field(
                  "revisions",
                  event.target.value === "" ? NaN : Number(event.target.value),
                )
              }
            />
          </label>
          <label>
            Review period (calendar days)
            <input
              type="number"
              min={1}
              max={30}
              {...attributes("reviewDays")}
              value={Number.isNaN(draft.reviewDays) ? "" : draft.reviewDays}
              onChange={(event) =>
                field(
                  "reviewDays",
                  event.target.value === "" ? NaN : Number(event.target.value),
                )
              }
            />
          </label>
        </div>
        <p className="policy-note">{copy.policy}</p>
        <div className="button-row">
          <button className="primary">Send for review</button>
          <button type="button" className="secondary" onClick={onSave}>
            Save draft & close
          </button>
        </div>
        <p className="small">
          {persistent
            ? "Save draft stores your edits privately in your account. Sending publishes a new version for your partner to review."
            : "Drafts last for this browser session in memory only. Refreshing clears them."}{" "}
          Sending resets both acceptances; it does not fund any work.
        </p>
      </form>
    </section>
  );
}

export function AgreementSummary({
  agreement,
  context,
}: {
  agreement: Agreement;
  context: DisplayContext;
}) {
  const copy = displayCopy[context];
  return (
    <div className="agreement-summary">
      <h3>{agreement.title}</h3>
      <p>{agreement.description}</p>
      {agreement.milestones.map((item, index) => (
        <article key={index}>
          <strong>
            {index + 1}. {item.name} · {item.amount} {copy.unit}
          </strong>
          <p>{item.scope}</p>
          <ul>
            {item.criteria
              .split("\n")
              .filter((line) => line.trim())
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
          <p className="small">Due {item.dueDate}, 17:00 WAT (UTC+1)</p>
        </article>
      ))}
      <p>
        {agreement.revisions} revision rounds · {agreement.reviewDays} calendar
        days for review
      </p>
      <p>Exclusions: {agreement.exclusions}</p>
      <p className="policy-note">{copy.policy}</p>
    </div>
  );
}
