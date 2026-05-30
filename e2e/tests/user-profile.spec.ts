import { test, expect } from "../fixtures/auth";

test.describe("user profile", () => {
  test("profile page shows admin user info", async ({ adminPage }) => {
    await adminPage.goto("/#/users/profile");
    await expect(adminPage.getByText(/admin|admin@cupcake\.local/i)).toBeVisible({ timeout: 10000 });
  });

  test("profile page shows testuser info", async ({ userPage }) => {
    await userPage.goto("/#/users/profile");
    await expect(userPage.getByText(/testuser|testuser@cupcake\.local/i)).toBeVisible({ timeout: 10000 });
  });

  test("edit display name saves successfully", async ({ adminPage }) => {
    await adminPage.goto("/#/users/profile");
    const firstNameInput = adminPage.locator("#firstName");
    await expect(firstNameInput).toBeVisible({ timeout: 10000 });
    await firstNameInput.clear();
    await firstNameInput.fill("AdminUpdated");
    const lastNameInput = adminPage.locator("#lastName");
    await lastNameInput.clear();
    await lastNameInput.fill("User");
    await adminPage.locator("#currentPassword").fill("cupcake");
    await adminPage.getByRole("button", { name: /update profile/i }).click();
    await expect(adminPage.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10000 });
  });
});
