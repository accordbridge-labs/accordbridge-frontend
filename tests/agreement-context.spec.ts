import { expect, test } from "@playwright/test";

const agreement = {
  title: "Synthetic agreement",
  description: "Fictional work",
  exclusions: "Real assets",
  revisions: 1,
  reviewDays: 7,
  milestones: [
    {
      name: "Design",
      amount: "20",
      scope: "Fictional design",
      criteria: "Fictional criteria",
      dueDate: "2026-12-01",
    },
  ],
};

test("persistent current/history summaries and editor describe valueless Testnet terms", async ({
  page,
}) => {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const version = (version: number) => ({
      version,
      agreement,
      publishedBy: "client-1",
      publishedAt: "2026-10-09T09:00:00Z",
      acceptances: [],
    });
    const json =
      path === "/api/auth/me"
        ? {
            user: {
              id: "client-1",
              name: "Client",
              email: "client@example.test",
            },
          }
        : path === "/api/projects"
          ? { projects: [] }
          : path === "/api/projects/project-1"
            ? {
                id: "project-1",
                currentVersion: 2,
                fundingStarted: false,
                role: "client",
                client: { id: "client-1", name: "Client" },
                freelancer: { id: "partner", name: "Partner" },
                versions: [version(2), version(1)],
                draft: null,
              }
            : path.endsWith("/work")
              ? { canAct: false, submissions: [] }
              : path.endsWith("/wallet")
                ? { enabled: false, address: null }
                : { escrow: null, intents: [] };
    return route.fulfill({ json });
  });
  await page.goto("/?project=project-1");
  const summaries = page.locator(".agreement-summary");
  await expect(summaries).toHaveCount(2);
  for (const summary of await summaries.all()) {
    await expect(summary).toContainText("20 nominal units");
    await expect(summary).toContainText("has no value and is not USDC");
    await expect(summary).toContainText("Only the first milestone");
    await expect(summary).toContainText("No resolver or automatic escalation");
    await expect(summary).not.toContainText("0.3%");
  }
  await page
    .getByRole("button", { name: "Propose changes", exact: true })
    .click();
  const editor = page.locator(".agreement-editor");
  await expect(
    editor.getByLabel("Nominal agreement amount", { exact: true }),
  ).toHaveValue("20");
  await expect(editor).toContainText("There is no provider or platform fee");
  await expect(editor).toContainText("has no value and is not USDC");
  await expect(editor).toContainText("Only the first milestone");
  await expect(editor).toContainText("No resolver or automatic escalation");
  await expect(editor).not.toContainText("0.3%");
});

test("simulator summaries and editor retain explicitly illustrative pricing", async ({
  page,
}) => {
  await page.goto("/demo");
  // Open the project workspace from the demo overview.
  await page
    .getByRole("button", { name: "Project workspace", exact: true })
    .click();
  const summary = page.locator(".agreement-summary").first();
  await expect(summary).toContainText("sample USDC");
  await expect(summary).toContainText("Illustrative provider fee: 0.3%");
  await page
    .getByRole("button", { name: "Propose changes", exact: true })
    .click();
  const editor = page.locator(".agreement-editor");
  await expect(editor).toContainText("Sample USDC only");
  await expect(editor).toContainText("Illustrative provider fee: 0.3%");
  await expect(editor).toContainText("simulated scenario only");
  await expect(
    editor.getByLabel("Amount (USDC)", { exact: true }).first(),
  ).toBeVisible();
});
