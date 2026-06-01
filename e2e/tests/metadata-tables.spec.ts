import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";
import { MetadataTableDetailPage } from "../page-objects/vanilla-ng/metadata-table-detail.po";

const TABLE_NAME = `E2E Table ${Date.now()}`;
const COLUMN_SEARCH = "organism";

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

  test("open table shows detail view with columns section", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.openTable(TABLE_NAME);
    const detail = new MetadataTableDetailPage(adminPage);
    await detail.expectColumnsSection();
  });

  test("add column appears in table", async ({ adminPage }) => {
    test.setTimeout(150000);
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.openTable(TABLE_NAME);
    const detail = new MetadataTableDetailPage(adminPage);
    await detail.addColumn(COLUMN_SEARCH);
    await detail.expectColumnVisible(COLUMN_SEARCH);
  });

  test("delete column removes it", async ({ adminPage }) => {
    test.setTimeout(150000);
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.openTable(TABLE_NAME);
    const detail = new MetadataTableDetailPage(adminPage);
    await detail.addColumn(COLUMN_SEARCH);
    await detail.deleteColumn(COLUMN_SEARCH);
    await expect(adminPage.getByText(COLUMN_SEARCH).first()).not.toBeVisible({ timeout: 10000 });
  });

  test("search filters table list", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.search(TABLE_NAME);
    await list.expectTableInList(TABLE_NAME);
  });
});
