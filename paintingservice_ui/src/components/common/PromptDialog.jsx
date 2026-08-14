import { useState, useEffect } from "react";
import Modal from "./Modal";

export default function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  title = "Nhập thông tin",
  message = "",
  placeholder = "",
  submitText = "Xác nhận",
  cancelText = "Hủy",
  submitting = false,
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isOpen) setValue("");
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{message}</p>
        )}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
          >
            {submitting ? "Đang xử lý..." : submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
