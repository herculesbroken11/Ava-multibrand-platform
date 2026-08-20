import { test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers";

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 320, height: 568 },
];

test.describe("responsive overflow", () => {
  test.skip(({ browserName }) => browserName !== "chromium");
  for (const viewport of VIEWPORTS) {
    test(`landing ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await assertNoHorizontalOverflow(page);
    });

    test(`ask-ava ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/ask-ava");
      await assertNoHorizontalOverflow(page);
    });
  }
});
