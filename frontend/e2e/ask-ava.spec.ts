import { test, expect } from "@playwright/test";
import { PRODUCTREVIEWS_APPROVED_COPY as copy } from "../src/brands/productreviews-approved-copy";

test.describe("Ask Ava entry and conversation", () => {
  test("a landing question is preserved and auto-submitted", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(copy.askAva.placeholder).click();
    await page.keyboard.type("Which robot vacuum is best for pet hair?");
    await page.getByRole("button", { name: copy.askAva.cta }).click();
    await expect(page).toHaveURL(/\/ask-ava/);
    await expect(page.getByText("Which robot vacuum is best for pet hair?")).toBeVisible();
    await expect(page.getByText(/For pet hair/i)).toBeVisible({ timeout: 20_000 });
  });

  test("a suggested question starts the conversation immediately", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: copy.suggestedQuestions.questions[0] }).click();
    await expect(page).toHaveURL(/\/ask-ava/);
    await expect(page.getByText(copy.suggestedQuestions.questions[0])).toBeVisible();
    await expect(page.getByText(/For pet hair/i)).toBeVisible({ timeout: 20_000 });
  });

  test("refresh restores the session without duplicating the first question", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: copy.suggestedQuestions.questions[0] }).click();
    await expect(page.getByText(/For pet hair/i)).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/ask-ava\/?$/);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(copy.suggestedQuestions.questions[0])).toHaveCount(1);
    await expect(page.getByText(/For pet hair/i)).toBeVisible();
  });

  test("the conversation composer send control is disabled while empty", async ({ page }) => {
    await page.goto("/ask-ava");
    await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  test("a comparison reply stays usable and source links are present", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium");
    await page.goto("/");
    await page.getByRole("link", { name: copy.suggestedQuestions.questions[2] }).click();
    await expect(page.getByText(/Demo comparison/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: /Sample round-up/i })).toBeVisible();
  });
});
