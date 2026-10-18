import assert from "node:assert/strict";
import test from "node:test";
import { balances, demoReducer as reduce, initialState } from "./demo";
import { sampleAgreement, validateAgreement } from "./agreement";

test("published revisions invalidate acceptance, reject stale actions, and preserve history", () => {
  let state = initialState();
  state = reduce(state, { type: "accept", role: "client", version: 1 });
  state = reduce(state, { type: "accept", role: "freelancer", version: 1 });
  const proposal = structuredClone(state.agreement);
  proposal.milestones[0].amount = "225.50";
  state = reduce(state, {
    type: "publish-agreement",
    agreement: proposal,
    version: 1,
  });
  proposal.milestones[0].amount = "999";
  assert.equal(state.agreement.milestones[0].amount, "225.50");
  assert.equal(state.agreementVersion, 2);
  assert.deepEqual(state.accepted, { client: false, freelancer: false });
  assert.equal(state.history[0].agreement.milestones[0].amount, "150");
  assert.deepEqual(state.history[0].accepted, {
    client: true,
    freelancer: true,
  });
  assert.equal(
    reduce(state, { type: "accept", role: "client", version: 1 }),
    state,
  );
  assert.equal(
    reduce(state, {
      type: "publish-agreement",
      agreement: sampleAgreement(),
      version: 1,
    }),
    state,
  );
  assert.equal(reduce(state, { type: "fund", role: "client" }), state);
  state = reduce(state, { type: "accept", role: "client", version: 2 });
  state = reduce(state, { type: "accept", role: "freelancer", version: 2 });
  state = reduce(state, { type: "fund", role: "client" });
  assert.equal(
    reduce(state, {
      type: "publish-agreement",
      agreement: sampleAgreement(),
      version: 2,
    }),
    state,
  );
  state = reduce(state, { type: "confirm-funding" });
  assert.deepEqual(balances(state), {
    locked: 225.5,
    released: 0,
    refunded: 0,
    disputed: 0,
    unfunded: 450,
  });
});

test("incomplete proposals, invalid amounts, and impossible dates cannot publish", () => {
  const state = initialState();
  for (const amount of ["", "0", "-1", "1.001", "Infinity", "1e3", "1000001"]) {
    const proposal = sampleAgreement();
    proposal.milestones[0].amount = amount;
    assert.equal(
      reduce(state, {
        type: "publish-agreement",
        agreement: proposal,
        version: 1,
      }),
      state,
    );
  }
  const invalid = sampleAgreement();
  invalid.milestones[0].dueDate = "2026-02-30";
  invalid.milestones[0].criteria = " ";
  assert.equal(validateAgreement(invalid).length, 2);
  assert.equal(
    reduce(state, { type: "create-agreement", agreement: invalid }),
    state,
  );
});

test("funding requires both parties and cannot settle on submission alone", () => {
  let state = initialState();
  assert.equal(reduce(state, { type: "fund", role: "client" }), state);
  state = reduce(state, { type: "accept", role: "client", version: 1 });
  assert.equal(reduce(state, { type: "fund", role: "client" }), state);
  state = reduce(state, { type: "accept", role: "freelancer", version: 1 });
  assert.equal(reduce(state, { type: "fund", role: "freelancer" }), state);
  state = reduce(state, { type: "fund", role: "client" });
  assert.equal(balances(state).locked, 0);
  state = reduce(state, { type: "funding-unknown" });
  assert.equal(reduce(state, { type: "fund", role: "client" }), state);
  assert.equal(
    reduce(state, { type: "submit", role: "freelancer", notes: "Work" }),
    state,
  );
  state = reduce(state, { type: "confirm-funding" });
  assert.deepEqual(balances(state), {
    locked: 150,
    released: 0,
    refunded: 0,
    disputed: 0,
    unfunded: 450,
  });
});

test("revisions preserve versions; approval and release are separate", () => {
  let state = initialState("funded");
  assert.equal(
    reduce(state, { type: "submit", role: "client", notes: "Wrong role" }),
    state,
  );
  state = reduce(state, {
    type: "submit",
    role: "freelancer",
    notes: "Original layouts",
  });
  assert.equal(reduce(state, { type: "approve", role: "freelancer" }), state);
  assert.equal(reduce(state, { type: "confirm-payment" }), state);
  state = reduce(state, {
    type: "revise",
    role: "client",
    feedback: "Add mobile contact layout",
  });
  state = reduce(state, {
    type: "submit",
    role: "freelancer",
    notes: "Updated layouts",
  });
  assert.deepEqual(state.submissions, [
    { version: 1, notes: "Original layouts" },
    { version: 2, notes: "Updated layouts" },
  ]);
  state = reduce(state, { type: "approve", role: "client" });
  assert.equal(balances(state).locked, 150);
  assert.equal(balances(state).released, 0);
  state = reduce(state, { type: "confirm-payment" });
  assert.deepEqual(balances(state), {
    locked: 0,
    released: 150,
    refunded: 0,
    disputed: 0,
    unfunded: 450,
  });
  assert.equal(reduce(state, { type: "confirm-payment" }), state);
  assert.equal(reduce(state, { type: "dispute", role: "client" }), state);
});

