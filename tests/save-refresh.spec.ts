import { expect, test } from "@playwright/test";

const agreement = {
  title: "Saved terms",
  description: "Fictional work",
  exclusions: "None",
  revisions: 1,
  reviewDays: 7,
  milestones: [
    {
      name: "Design",
      amount: "20",
      scope: "Work",
      criteria: "Check",
      dueDate: "2026-12-01",
    },
  ],
};
for (const stage of [
  "save",
  "publish",
  "publish-unknown",
  "project-save",
  "project-publish",
  "list-save",
  "list-publish",
] as const) {
  test(`preserves confirmed stages and recovery uses reads only: ${stage}`, async ({
    page,
  }) => {
    let puts = 0;
    let posts = 0;
    let recovering = false;
    let revision = 0;
    let published = false;
    const publish = stage.includes("publish");
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      if (method === "PUT") {
        puts++;
        expect(route.request().postDataJSON().expectedRevision).toBe(revision);
        revision++;
        return route.fulfill(
          stage === "save"
            ? {
                status: 503,
                json: { message: "Save response lost", outcome: "unknown" },
              }
            : { json: { revision } },
        );
      }
      if (method === "POST") {
        posts++;
        expect(route.request().postDataJSON().expectedRevision).toBe(revision);
        if (stage === "publish-unknown")
          return route.fulfill({
            status: 503,
            json: { message: "Publication response lost", outcome: "unknown" },
          });
        if (stage === "publish")
          return route.fulfill({
            status: 409,
            json: { message: "Publication conflict" },
          });
        published = true;
        return route.fulfill({ json: { version: 2 } });
      }
      if (
        !recovering &&
        puts &&
        ((stage.startsWith("project-") && path === "/api/projects/project-1") ||
          (stage.startsWith("list-") && path === "/api/projects"))
      ) {
        return route.fulfill({
          status: 500,
          json: { message: "Synthetic read failure" },
        });
      }
      const version = published ? 2 : 1;
      const json =
        path === "/api/auth/me"
          ? {
              user: {
                id: "client",
                name: "Client",
                email: "client@example.test",
              },
            }
          : path === "/api/projects"
            ? { projects: [] }
            : path === "/api/projects/project-1"
              ? {
                  id: "project-1",
                  currentVersion: version,
                  fundingStarted: false,
                  role: "client",
                  client: { id: "client", name: "Client" },
                  freelancer: { id: "partner", name: "Partner" },
                  versions: [
                    {
                      version,
                      agreement,
                      publishedBy: "client",
                      publishedAt: "2026-10-21T10:00:00Z",
                      acceptances: [],
                    },
                  ],
                  draft:
                    revision && !published
                      ? {
                          agreement,
                          baseVersion: 1,
                          revision,
                          updatedAt: "2026-10-21T10:00:00Z",
                        }
                      : null,
                }
              : path.endsWith("/work")
                ? { canAct: false, submissions: [] }
                : path.endsWith("/wallet")
                  ? { enabled: false, address: null }
                  : { status: "ok", escrow: null, intents: [] };
      await route.fulfill({ json });
    });
    await page.goto("/?project=project-1");
    await page
      .getByRole("button", { name: "Propose changes", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: publish ? "Send for review" : "Save draft & close",
        exact: true,
      })
      .click();
    if (stage === "save") {
      await expect(
        page.getByRole("alert").filter({ hasText: "Save response lost" }),
      ).toBeVisible();
      await expect(page.locator(".workspace-notice")).toHaveCount(0);
      recovering = true;
      await page
        .getByRole("button", { name: "Check connection", exact: true })
        .click();
      await expect(
        page.getByRole("alert").filter({ hasText: "Save response lost" }),
      ).toHaveCount(0);
    } else if (stage === "publish-unknown") {
      await expect(page.locator(".workspace-notice")).toHaveText(
        "Draft saved to your account.",
      );
      await expect(page.locator(".workspace-error")).toContainText(
        "Publication was not confirmed",
      );
      recovering = true;
      await page
        .getByRole("button", { name: "Check connection", exact: true })
        .click();
      await expect(page.locator(".workspace-error")).toHaveCount(0);
      await expect(page.locator(".workspace-notice")).toHaveText(
        "Draft saved to your account.",
      );
    } else if (stage === "publish") {
      await expect(page.locator(".workspace-notice")).toHaveText(
        "Draft saved to your account.",
      );
      await expect(page.locator(".workspace-error")).toContainText(
        "Publication was not confirmed",
      );
      // A deliberate later save must use the confirmed revision, not the old one.
      await page
        .getByRole("button", { name: "Save draft & close", exact: true })
        .click();
      await expect(page.locator(".agreement-editor")).toHaveCount(0);
      expect(puts).toBe(2);
      expect(posts).toBe(1);
      return;
    } else {
      await expect(page.locator(".workspace-notice")).toContainText(
        publish ? "New version published" : "Draft saved",
      );
      await expect(page.locator(".workspace-error")).toContainText(
        "could not be reloaded",
      );
      recovering = true;
      await page
        .getByRole("button", { name: "Reload saved state", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Reload saved state", exact: true }),
      ).toHaveCount(0);
      await expect(page.locator(".workspace-notice")).toContainText(
        publish ? "New version published" : "Draft saved",
      );
    }
    expect(puts).toBe(1);
    expect(posts).toBe(publish ? 1 : 0);
  });
}
