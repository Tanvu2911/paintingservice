import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import { formatMoney } from "../../../util/formatters";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import Modal from "../../../components/common/Modal";
import Pagination from "../../../components/common/Pagination";
import {
  Paintbrush,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  ShieldCheck,
} from "lucide-react";

export default function ServiceManagement() {
  const { user, showToast } = useOutletContext();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState(null);
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

  // Fetch Services
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

  // Filtered services
  const filteredServices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return services;
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
    );
  }, [services, searchTerm]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Paginated slice
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      basePrice: Number(formData.basePrice),
      description: formData.description.trim(),
    };

    try {
      if (editingService) {
        await AxiosConfig.put(`/services/${editingService.id}`, payload);
        showToast?.("Cập nhật dịch vụ thành công", "success");
      } else {
        await AxiosConfig.post("/services", payload);
        showToast?.("Tạo dịch vụ mới thành công", "success");
      }
      handleCloseModal();
      fetchServices();
    } catch (err) {
      console.error(err);
      showToast?.(
        err.response?.data?.message || "Thao tác không thành công",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await AxiosConfig.delete(`/services/${deleteTarget.id}`);
      showToast?.("Đã xóa dịch vụ thành công", "success");
      setDeleteTarget(null);
      fetchServices();
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

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Quản Lý Dịch Vụ Sơn"
        subtitle="Cấu hình các gói dịch vụ thi công sơn nhà và đơn giá cơ sở."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm kiếm gói dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm dịch vụ mới</span>
        </button>
      </div>

      {/* Grid Layout gọn gàng */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl" />
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-10 bg-slate-100 rounded-xl mt-6" />
            </div>
          ))}
        </div>
      ) : paginatedServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Paintbrush className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-sm">Không tìm thấy dịch vụ nào</p>
          <p className="text-xs text-slate-400 mt-1">Thử đổi từ khóa hoặc thêm gói mới</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedServices.map((srv) => (
              <div
                key={srv.id}
                onClick={() => setSelectedServiceForDetail(srv)}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Paintbrush className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      ID: #{srv.id}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-emerald-600 transition">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                    {srv.description || "Dịch vụ sơn sửa chất lượng cao, độ bền vượt trội."}
                  </p>

                  <div className="space-y-1.5 mb-6 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Sơn chính hãng 100%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Bảo hành theo hợp đồng</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Đơn giá cơ sở
                    </span>
                    <span className="text-sm font-black text-emerald-700">
                      {srv.basePrice ? `${formatMoney(srv.basePrice)} / m²` : "Khảo sát báo giá"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setSelectedServiceForDetail(srv)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Xem chi tiết dịch vụ"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(srv)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Chỉnh sửa dịch vụ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(srv)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Xóa dịch vụ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredServices.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* Modal Create/Edit Service */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingService ? `Sửa gói dịch vụ #${editingService.id}` : "Thêm gói dịch vụ mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Tên dịch vụ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Sơn nội thất Dulux 5in1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition ${formErrors.name ? "border-rose-300" : "border-slate-200"
                }`}
            />
            {formErrors.name && (
              <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Đơn giá cơ sở (VNĐ / m²) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="VD: 55000"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition ${formErrors.basePrice ? "border-rose-300" : "border-slate-200"
                }`}
            />
            {formErrors.basePrice && (
              <p className="text-[11px] text-rose-500 mt-1">{formErrors.basePrice}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Mô tả chi tiết hạng mục
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả chất lượng sơn, bề mặt thi công, bảo hành..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={submitting}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              {submitting ? "Đang lưu..." : editingService ? "Lưu thay đổi" : "Tạo dịch vụ"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Chi Tiết Dịch Vụ */}
      <Modal
        isOpen={!!selectedServiceForDetail}
        onClose={() => setSelectedServiceForDetail(null)}
        title={`Chi Tiết Gói Dịch Vụ: ${selectedServiceForDetail?.name || ""}`}
        size="md"
      >
        {selectedServiceForDetail && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{selectedServiceForDetail.name}</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Mã gói: #{selectedServiceForDetail.id}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Đơn giá cơ sở:</span>
                <p className="text-base font-black text-emerald-700 mt-0.5 font-mono">
                  {selectedServiceForDetail.basePrice
                    ? `${formatMoney(selectedServiceForDetail.basePrice)} / m²`
                    : "Khảo sát báo giá"}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Mô tả chi tiết:</span>
                <p className="text-slate-700 font-medium mt-1 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200">
                  {selectedServiceForDetail.description || "Chưa có thông tin mô tả chi tiết."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedServiceForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const srv = selectedServiceForDetail;
                  setSelectedServiceForDetail(null);
                  handleOpenEdit(srv);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa dịch vụ</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa gói dịch vụ"
        message={`Bạn có chắc chắn muốn xóa dịch vụ "${deleteTarget?.name}" khỏi hệ thống?`}
        confirmText="Xóa"
        confirmColor="bg-rose-600 hover:bg-rose-700"
        submitting={deleting}
      />
    </div>
  );
}
