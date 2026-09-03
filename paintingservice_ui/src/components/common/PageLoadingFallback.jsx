import React from "react";
import { Paintbrush, Loader2 } from "lucide-react";

export default function PageLoadingFallback({ message = "Đang tải trang..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-6 animate-fade-in">
      <div className="relative flex items-center justify-center mb-4">
        {/* Vòng xoay ngoài */}
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        {/* Icon thương hiệu ở giữa */}
        <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
          <Paintbrush className="w-7 h-7" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 tracking-wide flex items-center gap-1.5">
        <span>{message}</span>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
      </p>
    </div>
  );
}
