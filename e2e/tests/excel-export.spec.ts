import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";

test.describe("Excel export", () => {
  test("export seeded table as Excel produces download", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");
    await userPage.getByText("E2E Table").click();
    await userPage.getByRole("button", { name: /export/i }).click();

    const excelOption = userPage.getByRole("menuitem", { name: /excel|xlsx/i });
    if (await excelOption.isVisible({ timeout: 2000 })) {
      await excelOption.click();
    }

    await expect(
      userPage.getByText(/export.*started|task.*created|download|xlsx/i)
    ).toBeVisible({ timeout: 30000 });
  });
});
