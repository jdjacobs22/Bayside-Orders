"use client";

interface PhotoDialogProps {
  photo: string | null;
  onClose: () => void;
}

export function PhotoDialog({ photo, onClose }: PhotoDialogProps) {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-screen">
        <img
          src={photo}
          alt="Enlarged receipt"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute top-[-40px] right-0 text-white hover:text-gray-300"
        >
          <span className="text-4xl">&times;</span>
        </button>
      </div>
    </div>
  );
}
