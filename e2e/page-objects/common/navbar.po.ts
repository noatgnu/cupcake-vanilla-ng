/**
 * Page object for the main navigation bar.
 */
import { Page, expect } from "@playwright/test";

export class NavbarPage {
  constructor(private readonly page: Page) {}

  async logout(): Promise<void> {
    await this.page.locator("#userDropdown").click();
    await this.page.getByRole("button", { name: /sign out/i }).click();
  }

  async toggleMenu(): Promise<void> {
    await this.page.locator(".navbar-toggler").click();
  }

  async expectMenuCollapsed(): Promise<void> {
    await expect(this.page.locator(".navbar-toggler")).toHaveAttribute("aria-expanded", "false");
  }

  async expectMenuExpanded(): Promise<void> {
    await expect(this.page.locator(".navbar-toggler")).toHaveAttribute("aria-expanded", "true");
  }
}
