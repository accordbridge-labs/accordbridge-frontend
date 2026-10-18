import { expect, test, type Page } from "@playwright/test";

const role = (page: Page, value: string) =>
  page.getByRole("combobox", { name: "Demo role" }).selectOption(value);

test("only a confirmed failed funding result enables an explicit retry", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "01 Agreement" }).click();
  await page
    .getByRole("button", { name: "Accept sample agreement as Maya" })
    .click();
  await role(page, "freelancer");
  await page
    .getByRole("button", { name: "Accept sample agreement as Tobi" })
    .click();
  await role(page, "client");
  await page
    .getByRole("button", { name: "Simulate funding · 150 USDC" })
    .click();
  await page.getByRole("button", { name: "Simulate unknown outcome" }).click();
  await expect(
    page.getByRole("button", { name: "Simulate funding · 150 USDC" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Check transaction · simulate confirmed failure",
    })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "confirmed deposit failure" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Simulate funding · 150 USDC" })
    .click();
  await page
    .getByRole("button", { name: "Simulate confirmed transaction" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Design is ready to start." }),
  ).toBeVisible();
});
async function authorize(page: Page) {
  await role(page, "client");
  await page
    .getByRole("button", { name: "Accept settlement as client", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit authorized sample settlement" }),
  ).toHaveCount(0);
  await role(page, "freelancer");
  await page
    .getByRole("button", {
      name: "Accept settlement as freelancer",
      exact: true,
    })
    .click();
  await role(page, "client");
  await page
    .getByRole("button", { name: "Submit authorized sample settlement" })
    .click();
}

test("extra scope has separate acceptance, uncertain funding and a retained rejection", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "04 Extra work" }).click();
  await page
    .getByRole("button", { name: "Propose sample online store" })
    .click();
  await page.getByRole("button", { name: "Reject sample change" }).click();
  await expect(
    page.getByText("Rejected proposal retained.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "04 Extra work" }).click();
  await page
    .getByRole("button", { name: "Propose sample online store" })
    .click();
  await page
    .getByRole("button", { name: "Accept change as client", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Simulate separate change funding" }),
  ).toHaveCount(0);
  await role(page, "freelancer");
  await page
    .getByRole("button", { name: "Accept change as freelancer", exact: true })
    .click();
  await role(page, "client");
  await page
    .getByRole("button", { name: "Simulate separate change funding" })
    .click();
  await page
    .getByRole("button", { name: "Simulate unknown change deposit" })
    .click();
  await expect(
    page.getByRole("button", { name: "Simulate separate change funding" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Propose sample cancellation" }),
  ).toBeDisabled();
  await page
    .getByRole("button", {
      name: "Check change deposit · simulate confirmation",
    })
    .click();
  await expect(
    page.getByText("Extra work active:", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".stats")).toContainText("350");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("client silence expires only the demo clock and retains funds on escalation", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "05 Client silence" }).click();
  await expect(
    page.getByRole("button", { name: "Request review after silence" }),
  ).toBeDisabled();
  for (let day = 0; day < 7; day++)
    await page
      .getByRole("button", { name: "Advance demo clock one day" })
      .click();
  await expect(
    page.getByText("Review deadline: 2026-10-25", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Request review after silence" })
    .click();
  await expect(page.locator(".stats")).toContainText("150 USDC under dispute");
  await expect(
    page.getByRole("button", { name: "Propose sample split decision" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View sample receipt" }),
  ).toHaveCount(0);
});

test("cancellation requires both authorizations and separate confirmation", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()))
      mutations.push(request.url());
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "06 Cancellation" }).click();
  const proposal = page.getByRole("button", {
    name: "Propose sample cancellation",
  });
  await proposal.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Cancellation proposal · proposed" }),
  ).toBeVisible();
  await authorize(page);
  await page
    .getByRole("button", { name: "Simulate unknown settlement" })
    .click();
  await expect(
    page.getByText("Synthetic receipt DEMO-SETTLEMENT-001", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Submit authorized sample settlement" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Check settlement · simulate confirmation" })
    .click();
  await expect(
    page.getByText("Confirmed sample refund to Maya: 150 USDC.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Wallet & receipts", exact: true })
    .click();
  await expect(
    page.getByText("Synthetic receipt DEMO-SETTLEMENT-001", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/cancellation-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(mutations).toEqual([]);
  await page.reload();
  await expect(
    page.getByText("Synthetic receipt DEMO-SETTLEMENT-001", { exact: false }),
  ).toHaveCount(0);
});

test("contested cancellation proceeds to an itemized sample split", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "06 Cancellation" }).click();
  await page
    .getByRole("button", { name: "Propose sample cancellation" })
    .click();
  await role(page, "freelancer");
  await page
    .getByRole("button", { name: "Contest settlement · retain funds" })
    .click();
  await page
    .getByLabel("Freelancer gross allocation (sample USDC)")
    .fill("151");
  await page
    .getByRole("button", { name: "Propose sample split decision" })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Enter a valid allocation" }),
  ).toContainText("Enter a valid allocation");
  await page
    .getByLabel("Freelancer gross allocation (sample USDC)")
    .fill("75.55");
  await page
    .getByLabel("Settlement reason · fictional information only")
    .fill("Sample review: partial design accepted by both parties.");
  await page
    .getByRole("button", { name: "Propose sample split decision" })
    .click();
  await authorize(page);
  await page
    .getByRole("button", { name: "Check settlement · simulate confirmation" })
    .click();
  const panel = page.getByRole("region", {
    name: "Cancellation & split settlement · simulation",
  });
  await expect(panel).toContainText("75.32 sample USDC");
  await expect(panel).toContainText("74.45 sample USDC");
  await expect(panel).toContainText("0.23 sample USDC");
  await expect(
    page.getByRole("button", {
      name: "Check settlement · simulate confirmation",
    }),
  ).toHaveCount(0);
  await page.screenshot({
    path: `test-results/split-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
