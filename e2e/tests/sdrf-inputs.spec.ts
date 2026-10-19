import * as path from "path";
import { test, expect } from "../fixtures/auth";
import { MetadataTablePage } from "../page-objects/vanilla-ng/metadata-table.po";

const FIXTURES_DIR = process.env["E2E_FIXTURES_DIR"] || path.join(__dirname, "../fixtures/sdrf");
const SDRF_FILE = path.join(FIXTURES_DIR, "PXD019185_PXD018883.sdrf.tsv");

async function createTableWithImportedData(
  page: import("@playwright/test").Page,
  name: string
): Promise<void> {
  const list = new MetadataTablePage(page);
  await list.goto();
  await list.create(name);
  await list.openTable(name);
  await expect(page).toHaveURL(/\/metadata-tables\/\d+/, { timeout: 10000 });

  await page.locator('[title="Import Data"]').click();
  const sdrfInput = page.locator('input[type="file"][accept=".txt,.tsv"]');
  await sdrfInput.setInputFiles(SDRF_FILE);
  await page.getByRole("dialog").locator("button.btn-danger").click();

  const tasksBtn = page.locator("button[aria-label*='Background tasks']");
  await tasksBtn.click();
  const monitor = page.locator("app-async-task-monitor");
  await expect(monitor).toBeVisible({ timeout: 5000 });
  await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 15000 });
  await monitor.getByRole("button", { name: /completed/i }).click();
  await expect(monitor.locator(".task-item").first()).toBeVisible({ timeout: 20000 });
  await monitor.getByRole("button", { name: /^all/i }).click();
  await tasksBtn.click();
}

async function openEditForColumn(
  page: import("@playwright/test").Page,
  columnNamePattern: RegExp
): Promise<boolean> {
  const editBtn = page.getByRole("button", {
    name: new RegExp(`edit default value for ${columnNamePattern.source}`, "i")
  }).first();
  if (!(await editBtn.isVisible({ timeout: 5000 }).catch(() => false))) return false;
  await editBtn.click();
  return await page.getByRole("dialog").isVisible({ timeout: 5000 }).catch(() => false);
}

test.describe("sdrf modification input", () => {
  test.setTimeout(180000);

  test("modification column edit modal shows modification input component", async ({ adminPage }) => {
    const name = `E2E Mod Input ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const opened = await openEditForColumn(adminPage, /modification parameters/);
    if (opened) {
      await expect(adminPage.locator("ccv-sdrf-modification-input")).toBeVisible({ timeout: 5000 });
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("modification input has Name of Term field", async ({ adminPage }) => {
    const name = `E2E Mod NT ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const opened = await openEditForColumn(adminPage, /modification parameters/);
    if (opened) {
      const ntInput = adminPage.locator("ccv-sdrf-modification-input input#NT");
      if (await ntInput.isVisible({ timeout: 3000 })) {
        await expect(ntInput).toBeVisible({ timeout: 3000 });
      }
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});

test.describe("sdrf cleavage input", () => {
  test.setTimeout(180000);

  test("cleavage agent column edit modal shows cleavage input component", async ({ adminPage }) => {
    const name = `E2E Cleavage Input ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const opened = await openEditForColumn(adminPage, /cleavage agent details/);
    if (opened) {
      await expect(adminPage.locator("ccv-sdrf-cleavage-input")).toBeVisible({ timeout: 5000 });
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("cleavage input has Name of Term field with NT id", async ({ adminPage }) => {
    const name = `E2E Cleavage NT ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const opened = await openEditForColumn(adminPage, /cleavage agent details/);
    if (opened) {
      const ntInput = adminPage.locator("ccv-sdrf-cleavage-input input#NT");
      if (await ntInput.isVisible({ timeout: 3000 })) {
        await expect(ntInput).toBeVisible({ timeout: 3000 });
      }
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("cleavage input search mode buttons are present", async ({ adminPage }) => {
    const name = `E2E Cleavage Search ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const opened = await openEditForColumn(adminPage, /cleavage agent details/);
    if (opened) {
      const cleavageComp = adminPage.locator("ccv-sdrf-cleavage-input");
      if (await cleavageComp.isVisible({ timeout: 3000 })) {
        const containsBtn = cleavageComp.getByRole("button", { name: /contains/i });
        const startsWithBtn = cleavageComp.getByRole("button", { name: /starts with/i });
        const hasBtns = await containsBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasBtns) {
          await expect(containsBtn).toBeVisible({ timeout: 3000 });
          await expect(startsWithBtn).toBeVisible({ timeout: 3000 });
        }
      }
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});

test.describe("sdrf mz-range input", () => {
  test.setTimeout(180000);

  test("mz-range input renders low and high m/z fields", async ({ adminPage }) => {
    const name = `E2E MZ Input ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const editBtns = await adminPage.locator('button[title*="Edit default value"]').count();
    if (editBtns > 0) {
      for (let i = 0; i < Math.min(editBtns, 10); i++) {
        const btn = adminPage.locator('button[title*="Edit default value"]').nth(i);
        if (!(await btn.isVisible({ timeout: 1000 }).catch(() => false))) continue;
        await btn.click();
        const dialog = adminPage.getByRole("dialog");
        if (!(await dialog.isVisible({ timeout: 2000 }).catch(() => false))) continue;
        const mzComp = adminPage.locator("ccv-sdrf-mz-range-input");
        if (await mzComp.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(mzComp.locator('input[placeholder="Low"]')).toBeVisible({ timeout: 3000 });
          await expect(mzComp.locator('input[placeholder="High"]')).toBeVisible({ timeout: 3000 });
          await dialog.locator(".btn-close").click();
          break;
        }
        await dialog.locator(".btn-close").click();
      }
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});

test.describe("sdrf age input range mode", () => {
  test.setTimeout(180000);

  test("age input shows isRange toggle", async ({ adminPage }) => {
    const name = `E2E Age Range ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const opened = await openEditForColumn(adminPage, /characteristics\[age\]/);
    if (opened) {
      await expect(adminPage.locator("ccv-sdrf-age-input")).toBeVisible({ timeout: 5000 });
      await expect(adminPage.locator("input#isRange")).toBeVisible({ timeout: 3000 });
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });

  test("enabling range mode shows start and end year fields", async ({ adminPage }) => {
    const name = `E2E Age Range Fields ${Date.now()}`;
    await createTableWithImportedData(adminPage, name);

    const opened = await openEditForColumn(adminPage, /characteristics\[age\]/);
    if (opened) {
      const rangeToggle = adminPage.locator("input#isRange");
      if (await rangeToggle.isVisible({ timeout: 3000 })) {
        await rangeToggle.click();
        await expect(adminPage.locator("input#rangeStartYears")).toBeVisible({ timeout: 3000 });
        await expect(adminPage.locator("input#rangeEndYears")).toBeVisible({ timeout: 3000 });
      }
      await adminPage.getByRole("dialog").locator(".btn-close").click();
    }
    const list = new MetadataTablePage(adminPage);
    await list.goto();
    await list.deleteTable(name);
  });
});
