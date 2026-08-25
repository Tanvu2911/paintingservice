import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import { formatMoney } from "../../../util/formatters";
import {
  Search,
  UserPlus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  ClipboardList,
  User,
  RotateCw,
  ExternalLink,
} from "lucide-react";

export default function CustomerManagement() {
  const context = useOutletContext() || {};
  const user = context.user;
  const showToast = context.showToast;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [allPayments, setAllPayments] = useState([]);

  // Search & Filters & Pagination
  const [searchKeyword, setSearchKeyword] = useState("");
  const [depositStatusFilter, setDepositStatusFilter] = useState("ALL"); // ALL, HAS_BOOKINGS, IN_PROGRESS, COMPLETED
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailTab, setDetailTab] = useState("bookings"); // 'bookings' | 'contracts' | 'profile'

  // Create / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
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

        const userPayments = pList.filter((p) =>
          userBookings.some((b) => b.id === p.bookingId)
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

  // Tính toán thống kê dữ liệu thật
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const hasBookingsCount = customers.filter(
      (c) => (c.bookings || []).length > 0
    ).length;

    const inProgressCount = customers.filter((c) =>
      (c.bookings || []).some((b) =>
        [
          "SURVEY_ASSIGNED",
          "ACCEPTED",
          "SURVEYING",
          "WAITING_ADMIN_QUOTE",
          "CUSTOMER_ACCEPTED_QUOTE",
          "WAITING_DEPOSIT",
          "DEPOSIT_CONFIRMED",
          "ASSIGNED",
          "PROCESSING",
          "WORKER_COMPLETED",
        ].includes(b.status)
      )
    ).length;

    const completedCount = customers.filter((c) =>
      (c.bookings || []).some((b) =>
        ["COMPLETED", "PAID_TO_STAFF"].includes(b.status)
      )
    ).length;

    return {
      totalCustomers,
      hasBookingsCount,
      inProgressCount,
      completedCount,
    };
  }, [customers]);

  // Bộ lọc khách hàng theo từ khóa và trạng thái
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // 1. Lọc từ khóa tìm kiếm
      const term = searchKeyword.toLowerCase().trim();
      const matchKeyword =
        !term ||
        c.username?.toLowerCase().includes(term) ||
        c.fullName?.toLowerCase().includes(term) ||
        c.phoneNumber?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.address?.toLowerCase().includes(term) ||
        (c.bookings || []).some((b) => String(b.id).includes(term));

      if (!matchKeyword) return false;

      // 2. Lọc theo trạng thái
      if (depositStatusFilter === "HAS_BOOKINGS") {
        return (c.bookings || []).length > 0;
      }
      if (depositStatusFilter === "IN_PROGRESS") {
        return (c.bookings || []).some((b) =>
          [
            "SURVEY_ASSIGNED",
            "ACCEPTED",
            "SURVEYING",
            "WAITING_ADMIN_QUOTE",
            "CUSTOMER_ACCEPTED_QUOTE",
            "WAITING_DEPOSIT",
            "DEPOSIT_CONFIRMED",
            "ASSIGNED",
            "PROCESSING",
            "WORKER_COMPLETED",
          ].includes(b.status)
        );
      }
      if (depositStatusFilter === "COMPLETED") {
        return (c.bookings || []).some((b) =>
          ["COMPLETED", "PAID_TO_STAFF"].includes(b.status)
        );
      }

      return true;
    });
  }, [customers, searchKeyword, depositStatusFilter]);

  // Reset về trang 1 khi lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, depositStatusFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const openCreate = () => {
    setEditingCustomer(null);
    setFormData({
      username: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
      password: "",
      status: "ACTIVE",
      roleId: 2,
    });
    setIsEditModalOpen(true);
  };

  const openEdit = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      username: cust.username || "",
      fullName: cust.fullName || "",
      email: cust.email || "",
      phoneNumber: cust.phoneNumber || "",
      address: cust.address || "",
      password: "",
      status: cust.status || "ACTIVE",
      roleId: 2,
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmittingForm(true);

    try {
      const payload = {
        username: formData.username.trim(),
        fullName: formData.fullName ? formData.fullName.trim() : null,
        email: formData.email ? formData.email.trim() : null,
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : null,
        address: formData.address ? formData.address.trim() : null,
        status: formData.status || "ACTIVE",
        roleId: 2,
        role: "ROLE_CUSTOMER",
      };

      if (formData.password?.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingCustomer) {
        await AxiosConfig.put(`/users/${editingCustomer.id}`, payload);
        showToast?.("Cập nhật thông tin khách hàng thành công", "success");
      } else {
        if (!payload.password) {
          showToast?.("Vui lòng nhập mật khẩu khởi tạo", "error");
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
        subtitle="Theo dõi thông tin tài khoản, danh sách hợp đồng và lịch sử công trình của khách hàng."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {/* 1. THẺ THỐNG KÊ TỔNG QUAN (Đơn giản, tinh gọn) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng số khách hàng" value={stats.totalCustomers} />
        <StatCard label="Đã có đơn hàng" value={stats.hasBookingsCount} />
        <StatCard label="Đang thi công" value={stats.inProgressCount} />
        <StatCard label="Đã hoàn tất" value={stats.completedCount} />
      </div>

      {/* 2. THANH TÌM KIẾM & BỘ LỌC */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, email, địa chỉ..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Trạng thái:</span>
          </div>
          <select
            value={depositStatusFilter}
            onChange={(e) => setDepositStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition w-full sm:w-auto cursor-pointer"
          >
            <option value="ALL">Tất cả khách hàng</option>
            <option value="HAS_BOOKINGS">Đã có đơn hàng</option>
            <option value="IN_PROGRESS">Đang thi công</option>
            <option value="COMPLETED">Đã hoàn tất</option>
          </select>

          <button
            type="button"
            onClick={fetchRealData}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
            title="Làm mới dữ liệu"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH KHÁCH HÀNG */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-5">Khách hàng</th>
                  <th className="py-3.5 px-5">Liên hệ</th>
                  <th className="py-3.5 px-5">Địa chỉ</th>
                  <th className="py-3.5 px-5">Đơn hàng &amp; Chi tiêu</th>
                  <th className="py-3.5 px-5">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                      Không tìm thấy khách hàng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c) => {
                    const totalSpent = (c.bookings || []).reduce((sum, b) => {
                      if (
                        ["COMPLETED", "PAID_TO_STAFF", "FULLY_PAID"].includes(b.status) ||
                        b.paymentStatus === "FULLY_PAID"
                      ) {
                        return sum + (Number(b.totalAmount) || 0);
                      }
                      if (b.paymentStatus === "DEPOSIT_PAID" || b.depositPaid) {
                        return sum + (Number(b.depositAmount) || Number(b.totalAmount) * 0.3 || 0);
                      }
                      return sum;
                    }, 0);

                    return (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setDetailTab("bookings");
                        }}
                        className="hover:bg-slate-50/70 transition cursor-pointer group"
                      >
                        {/* Khách hàng */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {(c.fullName || c.username || "K").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                                {c.fullName || `@${c.username}`}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                ID: #{c.id} {c.fullName ? `(@${c.username})` : ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SĐT & Email */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.phoneNumber || "—"}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{c.email || "—"}</span>
                          </div>
                        </td>

                        {/* Địa chỉ */}
                        <td className="py-4 px-5 max-w-[200px]">
                          {c.address ? (
                            <div className="flex items-start gap-1 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="truncate">{c.address}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa cập nhật</span>
                          )}
                        </td>

                        {/* Đơn hàng & Tổng chi */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-800">
                            {(c.bookings || []).length} đơn hàng
                          </div>
                          <div className="text-[11px] text-slate-600 font-bold font-mono mt-0.5">
                            {formatMoney(totalSpent)}
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              c.status === "ACTIVE" || !c.status
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {c.status || "ACTIVE"}
                          </span>
                        </td>

                        {/* Hành động */}
                        <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(c);
                                setDetailTab("bookings");
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Xóa khách hàng"
                            >
                              <Trash2 className="w-4 h-4" />
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

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Hiển thị {paginatedCustomers.length} / {filteredCustomers.length} khách hàng
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* 4. MODAL CHI TIẾT HỒ SƠ KHÁCH HÀNG */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Hồ Sơ Khách Hàng: ${selectedCustomer?.fullName || selectedCustomer?.username || ""}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-5 max-h-[80vh] overflow-y-auto px-1">
            {/* Tabs bên trong Modal */}
            <div className="flex border-b border-slate-200 text-xs font-bold gap-2">
              <button
                type="button"
                onClick={() => setDetailTab("bookings")}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  detailTab === "bookings"
                    ? "border-slate-900 text-slate-900 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                <span>Đơn hàng ({selectedCustomer.bookings?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("contracts")}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  detailTab === "contracts"
                    ? "border-slate-900 text-slate-900 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Hợp đồng ({selectedCustomer.contracts?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("profile")}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  detailTab === "profile"
                    ? "border-slate-900 text-slate-900 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Thông tin cá nhân</span>
              </button>
            </div>

            {/* TAB 1: DANH SÁCH ĐƠN HÀNG */}
            {detailTab === "bookings" && (
              <div className="space-y-3">
                {(selectedCustomer.bookings || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                    Khách hàng này chưa có đơn hàng nào trong hệ thống.
                  </div>
                ) : (
                  selectedCustomer.bookings.map((b) => {
                    const isDepositPaid =
                      b.paymentStatus === "DEPOSIT_PAID" || b.depositPaid;

                    return (
                      <div
                        key={b.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              Đơn #{b.id} · {b.serviceName || b.service?.name || "Dịch vụ sơn nhà"}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Ngày tạo: {b.createdAt ? new Date(b.createdAt).toLocaleString("vi-VN") : "—"}
                            </p>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>

                        {/* Chi tiết tài chính & Nhân sự */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10.5px]">Tổng giá trị:</span>
                            <p className="font-bold text-slate-800 font-mono">{formatMoney(b.totalAmount || 0)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10.5px]">Tiền cọc (30%):</span>
                            <p className="font-bold text-slate-800 font-mono">
                              {formatMoney(b.depositAmount || Number(b.totalAmount || 0) * 0.3)}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10.5px]">Giám sát:</span>
                            <p className="font-semibold text-slate-700 truncate">{b.supervisorName || b.surveyorName || "—"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10.5px]">Đội thợ:</span>
                            <p className="font-semibold text-slate-700 truncate">
                              {b.technicianName || (isDepositPaid ? "Đang phân công" : "Chờ cọc xong")}
                            </p>
                          </div>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(null);
                              navigate(`/admin/bookings/${b.id}`);
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Xem chi tiết đơn</span>
                            <ExternalLink className="w-3 h-3 text-slate-300" />
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
              <div className="space-y-3">
                {(selectedCustomer.contracts || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                    Chưa có hợp đồng nào được tạo cho khách hàng này.
                  </div>
                ) : (
                  selectedCustomer.contracts.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Mã HĐ: {c.contractCode || `#${c.id}`}</span>
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10.5px] ${
                            c.customerSigned
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {c.customerSigned ? "✓ Khách đã ký" : "Chờ khách ký"}
                        </span>
                      </div>
                      <p className="text-slate-500">
                        Gắn với đơn hàng: <strong className="text-slate-700">#{c.bookingId || "—"}</strong>
                      </p>
                      {c.content && (
                        <div className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                          {c.content}
                        </div>
                      )}
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
                    <span className="text-slate-400 font-medium">Tên hiển thị:</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {selectedCustomer.fullName || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Tên đăng nhập:</span>
                    <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                      @{selectedCustomer.username}
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
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                    <span>Chỉnh sửa thông tin</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 5. MODAL THÊM / CHỈNH SỬA KHÁCH HÀNG */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingCustomer ? "Chỉnh sửa thông tin khách hàng" : "Thêm tài khoản khách hàng mới"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!!editingCustomer}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 disabled:bg-slate-100"
                placeholder="VD: customer01"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Họ và tên</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
                placeholder="VD: Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
                placeholder="VD: 0912345678"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
                placeholder="VD: customer@gmail.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-bold mb-1">Địa chỉ</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
                placeholder="VD: Số 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-bold mb-1">
                {editingCustomer ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu khởi tạo *"}
              </label>
              <input
                type="password"
                required={!editingCustomer}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Trạng thái tài khoản</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 bg-white cursor-pointer"
              >
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Khóa (INACTIVE)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingForm}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              {submittingForm ? "Đang lưu..." : editingCustomer ? "Lưu thay đổi" : "Tạo khách hàng"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}