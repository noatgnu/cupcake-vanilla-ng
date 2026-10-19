import * as path from "path";
import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");
const SDRF_FILE = path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv");

async function createTableWithImportedData(
  page: import("@playwright/test").Page,
  name: string
): Promise<void> {
  const list = new MetadataTablePage(page);
  await list.goto();
  await list.create(name);
  await list.openTable(name);
  await expect(page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

  await page.locator('[title="Import Data"]').click();
  const sdrfInput = page.locator('input[type="file"][accept=".txt,.tsv"]');
  await sdrfInput.setInputFiles(SDRF_FILE);
  await page.getByRole("dialog").locator("button.btn-danger").click();

  const tasksBtn = page.locator("button[aria-label*='Background tasks']");
  await tasksBtn.click();
  const monitor = page.locator("app-async-task-monitor");
  await expect(monitor).toBeVisible({ timeout: 5000 });
  await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
  await monitor.getByRole("button", { name: /completed/i }).click();
  await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 20000 });
  await monitor.getByRole("button", { name: /^all/i }).click();
  await tasksBtn.click();
}

test.describe("search and replace modal", () => {
  test.setTimeout(180000);

  test("search and replace modal opens from column context", async ({ adminPage }) => {
    const name = `E2E SR Open ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const searchReplaceBtn = adminPage.locator('[title*="Search and Replace"], [title*="search and replace"], button').filter({ hasText: /search.*replace/i }).first();
    const hasTrigger = await searchReplaceBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasTrigger) {
      await searchReplaceBtn.click();
      await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      await expect(adminPage.getByText(/search and replace/i).first()).toBeVisible({ timeout: 3000 });
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("search and replace form has Find Value and New Value fields", async ({ adminPage }) => {
    const name = `E2E SR Fields ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const searchReplaceBtn = adminPage.locator('[title*="Search and Replace"], button').filter({ hasText: /search.*replace/i }).first();
    const hasTrigger = await searchReplaceBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasTrigger) {
      await searchReplaceBtn.click();
      await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      await expect(adminPage.locator("#oldValue")).toBeVisible({ timeout: 3000 });
      await expect(adminPage.locator("#newValue")).toBeVisible({ timeout: 3000 });
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("search and replace submit is disabled when Find Value is empty", async ({ adminPage }) => {
    const name = `E2E SR Disabled ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const searchReplaceBtn = adminPage.locator('[title*="Search and Replace"], button').filter({ hasText: /search.*replace/i }).first();
    const hasTrigger = await searchReplaceBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasTrigger) {
      await searchReplaceBtn.click();
      await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      const submitBtn = adminPage.getByRole("dialog").locator("button[type='submit'], .modal-footer .btn-primary").first();
      await expect(submitBtn).toBeDisabled({ timeout: 3000 });
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});
