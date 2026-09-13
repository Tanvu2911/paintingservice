import { useState, useEffect } from "react";
import Modal from "./Modal";

export default function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  onConfirm,
  title = "Nhập thông tin",
  message = "",
  placeholder = "",
  submitText = "Xác nhận",
  cancelText = "Hủy",
  submitColor = "bg-rose-600 hover:bg-rose-700 text-white",
  submitting = false,
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Vui lòng nhập lý do.");
      return;
    }
    const handler = onSubmit || onConfirm;
    handler?.(trimmed);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{message}</p>
        )}
        <div>
          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder={placeholder}
            rows={3}
            disabled={submitting}
            className={`w-full border rounded-2xl p-3 text-xs outline-none transition focus:ring-2 ${
              error
                ? "border-rose-300 focus:ring-rose-200 bg-rose-50/30 text-rose-900"
                : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 focus:bg-white text-slate-800"
            }`}
            autoFocus
          />
          {error && (
            <p className="text-[11px] text-rose-600 font-medium mt-1">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer ${submitColor}`}
          >
            {submitting ? "Đang xử lý..." : submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}

