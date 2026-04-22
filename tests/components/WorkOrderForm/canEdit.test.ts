import { describe, it, expect } from "vitest";
import {
  canEdit,
  CALCULATED_FIELDS,
  CAPTAIN_EDITABLE_FIELDS,
} from "@/components/WorkOrderForm/permissions";

describe("canEdit — calculated fields (always read-only)", () => {
  for (const field of CALCULATED_FIELDS) {
    it(`${field} is read-only for admin`, () => {
      expect(canEdit(field, false)).toBe(false);
    });
    it(`${field} is read-only for captain`, () => {
      expect(canEdit(field, true)).toBe(false);
    });
  }
});

describe("canEdit — admin mode (isCaptain=false)", () => {
  const adminEditableFields = [
    "nombre",
    "apellido",
    "email",
    "cell",
    "cliente",
    "clienteCell",
    "clienteEmail",
    "fechaEmbarque",
    "horaEmbarque",
    "destino",
    "puntoEncuentro",
    "pasajeros",
    "tarifaHora",
    "horasAcordadas",
    "pagoCapitana",
    "pagoMarinero",
    "deposito",
  ];

  for (const field of adminEditableFields) {
    it(`can edit ${field}`, () => {
      expect(canEdit(field, false)).toBe(true);
    });
  }

  it("can edit all captain-editable fields too", () => {
    for (const field of CAPTAIN_EDITABLE_FIELDS) {
      expect(canEdit(field, false)).toBe(true);
    }
  });
});

describe("canEdit — captain mode (isCaptain=true)", () => {
  for (const field of CAPTAIN_EDITABLE_FIELDS) {
    it(`can edit ${field}`, () => {
      expect(canEdit(field, true)).toBe(true);
    });
  }

  const adminOnlyFields = [
    "nombre",
    "apellido",
    "email",
    "cell",
    "cliente",
    "clienteCell",
    "clienteEmail",
    "fechaEmbarque",
    "horaEmbarque",
    "destino",
    "puntoEncuentro",
    "pasajeros",
    "tarifaHora",
    "horasAcordadas",
    "pagoCapitana",
    "pagoMarinero",
  ];

  for (const field of adminOnlyFields) {
    it(`cannot edit ${field}`, () => {
      expect(canEdit(field, true)).toBe(false);
    });
  }
});
