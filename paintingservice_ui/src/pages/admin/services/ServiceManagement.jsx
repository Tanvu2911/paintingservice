import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import { formatMoney } from "../../../util/formatters";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

export default function ServiceManagement() {
  const { showToast } = useOutletContext();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    basePrice: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 1. Fetch Services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await AxiosConfig.get("/services");
      const list = Array.isArray(res.data) ? res.data : [];
      setServices(list);
    } catch (err) {
      console.error(err);
      showToast?.(
        err.response?.data?.message || "Không thể tải danh sách dịch vụ",
        "error"
      );
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // 2. Open Create / Edit Modal
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: "",
      basePrice: "",
      description: "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || "",
      basePrice: service.basePrice ?? "",
      description: service.description || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingService(null);
    setFormErrors({});
  };

  // 3. Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = "Vui lòng nhập tên dịch vụ";
    }
    if (
      formData.basePrice === "" ||
      isNaN(Number(formData.basePrice)) ||
      Number(formData.basePrice) < 0
    ) {
      errors.basePrice = "Đơn giá phải là số dương hợp lệ";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 4. Save Service (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        basePrice: Number(formData.basePrice),
        description: formData.description.trim(),
      };

      if (editingService) {
        // Update
        const res = await AxiosConfig.put(`/services/${editingService.id}`, payload);
        showToast?.("Cập nhật dịch vụ thành công!", "success");
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? res.data : s))
        );
      } else {
        // Create
        const res = await AxiosConfig.post("/services", payload);
        showToast?.("Thêm dịch vụ mới thành công!", "success");
        setServices((prev) => [res.data, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      showToast?.(
        err.response?.data?.message || "Lưu dịch vụ thất bại",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete Service
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await AxiosConfig.delete(`/services/${deleteTarget.id}`);
      showToast?.(`Đã xóa dịch vụ "${deleteTarget.name}"`, "success");
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      showToast?.(
        err.response?.data?.message || "Không thể xóa dịch vụ này",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // 6. Filter & Sort Services
  const filteredServices = useMemo(() => {
    let result = [...services];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          String(s.id).includes(q)
      );
    }

    if (sortBy === "price_asc") {
      result.sort((a, b) => (Number(a.basePrice) || 0) - (Number(b.basePrice) || 0));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => (Number(b.basePrice) || 0) - (Number(a.basePrice) || 0));
    } else if (sortBy === "name_asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else {
      // newest
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return result;
  }, [services, searchTerm, sortBy]);

  // 7. Stats Calculation
  const stats = useMemo(() => {
    const total = services.length;
    if (total === 0) return { total: 0, avgPrice: 0, minPrice: 0, maxPrice: 0 };
    const prices = services.map((s) => Number(s.basePrice) || 0);
    const sum = prices.reduce((acc, p) => acc + p, 0);
    return {
      total,
      avgPrice: Math.round(sum / total),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [services]);

  const getServiceIcon = (name = "") => {
    const lower = name.toLowerCase();
    if (lower.includes("chống thấm")) return "🛡️";
    if (lower.includes("nội thất") || lower.includes("trong nhà")) return "🛋️";
    if (lower.includes("ngoại thất") || lower.includes("ngoài trời")) return "🏡";
    if (lower.includes("cải tạo") || lower.includes("sửa")) return "🔨";
    if (lower.includes("trọn gói")) return "✨";
    return "🎨";
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-2">
            <span>🎨</span> Danh mục dịch vụ hệ thống
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Quản Lý Dịch Vụ Sơn Sửa
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Thiết lập danh mục dịch vụ, đơn giá định mức chuẩn và thông tin mô tả chi tiết cho khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchServices}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center gap-2"
          >
            <span>🔄</span> Làm mới
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <span>➕</span> Thêm Dịch Vụ Mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng số dịch vụ
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
              🎨
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 mt-3">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">Gói dịch vụ đang hiển thị phục vụ đặt lịch</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đơn giá trung bình
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
              💰
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">
            {formatMoney(stats.avgPrice)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Mức giá định mức trung bình/gói</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Khoảng giá dao động
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">
              📊
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-3">
            {formatMoney(stats.minPrice)} ~ {formatMoney(stats.maxPrice)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Từ gói cơ bản đến trọn gói cao cấp</p>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm dịch vụ theo tên, mã số, mô tả chi tiết..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="newest">Mới nhất</option>
              <option value="name_asc">Tên dịch vụ (A - Z)</option>
              <option value="price_asc">Đơn giá (Thấp đến cao)</option>
              <option value="price_desc">Đơn giá (Cao đến thấp)</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dạng lưới"
            >
              ▦ Lưới
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dạng bảng"
            >
              ☰ Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-sm font-semibold">Đang tải danh sách dịch vụ...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/90 text-center text-slate-400 space-y-3">
          <div className="text-5xl">🎨</div>
          <p className="text-base font-bold text-slate-700">
            {services.length === 0
              ? "Chưa có dịch vụ nào trong hệ thống"
              : "Không tìm thấy dịch vụ phù hợp với từ khóa"}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {services.length === 0
              ? "Nhấn nút 'Thêm Dịch Vụ Mới' ở trên để khởi tạo các gói dịch vụ sơn nhà chuyên nghiệp."
              : "Thử tìm kiếm với tên hoặc từ khóa khác."}
          </p>
          {services.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
            >
              + Thêm dịch vụ đầu tiên
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group space-y-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                    {getServiceIcon(service.name)}
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg tracking-wider">
                    #{service.id}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition">
                  {service.name}
                </h3>

                <div className="mt-3 inline-block px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                    Đơn giá cơ bản:
                  </span>
                  <p className="text-lg font-black text-emerald-600">
                    {formatMoney(service.basePrice)}
                  </p>
                </div>

                <p className="text-xs text-slate-600 mt-4 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {service.description || "Chưa có thông tin mô tả chi tiết cho dịch vụ này."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  {service.createdAt
                    ? `Tạo: ${new Date(service.createdAt).toLocaleDateString("vi-VN")}`
                    : "—"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(service)}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition flex items-center gap-1"
                  >
                    <span>✏️</span> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(service)}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition flex items-center gap-1"
                  >
                    <span>🗑️</span> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Mã</th>
                  <th className="px-6 py-4">Tên dịch vụ</th>
                  <th className="px-6 py-4">Đơn giá cơ bản</th>
                  <th className="px-6 py-4">Mô tả</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-500">
                      #{service.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getServiceIcon(service.name)}</span>
                        <span className="font-bold text-slate-900">
                          {service.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600">
                      {formatMoney(service.basePrice)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs max-w-xs truncate">
                      {service.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {service.createdAt
                        ? new Date(service.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(service)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(service)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs transition"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
                  {editingService ? "✏️" : "➕"}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    {editingService ? "Chỉnh Sửa Dịch Vụ" : "Thêm Dịch Vụ Mới"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {editingService
                      ? `Cập nhật thông tin dịch vụ #${editingService.id}`
                      : "Điền thông tin và đơn giá để tạo dịch vụ mới"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Dịch Vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ví dụ: Sơn Nhà Trọn Gói, Sơn Chống Thấm..."
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? "border-rose-400 focus:ring-rose-500/20 bg-rose-50/30"
                      : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đơn Giá Cơ Bản (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        basePrice: e.target.value,
                      }))
                    }
                    placeholder="50000"
                    className={`w-full pl-4 pr-12 py-3 rounded-2xl border text-sm font-bold ${
                      formErrors.basePrice
                        ? "border-rose-400 focus:ring-rose-500/20 bg-rose-50/30"
                        : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 text-emerald-600"
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>
                {formErrors.basePrice && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">
                    {formErrors.basePrice}
                  </p>
                )}
                {formData.basePrice && !isNaN(Number(formData.basePrice)) && (
                  <p className="text-xs text-emerald-600 font-bold mt-1">
                    Hiển thị: {formatMoney(formData.basePrice)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mô Tả Chi Tiết
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Nhập mô tả quy trình thi công, vật tư sử dụng, chế độ bảo hành..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 text-sm font-normal focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition text-xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingService ? "Lưu Thay Đổi" : "Tạo Dịch Vụ"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa dịch vụ"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa dịch vụ "${deleteTarget.name}" (Mã #${deleteTarget.id}) khỏi hệ thống? Thao tác này không thể hoàn tác.`
            : ""
        }
        confirmText={deleting ? "Đang xóa..." : "Xác nhận xóa"}
        cancelText="Hủy"
        confirmColor="bg-rose-600 hover:bg-rose-700"
      />
    </div>
  );
}
