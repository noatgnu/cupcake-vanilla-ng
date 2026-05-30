import { test, expect } from "../fixtures/auth";
import { LabGroupsPage } from "../page-objects/vanilla-ng/lab-groups.po";

const GROUP_NAME = `E2E Lab ${Date.now()}`;
const SUB_GROUP_NAME = `E2E Sub ${Date.now()}`;

test.describe("lab groups", () => {
  test("lab groups page loads", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await expect(adminPage).toHaveURL(/\/lab-groups/, { timeout: 10000 });
  });

  test("create new lab group appears in list", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await page.create(GROUP_NAME);
    await expect(adminPage.getByText(GROUP_NAME)).toBeVisible({ timeout: 10000 });
  });

  test("create sub-group under a group", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await page.create(GROUP_NAME);
    await page.createSubGroup(GROUP_NAME, SUB_GROUP_NAME);
    await expect(adminPage.getByText(SUB_GROUP_NAME)).toBeVisible({ timeout: 10000 });
  });

  test("invite testuser to a lab group", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await page.create(GROUP_NAME);
    const row = adminPage.locator("tr, [role='row']").filter({ hasText: GROUP_NAME }).first();
    await row.getByRole("button", { name: /manage|open|view/i }).click();
    const inviteBtn = adminPage.getByRole("button", { name: /invite|add member/i });
    if (await inviteBtn.isVisible({ timeout: 3000 })) {
      await inviteBtn.click();
      const input = adminPage.getByPlaceholder(/username|search user/i);
      if (await input.isVisible({ timeout: 3000 })) {
        await input.fill("testuser");
        const suggestion = adminPage.getByText("testuser").first();
        if (await suggestion.isVisible({ timeout: 3000 })) await suggestion.click();
        await adminPage.getByRole("button", { name: /add|invite|confirm/i }).click();
        await expect(adminPage.getByText("testuser")).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
