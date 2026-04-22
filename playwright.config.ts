import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Required environment variables (add to .env.test or export before running):
 *   TEST_ADMIN_EMAIL       — email of an admin or representante account
 *   TEST_ADMIN_PASSWORD    — password for the admin account
 *   TEST_CAPTAIN_EMAIL     — email of a captain account
 *   TEST_CAPTAIN_PASSWORD  — password for the captain account
 *   TEST_CAPTAIN_ORDER_ID  — ID of a work order assigned to TEST_CAPTAIN_EMAIL
 *
 * Install browsers once:
 *   npx playwright install chromium
 *
 * Run tests:
 *   npx playwright test
 *   npx playwright test --ui        (interactive)
 *   npx playwright test --headed    (watch the browser)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // run sequentially — tests share the dev DB
  retries: 0,
  workers: 1,
  reporter: "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Auth setup runs first and saves session state to disk.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Admin session is used by most tests.
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
      testIgnore: /captain-permissions\.spec\.ts/,
    },
    {
      name: "captain",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/captain.json",
      },
      dependencies: ["setup"],
      testMatch: /captain-permissions\.spec\.ts/,
    },
  ],

  // Start the dev server automatically when running tests locally.
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true, // reuse if already running
    timeout: 60_000,
  },
});
