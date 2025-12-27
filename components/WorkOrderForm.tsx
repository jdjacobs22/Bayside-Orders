"use client";

import React, { useEffect, useState } from "react";
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
  Camera,
} from "lucide-react";
import {
  uploadReceipt,
  getWorkOrder,
  updateWorkOrder,
  createWorkOrder,
} from "@/app/actions/work-order";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

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

interface WorkOrderFormProps {
  mode?: "admin-create" | "admin-edit" | "captain-edit";
  orderId?: number;
}

export default function WorkOrderForm({
  mode = "admin-create",
  orderId: propOrderId,
}: WorkOrderFormProps) {
  const router = useRouter();
  // Initialize orderId immediately if propOrderId is provided
  const [orderId, setOrderId] = useState<number | null>(propOrderId || null);

  // Update orderId if propOrderId changes
  useEffect(() => {
    if (propOrderId && propOrderId !== orderId) {
      setOrderId(propOrderId);
    }
  }, [propOrderId]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  // Field Access Logic
  const isCaptain = mode === "captain-edit";
  // Captain can ONLY edit: Details/Notas, Combustible, Hielo, Agua/Bebidas, Gasto Varios, Hora de Llegado
  // Admin can edit ALL.
  const canEdit = (fieldName: string) => {
    if (!isCaptain) return true; // Admin creates/edits all
    const allowed = [
      "detallesNotas",
      "combustible",
      "hielo",
      "aguaBebidas",
      "gastoVarios",
      "horaLlagado",
      "pagoRecibo",
    ];
    return allowed.includes(fieldName);
  };

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

  // Load data for edit modes
  useEffect(() => {
    if (orderId && (mode === "admin-edit" || mode === "captain-edit")) {
      setLoading(true);
      getWorkOrder(orderId)
        .then((res) => {
          if (res.success && res.data) {
            const data = res.data;
            form.reset({
              nombre: data.nombre || "",
              cell: data.cell || "",
              fechaEmbarque: data.fecha ? new Date(data.fecha) : undefined,
              horaEmbarque: data.horaSalida || "10:00",
              destino: data.destino || "",
              puntoEncuentro: data.puntoEncuentro || "",
              pasajeros: data.pasajeros || 0,
              detallesNotas: data.detallesNotas || "",
              horaLlagado: data.horaLlagado || "",
              combustible: data.combustible || 0,
              hielo: data.hielo || 0,
              aguaBebidas: data.aguaBebidas || 0,
              gastoVarios: data.gastoVarios || 0,
              pagoRecibo: data.pagoRecibo || false,
              pagarAlEmbarque: data.pagarAlEmbarque || 0,
              debidoABayside: data.debidoABayside || 0,
              pagoCapitana: data.pagoCapitana || 0,
              pagoMarinero: data.pagoMarinero || 0,
              precioAcordado: data.precioAcordado || 0,
              horasAcordadas: data.horasAcordadas || 0,
              tarifaHora: data.tarifaHora || 0,
              cargoExtra: data.cargoExtra || 0,
              costoTotal: data.costoTotal || 0,
              deposito: data.deposito || 0,
              saldoCliente: data.saldoCliente || 0,
            });
            if (data.receipts) setReceipts(data.receipts);
          } else {
            alert("Error cargando orden: " + res.error);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error loading order:", error);
          alert("Error cargando orden: " + error.message);
          setLoading(false);
        });
    }
  }, [orderId, mode, form]);

  // Compress image function
  // Always compresses images to reduce memory usage on mobile devices
  // Target: ~1MB or less for fast mobile uploads
  // Uses aggressive compression settings and createImageBitmap for better memory efficiency
  const compressImage = async (file: File): Promise<File> => {
    // Skip compression for non-image files
    if (!file.type.startsWith("image/")) {
      return file;
    }

    try {
      // Use createImageBitmap with options to reduce memory usage
      // Specify max dimensions upfront to avoid loading full resolution
      let imageBitmap: ImageBitmap;

      try {
        // Try using createImageBitmap with resize options to reduce memory
        // This tells the browser to decode at a smaller size if possible
        const maxDim = 640;
        imageBitmap = await createImageBitmap(file, {
          resizeWidth: maxDim,
          resizeHeight: maxDim,
          resizeQuality: "medium",
        });
      } catch (err) {
        // Fallback to blob URL method if createImageBitmap fails
        console.log("createImageBitmap failed, using blob URL method");
        const blobUrl = URL.createObjectURL(file);
        const img = new Image();

        return new Promise((resolve) => {
          img.onload = () => {
            URL.revokeObjectURL(blobUrl);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const maxDimension = 1280;
            let { width, height } = img;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            img.src = "";

            canvas.toBlob(
              (blob) => {
                canvas.width = 0;
                canvas.height = 0;
                if (blob) {
                  resolve(
                    new File([blob], file.name, {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    })
                  );
                } else {
                  resolve(file);
                }
              },
              "image/jpeg",
              0.5 // Quality: 0.5 = 50%
            );
          };
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(file);
          };
          img.src = blobUrl;
        });
      }

      // Use very aggressive compression for mobile devices
      // Max 640px on longest side to minimize memory usage
      // This is small enough to work on low-memory devices
      const maxDimension = 640;
      let { width, height } = imageBitmap;

      // Always resize to reduce memory, even if smaller
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      } else {
        // Even if smaller, reduce by 25% to save memory
        width = Math.floor(width * 0.75);
        height = Math.floor(height * 0.75);
      }

      // Create canvas and draw
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(imageBitmap, 0, 0, width, height);

      // Close imageBitmap immediately to free memory
      imageBitmap.close();

      // Convert to blob
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            // Clean up canvas immediately
            canvas.width = 0;
            canvas.height = 0;

            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              console.log(
                `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${Math.round(width)}x${Math.round(height)})`
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.5 // Quality: 0.5 = 50% (very aggressive for mobile)
        );
      });
    } catch (error) {
      console.error("Compression error:", error);
      return file; // Return original on any error
    }
  };

  // Handle file selection
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    gastoType: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      console.log("File selected:", {
        gastoType,
        fileName: originalFile.name,
        size: originalFile.size,
      });

      // Reset input to allow selecting the same file again
      e.target.value = "";

      // ALWAYS compress images to avoid memory issues on mobile devices
      // Even small file sizes can have high resolution that causes memory problems
      const isImage = originalFile.type.startsWith("image/");

      if (isImage) {
        // Check file size - reject files larger than 20MB to prevent memory issues
        const maxFileSize = 20 * 1024 * 1024; // 20MB
        if (originalFile.size > maxFileSize) {
          alert(
            `El archivo es demasiado grande (${(originalFile.size / 1024 / 1024).toFixed(2)}MB). Por favor, use una imagen más pequeña.`
          );
          return;
        }

        // Detect if we're on a mobile device
        const isMobile =
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
          window.innerWidth <= 768;

        // On mobile devices, skip preview entirely to avoid memory issues
        // Compress and upload directly
        if (isMobile) {
          if (!orderId) {
            alert("Error: No se encontró el ID de la orden.");
            return;
          }

          setCompressing(true);
          setUploading(true);

          try {
            // Brief delay to allow browser to recover from camera app on mobile
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Compress the image
            const compressedFile = await compressImage(originalFile);

            // Upload directly without creating preview URL
            const formDataUpload = new FormData();
            formDataUpload.append("file", compressedFile);
            formDataUpload.append("orderId", orderId.toString());
            formDataUpload.append("gastoType", gastoType);

            const res = await uploadReceipt(formDataUpload);

            if (res.success) {
              setReceipts((prev) => [...prev, res.data]);
              alert("Imagen subida exitosamente");
            } else {
              alert("Error al subir: " + res.error);
            }
          } catch (err: any) {
            console.error("Mobile upload error:", err);
            alert("Error: " + (err?.message || "Error al procesar la imagen"));
          } finally {
            setCompressing(false);
            setUploading(false);
          }
          return;
        }

        // If somehow we get here on desktop (shouldn't happen since only captains upload),
        // treat it the same as mobile - upload directly
        if (!orderId) {
          alert("Error: No se encontró el ID de la orden.");
          return;
        }

        setCompressing(true);
        setUploading(true);

        try {
          // Brief delay to allow browser to recover from camera app
          await new Promise((resolve) => setTimeout(resolve, 200));
          const compressedFile = await compressImage(originalFile);

          const formDataUpload = new FormData();
          formDataUpload.append("file", compressedFile);
          formDataUpload.append("orderId", orderId.toString());
          formDataUpload.append("gastoType", gastoType);

          const res = await uploadReceipt(formDataUpload);

          if (res.success) {
            setReceipts((prev) => [...prev, res.data]);
            alert("Imagen subida exitosamente");
          } else {
            alert("Error al subir: " + res.error);
          }
        } catch (err: any) {
          console.error("Upload error:", err);
          alert("Error: " + (err?.message || "Error al procesar la imagen"));
        } finally {
          setCompressing(false);
          setUploading(false);
        }
      } else {
        // Non-image files - reject them
        alert("Solo se permiten archivos de imagen");
      }
    }
  };

  // Get receipts by gasto type
  const getReceiptsByGasto = (gastoType: string) => {
    return receipts.filter((r) => r.gastoType === gastoType);
  };

  // Handle photo click for enlargement
  const handlePhotoClick = (url: string) => {
    setSelectedPhoto(url);
  };

  const closePhotoDialog = () => {
    setSelectedPhoto(null);
  };

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setLoading(true);

    try {
      // Map form data to match action expectations
      const submissionData: any = {
        nombre: data.nombre,
        cell: data.cell,
        fecha: data.fechaEmbarque
          ? data.fechaEmbarque.toISOString().split("T")[0]
          : undefined,
        horaSalida: data.horaEmbarque,
        horaLlagado: data.horaLlagado || undefined,
        destino: data.destino,
        puntoEncuentro: data.puntoEncuentro,
        pasajeros: data.pasajeros,
        detallesNotas: data.detallesNotas || undefined,
        combustibleCost: data.combustible,
        hieloCost: data.hielo,
        aguaBebidasCost: data.aguaBebidas,
        gastoVariosCost: data.gastoVarios,
        pagoRecibo: data.pagoRecibo,
        pagarAlEmbarque: data.pagarAlEmbarque,
        debidoABayside: data.debidoABayside,
        pagoCapitana: data.pagoCapitana,
        pagoMarinero: data.pagoMarinero,
        precioAcordado: data.precioAcordado,
        horasAcordadas: data.horasAcordadas,
        tarifaHora: data.tarifaHora,
        cargoExtra: data.cargoExtra,
        costoTotal: data.costoTotal,
        deposito: data.deposito,
        saldoCliente: data.saldoCliente,
      };

      let result;
      if (mode === "admin-create") {
        result = await createWorkOrder(submissionData);
      } else {
        if (!orderId) {
          alert("Falta ID de Orden");
          setLoading(false);
          return;
        }
        result = await updateWorkOrder(orderId, submissionData);
      }

      if (result.success) {
        if (mode === "admin-create") {
          // Show success dialog with order number
          setCreatedOrderId(result.data?.id || null);
          setShowSuccessDialog(true);
        } else {
          alert("Orden Actualizada!");
          if (mode === "captain-edit") {
            // Captain Flow: Only sign out here, after explicit "Guardar"
            await authClient.signOut();
            router.push("/");
          } else {
            router.push("/admin/list");
          }
        }
      } else {
        alert("Error: " + result.error);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      alert("Error: " + (error?.message || "Error al guardar"));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setCreatedOrderId(null);
    router.push("/admin/list");
  };

  if (loading && mode !== "admin-create" && !form.formState.isDirty) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <Card className="max-w-5xl mx-auto shadow-xl border-none">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Ship className="h-6 w-6" />{" "}
            {mode === "admin-create"
              ? "Nueva Orden de Embarque"
              : `Orden #${orderId || ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* CLIENTE INFO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={!canEdit("nombre")}
                          className={!canEdit("nombre") ? "bg-gray-200" : ""}
                        />
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
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={!canEdit("cell")}
                          className={!canEdit("cell") ? "bg-gray-200" : ""}
                        />
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
                  control={form.control}
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
                  control={form.control}
                  name="puntoEncuentro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Punto de Encuentro</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={!canEdit("puntoEncuentro")}
                          className={
                            !canEdit("puntoEncuentro") ? "bg-gray-200" : ""
                          }
                        />
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
                              disabled={!canEdit("fechaEmbarque")}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                                !canEdit("fechaEmbarque") && "bg-gray-200"
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
                            disabled={!canEdit("fechaEmbarque")}
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
                          disabled={!canEdit("horaEmbarque")}
                          className={
                            !canEdit("horaEmbarque") ? "bg-gray-200" : ""
                          }
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
                            disabled={!canEdit("horaLlagado")}
                            className={
                              !canEdit("horaLlagado") ? "bg-gray-200" : ""
                            }
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
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              {...field}
                              value={
                                field.value === 0 ? "" : (field.value ?? "")
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
                              className={`flex-1 ${
                                !canEdit("combustible") ? "bg-gray-200" : ""
                              }`}
                              disabled={!canEdit("combustible")}
                            />
                            {orderId && isCaptain && (
                              <label className="cursor-pointer">
                                <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleFileSelect(e, "combustible");
                                  }}
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                            )}
                          </div>
                        </FormControl>
                        {getReceiptsByGasto("combustible").length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getReceiptsByGasto("combustible").map(
                              (r: any, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handlePhotoClick(r.url)}
                                  className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
                                >
                                  <img
                                    src={r.url}
                                    alt="Receipt"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )
                            )}
                          </div>
                        )}
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
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              {...field}
                              value={
                                field.value === 0 ? "" : (field.value ?? "")
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
                              className={`flex-1 ${
                                !canEdit("hielo") ? "bg-gray-200" : ""
                              }`}
                              disabled={!canEdit("hielo")}
                            />
                            {orderId && isCaptain && (
                              <label className="cursor-pointer">
                                <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) => handleFileSelect(e, "hielo")}
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                            )}
                          </div>
                        </FormControl>
                        {getReceiptsByGasto("hielo").length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getReceiptsByGasto("hielo").map(
                              (r: any, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handlePhotoClick(r.url)}
                                  className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
                                >
                                  <img
                                    src={r.url}
                                    alt="Receipt"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )
                            )}
                          </div>
                        )}
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
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              {...field}
                              value={
                                field.value === 0 ? "" : (field.value ?? "")
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
                              className={`flex-1 ${
                                !canEdit("aguaBebidas") ? "bg-gray-200" : ""
                              }`}
                              disabled={!canEdit("aguaBebidas")}
                            />
                            {orderId && isCaptain && (
                              <label className="cursor-pointer">
                                <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) =>
                                    handleFileSelect(e, "aguaBebidas")
                                  }
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                            )}
                          </div>
                        </FormControl>
                        {getReceiptsByGasto("aguaBebidas").length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getReceiptsByGasto("aguaBebidas").map(
                              (r: any, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handlePhotoClick(r.url)}
                                  className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
                                >
                                  <img
                                    src={r.url}
                                    alt="Receipt"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )
                            )}
                          </div>
                        )}
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
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              {...field}
                              value={
                                field.value === 0 ? "" : (field.value ?? "")
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
                              className={`flex-1 ${
                                !canEdit("gastoVarios") ? "bg-gray-200" : ""
                              }`}
                              disabled={!canEdit("gastoVarios")}
                            />
                            {orderId && isCaptain && (
                              <label className="cursor-pointer">
                                <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) =>
                                    handleFileSelect(e, "gastoVarios")
                                  }
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                            )}
                          </div>
                        </FormControl>
                        {getReceiptsByGasto("gastoVarios").length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getReceiptsByGasto("gastoVarios").map(
                              (r: any, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handlePhotoClick(r.url)}
                                  className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
                                >
                                  <img
                                    src={r.url}
                                    alt="Receipt"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )
                            )}
                          </div>
                        )}
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
                        <FormLabel className={isCaptain ? "text-gray-500" : ""}>
                          Pagar al Embarque
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            readOnly
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            className={`bg-gray-100 cursor-not-allowed ${
                              isCaptain ? "opacity-75" : ""
                            }`}
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
                        <FormLabel
                          className={`font-bold text-lg ${
                            isCaptain ? "text-gray-600" : "text-green-700"
                          }`}
                        >
                          Debido a Bayside
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            readOnly
                            value={field.value === 0 ? "" : (field.value ?? "")}
                            className={`${
                              isCaptain
                                ? "bg-gray-100 border-2 border-gray-300 text-gray-700"
                                : "bg-green-50 border-2 border-green-300 text-green-800"
                            } font-bold text-lg cursor-not-allowed`}
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
                            disabled={isCaptain}
                            className={isCaptain ? "bg-gray-200" : ""}
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
                            disabled={isCaptain}
                            className={isCaptain ? "bg-gray-200" : ""}
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
                            disabled={isCaptain}
                            className={isCaptain ? "bg-gray-200" : ""}
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
                            disabled={isCaptain}
                            className={isCaptain ? "bg-gray-200" : ""}
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
                            disabled={isCaptain}
                            className={isCaptain ? "bg-gray-200" : ""}
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
                            disabled={isCaptain}
                            className={isCaptain ? "bg-gray-200" : ""}
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
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        disabled={!canEdit("detallesNotas")}
                        className={
                          !canEdit("detallesNotas") ? "bg-gray-200" : ""
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mode === "admin-create" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (
                        window.confirm(
                          "¿Está seguro de que desea cancelar? Los datos ingresados no se guardarán."
                        )
                      ) {
                        router.push("/admin/list");
                      }
                    }}
                    className="w-full py-6 text-lg border-2 border-gray-300 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  className={`w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg ${
                    mode === "admin-create" ? "" : "md:col-span-2"
                  }`}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar Orden de Trabajo"}
                </Button>
              </div>
            </form>
          </Form>

          {/* Compressing Modal */}
          {compressing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                <div className="mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Comprimiendo imagen...
                </h3>
                <p className="text-sm text-gray-600">
                  Por favor espera mientras optimizamos la imagen para una carga
                  más rápida.
                </p>
              </div>
            </div>
          )}

          {/* Photo Enlargement Dialog */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
              onClick={closePhotoDialog}
            >
              <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
                <button
                  type="button"
                  onClick={closePhotoDialog}
                  className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl font-bold z-10"
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedPhoto}
                    alt="Enlarged receipt"
                    className="max-w-full max-h-[85vh] object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Success Dialog for Order Creation */}
          {showSuccessDialog && createdOrderId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Orden Creada Exitosamente!
                  </h3>
                  <p className="text-lg text-gray-600 mb-1">
                    Su orden de trabajo ha sido creada con el número:
                  </p>
                  <p className="text-3xl font-bold text-blue-600 mb-6">
                    #{createdOrderId}
                  </p>
                  <button
                    onClick={handleSuccessDialogClose}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
