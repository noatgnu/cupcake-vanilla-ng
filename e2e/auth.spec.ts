import puppeteer, { Browser, Page } from 'puppeteer';

const APP_URL = 'http://localhost:4200';
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
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
    user_id: 1,
    username: 'testuser',
    email: 'test@example.com',
    is_staff: false,
    is_superuser: false,
  })).toString('base64');
  return `${header}.${payload}.fakesig`;
}

async function interceptRequests(page: Page, handlers: Record<string, { status?: number; body: object }>): Promise<void> {
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    for (const [pattern, response] of Object.entries(handlers)) {
      if (url.includes(pattern)) {
        request.respond({
          status: response.status ?? 200,
          contentType: 'application/json',
          body: JSON.stringify(response.body),
        });
        return;
      }
    }
    request.continue();
  });
}

async function seedTokens(page: Page, accessToken: string, refreshToken: string): Promise<void> {
  await page.evaluate(([access, refresh]: string[]) => {
    localStorage.setItem('ccvAccessToken', access);
    localStorage.setItem('ccvRefreshToken', refresh);
  }, [accessToken, refreshToken]);
}

describe('Auth - Login', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(APP_URL);
    await page.evaluate(() => localStorage.clear());
  });

  afterEach(async () => {
    await page.close();
  });

  it('should show login form when no tokens in localStorage', async () => {
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('form', { timeout: 10000 });
    const form = await page.$('form');
    expect(form).not.toBeNull();
  });

  it('should store access and refresh tokens in localStorage after login', async () => {
    const accessToken = makeJwt(3600);
    const refreshToken = 'refresh-token-from-login';

    await interceptRequests(page, {
      '/auth/login/': { body: { access_token: accessToken, refresh_token: refreshToken, user: MOCK_USER } },
      '/auth/profile/': { body: { user: MOCK_USER } },
    });

    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });

    const usernameInput = await page.$('input[type="text"], input[placeholder*="user" i]');
    if (usernameInput) await usernameInput.type('testuser');
    await (await page.$('input[type="password"]'))!.type('testpass');
    await (await page.$('button[type="submit"]'))!.click();

    await page.waitForFunction(
      () => !!localStorage.getItem('ccvAccessToken'),
      { timeout: 5000 }
    );

    const storedAccess = await page.evaluate(() => localStorage.getItem('ccvAccessToken'));
    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));

    expect(storedAccess).toBe(accessToken);
    expect(storedRefresh).toBe(refreshToken);
  });
});

describe('Auth - Page refresh with valid access token', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should remain authenticated without calling the refresh endpoint', async () => {
    page = await browser.newPage();
    const refreshCalls: string[] = [];

    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/auth/token/refresh/')) {
        refreshCalls.push(request.url());
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: makeJwt(3600) }) });
        return;
      }
      if (request.url().includes('/auth/profile/')) {
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: MOCK_USER }) });
        return;
      }
      request.continue();
    });

    await page.goto(APP_URL);
    await seedTokens(page, makeJwt(3600), 'valid-refresh-token');
    await page.reload({ waitUntil: 'networkidle0' });

    await new Promise(resolve => setTimeout(resolve, 2000));

    expect(refreshCalls.length).toBe(0);

    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));
    expect(storedRefresh).toBe('valid-refresh-token');

    await page.close();
  });
});

describe('Auth - Page refresh with expired access token', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should call refresh endpoint exactly once and store new rotated tokens', async () => {
    page = await browser.newPage();
    const newAccess = makeJwt(3600);
    const newRefresh = 'rotated-refresh-token';
    const refreshCalls: string[] = [];

    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/auth/token/refresh/')) {
        refreshCalls.push(request.url());
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: newAccess, refresh: newRefresh }) });
        return;
      }
      if (request.url().includes('/auth/profile/')) {
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: MOCK_USER }) });
        return;
      }
      request.continue();
    });

    await page.goto(APP_URL);
    await seedTokens(page, makeJwt(-3600), 'old-refresh-token');
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(
      (expected: string) => localStorage.getItem('ccvAccessToken') === expected,
      { timeout: 5000 },
      newAccess
    );

    expect(refreshCalls.length).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('ccvAccessToken'))).toBe(newAccess);
    expect(await page.evaluate(() => localStorage.getItem('ccvRefreshToken'))).toBe(newRefresh);

    await page.close();
  });

  it('should NOT wipe tokens from localStorage on page refresh (regression test)', async () => {
    page = await browser.newPage();
    const newAccess = makeJwt(3600);

    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/auth/token/refresh/')) {
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: newAccess, refresh: 'rotated-refresh' }) });
        return;
      }
      if (request.url().includes('/auth/profile/')) {
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: MOCK_USER }) });
        return;
      }
      request.continue();
    });

    await page.goto(APP_URL);
    await seedTokens(page, makeJwt(-3600), 'old-refresh-token');
    await page.reload({ waitUntil: 'networkidle0' });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const storedAccess = await page.evaluate(() => localStorage.getItem('ccvAccessToken'));
    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));

    expect(storedAccess).not.toBeNull();
    expect(storedRefresh).not.toBeNull();

    await page.close();
  });
});

describe('Auth - Refresh token failure', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should clear tokens and redirect to login when refresh is rejected by backend', async () => {
    page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/auth/token/refresh/')) {
        request.respond({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Token is blacklisted' }) });
        return;
      }
      request.continue();
    });

    await page.goto(APP_URL);
    await seedTokens(page, makeJwt(-3600), 'blacklisted-refresh-token');
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(
      () => localStorage.getItem('ccvAccessToken') === null,
      { timeout: 5000 }
    );

    const storedAccess = await page.evaluate(() => localStorage.getItem('ccvAccessToken'));
    const storedRefresh = await page.evaluate(() => localStorage.getItem('ccvRefreshToken'));
    const currentUrl = page.url();

    expect(storedAccess).toBeNull();
    expect(storedRefresh).toBeNull();
    expect(currentUrl).toMatch(/login/);

    await page.close();
  });
});
