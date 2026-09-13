import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";

// Reusable Components
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingState from "../../../components/common/LoadingState";
import Modal from "../../../components/common/Modal";
import ContractModal from "../../../components/common/ContractModal";
import Pagination from "../../../components/common/Pagination";
import { Search, Eye, FileText } from "lucide-react";

export default function ContractManagement() {
  const { user, showToast } = useOutletContext();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchName, setSearchName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const getStatus = (c) => {
    if (c.status) return c.status;
    if (c.customerSigned && c.adminSigned) return "CONTRACT_CONFIRMED";
    if (c.customerSigned) return "CUSTOMER_SIGNED";
    if (c.adminSigned) return "ADMIN_SIGNED";
    return "PENDING";
  };

  // Fetch contract list
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await AxiosConfig.get("/contracts");
        if (cancelled) return;
        const data = res.data?.content || res.data || [];
        setContracts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          showToast?.("Không tải được danh sách hợp đồng", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // Filter list
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const keyword = searchName.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        (c.contractCode || "").toLowerCase().includes(keyword) ||
        String(c.id || "").includes(keyword) ||
        String(c.bookingId || "").includes(keyword);

      let matchDate = true;
      if (fromDate || toDate) {
        const created = c.createdAt ? new Date(c.createdAt) : null;
        if (!created) matchDate = false;
        else {
          if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (created < from) matchDate = false;
          }
          if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (created > to) matchDate = false;
          }
        }
      }
      return matchSearch && matchDate;
    });
  }, [contracts, searchName, fromDate, toDate]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, fromDate, toDate]);

  // Paginated slice
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage) || 1;
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContracts.slice(start, start + itemsPerPage);
  }, [filteredContracts, currentPage, itemsPerPage]);

  const clearFilters = () => {
    setSearchName("");
    setFromDate("");
    setToDate("");
  };

  // Open contract details
  const openDetail = async (contract) => {
    setSelectedContract(contract);
    setBookingDetail(null);
    setDetailOpen(true);
    setLoadingDetail(true);

    try {
      if (contract.bookingId) {
        const res = await AxiosConfig.get(`/bookings/${contract.bookingId}`);
        setBookingDetail(res.data);
      }
    } catch (err) {
      console.error("Lỗi tải chi tiết đơn:", err);
      showToast?.("Không tải được thông tin đơn hàng", "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedContract(null);
    setBookingDetail(null);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Quản Lý Hợp Đồng Điện Tử"
        subtitle="Danh sách hợp đồng dịch vụ đã lập và trạng thái ký kết."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {/* Filter Controls */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Tìm theo mã HĐ / Mã đơn hàng
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Nhập mã hợp đồng hoặc mã đơn hàng..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>
        {(searchName || fromDate || toDate) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState message="Đang tải danh sách hợp đồng..." />
      ) : (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-5">Mã HĐ &amp; Ngày lập</th>
                  <th className="py-3.5 px-5">Mã Đơn hàng</th>
                  <th className="py-3.5 px-5">Trạng thái HĐ</th>
                  <th className="py-3.5 px-5">Tiến độ ký kết</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedContracts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-400 font-medium">
                      {contracts.length === 0
                        ? "Chưa có hợp đồng nào"
                        : "Không tìm thấy hợp đồng phù hợp với bộ lọc"}
                    </td>
                  </tr>
                ) : (
                  paginatedContracts.map((c) => {
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openDetail(c)}
                        className="hover:bg-slate-50/70 transition cursor-pointer group"
                      >
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 group-hover:text-emerald-600 transition">
                            {c.contractCode || `#${c.id}`}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString("vi-VN")
                              : "—"}
                          </div>
                        </td>
                        <td className="py-4 px-5 font-bold font-mono text-slate-800">
                          #{c.bookingId || "—"}
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={getStatus(c)} />
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.customerSigned
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              Khách: {c.customerSigned ? "Đã ký" : "Chờ"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.adminSigned
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              Admin: {c.adminSigned ? "Đã ký" : "Chờ"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openDetail(c)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Xem chi tiết HĐ"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredContracts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* Modal Hợp đồng điện tử dùng chung toàn hệ thống */}
      {loadingDetail ? (
        <Modal isOpen={detailOpen} onClose={closeDetail} title="Chi tiết hợp đồng điện tử">
          <LoadingState message="Đang tải chi tiết hợp đồng..." />
        </Modal>
      ) : (
        <ContractModal
          isOpen={detailOpen}
          onClose={closeDetail}
          contract={selectedContract}
          booking={bookingDetail}
          role="admin"
          showToast={showToast}
        />
      )}
    </div>
  );
}
