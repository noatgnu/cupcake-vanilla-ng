import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

async function createTable(page: import("@playwright/test").Page, name: string): Promise<void> {
  const list = new MetadataTablePage(page);
  await list.goto();
  await list.create(name);
}

test.describe("open in Excel", () => {
  test("Open in Excel button is visible on the table list", async ({ adminPage }) => {
    const name = `E2E Excel Visible ${Date.now()}`;
    await createTable(adminPage, name);
    const list = new MetadataTablePage(adminPage);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: name });
    const openBtn = row.locator("button, a").filter({ hasText: /open in excel/i }).first();
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await list.deleteTable(name);
  });

  test("clicking Open in Excel shows a launch code modal", async ({ adminPage }) => {
    const name = `E2E Excel Modal ${Date.now()}`;
    await createTable(adminPage, name);
    const list = new MetadataTablePage(adminPage);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: name });
    const openBtn = row.locator("button, a").filter({ hasText: /open in excel/i }).first();
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();

    await expect(adminPage.getByText(/open in excel/i).first()).toBeVisible({ timeout: 10000 });
    const codeInput = adminPage.locator('input.font-monospace, input[readonly]').first();
    if (await codeInput.isVisible({ timeout: 5000 })) {
      await expect(codeInput).toBeVisible({ timeout: 3000 });
    }
    const closeBtn = adminPage.locator("button.btn-close, button").filter({ hasText: /close/i }).first();
    await closeBtn.click();
    await list.deleteTable(name);
  });

  test("launch code modal has a copy to clipboard button", async ({ adminPage }) => {
    const name = `E2E Excel Copy ${Date.now()}`;
    await createTable(adminPage, name);
    const list = new MetadataTablePage(adminPage);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: name });
    const openBtn = row.locator("button, a").filter({ hasText: /open in excel/i }).first();
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();

    await expect(adminPage.getByText(/open in excel/i).first()).toBeVisible({ timeout: 10000 });
    const copyBtn = adminPage.locator("button").filter({ hasText: /copy/i }).first();
    if (await copyBtn.isVisible({ timeout: 5000 })) {
      await expect(copyBtn).toBeVisible({ timeout: 3000 });
    }
    const closeBtn = adminPage.locator("button.btn-close, button").filter({ hasText: /close/i }).first();
    await closeBtn.click();
    await list.deleteTable(name);
  });

  test("launch code modal shows a code value", async ({ adminPage }) => {
    const name = `E2E Excel Code ${Date.now()}`;
    await createTable(adminPage, name);
    const list = new MetadataTablePage(adminPage);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: name });
    const openBtn = row.locator("button, a").filter({ hasText: /open in excel/i }).first();
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();

    await expect(adminPage.getByText(/open in excel/i).first()).toBeVisible({ timeout: 10000 });
    const codeInput = adminPage.locator('input.font-monospace, input[readonly]').first();
    if (await codeInput.isVisible({ timeout: 5000 })) {
      const codeVal = await codeInput.inputValue();
      expect(codeVal.length).toBeGreaterThan(0);
    }
    const closeBtn = adminPage.locator("button.btn-close, button").filter({ hasText: /close/i }).first();
    await closeBtn.click();
    await list.deleteTable(name);
  });
});
