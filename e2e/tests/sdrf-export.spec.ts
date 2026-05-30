import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";

test.describe("SDRF export", () => {
  test("export seeded table produces download link", async ({ userPage }) => {
    await userPage.goto("/metadata-tables");
    await userPage.getByText("E2E Table").click();
    await userPage.getByRole("button", { name: /export|sdrf/i }).click();

    const exportOption = userPage.getByRole("menuitem", { name: /sdrf/i });
    if (await exportOption.isVisible({ timeout: 2000 })) {
      await exportOption.click();
    }

    await expect(
      userPage.getByText(/export.*started|task.*created|download/i)
    ).toBeVisible({ timeout: 30000 });
  });
});
