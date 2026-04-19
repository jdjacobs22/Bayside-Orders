"use client";

import React from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import { Anchor } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ReceiptField } from "@/components/WorkOrderForm/ReceiptField";

interface CaptainSectionProps {
  control: Control<any>;
  canEdit: (fieldName: string) => boolean;
  isCaptain: boolean;
  mode: string | undefined;
  getReceiptsByGasto: (gastoType: string) => any[];
  uploading: boolean;
  handleFileSelect: (
    e: React.ChangeEvent<HTMLInputElement>,
    gastoType: string
  ) => void;
  handlePhotoClick: (url: string) => void;
  setValue: UseFormSetValue<any>;
}

export function CaptainSection({
  control,
  canEdit,
  isCaptain,
  mode,
  getReceiptsByGasto,
  uploading,
  handleFileSelect,
  handlePhotoClick,
  setValue,
}: CaptainSectionProps) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg space-y-4 border">
      <h3 className="font-bold flex items-center gap-2">
        <Anchor className="h-4 w-4" /> Reporte de Capitana
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

        {/* Pagar al Embarque Section */}
        <div className="col-span-2 md:col-span-5 border rounded-md p-4 space-y-4 mb-4">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Pagar al Embarque
          </label>

          <div className="flex flex-col md:flex-row gap-6">

            {/* Left: Payment Type (Checkboxes) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pago Tipo
              </span>
              <div className="flex flex-col gap-3">
                <FormField
                  control={control}
                  name="efectivo"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={field.value}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            field.onChange(checked);
                            if (checked) {
                              setValue("transferir", false);
                            }
                          }}
                          disabled={!canEdit("efectivo")}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Efectivo
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="transferir"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={field.value}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            field.onChange(checked);
                            if (checked) {
                              setValue("efectivo", false);
                            }
                          }}
                          disabled={!canEdit("transferir")}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Transferir
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Right: Payment Receipt (Amount Input) */}
            <div className="flex-1 w-full relative">
              <FormField
                control={control}
                name="pagoRecibo"
                render={({ field }) => (
                  <ReceiptField
                    label="Pago Recibo"
                    field={field}
                    gastoType="pagoRecibo"
                    receipts={getReceiptsByGasto("pagoRecibo")}
                    disabled={!canEdit("pagoRecibo")}
                    showCamera={mode === "admin-edit" || mode === "captain-edit"}
                    uploading={uploading}
                    onFileSelect={handleFileSelect}
                    onPhotoClick={handlePhotoClick}
                    placeholder="Monto"
                    floor
                    formItemClassName="w-full"
                    inputClassName={`w-24 ${!canEdit("pagoRecibo") ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""} ${isCaptain ? "opacity-75" : ""}`}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <FormField
          control={control}
          name="horaLlegado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hora de Llegado</FormLabel>
              <FormControl>
                <Input
                  type="time"
                  step="1800"
                  {...field}
                  value={(field.value as any) ?? ""}
                  disabled={!canEdit("horaLlegado")}
                  className={!canEdit("horaLlegado") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="combustible"
          render={({ field }) => (
            <ReceiptField
              label="Combustible"
              field={field}
              gastoType="combustible"
              receipts={getReceiptsByGasto("combustible")}
              disabled={!canEdit("combustible")}
              showCamera={isCaptain}
              uploading={uploading}
              onFileSelect={handleFileSelect}
              onPhotoClick={handlePhotoClick}
            />
          )}
        />
        <FormField
          control={control}
          name="hielo"
          render={({ field }) => (
            <ReceiptField
              label="Hielo"
              field={field}
              gastoType="hielo"
              receipts={getReceiptsByGasto("hielo")}
              disabled={!canEdit("hielo")}
              showCamera={isCaptain}
              uploading={uploading}
              onFileSelect={handleFileSelect}
              onPhotoClick={handlePhotoClick}
            />
          )}
        />
        <FormField
          control={control}
          name="aguaBebidas"
          render={({ field }) => (
            <ReceiptField
              label="Bebidas"
              field={field}
              gastoType="aguaBebidas"
              receipts={getReceiptsByGasto("aguaBebidas")}
              disabled={!canEdit("aguaBebidas")}
              showCamera={isCaptain}
              uploading={uploading}
              onFileSelect={handleFileSelect}
              onPhotoClick={handlePhotoClick}
            />
          )}
        />
        <FormField
          control={control}
          name="gastoVarios"
          render={({ field }) => (
            <ReceiptField
              label="Varios"
              field={field}
              gastoType="gastoVarios"
              receipts={getReceiptsByGasto("gastoVarios")}
              disabled={!canEdit("gastoVarios")}
              showCamera={isCaptain}
              uploading={uploading}
              onFileSelect={handleFileSelect}
              onPhotoClick={handlePhotoClick}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Horas Extras Field */}
        <FormField
          control={control}
          name="horasExtras"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horas Extras</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  {...field}
                  value={
                    Number(field.value) === 0
                      ? ""
                      : (field.value?.toString() ?? "")
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
                  disabled={!canEdit("horasExtras")}
                  className={!canEdit("horasExtras") ? "bg-gray-200" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Pago Horas Extras Section */}
        <div className="col-span-2 md:col-span-5 border rounded-md p-4 space-y-4 mb-4">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Pago Horas Extras
          </label>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Payment Type (Checkboxes) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pago Tipo
              </span>
              <div className="flex flex-col gap-3">
                <FormField
                  control={control}
                  name="horasExtrasEfectivo"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={field.value}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            field.onChange(checked);
                            if (checked) {
                              setValue("horasExtrasTransferir", false);
                            }
                          }}
                          disabled={!canEdit("horasExtrasEfectivo")}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Efectivo
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="horasExtrasTransferir"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={field.value}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            field.onChange(checked);
                            if (checked) {
                              setValue("horasExtrasEfectivo", false);
                            }
                          }}
                          disabled={!canEdit("horasExtrasTransferir")}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Transferir
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Right: Payment Receipt (Amount Input) */}
            <div className="flex-1 w-full relative">
              <FormField
                control={control}
                name="pagoHorasExtra"
                render={({ field }) => (
                  <ReceiptField
                    label="Pago Recibo"
                    field={field}
                    gastoType="pagoHorasExtra"
                    receipts={getReceiptsByGasto("pagoHorasExtra")}
                    disabled={!canEdit("pagoHorasExtra")}
                    showCamera={mode === "admin-edit" || mode === "captain-edit"}
                    uploading={uploading}
                    onFileSelect={handleFileSelect}
                    onPhotoClick={handlePhotoClick}
                    placeholder="Monto"
                    floor
                    formItemClassName="w-full"
                    inputClassName={`w-24 ${!canEdit("pagoHorasExtra") ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""} ${isCaptain ? "opacity-75" : ""}`}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <FormField
        control={control}
        name="detallesNotas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notas</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                disabled={!canEdit("detallesNotas")}
                className={!canEdit("detallesNotas") ? "bg-gray-200" : ""}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
