"use client";

import React from "react";
import { Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ReceiptFieldProps {
  label: string;
  field: any;
  gastoType: string;
  receipts: any[];
  disabled: boolean;
  showCamera: boolean;
  uploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, gastoType: string) => void;
  onPhotoClick: (url: string) => void;
  /** Extra className applied to the Input element. Defaults to flex-1 with disabled shading. */
  inputClassName?: string;
  /** Apply Math.floor to onChange values (used for payment fields). */
  floor?: boolean;
  placeholder?: string;
  /** Extra className applied to the FormItem wrapper. */
  formItemClassName?: string;
}

export function ReceiptField({
  label,
  field,
  gastoType,
  receipts,
  disabled,
  showCamera,
  uploading,
  onFileSelect,
  onPhotoClick,
  inputClassName,
  floor = false,
  placeholder,
  formItemClassName,
}: ReceiptFieldProps) {
  const resolvedInputClassName =
    inputClassName ?? `flex-1 ${disabled ? "bg-gray-200" : ""}`;

  return (
    <FormItem className={formItemClassName}>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={placeholder}
            {...field}
            value={Number(field.value) === 0 ? "" : (field.value?.toString() ?? "")}
            onChange={(e) => {
              const val = e.target.value;
              const num = e.target.valueAsNumber;
              field.onChange(
                val === "" ? 0 : isNaN(num) ? 0 : floor ? Math.floor(num) : num
              );
            }}
            disabled={disabled}
            className={resolvedInputClassName}
          />
          {showCamera && (
            <label className="cursor-pointer">
              <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFileSelect(e, gastoType);
                }}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </FormControl>
      {receipts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {receipts.map((r: any, i: number) => (
            <button
              key={i}
              type="button"
              onClick={() => onPhotoClick(r.url)}
              className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
            >
              <img src={r.url} alt="Receipt" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <FormMessage />
    </FormItem>
  );
}
