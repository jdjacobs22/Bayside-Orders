/**
 * Field permission logic for WorkOrderForm.
 * Extracted as a pure function so it can be unit-tested independently.
 */

/** Fields that are always derived/calculated — never directly editable by any role. */
export const CALCULATED_FIELDS = [
  "precioAcordado",
  "cargoExtra",
  "totalClienteCost",
  "saldoCliente",
  "debidoABayside",
  "ingresoNeto",
];

/** Fields that a captain is allowed to edit in captain-edit mode. */
export const CAPTAIN_EDITABLE_FIELDS = [
  "horaLlegado",
  "combustible",
  "hielo",
  "aguaBebidas",
  "gastoVarios",
  "horasExtras",
  "efectivo",
  "transferir",
  "pagoRecibo",
  "horasExtrasEfectivo",
  "horasExtrasTransferir",
  "pagoHorasExtra",
  "detallesNotas",
  "deposito",
];

/**
 * Returns true if the given field is editable for the current role.
 *
 * @param fieldName - The form field name to check.
 * @param isCaptain - True when the form is in captain-edit mode.
 */
export function canEdit(fieldName: string, isCaptain: boolean): boolean {
  if (CALCULATED_FIELDS.includes(fieldName)) return false;
  if (!isCaptain) return true;
  return CAPTAIN_EDITABLE_FIELDS.includes(fieldName);
}
