import * as path from "path";
import { test, expect } from "../fixtures/auth";

/**
 * UI-driven tests for real-time WebSocket features in the cupcake-vanilla-ng app.
 *
 * Tests interact with the app through the same interface a user sees:
 * - Notification bell in the navbar (backed by ws/ccc/notifications/)
 * - Background tasks monitor in the navbar (updated via WebSocket)
 * - Notification panel content and actions
 *
 * WebSocket connection is established by the Angular app automatically on page
 * load. These tests verify the resulting UI state rather than the protocol.
 */

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

test.describe("notification WebSocket UI", () => {
  test("notification bell is visible after login", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const bellBtn = userPage.locator("button[aria-label*='Notifications']");
    await expect(bellBtn).toBeVisible({ timeout: 10000 });
  });

  test("clicking notification bell opens notification panel", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const bellBtn = userPage.locator("button[aria-label*='Notifications']");
    await bellBtn.click();

    await expect(userPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });
    await expect(userPage.getByText("Notifications")).toBeVisible({ timeout: 5000 });
  });

  test("notification panel shows connected state", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const bellBtn = userPage.locator("button[aria-label*='Notifications']");
    await bellBtn.click();

    await expect(userPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });

    const disconnectedAlert = userPage.getByText(/real-time notifications are disconnected/i);
    await expect(disconnectedAlert).not.toBeVisible({ timeout: 5000 });
  });

  test("notification panel filter tabs switch views", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const bellBtn = userPage.locator("button[aria-label*='Notifications']");
    await bellBtn.click();

    await expect(userPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });

    await userPage.locator("app-notification-panel").getByRole("button", { name: /tasks/i }).click();
    await expect(
      userPage.locator("app-notification-panel").getByRole("button", { name: /tasks/i })
    ).toHaveClass(/btn-primary/, { timeout: 3000 });

    await userPage.locator("app-notification-panel").getByRole("button", { name: /system/i }).click();
    await expect(
      userPage.locator("app-notification-panel").getByRole("button", { name: /system/i })
    ).toHaveClass(/btn-primary/, { timeout: 3000 });

    await userPage.locator("app-notification-panel").getByRole("button", { name: /^all/i }).click();
    await expect(
      userPage.locator("app-notification-panel").getByRole("button", { name: /^all/i })
    ).toHaveClass(/btn-primary/, { timeout: 3000 });
  });

  test("background tasks monitor button is visible and opens panel", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const tasksBtn = userPage.locator("button[aria-label*='Background tasks']");
    await expect(tasksBtn).toBeVisible({ timeout: 10000 });

    await tasksBtn.click();

    await expect(userPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(userPage.getByText("Background Tasks")).toBeVisible({ timeout: 5000 });
  });

  test("background tasks monitor shows filter tabs", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const tasksBtn = userPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();

    await expect(userPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });

    const monitor = userPage.locator("app-async-task-monitor");
    await expect(monitor.getByRole("button", { name: /active/i })).toBeVisible({ timeout: 3000 });
    await expect(monitor.getByRole("button", { name: /completed/i })).toBeVisible({ timeout: 3000 });
    await expect(monitor.getByRole("button", { name: /failed/i })).toBeVisible({ timeout: 3000 });
  });

  test("SDRF import via table detail creates async task visible in UI", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");

    const viewBtn = adminPage.locator("tr").filter({ hasText: "E2E Table" }).getByRole("button", { name: /view/i });
    await expect(viewBtn).toBeVisible({ timeout: 10000 });
    await viewBtn.click();

    await expect(adminPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await adminPage.getByRole("button", { name: /^import/i }).click();

    const fileInput = adminPage.locator("input[type='file'][accept='.txt,.tsv']");
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();

    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });

    await expect(
      adminPage.locator(".task-item").first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("mark all notifications as read via UI", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");

    const bellBtn = adminPage.locator("button[aria-label*='Notifications']");
    await bellBtn.click();

    await expect(adminPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });

    const markAllBtn = adminPage.locator("app-notification-panel").getByRole("button", { name: /mark all/i, exact: false });
    if (await markAllBtn.isVisible({ timeout: 2000 }) && !await markAllBtn.isDisabled()) {
      await markAllBtn.click();
    }

    const unreadBadge = adminPage.locator("button[aria-label*='Notifications'] .badge.bg-danger");
    await expect(unreadBadge).not.toBeVisible({ timeout: 5000 });
  });

  test("reconnect button is not shown when WebSocket is connected", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const bellBtn = userPage.locator("button[aria-label*='Notifications']");
    await bellBtn.click();

    await expect(userPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });

    const reconnectBtn = userPage.locator("app-notification-panel").getByRole("button", { name: /reconnect/i });
    await expect(reconnectBtn).not.toBeVisible({ timeout: 3000 });
  });
});
