import { z } from "zod";

// Helper to handle both incoming Prisma.Decimal objects and UI string/number inputs
const toNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "object" && val && "toString" in val) return val.toString();
  return val;
}, z.coerce.number());

export const createDecimal50SchemaPesos = () => toNumber;
export const createDecimal50SchemaHoras = () => toNumber;

export const Time24HourSchema = z.string().regex(
  /^([01]\d|2[0-3]):([0-5]\d)$/,
  { message: "Formato de hora inválido. Usa HH:mm (00:00 a 23:59)." }
);

export const DateDMYSchema = z.string()
  .regex(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0,1,2])\/(19|20)\d{2}$/, {
    message: "Formato de fecha inválido. Usa dd/mm/yyyy."
  })
  .refine((val) => {
    const [day, month, year] = val.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;
  }, {
    message: "Esa fecha no existe"
  });

export const getBaseSchema = () => {
  const DecimalPesos = createDecimal50SchemaPesos();
  const DecimalHoras = createDecimal50SchemaHoras();

  return z.object({
    nombre: z.string().optional(),
    cell: z.string().optional(),
    fechaEmbarque: z.any().optional(), // Flexible for UI
    horaEmbarque: z.string().optional(),
    destino: z.string().optional(),
    puntoEncuentro: z.string().optional(),
    pasajeros: z.number().int().optional(),
    detallesNotas: z.string().optional(),
    horaLlegado: z.string().optional(),
    combustible: DecimalPesos.optional(),
    hielo: DecimalPesos.optional(),
    aguaBebidas: DecimalPesos.optional(),
    gastoVarios: DecimalPesos.optional(),
    horasExtras: DecimalHoras.optional(),
    pagoRecibo: DecimalPesos.optional(),
    efectivo: z.boolean().default(false),
    transferir: z.boolean().default(false),
    pagarAlEmbarque: DecimalPesos.optional(),
    debidoABayside: DecimalPesos.optional(),
    pagoCapitana: DecimalPesos.optional(),
    pagoMarinero: DecimalPesos.optional(),
    precioAcordado: DecimalPesos.optional(),
    horasAcordadas: DecimalHoras.optional(),
    tarifaHora: DecimalPesos.optional(),
    cargoExtra: DecimalPesos.optional(),
    totalClienteCost: DecimalPesos.optional(),
    deposito: DecimalPesos.optional(),
    saldoCliente: DecimalPesos.optional(),
    paymentMethod: z.enum(["efectivo", "transferir"]).optional().nullable(),
    horasExtrasEfectivo: z.boolean().default(false),
    horasExtrasTransferir: z.boolean().default(false),
    pagoHorasExtra: DecimalPesos.optional(),
  });
};

export const getAdminSchema = () => {
  const base = getBaseSchema();
  const DecimalPesos = createDecimal50SchemaPesos();
  const DecimalHoras = createDecimal50SchemaHoras();

  return base.extend({
    nombre: z.string().min(1, "Nombre requerido"),
    cell: z.string().min(1, "Celular requerido"),
    fechaEmbarque: z.any().refine(val => !!val, "Fecha requerida"),
    horaEmbarque: Time24HourSchema,
    destino: z.string().min(1, "Destino requerido"),
    puntoEncuentro: z.string().min(1, "Punto de encuentro requerido"),
    pasajeros: z.number().int().min(1, "Minimo 1").max(6, "Maximo 6"),
    horasAcordadas: DecimalHoras,
    tarifaHora: DecimalPesos,
    deposito: DecimalPesos,
    pagoCapitana: DecimalPesos,
    pagoMarinero: DecimalPesos,
    horasExtras: DecimalHoras.optional(),
  });
};

export const getCaptainSchema = () => {
  const base = getBaseSchema();
  return base.superRefine((data, ctx) => {
    const saldo = Number(data.saldoCliente) || 0;
    if (saldo > 0) {
      if (!data.efectivo && !data.transferir) {
        ctx.addIssue({
          code: 'custom',
          message: "Elige un método de pago para el saldo",
          path: ["efectivo"],
        });
      }
      if (!data.pagoRecibo || Number(data.pagoRecibo) <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: "El monto del recibo es requerido si hay saldo",
          path: ["pagoRecibo"],
        });
      }
    }

    const extras = Number(data.horasExtras) || 0;
    if (extras > 0) {
      if (!data.horasExtrasEfectivo && !data.horasExtrasTransferir) {
        ctx.addIssue({
          code: 'custom',
          message: "Elige un método de pago para horas extras",
          path: ["horasExtrasEfectivo"],
        });
      }
      if (!data.pagoHorasExtra || Number(data.pagoHorasExtra) <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: "El monto de horas extras es requerido",
          path: ["pagoHorasExtra"],
        });
      }
    }
  });
};
