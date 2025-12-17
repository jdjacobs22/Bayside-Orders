"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

// 📸 NEW CAMERA LOGIC: Interface for file transfer
interface CapturedFile {
  blob: Blob;
  name: string;
}

export default function WorkOrderForm({
  mode = "admin-create",
  orderId,
}: WorkOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);

  // 📸 NEW CAMERA LOGIC: Refs and State for Camera Stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // 📸 MODIFIED STATE: pendingFile now accepts Blob or File
  const [pendingFile, setPendingFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [currentGastoType, setCurrentGastoType] = useState<string | null>(null);

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

  // Load data for edit modes (Original Logic)
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

  // Debug: Monitor preview state changes
  useEffect(() => {
    console.log("Preview state changed", {
      hasPreviewUrl: !!previewUrl,
      previewUrl: previewUrl?.substring(0, 50) + "...",
      currentGastoType,
      hasPendingFile: !!pendingFile,
      pendingFileType:
        pendingFile instanceof File
          ? "File"
          : pendingFile instanceof Blob
            ? "Blob"
            : "null",
      modalShouldShow: !!(previewUrl && currentGastoType),
    });
  }, [previewUrl, currentGastoType, pendingFile]);

  // ??
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
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

  // --- Original handleSubmit Logic ---
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
        return;
      }
      result = await updateWorkOrder(orderId, submissionData);
    }

    if (result.success) {
      alert(mode === "admin-create" ? "Orden Creada!" : "Orden Actualizada!");
      if (mode === "admin-create") {
        setFormData({
          nombre: "",
          fecha: "",
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
          deposito: 0,
          precioAcordado: 0,
          horasAcordadas: 0,
        } as any);
        router.push("/admin/list");
      } else if (mode === "captain-edit") {
        await authClient.signOut();
        router.push("/");
      } else {
        router.push("/admin/list");
      }
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  // --- Original handleFileSelect Logic (for gallery/files) ---
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    gastoType: string
  ) => {
    const fileInput = e.target;
    const files = fileInput.files;

    console.log("handleFileSelect called", {
      hasFiles: !!files,
      fileCount: files?.length || 0,
      gastoType,
      firstFile: files?.[0]
        ? {
            name: files[0].name,
            size: files[0].size,
            type: files[0].type,
            lastModified: files[0].lastModified,
          }
        : null,
    });

    if (files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);

      console.log("Setting state in handleFileSelect", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        gastoType,
        previewUrlCreated: !!previewUrl,
        previewUrlPrefix: previewUrl.substring(0, 20),
      });

      // Set all state immediately - React will batch these updates
      setPendingFile(file);
      setPreviewUrl(previewUrl);
      setCurrentGastoType(gastoType);

      console.log(
        "State setters called - React will batch and update in next render"
      );
    } else {
      console.error("handleFileSelect: No file selected", {
        hasFiles: !!files,
        fileCount: files?.length || 0,
        inputValue: fileInput.value,
      });
      // Clear state if no file was selected (user cancelled)
      setPendingFile(null);
      setPreviewUrl(null);
      setCurrentGastoType(null);
    }

    // Reset input value AFTER processing to allow re-selecting the same file
    // This must happen after we've read the files
    fileInput.value = "";
  };

  // ----------------------------------------------------------------------------------
  // 📸 NEW CAMERA LOGIC: Core Media Devices API Functions
  // ----------------------------------------------------------------------------------

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    // Cleanup function to stop the stream when the component is unmounted
    return () => {
        stopStream();
        // Important Fix:  Revoke any pending preview URL on unmount
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        // jdj commented below out because not sure it was present before his changes
        // setPendingFile(null);
        // setPreviewUrl(null);
        // setCurrentGastoType(null);
    };
  }, [stopStream, previewUrl]);

  const startCamera = useCallback(
    async (gastoType: string) => {
      // Takes gastoType
      setCameraError(null);
      stopStream();

      try {
        // 1. Get initial permissions
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        // 2. Enumerate and find the rear camera ID
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");

        let rearCameraId: string | undefined;

        const rearCamera = videoInputs.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
        );

        rearCameraId = rearCamera
          ? rearCamera.deviceId
          : videoInputs[videoInputs.length - 1]?.deviceId;

        if (!rearCameraId) {
          throw new Error("No video input devices found.");
        }

        // 3. Request the stream using the specific device ID and resolution constraints (Memory Fix)
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            deviceId: { exact: rearCameraId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setCurrentGastoType(gastoType); // Set the context here

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (e) {
        console.error("Camera access failed:", e);
        setCameraError("Fallo al acceder la cámara. Verifique permisos.");
        setIsCameraActive(false);
      }
    },
    [stopStream]
  );

  // New takePhoto (below) resizes canvas
  // const takePhoto = useCallback(() => {
  //     const video = videoRef.current;
  //     const canvas = canvasRef.current;

  //     if (!video || !canvas || !streamRef.current || !currentGastoType) {
  //         setCameraError("Stream no activo o tipo de gasto no definido.");
  //         return;
  //     }

  //     // Set canvas dimensions and draw frame
  //     canvas.width = video.videoWidth;
  //     canvas.height = video.videoHeight;
  //     const ctx = canvas.getContext('2d');
  //     if (!ctx) return;
  //     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //     // Convert to Blob and handle the file
  //     canvas.toBlob((blob) => {
  //         if (blob) {
  //             setPendingFile(blob);
  //             setPreviewUrl(URL.createObjectURL(blob));

  //             // STOP the stream and close the video view immediately after capture
  //             stopStream();

  //         } else {
  //             setCameraError("Fallo al crear el archivo de la imagen.");
  //         }
  //     }, 'image/jpeg', 0.95);

  // }, [currentGastoType, stopStream]);

  // ----------------------------------------------------------------------------------
  // 📸 NEW UTILITY: Client-Side Image Resizing
  // ----------------------------------------------------------------------------------

  /**
   * Resizes the image contained in the source Canvas element to a maximum dimension
   * and converts it back to a Blob with specified JPEG quality.
   * @param sourceCanvas The canvas containing the captured image.
   * @param maxWidth The maximum width for the resized image.
   * @param maxHeight The maximum height for the resized image.
   * @param quality The JPEG quality (0.0 to 1.0).
   * @returns A promise that resolves to the resized Blob.
   */
  function resizeImage(
    sourceCanvas: HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      const width = sourceCanvas.width;
      const height = sourceCanvas.height;

      let newWidth = width;
      let newHeight = height;

      // Calculate the ratio and check if resizing is needed
      if (width > height) {
        if (width > maxWidth) {
          newHeight = height * (maxWidth / width);
          newWidth = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          newWidth = width * (maxHeight / height);
          newHeight = maxHeight;
        }
      }

      // Skip resizing if the image is already small enough
      if (newWidth === width && newHeight === height) {
        console.log("Image size OK, skipping resize.");
        sourceCanvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
        return;
      }

      // Create a temporary canvas for resizing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;

      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) {
        console.error("Could not get 2D context for resizing.");
        return resolve(null);
      }

      // Draw the image from the source canvas onto the new dimensions
      tempCtx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);

      // Convert the resized canvas to a Blob with lower quality
      tempCanvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });
  }

  // New takePhoto resizses photo to avoid hang on large photos
  // L261: Original start of takePhoto
  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current || !currentGastoType) {
      setCameraError("Stream no activo o tipo de gasto no definido.");
      return;
    }

    // Set canvas dimensions and draw frame from video (Full Resolution)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // STOP the stream and close the video view immediately after capture
    // Important: Do this BEFORE the potentially long resizing step
    stopStream();

    // 📸 MODIFIED LOGIC: Resize and Compress the image before setting state
    // We target a max dimension (e.g., 1280px) and 0.8 JPEG quality
    resizeImage(canvas, 1280, 1280, 0.8)
      .then((resizedBlob) => {
        if (resizedBlob) {
          // Log the new, smaller size for debugging
          console.log(
            `Resized photo created: ${resizedBlob.size} bytes (${(resizedBlob.size / (1024 * 1024)).toFixed(2)}MB)`
          );

          // Set state with the new, smaller Blob
          setPendingFile(resizedBlob);
          setPreviewUrl(URL.createObjectURL(resizedBlob));
        } else {
          setCameraError(
            "Fallo al crear el archivo de la imagen o al redimensionar."
          );
        }
      })
      .catch((e) => {
        console.error("Error during photo processing/resizing:", e);
        setCameraError("Error al procesar la imagen.");
      });
  }, [currentGastoType, stopStream]);

  // ----------------------------------------------------------------------------------
  // 🔄 MODIFIED: confirmUpload Logic
  // ----------------------------------------------------------------------------------

  const confirmUpload = async () => {

    // #endregion
    if (!pendingFile || !orderId || !currentGastoType) return;

    setUploading(true);



    try {
      // 1. Convert Blob (from camera) to File object if necessary
      const fileName = `receipt-${currentGastoType}-${Date.now()}.jpg`;
      const fileToUpload =
        pendingFile instanceof Blob
          ? new File([pendingFile], fileName, { type: pendingFile.type })
          : pendingFile; // If it was already a File from handleFileSelect

      // 2. Save Form Data First (Original Logic)

      const total = calculateTotal();
      const balance = calculateBalance();



      const submissionData = {
        ...formData,
        costoTotal: total,
        saldoCliente: balance,
      };

 

      if (!saveRes.success) {
        alert("Error guardando datos: " + saveRes.error);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPendingFile(null);
        setPreviewUrl(null);
        setCurrentGastoType(null);
        setUploading(false);

        return;
      }

      // 3. Upload Receipt (Original Logic)
      const formDataUpload = new FormData();
      formDataUpload.append("file", fileToUpload);
      formDataUpload.append("orderId", orderId.toString());
      formDataUpload.append("gastoType", currentGastoType);


      const res = await uploadReceipt(formDataUpload);

 

      if (res.success && res.data) {
        // Reset state IMMEDIATELY to close modal and update UI
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPendingFile(null);
        setPreviewUrl(null);
        setCurrentGastoType(null);
        setUploading(false);

        // Optimistically add receipt to state for immediate UI update
        setReceipts((prev) => [...prev, res.data]);

        // Refetch work order data in the background to ensure consistency
        // Don't await - let it happen asynchronously so UI doesn't hang
        if (orderId) {
          getWorkOrder(orderId)
            .then((refreshedOrder) => {
              if (refreshedOrder.success && refreshedOrder.data?.receipts) {
                // Update receipts with server data once available
                setReceipts(refreshedOrder.data.receipts);
              }
              // Refresh the router to ensure cache is updated
              router.refresh();
            })
            .catch((refreshError) => {
              console.error(
                "Error refreshing receipts (non-fatal):",
                refreshError
              );
              // State already updated optimistically above, so UI is fine
            });
        }
      } else {
        const errorMsg = res.error || "Error desconocido al subir la foto";
        console.error("Upload failed:", errorMsg);
        alert("Error al subir: " + errorMsg);
        // Clean up state on error
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPendingFile(null);
        setPreviewUrl(null);
        setCurrentGastoType(null);
        setUploading(false);
      }
    } catch (err: any) {

      console.error("Error in confirmUpload:", err);
      alert(
        "Error inesperado: " + (err?.message || "Por favor intente nuevamente")
      );
      // Reset state on exception
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(null);
      setPreviewUrl(null);
      setCurrentGastoType(null);
      setUploading(false);
    }
  };

  const rejectPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setCurrentGastoType(null);
  };

  // --- Original Utility Functions ---
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

        {/* Basic Info Group (Original Logic) */}
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
              value={formData.pasajeros}
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

          {/* 📸 NEW CAMERA LOGIC: Conditional Live Camera View */}
          {isCameraActive && (
            <div className="bg-gray-800 p-3 rounded-lg mb-4 text-center">
              <p className="text-white mb-2">
                Captura de Recibo: **{currentGastoType}**
              </p>
              {cameraError && (
                <p className="text-sm text-red-500 mb-2">
                  Error de Cámara: {cameraError}
                </p>
              )}
              <video
                ref={videoRef}
                className="w-full rounded-md"
                autoPlay
                playsInline
                muted
              />
              <button
                type="button"
                onClick={takePhoto}
                className="w-full bg-green-500 text-white p-2 mt-3 rounded font-bold hover:bg-green-600"
                disabled={uploading}
              >
                📸 Tomar Foto
              </button>
              <button
                type="button"
                onClick={stopStream}
                className="w-full bg-red-500 text-white p-2 mt-2 rounded hover:bg-red-600"
              >
                Cerrar Cámara
              </button>
            </div>
          )}

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
                  value={formData.combustibleCost}
                  onChange={handleChange}
                  disabled={!canEdit("combustibleCost")}
                  className="flex-1 border p-3 rounded font-mono text-lg"
                />
                {isCaptain && orderId && !isCameraActive && (
                  <CameraButtons
                    gastoType="combustible"
                    startCamera={startCamera}
                    handleFileSelect={handleFileSelect}
                    uploading={uploading}
                  />
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
                  value={formData.hieloCost}
                  onChange={handleChange}
                  disabled={!canEdit("hieloCost")}
                  className="flex-1 border p-3 rounded font-mono text-lg"
                />
                {isCaptain && orderId && !isCameraActive && (
                  <CameraButtons
                    gastoType="hielo"
                    startCamera={startCamera}
                    handleFileSelect={handleFileSelect}
                    uploading={uploading}
                  />
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
                  value={formData.aguaBebidasCost}
                  onChange={handleChange}
                  disabled={!canEdit("aguaBebidasCost")}
                  className="flex-1 border p-3 rounded font-mono text-lg"
                />
                {isCaptain && orderId && !isCameraActive && (
                  <CameraButtons
                    gastoType="aguaBebidas"
                    startCamera={startCamera}
                    handleFileSelect={handleFileSelect}
                    uploading={uploading}
                  />
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
                  value={formData.gastoVariosCost}
                  onChange={handleChange}
                  disabled={!canEdit("gastoVariosCost")}
                  className="flex-1 border p-3 rounded font-mono text-lg"
                />
                {isCaptain && orderId && !isCameraActive && (
                  <CameraButtons
                    gastoType="gastoVarios"
                    startCamera={startCamera}
                    handleFileSelect={handleFileSelect}
                    uploading={uploading}
                  />
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

        {/* Admin Receipts Section - Grouped by Gasto (Original Logic) */}
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

        {/* Photo Preview Modal (Original Logic, handles camera output now) */}
        {(() => {
          const shouldShow = !!(previewUrl && currentGastoType);
          console.log("Modal render check", {
            shouldShow,
            hasPreviewUrl: !!previewUrl,
            hasCurrentGastoType: !!currentGastoType,
            previewUrlValue: previewUrl,
            currentGastoTypeValue: currentGastoType,
          });
          return shouldShow;
        })() && (
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
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-[60vh] object-contain"
                    onLoad={() =>
                      console.log("Preview image loaded successfully")
                    }
                    onError={(e) =>
                      console.error("Preview image failed to load", e)
                    }
                  />
                )}
              </div>
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
                  onClick={() => {
                    console.log("Subir button clicked, calling confirmUpload");
                    confirmUpload();
                  }}
                  disabled={uploading}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 flex justify-center items-center"
                >
                  {uploading ? "Subiendo..." : "Aprobar (Subir)"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Enlargement Dialog (Original Logic) */}
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

        {/* 📸 NEW CAMERA LOGIC: Hidden Canvas Ref */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <hr className="my-4 border-t-2" />

        {/* Admin Payments Section (Original Logic) */}
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
                value={formData.precioAcordado}
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
                value={formData.horasAcordadas}
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
                value={formData.pagoCapitana}
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
                value={formData.pagoMarinero}
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
              value={formData.deposito}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white p-4 rounded-lg font-bold text-xl hover:bg-green-700 mt-6 shadow-lg mb-8 uppercase tracking-wide"
        >
          {loading
            ? "Guardando..."
            : mode === "admin-create"
              ? "Crear Orden"
              : "Guardar & Cerrar"}
        </button>
      </form>
    </div>
  );
}

// 📸 NEW HELPER COMPONENT: Extracted to keep the main JSX clean and DRY
interface CameraButtonsProps {
  gastoType: string;
  startCamera: (gastoType: string) => void;
  handleFileSelect: (
    e: React.ChangeEvent<HTMLInputElement>,
    gastoType: string
  ) => void;
  uploading: boolean;
}

const CameraButtons: React.FC<CameraButtonsProps> = ({
  gastoType,
  startCamera,
  handleFileSelect,
  uploading,
}) => (
  <>
    {/* Button 1: Reliable Camera (Media Devices API) */}
    <button
      type="button"
      onClick={() => startCamera(gastoType)}
      disabled={uploading}
      className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded cursor-pointer transition"
    >
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
    </button>
    {/* Button 2: File Picker/Gallery (Original Logic) */}
    <label className="flex-shrink-0 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white p-3 rounded cursor-pointer transition">
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          console.log("File input onChange triggered", {
            gastoType,
            hasFiles: !!e.target.files,
            fileCount: e.target.files?.length || 0,
          });
          handleFileSelect(e, gastoType);
        }}
        onClick={(e) => {
          console.log("File input clicked", { gastoType });
          // Ensure we can select files even if disabled state is inconsistent
          if (uploading) {
            e.preventDefault();
            console.warn("File input clicked but uploading is true");
          }
        }}
        className="hidden"
        disabled={uploading}
      />
    </label>
  </>
);
