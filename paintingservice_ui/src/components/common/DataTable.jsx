import EmptyState from "./EmptyState";
import LoadingSkeleton from "./LoadingSkeleton";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "Chưa có dữ liệu.",
  rowKey = (row, index) => row.id ?? index,
  onRowClick,
  variant = "light",
}) {
  const isDark = variant === "dark";

  if (loading) {
    return <LoadingSkeleton rows={5} variant={variant} />;
  }

  if (!data.length) {
    return <EmptyState message={emptyMessage} variant={variant} />;
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden ${
        isDark
          ? "bg-slate-800/60 border border-slate-700/60 shadow-lg shadow-black/20"
          : "bg-white shadow-sm border border-slate-100"
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr
              className={`uppercase text-[10px] font-black tracking-wider ${
                isDark ? "bg-slate-900/50 text-slate-500" : "bg-slate-50 text-slate-400"
              }`}
            >
              {columns.map((col) => (
                <th key={col.key} className={`py-4 px-4 ${col.headerClassName || ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isDark ? "divide-y divide-slate-700/50" : "divide-y divide-slate-100"}>
            {data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={() => onRowClick?.(row)}
                className={`${
                  isDark ? "hover:bg-slate-700/30 text-slate-300" : "hover:bg-slate-50/50 text-slate-700"
                } ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`py-4 px-4 ${col.cellClassName || ""}`}>
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
