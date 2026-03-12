import { describe, it, expect } from "vitest";
import {
  Time24HourSchema,
  DateDMYSchema,
  getBaseSchema,
  getAdminSchema,
  getCaptainSchema,
} from "@/lib/schemas";

describe("Time24HourSchema", () => {
  it("accepts valid 24-hour times", () => {
    expect(Time24HourSchema.parse("00:00")).toBe("00:00");
    expect(Time24HourSchema.parse("12:30")).toBe("12:30");
    expect(Time24HourSchema.parse("23:59")).toBe("23:59");
    expect(Time24HourSchema.parse("09:05")).toBe("09:05");
  });

  it("rejects invalid 24-hour times", () => {
    expect(() => Time24HourSchema.parse("25:00")).toThrow();
    expect(() => Time24HourSchema.parse("24:00")).toThrow();
    expect(() => Time24HourSchema.parse("12:60")).toThrow();
    expect(() => Time24HourSchema.parse("9:30")).toThrow(); // must be HH:mm
    expect(() => Time24HourSchema.parse("12:5")).toThrow();
    expect(() => Time24HourSchema.parse("")).toThrow();
  });
});

describe("DateDMYSchema", () => {
  it("accepts valid dd/mm/yyyy dates", () => {
    expect(DateDMYSchema.parse("15/03/2025")).toBe("15/03/2025");
    expect(DateDMYSchema.parse("01/01/2020")).toBe("01/01/2020");
    expect(DateDMYSchema.parse("31/12/2024")).toBe("31/12/2024");
  });

  it("rejects invalid format", () => {
    expect(() => DateDMYSchema.parse("01-01-2025")).toThrow();
    expect(() => DateDMYSchema.parse("2025-03-15")).toThrow();
    expect(() => DateDMYSchema.parse("1/1/2025")).toThrow();
  });

  it("rejects non-existent dates", () => {
    expect(() => DateDMYSchema.parse("30/02/2025")).toThrow();
    expect(() => DateDMYSchema.parse("31/04/2025")).toThrow();
  });
});

describe("getBaseSchema", () => {
  it("accepts minimal optional data", () => {
    const schema = getBaseSchema();
    const result = schema.parse({});
    expect(result).toMatchObject({ efectivo: false, transferir: false });
  });

  it("coerces decimal-like values to numbers", () => {
    const schema = getBaseSchema();
    const result = schema.parse({
      combustible: "100.50",
      deposito: 500,
    });
    expect(result.combustible).toBe(100.5);
    expect(result.deposito).toBe(500);
  });

  it("defaults efectivo and transferir to false", () => {
    const schema = getBaseSchema();
    const result = schema.parse({});
    expect(result.efectivo).toBe(false);
    expect(result.transferir).toBe(false);
  });
});

describe("getAdminSchema", () => {
  const validAdminData = {
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@test.com",
    cell: "1234567890",
    cliente: "Maria Lopez",
    clienteCell: "0987654321",
    clienteEmail: "maria@test.com",
    fechaEmbarque: "15/03/2025",
    horaEmbarque: "14:30",
    destino: "Yelapa",
    puntoEncuentro: "Marina Vallarta",
    pasajeros: 4,
    horasAcordadas: 6,
    tarifaHora: 1500,
    deposito: 3000,
    pagoCapitana: 4000,
    pagoMarinero: 1000,
  };

  it("accepts valid admin data", () => {
    const schema = getAdminSchema();
    expect(schema.parse(validAdminData)).toBeDefined();
  });

  it("requires nombre", () => {
    const schema = getAdminSchema();
    expect(() => schema.parse({ ...validAdminData, nombre: "" })).toThrow();
  });

  it("requires valid email", () => {
    const schema = getAdminSchema();
    expect(() =>
      schema.parse({ ...validAdminData, email: "invalid" })
    ).toThrow();
  });

  it("requires horaEmbarque in HH:mm format", () => {
    const schema = getAdminSchema();
    expect(() =>
      schema.parse({ ...validAdminData, horaEmbarque: "9:30" })
    ).toThrow();
  });

  it("constrains pasajeros between 1 and 6", () => {
    const schema = getAdminSchema();
    expect(() =>
      schema.parse({ ...validAdminData, pasajeros: 0 })
    ).toThrow();
    expect(() =>
      schema.parse({ ...validAdminData, pasajeros: 7 })
    ).toThrow();
    expect(schema.parse({ ...validAdminData, pasajeros: 1 })).toBeDefined();
    expect(schema.parse({ ...validAdminData, pasajeros: 6 })).toBeDefined();
  });
});

describe("getCaptainSchema", () => {
  const baseCaptainData = {
    nombre: "Carla",
    apellido: "García",
  };

  it("accepts minimal captain data with no saldo or extras", () => {
    const schema = getCaptainSchema();
    expect(schema.parse(baseCaptainData)).toBeDefined();
  });

  it("requires payment method when saldoCliente > 0", () => {
    const schema = getCaptainSchema();
    const data = {
      ...baseCaptainData,
      saldoCliente: 500,
      pagoRecibo: 500,
    };
    expect(() =>
      schema.parse({ ...data, efectivo: false, transferir: false })
    ).toThrow("Elige un método de pago para el saldo");
    expect(
      schema.parse({ ...data, efectivo: true, transferir: false })
    ).toBeDefined();
  });

  it("requires pagoRecibo when saldoCliente > 0", () => {
    const schema = getCaptainSchema();
    expect(() =>
      schema.parse({
        ...baseCaptainData,
        saldoCliente: 500,
        efectivo: true,
        pagoRecibo: 0,
      })
    ).toThrow("El monto del recibo es requerido");
  });

  it("requires payment method when horasExtras > 0", () => {
    const schema = getCaptainSchema();
    const data = {
      ...baseCaptainData,
      horasExtras: 2,
      pagoHorasExtra: 500,
    };
    expect(() =>
      schema.parse({
        ...data,
        horasExtrasEfectivo: false,
        horasExtrasTransferir: false,
      })
    ).toThrow("Elige un método de pago para horas extras");
  });

  it("requires pagoHorasExtra when horasExtras > 0", () => {
    const schema = getCaptainSchema();
    expect(() =>
      schema.parse({
        ...baseCaptainData,
        horasExtras: 2,
        horasExtrasEfectivo: true,
        pagoHorasExtra: 0,
      })
    ).toThrow("El monto de horas extras es requerido");
  });
});
