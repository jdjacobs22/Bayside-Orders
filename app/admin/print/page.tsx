/**
 * app/admin/print/page.tsx
 * 
 * A specialized landing page for generating and sending a "Nota de Pago" (Payment Receipt) email.
 * This form is separate from the main Work Order workflow and is used for manual payment recording.
 */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Send } from "lucide-react";
import Image from "next/image";
import AdminHeader from "@/components/AdminHeader";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { sendReceiptEmail } from "@/app/actions/email";
import { toast } from "sonner"; // Assuming sonner is used, if not I'll check

// 1. Define the Zod Schema based on the PDF fields
const formSchema = z.object({
  folio: z.string().min(1, { message: "El folio es requerido." }), // [cite: 1]
  fecha: z.string().min(1, { message: "La fecha es requerida." }), // [cite: 6]
  cliente: z
    .string()
    .min(2, { message: "El nombre del cliente es requerido." }), // [cite: 2]
  email: z.string().email({ message: "Ingrese un correo válido." }),
  concepto: z
    .string()
    .min(5, { message: "Describa el concepto del servicio." }),
  total: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === undefined ? 0 : Math.floor(Number(v))))
    .pipe(z.number().min(0, { message: "Ingrese un monto válido." })),
  deposito: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === undefined ? 0 : Math.floor(Number(v))))
    .pipe(z.number().min(0, { message: "Ingrese un monto válido." })),
  balanceDueDate: z.date().optional(),
  formaPago: z.enum(["Efectivo", "Transferencia"], {
    message: "Seleccione una forma de pago.",
  }),
  recibio: z
    .string()
    .min(2, { message: "Nombre de quien recibe es requerido." }), // [cite: 8]
});

type FormValues = z.output<typeof formSchema>;

/**
 * BaysidePaymentForm Component
 * 
 * Renders a stylized form matching the company's physical payment notes.
 * Features:
 * - Local validation via Zod.
 * - Integration with sendReceiptEmail server action.
 * - Visual branding with the company logo.
 */
export default function BaysidePaymentForm() {
  const router = useRouter();
  // 2. Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      folio: "",
      fecha: new Date().toISOString().split("T")[0],
      cliente: "",
      email: "",
      concepto: "",
      total: 0,
      deposito: 0,
      balanceDueDate: undefined,
      formaPago: "Efectivo",
      recibio: "",
    },
  });

  const total = useWatch({ control: form.control, name: "total" });
  const deposito = useWatch({ control: form.control, name: "deposito" });
  const balance = (Number(total) || 0) - (Number(deposito) || 0);

  // 3. Handle Form Submission (Generate Email)
  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        folio: values.folio,
        fecha: values.fecha,
        cliente: values.cliente,
        concepto: values.concepto,
        email: values.email,
        total: Number(values.total) || 0,
        deposito: Number(values.deposito) || 0,
        balance: (Number(values.total) || 0) - (Number(values.deposito) || 0),
        balanceDueDate: values.balanceDueDate
          ? format(values.balanceDueDate, "yyyy-MM-dd")
          : undefined,
        formaPago: values.formaPago,
        recibio: values.recibio,
      };
      const result = await sendReceiptEmail(payload);

      if (result.success) {
        toast.success("Correo enviado exitosamente.");
        router.push("/admin");
      } else {
        toast.error("Error al enviar el correo: " + result.error);
      }
    } catch (error) {
      toast.error("Error inesperado al enviar el correo.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminHeader title="Nota de Pago" />
      <div className="flex-1 p-4 flex items-center justify-center py-12">
        <Card className="w-full max-w-lg shadow-lg">

          <CardHeader className="text-center border-b bg-white rounded-t-lg pb-6">
            <div className="mx-auto w-fit mb-2">
              <Image
                src="/Bayside_PV_Logo.jpg"
                alt="Bayside PV Logo"
                width={160}
                height={120}
                priority
                className="object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-900">
              BAYSIDE PV
            </CardTitle>
            <CardDescription className="text-blue-700 font-semibold tracking-wide">
              WATER TAXI & TOURS
            </CardDescription>
            <div className="mt-2 text-sm text-slate-500 font-mono">
              NOTA DE PAGO
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Row 1: Folio & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="folio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Folio</FormLabel>
                        <FormControl>
                          <Input placeholder="001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Client */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="correo@cliente.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 3: Service Concept */}
                <FormField
                  control={form.control}
                  name="concepto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concepto del servicio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del tour o servicio..."
                          className="resize-none min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 4: Financials */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-md border">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase text-slate-500">
                            Total
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-500">
                                $
                              </span>
                              <Input
                                type="number"
                                step={1}
                                min={0}
                                inputMode="numeric"
                                className="pl-7"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? 0
                                      : Math.floor(Number(e.target.value)) || 0
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deposito"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase text-slate-500">
                            Depósito
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-500">
                                $
                              </span>
                              <Input
                                type="number"
                                step={1}
                                min={0}
                                inputMode="numeric"
                                className="pl-7"
                                placeholder="0"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? 0
                                      : Math.floor(Number(e.target.value)) || 0
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-slate-500 leading-none">
                      Saldo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500">
                        $
                      </span>
                      <Input
                        readOnly
                        className="pl-7 bg-slate-100"
                        value={balance}
                      />
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="balanceDueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs uppercase text-slate-500">
                          Fecha de vencimiento del saldo
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "d MMM yyyy", {
                                    locale: es,
                                  })
                                ) : (
                                  <span>Seleccione fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 5: Payment Method */}
                <FormField
                  control={form.control}
                  name="formaPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Efectivo">Efectivo</SelectItem>
                          <SelectItem value="Transferencia">
                            Transferencia
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 6: Receiver / Signature */}
                <FormField
                  control={form.control}
                  name="recibio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recibió (Nombre y Firma)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del staff" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Generar Correo
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center pb-6 text-xs text-slate-400">
            Nota de Pago Digital • Bayside PV
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
