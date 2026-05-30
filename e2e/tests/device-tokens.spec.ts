import { test, expect } from "../fixtures/auth";
import { DeviceTokensPage } from "../page-objects/vanilla-ng/device-tokens.po";

const TOKEN_LABEL = `E2E Token ${Date.now()}`;

test.describe("device tokens", () => {
  test.afterEach(async ({ adminPage }) => {
    const page = new DeviceTokensPage(adminPage);
    await page.goto();
    try { await page.delete(TOKEN_LABEL); } catch { /* may not exist */ }
  });

  test("device tokens page loads", async ({ adminPage }) => {
    const page = new DeviceTokensPage(adminPage);
    await page.goto();
    await expect(adminPage).toHaveURL(/\/user\/devices|\/devices/, { timeout: 10000 });
  });

  test("create token shows token value", async ({ adminPage }) => {
    const page = new DeviceTokensPage(adminPage);
    await page.goto();
    const token = await page.create(TOKEN_LABEL);
    expect(token.length).toBeGreaterThan(0);
  });

  test("created token appears in list", async ({ adminPage }) => {
    const page = new DeviceTokensPage(adminPage);
    await page.goto();
    await page.create(TOKEN_LABEL);
    await expect(adminPage.getByText(TOKEN_LABEL)).toBeVisible({ timeout: 10000 });
  });

  test("delete token removes it from list", async ({ adminPage }) => {
    const page = new DeviceTokensPage(adminPage);
    await page.goto();
    await page.create(TOKEN_LABEL);
    await page.delete(TOKEN_LABEL);
    await expect(adminPage.getByText(TOKEN_LABEL)).not.toBeVisible({ timeout: 5000 });
  });
});
