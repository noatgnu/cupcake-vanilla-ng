import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

async function createAndOpenTable(page: import("@playwright/test").Page, name: string): Promise<void> {
  const list = new MetadataTablePage(page);
  await list.goto();
  await list.create(name);
  await list.openTable(name);
  await expect(page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });
}

test.describe("metadata table edit modal", () => {
  test("Edit Table button is visible for table owner", async ({ adminPage }) => {
    const name = `E2E Edit Visible ${Date.now()}`;
    await createAndOpenTable(adminPage, name);
    await expect(adminPage.locator('[title="Edit Table"]')).toBeVisible({ timeout: 10000 });
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("Edit Table button opens edit modal", async ({ adminPage }) => {
    const name = `E2E Edit Open ${Date.now()}`;
    await createAndOpenTable(adminPage, name);
    await adminPage.locator('[title="Edit Table"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#tableName")).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("edit modal pre-fills with current table name", async ({ adminPage }) => {
    const name = `E2E Edit Prefill ${Date.now()}`;
    await createAndOpenTable(adminPage, name);
    await adminPage.locator('[title="Edit Table"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    const nameInput = adminPage.locator("#tableName");
    await expect(nameInput).toHaveValue(name, { timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("edit modal has description and sample count fields", async ({ adminPage }) => {
    const name = `E2E Edit Fields ${Date.now()}`;
    await createAndOpenTable(adminPage, name);
    await adminPage.locator('[title="Edit Table"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#tableDescription")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#sampleCount")).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("edit modal submit is disabled when name is cleared", async ({ adminPage }) => {
    const name = `E2E Edit Disabled ${Date.now()}`;
    await createAndOpenTable(adminPage, name);
    await adminPage.locator('[title="Edit Table"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.locator("#tableName").clear();
    const submitBtn = adminPage.getByRole("dialog").locator("button[type='submit'], .modal-footer .btn-primary").first();
    await expect(submitBtn).toBeDisabled({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("saving new table name updates the heading", async ({ adminPage }) => {
    const name = `E2E Edit Save ${Date.now()}`;
    const newName = `E2E Edit Renamed ${Date.now()}`;
    await createAndOpenTable(adminPage, name);
    await adminPage.locator('[title="Edit Table"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.locator("#tableName").fill(newName);
    const submitBtn = adminPage.getByRole("dialog").locator("button[type='submit'], .modal-footer .btn-primary").first();
    await submitBtn.click();
    await expect(adminPage.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(newName).first()).toBeVisible({ timeout: 5000 });
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(newName);
  });
});

test.describe("reorder columns by schema", () => {
  test.setTimeout(150000);

  test("Reorder Columns button opens schema selection modal", async ({ adminPage }) => {
    const name = `E2E Reorder Open ${Date.now()}`;
    await createAndOpenTable(adminPage, name);

    await adminPage.locator('[title="Reorder Columns by Schema"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/reorder columns by schema/i).first()).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("schema selection modal has search and select all controls", async ({ adminPage }) => {
    const name = `E2E Reorder Controls ${Date.now()}`;
    await createAndOpenTable(adminPage, name);

    await adminPage.locator('[title="Reorder Columns by Schema"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator('input[placeholder*="Search schemas"]')).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByRole("dialog").getByRole("button", { name: /all/i }).first()).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("schema selection modal shows available schemas", async ({ adminPage }) => {
    const name = `E2E Reorder Schemas ${Date.now()}`;
    await createAndOpenTable(adminPage, name);

    await adminPage.locator('[title="Reorder Columns by Schema"]').click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    const schemaItems = adminPage.getByRole("dialog").locator(".list-group-item, .schema-item, li");
    await expect(schemaItems.first()).toBeVisible({ timeout: 10000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});
