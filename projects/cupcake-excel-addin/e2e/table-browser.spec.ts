import { test, expect, Page } from '@playwright/test';
import { setupOfficeMock } from './office-mock';

const API = 'http://localhost:8000/api/v1';

const LAB_GROUPS = {
  count: 2,
  results: [
    { id: 1, name: 'Lab A' },
    { id: 2, name: 'Lab B' },
  ],
};

const TABLES_PAGE_1 = {
  count: 3,
  next: null,
  previous: null,
  results: [
    { id: 10, name: 'Proteomics Run 1', sampleCount: 12, columnCount: 5, labGroupName: 'Lab A', isLocked: false, isPublished: true },
    { id: 11, name: 'Metabolomics Study', sampleCount: 8, columnCount: 3, labGroupName: null, isLocked: true, isPublished: false },
    { id: 12, name: 'Genomics Batch 2', sampleCount: 24, columnCount: 7, labGroupName: 'Lab B', isLocked: false, isPublished: false },
  ],
};

const EMPTY_TABLES = { count: 0, next: null, previous: null, results: [] };

async function setupApiMocks(page: Page): Promise<void> {
  await page.route(`${API}/lab-groups/my_lab_groups/**`, async (route) => {
    await route.fulfill({ json: LAB_GROUPS });
  });

  await page.route(`${API}/metadata-tables/**`, async (route) => {
    const url = route.request().url();
    if (url.includes('search=nomatch')) {
      await route.fulfill({ json: EMPTY_TABLES });
    } else {
      await route.fulfill({ json: TABLES_PAGE_1 });
    }
  });
}

async function navigateToTableBrowser(page: Page): Promise<void> {
  await setupOfficeMock(page);
  await setupApiMocks(page);
  await page.goto('/');
  await page.waitForSelector('app-table-browser', { timeout: 15000 });
}

test.describe('TableBrowser — unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupOfficeMock(page);
    await page.goto('/');
  });

  test('shows login form before authentication', async ({ page }) => {
    await expect(page.locator('app-compact-login')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('TableBrowser — table list', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTableBrowser(page);
  });

  test('renders the table browser component', async ({ page }) => {
    await expect(page.locator('app-table-browser')).toBeVisible();
  });

  test('shows search input', async ({ page }) => {
    await expect(page.locator('app-table-browser input[type="text"]').first()).toBeVisible();
  });

  test('shows lab group filter select', async ({ page }) => {
    await expect(page.locator('app-table-browser select').first()).toBeVisible();
  });

  test('lists returned tables', async ({ page }) => {
    await expect(page.locator('app-table-browser .table-item')).toHaveCount(3);
  });

  test('shows table names', async ({ page }) => {
    await expect(page.locator('app-table-browser .table-item').first()).toContainText('Proteomics Run 1');
  });

  test('shows sample and column counts', async ({ page }) => {
    await expect(page.locator('app-table-browser .table-item').first()).toContainText('12 samples');
    await expect(page.locator('app-table-browser .table-item').first()).toContainText('5 columns');
  });

  test('shows lab group name when present', async ({ page }) => {
    await expect(page.locator('app-table-browser .table-item').first()).toContainText('Lab A');
  });

  test('shows lock badge for locked tables', async ({ page }) => {
    const lockedItem = page.locator('app-table-browser .table-item').nth(1);
    await expect(lockedItem.locator('.badge.bg-warning')).toBeVisible();
  });

  test('shows published badge for published tables', async ({ page }) => {
    const publishedItem = page.locator('app-table-browser .table-item').first();
    await expect(publishedItem.locator('.badge.bg-success')).toBeVisible();
  });
});

test.describe('TableBrowser — search', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTableBrowser(page);
  });

  test('search input triggers a new request', async ({ page }) => {
    let searchRequestMade = false;
    await page.route(`${API}/metadata-tables/**`, async (route) => {
      const url = route.request().url();
      if (url.includes('search=')) searchRequestMade = true;
      await route.fulfill({ json: TABLES_PAGE_1 });
    });

    const searchInput = page.locator('app-table-browser input[type="text"]').first();
    await searchInput.fill('proteomics');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    expect(searchRequestMade).toBe(true);
  });

  test('shows empty state when no results', async ({ page }) => {
    await page.route(`${API}/metadata-tables/**`, async (route) => {
      await route.fulfill({ json: EMPTY_TABLES });
    });

    const searchInput = page.locator('app-table-browser input[type="text"]').first();
    await searchInput.fill('nomatch');
    await searchInput.press('Enter');

    await expect(page.locator('app-table-browser .table-list')).toContainText('No tables found');
  });

  test('column search panel is hidden by default', async ({ page }) => {
    await expect(page.locator('app-table-browser .column-search')).not.toBeVisible();
  });

  test('toggle button shows column search panel', async ({ page }) => {
    await page.locator('app-table-browser button[title="Search by column content"]').click();
    await expect(page.locator('app-table-browser .column-search')).toBeVisible();
  });

  test('clear button resets search and re-fetches', async ({ page }) => {
    const searchInput = page.locator('app-table-browser input[type="text"]').first();
    await searchInput.fill('something');

    let fetchCount = 0;
    await page.route(`${API}/metadata-tables/**`, async (route) => {
      fetchCount++;
      await route.fulfill({ json: TABLES_PAGE_1 });
    });

    await page.locator('app-table-browser button').filter({ hasText: '' }).last().click();
    await page.waitForTimeout(300);

    expect(fetchCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('TableBrowser — lab group filter', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTableBrowser(page);
  });

  test('lab group dropdown contains loaded groups', async ({ page }) => {
    const select = page.locator('app-table-browser select').first();
    await expect(select.locator('option', { hasText: 'Lab A' })).toBeAttached();
    await expect(select.locator('option', { hasText: 'Lab B' })).toBeAttached();
  });

  test('selecting a lab group triggers filtered request', async ({ page }) => {
    let filteredRequest = false;
    await page.route(`${API}/metadata-tables/**`, async (route) => {
      const url = route.request().url();
      if (url.includes('lab_group_id=1')) filteredRequest = true;
      await route.fulfill({ json: TABLES_PAGE_1 });
    });

    await page.locator('app-table-browser select').first().selectOption('1');
    await page.waitForTimeout(300);

    expect(filteredRequest).toBe(true);
  });
});
