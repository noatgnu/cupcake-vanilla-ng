import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env["CI"] ? 2 : 0,
  timeout: 120000,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env["VANILLA_NG_URL"] || "http://localhost:4200",
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--allow-insecure-localhost",
      ],
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
