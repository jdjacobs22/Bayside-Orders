"use client";

import React from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminSectionProps {
  control: Control<any>;
  canEdit: (fieldName: string) => boolean;
  nombreCliente: string;
  nombresList: string[];
  apellidosList: string[];
  setValue: UseFormSetValue<any>;
  setDiscoveredCaptainId: (id: string | null) => void;
}

export function AdminSection({
  control,
  canEdit,
  nombreCliente,
  nombresList,
  apellidosList,
  setValue,
  setDiscoveredCaptainId,
}: AdminSectionProps) {
  return (
    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
      <h3 className="font-bold flex items-center gap-2 text-blue-700">
        <DollarSign className="h-4 w-4" /> Administración
      </h3>

      {/* CLIENTE INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6">
        <FormField
          control={control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Capitana</FormLabel>
              <Select
                disabled={!canEdit("nombre")}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("apellido", "");
                  setValue("email", "");
                  setValue("cell", "");
                  setDiscoveredCaptainId(null);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccione nombre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nombresList.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="apellido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido del Capitana</FormLabel>
              <Select
                disabled={!canEdit("apellido") || !nombreCliente}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue
                      placeholder={
                        nombreCliente
                          ? "Seleccione apellido"
                          : "Primero elija nombre"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {apellidosList.map((ap) => (
                    <SelectItem key={ap} value={ap}>
                      {ap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo de Capitana</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  value={field.value ?? ""}
                  readOnly
                  disabled={!canEdit("email")}
                  className="bg-gray-100 italic"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* ASIGNACIÓN Y PASAJEROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name="cell"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Celular de Capitana</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  readOnly
                  disabled={!canEdit("cell")}
                  className="bg-gray-100 italic"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* INFO DE CLIENTE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6">
        <FormField
          control={control}
          name="cliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  disabled={!canEdit("cliente")}
                  className={!canEdit("cliente") ? "bg-gray-200" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="clienteCell"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Celular de Cliente</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  disabled={!canEdit("clienteCell")}
                  className={!canEdit("clienteCell") ? "bg-gray-200" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="clienteEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo de Cliente</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  value={field.value ?? ""}
                  disabled={!canEdit("clienteEmail")}
                  className={!canEdit("clienteEmail") ? "bg-gray-200" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
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
                  disabled={!canEdit("pasajeros")}
                  className={!canEdit("pasajeros") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="destino"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destino</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  disabled={!canEdit("destino")}
                  className={!canEdit("destino") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="puntoEncuentro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto de Encuentro</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  disabled={!canEdit("puntoEncuentro")}
                  className={!canEdit("puntoEncuentro") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
        <FormField
          control={control}
          name="fechaEmbarque"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de Embarque</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      disabled={!canEdit("fechaEmbarque")}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                        !canEdit("fechaEmbarque") && "bg-gray-200"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "MMMM d, yyyy", {
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
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    disabled={!canEdit("fechaEmbarque")}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField
          control={control}
          name="pagoCapitana"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pago Capitana</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={
                    field.value && Number(field.value) === 0
                      ? ""
                      : (field.value as any)?.toString() ?? ""
                  }
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
                  disabled={!canEdit("pagoCapitana")}
                  className={!canEdit("pagoCapitana") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="pagoMarinero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pago Marinero</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={
                    field.value && Number(field.value) === 0
                      ? ""
                      : (field.value as any)?.toString() ?? ""
                  }
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
                  disabled={!canEdit("pagoMarinero")}
                  className={!canEdit("pagoMarinero") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
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
                  disabled={!canEdit("horaEmbarque")}
                  className={!canEdit("horaEmbarque") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="tarifaHora"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarifa por Hora</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={
                    field.value && Number(field.value) === 0
                      ? ""
                      : (field.value as any)?.toString() ?? ""
                  }
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
                  disabled={!canEdit("tarifaHora")}
                  className={!canEdit("tarifaHora") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="horasAcordadas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración Acordada</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={
                    field.value && Number(field.value) === 0
                      ? ""
                      : (field.value as any)?.toString() ?? ""
                  }
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
                  disabled={!canEdit("horasAcordadas")}
                  className={!canEdit("horasAcordadas") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-blue-100">
        <FormField
          control={control}
          name="precioAcordado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio Acordado</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={Number(field.value) === 0 ? "" : String(field.value)}
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
                  disabled={!canEdit("precioAcordado")}
                  className={!canEdit("precioAcordado") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="cargoExtra"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo Extra</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  readOnly
                  value={String(field.value || 0)}
                  className="bg-gray-100 cursor-not-allowed"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="totalClienteCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold underline decoration-blue-400 decoration-2 underline-offset-4">
                Costo Total
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  readOnly
                  {...field}
                  value={String(field.value || 0)}
                  className="bg-gray-200 font-bold"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="deposito"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1 text-blue-800">
                <DollarSign className="h-3 w-3" /> Depósito
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={Number(field.value) === 0 ? "" : String(field.value)}
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
                  disabled={!canEdit("deposito")}
                  className={!canEdit("deposito") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
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
                  value={String(field.value || 0)}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="ingresoNeto"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-green-700">
                Ingreso Neto
              </FormLabel>
              <FormControl>
                <Input
                  readOnly
                  className="bg-green-50 font-bold text-green-700"
                  {...field}
                  value={String(field.value || 0)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
