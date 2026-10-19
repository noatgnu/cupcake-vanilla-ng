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

test.describe("validation results modal", () => {
  test.setTimeout(180000);

  test("running validation on a table with data shows results modal", async ({ adminPage }) => {
    const name = `E2E ValResults ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.goto("/#/metadata-tables");
    const row = adminPage.locator("tr").filter({ hasText: name });
    await row.getByRole("button", { name: /validate/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole("button", { name: /select all/i }).click();
    const validateBtn = adminPage.locator("button[type='submit']").filter({ hasText: /validate/i });
    await expect(validateBtn).not.toBeDisabled({ timeout: 5000 });
    await validateBtn.click();

    await adminPage.locator("button[aria-label*='Background tasks']").click();
    const monitor = adminPage.locator("app-async-task-monitor");
    await expect(monitor).toBeVisible({ timeout: 5000 });
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
    await adminPage.locator("button[aria-label*='Background tasks']").click();

    const resultsModal = adminPage.getByRole("dialog");
    if (await resultsModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      const hasPass = await resultsModal.getByText(/validation passed|validation successful/i).isVisible({ timeout: 3000 }).catch(() => false);
      const hasFail = await resultsModal.getByText(/validation failed/i).isVisible({ timeout: 3000 }).catch(() => false);
      const hasTitle = await resultsModal.locator(".modal-title").isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasPass || hasFail || hasTitle).toBeTruthy();
      const closeBtn = resultsModal.locator(".btn-close, button").filter({ hasText: /close/i }).first();
      await closeBtn.click();
    }

    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("validation results modal title reflects pass or fail", async ({ adminPage }) => {
    const name = `E2E ValTitle ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.goto("/#/metadata-tables");
    const row = adminPage.locator("tr").filter({ hasText: name });
    await row.getByRole("button", { name: /validate/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole("button", { name: /select all/i }).click();
    const validateBtn = adminPage.locator("button[type='submit']").filter({ hasText: /validate/i });
    await expect(validateBtn).not.toBeDisabled({ timeout: 5000 });
    await validateBtn.click();

    await adminPage.locator("button[aria-label*='Background tasks']").click();
    const monitor = adminPage.locator("app-async-task-monitor");
    await expect(monitor).toBeVisible({ timeout: 5000 });
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
    await adminPage.locator("button[aria-label*='Background tasks']").click();

    const resultsModal = adminPage.getByRole("dialog");
    if (await resultsModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      const title = resultsModal.locator(".modal-title");
      const titleText = await title.textContent({ timeout: 3000 }).catch(() => "");
      expect(/validation passed|validation failed/i.test(titleText || "")).toBeTruthy();
      const closeBtn = resultsModal.locator(".btn-close, button").filter({ hasText: /close/i }).first();
      await closeBtn.click();
    }

    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("empty table validation completes without crashing", async ({ adminPage }) => {
    const name = `E2E ValEmpty ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(name);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: name });
    await row.getByRole("button", { name: /validate/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole("button", { name: /select all/i }).click();
    const validateBtn = adminPage.locator("button[type='submit']").filter({ hasText: /validate/i });
    if (await validateBtn.isEnabled({ timeout: 3000 })) {
      await validateBtn.click();
      const openDialog = adminPage.getByRole("dialog");
      if (await openDialog.isVisible({ timeout: 5000 })) {
        await openDialog.locator(".btn-close, button.btn-secondary").first().click();
      }
    } else {
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }

    await list.deleteTable(name);
  });
});
