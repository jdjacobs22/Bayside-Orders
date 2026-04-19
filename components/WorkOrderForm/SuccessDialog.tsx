"use client";

interface SuccessDialogProps {
  open: boolean;
  orderId: number | null;
  onClose: () => void;
}

export function SuccessDialog({ open, orderId, onClose }: SuccessDialogProps) {
  if (!open || !orderId) return null;

  return (
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
            #{orderId}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
