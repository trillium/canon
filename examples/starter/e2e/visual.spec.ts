import { expect, test } from "@playwright/test";

// Visual baselines for every page that exists. Update them with `pnpm run test:visual:update`
// (see e2e/README.md); never from a laptop, because rendering differs by operating system.
const PAGES = [
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
  { name: "admin", path: "/admin" },
  { name: "design-system", path: "/design-system" },
];

test.describe("@visual", () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });

  for (const colorScheme of ["light", "dark"] as const) {
    for (const { name, path } of PAGES) {
      test(`${name} page, ${colorScheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${name}-${colorScheme}.png`, { fullPage: true });
      });
    }
  }
});
