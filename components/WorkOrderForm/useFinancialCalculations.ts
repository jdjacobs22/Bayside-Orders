"use client";

import { useEffect } from "react";
import { UseFormSetValue, UseFormGetValues } from "react-hook-form";

interface UseFinancialCalculationsProps {
  tarifaHora: number | undefined;
  horasAcordadas: number | undefined;
  horasExtrasVal: number | undefined;
  gastoVarios: number | undefined;
  deposito: number | undefined;
  pagoReciboVal: number | undefined;
  pagoHorasExtra: number | undefined;
  combustible: number | undefined;
  hielo: number | undefined;
  aguaBebidas: number | undefined;
  pagoCapitana: number | undefined;
  pagoMarinero: number | undefined;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

export function useFinancialCalculations({
  tarifaHora,
  horasAcordadas,
  horasExtrasVal,
  gastoVarios,
  deposito,
  pagoReciboVal,
  pagoHorasExtra,
  combustible,
  hielo,
  aguaBebidas,
  pagoCapitana,
  pagoMarinero,
  setValue,
  getValues,
}: UseFinancialCalculationsProps) {
  useEffect(() => {
    const rate = Number(tarifaHora) || 0;
    const duration = Number(horasAcordadas) || 0;
    const extraHours = Number(horasExtrasVal) || 0;
    const varios = Number(gastoVarios) || 0;
    const dep = Number(deposito) || 0;
    const recibo = Number(pagoReciboVal) || 0;
    const extraPay = Number(pagoHorasExtra) || 0;

    const fuel = Number(combustible) || 0;
    const ice = Number(hielo) || 0;
    const beverages = Number(aguaBebidas) || 0;
    const capitana = Number(pagoCapitana) || 0;
    const marinero = Number(pagoMarinero) || 0;

    const calcPrecioAcordado = Math.floor(rate * duration);
    const calcCargoExtra = Math.floor(rate * extraHours);
    const calcTotalCost = calcPrecioAcordado + calcCargoExtra + varios;
    const calcSaldo = calcTotalCost - dep - recibo - extraPay;
    const totalExpenses = fuel + ice + beverages + varios + capitana + marinero;
    const calcNeto = (calcPrecioAcordado + calcCargoExtra) - totalExpenses;

    const current = getValues();

    if (Math.floor(Number(current.precioAcordado) || 0) !== calcPrecioAcordado) {
      setValue("precioAcordado", calcPrecioAcordado);
    }
    if (Math.floor(Number(current.cargoExtra) || 0) !== calcCargoExtra) {
      setValue("cargoExtra", calcCargoExtra);
    }
    if (Math.floor(Number(current.totalClienteCost) || 0) !== calcTotalCost) {
      setValue("totalClienteCost", calcTotalCost);
    }
    if (Math.floor(Number(current.saldoCliente) || 0) !== Math.floor(calcSaldo)) {
      setValue("saldoCliente", Math.floor(calcSaldo));
    }
    if (Math.floor(Number(current.debidoABayside) || 0) !== Math.floor(calcSaldo)) {
      setValue("debidoABayside", Math.floor(calcSaldo));
    }
    if (Math.floor(Number(current.ingresoNeto) || 0) !== Math.floor(calcNeto)) {
      setValue("ingresoNeto", Math.floor(calcNeto));
    }
  }, [
    tarifaHora, horasAcordadas, horasExtrasVal, gastoVarios, deposito,
    pagoReciboVal, pagoHorasExtra, combustible, hielo, aguaBebidas,
    pagoCapitana, pagoMarinero, setValue, getValues,
  ]);
}
