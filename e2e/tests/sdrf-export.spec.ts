import { test, expect } from "../fixtures/auth";

/**
 * UI-driven SDRF export tests.
 *
 * Export actions are triggered from the table detail page Export dropdown.
 * The resulting async task is visible in the background tasks monitor
 * in the navbar (updated via WebSocket).
 */

test.describe("SDRF export", () => {
  test("Export dropdown is visible on table detail page", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const viewBtn = userPage.locator("tr").filter({ hasText: "E2E Table" }).getByRole("button", { name: /view/i });
    await expect(viewBtn).toBeVisible({ timeout: 10000 });
    await viewBtn.click();

    await expect(userPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await expect(userPage.getByRole("button", { name: /^export/i })).toBeVisible({ timeout: 5000 });
  });

  test("Export dropdown shows SDRF and Excel options", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const viewBtn = userPage.locator("tr").filter({ hasText: "E2E Table" }).getByRole("button", { name: /view/i });
    await viewBtn.click();

    await expect(userPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await userPage.getByRole("button", { name: /^export/i }).click();

    await expect(userPage.getByRole("link", { name: /export as sdrf/i })).toBeVisible({ timeout: 3000 });
    await expect(userPage.getByRole("link", { name: /export as excel/i })).toBeVisible({ timeout: 3000 });
  });

  test("SDRF export creates async task in background tasks monitor", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const viewBtn = userPage.locator("tr").filter({ hasText: "E2E Table" }).getByRole("button", { name: /view/i });
    await viewBtn.click();

    await expect(userPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await userPage.getByRole("button", { name: /^export/i }).click();
    await userPage.getByRole("link", { name: /export as sdrf/i }).click();

    const tasksBtn = userPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();

    await expect(userPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(userPage.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
  });

  test("completed SDRF export task shows download button", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");

    const viewBtn = userPage.locator("tr").filter({ hasText: "E2E Table" }).getByRole("button", { name: /view/i });
    await viewBtn.click();

    await expect(userPage).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

    await userPage.getByRole("button", { name: /^export/i }).click();
    await userPage.getByRole("link", { name: /export as sdrf/i }).click();

    const tasksBtn = userPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();

    const monitor = userPage.locator("app-async-task-monitor");
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 30000 });

    await monitor.getByRole("button", { name: /completed/i }).click();
    await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 60000 });

    await expect(
      monitor.locator(".task-item .btn-outline-primary[title*='Download']").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("bulk export SDRF from table list creates task for selected tables", async ({ adminPage }) => {
    await adminPage.goto("/metadata-tables");

    const tableCheckbox = adminPage.locator("tr").filter({ hasText: "E2E Table" }).locator("input[type='checkbox']");
    await expect(tableCheckbox).toBeVisible({ timeout: 10000 });
    await tableCheckbox.check();

    await expect(adminPage.getByRole("button", { name: /bulk export sdrf/i })).toBeVisible({ timeout: 3000 });
    await adminPage.getByRole("button", { name: /bulk export sdrf/i }).click();

    const tasksBtn = adminPage.locator("button[aria-label*='Background tasks']");
    await tasksBtn.click();

    await expect(adminPage.locator("app-async-task-monitor")).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
  });
});
