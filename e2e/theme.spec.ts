import puppeteer, { Browser, Page } from 'puppeteer';

const APP_URL = 'http://localhost:4200';

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
  is_active: true,
};

const MOCK_SITE_CONFIG = {
  id: 1,
  site_name: 'Test Site',
  site_url: 'http://localhost:4200',
  primary_color: '#1976d2',
  allow_registration: false,
  allow_guest: false,
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

async function setupAuthenticatedPage(page: Page): Promise<void> {
  const accessToken = makeJwt(3600);
  const refreshToken = 'valid-refresh-token';

  await page.setViewport({ width: 1280, height: 800 });

  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/auth/token/refresh/')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: makeJwt(3600), refresh: refreshToken }),
      });
      return;
    }
    if (url.includes('/auth/profile/')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_USER }),
      });
      return;
    }
    if (url.includes('/site-config/public/')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SITE_CONFIG),
      });
      return;
    }
    if (url.includes('/site-config/current/')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SITE_CONFIG),
      });
      return;
    }
    if (url.includes('/notifications/')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [], count: 0 }),
      });
      return;
    }
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      request.abort();
      return;
    }
    request.continue();
  });

  await page.goto(APP_URL);

  await page.evaluate(([access, refresh]: string[]) => {
    localStorage.setItem('ccvAccessToken', access);
    localStorage.setItem('ccvRefreshToken', refresh);
    localStorage.removeItem('cupcake-theme');
    localStorage.removeItem('cupcake-palette');
  }, [accessToken, refreshToken]);

  await page.reload({ waitUntil: 'networkidle0' });
}

async function getCssVar(page: Page, variable: string): Promise<string> {
  return page.evaluate((v: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }, variable);
}

async function getHtmlClasses(page: Page): Promise<string[]> {
  return page.evaluate(() => Array.from(document.documentElement.classList));
}

async function getInlineStyle(page: Page, property: string): Promise<string> {
  return page.evaluate((prop: string) => {
    return document.documentElement.style.getPropertyValue(prop).trim();
  }, property);
}

async function navigateToProfile(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('a.nav-link')).some(a => a.querySelector('i.bi-person-circle')),
    { timeout: 10000 }
  );

  await page.evaluate(() => {
    const toggle = Array.from(document.querySelectorAll('a.nav-link')).find(a => a.querySelector('i.bi-person-circle'));
    (toggle as HTMLElement)?.click();
  });

  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('a.dropdown-item')).some(a => a.textContent?.includes('Profile Settings')),
    { timeout: 5000 }
  );

  await page.evaluate(() => {
    const item = Array.from(document.querySelectorAll('a.dropdown-item')).find(a => a.textContent?.includes('Profile Settings'));
    (item as HTMLElement)?.click();
  });

  await page.waitForFunction(
    () => !!document.querySelector('.user-profile-container'),
    { timeout: 10000 }
  );
}

async function clickAppearanceTab(page: Page): Promise<void> {
  const appearanceBtn = await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Appearance'),
    { timeout: 5000 }
  );
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Appearance');
    (btn as HTMLElement)?.click();
  });

  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('[role="button"]')).some(el => el.textContent?.includes('E-Ink')),
    { timeout: 5000 }
  );
}

