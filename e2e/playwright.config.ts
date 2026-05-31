import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env["CI"] ? 2 : 0,
  timeout: 60000,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env["VANILLA_NG_URL"] || "https://localhost:8099",
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
