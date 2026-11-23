import { defineConfig, devices } from "@playwright/test";

/*
 * e2e runs against its own production server: run `npm run build` first.
 * Playwright starts it with MAIL_TRANSPORT=log, which wins over .env.local,
 * so the forms send no real mail. It never reuses a server it did not start
 * (that one could send with Resend): if port 3100 is taken, the run stops.
 */
const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- --port ${port}`,
    env: { MAIL_TRANSPORT: "log" },
    reuseExistingServer: false,
    url: baseURL,
  },
});