test("disputed funds remain a subset of held funds and block payout", () => {
  const state = reduce(initialState("review"), {
    type: "dispute",
    role: "client",
  });
  assert.deepEqual(balances(state), {
    locked: 150,
    released: 0,
    refunded: 0,
    disputed: 150,
    unfunded: 450,
  });
  assert.equal(reduce(state, { type: "approve", role: "client" }), state);
  assert.equal(reduce(state, { type: "confirm-payment" }), state);
});

test("extra scope requires fresh acceptance and separate confirmed funding", () => {
  let state = reduce(initialState("funded"), { type: "propose-extra" });
  const original = structuredClone(state.agreement);
  assert.equal(balances(state).locked, 150);
  assert.equal(balances(state).unfunded, 450);
  assert.equal(reduce(state, { type: "fund-extra", role: "client" }), state);
  state = reduce(state, { type: "accept-extra", role: "client" });
  assert.equal(reduce(state, { type: "fund-extra", role: "client" }), state);
  state = reduce(state, { type: "accept-extra", role: "freelancer" });
  assert.equal(balances(state).unfunded, 650);
  assert.equal(
    reduce(state, { type: "fund-extra", role: "freelancer" }),
    state,
  );
  state = reduce(state, { type: "fund-extra", role: "client" });
  state = reduce(state, { type: "extra-unknown" });
  assert.equal(reduce(state, { type: "fund-extra", role: "client" }), state);
  assert.equal(
    reduce(state, {
      type: "propose-settlement",
      kind: "cancellation",
      freelancerAmount: "0",
      reason: "Cancel",
    }),
    state,
  );
  assert.equal(balances(state).locked, 150);
  state = reduce(state, { type: "confirm-extra" });
  assert.equal(balances(state).locked, 350);
  assert.equal(balances(state).unfunded, 450);
  assert.deepEqual(state.agreement, original);
  assert.equal(reduce(state, { type: "confirm-extra" }), state);
  const rejected = reduce(
    reduce(initialState("funded"), { type: "propose-extra" }),
    { type: "reject-extra", role: "freelancer" },
  );
  assert.equal(rejected.extra?.status, "rejected");
  assert.equal(balances(rejected).unfunded, 450);
  assert.equal(
    reduce(rejected, { type: "accept-extra", role: "client" }),
    rejected,
  );
});

test("a confirmed failed deposit permits an explicit retry, unlike an unknown result", () => {
  let state = initialState();
  state = reduce(state, { type: "accept", role: "client", version: 1 });
  state = reduce(state, { type: "accept", role: "freelancer", version: 1 });
  state = reduce(state, { type: "fund", role: "client" });
  state = reduce(state, { type: "funding-unknown" });
  assert.equal(reduce(state, { type: "fund", role: "client" }), state);
  state = reduce(state, { type: "fail-funding" });
  assert.equal(balances(state).locked, 0);
  assert.equal(reduce(state, { type: "confirm-funding" }), state);
  state = reduce(state, { type: "fund", role: "client" });
  state = reduce(state, { type: "confirm-funding" });
  assert.equal(balances(state).locked, 150);
  assert.equal(reduce(state, { type: "fail-funding" }), state);
});

test("silence requires elapsed demo deadline and never automatically settles", () => {
  let state = initialState("review");
  assert.equal(
    reduce(state, { type: "escalate-silence", role: "freelancer" }),
    state,
  );
  for (let day = 0; day < 7; day++)
    state = reduce(state, { type: "advance-day" });
  assert.equal(state.now, state.reviewDeadline);
  assert.equal(state.stage, "review");
  assert.equal(balances(state).released, 0);
  assert.equal(
    reduce(state, { type: "escalate-silence", role: "client" }),
    state,
  );
  state = reduce(state, { type: "escalate-silence", role: "freelancer" });
  assert.equal(state.stage, "disputed");
  assert.equal(balances(state).locked, 150);
  assert.equal(reduce(state, { type: "approve", role: "client" }), state);
});

