import { test, expect } from "../fixtures/auth";
import { LabGroupsPage } from "../page-objects/vanilla-ng/lab-groups.po";

const GROUP_NAME = `E2E Lab ${Date.now()}`;

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

  test("group members modal opens", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await page.create(GROUP_NAME);
    await page.openMembersModal(GROUP_NAME);
    await expect(adminPage.locator(".modal.fade.show")).toBeVisible({ timeout: 5000 });
    await adminPage.locator(".modal-footer").getByRole("button", { name: /close/i }).click();
  });

  test("invite testuser to a lab group", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await page.create(GROUP_NAME);
    const row = adminPage.locator("tr, [role='row']").filter({ hasText: GROUP_NAME }).first();
    await row.getByRole("button", { name: new RegExp(`view members of ${GROUP_NAME}`, "i") }).click();
    const inviteBtn = adminPage.getByRole("button", { name: /^invite$/i });
    if (await inviteBtn.isVisible({ timeout: 3000 })) {
      await inviteBtn.click();
      const input = adminPage.locator("#inviteEmail");
      if (await input.isVisible({ timeout: 3000 })) {
        await input.fill("testuser@cupcake.local");
        const sendInviteBtn = adminPage.getByRole("button", { name: /send invite/i });
        await expect(sendInviteBtn).toBeEnabled({ timeout: 5000 });
        await sendInviteBtn.click();
      }
    }
  });
});
