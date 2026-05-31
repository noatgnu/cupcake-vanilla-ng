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

  await page.locator('[title="Import Data"]').click();
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("link", { name: /import sdrf file/i }).click(),
  ]);
  await fileChooser.setFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
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

test.describe("Excel export", () => {
  test("Excel export option is visible in export dropdown", async ({ adminPage }) => {
    test.setTimeout(90000);
    const tableName = `E2E Excel Visible ${Date.now()}`;
    await createTableWithData(adminPage, tableName);
    await adminPage.locator('[title="Export Table"]').click();
    await expect(adminPage.getByRole("link", { name: /export as excel/i })).toBeVisible({ timeout: 3000 });
  });

  test("Excel export creates async task in background monitor", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Excel Export ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.locator('[title="Export Table"]').click();
    await adminPage.getByRole("link", { name: /export as excel/i }).click();
    const exportModal = adminPage.getByRole("dialog").filter({ hasText: /excel export options/i });
    await expect(exportModal).toBeVisible({ timeout: 5000 });
    await exportModal.locator(".modal-footer .btn-primary").click();
    await expect(exportModal).not.toBeVisible({ timeout: 5000 });

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();
    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
  });

  test("completed Excel export task has task-completed styling and shows download button", async ({ adminPage }) => {
    test.setTimeout(180000);
    const tableName = `E2E Excel Download ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.locator('[title="Export Table"]').click();
    await adminPage.getByRole("link", { name: /export as excel/i }).click();
    const exportModal = adminPage.getByRole("dialog").filter({ hasText: /excel export options/i });
    await expect(exportModal).toBeVisible({ timeout: 5000 });
    await exportModal.locator(".modal-footer .btn-primary").click();
    await expect(exportModal).not.toBeVisible({ timeout: 5000 });

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();
    const monitor = adminPage.locator("app-async-task-monitor");
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
    await monitor.getByRole("button", { name: /completed/i }).click();
    await expect(monitor.locator(".task-item.task-completed").first()).toBeVisible({ timeout: 20000 });
    await expect(
      monitor.locator(".task-item.task-completed button[title*='Download']").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Excel export auto-downloads file on completion", async ({ adminPage }) => {
    test.setTimeout(180000);
    const tableName = `E2E Excel AutoDownload ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.locator('[title="Export Table"]').click();
    await adminPage.getByRole("link", { name: /export as excel/i }).click();
    const exportModal = adminPage.getByRole("dialog").filter({ hasText: /excel export options/i });
    await expect(exportModal).toBeVisible({ timeout: 5000 });

    const downloadPromise = adminPage.waitForEvent("download", { timeout: 60000 });
    await exportModal.locator(".modal-footer .btn-primary").click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
  });
});
