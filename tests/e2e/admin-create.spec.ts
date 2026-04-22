import { test, expect } from "@playwright/test";

/**
 * Admin create flow — fill required fields, submit, verify success dialog
 * with an order number.
 *
 * Runs with the admin storageState (chromium project).
 * Depends on TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD being set (auth.setup.ts).
 */
test.describe("Admin — create work order", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/create");
    // Wait for the form to be interactive
    await page.waitForSelector('button[type="submit"]', { timeout: 10_000 });
  });

  test("fills required fields and sees success dialog with order ID", async ({
    page,
  }) => {
    // ── Nombre (captain) ─────────────────────────────────────────────────────
    // The nombre Select trigger renders as role="combobox"
    const combos = page.getByRole("combobox");
    const nombreTrigger = combos.first();
    await nombreTrigger.click();
    // Pick whichever option appears first in the dropdown
    const firstOption = page.getByRole("option").first();
    await firstOption.waitFor({ timeout: 5_000 });
    const captainName = await firstOption.textContent();
    await firstOption.click();

    // ── Destino ───────────────────────────────────────────────────────────────
    await page.getByLabel(/destino/i).fill("Sayulita");

    // ── Punto de Encuentro ────────────────────────────────────────────────────
    await page.getByLabel(/punto.*encuentro/i).fill("Marina Vallarta");

    // ── Fecha de Embarque ─────────────────────────────────────────────────────
    await page.getByText("Seleccione fecha").click();
    // Pick tomorrow in the calendar (first available "future" day button)
    const dayBtn = page
      .getByRole("gridcell")
      .filter({ hasNot: page.locator("[disabled]") })
      .first();
    await dayBtn.click();

    // ── Cliente (guest name) ──────────────────────────────────────────────────
    await page.getByPlaceholder(/cliente/i).first().fill("Smith");

    // ── Pasajeros ─────────────────────────────────────────────────────────────
    const pasajerosInput = page.locator('input[name="pasajeros"]');
    await pasajerosInput.fill("4");

    // ── Tarifa por hora ───────────────────────────────────────────────────────
    const tarifaInput = page.locator('input[name="tarifaHora"]');
    await tarifaInput.fill("100");

    // ── Horas acordadas ───────────────────────────────────────────────────────
    const horasInput = page.locator('input[name="horasAcordadas"]');
    await horasInput.fill("4");

    // ── Submit ────────────────────────────────────────────────────────────────
    await page.getByRole("button", { name: /crear|submit|guardar/i }).click();

    // ── Success dialog should appear with an order ID ─────────────────────────
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    // The dialog should show a numeric order ID
    await expect(dialog).toContainText(/\d+/);

    // Optionally log the captain name for traceability
    console.log("Created order for captain:", captainName?.trim());
  });
});
