import { test, expect } from "@playwright/test";

/**
 * Financial auto-calculation — entering tarifaHora and horasAcordadas
 * should update precioAcordado in real time (client-side React Hook Form watch).
 *
 * Runs with the admin storageState (chromium project).
 */
test.describe("Financial auto-calculation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/create");
    await page.waitForSelector('input[name="tarifaHora"]', { timeout: 10_000 });
  });

  test("precioAcordado = tarifaHora × horasAcordadas", async ({ page }) => {
    const tarifaInput = page.locator('input[name="tarifaHora"]');
    const horasInput = page.locator('input[name="horasAcordadas"]');
    const precioInput = page.locator('input[name="precioAcordado"]');

    await tarifaInput.fill("150");
    await horasInput.fill("3");

    // Trigger change event so React Hook Form watch fires
    await horasInput.press("Tab");

    // precioAcordado should auto-populate to 450
    await expect(precioInput).toHaveValue("450", { timeout: 3_000 });
  });

  test("precioAcordado updates when tarifaHora changes", async ({ page }) => {
    const tarifaInput = page.locator('input[name="tarifaHora"]');
    const horasInput = page.locator('input[name="horasAcordadas"]');
    const precioInput = page.locator('input[name="precioAcordado"]');

    await tarifaInput.fill("100");
    await horasInput.fill("4");
    await horasInput.press("Tab");
    await expect(precioInput).toHaveValue("400", { timeout: 3_000 });

    // Change the rate — precio should update
    await tarifaInput.fill("200");
    await tarifaInput.press("Tab");
    await expect(precioInput).toHaveValue("800", { timeout: 3_000 });
  });

  test("precioAcordado is 0 when hours are 0", async ({ page }) => {
    const tarifaInput = page.locator('input[name="tarifaHora"]');
    const horasInput = page.locator('input[name="horasAcordadas"]');
    const precioInput = page.locator('input[name="precioAcordado"]');

    await tarifaInput.fill("100");
    await horasInput.fill("0");
    await horasInput.press("Tab");

    await expect(precioInput).toHaveValue("0", { timeout: 3_000 });
  });
});
