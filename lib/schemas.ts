/**
 * schemas.ts
 * 
 * Zod validation schemas used throughout the application.
 * Defines the validation rules for Work Orders, role-based editing restrictions,
 * and data types for financial and temporal values.
 */
import { z } from "zod";

// Helper to handle both incoming Prisma.Decimal objects and UI string/number inputs
const toNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "object" && val && "toString" in val) return val.toString();
  return val;
}, z.coerce.number());

/**
 * Schema factory for decimal values representing MXN Pesos.
 * Uses z.preprocess to convert Prisma Decimal objects or strings to numbers.
 */
export const createDecimal50SchemaPesos = () => toNumber;

/**
 * Schema factory for decimal values representing count of hours.
 * Uses z.preprocess to convert Prisma Decimal objects or strings to numbers.
 */
export const createDecimal50SchemaHoras = () => toNumber;

/**
 * Zod schema for validating 24-hour time format (HH:mm).
 * Example: "14:30"
 */
export const Time24HourSchema = z.string().regex(
  /^([01]\d|2[0-3]):([0-5]\d)$/,
  { message: "Formato de hora inválido. Usa HH:mm (00:00 a 23:59)." }
);

/**
 * Zod schema for validating dates in DD/MM/YYYY format.
 * Includes refinement to ensure the date is logically valid (e.g., prevents Feb 30th).
 */
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

/**
 * Generates the base Zod schema for a Work Order.
 * Every field is optional here, serving as the foundation for more strict role-based schemas.
 * 
 * @returns A ZodObject schema.
 */
export const getBaseSchema = () => {
  const DecimalPesos = createDecimal50SchemaPesos();
  const DecimalHoras = createDecimal50SchemaHoras();

  return z.object({
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    email: z.string().optional(),
    cell: z.string().optional(),
    cliente: z.string().optional(),
    clienteCell: z.string().optional(),
    clienteEmail: z.string().optional(),
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
    ingresoNeto: DecimalPesos.optional(),
    paymentMethod: z.enum(["efectivo", "transferir"]).optional().nullable(),
    horasExtrasEfectivo: z.boolean().default(false),
    horasExtrasTransferir: z.boolean().default(false),
    pagoHorasExtra: DecimalPesos.optional(),
    captainId: z.string().optional(),
    captainName: z.string().optional(), // For UI convenience
  });
};

/**
 * Generates the Admin validation schema for a Work Order.
 * Enforces strict requirements for fields that an Admin must fill out when creating or editing.
 * 
 * @returns An extended ZodObject schema with mandatory fields.
 */
export const getAdminSchema = () => {
  const base = getBaseSchema();
  const DecimalPesos = createDecimal50SchemaPesos();
  const DecimalHoras = createDecimal50SchemaHoras();

  return base.extend({
    nombre: z.string().min(1, "Nombre requerido"),
    apellido: z.string().min(1, "Apellido requerido"),
    email: z.string().email("Email inválido").min(1, "Email requerido"),
    cell: z.string().min(1, "Celular requerido"),
    cliente: z.string().min(1, "Cliente es requerido"),
    clienteCell: z.string().min(1, "Celular de Cliente es requerido"),
    clienteEmail: z.string().email("Correo de Cliente inválido").min(1, "Correo de Cliente es requerido"),
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

/**
 * Generates the Captain validation schema for a Work Order.
 * Focused on post-flight reporting.
 * Includes complex refinements to ensure that if a balance or extra hours are reported,
 * a corresponding payment method and amount are also provided.
 * 
 * @returns A refined Zod schema.
 */
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
