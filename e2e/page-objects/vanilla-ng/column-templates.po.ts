/**
 * Page object for column templates (/metadata-templates).
 */
import { Page, expect } from "@playwright/test";

export class ColumnTemplatesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/metadata-templates");
  }

  async create(name: string): Promise<void> {
    await this.page.getByRole("button", { name: /new|create|add/i }).click();
    await this.page.getByLabel(/name/i).fill(name);
    await this.page.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async delete(name: string): Promise<void> {
    const row = this.page.locator("tr, [role='row']").filter({ hasText: name });
    await row.getByRole("button", { name: /delete|remove/i }).click();
    await this.page.getByRole("button", { name: /confirm|yes|delete/i }).click();
    await expect(this.page.getByText(name)).not.toBeVisible({ timeout: 10000 });
  }

  async rename(oldName: string, newName: string): Promise<void> {
    const row = this.page.locator("tr, [role='row']").filter({ hasText: oldName });
    await row.getByRole("button", { name: /edit/i }).click();
    const nameInput = this.page.getByLabel(/name/i);
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole("button", { name: /save|confirm/i }).click();
    await expect(this.page.getByText(newName)).toBeVisible({ timeout: 10000 });
  }
}
