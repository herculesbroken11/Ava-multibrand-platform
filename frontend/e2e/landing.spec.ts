import { test, expect } from "@playwright/test";
import { PRODUCTREVIEWS_APPROVED_COPY as copy } from "../src/brands/productreviews-approved-copy";
import { assertNoHorizontalOverflow } from "./helpers";

test.describe("ProductReviews landing", () => {
  test("shows approved copy and the eight suggested questions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(copy.hero.heading);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(copy.hero.headingAccent);
    await expect(page.getByText(copy.hero.trustItems[0])).toBeVisible();
    await expect(page.getByText(copy.hero.trustItems[1])).toBeVisible();
    await expect(page.getByText(copy.hero.handwrittenNote)).toBeVisible();
    await expect(page.getByText(copy.askAva.headlinePrefix)).toBeVisible();
    await expect(page.getByText(copy.askAva.headlineAccent)).toBeVisible();
    await expect(page.getByPlaceholder(copy.askAva.placeholder)).toBeVisible();
    await expect(page.getByRole("heading", { name: copy.suggestedQuestions.heading })).toBeVisible();
    await expect(page.getByText(copy.suggestedQuestions.subheading)).toBeVisible();
    for (const question of copy.suggestedQuestions.questions) {
      await expect(page.getByRole("link", { name: question })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: copy.independence.headline })).toBeVisible();
    await expect(page.getByText(copy.independence.subtitle!)).toBeVisible();
    await expect(page.getByText(copy.learning.heading)).toBeVisible();
    await expect(page.getByRole("link", { name: copy.learning.cta })).toBeVisible();
    await expect(page.getByText(copy.footer.tagline)).toBeVisible();
    await expect(page.getByText(copy.footer.copyright)).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://productreviews.com.au",
    );
  });

  test("rejects a blank Ask Ava submit", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: copy.askAva.cta })).toBeDisabled();
    await page.getByPlaceholder(copy.askAva.placeholder).fill("   ");
    await expect(page.getByRole("button", { name: copy.askAva.cta })).toBeDisabled();
  });

  test("does not load analytics scripts when analytics is off", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
    await expect(page.locator('script[src*="gtag/js"]')).toHaveCount(0);
  });

  test("landing does not overflow at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await assertNoHorizontalOverflow(page);
  });
});
