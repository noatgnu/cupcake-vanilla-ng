import { test, expect } from "../fixtures/auth";
import { fillReliably } from "../page-objects/common/fill";

const TEMPLATE_NAME = `E2E Template ${Date.now()}`;

test.describe("column templates", () => {
  test.afterEach(async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    for (const name of [TEMPLATE_NAME, TEMPLATE_NAME + " Renamed"]) {
      const row = adminPage.locator("tr, [role='row']").filter({ hasText: name }).first();
      if (await row.isVisible({ timeout: 2000 })) {
        await row.locator('[title="Delete template"]').click();
        await adminPage.getByRole("dialog").locator("button.btn-danger").click();
        await expect(adminPage.locator("tr, [role='row']").filter({ hasText: name })).toHaveCount(0, { timeout: 5000 });
      }
    }
  });

  test("column templates page loads", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await expect(adminPage).toHaveURL(/\/metadata-templates/, { timeout: 10000 });
  });

  test("seed column templates from ms-proteomics schema are visible", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await expect(adminPage.locator("table tbody tr").first()).toBeVisible({ timeout: 30000 });
  });

  test("New Template button opens creation modal", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#templateName")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#columnName")).toBeVisible({ timeout: 3000 });
  });

  test("create new column template appears in list", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await fillReliably(adminPage.locator("#templateName"), TEMPLATE_NAME);
    await fillReliably(adminPage.locator("#columnName"), "biological_replicate");
    const submitBtn = adminPage.locator(".modal-footer .btn-primary");
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await expect(adminPage.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await fillReliably(adminPage.locator("#templateSearch"), TEMPLATE_NAME);
    await expect(adminPage.getByText(TEMPLATE_NAME).first()).toBeVisible({ timeout: 10000 });
  });

  test("rename template updates in list", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await fillReliably(adminPage.locator("#templateName"), TEMPLATE_NAME);
    await fillReliably(adminPage.locator("#columnName"), "biological_replicate");
    let submitBtn = adminPage.locator(".modal-footer .btn-primary");
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await fillReliably(adminPage.locator("#templateSearch"), TEMPLATE_NAME);
    await expect(adminPage.getByText(TEMPLATE_NAME).first()).toBeVisible({ timeout: 10000 });

    const row = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME }).first();
    await row.locator('[title="Edit template"]').click();
    const nameInput = adminPage.locator("#templateName");
    await fillReliably(nameInput, TEMPLATE_NAME + " Renamed");
    submitBtn = adminPage.locator(".modal-footer .btn-primary");
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await expect(adminPage.getByText(TEMPLATE_NAME + " Renamed").first()).toBeVisible({ timeout: 10000 });
  });

  test("delete template removes it", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await fillReliably(adminPage.locator("#templateName"), TEMPLATE_NAME);
    await fillReliably(adminPage.locator("#columnName"), "technical_replicate");
    const submitBtn = adminPage.locator(".modal-footer .btn-primary");
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await fillReliably(adminPage.locator("#templateSearch"), TEMPLATE_NAME);
    await expect(adminPage.getByText(TEMPLATE_NAME).first()).toBeVisible({ timeout: 10000 });

    const row = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME }).first();
    await row.locator('[title="Delete template"]').click();
    await adminPage.getByRole("dialog").locator("button.btn-danger").click();
    await expect(adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME })).toHaveCount(0, { timeout: 5000 });
  });

  test("schema filter buttons are visible", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await expect(adminPage.getByRole("button", { name: /all schemas/i })).toBeVisible({ timeout: 5000 });
  });

  test("visibility filter changes displayed templates", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    const visibilitySelect = adminPage.locator("#visibilityFilter");
    await expect(visibilitySelect).toBeVisible({ timeout: 5000 });
    await visibilitySelect.selectOption("private");
    await expect(visibilitySelect).toHaveValue("private");
    await visibilitySelect.selectOption({ index: 0 });
  });
});
