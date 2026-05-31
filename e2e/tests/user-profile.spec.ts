import { test, expect } from "../fixtures/auth";

test.describe("user profile", () => {
  test("profile page shows admin user info", async ({ adminPage }) => {
    await adminPage.goto("/#/users/profile");
    const container = adminPage.locator(".user-profile-container");
    await expect(container).toBeVisible({ timeout: 10000 });
    await expect(container.getByText("admin@cupcake.local")).toBeVisible({ timeout: 10000 });
  });

  test("profile page shows testuser info", async ({ userPage }) => {
    await userPage.goto("/#/users/profile");
    const container = userPage.locator(".user-profile-container");
    await expect(container).toBeVisible({ timeout: 10000 });
    await expect(container.getByText("testuser@cupcake.local")).toBeVisible({ timeout: 10000 });
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
    const updateBtn = adminPage.getByRole("button", { name: /update profile/i });
    await expect(updateBtn).toBeEnabled({ timeout: 5000 });
    await updateBtn.click();
    await expect(adminPage.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10000 });
  });
});
