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

test.describe("metadata column autofill modal", () => {
  test.setTimeout(180000);

  test("Auto-fill values button is visible for editable columns", async ({ adminPage }) => {
    const name = `E2E Autofill Visible ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);
    const autofillBtn = adminPage.locator('[title="Auto-fill values"]').first();
    await expect(autofillBtn).toBeVisible({ timeout: 10000 });
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("clicking Auto-fill values opens the autofill modal", async ({ adminPage }) => {
    const name = `E2E Autofill Open ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const autofillBtn = adminPage.locator('[title="Auto-fill values"]').first();
    await expect(autofillBtn).toBeVisible({ timeout: 10000 });
    await autofillBtn.click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/auto-fill column values/i).first()).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("autofill modal has Basic and Advanced tabs", async ({ adminPage }) => {
    const name = `E2E Autofill Tabs ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.locator('[title="Auto-fill values"]').first().click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByRole("tab", { name: /basic/i })).toBeVisible({ timeout: 3000 });
    await expect(adminPage.getByRole("tab", { name: /advanced/i })).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("switching to Advanced tab renders advanced content", async ({ adminPage }) => {
    const name = `E2E Autofill Advanced ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.locator('[title="Auto-fill values"]').first().click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole("tab", { name: /advanced/i }).click();
    const advancedContent = adminPage.getByRole("dialog").locator(".tab-pane.active, [ngbnavoutlet] > *").first();
    await expect(advancedContent).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});

test.describe("metadata column history modal", () => {
  test.setTimeout(180000);

  test("View column history button is visible for columns", async ({ adminPage }) => {
    const name = `E2E History Visible ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);
    const historyBtn = adminPage.locator('[title="View column history"]').first();
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("clicking View column history opens history modal", async ({ adminPage }) => {
    const name = `E2E History Open ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const historyBtn = adminPage.locator('[title="View column history"]').first();
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/column history/i).first()).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("history modal shows column name in the title", async ({ adminPage }) => {
    const name = `E2E History Title ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const historyBtn = adminPage.locator('[title="View column history"]').first();
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    const title = adminPage.locator(".modal-title");
    await expect(title).toContainText(/column history/i, { timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("history modal loads history records or shows empty state", async ({ adminPage }) => {
    const name = `E2E History Records ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const historyBtn = adminPage.locator('[title="View column history"]').first();
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    const hasRecords = await adminPage.locator(".timeline-item, .history-item").first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await adminPage.getByText(/no.*history|no records/i).isVisible({ timeout: 3000 }).catch(() => false);
    const hasLoading = await adminPage.locator(".spinner-border").isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRecords || hasEmpty || hasLoading).toBeTruthy();
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});
