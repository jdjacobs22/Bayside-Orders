/**
 * WorkOrderForm/index.tsx
 *
 * This file contains the main WorkOrderForm component, which is the core of the application's
 * data entry and editing workflow. It supports multiple modes for Admins and Captains,
 * handles complex form state, image uploads with resizing, and real-time calculations.
 */
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Ship, Anchor } from "lucide-react";
import {
  uploadReceipt,
  getWorkOrder,
  updateWorkOrder,
  createWorkOrder,
  getClientDetails,
} from "@/app/actions/work-order";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSchema, getCaptainSchema } from "@/lib/schemas";
import { toast } from "sonner";
import { useDebugLog } from "./useDebugLog";
import { useClientLookup } from "./useClientLookup";
import { useFinancialCalculations } from "./useFinancialCalculations";
import { AdminSection } from "./AdminSection";
import { CaptainSection } from "./CaptainSection";
import { CompressingModal } from "./CompressingModal";
import { PhotoDialog } from "./PhotoDialog";
import { SuccessDialog } from "./SuccessDialog";
import { canEdit as canEditField } from "./permissions";
import { compressImage } from "./compressImage";

// 1. STYLED SCHEMA: Strict types for Linter compliance

const adminSchema = getAdminSchema();
const captainSchema = getCaptainSchema();

type FormValues = z.infer<ReturnType<typeof getAdminSchema>>;

interface WorkOrderFormProps {
  mode?: "admin-create" | "admin-edit" | "captain-edit";
  orderId?: number;
}



/**
 * Main form component for creating and editing work orders.
 * Handles different modes: Admin Create, Admin Edit, and Captain Edit.
 *
 * @param props - Component properties
 * @param props.mode - The operation mode of the form ("admin-create", "admin-edit", "captain-edit"). Defaults to "admin-create".
 * @param props.orderId - Optional ID of the order to edit. Required for edit modes.
 */
