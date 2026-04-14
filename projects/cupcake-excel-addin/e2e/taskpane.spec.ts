import { test, expect } from '@playwright/test';
import { setupOfficeMock } from './office-mock';

test.describe('Excel Add-in Taskpane - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupOfficeMock(page);
  });

  test('should load taskpane', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-taskpane')).toBeVisible({ timeout: 15000 });
  });

  test('should show login form when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-compact-login')).toBeVisible({ timeout: 15000 });
  });

  test('should have username and password fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-compact-login', { timeout: 15000 });

    await expect(page.locator('input[placeholder*="username" i]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should have sign in button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-compact-login', { timeout: 15000 });

    await expect(page.locator('button', { hasText: /sign in/i })).toBeVisible();
  });
});

test.describe('Connection Panel - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupOfficeMock(page);
    await page.goto('/');
    await page.waitForSelector('app-connection-panel', { timeout: 15000 });
  });

  test('should show connection panel without authentication', async ({ page }) => {
    await expect(page.locator('app-connection-panel')).toBeVisible();
  });

  test('should show mode buttons', async ({ page }) => {
    await expect(page.locator('app-connection-panel button', { hasText: 'Local' })).toBeVisible();
    await expect(page.locator('app-connection-panel button', { hasText: 'Cloud' })).toBeVisible();
  });

  test('should default to local mode', async ({ page }) => {
    const localButton = page.locator('app-connection-panel button', { hasText: 'Local' });
    await expect(localButton).toHaveClass(/btn-primary/);
  });

  test('should switch to cloud mode', async ({ page }) => {
    const cloudButton = page.locator('app-connection-panel button', { hasText: 'Cloud' });
    await cloudButton.click();
    await expect(cloudButton).toHaveClass(/btn-primary/);
  });

  test('should show connection status', async ({ page }) => {
    await expect(page.locator('app-connection-panel .connection-status')).toBeVisible();
  });

  test('should show advanced toggle', async ({ page }) => {
    await expect(page.locator('app-connection-panel button', { hasText: 'Advanced' })).toBeVisible();
  });
});
