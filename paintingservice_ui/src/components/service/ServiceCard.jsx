import { formatMoney } from "../../util/formatters";

export default function ServiceCard({
  service,
  onSelect,
  selected = false,
  className = "",
}) {
  if (!service) return null;

  return (
    <div
      onClick={() => onSelect?.(service)}
      className={`p-5 rounded-2xl border transition cursor-pointer bg-white shadow-sm flex flex-col justify-between ${
        selected
          ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20"
          : "border-slate-100 hover:border-slate-300 hover:shadow-md"
      } ${className}`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-slate-800 text-base sm:text-lg">
            {service.name || service.title || "Dịch vụ sơn"}
          </h4>
          {service.status && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
              {service.status}
            </span>
          )}
        </div>

        {service.description && (
          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {service.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Đơn giá
          </span>
          <span className="text-sm font-bold text-blue-600">
            {formatMoney(service.price || service.unitPrice || 0)}
          </span>
        </div>

        {onSelect && (
          <button
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selected
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {selected ? "Đã chọn ✓" : "Chọn dịch vụ"}
          </button>
        )}
      </div>
    </div>
  );
}
