import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";
import { DeviceTokensPage } from "../page-objects/vanilla-ng/device-tokens.po";

const TOKEN_LABEL = "E2E PW Token";

test.describe("device tokens", () => {
  test.afterEach(async ({ userPage }) => {
    const page = new DeviceTokensPage(userPage);
    await page.goto();
    try { await page.delete(TOKEN_LABEL); } catch { /* may not exist */ }
  });

  test("create token shows token value", async ({ userPage }) => {
    const page = new DeviceTokensPage(userPage);
    await page.goto();
    const token = await page.create(TOKEN_LABEL);
    expect(token.length).toBeGreaterThan(0);
  });

  test("delete token removes it from list", async ({ userPage }) => {
    const page = new DeviceTokensPage(userPage);
    await page.goto();
    await page.create(TOKEN_LABEL);
    await page.delete(TOKEN_LABEL);
  });
});
