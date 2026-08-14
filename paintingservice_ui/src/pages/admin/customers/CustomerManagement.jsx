import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import DepositCountdownBadge from "../../../components/payment/DepositCountdownBadge";
import StatusBadge from "../../../components/common/StatusBadge";
import { formatMoney } from "../../../util/formatters";

export default function CustomerManagement() {
  const { user, showToast } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [allPayments, setAllPayments] = useState([]);

  // Search & Filters
  const [searchKeyword, setSearchKeyword] = useState("");
  const [depositStatusFilter, setDepositStatusFilter] = useState("ALL"); // ALL, PENDING_DEPOSIT, URGENT, EXPIRED, DEPOSIT_PAID, COMPLETED

  // Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailTab, setDetailTab] = useState("bookings"); // 'bookings' | 'profile' | 'payments'

  // Create / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
    status: "ACTIVE",
    roleId: 2, // ROLE_CUSTOMER
  });

  // Tải toàn bộ dữ liệu thật từ Backend APIs
  const fetchRealData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, bookingsRes, contractsRes, paymentsRes] = await Promise.all([
        AxiosConfig.get("/users?role=ROLE_CUSTOMER"),
        AxiosConfig.get("/bookings").catch(() => ({ data: [] })),
        AxiosConfig.get("/contracts").catch(() => ({ data: [] })),
        AxiosConfig.get("/payments").catch(() => ({ data: [] })),
      ]);

      const uList = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data?.content || [];

      const bList = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.content || [];

      const cList = Array.isArray(contractsRes.data)
        ? contractsRes.data
        : contractsRes.data?.content || [];

      const pList = Array.isArray(paymentsRes.data)
        ? paymentsRes.data
        : paymentsRes.data?.content || [];

      setAllBookings(bList);
      setAllContracts(cList);
      setAllPayments(pList);

      // Ghép nối đơn hàng và hợp đồng thật vào từng khách hàng
      const mappedCustomers = uList.map((u) => {
        const userBookings = bList.filter(
          (b) =>
            b.customerId === u.id ||
            b.customer?.id === u.id ||
            b.customer?.username === u.username ||
            b.customerName === u.username
        );

        const userContracts = cList.filter(
          (c) =>
            c.customer?.id === u.id ||
            c.customer?.username === u.username ||
            userBookings.some((b) => b.id === c.bookingId)
        );

        const userPayments = pList.filter(
          (p) => userBookings.some((b) => b.id === p.bookingId)
        );

        return {
          ...u,
          bookings: userBookings,
          contracts: userContracts,
          payments: userPayments,
        };
      });

      setCustomers(mappedCustomers);

      // Cập nhật selectedCustomer nếu đang mở
      if (selectedCustomer) {
        const updatedSelected = mappedCustomers.find((c) => c.id === selectedCustomer.id);
        if (updatedSelected) setSelectedCustomer(updatedSelected);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu khách hàng:", err);
      showToast?.("Không tải được dữ liệu khách hàng từ server", "error");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, showToast]);

  useEffect(() => {
    fetchRealData();
  }, []);

  // Lọc danh sách khách hàng dựa trên dữ liệu thật
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const kw = searchKeyword.trim().toLowerCase();
      const matchSearch =
        !kw ||
        (c.username || "").toLowerCase().includes(kw) ||
        (c.phoneNumber || "").includes(kw) ||
        (c.email || "").toLowerCase().includes(kw) ||
        (c.address || "").toLowerCase().includes(kw) ||
        (c.bookings || []).some((b) => String(b.id).includes(kw));

      if (!matchSearch) return false;

      if (depositStatusFilter === "ALL") return true;

      const userBookings = c.bookings || [];
      if (depositStatusFilter === "PENDING_DEPOSIT") {
        return userBookings.some(
          (b) =>
            b.paymentStatus !== "DEPOSIT_PAID" &&
            b.paymentStatus !== "FULLY_PAID" &&
            b.status !== "CANCELLED"
        );
      }
      if (depositStatusFilter === "URGENT") {
        return userBookings.some((b) => {
          if (
            b.paymentStatus === "DEPOSIT_PAID" ||
            b.paymentStatus === "FULLY_PAID" ||
            b.status === "CANCELLED"
          )
            return false;
          const deadline = b.depositDeadline
            ? new Date(b.depositDeadline).getTime()
            : new Date(b.createdAt || Date.now()).getTime() + 24 * 3600 * 1000;
          const hoursLeft = (deadline - Date.now()) / (3600 * 1000);
          return hoursLeft > 0 && hoursLeft < 2;
        });
      }
      if (depositStatusFilter === "EXPIRED") {
        return userBookings.some((b) => b.status === "CANCELLED");
      }
      if (depositStatusFilter === "DEPOSIT_PAID") {
        return userBookings.some((b) => b.paymentStatus === "DEPOSIT_PAID" || b.depositPaid);
      }
      if (depositStatusFilter === "COMPLETED") {
        return userBookings.some((b) => b.status === "COMPLETED" || b.paymentStatus === "FULLY_PAID");
      }

      return true;
    });
  }, [customers, searchKeyword, depositStatusFilter]);

  // Thống kê dựa trên dữ liệu thật
  const stats = useMemo(() => {
    let pendingDepositCount = 0;
    let urgentCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    customers.forEach((c) => {
      (c.bookings || []).forEach((b) => {
        if (b.status === "COMPLETED" || b.paymentStatus === "FULLY_PAID") {
          completedCount++;
        } else if (b.paymentStatus === "DEPOSIT_PAID" || b.depositPaid) {
          inProgressCount++;
        } else if (b.status !== "CANCELLED") {
          pendingDepositCount++;
          const deadline = b.depositDeadline
            ? new Date(b.depositDeadline).getTime()
            : new Date(b.createdAt || Date.now()).getTime() + 24 * 3600 * 1000;
          const hoursLeft = (deadline - Date.now()) / (3600 * 1000);
          if (hoursLeft > 0 && hoursLeft < 2) urgentCount++;
        }
      });
    });

    return {
      totalCustomers: customers.length,
      pendingDepositCount,
      urgentCount,
      inProgressCount,
      completedCount,
    };
  }, [customers]);

  const openCreate = () => {
    setEditingCustomer(null);
    setFormData({
      username: "",
      email: "",
      phoneNumber: "",
      address: "",
      password: "",
      status: "ACTIVE",
      roleId: 2,
    });
    setIsEditModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      username: customer.username || "",
      email: customer.email || "",
      phoneNumber: customer.phoneNumber || "",
      address: customer.address || "",
      password: "",
      status: customer.status || "ACTIVE",
      roleId: customer.roleId || 2,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setSubmittingForm(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email ? formData.email.trim() : null,
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : null,
        address: formData.address ? formData.address.trim() : null,
        status: formData.status || "ACTIVE",
        roleId: 2,
      };

      if (formData.password?.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingCustomer) {
        await AxiosConfig.put(`/users/${editingCustomer.id}`, payload);
        showToast?.("Cập nhật thông tin khách hàng thành công", "success");
      } else {
        if (!payload.password) {
          showToast?.("Vui lòng nhập mật khẩu cho tài khoản mới", "error");
          setSubmittingForm(false);
          return;
        }
        await AxiosConfig.post("/users", payload);
        showToast?.("Thêm khách hàng mới thành công", "success");
      }

      setIsEditModalOpen(false);
      fetchRealData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.messages?.join(", ") ||
        "Lỗi khi lưu thông tin khách hàng";
      showToast?.(msg, "error");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản khách hàng này khỏi hệ thống?")) return;
    try {
      await AxiosConfig.delete(`/users/${id}`);
      showToast?.("Đã xóa khách hàng thành công", "success");
      fetchRealData();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Không thể xóa khách hàng", "error");
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Quản Lý Khách Hàng"
        subtitle="Dữ liệu thời gian thực từ cơ sở dữ liệu: Theo dõi thông tin tài khoản, hợp đồng và thời hạn nộp cọc 24h."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {/* 1. THẺ THỐNG KÊ DỮ LIỆU THẬT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng số khách hàng" value={stats.totalCustomers} />
        <StatCard
          label="Đơn chờ nộp cọc 24h"
          value={stats.pendingDepositCount}
          colorClass="text-amber-600"
          borderClass="border-l-4 border-l-amber-500"
        />
        <StatCard
          label="Đơn sắp hết hạn (<2h)"
          value={stats.urgentCount}
          colorClass="text-rose-600"
          borderClass="border-l-4 border-l-rose-500"
        />
        <StatCard
          label="Đang thi công / Đã cọc"
          value={stats.inProgressCount}
          colorClass="text-emerald-600"
          borderClass="border-l-4 border-l-emerald-500"
        />
      </div>

      {/* 2. BỘ LỌC & TÌM KIẾM THÔNG MINH */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo tên, SĐT, email, mã đơn..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={depositStatusFilter}
              onChange={(e) => setDepositStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING_DEPOSIT">⏳ Đang chờ nộp cọc 24h</option>
              <option value="URGENT">⚠️ Sắp hết hạn cọc (&lt; 2h)</option>
              <option value="EXPIRED">❌ Đã quá hạn / Bị hủy</option>
              <option value="DEPOSIT_PAID">✓ Đã nộp cọc / Đang làm</option>
              <option value="COMPLETED">✅ Đã hoàn tất</option>
            </select>

            <button
              type="button"
              onClick={fetchRealData}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
            >
              <span>🔄</span>
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>Thêm khách hàng</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 py-1 font-medium">Lọc nhanh:</span>
          <button
            type="button"
            onClick={() => setDepositStatusFilter("ALL")}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              depositStatusFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setDepositStatusFilter("PENDING_DEPOSIT")}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              depositStatusFilter === "PENDING_DEPOSIT"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Chờ cọc ({stats.pendingDepositCount})
          </button>
          <button
            type="button"
            onClick={() => setDepositStatusFilter("URGENT")}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              depositStatusFilter === "URGENT"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            ⚠️ Khẩn cấp &lt;2h ({stats.urgentCount})
          </button>
          <button
            type="button"
            onClick={() => setDepositStatusFilter("DEPOSIT_PAID")}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              depositStatusFilter === "DEPOSIT_PAID"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Đã cọc ({stats.inProgressCount})
          </button>
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH KHÁCH HÀNG TỪ DATABASE */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6">Số điện thoại &amp; Email</th>
                  <th className="py-4 px-6">Địa chỉ</th>
                  <th className="py-4 px-6">Đơn hàng mới nhất</th>
                  <th className="py-4 px-6">Hạn nộp cọc (24h)</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 text-xs">
                      {customers.length === 0
                        ? "Chưa có dữ liệu khách hàng nào trong cơ sở dữ liệu"
                        : "Không tìm thấy khách hàng nào phù hợp với bộ lọc"}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const latestBooking = (c.bookings || [])[0];
                    const isDepositPaid =
                      latestBooking?.paymentStatus === "DEPOSIT_PAID" ||
                      latestBooking?.depositPaid;
                    const isCancelled = latestBooking?.status === "CANCELLED";

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setDetailTab("bookings");
                        }}
                      >
                        {/* Khách hàng */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center text-sm shadow-inner">
                              {(c.username || "K").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                @{c.username}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                ID: #{c.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SĐT & Email */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 text-xs">
                            {c.phoneNumber || "Chưa có SĐT"}
                          </div>
                          <div className="text-xs text-slate-400">{c.email || "—"}</div>
                        </td>

                        {/* Địa chỉ */}
                        <td className="py-4 px-6 max-w-xs truncate text-xs text-slate-600">
                          {c.address || "Chưa cập nhật"}
                        </td>

                        {/* Đơn hàng mới nhất */}
                        <td className="py-4 px-6">
                          {latestBooking ? (
                            <div>
                              <div className="font-bold text-xs text-blue-700">
                                #{latestBooking.id} · {latestBooking.serviceName || "Dịch vụ sơn"}
                              </div>
                              <div className="text-xs text-rose-600 font-semibold mt-0.5">
                                Cọc: {formatMoney(latestBooking.depositAmount || (Number(latestBooking.totalAmount) * 0.3) || 0)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Chưa có đơn</span>
                          )}
                        </td>

                        {/* Hạn nộp cọc (24h) */}
                        <td className="py-4 px-6">
                          {latestBooking ? (
                            <DepositCountdownBadge
                              signedAt={latestBooking.createdAt || latestBooking.appointmentDate}
                              deadline={latestBooking.depositDeadline}
                              isDepositPaid={isDepositPaid}
                              isCancelled={isCancelled}
                              compact={true}
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Trạng thái tài khoản */}
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {c.status || "ACTIVE"}
                          </span>
                        </td>

                        {/* Thao tác */}
                        <td
                          className="py-4 px-6 text-right space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setDetailTab("bookings");
                            }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            👁️ Chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 4. MODAL CHI TIẾT KHÁCH HÀNG TỪ BACKEND ────────────────────────── */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Hồ Sơ Khách Hàng: @${selectedCustomer?.username || ""}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-5 max-h-[80vh] overflow-y-auto px-1">
            {/* Tabs bên trong Modal */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDetailTab("bookings")}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
                  detailTab === "bookings"
                    ? "border-blue-600 text-blue-600 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📜 Đơn hàng ({selectedCustomer.bookings?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("contracts")}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
                  detailTab === "contracts"
                    ? "border-blue-600 text-blue-600 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📑 Hợp đồng ({selectedCustomer.contracts?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("profile")}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
                  detailTab === "profile"
                    ? "border-blue-600 text-blue-600 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                👤 Thông tin cá nhân
              </button>
            </div>

            {/* TAB 1: DANH SÁCH ĐƠN HÀNG */}
            {detailTab === "bookings" && (
              <div className="space-y-4">
                {(selectedCustomer.bookings || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Khách hàng này chưa có đơn hàng nào trong hệ thống.
                  </div>
                ) : (
                  selectedCustomer.bookings.map((b) => {
                    const isDepositPaid =
                      b.paymentStatus === "DEPOSIT_PAID" || b.depositPaid;
                    const isCancelled = b.status === "CANCELLED";

                    return (
                      <div
                        key={b.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              Đơn #{b.id} · {b.serviceName || "Dịch vụ sơn"}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Ngày tạo: {b.createdAt ? new Date(b.createdAt).toLocaleString("vi-VN") : "—"}
                            </p>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>

                        {/* Countdown Badge 24h */}
                        <DepositCountdownBadge
                          signedAt={b.createdAt || b.appointmentDate}
                          deadline={b.depositDeadline}
                          isDepositPaid={isDepositPaid}
                          isCancelled={isCancelled}
                        />

                        {/* Chi tiết tài chính & Nhân sự */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                          <div>
                            <span className="text-slate-400 text-[11px]">Tổng giá trị:</span>
                            <p className="font-bold text-slate-800">{formatMoney(b.totalAmount || 0)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px]">Tiền cọc (30%):</span>
                            <p className="font-black text-blue-600">
                              {formatMoney(b.depositAmount || (Number(b.totalAmount) * 0.3) || 0)}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px]">Giám sát:</span>
                            <p className="font-semibold text-slate-700">{b.surveyorName || "—"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px]">Đội thi công:</span>
                            <p className="font-semibold text-slate-700">
                              {b.technicianName || (isDepositPaid ? "Đang phân công" : "Chờ cọc xong")}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(null);
                              navigate(`/admin/bookings/${b.id}`);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
                          >
                            Xem chi tiết đơn này →
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: DANH SÁCH HỢP ĐỒNG */}
            {detailTab === "contracts" && (
              <div className="space-y-4">
                {(selectedCustomer.contracts || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Chưa có hợp đồng nào được tạo cho khách hàng này.
                  </div>
                ) : (
                  selectedCustomer.contracts.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">
                          Mã HĐ: {c.contractCode || `#${c.id}`}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold ${
                            c.customerSigned
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {c.customerSigned ? "✓ Khách đã ký" : "Chờ khách ký"}
                        </span>
                      </div>
                      <p className="text-slate-500">
                        Gắn với đơn hàng: #{c.bookingId || "—"}
                      </p>
                      <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {c.content || "Chưa có nội dung hợp đồng"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: THÔNG TIN CÁ NHÂN */}
            {detailTab === "profile" && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-medium">Tên đăng nhập:</span>
                    <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                      @{selectedCustomer.username}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Trạng thái tài khoản:</span>
                    <p className="font-bold text-emerald-600 mt-0.5">
                      {selectedCustomer.status || "ACTIVE"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Số điện thoại:</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {selectedCustomer.phoneNumber || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Email:</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {selectedCustomer.email || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 font-medium">Địa chỉ:</span>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {selectedCustomer.address || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      openEdit(selectedCustomer);
                      setSelectedCustomer(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    ✏️ Sửa thông tin này
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─── 5. MODAL TẠO / SỬA KHÁCH HÀNG ──────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingCustomer ? "Chỉnh sửa thông tin khách hàng" : "Thêm khách hàng mới"}
        size="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên đăng nhập <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!editingCustomer}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="VD: nguyen_van_an"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="VD: an@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: Số 15, Phố Huế, Hai Bà Trưng, Hà Nội"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái tài khoản</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="ACTIVE">ACTIVE (Hoạt động)</option>
              <option value="PENDING">PENDING (Chờ kích hoạt)</option>
              <option value="RESTRICTED">RESTRICTED (Bị khóa)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {editingCustomer ? "Mật khẩu mới (bỏ trống nếu giữ nguyên)" : "Mật khẩu khởi tạo *"}
            </label>
            <input
              type="password"
              required={!editingCustomer}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Nhập mật khẩu..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingForm}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/20"
            >
              {submittingForm ? "Đang lưu..." : editingCustomer ? "Lưu thay đổi" : "Tạo khách hàng"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}