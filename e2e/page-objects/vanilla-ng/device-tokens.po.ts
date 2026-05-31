/**
 * Page object for device token management (/user/devices).
 */
import { Page, expect } from "@playwright/test";

export class DeviceTokensPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/#/user/devices");
  }

  async create(label: string): Promise<string> {
    await this.page.getByRole("button", { name: /new token/i }).click();
    await this.page.getByPlaceholder(/lab display badge/i).fill(label);
    const createBtn = this.page.getByRole("button", { name: /^create$/i });
    await expect(createBtn).toBeEnabled({ timeout: 5000 });
    await createBtn.click();
    const tokenEl = this.page.locator("code").first();
    await expect(tokenEl).toBeVisible({ timeout: 10000 });
    const tokenValue = (await tokenEl.textContent()) ?? "";
    const doneBtn = this.page.getByRole("button", { name: /done/i });
    await expect(doneBtn).toBeVisible({ timeout: 3000 });
    await doneBtn.click();
    await expect(this.page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    return tokenValue;
  }

  async delete(label: string): Promise<void> {
    const row = this.page.locator("tr").filter({ hasText: label });
    if (await row.count() === 0) return;
    await row.locator('[title="Delete"]').click();
    await expect(this.page.locator("tr").filter({ hasText: label })).toHaveCount(0, { timeout: 10000 });
  }
}
