import {
  Agreement,
  cents,
  payout,
  sampleAgreement,
  total,
  validateAgreement,
} from "./agreement";
export type Role = "client" | "freelancer";
export type Stage =
  | "agreement"
  | "unfunded"
  | "funding-pending"
  | "funding-unknown"
  | "funding-failed"
  | "working"
  | "review"
  | "revision"
  | "payment-pending"
  | "released"
  | "disputed"
  | "settling"
  | "settled";
export type ExtraWork = {
  status:
    "proposed" | "rejected" | "accepted" | "pending" | "unknown" | "active";
  accepted: Record<Role, boolean>;
  amount: string;
  scope: string;
  extensionDays: number;
};
export type Settlement = {
  kind: "cancellation" | "split";
  status: "proposed" | "authorized" | "pending" | "unknown" | "confirmed";
  freelancerCents: number;
  clientCents: number;
  reason: string;
  accepted: Record<Role, boolean>;
  confirmedAt?: number;
};
export type Submission = { version: number; notes: string };
export type DemoState = {
  agreement: Agreement;
  agreementVersion: number;
  history: {
    agreement: Agreement;
    version: number;
    accepted: Record<Role, boolean>;
  }[];
  stage: Stage;
  accepted: Record<Role, boolean>;
  submissions: Submission[];
  feedback: string;
  activity: string[];
  now: number;
  reviewDeadline: number | null;
  revisionsUsed: number;
  extra: ExtraWork | null;
  settlement: Settlement | null;
};
export type Action =
  | { type: "accept"; role: Role; version: number }
  | { type: "publish-agreement"; agreement: Agreement; version: number }
  | { type: "create-agreement"; agreement: Agreement }
  | { type: "fund"; role: Role }
  | { type: "funding-unknown" }
  | { type: "fail-funding" }
  | { type: "confirm-funding" }
  | { type: "submit"; role: Role; notes: string }
  | { type: "revise"; role: Role; feedback: string }
  | { type: "approve"; role: Role }
  | { type: "confirm-payment" }
  | { type: "dispute"; role: Role }
  | { type: "advance-day" }
  | { type: "escalate-silence"; role: Role }
  | { type: "propose-extra" }
  | { type: "accept-extra"; role: Role }
  | { type: "reject-extra"; role: Role }
  | { type: "fund-extra"; role: Role }
  | { type: "extra-unknown" }
  | { type: "confirm-extra" }
  | {
      type: "propose-settlement";
      kind: "cancellation" | "split";
      freelancerAmount: string;
      reason: string;
    }
  | { type: "accept-settlement"; role: Role }
  | { type: "contest-settlement"; role: Role }
  | { type: "submit-settlement"; role: Role }
  | { type: "settlement-unknown" }
  | { type: "confirm-settlement" }
  | { type: "reset"; scenario: "new" | "funded" | "review" };

export function initialState(
  scenario: "new" | "funded" | "review" = "new",
): DemoState {
  return {
    agreement: sampleAgreement(),
    agreementVersion: 1,
    history: [],
    now: Date.UTC(2026, 9, 18, 12),
    reviewDeadline: scenario === "review" ? Date.UTC(2026, 9, 25, 12) : null,
    revisionsUsed: 0,
    extra: null,
    settlement: null,
    stage:
      scenario === "new"
        ? "agreement"
        : scenario === "funded"
          ? "working"
          : "review",
    accepted: { client: scenario !== "new", freelancer: scenario !== "new" },
    submissions:
      scenario === "review"
        ? [
            {
              version: 1,
              notes:
                "Five page layouts with desktop and mobile variants are ready for review. Sample evidence only.",
            },
          ]
        : [],
    feedback: "",
    activity: [
      scenario === "new"
        ? "Agreement v1 prepared for both parties."
        : "Sample design milestone funding confirmed: 150 USDC.",
    ],
  };
}

