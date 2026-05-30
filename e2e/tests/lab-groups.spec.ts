import { test } from "../fixtures/auth";
import { expect } from "@playwright/test";
import { LabGroupsPage } from "../page-objects/vanilla-ng/lab-groups.po";

test.describe("lab groups", () => {
  test("seeded Test Lab is visible", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await expect(adminPage.getByText("Test Lab")).toBeVisible({ timeout: 10000 });
  });

  test("create new lab group appears in list", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await page.create("E2E PW Group");
  });

  test("create sub-group under Test Lab", async ({ adminPage }) => {
    const page = new LabGroupsPage(adminPage);
    await page.goto();
    await page.createSubGroup("Test Lab", "E2E PW Sub Group");
  });
});
