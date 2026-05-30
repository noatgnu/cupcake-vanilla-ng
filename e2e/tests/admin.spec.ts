import { test, expect } from "../fixtures/auth";

test.describe("admin pages", () => {
  test("admin can access site config", async ({ adminPage }) => {
    await adminPage.goto("/admin/site-config");
    await expect(adminPage).toHaveURL(/\/admin\/site-config/, { timeout: 10000 });
  });

  test("site config page shows site name field", async ({ adminPage }) => {
    await adminPage.goto("/admin/site-config");
    await expect(adminPage.getByLabel(/site.?name/i)).toBeVisible({ timeout: 10000 });
  });

  test("admin user list shows admin user", async ({ adminPage }) => {
    await adminPage.goto("/admin/users");
    await expect(adminPage.getByText("admin")).toBeVisible({ timeout: 10000 });
  });

  test("admin user list shows testuser", async ({ adminPage }) => {
    await adminPage.goto("/admin/users");
    await expect(adminPage.getByText("testuser")).toBeVisible({ timeout: 10000 });
  });

  test("regular user cannot access admin site config", async ({ userPage }) => {
    await userPage.goto("/admin/site-config");
    await expect(userPage).not.toHaveURL(/\/admin\/site-config/, { timeout: 10000 });
  });
});
