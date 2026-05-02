import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = 4200;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e-test-results',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: './playwright-report' }], ['list']],
  timeout: 60000,
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx ng serve cupcake-vanilla-ng --port ${E2E_PORT} --ssl=false`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
