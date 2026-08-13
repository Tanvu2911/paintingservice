export default function BookingFilters({
  searchText = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusChange,
  filterOptions = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ nhận" },
    { key: "IN_PROGRESS", label: "Đang tiến hành" },
    { key: "COMPLETED", label: "Hoàn thành / Hủy" },
  ],
  sortOrder = "newest",
  onSortChange,
  totalCount,
  filteredCount,
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
      <input
        type="text"
        value={searchText}
        onChange={(e) => onSearchChange?.(e.target.value)}
        placeholder="Tìm theo địa chỉ, dịch vụ, khách hàng, mã đơn..."
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onStatusChange?.(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {onSortChange && (
          <select
            value={sortOrder}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="newest">Ngày mới nhất</option>
            <option value="oldest">Ngày cũ nhất</option>
          </select>
        )}
      </div>

      {totalCount != null && (
        <p className="text-xs text-slate-400">
          Hiển thị {filteredCount ?? totalCount} / {totalCount} đơn
        </p>
      )}
    </div>
  );
}
