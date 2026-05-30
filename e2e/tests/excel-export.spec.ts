import * as path from "path";
import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

async function createTableWithData(page: import("@playwright/test").Page, name: string): Promise<void> {
  const list = new MetadataTablePage(page);
  await list.goto();
  await list.create(name);
  await list.openTable(name);
  await expect(page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

  await page.getByRole("button", { name: /^import/i }).click();
  page.once("dialog", dialog => dialog.accept());
  const fileInput = page.locator("input[type='file'][accept='.txt,.tsv']");
  await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));

  const tasksBtn = page.locator("button[aria-label*='Background tasks']");
  await tasksBtn.click();
  const monitor = page.locator("app-async-task-monitor");
  await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 60000 });
  await monitor.getByRole("button", { name: /completed/i }).click();
  await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 120000 });
  await tasksBtn.click();
}

test.describe("Excel export", () => {
  test("Excel export option is visible in export dropdown", async ({ adminPage }) => {
    const tableName = `E2E Excel Visible ${Date.now()}`;
    await createTableWithData(adminPage, tableName);
    await adminPage.getByRole("button", { name: /^export/i }).click();
    await expect(adminPage.getByRole("link", { name: /export as excel/i })).toBeVisible({ timeout: 3000 });
  });

  test("Excel export creates async task in background monitor", async ({ adminPage }) => {
    const tableName = `E2E Excel Export ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.getByRole("button", { name: /^export/i }).click();
    await adminPage.getByRole("link", { name: /export as excel/i }).click();

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();
    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
  });

  test("completed Excel export shows download button", async ({ adminPage }) => {
    const tableName = `E2E Excel Download ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.getByRole("button", { name: /^export/i }).click();
    await adminPage.getByRole("link", { name: /export as excel/i }).click();

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();
    const monitor = adminPage.locator("app-async-task-monitor");
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
    await monitor.getByRole("button", { name: /completed/i }).click();
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 60000 });
    await expect(
      monitor.locator(".task-item .btn-outline-primary[title*='Download']").first()
    ).toBeVisible({ timeout: 5000 });
  });
});
