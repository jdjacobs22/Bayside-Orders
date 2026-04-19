"use client";

interface CompressingModalProps {
  open: boolean;
}

export function CompressingModal({ open }: CompressingModalProps) {
  if (!open) return null;

  return (
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
  );
}
