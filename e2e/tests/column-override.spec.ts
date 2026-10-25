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

test.describe("column override import modal", () => {
  test.setTimeout(150000);

  test("Import/Override Columns item is in the Import dropdown", async ({ adminPage }) => {
    const name = `E2E Override Item ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.locator('[title="Import Data"]').click();
    await expect(adminPage.getByText(/import.*override columns/i).first()).toBeVisible({ timeout: 5000 });
    await adminPage.keyboard.press("Escape");
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("clicking Import/Override Columns opens the modal", async ({ adminPage }) => {
    const name = `E2E Override Open ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.locator('[title="Import Data"]').click();
    await adminPage.getByText(/import.*override columns/i).first().click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/import.*override columns/i).first()).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("override modal upload step has file input and algorithm select", async ({ adminPage }) => {
    const name = `E2E Override Upload ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.locator('[title="Import Data"]').click();
    await adminPage.getByText(/import.*override columns/i).first().click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByRole("dialog").locator('input[type="file"]')).toBeVisible({ timeout: 3000 });
    await expect(adminPage.getByRole("dialog").locator('select[formcontrolname="algorithm"]')).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("override modal has update default value and per-sample value toggles", async ({ adminPage }) => {
    const name = `E2E Override Toggles ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.locator('[title="Import Data"]').click();
    await adminPage.getByText(/import.*override columns/i).first().click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#updateValue")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#updateModifiers")).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("uploading an SDRF file advances to mapping step", async ({ adminPage }) => {
    const name = `E2E Override Map ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    await adminPage.locator('[title="Import Data"]').click();
    await adminPage.getByText(/import.*override columns/i).first().click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    const fileInput = adminPage.getByRole("dialog").locator('input[type="file"]');
    await fileInput.setInputFiles(SDRF_FILE);

    const nextBtn = adminPage.getByRole("dialog").locator("button").filter({ hasText: /next|suggest|continue/i }).first();
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await nextBtn.click();
    await expect(adminPage.getByRole("dialog").getByText(/map|mapping|column.*mapping/i).first()).toBeVisible({ timeout: 10000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});
