import React from "react";
import { X } from "lucide-react";

export default function ImageLightboxModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={imageUrl}
          alt="Phóng to ảnh"
          className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/600x400?text=Khong+Tai+Duoc+Anh";
          }}
        />
      </div>
    </div>
  );
}
