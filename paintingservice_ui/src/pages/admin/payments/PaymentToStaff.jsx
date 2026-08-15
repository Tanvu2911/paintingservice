import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Modal from "../../../components/common/Modal";
import QRCodePayment from "../../../components/common/QRCodePayment";
import DepositVerificationModal from "../../../components/payment/DepositVerificationModal";
import DepositCountdownBadge from "../../../components/payment/DepositCountdownBadge";
import { formatMoney } from "../../../util/formatters";

export default function PaymentToStaff() {
  const { user, showToast } = useOutletContext();

  const [activeTab, setActiveTab] = useState("customer_approvals"); // 'customer_approvals' | 'staff_payouts'
  const [loading, setLoading] = useState(true);

  // Dữ liệu duyệt khách hàng
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPaymentToVerify, setSelectedPaymentToVerify] = useState(null);
  const [submittingConfirm, setSubmittingConfirm] = useState(false);

  // Dữ liệu thanh toán nhân viên
  const [orders, setOrders] = useState([]);
  const [salaryHistories, setSalaryHistories] = useState([]);
  const [payoutModalData, setPayoutModalData] = useState(null);
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, pendingRes, salaryRes] = await Promise.all([
        AxiosConfig.get("/bookings"),
        AxiosConfig.get("/payments/pending").catch(() => ({ data: [] })),
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
          ].includes(o.status) || o.paymentStatus === "FULLY_PAID"
        )
      );

      setPendingPayments(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setSalaryHistories(Array.isArray(salaryRes.data) ? salaryRes.data : []);
    } catch {
      showToast?.("Không tải được dữ liệu thanh toán", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Duyệt thanh toán của Khách
  const handleConfirmCustomerPayment = async (paymentId) => {
    try {
      setSubmittingConfirm(true);
      const res = await AxiosConfig.post(`/payments/${paymentId}/confirm`);
      showToast?.(res.data?.message || "Đã xác nhận thanh toán thành công", "success");
      setSelectedPaymentToVerify(null);
      loadData();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi duyệt thanh toán", "error");
    } finally {
      setSubmittingConfirm(false);
    }
  };

  // 1.2 Gia hạn thêm 24h
  const handleExtendDeadline = async (bookingId, reason) => {
    try {
      await AxiosConfig.post(`/payments/extend-deposit-deadline/${bookingId}`, {
        hours: 24,
        reason: reason || "Admin gia hạn thêm 24h",
      });
      showToast?.(`Đã gia hạn thêm +24 giờ cho đơn hàng #${bookingId}`, "success");
      setSelectedPaymentToVerify(null);
      loadData();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Lỗi khi gia hạn thời gian",
        "error"
      );
    }
  };

  // 1.3 Từ chối giao dịch
  const handleRejectPayment = async (paymentId) => {
    if (!window.confirm("Xác nhận từ chối giao dịch này do chưa nhận được tiền?")) return;
    try {
      setSubmittingConfirm(true);
      await AxiosConfig.post(`/payments/${paymentId}/reject`, {
        reason: "Admin chưa nhận được tiền vào tài khoản ngân hàng",
      });
      showToast?.("Đã từ chối giao dịch thanh toán");
      setSelectedPaymentToVerify(null);
      loadData();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi từ chối", "error");
    } finally {
      setSubmittingConfirm(false);
    }
  };

  // 2. Admin quét QR trả thù lao nhân viên
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
        res.data?.message || `Đã thanh toán thù lao cho ${payoutModalData.staffName}`,
        "success"
      );
      setPayoutModalData(null);
      loadData();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi xác nhận trả tiền", "error");
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
    <div>
      <DashboardHeader
        title="Quản Lý Thanh Toán & Quyết Toán"
        subtitle="Duyệt thanh toán cọc/tất toán từ khách hàng và chi trả thù lao qua VietQR cho nhân viên."
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("customer_approvals")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${activeTab === "customer_approvals"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <span>📥 Duyệt thanh toán &amp; Cọc từ Khách</span>
          {pendingPayments.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingPayments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("staff_payouts")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${activeTab === "staff_payouts"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <span>📤 Thanh toán thù lao cho Nhân viên</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : activeTab === "customer_approvals" ? (
        /* TAB 1: DUYỆT THANH TOÁN TỪ KHÁCH HÀNG */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Danh sách giao dịch khách đã chuyển cọc / tất toán chờ duyệt
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chỉ khi Admin xác nhận nhận đủ tiền cọc thì đơn hàng mới được phép gán cho Đội thi công.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              🔄 Làm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-4 px-6">Mã GD / Đơn</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6">Loại thanh toán</th>
                  <th className="py-4 px-6">Số tiền</th>
                  <th className="py-4 px-6">Thời hạn cọc (24h)</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pendingPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      Không có giao dịch nào đang chờ duyệt ✓
                    </td>
                  </tr>
                ) : (
                  pendingPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6">
                        <div className="font-bold text-blue-600">#{p.bookingId}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {p.transactionCode || `TX-${p.id}`}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {p.booking?.customerName || p.booking?.customer?.username || "Khách hàng"}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.paymentType === "DEPOSIT"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                        >
                          {p.paymentType === "DEPOSIT"
                            ? "Tiền cọc (30%)"
                            : "Tất toán hoàn thành"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-black text-rose-600">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="py-4 px-6">
                        {p.paymentType === "DEPOSIT" ? (
                          <DepositCountdownBadge
                            signedAt={booking.depositRequestedAt || booking.createdAt || booking.appointmentDate}
                            deadline={booking.depositDeadline}
                            isDepositPaid={
                              booking.depositPaid ||
                              booking.paymentStatus === "DEPOSIT_PAID" ||
                              booking.paymentStatus === "FULLY_PAID"
                            }
                            isCancelled={booking.status === "CANCELLED"}
                          />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                          ⏳ Chờ Admin duyệt
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentToVerify(p)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                        >
                          👁️ Xem bill &amp; Duyệt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: THANH TOÁN CHO NHÂN VIÊN */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Các đơn hàng hoàn thành – Quét VietQR chi trả thù lao cho Giám sát và Đội thợ
            </span>
            <button
              type="button"
              onClick={loadData}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              🔄 Làm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-4 px-6">Mã đơn</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6">Giá trị đơn</th>
                  <th className="py-4 px-6">Giám sát &amp; Thù lao</th>
                  <th className="py-4 px-6">Đội thợ &amp; Thù lao</th>
                  <th className="py-4 px-6">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      Không có đơn nào cần quyết toán thù lao
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const total = Number(o.totalAmount) || 0;
                    const surveyFee =
                      Number(o.surveyFee) > 0 ? Number(o.surveyFee) : 50000;
                    const techFee = Math.max(0, total - surveyFee) || total * 0.7;

                    const surveyor = o.surveyor || (o.surveyorId ? { id: o.surveyorId, username: o.surveyorName } : null);
                    const technician = o.technician || (o.technicianId ? { id: o.technicianId, username: o.technicianName } : null) ||
                      (o.preferredTechnicianId ? { id: o.preferredTechnicianId, username: o.preferredTechnicianName } : null);

                    const surveyorSalary = surveyor
                      ? getStaffSalaryInfo(o.id, surveyor.id, "SURVEYOR", surveyFee)
                      : null;
                    const techSalary = technician
                      ? getStaffSalaryInfo(o.id, technician.id, "TECHNICIAN", techFee)
                      : null;

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-bold text-slate-800">
                          #{o.id}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-700">
                          {o.customerName || o.customer?.username || "—"}
                        </td>
                        <td className="py-4 px-6 font-bold text-blue-600">
                          {formatMoney(total)}
                        </td>

                        {/* Cột Giám sát */}
                        <td className="py-4 px-6">
                          {surveyor ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">
                                {surveyor.fullName || surveyor.username}
                              </p>
                              <p className="text-xs text-rose-600 font-bold">
                                {formatMoney(surveyorSalary?.amount || surveyFee)}
                              </p>
                              {surveyorSalary?.isPaid ? (
                                <span className="inline-block text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                  ✓ Đã chi trả
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenStaffPayoutQR(
                                      o,
                                      surveyor,
                                      "SURVEYOR",
                                      surveyorSalary?.amount || surveyFee
                                    )
                                  }
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition"
                                >
                                  📱 Quét QR trả GS
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Chưa có</span>
                          )}
                        </td>

                        {/* Cột Đội thợ */}
                        <td className="py-4 px-6">
                          {technician ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">
                                {technician.fullName || technician.username}
                              </p>
                              <p className="text-xs text-rose-600 font-bold">
                                {formatMoney(techSalary?.amount || techFee)}
                              </p>
                              {techSalary?.isPaid ? (
                                <span className="inline-block text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                  ✓ Đã chi trả
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenStaffPayoutQR(
                                      o,
                                      technician,
                                      "TECHNICIAN",
                                      techSalary?.amount || techFee
                                    )
                                  }
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition"
                                >
                                  📱 Quét QR trả Thợ
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Chưa có</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <StatusBadge status={o.status} />
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

      {/* MODAL 1: XEM BIÊN LAI, DUYỆT CỌC & GIA HẠN 24H */}
      <Modal
        isOpen={!!selectedPaymentToVerify}
        onClose={() => setSelectedPaymentToVerify(null)}
        title="Chi tiết biên lai & Xác nhận thanh toán"
        size="lg"
      >
        <DepositVerificationModal
          payment={selectedPaymentToVerify}
          onClose={() => setSelectedPaymentToVerify(null)}
          onConfirmDeposit={handleConfirmCustomerPayment}
          onExtendDeadline={handleExtendDeadline}
          onReject={handleRejectPayment}
          loading={submittingConfirm}
        />
      </Modal>

      {/* MODAL 2: ADMIN QUÉT QR TRẢ LƯƠNG NHÂN VIÊN */}
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
            accountNo={payoutModalData.staffPhone || "0987654321"}
            accountName={payoutModalData.staffName}
            addInfo={`LUONG DH${payoutModalData.orderId} ${payoutModalData.role === "SURVEYOR" ? "GS" : "THO"
              }`}
            title={`Quét mã QR trả thù lao cho ${payoutModalData.staffName}`}
            subTitle={`Thù lao vị trí: ${payoutModalData.role === "SURVEYOR" ? "Giám sát viên" : "Đội thợ thi công"
              }`}
            note="* Quét mã QR trên app ngân hàng của Admin để chuyển thù lao trực tiếp. Sau khi chuyển xong, bấm nút xác nhận bên dưới."
            confirmText={`Xác nhận đã chuyển ${formatMoney(payoutModalData.amount)}`}
            confirmColor="bg-emerald-600 hover:bg-emerald-700"
            onConfirm={handleConfirmStaffPayout}
            onClose={() => setPayoutModalData(null)}
            loading={submittingPayout}
          />
        )}
      </Modal>
    </div>
  );
}