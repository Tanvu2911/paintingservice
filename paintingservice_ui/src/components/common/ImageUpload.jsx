import { useEffect } from "react";

export default function ImageUpload({
  previewUrls = [],
  onSelectImages,
  onRemoveImage,
  label = "📷 Chọn ảnh tải lên",
  multiple = true,
  disabled = false,
}) {
  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      alert("Chỉ chấp nhận file ảnh!");
      e.target.value = "";
      return;
    }

    onSelectImages?.(imageFiles);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <label
        className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl transition ${
          disabled
            ? "border-slate-200 bg-slate-50 cursor-not-allowed"
            : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer"
        }`}
      >
        <p className="text-xs text-slate-500">
          Click để chọn ảnh {multiple ? "(có thể chọn nhiều)" : ""}
        </p>
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={handleChange}
        />
      </label>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group bg-slate-100"
            >
              <img
                src={url}
                alt={`preview-${index}`}
                className="w-full h-full object-cover"
              />
              {onRemoveImage && !disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-90 hover:opacity-100 shadow transition"
                  title="Xóa ảnh"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
