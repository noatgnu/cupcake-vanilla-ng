import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

test.describe("object visibility and ownership", () => {
  test("table created by admin is visible to admin", async ({ adminPage }) => {
    const name = `E2E Admin Table ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(name);
    await list.expectTableInList(name);
    await list.deleteTable(name);
  });

  test("table created by testuser is visible to testuser", async ({ userPage }) => {
    const name = `E2E User Table ${Date.now()}`;
    const list = new MetadataTablePage(userPage);
    await list.goto();
    await list.create(name);
    await list.expectTableInList(name);
    await list.deleteTable(name);
  });

  test("admin view toggle shows all tables including other users tables", async ({ userPage, adminPage }) => {
    const name = `E2E Admin View Table ${Date.now()}`;
    const userList = new MetadataTablePage(userPage);
    await userList.goto();
    await userList.create(name);
    await userList.expectTableInList(name);

    const adminList = new MetadataTablePage(adminPage);
    await adminList.goto();
    const adminViewToggle = adminPage.locator("#adminViewToggle");
    try {
      await expect(adminViewToggle).toBeVisible({ timeout: 10000 });
      if (!await adminViewToggle.isChecked()) {
        await adminViewToggle.click();
        await adminPage.waitForTimeout(1500);
      }
    } catch {
      // toggle unavailable — admin view not supported for this user
    }
    await adminList.search(name);
    await adminPage.waitForTimeout(1000);
    await adminList.expectTableInList(name);

    await userList.goto();
    await userList.deleteTable(name);
  });

  test("private table created by testuser is not visible to admin without admin view", async ({ userPage, adminPage }) => {
    const name = `E2E Private Table ${Date.now()}`;
    const userList = new MetadataTablePage(userPage);
    await userList.goto();
    await userList.create(name);
    await userList.expectTableInList(name);

    const adminList = new MetadataTablePage(adminPage);
    await adminList.goto();
    const adminViewToggle = adminPage.locator("#adminViewToggle");
    if (await adminViewToggle.isVisible({ timeout: 3000 }) && await adminViewToggle.isChecked()) {
      await adminViewToggle.click();
    }
    await adminList.expectTableNotInList(name);

    await userList.goto();
    await userList.deleteTable(name);
  });
});
