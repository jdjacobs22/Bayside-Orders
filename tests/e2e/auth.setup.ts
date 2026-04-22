import { test as setup, expect } from "@playwright/test";
import path from "path";

const adminFile = path.join(__dirname, ".auth/admin.json");
const captainFile = path.join(__dirname, ".auth/captain.json");

async function login(
  page: any,
  email: string,
  password: string,
  expectedUrl: string
) {
  await page.goto("/");
  await page.waitForSelector('input[type="email"]', { timeout: 10_000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${expectedUrl}**`, { timeout: 15_000 });
}

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD environment variables.\n" +
        "Export them before running Playwright tests."
    );
  }
  await login(page, email, password, "/admin");
  await page.context().storageState({ path: adminFile });
});

setup("authenticate as captain", async ({ page }) => {
  const email = process.env.TEST_CAPTAIN_EMAIL;
  const password = process.env.TEST_CAPTAIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Missing TEST_CAPTAIN_EMAIL or TEST_CAPTAIN_PASSWORD environment variables.\n" +
        "Export them before running Playwright tests."
    );
  }
  await login(page, email, password, "/captain");
  await page.context().storageState({ path: captainFile });
});
