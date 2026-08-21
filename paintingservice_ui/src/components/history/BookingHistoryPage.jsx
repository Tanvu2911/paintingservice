import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../../util/formatters";
import StatusBadge from "../common/StatusBadge";
import useBookingHistory from "../../hooks/useBookingHistory";
import HistoryList from "../common/HistoryList";

const formatDate = (value) => {
  if (!value) return "—";
  if (Array.isArray(value)) {
    const [y, m, d] = value;
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("vi-VN");
};

export default function BookingHistoryPage({
  role,
  title,
  subtitle,
  showToast,
  detailPath,
  showTechnicianFilter = false,
  showCustomerFilter = false,
  emptyMessage = "Chưa có dữ liệu lịch sử.",
  defaultStatusFilter = "ALL",
  statusFilter = [], // Nhận prop statusFilter
}) {
  const navigate = useNavigate();
  const { filtered, bookings, stats, loading, filters } = useBookingHistory(
    role,
    showToast,
    defaultStatusFilter
  );

  // LỌC DỮ LIỆU: Chỉ giữ lại các đơn hàng có trạng thái nằm trong statusFilter (nếu có truyền vào và filter trên thanh chưa chọn cái khác)
  const displayData = useMemo(() => {
    if (statusFilter && statusFilter.length > 0) {
      if (filters.statusFilter === "ALL" || filters.statusFilter === defaultStatusFilter) {
        return filtered.filter((row) => statusFilter.includes(row.status));
      }
    }
    return filtered;
  }, [filtered, statusFilter, filters.statusFilter, defaultStatusFilter]);

  const columns = [
    {
      key: "id",
      label: "Mã đơn",
      render: (row) => (
        <span className="font-bold text-slate-800">#{row.id}</span>
      ),
    },
    {
      key: "address",
      label: "Địa chỉ",
      cellClassName: "max-w-xs truncate",
      render: (row) => row.address || "—",
    },
    {
      key: "service",
      label: "Dịch vụ",
      render: (row) => row.serviceName || row.title || "—",
    },
    ...(showCustomerFilter
      ? [
        {
          key: "customer",
          label: "Khách hàng",
          render: (row) =>
            row.customerName || row.customer?.username || "—",
        },
      ]
      : []),
    ...(showTechnicianFilter
      ? [
        {
          key: "technician",
          label: "Kỹ thuật viên",
          render: (row) =>
            row.technicianName || row.preferredTechnicianName || "—",
        },
      ]
      : []),
    {
      key: "date",
      label: "Ngày hẹn",
      render: (row) => formatDate(row.appointmentDate || row.createdAt),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "amount",
      label: "Giá trị",
      render: (row) => formatMoney(row.totalAmount),
    },
  ];

  const statCards = [
    { label: "Tổng đơn", value: stats.total },
    { label: "Chờ xử lý", value: stats.pending, colorClass: "text-amber-600", borderClass: "border-l-4 border-l-amber-500" },
    { label: "Đang thực hiện", value: stats.inProgress, colorClass: "text-blue-600", borderClass: "border-l-4 border-l-blue-500" },
    { label: "Hoàn thành", value: stats.completed, colorClass: "text-emerald-600", borderClass: "border-l-4 border-l-emerald-500" },
  ];

  return (
    <HistoryList
      title={title}
      subtitle={subtitle}
      stats={statCards}
      filters={filters}
      columns={columns}
      data={{
        rows: displayData, // Sử dụng dữ liệu đã được lọc
        totalCount: bookings.length,
        filteredCount: displayData.length, // Cập nhật lại số lượng sau khi lọc
      }}
      loading={loading}
      emptyMessage={emptyMessage}
      showTechnicianFilter={showTechnicianFilter}
      showCustomerFilter={showCustomerFilter}
      onRowClick={
        detailPath
          ? (row) => navigate(detailPath.replace(":id", row.id))
          : undefined
      }
    />
  );
}