"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Ship,
  User,
  DollarSign,
  Anchor,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 1. STYLED SCHEMA: Strict types for Linter compliance
const formSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  cell: z.string().min(1, "Celular requerido"),
  fechaEmbarque: z.date().optional(),
  horaEmbarque: z.string(),
  destino: z.string().min(1),
  puntoEncuentro: z.string().min(1),
  pasajeros: z.number(),
  detallesNotas: z.string().optional(),
  horaLlagado: z.string().optional(),
  combustible: z.number(),
  hielo: z.number(),
  aguaBebidas: z.number(),
  gastoVarios: z.number(),
  pagoRecibo: z.boolean(),
  pagarAlEmbarque: z.number(),
  debidoABayside: z.number(),
  pagoCapitana: z.number(),
  pagoMarinero: z.number(),
  precioAcordado: z.number(),
  horasAcordadas: z.number(),
  tarifaHora: z.number(),
  cargoExtra: z.number(),
  costoTotal: z.number(),
  deposito: z.number(),
  saldoCliente: z.number(),
});

type FormValues = z.infer<typeof formSchema>;
export default function MockPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      cell: "",
      fechaEmbarque: undefined,
      horaEmbarque: "10:00",
      destino: "",
      puntoEncuentro: "",
      pasajeros: 0,
      detallesNotas: "",
      horaLlagado: "",
      combustible: 0,
      hielo: 0,
      aguaBebidas: 0,
      gastoVarios: 0,
      pagoRecibo: false,
      pagarAlEmbarque: 0,
      debidoABayside: 0,
      pagoCapitana: 0,
      pagoMarinero: 0,
      precioAcordado: 0,
      horasAcordadas: 0,
      tarifaHora: 0,
      cargoExtra: 0,
      costoTotal: 0,
      deposito: 0,
      saldoCliente: 0,
    },
  });

  const { watch, setValue } = form;
  const precio = watch("precioAcordado");
  const extra = watch("cargoExtra");
  const deposito = watch("deposito");
  const pagoRecibo = watch("pagoRecibo");
  const horaEmbarque = watch("horaEmbarque");
  const horaLlagado = watch("horaLlagado");
  const tarifaHora = watch("tarifaHora");
  const horasAcordadas = watch("horasAcordadas");
  const combustible = watch("combustible");
  const hielo = watch("hielo");
  const aguaBebidas = watch("aguaBebidas");
  const gastoVarios = watch("gastoVarios");
  const pagoCapitana = watch("pagoCapitana");
  const pagoMarinero = watch("pagoMarinero");

  // Helper function to convert time string (HH:MM) to hours (decimal)
  const timeStringToHours = (timeStr: string | undefined): number => {
    if (!timeStr || !timeStr.includes(":")) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + (minutes || 0) / 60;
  };

  // Calculate cargoExtra based on time difference
  useEffect(() => {
    const horaEmbarqueHours = timeStringToHours(horaEmbarque);
    const horaLlagadoHours = timeStringToHours(horaLlagado);
    const horasAcordadasNum = Number(horasAcordadas) || 0;

    if (
      horaEmbarqueHours > 0 &&
      horaLlagadoHours > 0 &&
      horasAcordadasNum > 0
    ) {
      // Calculate expected end time: Hora de Embarque + Duración Acordada
      const expectedEndTime = horaEmbarqueHours + horasAcordadasNum;

      // Calculate extra time: Hora de Llegado - expected end time
      const extraHours = horaLlagadoHours - expectedEndTime;

      // Only charge extra if they went over the expected time
      if (extraHours > 0) {
        const cargoExtra = extraHours * (Number(tarifaHora) || 0);
        setValue("cargoExtra", cargoExtra);
      } else {
        setValue("cargoExtra", 0);
      }
    } else {
      setValue("cargoExtra", 0);
    }
  }, [horaEmbarque, horaLlagado, tarifaHora, horasAcordadas, setValue]);

  useEffect(() => {
    const total = (Number(precio) || 0) + (Number(extra) || 0);
    const saldo = total - (Number(deposito) || 0);
    setValue("costoTotal", total);
    setValue("saldoCliente", saldo);
  }, [precio, extra, deposito, setValue]);

  useEffect(() => {
    if (pagoRecibo) {
      setValue("pagarAlEmbarque", 0);
    } else {
      const pagarAlEmbarque = (Number(precio) || 0) - (Number(deposito) || 0);
      setValue("pagarAlEmbarque", Math.max(0, pagarAlEmbarque));
    }
  }, [precio, deposito, pagoRecibo, setValue]);

  // Calculate Debido a Bayside
  useEffect(() => {
    const ingresos = (Number(deposito) || 0) + (Number(extra) || 0);
    const gastos =
      (Number(combustible) || 0) +
      (Number(hielo) || 0) +
      (Number(aguaBebidas) || 0) +
      (Number(gastoVarios) || 0) +
      (Number(pagoCapitana) || 0) +
      (Number(pagoMarinero) || 0);
    const debidoABayside = ingresos - gastos;
    setValue("debidoABayside", debidoABayside);
  }, [
    deposito,
    extra,
    combustible,
    hielo,
    aguaBebidas,
    gastoVarios,
    pagoCapitana,
    pagoMarinero,
    setValue,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <Card className="max-w-5xl mx-auto shadow-xl border-none">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Ship className="h-6 w-6" /> Nueva Orden de Embarque
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => console.log(data))}
              className="space-y-8"
            >
              {/* CLIENTE INFO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cell</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pasajeros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. de Pasajeros</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value === 0 ? "" : (field.value ?? "")}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === ""
                                ? 0
                                : isNaN(e.target.valueAsNumber)
                                  ? 0
                                  : e.target.valueAsNumber
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="destino"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="puntoEncuentro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Punto de Encuentro</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
                <FormField
                  control={form.control}
                  name="fechaEmbarque"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Embarque</FormLabel>
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
                                format(field.value, "PPP")
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
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="horaEmbarque"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Embarque</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          step="1800"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* CAPITANA */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-4 border">
                <h3 className="font-bold flex items-center gap-2">
                  <Anchor className="h-4 w-4" /> Reporte de Capitana
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name="horaLlagado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Llegado</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            step="1800"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="combustible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Combustible</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hielo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hielo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aguaBebidas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bebidas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gastoVarios"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Varios</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name="pagoRecibo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Pago Recibo
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pagarAlEmbarque"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pagar al Embarque</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            readOnly
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            className="bg-gray-100 cursor-not-allowed"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="debidoABayside"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="font-bold text-lg text-green-700">
                          Debido a Bayside
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            readOnly
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            className="bg-green-50 border-2 border-green-300 font-bold text-lg text-green-800 cursor-not-allowed"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ADMIN */}
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-blue-700">
                  <DollarSign className="h-4 w-4" /> Administración
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="pagoCapitana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pago Capitana</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pagoMarinero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pago Marinero</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tarifaHora"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarifa por Hora</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="horasAcordadas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración Acordada</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-blue-100">
                  <FormField
                    control={form.control}
                    name="precioAcordado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Acordado</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cargoExtra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo Extra</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            readOnly
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            className="bg-gray-100 cursor-not-allowed"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deposito"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposito</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ""
                                  ? 0
                                  : isNaN(e.target.valueAsNumber)
                                    ? 0
                                    : e.target.valueAsNumber
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="costoTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-blue-800">
                          Costo Total
                        </FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            className="bg-blue-100 font-bold"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saldoCliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-red-700">
                          Saldo Cliente
                        </FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            className="bg-red-50 font-bold text-red-700"
                            {...field}
                            value={field.value === 0 ? "" : (field.value ?? "")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="detallesNotas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
              >
                Guardar Orden de Trabajo
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
