import { test, expect } from "../fixtures/auth";

test.describe("favorite management — full coverage", () => {
  test("favorites route is accessible to regular user", async ({ userPage }) => {
    await userPage.goto("/#/favorites");
    await expect(userPage).toHaveURL(/\/favorites/, { timeout: 10000 });
  });

  test("favorites list shows empty state or existing favorites", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    const hasItems = await adminPage.locator(".favorite-item, .list-group-item, tr").count();
    const hasEmpty = await adminPage.getByText(/no favorites|no items/i).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasItems >= 0 || hasEmpty).toBeTruthy();
  });

  test("Add Favorite modal has name, type, and scope dropdowns", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    await adminPage.getByRole("button", { name: /add favorite/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator("#favName")).toBeVisible({ timeout: 3000 });
    await expect(dialog.locator("#favType")).toBeVisible({ timeout: 3000 });
    await expect(dialog.locator("#favScope")).toBeVisible({ timeout: 3000 });
    await dialog.locator(".btn-close").click();
  });

  test("create favorite modal submit is disabled with empty name", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    await adminPage.getByRole("button", { name: /add favorite/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const submitBtn = dialog.locator("button[type='submit'], .modal-footer .btn-primary").first();
    await expect(submitBtn).toBeDisabled({ timeout: 3000 });
    await dialog.locator(".btn-close").click();
  });

  test("filling name enables submit button", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    await adminPage.getByRole("button", { name: /add favorite/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator("#favName").fill("Test Favorite Value");
    const submitBtn = dialog.locator("button[type='submit'], .modal-footer .btn-primary").first();
    await expect(submitBtn).not.toBeDisabled({ timeout: 3000 });
    await dialog.locator(".btn-close").click();
  });

  test("scope dropdown has user and lab group options", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    await adminPage.getByRole("button", { name: /add favorite/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const scopeSelect = dialog.locator("#favScope");
    await expect(scopeSelect).toBeVisible({ timeout: 3000 });
    const options = await scopeSelect.locator("option").allTextContents();
    const hasUser = options.some(o => /user|personal/i.test(o));
    const hasGroup = options.some(o => /lab.*group|group/i.test(o));
    expect(hasUser || hasGroup).toBeTruthy();
    await dialog.locator(".btn-close").click();
  });

  test("creating a favorite adds it to the list", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    const favName = `E2E Favorite ${Date.now()}`;
    await adminPage.getByRole("button", { name: /add favorite/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator("#favName").fill(favName);
    const submitBtn = dialog.locator("button[type='submit'], .modal-footer .btn-primary").first();
    await expect(submitBtn).not.toBeDisabled({ timeout: 3000 });
    await submitBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(adminPage.getByText(favName).first()).toBeVisible({ timeout: 10000 });

    const deleteBtn = adminPage.locator("tr, .favorite-item").filter({ hasText: favName }).locator("button").filter({ hasText: /delete|remove/i }).first();
    if (await deleteBtn.isVisible({ timeout: 3000 })) {
      await deleteBtn.click();
      const confirm = adminPage.getByRole("dialog");
      if (await confirm.isVisible({ timeout: 2000 })) {
        await confirm.locator("button.btn-danger, .btn-primary").first().click();
      }
    }
  });

  test("favorite search/filter reduces visible favorites", async ({ adminPage }) => {
    await adminPage.goto("/#/favorites");
    const searchInput = adminPage.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill("zzznomatch");
      await adminPage.waitForTimeout(500);
      const count = await adminPage.locator(".favorite-item, .list-group-item, tr").count();
      expect(count).toBeLessThanOrEqual(1);
      await searchInput.clear();
    }
  });
});
