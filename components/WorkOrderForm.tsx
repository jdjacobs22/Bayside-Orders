"use client";

import { useState, useEffect } from "react";
import {
  createWorkOrder,
  getWorkOrder,
  updateWorkOrder,
  uploadReceipt,
} from "@/app/actions/work-order";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface WorkOrderFormProps {
  mode?: "admin-create" | "admin-edit" | "captain-edit";
  orderId?: number;
}

export default function WorkOrderForm({
  mode = "admin-create",
  orderId,
}: WorkOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    fecha: new Date().toISOString().split("T")[0],
    horaSalida: "",
    destino: "",
    puntoEncuentro: "",
    pasajeros: 0,
    detallesNotas: "",
    combustibleCost: 0,
    hieloCost: 0,
    aguaBebidasCost: 0,
    gastoVariosCost: 0,
    pagoCapitana: 0,
    pagoMarinero: 0,
    precioAcordado: 0,
    horasAcordadas: 0,
    deposito: 0,
  });

  // Load data for edit modes
  useEffect(() => {
    if (orderId && (mode === "admin-edit" || mode === "captain-edit")) {
      setLoading(true);
      getWorkOrder(orderId).then((res) => {
        if (res.success && res.data) {
          const data = res.data;
          setFormData({
            nombre: data.nombre || "",
            fecha: data.fecha
              ? new Date(data.fecha).toISOString().split("T")[0]
              : "",
            horaSalida: data.horaSalida || "",
            destino: data.destino || "",
            puntoEncuentro: data.puntoEncuentro || "",
            pasajeros: data.pasajeros || 0,
            detallesNotas: data.detallesNotas || "",
            combustibleCost: data.combustible || 0,
            hieloCost: data.hielo || 0,
            aguaBebidasCost: data.aguaBebidas || 0,
            gastoVariosCost: data.gastoVarios || 0,
            pagoCapitana: data.pagoCapitana || 0,
            pagoMarinero: data.pagoMarinero || 0,
            precioAcordado: data.precioAcordado || 0,
            horasAcordadas: data.horasAcordadas || 0,
            deposito: data.deposito || 0,
          });
          if (data.receipts) setReceipts(data.receipts);
        } else {
          alert("Error cargando orden: " + res.error);
        }
        setLoading(false);
      });
    }
  }, [orderId, mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      // For number inputs: if empty, set to 0; otherwise parse the value
      // This prevents leading zeros and ensures clean number display
      if (type === "number") {
        const numValue = value === "" ? 0 : parseFloat(value);
        return {
          ...prev,
          [name]: isNaN(numValue) ? 0 : numValue,
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const calculateTotal = () => {
    return (
      (formData.combustibleCost || 0) +
      (formData.hieloCost || 0) +
      (formData.aguaBebidasCost || 0) +
      (formData.gastoVariosCost || 0) +
      (formData.pagoCapitana || 0) +
      (formData.pagoMarinero || 0)
    );
  };

  const calculateBalance = () => {
    const total = calculateTotal();
    return total - (formData.deposito || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const total = calculateTotal();
    const balance = calculateBalance();

    const submissionData = {
      ...formData,
      costoTotal: total,
      saldoCliente: balance,
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
    setLoading(false);
  };

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [currentGastoType, setCurrentGastoType] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  /**
   * Compress an image file to reduce upload size
   * Target: ~1MB or less for fast mobile uploads
   */
  const compressImage = async (file: File): Promise<File> => {
    // Skip compression for non-image files
    if (!file.type.startsWith("image/")) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      // Create blob URL and store it for cleanup
      const blobUrl = URL.createObjectURL(file);

      img.onload = () => {
        // Revoke blob URL immediately after image loads to free memory
        URL.revokeObjectURL(blobUrl);

        // Calculate new dimensions - max 1920px on longest side
        const maxDimension = 1920;
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

        // Draw image onto canvas
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality setting (0.7 = 70% quality)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File from the blob
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              console.log(
                `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
              );
              resolve(compressedFile);
            } else {
              // If compression fails, return original
              resolve(file);
            }
          },
          "image/jpeg",
          0.7 // Quality: 0.7 = 70%
        );
      };

      img.onerror = () => {
        // Revoke blob URL on error as well to prevent memory leak
        URL.revokeObjectURL(blobUrl);
        console.error("Failed to load image for compression");
        resolve(file); // Return original on error
      };

      // Load the image from the file
      img.src = blobUrl;
    });
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    gastoType: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      // Reset input value immediately to allow re-selecting the same file
      e.target.value = "";

      // For large images that need compression, set compressing state FIRST
      // to prevent flash of form between clearing preview and showing compressing modal
      const needsCompression =
        originalFile.type.startsWith("image/") &&
        originalFile.size > 1024 * 1024;

      if (needsCompression) {
        // Store old preview URL for cleanup after compression
        const oldPreviewUrl = previewUrl;

        // Set compressing state FIRST - this will hide preview modal (due to !compressing condition)
        // and show compressing modal, preventing any flash of the form
        // Since preview modal condition is: previewUrl && currentGastoType && !compressing
        // when compressing=true, preview modal won't render regardless of previewUrl value
        setCurrentGastoType(gastoType);
        setCompressing(true);
        setPendingFile(null);
        // Don't clear previewUrl immediately - let it stay until we have the new one
        // This prevents any visual flash during state transition

        try {
          const compressedFile = await compressImage(originalFile);
          // Now that we have the new preview, clear the old one and set the new one
          if (oldPreviewUrl) {
            URL.revokeObjectURL(oldPreviewUrl);
          }
          setPendingFile(compressedFile);
          setPreviewUrl(URL.createObjectURL(compressedFile));
        } catch (err) {
          console.error("Compression error:", err);
          // On error, clear old preview and set new one
          if (oldPreviewUrl) {
            URL.revokeObjectURL(oldPreviewUrl);
          }
          setPendingFile(originalFile);
          setPreviewUrl(URL.createObjectURL(originalFile));
        } finally {
          setCompressing(false);
        }
      } else {
        // Small file or non-image, no compression needed
        // Clear previous preview first
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setPendingFile(null);
        // Then set new preview
        setCurrentGastoType(gastoType);
        setPendingFile(originalFile);
        setPreviewUrl(URL.createObjectURL(originalFile));
      }
    }
  };

  const confirmUpload = async () => {
    if (!pendingFile || !orderId || !currentGastoType) return;

    setUploading(true);

    // Helper to clean up state
    const cleanupState = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(null);
      setPreviewUrl(null);
      setCurrentGastoType(null);
      setUploading(false);
    };

    try {
      // Save Form Data First
      const total = calculateTotal();
      const balance = calculateBalance();

      const submissionData = {
        ...formData,
        costoTotal: total,
        saldoCliente: balance,
      };

      const saveRes = await updateWorkOrder(orderId, submissionData);
      if (!saveRes.success) {
        alert("Error guardando datos: " + saveRes.error);
        cleanupState();
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", pendingFile);
      formDataUpload.append("orderId", orderId.toString());
      formDataUpload.append("gastoType", currentGastoType);

      console.log(
        `Uploading file: ${pendingFile.name}, size: ${(pendingFile.size / 1024 / 1024).toFixed(2)}MB`
      );

      const res = await uploadReceipt(formDataUpload);

      if (res.success) {
        setReceipts((prev) => [...prev, res.data]);
        console.log("Upload successful:", res.data?.url);
        cleanupState();
      } else {
        alert("Error al subir: " + res.error);
        cleanupState();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      // Handle network timeouts and unexpected errors
      const errorMessage =
        error?.message || "Error de conexión. Intenta de nuevo.";
      alert("Error: " + errorMessage);
      cleanupState();
    }
  };

  const rejectPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setCurrentGastoType(null);
    // User stays on form, can click camera button again
  };

  const handleCancel = () => {
    if (
      confirm(
        "¿Estás seguro de que deseas cancelar? Los datos no guardados se perderán."
      )
    ) {
      router.push("/admin");
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setCreatedOrderId(null);
    router.push("/admin");
  };

  // Get receipts grouped by gasto type
  const getReceiptsByGasto = (gastoType: string) => {
    return receipts.filter((r) => r.gastoType === gastoType);
  };

  const handlePhotoClick = (url: string) => {
    setSelectedPhoto(url);
  };

  const closePhotoDialog = () => {
    setSelectedPhoto(null);
  };

  // Field Access Logic
  const isCaptain = mode === "captain-edit";
  // Captain can ONLY edit: Details/Notas, Combustible, Hielo, Agua/Bebidas, Gasto Varios
  // Admin can edit ALL.
  const canEdit = (fieldName: string) => {
    if (!isCaptain) return true; // Admin creates/edits all
    const allowed = [
      "detallesNotas",
      "combustibleCost",
      "hieloCost",
      "aguaBebidasCost",
      "gastoVariosCost",
    ];
    return allowed.includes(fieldName);
  };

  if (loading && !formData.nombre)
    return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="bg-white rounded shadow-sm max-w-lg mx-auto overflow-hidden">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <h2 className="text-xl font-bold bg-blue-600 text-white -m-4 mb-4 p-4">
          {mode === "admin-create"
            ? "Nueva Orden de Trabajo"
            : `Orden #${orderId || ""}`}
        </h2>

        {/* Basic Info Group */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Orden #
            </label>
            <input
              value={orderId ? orderId.toString() : "Generada al guardar"}
              disabled
              className="w-full border p-3 rounded bg-gray-200 text-lg font-mono text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Nombre Cliente
            </label>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              disabled={!canEdit("nombre")}
              className="w-full border p-3 rounded bg-gray-50 text-lg disabled:bg-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                disabled={!canEdit("fecha")}
                className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">
                Hora
              </label>
              <input
                type="time"
                name="horaSalida"
                value={formData.horaSalida}
                onChange={handleChange}
                disabled={!canEdit("horaSalida")}
                className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Destino
            </label>
            <input
              name="destino"
              value={formData.destino}
              onChange={handleChange}
              disabled={!canEdit("destino")}
              className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Punto Encuentro
            </label>
            <input
              name="puntoEncuentro"
              value={formData.puntoEncuentro}
              onChange={handleChange}
              disabled={!canEdit("puntoEncuentro")}
              className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Pasajeros
            </label>
            <input
              type="number"
              name="pasajeros"
              value={formData.pasajeros === 0 ? "" : formData.pasajeros}
              onChange={handleChange}
              disabled={!canEdit("pasajeros")}
              className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200"
            />
          </div>
        </div>

        <hr className="my-4 border-t-2" />

        {/* Captain Editable Section - Expenses */}
        <div>
          <h3 className="font-bold text-lg mb-2 text-blue-800">Gastos</h3>
          <div className="space-y-4">
            {/* Combustible */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Combustible
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  name="combustibleCost"
                  value={
                    formData.combustibleCost === 0
                      ? ""
                      : formData.combustibleCost
                  }
                  onChange={handleChange}
                  disabled={!canEdit("combustibleCost")}
                  className="flex-1 border p-3 rounded font-mono text-lg"
                />
                {isCaptain && orderId && (
                  <label className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded cursor-pointer transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileSelect(e, "combustible")}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              {isCaptain && getReceiptsByGasto("combustible").length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getReceiptsByGasto("combustible").map(
                    (r: any, i: number) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
                      >
                        <img
                          src={r.url}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Hielo */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Hielo
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  name="hieloCost"
                  value={formData.hieloCost === 0 ? "" : formData.hieloCost}
                  onChange={handleChange}
                  disabled={!canEdit("hieloCost")}
                  className="flex-1 border p-3 rounded font-mono text-lg"
                />
                {isCaptain && orderId && (
                  <label className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded cursor-pointer transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
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
              {isCaptain && getReceiptsByGasto("hielo").length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getReceiptsByGasto("hielo").map((r: any, i: number) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
                    >
                      <img
                        src={r.url}
                        alt="Receipt"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Agua/Bebidas */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Agua/Bebidas
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  name="aguaBebidasCost"
                  value={
                    formData.aguaBebidasCost === 0
                      ? ""
                      : formData.aguaBebidasCost
                  }
                  onChange={handleChange}
                  disabled={!canEdit("aguaBebidasCost")}
                  className="flex-1 border p-3 rounded font-mono text-lg"
                />
                {isCaptain && orderId && (
                  <label className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded cursor-pointer transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileSelect(e, "aguaBebidas")}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              {isCaptain && getReceiptsByGasto("aguaBebidas").length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getReceiptsByGasto("aguaBebidas").map(
                    (r: any, i: number) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
                      >
                        <img
                          src={r.url}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Gasto Varios */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Gasto Varios
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  name="gastoVariosCost"
                  value={
                    formData.gastoVariosCost === 0
                      ? ""
                      : formData.gastoVariosCost
                  }
                  onChange={handleChange}
                  disabled={!canEdit("gastoVariosCost")}
                  className="flex-1 border p-3 rounded font-mono text-lg"
                />
                {isCaptain && orderId && (
                  <label className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded cursor-pointer transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileSelect(e, "gastoVarios")}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              {isCaptain && getReceiptsByGasto("gastoVarios").length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getReceiptsByGasto("gastoVarios").map(
                    (r: any, i: number) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-16 h-16 bg-gray-300 rounded overflow-hidden border hover:border-blue-500"
                      >
                        <img
                          src={r.url}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2">
          <label className="block text-sm font-bold text-gray-700">
            Detalles / Notas
          </label>
          <textarea
            name="detallesNotas"
            value={formData.detallesNotas}
            onChange={handleChange}
            disabled={!canEdit("detallesNotas")}
            rows={4}
            className="w-full border p-3 rounded"
            placeholder="Agregar notas aquí..."
          />
        </div>

        {/* Admin Receipts Section - Grouped by Gasto */}
        {mode === "admin-edit" && receipts.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
            <h3 className="font-bold text-sm mb-4 uppercase text-gray-600">
              Comprobantes por Gasto
            </h3>

            {(() => {
              const gastoTypes = [
                { key: "combustible", label: "Combustible" },
                { key: "hielo", label: "Hielo" },
                { key: "aguaBebidas", label: "Agua/Bebidas" },
                { key: "gastoVarios", label: "Gasto Varios" },
              ];

              return gastoTypes.map(({ key, label }) => {
                const gastoReceipts = getReceiptsByGasto(key);
                if (gastoReceipts.length === 0) return null;

                return (
                  <div key={key} className="mb-4 last:mb-0">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      {label}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {gastoReceipts.map((r: any, i: number) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handlePhotoClick(r.url)}
                          className="block w-full aspect-square bg-gray-300 rounded overflow-hidden relative border hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <img
                            src={r.url}
                            alt={`${label} Receipt ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Show receipts without gastoType */}
            {(() => {
              const ungroupedReceipts = receipts.filter(
                (r: any) => !r.gastoType || r.gastoType === null
              );
              if (ungroupedReceipts.length === 0) return null;

              return (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                    Otros Comprobantes
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {ungroupedReceipts.map((r: any, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handlePhotoClick(r.url)}
                        className="block w-full aspect-square bg-gray-300 rounded overflow-hidden relative border hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <img
                          src={r.url}
                          alt={`Receipt ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Compressing Modal */}
        {compressing && currentGastoType && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-lg font-bold text-gray-700">
                Comprimiendo imagen...
              </p>
              <p className="text-sm text-gray-500">
                Esto mejora la velocidad de subida
              </p>
            </div>
          </div>
        )}

        {/* Photo Preview Modal */}
        {previewUrl && currentGastoType && !compressing && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-2 bg-gray-100 font-bold text-center">
                Revisar Foto -{" "}
                {currentGastoType === "combustible"
                  ? "Combustible"
                  : currentGastoType === "hielo"
                    ? "Hielo"
                    : currentGastoType === "aguaBebidas"
                      ? "Agua/Bebidas"
                      : currentGastoType === "gastoVarios"
                        ? "Gasto Varios"
                        : "General"}
              </div>
              <div className="flex-1 overflow-auto bg-black flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              {/* Show file size info */}
              {pendingFile && (
                <div className="text-center text-xs text-gray-500 py-1 bg-gray-50">
                  Tamaño: {(pendingFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
              <div className="p-4 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={rejectPhoto}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700"
                >
                  Rechazar / Retomar
                </button>
                <button
                  type="button"
                  onClick={confirmUpload}
                  disabled={uploading}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 flex justify-center items-center"
                >
                  {uploading ? "Subiendo..." : "Aprobar (Subir)"}
                </button>
              </div>
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

        <hr className="my-4 border-t-2" />

        {/* Admin Payments Section */}
        <div className="opacity-90">
          <h3 className="font-bold text-lg mb-2 text-green-800">
            Pagos (Solo Admin)
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* New Fields */}
            <div>
              <label className="block text-sm font-bold text-gray-700">
                Precio Acordado
              </label>
              <input
                type="number"
                name="precioAcordado"
                value={
                  formData.precioAcordado === 0 ? "" : formData.precioAcordado
                }
                onChange={handleChange}
                disabled={!canEdit("precioAcordado")}
                className="w-full border p-2 rounded bg-gray-50 disabled:bg-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">
                Horas Acordadas
              </label>
              <input
                type="number"
                name="horasAcordadas"
                value={
                  formData.horasAcordadas === 0 ? "" : formData.horasAcordadas
                }
                onChange={handleChange}
                disabled={!canEdit("horasAcordadas")}
                className="w-full border p-2 rounded bg-gray-50 disabled:bg-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700">
                Pago Capitana
              </label>
              <input
                type="number"
                name="pagoCapitana"
                value={formData.pagoCapitana === 0 ? "" : formData.pagoCapitana}
                onChange={handleChange}
                disabled={!canEdit("pagoCapitana")}
                className="w-full border p-2 rounded bg-gray-50 disabled:bg-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">
                Pago Marinero
              </label>
              <input
                type="number"
                name="pagoMarinero"
                value={formData.pagoMarinero === 0 ? "" : formData.pagoMarinero}
                onChange={handleChange}
                disabled={!canEdit("pagoMarinero")}
                className="w-full border p-2 rounded bg-gray-50 disabled:bg-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
          <div className="flex justify-between font-bold text-lg">
            <span>Costo Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-medium">Deposito</label>
            <input
              type="number"
              name="deposito"
              value={formData.deposito === 0 ? "" : formData.deposito}
              onChange={handleChange}
              disabled={!canEdit("deposito")}
              className="w-full border p-2 rounded bg-white disabled:bg-gray-200"
            />
          </div>

          <div className="flex justify-between font-bold mt-4 text-xl text-blue-900 border-t pt-2 border-blue-200">
            <span>Saldo Cliente a Pagar:</span>
            <span>${calculateBalance().toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-4 mt-6 mb-8">
          {mode === "admin-create" && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white p-4 rounded-lg font-bold text-xl hover:bg-gray-600 shadow-lg uppercase tracking-wide disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`${
              mode === "admin-create" ? "flex-1" : "w-full"
            } bg-green-600 text-white p-4 rounded-lg font-bold text-xl hover:bg-green-700 shadow-lg uppercase tracking-wide disabled:bg-green-400 disabled:cursor-not-allowed`}
          >
            {loading
              ? "Guardando..."
              : mode === "admin-create"
                ? "Crear Orden"
                : "Guardar & Cerrar"}
          </button>
        </div>
      </form>

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
                La orden ha sido creada con el número:
              </p>
              <p className="text-4xl font-bold text-blue-600 mb-6">
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
    </div>
  );
}