// Prototype transitions only. This is not a contract or a production authorization boundary.
export function demoReducer(state: DemoState, action: Action): DemoState {
  const update = (patch: Partial<DemoState>, event: string): DemoState => ({
    ...state,
    ...patch,
    activity: [event, ...state.activity],
  });
  switch (action.type) {
    case "create-agreement":
      if (validateAgreement(action.agreement).length) return state;
      return {
        ...initialState(),
        agreement: structuredClone(action.agreement),
      };
    case "publish-agreement":
      if (
        !["agreement", "unfunded"].includes(state.stage) ||
        action.version !== state.agreementVersion ||
        validateAgreement(action.agreement).length
      )
        return state;
      if (JSON.stringify(action.agreement) === JSON.stringify(state.agreement))
        return state;
      return update(
        {
          agreement: structuredClone(action.agreement),
          agreementVersion: state.agreementVersion + 1,
          accepted: { client: false, freelancer: false },
          stage: "agreement",
          history: [
            ...state.history,
            {
              agreement: structuredClone(state.agreement),
              version: state.agreementVersion,
              accepted: { ...state.accepted },
            },
          ],
        },
        `Agreement v${state.agreementVersion + 1} proposed. Both parties must accept again.`,
      );
    case "reset":
      return initialState(action.scenario);
    case "accept": {
      if (
        state.stage !== "agreement" ||
        state.accepted[action.role] ||
        action.version !== state.agreementVersion
      )
        return state;
      const accepted = { ...state.accepted, [action.role]: true };
      return update(
        {
          accepted,
          stage:
            accepted.client && accepted.freelancer ? "unfunded" : "agreement",
        },
        `${action.role === "client" ? "Maya" : "Tobi"} accepted agreement v${state.agreementVersion} in this demo.`,
      );
    }
    case "fund":
      if (
        action.role !== "client" ||
        !["unfunded", "funding-failed"].includes(state.stage)
      )
        return state;
      return update(
        { stage: "funding-pending" },
        "Simulated funding submitted; confirmation pending.",
      );
    case "funding-unknown":
      if (state.stage !== "funding-pending") return state;
      return update(
        { stage: "funding-unknown" },
        "Funding outcome unknown. Check the existing transaction before retrying.",
      );
    case "fail-funding":
      if (!["funding-pending", "funding-unknown"].includes(state.stage))
        return state;
      return update(
        { stage: "funding-failed" },
        "Demo check reports a confirmed failed deposit, not a timeout. No funds moved; Maya may explicitly try again.",
      );
    case "confirm-funding":
      if (!["funding-pending", "funding-unknown"].includes(state.stage))
        return state;
      return update(
        { stage: "working" },
        `Sample ${state.agreement.milestones[0].name} funding confirmed: ${state.agreement.milestones[0].amount} USDC. Other milestones remain unfunded.`,
      );
    case "submit":
      if (
        action.role !== "freelancer" ||
        !["working", "revision"].includes(state.stage) ||
        !action.notes.trim()
      )
        return state;
      const version = state.submissions.length + 1;
      return update(
        {
          stage: "review",
          reviewDeadline: state.now + state.agreement.reviewDays * 86400000,
          submissions: [
            ...state.submissions,
            { version, notes: action.notes.trim() },
          ],
        },
        `Tobi submitted ${state.agreement.milestones[0].name} v${version} under agreement v${state.agreementVersion}.`,
      );
    case "revise":
      if (
        action.role !== "client" ||
        state.stage !== "review" ||
        !action.feedback.trim() ||
        state.revisionsUsed >= state.agreement.revisions
      )
        return state;
      return update(
        {
          stage: "revision",
          feedback: action.feedback.trim(),
          reviewDeadline: null,
          revisionsUsed: state.revisionsUsed + 1,
        },
        `Maya requested a revision to submission v${state.submissions.length}: ${action.feedback.trim()}`,
      );
    case "approve":
      if (action.role !== "client" || state.stage !== "review") return state;
      return update(
        { stage: "payment-pending" },
        `Maya approved submission v${state.submissions.length}; payment is still pending.`,
      );
    case "confirm-payment":
      if (state.stage !== "payment-pending") return state;
      return update(
        { stage: "released" },
        `Simulated payout confirmed: ${payout(state.agreement.milestones[0].amount).net} USDC net to Tobi, ${payout(state.agreement.milestones[0].amount).fee} USDC illustrative provider fee.`,
      );
    case "dispute":
      if (!["working", "review", "revision"].includes(state.stage))
        return state;
      return update(
        { stage: "disputed" },
        `${action.role === "client" ? "Maya" : "Tobi"} requested a reviewer decision. Funds remain held.`,
      );
    case "advance-day":
      if (
        state.stage !== "review" ||
        state.reviewDeadline === null ||
        state.now >= state.reviewDeadline
      )
        return state;
      return update(
        { now: state.now + 86400000 },
        "Demo clock advanced one day; no automatic payment.",
      );
    case "escalate-silence":
      if (
        action.role !== "freelancer" ||
        state.stage !== "review" ||
        state.reviewDeadline === null ||
        state.now < state.reviewDeadline
      )
        return state;
      return update(
        { stage: "disputed" },
        "Tobi requested review after the sample deadline. No automatic release; no real reviewer contacted.",
      );
    case "propose-extra":
      if (
        state.extra ||
        !["working", "review", "revision"].includes(state.stage)
      )
        return state;
      return update(
        {
          extra: {
            status: "proposed",
            amount: "200",
            scope: "Add an online store",
            extensionDays: 3,
            accepted: { client: false, freelancer: false },
          },
        },
        "Separate change v1 proposed: online store, 200 sample USDC, +3 days. Base agreement unchanged.",
      );
    case "accept-extra": {
      if (
        state.extra?.status !== "proposed" ||
        !["working", "review", "revision"].includes(state.stage)
      )
        return state;
      if (state.extra.accepted[action.role]) return state;
      const accepted = { ...state.extra.accepted, [action.role]: true };
      return update(
        {
          extra: {
            ...state.extra,
            accepted,
            status:
              accepted.client && accepted.freelancer ? "accepted" : "proposed",
          },
        },
        `${action.role} accepted change v1. Separate confirmed funding is still required.`,
      );
    }
    case "reject-extra":
      if (state.extra?.status !== "proposed") return state;
      return update(
        { extra: { ...state.extra, status: "rejected" } },
        `${action.role} rejected change v1; proposal retained, original work unchanged.`,
      );
    case "fund-extra":
      if (
        action.role !== "client" ||
        state.extra?.status !== "accepted" ||
        !["working", "review", "revision"].includes(state.stage)
      )
        return state;
      return update(
        { extra: { ...state.extra, status: "pending" } },
        "Separate change deposit submitted to DEMO-CHANGE-ESCROW; not yet confirmed.",
      );
    case "extra-unknown":
      if (state.extra?.status !== "pending") return state;
      return update(
        { extra: { ...state.extra, status: "unknown" } },
        "Change funding unknown. Check the existing deposit; do not fund again.",
      );
    case "confirm-extra":
      if (!state.extra || !["pending", "unknown"].includes(state.extra.status))
        return state;
      return update(
        { extra: { ...state.extra, status: "active" } },
        "Separate 200 sample USDC deposit confirmed. Online store work active; +3-day change schedule applies. Base escrow untouched.",
      );
    case "propose-settlement": {
      if (
        action.kind === "split"
          ? state.stage !== "disputed"
          : !["working", "review", "revision"].includes(state.stage)
      )
        return state;
      if (state.extra && ["pending", "unknown"].includes(state.extra.status))
        return state;
      const gross = cents(state.agreement.milestones[0].amount);
      const allocation = cents(action.freelancerAmount);
      if (
        !/^\d+(\.\d{1,2})?$/.test(action.freelancerAmount) ||
        !Number.isSafeInteger(allocation) ||
        allocation < 0 ||
        allocation > gross ||
        !action.reason.trim() ||
        action.reason.length > 2000
      )
        return state;
      return update(
        {
          stage: "settling",
          settlement: {
            kind: action.kind,
            status: "proposed",
            freelancerCents: allocation,
            clientCents: gross - allocation,
            reason: action.reason.trim(),
            accepted: { client: false, freelancer: false },
          },
        },
        `${action.kind} proposal recorded for the first milestone only. Both parties must authorize this illustrative settlement; no tokens moved.`,
      );
    }
    case "accept-settlement": {
      if (
        state.stage !== "settling" ||
        state.settlement?.status !== "proposed" ||
        state.settlement.accepted[action.role]
      )
        return state;
      const accepted = { ...state.settlement.accepted, [action.role]: true };
      return update(
        {
          settlement: {
            ...state.settlement,
            accepted,
            status:
              accepted.client && accepted.freelancer
                ? "authorized"
                : "proposed",
          },
        },
        `${action.role} accepted the exact sample settlement. Authorization is not payment confirmation.`,
      );
    }
    case "contest-settlement":
      if (state.stage !== "settling" || state.settlement?.status !== "proposed")
        return state;
      return update(
        { stage: "disputed", settlement: null },
        `${action.role} contested settlement (${state.settlement.freelancerCents / 100} to freelancer, ${state.settlement.clientCents / 100} refund): ${state.settlement.reason}. Funds retained for review.`,
      );
    case "submit-settlement":
      if (
        action.role !== "client" ||
        state.stage !== "settling" ||
        state.settlement?.status !== "authorized"
      )
        return state;
      return update(
        { settlement: { ...state.settlement, status: "pending" } },
        "Authorized sample settlement submitted; funds remain held pending confirmation.",
      );
    case "settlement-unknown":
      if (state.settlement?.status !== "pending") return state;
      return update(
        { settlement: { ...state.settlement, status: "unknown" } },
        "Settlement outcome unknown. Check this settlement; do not submit another.",
      );
    case "confirm-settlement":
      if (
        state.stage !== "settling" ||
        !state.settlement ||
        !["pending", "unknown"].includes(state.settlement.status)
      )
        return state;
      return update(
        {
          stage: "settled",
          settlement: {
            ...state.settlement,
            status: "confirmed",
            confirmedAt: state.now,
          },
        },
        "Synthetic settlement confirmed once. Receipt available; no real payment or reversible blockchain action.",
      );
  }
}

