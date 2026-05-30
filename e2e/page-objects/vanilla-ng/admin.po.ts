/**
 * Page object for admin pages (/admin/*).
 */
import { Page, expect } from "@playwright/test";

export class AdminPage {
  constructor(private readonly page: Page) {}

  async gotoSiteConfig(): Promise<void> {
    await this.page.goto("/admin/site-config");
  }

  async gotoUserManagement(): Promise<void> {
    await this.page.goto("/admin/users");
  }

  async createUser(username: string, email: string, password: string): Promise<void> {
    await this.page.getByRole("button", { name: /new|create|add user/i }).click();
    await this.page.getByLabel(/username/i).fill(username);
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(this.page.getByText(username)).toBeVisible({ timeout: 10000 });
  }
}
