import * as path from "path";
import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

async function createTableAndOpen(page: import("@playwright/test").Page, name: string): Promise<void> {
  const list = new MetadataTablePage(page);
  await list.goto();
  await list.create(name);
  await list.openTable(name);
  await expect(page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });
}

async function triggerSdrfImport(page: import("@playwright/test").Page, filePath: string): Promise<void> {
  await page.locator('[title="Import Data"]').click();
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("link", { name: /import sdrf file/i }).click(),
  ]);
  await fileChooser.setFiles(filePath);
  await page.getByRole("dialog").locator("button.btn-danger").click();
}

async function openTaskMonitor(page: import("@playwright/test").Page): Promise<void> {
  const tasksBtn = page.locator("button[aria-label*='Background tasks']");
  await tasksBtn.click();
  await expect(page.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
}

test.describe("SDRF import", () => {
  test("import dropdown is visible on table detail page", async ({ adminPage }) => {
    const tableName = `E2E Import Test ${Date.now()}`;
    await createTableAndOpen(adminPage, tableName);
    await expect(adminPage.locator('[title="Import Data"]')).toBeVisible({ timeout: 5000 });
  });

  test("import dropdown shows SDRF and Excel options", async ({ adminPage }) => {
    const tableName = `E2E Import Options ${Date.now()}`;
    await createTableAndOpen(adminPage, tableName);
    await adminPage.locator('[title="Import Data"]').click();
    await expect(adminPage.getByRole("link", { name: /import sdrf file/i })).toBeVisible({ timeout: 3000 });
    await expect(adminPage.getByRole("link", { name: /import excel/i })).toBeVisible({ timeout: 3000 });
  });

  test("import toggle options are visible in dropdown", async ({ adminPage }) => {
    const tableName = `E2E Import Toggles ${Date.now()}`;
    await createTableAndOpen(adminPage, tableName);
    await adminPage.locator('[title="Import Data"]').click();
    await expect(adminPage.locator("#overrideSampleCountToggle")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#applySchemaTemplatesToggle")).toBeVisible({ timeout: 3000 });
  });

  test("import small SDRF creates async task in background monitor", async ({ adminPage }) => {
    const tableName = `E2E Import Small ${Date.now()}`;
    await createTableAndOpen(adminPage, tableName);
    await triggerSdrfImport(adminPage, path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
    await openTaskMonitor(adminPage);
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
  });

  test("import medium SDRF creates task visible in monitor", async ({ adminPage }) => {
    const tableName = `E2E Import Medium ${Date.now()}`;
    await createTableAndOpen(adminPage, tableName);
    await triggerSdrfImport(adminPage, path.join(FIXTURES_DIR, "PXD002137.sdrf.tsv"));
    await openTaskMonitor(adminPage);
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
  });

  test("completed import task shows in completed filter", async ({ adminPage }) => {
    test.setTimeout(90000);
    const tableName = `E2E Import Complete ${Date.now()}`;
    await createTableAndOpen(adminPage, tableName);
    await triggerSdrfImport(adminPage, path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
    await openTaskMonitor(adminPage);
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 15000 });

    const monitor = adminPage.locator("app-async-task-monitor");
    await monitor.getByRole("button", { name: /completed/i }).click();
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 20000 });
  });
});
