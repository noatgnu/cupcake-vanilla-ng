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
    await this.page.getByRole("button", { name: /new token|new|create|add/i }).click();
    await this.page.getByPlaceholder(/lab display badge/i).fill(label);
    await this.page.getByRole("button", { name: /^create$/i }).click({ force: true });
    const tokenEl = this.page.locator("[data-token-value], .token-value, code").first();
    await expect(tokenEl).toBeVisible({ timeout: 10000 });
    return (await tokenEl.textContent()) ?? "";
  }

  async delete(label: string): Promise<void> {
    const row = this.page.locator("tr, [role='row']").filter({ hasText: label });
    if (await row.count() === 0) return;
    await row.getByRole("button", { name: /delete/i }).click();
    await expect(this.page.getByText(label)).not.toBeVisible({ timeout: 10000 });
  }
}
