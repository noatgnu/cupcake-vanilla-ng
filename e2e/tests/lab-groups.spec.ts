import { test, expect } from "../fixtures/auth";
import { LabGroupsPage } from "../page-objects/vanilla-ng/lab-groups.po";

async function createGroup(adminPage: import("@playwright/test").Page, name: string): Promise<void> {
  const page = new LabGroupsPage(adminPage);
  await page.goto();
  await page.create(name);
}

async function deleteGroupIfExists(adminPage: import("@playwright/test").Page, name: string): Promise<void> {
  const row = adminPage.locator("tr, [role='row']").filter({ hasText: name }).first();
  if (await row.isVisible({ timeout: 2000 })) {
    await row.locator('[title="Delete group"]').click({ timeout: 3000 });
    await adminPage.locator("button.btn-danger").click({ timeout: 5000 });
    await expect(adminPage.locator("tr, [role='row']").filter({ hasText: name })).toHaveCount(0, { timeout: 10000 });
  }
}

test.describe("lab groups", () => {
  test("lab groups page loads", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await expect(adminPage).toHaveURL(/\/lab-groups/, { timeout: 10000 });
  });

  test("create new lab group appears in list", async ({ adminPage }) => {
    const groupName = `E2E Lab Create ${Date.now()}`;
    await createGroup(adminPage, groupName);
    await expect(adminPage.getByText(groupName, { exact: true }).first()).toBeVisible({ timeout: 10000 });

    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await deleteGroupIfExists(adminPage, groupName);
  });

  test("group members modal opens", async ({ adminPage }) => {
    const groupName = `E2E Lab Members ${Date.now()}`;
    await createGroup(adminPage, groupName);
    const page = new LabGroupsPage(adminPage);
    await page.openMembersModal(groupName);
    await expect(adminPage.locator(".modal.fade.show")).toBeVisible({ timeout: 5000 });
    await adminPage.locator(".modal-footer").getByRole("button", { name: /close/i }).click();

    await page.goto();
    await deleteGroupIfExists(adminPage, groupName);
  });

  test("invite testuser to a lab group", async ({ adminPage }) => {
    const groupName = `E2E Lab Invite ${Date.now()}`;
    await createGroup(adminPage, groupName);
    const row = adminPage.locator("tr, [role='row']").filter({ hasText: groupName }).first();
    await row.getByRole("button", { name: new RegExp(`view members of ${groupName}`, "i") }).click();
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

    await adminPage.locator(".modal-footer").getByRole("button", { name: /close/i }).click();
    await expect(adminPage.locator(".modal.fade.show")).not.toBeVisible({ timeout: 5000 });

    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await deleteGroupIfExists(adminPage, groupName);
  });
});
