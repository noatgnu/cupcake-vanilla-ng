import * as path from "path";
import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";
import { SharedTablePage } from "../page-objects/vanilla-ng/shared-table.po";

const BASE_URL = process.env["VANILLA_NG_URL"] || "https://localhost:8099";
const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");

async function createTableWithData(page: import("@playwright/test").Page, name: string): Promise<void> {
  const list = new MetadataTablePage(page);
  await list.goto();
  await list.create(name);
  await list.openTable(name);
  await expect(page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

  await page.locator('[title="Import Data"]').click();
  const sdrfInput = page.locator('input[type="file"][accept=".txt,.tsv"]');
  await sdrfInput.setInputFiles(path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv"));
  await page.getByRole("dialog").locator("button.btn-danger").click();

  const tasksBtn = page.locator("button[aria-label*='Background tasks']");
  await tasksBtn.click();
  const monitor = page.locator("app-async-task-monitor");
  await expect(monitor).toBeVisible({ timeout: 5000 });
  await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
  await monitor.getByRole("button", { name: /completed/i }).click();
  await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 30000 });
  await monitor.getByRole("button", { name: /^all/i }).click();
  await tasksBtn.click();
}

async function generateShareToken(page: import("@playwright/test").Page): Promise<string> {
  await page.locator('[title="Share Table"]').click();
  const dropdown = page.locator(".dropdown-menu.show");
  await expect(dropdown).toBeVisible({ timeout: 5000 });

  const generateBtn = dropdown.locator("button", { hasText: /generate share link/i });
  await generateBtn.click();

  const urlInput = dropdown.locator('input[type="text"]');
  await expect(urlInput).toBeVisible({ timeout: 5000 });
  const shareUrl = await urlInput.inputValue();

  const match = shareUrl.match(/\/shared\/([0-9a-f-]+)/);
  if (!match) throw new Error(`Could not extract token from share URL: ${shareUrl}`);
  return match[1];
}

