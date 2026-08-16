import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";

// Reusable Components
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingState from "../../../components/common/LoadingState";
import Modal from "../../../components/common/Modal";
import ContractPreview from "../../../components/contract/ContractPreview";

export default function ContractManagement() {
  const { user, showToast } = useOutletContext();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchName, setSearchName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
    <div>
      <DashboardHeader
        title="Quản Lý Hợp Đồng"
        subtitle="Danh sách hợp đồng đã lập và trạng thái xác nhận."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {/* Filter Controls */}
      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Tìm theo mã HĐ / Mã đơn hàng
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Nhập mã hợp đồng hoặc mã đơn hàng..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
            />
          </div>
        </div>
        {(searchName || fromDate || toDate) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState message="Đang tải danh sách hợp đồng..." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-4 px-6">Mã HĐ</th>
                  <th className="py-4 px-6">Đơn hàng</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6">Ngày lập</th>
                  <th className="py-4 px-6">Khách ký</th>
                  <th className="py-4 px-6">Admin ký</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      {contracts.length === 0
                        ? "Chưa có hợp đồng"
                        : "Không tìm thấy hợp đồng phù hợp"}
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c) => {
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {c.contractCode || `#${c.id}`}
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          #{c.bookingId || "—"}
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={getStatus(c)} />
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString("vi-VN")
                            : "—"}
                        </td>
                        <td className="py-4 px-6">
                          {c.customerSigned ? (
                            <span className="text-emerald-600 font-semibold text-xs">
                              Đã ký
                            </span>
                          ) : (
                            <span className="text-amber-500 text-xs">Chưa ký</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {c.adminSigned ? (
                            <span className="text-purple-600 font-semibold text-xs">
                              Đã ký
                            </span>
                          ) : (
                            <span className="text-amber-500 text-xs">Chưa ký</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-3">
                          <button
                            onClick={() => openDetail(c)}
                            className="text-blue-600 text-xs font-semibold hover:underline"
                          >
                            Xem chi tiết
                          </button>
                          {c.pdfUrl && (
                            <a
                              href={c.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 text-xs font-semibold hover:underline"
                            >
                              File PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && contracts.length > 0 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              Hiển thị{" "}
              <span className="font-semibold text-slate-700">
                {filteredContracts.length}
              </span>{" "}
              / {contracts.length} hợp đồng
            </div>
          )}
        </div>
      )}

      {/* Shared Modal + Reusable ContractPreview */}
      <Modal isOpen={detailOpen} onClose={closeDetail} title="Chi tiết hợp đồng" size="lg">
        {loadingDetail ? (
          <LoadingState message="Đang tải chi tiết hợp đồng..." />
        ) : (
          <ContractPreview
            contract={selectedContract}
            bookingDetail={bookingDetail}
            onClose={closeDetail}
            onViewBooking={(bookingId) => {
              closeDetail();
              navigate(`/admin/bookings/${bookingId}`);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
