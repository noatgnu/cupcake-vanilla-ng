/**
 * Page object for the metadata table detail view (/metadata-tables/:id).
 */
import { Page, expect } from "@playwright/test";

export class MetadataTableDetailPage {
  constructor(private readonly page: Page) {}

  /**
   * Adds a column by searching for a template.
   * The name must match an existing column template (min 3 characters).
   */
  async addColumn(name: string = "organism"): Promise<void> {
    await this.page.getByRole("button", { name: /add column/i }).click();
    const modal = this.page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 5000 });
    const searchInput = modal.getByPlaceholder(/search column templates/i);
    await searchInput.fill(name);
    const templateSelect = modal.locator("select[size='5']");
    const firstOption = templateSelect.locator("option").filter({ hasText: new RegExp(name, "i") }).first();
    await expect(firstOption).toBeVisible({ timeout: 15000 });
    const optionValue = await firstOption.getAttribute("value");
    if (optionValue) {
      await templateSelect.selectOption(optionValue);
    }
    await modal.locator(".modal-footer .btn-primary").click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Deletes a column via the table data view header remove button.
   * Uses native window.confirm() — sets a one-time dialog accept handler.
   */
  async deleteColumn(name: string): Promise<void> {
    await this.page.locator('[title="Table Data View"]').click();
    this.page.once("dialog", dialog => dialog.accept());
    await this.page.getByRole("button", { name: new RegExp(`remove.*${name}`, "i") }).click();
    await this.page.locator('[title="Column List View"]').click();
    await expect(this.page.getByText(name)).not.toBeVisible({ timeout: 5000 });
  }

  async expectColumnVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async expectColumnsSection(): Promise<void> {
    await expect(this.page.getByText(/columns/i)).toBeVisible({ timeout: 10000 });
  }
}
