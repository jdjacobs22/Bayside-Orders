"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  getClientApellidosByNombre,
  getUniqueNombresFromUsers,
  getClientDetails,
} from "@/app/actions/work-order";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CaptainSelect } from "@/components/CaptainSelect";

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
import { Prisma } from "@/lib/prisma-client/browser";
import { getAdminSchema, getCaptainSchema } from "@/lib/schemas";
import imageCompression from 'browser-image-compression';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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
  const [apellidosList, setApellidosList] = React.useState<string[]>([]);
  const [nombresList, setNombresList] = React.useState<string[]>([]);
  const [discoveredCaptainId, setDiscoveredCaptainId] = React.useState<string | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // PERSIST DEBUG MODE ACROSS RELOADS/CRASHES
  const [debugMode, setDebugMode] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("debug_mode_enabled");
      return saved === "true";
    }
    return false;
  });

  React.useEffect(() => {
    localStorage.setItem("debug_mode_enabled", debugMode.toString());
  }, [debugMode]);
  // DEBUGGING STATE
  const [debugLogs, setDebugLogs] = React.useState<string[]>([]);

  // Load logs from local storage on mount
  React.useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("photo_debug_logs");
      let logs = [];
      if (savedLogs) {
        logs = JSON.parse(savedLogs);
      }

      // Add a marker that the page has reloaded (Crucial for identifying crash points)
      const reloadEntry = `${new Date().toLocaleTimeString()}: --- PAGE RELOAD / SUCCESSFUL REBOOT ---`;
      const updatedLogs = [...logs, reloadEntry];
      setDebugLogs(updatedLogs);
      localStorage.setItem("photo_debug_logs", JSON.stringify(updatedLogs));
    } catch (e) {
      console.error("Failed to load debug logs", e);
    }
  }, []);

  /**
   * Adds a message to the debug log system.
   * Logs are stored in both memory state and local storage for persistence across reloads.
   * Useful for debugging issues on mobile devices where console access is limited.
   * Automatically includes memory status if the browser supports it (Chrome/Android).
   * 
   * @param msg - The message to log.
   */
  const addDebugLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    let memoryStatus = "";

    // Attempt to get browser heap memory status (Chrome/Android support)
    const perf = (window.performance as any);
    if (perf && perf.memory) {
      const used = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024);
      memoryStatus = ` [RAM: ${used}MB/${total}MB]`;
    }

    const logEntry = `${timestamp}${memoryStatus}: ${msg}`;
    console.log("DEBUG:", msg);
    setDebugLogs((prev) => {
      const newLogs = [...prev, logEntry];
      try {
        localStorage.setItem("photo_debug_logs", JSON.stringify(newLogs));
      } catch (e) {
        console.error("Failed to save log to local storage", e);
      }
      return newLogs;
    });
  };

  /**
   * Clears all debug logs from memory and local storage.
   */
  const clearDebugLogs = () => {
    setDebugLogs([]);
    localStorage.removeItem("photo_debug_logs");
  };

  // Field Access Logic
  const isCaptain = mode === "captain-edit";
  /**
   * Determines if a specific field can be edited based on the current user role (mode).
   * Admins can edit all fields. Captains are restricted to specific fields.
   *
   * @param fieldName - The name of the field to check.
   * @returns True if the field is editable, false otherwise.
   */
  const canEdit = (fieldName: string) => {
    if (!isCaptain) return true; // Admin creates/edits all
    const allowed = [
      "horaLlegado",
      "combustible",
      "hielo",
      "aguaBebidas",
      "gastoVarios",
      "horasExtras",
      "efectivo",
      "transferir",
      "pagoRecibo",
      "horasExtrasEfectivo",
      "horasExtrasTransferir",
      "pagoHorasExtra",
    ];
    return allowed.includes(fieldName);
  };

  const activeSchema = isCaptain ? captainSchema : adminSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(activeSchema) as any,
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      cell: "",
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
      horasExtras: 0,
      paymentMethod: null, // Initialize paymentMethod
      horasExtrasEfectivo: false,
      horasExtrasTransferir: false,
      pagoHorasExtra: 0,
    },
  });

  const { watch, setValue } = form;
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

  // Fetch matching last names when "nombre" changes explicitly
  React.useEffect(() => {
    /**
     * Fetches a list of last names associated with the currently entered "nombre" (first name).
     * If exactly one result is found, it auto-populates the "apellido" (last name) field.
     */
    async function fetchApellidos() {
      if (!nombreCliente || nombreCliente.trim().length === 0) {
        setApellidosList([]);
        return;
      }

      const res = await getClientApellidosByNombre(nombreCliente);
      if (res.success && res.data) {
        setApellidosList(res.data);
        // If there is exactly one result, we can auto-populate the apellido field
        // Only if it's currently empty to avoid overwriting user changes
        if (res.data.length === 1 && !form.getValues("apellido")) {
          setValue("apellido", res.data[0]);
        }
      } else {
        setApellidosList([]);
      }
    }

    // Slight debounce for fetching to avoid overwhelming calls
    const timerId = setTimeout(() => {
      fetchApellidos();
    }, 400);

    return () => clearTimeout(timerId);
  }, [nombreCliente, setValue]);

  // Fetch email and cell when both nombre and apellido are available
  React.useEffect(() => {
    /**
     * Fetches details (email, cell, user ID) for a specific client based on their 
     * full name (nombre and apellido).
     * Auto-populates email and cell fields if they are currently unpopulated.
     */
    async function fetchDetails() {
      if (!nombreCliente || !apellidoCliente) return;

      const res = await getClientDetails(nombreCliente, apellidoCliente);
      if (res.success) {
        if (res.data) {
          // Auto-populate email and cell if they are currently empty
          if (!form.getValues("email") && res.data.email) {
            setValue("email", res.data.email);
          }
          if (!form.getValues("cell") && res.data.cell) {
            setValue("cell", res.data.cell);
          }
          // Set discovered ID for captain/client matching
          setDiscoveredCaptainId((res.data as any).id || null);
        } else {
          setDiscoveredCaptainId(null);
          // If both fields have values but no user matches, show error
          if (nombreCliente.trim() && apellidoCliente.trim()) {
            toast.error("Error", {
              description: "Ese nombre no existe en nuestra base de datos.",
            });
          }
        }
      }
    }

    const timerId = setTimeout(() => {
      fetchDetails();
    }, 500);

    return () => clearTimeout(timerId);
  }, [nombreCliente, apellidoCliente, setValue]);

  useEffect(() => {
    /**
     * Fetches all unique first names (nombres) from the User database 
     * to populate the selection list.
     */
    async function fetchNombres() {
      const res = await getUniqueNombresFromUsers();
      if (res.success && res.data) {
        setNombresList(res.data);
      }
    }
    fetchNombres();
  }, []);

  // Calculate cargoExtra based on horasExtras only
  useEffect(() => {
    const cargo = (Number(tarifaHora) || 0) * (Number(horasExtrasVal) || 0);
    setValue("cargoExtra", Math.floor(cargo));
  }, [tarifaHora, horasExtrasVal, setValue]);

  // Calculate Precio Acordado = Tarifa * Duracion
  useEffect(() => {
    const precio = (Number(tarifaHora) || 0) * (Number(horasAcordadas) || 0);
    setValue("precioAcordado", Math.floor(precio));
  }, [tarifaHora, horasAcordadas, setValue]);

  // Calculate totalClienteCost and Financials
  useEffect(() => {
    // totalClienteCost = precioAcordado + cargoExtra + gastoVarios
    const total = (Number(precio) || 0) + (Number(extra) || 0) + (Number(gastoVarios) || 0);
    const totalFloor = Math.floor(total);
    if (form.getValues("totalClienteCost") !== totalFloor) {
      setValue("totalClienteCost", totalFloor);
    }

    // saldoCliente = totalClienteCost - deposito - pagoRecibo - pagoHorasExtra
    const currentDeposito = Number(deposito) || 0;
    const currentPagoRecibo = Number(pagoReciboVal) || 0;
    const currentPagoHorasExtra = Number(pagoHorasExtra) || 0;
    const saldo = total - currentDeposito - currentPagoRecibo - currentPagoHorasExtra;
    const saldoFloor = Math.floor(saldo);

    if (form.getValues("saldoCliente") !== saldoFloor) {
      setValue("saldoCliente", saldoFloor);
    }

    // Debido a Bayside = Saldo Cliente
    if (form.getValues("debidoABayside") !== saldoFloor) {
      setValue("debidoABayside", saldoFloor);
    }

  }, [
    precio,
    extra,
    gastoVarios,
    deposito,
    pagoReciboVal,
    pagoHorasExtra,
    setValue,
    form
  ]);

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
      // 🛑 STAGE 1: NATIVE DECODE + RESIZE (SAMSUNG FIX)
      // This resizes DURING decoding to avoid the 200MB+ memory spike of a 64MP raw bitmap.
      addDebugLog("Starting Native Decoded Resize...");
      const bitmap = await createImageBitmap(originalFile, {
        resizeWidth: 1200,
        resizeQuality: 'medium'
      });

      addDebugLog(`Native resize successful: ${bitmap.width}x${bitmap.height}`);

      // 🛑 STAGE 2: CANVAS BLOB GENERATION
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error("Could not get canvas context");
      ctx.drawImage(bitmap, 0, 0);

      // CRITICAL: Release bitmap memory immediately after drawing
      bitmap.close();

      const compressedBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8)
      );

      if (!compressedBlob) throw new Error("Blob conversion failed");
      addDebugLog(`Blob created: ${(compressedBlob.size / 1024).toFixed(0)}KB`);

      // 🛑 STAGE 3: UPLOAD
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





  // Old handleFileSelect function--New is above
  // const handleFileSelect = async (
  //   e: React.ChangeEvent<HTMLInputElement>,
  //   gastoType: string
  // ) => {
  //   // Prevent default isn't always needed for file inputs but kept for consistency
  //   // e.preventDefault(); 

  //   addDebugLog(`File input triggered for ${gastoType}`);

  //   if (!e.target.files?.[0]) {
  //     addDebugLog("No file selected or file selection cancelled");
  //     return;
  //   }

  //   const originalFile = e.target.files[0];

  //   // Log file details immediately
  //   addDebugLog(`File Selected: Name=${originalFile.name}, Size=${(originalFile.size / 1024 / 1024).toFixed(2)}MB, Type=${originalFile.type}`);

  //   e.target.value = ""; // Reset input

  //   if (!originalFile.type.startsWith("image/")) {
  //     addDebugLog("Invalid file type selected");
  //     toast.error("Archivo inválido", {
  //       description: "Solo se permiten archivos de imagen",
  //     });
  //     return;
  //   }

  //   if (!orderId) {
  //     addDebugLog("Error: Missing Order ID");
  //     toast.error("Error", {
  //       description: "No se encontró el ID de la orden.",
  //     });
  //     return;
  //   }

  //   setCompressing(true);
  //   setUploading(true);
  //   addDebugLog("Starting compression process...");

  //   try {
  //     // 1. Configure compression settings for Samsung A53 stability
  //     const options = {
  //       maxSizeMB: 0.8,          // Target ~800KB
  //       maxWidthOrHeight: 1280,  // Downscale 64MP -> ~1.2MP
  //       useWebWorker: true,      // Run in background thread
  //       initialQuality: 0.7,     // Start at 70% quality
  //       alwaysKeepResolution: true,
  //       onProgress: (progress: number) => {
  //         // Optional: excessive logging might slow it down, but helpful for hangs
  //         // addDebugLog(`Compression progress: ${progress}%`); 
  //       }
  //     };

  //     addDebugLog(`Compression Options: ${JSON.stringify(options)}`);

  //     // 2. Use the LIBRARY (imageCompression)
  //     const compressedBlob = await imageCompression(originalFile, options);

  //     addDebugLog(`Compression success. New Size: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);

  //     // 3. Convert the result back to a File object
  //     const compressedFile = new File([compressedBlob], originalFile.name, {
  //       type: originalFile.type,
  //       lastModified: Date.now(),
  //     });

  //     // 4. Upload
  //     addDebugLog("Preparing FormData for upload...");
  //     const formData = new FormData();
  //     formData.append("file", compressedFile);
  //     formData.append("orderId", orderId.toString());
  //     formData.append("gastoType", gastoType);

  //     addDebugLog("Sending upload request to server...");
  //     const res = await uploadReceipt(formData);

  //     if (res.success) {
  //       addDebugLog(`Upload success! Receipt ID: ${res.data?.id}`);
  //       setReceipts((prev) => [...prev, res.data]);

  //       // Force garbage collection if available (helps some Androids release memory)
  //       if (typeof window !== 'undefined' && (window as any).gc) {
  //         addDebugLog("Triggering manual GC");
  //         (window as any).gc();
  //       }

  //       toast.success("Éxito", {
  //         description: "Imagen subida exitosamente",
  //       });
  //     } else {
  //       addDebugLog(`Upload failed server-side: ${res.error}`);
  //       toast.error("Error al subir", {
  //         description: res.error,
  //       });
  //     }
  //   } catch (err: any) {
  //     console.error("Compression/Upload error:", err);
  //     addDebugLog(`EXCEPTION: ${err.message || JSON.stringify(err)}`);
  //     addDebugLog(`Stack: ${err.stack}`);
  //     toast.error("Error", {
  //       description: err.message || "No se pudo procesar la imagen.",
  //     });
  //   } finally {
  //     setCompressing(false);
  //     setUploading(false);
  //     addDebugLog("Process finished (finally block).");
  //   }
  // };

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
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-blue-700">
                  <DollarSign className="h-4 w-4" /> Administración
                </h3>
                {/* CLIENTE INFO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Capitana</FormLabel>
                        <Select
                          disabled={!canEdit("nombre")}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Clear apellido when nombre changes to force re-selection
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
                    control={form.control}
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
                              <SelectValue placeholder={nombreCliente ? "Seleccione apellido" : "Primero elija nombre"} />
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
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo</FormLabel>
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
                  {/* Captain Select moved to replace Name Input */}
                  <FormField
                    control={form.control}
                    name="cell"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
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
                                  format(new Date(field.value), "MMMM d, yyyy", { locale: es })
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
                    control={form.control}
                    name="pagoCapitana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pago Capitana</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value && Number(field.value) === 0 ? "" : (field.value as any)?.toString() ?? ""}
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
                            value={field.value && Number(field.value) === 0 ? "" : (field.value as any)?.toString() ?? ""}
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
                            value={field.value && Number(field.value) === 0 ? "" : (field.value as any)?.toString() ?? ""}
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
                            value={field.value && Number(field.value) === 0 ? "" : (field.value as any)?.toString() ?? ""}
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
                            value={Number(field.value) === 0 ? "" : String(field.value)}
                            className="bg-gray-100 cursor-not-allowed"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
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
                            value={Number(field.value) === 0 ? "" : String(field.value)}
                            className="bg-gray-200 font-bold"
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
                            value={Number(field.value) === 0 ? "" : String(field.value)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* CAPITANA */}
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
                            control={form.control}
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
                                    disabled={Number(saldoCliente) <= 0 || !canEdit("efectivo")}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  Efectivo
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
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
                                    disabled={Number(saldoCliente) <= 0 || !canEdit("transferir")}
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
                          control={form.control}
                          name="pagoRecibo"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Pago Recibo</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Monto"
                                  {...field}
                                  value={Number(field.value) === 0 ? "" : String(field.value)}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === ""
                                        ? 0
                                        : isNaN(e.target.valueAsNumber)
                                          ? 0
                                          : Math.floor(e.target.valueAsNumber)
                                    );
                                  }}
                                  disabled={Number(saldoCliente) <= 0 || !canEdit("pagoRecibo")}
                                  className={`w-full min-w-[150px]
                                    ${Number(saldoCliente) <= 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""} 
                                    ${isCaptain ? "opacity-75" : ""}
                                  `}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
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
                            className={
                              !canEdit("horaLlegado") ? "bg-gray-200" : ""
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
                                field.value && Number(field.value) === 0 ? "" : (field.value?.toString() ?? "")
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
                              className={`flex-1 ${!canEdit("combustible") ? "bg-gray-200" : ""
                                }`}
                              disabled={!canEdit("combustible")}
                            />
                            {orderId && isCaptain && (
                              <label className="cursor-pointer">
                                <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment" // Restored per user request
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
                                field.value && Number(field.value) === 0 ? "" : (field.value?.toString() ?? "")
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
                              className={`flex-1 ${!canEdit("hielo") ? "bg-gray-200" : ""
                                }`}
                              disabled={!canEdit("hielo")}
                            />
                            {orderId && isCaptain && (
                              <label className="cursor-pointer">
                                <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment" // Restored per user request
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
                                field.value && Number(field.value) === 0 ? "" : (field.value?.toString() ?? "")
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
                              className={`flex-1 ${!canEdit("aguaBebidas") ? "bg-gray-200" : ""
                                }`}
                              disabled={!canEdit("aguaBebidas")}
                            />
                            {orderId && isCaptain && (
                              <label className="cursor-pointer">
                                <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment" // Restored per user request
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
                                field.value && Number(field.value) === 0 ? "" : (field.value?.toString() ?? "")
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
                              className={`flex-1 ${!canEdit("gastoVarios") ? "bg-gray-200" : ""
                                }`}
                              disabled={!canEdit("gastoVarios")}
                            />
                            {orderId && isCaptain && (
                              <label className="cursor-pointer">
                                <Camera className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment" // Restored per user request
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
                  {/* Horas Extras Field */}
                  <FormField
                    control={form.control}
                    name="horasExtras"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horas Extras</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={Number(field.value) === 0 ? "" : (field.value?.toString() ?? "")}
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
                            control={form.control}
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
                                    disabled={Number(horasExtrasVal) <= 0 || !canEdit("horasExtrasEfectivo")}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  Efectivo
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
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
                                    disabled={Number(horasExtrasVal) <= 0 || !canEdit("horasExtrasTransferir")}
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
                          control={form.control}
                          name="pagoHorasExtra"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Pago Recibo</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Monto"
                                  {...field}
                                  value={field.value && Number(field.value) === 0 ? "" : (field.value as any)?.toString() ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === ""
                                        ? 0
                                        : isNaN(e.target.valueAsNumber)
                                          ? 0
                                          : Math.floor(e.target.valueAsNumber)
                                    );
                                  }}
                                  disabled={Number(horasExtrasVal) <= 0 || !canEdit("pagoHorasExtra")}
                                  className={`w-full min-w-[150px]
                                    ${Number(horasExtrasVal) <= 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""} 
                                    ${isCaptain ? "opacity-75" : ""}
                                  `}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
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

              </div>

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
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 cursor-pointer"
              onClick={closePhotoDialog}
            >
              <div className="relative max-w-4xl max-h-screen">
                <img
                  src={selectedPhoto}
                  alt="Enlarged receipt"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <button
                  onClick={closePhotoDialog}
                  className="absolute top-[-40px] right-0 text-white hover:text-gray-300"
                >
                  <span className="text-4xl">&times;</span>
                </button>
              </div>
            </div>
          )}

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
