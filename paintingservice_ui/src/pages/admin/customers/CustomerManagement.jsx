import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

export default function CustomerManagement() {
  const { user, showToast } = useOutletContext();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
    status: "ACTIVE",
    roleId: 2,
  });

  useEffect(() => {
    let mounted = true;

    const fetchCustomers = async () => {
      setLoading(true);

      try {
        const res = await AxiosConfig.get(
          "/users?role=ROLE_CUSTOMER"
        );

        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];

        if (mounted) {
          setCustomers(data);
        }
      } catch {
        showToast?.(
          "Không tải được danh sách khách hàng",
          "error"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger, showToast]);

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

    setIsModalOpen(true);
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
      roleId: 2,
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa khách hàng này?")) {
      return;
    }

    try {
      await AxiosConfig.delete(`/users/${id}`);

      setCustomers((prev) =>
        prev.filter((c) => c.id !== id)
      );

      showToast?.("Đã xóa khách hàng");
    } catch {
      showToast?.(
        "Không thể xóa khách hàng",
        "error"
      );
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
        status: formData.status,
        roleId: 2,
      };

      if (formData.password?.trim()) {
        payload.password = formData.password;
      }

      if (editingCustomer) {
        await AxiosConfig.put(
          `/users/${editingCustomer.id}`,
          payload
        );

        showToast?.(
          "Cập nhật khách hàng thành công"
        );
      } else {
        if (!payload.password) {
          showToast?.(
            "Vui lòng nhập mật khẩu",
            "error"
          );

          return;
        }

        await AxiosConfig.post(
          "/users",
          payload
        );

        showToast?.(
          "Thêm khách hàng thành công"
        );
      }

      setIsModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.messages?.join(", ") ||
        "Thao tác thất bại";

      showToast?.(msg, "error");
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Quản Lý Khách Hàng"
        subtitle="Quản lý thông tin tài khoản khách hàng."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A")
          .charAt(0)
          .toUpperCase()}
      />

      {loading && <LoadingSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <StatCard
          label="Tổng số khách hàng"
          value={customers.length}
        />

        <StatCard
          label="Đang hoạt động"
          value={
            customers.filter(
              (c) => c.status === "ACTIVE"
            ).length
          }
          colorClass="text-emerald-600"
          borderClass="border-l-4 border-l-emerald-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">
            Danh sách khách hàng
          </h3>

          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md text-sm"
          >
            + Thêm khách hàng
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-4 px-6">
                  Tài khoản
                </th>

                <th className="py-4 px-6">
                  Liên hệ
                </th>

                <th className="py-4 px-6">
                  Địa chỉ
                </th>

                <th className="py-4 px-6">
                  Trạng thái
                </th>

                <th className="py-4 px-6 text-right">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-8 text-slate-400"
                  >
                    Chưa có khách hàng
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/50"
                  >
                    <td className="py-4 px-6 font-bold text-slate-800">
                      @{customer.username}
                    </td>

                    <td className="py-4 px-6">
                      <div>
                        {customer.phoneNumber ||
                          "N/A"}
                      </div>

                      <div className="text-xs text-slate-400">
                        {customer.email}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {customer.address ||
                        "Chưa cập nhật"}
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                        {customer.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() =>
                          openEdit(customer)
                        }
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-200"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(customer.id)
                        }
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 font-semibold rounded-lg text-xs hover:bg-rose-100"
                      >
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingCustomer
            ? "Sửa khách hàng"
            : "Thêm khách hàng"
        }
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Tên đăng nhập"
            required
            disabled={!!editingCustomer}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            value={formData.username}
            onChange={(e) =>
              setFormData({
                ...formData,
                username: e.target.value,
              })
            }
          />

          <input
            type="password"
            placeholder={
              editingCustomer
                ? "Mật khẩu mới (không bắt buộc)"
                : "Mật khẩu"
            }
            required={!editingCustomer}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="Số điện thoại"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                phoneNumber:
                  e.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="Địa chỉ"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.address}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: e.target.value,
              })
            }
          />

          <select
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value,
              })
            }
          >
            <option value="ACTIVE">
              ACTIVE
            </option>

            <option value="PENDING">
              PENDING
            </option>

            <option value="RESTRICTED">
              RESTRICTED
            </option>
          </select>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() =>
                setIsModalOpen(false)
              }
              className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
            >
              Hủy
            </button>

            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
            >
              Lưu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}