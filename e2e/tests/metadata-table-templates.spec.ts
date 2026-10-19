import { test, expect } from "../fixtures/auth";

test.describe("metadata table templates page", () => {
  test("navigating to /metadata-table-templates loads the templates page", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-table-templates");
    await expect(adminPage).toHaveURL(/\/metadata-table-templates/, { timeout: 10000 });
    await expect(adminPage.getByText(/table templates/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("templates page shows New Template button", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-table-templates");
    await expect(adminPage.getByRole("button", { name: /new template/i })).toBeVisible({ timeout: 10000 });
  });

  test("templates page has search input", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-table-templates");
    await expect(adminPage.locator("#templateSearch")).toBeVisible({ timeout: 10000 });
  });

  test("New Template dropdown has Create from Schemas and Manual options", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-table-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    const dropdown = adminPage.locator(".dropdown-menu");
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await expect(dropdown.getByText(/create from schemas/i)).toBeVisible({ timeout: 3000 });
    await expect(dropdown.getByText(/manual configuration/i)).toBeVisible({ timeout: 3000 });
    await adminPage.keyboard.press("Escape");
  });

  test("clicking Create from Schemas opens schema selection modal", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-table-templates");
    await adminPage.getByRole("button", { name: /new template/i }).click();
    const dropdown = adminPage.locator(".dropdown-menu");
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await dropdown.getByText(/create from schemas/i).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await adminPage.getByRole("dialog").locator(".btn-close").click();
  });

  test("templates page shows search and filters card", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-table-templates");
    await expect(adminPage.getByText(/search.*filters/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("searching filters template list", async ({ adminPage }) => {
    await adminPage.goto("/#/metadata-table-templates");
    await expect(adminPage.locator("#templateSearch")).toBeVisible({ timeout: 10000 });
    await adminPage.locator("#templateSearch").fill("zzznotexisting");
    await adminPage.waitForTimeout(500);
    const noResults = await adminPage.getByText(/no templates found|no results/i).isVisible({ timeout: 3000 }).catch(() => false);
    const emptyList = await adminPage.locator(".template-card, .card-title").count().then(c => c === 0);
    expect(noResults || emptyList).toBeTruthy();
    await adminPage.locator("#templateSearch").clear();
  });

  test("templates page is accessible to regular user", async ({ userPage }) => {
    await userPage.goto("/#/metadata-table-templates");
    await expect(userPage).toHaveURL(/\/metadata-table-templates/, { timeout: 10000 });
    await expect(userPage.getByText(/table templates/i).first()).toBeVisible({ timeout: 10000 });
  });
});
