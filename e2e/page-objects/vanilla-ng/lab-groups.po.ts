/**
 * Page object for lab groups management (/lab-groups).
 */
import { Page, expect } from "@playwright/test";

export class LabGroupsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/lab-groups");
  }

  async create(name: string): Promise<void> {
    await this.page.getByRole("button", { name: /new|create|add/i }).click();
    await this.page.getByLabel(/name/i).fill(name);
    await this.page.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async open(name: string): Promise<void> {
    await this.page.getByText(name).click();
  }

  async createSubGroup(parentName: string, childName: string): Promise<void> {
    await this.open(parentName);
    await this.page.getByRole("button", { name: /add sub.?group|create sub/i }).click();
    await this.page.getByLabel(/name/i).fill(childName);
    await this.page.getByRole("button", { name: /save|create|confirm/i }).click();
    await expect(this.page.getByText(childName)).toBeVisible({ timeout: 10000 });
  }
}
