import { formatMoney } from "../../util/formatters";

export default function ServiceSelect({
  services = [],
  value,
  onChange,
  label = "Dịch vụ *",
  placeholder = "-- Chọn dịch vụ --",
  error,
  disabled = false,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <select
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          error ? "border-rose-400 focus:ring-rose-500" : "border-slate-200"
        } ${disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
      >
        <option value="">{placeholder}</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name || s.title} ({formatMoney(s.price || s.unitPrice || 0)})
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
