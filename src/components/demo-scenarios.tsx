"use client";

import { useState, type Dispatch } from "react";
import { type Action, type DemoState, type Role } from "@/lib/demo";
import { cents, payout, total } from "@/lib/agreement";

const amount = (value: number) => value.toFixed(2);
const date = (value: number) =>
  new Date(value).toISOString().replace("T", " ").replace(".000Z", " UTC");

// Imported only by /demo. No API, wallet, persistence or transaction calls.
export function DemoScenarios({
  state,
  role,
  dispatch,
  view,
}: {
  state: DemoState;
  role: Role;
  dispatch: Dispatch<Action>;
  view: string;
}) {
  const [allocation, setAllocation] = useState("0");
  const [reason, setReason] = useState(
    "Mutually agreed sample cancellation; refund the first milestone.",
  );
  const [error, setError] = useState("");
  const extra = state.extra;
  const settlement = state.settlement;
  const gross = cents(state.agreement.milestones[0].amount);
  const changePending = extra && ["pending", "unknown"].includes(extra.status);
  const canPropose = ["working", "review", "revision", "disputed"].includes(
    state.stage,
  );
  const previewValid =
    /^\d+(\.\d{1,2})?$/.test(allocation) && cents(allocation) <= gross;
  const payment = payout(
    settlement
      ? String(settlement.freelancerCents / 100)
      : previewValid
        ? allocation
        : "0",
  );
  const clientRefund = settlement
    ? settlement.clientCents / 100
    : (gross - cents(allocation)) / 100;

  return (
    <>
      {view === "Project workspace" && (
        <section
          className="panel detail-panel demo-scenario"
          aria-labelledby="extra-title"
        >
          <h2 id="extra-title">Funded extra work · simulation</h2>
          <p>
            Base agreement: {amount(total(state.agreement))} sample USDC. Change
            v1 adds an online store for 200.00 sample USDC and extends its
            affected schedule by three days. Original milestones and escrow
            allocations stay unchanged.
          </p>
          {!extra &&
            ["working", "review", "revision"].includes(state.stage) && (
              <button
                className="secondary"
                onClick={() => dispatch({ type: "propose-extra" })}
              >
                Propose sample online store
              </button>
            )}
          {!extra &&
            !["working", "review", "revision"].includes(state.stage) && (
              <p>
                Fund the first milestone before exploring an additional scope
                proposal.
              </p>
            )}
          {extra && (
            <>
              <p role="status">
                Change v1: {extra.status}. Proposed total:{" "}
                {amount(total(state.agreement) + 200)} sample USDC.
              </p>
              <p>
                {extra.scope} · Maya:{" "}
                {extra.accepted.client ? "accepted" : "not accepted"} · Tobi:{" "}
                {extra.accepted.freelancer ? "accepted" : "not accepted"}.
              </p>
              {extra.status === "proposed" &&
                ["working", "review", "revision"].includes(state.stage) && (
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={extra.accepted[role]}
                      onClick={() => dispatch({ type: "accept-extra", role })}
                    >
                      Accept change as {role}
                    </button>
                    <button
                      className="secondary"
                      onClick={() => dispatch({ type: "reject-extra", role })}
                    >
                      Reject sample change
                    </button>
                  </div>
                )}
              {extra.status === "rejected" && (
                <p>
                  Rejected proposal retained. No schedule, base scope or balance
                  changed. Reset the demo to explore another proposal.
                </p>
              )}
              {extra.status === "accepted" && (
                <>
                  <p>
                    Accepted is not funded. Next actor: Maya. Destination:
                    DEMO-CHANGE-ESCROW; deposit 200.00 sample USDC. No wallet or
                    network fee. Any eventual normal payout would illustrate a
                    0.60 fee and 199.40 net; payout of this extra work is
                    outside this scenario.
                  </p>
                  {role === "client" &&
                    ["working", "review", "revision"].includes(state.stage) && (
                      <button
                        className="primary"
                        onClick={() => dispatch({ type: "fund-extra", role })}
                      >
                        Simulate separate change funding
                      </button>
                    )}
                </>
              )}
              {changePending && (
                <div className="button-row">
                  <button
                    className="primary"
                    onClick={() => dispatch({ type: "confirm-extra" })}
                  >
                    Check change deposit · simulate confirmation
                  </button>
                  {extra.status === "pending" && (
                    <button
                      className="secondary"
                      onClick={() => dispatch({ type: "extra-unknown" })}
                    >
                      Simulate unknown change deposit
                    </button>
                  )}
                </div>
              )}
              {extra.status === "active" && (
                <p>
                  Extra work active: 200.00 sample USDC held separately. The
                  +3-day change schedule now applies to the added work; original
                  deadlines remain unchanged. These funds are not part of a
                  first-milestone settlement.
                </p>
              )}
            </>
          )}
          <p className="policy-note">
            Illustrative proposal only. Paid scope changes are not implemented
            in the persistent workspace or deployed escrow.
          </p>
        </section>
      )}

      {view === "Project workspace" &&
        state.stage === "review" &&
        state.reviewDeadline !== null && (
          <section
            className="panel detail-panel demo-scenario"
            aria-labelledby="silence-title"
          >
            <h2 id="silence-title">Client silence · demo clock</h2>
            <p>
              Sample clock: {date(state.now)}. Review deadline:{" "}
              {date(state.reviewDeadline)}.
            </p>
            <p>
              Next actor:{" "}
              {state.now >= state.reviewDeadline
                ? "Tobi may request a reviewer decision"
                : "Maya reviews the latest submission"}
              . No automatic payment occurs.
            </p>
            <p>
              Revision rounds used: {state.revisionsUsed} /{" "}
              {state.agreement.revisions}. A resubmission starts a fresh review
              window.
            </p>
            <div className="button-row">
              <button
                className="secondary"
                disabled={state.now >= state.reviewDeadline}
                onClick={() => dispatch({ type: "advance-day" })}
              >
                Advance demo clock one day
              </button>
              <button
                className="primary"
                disabled={
                  role !== "freelancer" || state.now < state.reviewDeadline
                }
                onClick={() => dispatch({ type: "escalate-silence", role })}
              >
                Request review after silence
              </button>
            </div>
          </section>
        )}

      {["Project workspace", "Resolution centre", "Wallet & receipts"].includes(
        view,
      ) && (
        <section
          className="panel detail-panel demo-scenario"
          aria-labelledby="settlement-title"
        >
          <h2 id="settlement-title">
            Cancellation & split settlement · simulation
          </h2>
          <p className="policy-note">
            Design exploration only: both sample participants must accept an
            exact allocation. No real reviewer, appeal policy, wallet or
            contract authority is added. The deployed escrow cannot perform this
            split. No real funds move.
          </p>
          {canPropose && view !== "Wallet & receipts" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!previewValid || !reason.trim() || reason.length > 2000) {
                  setError(
                    "Enter a valid allocation within the held first-milestone amount and a reason.",
                  );
                  return;
                }
                setError("");
                dispatch({
                  type: "propose-settlement",
                  kind: state.stage === "disputed" ? "split" : "cancellation",
                  freelancerAmount: allocation,
                  reason,
                });
              }}
            >
              <p>
                First milestone held: {amount(gross / 100)} sample USDC. Any
                funded extra work stays in its separate escrow.
              </p>
              <label htmlFor="demo-allocation">
                Freelancer gross allocation (sample USDC)
              </label>
              <input
                id="demo-allocation"
                inputMode="decimal"
                value={allocation}
                onChange={(event) => setAllocation(event.target.value)}
              />
              <label htmlFor="demo-settlement-reason">
                Settlement reason · fictional information only
              </label>
              <textarea
                id="demo-settlement-reason"
                maxLength={2000}
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              {previewValid && (
                <p>
                  Preview: Tobi gross {amount(payment.gross)}, illustrative fee{" "}
                  {amount(payment.fee)}, net {amount(payment.net)}; Maya refund{" "}
                  {amount(clientRefund)} sample USDC. Illustrative
                  refund/platform fees: 0; network fees not estimated.
                </p>
              )}
              {error && <p role="alert">{error}</p>}
              {changePending && (
                <p>
                  Check the existing change deposit before proposing a
                  settlement.
                </p>
              )}
              <button className="primary" disabled={!!changePending}>
                {state.stage === "disputed"
                  ? "Propose sample split decision"
                  : "Propose sample cancellation"}
              </button>
            </form>
          )}
          {settlement && (
            <>
              <h3>
                {settlement.kind === "split"
                  ? "Split decision"
                  : "Cancellation proposal"}{" "}
                · {settlement.status}
              </h3>
              <p>{settlement.reason}</p>
              <dl className="receipt">
                <div>
                  <dt>Freelancer gross allocation</dt>
                  <dd>{amount(payment.gross)} sample USDC</dd>
                </div>
                <div>
                  <dt>
                    Illustrative provider fee (0.3% of freelancer allocation)
                  </dt>
                  <dd>{amount(payment.fee)} sample USDC</dd>
                </div>
                <div>
                  <dt>Tobi · freelancer net</dt>
                  <dd>{amount(payment.net)} sample USDC</dd>
                </div>
                <div>
                  <dt>Maya · client refund (illustrative fee 0)</dt>
                  <dd>{amount(clientRefund)} sample USDC</dd>
                </div>
              </dl>
              <p>
                Maya:{" "}
                {settlement.accepted.client ? "authorized" : "not authorized"}.
                Tobi:{" "}
                {settlement.accepted.freelancer
                  ? "authorized"
                  : "not authorized"}
                .
              </p>
              {settlement.status === "proposed" && (
                <div className="button-row">
                  <button
                    className="primary"
                    disabled={settlement.accepted[role]}
                    onClick={() =>
                      dispatch({ type: "accept-settlement", role })
                    }
                  >
                    Accept settlement as {role}
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      dispatch({ type: "contest-settlement", role })
                    }
                  >
                    Contest settlement · retain funds
                  </button>
                </div>
              )}
              {settlement.status === "authorized" && (
                <>
                  <p>
                    Next actor: Maya submits the authorized sample settlement.
                    Funds are still held.
                  </p>
                  {role === "client" && (
                    <button
                      className="primary"
                      onClick={() =>
                        dispatch({ type: "submit-settlement", role })
                      }
                    >
                      Submit authorized sample settlement
                    </button>
                  )}
                </>
              )}
              {["pending", "unknown"].includes(settlement.status) && (
                <div className="button-row">
                  <button
                    className="primary"
                    onClick={() => dispatch({ type: "confirm-settlement" })}
                  >
                    Check settlement · simulate confirmation
                  </button>
                  {settlement.status === "pending" && (
                    <button
                      className="secondary"
                      onClick={() => dispatch({ type: "settlement-unknown" })}
                    >
                      Simulate unknown settlement
                    </button>
                  )}
                </div>
              )}
              {settlement.status === "confirmed" && (
                <p role="status">
                  Synthetic receipt DEMO-SETTLEMENT-001 ·{" "}
                  {state.agreement.title}, agreement v{state.agreementVersion},{" "}
                  {state.agreement.milestones[0].name} · Stellar demo / sample
                  USDC · {date(settlement.confirmedAt!)}. Confirmed only in
                  memory. Not a chain transaction or tax document; no reversal
                  or appeal is implied.
                </p>
              )}
            </>
          )}
          {!canPropose && !settlement && (
            <p>
              No settlement proposal. Begin with a funded milestone or open a
              sample dispute.
            </p>
          )}
        </section>
      )}
    </>
  );
}
