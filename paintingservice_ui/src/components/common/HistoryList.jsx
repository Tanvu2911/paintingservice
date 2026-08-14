import FilterBar from "./FilterBar";
import DataTable from "./DataTable";
import StatCard from "./StatCard";

export default function HistoryList({
  title,
  subtitle,
  stats = [],
  filters,
  columns,
  data,
  loading,
  emptyMessage,
  onRowClick,
  showTechnicianFilter = false,
  showCustomerFilter = false,
}) {
  const {
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortOrder,
    setSortOrder,
    technicianName,
    setTechnicianName,
    customerName,
    setCustomerName,
  } = filters;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} {...s} />
          ))}
        </div>
      )}

      <FilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm mã đơn, địa chỉ, dịch vụ..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        totalCount={data?.totalCount ?? 0}
        filteredCount={data?.filteredCount ?? 0}
        extraFilters={
          <>
            {showTechnicianFilter && (
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="Lọc kỹ thuật viên..."
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1"
              />
            )}
            {showCustomerFilter && (
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Lọc khách hàng..."
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1"
              />
            )}
          </>
        }
      />

      <DataTable
        columns={columns}
        data={data?.rows || []}
        loading={loading}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
      />
    </div>
  );
}
