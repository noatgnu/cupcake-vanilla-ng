/**
 * Playwright test fixtures providing pre-authenticated pages for admin and regular users.
 */
import { test as base, Browser, BrowserContext, Page } from "@playwright/test";
import * as path from "path";

const AUTH_STATES = {
  admin: path.join(__dirname, "../auth-states/admin.json"),
  user: path.join(__dirname, "../auth-states/user.json"),
};

/**
 * Lets clicks pass through toasts, which stay visible, so they cannot cover the controls a test uses.
 */
async function letClicksPassThroughToasts(ctx: BrowserContext): Promise<void> {
  await ctx.addInitScript(() => {
    const apply = () => {
      const style = document.createElement("style");
      style.textContent = "ccc-toast-container, ccc-toast-container * { pointer-events: none !important; }";
      document.head.appendChild(style);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", apply);
    } else {
      apply();
    }
  });
}

async function createAuthPage(browser: Browser, stateFile: string): Promise<Page> {
  const ctx = await browser.newContext({ storageState: stateFile });
  await letClicksPassThroughToasts(ctx);
  return ctx.newPage();
}

export const test = base.extend<{ adminPage: Page; userPage: Page; guestPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const page = await createAuthPage(browser, AUTH_STATES.admin);
    await use(page);
    await page.context().close();
  },
  userPage: async ({ browser }, use) => {
    const page = await createAuthPage(browser, AUTH_STATES.user);
    await use(page);
    await page.context().close();
  },
  guestPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    await letClicksPassThroughToasts(ctx);
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect } from "@playwright/test";
