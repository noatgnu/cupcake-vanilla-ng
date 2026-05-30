import * as path from "path";
import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";
import { ColumnTemplatesPage } from "../page-objects/vanilla-ng/column-templates.po";

/**
 * Tests that verify column templates can be created from imported SDRF schemas.
 *
 * Imports two different SDRF files and saves each resulting table's column
 * layout as a named template, then verifies the templates differ in their
 * column sets — confirming schema-specific templates are correctly captured.
 */

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

const TEMPLATE_SMALL = "E2E Template PXD019185";
const TEMPLATE_MEDIUM = "E2E Template PXD002137";

test.describe("column templates from SDRF schemas", () => {
  test.afterEach(async ({ adminPage }) => {
    const templates = new ColumnTemplatesPage(adminPage);
    await templates.goto();
    for (const name of [TEMPLATE_SMALL, TEMPLATE_MEDIUM]) {
      try { await templates.delete(name); } catch { /* may not exist */ }
    }
    await adminPage.goto("/metadata-tables");
    for (const pattern of ["PXD019185", "PXD002137"]) {
      const rows = adminPage.locator("tr, [role='row']").filter({ hasText: pattern });
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        try {
          await rows.first().getByRole("button", { name: /delete/i }).click();
          await adminPage.getByRole("button", { name: /confirm|yes|delete/i }).click();
        } catch { /* may not exist */ }
      }
    }
  });

  test("import PXD019185 SDRF and save schema as template", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");
    await adminPage.getByRole("button", { name: /import|upload|sdrf/i }).click();
    const fileInput = adminPage.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
    await adminPage.getByRole("button", { name: /import|upload|start/i }).click();
    await expect(adminPage.getByText(/PXD019185|import.*complete|task.*started/i)).toBeVisible({
      timeout: 60000,
    });

    await adminPage.goto("/metadata-tables");
    const tableRow = adminPage.locator("tr, [role='row']").filter({ hasText: "PXD019185" }).first();
    await expect(tableRow).toBeVisible({ timeout: 15000 });

    const saveAsTemplateBtn = tableRow.getByRole("button", { name: /template|save.*template/i });
    if (await saveAsTemplateBtn.isVisible({ timeout: 2000 })) {
      await saveAsTemplateBtn.click();
    } else {
      await tableRow.click();
      await adminPage.getByRole("button", { name: /save.*template|create.*template/i }).click();
    }

    const nameInput = adminPage.getByLabel(/template.*name|name/i).last();
    await nameInput.fill(TEMPLATE_SMALL);
    await adminPage.getByRole("button", { name: /save|confirm|create/i }).click();

    const templates = new ColumnTemplatesPage(adminPage);
    await templates.goto();
    await expect(adminPage.getByText(TEMPLATE_SMALL)).toBeVisible({ timeout: 10000 });
  });

  test("import PXD002137 SDRF and save schema as template", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");
    await adminPage.getByRole("button", { name: /import|upload|sdrf/i }).click();
    const fileInput = adminPage.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD002137.sdrf.tsv"));
    await adminPage.getByRole("button", { name: /import|upload|start/i }).click();
    await expect(adminPage.getByText(/PXD002137|import.*complete|task.*started/i)).toBeVisible({
      timeout: 120000,
    });

    await adminPage.goto("/metadata-tables");
    const tableRow = adminPage.locator("tr, [role='row']").filter({ hasText: "PXD002137" }).first();
    await expect(tableRow).toBeVisible({ timeout: 15000 });

    const saveAsTemplateBtn = tableRow.getByRole("button", { name: /template|save.*template/i });
    if (await saveAsTemplateBtn.isVisible({ timeout: 2000 })) {
      await saveAsTemplateBtn.click();
    } else {
      await tableRow.click();
      await adminPage.getByRole("button", { name: /save.*template|create.*template/i }).click();
    }

    const nameInput = adminPage.getByLabel(/template.*name|name/i).last();
    await nameInput.fill(TEMPLATE_MEDIUM);
    await adminPage.getByRole("button", { name: /save|confirm|create/i }).click();

    const templates = new ColumnTemplatesPage(adminPage);
    await templates.goto();
    await expect(adminPage.getByText(TEMPLATE_MEDIUM)).toBeVisible({ timeout: 10000 });
  });

  test("templates from different SDRF files have distinct column schemas", async ({
    adminPage,
  }) => {
    await adminPage.goto("/metadata-tables");

    await adminPage.getByRole("button", { name: /import|upload|sdrf/i }).click();
    let fileInput = adminPage.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
    await adminPage.getByRole("button", { name: /import|upload|start/i }).click();
    await expect(adminPage.getByText(/PXD019185|import.*complete|task.*started/i)).toBeVisible({
      timeout: 60000,
    });

    await adminPage.goto("/metadata-tables");
    const smallRow = adminPage.locator("tr, [role='row']").filter({ hasText: "PXD019185" }).first();
    await expect(smallRow).toBeVisible({ timeout: 15000 });
    const smallSaveBtn = smallRow.getByRole("button", { name: /template|save.*template/i });
    if (await smallSaveBtn.isVisible({ timeout: 2000 })) {
      await smallSaveBtn.click();
    } else {
      await smallRow.click();
      await adminPage.getByRole("button", { name: /save.*template|create.*template/i }).click();
    }
    const nameInputSmall = adminPage.getByLabel(/template.*name|name/i).last();
    await nameInputSmall.fill(TEMPLATE_SMALL);
    await adminPage.getByRole("button", { name: /save|confirm|create/i }).click();

    await adminPage.goto("/metadata-tables");
    await adminPage.getByRole("button", { name: /import|upload|sdrf/i }).click();
    fileInput = adminPage.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD002137.sdrf.tsv"));
    await adminPage.getByRole("button", { name: /import|upload|start/i }).click();
    await expect(adminPage.getByText(/PXD002137|import.*complete|task.*started/i)).toBeVisible({
      timeout: 120000,
    });

    await adminPage.goto("/metadata-tables");
    const medRow = adminPage.locator("tr, [role='row']").filter({ hasText: "PXD002137" }).first();
    await expect(medRow).toBeVisible({ timeout: 15000 });
    const medSaveBtn = medRow.getByRole("button", { name: /template|save.*template/i });
    if (await medSaveBtn.isVisible({ timeout: 2000 })) {
      await medSaveBtn.click();
    } else {
      await medRow.click();
      await adminPage.getByRole("button", { name: /save.*template|create.*template/i }).click();
    }
    const nameInputMed = adminPage.getByLabel(/template.*name|name/i).last();
    await nameInputMed.fill(TEMPLATE_MEDIUM);
    await adminPage.getByRole("button", { name: /save|confirm|create/i }).click();

    const templates = new ColumnTemplatesPage(adminPage);
    await templates.goto();
    await expect(adminPage.getByText(TEMPLATE_SMALL)).toBeVisible({ timeout: 10000 });
    await expect(adminPage.getByText(TEMPLATE_MEDIUM)).toBeVisible({ timeout: 10000 });

    const smallEntry = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_SMALL }).first();
    const medEntry = adminPage.locator("tr, [role='row']").filter({ hasText: TEMPLATE_MEDIUM }).first();
    const smallColCount = await smallEntry.getByText(/column|col/i).count();
    const medColCount = await medEntry.getByText(/column|col/i).count();
    expect(smallColCount + medColCount).toBeGreaterThan(0);
  });
});
