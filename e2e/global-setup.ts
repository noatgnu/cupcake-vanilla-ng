/**
 * Playwright global setup: wait for nginx health, save auth states.
 *
 * Everything goes through nginx (VANILLA_NG_URL). nginx proxies /api/ to the backend
 * and serves the Angular frontend, matching production same-origin behaviour.
 * Set E2E_SKIP_BACKEND_CHECK=1 if nginx is known to be running.
 */
import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const BASE_URL = process.env["VANILLA_NG_URL"] || "https://localhost:8099";
const AUTH_STATES_DIR = path.join(__dirname, "auth-states");

async function waitForBackend(timeoutMs = 120000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/`, { method: "GET" });
      if (res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`nginx at ${BASE_URL} did not become healthy within ${timeoutMs}ms`);
}

async function saveAuthState(
  username: string,
  password: string,
  outputFile: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`);
  const data = (await res.json()) as { access_token: string; refresh_token: string };

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ access, refresh }: { access: string; refresh: string }) => {
      localStorage.setItem("ccvAccessToken", access);
      localStorage.setItem("ccvRefreshToken", refresh);
    },
    { access: data.access_token, refresh: data.refresh_token }
  );
  await ctx.storageState({ path: outputFile });
  await browser.close();
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  if (!process.env["E2E_SKIP_BACKEND_CHECK"]) {
    console.log("Waiting for nginx to be ready...");
    await waitForBackend();
    console.log("nginx is ready.");
  }

  fs.mkdirSync(AUTH_STATES_DIR, { recursive: true });
  console.log("Saving auth states...");
  await saveAuthState("admin", "cupcake", path.join(AUTH_STATES_DIR, "admin.json"));
  await saveAuthState("testuser", "testuser123", path.join(AUTH_STATES_DIR, "user.json"));
  console.log("Auth states saved.");
}
