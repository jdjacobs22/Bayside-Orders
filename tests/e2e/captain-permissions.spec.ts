import { test, expect } from "@playwright/test";

/**
 * Captain permission gating — verifies that the WorkOrderForm in captain-edit
 * mode enforces field-level restrictions:
 *   - Admin-only fields (nombre, destino, etc.) are disabled
 *   - Captain-editable fields (combustible, hielo, etc.) are enabled
 *
 * Runs with the captain storageState (captain project).
 * Requires TEST_CAPTAIN_ORDER_ID env var — an order ID assigned to the captain.
 */
test.describe("Captain — field permission gating", () => {
  test.beforeEach(async ({ page }) => {
    const orderId = process.env.TEST_CAPTAIN_ORDER_ID;
    if (!orderId) {
      throw new Error(
        "Missing TEST_CAPTAIN_ORDER_ID environment variable.\n" +
          "Export it before running Playwright tests."
      );
    }
    await page.goto(`/captain/order/${orderId}`);
    // Wait for the form — captain view renders WorkOrderForm in captain-edit mode
    await page.waitForSelector('input[name="combustible"]', { timeout: 15_000 });
  });

  test("nombre Select is disabled for captain", async ({ page }) => {
    // The nombre Select trigger renders as role="combobox"
    const combos = page.getByRole("combobox");
    const nombreTrigger = combos.first();
    await expect(nombreTrigger).toBeDisabled();
  });

  test("combustible input is enabled for captain", async ({ page }) => {
    const combustibleInput = page.locator('input[name="combustible"]');
    await expect(combustibleInput).not.toBeDisabled();
  });

  test("hielo input is enabled for captain", async ({ page }) => {
    const hieloInput = page.locator('input[name="hielo"]');
    await expect(hieloInput).not.toBeDisabled();
  });

  test("tarifaHora is disabled for captain", async ({ page }) => {
    const tarifaInput = page.locator('input[name="tarifaHora"]');
    await expect(tarifaInput).toBeDisabled();
  });

  test("horasAcordadas is disabled for captain", async ({ page }) => {
    const horasInput = page.locator('input[name="horasAcordadas"]');
    await expect(horasInput).toBeDisabled();
  });

  test("captain can type into combustible field", async ({ page }) => {
    const combustibleInput = page.locator('input[name="combustible"]');
    await combustibleInput.fill("350");
    await expect(combustibleInput).toHaveValue("350");
  });

  test("horaLlegado (arrival time) is enabled for captain", async ({ page }) => {
    const horaInput = page.locator('input[name="horaLlegado"]');
    await expect(horaInput).not.toBeDisabled();
  });
});
