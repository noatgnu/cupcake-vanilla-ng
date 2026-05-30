import * as path from "path";
import { test, expect } from "../fixtures/auth";

/**
 * UI-driven SDRF import tests.
 *
 * The Import button lives inside the metadata table detail page (not the list).
 * Tests navigate to the E2E Table detail page, open the Import dropdown, click
 * "Import SDRF File", set the file, and verify the resulting async task appears
 * in the background tasks monitor (which is updated via WebSocket).
 */

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

async function openTableDetail(page: import("@playwright/test").Page, tableName: string): Promise<void> {
  await page.goto("/metadata-tables");
  const viewBtn = page.locator("tr").filter({ hasText: tableName }).getByRole("button", { name: /view/i });
  await expect(viewBtn).toBeVisible({ timeout: 10000 });
  await viewBtn.click();
  await expect(page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });
}

async function triggerSdrfImport(page: import("@playwright/test").Page, filePath: string): Promise<void> {
  await page.getByRole("button", { name: /^import/i }).click();
  const fileInput = page.locator("input[type='file'][accept='.txt,.tsv']");
  await fileInput.setInputFiles(filePath);
}

async function waitForTaskInMonitor(page: import("@playwright/test").Page, timeoutMs = 60000): Promise<void> {
  const tasksBtn = page.locator("button[aria-label*='Background tasks']");
  await tasksBtn.click();
  await expect(page.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
  await expect(page.locator(".task-item").first()).toBeVisible({ timeout: timeoutMs });
}

test.describe("SDRF import", () => {
  test("import small SDRF creates async task in background monitor", async ({ adminPage }) => {
    await openTableDetail(adminPage, "E2E Table");

    await triggerSdrfImport(adminPage, path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));

    await waitForTaskInMonitor(adminPage, 60000);
  });

  test("import dropdown shows Import SDRF File option", async ({ adminPage }) => {
    await openTableDetail(adminPage, "E2E Table");

    await adminPage.getByRole("button", { name: /^import/i }).click();

    await expect(adminPage.getByRole("link", { name: /import sdrf file/i })).toBeVisible({ timeout: 3000 });
    await expect(adminPage.getByRole("link", { name: /import excel/i })).toBeVisible({ timeout: 3000 });
  });

  test("import toggle options are visible in dropdown", async ({ adminPage }) => {
    await openTableDetail(adminPage, "E2E Table");

    await adminPage.getByRole("button", { name: /^import/i }).click();

    await expect(adminPage.locator("#overrideSampleCountToggle")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#applySchemaTemplatesToggle")).toBeVisible({ timeout: 3000 });
  });

  test("import medium SDRF creates task visible in monitor", async ({ adminPage }) => {
    await openTableDetail(adminPage, "E2E Table");

    await triggerSdrfImport(adminPage, path.join(FIXTURES_DIR, "PXD002137.sdrf.tsv"));

    await waitForTaskInMonitor(adminPage, 120000);
  });

  test("completed import task is shown in monitor after processing", async ({ adminPage }) => {
    await openTableDetail(adminPage, "E2E Table");

    await triggerSdrfImport(adminPage, path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();

    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 30000 });

    const monitor = adminPage.locator("app-async-task-monitor");
    await monitor.getByRole("button", { name: /completed/i }).click();
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 120000 });
  });
});
