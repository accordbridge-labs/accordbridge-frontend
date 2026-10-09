import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, api, submissionUncertain } from "./api";
import { retrySafeRead } from "./connection";

test("explicit safe connection checks have a bounded three-attempt maximum", async () => {
  let attempts = 0;
  const progress: number[] = [];
  const waits: number[] = [];
  await retrySafeRead(
    async () => {
      attempts++;
      if (attempts < 3) throw new Error("backend still starting");
    },
    (attempt) => progress.push(attempt),
    async (ms) => {
      waits.push(ms);
    },
  );
  assert.equal(attempts, 3);
  assert.deepEqual(progress, [1, 2, 3]);
  assert.deepEqual(waits, [400, 800]);
});

test("connection checking stops at success and never loops indefinitely", async () => {
  let attempts = 0;
  await retrySafeRead(async () => {
    attempts++;
  });
  assert.equal(attempts, 1);

  await assert.rejects(
    retrySafeRead(
      async () => {
        attempts++;
        throw new Error("still unavailable");
      },
      () => {},
      async () => {},
    ),
    /still unavailable/,
  );
  assert.equal(attempts, 4);
});

test("a lost signed submission response is unknown and never automatically retried", async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async (_input, init) => {
    requests++;
    assert.equal(init?.method, "POST");
    throw new Error("Response lost after write");
  };
  try {
    await assert.rejects(
      api("/testnet/projects/one/submit", "POST", {
        intentId: "intent-1",
        signedXdr: "synthetic-only",
      }),
      (cause: unknown) =>
        cause instanceof ApiError &&
        cause.status === 503 &&
        submissionUncertain(cause),
    );
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test("a delayed gateway 503 distinguishes a safe read from an uncertain write", async () => {
  const original = globalThis.fetch;
  const methods: string[] = [];
  globalThis.fetch = async (_input, init) => {
    methods.push(init?.method ?? "GET");
    return new Response(
      JSON.stringify({
        code: "UPSTREAM_UNAVAILABLE",
        message: "Backend waking up",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  };
  try {
    await assert.rejects(
      api("/health"),
      (cause: unknown) =>
        cause instanceof ApiError && cause.outcome === "read_unavailable",
    );
    await assert.rejects(
      api("/projects", "POST", { title: "Synthetic" }),
      (cause: unknown) =>
        cause instanceof ApiError && cause.outcome === "unknown",
    );
    assert.deepEqual(methods, ["GET", "POST"]);
  } finally {
    globalThis.fetch = original;
  }
});
