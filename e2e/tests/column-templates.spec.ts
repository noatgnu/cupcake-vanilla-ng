import { test, expect } from "../fixtures/auth";

const TEMPLATE_NAME = `E2E Template ${Date.now()}`;

test.describe("column templates", () => {
  test.afterEach(async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    for (const name of [TEMPLATE_NAME, TEMPLATE_NAME + " Renamed"]) {
      const row = adminPage.locator("tr, [role='row']").filter({ hasText: name }).first();
      if (await row.isVisible({ timeout: 2000 })) {
        adminPage.once("dialog", dialog => dialog.accept());
        await row.getByRole("button", { name: /delete/i }).click();
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
    await adminPage.locator("#templateName").fill(TEMPLATE_NAME);
    await adminPage.locator("#columnName").fill("biological_replicate");
    await adminPage.locator(".modal-footer .btn-primary").click({ force: true });
    await expect(adminPage.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(TEMPLATE_NAME)).toBeVisible({ timeout: 10000 });
  });

  test("rename template updates in list", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.locator("#templateName").fill(TEMPLATE_NAME);
    await adminPage.locator("#columnName").fill("biological_replicate");
    await adminPage.locator(".modal-footer .btn-primary").click({ force: true });
    await expect(adminPage.getByText(TEMPLATE_NAME)).toBeVisible({ timeout: 10000 });

    const row = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME }).first();
    await row.getByRole("button", { name: /edit/i }).click();
    const nameInput = adminPage.locator("#templateName");
    await nameInput.clear();
    await nameInput.fill(TEMPLATE_NAME + " Renamed");
    await adminPage.locator(".modal-footer .btn-primary").click({ force: true });
    await expect(adminPage.getByText(TEMPLATE_NAME + " Renamed")).toBeVisible({ timeout: 10000 });
  });

  test("delete template removes it", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.locator("#templateName").fill(TEMPLATE_NAME);
    await adminPage.locator("#columnName").fill("technical_replicate");
    await adminPage.locator(".modal-footer .btn-primary").click({ force: true });
    await expect(adminPage.getByText(TEMPLATE_NAME)).toBeVisible({ timeout: 10000 });

    const row = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME }).first();
    adminPage.once("dialog", dialog => dialog.accept());
    await row.getByRole("button", { name: /delete/i }).click();
    await expect(adminPage.getByText(TEMPLATE_NAME)).not.toBeVisible({ timeout: 5000 });
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
