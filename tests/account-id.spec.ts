import { expect, test } from "@playwright/test";

for (const result of ["success", "rejection", "unavailable"] as const) {
  test(`account ID copy: ${result}, explicit keyboard action and manual fallback`, async ({
    page,
  }) => {
    const id = "12345678-1234-4234-8234-123456789abc";
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      return route.fulfill({
        json:
          path === "/api/auth/me"
            ? {
                user: {
                  id,
                  name: "Synthetic user",
                  email: "fixture@example.test",
                },
              }
            : { projects: [] },
      });
    });
    await page.addInitScript((result) => {
      Object.defineProperty(window, "copyCalls", {
        value: [],
        configurable: true,
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value:
          result === "unavailable"
            ? undefined
            : {
                writeText: async (value: string) => {
                  (window as unknown as { copyCalls: string[] }).copyCalls.push(
                    value,
                  );
                  if (result === "rejection")
                    throw new Error("Synthetic permission denial");
                },
              },
      });
    }, result);
    await page.goto("/");
    const reveal = page.getByRole("button", { name: "Show my account ID" });
    await expect(reveal).toBeVisible();
    const copy = page.getByRole("button", {
      name: "Copy account ID",
      exact: true,
    });
    await expect(copy).toHaveCount(0);
    await reveal.click();
    await expect(page.getByTestId("account-id")).toHaveText(id);
    const calls = () =>
      page.evaluate(
        () => (window as unknown as { copyCalls: string[] }).copyCalls,
      );
    expect(await calls()).toEqual([]);
    await copy.focus();
    await page.keyboard.press("Enter");
    const feedback = page.locator(".account-id [role=status]");
    await expect(feedback).toHaveAttribute("aria-live", "polite");
    await expect(feedback).toContainText(
      result === "success" ? "Account ID copied." : "copy it manually",
    );
    expect(await calls()).toEqual(result === "unavailable" ? [] : [id]);
    const code = page.getByTestId("account-id");
    await expect(code).toHaveCSS("user-select", "all");
    await code.focus();
    await expect(code).toBeFocused();
    await page.getByRole("button", { name: "Hide account ID" }).click();
    await expect(copy).toHaveCount(0);
    await expect(code).toHaveCount(0);
  });
}
