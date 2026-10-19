import { test, expect } from "../fixtures/auth";

test.describe("metadata selector", () => {
  test("/ redirects authenticated user to /metadata", async ({ userPage }) => {
    await userPage.goto("/#/");
    await expect(userPage).toHaveURL(/\/metadata/, { timeout: 10000 });
  });

  test("metadata selector shows Metadata Management card", async ({ userPage }) => {
    await userPage.goto("/#/metadata");
    await expect(userPage.getByText(/metadata management/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("selector shows Metadata Tables option", async ({ userPage }) => {
    await userPage.goto("/#/metadata");
    await expect(userPage.getByText(/metadata tables/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("selector shows Table Templates option", async ({ userPage }) => {
    await userPage.goto("/#/metadata");
    await expect(userPage.getByText(/templates/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("clicking Go to Tables navigates to /metadata-tables", async ({ userPage }) => {
    await userPage.goto("/#/metadata");
    const goBtn = userPage.getByRole("button", { name: /go to tables/i });
    await expect(goBtn).toBeVisible({ timeout: 10000 });
    await goBtn.click();
    await expect(userPage).toHaveURL(/\/metadata-tables/, { timeout: 10000 });
  });

  test("selector has a recommendation message", async ({ userPage }) => {
    await userPage.goto("/#/metadata");
    const alert = userPage.locator(".alert-info");
    await expect(alert.first()).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated access to /metadata redirects to login", async ({ guestPage }) => {
    await guestPage.goto("/#/metadata");
    await expect(guestPage).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
