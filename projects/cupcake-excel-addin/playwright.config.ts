import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = 4220;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
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
    command: `npx ng serve cupcake-excel-addin --port ${E2E_PORT} --ssl=false`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