test("revision rounds are bounded and resubmission resets the review deadline", () => {
  let state = reduce(initialState("review"), { type: "advance-day" });
  const previous = state.reviewDeadline!;
  for (let round = 0; round < 2; round++) {
    state = reduce(state, {
      type: "revise",
      role: "client",
      feedback: "Missing criterion",
    });
    assert.equal(state.reviewDeadline, null);
    state = reduce(state, {
      type: "submit",
      role: "freelancer",
      notes: "Updated sample",
    });
  }
  assert.equal(state.reviewDeadline, previous + 86400000);
  assert.equal(state.submissions.length, 3);
  assert.equal(
    reduce(state, { type: "revise", role: "client", feedback: "Again" }),
    state,
  );
});

test("cancellation and split conserve cents and require authorization, submission and confirmation", () => {
  for (const allocation of ["0", "0.01", "75.55", "150"]) {
    for (const kind of ["cancellation", "split"] as const) {
      let state = initialState("funded");
      if (kind === "split")
        state = reduce(state, { type: "dispute", role: "freelancer" });
      state = reduce(state, {
        type: "propose-settlement",
        kind,
        freelancerAmount: allocation,
        reason: "Sample allocation agreed",
      });
      assert.equal(state.stage, "settling");
      assert.equal(reduce(state, { type: "confirm-settlement" }), state);
      assert.equal(reduce(state, { type: "approve", role: "client" }), state);
      state = reduce(state, { type: "accept-settlement", role: "client" });
      assert.equal(
        reduce(state, { type: "submit-settlement", role: "client" }),
        state,
      );
      state = reduce(state, { type: "accept-settlement", role: "freelancer" });
      assert.equal(
        reduce(state, { type: "submit-settlement", role: "freelancer" }),
        state,
      );
      state = reduce(state, { type: "submit-settlement", role: "client" });
      state = reduce(state, { type: "settlement-unknown" });
      assert.equal(balances(state).locked, 150);
      assert.equal(balances(state).refunded, 0);
      assert.equal(
        reduce(state, { type: "submit-settlement", role: "client" }),
        state,
      );
      state = reduce(state, { type: "confirm-settlement" });
      const b = balances(state);
      assert.equal(
        Math.round((b.locked + b.released + b.refunded + b.unfunded) * 100),
        60000,
      );
      assert.equal(b.released, Number(allocation));
      assert.equal(state.settlement?.confirmedAt, state.now);
      for (const action of [
        { type: "confirm-settlement" },
        { type: "dispute", role: "client" },
        { type: "confirm-payment" },
      ] as const)
        assert.equal(reduce(state, action), state);
    }
  }
});

test("invalid allocations are rejected; contested proposals preserve evidence and held funds", () => {
  const state = initialState("funded");
  for (const value of ["", "-1", "150.01", "1.001", "Infinity", "1e2", "NaN"]) {
    assert.equal(
      reduce(state, {
        type: "propose-settlement",
        kind: "cancellation",
        freelancerAmount: value,
        reason: "Cancel",
      }),
      state,
    );
  }
  assert.equal(
    reduce(state, {
      type: "propose-settlement",
      kind: "split",
      freelancerAmount: "75",
      reason: "Split",
    }),
    state,
  );
  assert.equal(
    reduce(state, {
      type: "propose-settlement",
      kind: "cancellation",
      freelancerAmount: "0",
      reason: " ",
    }),
    state,
  );
  const proposed = reduce(state, {
    type: "propose-settlement",
    kind: "cancellation",
    freelancerAmount: "25",
    reason: "Partial work",
  });
  const contested = reduce(proposed, {
    type: "contest-settlement",
    role: "freelancer",
  });
  assert.equal(contested.stage, "disputed");
  assert.equal(balances(contested).disputed, 150);
  assert.match(
    contested.activity[0],
    /25 to freelancer, 125 refund.*Partial work/,
  );
  assert.equal(reduce(contested, { type: "confirm-settlement" }), contested);
});

test("first-milestone settlement never consumes the separately funded change", () => {
  let state = initialState("funded");
  for (const action of [
    { type: "propose-extra" },
    { type: "accept-extra", role: "client" },
    { type: "accept-extra", role: "freelancer" },
    { type: "fund-extra", role: "client" },
    { type: "confirm-extra" },
    {
      type: "propose-settlement",
      kind: "cancellation",
      freelancerAmount: "0",
      reason: "Cancel base milestone only",
    },
    { type: "accept-settlement", role: "client" },
    { type: "accept-settlement", role: "freelancer" },
    { type: "submit-settlement", role: "client" },
    { type: "confirm-settlement" },
  ] as const)
    state = reduce(state, action);
  assert.deepEqual(balances(state), {
    locked: 200,
    released: 0,
    refunded: 150,
    disputed: 0,
    unfunded: 450,
  });
  const reset = reduce(state, { type: "reset", scenario: "new" });
  assert.equal(reset.extra, null);
  assert.equal(reset.settlement, null);
});
