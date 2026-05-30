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

  test("public table created by testuser is visible to admin", async ({ userPage, adminPage }) => {
    const name = `E2E Public Table ${Date.now()}`;
    await userPage.goto("/#/metadata-tables");
    await userPage.getByRole("button", { name: /new|create|add table/i }).click();
    await userPage.getByLabel(/name/i).fill(name);
    const visibilitySelect = userPage.getByLabel(/visibility/i);
    if (await visibilitySelect.isVisible({ timeout: 2000 })) {
      await visibilitySelect.selectOption("public");
    }
    await userPage.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(userPage.getByText(name)).toBeVisible({ timeout: 10000 });

    const adminList = new MetadataTablePage(adminPage);
    await adminList.goto();
    await adminList.expectTableInList(name);

    await new MetadataTablePage(userPage).goto();
    await new MetadataTablePage(userPage).deleteTable(name);
  });

  test("private table created by testuser is not visible to admin", async ({ userPage, adminPage }) => {
    const name = `E2E Private Table ${Date.now()}`;
    await userPage.goto("/#/metadata-tables");
    await userPage.getByRole("button", { name: /new|create|add table/i }).click();
    await userPage.getByLabel(/name/i).fill(name);
    const visibilitySelect = userPage.getByLabel(/visibility/i);
    if (await visibilitySelect.isVisible({ timeout: 2000 })) {
      await visibilitySelect.selectOption("private");
    }
    await userPage.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(userPage.getByText(name)).toBeVisible({ timeout: 10000 });

    const adminList = new MetadataTablePage(adminPage);
    await adminList.goto();
    await adminList.expectTableNotInList(name);

    await new MetadataTablePage(userPage).goto();
    await new MetadataTablePage(userPage).deleteTable(name);
  });
});
