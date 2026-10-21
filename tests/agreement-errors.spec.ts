import { expect, test } from "@playwright/test";

test("validation summary supports keyboard focus, row changes, and correction", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Project workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Propose changes", exact: true })
    .click();
  const editor = page.locator(".agreement-editor");
  await editor.getByLabel("Project title", { exact: true }).fill("");
  await editor
    .getByRole("textbox", { name: "Project description", exact: true })
    .fill("");
  await editor.getByRole("button", { name: "Send for review" }).click();
  const summary = editor.getByRole("alert");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(summary.getByRole("link").first()).toBeFocused();
  await page.keyboard.press("Enter");
  const title = editor.getByLabel("Project title", { exact: true });
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute("aria-invalid", "true");
  const errorId = await title.getAttribute("aria-describedby");
  expect(await page.locator(`[id="${errorId}"]`).textContent()).toContain(
    "Enter a project title",
  );
  await title.fill("Corrected title");
  await expect(title).not.toHaveAttribute("aria-invalid", "true");
  await editor
    .getByRole("textbox", { name: "Project description", exact: true })
    .fill("Corrected description");
  await expect(summary).toHaveCount(0);
  await editor
    .getByRole("button", { name: "Add milestone", exact: true })
    .click();
  await editor
    .getByRole("button", { name: "Remove milestone 2", exact: true })
    .click();
  await editor.getByRole("button", { name: "Send for review" }).click();
  const ids = await editor
    .locator("input[id],textarea[id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const link of await summary.getByRole("link").all()) {
    const target = (await link.getAttribute("href"))!.slice(1);
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(`[id="${target}"]`)).toBeFocused();
  }
  await editor
    .getByRole("button", { name: "Remove milestone 3", exact: true })
    .click();
  await expect(summary).toHaveCount(0);
  await editor.getByRole("button", { name: "Send for review" }).click();
  await expect(editor).toHaveCount(0);
});
