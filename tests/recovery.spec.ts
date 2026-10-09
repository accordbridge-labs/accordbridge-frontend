import { expect, test } from "@playwright/test";

test("a delayed backend remains unavailable until an explicit bounded connection check", async ({
  page,
}) => {
  let sleeping = true;
  let probes = 0;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/health") {
      probes++;
      // Synthetic cold-start delay. No real Render backend is contacted.
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (probes >= 2) sleeping = false;
      await route.fulfill({
        status: sleeping ? 503 : 200,
        json: sleeping
          ? { message: "Backend waking up" }
          : { status: "ok" },
      });
      return;
    }
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({
        status: sleeping ? 503 : 200,
        json: sleeping
          ? { message: "Workspace service unavailable" }
          : { user: { id: "client-1", name: "Client", email: "client@example.test" } },
      });
      return;
    }
    if (url.pathname === "/api/projects" && route.request().method() === "GET") {
      await route.fulfill({ json: { projects: [] } });
      return;
    }
    await route.fulfill({ status: 404, json: { message: "Not found" } });
  });

  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Workspace service unavailable");
  expect(probes).toBe(0); // no background keep-alive traffic
  await page.getByRole("button", { name: "Check connection" }).click();
  await expect(page.getByRole("button", { name: "New project" })).toBeVisible();
  expect(probes).toBe(2);
});

test("a lost project-creation response preserves form fields without retrying the POST", async ({
  page,
}) => {
  let postCount = 0;
  let getCount = 0;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({
        json: { user: { id: "client-1", name: "Client", email: "client@example.test" } },
      });
      return;
    }
    if (url.pathname === "/api/projects" && method === "GET") {
      getCount++;
      await route.fulfill({ json: { projects: [] } });
      return;
    }
    if (url.pathname === "/api/projects" && method === "POST") {
      postCount++;
      await route.fulfill({
        status: 503,
        json: { code: "UPSTREAM_UNAVAILABLE", outcome: "unknown", message: "No response from the backend" },
      });
      return;
    }
    if (url.pathname === "/api/health") {
      await route.fulfill({ json: { status: "ok" } });
      return;
    }
    await route.fulfill({ status: 404, json: { message: "Not found" } });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project title").fill("Unsent test project");
  await page.getByLabel("Counterparty account ID").fill("partner-1");
  await page.getByRole("button", { name: "Create project & edit agreement" }).click();
  await expect(page.getByRole("alert")).toContainText("No response from the backend");
  await expect(page.getByLabel("Project title")).toHaveValue("Unsent test project");
  await expect(page.getByLabel("Counterparty account ID")).toHaveValue("partner-1");
  await page.getByRole("button", { name: "Check connection" }).click();
  await expect(page.getByLabel("Project title")).toHaveValue("Unsent test project");
  expect(postCount).toBe(1); // never repeats an uncertain mutation
  expect(getCount).toBeGreaterThanOrEqual(2);
});

test("an unknown signed transaction remains locked across refresh until explicit reconciliation", async ({
  page,
}) => {
  const projectId = "synthetic-project";
  const hash = "a".repeat(64);
  const markerKey = `accordbridge:uncertain-testnet-intent:${projectId}`;
  const marker = { id: "intent-1", hash };
  let checks = 0;
  await page.addInitScript(
    ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
    { key: markerKey, value: marker },
  );
  const project = {
    id: projectId,
    currentVersion: 1,
    fundingStarted: false,
    role: "client",
    client: { id: "client-1", name: "Client" },
    freelancer: { id: "freelancer-1", name: "Freelancer" },
    versions: [
      {
        version: 1,
        publishedBy: "client-1",
        publishedAt: "2026-10-09T09:00:00Z",
        agreement: {
          title: "Synthetic agreement",
          description: "Browser fixture only",
          exclusions: "Real transfers",
          revisions: 1,
          reviewDays: 7,
          milestones: [
            {
              name: "Design",
              amount: "20",
              scope: "Fictional work",
              criteria: "Fictional criteria",
              dueDate: "2026-12-01",
            },
          ],
        },
        acceptances: [
          { userId: "client-1", role: "client", acceptedAt: "2026-10-09T09:00:00Z" },
          { userId: "freelancer-1", role: "freelancer", acceptedAt: "2026-10-09T09:00:00Z" },
        ],
      },
    ],
    draft: null,
  };
  const intent = {
    ...marker,
    action: "deploy",
    userId: "client-1",
    state: "prepared",
    expiresAt: "2026-10-09T10:00:00Z",
  };
  const status = (confirmed: boolean) => ({
    approvedSubmissionId: null,
    clientWallet: "G".repeat(56),
    freelancerWallet: "G".repeat(56),
    escrow: null,
    intents: [{ ...intent, state: confirmed ? "confirmed" : "prepared" }],
  });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({
        json: { user: { id: "client-1", name: "Client", email: "client@example.test" } },
      });
    } else if (url.pathname === "/api/projects") {
      await route.fulfill({ json: { projects: [] } });
    } else if (url.pathname === `/api/projects/${projectId}`) {
      await route.fulfill({ json: project });
    } else if (url.pathname === `/api/projects/${projectId}/work`) {
      await route.fulfill({ json: { canAct: false, submissions: [] } });
    } else if (url.pathname === "/api/testnet/wallet") {
      await route.fulfill({
        json: { enabled: true, address: "G".repeat(56) },
      });
    } else if (url.pathname === `/api/testnet/projects/${projectId}/check` && method === "POST") {
      checks++;
      await route.fulfill({ json: status(true) });
    } else if (url.pathname === `/api/testnet/projects/${projectId}`) {
      await route.fulfill({ json: status(checks > 0) });
    } else {
      await route.fulfill({ status: 404, json: { message: "No fixture route" } });
    }
  });

  await page.goto(`/?project=${projectId}`);
  const escrow = page.getByRole("region", { name: "Stellar testnet escrow" });
  await expect(escrow.getByText("Transaction outcome not yet reconciled")).toBeVisible();
  await expect(escrow.getByRole("button", { name: "Prepare milestone escrow" })).toHaveCount(0);
  await page.reload();
  await expect(escrow.getByText("Transaction outcome not yet reconciled")).toBeVisible();
  expect(checks).toBe(0); // refreshing never submits/checks a transaction automatically

  await escrow.getByRole("button", { name: "Check transaction & chain state" }).click();
  await expect(escrow.getByText("Transaction outcome not yet reconciled")).toHaveCount(0);
  expect(checks).toBe(1);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), markerKey)).toBeNull();
});
