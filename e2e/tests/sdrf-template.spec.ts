import * as path from "path";
import { test, expect } from "../fixtures/auth";

/**
 * UI-driven tests for SDRF schema and column template features.
 *
 * Tests the "Apply schema" toggle during SDRF import (which pre-populates
 * table columns from the official SDRF schema declaration), and tests
 * column template creation, search, and deletion via the UI at /metadata-templates.
 */

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");
const TEMPLATE_NAME = "E2E Characteristics Replicate";

test.describe("column templates", () => {
  test.afterEach(async ({ adminPage }) => {
    await adminPage.goto("/metadata-templates");
    const row = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_NAME }).first();
    if (await row.isVisible({ timeout: 3000 })) {
      await row.getByRole("button", { name: /delete/i }).click();
      const confirmBtn = adminPage.getByRole("button", { name: /confirm|yes|delete/i });
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
      }
    }
  });

  test("column templates page loads", async ({ userPage }) => {
    await userPage.goto("/metadata-templates");
    await expect(userPage).toHaveURL(/\/metadata-templates/, { timeout: 10000 });
    await expect(userPage.getByText("Column Templates")).toBeVisible({ timeout: 5000 });
  });

  test("New Template button opens creation modal", async ({ adminPage }) => {
    await adminPage.goto("/metadata-templates");

    await adminPage.getByRole("button", { name: /new template/i }).click();

    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("#templateName")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#columnName")).toBeVisible({ timeout: 3000 });
  });

  test("create new column template appears in list", async ({ adminPage }) => {
    await adminPage.goto("/metadata-templates");

    await adminPage.getByRole("button", { name: /new template/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    await adminPage.locator("#templateName").fill(TEMPLATE_NAME);
    await adminPage.locator("#columnName").fill("characteristics[biological replicate]");

    await adminPage.getByRole("button", { name: /save|create|submit/i }).click();

    await expect(adminPage.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(TEMPLATE_NAME)).toBeVisible({ timeout: 10000 });
  });

  test("schema filter buttons are visible", async ({ adminPage }) => {
    await adminPage.goto("/metadata-templates");

    await expect(adminPage.getByRole("button", { name: /all schemas/i })).toBeVisible({ timeout: 5000 });
  });

  test("visibility filter changes displayed templates", async ({ adminPage }) => {
    await adminPage.goto("/metadata-templates");

    const visibilitySelect = adminPage.locator("#visibilityFilter");
    await expect(visibilitySelect).toBeVisible({ timeout: 5000 });

    await visibilitySelect.selectOption("private");
    await expect(visibilitySelect).toHaveValue("private");

    await visibilitySelect.selectOption({ index: 0 });
  });
});

test.describe("SDRF import with Apply Schema", () => {
  test("Apply schema toggle is visible in import dropdown", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");

    const viewBtn = adminPage.locator("tr").filter({ hasText: "E2E Table" }).getByRole("button", { name: /view/i });
    await expect(viewBtn).toBeVisible({ timeout: 10000 });
    await viewBtn.click();

    await expect(adminPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await adminPage.getByRole("button", { name: /^import/i }).click();

    await expect(adminPage.locator("#applySchemaTemplatesToggle")).toBeVisible({ timeout: 3000 });
    await expect(adminPage.locator("#overrideSampleCountToggle")).toBeVisible({ timeout: 3000 });
  });

  test("import SDRF with Apply schema enabled creates task", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");

    const viewBtn = adminPage.locator("tr").filter({ hasText: "E2E Table" }).getByRole("button", { name: /view/i });
    await viewBtn.click();

    await expect(adminPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await adminPage.getByRole("button", { name: /^import/i }).click();

    const applySchemaToggle = adminPage.locator("#applySchemaTemplatesToggle");
    if (!await applySchemaToggle.isChecked()) {
      await applySchemaToggle.click();
    }

    const fileInput = adminPage.locator("input[type='file'][accept='.txt,.tsv']");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();

    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
  });
});
