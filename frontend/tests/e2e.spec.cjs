const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "https://invest-iq-git-main-ramyajeldy-6775s-projects.vercel.app";

test.describe("InvestIQ - Page Load", () => {
  test("homepage is reachable and returns a page", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBeLessThan(500);
  });

  test("page has a title", async ({ page }) => {
    await page.goto(BASE_URL);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
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
  test("backend API root is reachable", async ({ page }) => {
    await page.goto(BASE_URL);
    const response = await page.evaluate(async () => {
      const r = await fetch("https://investiq-api.onrender.com/");
      return r.status;
    });
    expect(response).toBe(200);
  });
});
