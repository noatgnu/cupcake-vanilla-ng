import * as path from "path";
import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";
import { fillReliably } from "../page-objects/common/fill";

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

async function createPool(page: import("@playwright/test").Page, poolName: string): Promise<void> {
  await page.getByRole("button", { name: /create pool/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  await fillReliably(page.locator("#poolName"), poolName);
  const dialog = page.getByRole("dialog");
  await dialog.locator('tbody input[type="checkbox"]:not([disabled])').first().check();
  await dialog.locator("button.btn-outline-primary").filter({ hasText: /pooled only/i }).click();
  const submitBtn = page.locator(".modal-footer button.btn-primary, button[type='submit']").filter({ hasText: /create/i });
  await expect(submitBtn).not.toBeDisabled({ timeout: 3000 });
  await submitBtn.click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
}

test.describe("sample pool details modal", () => {
  test.setTimeout(180000);

  test("clicking a pool row opens pool details modal", async ({ adminPage }) => {
    const name = `E2E Pool Details ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);
    await createPool(adminPage, "Details Pool");

    const poolRow = adminPage.locator(".pool-row, tr").filter({ hasText: "Details Pool" }).first();
    await expect(poolRow).toBeVisible({ timeout: 10000 });
    await poolRow.click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/pool.*id|total samples/i).first()).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
  });

  test("pool details modal shows pool name", async ({ adminPage }) => {
    const name = `E2E Pool Details Name ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);
    await createPool(adminPage, "Named Pool");

    const poolRow = adminPage.locator(".pool-row, tr").filter({ hasText: "Named Pool" }).first();
    await expect(poolRow).toBeVisible({ timeout: 10000 });
    await poolRow.click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText("Named Pool").first()).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
  });

  test("pool details modal shows sample configuration section", async ({ adminPage }) => {
    const name = `E2E Pool Details Config ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);
    await createPool(adminPage, "Config Pool");

    const poolRow = adminPage.locator(".pool-row, tr").filter({ hasText: "Config Pool" }).first();
    await expect(poolRow).toBeVisible({ timeout: 10000 });
    await poolRow.click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/sample configuration|pooled.*samples/i).first()).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
  });
});

test.describe("sample pool edit modal", () => {
  test.setTimeout(180000);

  test("edit pool button opens edit modal", async ({ adminPage }) => {
    const name = `E2E Pool Edit ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);
    await createPool(adminPage, "Edit Me Pool");

    const poolRow = adminPage.locator(".pool-row, tr").filter({ hasText: "Edit Me Pool" }).first();
    await expect(poolRow).toBeVisible({ timeout: 10000 });

    await poolRow.locator('td[title^="Click to edit pool"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#poolName")).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
  });

  test("pool edit modal pre-fills the current pool name", async ({ adminPage }) => {
    const name = `E2E Pool Edit Prefill ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);
    await createPool(adminPage, "Prefill Pool");

    const poolRow = adminPage.locator(".pool-row, tr").filter({ hasText: "Prefill Pool" }).first();
    await expect(poolRow).toBeVisible({ timeout: 10000 });

    await poolRow.locator('td[title^="Click to edit pool"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#poolName")).toHaveValue("Prefill Pool", { timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
  });

  test("pool edit modal has description field", async ({ adminPage }) => {
    const name = `E2E Pool Edit Desc ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);
    await createPool(adminPage, "Desc Pool");

    const poolRow = adminPage.locator(".pool-row, tr").filter({ hasText: "Desc Pool" }).first();
    await expect(poolRow).toBeVisible({ timeout: 10000 });

    await poolRow.locator('td[title^="Click to edit pool"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#poolDescription")).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
  });
});
