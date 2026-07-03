import { test, expect } from "../fixtures/auth";
import { NavbarPage } from "../page-objects/common/navbar.po";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";
import { MetadataTableDetailPage } from "../page-objects/vanilla-ng/metadata-table-detail.po";
import { ColumnTemplatesPage } from "../page-objects/vanilla-ng/column-templates.po";
import { expectNoHorizontalOverflow } from "../page-objects/common/viewport";

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLE_NAME = `E2E Mobile Table ${Date.now()}`;

test.describe("mobile viewport layout", () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.setViewportSize(MOBILE_VIEWPORT);
  });

  test.afterEach(async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    try {
      await list.deleteTable(TABLE_NAME);
    } catch {
      // table may not exist if test failed before creation
    }
  });

  test("navbar collapses behind a toggler and expands on tap", async ({ adminPage }) => {
    const navbar = new NavbarPage(adminPage);
    const list = new MetadataTablePage(adminPage);
    await list.goto();

    await expect(adminPage.locator(".navbar-toggler")).toBeVisible();
    await navbar.expectMenuCollapsed();
    await expect(adminPage.getByRole("link", { name: /data tables/i })).not.toBeVisible();

    await navbar.toggleMenu();
    await navbar.expectMenuExpanded();
    await expect(adminPage.getByRole("link", { name: /data tables/i })).toBeVisible();

    await expectNoHorizontalOverflow(adminPage);
  });

  test("metadata tables list has no horizontal overflow", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await expectNoHorizontalOverflow(adminPage);
  });

  test("metadata table detail toolbar wraps instead of overflowing", async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(TABLE_NAME);
    await list.openTable(TABLE_NAME);

    const detail = new MetadataTableDetailPage(adminPage);
    await detail.expectColumnsSection();

    await expectNoHorizontalOverflow(adminPage);
  });

  test("column templates page has no horizontal overflow", async ({ adminPage }) => {
    const templates = new ColumnTemplatesPage(adminPage);
    await templates.goto();
    await expectNoHorizontalOverflow(adminPage);
  });
});
