export default function FilterBar({
  searchText = "",
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  statusFilter = "ALL",
  onStatusChange,
  statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "IN_PROGRESS", label: "Đang thực hiện" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy / Từ chối" },
  ],
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  sortOrder = "newest",
  onSortChange,
  showDateRange = true,
  showSort = true,
  extraFilters = null,
  totalCount = 0,
  filteredCount = 0,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        {onSearchChange && (
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {onStatusChange && (
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {showSort && onSortChange && (
          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        )}
      </div>

      {(showDateRange || extraFilters) && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {showDateRange && onStartDateChange && onEndDateChange && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <span className="text-slate-400 text-sm">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </>
          )}
          {extraFilters}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Hiển thị <strong>{filteredCount}</strong> / {totalCount} bản ghi
      </p>
    </div>
  );
}
