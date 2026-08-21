import EmptyState from "./EmptyState";
import LoadingSkeleton from "./LoadingSkeleton";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "Chưa có dữ liệu lịch sử.",
  rowKey = (row, index) => row.id ?? index,
  onRowClick,
  variant = "light",
}) {
  const isDark = variant === "dark";

  if (loading) {
    return <LoadingSkeleton rows={6} variant={variant} />;
  }

  if (!data || !data.length) {
    return <EmptyState message={emptyMessage} variant={variant} />;
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden ${
        isDark
          ? "bg-slate-800/60 border border-slate-700/60 shadow-lg shadow-black/20"
          : "bg-white shadow-xs border border-slate-200/90"
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr
              className={`uppercase text-[10.5px] font-black tracking-wider ${
                isDark
                  ? "bg-slate-900/50 text-slate-400 border-b border-slate-700/50"
                  : "bg-slate-50/80 text-slate-500 border-b border-slate-200/70"
              }`}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 font-black ${
                    col.headerClassName || ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={
              isDark
                ? "divide-y divide-slate-700/50"
                : "divide-y divide-slate-100"
            }
          >
            {data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${
                  isDark
                    ? "hover:bg-slate-700/40 text-slate-200"
                    : "hover:bg-slate-50/90 text-slate-700"
                } ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-4 ${col.cellClassName || ""}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
