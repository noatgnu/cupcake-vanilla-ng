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

test.describe("SDRF export", () => {
  test("Export dropdown is visible on table detail page", async ({ adminPage }) => {
    const tableName = `E2E Export Visible ${Date.now()}`;
    await createTableWithData(adminPage, tableName);
    await expect(adminPage.getByRole("button", { name: /^export/i })).toBeVisible({ timeout: 5000 });
  });

  test("Export dropdown shows SDRF and Excel options", async ({ adminPage }) => {
    const tableName = `E2E Export Options ${Date.now()}`;
    await createTableWithData(adminPage, tableName);
    await adminPage.getByRole("button", { name: /^export/i }).click();
    await expect(adminPage.getByRole("link", { name: /export as sdrf/i })).toBeVisible({ timeout: 3000 });
    await expect(adminPage.getByRole("link", { name: /export as excel/i })).toBeVisible({ timeout: 3000 });
  });

  test("SDRF export creates async task in background monitor", async ({ adminPage }) => {
    const tableName = `E2E Export SDRF ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.getByRole("button", { name: /^export/i }).click();
    await adminPage.getByRole("link", { name: /export as sdrf/i }).click();

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();
    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
  });

  test("completed SDRF export task shows download button", async ({ adminPage }) => {
    const tableName = `E2E Export Download ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.getByRole("button", { name: /^export/i }).click();
    await adminPage.getByRole("link", { name: /export as sdrf/i }).click();

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

  test("bulk SDRF export from list creates task for selected tables", async ({ adminPage }) => {
    const tableName = `E2E Bulk Export ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);

    const tableCheckbox = adminPage.locator("tr").filter({ hasText: tableName }).locator("input[type='checkbox']");
    await expect(tableCheckbox).toBeVisible({ timeout: 10000 });
    await tableCheckbox.check();

    await expect(adminPage.getByRole("button", { name: /bulk export sdrf/i })).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("button", { name: /bulk export sdrf/i }).click();

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();
    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
  });
});
