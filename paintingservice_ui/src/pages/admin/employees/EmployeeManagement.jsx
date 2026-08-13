import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

export default function EmployeeManagement() {
  const { user, showToast } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
  });

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await AxiosConfig.get("/staff");
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        if (mounted) setEmployees(data);
      } catch  {
        showToast?.("Không tải được danh sách nhân viên", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [refreshTrigger, showToast]);

  const openCreate = () => {
    setEditingStaff(null);
    setFormData({
      username: "", email: "", phoneNumber: "", address: "", password: "",
      specialty: "", experienceYears: "", available: true, staffType: "WORKER",
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
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa nhân viên này?")) return;
    try {
      await AxiosConfig.delete(`/staff/${id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      showToast?.("Đã xóa nhân viên");
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
      };
      if (formData.password?.trim()) payload.password = formData.password;

      if (editingStaff) {
        await AxiosConfig.put(`/staff/${editingStaff.id}`, payload);
        showToast?.("Cập nhật thành công");
      } else {
        if (!payload.password) {
          showToast?.("Vui lòng nhập mật khẩu", "error");
          return;
        }
        await AxiosConfig.post("/staff", payload);
        showToast?.("Thêm nhân viên thành công");
      }
      setIsModalOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.messages?.join(", ") || "Thao tác thất bại";
      showToast?.(msg, "error");
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Quản Lý Nhân Viên"
        subtitle="Quản lý thông tin và chuyên môn kỹ thuật viên / giám sát."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {loading && <LoadingSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <StatCard label="Tổng số nhân viên" value={employees.length} />
        <StatCard
          label="Đang sẵn sàng"
          value={employees.filter((e) => e.available).length}
          colorClass="text-emerald-600"
          borderClass="border-l-4 border-l-emerald-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Danh sách nhân viên</h3>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md text-sm"
          >
            + Thêm nhân viên
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-4 px-6">Tài khoản</th>
                <th className="py-4 px-6">Loại</th>
                <th className="py-4 px-6">Liên hệ</th>
                <th className="py-4 px-6">Chuyên môn</th>
                <th className="py-4 px-6">Kinh nghiệm</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">Chưa có nhân viên</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-800">@{emp.username}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        emp.staffType === "SUPERVISOR" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {emp.staffType === "SUPERVISOR" ? "Giám sát" : "Thợ"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>{emp.phoneNumber || "N/A"}</div>
                      <div className="text-xs text-slate-400">{emp.email}</div>
                    </td>
                    <td className="py-4 px-6">{emp.specialty || "Chung"}</td>
                    <td className="py-4 px-6">{emp.experienceYears || 0} năm</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        emp.available ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}>
                        {emp.available ? "Sẵn sàng" : "Đang bận"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => openEdit(emp)} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-200">
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 font-semibold rounded-lg text-xs hover:bg-rose-100">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? "Sửa nhân viên" : "Thêm nhân viên"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Tên đăng nhập" required disabled={!!editingStaff}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
          <input type="password" placeholder={editingStaff ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"} required={!editingStaff}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <input type="email" placeholder="Email" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <input type="text" placeholder="Số điện thoại" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
          <input type="text" placeholder="Địa chỉ" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Chuyên môn" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} />
            <input type="number" placeholder="Số năm KN" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.experienceYears} onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.staffType} onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}>
              <option value="WORKER">Nhân viên thi công</option>
              <option value="SUPERVISOR">Nhân viên giám sát</option>
            </select>
            <select className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.available ? "true" : "false"} onChange={(e) => setFormData({ ...formData, available: e.target.value === "true" })}>
              <option value="true">Sẵn sàng</option>
              <option value="false">Đang bận</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl">Hủy</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}