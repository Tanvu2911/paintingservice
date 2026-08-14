import { useState } from "react";
import AxiosConfig from "../../util/AxiosConfig";

export default function ProfileForm({ user, showToast, roleLabel = "Người dùng" }) {
  const [form, setForm] = useState({
    fullName: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      setSaving(true);
      await AxiosConfig.put(`/users/${user.id}`, form);
      showToast?.("Đã cập nhật thông tin tài khoản", "success");
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể cập nhật thông tin",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
          👤
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {user?.fullName || user?.username || "Tài khoản"}
          </h2>
          <p className="text-sm text-slate-500">{roleLabel}</p>
          <p className="text-xs text-slate-400 mt-1">@{user?.username}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Họ tên
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={handleChange("fullName")}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số điện thoại
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={handleChange("phone")}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Địa chỉ
          </label>
          <input
            type="text"
            value={form.address}
            onChange={handleChange("address")}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
}
