import { test, expect, Page } from '@playwright/test';

const API = 'http://localhost:8000/api/v1';

const MOCK_USER = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  is_staff: false,
  is_superuser: false,
  date_joined: '2024-01-01T00:00:00Z',
  last_login: null,
};

function makeJwt(expOffsetSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
    user_id: 1,
    username: 'testuser',
    email: 'test@example.com',
    is_staff: false,
    is_superuser: false,
  }));
  return `${header}.${payload}.fakesig`;
}

async function mockProfileRoute(page: Page): Promise<void> {
  await page.route(`${API}/auth/profile/`, route =>
    route.fulfill({ json: { user: MOCK_USER } })
  );
}

async function seedValidTokens(page: Page): Promise<void> {
  await page.evaluate(([access, refresh]) => {
    localStorage.setItem('ccvAccessToken', access);
    localStorage.setItem('ccvRefreshToken', refresh);
  }, [makeJwt(3600), 'valid-refresh-token']);
}

async function seedExpiredAccessToken(page: Page): Promise<void> {
  await page.evaluate(([access, refresh]) => {
    localStorage.setItem('ccvAccessToken', access);
    localStorage.setItem('ccvRefreshToken', refresh);
  }, [makeJwt(-3600), 'valid-refresh-token']);
}

test.describe('Auth - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show login form when no tokens in localStorage', async ({ page }) => {
    await expect(page.locator('app-login, [data-testid="login-form"], form')).toBeVisible({ timeout: 10000 });
  });

  test('should store access and refresh tokens in localStorage after login', async ({ page }) => {
    const accessToken = makeJwt(3600);
    const refreshToken = 'refresh-token-from-login';

    await page.route(`${API}/auth/login/`, route =>
      route.fulfill({
        json: {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: MOCK_USER,
        },
      })
    );
    await mockProfileRoute(page);

    await page.waitForSelector('input[type="text"], input[placeholder*="user" i]', { timeout: 10000 });
    await page.locator('input[type="text"], input[placeholder*="user" i]').first().fill('testuser');
    await page.locator('input[type="password"]').fill('testpass');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")').first().click();

    await page.waitForFunction(() => !!localStorage.getItem('ccvAccessToken'), { timeout: 5000 });

    const storedAccess = await page.evaluate(() => localStorage.getItem('ccvAccessToken'));
    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));

    expect(storedAccess).toBe(accessToken);
    expect(storedRefresh).toBe(refreshToken);
  });
});

test.describe('Auth - Page refresh with valid access token', () => {
  test('should remain authenticated without calling refresh endpoint', async ({ page }) => {
    const refreshCalls: string[] = [];

    await page.route(`${API}/auth/token/refresh/`, route => {
      refreshCalls.push(route.request().url());
      return route.fulfill({ json: { access: makeJwt(3600) } });
    });
    await mockProfileRoute(page);

    await page.goto('/');
    await seedValidTokens(page);
    await page.reload();

    await page.waitForTimeout(2000);
    expect(refreshCalls.length).toBe(0, 'refresh endpoint must not be called when access token is still valid');

    const storedAccess = await page.evaluate(() => localStorage.getItem('ccvAccessToken'));
    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));
    expect(storedAccess).not.toBeNull();
    expect(storedRefresh).toBe('valid-refresh-token');
  });
});

test.describe('Auth - Page refresh with expired access token', () => {
  test('should call refresh endpoint exactly once and store new tokens', async ({ page }) => {
    const newAccessToken = makeJwt(3600);
    const newRefreshToken = 'rotated-refresh-token';
    const refreshCalls: string[] = [];

    await page.route(`${API}/auth/token/refresh/`, route => {
      refreshCalls.push(route.request().url());
      return route.fulfill({ json: { access: newAccessToken, refresh: newRefreshToken } });
    });
    await mockProfileRoute(page);

    await page.goto('/');
    await seedExpiredAccessToken(page);
    await page.reload();

    await page.waitForFunction(
      ([expected]) => localStorage.getItem('ccvAccessToken') === expected,
      [newAccessToken],
      { timeout: 5000 }
    );

    expect(refreshCalls.length).toBe(1, 'refresh endpoint must be called exactly once — not twice due to race condition');

    const storedAccess = await page.evaluate(() => localStorage.getItem('ccvAccessToken'));
    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));

    expect(storedAccess).toBe(newAccessToken);
    expect(storedRefresh).toBe(newRefreshToken);
  });

  test('should NOT delete tokens from localStorage (old race condition regression)', async ({ page }) => {
    const newAccess = makeJwt(3600);

    await page.route(`${API}/auth/token/refresh/`, route =>
      route.fulfill({ json: { access: newAccess, refresh: 'rotated-refresh' } })
    );
    await mockProfileRoute(page);

    await page.goto('/');
    await seedExpiredAccessToken(page);
    await page.reload();

    await page.waitForTimeout(3000);

    const storedAccess = await page.evaluate(() => localStorage.getItem('ccvAccessToken'));
    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));

    expect(storedAccess).not.toBeNull('access token must not be wiped from localStorage on page refresh');
    expect(storedRefresh).not.toBeNull('refresh token must not be wiped from localStorage on page refresh');
  });
});

test.describe('Auth - Refresh token failure', () => {
  test('should clear both tokens and redirect to login when refresh is rejected', async ({ page }) => {
    await page.route(`${API}/auth/token/refresh/`, route =>
      route.fulfill({ status: 401, json: { detail: 'Token is blacklisted' } })
    );

    await page.goto('/');
    await seedExpiredAccessToken(page);
    await page.reload();

    await page.waitForFunction(
      () => localStorage.getItem('ccvAccessToken') === null,
      { timeout: 5000 }
    );

    const storedAccess = await page.evaluate(() => localStorage.getItem('ccvAccessToken'));
    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));

    expect(storedAccess).toBeNull();
    expect(storedRefresh).toBeNull();

    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});

test.describe('Auth - Observable streams for libraries', () => {
  test('authenticated$ should emit false then true after successful token refresh', async ({ page }) => {
    const newAccess = makeJwt(3600);

    await page.route(`${API}/auth/token/refresh/`, route =>
      route.fulfill({ json: { access: newAccess, refresh: 'rotated-refresh' } })
    );
    await mockProfileRoute(page);

    await page.goto('/');
    await seedExpiredAccessToken(page);
    await page.reload();

    await page.waitForFunction(
      ([expected]) => localStorage.getItem('ccvAccessToken') === expected,
      [newAccess],
      { timeout: 5000 }
    );

    const isAuthenticated = await page.evaluate(() => !!localStorage.getItem('ccvAccessToken'));
    expect(isAuthenticated).toBe(true);
  });
});
