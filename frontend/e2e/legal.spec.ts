import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/privacy", title: "Privacy Policy" },
  { path: "/terms", title: "Terms & Conditions" },
  { path: "/disclaimer", title: "Disclaimer" },
  { path: "/contact", title: "Contact" },
] as const;

test.describe("legal and contact pages", () => {
  for (const route of ROUTES) {
    test(`${route.path} is a marked internal placeholder and is noindex`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.title })).toBeVisible();
      await expect(page.getByRole("status")).toContainText("Internal placeholder");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/i,
      );
    });
  }

  test("contact does not invent an email address", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.getByText("A public contact email has not been supplied yet.")).toBeVisible();
  });
});
