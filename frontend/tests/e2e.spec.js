const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "https://invest-iq-git-main-ramyajeldy-6775s-projects.vercel.app";

test.describe("InvestIQ - Page Load", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/InvestIQ/i);
  });

  test("chat input is visible on load", async ({ page }) => {
    await page.goto(BASE_URL);
    const input = page.locator("input, textarea").first();
    await expect(input).toBeVisible();
  });
});

test.describe("InvestIQ - Chat", () => {
  test("user can type a question into the chat input", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const input = page.locator("input, textarea").first();
    await input.fill("What is a mutual fund?");
    await expect(input).toHaveValue("What is a mutual fund?");
  });

  test("submitting a question shows a response", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const input = page.locator("input, textarea").first();
    await input.fill("What is a stock?");
    await input.press("Enter");
    await page.waitForTimeout(8000);
    const body = await page.textContent("body");
    expect(body.length).toBeGreaterThan(200);
  });
});

test.describe("InvestIQ - API Connectivity", () => {
  test("frontend can reach the backend API", async ({ page }) => {
    await page.goto(BASE_URL);
    const response = await page.evaluate(async () => {
      const r = await fetch("https://investiq-api.onrender.com/");
      return r.status;
    });
    expect(response).toBe(200);
  });
});
