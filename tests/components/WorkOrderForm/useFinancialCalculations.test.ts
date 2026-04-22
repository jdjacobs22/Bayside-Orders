import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFinancialCalculations } from "@/components/WorkOrderForm/useFinancialCalculations";

function makeParams(overrides: Record<string, any> = {}) {
  return {
    tarifaHora: 0,
    horasAcordadas: 0,
    horasExtrasVal: 0,
    gastoVarios: 0,
    deposito: 0,
    pagoReciboVal: 0,
    pagoHorasExtra: 0,
    combustible: 0,
    hielo: 0,
    aguaBebidas: 0,
    pagoCapitana: 0,
    pagoMarinero: 0,
    setValue: vi.fn(),
    getValues: vi.fn().mockReturnValue({}),
    ...overrides,
  };
}

describe("useFinancialCalculations", () => {
  describe("precioAcordado = tarifaHora × horasAcordadas (floored)", () => {
    it("basic multiplication", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(makeParams({ tarifaHora: 100, horasAcordadas: 4, setValue }))
      );
      expect(setValue).toHaveBeenCalledWith("precioAcordado", 400);
    });

    it("floors fractional result", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(makeParams({ tarifaHora: 100, horasAcordadas: 3.5, setValue }))
      );
      expect(setValue).toHaveBeenCalledWith("precioAcordado", 350);
    });

    it("rounds down partial hours correctly", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(makeParams({ tarifaHora: 150, horasAcordadas: 3, setValue }))
      );
      expect(setValue).toHaveBeenCalledWith("precioAcordado", 450);
    });
  });

  describe("cargoExtra = tarifaHora × horasExtras (floored)", () => {
    it("calculates extra hours charge", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(makeParams({ tarifaHora: 100, horasExtrasVal: 2, setValue }))
      );
      expect(setValue).toHaveBeenCalledWith("cargoExtra", 200);
    });

    it("zero extra hours → no setValue call (value already matches default 0)", () => {
      // The hook skips setValue when calculated === current form value.
      // Both calculated (0) and current (undefined → 0) match, so no call fires.
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(makeParams({ tarifaHora: 100, horasExtrasVal: 0, setValue }))
      );
      expect(setValue).not.toHaveBeenCalledWith("cargoExtra", expect.anything());
    });
  });

  describe("totalClienteCost = precioAcordado + cargoExtra + gastoVarios", () => {
    it("sums all three components", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(
          makeParams({
            tarifaHora: 100,
            horasAcordadas: 4,   // precioAcordado = 400
            horasExtrasVal: 1,   // cargoExtra = 100
            gastoVarios: 50,
            setValue,
          })
        )
      );
      expect(setValue).toHaveBeenCalledWith("totalClienteCost", 550);
    });
  });

  describe("saldoCliente = totalCost − deposito − pagoRecibo − pagoHorasExtra", () => {
    it("subtracts all payments from total", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(
          makeParams({
            tarifaHora: 100,
            horasAcordadas: 4, // precioAcordado = 400
            deposito: 100,
            pagoReciboVal: 50,
            pagoHorasExtra: 25,
            setValue,
          })
        )
      );
      // saldo = 400 - 100 - 50 - 25 = 225
      expect(setValue).toHaveBeenCalledWith("saldoCliente", 225);
    });

    it("saldo is negative when payments exceed cost", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(
          makeParams({
            tarifaHora: 100,
            horasAcordadas: 2, // precioAcordado = 200
            deposito: 300,
            setValue,
          })
        )
      );
      expect(setValue).toHaveBeenCalledWith("saldoCliente", -100);
    });
  });

  describe("ingresoNeto = (precioAcordado + cargoExtra) − all expenses", () => {
    it("subtracts all expense categories", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(
          makeParams({
            tarifaHora: 100,
            horasAcordadas: 4, // precioAcordado = 400
            combustible: 30,
            hielo: 20,
            aguaBebidas: 10,
            gastoVarios: 15,
            pagoCapitana: 80,
            pagoMarinero: 40,
            setValue,
          })
        )
      );
      // neto = 400 - (30 + 20 + 10 + 15 + 80 + 40) = 400 - 195 = 205
      expect(setValue).toHaveBeenCalledWith("ingresoNeto", 205);
    });

    it("includes extra hours income in neto", () => {
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(
          makeParams({
            tarifaHora: 100,
            horasAcordadas: 4, // precioAcordado = 400
            horasExtrasVal: 1, // cargoExtra = 100
            pagoCapitana: 50,
            setValue,
          })
        )
      );
      // neto = (400 + 100) - 50 = 450
      expect(setValue).toHaveBeenCalledWith("ingresoNeto", 450);
    });
  });

  describe("undefined inputs treated as 0", () => {
    it("handles all-undefined inputs without throwing", () => {
      const setValue = vi.fn();
      expect(() =>
        renderHook(() =>
          useFinancialCalculations(
            makeParams({
              tarifaHora: undefined,
              horasAcordadas: undefined,
              combustible: undefined,
              setValue,
            })
          )
        )
      ).not.toThrow();
    });

    it("treats undefined tarifaHora as 0 — no setValue call when result matches default", () => {
      // undefined tarifaHora → rate=0 → precioAcordado=0, same as form default → no call.
      const setValue = vi.fn();
      renderHook(() =>
        useFinancialCalculations(makeParams({ tarifaHora: undefined, horasAcordadas: 4, setValue }))
      );
      expect(setValue).not.toHaveBeenCalledWith("precioAcordado", expect.anything());
    });
  });

  describe("no-op when value is already correct", () => {
    it("does not call setValue for precioAcordado when it already matches", () => {
      const setValue = vi.fn();
      const getValues = vi.fn().mockReturnValue({
        precioAcordado: 400,
        cargoExtra: 0,
        totalClienteCost: 400,
        saldoCliente: 400,
        debidoABayside: 400,
        ingresoNeto: 400,
      });
      renderHook(() =>
        useFinancialCalculations(
          makeParams({ tarifaHora: 100, horasAcordadas: 4, setValue, getValues })
        )
      );
      expect(setValue).not.toHaveBeenCalledWith("precioAcordado", 400);
    });
  });
});
