import { test, expect } from "../fixtures/auth";

const TEMPLATE_NAME = `E2E Template ${Date.now()}`;

test.describe("column templates", () => {
  test.afterEach(async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    for (const name of [TEMPLATE_NAME, TEMPLATE_NAME + " Renamed"]) {
      const row = adminPage.locator("tr, [role='row']").filter({ hasText: name }).first();
      if (await row.isVisible({ timeout: 2000 })) {
        await row.getByRole("button", { name: /delete/i }).click();
        const confirm = adminPage.getByRole("button", { name: /confirm|yes|delete/i });
        if (await confirm.isVisible({ timeout: 2000 })) await confirm.click();
      }
    }
  });

  test("column templates page loads", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await expect(adminPage).toHaveURL(/\/metadata-templates/, { timeout: 10000 });
  });

  test("seed column templates from ms-proteomics schema are visible", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await expect(adminPage.getByText(/organism|source name|instrument/i).first()).toBeVisible({ timeout: 10000 });
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
    await adminPage.locator("#columnName").fill("characteristics[biological replicate]");
    await adminPage.getByRole("button", { name: /save|create|submit/i }).click();
    await expect(adminPage.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(TEMPLATE_NAME)).toBeVisible({ timeout: 10000 });
  });

  test("rename template updates in list", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.locator("#templateName").fill(TEMPLATE_NAME);
    await adminPage.locator("#columnName").fill("characteristics[biological replicate]");
    await adminPage.getByRole("button", { name: /save|create|submit/i }).click();
    await expect(adminPage.getByText(TEMPLATE_NAME)).toBeVisible({ timeout: 10000 });

    const row = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME }).first();
    await row.getByRole("button", { name: /edit/i }).click();
    const nameInput = adminPage.locator("#templateName");
    await nameInput.clear();
    await nameInput.fill(TEMPLATE_NAME + " Renamed");
    await adminPage.getByRole("button", { name: /save|confirm|submit/i }).click();
    await expect(adminPage.getByText(TEMPLATE_NAME + " Renamed")).toBeVisible({ timeout: 10000 });
  });

  test("delete template removes it", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.locator("#templateName").fill(TEMPLATE_NAME);
    await adminPage.locator("#columnName").fill("characteristics[technical replicate]");
    await adminPage.getByRole("button", { name: /save|create|submit/i }).click();
    await expect(adminPage.getByText(TEMPLATE_NAME)).toBeVisible({ timeout: 10000 });

    const row = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME }).first();
    await row.getByRole("button", { name: /delete/i }).click();
    const confirm = adminPage.getByRole("button", { name: /confirm|yes|delete/i });
    if (await confirm.isVisible({ timeout: 2000 })) await confirm.click();
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
