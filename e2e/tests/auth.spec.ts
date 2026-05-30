import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/common/login.po";
import { NavbarPage } from "../page-objects/common/navbar.po";

test.describe("authentication", () => {
  test("login with admin credentials redirects away from login", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login("admin", "admin");
    await login.expectRedirectedAwayFromLogin();
  });

  test("login with wrong password shows error", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login("admin", "wrongpassword");
    await login.expectError();
  });

  test("unauthenticated visit to /metadata redirects to /login", async ({ page }) => {
    await page.goto("/metadata");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("logout returns to /login", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login("admin", "admin");
    await login.expectRedirectedAwayFromLogin();
    const navbar = new NavbarPage(page);
    await navbar.logout();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
