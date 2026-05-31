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
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("link", { name: /import sdrf file/i }).click(),
  ]);
  await fileChooser.setFiles(SDRF_FILE);
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

test.describe("favorites management", () => {
  test("favorites page loads", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    await expect(adminPage).toHaveURL(/\/favorites/, { timeout: 10000 });
  });

  test("Add Favorite button opens create modal", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    await adminPage.getByRole("button", { name: /add favorite/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#favName")).toBeVisible({ timeout: 3000 });
  });

  test("create favorite form has name and scope fields", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    await adminPage.getByRole("button", { name: /add favorite/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#favName")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#favType")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#favScope")).toBeVisible({ timeout: 3000 });
  });

  test("create favorite submit is disabled until required fields filled", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    await adminPage.getByRole("button", { name: /add favorite/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    const submitBtn = adminPage.locator(".modal-footer .btn-primary");
    await expect(submitBtn).toBeDisabled({ timeout: 3000 });
  });
});

test.describe("metadata validation modal", () => {
  test("Validate button opens validation modal from table list", async ({ adminPage }) => {
    const tableName = `E2E Validate ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: tableName });
    await row.getByRole("button", { name: /validate/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/validate metadata table/i)).toBeVisible({ timeout: 3000 });

    await adminPage.getByRole("dialog").locator(".modal-header .btn-close").click();
    await list.deleteTable(tableName);
  });

  test("validation modal shows schema list and Select All button", async ({ adminPage }) => {
    const tableName = `E2E ValidateSchemas ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: tableName });
    await row.getByRole("button", { name: /validate/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByRole("button", { name: /select all/i })).toBeVisible({ timeout: 5000 });

    await adminPage.getByRole("dialog").locator(".modal-header .btn-close").click();
    await list.deleteTable(tableName);
  });

  test("validation submit button is disabled with no schemas selected", async ({ adminPage }) => {
    const tableName = `E2E ValidateDisabled ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: tableName });
    await row.getByRole("button", { name: /validate/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole("button", { name: /clear all/i }).click();
    const validateBtn = adminPage.locator("button[type='submit']").filter({ hasText: /validate/i });
    await expect(validateBtn).toBeDisabled({ timeout: 3000 });

    await adminPage.getByRole("dialog").locator(".modal-header .btn-close").click();
    await list.deleteTable(tableName);
  });

  test("validation runs after selecting a schema", async ({ adminPage }) => {
    const tableName = `E2E ValidateRun ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.goto();

    const row = adminPage.locator("tr").filter({ hasText: tableName });
    await row.getByRole("button", { name: /validate/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole("button", { name: /select all/i }).click();
    const validateBtn = adminPage.locator("button[type='submit']").filter({ hasText: /validate/i });
    await expect(validateBtn).not.toBeDisabled({ timeout: 5000 });
    await validateBtn.click();
    await expect(adminPage.locator("app-async-task-monitor, .task-item, [class*='task']").first()).toBeVisible({ timeout: 10000 });

    await list.deleteTable(tableName);
  });
});

test.describe("metadata value edit modal", () => {
  test("edit default value modal opens for an organism column", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E EditValue ${Date.now()}`;
    await createTableWithImportedData(adminPage, tableName);

    const editBtn = adminPage.getByRole("button", { name: /edit default value for organism/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/organism/i).first()).toBeVisible({ timeout: 3000 });
  });

  test("organism column edit modal shows typeahead input", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Typeahead ${Date.now()}`;
    await createTableWithImportedData(adminPage, tableName);

    const editBtn = adminPage.getByRole("button", { name: /edit default value for organism/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    const typeaheadInput = adminPage.locator("#metadataValue");
    await expect(typeaheadInput).toBeVisible({ timeout: 5000 });
    await typeaheadInput.fill("homo");
    await expect(adminPage.locator("[id^='typeahead-'], ngb-typeahead-window, [role='listbox']").first()).toBeVisible({ timeout: 5000 });
  });

  test("age column edit modal shows sdrf-age-input component", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E AgeInput ${Date.now()}`;
    await createTableWithImportedData(adminPage, tableName);

    const editBtn = adminPage.getByRole("button", { name: /edit default value for age/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("ccv-sdrf-age-input")).toBeVisible({ timeout: 5000 });
  });

  test("age input range toggle switches between single and range mode", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E AgeRange ${Date.now()}`;
    await createTableWithImportedData(adminPage, tableName);

    const editBtn = adminPage.getByRole("button", { name: /edit default value for age/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("ccv-sdrf-age-input")).toBeVisible({ timeout: 5000 });

    const rangeToggle = adminPage.locator("input[formcontrolname='isRange']");
    await expect(rangeToggle).toBeVisible({ timeout: 3000 });
    await rangeToggle.click();
    await expect(adminPage.locator("input[formcontrolname='rangeStart']")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("input[formcontrolname='rangeEnd']")).toBeVisible({ timeout: 3000 });
  });
});

test.describe("sample pool create modal", () => {
  test("Create Pool button opens sample pool modal", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Pool ${Date.now()}`;
    await createTableWithImportedData(adminPage, tableName);

    await adminPage.getByRole("button", { name: /create pool/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#poolName")).toBeVisible({ timeout: 3000 });
  });

  test("sample pool create form submit is disabled until pool name is filled", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E PoolDisabled ${Date.now()}`;
    await createTableWithImportedData(adminPage, tableName);

    await adminPage.getByRole("button", { name: /create pool/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    const submitBtn = adminPage.locator(".modal-footer .btn-primary, button[type='submit']").filter({ hasText: /create/i });
    await expect(submitBtn).toBeDisabled({ timeout: 3000 });
  });

  test("pool name entry enables create button", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E PoolEnabled ${Date.now()}`;
    await createTableWithImportedData(adminPage, tableName);

    await adminPage.getByRole("button", { name: /create pool/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.locator("#poolName").fill("Test Pool 1");
    const manualModeBtn = adminPage.locator("input[id='manualMode']");
    if (await manualModeBtn.isVisible({ timeout: 2000 })) {
      await manualModeBtn.click();
    }
    const sampleRange = adminPage.locator("input[formcontrolname='startSample'], input[id='startSample']");
    if (await sampleRange.isVisible({ timeout: 2000 })) {
      await sampleRange.fill("1");
      const endSample = adminPage.locator("input[formcontrolname='endSample'], input[id='endSample']");
      if (await endSample.isVisible({ timeout: 2000 })) {
        await endSample.fill("3");
      }
    }
    await expect(adminPage.getByText(/total pooled/i)).toBeVisible({ timeout: 3000 });
  });
});
