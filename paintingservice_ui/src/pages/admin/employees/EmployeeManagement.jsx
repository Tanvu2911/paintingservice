import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Pagination from "../../../components/common/Pagination";
import { HANOI_DISTRICTS, VIETNAMESE_BANKS } from "../../../data/hanoiLocations";
import { Search, UserPlus, Filter, ShieldCheck, MapPin, Eye, Edit2, Trash2, Phone, Mail, Building, CreditCard, Award, Check } from "lucide-react";

export default function EmployeeManagement() {
  const context = useOutletContext() || {};
  const user = context.user;
  const showToast = context.showToast;
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState(null);
  const [copiedBankField, setCopiedBankField] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [staffTypeFilter, setStaffTypeFilter] = useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
    specialty: "",
    experienceYears: "",
    available: true,
    staffType: "WORKER",
    serviceArea: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const [staffRes, srvRes] = await Promise.all([
          AxiosConfig.get("/staff"),
          AxiosConfig.get("/services").catch(() => ({ data: [] })),
        ]);
        const data = Array.isArray(staffRes.data) ? staffRes.data : staffRes.data?.content || [];
        const srvData = Array.isArray(srvRes.data) ? srvRes.data : srvRes.data?.content || [];
        if (mounted) {
          setEmployees(data);
          setAvailableServices(srvData);
        }
      } catch {
        showToast?.("Không tải được danh sách nhân viên", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => {
      mounted = false;
    };
  }, [refreshTrigger, showToast]);

  // Filtered staff
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchType =
        staffTypeFilter === "ALL" ? true : emp.staffType === staffTypeFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        emp.username?.toLowerCase().includes(term) ||
        emp.phoneNumber?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.specialty?.toLowerCase().includes(term) ||
        emp.serviceArea?.toLowerCase().includes(term);

      return matchType && matchSearch;
    });
  }, [employees, staffTypeFilter, searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, staffTypeFilter]);

  // Paginated slice
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const openCreate = () => {
    setEditingStaff(null);
    setFormData({
      username: "",
      email: "",
      phoneNumber: "",
      address: "",
      password: "",
      specialty: "",
      experienceYears: "",
      available: true,
      staffType: "WORKER",
      serviceArea: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      username: staff.username || "",
      email: staff.email || "",
      phoneNumber: staff.phoneNumber || "",
      address: staff.address || "",
      password: "",
      specialty: staff.specialty || "",
      experienceYears: staff.experienceYears || "",
      available: staff.available ?? true,
      staffType: staff.staffType || "WORKER",
      serviceArea: staff.serviceArea || "",
      bankName: staff.bankName || "",
      bankAccountNumber: staff.bankAccountNumber || "",
      bankAccountName: staff.bankAccountName || "",
    });
    setIsModalOpen(true);
  };

  const toggleDistrictInForm = (districtName) => {
    let currentAreas = formData.serviceArea
      ? formData.serviceArea.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    if (currentAreas.includes(districtName)) {
      currentAreas = currentAreas.filter((d) => d !== districtName);
    } else {
      currentAreas.push(districtName);
    }
    setFormData((prev) => ({ ...prev, serviceArea: currentAreas.join(", ") }));
  };

  const toggleSkillInForm = (skillName) => {
    let currentSkills = formData.specialty
      ? formData.specialty.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    if (currentSkills.includes(skillName)) {
      currentSkills = currentSkills.filter((s) => s !== skillName);
    } else {
      currentSkills.push(skillName);
    }
    setFormData((prev) => ({ ...prev, specialty: currentSkills.join(", ") }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
    try {
      await AxiosConfig.delete(`/staff/${id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      showToast?.("Đã xóa nhân viên thành công", "success");
    } catch {
      showToast?.("Không thể xóa nhân viên", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        specialty: formData.specialty,
        experienceYears: Number(formData.experienceYears) || 0,
        available: formData.available,
        staffType: formData.staffType,
        serviceArea: formData.serviceArea,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountName: formData.bankAccountName,
      };
      if (formData.password?.trim()) payload.password = formData.password;

      if (editingStaff) {
        await AxiosConfig.put(`/staff/${editingStaff.id}`, payload);
        showToast?.("Cập nhật thông tin nhân viên thành công", "success");
      } else {
        if (!payload.password) {
          showToast?.("Vui lòng nhập mật khẩu", "error");
          return;
        }
        await AxiosConfig.post("/staff", payload);
        showToast?.("Thêm nhân viên mới thành công", "success");
      }
      setIsModalOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.messages?.join?.(", ") ||
        "Thao tác thất bại";
      showToast?.(msg, "error");
    }
  };

  const currentFormDistricts = formData.serviceArea
    ? formData.serviceArea.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const currentFormSkills = formData.specialty
    ? formData.specialty.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Quản Lý Nhân Viên &amp; Đội Thợ"
        subtitle="Quản lý thông tin, khu vực phụ trách Hà Nội và tài khoản ngân hàng chuyển thù lao."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Tổng số nhân sự" value={employees.length} />
        <StatCard
          label="Đang sẵn sàng"
          value={employees.filter((e) => e.available).length}
          colorClass="text-emerald-700"
          borderClass="border-l-4 border-l-emerald-600"
        />
        <StatCard
          label="Đã cập nhật STK"
          value={employees.filter((e) => e.bankAccountNumber).length}
          colorClass="text-emerald-800"
          borderClass="border-l-4 border-l-emerald-600"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, chuyên môn, khu vực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Loại nhân sự:</span>
          </div>
          <select
            value={staffTypeFilter}
            onChange={(e) => setStaffTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition w-full sm:w-auto"
          >
            <option value="ALL">Tất cả nhân sự</option>
            <option value="SUPERVISOR">Giám sát khảo sát</option>
            <option value="WORKER">Thợ thi công</option>
          </select>

          <button
            onClick={openCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm nhân viên</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-5">Nhân viên &amp; Vai trò</th>
                  <th className="py-3.5 px-5">Liên hệ</th>
                  <th className="py-3.5 px-5">Khu vực phụ trách (HN)</th>
                  <th className="py-3.5 px-5">Tài khoản ngân hàng</th>
                  <th className="py-3.5 px-5">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                      Không tìm thấy nhân viên nào phù hợp
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedStaffForDetail(emp)}
                      className="hover:bg-slate-50/70 transition cursor-pointer group"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
                              emp.staffType === "SUPERVISOR"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {(emp.username || "S").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                              @{emp.username}
                            </div>
                            <div className="mt-0.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  emp.staffType === "SUPERVISOR"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {emp.staffType === "SUPERVISOR" ? "Giám sát viên" : "Đội thợ thi công"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800">{emp.phoneNumber || "—"}</div>
                        <div className="text-[11px] text-slate-400">{emp.email || "Chưa có email"}</div>
                      </td>

                      <td className="py-4 px-5 max-w-[200px]">
                        {emp.serviceArea ? (
                          <div className="flex flex-wrap gap-1">
                            {emp.serviceArea
                              .split(",")
                              .slice(0, 2)
                              .map((area, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-semibold truncate max-w-[120px]"
                                >
                                  {area.trim()}
                                </span>
                              ))}
                            {emp.serviceArea.split(",").length > 2 && (
                              <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                                +{emp.serviceArea.split(",").length - 2} quận
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Toàn Hà Nội</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {emp.bankAccountNumber ? (
                          <div className="text-[11px]">
                            <div className="font-bold text-slate-800">{emp.bankName || "Ngân hàng"}</div>
                            <div className="font-mono text-emerald-700 font-bold">{emp.bankAccountNumber}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa cập nhật STK</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            emp.available
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.available ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <span>{emp.available ? "Sẵn sàng" : "Tạm nghỉ"}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStaffForDetail(emp);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl transition text-xs cursor-pointer border border-blue-200 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(emp);
                          }}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(emp.id);
                          }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition text-xs cursor-pointer border border-rose-200 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEmployees.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa Nhân viên */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? `Sửa nhân viên @${editingStaff.username}` : "Thêm nhân viên mới"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!!editingStaff}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-100"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {editingStaff ? "Mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu *"}
              </label>
              <input
                type="password"
                required={!editingStaff}
                placeholder={editingStaff ? "Nhập mật khẩu mới nếu muốn đổi" : "Mật khẩu"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại</label>
              <input
                type="text"
                placeholder="0987654321"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="staff@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ thường trú</label>
            <input
              type="text"
              placeholder="VD: Cầu Giấy, Hà Nội"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Loại nhân sự</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                value={formData.staffType}
                onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}
              >
                <option value="WORKER">Thợ thi công (1 đơn)</option>
                <option value="SUPERVISOR">Giám sát khảo sát (3 đơn)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số năm kinh nghiệm</label>
              <input
                type="number"
                min="0"
                placeholder="3"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                value={formData.available ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, available: e.target.value === "true" })}
              >
                <option value="true">Sẵn sàng</option>
                <option value="false">Đang bận</option>
              </select>
            </div>
          </div>

          {/* Chọn Dịch vụ / Chuyên môn dạng Tag từ danh mục dịch vụ */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Dịch vụ &amp; Chuyên môn phụ trách (Chọn từ danh mục dịch vụ)
            </label>
            {availableServices.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Chưa có dịch vụ nào trong hệ thống
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                {availableServices.map((service) => {
                  const skillName = service.name;
                  const selected = currentFormSkills.includes(skillName);
                  return (
                    <button
                      key={service.id || skillName}
                      type="button"
                      onClick={() => toggleSkillInForm(skillName)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left transition flex items-center justify-between border cursor-pointer ${
                        selected
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{skillName}</span>
                      <span>{selected ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chọn khu vực hoạt động tại Hà Nội */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Khu vực nhận việc tại Hà Nội (Chọn các Quận/Huyện)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              {HANOI_DISTRICTS.map((d) => {
                const selected = currentFormDistricts.includes(d.name);
                return (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => toggleDistrictInForm(d.name)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left transition flex items-center justify-between border cursor-pointer ${selected
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    <span className="truncate">{d.name}</span>
                    <span>{selected ? "✓" : "+"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thông tin tài khoản ngân hàng */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              💳 Thông tin tài khoản ngân hàng (Admin chuyển thù lao)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ngân hàng</label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {VIETNAMESE_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Số tài khoản</label>
                <input
                  type="text"
                  placeholder="0355880362"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Chủ tài khoản</label>
                <input
                  type="text"
                  placeholder="NGUYEN VAN A"
                  value={formData.bankAccountName}
                  onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {editingStaff ? "Lưu cập nhật" : "Tạo nhân viên"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Chi Tiết Hồ Sơ Nhân Viên */}
      <Modal
        isOpen={Boolean(selectedStaffForDetail)}
        onClose={() => setSelectedStaffForDetail(null)}
        title="Chi Tiết Hồ Sơ Nhân Viên"
        size="lg"
      >
        {selectedStaffForDetail && (
          <div className="space-y-5">
            {/* Header Profile */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md ${
                  selectedStaffForDetail.staffType === "SUPERVISOR"
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {(selectedStaffForDetail.username || "S").charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    @{selectedStaffForDetail.username}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      selectedStaffForDetail.staffType === "SUPERVISOR"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {selectedStaffForDetail.staffType === "SUPERVISOR"
                      ? "Giám sát viên (Khảo sát)"
                      : "Đội thợ sơn (Thi công)"}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedStaffForDetail.available
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {selectedStaffForDetail.available ? "🟢 Sẵn sàng nhận việc" : "🔴 Tạm nghỉ"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Mã định danh ID: #{selectedStaffForDetail.id} · Kinh nghiệm:{" "}
                  <strong>{selectedStaffForDetail.experienceYears || 0} năm</strong>
                </p>
              </div>
            </div>

            {/* 2 Khối Lưới: Liên Hệ & Ngân Hàng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Thông tin liên hệ */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thông Tin Liên Hệ</span>
                </h4>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <strong className="text-slate-900 font-mono">
                      {selectedStaffForDetail.phoneNumber || "—"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <strong className="text-slate-900">
                      {selectedStaffForDetail.email || "—"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Địa chỉ:</span>
                    <strong className="text-slate-900 truncate max-w-[180px]">
                      {selectedStaffForDetail.address || "Hà Nội"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Tài khoản ngân hàng thụ hưởng */}
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80 space-y-2.5">
                <h4 className="font-bold text-emerald-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tài Khoản Quyết Toán Thù Lao (VietQR)</span>
                </h4>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <strong className="text-slate-900 font-bold">
                      {selectedStaffForDetail.bankName || "MB Bank"}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono text-emerald-800 font-black text-sm">
                        {selectedStaffForDetail.bankAccountNumber || "—"}
                      </strong>
                      {selectedStaffForDetail.bankAccountNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedStaffForDetail.bankAccountNumber);
                            setCopiedBankField(true);
                            setTimeout(() => setCopiedBankField(false), 2000);
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 cursor-pointer"
                        >
                          {copiedBankField ? "✓ Đã chép" : "Chép"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <strong className="text-slate-900 uppercase">
                      {selectedStaffForDetail.bankAccountName || selectedStaffForDetail.username}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Kỹ năng chuyên môn */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Kỹ Năng Chuyên Môn / Dịch Vụ Đăng Ký</span>
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedStaffForDetail.specialty ? (
                  selectedStaffForDetail.specialty.split(",").map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-bold text-xs"
                    >
                      {s.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">Chưa cập nhật kỹ năng chuyên môn</span>
                )}
              </div>
            </div>

            {/* Khu vực hoạt động tại Hà Nội */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Khu Vực Quận / Huyện Phụ Trách (Hà Nội)</span>
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedStaffForDetail.serviceArea ? (
                  selectedStaffForDetail.serviceArea.split(",").map((d, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-semibold text-xs"
                    >
                      {d.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-xl">
                    Toàn bộ khu vực Hà Nội
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedStaffForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const staffToEdit = selectedStaffForDetail;
                  setSelectedStaffForDetail(null);
                  openEdit(staffToEdit);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa Hồ Sơ</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}