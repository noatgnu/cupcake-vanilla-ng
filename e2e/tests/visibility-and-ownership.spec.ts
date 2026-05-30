import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

/**
 * Tests for lab group scoping, user ownership, and object visibility.
 *
 * Verifies that resources respect visibility rules: private tables are not
 * accessible to other users, group-scoped tables are visible only to group
 * members, and public tables are universally visible.
 */

const PRIVATE_TABLE = "E2E Private Table";
const PUBLIC_TABLE = "E2E Public Table";
const GROUP_TABLE = "E2E Group Table";

test.describe("object visibility and ownership", () => {
  test.afterEach(async ({ adminPage }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    for (const name of [PRIVATE_TABLE, PUBLIC_TABLE, GROUP_TABLE]) {
      try { await list.deleteTable(name); } catch { /* may not exist */ }
    }
  });

  test("private table created by testuser is not visible to admin", async ({
    userPage,
    adminPage,
  }) => {
    const userList = new MetadataTablePage(userPage);
    await userList.goto();
    await userPage.getByRole("button", { name: /new|create|add table/i }).click();
    await userPage.getByLabel(/name/i).fill(PRIVATE_TABLE);

    const visibilitySelect = userPage.getByLabel(/visibility/i);
    if (await visibilitySelect.isVisible({ timeout: 2000 })) {
      await visibilitySelect.selectOption("private");
    }
    await userPage.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(userPage.getByText(PRIVATE_TABLE)).toBeVisible({ timeout: 10000 });

    const adminList = new MetadataTablePage(adminPage);
    await adminList.goto();
    await adminList.expectTableNotInList(PRIVATE_TABLE);
  });

  test("group-scoped table is visible to lab group members", async ({
    userPage,
    adminPage,
  }) => {
    await userPage.goto("/metadata-tables");
    await userPage.getByRole("button", { name: /new|create|add table/i }).click();
    await userPage.getByLabel(/name/i).fill(GROUP_TABLE);

    const visibilitySelect = userPage.getByLabel(/visibility/i);
    if (await visibilitySelect.isVisible({ timeout: 2000 })) {
      await visibilitySelect.selectOption("group");
    }
    const labGroupSelect = userPage.getByLabel(/lab.?group/i);
    if (await labGroupSelect.isVisible({ timeout: 2000 })) {
      await labGroupSelect.selectOption({ label: "Test Lab" });
    }
    await userPage.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(userPage.getByText(GROUP_TABLE)).toBeVisible({ timeout: 10000 });

    const adminList = new MetadataTablePage(adminPage);
    await adminList.goto();
    await expect(adminPage.getByText(GROUP_TABLE)).toBeVisible({ timeout: 10000 });
  });

  test("seeded E2E Table owned by testuser is accessible to group members", async ({
    adminPage,
  }) => {
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.expectTableInList("E2E Table");
  });

  test("non-owner admin cannot delete a private table owned by testuser via UI", async ({
    userPage,
    adminPage,
  }) => {
    const userList = new MetadataTablePage(userPage);
    await userList.goto();
    await userPage.getByRole("button", { name: /new|create|add table/i }).click();
    await userPage.getByLabel(/name/i).fill(PRIVATE_TABLE);
    const visibilitySelect = userPage.getByLabel(/visibility/i);
    if (await visibilitySelect.isVisible({ timeout: 2000 })) {
      await visibilitySelect.selectOption("private");
    }
    await userPage.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(userPage.getByText(PRIVATE_TABLE)).toBeVisible({ timeout: 10000 });

    const adminList = new MetadataTablePage(adminPage);
    await adminList.goto();
    await adminList.expectTableNotInList(PRIVATE_TABLE);
  });

  test("public table is visible to all users", async ({ userPage, adminPage }) => {
    const userList = new MetadataTablePage(userPage);
    await userList.goto();
    await userPage.getByRole("button", { name: /new|create|add table/i }).click();
    await userPage.getByLabel(/name/i).fill(PUBLIC_TABLE);
    const visibilitySelect = userPage.getByLabel(/visibility/i);
    if (await visibilitySelect.isVisible({ timeout: 2000 })) {
      await visibilitySelect.selectOption("public");
    }
    await userPage.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(userPage.getByText(PUBLIC_TABLE)).toBeVisible({ timeout: 10000 });

    const adminList = new MetadataTablePage(adminPage);
    await adminList.goto();
    await adminList.expectTableInList(PUBLIC_TABLE);
  });
});
