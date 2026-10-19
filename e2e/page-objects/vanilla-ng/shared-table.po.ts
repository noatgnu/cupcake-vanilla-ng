/**
 * Page object for the public shared-table view (/#/shared/:token).
 */
import { Page, expect } from "@playwright/test";

export class SharedTablePage {
  constructor(private readonly page: Page) {}

  async goto(token: string): Promise<void> {
    await this.page.goto(`/#/shared/${token}`);
  }

  async waitForTable(): Promise<void> {
    await expect(this.page.locator("ccv-metadata-table-details")).toBeVisible({ timeout: 15000 });
  }

  async expectReadOnlyBadge(): Promise<void> {
    await expect(this.page.locator(".badge").filter({ hasText: /read-only/i })).toBeVisible({ timeout: 5000 });
  }

  async expectNoEditControls(): Promise<void> {
    await expect(this.page.locator('[title="Edit Table"]')).not.toBeVisible({ timeout: 3000 });
    await expect(this.page.locator('[title="Import Data"]')).not.toBeVisible({ timeout: 3000 });
    await expect(this.page.locator('[title="Export Table"]')).not.toBeVisible({ timeout: 3000 });
    await expect(this.page.locator('[title="Share Table"]')).not.toBeVisible({ timeout: 3000 });
  }

  async expectErrorState(): Promise<void> {
    await expect(this.page.locator("text=/could not be found|expired/i")).toBeVisible({ timeout: 10000 });
  }

  async switchToListView(): Promise<void> {
    await this.page.locator('[title="Column List View"]').click();
    await expect(this.page.getByText(/table columns/i).first()).toBeVisible({ timeout: 5000 });
  }

  async switchToTableView(): Promise<void> {
    await this.page.locator('[title="Table Data View"]').click();
    await expect(this.page.getByText(/table data/i).first()).toBeVisible({ timeout: 5000 });
  }
}
