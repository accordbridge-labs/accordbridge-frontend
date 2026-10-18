import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { chromium, request } from "@playwright/test";

// Separate from Freighter acceptance: no wallet, signatures or chain writes.
// Credentials exist only in memory; never enable request tracing for this run.
const origin = "https://accordbridge-frontend.vercel.app";
const createFixtures = process.argv.includes("--create-fixtures");
const results = { observedAt: new Date().toISOString(), origin, checks: [] };
const contexts = [];
const credentials = [];
let browser;
function passed(name) {
  results.checks.push({ name, result: "PASS" });
}
async function call(context, route, method = "GET", data) {
  const response = await context.fetch(`${origin}/api${route}`, {
    method,
    data,
    timeout: 25000,
    headers: { origin, "x-accordbridge-request": "1" },
  });
  return { response, body: await response.json() };
}
try {
  const anonymous = await request.newContext();
  contexts.push(anonymous);
  assert.equal((await call(anonymous, "/health")).response.status(), 200);
  assert.equal((await call(anonymous, "/auth/me")).response.status(), 401);
  assert.equal(
    (await call(anonymous, "/testnet/readiness")).response.status(),
    401,
  );
  passed("Public health and authenticated endpoint boundaries");
  const wrongOrigin = await anonymous.post(`${origin}/api/auth/login`, {
    headers: {
      origin: "https://unrelated.example",
      "x-accordbridge-request": "1",
    },
    data: {},
    timeout: 25000,
  });
  assert.equal(wrongOrigin.status(), 403);
  passed("Cross-origin mutation rejected before authentication");
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  passed("Public page renders sign-in interface in Chromium");
  if (createFixtures) {
    const ids = [];
    for (const name of ["Verification Client", "Verification Freelancer"]) {
      const context = await request.newContext();
      contexts.push(context);
      const data = {
        name,
        email: `verification-${randomUUID()}@example.test`,
        password: randomBytes(32).toString("hex"),
      };
      credentials.push(data);
      const { response, body } = await call(
        context,
        "/auth/register",
        "POST",
        data,
      );
      assert.equal(response.status(), 201);
      ids.push(body.user.id);
      const cookie = (await context.storageState()).cookies.find(
        (c) => c.name === "accordbridge_session",
      );
      assert.ok(cookie?.httpOnly && cookie?.secure);
      assert.equal(cookie.sameSite, "Lax");
    }
    results.fixtures =
      "Two synthetic example.test accounts were created; account deletion is not implemented. No credentials retained.";
    const [a, b] = contexts.slice(1);
    assert.notEqual(ids[0], ids[1]);
    assert.equal((await call(a, "/auth/me")).body.user.id, ids[0]);
    assert.equal((await call(b, "/auth/me")).body.user.id, ids[1]);
    passed(
      "Separate hosted accounts and Secure/HttpOnly/SameSite session cookies",
    );
    const dueDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .slice(0, 10);
    const agreement = {
      title: "Synthetic hosted verification — no funds",
      description: "Automated HTTP preflight only",
      exclusions: "No real work, wallets or payments",
      revisions: 1,
      reviewDays: 7,
      milestones: [
        {
          name: "Synthetic deliverable",
          amount: "1.00",
          scope: "Test fixture",
          criteria: "Persistence only",
          dueDate,
        },
      ],
    };
    const created = await call(a, "/projects", "POST", {
      counterpartyId: ids[1],
      role: "client",
      agreement,
    });
    assert.equal(created.response.status(), 201);
    const id = created.body.id;
    results.fixtures +=
      " One unfunded synthetic project remains for those accounts.";
    assert.equal(
      (
        await call(a, `/projects/${id}/publish`, "POST", {
          expectedVersion: 0,
          expectedRevision: 1,
        })
      ).response.status(),
      201,
    );
    for (const context of [a, b])
      assert.equal(
        (
          await call(context, `/projects/${id}/accept`, "POST", { version: 1 })
        ).response.status(),
        201,
      );
    const project = (await call(a, `/projects/${id}`)).body;
    assert.equal(project.versions[0].acceptances.length, 2);
    assert.equal(project.fundingStarted, false);
    assert.equal(
      (await call(anonymous, `/projects/${id}`)).response.status(),
      401,
    );
    passed("Publish and independently accept one agreement; no funding starts");
    assert.equal(
      (await call(b, "/auth/logout", "POST")).response.status(),
      201,
    );
    assert.equal((await call(b, "/auth/me")).response.status(), 401);
    assert.equal((await call(a, "/auth/me")).body.user.id, ids[0]);
    const { email, password } = credentials[1];
    assert.equal(
      (
        await call(b, "/auth/login", "POST", { email, password })
      ).response.status(),
      201,
    );
    assert.equal(
      (await call(b, `/projects/${id}`)).body.versions[0].acceptances.length,
      2,
    );
    passed("Logout isolates accounts; a new session reads persisted agreement");
    const diagnostic = await call(a, "/testnet/readiness");
    results.readiness = {
      httpStatus: diagnostic.response.status(),
      status: diagnostic.body.status ?? "unavailable",
    };
    assert.equal(diagnostic.response.status(), 200);
    assert.equal(diagnostic.body.status, "ready");
    passed("Hosted authenticated Testnet readiness reports ready");
  }
} catch (error) {
  // Do not print response bodies, headers or credentials on failure.
  results.checks.push({
    name: "Preflight stopped",
    result: "FAIL",
    reason:
      error instanceof assert.AssertionError
        ? "An expected status or invariant did not match; inspect the last passed step."
        : "Browser or HTTP operation failed; no write was automatically retried.",
  });
  process.exitCode = 1;
} finally {
  for (const context of contexts.slice(1)) {
    try {
      await call(context, "/auth/logout", "POST");
    } catch {
      /* session expiry remains bounded server-side */
    }
  }
  for (const context of contexts) await context.dispose();
  await browser?.close();
  results.completedAt = new Date().toISOString();
  console.log(JSON.stringify(results, null, 2));
}
