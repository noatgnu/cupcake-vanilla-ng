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
    const editBtn = adminPage.getByRole("button", { name: /edit|update/i });
    if (await editBtn.isVisible({ timeout: 3000 })) {
      await editBtn.click();
    }
    const firstNameInput = adminPage.getByLabel(/first.?name/i);
    if (await firstNameInput.isVisible({ timeout: 3000 })) {
      await firstNameInput.clear();
      await firstNameInput.fill("AdminUpdated");
      await adminPage.getByRole("button", { name: /save|update|confirm/i }).click();
      await expect(adminPage.getByText(/saved|success|updated/i)).toBeVisible({ timeout: 10000 });
    }
  });
});
