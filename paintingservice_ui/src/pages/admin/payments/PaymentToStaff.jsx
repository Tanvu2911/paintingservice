import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { QrCode, RefreshCw, UserCheck, ShieldCheck, Check, DollarSign } from "lucide-react";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Modal from "../../../components/common/Modal";
import QRCodePayment from "../../../components/common/QRCodePayment";
import { formatMoney } from "../../../util/formatters";

export default function PaymentToStaff() {
  const { user, showToast } = useOutletContext();
  const [loading, setLoading] = useState(true);

  // Dữ liệu thanh toán nhân viên
  const [orders, setOrders] = useState([]);
  const [salaryHistories, setSalaryHistories] = useState([]);
  const [payoutModalData, setPayoutModalData] = useState(null);
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, salaryRes] = await Promise.all([
        AxiosConfig.get("/bookings"),
        AxiosConfig.get("/salary-histories").catch(() => ({ data: [] })),
      ]);

      const bData = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.content || [];

      setOrders(
        bData.filter((o) =>
          [
            "COMPLETED",
            "FULLY_PAID",
            "PAID_TO_STAFF",
            "WORKER_COMPLETED",
            "PROCESSING",
          ].includes(o.status)
        )
      );

      setSalaryHistories(
        Array.isArray(salaryRes.data)
          ? salaryRes.data
          : salaryRes.data?.content || []
      );
    } catch (err) {
      console.error(err);
      showToast?.("Lỗi tải dữ liệu thanh toán nhân sự", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Admin quét VietQR trả thù lao nhân viên/thợ sơn
  const handleOpenStaffPayoutQR = (order, staff, role, amount) => {
    setPayoutModalData({
      orderId: order.id,
      staffId: staff.id,
      staffName: staff.fullName || staff.username || "Nhân viên",
      staffPhone: staff.phoneNumber || "0987654321",
      role: role, // 'SURVEYOR' hoặc 'TECHNICIAN'
      amount: amount,
      booking: order,
    });
  };

  const handleConfirmStaffPayout = async () => {
    if (!payoutModalData) return;
    try {
      setSubmittingPayout(true);
      const res = await AxiosConfig.post(
        `/payments/staff-payout?bookingId=${payoutModalData.orderId}&staffId=${payoutModalData.staffId}&role=${payoutModalData.role}`
      );
      showToast?.(
        res.data?.message || `Đã thanh toán thù lao thành công cho ${payoutModalData.staffName}`,
        "success"
      );
      setPayoutModalData(null);
      loadData();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi xác nhận trả thù lao", "error");
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Helper tính thù lao & kiểm tra trạng thái trả của nhân viên
  const getStaffSalaryInfo = (bookingId, workerId, role, defaultAmount) => {
    const found = salaryHistories.find(
      (s) =>
        s.bookingId === bookingId &&
        s.workerId === workerId &&
        s.roleInBooking === role
    );
    if (found) {
      return {
        amount: Number(found.amountEarned) || defaultAmount,
        isPaid: found.paymentStatus === "PAID",
      };
    }
    return {
      amount: defaultAmount,
      isPaid: false,
    };
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Chi Trả Thù Lao Cho Thợ Sơn & Nhân Viên"
        subtitle="Quét mã VietQR để chuyển tiền lương / thù lao trực tiếp cho thợ sơn và giám sát viên."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Danh sách công trình thi công &amp; Thanh toán thù lao
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin sử dụng mã VietQR ngân hàng để quét chuyển khoản thù lao trực tiếp cho thợ sơn và giám sát viên
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Làm mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4">Đơn hàng</th>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4">Tổng giá trị</th>
                  <th className="py-3.5 px-4">Trạng thái công trình</th>
                  <th className="py-3.5 px-4">Chi trả Giám sát viên</th>
                  <th className="py-3.5 px-4">Chi trả Thợ sơn / Kỹ thuật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      Chưa có công trình nào sẵn sàng để quyết toán thù lao.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const totalAmt = Number(o.totalAmount) || 0;
                    const surveyorAmt = totalAmt > 0 ? totalAmt * 0.05 : 300000; // 5% hoặc 300k
                    const technicianAmt = totalAmt > 0 ? totalAmt * 0.65 : 1500000; // 65% hoặc 1.5 triệu

                    const surveyorInfo = o.surveyor
                      ? getStaffSalaryInfo(o.id, o.surveyor.id, "SURVEYOR", surveyorAmt)
                      : null;

                    const techStaff = o.technician || o.preferredTechnician;
                    const techInfo = techStaff
                      ? getStaffSalaryInfo(o.id, techStaff.id, "TECHNICIAN", technicianAmt)
                      : null;

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          #{o.id}
                        </td>
                        <td className="py-4 px-4 text-slate-800">
                          <div className="font-bold">{o.customerName || o.customer?.username || "Khách hàng"}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {o.address || "Hà Nội"}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-black text-slate-900">
                          {formatMoney(totalAmt)}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={o.status} />
                        </td>

                        {/* Cột Chi trả Giám sát */}
                        <td className="py-4 px-4">
                          {o.surveyor ? (
                            <div className="space-y-1">
                              <div className="font-bold text-slate-800">
                                {o.surveyor.fullName || o.surveyor.username}
                              </div>
                              <div className="text-slate-500 font-medium">
                                Thù lao: <strong className="text-slate-900">{formatMoney(surveyorInfo.amount)}</strong>
                              </div>
                              {surveyorInfo.isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Đã trả
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenStaffPayoutQR(o, o.surveyor, "SURVEYOR", surveyorInfo.amount)
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition cursor-pointer shadow-xs"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Quét VietQR Trả Lương</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* Cột Chi trả Thợ sơn */}
                        <td className="py-4 px-4">
                          {techStaff ? (
                            <div className="space-y-1">
                              <div className="font-bold text-slate-800">
                                {techStaff.fullName || techStaff.username}
                              </div>
                              <div className="text-slate-500 font-medium">
                                Thù lao: <strong className="text-slate-900">{formatMoney(techInfo.amount)}</strong>
                              </div>
                              {techInfo.isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Đã trả
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenStaffPayoutQR(o, techStaff, "TECHNICIAN", techInfo.amount)
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition cursor-pointer shadow-xs"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Quét VietQR Trả Lương</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa phân công</span>
                          )}
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

      {/* MODAL ADMIN QUÉT VIETQR TRẢ LƯƠNG NHÂN VIÊN */}
      <Modal
        isOpen={!!payoutModalData}
        onClose={() => setPayoutModalData(null)}
        title={`Thanh toán thù lao cho ${payoutModalData?.staffName || "nhân viên"}`}
        size="md"
      >
        {payoutModalData && (
          <QRCodePayment
            amount={payoutModalData.amount}
            orderId={payoutModalData.orderId}
            accountNo={payoutModalData.staffPhone || "0355880362"}
            accountName={payoutModalData.staffName}
            addInfo={`LUONG DH${payoutModalData.orderId} ${
              payoutModalData.role === "SURVEYOR" ? "GS" : "THO"
            }`}
            title={`Quét mã VietQR trả thù lao cho ${payoutModalData.staffName}`}
            subTitle={`Vị trí: ${
              payoutModalData.role === "SURVEYOR" ? "Giám sát viên" : "Đội thợ sơn thi công"
            }`}
            note="* Quét mã VietQR trên app ngân hàng của Admin để chuyển thù lao trực tiếp. Sau khi chuyển xong, bấm nút xác nhận bên dưới."
            confirmText={`Xác nhận đã chuyển ${formatMoney(payoutModalData.amount)}`}
            confirmColor="bg-slate-900 hover:bg-slate-800"
            onConfirm={handleConfirmStaffPayout}
            onClose={() => setPayoutModalData(null)}
            loading={submittingPayout}
          />
        )}
      </Modal>
    </div>
  );
}