describe('Theme - palette switching', () => {
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
    await setupAuthenticatedPage(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should apply theme-default class and non-black primary color on initial load', async () => {
    const classes = await getHtmlClasses(page);
    expect(classes).toContain('theme-default');
    expect(classes).not.toContain('theme-eink');

    const primary = await getCssVar(page, '--cupcake-primary');
    expect(primary).not.toBe('');
    expect(primary.toLowerCase()).not.toBe('#000000');
  });

  it('should navigate to user profile appearance tab and switch to e-ink palette', async () => {
    await navigateToProfile(page);
    await clickAppearanceTab(page);

    await page.evaluate(() => {
      const einkCard = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.textContent?.includes('E-Ink'));
      (einkCard as HTMLElement)?.click();
    });

    await page.waitForFunction(
      () => document.documentElement.classList.contains('theme-eink'),
      { timeout: 5000 }
    );

    const classes = await getHtmlClasses(page);
    expect(classes).toContain('theme-eink');
    expect(classes).not.toContain('theme-default');
  });

  it('should set --cupcake-primary to #000000 in e-ink palette (light mode)', async () => {
    await page.evaluate(() => {
      localStorage.setItem('cupcake-palette', 'eink');
      localStorage.setItem('cupcake-theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(
      () => document.documentElement.classList.contains('theme-eink'),
      { timeout: 5000 }
    );

    const primary = await getCssVar(page, '--cupcake-primary');
    expect(primary.toLowerCase()).toBe('#000000');

    const inlinePrimary = await getInlineStyle(page, '--cupcake-primary');
    expect(inlinePrimary).toBe('');
  });

  it('should remove --cupcake-primary inline style when e-ink palette is active', async () => {
    await page.evaluate(() => {
      localStorage.setItem('cupcake-palette', 'eink');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(
      () => document.documentElement.classList.contains('theme-eink'),
      { timeout: 5000 }
    );

    const inlinePrimary = await getInlineStyle(page, '--cupcake-primary');
    expect(inlinePrimary).toBe('');
  });

  it('should set --cupcake-primary to #ffffff in e-ink palette (dark mode)', async () => {
    await page.evaluate(() => {
      localStorage.setItem('cupcake-palette', 'eink');
      localStorage.setItem('cupcake-theme', 'dark');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(
      () => document.documentElement.classList.contains('theme-eink'),
      { timeout: 5000 }
    );

    const classes = await getHtmlClasses(page);
    expect(classes).toContain('theme-eink');
    expect(classes).toContain('dark-mode');

    const primary = await getCssVar(page, '--cupcake-primary');
    expect(primary.toLowerCase()).toBe('#ffffff');
  });

  it('should restore default palette and primary color when switching back to default', async () => {
    await page.evaluate(() => {
      localStorage.setItem('cupcake-palette', 'eink');
      localStorage.setItem('cupcake-theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(
      () => document.documentElement.classList.contains('theme-eink'),
      { timeout: 5000 }
    );

    await page.evaluate(() => {
      localStorage.setItem('cupcake-palette', 'default');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(
      () => document.documentElement.classList.contains('theme-default'),
      { timeout: 5000 }
    );

    const classes = await getHtmlClasses(page);
    expect(classes).toContain('theme-default');
    expect(classes).not.toContain('theme-eink');

    const primary = await getCssVar(page, '--cupcake-primary');
    expect(primary).not.toBe('');
    expect(primary.toLowerCase()).not.toBe('#000000');
  });

  it('should persist palette selection in localStorage after switching via UI', async () => {
    await navigateToProfile(page);
    await clickAppearanceTab(page);

    await page.evaluate(() => {
      const einkCard = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.textContent?.includes('E-Ink'));
      (einkCard as HTMLElement)?.click();
    });

    await page.waitForFunction(
      () => localStorage.getItem('cupcake-palette') === 'eink',
      { timeout: 5000 }
    );

    const stored = await page.evaluate(() => localStorage.getItem('cupcake-palette'));
    expect(stored).toBe('eink');
  });

  it('should toggle dark mode within e-ink palette via navbar button', async () => {
    await page.evaluate(() => {
      localStorage.setItem('cupcake-palette', 'eink');
      localStorage.setItem('cupcake-theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForFunction(
      () => document.documentElement.classList.contains('theme-eink'),
      { timeout: 5000 }
    );

    const initialTheme = await page.evaluate(() => localStorage.getItem('cupcake-theme'));

    await page.evaluate(() => {
      const iconClasses = ['bi-sun-fill', 'bi-moon-fill', 'bi-circle-half'];
      const btn = Array.from(document.querySelectorAll('button')).find(b => {
        const icon = b.querySelector('i');
        return icon && iconClasses.some(cls => icon.classList.contains(cls));
      });
      (btn as HTMLElement)?.click();
    });

    await page.waitForFunction(
      (initial: string | null) => localStorage.getItem('cupcake-theme') !== initial,
      { timeout: 5000 },
      initialTheme
    );

    const newTheme = await page.evaluate(() => localStorage.getItem('cupcake-theme'));
    expect(['dark', 'auto', 'light']).toContain(newTheme);
    expect(newTheme).not.toBe(initialTheme);

    const classes = await getHtmlClasses(page);
    expect(classes).toContain('theme-eink');
  });
});
