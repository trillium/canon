import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SECTIONS = [
  "ds-principles",
  "ds-foundations",
  "ds-tokens",
  "ds-components",
  "ds-patterns",
  "ds-content",
  "ds-accessibility",
  "ds-governance",
];

test("home page renders its heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("design-system catalogue renders all eight sections", async ({ page }) => {
  await page.goto("/design-system");
  for (const id of SECTIONS) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

for (const path of ["/", "/design-system"]) {
  test(`@a11y ${path} has no axe violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
