import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";

test.describe("user profile", () => {
  test("profile page shows user info", async ({ userPage }) => {
    await userPage.goto("/users/profile");
    await expect(userPage.getByText(/testuser|testuser@cupcake.local/i)).toBeVisible({ timeout: 10000 });
  });

  test("edit display name saves successfully", async ({ userPage }) => {
    await userPage.goto("/users/profile");
    const editBtn = userPage.getByRole("button", { name: /edit|update/i });
    if (await editBtn.isVisible({ timeout: 3000 })) {
      await editBtn.click();
    }
    const firstNameInput = userPage.getByLabel(/first.?name/i);
    await firstNameInput.clear();
    await firstNameInput.fill("TestUpdated");
    await userPage.getByRole("button", { name: /save|update|confirm/i }).click();
    await expect(userPage.getByText(/saved|success|updated/i)).toBeVisible({ timeout: 10000 });
  });
});
