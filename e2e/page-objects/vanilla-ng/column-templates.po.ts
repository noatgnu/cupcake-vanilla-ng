/**
 * Page object for column templates (/metadata-templates).
 */
import { Page, expect } from "@playwright/test";

export class ColumnTemplatesPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/metadata-templates");
  }

  async create(name: string, columnName = "characteristics[e2e test]"): Promise<void> {
    await this.page.getByRole("button", { name: /new template/i }).click();
    await this.page.locator("#templateName").fill(name);
    await this.page.locator("#columnName").fill(columnName);
    await this.page.getByRole("button", { name: /save|create|submit/i }).click();
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
    const nameInput = this.page.locator("#templateName");
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole("button", { name: /save|confirm|submit/i }).click();
    await expect(this.page.getByText(newName)).toBeVisible({ timeout: 10000 });
  }
}
