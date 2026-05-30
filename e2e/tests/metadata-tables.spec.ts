import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";
import { MetadataTableDetailPage } from "../page-objects/vanilla-ng/metadata-table-detail.po";

const TABLE_NAME = "E2E Playwright Table";
const COLUMN_NAME = "E2E Column";

test.describe("metadata tables", () => {
  test.afterEach(async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    try {
      await list.deleteTable(TABLE_NAME);
    } catch {
      // table may not exist if test failed before creation
    }
  });

  test("create table appears in list", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.expectTableInList(TABLE_NAME);
  });

  test("click table opens detail view with columns section", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.openTable(TABLE_NAME);
    const detail = new MetadataTableDetailPage(adminPage);
    await detail.expectColumnsSection();
  });

  test("add column appears in table", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.openTable(TABLE_NAME);
    const detail = new MetadataTableDetailPage(adminPage);
    await detail.addColumn(COLUMN_NAME);
    await detail.expectColumnVisible(COLUMN_NAME);
  });

  test("delete column removes it", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.openTable(TABLE_NAME);
    const detail = new MetadataTableDetailPage(adminPage);
    await detail.addColumn(COLUMN_NAME);
    await detail.deleteColumn(COLUMN_NAME);
    await expect(adminPage.getByText(COLUMN_NAME)).not.toBeVisible({ timeout: 5000 });
  });

  test("search filters table list", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.search(TABLE_NAME);
    await list.expectTableInList(TABLE_NAME);
  });

  test("seeded E2E Table is visible", async ({ userPage }) => {
    const list = new MetadataTablePage(userPage);
    await list.goto();
    await list.expectTableInList("E2E Table");
  });
});
