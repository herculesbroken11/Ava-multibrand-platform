import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("automated accessibility", () => {
  test("landing has no serious axe violations outside approved colour contrast", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("privacy placeholder page has no serious axe violations outside approved colour contrast", async ({ page }) => {
    await page.goto("/privacy");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
