import * as path from "path";
import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

test.describe("SDRF import", () => {
  test("import small SDRF creates new table", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");
    await adminPage.getByRole("button", { name: /import|upload|sdrf/i }).click();

    const fileInput = adminPage.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
    await adminPage.getByRole("button", { name: /import|upload|start/i }).click();

    await expect(adminPage.getByText(/PXD019185|PXD018883|import.*complete|task.*started/i)).toBeVisible({
      timeout: 60000,
    });
  });

  test("import malformed file shows error", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");
    await adminPage.getByRole("button", { name: /import|upload|sdrf/i }).click();

    const fileInput = adminPage.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "bad.sdrf.tsv",
      mimeType: "text/tab-separated-values",
      buffer: Buffer.from("this is not valid SDRF content"),
    });
    await adminPage.getByRole("button", { name: /import|upload|start/i }).click();

    await expect(adminPage.getByText(/error|invalid|failed/i)).toBeVisible({ timeout: 15000 });
  });

  test("import medium SDRF completes", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");
    await adminPage.getByRole("button", { name: /import|upload|sdrf/i }).click();

    const fileInput = adminPage.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD002137.sdrf.tsv"));
    await adminPage.getByRole("button", { name: /import|upload|start/i }).click();

    await expect(adminPage.getByText(/PXD002137|import.*complete|task.*started/i)).toBeVisible({
      timeout: 120000,
    });
  });
});
