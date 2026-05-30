import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";
import { AdminPage } from "../page-objects/vanilla-ng/admin.po";

test.describe("admin pages", () => {
  test("admin can access site config", async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.gotoSiteConfig();
    await expect(adminPage).toHaveURL(/\/admin\/site-config/, { timeout: 10000 });
  });

  test("admin user list shows seeded users", async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.gotoUserManagement();
    await expect(adminPage.getByText(/admin|testuser|teststaff/i)).toBeVisible({ timeout: 10000 });
  });

  test("regular user cannot access admin pages", async ({ userPage }) => {
    await userPage.goto("/admin/site-config");
    await expect(userPage).not.toHaveURL(/\/admin\/site-config/, { timeout: 10000 });
  });
});
