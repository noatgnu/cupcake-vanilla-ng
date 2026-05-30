/**
 * Page object for the metadata tables list page (/metadata-tables).
 */
import { Page, expect } from "@playwright/test";

export class MetadataTablePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/metadata-tables");
  }

  async create(name: string): Promise<void> {
    await this.page.getByRole("button", { name: /new|create|add table/i }).click();
    await this.page.getByLabel(/name/i).fill(name);
    await this.page.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async openTable(name: string): Promise<void> {
    const viewBtn = this.page.locator("tr").filter({ hasText: name }).getByRole("button", { name: /view/i });
    await viewBtn.click();
    await expect(this.page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });
  }

  async deleteTable(name: string): Promise<void> {
    const row = this.page.locator("tr, mat-row, [role='row']").filter({ hasText: name });
    await row.getByRole("button", { name: /delete|remove/i }).click();
    await this.page.getByRole("button", { name: /confirm|yes|delete/i }).click();
    await expect(this.page.getByText(name)).not.toBeVisible({ timeout: 10000 });
  }

  async search(term: string): Promise<void> {
    await this.page.getByPlaceholder(/search/i).fill(term);
    await this.page.keyboard.press("Enter");
  }

  async expectTableInList(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async expectTableNotInList(name: string): Promise<void> {
    await expect(this.page.getByText(name)).not.toBeVisible({ timeout: 5000 });
  }
}
