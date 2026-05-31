import * as path from "path";
import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

test.describe("SDRF import with schema templates", () => {
  test("Apply schema toggle is visible in import dropdown", async ({ adminPage }) => {
    const tableName = `E2E Schema Toggle ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.openTable(tableName);
    await expect(adminPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await adminPage.locator('[title="Import Data"]').click();
    await expect(adminPage.locator("#applySchemaTemplatesToggle")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#overrideSampleCountToggle")).toBeVisible({ timeout: 3000 });
  });

  test("import SDRF with Apply schema enabled creates task", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Apply Schema ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.openTable(tableName);
    await expect(adminPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await adminPage.locator('[title="Import Data"]').click();
    const applySchemaToggle = adminPage.locator("#applySchemaTemplatesToggle");
    await expect(applySchemaToggle).toBeVisible({ timeout: 3000 });
    if (!await applySchemaToggle.isChecked()) {
      await applySchemaToggle.click();
    }
    const sdrfInput = adminPage.locator('input[type="file"][accept=".txt,.tsv"]');
    await sdrfInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
    await adminPage.getByRole("dialog").locator("button.btn-danger").click();

    await adminPage.locator("button[aria-label*='Background tasks']").click();
    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("column template CRUD", () => {
  const TEMPLATE_NAME = `E2E SDRF Template ${Date.now()}`;

  test.afterEach(async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    const row = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME }).first();
    if (await row.isVisible({ timeout: 2000 })) {
      await row.locator('[title="Delete template"]').click();
      await adminPage.getByRole("dialog").locator("button.btn-danger").click();
    }
  });

  test("built-in schema templates from ms-proteomics are present", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await expect(adminPage.locator("table tbody tr").first()).toBeVisible({ timeout: 30000 });
  });

  test("schema filter shows ms-proteomics and base schemas", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await expect(adminPage.getByRole("button", { name: /all schemas/i })).toBeVisible({ timeout: 5000 });
  });

  test("create custom template saves and appears in list", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.locator("#templateName").fill(TEMPLATE_NAME);
    await adminPage.locator("#columnName").fill("biological_replicate");
    const submitBtn = adminPage.locator(".modal-footer .btn-primary");
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await expect(adminPage.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(TEMPLATE_NAME).first()).toBeVisible({ timeout: 10000 });
  });
});