export function balances(state: DemoState) {
  const locked = [
    "working",
    "review",
    "revision",
    "payment-pending",
    "disputed",
    "settling",
  ].includes(state.stage)
    ? payout(state.agreement.milestones[0].amount).gross
    : 0;
  const released =
    state.stage === "settled"
      ? (state.settlement?.freelancerCents ?? 0) / 100
      : state.stage === "released"
        ? payout(state.agreement.milestones[0].amount).gross
        : 0;
  const refunded =
    state.stage === "settled" ? (state.settlement?.clientCents ?? 0) / 100 : 0;
  const extraHeld =
    state.extra?.status === "active" ? cents(state.extra.amount) / 100 : 0;
  const extraTotal =
    state.extra && !["proposed", "rejected"].includes(state.extra.status)
      ? cents(state.extra.amount) / 100
      : 0;
  return {
    locked: locked + extraHeld,
    released,
    refunded,
    disputed:
      state.stage === "disputed" ||
      (state.stage === "settling" && state.settlement?.kind === "split")
        ? locked
        : 0,
    unfunded:
      Math.round(
        (total(state.agreement) +
          extraTotal -
          locked -
          extraHeld -
          released -
          refunded) *
          100,
      ) / 100,
  };
}

export const stageLabels: Record<Stage, string> = {
  agreement: "Awaiting acceptance",
  unfunded: "Awaiting funding",
  "funding-pending": "Funding pending",
  "funding-unknown": "Funding outcome unknown",
  "funding-failed": "Funding confirmed failed · no deposit",
  working: "Ready for work",
  review: "Ready for review",
  revision: "Revision requested",
  "payment-pending": "Approved · payment pending",
  released: "Payment confirmed",
  disputed: "Reviewer decision pending",
  settling: "Settlement awaiting confirmation",
  settled: "Sample settlement confirmed",
};