test.describe("Share table — owner UI", () => {
  test("Share button is visible for table owner", async ({ adminPage }) => {
    const tableName = `E2E Share Visible ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.openTable(tableName);
    await expect(adminPage.locator('[title="Share Table"]')).toBeVisible({ timeout: 10000 });
  });

  test("Share dropdown shows generate prompt when no link exists", async ({ adminPage }) => {
    const tableName = `E2E Share Prompt ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.openTable(tableName);

    await adminPage.locator('[title="Share Table"]').click();
    const dropdown = adminPage.locator(".dropdown-menu.show");
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await expect(dropdown.getByText(/generate share link/i)).toBeVisible({ timeout: 3000 });
  });

  test("Generate share link shows URL with copy and revoke buttons", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Generate ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.locator('[title="Share Table"]').click();
    const dropdown = adminPage.locator(".dropdown-menu.show");
    await dropdown.locator("button", { hasText: /generate share link/i }).click();

    await expect(dropdown.locator('input[type="text"]')).toBeVisible({ timeout: 5000 });
    await expect(dropdown.locator("button[title*='Copy']")).toBeVisible({ timeout: 3000 });
    await expect(dropdown.locator("button", { hasText: /regenerate/i })).toBeVisible({ timeout: 3000 });
    await expect(dropdown.locator("button", { hasText: /revoke/i })).toBeVisible({ timeout: 3000 });
  });

  test("Share button turns green after link is generated", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Green ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    const shareBtn = adminPage.locator('[title="Share Table"]');
    await shareBtn.click();
    const dropdown = adminPage.locator(".dropdown-menu.show");
    await dropdown.locator("button", { hasText: /generate share link/i }).click();
    await expect(dropdown.locator('input[type="text"]')).toBeVisible({ timeout: 5000 });

    await expect(shareBtn).toHaveClass(/btn-success/, { timeout: 5000 });
  });

  test("Regenerate produces a different URL", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Regen ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.locator('[title="Share Table"]').click();
    const dropdown = adminPage.locator(".dropdown-menu.show");
    await dropdown.locator("button", { hasText: /generate share link/i }).click();
    const urlInput = dropdown.locator('input[type="text"]');
    await expect(urlInput).toBeVisible({ timeout: 5000 });
    const firstUrl = await urlInput.inputValue();

    await dropdown.locator("button", { hasText: /regenerate/i }).click();
    await expect(urlInput).not.toHaveValue(firstUrl, { timeout: 5000 });
    await expect(urlInput).toHaveValue(/\/shared\/[0-9a-f-]+/);
  });

  test("Revoking the link clears it and shows generate prompt again", async ({ adminPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Revoke ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    await adminPage.locator('[title="Share Table"]').click();
    const dropdown = adminPage.locator(".dropdown-menu.show");
    await dropdown.locator("button", { hasText: /generate share link/i }).click();
    await expect(dropdown.locator('input[type="text"]')).toBeVisible({ timeout: 5000 });

    await dropdown.locator("button", { hasText: /revoke/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator("button.btn-danger").click();

    await adminPage.locator('[title="Share Table"]').click();
    await expect(dropdown.getByText(/generate share link/i)).toBeVisible({ timeout: 5000 });
  });

  test("Export button is not visible in the share dropdown context", async ({ adminPage }) => {
    const tableName = `E2E Share No Export ${Date.now()}`;
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.create(tableName);
    await list.openTable(tableName);
    await expect(adminPage.locator('[title="Export Table"]')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Share table — public access", () => {
  test("Guest can view a shared table without logging in", async ({ adminPage, guestPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Public ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    const token = await generateShareToken(adminPage);
    const shared = new SharedTablePage(guestPage);
    await shared.goto(token);
    await shared.waitForTable();
    await expect(guestPage.locator("ccv-metadata-table-details")).toBeVisible({ timeout: 10000 });
  });

  test("Shared table shows read-only badge", async ({ adminPage, guestPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Badge ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    const token = await generateShareToken(adminPage);
    const shared = new SharedTablePage(guestPage);
    await shared.goto(token);
    await shared.waitForTable();
    await shared.expectReadOnlyBadge();
  });

  test("Shared table has no edit, import, export or share controls", async ({ adminPage, guestPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share No Controls ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    const token = await generateShareToken(adminPage);
    const shared = new SharedTablePage(guestPage);
    await shared.goto(token);
    await shared.waitForTable();
    await shared.expectNoEditControls();
  });

  test("Shared table shows the table name", async ({ adminPage, guestPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Name ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    const token = await generateShareToken(adminPage);
    const shared = new SharedTablePage(guestPage);
    await shared.goto(token);
    await shared.waitForTable();
    await expect(guestPage.getByText(tableName).first()).toBeVisible({ timeout: 5000 });
  });

  test("List and table view mode toggle works on shared page", async ({ adminPage, guestPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share View Toggle ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    const token = await generateShareToken(adminPage);
    const shared = new SharedTablePage(guestPage);
    await shared.goto(token);
    await shared.waitForTable();
    await shared.switchToListView();
    await shared.switchToTableView();
  });

  test("Invalid token shows error state", async ({ guestPage }) => {
    const shared = new SharedTablePage(guestPage);
    await shared.goto("00000000-0000-0000-0000-000000000000");
    await shared.expectErrorState();
  });

  test("Revoked link returns error state", async ({ adminPage, guestPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Revoked Access ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    const token = await generateShareToken(adminPage);

    const dropdown = adminPage.locator(".dropdown-menu.show");
    await dropdown.locator("button", { hasText: /revoke/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator("button.btn-danger").click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await adminPage.locator('[title="Share Table"]').click();
    await expect(dropdown.getByText(/generate share link/i)).toBeVisible({ timeout: 5000 });

    const shared = new SharedTablePage(guestPage);
    await shared.goto(token);
    await shared.expectErrorState();
  });

  test("Shared page does not redirect guest to login", async ({ guestPage }) => {
    const shared = new SharedTablePage(guestPage);
    await shared.goto("00000000-0000-0000-0000-000000000000");
    await expect(guestPage).not.toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("Authenticated user can also view shared link", async ({ adminPage, userPage }) => {
    test.setTimeout(120000);
    const tableName = `E2E Share Auth View ${Date.now()}`;
    await createTableWithData(adminPage, tableName);

    const token = await generateShareToken(adminPage);
    const shared = new SharedTablePage(userPage);
    await shared.goto(token);
    await shared.waitForTable();
    await shared.expectReadOnlyBadge();
  });
});
