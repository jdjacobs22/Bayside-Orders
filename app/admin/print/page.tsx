"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as z from "zod";
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
    .min(5, { message: "Describa el concepto del servicio." }), //
  balance: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === undefined ? 0 : Number(v)))
    .pipe(z.number().min(0, { error: "Ingrese un monto válido." })),
  pagoFinal: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === undefined ? 0 : Number(v)))
    .pipe(z.number().min(0, { error: "Ingrese un monto válido." })),
  formaPago: z.enum(["Efectivo", "Transferencia", "Tarjeta"], {
    error: "Seleccione una forma de pago.",
  }), //
  recibio: z
    .string()
    .min(2, { message: "Nombre de quien recibe es requerido." }), // [cite: 8]
});

type FormValues = z.output<typeof formSchema>;

export default function BaysidePaymentForm() {
  const router = useRouter();
  // 2. Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      folio: "",
      fecha: new Date().toISOString().split("T")[0], // Default to today
      cliente: "",
      email: "",
      concepto: "",
      balance: 0,
      pagoFinal: 0,
      formaPago: "Efectivo",
      recibio: "",
    },
  });

  // 3. Handle Form Submission (Generate Email)
  async function onSubmit(values: FormValues) {
    try {
      const result = await sendReceiptEmail(values);

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
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border">
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-slate-500">
                          Balance (MXN)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500">
                              $
                            </span>
                            <Input
                              type="number"
                              className="pl-7"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pagoFinal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-slate-500">
                          Pago Final (MXN)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500">
                              $
                            </span>
                            <Input
                              type="number"
                              className="pl-7"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                            />
                          </div>
                        </FormControl>
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
                          <SelectItem value="Tarjeta">Tarjeta</SelectItem>
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
