import { expect, type Page } from "@playwright/test";

export async function assertNoHorizontalOverflow(page: Page) {
  const overflowing = await page.evaluate(() => {
    const limit = document.documentElement.clientWidth + 2;
    return [...document.querySelectorAll("body *")].some((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > limit;
    });
  });
  expect(overflowing).toBe(false);
}
