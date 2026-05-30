/**
 * Page object for the metadata table detail view (/metadata-tables/:id).
 */
import { Page, expect } from "@playwright/test";

export class MetadataTableDetailPage {
  constructor(private readonly page: Page) {}

  async addColumn(name: string, type: string = "text"): Promise<void> {
    await this.page.getByRole("button", { name: /add column/i }).click();
    await this.page.getByLabel(/column name|name/i).fill(name);
    const typeSelect = this.page.getByLabel(/type/i);
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption(type);
    }
    await this.page.getByRole("button", { name: /save|add|confirm/i }).click();
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async editColumnName(oldName: string, newName: string): Promise<void> {
    const row = this.page.locator("tr, [role='row']").filter({ hasText: oldName });
    await row.getByRole("button", { name: /edit/i }).click();
    const nameInput = this.page.getByLabel(/column name|name/i);
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole("button", { name: /save|confirm/i }).click();
    await expect(this.page.getByText(newName)).toBeVisible({ timeout: 10000 });
  }

  async deleteColumn(name: string): Promise<void> {
    const row = this.page.locator("tr, [role='row']").filter({ hasText: name });
    await row.getByRole("button", { name: /delete|remove/i }).click();
    await this.page.getByRole("button", { name: /confirm|yes|delete/i }).click();
    await expect(this.page.getByText(name)).not.toBeVisible({ timeout: 10000 });
  }

  async expectColumnVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async expectColumnsSection(): Promise<void> {
    await expect(this.page.getByText(/columns/i)).toBeVisible({ timeout: 10000 });
  }
}
