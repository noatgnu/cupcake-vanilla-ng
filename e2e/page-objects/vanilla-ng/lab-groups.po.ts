/**
 * Page object for lab groups management (/lab-groups).
 */
import { Page, expect } from "@playwright/test";

export class LabGroupsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/#/lab-groups");
  }

  async create(name: string): Promise<void> {
    await this.page.getByRole("button", { name: "New Lab Group" }).click();
    await this.page.locator("#groupName").fill(name);
    const createBtn = this.page.getByRole("button", { name: "Create Group" });
    await expect(createBtn).toBeEnabled({ timeout: 5000 });
    await createBtn.click();
    await expect(this.page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 10000 });
  }

  async openMembersModal(name: string): Promise<void> {
    const row = this.page.locator("tr, [role='row']").filter({ hasText: name }).first();
    await row.getByRole("button", { name: new RegExp(`view members of ${name}`, "i") }).click();
    await expect(this.page.locator(".modal.fade.show")).toBeVisible({ timeout: 10000 });
  }
}
