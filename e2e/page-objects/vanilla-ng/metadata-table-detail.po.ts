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
    const templateSelect = modal.locator("select[size='5']");
    await expect(templateSelect).toBeVisible({ timeout: 10000 });
    const searchInput = modal.getByPlaceholder(/search column templates/i);
    await searchInput.click();
    await searchInput.fill(name);
    await searchInput.dispatchEvent("input");
    await expect(templateSelect).not.toContainText(/loading/i, { timeout: 90000 });
    await expect(templateSelect).toContainText(new RegExp(name, "i"), { timeout: 5000 });
    await templateSelect.selectOption({ label: new RegExp(name, "i") });
    const submitBtn = modal.locator(".modal-footer .btn-primary");
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  }

  async deleteColumn(name: string): Promise<void> {
    const tableDataBtn = this.page.locator('[title="Table Data View"]');
    await expect(tableDataBtn).toBeVisible({ timeout: 10000 });
    await tableDataBtn.click();
    const tableHeader = this.page.locator("thead.table-light");
    await expect(tableHeader).toBeVisible({ timeout: 5000 });
    const removeBtn = this.page.locator(`button[title*="${name}"][title*="Remove"]`);
    await expect(removeBtn).toBeVisible({ timeout: 10000 });
    await removeBtn.click();
    await this.page.getByRole("dialog").locator("button.btn-danger").click();
    await this.page.locator('[title="Column List View"]').click();
    await expect(this.page.getByText(name)).not.toBeVisible({ timeout: 5000 });
  }

  async expectColumnVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async expectColumnsSection(): Promise<void> {
    await expect(this.page.getByText(/table columns/i).first()).toBeVisible({ timeout: 10000 });
  }
}
