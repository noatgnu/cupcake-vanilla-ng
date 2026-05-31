/**
 * Page object for the metadata tables list page (/metadata-tables).
 */
import { Page, expect } from "@playwright/test";

export class MetadataTablePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/#/metadata-tables");
  }

  async create(name: string): Promise<void> {
    await this.page.locator('[title="New Table"]').click();
    await this.page.locator("#tableName").fill(name);
    const submitBtn = this.page.locator(".modal-footer .btn-primary");
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
  }

  async openTable(name: string): Promise<void> {
    const viewBtn = this.page.locator("tr").filter({ hasText: name }).locator('[title="View table"]');
    await viewBtn.click();
    await expect(this.page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });
  }

  async deleteTable(name: string): Promise<void> {
    const row = this.page.locator("tr, mat-row, [role='row']").filter({ hasText: name });
    this.page.once("dialog", dialog => dialog.accept());
    await row.locator('[title="Delete table"]').click();
    await expect(this.page.locator("tr, [role='row']").filter({ hasText: name })).toHaveCount(0, { timeout: 10000 });
  }

  async search(term: string): Promise<void> {
    await this.page.locator("#tableSearch").fill(term);
    await this.page.keyboard.press("Enter");
  }

  async expectTableInList(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
  }

  async expectTableNotInList(name: string): Promise<void> {
    await expect(this.page.locator("tr, [role='row']").filter({ hasText: name })).toHaveCount(0, { timeout: 5000 });
  }
}