export default function WorkOrderForm({
  mode,
  orderId: propOrderId,
}: WorkOrderFormProps) {
  const router = useRouter();

  // Initialize orderId immediately if propOrderId is provided
  const [orderId, setOrderId] = React.useState<number | null>(propOrderId || null);


  // Effect to sync initial state if needed (optional, skipping for now as requested)

  // Update orderId if propOrderId changes
  React.useEffect(() => {
    if (propOrderId && propOrderId !== orderId) {
      setOrderId(propOrderId);
    }
  }, [propOrderId, orderId]);
  const [receipts, setReceipts] = React.useState<any[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [compressing, setCompressing] = React.useState(false);
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [createdOrderId, setCreatedOrderId] = React.useState<number | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const { debugMode, setDebugMode, debugLogs, addDebugLog, clearDebugLogs } = useDebugLog();

  // Field Access Logic
  const isCaptain = mode === "captain-edit";
  const canEdit = (fieldName: string) => canEditField(fieldName, isCaptain);

  const activeSchema = isCaptain ? captainSchema : adminSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(activeSchema) as any,
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      cell: "",
      cliente: "",
      clienteCell: "",
      clienteEmail: "",
      fechaEmbarque: undefined,
      horaEmbarque: "10:00",
      destino: "",
      puntoEncuentro: "",
      pasajeros: 0,
      detallesNotas: "",
      horaLlegado: "",
      combustible: 0,
      hielo: 0,
      aguaBebidas: 0,
      gastoVarios: 0,
      pagoRecibo: 0,
      efectivo: false,
      transferir: false,
      pagarAlEmbarque: 0,
      debidoABayside: 0,
      pagoCapitana: 0,
      pagoMarinero: 0,
      precioAcordado: 0,
      horasAcordadas: 0,
      tarifaHora: 0,
      cargoExtra: 0,
      totalClienteCost: 0,
      deposito: 0,
      saldoCliente: 0,
      ingresoNeto: 0,
      horasExtras: 0,
      paymentMethod: null, // Initialize paymentMethod
      horasExtrasEfectivo: false,
      horasExtrasTransferir: false,
      pagoHorasExtra: 0,
    },
  });

  const { watch, setValue, getValues } = form;
  const nombreCliente = watch("nombre");
  const apellidoCliente = watch("apellido");
  const precio = watch("precioAcordado");
  const extra = watch("cargoExtra");
  const deposito = watch("deposito");
  const horaEmbarque = watch("horaEmbarque");
  const horaLlegado = watch("horaLlegado");
  const tarifaHora = watch("tarifaHora");
  const horasAcordadas = watch("horasAcordadas");
  const combustible = watch("combustible");
  const hielo = watch("hielo");
  const aguaBebidas = watch("aguaBebidas");
  const gastoVarios = watch("gastoVarios");
  const pagoCapitana = watch("pagoCapitana");
  const pagoMarinero = watch("pagoMarinero");

  const horasExtrasVal = watch("horasExtras");
  const pagoReciboVal = watch("pagoRecibo");
  const pagoHorasExtra = watch("pagoHorasExtra");
  const paymentMethod = watch("paymentMethod");
  const horasExtrasEfectivo = watch("horasExtrasEfectivo");
  const horasExtrasTransferir = watch("horasExtrasTransferir");
  const efectivo = watch("efectivo");
  const transferir = watch("transferir");
  const saldoCliente = watch("saldoCliente");

  /**
   * Helper function to convert time string (HH:MM) to hours (decimal).
   *
   * @param timeStr - The time string to convert (e.g., "10:30").
   * @returns The time in decimal hours (e.g., 10.5), or 0 if invalid.
   */
  const timeStringToHours = (timeStr: string | undefined): number => {
    if (!timeStr || !timeStr.includes(":")) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + (minutes || 0) / 60;
  };

  const { apellidosList, nombresList, discoveredCaptainId, setDiscoveredCaptainId } = useClientLookup({
    nombreCliente,
    apellidoCliente,
    setValue,
    getValues,
  });

  useFinancialCalculations({
    tarifaHora,
    horasAcordadas,
    horasExtrasVal,
    gastoVarios,
    deposito,
    pagoReciboVal,
    pagoHorasExtra,
    combustible,
    hielo,
    aguaBebidas,
    pagoCapitana,
    pagoMarinero,
    setValue,
    getValues,
  });

  React.useEffect(() => {
    if (orderId && (mode === "admin-edit" || mode === "captain-edit")) {
      setLoading(true);
      setFetchError(null);
      getWorkOrder(orderId)
        .then((res) => {
          if (res.success && res.data) {
            const data = res.data;
            form.reset({
              nombre: data.nombre || "",
              apellido: data.apellido || "",
              email: data.email || "",
              cell: data.cell || "",
              cliente: (data as any).cliente || "",
              clienteCell: (data as any).clienteCell || "",
              clienteEmail: (data as any).clienteEmail || "",
              fechaEmbarque: data.fecha ? new Date(data.fecha) : undefined,
              horaEmbarque: data.horaSalida || "10:00",
              destino: data.destino || "",
              puntoEncuentro: data.puntoEncuentro || "",
              pasajeros: data.pasajeros || 0,
              detallesNotas: data.detallesNotas || "",
              horaLlegado: data.horaLlegado || "",
              combustible: data.combustible || 0,
              hielo: data.hielo || 0,
              aguaBebidas: data.aguaBebidas || 0,
              gastoVarios: data.gastoVarios || 0,
              pagoCapitana: data.pagoCapitana || 0,
              pagoMarinero: data.pagoMarinero || 0,
              precioAcordado: data.precioAcordado || 0,
              horasAcordadas: data.horasAcordadas || 0,
              tarifaHora: data.tarifaHora || 0,
              cargoExtra: data.cargoExtra || 0,
              totalClienteCost: data.totalClienteCost || 0,
              deposito: data.deposito || 0,
              saldoCliente: data.saldoCliente || 0,
              ingresoNeto: data.ingresoNeto || 0,
              pagoRecibo: data.pagoRecibo || 0,
              efectivo: data.efectivo || false,
              transferir: data.transferir || false,
              pagarAlEmbarque: data.pagarAlEmbarque || 0,
              debidoABayside: data.debidoABayside || 0,
              horasExtras: data.horasExtras || "",
              paymentMethod: (data.paymentMethod as "efectivo" | "transferir") || null,
              horasExtrasEfectivo: data.horasExtrasEfectivo || false,
              horasExtrasTransferir: data.horasExtrasTransferir || false,
              pagoHorasExtra: data.pagoHorasExtra || 0,
            });
            setDiscoveredCaptainId(data.captainId || null);
            if (data.receipts) setReceipts(data.receipts);
          } else {
            const errorMessage = res.error || "Error cargando orden";
            setFetchError(errorMessage);
            toast.error("Error", {
              description: errorMessage,
            });
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error loading order:", error);
          toast.error("Error", {
            description: "Error cargando orden: " + error.message,
          });
          setLoading(false);
        });
    }
  }, [orderId, mode, form]);

  /**
   * Compresses an image file using native browser APIs (createImageBitmap).
   * This is significantly more memory-efficient than library-based canvas operations
   * because it resizes the image DURING decoding, avoiding a high-res memory spike.
   * Perfect for devices like the Samsung A53 with massive camera sensors.
   */



  /**
   * Handles the selection and processing of an image file for expense receipts.
   * USES NATIVE DECODING: Resizes the image DURING de-compression to stay within
   * the memory limits of devices like the Samsung A53 (64MP sensor).
   *
   * @param e - The file input change event.
   * @param gastoType - The category of the expense (e.g., 'combustible', 'hielo').
   */
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    gastoType: string
  ) => {
    addDebugLog(`PROCESS START: ${gastoType}`);

    if (!e.target.files?.[0]) {
      addDebugLog("No file selected.");
      return;
    }

    const originalFile = e.target.files[0];
    addDebugLog(`SOURCE: ${originalFile.name} (${(originalFile.size / 1024 / 1024).toFixed(2)}MB)`);

    // 1. Release the input immediately to free file handle
    e.target.value = "";

    if (!originalFile.type.startsWith("image/")) {
      toast.error("Archivo inválido", { description: "Solo se permiten imágenes" });
      return;
    }

    if (!orderId) {
      toast.error("Error", { description: "No se encontró el ID de la orden." });
      return;
    }

    setCompressing(true);
    setUploading(true);

    try {
      // 🛑 STAGE 1: COMPRESS
      const compressedBlob = await compressImage(originalFile, addDebugLog);

      // 🛑 STAGE 2: UPLOAD
      const formData = new FormData();
      formData.append("file", new File([compressedBlob], originalFile.name, { type: 'image/jpeg' }));
      formData.append("orderId", orderId.toString());
      formData.append("gastoType", gastoType);

      addDebugLog("Sending upload request...");
      const res = await uploadReceipt(formData);

      if (res.success) {
        addDebugLog("Upload success.");
        setReceipts((prev) => [...prev, res.data]);
        toast.success("Éxito", { description: "Imagen subida exitosamente" });
      } else {
        addDebugLog(`Upload failed server-side: ${res.error}`);
        toast.error("Error", { description: res.error });
      }
    } catch (err: any) {
      console.error("Compression/Upload error:", err);
      addDebugLog(`CRITICAL EXCEPTION: ${err.message}`);
      toast.error("Error", { description: "Error al procesar la imagen de alta resolución." });
    } finally {
      setCompressing(false);
      setUploading(false);
      addDebugLog("Process finished.");
    }
  };


  /**
   * Filters the list of receipts to find those matching a specific expense category.
   *
   * @param gastoType - The expense category to filter by.
   * @returns An array of receipt objects matching the category.
   */
  const getReceiptsByGasto = (gastoType: string) => {
    return receipts.filter((r) => r.gastoType === gastoType);
  };

  /**
   * Sets the selected photo to be displayed in the enlargement dialog.
   *
   * @param url - The URL of the photo to display.
   */
  const handlePhotoClick = (url: string) => {
    setSelectedPhoto(url);
  };

  /**
   * Closes the photo enlargement dialog by clearing the selected photo.
   */
  // Gemini added new code
  const closePhotoDialog = () => {
    // If the selectedPhoto was a blob URL, it should be revoked here
    if (selectedPhoto?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedPhoto);
    }
    setSelectedPhoto(null);
  };

  /**
   * Handles the form submission.
   * Maps form values to the structure expected by the backend API.
   * Calls the appropriate action (create or update) based on the mode.
   * Handles success and error states, including navigation and UI feedback.
   *
   * @param data - The form data values.
   */
  const onSubmit = async (data: FormValues) => {
    setLoading(true);

    addDebugLog("Submission started...");
    try {
      // Custom validation before submission to ensure last name strictness from User DB
      // SKIP if is Captain (editing existing) or if name is empty
      if (!isCaptain && nombreCliente && nombreCliente.trim() !== "") {
        addDebugLog("Validating client name existence...");
        const check = await getClientDetails(nombreCliente, data.apellido ?? "");
        if (!check.success || !check.data) {
          addDebugLog("Validation failed: Client not found in User DB");
          toast.error("Error", {
            description: "Ese nombre no existe en nuestra base de datos.",
          });
          setLoading(false);
          return;
        }
      }

      // Map form data to match action expectations
      const submissionData: any = {
        ...data,
        fechaEmbarque: data.fechaEmbarque
          ? (data.fechaEmbarque instanceof Date
            ? `${data.fechaEmbarque.getDate().toString().padStart(2, '0')}/${(data.fechaEmbarque.getMonth() + 1).toString().padStart(2, '0')}/${data.fechaEmbarque.getFullYear()}`
            : data.fechaEmbarque)
          : undefined,
        captainId: discoveredCaptainId,
      };

      // submissionData is now a plain object with native types
      let result;
      if (mode === "admin-create") {
        result = await createWorkOrder(submissionData, "admin");
      } else {
        if (!orderId) {
          toast.error("Error", {
            description: "Falta ID de Orden",
          });
          setLoading(false);
          return;
        }
        result = await updateWorkOrder(orderId, submissionData, isCaptain ? "captain" : "admin");
      }

      if (result.success) {
        if (mode === "admin-create") {
          // Show success dialog with order number
          setCreatedOrderId(result.data?.id || null);
          setShowSuccessDialog(true);
        } else {
          toast.success("Éxito", {
            description: "Orden Actualizada!",
          });
          if (mode === "captain-edit") {
            addDebugLog("Captain update successful. Redirecting and signing out...");
            // Captain Flow: Only sign out here, after explicit "Guardar"
            try {
              // Sign out immediately to prevent further edits without new login
              await authClient.signOut();
              addDebugLog("Signout complete. Pushing to home...");
              router.push("/");
            } catch (signOutErr) {
              addDebugLog(`Signout warning: ${signOutErr}`);
              router.push("/");
            }
          } else {
            addDebugLog("Admin update successful. Redirecting...");
            router.push("/admin/list");
          }
        }
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error("Error", {
        description: error?.message || "Error al guardar",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Closes the success dialog and navigates back to the admin list.
   * Resets the created order ID.
   */
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

  if (fetchError) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md w-full border border-red-100">
          <div className="text-red-500 mb-4 flex justify-center">
            <Anchor className="h-12 w-12" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error de Acceso</h1>
          <p className="text-gray-600 mb-6">{fetchError}</p>
          <Button
            onClick={() => router.push(isCaptain ? "/captain" : "/admin/list")}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <Card className="max-w-5xl mx-auto shadow-xl border-none">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
            <Ship className="h-6 w-6" />{" "}
            {mode === "admin-create"
              ? "Nueva Orden de Embarque"
              : `Orden #${orderId || ""}`}
          </CardTitle>
          {isCaptain && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (window.confirm("Are you sure you want to abandon these changes and return to the order entry screen?")) {
                  router.push("/captain");
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold transition-colors border border-red-700 shadow-sm whitespace-normal text-center h-auto min-h-[2.5rem] py-1"
              disabled={loading}
            >
              Return to Enter Order No
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* ADMIN */}
              <AdminSection
                control={form.control}
                canEdit={canEdit}
                nombreCliente={nombreCliente}
                nombresList={nombresList}
                apellidosList={apellidosList}
                setValue={setValue}
                setDiscoveredCaptainId={setDiscoveredCaptainId}
              />
              {/* CAPTAIN */}
              <CaptainSection
                control={form.control}
                canEdit={canEdit}
                isCaptain={isCaptain}
                mode={mode}
                getReceiptsByGasto={getReceiptsByGasto}
                uploading={uploading}
                handleFileSelect={handleFileSelect}
                handlePhotoClick={handlePhotoClick}
                setValue={setValue}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(mode === "admin-create" || isCaptain) && (
                  <Button
                    type="button"
                    variant={isCaptain ? "default" : "outline"}
                    onClick={() => {
                      const confirmMsg = isCaptain
                        ? "Are you sure you want to abandon these changes and return to the order entry screen?"
                        : "¿Está seguro de que desea cancelar? Los datos ingresados no se guardarán.";

                      if (window.confirm(confirmMsg)) {
                        router.push(isCaptain ? "/captain" : "/admin/list");
                      }
                    }}
                    className={cn(
                      "w-full py-6 text-lg border-2 shadow-sm transition-colors",
                      isCaptain
                        ? "bg-red-600 hover:bg-red-700 text-white border-red-700 font-bold"
                        : "border-gray-300 hover:bg-gray-50 text-gray-700"
                    )}
                    disabled={loading}
                  >
                    {isCaptain ? "Return to Enter Order No" : "Cancelar"}
                  </Button>
                )}
                <Button
                  type="submit"
                  className={`w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg ${(mode === "admin-create" || isCaptain) ? "" : "md:col-span-2"
                    }`}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar Orden de Trabajo"}
                </Button>
              </div>
            </form>
          </Form>

          <CompressingModal open={compressing} />
          <PhotoDialog photo={selectedPhoto} onClose={closePhotoDialog} />

          {/* DEBUG LOGS SECTION */}
          {debugMode && debugLogs.length > 0 && (
            <div className="mt-8 p-4 bg-black text-green-400 font-mono text-xs rounded-lg overflow-hidden border-2 border-green-700">
              <div className="flex justify-between items-center mb-2 border-b border-green-800 pb-2">
                <h4 className="font-bold">DEBUG LOGS (Samsung Fix Info)</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearDebugLogs}
                    className="px-2 py-1 bg-red-900 hover:bg-red-700 text-white rounded text-xs"
                  >
                    CLEAR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = debugLogs.join('\n');
                      navigator.clipboard.writeText(text);
                      toast.success("Logs copied to clipboard");
                    }}
                    className="px-2 py-1 bg-green-900 hover:bg-blue-700 text-white rounded text-xs"
                  >
                    COPY
                  </button>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto whitespace-pre-wrap flex flex-col-reverse">
                {/* Reversed order to show new at top conceptually if we want, but usually log bottom is new.
                    Let's just map them. flex-col-reverse keeps bottom anchored? No, standard map is fine.
                */}
                {debugLogs.map((log, i) => (
                  <div key={i} className="border-b border-green-900/30 py-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}


          <SuccessDialog
            open={showSuccessDialog}
            orderId={createdOrderId}
            onClose={handleSuccessDialogClose}
          />
        </CardContent>
        {/* Footer Debug Toggle */}
        <div className="py-2 px-6 flex justify-end">
          <button
            type="button"
            onClick={() => setDebugMode((prev) => !prev)}
            className={`text-xs flex items-center gap-1 p-2 rounded transition-colors ${debugMode
              ? "text-red-500 font-bold bg-red-100 ring-1 ring-red-200"
              : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
              }`}
            title="Toggle Debug Mode"
          >
            <span className="text-sm">🐞</span> {debugMode ? "Debug ON" : "Debug OFF"}
          </button>
        </div>
      </Card>
    </div >
  );
}
