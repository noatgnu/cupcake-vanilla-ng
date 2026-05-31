import * as path from "path";
import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

test.describe("notification WebSocket UI", () => {
  test("notification bell is visible after login", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-tables");
    const bellBtn = adminPage.locator("button[aria-label*='Notifications']");
    await expect(bellBtn).toBeVisible({ timeout: 10000 });
  });

  test("clicking notification bell opens notification panel", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-tables");
    await adminPage.locator("button[aria-label*='Notifications']").click();
    await expect(adminPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("app-notification-panel").getByText("Notifications").first()).toBeVisible({ timeout: 5000 });
  });

  test("notification panel shows connected state — no disconnected alert", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-tables");
    await adminPage.locator("button[aria-label*='Notifications']").click();
    await expect(adminPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/real-time notifications are disconnected/i)).not.toBeVisible({ timeout: 5000 });
  });

  test("notification panel filter tabs switch views", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-tables");
    await adminPage.locator("button[aria-label*='Notifications']").click();
    await expect(adminPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });

    const panel = adminPage.locator("app-notification-panel");
    await panel.getByRole("button", { name: /tasks/i }).click();
    await expect(panel.getByRole("button", { name: /tasks/i })).toHaveClass(/btn-primary/, { timeout: 3000 });

    await panel.getByRole("button", { name: /system/i }).click();
    await expect(panel.getByRole("button", { name: /system/i })).toHaveClass(/btn-primary/, { timeout: 3000 });

    await panel.getByRole("button", { name: /^all/i }).click();
    await expect(panel.getByRole("button", { name: /^all/i })).toHaveClass(/btn-primary/, { timeout: 3000 });
  });

  test("background tasks monitor button opens panel", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-tables");
    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await expect(tasksBtn).toBeVisible({ timeout: 10000 });
    await tasksBtn.click();
    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator("app-async-task-monitor").getByText("Background Tasks").first()).toBeVisible({ timeout: 5000 });
  });

  test("background tasks monitor shows filter tabs", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-tables");
    await adminPage.locator("button[aria-label*='Background tasks']").click();
    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    const monitor = adminPage.locator("app-async-task-monitor");
    await expect(monitor.getByRole("button", { name: /active/i })).toBeVisible({ timeout: 3000 });
    await expect(monitor.getByRole("button", { name: /completed/i })).toBeVisible({ timeout: 3000 });
    await expect(monitor.getByRole("button", { name: /failed/i })).toBeVisible({ timeout: 3000 });
  });

  test("SDRF import via UI creates async task visible in monitor", async ({ adminPage }) => {
    const tableName = `E2E WS Import ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.openTable(tableName);
    await expect(adminPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await adminPage.locator('[title="Import Data"]').click();
    const sdrfInput = adminPage.locator('input[type="file"][accept=".txt,.tsv"]');
    await sdrfInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
    await adminPage.getByRole("dialog").locator("button.btn-danger").click();

    await adminPage.locator("button[aria-label*='Background tasks']").click();
    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
  });

  test("mark all notifications as read via UI", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-tables");
    await adminPage.locator("button[aria-label*='Notifications']").click();
    await expect(adminPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });

    const markAllBtn = adminPage
      .locator("app-notification-panel")
      .getByRole("button", { name: /mark all/i, exact: false });
    if (await markAllBtn.isVisible({ timeout: 2000 }) && !await markAllBtn.isDisabled()) {
      await markAllBtn.click();
    }
    await expect(
      adminPage.locator("button[aria-label*='Notifications'] .badge.bg-danger")
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("reconnect button is not shown when WebSocket is connected", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-tables");
    await adminPage.locator("button[aria-label*='Notifications']").click();
    await expect(adminPage.locator("app-notification-panel")).toBeVisible({ timeout: 5000 });
    await expect(
      adminPage.locator("app-notification-panel").getByRole("button", { name: /reconnect/i })
    ).not.toBeVisible({ timeout: 3000 });
  });
});
