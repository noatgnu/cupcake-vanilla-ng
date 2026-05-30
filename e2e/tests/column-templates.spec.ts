import { test } from "../fixtures/auth";
import { ColumnTemplatesPage } from "../page-objects/vanilla-ng/column-templates.po";

const TEMPLATE_NAME = "E2E PW Template";

test.describe("column templates", () => {
  test.afterEach(async ({ adminPage }) => {
    const page = new ColumnTemplatesPage(adminPage);
    await page.goto();
    try { await page.delete(TEMPLATE_NAME); } catch { /* may not exist */ }
    try { await page.delete(TEMPLATE_NAME + " Renamed"); } catch { /* may not exist */ }
  });

  test("create template appears in list", async ({ adminPage }) => {
    const page = new ColumnTemplatesPage(adminPage);
    await page.goto();
    await page.create(TEMPLATE_NAME);
  });

  test("rename template updates in list", async ({ adminPage }) => {
    const page = new ColumnTemplatesPage(adminPage);
    await page.goto();
    await page.create(TEMPLATE_NAME);
    await page.rename(TEMPLATE_NAME, TEMPLATE_NAME + " Renamed");
  });

  test("delete template removes it", async ({ adminPage }) => {
    const page = new ColumnTemplatesPage(adminPage);
    await page.goto();
    await page.create(TEMPLATE_NAME);
    await page.delete(TEMPLATE_NAME);
  });
});
